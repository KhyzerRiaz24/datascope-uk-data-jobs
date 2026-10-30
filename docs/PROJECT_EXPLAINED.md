# DataScope, in simple terms

## What is it?

DataScope is a dashboard for exploring a collection of job adverts for UK data
roles. Think of it as a well-organised spreadsheet with a repeatable cleaning
process behind it and an easier way to compare the results.

It helps a user explore questions such as:

- How many adverts in this collection match the kind of role I want?
- Which skills are mentioned most often, and which appear together?
- Which locations and working arrangements appear in the collected adverts?
- What salary ranges are advertised for similar permanent jobs?
- How much of the data is missing, uncertain or excluded from a calculation?

**The current version displays fictional sample adverts.** You can use it to
demonstrate that the system works. You cannot use those sample numbers to say
what employers are actually hiring for today.

## How does it work?

1. **Get some adverts.** Python can read a CSV file. An optional connector can
   collect adverts from the Adzuna UK API when you supply your own credentials.
   The included demo creates fictional records so the app works immediately.
2. **Tidy the data.** The project checks dates and salary values, removes repeat
   records for the same job on the same day, and identifies role families and
   skills using readable rules.
3. **Store it.** DuckDB is a database kept in a local file. It saves observations
   by date, so one job can be seen on several days without being counted as
   several current jobs. SQL queries let you inspect and summarise those records.
4. **Give the dashboard a copy.** Python exports a JSON file: a structured file
   the browser can read. The database and API credentials stay outside the browser.
5. **Explore it.** The website filters the exported records and calculates the
   counts, charts and salary summaries you see.

## What does each page show?

### Market overview

The summary: observed job adverts, comparable salary ranges, explicit entry-level
roles, fully remote roles and changes in the collected sample over time.

### Opportunities

The individual adverts behind the summary. You can search for a title, employer
or skill, sort the results and download all matching records as a CSV. This is
where you check what an individual row actually contains.

### Skill landscape

How often each tracked skill appears and which pairs appear in the same advert.
One advert can mention several skills, so the skill percentages do not have to
add up to 100%.

### Salary intelligence

Salary comparisons for permanent jobs with both annual GBP bounds disclosed.
A £30,000–£40,000 advert has a midpoint of £35,000. The dashboard finds the middle
of those midpoints across comparable records. Daily contract rates and predicted
salaries are excluded from that comparison.

### Data quality

The source, dates, missing information and record-processing history. It helps
you judge whether the figures have enough support to be useful.

### How it works

The explanation page inside the product. It maps the files, data journey and
analytical decisions. Source comments in each page file explain its connections.

## What do the shared filters do?

Choose a role, seniority, location, working style or observation date. The pages
then use the same selection. For example, choosing Entry level and Data Analyst
lets you explore only the sample adverts classified that way.

Changing a filter can change both a count and its denominator. A percentage on
the screen refers to the current filtered sample, not every job in the UK.

## What can this show a recruiter?

It provides inspectable examples of Python data processing, SQL analysis,
database design, data-quality checks, descriptive statistics, visualisation and
automated testing. You can explain a decision, show its code and demonstrate
how it affects the output.

It does not currently prove market coverage, business savings, hiring outcomes,
forecasting accuracy or machine-learning performance. Those claims would need
different evidence.

## A simple way to introduce it

"DataScope is a data analytics project for exploring UK data-role adverts.
Python cleans and classifies the records, DuckDB stores dated observations,
and a dashboard lets users compare skills, locations and advertised salary
ranges. The current demo uses clearly labelled synthetic data. I can also
import permitted real data through the same pipeline."

To learn the implementation, read WALKTHROUGH.md next, then reproduce one of
the SQL reports in sql/analysis.sql.
