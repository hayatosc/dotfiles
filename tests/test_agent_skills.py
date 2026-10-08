"""Behavior tests use disposable homes, literal skill content, and a fake APM."""

import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch

import yaml

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("agent_skills", ROOT / "scripts/agent_skills.py")
skills = importlib.util.module_from_spec(spec)
spec.loader.exec_module(skills)
bootstrap_spec = importlib.util.spec_from_file_location("codex_cloud", ROOT / "scripts/codex_cloud.py")
bootstrap = importlib.util.module_from_spec(bootstrap_spec)
bootstrap_spec.loader.exec_module(bootstrap)


class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="cloud tests ")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.home = self.root / "home with spaces"
        self.home.mkdir()
        self.data = self.root / "data with spaces/dotfiles-agent-skills"
        self.state = self.root / "state with spaces/dotfiles-agent-skills"
        self.codex = self.root / "codex with spaces"
        self.repo = self.root / "source with spaces"
        (self.repo / "skills/local").mkdir(parents=True)
        (self.repo / "skills/local/SKILL.md").write_text("local v1\n")
        (self.repo / "skills/local/tool.sh").write_text("#!/bin/sh\nexit 0\n")
        (self.repo / "skills/local/tool.sh").chmod(0o755)
        (self.repo / "skills/.licenses").mkdir()
        (self.repo / "skills/.licenses/yomiyasu.LICENSE").write_text("MIT notice\n")
        (self.repo / "cloud/codex").mkdir(parents=True)
        (self.repo / "cloud/codex/AGENTS.md").write_text("cloud instructions v1\n")
        (self.repo / "cloud/codex/config.toml").write_text('model_reasoning_effort = "medium"\n')
        (self.repo / "home/dot_config/mise").mkdir(parents=True)
        (self.repo / "home/dot_config/mise/config.toml").write_text('[tools]\n"github:microsoft/apm" = "v0.33.0"\n')
        (self.repo / "skills/apm.yml").write_text("dependencies:\n  apm:\n    - example/skills/yomiyasu\ntargets:\n  - agent-skills\n")
        (self.repo / "skills/apm.lock.yaml").write_text(yaml.safe_dump({
            "dependencies": [{"repo_url": "example/skills", "host": "github.com", "name": "yomiyasu",
                              "resolved_commit": "a" * 40, "virtual_path": "yomiyasu",
                              "deployed_files": [".agents/skills/yomiyasu", ".agents/skills/yomiyasu/SKILL.md"],
                              "deployed_file_hashes": {".agents/skills/yomiyasu/SKILL.md":
                                  "sha256:19932e05935dea2e806e1d2f84c04d7b4a9fcb9200f15b228167aed5a735fe9a"}}]}))
        self.mode = self.root / "apm-mode"
        self.mode.write_text("ok")
        self.apm = self.root / "fake apm"
        self.apm.write_text(f'''#!{sys.executable}
import os, pathlib, shutil, sys
mode = pathlib.Path({str(self.mode)!r}).read_text()
if sys.argv[1:] == ["--version"]:
    print("Agent Package Manager (APM) CLI version " + ("0.30.0" if mode == "version" else "0.33.0"))
    sys.exit(0)
assert sys.argv[1:] == ["install", "--frozen", "--target", "agent-skills"]
assert "GITHUB_TOKEN" not in os.environ and "GH_TOKEN" not in os.environ
assert os.environ["APM_NO_SCRIPTS"] == "1"
assert os.environ["GIT_CONFIG_GLOBAL"] == "/dev/null"
assert "apm-home" in os.environ["HOME"]
if mode == "network":
    print("simulated public dependency network failure")
    sys.exit(22)
root = pathlib.Path(".agents/skills")
root.mkdir(parents=True)
for local in pathlib.Path(".apm/skills").iterdir():
    shutil.copytree(local, root/local.name)
(root/"yomiyasu").mkdir()
(root/"yomiyasu/SKILL.md").write_text("corrupted\\n" if mode == "content" else "remote v1\\n")
if mode == "missing":
    (root/"yomiyasu/SKILL.md").unlink()
if mode == "extra":
    (root/"undeclared").mkdir()
if mode == "unrecorded":
    (root/"yomiyasu/unrecorded.md").write_text("unverified\\n")
if mode == "lock":
    lock = pathlib.Path("apm.lock.yaml")
    lock.write_text(lock.read_text().replace("a" * 40, "b" * 40))
''')
        self.apm.chmod(0o755)
        self.env = dict(HOME=str(self.home), CODEX_HOME=str(self.codex),
                        XDG_DATA_HOME=str(self.data.parent), XDG_STATE_HOME=str(self.state.parent),
                        GITHUB_TOKEN="must-not-inherit", GH_TOKEN="must-not-inherit")

    def install(self, cloud=True, ref="one"):
        with patch.dict(os.environ, self.env, clear=False):
            skills.install(self.repo, self.apm, cloud=cloud, ref=ref)

    def deployed(self, name="local"):
        return self.home / ".agents/skills" / name

    def test_first_install_and_same_version_rerun(self):
        self.install()
        self.assertEqual(self.deployed().joinpath("SKILL.md").read_text(), "local v1\n")
        self.assertEqual(self.deployed("yomiyasu").joinpath("LICENSE").read_text(), "MIT notice\n")
        self.assertEqual((self.codex / "AGENTS.md").read_text(), "cloud instructions v1\n")
        self.assertEqual((self.codex / "config.toml").read_text(), 'model_reasoning_effort = "medium"\n')
        self.assertTrue(os.access(self.deployed() / "tool.sh", os.X_OK))
        manifest = self.state / "manifest.json"
        before = (manifest.read_bytes(), manifest.stat().st_mtime_ns, self.deployed().lstat().st_mtime_ns)
        self.install()
        self.assertEqual(before, (manifest.read_bytes(), manifest.stat().st_mtime_ns, self.deployed().lstat().st_mtime_ns))
        self.assertEqual(len(list((self.data / "generations").iterdir())), 1)

    def test_update_only_owned_paths_and_remove_retired_skill(self):
        other = self.deployed("platform-provided")
        other.mkdir(parents=True)
        (other / "SKILL.md").write_text("platform skill\n")
        self.install()
        old_target = Path(os.readlink(self.deployed()))
        (self.repo / "skills/local/SKILL.md").write_text("local v2\n")
        (self.repo / "cloud/codex/AGENTS.md").write_text("cloud instructions v2\n")
        self.install(ref="two")
        self.assertEqual((self.deployed() / "SKILL.md").read_text(), "local v2\n")
        self.assertEqual((self.codex / "AGENTS.md").read_text(), "cloud instructions v2\n")
        self.assertEqual((other / "SKILL.md").read_text(), "platform skill\n")
        self.assertEqual((old_target / "SKILL.md").read_text(), "local v1\n")
        shutil.rmtree(self.repo / "skills/local")
        self.install(ref="three")
        self.assertFalse(skills.exists(self.deployed()))
        self.assertEqual((other / "SKILL.md").read_text(), "platform skill\n")

    def test_existing_config_and_instructions_are_not_read(self):
        self.codex.mkdir()
        config = self.codex / "config.toml"
        agents = self.codex / "AGENTS.md"
        config.write_bytes(b"existing config, even invalid TOML\x00")
        agents.write_text("existing instructions\n")
        original = Path.read_text
        original_bytes = Path.read_bytes
        def no_read(path, *args, **kwargs):
            if path in (config, agents):
                self.fail(f"read existing user config/instructions: {path}")
            return original(path, *args, **kwargs)
        def no_read_bytes(path, *args, **kwargs):
            if path in (config, agents):
                self.fail(f"read existing user config/instructions: {path}")
            return original_bytes(path, *args, **kwargs)
        with patch.object(Path, "read_text", no_read), patch.object(Path, "read_bytes", no_read_bytes):
            self.install()
            self.install()
        self.assertEqual(config.read_bytes(), b"existing config, even invalid TOML\x00")
        self.assertEqual(agents.read_text(), "existing instructions\n")

    def test_unmanaged_collisions_fail_before_publication(self):
        for kind in ("directory", "file", "symlink"):
            with self.subTest(kind=kind):
                path = self.deployed()
                path.parent.mkdir(parents=True, exist_ok=True)
                if kind == "directory":
                    path.mkdir()
                elif kind == "file":
                    path.write_text("keep")
                else:
                    path.symlink_to(self.root / "missing target")
                with self.assertRaisesRegex(ValueError, "unmanaged skill conflict"):
                    self.install()
                self.assertTrue(skills.exists(path))
                self.assertFalse(self.deployed("yomiyasu").exists())
                self.assertFalse(self.codex.exists())
                if path.is_dir():
                    path.rmdir()
                else:
                    path.unlink()

    def test_managed_content_edit_blocks_update(self):
        self.install()
        (self.deployed() / "SKILL.md").write_text("hand edited\n")
        before = (self.state / "manifest.json").read_bytes()
        with self.assertRaisesRegex(ValueError, "were edited"):
            self.install(ref="two")
        self.assertEqual((self.deployed() / "SKILL.md").read_text(), "hand edited\n")
        self.assertEqual((self.state / "manifest.json").read_bytes(), before)

    def test_replaced_managed_link_blocks_update(self):
        self.install()
        self.deployed().unlink()
        self.deployed().mkdir()
        (self.deployed() / "SKILL.md").write_text("replacement\n")
        with self.assertRaisesRegex(ValueError, "managed path changed"):
            self.install(ref="two")
        self.assertEqual((self.deployed() / "SKILL.md").read_text(), "replacement\n")

    def test_symlinked_destination_parent_is_preserved(self):
        external = self.root / "external"
        external.mkdir()
        (external / "keep").write_text("untouched\n")
        (self.home / ".agents").symlink_to(external)
        with self.assertRaisesRegex(ValueError, "directory conflict"):
            self.install()
        self.assertEqual(list(external.iterdir()), [external / "keep"])

    def test_network_version_content_and_output_failures_preserve_old_deployment(self):
        self.install()
        before = (self.state / "manifest.json").read_bytes()
        for mode in ("network", "version", "content", "missing", "extra", "unrecorded", "lock"):
            with self.subTest(mode=mode):
                self.mode.write_text(mode)
                with self.assertRaises((ValueError, FileNotFoundError, subprocess.CalledProcessError)):
                    self.install(ref="two")
                self.assertEqual((self.state / "manifest.json").read_bytes(), before)
                self.assertEqual((self.deployed() / "SKILL.md").read_text(), "local v1\n")

    def test_missing_apm_is_a_failure(self):
        self.apm.unlink()
        with self.assertRaises(FileNotFoundError):
            self.install()
        self.assertFalse(self.data.exists())

    def test_relative_home_or_xdg_path_is_rejected(self):
        for variable in ("HOME", "CODEX_HOME", "XDG_DATA_HOME", "XDG_STATE_HOME"):
            with self.subTest(variable=variable):
                with patch.dict(self.env, {variable: "relative"}):
                    with self.assertRaisesRegex(ValueError, "absolute path"):
                        self.install()

    def test_temporary_staging_is_removed_after_failure(self):
        self.mode.write_text("network")
        temporary_root = self.root / "temporary"
        temporary_root.mkdir()
        with patch.object(tempfile, "tempdir", str(temporary_root)):
            with self.assertRaises(subprocess.CalledProcessError):
                self.install()
        self.assertEqual(list(temporary_root.iterdir()), [])

    def test_lockfile_and_local_sources_are_never_modified(self):
        before = skills.inventory(self.repo)
        self.install()
        self.assertEqual(skills.inventory(self.repo), before)

    def test_partial_publish_rolls_back_and_can_retry(self):
        original = skills.replace_link
        def fail_second(path, target):
            if path.name == "yomiyasu":
                raise OSError("simulated filesystem failure")
            original(path, target)
        with patch.object(skills, "replace_link", fail_second):
            with self.assertRaisesRegex(OSError, "filesystem failure"):
                self.install()
        self.assertFalse(skills.exists(self.deployed()))
        self.assertFalse(skills.exists(self.codex / "AGENTS.md"))
        self.assertFalse((self.state / "manifest.json").exists())
        self.install()
        self.assertEqual((self.deployed() / "SKILL.md").read_text(), "local v1\n")

    def test_cloud_and_desktop_reuse_staging_and_ownership(self):
        self.install()
        (self.repo / "skills/local/SKILL.md").write_text("desktop v2\n")
        self.install(cloud=False, ref="desktop")
        self.install(cloud=False, ref="desktop")
        self.assertEqual((self.codex / "AGENTS.md").read_text(), "cloud instructions v1\n")
        self.assertEqual((self.deployed() / "SKILL.md").read_text(), "desktop v2\n")
        self.install(ref="cloud")

    def test_existing_config_symlink_is_not_followed(self):
        self.codex.mkdir()
        target = self.root / "unrelated file"
        target.write_text("unchanged\n")
        (self.codex / "config.toml").symlink_to(target)
        self.install()
        self.assertTrue((self.codex / "config.toml").is_symlink())
        self.assertEqual(target.read_text(), "unchanged\n")

    def test_second_installer_fails_while_locked(self):
        with skills.deployment_lock(self.state):
            with self.assertRaisesRegex(ValueError, "another skill deployment"):
                self.install()

    def test_changed_codex_home_preserves_previous_instructions(self):
        self.install()
        with patch.dict(self.env, CODEX_HOME=str(self.root / "new codex")):
            with self.assertRaisesRegex(ValueError, "CODEX_HOME differs"):
                self.install()
        self.assertEqual((self.codex / "AGENTS.md").read_text(), "cloud instructions v1\n")

    def test_source_directory_symlink_is_rejected(self):
        shutil.rmtree(self.repo / "skills/local")
        external = self.root / "source outside repo"
        external.mkdir()
        (external / "SKILL.md").write_text("preserve\n")
        (self.repo / "skills/local").symlink_to(external)
        with self.assertRaisesRegex(ValueError, "unsupported staged directory"):
            self.install()
        self.assertEqual((external / "SKILL.md").read_text(), "preserve\n")

    def test_invalid_manifest_fails_without_deleting_skills(self):
        self.install()
        manifest = self.state / "manifest.json"
        record = json.loads(manifest.read_text())
        record["schema"] = 999
        manifest.write_text(json.dumps(record))
        with self.assertRaisesRegex(ValueError, "incompatible"):
            self.install()
        self.assertEqual((self.deployed() / "SKILL.md").read_text(), "local v1\n")

    def test_missing_lock_commit_and_forbidden_manifest_are_rejected(self):
        lock = self.repo / "skills/apm.lock.yaml"
        record = yaml.safe_load(lock.read_text())
        record["dependencies"][0]["resolved_commit"] = "main"
        lock.write_text(yaml.safe_dump(record))
        with self.assertRaisesRegex(ValueError, "locked commit"):
            self.install()
        with (self.repo / "skills/apm.yml").open("a") as file:
            file.write("lifecycle:\n  postinstall: unexpected\n")
        with self.assertRaisesRegex(ValueError, "only APM skill dependencies"):
            self.install()


class EntrypointTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="entrypoint tests ")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.ref = "a" * 40
        self.entry = ROOT / "scripts/install-codex-cloud.sh"
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.archive = self.root / "archive.tar.gz"
        self.source = self.root / f"dotfiles-{self.ref}"
        (self.source / "scripts").mkdir(parents=True)
        shutil.copy2(self.entry, self.source / "scripts/install-codex-cloud.sh")
        self.marker = self.root / "executed"
        (self.source / "scripts/codex_cloud.py").write_text(f"from pathlib import Path\nPath({str(self.marker)!r}).write_text('ran')\n")
        self.tmp = self.root / "tmp"
        self.tmp.mkdir()
        self.env = dict(os.environ, PATH=f"{self.bin}:/usr/bin:/bin", TMPDIR=str(self.tmp))
        (self.bin / "curl").write_text(f'''#!/bin/bash
[[ $1 == -q ]] || exit 99
[[ "$*" == *"https://codeload.github.com/hayatosc/dotfiles/tar.gz/{self.ref}"* ]] || exit 98
cp {str(self.archive)!r} "${{@: -1}}"
''')
        (self.bin / "curl").chmod(0o755)

    def bundle(self):
        with tarfile.open(self.archive, "w:gz") as archive:
            archive.add(self.source, arcname=self.source.name)

    def run_entry(self, ref=None):
        self.bundle()
        return subprocess.run(["bash", str(self.entry), "--ref", ref or self.ref], env=self.env, capture_output=True, text=True)

    def test_pinned_download_runs_and_cleans_up(self):
        result = self.run_entry()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.marker.read_text(), "ran")
        self.assertEqual(list(self.tmp.iterdir()), [])

    def test_entrypoint_ref_mismatch_fails_before_execution(self):
        with (self.source / "scripts/install-codex-cloud.sh").open("a") as file:
            file.write("# different version\n")
        result = self.run_entry()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("entrypoint differs", result.stderr)
        self.assertFalse(self.marker.exists())
        self.assertEqual(list(self.tmp.iterdir()), [])

    def test_mutable_ref_is_rejected(self):
        result = self.run_entry("main")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("40-character", result.stderr)
        self.assertFalse(self.marker.exists())

    def test_download_failure_propagates_and_cleans_up(self):
        (self.bin / "curl").write_text("#!/bin/bash\nexit 22\n")
        result = self.run_entry()
        self.assertEqual(result.returncode, 22)
        self.assertFalse(self.marker.exists())
        self.assertEqual(list(self.tmp.iterdir()), [])

    def test_python_installer_failure_propagates(self):
        (self.source / "scripts/codex_cloud.py").write_text("raise SystemExit(39)\n")
        result = self.run_entry()
        self.assertEqual(result.returncode, 39)
        self.assertEqual(list(self.tmp.iterdir()), [])

    def test_missing_prerequisite_fails(self):
        isolated_bin = self.root / "isolated bin"
        isolated_bin.mkdir()
        for tool in ("curl", "tar", "cmp", "mktemp"):
            (isolated_bin / tool).symlink_to(shutil.which(tool))
        result = subprocess.run(["/bin/bash", str(self.entry), "--ref", self.ref],
                                env=dict(self.env, PATH=str(isolated_bin)), capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("required tool missing: python3", result.stderr)


class BootstrapTests(unittest.TestCase):
    def test_checksum_mismatch_stops_install(self):
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "download"
            def fetched(*args, **kwargs):
                target.write_bytes(b"remote v1\n")
            with patch.object(subprocess, "run", fetched):
                with self.assertRaisesRegex(ValueError, "checksum mismatch"):
                    bootstrap.download("https://example.invalid/public-release", target, "sha256:" + "0" * 64)
                bootstrap.download("https://example.invalid/public-release", target,
                                   "sha256:19932e05935dea2e806e1d2f84c04d7b4a9fcb9200f15b228167aed5a735fe9a")

    def test_unsafe_archive_members_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for name, kind in (("../outside", tarfile.REGTYPE), ("/absolute", tarfile.REGTYPE),
                               ("link", tarfile.SYMTYPE)):
                with self.subTest(name=name):
                    archive = root / "unsafe.tar.gz"
                    with tarfile.open(archive, "w:gz") as bundle:
                        member = tarfile.TarInfo(name)
                        member.type = kind
                        member.linkname = "../outside" if kind == tarfile.SYMTYPE else ""
                        bundle.addfile(member, io.BytesIO())
                    with self.assertRaisesRegex(ValueError, "unsafe archive member"):
                        bootstrap.extract(archive, root / "extract")
            self.assertFalse((root / "extract").exists())


class MiseTaskTests(unittest.TestCase):
    def test_install_routes_to_shared_staging_with_source_path_spaces(self):
        with tempfile.TemporaryDirectory(prefix="mise task ") as temp:
            root = Path(temp)
            bin_dir = root / "bin"
            bin_dir.mkdir()
            source = root / "source with spaces"
            source.mkdir()
            marker = root / "uv-args.json"
            (bin_dir / "apm").write_text("#!/bin/sh\nexit 0\n")
            (bin_dir / "apm").chmod(0o755)
            (bin_dir / "uv").write_text(f'''#!{sys.executable}
import json, pathlib, sys
pathlib.Path({str(marker)!r}).write_text(json.dumps(sys.argv[1:]))
''')
            (bin_dir / "uv").chmod(0o755)
            env = dict(os.environ, PATH=f"{bin_dir}:/usr/bin:/bin", CHEZMOI_SOURCE_DIR=str(source / "home"))
            task = ROOT / "home/dot_config/mise/tasks/executable_apm"
            result = subprocess.run(["bash", str(task), "install"], env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(json.loads(marker.read_text()), ["run", "--frozen", "--project", str(source),
                            "python", str(source / "scripts/agent_skills.py"), "--apm", str(bin_dir / "apm")])
            marker.unlink()
            result = subprocess.run(["bash", str(task), "install", "--force"], env=env, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse(marker.exists())


if __name__ == "__main__":
    unittest.main()
