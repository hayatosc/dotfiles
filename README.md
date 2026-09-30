# dotfiles

# Installation

## Prerequirements

- git
- chezmoi
- zsh
- mise

## Install

```
chezmoi init https://github.com/hayatosc/dotfiles
chezmoi apply

mise install
```

## Docs

- [Codex config](docs/codex.md)
- [AI Agents Environment](docs/agents.md)
- [Python Execution Wrappers](docs/python.md)

## dot cloud environment

For dot’s managed cloud computer, use the explicit [dot-cloud profile](profiles/dot-cloud/README.md). After its one-time profile selection, `chezmoi apply` installs the guarded shell configuration, pinned tools, and additive local skills. Other environments retain the default setup above.
