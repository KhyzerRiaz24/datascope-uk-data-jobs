# What was checked

Checks completed locally on 30 October 2026:

- 15 Python tests covering normalisation, salary eligibility, title rules,
  deduplication, repeat runs, separate dataset modes, CSV-to-database-to-JSON
  integration, provider pagination, retries, malformed responses and safe errors.
- 7 JavaScript tests covering medians/quartiles, snapshot filters, salary
  eligibility, skill counts, historical dates, first observations and CSV safety.
- 7 browser tests covering all six pages, shared filters, independently calculated
  salary values, search, pagination, full CSV downloads, empty results, historical
  snapshots, failure states and desktop/mobile viewport containment.
- The browser suite also checks all six pages for serious or critical automated
  accessibility violations. Text contrast and inline link styling were improved
  after the first audit, then checked again.
- All four SQL reports executed successfully against the generated demo database.
- The desktop and mobile overview screenshots were visually inspected.

The tests are retained in `tests/` and the continuous-integration workflow runs
them. These checks reduce errors; they do not guarantee that all possible inputs,
devices or accessibility needs are covered.

## Limits of verification

The Adzuna adapter was tested with controlled responses. Live credentials,
provider quota, real API results, GitHub repository secrets and scheduled workflow
execution were not available for a live end-to-end check. No live collection or
enabled daily automation is claimed. Automatic hosting updates are not configured.

The included dataset is synthetic. The website is a working demonstration, not
an empirical study of UK vacancies. A real portfolio findings report needs a
permitted real dataset, a source/coverage description and analysis you can defend.
