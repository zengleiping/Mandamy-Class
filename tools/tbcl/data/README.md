# TBCL 資料

| 檔案 | 內容 | 來源 |
| --- | --- | --- |
| `tbcl.tsv` | 詞語分級（14,749 筆；詞、等級 1–7、備註 `*`＝第 N* 級） | 國家教育研究院《臺灣華語文能力基準詞語表》 |
| `hanzi.tsv` | 漢字分級（3,133 字） | 同上《漢字表》 |
| `grammar.json` | 語法點表（第 1–5 級共 496 筆；官方表目前沒有第 6、7 級） | 同上《語法點表》 |
| `freq.tsv` | COCT 通用詞頻表前 30,000 詞（綜合序位、每百萬詞頻、書面／口語／新聞） | 國家教育研究院《通用詞頻表》 |

| `synonyms.json` | 換詞用的近義詞：近義詞工具書 1,720 組、教育部近義詞 3,719 詞 | `tools/synonyms/`、`tools/vocab/data/moe-relations.json`（教育部）；用 `build_synonyms.py` 產生 |

| `lexicon.txt` | 補充斷詞字典：教育部詞條中不在 TBCL 的 3 字以上詞（約 9 千個），斷詞用、等級一律當「詞表沒有」 | `build_lexicon.py` 由 `tools/vocab/data/moe-relations.json` 產生 |

| `lexicon-idioms.txt` | 成語／固定詞組字典（約 3 萬詞）：教育部《重編國語辭典修訂本》詞條中 4–8 字、不在 TBCL、且不能拆成 TBCL 詞的詞 | `build_idioms.py`（來源 g0v/moedict-data 的 dict-revised.json；只取詞條名稱） |

用 `../build/` 裡的 `build_tbcl.py`、`build_grammar.py` 從官方 PDF／Excel 重新產生。
- 第 1*–4* 級（詞語）依「併入該級」計算，等級 1–7 對應競賽簡章的 TBCL 1–7 級。
- 詞語表沒有單獨收錄的虛詞「了」「著」，依語法點表（V了、V著 第 2 級）計為第 2 級。
- 使用前請確認官方資料的授權；出處與建議引用格式見 `docs/資料來源與授權.md`。
