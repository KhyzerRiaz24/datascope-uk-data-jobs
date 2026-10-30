"""Run the documented SQL reports against your local DuckDB database.

Run: .venv/bin/python scripts/query.py --db data/demo.duckdb.
This is deliberately separate from the browser so you can learn and inspect SQL.
"""
import argparse
from pathlib import Path
import duckdb

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--db',type=Path,default=Path('data/demo.duckdb'))
args=parser.parse_args()
with duckdb.connect(str(args.db),read_only=True) as db:
    for index,query in enumerate(Path('sql/analysis.sql').read_text().split(';'),1):
        if not query.strip():
            continue
        cursor=db.execute(query)
        print(f'\nReport {index}')
        print(' | '.join(column[0] for column in cursor.description))
        for row in cursor.fetchall():
            print(' | '.join(str(value) for value in row))
