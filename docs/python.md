# Python Execution Wrappers

This dotfiles repository implements a custom Python executable wrapper to seamlessly route python commands through `uv run` for robust environment isolation and project-local dependency resolution.

The source files are located at:
- [home/dot_local/bin/executable_python](file:///home/hayato/.local/share/chezmoi/home/dot_local/bin/executable_python) (symlinked to `/home/hayato/.local/bin/python` and `/home/hayato/.local/bin/python3`)

---

## 1. How It Works

When running `python` or `python3`:
- **Inside a Project**: If a `pyproject.toml` or `uv.lock` is found in the current or any parent directory, `python` executes within that project environment using `uv run`.
- **Outside a Project**: If executed outside of a project, the script runs in an isolated sandbox (`uv run --no-project`).
- **Heredocs & Pipes**: Piping input (e.g. `cat script.py | python`) automatically translates to `uv run --script -`. This supports PEP 723 inline script metadata.
- **-c flag**: Executing one-off statements (e.g. `python -c "import sys; print(sys.path)"`) runs inside the uv container context.

---

## 2. Environment Variables

You can customize the wrapper's execution behavior using the following environment variables:

### `PYTHON_WITH`
Specify packages to inject on the fly as temporary dependencies.
```bash
# Runs the script with 'requests' and 'rich' available
PYTHON_WITH="requests rich" python script.py
```

### `PYTHON_UV`
Set to `0` to completely bypass the wrapper and run the system python directly.
```bash
PYTHON_UV=0 python script.py
```

### `PYTHON_OFFLINE`
Set to `1` to run `uv` in offline mode (using cached packages only).
```bash
PYTHON_OFFLINE=1 python script.py
```

---

## 3. Disallowed Operations
Since the python environment is managed by `uv`, running `python -m pip install <pkg>` will fail with an error hint instructing you to use `uv add` or `PYTHON_WITH` instead.
