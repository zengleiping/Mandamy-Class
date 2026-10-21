/* 曼米中文 · Blast
   上面出一個題目，答案從畫面掉下來（氣球、泡泡往上飄），點對的那個。點錯或讓正確答案溜走都會少一條命。
   打字模式：詞語掉下來，學生打拼音（數字標調，0 或不打是輕聲）。
   MG.Blast.create(root, { words, lang, q:"w2p"|"w2t"|"p2w"|"t2w", input:"tap"|"type", lives, speed, seconds,
                           theme, seed, startAt, endAt, now, init, onScore, onEnd, onQuit, title }) */
(function(){
  var MG = window.MG;
  var Q_NAME = { w2p: "看詞語，選拼音", w2t: "看詞語，選翻譯", p2w: "看拼音，選詞語", t2w: "看翻譯，選詞語", w2i: "看詞語，選圖片", i2w: "看圖片，選詞語" };
  MG.BLAST_Q = Q_NAME;
  var DUR = [11, 9, 7.2, 5.8, 4.6];   // 速度 1～5：從畫面一頭到另一頭要幾秒

  function create(root, o){
    var now = o.now || function(){ return Date.now(); };
    var T = MG.THEMES[o.theme] || MG.THEMES.space, rnd = MG.rng(o.seed || 1);
    var typeMode = o.input === "type" && o.phon !== "zy", q = typeMode ? "w2p" : (o.q || "w2p");
    var ansKind = q === "w2p" ? "p" : q === "w2t" ? "t" : q === "w2i" ? "i" : "w", picQ = q === "i2w";
    var zyM = o.phon === "zy";
    var words = MG.withPhon(o.words, o.phon).filter(function(w){ return w && w.w && MG.sideText(w, ansKind, o.lang) && (q !== "p2w" || w.p) && (q !== "t2w" || MG.trOf(w, o.lang)) && (!picQ || MG.picOf(w)); });
    var seconds = Number(o.seconds) || 0, maxLives = Number(o.lives); if(isNaN(maxLives)) maxLives = 3;
    if(!seconds && !maxLives) maxLives = 3;
    var sc = MG.newScore(o.init), lives = o.init && typeof o.init.lives === "number" ? o.init.lives : maxLives;
    var startAt = o.startAt || now(), endAt = seconds ? (o.endAt || startAt + seconds * 1000) : (o.endAt || 0);
    var queue = [], items = [], round = null, ended = false, raf = 0, missed = {}, streak = 0, roundNo = 0;
    var speedIdx = MG.clamp(Number(o.speed) || 3, 1, 5) - 1;

    root.innerHTML = '<div class="gm bl">' +
      '<div class="gm-hud"><span class="gm-title">' + MG.esc(o.title || "Blast") + '</span><span class="note">' + MG.esc(typeMode ? "看詞語，打拼音（數字標調）" : MG.ph(Q_NAME[q], o.phon)) + '</span><span class="grow"></span>' +
      (maxLives ? '<div class="gm-stat"><small>生命</small><span class="bl-lives"></span></div>' : '') +
      '<div class="gm-stat time"><small>' + (endAt ? "剩下" : "時間") + '</small><b class="bl-time">0:00</b></div>' +
      '<div class="gm-stat"><small>答錯</small><b class="bl-err">0</b></div>' +
      '<div class="gm-stat score"><small>分數</small><b class="bl-score">0</b></div>' +
      MG.musicBtn(o.music) + '<button class="mg-btn sm ghost bl-snd">' + (MG.sound.on ? "音效 開" : "音效 關") + '</button>' +
      (o.onQuit ? '<button class="mg-btn sm bl-quit">結束</button>' : '') + '</div>' +
      '<div class="bl-stage"><div class="bl-bg" style="background:' + T.bg + '">' + (T.deco ? T.deco() : '') + '</div>' +
      '<div class="bl-q"><small>' + (typeMode ? "打出這個詞語的拼音" : ansKind === "w" ? "找出這個詞語" : ansKind === "p" ? MG.ph("找出拼音", o.phon) : ansKind === "i" ? "找出圖片" : "找出意思") + '</small><span class="fit" data-fmax="34" data-fmin="14"></span></div>' +
      (typeMode ? '<form class="bl-type" autocomplete="off"><input type="text" placeholder="例如 ni3 hao3" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done"><button class="mg-btn primary">送出</button></form>' : '') +
      '</div></div>';
    var el = root.firstChild, stage = MG.$(".bl-stage", el), qEl = MG.$(".bl-q .fit", el);
    var lab = T.label || {};

    function hud(){
      MG.$(".bl-score", el).textContent = sc.s; MG.$(".bl-err", el).textContent = sc.w;
      if(maxLives){ var h = ""; for(var i = 0; i < maxLives; i++) h += '<span class="' + (i < lives ? "" : "off") + '">♥</span>'; MG.$(".bl-lives", el).innerHTML = h; }
    }
    function nextWord(){ if(!queue.length) queue = MG.shuffle(words, rnd); return queue.shift(); }
    function promptOf(w){ return q === "p2w" ? w.p : q === "t2w" ? MG.trOf(w, o.lang) : w.w; }
    function options(w){
      var right = MG.sideText(w, ansKind, o.lang), seen = {}, out = [w]; seen[right] = 1;
      MG.shuffle(words, rnd).forEach(function(x){ if(out.length >= 4) return; var a = MG.sideText(x, ansKind, o.lang); if(x.w === w.w || seen[a]) return; seen[a] = 1; out.push(x); });
      return MG.shuffle(out, rnd);
    }
    function speedFactor(){ return 1 + Math.min(0.5, streak * 0.03); }
    function newRound(){
      if(ended) return;
      clearItems(); roundNo++;
      var w = nextWord(); if(!w){ finish(); return; }
      round = { w: w, t0: now(), done: false };
      qEl.className = "fit" + (q === "t2w" || (q === "p2w" && !zyM) ? "" : " zh"); qEl.textContent = promptOf(w);
      if(picQ){ qEl.className = "fit picq"; qEl.innerHTML = MG.picHtml(MG.picOf(w)); }
      if(typeMode){ qEl.textContent = "？"; qEl.className = "fit"; }
      if(!picQ) requestAnimationFrame(function(){ MG.fit(qEl); });
      var opts = typeMode ? [w] : options(w);
      var W = stage.clientWidth, H = stage.clientHeight;
      var probe = document.createElement("div"); probe.className = "bl-item"; probe.style.visibility = "hidden"; stage.appendChild(probe);
      var bw = probe.offsetWidth || 150, bh = probe.offsetHeight || 110; probe.remove();
      var lanes = opts.length, gap = (W - bw * lanes) / (lanes + 1);
      var dur = DUR[speedIdx] / speedFactor(), v = (H + bh * 2) / dur;
      if(gap < 4){ gap = 4; }
      opts.forEach(function(x, i){
        var it = document.createElement("div"); it.className = "bl-item";
        var lx = lanes * bw + (lanes + 1) * gap > W ? (W - bw) * (lanes === 1 ? 0.5 : i / (lanes - 1)) : gap + i * (bw + gap);
        lx = MG.clamp(lx + (rnd() - 0.5) * Math.min(gap, 40), 2, Math.max(2, W - bw - 2));
        var delay = typeMode ? 0 : rnd() * 0.9 + (i % 2) * 0.35;
        var y0 = T.dir > 0 ? -bh - delay * v : H + delay * v;
        var txt = typeMode ? x.w : MG.sideText(x, ansKind, o.lang), zh = typeMode || ansKind === "w" || (zyM && ansKind === "p");
        it.style.setProperty("--lc", lab.lc || "#2B2320"); if(lab.ls) it.style.setProperty("--ls", lab.ls); if(lab.ly) it.style.setProperty("--ly", lab.ly); if(lab.lh) it.style.setProperty("--lh", lab.lh);
        it.innerHTML = T.shape(roundNo * 7 + i) + (ansKind === "i" && !typeMode ? '<div class="lbl picl">' + MG.picHtml(txt) + '</div>' : '<div class="lbl"><span class="fit' + (zh ? " zh" : "") + '" data-fmax="' + (zh ? 30 : ansKind === "p" ? 24 : 20) + '" data-fmin="10">' + MG.esc(txt) + '</span></div>');
        var obj = { el: it, w: x, ok: x.w === w.w, x: lx, y0: y0, v: v, t0: now(), dead: false };
        it.addEventListener("pointerdown", function(e){ e.preventDefault(); tap(obj); });
        stage.appendChild(it); items.push(obj); place(obj, y0);
        if(MG.$(".fit", it)) MG.fit(MG.$(".fit", it));
      });
      if(typeMode){ var inp = MG.$(".bl-type input", el); inp.value = ""; if(document.activeElement !== inp) try{ inp.focus({ preventScroll: true }); }catch(e){} }
    }
    function place(obj, y){ var tf = "translate(" + obj.x.toFixed(1) + "px," + y.toFixed(1) + "px)"; obj.el.style.transform = tf; obj.el.style.setProperty("--tf", tf); obj.y = y; }
    function clearItems(){ items.forEach(function(it){ it.el.remove(); }); items = []; }
    function sparks(obj){
      var cols = T.spark || ["#E8825A"], cx = obj.x + obj.el.offsetWidth / 2, cy = obj.y + obj.el.offsetHeight / 2;
      for(var i = 0; i < 14; i++){
        var s = document.createElement("div"), a = i / 14 * Math.PI * 2, d = 50 + Math.random() * 50;
        s.className = "bl-spark"; s.style.left = cx + "px"; s.style.top = cy + "px"; s.style.background = cols[i % cols.length];
        s.style.setProperty("--dx", Math.cos(a) * d + "px"); s.style.setProperty("--dy", Math.sin(a) * d + "px");
        stage.appendChild(s); setTimeout(function(n){ return function(){ n.remove(); }; }(s), 650);
      }
    }
    function pop(x, y, txt, neg){ var p = document.createElement("div"); p.className = "gm-pop" + (neg ? " neg" : ""); p.textContent = txt; p.style.left = x + "px"; p.style.top = y + "px"; stage.appendChild(p); setTimeout(function(){ p.remove(); }, 950); }
    function showAnswer(w){
      var a = document.createElement("div"); a.className = "bl-ans";
      a.innerHTML = typeMode ? '<span class="zh">' + MG.esc(w.w) + '</span>　' + MG.esc(w.p) + '　（打 ' + MG.esc(MG.pyToNum(w.p)) + '）' : (ansKind === "i" || picQ ? '<span class="zh">' + MG.esc(w.w) + '</span>　' + MG.picHtml(MG.picOf(w)) : '<span class="zh">' + MG.esc(w.w) + '</span>　' + MG.esc(MG.sideText(w, ansKind === "w" ? (q === "p2w" ? "p" : "t") : ansKind, o.lang)));
      stage.appendChild(a); setTimeout(function(){ a.remove(); }, 1900);
    }
    function win(obj){
      if(!round || round.done) return; round.done = true;
      var pts = MG.hit(sc, now() - round.t0); streak++;
      obj.el.classList.add("boom"); sparks(obj); pop(obj.x + 30, obj.y, "+" + pts); MG.beep("pop");
      items.forEach(function(it){ if(it !== obj){ it.dead = true; it.el.style.transition = "opacity .25s"; it.el.style.opacity = "0"; } });
      hud(); emit(); setTimeout(newRound, 420);
    }
    function loseLife(){ if(!maxLives) return; lives = Math.max(0, lives - 1); hud(); if(lives <= 0){ if(o.revive) setTimeout(startRevive, 500); else setTimeout(finish, 500); } }
    // 復活挑戰：命用完不用乾等，連續答對自己答錯的詞就帶 1 條命回到遊戲（每復活一次多 1 題；挑戰本身不加分）
    var revives = 0, rev = null;
    function startRevive(){
      if(ended || rev) return;
      clearItems(); round = null; streak = 0;
      rev = { need: 3 + revives, got: 0, i: 0, list: MG.shuffle(Object.keys(missed).map(function(k){ return missed[k]; }), rnd) };
      if(rev.list.length < 2) rev.list = rev.list.concat(MG.shuffle(words, rnd).slice(0, 6));
      revQ();
    }
    function revQ(){
      if(ended || !rev) return;
      var w = rev.list[rev.i++ % rev.list.length], kind = typeMode ? "p" : ansKind, opts = typeMode ? (function(){ var seen = {}, out = [w]; seen[w.p] = 1; MG.shuffle(words, rnd).forEach(function(x){ if(out.length < 4 && !seen[x.p] && x.p){ seen[x.p] = 1; out.push(x); } }); return MG.shuffle(out, rnd); })() : options(w);
      var prompt = picQ ? MG.picHtml(MG.picOf(w)) : '<span class="fit' + (q === "p2w" || q === "t2w" ? "" : " zh") + '" data-fmax="40" data-fmin="14">' + MG.esc(typeMode ? w.w : promptOf(w)) + '</span>';
      var box = MG.$(".bl-rev", stage) || stage.appendChild(Object.assign(document.createElement("div"), { className: "bl-rev" }));
      var dots = ""; for(var k = 0; k < rev.need; k++) dots += '<i class="' + (k < rev.got ? "on" : "") + '"></i>';
      box.innerHTML = '<div class="bl-rev-card"><h3>復活挑戰</h3><div class="note">連續答對 ' + rev.need + ' 題就能回到遊戲</div><div class="bl-rev-dots">' + dots + '</div><div class="bl-rev-q">' + prompt + '</div><div class="bl-rev-opts">' +
        opts.map(function(x){ var a = MG.sideText(x, kind, o.lang); return '<button class="bl-rev-o' + (kind === "w" ? " zh" : "") + '" data-ok="' + (x.w === w.w ? 1 : 0) + '">' + (kind === "i" ? MG.picHtml(a) : '<span class="fit" data-fmax="' + (kind === "w" ? 28 : 20) + '" data-fmin="10">' + MG.esc(a) + '</span>') + '</button>'; }).join("") + '</div></div>';
      MG.fitAll(box);
      box.onclick = function(e){
        var b = e.target.closest(".bl-rev-o"); if(!b || ended || !rev || box.dataset.busy) return;
        box.dataset.busy = "1";
        if(b.dataset.ok === "1"){ b.classList.add("ok"); rev.got++; MG.beep("ok"); }
        else { b.classList.add("bad"); var r = MG.$('.bl-rev-o[data-ok="1"]', box); if(r) r.classList.add("ok"); rev.got = 0; MG.beep("bad"); }
        setTimeout(function(){
          delete box.dataset.busy;
          if(rev && rev.got >= rev.need){ box.remove(); rev = null; revives++; lives = 1; hud(); emit(); MG.beep("go"); newRound(); return; }
          revQ();
        }, b.dataset.ok === "1" ? 450 : 1100);
      };
    }
    function tap(obj){
      if(ended || !round || round.done || obj.dead) return;
      if(typeMode) return;
      if(obj.ok){ win(obj); return; }
      obj.dead = true; obj.el.classList.add("wrong"); missed[round.w.w] = round.w; streak = 0;
      var d = MG.miss(sc); pop(obj.x + 30, obj.y, d ? String(d) : "✕", true); MG.beep("bad"); loseLife(); emit();
    }
    if(typeMode){
      MG.$(".bl-type", el).addEventListener("submit", function(e){
        e.preventDefault(); if(ended || !round || round.done) return;
        var inp = MG.$("input", this), v = inp.value.trim(); if(!v) return;
        if(MG.pyCheck(v, round.w.p)){ win(items[0]); inp.value = ""; }
        else { inp.classList.remove("bad"); void inp.offsetWidth; inp.classList.add("bad"); missed[round.w.w] = round.w; streak = 0; MG.miss(sc); MG.beep("bad"); hud(); emit(); }
      });
    }
    function frame(){
      if(ended) return;
      var t = now(), H = stage.clientHeight;
      items.forEach(function(it){
        if(it.dead && !it.ok) return;
        if(it.el.classList.contains("boom")) return;
        var y = it.y0 + T.dir * it.v * (t - it.t0) / 1000; place(it, y);
        var out = T.dir > 0 ? y > H + 4 : y < -it.el.offsetHeight - 4;
        if(out && it.ok && round && !round.done){
          round.done = true; streak = 0; missed[round.w.w] = round.w; showAnswer(round.w); MG.beep("bad"); loseLife(); emit();
          if(!(maxLives && lives <= 0)) setTimeout(newRound, 900);
        }
      });
      var tm = MG.$(".bl-time", el);
      if(endAt){ var left = endAt - t; tm.textContent = MG.fmtTime(left + 999); MG.$(".gm-stat.time", el).classList.toggle("warn", left < 10000); MG.music.fast(left < 10000); if(left <= 0){ finish(); return; } }
      else tm.textContent = MG.fmtTime(t - startAt);
      raf = requestAnimationFrame(frame);
    }
    function emit(){ if(o.onScore) o.onScore(Object.assign({}, sc, { lives: lives, time: now() - startAt })); }
    function result(){ return Object.assign({}, sc, { lives: lives, time: Math.max(0, (ended || now()) - startAt), missed: Object.keys(missed).map(function(k){ return missed[k]; }) }); }
    function finish(){
      if(ended) return; ended = now(); cancelAnimationFrame(raf); clearItems(); MG.music.stop(); MG.beep("end");
      if(o.onEnd) o.onEnd(result());
    }
    MG.$(".bl-snd", el).onclick = function(){ MG.sound.on = !MG.sound.on; this.textContent = MG.sound.on ? "音效 開" : "音效 關"; };
    if(o.onQuit) MG.$(".bl-quit", el).onclick = function(){ MG.music.stop(); o.onQuit(); };
    MG.bindMusicBtn(el, o.music);
    hud();
    if(!words.length){ stage.insertAdjacentHTML("beforeend", '<div class="bl-ans" style="animation:none">這個題型沒有可以用的詞語（可能缺拼音或翻譯）</div>'); return { stop: function(){}, finish: function(){}, score: function(){ return sc; }, result: result }; }
    if(maxLives && lives <= 0){ if(o.revive){ raf = requestAnimationFrame(frame); if(o.music) MG.music.play(o.music); setTimeout(startRevive, 0); } else setTimeout(finish, 0); }
    else { newRound(); raf = requestAnimationFrame(frame); if(o.music) MG.music.play(o.music); }
    return { stop: function(){ MG.music.stop(); if(!ended){ ended = now(); cancelAnimationFrame(raf); clearItems(); } }, finish: finish, score: function(){ return sc; }, result: result };
  }
  MG.Blast = { create: create };
})();
