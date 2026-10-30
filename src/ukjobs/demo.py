"""Generate reproducible, explicitly synthetic observations for an offline demo.

No companies, vacancies or market findings here are claimed to be real.
cli.py passes these records through the SAME normaliser and database as CSV/API data.
"""
from datetime import date, timedelta
import random


def demo_days():
    rng = random.Random(31415)
    end = date(2026, 10, 30)
    start = end - timedelta(days=27)
    roles = ["Data Analyst", "BI Analyst", "Data Engineer", "Data Scientist"]
    cities = ["London", "Manchester", "Birmingham", "Leeds", "Bristol", "Edinburgh"]
    employers = ["Northstar Demo", "Juniper Example", "Sample Harbour", "Example Atlas", "Demo Finch", "Cedar Sample"]
    skill_sets = {
        "Data Analyst": ["SQL", "Excel", "Python", "Power BI", "Tableau", "Statistics", "R"],
        "BI Analyst": ["SQL", "Power BI", "Excel", "Tableau", "Snowflake", "Azure"],
        "Data Engineer": ["Python", "SQL", "dbt", "AWS", "Azure", "Spark", "Airflow", "Snowflake"],
        "Data Scientist": ["Python", "SQL", "Machine learning", "Statistics", "R", "AWS", "Spark"],
    }
    jobs = []
    for i in range(360):
        role = rng.choices(roles, weights=[42, 21, 24, 13])[0]
        city = rng.choices(cities, weights=[38, 18, 11, 12, 11, 10])[0]
        seniority = rng.choices(["Junior ", "", "Senior ", "Mid-level "], weights=[28, 34, 28, 10])[0]
        work = rng.choices(["hybrid", "remote", "on-site", ""], weights=[49, 24, 22, 5])[0]
        contract = rng.random() < .14
        base = {"Data Analyst": 35000, "BI Analyst": 40000, "Data Engineer": 53000, "Data Scientist": 51000}[role]
        base += (15000 if seniority == "Senior " else -9000 if seniority == "Junior " else 0)
        base += 9000 if city == "London" else 0
        base += rng.randrange(-3000, 6000, 1000)
        low, high = (350, 550) if contract else (base, base + rng.choice([5000, 10000, 15000]))
        if rng.random() < .21:
            low = high = None
        selected = rng.sample(skill_sets[role], rng.randint(2, min(5, len(skill_sets[role]))))
        born = rng.randrange(-8, 26)
        lifetime = rng.randrange(12, 42)
        jobs.append((born, lifetime, {
            "id": f"demo-{i:04}", "title": seniority + role,
            "company": employers[i % len(employers)] + f" {i % 17 + 1}",
            "location": city, "description": f"Synthetic demonstration vacancy. {work}. Skills: " + ", ".join(selected),
            "salary_min": low, "salary_max": high,
            "salary_unit": "daily" if contract else "annual",
            "contract_type": "contract" if contract else "permanent",
            "currency": "GBP", "posted_at": str(start + timedelta(days=born)),
        }))
    for day in range(28):
        observed = start + timedelta(days=day)
        yield str(observed), [record.copy() for born, lifetime, record in jobs if born <= day < born + lifetime]
