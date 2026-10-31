import array
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import wave

from audio_qa import inspect_file


class AudioQaTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)

    def wav(self, name, frames, channels=1):
        path = Path(self.temp.name) / name
        samples = array.array("h", frames)
        if sys.byteorder != "little":
            samples.byteswap()
        with wave.open(str(path), "wb") as output:
            output.setnchannels(channels)
            output.setsampwidth(2)
            output.setframerate(48000)
            output.writeframes(samples.tobytes())
        return path

    def test_intersample_peak_not_sample_peak_and_source_unchanged(self):
        path = self.wav("intersample.wav", [26000, 26000, -26000, -26000] * 12000)
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        report = inspect_file(path)
        self.assertGreater(report["true_peak_dbtp"], report["sample_peak_dbfs"] + 1.5)
        self.assertIn("true_peak_above_requested_ceiling", report["warnings"])
        self.assertEqual(digest, hashlib.sha256(path.read_bytes()).hexdigest())
        self.assertEqual(report["sha256"], digest)

    def test_antiphase_is_not_misreported_as_safe_silence(self):
        frames = [value for i in range(48000) for value in ((10000 if i % 4 < 2 else -10000), (-10000 if i % 4 < 2 else 10000))]
        report = inspect_file(self.wav("antiphase.wav", frames, 2))
        self.assertTrue(report["mono_silent"])
        self.assertIsNone(report["mono_energy_change_db"])
        self.assertIn("mono_cancellation_risk", report["warnings"])
        self.assertIsNotNone(report["true_peak_dbtp"])

    def test_identical_stereo_channels_keep_mono_energy(self):
        frames = [value for i in range(48000) for value in ([5000 if i % 4 < 2 else -5000] * 2)]
        report = inspect_file(self.wav("stereo.wav", frames, 2))
        self.assertAlmostEqual(report["mono_energy_change_db"], 0, places=2)
        self.assertNotIn("mono_cancellation_risk", report["warnings"])

    def test_short_silence_uses_null_not_nonfinite_json(self):
        report = inspect_file(self.wav("silence.wav", [0] * 4800))
        self.assertIsNone(report["integrated_lufs"])
        self.assertIsNone(report["true_peak_dbtp"])
        self.assertIn("silent_audio", report["warnings"])
        json.dumps(report, allow_nan=False)

    def test_cli_error_does_not_write_success_report(self):
        output = Path(self.temp.name) / "report.json"
        result = subprocess.run(
            [sys.executable, str(Path(__file__).with_name("audio_qa.py")),
             str(Path(self.temp.name) / "missing.wav"), "--output", str(output)],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 1)
        self.assertIn("audio_qa:", result.stderr)
        self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
