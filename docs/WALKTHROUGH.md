# A guided tour of DataScope

This guide explains what every page does and how its data reaches it. You do not
need to understand every file at once. Start by opening the website and changing
one filter, then follow the paths below.

## 1. The simplest way to understand the application

There are two separate processes:

1. **The Python pipeline prepares data.** It reads records, checks them, writes
   them into a local database and creates a JSON file.
2. **The website explores that JSON file.** It does not call a live API or run
   Python in your browser. It recalculates charts when you change filters.

The file connecting them is `web/data.json`. Re-running the pipeline replaces
that file. Refreshing the website loads the new version. This design keeps API
credentials out of the browser and makes the demonstration inexpensive to host.

## 2. Start at the front door

`web/index.html` defines the sidebar, shared filter area, page area and footer.
It loads `web/app.js`.

`app.js` fetches `data.json`, remembers the selected filters and watches the URL
fragment. For example, `#skills` selects the skills page. Browser back/forward
navigation works because those fragments are ordinary browser history entries.

Before rendering any page, `app.js` calls `snapshot()` in `analytics.js`. That
function selects the requested observation date, applies the shared filters and
returns one row for each distinct job ID.

Each page receives the same three things:

- `dataset`: the complete exported history and pipeline logs;
- `filters`: the selected role, level, location, working style and date;
- `rows`: the filtered distinct jobs on that date.

The page generates its content. Shared formatting and chart helpers come from
`ui.js`; colours, spacing and mobile layouts come from `styles.css`.

## 3. Market overview: `web/pages/overview.js`

This is the landing page. Its first number is the count of filtered rows. It
calculates the median salary from comparable salary ranges and counts explicit
entry-level titles and fully remote adverts separately.

The time-series chart calls `trends()` to repeat the same filters for every
available observation date in the preceding 28 calendar days. If a collection
date is missing, that date is not silently presented as zero demand.

The skills chart links to `#skills`. The opportunity button and location panel
link to `#jobs`. Changing pages retains the current filters.

Try it: select **Entry level**, then compare the skills and median salary with
the unfiltered view. These demonstration changes illustrate the interface, not
actual market behaviour.

## 4. Opportunities: `web/pages/jobs.js`

This page starts with the shared filtered rows, then applies its own text search
and sorting. Search looks at the title, employer, location and extracted skills.
The table displays 12 rows per page.

Export CSV downloads **all matching search results**, including pages you have
not clicked through. Salary unit, currency and contract type are exported so
you can inspect the data properly in Excel or Power BI. Text starting like a
spreadsheet formula is neutralised by `csvText()` in `analytics.js`.

Real source links open in a new tab. Synthetic records do not invent live job
links. Search and sorting are separate from global filters.

Try it: search for **SQL Python**, then export and count the records. The CSV
row count should match the result count above the table, excluding its header.

## 5. Skill landscape: `web/pages/skills.js`

`skillCounts()` counts each distinct skill once per job. A job can mention
several skills, so the percentages can sum to more than 100%.

`skillPairs()` enumerates unique pairs inside each advert. If the same advert
mentions SQL and Python, that pair gains one count. A frequently co-mentioned
pair does not prove that learning the pair will cause a salary increase.

The keyword rules live in `src/ukjobs/normalize.py`, inside `SKILLS`. To add a
new skill, add a readable pattern there, add a test, and regenerate the data.
Do not add an unexplained number directly to a chart.

## 6. Salary intelligence: `web/pages/salary.js`

`salaryRows()` includes only complete annual GBP ranges for permanent jobs,
excluding predicted salaries. Contract day rates are kept as day rates and are
not silently multiplied by an assumed number of working days.

For a £30,000–£40,000 advert, the midpoint is £35,000. The main figure is the
median of the eligible adverts' midpoints. Quartiles describe the distribution
of those midpoints. They are not actual employee pay observations.

Groups with fewer than 10 qualifying records are marked as small samples.
Use the global location and seniority filters before comparing role families.

## 7. Data quality: `web/pages/quality.js`

This page connects visible charts to the pipeline run log. It shows the data
source, date, salary coverage, working arrangement coverage and classification
coverage. It also displays the latest eight runs up to the chosen date.

Run counts refer to complete imports. The quality percentages refer to your
filtered snapshot. An API collection with a page cap exposes its reported match
count and fetched count for each query, without adding overlapping searches
together as if they were unique vacancies.

Repeated imports appear as repeated pipeline runs, but the storage primary key
keeps one record per job per date. Logs are an audit trail, not a job count.

## 8. How it works: `web/pages/guide.js`

This is the public explanation of the project. It shows the architecture, page
map, metric definitions, limitations and inspiration link. Keep it accurate
when you make changes to the implementation.

## 9. Follow the Python side

`src/ukjobs/cli.py` selects a command:

- `demo`: generates reproducible fictional records over 28 observation dates;
- `import-csv`: reads a CSV and records rejected and out-of-scope rows;
- `fetch`: retrieves optional real data using your own Adzuna credentials;
- `export`: recreates the dashboard JSON from an existing database.

All inputs pass through `normalize.py`. It strips HTML, validates pay and dates,
classifies titles, identifies working arrangements and creates a stable ID.
`storage.py` writes accepted rows transactionally and exports a complete JSON
file using an atomic file replacement.

`provider.py` paginates real API requests, exposes sample caps, retries selected
temporary failures and stops on failed collection. Errors do not turn into zero
job days. Credentials are read from the environment; they are never exported.

## 10. Follow the database and SQL

`observations` has a composite primary key of `(job_id, observed_at)`. The same
advert can appear on different dates; duplicate results on one date collapse.

`pipeline_runs` records input, stored, rejected, filtered and duplicate counts.
`settings` records whether this database contains demo, imported or API data.
`job_observations` is a SQL view exposing ordinary analysis columns from the
stored JSON records.

Open `sql/analysis.sql`, then run `scripts/query.py`. Pick one SQL result and
compare it with the same unfiltered snapshot in the dashboard. This is a useful
way to understand and explain the calculations to an interviewer.

## 11. Suggested learning sequence

1. Run the demo and click every page.
2. Change one filter and explain which denominators changed.
3. Export a filtered CSV and recreate one calculation in a spreadsheet.
4. Run the SQL reports and explain why history rows are not current vacancies.
5. Read one normalisation test, then add a keyword rule with its own test.
6. Import a permitted real dataset and document its missing fields and coverage.
7. Write three findings supported by that dataset, including limitations.

Building with assistance is compatible with learning the project. For a CV,
describe your own contributions accurately and be ready to explain the rules,
tradeoffs and checks rather than memorising an impressive project description.
