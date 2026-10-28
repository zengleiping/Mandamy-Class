"""python3 -m unittest test_tbcl_check（需要 pip install jieba）"""
import unittest
import tbcl_check as t

try:
    import ckip_transformers  # noqa: F401
    HAS_CKIP = True
except ImportError:
    HAS_CKIP = False


class CheckMaterials(unittest.TestCase):
    def test_idiom_stays_whole_and_is_unlisted(self):
        r = t.check_materials("他現在騎虎難下。", 3)
        self.assertIn("騎虎難下", [x.word for x in r.tokens])
        self.assertIn("騎虎難下", [x.word for x in r.unlisted])

    def test_over_level(self):
        r = t.check_materials("我們聊了許多關於經濟發展的話題。", 2)
        self.assertEqual({"關於", "經濟", "發展", "話題"} - {x.word for x in r.over}, set())

    def test_star_level_option(self):
        inside = t.check_materials("他有許多書。", 3, star_in_level=True)
        above = t.check_materials("他有許多書。", 3, star_in_level=False)
        self.assertEqual(len(inside.over), 0)
        self.assertEqual([x.word for x in above.over], ["許多"])   # 許多＝第 3* 級

    def test_punctuation_and_numbers_not_counted(self):
        r = t.check_materials("我有100元。", 1)
        self.assertEqual(r.counted, 3)                           # 我、有、元
        self.assertEqual(r.unlisted, [])

    def test_suspect_run(self):
        r = t.check_materials("沒想到混得風生水起。", 3)
        self.assertIn("風生水起", [x.word for x in r.unlisted])

    def test_bad_level(self):
        with self.assertRaises(ValueError):
            t.check_materials("我", 8)


@unittest.skipUnless(HAS_CKIP, "需要 pip install ckip-transformers")
class CkipFlow(unittest.TestCase):
    def test_segment_first_then_match(self):
        r = t.check_materials("我們在台北捷運站見面，他混得風生水起。", 3, segmenter="ckip")
        words = [x.word for x in r.tokens]
        self.assertIn("風生水起", words)                       # CKIP 先把成語斷成一個詞
        self.assertIn("風生水起", [x.word for x in r.unlisted])  # 再對回詞表：不在詞表
        self.assertIn("台北", [x.word for x in r.proper])       # 地名不計入比例
        self.assertEqual(r.segmenter, "ckip")


if __name__ == "__main__":
    unittest.main()
