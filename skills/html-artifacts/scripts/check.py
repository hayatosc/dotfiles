#!/usr/bin/env python3
"""Check the offline artifact contract using only the Python standard library.

This is a conservative authoring check, not a general HTML/CSS validator or a
sanitizer for untrusted HTML. The CSP is a second guard against network loads.
"""

import argparse
import base64
import hashlib
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote


ASSETS = Path(__file__).resolve().parents[1] / "assets"
CSS = (ASSETS / "dads.css").read_text(encoding="utf-8")
PRINT = "\n" + (ASSETS / "print.js").read_text(encoding="utf-8") + "\n"
PRINT_HASH = base64.b64encode(hashlib.sha256(PRINT.encode()).digest()).decode()
CSP = (
    "default-src 'none'; style-src 'unsafe-inline'; img-src data:; "
    f"script-src 'sha256-{PRINT_HASH}'; base-uri 'none'; form-action 'none'"
)
TOKEN = re.compile(r"var\(\s*(--[a-zA-Z_][\w-]*)", re.I)
CLASS = re.compile(r"\.([a-zA-Z_][\w-]*)")
COMMENTS = re.compile(r"/\*.*?\*/", re.S)
KNOWN_TOKENS = set(re.findall(r"(--[\w-]+)\s*:", CSS))
KNOWN_CLASSES = set(CLASS.findall(COMMENTS.sub("", CSS)))
RASTER = re.compile(r"data:image/(?:png|jpeg|gif|webp);base64,[a-zA-Z0-9+/=\s]+\Z")


class ArtifactParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.errors = []
        self.styles = []
        self.scripts = []
        self.capture = None
        self.ids = set()
        self.references = []
        self.classes = set()
        self.inline_styles = []
        self.policy_seen = False
        self.viewport = False
        self.charset = False
        self.scheme = False
        self.language = False
        self.main = 0
        self.h1 = 0
        self.doctype = False
        self.title_text = ""
        self.in_title = False
        self.in_head = False

    def fail(self, message):
        self.errors.append(f"line {self.getpos()[0]}: {message}")

    def handle_decl(self, decl):
        self.doctype = decl.lower() == "doctype html"

    def handle_starttag(self, tag, attrs):
        pairs = attrs
        attrs = dict(pairs)
        if len(attrs) != len(pairs):
            self.fail("duplicate attributes")
        if tag in {"base", "link", "iframe", "object", "embed", "form", "animate", "animatemotion", "animatetransform", "set"}:
            self.fail(f"<{tag}> is outside the offline document contract")
        if tag == "html":
            self.language = bool(attrs.get("lang"))
        if tag == "main":
            self.main += 1
        if tag == "h1":
            self.h1 += 1
        if tag == "head":
            self.in_head = True
        if tag == "title" and self.in_head:
            self.in_title = True
        if tag == "meta":
            if not self.in_head:
                self.fail("metadata must be in head")
            if "charset" in attrs:
                self.charset = (attrs["charset"] or "").lower() == "utf-8"
            name = (attrs.get("name") or "").lower()
            equiv = (attrs.get("http-equiv") or "").lower()
            content = attrs.get("content", "")
            if equiv == "content-security-policy":
                if self.policy_seen or content != CSP:
                    self.fail("CSP must match the bundled offline policy exactly")
                self.policy_seen = True
            elif equiv:
                self.fail(f"unsupported http-equiv: {equiv}")
            if name == "viewport":
                self.viewport = content == "width=device-width, initial-scale=1"
            if name == "color-scheme":
                self.scheme = content == "only light"
        if tag in {"style", "script"}:
            if tag == "script" and attrs != {"id": "dads-print"}:
                self.fail("print script attributes must be unchanged")
            if attrs.get("id") == "dads-css" and attrs != {"id": "dads-css"}:
                self.fail("bundled style attributes must be unchanged")
            if not self.policy_seen:
                self.fail("CSP must precede styles and scripts")
            self.capture = (tag, attrs.get("id"), [])
        identifier = attrs.get("id")
        if identifier:
            if identifier in self.ids:
                self.fail(f"duplicate id: {identifier}")
            self.ids.add(identifier)
        element_classes = self.classes_for(attrs)
        self.classes.update(element_classes)
        for class_name in element_classes:
            if class_name.startswith("dads-") and "--" in class_name:
                base = class_name.split("--", 1)[0]
                if base not in element_classes:
                    self.fail(f"modifier {class_name} needs base class {base}")
        for name, raw in pairs:
            value = raw or ""
            if name.startswith("on") or name in {"srcdoc", "srcset", "ping", "action", "formaction", "poster", "background", "manifest"}:
                self.fail(f"unsupported active/resource attribute: {name}")
            if name == "src" and not (tag == "img" and RASTER.fullmatch(value)):
                self.fail("src must be an embedded raster image on <img>")
            if name in {"href", "xlink:href"}:
                if value.startswith("#"):
                    self.references.append(unquote(value[1:]))
                elif tag != "a" or not re.match(r"^(?:https?://|mailto:|tel:)", value, re.I):
                    self.fail("only fragment references and ordinary web/mail/phone links are allowed")
            if name in {"aria-labelledby", "aria-describedby", "for"}:
                self.references.extend(value.split())
            if re.search(r"(?:var|url|image(?:-set)?)\(", value, re.I) or name == "style":
                self.inline_styles.append(value)
        if tag == "img" and "alt" not in attrs:
            self.fail("img needs alt text (empty for decoration)")
        if tag == "button" and "disabled" not in attrs:
            self.fail("use native links/disclosures, not an unimplemented button")
        if tag == "details" and "open" not in attrs:
            self.fail("details must start open for no-script printing")
        if "dads-button" in (attrs.get("class") or "").split():
            if not self.classes_for(attrs) & {"dads-button--solid", "dads-button--outline"}:
                self.fail("dads-button needs a solid or outline modifier")
            if attrs.get("aria-disabled"):
                self.fail("use a native disabled button, not aria-disabled alone")

    @staticmethod
    def classes_for(attrs):
        return set((attrs.get("class") or "").split())

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False
        if tag == "title":
            self.in_title = False
        if self.capture and tag == self.capture[0]:
            kind, identifier, parts = self.capture
            (self.styles if kind == "style" else self.scripts).append((identifier, "".join(parts)))
            self.capture = None

    def handle_data(self, data):
        if self.capture:
            self.capture[2].append(data)
        if self.in_title:
            self.title_text += data


def check_css(text):
    """Conservative checks; escapes are intentionally unsupported in authored CSS."""
    errors = []
    text = COMMENTS.sub("", text)
    if "\\" in text or re.search(r"@(?:import|font-face|namespace)\b", text, re.I):
        errors.append("CSS escapes, imports, web fonts and namespaces are not allowed")
    if re.search(r"(?:-webkit-)?image(?:-set)?\(", text, re.I):
        errors.append("CSS image()/image-set() resources are unsupported; use embedded img")
    for target in re.findall(r"url\(\s*([^)]*)\)", text, re.I):
        if not target.strip(" \t\r\n\"'").startswith("#"):
            errors.append("CSS/SVG url() must reference an inline fragment")
    unknown = set(TOKEN.findall(text)) - KNOWN_TOKENS
    if unknown:
        errors.append("unknown tokens: " + ", ".join(sorted(unknown)))
    return errors


def validate(html):
    parser = ArtifactParser()
    parser.feed(html)
    parser.close()
    errors = parser.errors
    if not all((parser.doctype, parser.language, parser.charset, parser.viewport, parser.scheme, parser.policy_seen)):
        errors.append("require HTML doctype, lang, UTF-8 charset, viewport, only-light scheme and offline CSP")
    if parser.main != 1 or parser.h1 != 1 or not parser.title_text.strip():
        errors.append("require one main, one h1 and a nonempty title")
    if re.search(r"@@[A-Z_]+@@|\b(?:TODO|TBD|YYYY-MM-DD)\b", html):
        errors.append("unresolved template placeholder")
    canonical = [(name, css) for name, css in parser.styles if name == "dads-css"]
    if len(canonical) != 1 or canonical[0][1].strip() != CSS.strip():
        errors.append("inline <style id=\"dads-css\"> must contain the unchanged bundled dads.css")
    extra = [css for name, css in parser.styles if name != "dads-css"]
    extra_css = COMMENTS.sub("", "\n".join(extra))
    if re.search(r"--[\w-]+\s*:", extra_css + "\n" + "\n".join(parser.inline_styles)):
        errors.append("do not define or override tokens outside the bundled stylesheet")
    custom = set(CLASS.findall(extra_css))
    if any(not name.startswith("artifact-") and name not in KNOWN_CLASSES for name in custom):
        errors.append("custom CSS classes must use the artifact- prefix")
    unknown_classes = parser.classes - KNOWN_CLASSES - custom
    if unknown_classes:
        errors.append("unknown classes: " + ", ".join(sorted(unknown_classes)))
    for css in [CSS, *extra, *parser.inline_styles]:
        errors.extend(check_css(css))
        parser.references.extend(
            unquote(target.strip(" \t\r\n\"'")[1:])
            for target in re.findall(r"url\(\s*([^)]*)\)", COMMENTS.sub("", css), re.I)
            if target.strip(" \t\r\n\"'").startswith("#")
        )
    if parser.scripts != [("dads-print", PRINT)]:
        errors.append("only the unchanged bundled print script is allowed")
    missing = set(parser.references) - parser.ids
    if missing:
        errors.append("unresolved fragment/label ids: " + ", ".join(sorted(missing)))
    return list(dict.fromkeys(errors))


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("html", type=Path)
    args = cli.parse_args()
    try:
        errors = validate(args.html.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, ValueError) as error:
        cli.exit(2, f"{args.html}: {error}\n")
    if errors:
        print("\n".join(f"FAIL: {error}" for error in errors), file=sys.stderr)
        return 1
    print(f"OK: {args.html} (inline assets, known classes/tokens, offline policy)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
