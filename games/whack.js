/* 曼米中文 · 打地鼠 Whack-a-Mole
   上面出一個題目，地洞裡同時冒出幾隻地鼠，每隻舉著一個答案，打（點）對的那隻。打錯、或讓對的那隻縮回去都會少一條命。
   跟 Blast 一樣是各自計分的遊戲：自己玩（老師投影試玩、作業連結）、即時多人（個人排行＋小組比賽）都能用。
   MG.Whack.create(root, { words, lang, phon, q:"w2p"|"w2t"|"p2w"|"t2w", lives, speed, seconds, count, seed, startAt, endAt, now, init, onScore, onEnd, onQuit, title, music }) */
(function(){
  var MG = window.MG;
  var Q_NAME = { w2p: "看詞語，打拼音 Word → pinyin", w2t: "看詞語，打翻譯 Word → meaning", p2w: "看拼音，打詞語 Pinyin → word", t2w: "看翻譯，打詞語 Meaning → word" };
  MG.WHACK_Q = Q_NAME;
  var STAY = [4600, 3700, 3000, 2400, 1900];   // 速度 1～5：地鼠露出來幾毫秒
  var HOLES = 9;

  function moleSvg(){
    return '<svg viewBox="0 0 100 92" class="wk-svg" aria-hidden="true"><circle cx="20" cy="30" r="11" fill="#7A4E2D"/><circle cx="80" cy="30" r="11" fill="#7A4E2D"/><circle cx="20" cy="30" r="5.5" fill="#E9A9A0"/><circle cx="80" cy="30" r="5.5" fill="#E9A9A0"/>' +
      '<path d="M8 92 C8 40 26 14 50 14 C74 14 92 40 92 92Z" fill="#8B5E3C"/><ellipse cx="50" cy="66" rx="30" ry="24" fill="#B98A62"/>' +
      '<circle cx="36" cy="42" r="5" fill="#2B2320"/><circle cx="64" cy="42" r="5" fill="#2B2320"/><circle cx="37.6" cy="40.2" r="1.7" fill="#fff"/><circle cx="65.6" cy="40.2" r="1.7" fill="#fff"/>' +
      '<ellipse cx="50" cy="54" rx="8" ry="6" fill="#E58E8E"/><path d="M45 62 Q50 67 55 62" stroke="#5A3A24" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="46.5" y="62.5" width="7" height="7" rx="1.5" fill="#fff" stroke="#5A3A24" stroke-width="1"/></svg>';
  }

  function create(root, o){
    var now = o.now || function(){ return Date.now(); };
    var rnd = MG.rng(o.seed || 1), q = Q_NAME[o.q] ? o.q : "w2p";
    var ansKind = q === "w2p" ? "p" : q === "w2t" ? "t" : "w", zyM = o.phon === "zy";
    var words = MG.withPhon(o.words, o.phon).filter(function(w){ return w && w.w && MG.sideText(w, ansKind, o.lang) && (q !== "p2w" || w.p) && (q !== "t2w" || MG.trOf(w, o.lang)); });
    var seconds = Number(o.seconds) || 0, maxLives = Number(o.lives); if(isNaN(maxLives)) maxLives = 3;
    if(!seconds && !maxLives) maxLives = 3;
    var sc = MG.newScore(o.init), lives = o.init && typeof o.init.lives === "number" ? o.init.lives : maxLives;
    var startAt = o.startAt || now(), endAt = seconds ? (o.endAt || startAt + seconds * 1000) : (o.endAt || 0);
    var stayMs = STAY[MG.clamp(Number(o.speed) || 3, 1, 5) - 1];
    var queue = [], round = null, ended = false, timers = [], tick = 0, streak = 0, missed = {}, roundNo = 0;

    var cells = ""; for(var i = 0; i < HOLES; i++) cells += '<div class="wk-cell" data-i="' + i + '"><div class="wk-hole"></div><div class="wk-mole"></div><div class="wk-front"></div></div>';
    root.innerHTML = '<div class="gm wk">' +
      '<div class="gm-hud"><span class="gm-title">' + MG.esc(o.title || "打地鼠 Whack-a-Mole") + '</span><span class="note">' + MG.esc(MG.ph(Q_NAME[q], o.phon)) + '</span><span class="gm-sp"></span>' +
      (maxLives ? '<div class="gm-stat"><small>生命 Lives</small><span class="bl-lives"></span></div>' : '') +
      '<div class="gm-stat time"><small>' + (endAt ? "剩下 Left" : "時間 Time") + '</small><b class="wk-time">0:00</b></div>' +
      '<div class="gm-stat"><small>答錯 Wrong</small><b class="wk-err">0</b></div>' +
      '<div class="gm-stat score"><small>分數 Score</small><b class="wk-score">0</b></div>' +
      MG.musicBtn(o.music) + '<button class="mg-btn sm ghost wk-snd">' + (MG.sound.on ? "音效 開 Sound on" : "音效 關 Sound off") + '</button>' +
      (o.onQuit ? '<button class="mg-btn sm wk-quit">結束 Quit</button>' : '') + '</div>' +
      '<div class="wk-stage"><div class="bl-q"><small class="wk-qs"></small><span class="fit"></span></div><div class="wk-grid">' + cells + '</div></div></div>';
    var el = root.firstChild, stage = MG.$(".wk-stage", el), qEl = MG.$(".bl-q .fit", el), qSmall = MG.$(".wk-qs", el), cellEls = [].slice.call(el.querySelectorAll(".wk-cell"));
    qSmall.textContent = ansKind === "w" ? "找出這個詞語 Find the word" : ansKind === "p" ? MG.ph("找出拼音 Find the pinyin", o.phon) : "找出翻譯 Find the meaning";

    function hud(){
      MG.$(".wk-score", el).textContent = sc.s; MG.$(".wk-err", el).textContent = sc.w;
      if(maxLives){ var h = ""; for(var i = 0; i < maxLives; i++) h += '<span class="' + (i < lives ? "" : "off") + '">♥</span>'; MG.$(".bl-lives", el).innerHTML = h; }
    }
    function later(fn, ms){ var t = setTimeout(function(){ timers = timers.filter(function(x){ return x !== t; }); fn(); }, ms); timers.push(t); return t; }
    function clearTimers(){ timers.forEach(clearTimeout); timers = []; }
    function nextWord(){ if(!queue.length) queue = MG.shuffle(words, rnd); return queue.shift(); }
    function promptOf(w){ return q === "p2w" ? w.p : q === "t2w" ? MG.trOf(w, o.lang) : w.w; }
    function options(w){
      var seen = {}, out = [w]; seen[MG.sideText(w, ansKind, o.lang)] = 1;
      MG.shuffle(words, rnd).forEach(function(x){ if(out.length >= 4) return; var a = MG.sideText(x, ansKind, o.lang); if(x.w === w.w || seen[a]) return; seen[a] = 1; out.push(x); });
      return MG.shuffle(out, rnd);
    }
    function pop(cell, txt, neg){ var p = document.createElement("div"); p.className = "gm-pop" + (neg ? " neg" : ""); p.textContent = txt; p.style.left = cell.offsetLeft + cell.offsetWidth / 2 - 14 + "px"; p.style.top = cell.offsetTop + "px"; MG.$(".wk-grid", el).appendChild(p); setTimeout(function(){ p.remove(); }, 900); }
    function hideAll(delay){ cellEls.forEach(function(c){ var m = MG.$(".wk-mole", c); m.classList.remove("up"); if(delay) m.style.pointerEvents = "none"; }); }
    function clearMoles(){ cellEls.forEach(function(c){ var m = MG.$(".wk-mole", c); m.className = "wk-mole"; m.innerHTML = ""; m.style.pointerEvents = ""; delete m._o; }); }
    function showAnswer(w){ var a = document.createElement("div"); a.className = "bl-ans"; a.innerHTML = '<span class="zh">' + MG.esc(w.w) + '</span>　' + MG.esc(w.p || "") + (MG.trOf(w, o.lang) ? '　' + MG.esc(MG.trOf(w, o.lang)) : ""); stage.appendChild(a); setTimeout(function(){ a.remove(); }, 1900); }

    function newRound(){
      if(ended) return;
      clearTimers(); clearMoles(); roundNo++;
      var w = nextWord(); if(!w){ finish(); return; }
      round = { w: w, t0: now(), done: false };
      qEl.className = "fit" + (q === "t2w" || (q === "p2w" && !zyM) ? "" : " zh"); qEl.textContent = promptOf(w);
      requestAnimationFrame(function(){ MG.fit(qEl); });
      var opts = options(w), holes = MG.shuffle(cellEls.map(function(_, i){ return i; }), rnd).slice(0, opts.length), maxEnd = 0, okEnd = 0;
      opts.forEach(function(x, k){
        var cell = cellEls[holes[k]], m = MG.$(".wk-mole", cell), txt = MG.sideText(x, ansKind, o.lang), zh = ansKind === "w" || (zyM && ansKind === "p");
        m.innerHTML = moleSvg() + '<div class="wk-sign"><span class="fit' + (zh ? " zh" : "") + '" data-fmax="' + (zh ? 28 : 20) + '">' + MG.esc(txt) + '</span></div>';
        m._o = { ok: x.w === w.w, cell: cell };
        var delay = 120 + k * 150 + Math.floor(rnd() * 220);
        later(function(){ if(ended || !round || round.done) return; m.classList.add("up"); MG.fitAll ? MG.fitAll(m) : MG.fit(MG.$(".fit", m), zh ? 28 : 20, 11); }, delay);
        later(function(){ m.classList.remove("up"); }, delay + stayMs);
        if(delay + stayMs > maxEnd) maxEnd = delay + stayMs; if(m._o.ok) okEnd = delay + stayMs;
        m.onpointerdown = function(e){ e.preventDefault(); whack(m); };
      });
      later(function(){ if(!ended && round && !round.done) timeout(); }, okEnd + 80);
    }
    function whack(m){
      if(ended || !round || round.done || !m._o || m._o.dead || !m.classList.contains("up")) return;
      if(m._o.ok){
        round.done = true; var pts = MG.hit(sc, now() - round.t0); streak++;
        m.classList.add("hit"); m._o.cell.classList.add("bonk"); pop(m._o.cell, "+" + pts); MG.beep("pop");
        cellEls.forEach(function(c){ var mm = MG.$(".wk-mole", c); if(mm !== m){ mm.style.pointerEvents = "none"; mm.classList.remove("up"); } });
        hud(); emit(); clearTimers(); later(newRound, 650);
      } else {
        m._o.dead = true; m.classList.add("bad"); m._o.cell.classList.add("bonk"); missed[round.w.w] = round.w; streak = 0;
        var d = MG.miss(sc); pop(m._o.cell, d ? String(d) : "✕", true); MG.beep("bad"); later(function(){ m.classList.remove("up"); }, 380); loseLife(); emit();
      }
    }
    function timeout(){
      round.done = true; streak = 0; missed[round.w.w] = round.w; showAnswer(round.w); MG.beep("bad"); hideAll(true); loseLife(); emit();
      if(!(maxLives && lives <= 0)) later(newRound, 1100);
    }
    function loseLife(){ if(!maxLives) return; lives = Math.max(0, lives - 1); hud(); if(lives <= 0){ clearTimers(); later(finish, 600); } }
    function clock(){
      if(ended) return; var t = now(), tm = MG.$(".wk-time", el);
      if(endAt){ var left = endAt - t; tm.textContent = MG.fmtTime(left + 999); MG.$(".gm-stat.time", el).classList.toggle("warn", left < 10000); MG.music.fast(left < 10000); if(left <= 0){ finish(); return; } }
      else tm.textContent = MG.fmtTime(t - startAt);
    }
    function emit(){ if(o.onScore) o.onScore(Object.assign({}, sc, { lives: lives, time: now() - startAt })); }
    function result(){ return Object.assign({}, sc, { lives: lives, time: Math.max(0, (ended || now()) - startAt), missed: Object.keys(missed).map(function(k){ return missed[k]; }) }); }
    function finish(){
      if(ended) return; ended = now(); clearInterval(tick); clearTimers(); clearMoles(); MG.music.stop(); MG.beep("end");
      if(o.onEnd) o.onEnd(result());
    }
    MG.$(".wk-snd", el).onclick = function(){ MG.sound.on = !MG.sound.on; this.textContent = MG.sound.on ? "音效 開 Sound on" : "音效 關 Sound off"; };
    if(o.onQuit) MG.$(".wk-quit", el).onclick = function(){ MG.music.stop(); clearInterval(tick); clearTimers(); o.onQuit(); };
    MG.bindMusicBtn(el, o.music);
    hud();
    if(words.length < 2){ stage.insertAdjacentHTML("beforeend", '<div class="bl-ans" style="animation:none">這個題型沒有可以用的詞語（可能缺拼音或翻譯）</div>'); return { stop: function(){}, finish: function(){}, score: function(){ return sc; }, result: result }; }
    tick = setInterval(clock, 250); clock();
    if(maxLives && lives <= 0) setTimeout(finish, 0); else { newRound(); if(o.music) MG.music.play(o.music); }
    MG.audioHint(el);
    return { stop: function(){ MG.music.stop(); if(!ended){ ended = now(); clearInterval(tick); clearTimers(); } }, finish: finish, score: function(){ return sc; }, result: result };
  }
  MG.Whack = { create: create };
})();
