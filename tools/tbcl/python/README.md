# TBCL 超綱詞檢核（Python／Jieba 版）

和網頁版 `tools/tbcl/` 用同一份資料（`../data/tbcl.tsv`、`../data/lexicon.txt`），適合批次檢核或放進後端。

**流程：先斷詞，再對回詞表。** 預設用 CKIP Transformers（中研院，專為繁體中文／臺灣用語訓練）獨立斷詞，不看 TBCL；斷完再把「剛好能合成詞表詞」的相鄰詞合併，最後逐詞比對 TBCL 等級。CKIP 的命名實體辨識（NER）用來找人名、地名、設施名、機構名、事件名，把它們排除在超綱比例外（簡章規定不計入）：「經國轉運站」「銅鑼火車站」「李大錘」會被排除，單獨出現的「火車站」「轉運站」是普通名詞，照常計入。沒裝 CKIP 時退回 Jieba。

```bash
pip install ckip-transformers   # 建議；第一次執行會從 Hugging Face 下載模型（bert-base 約 400MB），之後用快取
pip install jieba               # 備用
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

- CKIP 實測：「風生水起」「騎虎難下」「小籠包」「台北」「捷運站」都能正確斷成一個詞；Jieba 會把「台北」切成「台」「北」。模型不放在儲存庫裡（檔案太大），由 `ckip-transformers` 自動下載。
- `check_materials(..., segmenter="auto"|"ckip"|"jieba")`。
- `build_tokenizer(base="tbcl")`（Jieba 備用）：只用 TBCL 詞表＋補充字典當 Jieba 詞典（預設，建議）。`base="default"`：保留 Jieba 預設詞典，再用 `add_word` 把 TBCL 詞全部加進去。
- 斷詞用精確模式並關掉 HMM（`HMM=False`），不讓 Jieba 自己猜新詞。
- 資料來源與授權見 `docs/資料來源與授權.md`。

## 兩套並列：曼米版 vs 國教院版

評審看到的是官方「教材編輯輔助系統」的結果，我們自己的斷詞（CKIP＋成語字典）在成語和專有名詞上通常比官方準，兩者因此會有差異。所以兩套都留著，不為了貼近官方而降低我們自己的準確度：

```bash
python3 tbcl_check.py --level 3 --segmenter ckip     "課文"   # 曼米版
python3 tbcl_check.py --level 3 --segmenter official "課文"   # 國教院版：直接用官方系統的斷詞（需連網）
python3 tbcl_check.py --level 3 --compare            "課文"   # 兩套並列，列出斷詞不同的地方
```

`--compare` 會顯示兩邊的超綱比例，以及「風生水起｜風 / 生 / 水 / 起」這類斷詞差異，方便老師判斷：官方切碎的成語，我們整個標為「未納入」，比例可能比官方高。國教院版是把課文送到官方系統取回結果，每段之間會暫停 1.5 秒，請勿大量連續呼叫。
