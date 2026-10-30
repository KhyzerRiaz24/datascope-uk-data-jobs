-- Run with scripts/query.py. Each query uses the same salary eligibility and
-- snapshot definition as the dashboard. These are observed adverts, not totals.

-- 1. Distinct opportunities and comparable salaries in the latest observation.
SELECT role, COUNT(*) AS observed_adverts,
       COUNT(salary_mid) AS comparable_salaries,
       ROUND(MEDIAN(salary_mid)) AS median_annual_gbp_midpoint
FROM job_observations
WHERE observed_at = (SELECT MAX(observed_at) FROM job_observations)
GROUP BY role ORDER BY observed_adverts DESC;

-- 2. Entry-level share by location. Unspecified seniority stays in the denominator.
SELECT location, COUNT(*) AS observed_adverts,
       COUNT(*) FILTER (WHERE seniority = 'Entry level') AS entry_level,
       ROUND(100.0 * COUNT(*) FILTER (WHERE seniority = 'Entry level') / COUNT(*), 1) AS entry_share_pct
FROM job_observations
WHERE observed_at = (SELECT MAX(observed_at) FROM job_observations)
GROUP BY location ORDER BY observed_adverts DESC;

-- 3. Skills counted once per job. json_each expands the normalised skills array.
SELECT skill.value::VARCHAR AS skill, COUNT(DISTINCT j.job_id) AS adverts_mentioning
FROM job_observations j, json_each(j.skills) skill
WHERE observed_at = (SELECT MAX(observed_at) FROM job_observations)
GROUP BY skill.value ORDER BY adverts_mentioning DESC;

-- 4. Daily observed volume. Missing dates are absent rather than zero-filled.
SELECT observed_at, COUNT(DISTINCT job_id) AS distinct_adverts
FROM job_observations GROUP BY observed_at ORDER BY observed_at;
