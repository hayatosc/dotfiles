"""Local checks for the dot-cloud installer's file-preservation contract."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('dot_cloud_apply', Path(__file__).with_name('apply.py'))
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


class ManagedWrites(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.home = Path(self.temp.name)
        self.path = self.home / '.local/bin/tool'
        self.owned = {}

    def tearDown(self):
        self.temp.cleanup()

    def write(self, content=b'original', mode=0o755):
        return installer.managed_write(self.path, content, mode, self.home, self.owned)

    def test_new_file_and_noop_preserve_mtime(self):
        self.assertTrue(self.write())
        before = self.path.stat().st_mtime_ns
        self.assertFalse(self.write())
        self.assertEqual(before, self.path.stat().st_mtime_ns)
        self.assertEqual(self.path.read_bytes(), b'original')

    def test_owned_update(self):
        self.write()
        self.assertTrue(self.write(b'updated'))
        self.assertEqual(self.path.read_bytes(), b'updated')

    def test_unmanaged_file_preserved(self):
        self.path.parent.mkdir(parents=True)
        self.path.write_bytes(b'unrelated')
        with self.assertRaises(RuntimeError):
            self.write()
        self.assertEqual(self.path.read_bytes(), b'unrelated')

    def test_user_edit_preserved(self):
        self.write()
        self.path.write_bytes(b'user edit')
        with self.assertRaises(RuntimeError):
            self.write(b'updated upstream')
        self.assertEqual(self.path.read_bytes(), b'user edit')

    def test_owned_executable_mode_repaired(self):
        self.write()
        self.path.chmod(0o644)
        self.assertTrue(self.write())
        self.assertEqual(self.path.stat().st_mode & 0o777, 0o755)

    def test_unmanaged_mode_mismatch_preserved(self):
        self.path.parent.mkdir(parents=True)
        self.path.write_bytes(b'original')
        self.path.chmod(0o644)
        with self.assertRaises(RuntimeError):
            self.write()
        self.assertEqual(self.path.stat().st_mode & 0o777, 0o644)

    def test_symlink_destination_rejected(self):
        self.path.parent.mkdir(parents=True)
        other = self.home / 'unrelated'
        other.write_bytes(b'unrelated')
        self.path.symlink_to(other)
        with self.assertRaises(RuntimeError):
            self.write()
        self.assertEqual(other.read_bytes(), b'unrelated')

    def legacy_manifest(self):
        folder = self.home / 'source/profiles/dot-cloud'
        folder.mkdir(parents=True)
        (folder / 'legacy-tools.json').write_text(json.dumps({'tools': [
            {'name': 'tool', 'binary_sha256': installer.digest(b'original')}
        ]}))
        return self.home / 'source'

    def test_owned_legacy_binary_backed_up_outside_path(self):
        self.write()
        with patch.object(installer, 'ROOT', self.legacy_manifest()):
            installer.migrate_legacy_tools(self.home, self.home / 'state', self.owned)
            self.assertFalse(self.path.exists())
            backups = list((self.home / 'state/legacy-bin').iterdir())
            self.assertEqual([p.read_bytes() for p in backups], [b'original'])
            self.assertNotIn('.local/bin/tool', self.owned)
            installer.migrate_legacy_tools(self.home, self.home / 'state', self.owned)

    def test_changed_legacy_binary_preserved(self):
        self.write()
        self.path.write_bytes(b'user edit')
        with patch.object(installer, 'ROOT', self.legacy_manifest()):
            with self.assertRaisesRegex(RuntimeError, 'legacy binary'):
                installer.migrate_legacy_tools(self.home, self.home / 'state', self.owned)
        self.assertEqual(self.path.read_bytes(), b'user edit')

    def test_unmanaged_legacy_binary_preserved(self):
        self.write()
        self.owned.clear()
        with patch.object(installer, 'ROOT', self.legacy_manifest()):
            with self.assertRaisesRegex(RuntimeError, 'legacy binary'):
                installer.legacy_candidates(self.home, self.owned)
        self.assertTrue(self.path.exists())

    def test_mise_environment_isolates_caller_overrides(self):
        with patch.dict(installer.os.environ, {'MISE_CONFIG_DIR': '/unrelated', 'MISE_DATA_DIR': '/unrelated'}):
            env = installer.mise_environment(self.home, self.home / 'state')
        self.assertEqual(env['MISE_CONFIG_DIR'], str(self.home / '.config/mise'))
        self.assertEqual(env['HOME'], str(self.home))
        self.assertEqual(env['MISE_DATA_DIR'], str(self.home / '.local/share/mise'))


if __name__ == '__main__':
    unittest.main()
