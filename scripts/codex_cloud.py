"""Bootstrap only the pinned libraries/tools needed for the cloud installer."""

import argparse
import hashlib
import importlib.util
from pathlib import Path
import platform
import re
import signal
import subprocess
import sys
import tarfile
import tempfile
import tomllib


def download(url, destination, checksum):
    subprocess.run(
        ["curl", "-q", "--fail", "--show-error", "--silent", "--location",
         "--proto", "=https", "--proto-redir", "=https", url, "-o", str(destination)],
        check=True,
    )
    actual = hashlib.sha256(destination.read_bytes()).hexdigest()
    if checksum != f"sha256:{actual}":
        raise ValueError(f"checksum mismatch: {url}")


def extract(archive, destination):
    # Official release archives need only regular files and directories.
    with tarfile.open(archive) as bundle:
        for member in bundle.getmembers():
            path = Path(member.name)
            if path.is_absolute() or ".." in path.parts or not (member.isfile() or member.isdir()):
                raise ValueError(f"unsafe archive member: {member.name}")
        bundle.extractall(destination, filter="data")


def main():
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(143))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ref", required=True)
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-f]{40}", args.ref):
        parser.error("--ref must be an immutable 40-character commit SHA")
    repo = Path(__file__).resolve().parent.parent
    arch = {"x86_64": "x64", "aarch64": "arm64"}.get(platform.machine())
    if platform.system() != "Linux" or arch is None:
        raise ValueError("supported platforms: Linux x86_64 / aarch64 with glibc")
    mise_dir = repo / "home/dot_config/mise"
    config = tomllib.loads((mise_dir / "config.toml").read_text())
    lock = tomllib.loads((mise_dir / "mise.lock").read_text())
    apm = lock["tools"]["github:microsoft/apm"][0]
    version = config["tools"]["github:microsoft/apm"].removeprefix("v")
    if apm["version"] != version:
        raise ValueError("APM mise config and lock disagree")
    release = apm[f"platforms.linux-{arch}"]
    expected_url = f"https://github.com/microsoft/apm/releases/download/v{version}/apm-linux-{'x86_64' if arch == 'x64' else 'arm64'}.tar.gz"
    if release["url"] != expected_url:
        raise ValueError("APM must come from its official pinned GitHub release")

    # PyYAML is already a repository dependency. Use its pinned pure Python
    # source from uv.lock without pip, uv, a new runtime, or a global install.
    uv_lock = tomllib.loads((repo / "uv.lock").read_text())
    yaml_package = next(p for p in uv_lock["package"] if p["name"] == "pyyaml")
    yaml_source = yaml_package["sdist"]
    if not yaml_source["url"].startswith("https://files.pythonhosted.org/"):
        raise ValueError("PyYAML must come from official PyPI")
    with tempfile.TemporaryDirectory(prefix="codex-cloud-tools-") as temp:
        temp = Path(temp)
        download(yaml_source["url"], temp / "yaml.tar.gz", yaml_source["hash"])
        extract(temp / "yaml.tar.gz", temp / "yaml")
        sys.path.insert(0, str(temp / "yaml" / f"pyyaml-{yaml_package['version']}" / "lib"))
        download(release["url"], temp / "apm.tar.gz", release["checksum"])
        extract(temp / "apm.tar.gz", temp / "apm")
        binary = temp / "apm" / f"apm-linux-{'x86_64' if arch == 'x64' else 'arm64'}" / "apm"
        spec = importlib.util.spec_from_file_location("agent_skills", repo / "scripts/agent_skills.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        module.install(repo, binary, cloud=True, ref=args.ref)


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(f"codex-cloud: {error}", file=sys.stderr)
        sys.exit(1)
