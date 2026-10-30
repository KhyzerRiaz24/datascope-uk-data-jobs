"""Command-line entry point: demo / import-csv / fetch / export.

Run from the project root: PYTHONPATH=src .venv/bin/python -m ukjobs.cli demo.
See docs/WALKTHROUGH.md for how each command reaches the dashboard pages.
"""
import argparse
import csv
from datetime import datetime, timezone
from pathlib import Path
import sys

from .demo import demo_days
from .normalize import normalize, iso_date
from .provider import collect, CollectionError
from .storage import ingest, export_dataset


def prepare(raw, observed, source):
    rows, errors, filtered = [], [], 0
    for index, record in enumerate(raw, 2):
        try:
            row = normalize(record, observed, source)
            if row:
                rows.append(row)
            else:
                filtered += 1
        except (ValueError, TypeError) as exc:
            errors.append(f"Row {index}: {exc}")
    return rows, {"input_rows": len(raw), "rejected_rows": len(errors), "filtered_rows": filtered, "errors": errors[:10]}


def main(argv=None):
    parser = argparse.ArgumentParser(description="DataScope UK data jobs pipeline")
    parser.add_argument("command", choices=["demo", "import-csv", "fetch", "export"])
    parser.add_argument("--db", type=Path)
    parser.add_argument("--output", type=Path, default=Path("web/data.json"))
    parser.add_argument("--csv", type=Path)
    parser.add_argument("--observed", default=datetime.now(timezone.utc).date().isoformat())
    parser.add_argument("--pages", type=int, default=3)
    args = parser.parse_args(argv)
    db = args.db or Path("data/demo.duckdb" if args.command == "demo" else "data/live.duckdb")
    try:
        observed = iso_date(args.observed)
        if args.command == "demo":
            for day, raw in demo_days():
                rows, report = prepare(raw, day, "synthetic")
                ingest(db, rows, day, "demo", report)
        elif args.command == "import-csv":
            if not args.csv:
                raise ValueError("Pass --csv followed by the file to import.")
            with args.csv.open(newline="", encoding="utf-8-sig") as file:
                reader = csv.DictReader(file)
                required = {"title", "company", "location", "description", "posted_at"}
                if not required.issubset(reader.fieldnames or []):
                    raise ValueError("CSV must contain: " + ", ".join(sorted(required)))
                raw = list(reader)
            rows, report = prepare(raw, observed, "csv")
            if not rows:
                raise ValueError("No valid in-scope jobs found. " + " ".join(report["errors"][:3]))
            ingest(db, rows, observed, "imported", report)
        elif args.command == "fetch":
            raw, metadata = collect(args.pages)
            rows, report = prepare(raw, observed, "adzuna")
            if report["rejected_rows"]:
                raise ValueError("Provider data failed validation; the previous dataset was preserved. " + " ".join(report["errors"][:3]))
            if not rows:
                raise ValueError("No in-scope jobs returned; the previous dataset was preserved.")
            ingest(db, rows, observed, "adzuna", {**report, **metadata})
        dataset = export_dataset(db, args.output)
        print(f"Exported {len(dataset['observations']):,} observations across {len(dataset['dates'])} days ({dataset['mode']}).")
        print(f"Dashboard data: {args.output}")
        return 0
    except (ValueError, OSError, CollectionError) as exc:
        print(f"Pipeline stopped: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
