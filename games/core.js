/* 曼米中文 · 生詞遊戲：共用工具（出題範圍、拼音、翻譯、計分、Firebase）
   所有遊戲共用 window.MG；各遊戲（match.js、blast.js）只負責畫面和玩法。 */
(function(){
  var MG = window.MG = window.MG || {};
  MG.qs = new URLSearchParams(location.search);
  MG.esc = function(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  MG.$ = function(sel, root){ return (root || document).querySelector(sel); };
  MG.$$ = function(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  MG.clamp = function(v, a, b){ return Math.max(a, Math.min(b, v)); };

  // ---------- 亂數（同一個種子＝同樣的題目順序：即時遊戲大家拿到一樣的題目） ----------
  MG.hash = function(s){ var h = 2166136261; s = String(s); for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  MG.rng = function(seed){
    var a = (typeof seed === "number" ? seed : MG.hash(seed)) >>> 0 || 1;
    return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  };
  MG.shuffle = function(arr, rnd){ var a = arr.slice(); rnd = rnd || Math.random; for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  MG.newSeed = function(){ return Math.floor(Math.random() * 2147483646) + 1; };

  // ---------- 拼音 ----------
  var MARKS = { "ā": "a1", "á": "a2", "ǎ": "a3", "à": "a4", "ē": "e1", "é": "e2", "ě": "e3", "è": "e4", "ī": "i1", "í": "i2", "ǐ": "i3", "ì": "i4", "ō": "o1", "ó": "o2", "ǒ": "o3", "ò": "o4", "ū": "u1", "ú": "u2", "ǔ": "u3", "ù": "u4", "ǖ": "ü1", "ǘ": "ü2", "ǚ": "ü3", "ǜ": "ü4", "ń": "n2", "ň": "n3", "ǹ": "n4", "ḿ": "m2" };
  var TONED = { a: "āáǎà", e: "ēéěè", i: "īíǐì", o: "ōóǒò", u: "ūúǔù", "ü": "ǖǘǚǜ" };
  // 一個音節：字母＋聲調數字 → 標調（ni3 → nǐ；ma 或 ma0／ma5 → 輕聲 ma）
  function markSyl(letters, tone){
    letters = letters.replace(/v|u:/g, "ü");
    tone = Number(tone) || 0; if(tone < 1 || tone > 4) return letters;
    var i = letters.search(/[ae]/); if(i < 0){ var j = letters.indexOf("ou"); i = j >= 0 ? j : -1; }
    if(i < 0){ for(var k = letters.length - 1; k >= 0; k--){ if("aeiouü".indexOf(letters[k]) >= 0){ i = k; break; } } }
    if(i < 0) return letters;
    var ch = letters[i]; return letters.slice(0, i) + TONED[ch][tone - 1] + letters.slice(i + 1);
  }
  // 「ni3 hao3」「xie4xie0」「ma1ma」→ nǐ hǎo、xièxie、māma（0、5 或不打＝輕聲）。已經是標調的拼音原樣留著
  MG.pyNum = function(s){
    return String(s || "").replace(/([a-zA-ZüÜ:]+)([0-5]?)/g, function(m, letters, tone){
      if(!tone && !/[0-5]/.test(m)) return letters.replace(/v/g, "ü").replace(/V/g, "Ü");
      var low = letters.toLowerCase(), cap = letters[0] !== low[0];
      var out = markSyl(low, tone); return cap ? out[0].toUpperCase() + out.slice(1) : out;
    });
  };
  // 標調拼音拆成音節：[{l:"ni",t:3},{l:"hao",t:3}]；音節之間要有空格才拆得準，黏在一起的用漢字字數再切
  MG.pySyllables = function(py, zh){
    var toks = String(py || "").toLowerCase().replace(/[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüńňǹḿ\s'’-]/g, " ").split(/[\s'’-]+/).filter(Boolean);
    var out = [];
    toks.forEach(function(tk){
      var l = "", t = 0, parts = [];
      Array.from(tk).forEach(function(ch){
        if(MARKS[ch]){ if(t && l){ parts.push({ l: l, t: t }); l = ""; t = 0; } l += MARKS[ch][0]; t = Number(MARKS[ch][1]); }
        else l += ch;
      });
      if(l) parts.push({ l: l, t: t });
      // 「nǐhǎo」：遇到第二個聲調就切，但聲母要歸到後一個音節（ni3h ao3 → ni3 hao3）
      for(var i = 1; i < parts.length; i++){
        var prev = parts[i - 1], m = /([bpmfdtnlgkhjqxzcsrwy]+h?)$/.exec(prev.l);
        if(m && m[1].length < prev.l.length && !/[aeiouü]$/.test(prev.l.slice(0, -m[1].length)) === false){ parts[i].l = m[1] + parts[i].l; prev.l = prev.l.slice(0, -m[1].length); }
      }
      out = out.concat(parts);
    });
    return out;
  };
  // 學生打的拼音（數字標調）對不對：字母要一樣，每個音節後面的數字＝聲調（0、5 或不打＝輕聲）
  MG.pyCheck = function(input, expected){
    var syl = MG.pySyllables(expected); if(!syl.length) return false;
    var s = String(input || "").toLowerCase().replace(/u:|v/g, "ü").replace(/[\s'’-]+/g, "");
    // 學生直接打標調拼音也算
    s = Array.from(s).map(function(ch){ return MARKS[ch] ? MARKS[ch][0] + "\u0001" + MARKS[ch][1] : ch; }).join("");
    s = s.replace(/([a-zü]*)\u0001(\d)([a-zü]*)/g, function(m, a, d, b){ return a + b + d; });
    var pos = 0;
    for(var i = 0; i < syl.length; i++){
      var L = syl[i].l; if(s.substr(pos, L.length) !== L) return false; pos += L.length;
      var t = 0; if(/[0-5]/.test(s[pos] || "")){ t = Number(s[pos]); pos++; } if(t === 5) t = 0;
      if(t !== (syl[i].t || 0)) return false;
    }
    return pos === s.length;
  };
  // 拼音轉數字標調（給學生看正確答案怎麼打）：nǐ hǎo → ni3 hao3
  MG.pyToNum = function(py){ return MG.pySyllables(py).map(function(x){ return x.l + (x.t || ""); }).join(" "); };

  // ---------- 文字縮小到放得下（按鈕裡的字不換行，太長就把字縮小） ----------
  MG.fit = function(el, max, min){
    if(!el) return; max = max || parseFloat(el.dataset.fmax) || 28; min = min || parseFloat(el.dataset.fmin) || 11;
    el.style.whiteSpace = "nowrap"; var size = max; el.style.fontSize = size + "px";
    var box = el.parentElement, cw = el.clientWidth || (box && box.clientWidth) || 0;
    if(!cw) return;
    var guard = 0;
    while(size > min && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2) && guard++ < 40){ size = Math.max(min, size * 0.9); el.style.fontSize = size + "px"; }
  };
  MG.fitAll = function(root){ MG.$$(".fit", root).forEach(function(el){ MG.fit(el); }); };

  MG.en = function(zh, en){ return zh + '<span class="en">' + en + '</span>'; };
  MG.toast = function(msg, ms){
    var t = document.createElement("div"); t.className = "mg-toast"; t.textContent = msg; document.body.appendChild(t);
    setTimeout(function(){ t.classList.add("on"); }, 10); setTimeout(function(){ t.classList.remove("on"); setTimeout(function(){ t.remove(); }, 300); }, ms || 2600);
  };
  MG.fmtTime = function(ms){ ms = Math.max(0, ms || 0); var s = Math.floor(ms / 1000), m = Math.floor(s / 60); return m + ":" + String(s % 60).padStart(2, "0"); };
  MG.fmtSec = function(ms){ return (Math.max(0, ms || 0) / 1000).toFixed(1) + " 秒"; };

  // ---------- 遊戲清單（標題、至少要幾個生詞） ----------
  MG.GAME_INFO = {
    match: { title: "配對 Match", need: 3 },
    blast: { title: "Blast", need: 4 },
    quiz:  { title: "快問快答 Quiz", need: 4 },
    order: { title: "聽音排序 Listen & Order", need: 3 }
  };
  MG.gameTitle = function(g){ return (MG.GAME_INFO[g] || MG.GAME_INFO.blast).title; };
  // 一行說明這局怎麼玩（等待室、作業連結頁用）；c 是那個遊戲自己的設定（cfg.match／blast／quiz／order）
  MG.gameSummary = function(game, c, phon){
    c = c || {};
    if(game === "match") return "配對 Match・" + (c.mode === "timed" ? "限時 " + c.seconds + " 秒" : "比速度") + "・" + MG.ph((MG.MATCH_PAIRS || {})[c.pair] || "", phon);
    if(game === "quiz") return "快問快答 Quiz・" + MG.ph((MG.QUIZ_Q || {})[c.q || "mix"] || "", phon) + "・" + (c.count || 10) + " 題・每題 " + (c.sec || 15) + " 秒";
    if(game === "order") return "聽音排序 Listen & Order・" + (c.flow === "memory" ? "考記憶・" : "") + (c.mode === "score" ? "累積分數，沒有淘汰" : "生存（" + (c.lives || 2) + " 條命" + (c.comeback !== false ? "，可以復活" : "") + "）") + "・" + (c.start || 2) + "～" + (c.maxLen || 6) + " 個詞";
    return "Blast・" + (c.input === "type" ? "打拼音" : MG.ph((MG.BLAST_Q || {})[c.q] || "", phon));
  };
  // 由共用時鐘排程的遊戲（快問快答、聽音排序）：全班同一秒進到同一題，不用老師一題一題按下一題
  MG.isSynced = function(g){ return g === "quiz" || g === "order"; };

  // ---------- 朗讀 ----------
  // 優先用曼米語音伺服器的自然語音（跟平台生詞發音同一個，預設「曉臻」）：先把每個詞下載好，用 WebAudio 播。
  // 這樣聲音自然、速度由我們控制，每個詞的長度固定，全班聽到的節奏一樣，也不受裝置內建語音好壞影響。
  // 伺服器連不上（或這個詞還沒載好）才改用裝置內建的中文語音（優先「雅婷」等台灣語音）。
  MG.TTS_VOICES = [["zh-TW-HsiaoChenNeural", "曉臻（女）"], ["zh-TW-HsiaoYuNeural", "曉雨（女）"], ["zh-TW-YunJheNeural", "雲哲（男）"]];
  var T = MG.tts = { buf: {}, pend: {}, down: 0 };
  function tkey(text, o){ return (o.voice || MG.TTS_VOICES[0][0]) + "|" + (o.rate || 1) + "|" + text; }
  T.srv = function(){ var u = ""; try{ u = localStorage.getItem("mm_tts_server") || ""; }catch(e){} if(!u) u = window.MM_TTS_SERVER || ""; return String(u).replace(/\/+$/, ""); };
  // 免費主機閒置會休眠：先叫醒，真的要播的時候大多已經醒了
  T.wake = function(){ var s = T.srv(); if(s) try{ fetch(s + "/health", { mode: "cors" }).catch(function(){}); }catch(e){} };
  T.ready = function(text, o){ return T.buf[tkey(text, o || {})] || null; };
  T.load = function(text, o){
    o = o || {}; var k = tkey(text, o);
    if(T.buf[k]) return Promise.resolve(T.buf[k]);
    if(T.pend[k]) return T.pend[k];
    var srv = T.srv(), ctx = MG.audioCtx && MG.audioCtx();
    if(!srv || !ctx || !text || Date.now() < T.down) return Promise.resolve(null);
    var p = (async function(){
      var ctl = new AbortController(), to = setTimeout(function(){ ctl.abort(); }, o.timeout || 15000);
      try{
        var r = await fetch(srv + "/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text, rate: o.rate || 1, voice: o.voice || MG.TTS_VOICES[0][0] }), signal: ctl.signal });
        if(!r.ok) throw new Error("http " + r.status);
        var ab = await r.arrayBuffer();
        return await new Promise(function(res, rej){ var q = ctx.decodeAudioData(ab, res, rej); if(q && q.then) q.then(res, rej); });
      } finally { clearTimeout(to); }
    })().then(function(b){ delete T.pend[k]; if(b) T.buf[k] = b; return b; }, function(){ delete T.pend[k]; T.down = Date.now() + 20000; T.wake(); return null; });
    T.pend[k] = p; return p;
  };
  // 一批詞先下載好（同時 3 個）；回傳成功幾個
  T.preload = async function(texts, o){
    var list = [], seen = {}; (texts || []).forEach(function(t){ if(t && !seen[t]){ seen[t] = 1; list.push(t); } });
    var i = 0, ok = 0; T.wake();
    async function worker(){ while(i < list.length){ var b = await T.load(list[i++], Object.assign({ timeout: 30000 }, o || {})); if(b) ok++; } }
    await Promise.all([worker(), worker(), worker()]); return ok;
  };

  // 裝置內建語音（備用）：雅婷 > 曉臻 > 其他台灣語音 > 任何中文語音
  var voiceCache = null;
  function zhVoice(){
    if(!window.speechSynthesis) return null;
    var vs = speechSynthesis.getVoices() || [];
    if(voiceCache && vs.indexOf(voiceCache) >= 0) return voiceCache;
    var best = null, bs = -1;
    vs.forEach(function(v){
      var lang = String(v.lang || "").replace("_", "-"); if(!/^zh/i.test(lang) && !/雅婷|Yating|曉臻|HsiaoChen/i.test(v.name)) return;
      var n = 1; if(/雅婷|Yating/i.test(v.name)) n += 100; if(/曉臻|HsiaoChen/i.test(v.name)) n += 60; if(/^zh-TW$/i.test(lang)) n += 40; if(/Taiwan|臺灣|台灣/i.test(v.name)) n += 30; if(/Mei-?Jia|美佳/i.test(v.name)) n += 20; if(/Natural|Online/i.test(v.name)) n += 5;
      if(n > bs){ bs = n; best = v; }
    });
    voiceCache = best; return best;
  }
  if(window.speechSynthesis){ try{ speechSynthesis.onvoiceschanged = function(){ voiceCache = null; }; }catch(e){} }
  // iOS／Safari 要有人點過畫面才允許朗讀：第一次點畫面時先「無聲」念一下，之後定時自動播放才有聲音
  document.addEventListener("pointerdown", function unlock(){
    document.removeEventListener("pointerdown", unlock, true);
    try{ if(window.speechSynthesis){ var u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } }catch(e){}
  }, true);
  MG.canSpeak = function(){ return !!window.speechSynthesis || !!T.srv(); };
  MG.hasZhVoice = function(){ return !!zhVoice() || !!T.srv(); };
  function playBuf(b, done){
    var ctx = MG.audioCtx && MG.audioCtx(); if(!ctx) return null;
    try{ var s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.onended = done || null; s.start(); return s; }catch(e){ return null; }
  }
  // 念一個詞；o = { rate, voice, done }。done 在念完（或念不出來、逾時）時呼叫一次；回傳取消用的函式
  MG.speak = function(text, o){
    o = o || {}; var fin = false, timer = 0, src = null;
    var done = function(){ if(fin) return; fin = true; clearTimeout(timer); if(o.done) o.done(); };
    var b = T.ready(text, o);
    if(b){
      src = playBuf(b, done);
      if(src){ timer = setTimeout(done, b.duration * 1000 + 600); return function(){ fin = true; clearTimeout(timer); try{ src.stop(); }catch(e){} }; }
    } else T.load(text, o);   // 這次先用裝置語音；順便下載，下次就用自然語音
    if(!window.speechSynthesis || !text){ setTimeout(done, 0); return function(){}; }
    try{
      var u = new SpeechSynthesisUtterance(String(text)), v = zhVoice();
      u.lang = (v && v.lang) || "zh-TW"; if(v) u.voice = v; u.rate = MG.clamp(o.rate || 1, 0.5, 1.6); u.onend = done; u.onerror = done;
      speechSynthesis.speak(u);
      timer = setTimeout(done, 1500 + String(text).length * 500);   // 有些瀏覽器不會觸發 onend
    }catch(e){ setTimeout(done, 0); }
    return function(){ fin = true; clearTimeout(timer); };
  };
  // 依序念一串詞。o = { rate, voice, gap, starts, each(k), done }
  //   starts：每個詞「開始念」的時間（毫秒，從頭算）。有給就照這個節奏念（全班一樣）；沒給就一個念完、停 gap 毫秒再念下一個。
  MG.speakSeq = function(texts, o){
    o = o || {}; var stopped = false, tms = [], cancels = [], bufs = texts.map(function(t){ return T.ready(t, o); }), all = bufs.every(Boolean) && !!(MG.audioCtx && MG.audioCtx());
    try{ if(window.speechSynthesis) speechSynthesis.cancel(); }catch(e){}
    texts.forEach(function(t){ if(!T.ready(t, o)) T.load(t, o); });
    var gap = o.gap == null ? 300 : o.gap, starts = o.starts, acc = 0, ends = 0;
    if(!starts){ starts = []; texts.forEach(function(t, i){ starts.push(acc); acc += (all ? bufs[i].duration * 1000 : String(t).length * 330 + 400) + gap; }); }
    texts.forEach(function(t, i){
      var d = all ? bufs[i].duration * 1000 : String(t).length * 330 + 400; ends = Math.max(ends, starts[i] + d);
      tms.push(setTimeout(function(){
        if(stopped) return; if(o.each) o.each(i);
        if(all){ var s = playBuf(bufs[i]); if(s) cancels.push(function(){ try{ s.stop(); }catch(e){} }); }
        else cancels.push(MG.speak(t, { rate: o.rate, voice: o.voice }));
      }, starts[i]));
    });
    tms.push(setTimeout(function(){ if(!stopped && o.done) o.done(); }, ends + 150));
    return function(){ stopped = true; tms.forEach(clearTimeout); cancels.forEach(function(c){ try{ c(); }catch(e){} }); try{ if(window.speechSynthesis) speechSynthesis.cancel(); }catch(e){} };
  };

  // ---------- 小視窗 ----------
  MG.dialog = function(html, opts){
    opts = opts || {};
    var d = document.createElement("dialog"); d.className = "mg-dlg" + (opts.wide ? " wide" : ""); d.innerHTML = html; document.body.appendChild(d);
    d.addEventListener("close", function(){ setTimeout(function(){ d.remove(); }, 0); if(opts.onClose) opts.onClose(); });
    d.addEventListener("click", function(e){ if(e.target.closest("[data-close]")) d.close(); });
    d.showModal(); return d;
  };
  MG.ask = function(title, value, okLabel){
    return new Promise(function(res){
      var d = MG.dialog('<form method="dialog"><h3>' + MG.esc(title) + '</h3><input type="text" class="mg-in" value="' + MG.esc(value || "") + '" autocomplete="off"><div class="mg-row end"><button type="button" class="mg-btn" data-close>取消</button><button class="mg-btn primary" value="ok">' + MG.esc(okLabel || "確定") + '</button></div></form>');
      var inp = d.querySelector("input"); inp.focus(); inp.select(); var done = false;
      d.querySelector("form").onsubmit = function(){ done = true; res(inp.value.trim()); };
      d.addEventListener("close", function(){ if(!done) res(null); });
    });
  };
  MG.confirm = function(msg, okLabel){
    return new Promise(function(res){
      var ok = false, d = MG.dialog('<h3 style="font-size:17px;">' + MG.esc(msg) + '</h3><div class="mg-row end"><button class="mg-btn" data-close>取消</button><button class="mg-btn primary" data-ok>' + MG.esc(okLabel || "確定") + '</button></div>');
      d.querySelector("[data-ok]").onclick = function(){ ok = true; d.close(); };
      d.addEventListener("close", function(){ res(ok); });
    });
  };

  // ---------- 翻譯語言 ----------
  // 生詞庫本來就有英文、泰文；其他語言第一次用到時自動翻譯一次、存在老師帳號，老師可以修改
  MG.LANGS = [
    { k: "en", n: "English 英文" }, { k: "th", n: "ภาษาไทย 泰文" }, { k: "ja", n: "日本語 日文" },
    { k: "vi", n: "Tiếng Việt 越南文" }, { k: "tl", n: "Filipino 菲律賓文" }, { k: "id", n: "Bahasa Indonesia 印尼文" },
    { k: "ko", n: "한국어 韓文" }, { k: "ms", n: "Bahasa Melayu 馬來文" }, { k: "my", n: "မြန်မာ 緬甸文" },
    { k: "es", n: "Español 西班牙文" }, { k: "fr", n: "Français 法文" }, { k: "de", n: "Deutsch 德文" }
  ];
  MG.langName = function(k){ var l = MG.LANGS.filter(function(x){ return x.k === k; })[0]; return l ? l.n : k; };
  MG.langShort = function(k){ return MG.langName(k).split(" ").slice(-1)[0]; };
  MG.wkey = function(w){ return encodeURIComponent(String(w)).replace(/\./g, "%2E").slice(0, 700); };
  var trMem = {};
  MG.translate = async function(zh, code){
    var mk = code + "|" + zh; if(trMem[mk]) return trMem[mk];
    var out = null;
    try{
      var ctl = new AbortController(), to = setTimeout(function(){ ctl.abort(); }, 8000);
      var r = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-TW&tl=" + encodeURIComponent(code === "tl" ? "tl" : code) + "&dt=t&q=" + encodeURIComponent(zh), { signal: ctl.signal }); clearTimeout(to);
      var j = await r.json(); var t = j && j[0] && j[0].map(function(x){ return x && x[0] ? x[0] : ""; }).join("").trim();
      if(t) out = t;
    }catch(e){}
    if(!out){
      try{
        var ctl2 = new AbortController(), to2 = setTimeout(function(){ ctl2.abort(); }, 8000);
        var r2 = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(zh) + "&langpair=" + encodeURIComponent("zh-TW|" + code), { signal: ctl2.signal }); clearTimeout(to2);
        var j2 = await r2.json(); var t2 = j2 && j2.responseData && j2.responseData.translatedText, mt = j2 && j2.responseData && Number(j2.responseData.match);
        if(t2 && !/MYMEMORY WARNING|INVALID/i.test(t2) && (isNaN(mt) || mt >= 0.8)) out = t2.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
      }catch(e){}
    }
    if(out) trMem[mk] = out;
    return out;
  };
  // 一批詞語補上某個語言的翻譯（同時最多 4 個請求）；onEach(word, text) 每翻好一個就呼叫
  MG.translateMissing = async function(words, code, onEach){
    var todo = words.filter(function(w){ return !MG.trOf(w, code); }), i = 0;
    async function worker(){ while(i < todo.length){ var w = todo[i++]; var t = await MG.translate(w.w, code); if(t){ w.tr = w.tr || {}; w.tr[code] = t; } if(onEach) onEach(w, t); } }
    await Promise.all([worker(), worker(), worker(), worker()]);
    return todo.length;
  };

  // ---------- 詞語 ----------
  // 詞語格式：{ id, w: 生詞, p: 拼音, zy: 注音, tr: { en, th, ja, vi… }, e: Emoji }
  MG.fromBank = function(v, i){
    var tr = {}; if(v["英文翻譯"]) tr.en = String(v["英文翻譯"]).trim(); if(v["泰文翻譯"]) tr.th = String(v["泰文翻譯"]).trim();
    return { id: String(i), w: String(v["生詞"] || "").trim(), p: String(v["拼音"] || "").trim(), zy: String(v["注音"] || "").trim(), tr: tr, e: String(v["Emoji／圖示"] || "").trim(), pic: String(v["圖片"] || "").trim() };
  };
  // ---------- 注音 ----------
  var ZY_STAND = { yi:"ㄧ", ya:"ㄧㄚ", ye:"ㄧㄝ", yao:"ㄧㄠ", you:"ㄧㄡ", yan:"ㄧㄢ", yin:"ㄧㄣ", yang:"ㄧㄤ", ying:"ㄧㄥ", yong:"ㄩㄥ", wu:"ㄨ", wa:"ㄨㄚ", wo:"ㄨㄛ", wai:"ㄨㄞ", wei:"ㄨㄟ", wan:"ㄨㄢ", wen:"ㄨㄣ", wang:"ㄨㄤ", weng:"ㄨㄥ", yu:"ㄩ", yue:"ㄩㄝ", yuan:"ㄩㄢ", yun:"ㄩㄣ" };
  var ZY_FIN = { a:"ㄚ", o:"ㄛ", e:"ㄜ", "ê":"ㄝ", ai:"ㄞ", ei:"ㄟ", ao:"ㄠ", ou:"ㄡ", an:"ㄢ", en:"ㄣ", ang:"ㄤ", eng:"ㄥ", er:"ㄦ", ong:"ㄨㄥ", i:"ㄧ", ia:"ㄧㄚ", ie:"ㄧㄝ", iao:"ㄧㄠ", iu:"ㄧㄡ", ian:"ㄧㄢ", "in":"ㄧㄣ", iang:"ㄧㄤ", ing:"ㄧㄥ", iong:"ㄩㄥ", u:"ㄨ", ua:"ㄨㄚ", uo:"ㄨㄛ", uai:"ㄨㄞ", ui:"ㄨㄟ", uan:"ㄨㄢ", un:"ㄨㄣ", uang:"ㄨㄤ", "ü":"ㄩ", "üe":"ㄩㄝ", "üan":"ㄩㄢ", "ün":"ㄩㄣ" };
  var ZY_INI = { zh:"ㄓ", ch:"ㄔ", sh:"ㄕ", b:"ㄅ", p:"ㄆ", m:"ㄇ", f:"ㄈ", d:"ㄉ", t:"ㄊ", n:"ㄋ", l:"ㄌ", g:"ㄍ", k:"ㄎ", h:"ㄏ", j:"ㄐ", q:"ㄑ", x:"ㄒ", r:"ㄖ", z:"ㄗ", c:"ㄘ", s:"ㄙ" };
  function zySyl(base, tone){
    var body;
    if(ZY_STAND[base]) body = ZY_STAND[base];
    else {
      var ini = "", rest = base, two = base.slice(0, 2);
      if(ZY_INI[two]){ ini = two; rest = base.slice(2); } else if(ZY_INI[base[0]]){ ini = base[0]; rest = base.slice(1); }
      if((ini === "j" || ini === "q" || ini === "x") && rest[0] === "u") rest = "ü" + rest.slice(1);
      var f; if(ini && { zh:1, ch:1, sh:1, r:1, z:1, c:1, s:1 }[ini] && rest === "i") f = ""; else { f = ZY_FIN[rest]; if(f === undefined) f = rest; }
      body = (ini ? ZY_INI[ini] : "") + f;
    }
    return tone ? body + ["", "ˊ", "ˇ", "ˋ"][tone - 1] : "˙" + body;
  }
  // 生詞庫有「注音」就用；沒有就從拼音轉（拼音要一個音節一個空格才轉得準）
  // 拼音 → 注音：先把拼音切成一個一個音節（拼音黏在一起也沒問題，例如 shuǐguǒ、xièxie），再逐個轉。
  // 切不出來就回傳空字串（寧可不顯示，也不要顯示亂碼）。
  var STAND_OK = { a:1, o:1, e:1, "ê":1, ai:1, ei:1, ao:1, ou:1, an:1, en:1, ang:1, eng:1, er:1 };
  function validBase(b){
    if(!b) return false; if(ZY_STAND[b]) return true;
    var ini = ZY_INI[b.slice(0, 2)] ? b.slice(0, 2) : ZY_INI[b[0]] ? b[0] : "", rest = b.slice(ini.length);
    if(!ini) return !!STAND_OK[rest];
    if((ini === "j" || ini === "q" || ini === "x") && rest[0] === "u") rest = "ü" + rest.slice(1);
    return ZY_FIN[rest] !== undefined;
  }
  var TONE_OF = {}; Object.keys(MARKS).forEach(function(ch){ var v = MARKS[ch]; TONE_OF[ch] = [v.slice(0, -1), Number(v.slice(-1))]; });
  function splitToken(tok){
    var letters = [], tones = [];
    Array.from(tok).forEach(function(ch){
      if(TONE_OF[ch]){ letters.push(TONE_OF[ch][0]); tones.push(TONE_OF[ch][1]); }
      else if(/[a-zü]/.test(ch)){ letters.push(ch === "v" ? "ü" : ch); tones.push(0); }
    });
    var n = letters.length; if(!n) return null;
    // best[i]：前 i 個字母最少切成幾個音節；每個音節要是合法的，而且最多一個帶調號的字母
    var best = [0], from = [-1], INF = 1e9;
    for(var i = 1; i <= n; i++){
      best[i] = INF; from[i] = -1;
      for(var j = Math.max(0, i - 6); j < i; j++){
        if(best[j] >= INF) continue;
        var marked = 0; for(var k = j; k < i; k++) if(tones[k]) marked++;
        if(marked > 1 || !validBase(letters.slice(j, i).join(""))) continue;
        if(best[j] + 1 < best[i]){ best[i] = best[j] + 1; from[i] = j; }
      }
    }
    if(best[n] >= INF) return null;
    var out = [], pos = n;
    while(pos > 0){ var j0 = from[pos], t = 0; for(var q = j0; q < pos; q++) if(tones[q]) t = tones[q]; out.unshift({ l: letters.slice(j0, pos).join(""), t: t }); pos = j0; }
    return out;
  }
  MG.zyFromPy = function(py){
    var toks = String(py || "").toLowerCase().replace(/[0-5]/g, function(d){ return d; }).split(/[\s'’\-·,，、]+/).filter(Boolean), out = [];
    for(var i = 0; i < toks.length; i++){
      var tk = /[0-5]/.test(toks[i]) ? MG.pyNum(toks[i]) : toks[i], syl = splitToken(tk);
      if(!syl) return "";
      syl.forEach(function(x){ out.push(zySyl(x.l, x.t)); });
    }
    return out.join(" ");
  };
  // 用漢字本身查讀音（pinyin-pro＋台灣讀音修正表）轉注音；一個字一個音節，不會有切音節的問題
  function zyFromChars(zh){
    try{
      var pp = window.pinyinPro; if(!pp || !pp.pinyin || !zh || !/^[㐀-䶿一-鿿]+$/.test(zh)) return "";
      var arr = pp.pinyin(zh, { type: "array", toneType: "symbol" }), out = arr.map(function(x){ return MG.zyFromPy(x); });
      return out.length && out.every(Boolean) ? out.join(" ") : "";
    }catch(e){ return ""; }
  }
  // 生詞庫有「注音」就用；沒有就從拼音轉；拼音轉不出來、或音節數跟字數對不上，就用漢字查讀音
  MG.zyOf = function(w){
    if(!w) return ""; var z = String(w.zy || "").trim(); if(z) return z;
    var han = (String(w.w || "").match(/[㐀-䶿一-鿿]/g) || []).length, fromPy = w.p ? MG.zyFromPy(w.p) : "";
    if(fromPy && (!han || fromPy.split(" ").length === han || !/^[㐀-䶿一-鿿]+$/.test(w.w || ""))) return fromPy;
    return zyFromChars(w.w) || fromPy;
  };
  MG.phonName = function(phon){ return phon === "zy" ? "注音" : "拼音"; };
  MG.ph = function(text, phon){ return phon === "zy" ? String(text).replace(/拼音/g, "注音").replace(/pinyin/g, "zhuyin").replace(/Pinyin/g, "Zhuyin") : text; };
  // 用注音玩：把每個詞的「讀音」換成注音（原本的拼音留在 py），遊戲裡出現拼音的地方就都變成注音
  MG.withPhon = function(words, phon){
    if(phon !== "zy") return words || [];
    return (words || []).map(function(w){ return Object.assign({}, w, { py: w.p, p: MG.zyOf(w) }); });
  };

  // 圖片：老師另外設定的（Emoji 或圖片網址）優先，沒有就用生詞庫的「Emoji／圖示」
  MG.picOf = function(w){ if(!w) return ""; if(w.img) return w.img === "-" ? "" : String(w.img).trim(); return String(w.pic || w.e || "").trim(); };   // 老師在遊戲裡改的 > 教材上傳的圖片 > Emoji   // "-"＝老師刻意不要圖片
  MG.isUrl = function(v){ return /^(https?:|blob:|data:image)/.test(String(v || "")); };
  MG.picHtml = function(v){ return MG.isUrl(v) ? '<img class="pic" src="' + MG.esc(v) + '" alt="" draggable="false">' : '<span class="pic emo">' + MG.esc(v) + '</span>'; };
  MG.trOf = function(w, lang){ var t = (w.tr || {})[lang] || ""; return String(t).split(/[;；]/)[0].trim(); };
  // 卡片／答案上要顯示的字：w 詞語、p 拼音、t 翻譯、pt 拼音＋翻譯
  MG.sideText = function(w, kind, lang){
    if(kind === "w") return w.w;
    if(kind === "p") return w.p || "";
    if(kind === "t") return MG.trOf(w, lang) || w.p || "";
    if(kind === "pt") return (w.p || "") + " · " + (MG.trOf(w, lang) || "");
    if(kind === "i") return MG.picOf(w);
    return w.w;
  };
  // 出題範圍：每課取幾成的生詞，固定（照課本順序）或隨機（用種子，同一局大家一樣）
  MG.takeCount = function(n, pct){ if(!n || !pct) return 0; return Math.max(1, Math.min(n, Math.round(n * pct / 100))); };
  // cap：一局最多幾個生詞；超過時每一課照比例一起減少
  MG.poolCounts = function(lessons, cap){
    var ks = (lessons || []).map(function(L){ return MG.takeCount((L.words || []).filter(function(w){ return w && w.w; }).length, L.pct); });
    var sum = ks.reduce(function(a, b){ return a + b; }, 0);
    if(cap && sum > cap){
      // 照比例分配，零頭給小數部分最大的課；每一課至少 1 個（課比上限還多時才會有課分不到）
      var raw = ks.map(function(k){ return k * cap / sum; }), out = raw.map(function(r, i){ return ks[i] ? Math.max(1, Math.floor(r)) : 0; });
      var left = cap - out.reduce(function(a, b){ return a + b; }, 0);
      var order = raw.map(function(r, i){ return i; }).sort(function(a, b){ return (raw[b] - Math.floor(raw[b])) - (raw[a] - Math.floor(raw[a])); });
      for(var j = 0; left > 0 && j < order.length * 2; j++){ var i = order[j % order.length]; if(ks[i] > out[i]){ out[i]++; left--; } }
      while(left < 0){ var big = out.indexOf(Math.max.apply(null, out)); if(out[big] <= 1) break; out[big]--; left++; }
      ks = out;
    }
    return ks;
  };
  MG.buildPool = function(lessons, sample, seed, cap){
    var rnd = MG.rng(seed || 1), seen = {}, pool = [], ks = MG.poolCounts(lessons, cap);
    (lessons || []).forEach(function(L, li){
      var ws = (L.words || []).filter(function(w){ return w && w.w; }), k = ks[li];
      if(!k) return;
      var pick = sample === "random" ? MG.shuffle(ws, rnd).slice(0, k) : ws.slice(0, k);
      pick.forEach(function(w){ if(seen[w.w]) return; seen[w.w] = 1; pool.push(w); });
    });
    return pool;
  };
  // 套用老師修改過的翻譯、拼音（存在帳號裡的那一份優先）
  MG.applyTr = function(words, store){
    store = store || {};
    words.forEach(function(w){
      var k = MG.wkey(w.w);
      Object.keys(store).forEach(function(lang){ var v = store[lang] && store[lang][k]; if(!v) return; if(lang === "_py") w.p = v; else if(lang === "_img") w.img = v; else { w.tr = w.tr || {}; w.tr[lang] = v; } });
    });
    return words;
  };

  // ---------- 計分（所有遊戲一樣：答對 100 分＋速度加分最多 50 分，答錯扣 20 分） ----------
  MG.newScore = function(init){ var s = { s: 0, c: 0, w: 0, rt: 0, n: 0 }; if(init) Object.keys(s).forEach(function(k){ if(typeof init[k] === "number") s[k] = init[k]; }); return s; };
  MG.hit = function(sc, rtMs){ var bonus = Math.round(50 * MG.clamp((8000 - rtMs) / 6500, 0, 1)); sc.c++; sc.n++; sc.rt += Math.round(rtMs); sc.s += 100 + bonus; return 100 + bonus; };
  MG.miss = function(sc){ sc.w++; sc.n++; var before = sc.s; sc.s = Math.max(0, sc.s - 20); return sc.s - before; };
  MG.acc = function(sc){ return sc && sc.n ? sc.c / sc.n : 0; };
  MG.avgRt = function(sc){ return sc && sc.c ? sc.rt / sc.c : 0; };
  // 排名：分數高的在前；同分比正確率，再比平均反應時間（快的在前）
  MG.rankCmp = function(a, b){ return (b.s - a.s) || (MG.acc(b) - MG.acc(a)) || ((MG.avgRt(a) || 1e9) - (MG.avgRt(b) || 1e9)); };

  // ---------- 音效（WebAudio 合成，不用音檔） ----------
  var actx = null;
  MG.sound = { on: true };
  MG.beep = function(kind){
    if(!MG.sound.on) return;
    try{
      actx = MG.audioCtx ? MG.audioCtx() : (actx || new (window.AudioContext || window.webkitAudioContext)()); if(!actx) return;
      var now = actx.currentTime, seq = { ok: [[660, 0], [880, 0.08]], bad: [[220, 0], [180, 0.09]], pop: [[520, 0], [1040, 0.05]], go: [[523, 0], [659, 0.12], [784, 0.24]], tick: [[880, 0]], end: [[784, 0], [659, 0.15], [523, 0.3]] }[kind] || [[600, 0]];
      seq.forEach(function(n){
        var o = actx.createOscillator(), g = actx.createGain(); o.type = kind === "bad" ? "square" : "triangle"; o.frequency.value = n[0];
        g.gain.setValueAtTime(0.0001, now + n[1]); g.gain.exponentialRampToValueAtTime(kind === "bad" ? 0.06 : 0.12, now + n[1] + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + n[1] + 0.16);
        o.connect(g); g.connect(actx.destination); o.start(now + n[1]); o.stop(now + n[1] + 0.2);
      });
    }catch(e){}
  };

  // ---------- Firebase（跟平台同一個資料庫；學生用匿名登入） ----------
  MG.fb = {
    ready: new Promise(function(res){
      if(window.__firebaseReady || window.__firebaseFailed) res(!window.__firebaseFailed);
      else window.addEventListener("firebase-bridge-ready", function(){ res(!window.__firebaseFailed); }, { once: true });
    }),
    r: function(p){ return window.ref(window.db, p); },
    get: async function(p){ var s = await window.get(MG.fb.r(p)); return s.exists() ? s.val() : null; },
    set: function(p, v){ return window.set(MG.fb.r(p), v === undefined ? null : v); },
    update: function(p, v){ return window.update(MG.fb.r(p), v); },
    remove: function(p){ return window.set(MG.fb.r(p), null); },
    on: function(p, cb, err){ return window.onValue(MG.fb.r(p), function(s){ cb(s.exists() ? s.val() : null); }, err || function(e){ console.warn("onValue", p, e); }); },
    uid: function(){ return (window.auth && window.auth.currentUser && window.auth.currentUser.uid) || ""; },
    newId: function(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
    offset: 0,
    now: function(){ return Date.now() + (MG.fb.offset || 0); }
  };
  MG.fb.ready.then(function(ok){ if(ok) try{ MG.fb.on(".info/serverTimeOffset", function(v){ MG.fb.offset = Number(v) || 0; }, function(){}); }catch(e){} });

  // ---------- 上傳圖片（Firebase Storage；太大的先縮小） ----------
  MG.uploadImage = async function(file, path){
    if(!window.storageApi) throw new Error("檔案儲存還沒準備好，請稍後再試");
    if(!/^image\//.test(file.type)) throw new Error("請選圖片檔");
    var blob = file;
    if(file.size > 600000){
      try{
        var bmp = await createImageBitmap(file), sc = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
        var cv = document.createElement("canvas"); cv.width = Math.round(bmp.width * sc); cv.height = Math.round(bmp.height * sc); cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
        blob = await new Promise(function(r){ cv.toBlob(r, file.type === "image/png" ? "image/png" : "image/jpeg", 0.85); }) || file;
      }catch(e){ blob = file; }
    }
    if(blob.size > 5 * 1024 * 1024) throw new Error("圖片太大（超過 5 MB）");
    var A = window.storageApi, r = A.ref(A.storage, path);
    await A.uploadBytes(r, blob, { contentType: blob.type || file.type });
    return await A.getDownloadURL(r);
  };

  // ---------- QR code ----------
  MG.qrSvg = function(text, px){
    try{ var q = qrcode(0, "M"); q.addData(text); q.make(); var n = q.getModuleCount(), cell = Math.max(2, Math.floor((px || 220) / (n + 8))); return q.createSvgTag({ cellSize: cell, margin: cell * 4, scalable: true }); }
    catch(e){ return ""; }
  };
  MG.copy = async function(text){
    try{ await navigator.clipboard.writeText(text); return true; }
    catch(e){ var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); var ok = false; try{ ok = document.execCommand("copy"); }catch(er){} t.remove(); return ok; }
  };
  MG.csv = function(rows, name){
    var txt = "\ufeff" + rows.map(function(r){ return r.map(function(c){ c = String(c == null ? "" : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(","); }).join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
})();
