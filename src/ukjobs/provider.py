"""Optional Adzuna UK adapter; credentials stay in the collection environment.

This module is never sent to the browser. cli.py calls collect(), then sends its
records through normalize.py. Official contract: developer.adzuna.com/docs/search.
Only snippets are supplied by Adzuna, so skill matches are lower-bound observations.
"""
import json
import os
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


QUERIES = ["data analyst", "business intelligence analyst", "data engineer", "data scientist"]


class CollectionError(RuntimeError):
    """Sanitised message; never includes credential-bearing URLs."""


def request_page(query, page, app_id, app_key, opener=urlopen, sleeper=time.sleep):
    params = urlencode({"app_id": app_id, "app_key": app_key, "what": query,
                        "results_per_page": 50, "sort_by": "date", "content-type": "application/json"})
    request = Request(f"https://api.adzuna.com/v1/api/jobs/gb/search/{page}?{params}",
                      headers={"Accept": "application/json", "User-Agent": "DataScope-Portfolio/1.0"})
    for attempt in range(3):
        try:
            with opener(request, timeout=25) as response:
                data = json.load(response)
            if not isinstance(data, dict) or not isinstance(data.get("results"), list):
                raise CollectionError("The data provider returned an unexpected response.")
            if not isinstance(data.get("count"), int) or data["count"] < 0:
                raise CollectionError("The provider response has no valid result count.")
            return data
        except HTTPError as exc:
            status = exc.code
            exc.close()
            if status not in {429, 500, 502, 503, 504}:
                raise CollectionError(f"Provider request failed (HTTP {status}); check credentials and access.") from None
        except (URLError, TimeoutError, OSError):
            pass
        except (ValueError, UnicodeError):
            raise CollectionError("The data provider returned invalid JSON.") from None
        if attempt < 2:
            sleeper(2 ** (attempt + 1))
    raise CollectionError("Collection failed after three attempts. The previous dataset was preserved.")


def collect(max_pages=3, opener=urlopen, sleeper=time.sleep):
    if not 1 <= max_pages <= 20:
        raise ValueError("Choose between 1 and 20 pages per query.")
    app_id, app_key = os.environ.get("ADZUNA_APP_ID"), os.environ.get("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        raise CollectionError("Set ADZUNA_APP_ID and ADZUNA_APP_KEY in the environment before live collection.")
    rows, coverage = [], []
    # Complete every query before the caller writes anything: errors cannot become zero-demand days.
    for query in QUERIES:
        fetched, total = 0, 0
        for page in range(1, max_pages + 1):
            data = request_page(query, page, app_id, app_key, opener, sleeper)
            total = data["count"]
            results = data["results"]
            for item in results:
                if not isinstance(item, dict) or not item.get("id"):
                    raise CollectionError("A provider record is missing a stable job ID.")
                if any(item.get(field) is not None and not isinstance(item[field], dict) for field in ("company", "location")):
                    raise CollectionError("A provider record has malformed company or location details.")
                # Adzuna search salaries are annualised. Contract salaries stay out of permanent comparisons.
                rows.append({"id": str(item["id"]), "title": item.get("title"),
                             "company": (item.get("company") or {}).get("display_name", ""),
                             "location": (item.get("location") or {}).get("display_name", ""),
                             "description": item.get("description", ""),
                             "salary_min": item.get("salary_min"), "salary_max": item.get("salary_max"),
                             "salary_unit": "annual", "contract_type": item.get("contract_type", "unknown"),
                             "salary_is_predicted": item.get("salary_is_predicted", "1"),
                             "currency": "GBP", "posted_at": item.get("created", "")[:10],
                             "url": item.get("redirect_url", "")})
            fetched += len(results)
            if not results or fetched >= total:
                break
            sleeper(.5)
        coverage.append({"query": query, "reported_matches": total, "fetched": fetched,
                         "capped": fetched < total})
    return rows, {"coverage": coverage, "snippet_only": True, "sampled": any(c["capped"] for c in coverage)}
