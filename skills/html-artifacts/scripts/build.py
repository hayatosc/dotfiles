#!/usr/bin/env python3
"""Create a working offline HTML starter; never overwrite an existing document."""

import argparse
import html
import re
from datetime import date
from pathlib import Path

from check import ASSETS, CSP, CSS, PRINT, validate


def render(title, created):
    template = (ASSETS / "template.html").read_text(encoding="utf-8")
    replacements = {
        "TITLE": html.escape(title),
        "DATE": created,
        "DADS_CSP": html.escape(CSP, quote=True),
        "DADS_CSS": CSS,
        # PRINT already includes the newlines required for the CSP hash.
        "DADS_PRINT": PRINT[1:-1],
    }
    # A single pass prevents user text from becoming another template directive.
    return re.sub(r"@@([A-Z_]+)@@", lambda match: replacements[match[1]], template)


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("output", type=Path)
    cli.add_argument("--title", required=True)
    args = cli.parse_args()
    if not args.title.strip():
        cli.error("--title must not be empty")
    document = render(args.title, date.today().isoformat())
    errors = validate(document)
    if errors:
        cli.exit(1, "Invalid bundled starter:\n" + "\n".join(errors) + "\n")
    try:
        with args.output.open("x", encoding="utf-8") as output:
            output.write(document)
    except OSError as error:
        cli.exit(2, f"{args.output}: {error}\n")
    print(f"Created {args.output}; edit the content, then run scripts/check.py")


if __name__ == "__main__":
    main()
