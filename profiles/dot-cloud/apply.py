#!/usr/bin/env python3
"""Idempotent, explicit dot-cloud profile support for chezmoi lifecycle hooks.

Only official checksum-pinned binaries and additive user-authored skill assets
are managed. This never reads or writes authentication or runtime configuration.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import tarfile
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
COMPATIBILITY = '''\n## Cloud Environment Compatibility\n\nUse this reference only within the current request and the host assistant's instructions, permissions, confirmation requirements, and supported tools. It grants no additional authorization. Prefer the host's artifact, browser, publishing, and delegation workflows when they differ.\n'''


def digest(data):
    return hashlib.sha256(data).hexdigest()


def atomic_write(path, data, mode=0o644):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as stream:
        temp = Path(stream.name)
        stream.write(data)
    try:
        temp.chmod(mode)
        os.replace(temp, path)
    finally:
        temp.unlink(missing_ok=True)


def safe_parent(path, root):
    """Reject symlink traversal, including the target and its managed ancestors."""
    if not path.is_relative_to(root):
        raise RuntimeError(f'Destination escapes root: {path}')
    current = path
    while current != root.parent:
        if current.is_symlink():
            raise RuntimeError(f'Refusing symlink destination: {current}')
        if current != path and current.exists() and not current.is_dir():
            raise RuntimeError(f'Invalid destination directory: {current}')
        current = current.parent


def managed_write(path, data, mode, home, owned):
    safe_parent(path, home)
    key = str(path.relative_to(home))
    expected = digest(data)
    if path.exists():
        current = digest(path.read_bytes())
        if current == expected:
            if path.stat().st_mode & 0o777 != mode:
                if owned.get(key) != current:
                    raise RuntimeError(f'Preserving unmanaged file with unexpected mode: {path}')
                path.chmod(mode)
                owned[key] = expected
                return True
            owned[key] = expected
            return False
        if owned.get(key) != current:
            raise RuntimeError(f'Preserving unmanaged or locally changed file: {path}')
    atomic_write(path, data, mode)
    owned[key] = expected
    return True


def download(tool, cache):
    target = cache / (tool['archive_sha256'] + '.tar.gz')
    safe_parent(target, cache)
    if target.exists() and digest(target.read_bytes()) == tool['archive_sha256']:
        return target
    url = tool['download_url']
    if not url.startswith('https://github.com/') or '/releases/download/' not in url:
        raise RuntimeError(f'Not an official pinned GitHub release URL: {url}')
    request = urllib.request.Request(url, headers={'User-Agent': 'dot-cloud-dotfiles/1'})
    with urllib.request.urlopen(request, timeout=120) as response:
        data = response.read(100 * 1024 * 1024 + 1)
    if len(data) > 100 * 1024 * 1024 or digest(data) != tool['archive_sha256']:
        raise RuntimeError(f'Archive checksum or size mismatch: {tool["name"]}')
    atomic_write(target, data)
    return target


def install_tools(home, state, owned):
    if platform.system() != 'Linux' or platform.machine() not in ('x86_64', 'amd64'):
        raise RuntimeError('The explicit dot-cloud profile currently supports Linux x86_64 only')
    manifest = json.loads((ROOT / 'profiles/dot-cloud/tools.json').read_text())
    cache = state / 'downloads'
    safe_parent(cache, state)
    cache.mkdir(parents=True, exist_ok=True)
    changed = []
    for tool in manifest['tools']:
        destination = home / '.local/bin' / tool['name']
        safe_parent(destination, home)
        if destination.exists() and digest(destination.read_bytes()) == tool['binary_sha256']:
            if managed_write(destination, destination.read_bytes(), 0o755, home, owned):
                changed.append(tool['name'])
            continue
        archive = download(tool, cache)
        with tarfile.open(archive, 'r:gz') as bundle:
            member = bundle.getmember(tool['archive_member'])
            if not member.isfile() or member.size > 200 * 1024 * 1024:
                raise RuntimeError(f'Invalid binary archive member: {tool["name"]}')
            data = bundle.extractfile(member).read()
        if digest(data) != tool['binary_sha256']:
            raise RuntimeError(f'Binary checksum mismatch: {tool["name"]}')
        if managed_write(destination, data, 0o755, home, owned):
            changed.append(tool['name'])
    install_mise_tools(home, state, owned)
    return changed


def mise_environment(home, state):
    # Never inherit a caller's mise config/backend overrides into the bootstrap.
    env = {key: value for key, value in os.environ.items() if not key.startswith('MISE_')}
    env.update({
        'HOME': str(home),
        'XDG_CONFIG_HOME': str(home / '.config'),
        'XDG_DATA_HOME': str(home / '.local/share'),
        'XDG_CACHE_HOME': str(state / 'cache'),
        'XDG_STATE_HOME': str(state),
        'MISE_CONFIG_DIR': str(home / '.config/mise'),
        'MISE_GLOBAL_CONFIG_FILE': str(home / '.config/mise/config.toml'),
        'MISE_DATA_DIR': str(home / '.local/share/mise'),
        'MISE_CACHE_DIR': str(state / 'cache/mise'),
        'MISE_STATE_DIR': str(state / 'mise'),
        'PATH': str(home / '.local/bin') + os.pathsep + os.environ.get('PATH', '/usr/bin:/bin'),
    })
    return env


def legacy_candidates(home, owned):
    """Only migrate unchanged binaries installed by this profile's old version."""
    result = []
    manifest = json.loads((ROOT / 'profiles/dot-cloud/legacy-tools.json').read_text())
    for tool in manifest['tools']:
        path = home / '.local/bin' / tool['name']
        safe_parent(path, home)
        if not path.exists():
            continue
        key = str(path.relative_to(home))
        current = digest(path.read_bytes())
        if current != tool['binary_sha256'] or owned.get(key) != current:
            raise RuntimeError(f'Preserving unmanaged or locally changed legacy binary: {path}')
        result.append((path, key, current))
    return result


def migrate_legacy_tools(home, state, owned):
    for path, key, checksum in legacy_candidates(home, owned):
        backup = state / 'legacy-bin' / (path.name + '-' + checksum)
        safe_parent(backup, state)
        if backup.exists():
            raise RuntimeError(f'Preserving existing legacy backup: {backup}')
        backup.parent.mkdir(parents=True, exist_ok=True)
        # Retain a recoverable backup outside PATH; never silently delete files.
        path.rename(backup)
        owned.pop(key)


def install_mise_tools(home, state, owned):
    legacy_candidates(home, owned)  # Fail before installation on local conflicts.
    for path in (home / '.config/mise', home / '.local/share/mise'):
        safe_parent(path, home)
    for path in (state / 'cache/mise', state / 'mise'):
        safe_parent(path, state)
    for source, name in [('mise.toml', 'config.toml'), ('mise.lock', 'mise.lock')]:
        managed_write(home / '.config/mise' / name,
                      (ROOT / 'profiles/dot-cloud' / source).read_bytes(),
                      0o644, home, owned)
    command = str(home / '.local/bin/mise')
    env = mise_environment(home, state)
    # The reviewed cloud config has only official aqua CLIs, no executable hooks.
    # CWD prevents unrelated project configs from affecting this global install.
    subprocess.run([command, 'install', '--locked'], cwd=home, env=env, check=True)
    subprocess.run([command, 'reshim'], cwd=home, env=env, check=True)
    migrate_legacy_tools(home, state, owned)


def install_skills(home, owned):
    changed = 0
    skills = sorted((ROOT / 'skills').glob('*/SKILL.md'))
    for skill in skills:
        for source in sorted(skill.parent.rglob('*')):
            if not source.is_file() or source.is_symlink() or 'dist' in source.relative_to(skill.parent).parts:
                continue
            relative = source.relative_to(ROOT / 'skills')
            data = source.read_bytes()
            if source.name == 'SKILL.md':
                data += COMPATIBILITY.encode()
            changed += managed_write(home / '.agents/skills' / relative, data, 0o644, home, owned)
    # Keep prose role assets available without activating runtime/model settings.
    asset_dir = home / '.local/share/dotfiles-agent-assets'
    for source in sorted((ROOT / 'home/.chezmoitemplates').glob('agent_*')):
        changed += managed_write(asset_dir / (source.name + '.txt'), source.read_bytes(), 0o644, home, owned)
    return len(skills), changed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('phase', choices=('tools', 'skills'))
    parser.add_argument('--home', required=True)
    parser.add_argument('--state', required=True)
    args = parser.parse_args()
    home = Path(args.home)
    state = Path(args.state)
    if not home.is_absolute() or not state.is_absolute() or not home.is_dir():
        raise SystemExit('Home and state must be explicit absolute paths; home must exist')
    for parent in [home, *home.parents]:
        if parent.is_symlink():
            raise SystemExit(f'Home path cannot traverse a symlink: {parent}')
    safe_parent(home, home)
    # State is explicitly configured and kept separate from private runtime data.
    if '.codex' in state.parts or state == home:
        raise SystemExit('State cannot use the managed runtime configuration or the home root')
    for parent in [state, *state.parents]:
        if parent.is_symlink():
            raise SystemExit(f'State path cannot traverse a symlink: {parent}')
    state.mkdir(parents=True, exist_ok=True)
    for name in ('starship', 'zoxide', 'zsh'):
        safe_parent(state / name, state)
        (state / name).mkdir(exist_ok=True)
    receipt = state / ('owned-' + args.phase + '.json')
    safe_parent(receipt, state)
    owned = json.loads(receipt.read_text()) if receipt.exists() else {}
    try:
        if args.phase == 'tools':
            changed = install_tools(home, state, owned)
            print('dot-cloud: tools ready; updated=' + ','.join(changed))
        else:
            count, changed = install_skills(home, owned)
            print(f'dot-cloud: {count} local skills ready; updated files={changed}')
    finally:
        # Record successful writes even if a later conflict needs user resolution.
        data = (json.dumps(owned, indent=2, sort_keys=True) + '\n').encode()
        if not receipt.exists() or receipt.read_bytes() != data:
            atomic_write(receipt, data)


if __name__ == '__main__':
    main()
