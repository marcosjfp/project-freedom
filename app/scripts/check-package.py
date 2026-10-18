"""Compare a WXT ZIP to the audited build using Python's standard library."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile

app = Path(__file__).resolve().parent.parent
pkg = json.loads((app / 'package.json').read_text())
archive = app / '.output' / f'project-freedom-{pkg["version"]}-chrome.zip'
build = app / '.output/chrome-mv3'
audit = json.loads((app / '.output/phase3-artifact-audit.json').read_text())
assert audit['version'] == pkg['version']
with ZipFile(archive) as zipped:
    assert zipped.testzip() is None, 'Archive CRC failure'
    names = zipped.namelist()
    assert len(names) == len(set(names)), 'Duplicate ZIP paths'
    assert set(names) == set(audit['files']), 'ZIP differs from audited file list'
    for name in names:
        assert not Path(name).is_absolute() and '..' not in Path(name).parts
        data = zipped.read(name)
        assert data == (build / name).read_bytes(), f'ZIP/build mismatch: {name}'
        assert hashlib.sha256(data).hexdigest() == audit['files'][name]['sha256']
report = {'version': pkg['version'], 'archive': archive.name,
          'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
          'fileCount': len(names), 'matchesAuditedProductionOutput': True}
(app / '.output/phase3-package-audit.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
