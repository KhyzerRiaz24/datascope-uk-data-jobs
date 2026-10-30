"""Check local publication references without uploading or publishing anything.

Validates documentation links, screenshot presence, the public demo label, and
dependency-manifest consistency. It prints only file paths on a failed check.
"""
import json
from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
errors=[]
for document in [root/'README.md',*(root/'docs').glob('*.md')]:
    for target in re.findall(r'!?\[[^\]]*\]\(([^)]+)\)',document.read_text()):
        if re.match(r'^(?:https?://|#|mailto:)',target):
            continue
        destination=(document.parent/target.split('#')[0]).resolve()
        if not destination.exists():
            errors.append(f'Missing reference in {document.relative_to(root)}: {target}')
for name in ['overview-desktop.png','skills-desktop.png','salary-desktop.png','quality-desktop.png','overview-mobile.png']:
    image=root/'docs/images'/name
    if not image.exists() or image.stat().st_size<1000:
        errors.append(f'Missing or empty screenshot: docs/images/{name}')
package=json.loads((root/'package.json').read_text())
lock=json.loads((root/'package-lock.json').read_text())['packages']['']
for key in ['devDependencies','engines']:
    if package.get(key)!=lock.get(key):
        errors.append(f'package.json and package-lock.json disagree on {key}')
data=json.loads((root/'web/data.json').read_text())
if data['mode']!='demo':
    errors.append('The prepared public showcase must retain its labelled demo dataset.')
if 'Synthetic data.' not in (root/'web/app.js').read_text():
    errors.append('The browser demo provenance label is missing.')
if errors:
    raise SystemExit('\n'.join(errors))
print('Publication checks passed: documentation links, screenshots, lockfile and labelled demo.')
