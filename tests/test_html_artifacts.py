"""Regression tests for the offline HTML artifact contract (no desktop apply)."""

import importlib.util
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills/html-artifacts"
CSS = SKILL / "assets/dads.css"
BUILD = SKILL / "scripts/build.py"
CHECK = SKILL / "scripts/check.py"


class ArtifactTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("artifact_check", CHECK)
        assert spec is not None and spec.loader is not None
        cls.checker = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.checker)
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "日本語 document.html"
            subprocess.run(
                [sys.executable, str(BUILD), str(output), "--title", "検証用HTML"],
                check=True, capture_output=True, text=True,
            )
            cls.html = output.read_text()

    def assert_rejected(self, fragment, expected):
        document = self.html.replace("</main>", fragment + "</main>")
        errors = self.checker.validate(document)
        self.assertTrue(any(expected in error for error in errors), errors)

    def test_official_tokens(self):
        tokens = dict(re.findall(r"(--[\w-]+):\s*([^;]+);", CSS.read_text()))
        self.assertEqual(tokens.get("--color-key-900"), "var(--color-primitive-blue-900)")
        self.assertEqual(tokens.get("--color-primitive-blue-900"), "#0017c1")
        self.assertEqual(tokens.get("--color-neutral-solid-gray-536"), "#767676")
        self.assertEqual(tokens.get("--font-size-36"), "2.25rem")

    def test_badge_text_contrast(self):
        css = CSS.read_text()
        tokens = dict(re.findall(r"(--[\w-]+):\s*([^;]+);", css))

        def luminance(value):
            while value.startswith("var("):
                value = tokens[value[4:-1]]
            self.assertRegex(value, r"^#[0-9a-fA-F]{6}$")
            channels = [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)]
            linear = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in channels]
            return sum(v * w for v, w in zip(linear, (0.2126, 0.7152, 0.0722)))

        for variant in ("success", "error", "warning", "info", "neutral"):
            with self.subTest(variant=variant):
                match = re.search(r"\.dads-badge--" + variant + r"\s*\{([^}]+)\}", css)
                assert match is not None, f"Missing badge variant: {variant}"
                declarations = dict(re.findall(r"([\w-]+):\s*([^;]+);", match[1]))
                dark, light = sorted(luminance(declarations[prop]) for prop in ("color", "background"))
                self.assertGreaterEqual((light + 0.05) / (dark + 0.05), 4.5)

    def test_build_is_offline_and_checkable(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "artifact.html"
            built = subprocess.run(
                [sys.executable, str(BUILD), str(output), "--title", "Offline <DADS>"],
                capture_output=True, text=True,
            )
            self.assertEqual(built.returncode, 0, built.stderr)
            html = output.read_text()
            self.assertIn(CSS.read_text(), html)
            self.assertIn("Offline &lt;DADS&gt;", html)
            self.assertIn('name="color-scheme" content="only light"', html)
            self.assertNotIn("@@DADS_CSS@@", html)
            checked = subprocess.run(
                [sys.executable, str(CHECK), str(output)], capture_output=True, text=True,
            )
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)

    def test_no_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "existing.html"
            output.write_text("Keep my work")
            result = subprocess.run(
                [sys.executable, str(BUILD), str(output), "--title", "New"],
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 2)
            self.assertEqual(output.read_text(), "Keep my work")

    def test_reject_resources_and_active_content(self):
        cases = [
            ('<link rel="stylesheet" href="https://cdn.example/a.css">', "<link>"),
            ('<img src="file:///tmp/a.png" alt="test">', "src must"),
            ('<img src="./a.png" alt="test">', "src must"),
            ('<img src="//cdn.example/a.png" alt="test">', "src must"),
            ('<img srcset="a.png 1x" alt="test">', "srcset"),
            ('<img src="data:image/svg+xml;base64,AAA=" alt="test">', "src must"),
            ('<script>fetch("https://example.com")</script>', "print script"),
            ('<script src="https://example.com/a.js"></script>', "src must"),
            ('<iframe srcdoc="hello"></iframe>', "<iframe>"),
            ('<meta http-equiv="refresh" content="0;url=https://example.com">', "http-equiv"),
            ('<base href="https://example.com">', "<base>"),
            ('<svg><use href="sprite.svg#icon"/></svg>', "ordinary web"),
            ('<a href="javascript:alert(1)">bad</a>', "ordinary web"),
            ('<a href="https://example.com" ping="https://tracker.example">bad</a>', "ping"),
            ('<p onclick="alert(1)">bad</p>', "onclick"),
            ('<form action="https://example.com"></form>', "<form>"),
            ('<svg><set attributeName="href" to="https://example.com/a.svg"/></svg>', "<set>"),
        ]
        for fragment, expected in cases:
            with self.subTest(fragment=fragment):
                self.assert_rejected(fragment, expected)

    def test_reject_style_drift(self):
        cases = [
            ('<p class="dads-card__heading">bad</p>', "unknown classes"),
            ('<p style="color:var(--key-900)">old alias</p>', "unknown tokens"),
            ('<p style="color:var(--not-defined, red)">bad</p>', "unknown tokens"),
            ('<style>.invented { color: red; }</style>', "artifact- prefix"),
            ('<style>:root { --text: red; }</style>', "override tokens"),
            ('<p style="--text:red">bad</p>', "override tokens"),
            ('<style>@import "https://example.com/a.css";</style>', "imports"),
            ('<style>@font-face {font-family:X;src:url(font.woff2)}</style>', "web fonts"),
            ('<p style="background:url(https://example.com/a.png)">bad</p>', "inline fragment"),
            ('<svg><path fill="URL(https://example.com/a.svg)"/></svg>', "inline fragment"),
            ('<p style="background:image-set(\'https://example.com/a.png\' 1x)">bad</p>', "image-set"),
            ('<p style="background:-webkit-image-set(\'a.png\' 1x)">bad</p>', "image-set"),
            ('<p style="background:u\\72l(//example.com/a.png)">bad</p>', "escapes"),
        ]
        for fragment, expected in cases:
            with self.subTest(fragment=fragment):
                self.assert_rejected(fragment, expected)

    def test_reject_missing_or_changed_bundled_assets(self):
        cases = [
            (self.html.replace(CSS.read_text(), ""), "unchanged bundled dads.css"),
            (self.html.replace("#0017c1", "#0017c2"), "unchanged bundled dads.css"),
            (self.html.replace('id="dads-css"', 'id="dads-css" media="print"'), "style attributes"),
            (self.html.replace('id="dads-print"', 'id="dads-print" type="text/plain"'), "script attributes"),
            (self.html.replace("default-src &#x27;none&#x27;", "default-src *"), "CSP"),
            (self.html.replace('name="viewport"', 'name="removed"'), "viewport"),
            (self.html.replace('<meta charset="utf-8">', ''), "charset"),
            (self.html.replace('content="only light"', 'content="light dark"'), "scheme"),
            (self.html.replace("<title>検証用HTML</title>", "<title></title>"), "nonempty title"),
        ]
        for document, expected in cases:
            with self.subTest(expected=expected):
                errors = self.checker.validate(document)
                self.assertTrue(any(expected in error for error in errors), errors)

    def test_reject_unresolved_content_and_references(self):
        for fragment, expected in [
            ("<p>@@DADS_CSS@@</p>", "placeholder"),
            ('<p id="overview">duplicate</p>', "duplicate id"),
            ('<a href="#missing">broken</a>', "unresolved fragment"),
            ('<svg role="img" aria-labelledby="missing-title"></svg>', "unresolved fragment"),
            ('<details><summary>closed</summary><p>print</p></details>', "start open"),
            ('<a class="dads-button" href="#main">unstyled</a>', "modifier"),
            ('<button>does nothing</button>', "unimplemented button"),
            ('<span class="dads-badge--success">missing base</span>', "needs base class"),
            ('<style>.artifact-arrow { marker-end: URL(#missing-marker); }</style>', "unresolved fragment"),
        ]:
            with self.subTest(fragment=fragment):
                self.assert_rejected(fragment, expected)

    def test_reject_csp_outside_head(self):
        document = self.html.replace('<head>', '').replace('</head>', '')
        self.assertTrue(any("metadata must be in head" in error for error in self.checker.validate(document)))

    def test_allow_explicit_extensions_and_inert_links(self):
        fragment = '''
        <style id="artifact-css">.artifact-note { color: var(--text); }</style>
        <p class="artifact-note">Custom scoped content</p>
        <img alt="Embedded pixel" src="data:image/png;base64,iVBORw0KGgo=">
        <a href="https://example.com">Source (online)</a>
        <svg><defs><marker id="local-marker"/></defs>
        <path marker-end="url(#local-marker)" stroke="var(--color-key-900)"/></svg>
        '''
        document = self.html.replace("</main>", fragment + "</main>")
        self.assertEqual(self.checker.validate(document), [])

    def test_cli_failure_exit(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "bad.html"
            output.write_text("<p>Not a document</p>")
            result = subprocess.run(
                [sys.executable, str(CHECK), str(output)], capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 1)
            self.assertIn("FAIL:", result.stderr)
            missing = subprocess.run(
                [sys.executable, str(CHECK), str(output.with_name("missing.html"))],
                capture_output=True, text=True,
            )
            self.assertEqual(missing.returncode, 2)


if __name__ == "__main__":
    unittest.main()
