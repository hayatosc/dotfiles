#!/usr/bin/env python3
"""Select a dedicated writable dot-cloud HOME once; future updates use chezmoi apply."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--home', type=Path, required=True)
parser.add_argument('--state', type=Path, required=True)
args = parser.parse_args()
for label, directory in [('home', args.home), ('state', args.state)]:
    if not directory.is_absolute() or '..' in directory.parts:
        raise SystemExit(f'{label} must be an explicit absolute path')
    for ancestor in [directory, *directory.parents]:
        if ancestor.is_symlink():
            raise SystemExit(f'Refusing symlink in {label} path: {ancestor}')
    if directory in (Path('/'), Path('/home/agent')) or '.codex' in directory.parts:
        raise SystemExit('Use a dedicated writable home/state, not the managed runtime home')
if args.home == args.state or args.home.is_relative_to(args.state) or args.state.is_relative_to(args.home):
    raise SystemExit('Home and state must be separate non-nested directories')
config = args.home / '.config/chezmoi/chezmoi.toml'
quote = lambda value: json.dumps(str(value))
config_text = '\n'.join([
    '# Explicit dot cloud profile, created by the repository bootstrap.',
    f'sourceDir = {quote(ROOT)}',
    f'destDir = {quote(args.home)}',
    f'cacheDir = {quote(args.state / "chezmoi-cache")}',
    f'persistentState = {quote(args.state / "chezmoi-state.boltdb")}',
    '', '[data]', 'profile = "dot-cloud"',
    f'dotCloudStateDir = {quote(args.state)}', '',
])
for path in [config, config.parent, config.parent.parent]:
    if path.is_symlink():
        raise SystemExit(f'Refusing symlink config path: {path}')
if config.exists() and config.read_text() != config_text:
    raise SystemExit(f'Preserving existing configuration: {config}')
args.home.mkdir(parents=True, exist_ok=True)
args.state.mkdir(parents=True, exist_ok=True)
subprocess.run([sys.executable, str(ROOT / 'profiles/dot-cloud/apply.py'), 'tools', '--home', str(args.home), '--state', str(args.state)], check=True)
if not config.exists():
    config.parent.mkdir(parents=True, exist_ok=True)
    with config.open('x') as stream:
        stream.write(config_text)
    config.chmod(0o600)
env = os.environ | {
    'HOME': str(args.home),
    'XDG_CONFIG_HOME': str(args.home / '.config'),
    'XDG_CACHE_HOME': str(args.state / 'cache'),
    'XDG_DATA_HOME': str(args.home / '.local/share'),
    'XDG_STATE_HOME': str(args.state),
}
subprocess.run([str(args.home / '.local/bin/chezmoi'), 'apply', '--no-tty', '--error-on-conflict'], env=env, check=True)
print(f'Ready: {args.home}/.local/bin/dot-shell')
print('Inside that shell, use: chezmoi apply')
