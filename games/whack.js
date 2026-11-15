/* 曼米中文 · 打地鼠 Whack-a-Mole
   上面出一個題目，地洞裡同時冒出幾隻地鼠，每隻舉著一個答案，打（點）對的那隻。打錯、或讓對的那隻縮回去都會少一條命。
   跟 Blast 一樣是各自計分的遊戲：自己玩（老師投影試玩、作業連結）、即時多人（個人排行＋小組比賽）都能用。
   MG.Whack.create(root, { words, lang, phon, q:"w2p"|"w2t"|"p2w"|"t2w", lives, speed, seconds, count, seed, startAt, endAt, now, init, onScore, onEnd, onQuit, title, music }) */
(function(){
  var MG = window.MG;
  var Q_NAME = { w2p: "看詞語，打拼音 Word → pinyin", w2t: "看詞語，打翻譯 Word → meaning", p2w: "看拼音，打詞語 Pinyin → word", t2w: "看翻譯，打詞語 Meaning → word",
    a2w: "聽聲音，打詞語 Listen → word", a2t: "聽聲音，打翻譯 Listen → meaning", a2i: "聽聲音，打圖片牌 Listen → picture", i2w: "看圖片，打文字牌 Picture → word", w2i: "看詞語，打圖片牌 Word → picture" };
  var ANS_KIND = { w2p: "p", w2t: "t", p2w: "w", t2w: "w", a2w: "w", a2t: "t", a2i: "i", i2w: "w", w2i: "i" };
  var SAY_RATE = 1.0;
  MG.WHACK_Q = Q_NAME;
  var STAY = [4600, 3700, 3000, 2400, 1900];   // 速度 1～5：地鼠露出來幾毫秒
  var HOLES = 9;

  function moleSvg(){
    return '<svg viewBox="0 0 100 92" class="wk-svg" aria-hidden="true"><circle cx="20" cy="30" r="11" fill="#7A4E2D"/><circle cx="80" cy="30" r="11" fill="#7A4E2D"/><circle cx="20" cy="30" r="5.5" fill="#E9A9A0"/><circle cx="80" cy="30" r="5.5" fill="#E9A9A0"/>' +
      '<path d="M8 92 C8 40 26 14 50 14 C74 14 92 40 92 92Z" fill="#8B5E3C"/><ellipse cx="50" cy="66" rx="30" ry="24" fill="#B98A62"/>' +
      '<circle cx="36" cy="42" r="5" fill="#2B2320"/><circle cx="64" cy="42" r="5" fill="#2B2320"/><circle cx="37.6" cy="40.2" r="1.7" fill="#fff"/><circle cx="65.6" cy="40.2" r="1.7" fill="#fff"/>' +
      '<ellipse cx="50" cy="54" rx="8" ry="6" fill="#E58E8E"/><path d="M45 62 Q50 67 55 62" stroke="#5A3A24" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="46.5" y="62.5" width="7" height="7" rx="1.5" fill="#fff" stroke="#5A3A24" stroke-width="1"/></svg>';
  }

  // 像素貓：頭＋肩膀（耳朵、點點眼睛、鬍鬚、深色外框），六種花色輪流出現
  var COATS = [
    { B: "#F0A24C", S: "#D07A2A", W: "#FFF0D6", E: "#2c2331" }, { B: "#9AA0B4", S: "#747A92", W: "#E9EBF2", E: "#2c2331" },
    { B: "#3c3a47", S: "#3c3a47", W: "#555362", E: "#F2D14F" }, { B: "#34323e", S: "#34323e", W: "#FFFFFF", E: "#7CCB62" },
    { B: "#FBF6EC", S: "#FBF6EC", W: "#FBF6EC", E: "#2c2331", C: "#EDA04A", D: "#3b3945", calico: true }, { B: "#F3E6D2", S: "#F3E6D2", W: "#FBF3E6", E: "#6FA8DC", D: "#7A5646", siamese: true }
  ];
  var CAT_CACHE = {};
  function catSvg(i){
    var ci = ((i % COATS.length) + COATS.length) % COATS.length; if(CAT_CACHE[ci]) return CAT_CACHE[ci];
    var c = COATS[ci], OLc = "#2c2331", W = 18, H = 15, g = [], y, x;
    for(y = 0; y < H; y++){ g.push([]); for(x = 0; x < W; x++) g[y][x] = ""; }
    function P(r1, r2, c1, c2, k){ for(var yy = r1; yy <= r2; yy++) for(var xx = c1; xx <= c2; xx++) g[yy][xx] = k; }
    P(2, 11, 2, 15, "B"); g[11][2] = ""; g[11][15] = ""; P(12, 14, 3, 14, "B"); P(0, 1, 2, 3, "B"); P(0, 1, 14, 15, "B"); g[0][2] = ""; g[0][15] = ""; g[1][3] = "P"; g[1][14] = "P";
    [5, 12].forEach(function(cx){ P(2, 3, cx, cx, "S"); }); P(2, 4, 8, 9, "S");
    P(7, 10, 6, 11, "W"); g[7][8] = "N"; g[7][9] = "N"; g[8][7] = "M"; g[8][10] = "M"; g[9][8] = "M"; g[9][9] = "M";
    P(5, 6, 5, 5, "E"); P(5, 6, 12, 12, "E"); g[4][5] = "L"; g[4][12] = "L";
    P(7, 7, 0, 1, "K"); P(9, 9, 0, 1, "K"); P(7, 7, 16, 17, "K"); P(9, 9, 16, 17, "K");
    if(c.calico){ for(y = 0; y <= 6; y++) for(x = 2; x <= 7; x++) if(g[y][x] === "B") g[y][x] = "D"; for(y = 2; y <= 8; y++) for(x = 12; x <= 15; x++) if(g[y][x] === "B") g[y][x] = "C"; for(y = 12; y <= 14; y++) for(x = 8; x <= 14; x++) if(g[y][x] === "B") g[y][x] = "D"; }
    if(c.siamese){ for(y = 0; y <= 3; y++) for(x = 2; x <= 15; x++) if(g[y][x] === "B" && (x <= 4 || x >= 13)) g[y][x] = "D"; for(y = 4; y <= 11; y++) for(x = 5; x <= 12; x++) if(g[y][x] === "B" || g[y][x] === "W") g[y][x] = "D"; }
    var col = { B: c.B, S: c.S, W: c.W, C: c.C, D: c.D, P: "#F4A6B4", N: "#E57F8F", M: OLc, E: c.E, L: "#ffffff", K: OLc };
    var cells = {}; for(y = 0; y < H; y++) for(x = 0; x < W; x++) if(g[y][x]) cells[x + "," + y] = col[g[y][x]];
    function solid(yy, xx){ var k = g[yy] && g[yy][xx]; return !!k && k !== "K"; }
    var out = {};
    for(y = -1; y <= H; y++) for(x = -1; x <= W; x++){ if(solid(y, x) || (g[y] && g[y][x] === "K")) continue; if(solid(y, x - 1) || solid(y, x + 1) || solid(y - 1, x) || solid(y + 1, x)) out[x + "," + y] = OLc; }
    function runs(map){ var rows = {}, svg = ""; Object.keys(map).forEach(function(k){ var p = k.split(","); (rows[+p[1]] = rows[+p[1]] || []).push([+p[0], map[k]]); });
      Object.keys(rows).forEach(function(yy){ var a = rows[yy].sort(function(p, q){ return p[0] - q[0]; }), i2 = 0; while(i2 < a.length){ var j = i2; while(j + 1 < a.length && a[j + 1][0] === a[j][0] + 1 && a[j + 1][1] === a[i2][1]) j++; svg += '<rect x="' + (a[i2][0] + 1) + '" y="' + (+yy + 1) + '" width="' + (a[j][0] - a[i2][0] + 1.04) + '" height="1.04" fill="' + a[i2][1] + '"/>'; i2 = j + 1; } }); return svg; }
    return (CAT_CACHE[ci] = '<svg viewBox="0 0 ' + (W + 2) + ' ' + (H + 2) + '" class="wk-svg wk-cat" shape-rendering="crispEdges" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' + runs(out) + runs(cells) + '</svg>');
  }

  function create(root, o){
    var now = o.now || function(){ return Date.now(); };
    var rnd = MG.rng(o.seed || 1), q = Q_NAME[o.q] ? o.q : "w2p", asCat = o.char !== "mole";
    var ansKind = ANS_KIND[q], zyM = o.phon === "zy", audioQ = q.charAt(0) === "a", picPrompt = q === "i2w";
    var words = MG.withPhon(o.words, o.phon).filter(function(w){ return w && w.w && MG.sideText(w, ansKind, o.lang) && (q !== "p2w" || w.p) && (q !== "t2w" || MG.trOf(w, o.lang)) && ((ansKind !== "i" && !picPrompt) || MG.picOf(w)); });
    var cancelSpeech = null;
    function say(w){ if(cancelSpeech) cancelSpeech(); cancelSpeech = MG.speak(w.w, { rate: SAY_RATE, voice: o.voice }); }
    var seconds = Number(o.seconds) || 0, maxLives = Number(o.lives); if(isNaN(maxLives)) maxLives = 3;
    if(!seconds && !maxLives) maxLives = 3;
    var sc = MG.newScore(o.init), lives = o.init && typeof o.init.lives === "number" ? o.init.lives : maxLives;
    var startAt = o.startAt || now(), endAt = seconds ? (o.endAt || startAt + seconds * 1000) : (o.endAt || 0);
    var stayMs = STAY[MG.clamp(Number(o.speed) || 3, 1, 5) - 1] + (audioQ ? 700 : 0);
    var queue = [], round = null, ended = false, timers = [], tick = 0, streak = 0, missed = {}, roundNo = 0;

    var cells = ""; for(var i = 0; i < HOLES; i++) cells += '<div class="wk-cell" data-i="' + i + '"><div class="wk-hole"></div><div class="wk-mole"></div><div class="wk-front"></div></div>';
    root.innerHTML = '<div class="gm wk">' +
      '<div class="gm-hud"><span class="gm-title">' + MG.esc(o.title || (asCat ? "打貓咪 Whack-a-Cat" : "打地鼠 Whack-a-Mole")) + '</span><span class="note">' + MG.esc(MG.ph(Q_NAME[q], o.phon)) + '</span><span class="gm-sp"></span>' +
      (maxLives ? '<div class="gm-stat"><small>生命 Lives</small><span class="bl-lives"></span></div>' : '') +
      '<div class="gm-stat time"><small>' + (endAt ? "剩下 Left" : "時間 Time") + '</small><b class="wk-time">0:00</b></div>' +
      '<div class="gm-stat"><small>答錯 Wrong</small><b class="wk-err">0</b></div>' +
      '<div class="gm-stat score"><small>分數 Score</small><b class="wk-score">0</b></div>' +
      MG.musicBtn(o.music) + '<button class="mg-btn sm ghost wk-snd">' + (MG.sound.on ? "音效 開 Sound on" : "音效 關 Sound off") + '</button>' +
      (o.onQuit ? '<button class="mg-btn sm wk-quit">結束 Quit</button>' : '') + '</div>' +
      '<div class="wk-stage' + (asCat ? " cat" : "") + '"><div class="bl-q"><small class="wk-qs"></small><span class="fit"></span></div><div class="wk-grid">' + cells + '</div></div></div>';
    var el = root.firstChild, stage = MG.$(".wk-stage", el), qEl = MG.$(".bl-q .fit", el), qSmall = MG.$(".wk-qs", el), cellEls = [].slice.call(el.querySelectorAll(".wk-cell"));
    qSmall.textContent = audioQ ? (asCat ? "聽聲音，打對的貓咪 Listen and whack the right cat" : "聽聲音，打對的地鼠 Listen and whack the right mole") : q === "i2w" ? "看圖片，找出詞語 Find the word for the picture" : q === "w2i" ? "找出這個詞語的圖片 Find the picture" : ansKind === "w" ? "找出這個詞語 Find the word" : ansKind === "p" ? MG.ph("找出拼音 Find the pinyin", o.phon) : "找出翻譯 Find the meaning";
    qEl.parentNode.addEventListener("click", function(e){ if(e.target.closest(".wk-play") && round) say(round.w); });

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
      if(audioQ){ qEl.className = "fit"; qEl.innerHTML = '<button type="button" class="mg-btn wk-play">🔊 再聽一次 Play again</button>'; later(function(){ if(!ended && round && !round.done) say(w); }, 150); }
      else if(picPrompt){ qEl.className = "fit picq"; qEl.innerHTML = MG.picHtml(MG.picOf(w)); }
      else { qEl.className = "fit" + (q === "t2w" || (q === "p2w" && !zyM) ? "" : " zh"); qEl.textContent = promptOf(w); requestAnimationFrame(function(){ MG.fit(qEl); }); }
      var opts = options(w), holes = MG.shuffle(cellEls.map(function(_, i){ return i; }), rnd).slice(0, opts.length), maxEnd = 0, okEnd = 0;
      opts.forEach(function(x, k){
        var cell = cellEls[holes[k]], m = MG.$(".wk-mole", cell), txt = MG.sideText(x, ansKind, o.lang), zh = ansKind === "w" || (zyM && ansKind === "p");
        m.innerHTML = (asCat ? catSvg(roundNo + k) : moleSvg()) + (ansKind === "i" ? '<div class="wk-sign picl">' + MG.picHtml(txt) + '</div>' : '<div class="wk-sign"><span class="fit' + (zh ? " zh" : "") + '" data-fmax="' + (zh ? 28 : 20) + '">' + MG.esc(txt) + '</span></div>');
        m._o = { ok: x.w === w.w, cell: cell };
        var delay = 120 + k * 150 + Math.floor(rnd() * 220);
        later(function(){ if(ended || !round || round.done) return; m.classList.add("up"); var fe = MG.$(".fit", m); if(fe) MG.fit(fe, zh ? 28 : 20, 11); }, delay);
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
      if(ended) return; ended = now(); clearInterval(tick); clearTimers(); clearMoles(); if(cancelSpeech) cancelSpeech(); MG.music.stop(); MG.beep("end");
      if(o.onEnd) o.onEnd(result());
    }
    MG.$(".wk-snd", el).onclick = function(){ MG.sound.on = !MG.sound.on; this.textContent = MG.sound.on ? "音效 開 Sound on" : "音效 關 Sound off"; };
    if(o.onQuit) MG.$(".wk-quit", el).onclick = function(){ MG.music.stop(); clearInterval(tick); clearTimers(); o.onQuit(); };
    MG.bindMusicBtn(el, o.music);
    hud();
    if(words.length < 2){ stage.insertAdjacentHTML("beforeend", '<div class="bl-ans" style="animation:none">這個題型沒有可以用的詞語（可能缺拼音或翻譯）</div>'); return { stop: function(){}, finish: function(){}, score: function(){ return sc; }, result: result }; }
    tick = setInterval(clock, 250); clock();
    function begin(){ if(ended) return; if(maxLives && lives <= 0) setTimeout(finish, 0); else { newRound(); if(o.music) MG.music.play(o.music); } }
    if(audioQ){
      // 聽聲音：先把這局的詞語音下載好（最多等 8 秒），開始才不會卡
      var gate = document.createElement("div"); gate.className = "bl-ans"; gate.style.animation = "none"; gate.textContent = "載入語音中… Loading the voice…"; stage.appendChild(gate);
      var uniq = {}, texts = words.map(function(w){ return w.w; }).filter(function(t){ if(uniq[t]) return false; uniq[t] = 1; return true; }).slice(0, 60);
      Promise.race([MG.tts.preload(texts, { rate: SAY_RATE, voice: o.voice }).catch(function(){}), new Promise(function(r){ setTimeout(r, 8000); })]).then(function(){ gate.remove(); begin(); });
      if(!MG.hasZhVoice()) MG.toast("這個裝置沒有中文語音，聽不到聲音 No Chinese voice on this device", 4500);
    } else begin();
    MG.audioHint(el);
    return { stop: function(){ MG.music.stop(); if(cancelSpeech) cancelSpeech(); if(!ended){ ended = now(); clearInterval(tick); clearTimers(); } }, finish: finish, score: function(){ return sc; }, result: result };
  }
  // 聽聲音模式：在等待室先把語音下載好
  function prefetch(o, words){ var uniq = {}, t = (words || []).map(function(w){ return w && w.w; }).filter(function(x){ if(!x || uniq[x]) return false; uniq[x] = 1; return true; }).slice(0, 60); return t.length ? MG.tts.preload(t, { rate: SAY_RATE, voice: o.voice }) : Promise.resolve(0); }
  MG.Whack = { create: create, prefetch: prefetch };
})();
