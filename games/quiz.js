/* 曼米中文 · 快問快答 Quiz（像 Kahoot）
   一題一題出，四個答案選一個；答得越快分數越高。時間到公布答案，再進下一題。
   即時多人：全班用同一個開始時間排程（每題 sec 秒＋公布 3.5 秒），所以每個人自動在同一秒進到同一題，不用老師一題一題按。
   作業／自己練習（self）：答完就公布，過一下自己進下一題。
   MG.Quiz.create(root, { words, lang, phon, q:"w2p"|"w2t"|"p2w"|"t2w"|"w2i"|"i2w"|"a2w"|"a2t"|"mix",
                          count, sec, seed, sync, spectate, startAt, now, init, music, onScore, onEnd, onQuit, title })
   MG.Quiz.totalMs(o) 一局總共多久（開房間算結束時間用） */
(function(){
  var MG = window.MG;
  var Q_NAME = {
    w2p: "看詞語，選拼音 Word → pinyin", w2t: "看詞語，選翻譯 Word → meaning", p2w: "看拼音，選詞語 Pinyin → word", t2w: "看翻譯，選詞語 Meaning → word",
    w2i: "看詞語，選圖片 Word → picture", i2w: "看圖片，選詞語 Picture → word", a2w: "聽聲音，選詞語 Listen → word", a2t: "聽聲音，選翻譯 Listen → meaning",
    mix: "綜合（每題不一樣） Mixed"
  };
  MG.QUIZ_Q = Q_NAME;
  var REVEAL = 3500, REVEAL_SELF = 2200;
  var ANS_KIND = { w2p: "p", w2t: "t", p2w: "w", t2w: "w", w2i: "i", i2w: "w", a2w: "w", a2t: "t" };
  var SAY_RATE = 1.1;   // 聽聲音題：念的速度
  function audioTexts(qs){ return qs.filter(function(Q){ return Q.type === "a2w" || Q.type === "a2t"; }).map(function(Q){ return Q.w.w; }); }
  var COLORS = ["#D9534F", "#4C7FBF", "#E0A526", "#4C8577"], LETTERS = ["A", "B", "C", "D"];

  function slotMs(o){ return (Number(o.sec) || 15) * 1000 + REVEAL; }
  function countOf(o, nWords){ return Math.max(1, Math.min(Number(o.count) || 10, nWords)); }
  function totalMs(o, n){ return countOf(o, n) * slotMs(o) + 800; }   // n：實際出幾題

  // 這個詞能不能出這種題型（要有拼音／翻譯／圖片，答案選項要湊得到 4 個不一樣的）
  function feasible(type, w, words, lang){
    var kind = ANS_KIND[type];
    var need = { w2p: !!w.p, w2t: !!MG.trOf(w, lang), p2w: !!w.p, t2w: !!MG.trOf(w, lang), w2i: !!MG.picOf(w), i2w: !!MG.picOf(w), a2w: true, a2t: !!MG.trOf(w, lang) }[type];
    if(!need) return false;
    var seen = {}, right = MG.sideText(w, kind, lang); seen[right] = 1; var n = 1;
    words.forEach(function(x){ if(x === w) return; var a = MG.sideText(x, kind, lang); if(!a || seen[a]) return; if(kind === "i" && !MG.picOf(x)) return; seen[a] = 1; n++; });
    return n >= 4;
  }

  // 題目：同一個種子＝大家拿到一模一樣的題目和選項順序
  function build(words, o){
    var rnd = MG.rng((Number(o.seed) || 1) + 31), lang = o.lang;
    var order = MG.shuffle(words, rnd), n = countOf(o, order.length);
    var types = o.q === "mix" || !o.q ? ["w2p", "w2t", "a2w", "p2w", "t2w"] : [o.q];
    var out = [];
    for(var i = 0; out.length < n && i < order.length * 2; i++){
      var w = order[i % order.length], ok = types.filter(function(t){ return feasible(t, w, words, lang); });
      if(!ok.length) continue;
      var type = ok[out.length % ok.length], kind = ANS_KIND[type], seen = {}, opts = [{ w: w, ok: true }];
      seen[MG.sideText(w, kind, lang)] = 1;
      MG.shuffle(words, rnd).forEach(function(x){
        if(opts.length >= 4 || x === w) return; var a = MG.sideText(x, kind, lang);
        if(!a || seen[a] || (kind === "i" && !MG.picOf(x))) return; seen[a] = 1; opts.push({ w: x, ok: false });
      });
      opts = MG.shuffle(opts, rnd);
      out.push({ type: type, kind: kind, w: w, opts: opts, ans: opts.map(function(x){ return x.ok; }).indexOf(true) });
    }
    return out;
  }

  function create(root, o){
    var now = o.now || function(){ return Date.now(); };
    var words = MG.withPhon(o.words, o.phon).filter(function(w){ return w && w.w; });
    var sec = MG.clamp(Number(o.sec) || 15, 5, 60), sync = !!o.sync, spectate = !!o.spectate, lang = o.lang;
    var qs = build(words, o), n = qs.length;
    var sc = MG.newScore(o.init), lastQ = o.init && typeof o.init.q === "number" ? o.init.q : -1, streak = o.init && o.init.streak || 0;
    var startAt = o.startAt || now(), slot = slotMs(o), ended = false, timer = 0, missed = {}, revealAt = 0;
    var cur = -1, t0 = 0, sawAsk = false, phase = "", chosen = -1, locked = false, scored = false, lastPts = 0, cancelSpeech = null;

    root.innerHTML = '<div class="gm qz">' +
      '<div class="gm-hud"><span class="gm-title">' + MG.esc(o.title || "快問快答 Quiz") + '</span><span class="note qz-no"></span><span class="grow"></span>' +
      (spectate ? '' : '<div class="gm-stat"><small>連對 Streak</small><b class="qz-streak">0</b></div><div class="gm-stat score"><small>分數 Score</small><b class="qz-score">0</b></div>') +
      MG.musicBtn(o.music) + '<button class="mg-btn sm ghost qz-snd">' + (MG.sound.on ? "音效 開 Sound on" : "音效 關 Sound off") + '</button>' +
      (o.onQuit ? '<button class="mg-btn sm qz-quit">結束 Quit</button>' : '') + '</div>' +
      '<div class="qz-bar"><i></i></div>' +
      '<div class="qz-stage"><div class="qz-q"><small class="qz-qlab"></small><div class="qz-prompt"></div></div><div class="qz-opts"></div><div class="qz-msg"></div></div></div>';
    var el = root.firstChild, bar = MG.$(".qz-bar i", el), qEl = MG.$(".qz-prompt", el), optsEl = MG.$(".qz-opts", el), msg = MG.$(".qz-msg", el);

    function hud(){
      if(!spectate){ MG.$(".qz-score", el).textContent = sc.s; MG.$(".qz-streak", el).textContent = streak; }
      MG.$(".qz-no", el).textContent = cur >= 0 ? "第 " + (cur + 1) + " / " + n + " 題 Question " + (cur + 1) + " of " + n : "";
    }
    function emit(){ if(spectate || !o.onScore) return; o.onScore(Object.assign({}, sc, { q: lastQ, streak: streak, time: now() - startAt })); }
    function promptOf(Q){
      var w = Q.w;
      if(Q.type === "p2w") return { html: '<span class="fit' + (o.phon === "zy" ? " zh" : "") + '" data-fmax="44" data-fmin="16">' + MG.esc(w.p) + '</span>', lab: "找出這個讀音的詞語 Find the word" };
      if(Q.type === "t2w") return { html: '<span class="fit" data-fmax="38" data-fmin="14">' + MG.esc(MG.trOf(w, lang)) + '</span>', lab: "找出這個意思的詞語 Find the word" };
      if(Q.type === "i2w") return { html: MG.picHtml(MG.picOf(w)), lab: "找出圖片的詞語 Find the word", pic: 1 };
      if(Q.type === "a2w" || Q.type === "a2t") return { html: '<button class="mg-btn big qz-play">🔊 再聽一次 Play again</button>', lab: Q.type === "a2w" ? "聽聲音，選出詞語 Listen, pick the word" : "聽聲音，選出意思 Listen, pick the meaning", audio: 1 };
      return { html: '<span class="fit zh" data-fmax="52" data-fmin="18">' + MG.esc(w.w) + '</span>', lab: Q.kind === "p" ? MG.ph("找出拼音 Find the pinyin", o.phon) : Q.kind === "i" ? "找出圖片 Find the picture" : "找出意思 Find the meaning" };
    }
    function enter(i, start){
      cur = i; t0 = start; phase = ""; chosen = -1; lastPts = 0; sawAsk = false;
      locked = !spectate && i <= lastQ; scored = locked;   // 重新整理後回來：這題已經答過了，不重複計分
      var Q = qs[i], p = promptOf(Q);
      MG.$(".qz-qlab", el).textContent = p.lab;
      qEl.className = "qz-prompt" + (p.pic ? " pic" : ""); qEl.innerHTML = p.html; msg.textContent = ""; msg.className = "qz-msg";
      optsEl.innerHTML = Q.opts.map(function(op, k){
        var txt = MG.sideText(op.w, Q.kind, lang), zh = Q.kind === "w" || (o.phon === "zy" && Q.kind === "p");
        return '<button class="qz-opt" data-k="' + k + '" style="--c:' + COLORS[k] + '"><b>' + LETTERS[k] + '</b>' + (Q.kind === "i" ? MG.picHtml(txt) : '<span class="fit' + (zh ? " zh" : "") + '" data-fmax="' + (zh ? 30 : 22) + '" data-fmin="11">' + MG.esc(txt) + '</span>') + '</button>';
      }).join("");
      requestAnimationFrame(function(){ MG.fitAll(optsEl); MG.fitAll(qEl); });
      if(p.audio){ var pb = MG.$(".qz-play", qEl); if(pb) pb.onclick = function(){ say(Q); }; }
      if(locked) setLocked("這題你已經答過了 Already answered");
      hud(); MG.$$(".qz-opt", el).forEach(function(b){ b.disabled = spectate || locked; });
      if(!spectate && (Q.type === "a2w" || Q.type === "a2t")) say(Q);
      if(!MG.hasZhVoice() && (Q.type === "a2w" || Q.type === "a2t") && !spectate && !enter.warned){ enter.warned = 1; MG.toast("這個裝置沒有中文語音，聽不到聲音 No Chinese voice on this device", 4500); }
    }
    function say(Q){ if(cancelSpeech) cancelSpeech(); cancelSpeech = MG.speak(Q.w.w, { rate: SAY_RATE, voice: o.voice }); }
    function setLocked(text){ msg.className = "qz-msg wait"; msg.textContent = text; }
    function answer(k){
      if(spectate || ended || phase !== "ask" || locked) return;
      locked = true; chosen = k; var Q = qs[cur], rt = now() - t0, right = k === Q.ans;
      lastQ = cur; scored = true;
      if(right){
        var bonus = Math.round(50 * MG.clamp((1 - rt / (sec * 1000)) / 0.85, 0, 1)); streak++;
        sc.c++; sc.n++; sc.rt += Math.round(rt); lastPts = 100 + bonus; sc.s += lastPts; MG.beep("ok");
      } else { streak = 0; missed[Q.w.w] = Q.w; MG.miss(sc); lastPts = -20; MG.beep("bad"); }
      MG.$$(".qz-opt", el).forEach(function(b){ b.disabled = true; b.classList.toggle("pick", Number(b.dataset.k) === k); });
      setLocked("已送出，等公布答案… Locked in!");
      hud(); emit();
    }
    function reveal(){
      var Q = qs[cur];
      if(!spectate && !scored && sawAsk){   // 沒作答：算答錯但不扣分
        scored = true; lastQ = cur; streak = 0; sc.w++; sc.n++; missed[Q.w.w] = Q.w; lastPts = 0; MG.beep("bad"); emit();
      }
      MG.$$(".qz-opt", el).forEach(function(b){
        var k = Number(b.dataset.k); b.disabled = true;
        b.classList.toggle("right", k === Q.ans); b.classList.toggle("wrong", k === chosen && k !== Q.ans); b.classList.toggle("dim", k !== Q.ans && k !== chosen);
      });
      var txt = Q.w.w + (Q.w.p ? "　" + Q.w.p : "");
      if(spectate) { msg.className = "qz-msg show"; msg.innerHTML = '正確答案 Answer：<b class="zh">' + MG.esc(Q.w.w) + '</b>　' + MG.esc(Q.w.p || ""); }
      else if(chosen === Q.ans) { msg.className = "qz-msg good"; msg.innerHTML = '答對了！ Correct! <b>+' + lastPts + '</b>' + (streak >= 2 ? '　🔥 連對 ' + streak + ' 題 ' + streak + ' in a row' : '') + '<small class="zh">' + MG.esc(txt) + '</small>'; }
      else if(chosen >= 0) { msg.className = "qz-msg bad"; msg.innerHTML = '答錯了 Not quite　<b>' + lastPts + '</b><small>正確答案 Answer：<span class="zh">' + MG.esc(txt) + '</span></small>'; }
      else if(!sawAsk) { msg.className = "qz-msg show"; msg.innerHTML = '這題你還沒加入，不計分 You joined late<small>正確答案 Answer：<span class="zh">' + MG.esc(txt) + '</span></small>'; }
      else { msg.className = "qz-msg bad"; msg.innerHTML = '時間到，沒有作答 Time\'s up<small>正確答案 Answer：<span class="zh">' + MG.esc(txt) + '</span></small>'; }
      hud();
    }
    function setPhase(ph){ phase = ph; if(ph === "ask") sawAsk = true; if(ph === "reveal"){ if(cancelSpeech) cancelSpeech(); reveal(); } }

    function tick(){
      if(ended) return;
      var t = now(), left;
      if(sync){
        var elapsed = t - startAt; if(elapsed < 0) return;
        var i = Math.floor(elapsed / slot); if(i >= n){ finish(); return; }
        if(i !== cur) enter(i, startAt + i * slot);
        var within = elapsed - i * slot, ph = within < sec * 1000 ? "ask" : "reveal";
        if(ph !== phase) setPhase(ph);
        left = ph === "ask" ? sec * 1000 - within : 0;
      } else {
        if(cur < 0){ enter(0, t); setPhase("ask"); }
        if(phase === "ask" && (chosen >= 0 || t >= t0 + sec * 1000)){ setPhase("reveal"); revealAt = t; }
        left = phase === "ask" ? t0 + sec * 1000 - t : 0;
        if(phase === "reveal" && t - revealAt >= REVEAL_SELF){
          if(cur + 1 >= n){ finish(); return; }
          enter(cur + 1, t); setPhase("ask");
        }
      }
      bar.style.width = (phase === "ask" ? MG.clamp(left / (sec * 1000), 0, 1) * 100 : 0) + "%";
      bar.parentElement.classList.toggle("warn", phase === "ask" && left < 5000);
      if(phase === "ask" && left < 4000 && left > 0){ var s = Math.ceil(left / 1000); if(s !== tick.last && !spectate){ tick.last = s; if(s <= 3 && !locked) MG.beep("tick"); } }
    }
    function onOpt(e){ var b = e.target.closest(".qz-opt"); if(!b) return; answer(Number(b.dataset.k)); }
    function result(){ return Object.assign({}, sc, { time: Math.max(0, (ended || now()) - startAt), missed: Object.keys(missed).map(function(k){ return missed[k]; }), done: true }); }
    function finish(){
      if(ended) return; ended = now(); clearInterval(timer); if(cancelSpeech) cancelSpeech(); MG.music.stop(); MG.beep("end");
      if(o.onEnd) o.onEnd(result());
    }

    optsEl.addEventListener("pointerdown", function(e){ if(e.target.closest(".qz-opt")){ e.preventDefault(); onOpt(e); } });
    MG.$(".qz-snd", el).onclick = function(){ MG.sound.on = !MG.sound.on; this.textContent = MG.sound.on ? "音效 開 Sound on" : "音效 關 Sound off"; };
    if(o.onQuit) MG.$(".qz-quit", el).onclick = function(){ if(cancelSpeech) cancelSpeech(); MG.music.stop(); o.onQuit(); };
    MG.bindMusicBtn(el, o.music);
    if(!n){ msg.className = "qz-msg bad"; msg.textContent = "沒有可以出的題目（可能缺拼音、翻譯或詞語太少）"; return { stop: function(){}, finish: function(){}, score: function(){ return sc; }, result: result }; }
    if(!spectate){ var at = audioTexts(qs); if(at.length) MG.tts.preload(at, { rate: SAY_RATE, voice: o.voice }); }   // 聽聲音的題：先把語音下載好
    hud(); tick(); timer = setInterval(tick, 100);
    if(o.music && !spectate) MG.music.play(o.music);
    MG.audioHint(el);
    return { stop: function(){ if(cancelSpeech) cancelSpeech(); MG.music.stop(); if(!ended){ ended = now(); clearInterval(timer); } }, finish: finish, score: function(){ return sc; }, result: result };
  }
  // 等待室先下載語音：words 是這局的詞（給 live.js 用；o 要帶 seed、q、count、lang）
  function prefetch(o, words){
    var ws = MG.withPhon(words, o.phon).filter(function(w){ return w && w.w; }), at = audioTexts(build(ws, o));
    return at.length ? MG.tts.preload(at, { rate: SAY_RATE, voice: o.voice }) : Promise.resolve(0);
  }
  MG.Quiz = { create: create, totalMs: totalMs, count: countOf, build: build, prefetch: prefetch };
})();
