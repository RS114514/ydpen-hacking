import runpy
import unittest
from pathlib import Path


class BuildModuleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.build = runpy.run_path(str(Path(__file__).resolve().parents[1] / "build.py"))

    def test_registers_all_scenario_modules_and_imports(self):
        expected = {
            "chapter_all": "ChapterAll.js",
            "flowchart_data": "FlowchartData.js",
            "after_yoshino": "AfterYoshino.js",
            "after_mako": "AfterMako.js",
            "after_murasame": "AfterMurasame.js",
            "after_rena": "AfterRena.js",
            "after_koharu": "AfterKoharu.js",
            "after_roka": "AfterRoka.js",
        }
        modules = dict(self.build["MODULES"])
        imports = self.build["IMPORT_MAP"]
        for source, output in expected.items():
            relative = f"data/{source}.js"
            with self.subTest(source=source):
                self.assertEqual(modules.get(relative), [output])
                self.assertEqual(imports.get(f"../../{relative}"), f"./{output}")


if __name__ == "__main__":
    unittest.main()
