# Metric definitions and analytical limits

## Unit of analysis

The unit is an **observed advertisement**, identified by source plus provider ID.
Without an ID, CSV rows use a hash of source, title, employer, location and
posting date. That fallback can collapse identical adverts for multiple posts;
use stable source IDs whenever possible. Cross-provider deduplication is not
implemented and no employer-level vacancy count is inferred.

One job can have observations on many dates. The current snapshot selects one
date and counts unique IDs. Historical observations are never added together
and described as current vacancies. A job absent from a later collection may
simply have moved outside the sample; its closure is not inferred.

## Salary comparisons

Include a record only when currency is GBP, unit is annual, contract is
permanent, both bounds are positive finite numbers, maximum >= minimum, and
`salary_is_predicted` is false. No annualisation of day/hourly rates is attempted.

The advert midpoint is `(salary_min + salary_max) / 2`. The reported median is
the median of eligible midpoints. Quartiles use linear interpolation at position
`(n - 1) * percentile`. The salary sample count and share are displayed. Groups
below 10 records are explicitly flagged.

These values describe advertised ranges, not realised pay. Missing salaries and
changes in role/seniority/location mix may bias comparisons. There are no claims
of a statistically significant premium or a causal return from learning a skill.

## Titles and working arrangements

Role family is a transparent title rule covering Data Analyst, BI Analyst,
Data Engineer/Analytics Engineer and Data Scientist. Other titles are filtered
out. It is a narrow scope, not a complete taxonomy of the UK labour market.

Seniority is explicit title evidence. Senior markers take precedence, followed
by junior/graduate markers and explicit mid-level markers. Everything else is
Unspecified. There is no assumption that an unlabelled role is mid level.

Hybrid takes precedence over remote where both occur. Simple "not remote" and
"no remote" phrases are handled. Remote and hybrid remain separate; unknown
working arrangements remain Unspecified. Keyword classification can still make
mistakes in nuanced prose, so inspect source adverts before acting on it.

## Skills

Each tracked skill is counted once per advert. Denominator: all filtered adverts,
including adverts with no tracked keywords. Skill pairs are unique unordered
pairs within an advert. Keywords inspect title plus description, not an inferred
skills model. Adzuna supplies shortened snippets, so omitted skills can cause
under-counting. Case-sensitive single-letter R avoids treating every letter r
as a programming language mention.

## Time and collection coverage

Dates are UTC observation dates. The trend uses up to 28 calendar days ending at
the selected date; unobserved dates are omitted. Lines join observed points and
do not imply that intervening missing dates were measured.

"First observed in the past 7 days" counts current snapshot adverts first seen
within that period in the stored history. It is not the count of newly created
jobs. The first collection necessarily treats already existing adverts as first
observed. Retained history length affects this measure.

The optional API adapter searches four role queries across the UK. Each page
requests 50 records; the page cap defaults to 3 per query. When reported matches
exceed fetched rows, coverage is marked as capped. Reported query totals overlap
and are never summed into a market-wide count.

## Validation and failure behaviour

Invalid structural rows, invalid dates, non-finite salaries, reversed ranges,
unknown salary-unit labels and unsafe URL schemes are rejected. CSV imports
record rejected row counts and continue when at least one in-scope row is valid.
Out-of-scope titles are tracked separately. Partial CSV acceptance is therefore
visible, rather than disguised as a complete successful import.

Live collection completes all queries before storage. A failed request or
malformed provider row aborts collection. No zero-demand snapshot is fabricated.
An empty live result also stops; the previous exported dataset remains available.
Export uses an atomic file replacement. Historical database changes already
committed before a later export failure remain available for retrying `export`.

Demo, CSV and Adzuna modes cannot share one database. No raw API key is saved in
the database, logs or browser export. Exported JSON does include advert text and
links, so only publish data that you are allowed to share.
