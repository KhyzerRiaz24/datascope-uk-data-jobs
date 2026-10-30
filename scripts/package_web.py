"""Copy the tested browser source into Sites' supported static output directory.

No transpilation is needed. web/ stays the readable source; dist/ is disposable
hosting output. Run from anywhere: python3 /path/to/scripts/package_web.py.
"""
from pathlib import Path
import shutil

root=Path(__file__).resolve().parents[1]
output=root/'dist'
if output.is_symlink():
    raise RuntimeError('Refusing to replace a symlink at the static output path.')
if output.exists():
    shutil.rmtree(output)
shutil.copytree(root/'web',output)
print('Prepared dist/ from the tested web/ source.')
