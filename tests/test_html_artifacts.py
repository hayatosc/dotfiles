"""Regression tests for the offline HTML artifact contract (no desktop apply)."""

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
    def test_official_tokens(self):
        tokens = dict(re.findall(r"(--[\w-]+):\s*([^;]+);", CSS.read_text()))
        self.assertEqual(tokens.get("--color-key-900"), "var(--color-primitive-blue-900)")
        self.assertEqual(tokens.get("--color-primitive-blue-900"), "#0017c1")
        self.assertEqual(tokens.get("--color-neutral-solid-gray-536"), "#767676")
        self.assertEqual(tokens.get("--font-size-36"), "2.25rem")

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


if __name__ == "__main__":
    unittest.main()
