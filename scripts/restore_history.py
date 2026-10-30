"""Restore the most recent unexpired workflow artifact before a scheduled refresh.

Used by refresh.yml, not by the dashboard. Selects only the expected database
member and never extracts arbitrary archive paths. No history is fabricated.
"""
from io import BytesIO
import json
import os
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen, build_opener, HTTPRedirectHandler
import zipfile

repo=os.environ['GITHUB_REPOSITORY']


class SafeRedirect(HTTPRedirectHandler):
    """Do not forward the GitHub token to the signed artifact storage URL."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        redirect=super().redirect_request(req, fp, code, msg, headers, newurl)
        if redirect and urlparse(req.full_url).netloc != urlparse(newurl).netloc:
            redirect.remove_header('Authorization')
        return redirect


opener=build_opener(SafeRedirect())
headers={'Authorization': 'Bearer '+os.environ['GH_TOKEN'], 'Accept':'application/vnd.github+json'}
request=Request(f'https://api.github.com/repos/{repo}/actions/artifacts?name=datascope-history&per_page=100',headers=headers)
with urlopen(request,timeout=30) as response:
    artifacts=json.load(response)['artifacts']
available=sorted([a for a in artifacts if not a['expired']],key=lambda a:a['created_at'],reverse=True)
if not available:
    print('No saved history found. Starting with the first observation date.')
else:
    request=Request(available[0]['archive_download_url'],headers=headers)
    with opener.open(request,timeout=60) as response:
        content=response.read()
    with zipfile.ZipFile(BytesIO(content)) as archive:
        # upload-artifact preserves paths from their least common parent.
        member='data/live.duckdb'
        if member not in archive.namelist():
            raise RuntimeError('The previous artifact contains no expected data/live.duckdb history.')
        Path('data').mkdir(exist_ok=True)
        Path(member).write_bytes(archive.read(member))
    print('Restored previous database history. Artifacts expire after 30 days; keep an independent backup.')
