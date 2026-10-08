"""Stage APM skills and publish only explicitly owned user-scope paths."""

import argparse
from contextlib import contextmanager
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import tomllib

import yaml


def digest(data):
    return hashlib.sha256(data).hexdigest()


def inventory(root):
    if root.is_symlink() or not root.is_dir():
        raise ValueError(f"unsupported staged directory: {root}")
    result = {}
    for path in sorted(root.rglob("*")):
        if path.is_symlink() or not (path.is_dir() or path.is_file()):
            raise ValueError(f"unsupported staged file: {path}")
        if path.is_file():
            result[path.relative_to(root).as_posix()] = [digest(path.read_bytes()), path.stat().st_mode & 0o111]
    return result


def isolated_env(home):
    # APM/git never inherit tokens, credential helpers, account config, or
    # runtime settings. Retain only network routing and CA locations.
    allowed = ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY",
               "http_proxy", "https_proxy", "all_proxy", "no_proxy",
               "SSL_CERT_FILE", "SSL_CERT_DIR")
    env = {key: os.environ[key] for key in allowed if key in os.environ}
    env.update(PATH="/usr/bin:/bin", HOME=str(home), CODEX_HOME=str(home / ".codex"),
               XDG_CONFIG_HOME=str(home / "config"), XDG_CACHE_HOME=str(home / "cache"),
               XDG_DATA_HOME=str(home / "data"), XDG_STATE_HOME=str(home / "state"),
               APM_HOME=str(home / ".apm"), APM_NO_SCRIPTS="1", PYTHONNOUSERSITE="1",
               GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL="/dev/null", GIT_CONFIG_COUNT="1",
               GIT_CONFIG_KEY_0="credential.helper", GIT_CONFIG_VALUE_0="",
               GIT_TERMINAL_PROMPT="0", GIT_ASKPASS="/bin/false", LC_ALL="C.UTF-8")
    return env


def dependency_identity(dependency):
    return {key: dependency.get(key) for key in (
        "repo_url", "host", "name", "virtual_path", "resolved_commit", "deployed_file_hashes")}


def build(repo, apm, temp):
    source = repo / "skills"
    project = temp / "project"
    project.mkdir()
    for name in ("apm.yml", "apm.lock.yaml"):
        shutil.copy2(source / name, project / name)
    manifest = yaml.safe_load((project / "apm.yml").read_text())
    if set(manifest.get("dependencies", {})) != {"apm"} or any(
        key in manifest for key in ("scripts", "lifecycle", "mcp", "policy")
    ):
        raise ValueError("skill deployment accepts only APM skill dependencies")
    locked = yaml.safe_load((project / "apm.lock.yaml").read_text())
    dependencies = locked["dependencies"]
    if not dependencies or any(not re.fullmatch(r"[0-9a-f]{40}", d.get("resolved_commit", "")) for d in dependencies):
        raise ValueError("every external skill must have a locked commit")
    local_names = set()
    (project / ".apm/skills").mkdir(parents=True)
    for skill in sorted(source.iterdir()):
        if skill.is_dir() and (skill / "SKILL.md").is_file():
            inventory(skill)  # Reject links before copytree follows them.
            local_names.add(skill.name)
            shutil.copytree(skill, project / ".apm/skills" / skill.name)
    remote_names = set()
    for dependency in dependencies:
        for value in dependency["deployed_files"]:
            path = PurePosixPath(value)
            if len(path.parts) < 3 or path.parts[:2] != (".agents", "skills") or ".." in path.parts:
                raise ValueError(f"non-skill lockfile destination: {value}")
            remote_names.add(path.parts[2])
    if local_names & remote_names:
        raise ValueError(f"duplicate local/external skills: {sorted(local_names & remote_names)}")
    home = temp / "apm-home"
    home.mkdir()
    env = isolated_env(home)
    version = tomllib.loads((repo / "home/dot_config/mise/config.toml").read_text())["tools"]["github:microsoft/apm"].removeprefix("v")
    output = subprocess.check_output([str(apm), "--version"], env=env, text=True)
    if not re.search(rf"CLI version {re.escape(version)}(?:\s|$)", output):
        raise ValueError(f"APM {version} required by mise config; found {output.strip()}")
    subprocess.run([str(apm), "install", "--frozen", "--target", "agent-skills"], cwd=project, env=env, check=True)
    installed_lock = yaml.safe_load((project / "apm.lock.yaml").read_text())
    if [dependency_identity(d) for d in dependencies] != [dependency_identity(d) for d in installed_lock["dependencies"]]:
        raise ValueError("APM changed locked dependencies or their content hashes")
    skills = project / ".agents/skills"
    inventory(skills)
    if {p.name for p in skills.iterdir()} != local_names | remote_names:
        raise ValueError("APM did not deploy exactly the declared skills")
    for dependency in dependencies:
        hashes = dependency.get("deployed_file_hashes", {})
        if not hashes:
            raise ValueError(f"missing locked content hashes: {dependency['name']}")
        for value, expected in hashes.items():
            path = PurePosixPath(value)
            if path.parts[:2] != (".agents", "skills") or ".." in path.parts:
                raise ValueError(f"invalid locked content path: {value}")
            if expected != f"sha256:{digest((project / value).read_bytes())}":
                raise ValueError(f"locked skill content mismatch: {value}")
    locked_files = {path for d in dependencies for path in d["deployed_file_hashes"]}
    actual_files = {f".agents/skills/{name}/{path}" for name in remote_names for path in inventory(skills / name)}
    if locked_files != actual_files:
        raise ValueError("external skills contain missing or unrecorded files")
    for name in local_names:
        if inventory(source / name) != inventory(skills / name):
            raise ValueError(f"APM changed local skill content: {name}")
    for skill in skills.iterdir():
        if not skill.is_dir() or not (skill / "SKILL.md").is_file():
            raise ValueError(f"missing SKILL.md: {skill}")
    shutil.copy2(source / ".licenses/yomiyasu.LICENSE", skills / "yomiyasu/LICENSE")
    stage = temp / "stage"
    shutil.copytree(skills, stage / "skills")
    return stage


def absolute(value):
    path = Path(value)
    if not path.is_absolute():
        raise ValueError(f"expected absolute path: {value}")
    return Path(os.path.abspath(path))


def directory_path(path):
    # Refuse to traverse an existing link, including a redirected parent.
    for part in reversed((path, *path.parents)):
        if part.is_symlink() or (part.exists() and not part.is_dir()):
            raise ValueError(f"directory conflict: {part}")


def exists(path):
    return path.exists() or path.is_symlink()


@contextmanager
def deployment_lock(state):
    directory_path(state)
    state.mkdir(parents=True, exist_ok=True)
    lock = state / "install.lock"
    if exists(lock) and (lock.is_symlink() or not lock.is_file()):
        raise ValueError(f"lock conflict: {lock}")
    with lock.open("a") as handle:
        try:
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as error:
            raise ValueError("another skill deployment is running") from error
        yield


def replace_link(path, target):
    temporary = path.with_name(f".{path.name}.dotfiles-{os.getpid()}")
    if exists(temporary):
        raise ValueError(f"temporary path conflict: {temporary}")
    try:
        temporary.symlink_to(target)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def publish(stage, *, home, data, state, codex=None, seed=None, ref="local"):
    manifest_path = state / "manifest.json"
    directory_path(data)
    directory_path(home / ".agents/skills")
    if codex:
        directory_path(codex)
    if exists(manifest_path) and (manifest_path.is_symlink() or not manifest_path.is_file()):
        raise ValueError(f"manifest conflict: {manifest_path}")
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else None
    skills_dir = home / ".agents/skills"
    if previous:
        if previous.get("schema") != 1 or previous.get("data") != str(data) or previous.get("skills_dir") != str(skills_dir):
            raise ValueError("ownership manifest has incompatible paths or schema")
        if codex and previous.get("codex_home") not in (None, str(codex)):
            raise ValueError("CODEX_HOME differs from the ownership manifest; use a fresh environment")
        generation = Path(previous["generation"])
        if generation.parent != data / "generations" or not re.fullmatch(r"[0-9a-f]{64}", generation.name):
            raise ValueError("invalid managed generation")
        directory_path(generation)
        if inventory(generation) != previous["inventory"]:
            raise ValueError(f"managed skill files were edited: {generation}")
        for value, target in previous["links"].items():
            path = Path(value)
            # A manifest can remove only skill links in this exact home and
            # an AGENTS.md link in the previously recorded Codex home.
            if path.parent != skills_dir and value != previous.get("agents_path"):
                raise ValueError(f"invalid managed destination: {value}")
            directory_path(path.parent)
            if not path.is_symlink() or os.readlink(path) != target:
                raise ValueError(f"managed path changed or missing: {path}")
            if absolute(target) != Path(target) or not Path(target).is_relative_to(generation):
                raise ValueError(f"invalid managed link target: {target}")
    elif data.exists() and any(data.iterdir()):
        raise ValueError(f"data directory exists without ownership manifest: {data}")
    old_links = previous["links"] if previous else {}
    if not codex and previous and previous.get("agents_path"):
        instructions = stage / "codex/AGENTS.md"
        instructions.parent.mkdir(exist_ok=True)
        shutil.copy2(old_links[previous["agents_path"]], instructions)
    contents = inventory(stage)
    generation = data / "generations" / digest(json.dumps(contents, sort_keys=True).encode())
    desired = {str(skills_dir / skill.name): str(generation / "skills" / skill.name)
               for skill in (stage / "skills").iterdir()}
    agents_path = str(codex / "AGENTS.md") if codex else None
    if codex and (not exists(codex / "AGENTS.md") or agents_path in old_links):
        desired[agents_path] = str(generation / "codex/AGENTS.md")
    elif codex:
        print(f"Preserving existing instructions without reading them: {codex / 'AGENTS.md'}")
        agents_path = None
    # Desktop skills refresh must not remove cloud instructions.
    if not codex and previous and previous.get("agents_path"):
        agents_path = previous["agents_path"]
        desired[agents_path] = str(generation / "codex/AGENTS.md")
    for value in desired:
        path = Path(value)
        if exists(path) and value not in old_links:
            raise ValueError(f"unmanaged skill conflict: {path}")
    config_path = codex / "config.toml" if codex else None
    create_config = config_path is not None and not exists(config_path)
    if config_path and not create_config:
        print(f"Preserving existing config without reading it: {config_path}")
    directory_path(generation.parent)
    if exists(generation):
        directory_path(generation)
        if inventory(generation) != contents:
            raise ValueError(f"generation conflict: {generation}")
    data.mkdir(parents=True, exist_ok=True)
    generation.parent.mkdir(exist_ok=True)
    new_generation = not generation.exists()
    if new_generation:
        with tempfile.TemporaryDirectory(prefix=".stage-", dir=data) as temp:
            pending = Path(temp) / "generation"
            shutil.copytree(stage, pending)
            os.rename(pending, generation)
    changed = []
    seeded = False
    try:
        for value in sorted(set(old_links) | set(desired)):
            path = Path(value)
            path.parent.mkdir(parents=True, exist_ok=True)
            if old_links.get(value) == desired.get(value):
                continue
            if value in desired:
                replace_link(path, desired[value])
            else:
                path.unlink()
            changed.append(value)
        if create_config:
            with config_path.open("xb") as file:
                seeded = True
                file.write(seed.read_bytes())
        for value, target in desired.items():
            path = Path(value)
            if not path.is_symlink() or os.readlink(path) != target or not path.exists():
                raise ValueError(f"post-install verification failed: {path}")
        if inventory(generation) != contents:
            raise ValueError("post-install generation verification failed")
        manifest = dict(schema=1, data=str(data), skills_dir=str(skills_dir), generation=str(generation),
                        inventory=contents, links=desired, agents_path=agents_path,
                        codex_home=str(codex) if codex else previous.get("codex_home") if previous else None, ref=ref)
        if manifest == previous:
            print(f"Verified {len(list((stage / 'skills').iterdir()))} skills; unchanged source {ref}")
            return
        with tempfile.NamedTemporaryFile(mode="w", dir=state, delete=False) as file:
            pending_manifest = Path(file.name)
            json.dump(manifest, file, indent=2, sort_keys=True)
            file.write("\n")
        try:
            os.replace(pending_manifest, manifest_path)
        finally:
            pending_manifest.unlink(missing_ok=True)
    except BaseException:
        for value in reversed(changed):
            path = Path(value)
            if value in old_links:
                replace_link(path, old_links[value])
            else:
                path.unlink(missing_ok=True)
        if seeded:
            config_path.unlink()
        if new_generation:
            shutil.rmtree(generation)
            if not any(generation.parent.iterdir()):
                generation.parent.rmdir()
            if not any(data.iterdir()):
                data.rmdir()
        raise
    print(f"Verified {len(list((stage / 'skills').iterdir()))} skills; source {ref}; manifest {manifest_path}")


def install(repo, apm, *, cloud=False, ref="local"):
    home = absolute(os.environ["HOME"])
    data = absolute(os.environ.get("XDG_DATA_HOME", str(home / ".local/share"))) / "dotfiles-agent-skills"
    state = absolute(os.environ.get("XDG_STATE_HOME", str(home / ".local/state"))) / "dotfiles-agent-skills"
    codex = absolute(os.environ.get("CODEX_HOME", str(home / ".codex"))) if cloud else None
    directory_path(home)
    with deployment_lock(state), tempfile.TemporaryDirectory(prefix="dotfiles-skills-") as temp:
        stage = build(repo, apm, Path(temp))
        if cloud:
            shutil.copytree(repo / "cloud/codex", stage / "codex")
        publish(stage, home=home, data=data, state=state, codex=codex,
                seed=repo / "cloud/codex/config.toml" if cloud else None, ref=ref)


def main():
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(143))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apm", default=shutil.which("apm"))
    args = parser.parse_args()
    if not args.apm:
        parser.error("APM is missing; run mise install github:microsoft/apm first")
    install(Path(__file__).resolve().parent.parent, absolute(args.apm))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(f"agent-skills: {error}", file=sys.stderr)
        sys.exit(1)
