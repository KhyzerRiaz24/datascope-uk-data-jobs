# Using your own data

The included `web/data.json` is a **synthetic demonstration**. The application
does not need an account or credential to run that demonstration. The sample
CSV is also fictional and is provided only to teach the import format.

## CSV contract

Required headers: `title`, `company`, `location`, `description`, `posted_at`.
Use a UTF-8 CSV, optionally with a byte-order mark. Dates use YYYY-MM-DD.

Optional fields and defaults:

- `id`: stable source advert ID, strongly recommended;
- `salary_min`, `salary_max`: positive numbers or blank, without k suffixes;
- `salary_unit`: `annual`, `daily`, `hourly`, or `unknown` (the default);
- `contract_type`: `permanent`, `contract`, or `unknown` (the default);
- `currency`: defaults to `GBP` when the column is absent;
- `salary_is_predicted`: `1` / `true` / `yes` to exclude estimated pay;
- `url`: an http(s) source link, or blank.

Salary comparisons require both bounds and explicit annual/permanent labels.
Do not label daily rates annual just to populate the salary chart. Confirm your
CSV source's salary units and whether the figures are estimated before import.

```sh
PYTHONPATH=src .venv/bin/python -m ukjobs.cli import-csv \
  --csv /absolute/path/to/your/jobs.csv \
  --db data/my-import.duckdb --output web/data.json
```

The observation date defaults to today in UTC. For historical exports, pass the
actual collection date with `--observed YYYY-MM-DD`. Keep using the same database
to build history. Reimporting the same IDs on the same date updates that snapshot.

Location values are retained as supplied; the demonstration uses cities, whereas
provider locations may include a wider administrative area. Normalise your source
locations consistently before asserting city-level comparisons.

## Optional Adzuna UK adapter

The code follows the official [overview](https://developer.adzuna.com/overview)
and [search contract](https://developer.adzuna.com/docs/search). It uses
`https://api.adzuna.com/v1/api/jobs/gb/search/{page}`, four role queries, result
counts and pagination. Responses provide job-description snippets, not full text.

You must supply your own API access. No upstream credentials are reused and no
API account has been provisioned by this project. Review the provider's access
and redistribution terms before collecting or publishing records.

Set `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` using your environment or a secret manager,
then run:

```sh
PYTHONPATH=src .venv/bin/python -m ukjobs.cli fetch \
  --pages 3 --db data/adzuna.duckdb --output web/data.json
```

The app does not load `.env` automatically; `.env.example` simply documents the
variable names. Never paste credentials into source files, the dashboard, a CSV,
or Git. A successful mocked provider test verifies request-handling logic but
does not verify a live API account's credentials, quota or current access.

Predicted salaries are excluded. Unknown prediction flags from the API default
to estimated, preserving the conservative comparison rule. Contract salaries are
kept out of permanent salary comparisons regardless of their annualised values.

Page caps are explicit. At three pages per query, the intended maximum is 12
requests before retries, with at most 600 returned rows before overlapping
queries and title filtering. This is an observed sample, not complete coverage.
Rate limits and request behaviour still depend on the provider account.

## GitHub refresh workflow

After putting this project in a GitHub repository:

1. Add repository secrets `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`.
2. Run **Refresh job data** manually from the Actions tab first.
3. Inspect the output artifact and Data quality page.
4. To opt into the daily schedule, add repository variable
   `ENABLE_DAILY_REFRESH` with the exact value `true`.

The schedule is 08:00 UTC. That is 08:00 in London during GMT and 09:00 during BST.
GitHub may delay scheduled execution, and repository settings can disable it.
The workflow restores the latest unexpired `datascope-history` artifact, adds a
snapshot, then uploads `data/live.duckdb` and `web/data.json`.

Artifacts are retained for 30 days. If history expires or is deleted, the next
run starts a new history and reports that fact. Keep independent database backups
if you want a durable longitudinal dataset. No cloud database or paid hosting
service is required by the local project.

The workflow creates data artifacts; it does not change the hosted Sites version.
Download the new JSON, replace the local `web/data.json`, inspect it, and publish
the updated static site when ready. Automated hosting synchronisation is not
enabled in this version.
