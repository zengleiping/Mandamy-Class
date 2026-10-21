/* 曼米中文 · 配對 Match
   比速度：全部配完，記錄時間和錯誤次數；限時：時間內配越多越好，一批配完自動換下一批。
   MG.Match.create(root, { words, lang, pair:"p"|"t"|"pt", mode:"speed"|"timed", seconds, batch, seed,
                           startAt, endAt, now, init, onScore, onEnd, onQuit, title, side }) */
(function(){
  var MG = window.MG;
  var PAIR_NAME = { p: "詞語 ↔ 拼音 Word ↔ pinyin", t: "詞語 ↔ 翻譯 Word ↔ meaning", pt: "詞語 ↔ 拼音＋翻譯 Word ↔ pinyin + meaning", i: "詞語 ↔ 圖片 Word ↔ picture" };
  MG.MATCH_PAIRS = PAIR_NAME;

  function create(root, o){
    var now = o.now || function(){ return Date.now(); };
    var TH = MG.THEMES[o.theme] || MG.THEMES.plain;
    var rnd = MG.rng(o.seed || 1), batchN = MG.clamp(Number(o.batch) || 6, 3, 8);
    var words = MG.withPhon(o.words, o.phon).filter(function(w){ return w && w.w && ansText(w); });
    var sc = MG.newScore(o.init), total = words.length, missed = {};
    var startAt = o.startAt || now(), endAt = o.mode === "timed" ? (o.endAt || startAt + (Number(o.seconds) || 60) * 1000) : (o.endAt || 0);
    var queue = MG.shuffle(words, rnd), cur = [], sel = null, lastAt = startAt, ended = false, timer = null, busy = false;
    if(o.mode !== "timed" && sc.c) queue = queue.slice(Math.min(sc.c, queue.length));   // 重新連線：已經配好的不再出現

    function ansText(w){ return MG.sideText(w, o.pair === "t" ? "t" : o.pair === "pt" ? "pt" : o.pair === "i" ? "i" : "p", o.lang); }
    function refill(){ if(o.mode === "timed" && queue.length < batchN * 2) queue = queue.concat(MG.shuffle(words, rnd)); }
    function nextBatch(){
      refill();
      var pick = [], seenA = {}, seenW = {}, rest = [];
      queue.forEach(function(w){
        var a = ansText(w);
        if(pick.length < batchN && !seenA[a] && !seenW[w.w]){ pick.push(w); seenA[a] = 1; seenW[w.w] = 1; } else rest.push(w);
      });
      queue = rest; return pick;
    }

    root.innerHTML = '<div class="gm mt">' +
      '<div class="gm-hud"><span class="gm-title">' + MG.esc(o.title || "配對 Match") + '</span><span class="note">' + MG.esc(MG.ph(PAIR_NAME[o.pair] || "", o.phon)) + '</span>' +
      (o.mode === "timed" ? '' : '<div class="mt-prog"><i style="width:0%"></i></div><span class="note mt-pn"></span>') + '<span class="grow"></span>' +
      '<div class="gm-stat time"><small>' + (o.mode === "timed" ? "剩下 Left" : "時間 Time") + '</small><b class="mt-time">0:00</b></div>' +
      '<div class="gm-stat"><small>答錯 Wrong</small><b class="mt-err">0</b></div>' +
      '<div class="gm-stat score"><small>分數 Score</small><b class="mt-score">0</b></div>' +
      MG.musicBtn(o.music) + '<button class="mg-btn sm ghost mt-snd">' + (MG.sound.on ? "音效 開 Sound on" : "音效 關 Sound off") + '</button>' +
      (o.onQuit ? '<button class="mg-btn sm mt-quit">結束 Quit</button>' : '') + '</div>' +
      '<div class="mt-stage" style="background:' + (TH.bg || "var(--paper)") + '">' + (TH.deco ? '<div class="bl-bg">' + TH.deco() + '</div>' : '') + '<div class="mt-board"><div class="mt-col mt-l"></div><div class="mt-col mt-r"></div></div></div></div>';
    var el = root.firstChild, colL = MG.$(".mt-l", el), colR = MG.$(".mt-r", el);

    function render(){
      cur = nextBatch(); sel = null;
      if(!cur.length){ finish(true); return; }
      var left = MG.shuffle(cur, rnd), right = MG.shuffle(cur, rnd);
      colL.innerHTML = left.map(function(w){ return '<button class="mt-card zh" data-side="l" data-w="' + MG.esc(w.w) + '"><span class="fit" data-fmax="34" data-fmin="12">' + MG.esc(w.w) + '</span></button>'; }).join("");
      colR.innerHTML = right.map(function(w){
        if(o.pair === "i") return '<button class="mt-card ans picc" data-side="r" data-a="' + MG.esc(ansText(w)) + '">' + MG.picHtml(ansText(w)) + '</button>';
        if(o.pair === "pt") return '<button class="mt-card ans' + (o.phon === "zy" ? " zy" : "") + '" data-side="r" data-a="' + MG.esc(ansText(w)) + '"><span class="fit" data-fmax="20" data-fmin="10">' + MG.esc(w.p || "") + '</span><span class="fit sub" data-fmax="16" data-fmin="9">' + MG.esc(MG.trOf(w, o.lang)) + '</span></button>';
        return '<button class="mt-card ans' + (o.phon === "zy" && o.pair === "p" ? " zy" : "") + '" data-side="r" data-a="' + MG.esc(ansText(w)) + '"><span class="fit" data-fmax="' + (o.pair === "t" ? 20 : o.phon === "zy" ? 30 : 24) + '" data-fmin="9">' + MG.esc(ansText(w)) + '</span></button>';
      }).join("");
      requestAnimationFrame(function(){ MG.fitAll(el); });
      lastAt = Math.max(lastAt, now());
    }
    function hud(){
      MG.$(".mt-score", el).textContent = sc.s; MG.$(".mt-err", el).textContent = sc.w;
      if(o.mode !== "timed"){ var pct = total ? Math.min(100, sc.c / total * 100) : 0; MG.$(".mt-prog i", el).style.width = pct + "%"; MG.$(".mt-pn", el).textContent = sc.c + " / " + total; }
    }
    function pop(card, txt, neg){
      var r = card.getBoundingClientRect(), br = el.getBoundingClientRect(), p = document.createElement("div");
      p.className = "gm-pop" + (neg ? " neg" : ""); p.textContent = txt; p.style.left = (r.left - br.left + r.width / 2 - 20) + "px"; p.style.top = (r.top - br.top) + "px";
      el.appendChild(p); setTimeout(function(){ p.remove(); }, 950);
    }
    function wordOf(card){ var w = card.dataset.w; return cur.filter(function(x){ return x.w === w; })[0]; }
    function check(a, b){
      var L = a.dataset.side === "l" ? a : b, R = L === a ? b : a, w = wordOf(L);
      if(w && ansText(w) === R.dataset.a){
        var t = now(), pts = MG.hit(sc, t - lastAt); lastAt = t;
        L.classList.remove("sel"); R.classList.remove("sel"); L.classList.add("ok"); R.classList.add("ok"); pop(R, "+" + pts); MG.beep("ok");
        setTimeout(function(){ L.classList.add("gone"); R.classList.add("gone"); }, 430);
        hud(); emit();
        if(MG.$$(".mt-card:not(.ok)", colL).length === 0){
          if(o.mode !== "timed" && !queue.length){ setTimeout(function(){ finish(true); }, 350); return; }
          busy = true; setTimeout(function(){ busy = false; if(!ended) render(); }, 420);
        }
      } else {
        var d = MG.miss(sc); if(w) missed[w.w] = w;
        [L, R].forEach(function(c){ c.classList.remove("sel"); c.classList.add("bad"); setTimeout(function(){ c.classList.remove("bad"); }, 420); });
        if(d) pop(R, String(d), true); MG.beep("bad"); hud(); emit();
      }
      sel = null;
    }
    el.addEventListener("pointerdown", function(e){
      var c = e.target.closest(".mt-card"); if(!c || ended || busy || c.classList.contains("ok")) return;
      e.preventDefault();
      if(!sel){ sel = c; c.classList.add("sel"); return; }
      if(sel === c){ c.classList.remove("sel"); sel = null; return; }
      if(sel.dataset.side === c.dataset.side){ sel.classList.remove("sel"); sel = c; c.classList.add("sel"); return; }
      check(sel, c);
    });
    MG.$(".mt-snd", el).onclick = function(){ MG.sound.on = !MG.sound.on; this.textContent = MG.sound.on ? "音效 開 Sound on" : "音效 關 Sound off"; };
    if(o.onQuit) MG.$(".mt-quit", el).onclick = function(){ MG.music.stop(); o.onQuit(); };
    MG.bindMusicBtn(el, o.music);

    function result(all){ return Object.assign({}, sc, { time: Math.max(0, (ended || now()) - startAt), done: !!all, total: total, missed: Object.keys(missed).map(function(k){ return missed[k]; }) }); }
    function emit(extra){ if(o.onScore) o.onScore(Object.assign({}, sc, { time: now() - startAt }, extra || {})); }
    function tick(){
      if(ended) return;
      var t = now();
      if(o.mode === "timed"){
        var left = endAt - t; MG.$(".mt-time", el).textContent = MG.fmtTime(left + 999);
        MG.$(".gm-stat.time", el).classList.toggle("warn", left < 10000); MG.music.fast(left < 10000);
        if(left <= 0){ finish(false); return; }
      } else {
        MG.$(".mt-time", el).textContent = MG.fmtTime(t - startAt);
        if(endAt && t >= endAt){ finish(false); return; }
      }
    }
    function finish(all){
      if(ended) return; ended = now(); clearInterval(timer); MG.music.stop();
      MG.beep("end"); var r = result(all && o.mode !== "timed");
      if(o.mode === "timed") r.time = endAt - startAt;
      if(o.onEnd) o.onEnd(r);
    }
    hud(); render(); tick(); timer = setInterval(tick, 200); if(o.music) MG.music.play(o.music); MG.audioHint(el);
    window.addEventListener("resize", function(){ if(!ended) MG.fitAll(el); });
    return { stop: function(){ MG.music.stop(); if(!ended){ ended = now(); clearInterval(timer); } }, finish: function(){ finish(false); }, score: function(){ return sc; }, result: function(){ return result(false); } };
  }
  MG.Match = { create: create };
})();
