#!/usr/bin/env python3
"""TBCL 超綱詞檢核（Python／Jieba 版）

流程（先斷詞，再對回詞表）
  0. 斷詞：預設用 CKIP Transformers（中研院，專為繁體中文／臺灣用語訓練）獨立斷詞，不看 TBCL；
     沒裝 CKIP 時退回 Jieba（見下）。斷完詞再拿去比對 TBCL。
  1. 從 ../data/tbcl.tsv（國家教育研究院 TBCL 詞語表，格式：詞<TAB>等級1-7<TAB>備註）讀入全部詞彙與等級。
  2. 把 TBCL 詞表（加上 ../data/lexicon.txt 的補充成語／長詞）以高詞頻加進 Jieba，
     讓斷詞「優先以 TBCL 詞表為切分依據」，成語不會被切碎成單字。
  3. check_materials(text, target_level)：精確模式斷詞後逐詞比對 TBCL 等級。
       等級 > 目標等級            → 超綱 (over)
       不在 TBCL 詞表（非標點）   → 未納入基準詞表 (unlisted)

用法
    pip install jieba
    python3 tbcl_check.py --level 3 "原本以為他會交不到朋友，沒想到混得風生水起。"
    python3 tbcl_check.py --level 2 --file 課文.txt

注意
  * TBCL 詞表是繁體；課文請用繁體中文。
  * 詞表第 N* 級（如 3*）預設算在第 N 級內，可用 star_in_level=False 改成算比該級更高。
  * 詞表本身沒有「騎虎難下」這類成語時，它會當成一個詞、標成「未納入基準詞表」，而不是切成單字。
"""
from __future__ import annotations

import argparse
import html as _html
import re
import sys
import time
import urllib.parse
import urllib.request
import tempfile
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

try:
    import jieba
except ImportError:          # 只用 CKIP 時不需要 Jieba
    jieba = None

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
TBCL_TSV = DATA_DIR / "tbcl.tsv"
LEXICON_TXT = DATA_DIR / "lexicon.txt"
LEXICON_IDIOMS_TXT = DATA_DIR / "lexicon-idioms.txt"
FREQ_TSV = DATA_DIR / "freq.tsv"

# 詞語表沒有單獨收、但語法點表有的虛詞用法：V了、V著 為第 2 級
GRAMMAR_WORDS = {"了": 2, "著": 2}

# 加進 Jieba 的詞頻：要遠高於 Jieba 預設詞典，TBCL 詞才會贏過一般網路語料的切法
USERDICT_FREQ = 1_000_000

OK, OVER, UNLISTED, SUSPECT, NON_HAN, PUNCT, PROPER = "ok", "over", "unlisted", "suspect", "non_han", "punct", "proper"


# --------------------------------------------------------------------------- 1. 讀 TBCL 資料

def load_tbcl(path: Path = TBCL_TSV) -> Dict[str, Tuple[int, bool]]:
    """讀 TBCL 詞表，回傳 {詞: (等級 1-7, 是否為 * 級)}。同一個詞出現多次取最低等級。"""
    words: Dict[str, Tuple[int, bool]] = {}
    with open(path, encoding="utf8") as f:
        for line in f:
            if not line.strip() or line.startswith("#"):
                continue
            cols = line.rstrip("\n").split("\t")
            if len(cols) < 2 or not cols[1].strip().isdigit():
                continue
            word, level = cols[0].strip(), int(cols[1])
            star = len(cols) > 2 and cols[2].strip() == "*"
            if word and (word not in words or level < words[word][0]):
                words[word] = (level, star)
    for w, lv in GRAMMAR_WORDS.items():
        if w not in words or lv < words[w][0]:
            words[w] = (lv, False)
    return words


def load_lexicon(path: Path = LEXICON_TXT) -> List[str]:
    """補充斷詞字典（成語、長詞；不在 TBCL）：lexicon.txt（教育部近義詞詞條）＋ lexicon-idioms.txt（重編國語辭典成語／固定詞組）。"""
    words: List[str] = []
    for p in (path, LEXICON_IDIOMS_TXT):
        if p.exists():
            words.extend(w.strip() for w in p.read_text(encoding="utf8").splitlines() if w.strip())
    return list(dict.fromkeys(words))


def load_idioms(path: Path = LEXICON_IDIOMS_TXT) -> List[str]:
    """成語／固定詞組字典（教育部辭典與新華成語，已排除能拆成兩個 TBCL 詞的合成詞）。"""
    return [w.strip() for w in path.read_text(encoding="utf8").splitlines() if w.strip()] if path.exists() else []


def load_ranks(path: Path = FREQ_TSV) -> Dict[str, int]:
    """COCT 通用詞頻序位（只用來判斷「疑似詞組」，檔案不存在就略過）。"""
    ranks: Dict[str, int] = {}
    if path.exists():
        for line in path.read_text(encoding="utf8").splitlines():
            if line and not line.startswith("#"):
                cols = line.split("\t")
                ranks[cols[0]] = int(cols[1])
    return ranks


# --------------------------------------------------------------------------- 2. 擴充 Jieba

def build_tokenizer(
    tbcl: Optional[Dict[str, Tuple[int, bool]]] = None,
    extra_words: Optional[Iterable[str]] = None,
    base: str = "tbcl",
) -> jieba.Tokenizer:
    """建立「以 TBCL 為準」的 Jieba 斷詞器。

    base="tbcl"    只用 TBCL 詞表（加補充字典）當詞典。Jieba 預設詞典偏簡體、網路用語，
                   完全不載入，切分依據就是 TBCL（建議，結果可預期）。
    base="default" 保留 Jieba 預設詞典，再用 add_word 把 TBCL 詞全部加進去並給高詞頻。
                   預設詞典裡的詞（即使不在 TBCL）也會被切成一個詞，可能把「很好」這種合成詞黏在一起。
    """
    tbcl = tbcl if tbcl is not None else load_tbcl()
    extra = list(extra_words) if extra_words is not None else load_lexicon()

    if base == "tbcl":
        # load_userdict 的檔案格式：每行「詞 詞頻」。先寫成暫存檔當 Jieba 的主詞典。
        with tempfile.NamedTemporaryFile("w", suffix=".dict", delete=False, encoding="utf8") as tmp:
            for w in list(tbcl) + extra:
                tmp.write(f"{w} {USERDICT_FREQ}\n")
            dict_path = tmp.name
        tk = jieba.Tokenizer(dictionary=dict_path)
        tk.initialize()
        return tk

    if base == "default":
        tk = jieba.Tokenizer()
        for w in list(tbcl) + extra:
            tk.add_word(w, freq=USERDICT_FREQ)       # 動態加入，等同 jieba.add_word()
        return tk

    raise ValueError("base 只能是 'tbcl' 或 'default'")



# --------------------------------------------------------------------------- 2b. CKIP 斷詞（先斷詞）

_CKIP_DRIVER = None


def get_ckip(model: str = "bert-base", device: int = -1):
    """載入 CKIP 斷詞器（第一次會從 Hugging Face 下載模型）。model 可用 albert-tiny／albert-base／bert-base。"""
    global _CKIP_DRIVER
    if _CKIP_DRIVER is None:
        from ckip_transformers.nlp import CkipWordSegmenter   # pip install ckip-transformers
        _CKIP_DRIVER = CkipWordSegmenter(model=model, device=device)
    return _CKIP_DRIVER


def segment_ckip_lines(text: str, driver=None) -> List[List[str]]:
    """用 CKIP 斷詞（不看 TBCL），一行一行處理，回傳每一行的詞串列。"""
    driver = driver or get_ckip()
    lines = [ln for ln in text.splitlines() if ln.strip()]
    return [list(toks) for toks in driver(lines, show_progress=False)] if lines else []


def segment_ckip(text: str, driver=None) -> List[str]:
    """同 segment_ckip_lines，但攤平成一串詞（行與行之間插入換行）。"""
    out: List[str] = []
    for toks in segment_ckip_lines(text, driver):
        out.extend(toks + ["\n"])
    return out[:-1] if out else out


_CKIP_NER = None
# 簡章：人物名、事件名、地名、國名、機構名 不列入超綱比例。對應 CKIP 的實體類型：
PROPER_TYPES = {"PERSON", "GPE", "LOC", "FAC", "ORG", "EVENT"}


def ner_spans(lines: List[List[str]], model: str = "bert-base", device: int = -1) -> List[List[Tuple[int, int]]]:
    """CKIP 命名實體辨識：回傳每一行裡「專有名詞」的字元範圍 [(起, 迄)]。

    只認 PERSON 人名、GPE 國名／地名、LOC 地點、FAC 設施（如「經國轉運站」「銅鑼火車站」）、ORG 機構、EVENT 事件。
    單獨的「火車站」「轉運站」這種普通名詞不會被當成實體。"""
    global _CKIP_NER
    if _CKIP_NER is None:
        from ckip_transformers.nlp import CkipNerChunker
        _CKIP_NER = CkipNerChunker(model=model, device=device)
    texts = ["".join(l) for l in lines]
    if not texts:
        return []
    return [[tuple(e.idx) for e in ents if e.ner in PROPER_TYPES] for ents in _CKIP_NER(texts, show_progress=False)]


# --------------------------------------------------------------------------- 2c. 國教院版：送到官方「教材編輯輔助系統」

OFFICIAL_URL = "https://coct.naer.edu.tw/edit.jsp"
_TAG = re.compile(r"[A-Z][A-Za-z_]*")


def _official_chunks(text: str, limit: int = 300) -> List[str]:
    """官方系統一次不宜送太長：每行再依句號切成不超過 limit 字的段落。"""
    chunks: List[str] = []
    for line in text.splitlines():
        if not line.strip():
            continue
        buf = ""
        for sent in re.findall(r"[^。！？!?]*[。！？!?]+|[^。！？!?]+", line):
            if buf and len(buf) + len(sent) > limit:
                chunks.append(buf)
                buf = ""
            buf += sent
        if buf:
            chunks.append(buf)
    return chunks


def segment_official(text: str, delay: float = 1.5, timeout: int = 90, ssl_context=None) -> List[List[Tuple[str, str]]]:
    """把課文送到國教院「教材編輯輔助系統」（https://coct.naer.edu.tw/edit.jsp），取回它的斷詞與詞性。
    回傳每一段的 [(詞, 詞性)]（標點的詞性為空字串）。每段之間暫停 delay 秒，請勿大量連續呼叫。
    ssl_context：需要自訂憑證驗證時才傳（例如公司網路的中繼憑證）；預設用系統設定，不關閉驗證。"""
    out: List[List[Tuple[str, str]]] = []
    for i, chunk in enumerate(_official_chunks(text)):
        if i:
            time.sleep(delay)
        data = urllib.parse.urlencode({"no": "", "db": "1", "num": "10", "lv": "0", "WORD": chunk}).encode()
        req = urllib.request.Request(OFFICIAL_URL, data=data, headers={"User-Agent": "mandamy-tbcl-check/1.0"})
        page = urllib.request.urlopen(req, timeout=timeout, context=ssl_context).read().decode("utf8", "ignore")
        body = re.sub(r"<script.*?</script>", "", page, flags=re.S)
        plain = re.sub(r"\s+", " ", _html.unescape(re.sub(r"<[^>]+>", " ", body)))
        marks = [m.end() for m in re.finditer("分級標記", plain)]
        if len(marks) < 2:
            raise RuntimeError("官方系統的回應格式和預期不同（可能改版或暫時無法使用）")
        seg = plain[marks[1]:plain.find("詞彙等級分布", marks[1])].split()
        toks: List[Tuple[str, str]] = []
        j = 0
        while j < len(seg):
            if _TAG.fullmatch(seg[j]) and j + 1 < len(seg):
                toks.append((seg[j + 1], seg[j]))
                j += 2
            else:
                toks.append((seg[j], ""))
                j += 1
        out.append(toks)
    return out


def align_to_tbcl(tokens: List[str], words: Iterable[str], max_parts: int = 4) -> List[str]:
    """「對回詞表」：CKIP 切得比 TBCL 細時（例如 TBCL 收「一點點」，CKIP 切成「一」「點點」），
    把相鄰的幾個詞合併成詞表裡的詞（取最長的）。只合併「合起來剛好是詞表詞」的情況，不會把詞表沒有的組合硬黏起來。"""
    wl = words if isinstance(words, (set, dict)) else set(words)
    out: List[str] = []
    i = 0
    while i < len(tokens):
        merged = None
        for n in range(min(max_parts, len(tokens) - i), 1, -1):
            cand = "".join(tokens[i:i + n])
            if cand in wl and _is_han(cand):
                merged = (cand, n)
                break
        if merged:
            out.append(merged[0])
            i += merged[1]
        else:
            out.append(tokens[i])
            i += 1
    return out


# --------------------------------------------------------------------------- 3. 比對

@dataclass
class Token:
    word: str
    status: str                      # ok / over / unlisted / suspect / non_han / punct
    level: Optional[int] = None      # TBCL 等級（不在詞表為 None）
    star: bool = False

    @property
    def label(self) -> str:
        return {OVER: "超綱", UNLISTED: "未納入基準詞表", SUSPECT: "疑似未納入詞組", PROPER: "專有名詞（不計入）"}.get(self.status, "")


@dataclass
class CheckResult:
    target_level: int
    tokens: List[Token] = field(default_factory=list)
    segmenter: str = ""

    def by(self, *status: str) -> List[Token]:
        return [t for t in self.tokens if t.status in status]

    @property
    def over(self) -> List[Token]:
        return self.by(OVER)

    @property
    def unlisted(self) -> List[Token]:
        return self.by(UNLISTED, SUSPECT)

    @property
    def proper(self) -> List[Token]:
        return self.by(PROPER)

    @property
    def counted(self) -> int:
        """計入比例的詞次（排除標點、空白、非中文）。"""
        return len(self.by(OK, OVER, UNLISTED, SUSPECT))

    @property
    def ratio(self) -> float:
        """超綱比例（%）＝（超綱＋未納入）詞次 ÷ 計入詞次。"""
        return (len(self.over) + len(self.unlisted)) / self.counted * 100 if self.counted else 0.0


def compound_level(w: str, tbcl: Dict[str, Tuple[int, bool]], max_part: int = 4) -> Optional[int]:
    """w 不在詞表時，看它能不能完全拆成 TBCL 詞（例如「很多」＝很＋多）；能的話回傳「各種拆法裡最高等級最低」的那個等級。
    官方斷詞會把這類詞切開、各自比對，所以不能算成「詞表沒有」。"""
    n = len(w)
    if n >= 5 or (n == 4 and not (w[:2] in tbcl and w[2:] in tbcl)):
        return None          # 4 字以上多半是成語／專有名詞（騎虎難下＝騎＋虎＋難＋下 不是合成詞），只接受「兩個 2 字詞表詞」
    best: List[Optional[int]] = [None] * (n + 1)
    best[0] = 0
    for i in range(1, n + 1):
        for j in range(max(0, i - max_part), i):
            part = w[j:i]
            if best[j] is not None and part in tbcl:
                cand = max(best[j], tbcl[part][0])
                if best[i] is None or cand < best[i]:
                    best[i] = cand
    return best[n]


def _is_blank_or_punct(s: str) -> bool:
    return all(c.isspace() or unicodedata.category(c)[0] in "PSZC" for c in s)


def _is_han(s: str) -> bool:
    return any("㐀" <= c <= "鿿" or "豈" <= c <= "﫿" or c == "〇" for c in s)


_DEFAULT_TK: Optional[jieba.Tokenizer] = None
_DEFAULT_TBCL: Optional[Dict[str, Tuple[int, bool]]] = None
_DEFAULT_RANKS: Optional[Dict[str, int]] = None


def _defaults(need_jieba: bool = True):
    global _DEFAULT_TK, _DEFAULT_TBCL, _DEFAULT_RANKS
    if _DEFAULT_TBCL is None:
        _DEFAULT_TBCL = load_tbcl()
        _DEFAULT_RANKS = load_ranks()
    if need_jieba and _DEFAULT_TK is None:
        _DEFAULT_TK = build_tokenizer(_DEFAULT_TBCL)
    return _DEFAULT_TK, _DEFAULT_TBCL, _DEFAULT_RANKS


def check_materials(
    text: str,
    target_level: int,
    *,
    star_in_level: bool = True,
    flag_suspect_runs: bool = True,
    segmenter: str = "auto",
    exclude_proper_nouns: bool = True,
    compound_words: Optional[bool] = None,
    ckip_driver=None,
    tokenizer: Optional[jieba.Tokenizer] = None,
    tbcl: Optional[Dict[str, Tuple[int, bool]]] = None,
    ranks: Optional[Dict[str, int]] = None,
) -> CheckResult:
    """檢核教材課文。

    text           老師輸入的課文（繁體中文）。
    target_level   該堂課學生的華語等級，1~7。
    star_in_level  True：第 N* 級的詞算在第 N 級內；False：算比第 N 級更高（目標為 N 時視為超綱）。
    segmenter      "ckip"：曼米版——CKIP 先斷詞再對回詞表（最準，需 pip install ckip-transformers）；
                   "official"：國教院版——直接用官方教材編輯輔助系統的斷詞（需連網，和評審看到的一致）；
                   "jieba"：Jieba 加載 TBCL 詞表斷詞；"auto"：有裝 CKIP 就用 CKIP，否則 Jieba。
    compound_words 詞表沒有、但能完全拆成 TBCL 詞的詞（很多＝很＋多、火車站＝火車＋站）：True 按各部分最高等級判斷
                   （曼米版預設）；False 一律算「未納入」（國教院版預設，與官方系統的 X 一致）。
    exclude_proper_nouns
                   True（只用在 CKIP）：不在詞表、且 CKIP 標為專有名詞（Nb）或地名（Nc）的詞，狀態為 proper，
                   不列入比例（簡章：人名、地名、國名、機構名不計入超綱）。
    flag_suspect_runs
                   （只用在 Jieba）True：連續 4 個以上、各自都在詞表卻不像一般詞的單字（如「風生水起」），
                   視為「疑似未納入詞組」合併成一個詞標出，避免成語被逐字判斷而漏掉。
    回傳 CheckResult：tokens（每個詞的狀態）、over（超綱）、unlisted（未納入基準詞表）、ratio（超綱比例）。
    """
    if not 1 <= int(target_level) <= 7:
        raise ValueError("target_level 必須是 1~7")
    if segmenter == "auto":
        try:
            import ckip_transformers  # noqa: F401
            segmenter = "ckip"
        except ImportError:
            segmenter = "jieba"
    use_compound = (segmenter != "official") if compound_words is None else compound_words
    d_tk, d_tbcl, d_ranks = _defaults(need_jieba=(segmenter == "jieba" and tokenizer is None))
    tk, tbcl, ranks = tokenizer or d_tk, tbcl or d_tbcl, ranks if ranks is not None else d_ranks

    result = CheckResult(int(target_level))
    proper_idx: set = set()
    if segmenter == "ckip":
        idioms = set(load_idioms())
        known = set(tbcl)        # 只用 TBCL 詞表合併：辭典詞條裡有很多合成詞（社會秩序），不能拿來黏 CKIP 已斷好的詞
        words: List[str] = []
        for line in segment_ckip_lines(text, ckip_driver):          # 1) 先斷詞（獨立於 TBCL）
            line = align_to_tbcl(line, known)                        # 2) 再對回詞表
            line = align_to_tbcl(line, idioms)                       # 2b) 成語字典：CKIP 把「落英繽紛」切成「落英」「繽紛」時合併回來
            if exclude_proper_nouns:                                 # 3) 專有名詞（人名、地名、機構名…）不列入比例（簡章規定）
                spans, pos = ner_spans([line])[0], 0
                for w in line:
                    if any(a <= pos and pos + len(w) <= b for a, b in spans):
                        proper_idx.add(len(words))
                    words.append(w)
                    pos += len(w)
            else:
                words.extend(line)
            words.append("\n")
        flag_suspect_runs = False                                    # CKIP 自己會處理新詞，不需要啟發式
    elif segmenter == "official":
        words = []
        for chunk in segment_official(text):                       # 國教院版：直接用官方系統的斷詞
            for w, tag in chunk:
                if tag == "Nb":                                     # 官方標為專有名稱（人名等）者不計入比例
                    proper_idx.add(len(words))
                words.append(w)
            words.append("\n")
    elif segmenter == "jieba":
        words = tk.cut(text, cut_all=False, HMM=False)          # 精確模式；關掉 HMM，不讓它自己「猜」新詞
    else:
        raise ValueError("segmenter 只能是 'auto'、'ckip'、'official' 或 'jieba'")
    result.segmenter = segmenter
    for idx, w in enumerate(words):
        if _is_blank_or_punct(w):
            result.tokens.append(Token(w, PUNCT))
        elif not _is_han(w):
            result.tokens.append(Token(w, NON_HAN))              # 數字、英文：不算在 TBCL 比對內
        elif w in tbcl:
            level, star = tbcl[w]
            effective = level + (0.5 if (star and not star_in_level) else 0)
            result.tokens.append(Token(w, OVER if effective > target_level else OK, level, star))
        elif idx in proper_idx:
            result.tokens.append(Token(w, PROPER))               # 專有名詞（NER 辨識出的人名、地名、機構名…）：不計入比例，但列出來讓老師知道
        elif use_compound and len(w) > 1 and (cl := compound_level(w, tbcl)) is not None:
            # 詞表沒有，但能完全拆成 TBCL 詞（很多＝很＋多）：按各部分最高等級判斷，不算「未納入」
            result.tokens.append(Token(w, OVER if cl > target_level else OK, cl, False))
        else:
            result.tokens.append(Token(w, UNLISTED))             # 完全不在 TBCL 詞表

    if flag_suspect_runs:
        _merge_suspect_runs(result.tokens, ranks or {})
    return result


def _merge_suspect_runs(tokens: List[Token], ranks: Dict[str, int]) -> None:
    """把連續 ≥4 個「單字、都在詞表、都不是最常用字」的 token 合併成一個疑似未納入詞組。"""
    out: List[Token] = []
    run: List[Token] = []

    def flush():
        nonlocal run
        if len(run) >= 4 and all(ranks.get(t.word, 10**9) > 60 for t in run):
            # 成語多半是 4 個字：只合併最後 4 個，前面的字（例如「混得」的「混」「得」）維持原判斷
            out.extend(run[:-4])
            out.append(Token("".join(t.word for t in run[-4:]), SUSPECT))
        else:
            out.extend(run)
        run = []

    for t in tokens:
        if len(t.word) == 1 and t.status in (OK, OVER) and _is_han(t.word):
            run.append(t)
        else:
            flush()
            out.append(t)
    flush()
    tokens[:] = out


# --------------------------------------------------------------------------- 4. 曼米版 vs 國教院版

def _spans(tokens: List[Token]) -> List[Tuple[int, int, str]]:
    pos, out = 0, []
    for t in tokens:
        if t.status != PUNCT or t.word.strip():
            out.append((pos, pos + len(t.word), t.word))
        pos += len(t.word)
    return out


def segmentation_diff(a: CheckResult, b: CheckResult) -> List[Tuple[str, str]]:
    """兩種斷詞切法不同的地方：回傳 [(a 的切法, b 的切法)]。"""
    sa = [x for x in _spans([t for t in a.tokens if t.word != "\n"]) if not _is_blank_or_punct(x[2])]
    sb = [x for x in _spans([t for t in b.tokens if t.word != "\n"]) if not _is_blank_or_punct(x[2])]
    bounds_a = {s for s, _, _ in sa} | {e for _, e, _ in sa}
    bounds_b = {s for s, _, _ in sb} | {e for _, e, _ in sb}
    common = sorted(bounds_a & bounds_b)
    diffs = []
    for lo, hi in zip(common, common[1:]):
        wa = [w for s, e, w in sa if lo <= s and e <= hi]
        wb = [w for s, e, w in sb if lo <= s and e <= hi]
        if wa != wb and "".join(wa) == "".join(wb):
            diffs.append((" / ".join(wa), " / ".join(wb)))
    return diffs


def compare_materials(text: str, target_level: int, **kw) -> Dict[str, object]:
    """同一份課文跑兩套：曼米版（CKIP）與國教院版（官方系統），並列結果與斷詞差異。"""
    mine = check_materials(text, target_level, segmenter="ckip", **kw)
    official = check_materials(text, target_level, segmenter="official", **kw)
    return {"mandamy": mine, "official": official, "diff": segmentation_diff(mine, official)}


def format_compare(c: Dict[str, object]) -> str:
    m, o = c["mandamy"], c["official"]
    lines = [
        f"曼米版（CKIP）　：超綱比例 {m.ratio:.1f}%　超綱 {len(m.over)}　未納入 {len(m.unlisted)}　專有名詞 {len(m.proper)}",
        f"國教院版（官方）：超綱比例 {o.ratio:.1f}%　超綱 {len(o.over)}　未納入 {len(o.unlisted)}　專有名詞 {len(o.proper)}",
    ]
    if c["diff"]:
        lines.append("斷詞不同之處（曼米版 ｜ 國教院版）：")
        lines += [f"  {a}　｜　{b}" for a, b in c["diff"]]
    else:
        lines.append("兩套斷詞完全一致。")
    return "\n".join(lines)


# --------------------------------------------------------------------------- 報告／命令列

def format_report(res: CheckResult) -> str:
    lines = [f"斷詞器：{res.segmenter}　目標等級：TBCL {res.target_level}　計入詞次 {res.counted}　超綱比例 {res.ratio:.1f}%"]
    lines.append("斷詞：" + " ".join(t.word for t in res.tokens if t.status != PUNCT))
    if res.over:
        lines.append("超綱：" + "、".join(f"{t.word}(第{t.level}級{'*' if t.star else ''})" for t in res.over))
    if res.unlisted:
        lines.append("未納入基準詞表（請老師注意）：" + "、".join(t.word + ("?" if t.status == SUSPECT else "") for t in res.unlisted))
    if res.proper:
        lines.append("專有名詞／地名（不計入比例）：" + "、".join(t.word for t in res.proper))
    if not res.over and not res.unlisted:
        lines.append("沒有超綱詞，也沒有未納入詞表的詞。")
    return "\n".join(lines)


def main(argv: Optional[List[str]] = None) -> int:
    ap = argparse.ArgumentParser(description="TBCL 超綱詞檢核（Jieba 版）")
    ap.add_argument("text", nargs="?", help="要檢核的課文；也可改用 --file")
    ap.add_argument("--file", help="從檔案讀課文（UTF-8）")
    ap.add_argument("--level", type=int, required=True, help="目標等級 1~7")
    ap.add_argument("--segmenter", choices=["auto", "ckip", "official", "jieba"], default="auto", help="斷詞器：ckip＝曼米版、official＝國教院版（需連網）")
    ap.add_argument("--compare", action="store_true", help="曼米版與國教院版並列比較")
    ap.add_argument("--star-above", action="store_true", help="第 N* 級的詞算比第 N 級高")
    a = ap.parse_args(argv)
    text = Path(a.file).read_text(encoding="utf8") if a.file else a.text
    if not text:
        ap.error("請提供課文或 --file")
    if a.compare:
        print(format_compare(compare_materials(text, a.level, star_in_level=not a.star_above)))
        return 0
    print(format_report(check_materials(text, a.level, star_in_level=not a.star_above, segmenter=a.segmenter)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
