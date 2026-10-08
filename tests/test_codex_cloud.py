"""Exercise the shell entrypoint in disposable homes; no production Python."""
import io
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/install-codex-cloud.sh"
REF = "26cb6e7534d05149847048d32e30a7d1970c7812"


class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.home = self.root / "home with spaces"
        self.home.mkdir()
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.data = self.home / ".local/share/dotfiles-codex-cloud"
        self.skills = self.home / ".agents/skills"
        self.codex = self.home / ".codex"
        self.env = dict(os.environ, HOME=str(self.home), PATH=f"{self.bin}:{os.environ['PATH']}")
        for key in ("CODEX_HOME", "XDG_DATA_HOME", "XDG_STATE_HOME"):
            self.env.pop(key, None)
        with tarfile.open(self.root / "source.tar.gz", "w:gz") as tar:
            for name, value in {
                "skills/apm.yml": "name: fixture\n",
                "skills/apm.lock.yaml": "lockfile_version: '1'\n",
                "skills/local/SKILL.md": "local skill\n",
                "skills/.licenses/yomiyasu.LICENSE": "MIT fixture\n",
                "cloud/codex/AGENTS.md": "cloud instructions\n",
                "cloud/codex/config.toml": "model_reasoning_effort = 'high'\n",
            }.items():
                info = tarfile.TarInfo(f"dotfiles-{REF}/{name}")
                info.size = len(value.encode())
                tar.addfile(info, io.BytesIO(value.encode()))
        self.apm = '''#!/bin/sh
set -eu
[ "$*" = 'install --frozen --target agent-skills --only apm' ]
[ "$APM_NO_SCRIPTS" = 1 ]
[ "$GIT_CONFIG_GLOBAL" = /dev/null ]
[ -z "${GITHUB_TOKEN:-}" ]
mkdir -p .agents/skills/yomiyasu
cp -R .apm/skills/local .agents/skills/
printf 'external skill\\n' > .agents/skills/yomiyasu/SKILL.md
'''
        self.bundle_apm()
        self.command("curl", f'''for arg do
case "$arg" in
https://codeload.github.com/*) src='{self.root}/source.tar.gz';;
https://github.com/microsoft/apm/*) src='{self.root}/apm.tar.gz';;
esac
done
for last do :; done
cp "$src" "$last"
''')
        # Real checksum verification is exercised by the integration run.
        self.command("sha256sum", "cat >/dev/null\n")

    def command(self, name, body):
        path = self.bin / name
        path.write_text("#!/bin/sh\nset -eu\n" + body)
        path.chmod(0o755)

    def bundle_apm(self):
        with tarfile.open(self.root / "apm.tar.gz", "w:gz") as tar:
            for arch in ("x86_64", "arm64"):
                info = tarfile.TarInfo(f"apm-linux-{arch}/apm")
                info.mode = 0o755
                info.size = len(self.apm.encode())
                tar.addfile(info, io.BytesIO(self.apm.encode()))

    def run_install(self, success=True):
        result = subprocess.run(["sh"], input=SCRIPT.read_text(), text=True,
                                env=self.env, capture_output=True)
        self.assertEqual(result.returncode == 0, success, result.stdout + result.stderr)
        self.assertFalse((self.data / "lock").exists())
        return result

    def test_install_rerun_preserves_user_files(self):
        self.codex.mkdir()
        (self.codex / "config.toml").write_text("user config")
        (self.codex / "AGENTS.md").symlink_to("absent-user-file")
        self.skills.mkdir(parents=True)
        (self.skills / "unrelated").mkdir()
        self.env["GITHUB_TOKEN"] = "test-token-never-inherited"
        self.run_install()
        self.run_install()
        self.assertEqual((self.skills / "local/SKILL.md").read_text(), "local skill\n")
        self.assertEqual((self.skills / "yomiyasu/LICENSE").read_text(), "MIT fixture\n")
        self.assertEqual((self.codex / "config.toml").read_text(), "user config")
        self.assertEqual(os.readlink(self.codex / "AGENTS.md"), "absent-user-file")
        self.assertTrue((self.skills / "unrelated").is_dir())

    def test_seeds_absent_config(self):
        self.run_install()
        self.assertEqual((self.codex / "AGENTS.md").read_text(), "cloud instructions\n")
        self.assertTrue((self.codex / "config.toml").is_file())

    def test_collision_leaves_existing_deployment(self):
        self.skills.mkdir(parents=True)
        (self.skills / "local").mkdir()
        self.run_install(False)
        self.assertFalse((self.data / "current").exists())
        self.assertFalse(self.codex.exists())
        self.assertTrue((self.skills / "local").is_dir())

    def test_failed_apm_preserves_previous_install(self):
        self.run_install()
        current = os.readlink(self.data / "current")
        self.apm = "#!/bin/sh\nexit 23\n"
        self.bundle_apm()
        self.run_install(False)
        self.assertEqual(os.readlink(self.data / "current"), current)
        self.assertEqual((self.skills / "local/SKILL.md").read_text(), "local skill\n")
        self.assertEqual(len(list(self.data.glob("install.*"))), 1)

    def test_download_and_checksum_failures(self):
        for tool in ("curl", "sha256sum"):
            with self.subTest(tool=tool):
                saved = (self.bin / tool).read_text()
                self.command(tool, "exit 22\n")
                self.run_install(False)
                self.assertFalse(self.skills.exists())
                (self.bin / tool).write_text(saved)

    def test_custom_codex_home_and_retired_link(self):
        custom = self.root / "custom codex"
        self.env["CODEX_HOME"] = str(custom)
        self.run_install()
        retired = self.skills / "retired"
        retired.symlink_to(self.data / "current/.agents/skills/retired")
        self.run_install()
        self.assertFalse(retired.is_symlink())
        self.assertTrue((custom / "AGENTS.md").is_file())
        self.assertFalse(self.codex.exists())

    def test_replaced_managed_skill_blocks_update(self):
        self.run_install()
        current = os.readlink(self.data / "current")
        (self.skills / "local").unlink()
        (self.skills / "local").mkdir()
        self.run_install(False)
        self.assertEqual(os.readlink(self.data / "current"), current)
        self.assertTrue((self.skills / "local").is_dir())

    def test_trailing_slash_codex_symlink_rejected(self):
        elsewhere = self.root / "elsewhere"
        elsewhere.mkdir()
        self.codex.symlink_to(elsewhere)
        self.env["CODEX_HOME"] = str(self.codex) + "///"
        self.run_install(False)
        self.assertEqual(list(elsewhere.iterdir()), [])

    def test_destination_symlink_rejected(self):
        elsewhere = self.root / "elsewhere"
        elsewhere.mkdir()
        (self.home / ".agents").symlink_to(elsewhere)
        self.run_install(False)
        self.assertEqual(list(elsewhere.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
