"""Turn CSV/API records into consistent job observations.

Used by demo.py and cli.py before storage.py. Rules are deliberately explicit
and inspectable: keyword classification is not a trained machine-learning model.
"""
from __future__ import annotations

from datetime import date
import hashlib
import html
import math
import re


SKILLS = {
    "SQL": r"\bsql\b|\bpostgres(?:ql)?\b|\bmysql\b",
    "Python": r"\bpython\b",
    "Excel": r"\bexcel\b",
    "Power BI": r"\bpower\s*bi\b|\bpowerbi\b",
    "Tableau": r"\btableau\b",
    "R": r"(?<![\w])R(?![\w])|\brstudio\b|\btidyverse\b",
    "dbt": r"\bdbt\b",
    "Snowflake": r"\bsnowflake\b",
    "AWS": r"\baws\b|amazon web services",
    "Azure": r"\bazure\b",
    "Spark": r"\b(?:py)?spark\b",
    "Airflow": r"\bairflow\b",
    "Statistics": r"\bstatistic(?:s|al)\b|\ba/b test(?:ing)?\b",
    "Machine learning": r"\bmachine learning\b|\bscikit-learn\b",
}


def plain(value: object) -> str:
    """Strip markup before matching and before exporting text into the UI."""
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]*>", " ", str(value or "")))).strip()


def iso_date(value: object) -> str:
    try:
        text = str(value)
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
            raise ValueError("Invalid date format")
        return date.fromisoformat(text).isoformat()
    except ValueError as exc:
        raise ValueError("Dates must use YYYY-MM-DD format.") from exc


def role_for(title: str) -> str | None:
    # Match on title, not description: a developer mentioning analytics is not an analyst.
    text = title.lower()
    if re.search(r"\b(?:data|analytics)\s+engineer\b", text):
        return "Data Engineer"
    if re.search(r"\bdata\s+scientist\b", text):
        return "Data Scientist"
    if re.search(r"\bbi\s+(?:analyst|developer)\b|business intelligence|power\s*bi\s+(?:analyst|developer)", text):
        return "BI Analyst"
    if re.search(r"\bdata\s+analyst\b|\banalytics\s+analyst\b", text):
        return "Data Analyst"
    return None


def seniority_for(title: str) -> str:
    # Senior takes precedence for titles such as "Senior analyst, graduate programme".
    if re.search(r"\b(senior|sr|lead|principal|head|director|manager|staff)\b", title, re.I):
        return "Senior / Lead"
    if re.search(r"\b(junior|jr|graduate|trainee|intern|apprentice|entry[ -]level)\b", title, re.I):
        return "Entry level"
    if re.search(r"\b(mid[ -]level|intermediate)\b", title, re.I):
        return "Mid level"
    return "Unspecified"


def working_for(text: str) -> str:
    # Hybrid wins when "hybrid with remote working" appears; negations are handled first.
    text = text.lower()
    text = re.sub(r"\b(?:not|no)\s+(?:fully\s+)?remote(?:\s+working)?\b", " onsite ", text)
    if re.search(r"\bhybrid\b", text):
        return "Hybrid"
    if re.search(r"\bremote\b|\bwork(?:ing)? from home\b|\bwfh\b", text):
        return "Remote"
    if re.search(r"\bon[ -]?site\b|office[ -]based", text):
        return "On site"
    return "Unspecified"


def positive_number(value: object) -> float | None:
    if value in (None, ""):
        return None
    try:
        number = float(str(value).replace(",", "").replace("£", "").strip())
    except (ValueError, TypeError) as exc:
        raise ValueError("Salary values must be numbers or blank.") from exc
    if not math.isfinite(number) or number <= 0:
        raise ValueError("Salary values must be finite positive numbers.")
    return number


def normalize(raw: dict, observed: str, source: str) -> dict | None:
    observed = iso_date(observed)
    title = plain(raw.get("title"))
    company = plain(raw.get("company")) or "Undisclosed employer"
    location = plain(raw.get("location")) or "Unspecified"
    if not title:
        raise ValueError("A job title is required.")
    role = role_for(title)
    if role is None:
        return None
    description = plain(raw.get("description"))
    low, high = positive_number(raw.get("salary_min")), positive_number(raw.get("salary_max"))
    if low is not None and high is not None and high < low:
        raise ValueError("Salary maximum must be at least the minimum.")
    unit = str(raw.get("salary_unit", "unknown")).lower().strip()
    contract = str(raw.get("contract_type", "unknown")).lower().strip()
    if unit not in {"annual", "daily", "hourly", "unknown"}:
        raise ValueError("salary_unit must be annual, daily, hourly or unknown.")
    if contract not in {"permanent", "contract", "unknown"}:
        raise ValueError("contract_type must be permanent, contract or unknown.")
    currency = str(raw.get("currency", "GBP")).upper().strip()
    predicted = str(raw.get("salary_is_predicted", "0")).lower() in {"1", "true", "yes"}
    url = str(raw.get("url", ""))
    if url and not re.match(r"^https?://[^\s]+$", url):
        raise ValueError("Job links must be http or https URLs.")
    posted = iso_date(raw.get("posted_at") or observed)
    if posted > observed:
        raise ValueError("A posting date cannot be later than its observation date.")
    raw_id = str(raw.get("id") or "").strip()
    # Provider IDs preserve separate adverts; absent IDs use a documented conservative fingerprint.
    identity = raw_id or "|".join([title.casefold(), company.casefold(), location.casefold(), posted])
    job_id = hashlib.sha256(f"{source}|{identity}".encode()).hexdigest()[:24]
    skills = [name for name, pattern in SKILLS.items()
              if re.search(pattern, title + " " + description, 0 if name == "R" else re.I)]
    eligible = (unit == "annual" and contract == "permanent" and currency == "GBP"
                and not predicted and low is not None and high is not None)
    return {
        "id": job_id, "title": title, "company": company, "location": location,
        "description": description, "role": role, "seniority": seniority_for(title),
        "working": working_for(title + " " + description), "skills": skills,
        "salary_min": low, "salary_max": high, "salary_unit": unit,
        "contract_type": contract, "currency": currency,
        "salary_is_predicted": predicted,
        "salary_mid": round((low + high) / 2, 2) if eligible else None,
        "posted_at": posted, "observed_at": observed, "source": source, "url": url,
    }
