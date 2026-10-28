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

    def test_proper_noun_only_inside_named_entity(self):
        name = t.check_materials("我昨天在經國轉運站遇到李大錘，他要去銅鑼火車站搭車。", 3, segmenter="ckip")
        self.assertTrue({"經國", "轉運站", "李大錘", "銅鑼", "火車站"} <= {x.word for x in name.proper})
        common = t.check_materials("我們在火車站和轉運站等車。", 3, segmenter="ckip")
        self.assertEqual(common.proper, [])                      # 普通名詞不排除
        self.assertTrue({"火車站", "轉運站"} <= {x.word for x in common.unlisted})


class Compare(unittest.TestCase):
    def test_segmentation_diff(self):
        mk = lambda ws: t.CheckResult(3, [t.Token(w, t.OK) for w in ws])
        a = mk(["他", "混", "得", "風生水起", "。"])
        b = mk(["他", "混", "得", "風", "生", "水", "起", "。"])
        self.assertEqual(t.segmentation_diff(a, b), [("風生水起", "風 / 生 / 水 / 起")])
        self.assertEqual(t.segmentation_diff(a, a), [])

    def test_official_response_parse_is_isolated(self):
        # segment_official 需要連網；這裡只確認分段函式不會把句子切壞
        chunks = t._official_chunks("第一句。第二句。\n第三行")
        self.assertEqual("".join(chunks), "第一句。第二句。第三行")


if __name__ == "__main__":
    unittest.main()
