# Portfolio and interview notes

## A 30-second introduction

DataScope is a data analytics project for exploring job adverts for UK data roles.
It uses Python to validate and classify records, DuckDB and SQL to store and
analyse dated observations, and a browser dashboard to compare roles, skills,
locations and advertised salaries. The current demo uses labelled synthetic data.
The main focus is a transparent, reproducible data workflow with quality checks.

## A practical two-minute demonstration

1. Open Market overview and point out the demonstration-data label.
2. Select Data Analyst and Entry level. Explain that every page shares these filters.
3. Open Opportunities, search for SQL, and export all matching results to CSV.
4. Open Skill landscape and explain why skill percentages can exceed 100%.
5. Open Salary intelligence. Explain the median of advertised range midpoints,
   salary coverage and why contract day rates are excluded.
6. Open Data quality and show source provenance, missing information and run counts.
7. Open How it works, then show one SQL report and the retained test files.

These are demonstrations of application behaviour, not claims of actual demand
or pay patterns in the UK labour market.

## CV wording

**DataScope — UK Data Jobs Analytics | Python, SQL, DuckDB, JavaScript**

- Developed an AI-assisted job-advert analytics project with a validated Python
  pipeline, daily DuckDB snapshots and SQL reports; added deduplication,
  explicit skill/title rules and data-quality reporting.
- Created a six-page dashboard with shared filters, salary comparability rules,
  skill co-occurrence analysis and CSV export; verified behaviour with 29
  automated pipeline, calculation and browser tests.

Add a live link after public deployment. Explain your own learning and changes
accurately. Do not attach invented savings, real-vacancy counts or forecasting
accuracy to the synthetic demonstration.

## Questions to be ready for

- Why choose DuckDB for this project rather than a separately hosted database?
- How does one advert appearing on multiple days differ from several vacancies?
- What happens when a CSV row has a bad date or a reversed salary range?
- Why use the median of range midpoints, and what information does it lose?
- Why not convert contract day rates to annual salaries automatically?
- How can missing salaries or a limited API sample bias the results?
- Why are title and skill rules transparent keywords rather than an ML model?
- What is the difference between first observed and newly posted?
- What data reaches the browser, and where do API credentials stay?
- What does a passing automated accessibility check establish, and what does it miss?

## A useful next improvement

Import a permitted real dataset, verify the source and sampling method, and write
three findings that can be reproduced with the SQL reports. Document what is
missing before interpreting the results. That would add empirical analytical
evidence to the existing implementation evidence.
