"""Exercise the shell entrypoint in disposable homes; no production Python."""
import io
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/install-agent-cloud.sh"
REF = "0123456789abcdef0123456789abcdef01234567"


class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.home = self.root / "home with spaces"
        self.home.mkdir()
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.data = self.home / ".local/share/dotfiles-agent-cloud"
        self.skills = self.home / ".agents/skills"
        self.codex = self.home / ".codex"
        self.claude = self.home / ".claude"
        self.env = dict(os.environ, HOME=str(self.home), PATH=f"{self.bin}:{os.environ['PATH']}")
        for key in ("CODEX_HOME", "CLAUDE_CONFIG_DIR", "XDG_DATA_HOME", "XDG_STATE_HOME",
                    "DOTFILES_REF", "REQUESTS_CA_BUNDLE"):
            self.env.pop(key, None)
        with tarfile.open(self.root / "source.tar.gz", "w:gz") as tar:
            for name, value in {
                "skills/apm.yml": "name: fixture\n",
                "skills/apm.lock.yaml": "lockfile_version: '1'\n",
                "skills/local/SKILL.md": "local skill\n",
                "skills/.licenses/yomiyasu.LICENSE": "MIT fixture\n",
                "home/dot_agents/AGENTS.md": "# Prefs\n\nshared\n\n## Local Environment\n\n- alias\n",
                "cloud/AGENTS.md": "## Cloud Session\n",
                "cloud/codex/config.toml": "model_reasoning_effort = 'high'\n",
                "cloud/claude/settings.json": "{}\n",
            }.items():
                info = tarfile.TarInfo(f"hayatosc-dotfiles-{REF[:7]}/{name}")
                info.size = len(value.encode())
                tar.addfile(info, io.BytesIO(value.encode()))
        self.apm = '''#!/bin/sh
set -eu
[ "$*" = 'install --frozen --target agent-skills --only apm' ]
[ "$APM_NO_SCRIPTS" = 1 ]
[ "$GIT_CONFIG_GLOBAL" = /dev/null ]
[ -z "${GITHUB_TOKEN:-}" ]
printf '%s' "${REQUESTS_CA_BUNDLE-unset}" > '@ROOT@/ca'
mkdir -p .agents/skills/yomiyasu apm_modules/cache
cp -R .apm/skills/local .agents/skills/
printf 'external skill\\n' > .agents/skills/yomiyasu/SKILL.md
'''
        self.bundle_apm()
        self.command("git", f"[ \"$*\" = 'ls-remote https://github.com/hayatosc/dotfiles refs/heads/main' ]\n"
                     f"printf '%s\\trefs/heads/main\\n' {REF}\n")
        self.command("curl", f'''for arg do
case "$arg" in
https://codeload.github.com/hayatosc/dotfiles/tar.gz/{REF}) src='{self.root}/source.tar.gz';;
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
        body = self.apm.replace("@ROOT@", str(self.root)).encode()
        with tarfile.open(self.root / "apm.tar.gz", "w:gz") as tar:
            for arch in ("x86_64", "arm64"):
                info = tarfile.TarInfo(f"apm-linux-{arch}/apm")
                info.mode = 0o755
                info.size = len(body)
                tar.addfile(info, io.BytesIO(body))

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
        self.assertEqual((self.root / "ca").read_text(), "unset")
        self.run_install()
        self.assertEqual((self.skills / "local/SKILL.md").read_text(), "local skill\n")
        self.assertEqual((self.skills / "yomiyasu/LICENSE").read_text(), "MIT fixture\n")
        self.assertEqual((self.codex / "config.toml").read_text(), "user config")
        self.assertEqual(os.readlink(self.codex / "AGENTS.md"), "absent-user-file")
        self.assertTrue((self.skills / "unrelated").is_dir())

    def test_seeds_absent_config(self):
        self.run_install()
        instructions = "# Prefs\n\nshared\n\n## Cloud Session\n"
        self.assertEqual((self.codex / "AGENTS.md").read_text(), instructions)
        self.assertEqual((self.claude / "CLAUDE.md").read_text(), instructions)
        self.assertTrue((self.codex / "config.toml").is_file())
        self.assertEqual((self.claude / "settings.json").read_text(), "{}\n")

    def test_claude_code_skills_and_user_files(self):
        (self.claude / "skills/platform").mkdir(parents=True)
        (self.claude / "settings.json").write_text("user settings")
        self.run_install()
        self.assertEqual((self.claude / "skills/local/SKILL.md").read_text(), "local skill\n")
        self.assertEqual(os.readlink(self.claude / "skills/local"),
                         str(self.data / "current/.agents/skills/local"))
        self.assertTrue((self.claude / "skills/platform").is_dir())
        self.assertEqual((self.claude / "settings.json").read_text(), "user settings")

    def test_claude_collision_blocks_both_destinations(self):
        (self.claude / "skills/local").mkdir(parents=True)
        self.run_install(False)
        self.assertFalse(self.skills.exists())
        self.assertFalse((self.data / "current").exists())

    def test_rerun_prunes_generations_and_caches(self):
        self.run_install()
        self.run_install()
        generations = list(self.data.glob("install.*"))
        self.assertEqual(generations, [Path(os.readlink(self.data / "current"))])
        self.assertEqual(sorted(p.name for p in generations[0].iterdir()),
                         [".agents", "SOURCE_REF", "apm.lock.yaml", "apm.yml"])
        self.assertEqual((generations[0] / "SOURCE_REF").read_text(), REF + "\n")

    def test_explicit_ref_and_ca_forwarding(self):
        self.command("git", "exit 1\n")
        self.env.update(DOTFILES_REF=REF, REQUESTS_CA_BUNDLE="/ca bundle.crt")
        self.run_install()
        self.assertEqual((self.root / "ca").read_text(), "/ca bundle.crt")
        for ref in ("main", REF[:7], REF.upper()):
            with self.subTest(ref=ref):
                self.env["DOTFILES_REF"] = ref
                self.assertIn("full commit SHA", self.run_install(False).stderr)

    def test_unresolved_main_fails_before_changes(self):
        self.command("git", "exit 128\n")
        self.assertIn("cannot resolve main", self.run_install(False).stderr)
        self.assertFalse(self.data.exists())

    def test_repository_instructions_keep_stripped_section(self):
        # The installer drops this workstation-only section by its exact heading.
        text = (ROOT / "home/dot_agents/AGENTS.md").read_text()
        self.assertIn("\n## Local Environment\n", text)

    def test_collision_leaves_existing_deployment(self):
        self.skills.mkdir(parents=True)
        (self.skills / "local").mkdir()
        self.run_install(False)
        self.assertFalse((self.data / "current").exists())
        self.assertFalse(self.codex.exists())
        self.assertFalse(self.claude.exists())
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

    def interrupted_publication(self, tool):
        self.run_install()
        previous = os.readlink(self.data / "current")
        self.command(tool, f'''/usr/bin/{tool} "$@"
case "$*" in
*'/lock/current'*) kill -TERM "$PPID" ;;
esac
''')
        result = self.run_install(False)
        self.assertEqual(result.returncode, 143)
        (self.bin / tool).unlink()
        current = os.readlink(self.data / "current")
        if tool == "ln":
            self.assertEqual(current, previous)
        else:
            self.assertNotEqual(current, previous)
        self.assertTrue(Path(current).is_dir())
        self.assertEqual((self.skills / "local/SKILL.md").read_text(), "local skill\n")
        self.run_install()

    def test_signal_before_publish_removes_temporary_link(self):
        self.interrupted_publication("ln")

    def test_signal_after_publish_preserves_live_generation(self):
        self.interrupted_publication("mv")

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

    def test_claude_skills_symlink_rejected(self):
        elsewhere = self.root / "elsewhere"
        elsewhere.mkdir()
        self.claude.mkdir()
        (self.claude / "skills").symlink_to(elsewhere)
        self.assertIn("symlinked destination", self.run_install(False).stderr)
        self.assertEqual(list(elsewhere.iterdir()), [])

    def test_destination_symlink_rejected(self):
        elsewhere = self.root / "elsewhere"
        elsewhere.mkdir()
        (self.home / ".agents").symlink_to(elsewhere)
        self.run_install(False)
        self.assertEqual(list(elsewhere.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
