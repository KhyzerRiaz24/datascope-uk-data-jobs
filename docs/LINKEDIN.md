# LinkedIn project material

For a plain-text version of the post, open `linkedin-post.txt` in this folder.
It omits unverified source/demo links and can be copied without the guide headings.

## Suggested post

I've been working on DataScope, a portfolio project that brings together the
parts of data work I want to demonstrate: cleaning records, querying them with
SQL, checking their quality and presenting the results clearly.

The project explores job adverts for UK data roles. Python validates and
classifies the records, DuckDB stores observations by date, and a six-page
dashboard lets users compare role families, skill combinations, locations,
working arrangements and advertised salary ranges.

Some of the decisions behind the dashboard:

- Count each advert once per observation date.
- Keep contract day rates separate from annual permanent salaries.
- Show missing-data coverage and small salary samples.
- Keep hybrid and fully remote roles separate.
- Explain the calculations and how every page connects to the data.

The current demo uses clearly labelled synthetic data. It demonstrates the
workflow; it isn't a report on today's UK labour market. CSV import and an
optional Adzuna connector are included for working with real source data.

The project has 29 passing automated tests, covering the Python pipeline,
calculations, browser interactions and accessibility checks. I used AI-assisted
implementation and documented the rules, tradeoffs and tests so the work can
be inspected and reproduced.

I'm looking for opportunities in data analytics and would welcome feedback on
the project and the decisions behind it.

Explore the code: https://github.com/KhyzerRiaz24/datascope-uk-data-jobs

#DataAnalytics #Python #SQL #DataEngineering #PortfolioProject

## Project links

The public source repository is
https://github.com/KhyzerRiaz24/datascope-uk-data-jobs. The post includes this link.
The existing Sites preview is private. Add a public demo link only after an
actual GitHub Pages deployment has been verified; do not use the private preview
as a public recruiter link.

## LinkedIn Projects entry

**Project name:** DataScope — UK Data Jobs Intelligence

**Description:**

Developed an AI-assisted data analytics portfolio project using Python, SQL and
DuckDB, with a six-page JavaScript dashboard. Implemented input validation,
daily observation storage, deduplication, skill extraction, comparable salary
summaries, CSV export and data-quality reporting. Added 29 automated tests and
documentation explaining the implementation and analytical limits. The current
demonstration uses synthetic data; real-data import and optional API collection
are supported.

**Project URL:** https://github.com/KhyzerRiaz24/datascope-uk-data-jobs

**Skills to associate:** Python, SQL, DuckDB, Data Cleaning, Data Analysis,
Data Visualisation, ETL, JavaScript, Automated Testing, GitHub Actions.

Do not list Power BI, machine-learning training or live labour-market research
as implemented features of this version.

## Attachments, in order

1. `docs/images/overview-desktop.png` — the main dashboard and its sample-data label.
2. `docs/images/skills-desktop.png` — skill mentions and combinations.
3. `docs/images/salary-desktop.png` — salary coverage and comparable groups.
4. `docs/images/quality-desktop.png` — the data-quality explanation.

Use two or three images if a shorter post feels better. Keep the demonstration
label visible rather than cropping the screenshots to imply live data.

## Optional short first comment after the links are live

The repository includes a simple explanation, a file-by-file walkthrough, SQL
reports and a validation record. The public demonstration uses synthetic data;
the same pipeline can import a permitted real dataset.
