"""Business-rule and integration tests. Run: PYTHONPATH=src python -m unittest discover -s tests -v."""
from io import BytesIO
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError

from ukjobs.cli import main, prepare
from ukjobs.normalize import normalize, role_for, working_for, seniority_for
from ukjobs.provider import collect, request_page, CollectionError
from ukjobs.storage import connect, ingest, export_dataset


def record(**changes):
    return {"id":"123", "title":"Junior Data Analyst", "company":"Example", "location":"Leeds",
            "description":"SQL, Python, Excel and Power BI. Hybrid with remote working.",
            "salary_min":"£30,000", "salary_max":"35000", "salary_unit":"annual",
            "contract_type":"permanent", "posted_at":"2026-10-01", **changes}


class NormalizationTests(unittest.TestCase):
    def test_skill_boundaries_and_working(self):
        row=normalize(record(description="<b>SQL</b> Excel Power BI R. Spark. Hybrid and remote."),"2026-10-30","csv")
        self.assertEqual(row["skills"],["SQL","Excel","Power BI","R","Spark"])
        self.assertEqual(row["working"],"Hybrid")
        row=normalize(record(description="Tableaus, excellent communication and sparks."),"2026-10-30","csv")
        self.assertEqual(row["skills"],[])

    def test_salary_eligibility_and_missing_values(self):
        self.assertEqual(normalize(record(),"2026-10-30","csv")["salary_mid"],32500)
        for changes in [{"salary_unit":"daily"},{"contract_type":"contract"},{"salary_is_predicted":"1"},
                        {"currency":"USD"},{"salary_max":""}]:
            self.assertIsNone(normalize(record(**changes),"2026-10-30","csv")["salary_mid"])

    def test_invalid_salaries_dates_and_urls(self):
        for changes in [{"salary_min":"NaN"},{"salary_min":"inf"},{"salary_max":"2"},
                        {"posted_at":"2026-11-01"},{"posted_at":"2026-02-30"},
                        {"url":"javascript:alert(1)"},{"salary_unit":"weekly"},{"posted_at":"2026-10-01garbage"}]:
            with self.subTest(changes=changes),self.assertRaises(ValueError):
                normalize(record(**changes),"2026-10-30","csv")

    def test_explicit_seniority_and_negation(self):
        self.assertEqual(seniority_for("Data Analyst"),"Unspecified")
        self.assertEqual(seniority_for("Senior Graduate Data Analyst"),"Senior / Lead")
        self.assertEqual(working_for("This job is not remote"),"On site")
        self.assertEqual(working_for("hybrid with remote working"),"Hybrid")

    def test_roles_do_not_classify_description(self):
        self.assertEqual(role_for("Power BI Developer"),"BI Analyst")
        self.assertEqual(role_for("Analytics Engineer"),"Data Engineer")
        self.assertIsNone(normalize(record(title="Software Developer"),"2026-10-30","csv"))

    def test_identity_stable_across_updates(self):
        a=normalize(record(),"2026-10-29","csv")
        b=normalize(record(description="Changed text"),"2026-10-30","csv")
        self.assertEqual(a["id"],b["id"])
        self.assertNotEqual(a["id"],normalize(record(id="456"),"2026-10-30","csv")["id"])


class StorageTests(unittest.TestCase):
    def setUp(self):
        self.directory=tempfile.TemporaryDirectory()
        self.root=Path(self.directory.name)
        self.db=self.root/"test.duckdb"

    def tearDown(self):
        self.directory.cleanup()

    def test_duplicate_and_repeat_run_do_not_inflate_observations(self):
        row=normalize(record(),"2026-10-30","csv")
        ingest(self.db,[row,row],"2026-10-30","imported",{"input_rows":2})
        ingest(self.db,[row],"2026-10-30","imported",{"input_rows":1})
        dataset=export_dataset(self.db,self.root/"out.json")
        self.assertEqual(len(dataset["observations"]),1)
        self.assertEqual(dataset["runs"][0]["duplicate_rows"],1)
        self.assertEqual(len(dataset["runs"]),2)

    def test_distinct_dates_and_sql_view(self):
        for day in ["2026-10-29","2026-10-30"]:
            ingest(self.db,[normalize(record(),day,"csv")],day,"imported",{})
        with connect(self.db) as db:
            self.assertEqual(db.execute("SELECT COUNT(DISTINCT job_id), COUNT(*), MEDIAN(salary_mid) FROM job_observations").fetchone(),(1,2,32500))

    def test_demo_cannot_mix_with_real(self):
        row=normalize(record(),"2026-10-30","csv")
        ingest(self.db,[row],"2026-10-30","demo",{})
        with self.assertRaisesRegex(ValueError,"different data source"):
            ingest(self.db,[row],"2026-10-30","imported",{})

    def test_import_to_export_end_to_end_and_preserve_on_failure(self):
        csv_path=self.root/"input.csv"
        csv_path.write_text('id,title,company,location,description,posted_at,salary_min,salary_max,salary_unit,contract_type\n1,Junior Data Analyst,Example,Leeds,SQL Python,2026-10-01,30000,35000,annual,permanent\n1,Junior Data Analyst,Example,Leeds,SQL Python,2026-10-01,30000,35000,annual,permanent\n2,Data Engineer,Example,Leeds,SQL,2026-10-01,NaN,35000,annual,permanent\n3,Web Developer,Example,Leeds,SQL,2026-10-01,30000,35000,annual,permanent\n')
        output=self.root/"out.json"
        args=["import-csv","--csv",str(csv_path),"--db",str(self.db),"--output",str(output),"--observed","2026-10-30"]
        self.assertEqual(main(args),0)
        data=json.loads(output.read_text())
        self.assertEqual(len(data["observations"]),1)
        run=data["runs"][0]
        self.assertEqual((run["input_rows"],run["accepted_rows"],run["rejected_rows"],run["filtered_rows"],run["duplicate_rows"]),(4,1,1,1,1))
        previous=output.read_bytes()
        csv_path.write_text('wrong,columns\n1,2\n')
        self.assertEqual(main(args),1)
        self.assertEqual(output.read_bytes(),previous)


class ProviderTests(unittest.TestCase):
    def response(self, payload):
        return BytesIO(json.dumps(payload).encode())

    @patch.dict(os.environ,{"ADZUNA_APP_ID":"example-id","ADZUNA_APP_KEY":"secret-test-value"})
    def test_pagination_coverage_and_dedup_input(self):
        calls=[]
        def opener(request,timeout):
            calls.append(request.full_url)
            page=int(request.full_url.split('/search/')[1].split('?')[0])
            return self.response({"count":60,"results":[{"id":str(page),"title":"Data Analyst","created":"2026-10-01"}]* (50 if page==1 else 10)})
        rows,meta=collect(2,opener,lambda _:None)
        self.assertEqual(len(calls),8)
        self.assertEqual(len(rows),240)
        self.assertFalse(meta["sampled"])
        rows,meta=collect(1,opener,lambda _:None)
        self.assertTrue(meta["sampled"])

    def test_retry_and_sanitized_error(self):
        attempts=[]
        def opener(request,timeout):
            attempts.append(1)
            raise URLError("https://api.example/?app_key=secret-test-value")
        with self.assertRaises(CollectionError) as raised:
            request_page("data analyst",1,"id","secret-test-value",opener,lambda _:None)
        self.assertEqual(len(attempts),3)
        self.assertNotIn("secret-test-value",str(raised.exception))

    def test_missing_provider_id_fails_before_storage(self):
        with patch.dict(os.environ,{"ADZUNA_APP_ID":"id","ADZUNA_APP_KEY":"key"}):
            with self.assertRaisesRegex(CollectionError,"stable job ID"):
                collect(1,lambda request,timeout:self.response({"count":1,"results":[{}]}),lambda _:None)

    def test_invalid_json_does_not_turn_into_empty_success(self):
        with self.assertRaises(CollectionError):
            request_page("data analyst",1,"id","key",lambda request,timeout:BytesIO(b"not json"),lambda _:None)

    def test_missing_credentials_and_auth_error(self):
        with patch.dict(os.environ,{},clear=True):
            with self.assertRaisesRegex(CollectionError,"ADZUNA_APP_ID"):
                collect()
        def unauthorized(request,timeout):
            raise HTTPError(request.full_url,401,"bad",{},None)
        with self.assertRaisesRegex(CollectionError,"HTTP 401"):
            request_page("data analyst",1,"id","secret-test-value",unauthorized,lambda _:None)


if __name__=="__main__":
    unittest.main()
