# TBCL 超綱詞檢核（Python／Jieba 版）

和網頁版 `tools/tbcl/` 用同一份資料（`../data/tbcl.tsv`、`../data/lexicon.txt`），適合批次檢核或放進後端。

```bash
pip install jieba
python3 tbcl_check.py --level 3 "原本以為他會交不到朋友，沒想到混得風生水起。"
python3 -m unittest test_tbcl_check
```

```python
from tbcl_check import check_materials, format_report
res = check_materials(text, target_level=3)      # 目標等級 1~7
res.over        # 超綱的詞（等級 > 目標等級）
res.unlisted    # 未納入基準詞表的詞（含疑似成語詞組）
res.ratio       # 超綱比例 %
```

- `build_tokenizer(base="tbcl")`：只用 TBCL 詞表＋補充字典當 Jieba 詞典（預設，建議）。`base="default"`：保留 Jieba 預設詞典，再用 `add_word` 把 TBCL 詞全部加進去。
- 斷詞用精確模式並關掉 HMM（`HMM=False`），不讓 Jieba 自己猜新詞。
- 資料來源與授權見 `docs/資料來源與授權.md`。
