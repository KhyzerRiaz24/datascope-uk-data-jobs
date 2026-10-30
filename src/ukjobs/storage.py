"""Persist daily snapshots and export the browser's read-only data contract.

normalize.py supplies records. This module writes them transactionally to DuckDB,
then exports JSON for web/app.js. Repeating a run updates each job/day exactly once.
"""
from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import tempfile
import uuid

import duckdb


SCHEMA = """
CREATE TABLE IF NOT EXISTS settings (key VARCHAR PRIMARY KEY, value VARCHAR);
CREATE TABLE IF NOT EXISTS observations (
  job_id VARCHAR, observed_at DATE, record JSON NOT NULL,
  PRIMARY KEY (job_id, observed_at)
);
CREATE TABLE IF NOT EXISTS pipeline_runs (
  run_id VARCHAR PRIMARY KEY, observed_at DATE, finished_at TIMESTAMPTZ,
  input_rows INTEGER, accepted_rows INTEGER, rejected_rows INTEGER,
  filtered_rows INTEGER, duplicate_rows INTEGER, metadata JSON
);
CREATE OR REPLACE VIEW job_observations AS
SELECT job_id, observed_at,
  record->>'title' AS title, record->>'company' AS company,
  record->>'location' AS location, record->>'role' AS role,
  record->>'seniority' AS seniority, record->>'working' AS working,
  CAST(record->>'salary_mid' AS DOUBLE) AS salary_mid,
  record->>'contract_type' AS contract_type,
  record->>'salary_unit' AS salary_unit,
  record->>'source' AS source, record->'skills' AS skills
FROM observations;
"""


@contextmanager
def connect(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    db = duckdb.connect(str(path))
    try:
        db.execute(SCHEMA)
        yield db
    finally:
        db.close()


def ingest(db_path: Path, rows: list[dict], observed: str, mode: str, report: dict) -> None:
    """Keep demo and imported/live datasets in different databases."""
    if mode not in {"demo", "imported", "adzuna"}:
        raise ValueError("Unknown dataset mode.")
    with connect(db_path) as db:
        previous = db.execute("SELECT value FROM settings WHERE key='mode'").fetchone()
        if previous and previous[0] != mode:
            raise ValueError("This database contains a different data source. Choose a fresh --db path.")
        unique = {row["id"]: row for row in rows}
        report = {**report, "duplicate_rows": len(rows) - len(unique)}
        db.execute("BEGIN TRANSACTION")
        try:
            db.execute("INSERT OR REPLACE INTO settings VALUES ('mode', ?)", [mode])
            for row in unique.values():
                db.execute("INSERT OR REPLACE INTO observations VALUES (?, ?, ?)",
                           [row["id"], observed, json.dumps(row, allow_nan=False)])
            db.execute("INSERT INTO pipeline_runs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
                str(uuid.uuid4()), observed, datetime.now(timezone.utc),
                report.get("input_rows", len(rows)), len(unique), report.get("rejected_rows", 0),
                report.get("filtered_rows", 0), report["duplicate_rows"], json.dumps(report),
            ])
            db.execute("COMMIT")
        except Exception:
            db.execute("ROLLBACK")
            raise


def export_dataset(db_path: Path, output: Path) -> dict:
    """Atomic replacement avoids a partially written dashboard during a refresh."""
    with connect(db_path) as db:
        mode = db.execute("SELECT value FROM settings WHERE key='mode'").fetchone()
        if not mode:
            raise ValueError("The database is empty. Run demo, import-csv or fetch first.")
        observations = [json.loads(r[0]) for r in db.execute(
            "SELECT record FROM observations ORDER BY observed_at, job_id").fetchall()]
        runs = []
        for row in db.execute("SELECT observed_at, input_rows, accepted_rows, rejected_rows, filtered_rows, duplicate_rows, metadata FROM pipeline_runs ORDER BY finished_at").fetchall():
            runs.append({"observed_at": str(row[0]), "input_rows": row[1], "accepted_rows": row[2],
                         "rejected_rows": row[3], "filtered_rows": row[4], "duplicate_rows": row[5],
                         "details": json.loads(row[6])})
        dates = sorted({r["observed_at"] for r in observations})
        dataset = {"schema_version": 1, "mode": mode[0],
                   "generated_at": datetime.now(timezone.utc).isoformat(),
                   "latest_date": dates[-1] if dates else None,
                   "dates": dates, "observations": observations, "runs": runs}
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=output.parent, delete=False) as file:
            temporary = Path(file.name)
            json.dump(dataset, file, ensure_ascii=False, allow_nan=False, separators=(",", ":"))
        os.replace(temporary, output)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()
    return dataset
