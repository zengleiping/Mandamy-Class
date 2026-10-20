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

  MG.toast = function(msg, ms){
    var t = document.createElement("div"); t.className = "mg-toast"; t.textContent = msg; document.body.appendChild(t);
    setTimeout(function(){ t.classList.add("on"); }, 10); setTimeout(function(){ t.classList.remove("on"); setTimeout(function(){ t.remove(); }, 300); }, ms || 2600);
  };
  MG.fmtTime = function(ms){ ms = Math.max(0, ms || 0); var s = Math.floor(ms / 1000), m = Math.floor(s / 60); return m + ":" + String(s % 60).padStart(2, "0"); };
  MG.fmtSec = function(ms){ return (Math.max(0, ms || 0) / 1000).toFixed(1) + " 秒"; };

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
    return { id: String(i), w: String(v["生詞"] || "").trim(), p: String(v["拼音"] || "").trim(), zy: String(v["注音"] || "").trim(), tr: tr, e: String(v["Emoji／圖示"] || "").trim() };
  };
  MG.trOf = function(w, lang){ var t = (w.tr || {})[lang] || ""; return String(t).split(/[;；]/)[0].trim(); };
  // 卡片／答案上要顯示的字：w 詞語、p 拼音、t 翻譯、pt 拼音＋翻譯
  MG.sideText = function(w, kind, lang){
    if(kind === "w") return w.w;
    if(kind === "p") return w.p || "";
    if(kind === "t") return MG.trOf(w, lang) || w.p || "";
    if(kind === "pt") return (w.p || "") + " · " + (MG.trOf(w, lang) || "");
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
      Object.keys(store).forEach(function(lang){ var v = store[lang] && store[lang][k]; if(!v) return; if(lang === "_py") w.p = v; else { w.tr = w.tr || {}; w.tr[lang] = v; } });
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
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
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
