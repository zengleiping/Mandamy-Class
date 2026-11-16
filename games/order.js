/* 曼米中文 · 聽音排序 Listen & Order
   念出一串詞語，學生要把詞語拖進格子，排成聽到的順序。第一輪 start 個詞，之後每輪多一個，直到 maxLen。
   每一輪的詞語集合是同一份詞表往後加一個詞，但念的順序每輪重新打亂（不能靠背上一輪的順序）。
   模式：
     survive 生存：答錯扣一條命（lives）。命用完＝被淘汰，但還是可以「旁觀練習」：照樣聽、照樣排、照樣批改，只是不計分；
             開 comeback 的話，連續答對 2 輪就復活（回到 1 條命）。
     score   限時／累積：沒有淘汰，打滿所有輪，全部累積分數。
   即時多人：全班用同一個開始時間排程，每個人自動在同一秒進到同一輪。自己練習（self）：送出後公布，過一下進下一輪。
   MG.Order.create(root, { words, lang, phon, seed, mode, lives, comeback, start, maxLen, plays, perWord, show,
                           sync, spectate, startAt, now, init, music, onScore, onEnd, onQuit, title })
   flow: "free" 邊聽邊排、可重聽（預設）｜"memory" 考記憶：全班先一起聽完（只聽一次），聽完才能作答
   pace: "slow"|"normal"|"fast"（預設）語速；voice: 伺服器語音（預設曉臻）
   MG.Order.totalMs(o, words) 一局總共多久；MG.Order.prefetch(o, words) 先下載語音 */
(function(){
  var MG = window.MG;
  var LEAD = 1800, REVEAL = 5000, REVEAL_SELF = 4000;
  // 語速：rate 是伺服器語音的速度（0.7～1.2）；gap 是詞跟詞之間停多久。預設「快」，聽起來比較刺激。
  //   k：每個詞的長度要乘多少（念得越快，每個詞佔的時間越短）
  var PACE = { slow: { rate: 0.95, gap: 420, k: 1 }, normal: { rate: 1.1, gap: 300, k: 1 }, fast: { rate: 1.2, gap: 200, k: 1 }, faster: { rate: 1.4, gap: 150, k: 0.86 }, fastest: { rate: 1.6, gap: 100, k: 0.75 } };
  function paceOf(o){ return PACE[o.pace] || PACE.fast; }
  function hanLen(w){ return Math.max(1, Array.from(String(w.w || "")).length); }
  // 每個詞「開始念」的時間是固定算出來的（跟詞的長度有關，跟裝置無關），所以全班聽到的節奏一樣，也算得出整段多長
  function slotMs(w, pc){ return Math.round(pc.gap + (450 + 230 * hanLen(w)) * pc.k); }
  function lensOf(o, nWords){
    var start = MG.clamp(Number(o.start) || 2, 2, 20), want = o.maxLen === 0 || o.maxLen === "0" || o.maxLen === "all" ? 40 : MG.clamp(Number(o.maxLen) || 6, 2, 40), maxL = Math.min(Math.max(want, start), nWords), lens = [];   // 上限比第一輪還小時，至少玩第一輪那一個長度
    for(var L = start; L <= maxL; L++) lens.push(L);
    return { start: start, lens: lens };
  }
  function rounds(words, o){
    var seed = Number(o.seed) || 1, pc = paceOf(o), memory = o.flow === "memory", per = (Number(o.perWord) || 3.5) * 1000, plays = Number(o.plays) || 2, LS = lensOf(o, words.length);
    var base = MG.shuffle(words, MG.rng(seed + 57)).slice(0, LS.lens[LS.lens.length - 1] || 0);
    return LS.lens.map(function(L, r){
      var rnd = MG.rng(seed * 131 + r * 977 + 7), set = base.slice(0, L), heard = MG.shuffle(set, rnd), bank = MG.shuffle(set, rnd), starts = [], acc = 0;
      if(L > 1 && bank.every(function(w, i){ return w === heard[i]; })) bank = bank.slice(1).concat(bank[0]);
      heard.forEach(function(w){ starts.push(acc); acc += slotMs(w, pc); });
      var audio = acc + 400;
      // 自由：邊聽邊排，可以重聽（plays 次）。考記憶：全班先聽完（只聽一次）才開始作答，作答時間另外算。
      return { L: L, heard: heard, bank: bank, starts: starts, audio: audio, pre: memory ? audio + 400 : 0, win: memory ? 3500 + L * per : plays * audio + 4000 + L * per };
    });
  }
  function plan(R, o){
    var offs = [], t = 0; R.forEach(function(r){ offs.push(t); t += LEAD + r.pre + r.win + REVEAL; });
    return { lens: R.map(function(r){ return r.L; }), offs: offs, total: t, start: R.length ? R[0].L : 2 };
  }
  function totalMs(o, words){ return plan(rounds(MG.withPhon(words, "py").filter(function(w){ return w && w.w; }), o), o).total + 800; }
  // 先把這一局要念的詞下載好（等待室就可以先做）；回傳成功幾個
  function prefetch(o, words){
    var R = rounds((words || []).filter(function(w){ return w && w.w; }), o), last = R[R.length - 1], pc = paceOf(o);
    return last ? MG.tts.preload(last.heard.map(function(w){ return w.w; }), { rate: pc.rate, voice: o.voice }) : Promise.resolve(0);
  }

  function create(root, o){
    var now = o.now || function(){ return Date.now(); };
    var words = MG.withPhon(o.words, o.phon).filter(function(w){ return w && w.w; });
    var sync = !!o.sync, spectate = !!o.spectate, survive = o.mode !== "score", comeback = o.comeback !== false, show = o.show || "both";
    var memory = o.flow === "memory", pc = paceOf(o), R = rounds(words, o), P = plan(R, o), nR = R.length, maxLives = survive ? MG.clamp(Number(o.lives) || 2, 1, 5) : null;
    var sc = MG.newScore(o.init), init = o.init || {};
    var lives = survive ? (typeof init.lives === "number" ? init.lives : maxLives) : null, ghost = survive && !!init.gh, gs = init.gs || 0, best = init.best || 0, lastQ = typeof init.q === "number" ? init.q : -1;
    var gate = !sync && !spectate && !!MG.tts.srv(), startAt = o.startAt || now(), ended = false, timer = 0, missed = {};
    var cur = -1, roundStart = 0, joinedLate = false, sawAsk = false, phase = "", slots = [], bankList = [], submitted = false, submittedAt = 0, scored = false, playsLeft = 0, speaking = false, cancelSpeech = null, revealAt = 0, info = null;

    root.innerHTML = '<div class="gm od">' +
      '<div class="gm-hud"><span class="gm-title">' + MG.esc(o.title || "聽音排序 Listen & Order") + '</span><span class="note od-no"></span><span class="grow"></span>' +
      (spectate || !survive ? '' : '<div class="gm-stat"><small>生命 Lives</small><span class="bl-lives od-lives"></span></div>') +
      (spectate ? '' : '<div class="gm-stat score"><small>分數 Score</small><b class="od-score">0</b></div>') +
      MG.musicBtn(o.music) + '<button class="mg-btn sm ghost od-snd">' + (MG.sound.on ? "音效 開 Sound on" : "音效 關 Sound off") + '</button>' +
      (o.onQuit ? '<button class="mg-btn sm od-quit">結束 Quit</button>' : '') + '</div>' +
      '<div class="qz-bar"><i></i></div>' +
      '<div class="od-stage"><div class="od-banner"></div>' +
      '<div class="od-top"><button class="mg-btn big primary od-play">🔊 聽 Listen</button><span class="od-plays note"></span><span class="od-wave"><i></i><i></i><i></i><i></i><i></i></span></div>' +
      '<div class="od-slots"></div><div class="od-bank"></div>' +
      '<div class="od-ctl"><button class="mg-btn od-reset">重排 Reset</button><button class="mg-btn big primary od-submit">確定 Submit</button></div>' +
      '<div class="od-msg"></div><div class="od-ans"></div></div></div>';
    var el = root.firstChild, bar = MG.$(".qz-bar i", el), slotsEl = MG.$(".od-slots", el), bankEl = MG.$(".od-bank", el), msg = MG.$(".od-msg", el), ansEl = MG.$(".od-ans", el),
        playBtn = MG.$(".od-play", el), submitBtn = MG.$(".od-submit", el), resetBtn = MG.$(".od-reset", el);

    function hearts(){ var h = ""; for(var i = 0; i < maxLives; i++) h += '<span class="' + (i < (lives || 0) ? "" : "off") + '">♥</span>'; return h; }
    function hud(){
      if(!spectate){ MG.$(".od-score", el).textContent = sc.s; var lv = MG.$(".od-lives", el); if(lv) lv.innerHTML = hearts(); }
      MG.$(".od-no", el).textContent = cur >= 0 ? "第 " + (cur + 1) + " / " + nR + " 輪・" + R[cur].L + " 個詞 Round " + (cur + 1) + " of " + nR + " · " + R[cur].L + " words" : "";
      var bn = MG.$(".od-banner", el); el.classList.toggle("ghost", ghost);
      bn.innerHTML = ghost ? '<b>你被淘汰了 You are out</b>　繼續聽、繼續排，不計分；' + (comeback ? '連續答對 2 輪就能復活！（目前 ' + gs + ' / 2）<br><span class="en">Practice mode: no points. Get 2 rounds right in a row to come back! (' + gs + ' / 2)</span>' : '練習看看吧。<br><span class="en">Practice mode: no points.</span>') : "";
    }
    function emit(){ if(spectate || !o.onScore) return; o.onScore(Object.assign({}, sc, { q: lastQ, lives: lives, gh: ghost ? 1 : 0, gs: gs, best: best, time: now() - startAt })); }
    function phonOf(w){ return w.p || ""; }
    function tileHtml(id, inSlot){
      var w = bankList[id];
      return '<button type="button" class="od-tile' + (inSlot ? " in" : "") + '" data-id="' + id + '">' + (show !== "phon" ? '<span class="zh">' + MG.esc(w.w) + '</span>' : '') + (show !== "zh" && phonOf(w) ? '<i' + (o.phon === "zy" ? ' class="zh"' : '') + '>' + MG.esc(phonOf(w)) + '</i>' : '') + '</button>';
    }
    function canEdit(){ return !spectate && phase === "ask" && !submitted; }
    function draw(){
      var Rd = R[cur], used = {};
      slots.forEach(function(id){ if(id != null) used[id] = 1; });
      slotsEl.innerHTML = slots.map(function(id, i){ return '<div class="od-slot' + (id == null ? "" : " on") + '" data-i="' + i + '"><em>' + (i + 1) + '</em>' + (id == null ? "" : tileHtml(id, true)) + '</div>'; }).join("");
      bankEl.innerHTML = spectate ? "" : bankList.map(function(w, id){ return used[id] ? '<span class="od-hole"></span>' : tileHtml(id, false); }).join("");
      bankEl.style.display = spectate ? "none" : "";
      MG.$$(".od-tile", el).forEach(function(t){ bindDrag(t); });
      var full = slots.every(function(x){ return x != null; });
      submitBtn.disabled = !canEdit() || !full; resetBtn.disabled = !canEdit();
      submitBtn.style.display = resetBtn.style.display = spectate ? "none" : "";
    }
    // 拖曳（滑鼠、觸控都可以）；沒有拖動只是點一下：點詞語＝放進第一個空格，點格子裡的詞語＝放回去
    function bindDrag(tile){
      var id = Number(tile.dataset.id), fromSlot = tile.parentElement.classList.contains("od-slot") ? Number(tile.parentElement.dataset.i) : null;
      tile.addEventListener("pointerdown", function(e){
        if(!canEdit()) return; e.preventDefault();
        var sx = e.clientX, sy = e.clientY, moved = false, ghostEl = null, hot = null;
        try{ tile.setPointerCapture(e.pointerId); }catch(er){}
        function slotAt(x, y){ if(ghostEl) ghostEl.style.display = "none"; var t = document.elementFromPoint(x, y); if(ghostEl) ghostEl.style.display = ""; return t; }
        function move(ev){
          if(!moved){ if(Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return; moved = true; ghostEl = tile.cloneNode(true); ghostEl.classList.add("od-ghost"); document.body.appendChild(ghostEl); tile.classList.add("lift"); }
          ghostEl.style.left = ev.clientX + "px"; ghostEl.style.top = ev.clientY + "px";
          var t = slotAt(ev.clientX, ev.clientY), s = t && t.closest ? t.closest(".od-slot") : null;
          if(hot !== s){ if(hot) hot.classList.remove("hot"); hot = s; if(hot) hot.classList.add("hot"); }
        }
        function end(ev, cancel){
          tile.removeEventListener("pointermove", move); tile.removeEventListener("pointerup", up); tile.removeEventListener("pointercancel", cx);
          if(hot) hot.classList.remove("hot");
          if(ghostEl){ ghostEl.remove(); }
          if(cancel){ draw(); return; }
          if(!moved){ tap(id, fromSlot); return; }
          var t = slotAt(ev.clientX, ev.clientY), s = t && t.closest ? t.closest(".od-slot") : null;
          if(s) drop(id, fromSlot, Number(s.dataset.i));
          else if(fromSlot != null) { slots[fromSlot] = null; MG.beep("pop"); draw(); }
          else draw();
        }
        function up(ev){ end(ev, false); } function cx(ev){ end(ev, true); }
        tile.addEventListener("pointermove", move); tile.addEventListener("pointerup", up); tile.addEventListener("pointercancel", cx);
      });
    }
    function tap(id, fromSlot){
      if(!canEdit()) return;
      if(fromSlot != null) slots[fromSlot] = null;
      else { var k = slots.indexOf(null); if(k < 0){ draw(); return; } slots[k] = id; }
      MG.beep("pop"); draw();
    }
    function drop(id, fromSlot, to){
      if(!canEdit()) return;
      var other = slots[to];
      if(fromSlot != null){ slots[fromSlot] = other == null ? null : other; }   // 從別的格子拖來：兩格互換
      slots[to] = id; MG.beep("pop"); draw();
    }

    function enter(r, start){
      cur = r; roundStart = start; phase = ""; sawAsk = false; submitted = false; submittedAt = 0; info = null;
      bankList = R[r].bank.slice(); slots = []; for(var i = 0; i < R[r].L; i++) slots.push(null);
      playsLeft = memory ? 1 : Number(o.plays) || 2; speaking = false; joinedLate = memory && sync && now() - start > LEAD + 1500;   // 考記憶：聽音一半才進來的人，這輪沒聽全，不計分 if(cancelSpeech){ cancelSpeech(); cancelSpeech = null; }
      scored = !spectate && r <= lastQ;   // 重新整理後回來：這輪已經答過了，不重複計分
      msg.className = "od-msg"; msg.textContent = ""; ansEl.innerHTML = ""; ansEl.className = "od-ans";
      el.classList.toggle("many", R[r].L > 10);
      playUi(); hud(); draw();
      if(!spectate) MG.tts.preload(R[r].heard.map(function(w){ return w.w; }), { rate: pc.rate, voice: o.voice });   // 這輪要念的詞再確認一次都載好了（已經有的不會重抓）
    }
    function playUi(){
      var canPlay = !memory && !spectate && phase === "ask" && !submitted && playsLeft > 0 && !speaking;
      playBtn.disabled = !canPlay; playBtn.style.display = spectate || memory ? "none" : "";
      MG.$(".od-plays", el).textContent = spectate ? "" : memory ? "" : phase === "ask" ? "還可以聽 " + playsLeft + " 次 Plays left: " + playsLeft : "";
      el.classList.toggle("speaking", speaking);
    }
    function play(){
      if(spectate || (phase !== "ask" && phase !== "listen") || submitted || playsLeft <= 0 || speaking) return;
      playsLeft--; speaking = true; playUi();
      var words = R[cur].heard.map(function(w){ return w.w; });
      cancelSpeech = MG.speakSeq(words, { rate: pc.rate, voice: o.voice, starts: R[cur].starts, done: function(){ speaking = false; cancelSpeech = null; playUi(); } });
    }
    function setPhase(ph){
      phase = ph;
      if(ph === "lead"){ msg.className = "od-msg lead"; msg.innerHTML = '準備好，仔細聽！<span class="en">Get ready and listen carefully!</span>'; draw(); playUi(); }
      else if(ph === "listen"){
        msg.className = "od-msg lead"; msg.innerHTML = scored ? "這輪你已經答過了 Already answered" : joinedLate ? "這輪你來晚了，先看看 You joined late" : '全班一起聽，聽完才能作答！<span class="en">Listen together — you can answer after the audio ends</span>';
        if(!scored && !joinedLate){ noVoiceWarn(); draw(); playUi(); play(); } else { submitted = true; draw(); playUi(); }
      }
      else if(ph === "ask"){
        if(!joinedLate) sawAsk = true;
        msg.className = "od-msg"; msg.textContent = scored ? "這輪你已經答過了 Already answered" : joinedLate ? "這輪你沒聽到音檔，不計分 You missed the audio" : memory ? "開始排！ Go!" : "";
        if(joinedLate && !scored){ submitted = true; draw(); playUi(); }
        else if(!scored){ if(!memory){ noVoiceWarn(); } draw(); playUi(); if(!memory) play(); }
        else { submitted = true; draw(); playUi(); }
      }
      else if(ph === "reveal"){ if(cancelSpeech){ cancelSpeech(); cancelSpeech = null; } speaking = false; grade(); }
    }
    function noVoiceWarn(){ if(!MG.hasZhVoice() && !setPhase.warned && !spectate){ setPhase.warned = 1; MG.toast("這個裝置沒有中文語音，聽不到聲音 No Chinese voice on this device", 4500); } }
    function submit(){
      if(!canEdit() || !slots.every(function(x){ return x != null; })) return;
      submitted = true; submittedAt = now(); if(cancelSpeech){ cancelSpeech(); cancelSpeech = null; } speaking = false;
      msg.className = "od-msg wait"; msg.textContent = sync ? "已送出，等公布答案… Locked in!" : "";
      MG.beep("tick"); draw(); playUi();
    }
    function grade(){
      var Rd = R[cur], L = Rd.L, W = Rd.win, t0 = roundStart + LEAD + Rd.pre, ans = slots.map(function(id){ return id == null ? null : bankList[id]; });
      var pos = 0; ans.forEach(function(w, i){ if(w && w.w === Rd.heard[i].w) pos++; });
      var full = pos === L, res = "", pts = 0;
      if(!scored && !spectate && !sawAsk){ res = ""; msg.className = "od-msg"; msg.textContent = "這輪你還沒加入，不計分 You joined late — not scored"; }
      else if(!scored && !spectate){
        scored = true; lastQ = cur;
        var rt = Math.max(0, (submittedAt || t0 + W) - t0);
        if(ghost){
          if(full){ gs++; if(comeback && gs >= 2){ ghost = false; lives = 1; gs = 0; res = "revive"; } else res = "ghostOk"; } else { gs = 0; res = "ghostBad"; }
        } else if(full){
          pts = 100 + 20 * (L - P.start) + Math.round(50 * MG.clamp((1 - rt / W) / 0.85, 0, 1));
          sc.s += pts; sc.c++; sc.n++; sc.rt += Math.round(rt); best = Math.max(best, L); res = "ok"; MG.beep("ok");
        } else {
          pts = Math.floor(50 * pos / L); sc.s += pts; sc.w++; sc.n++; res = "bad"; MG.beep("bad");
          Rd.heard.forEach(function(w){ missed[w.w] = w; });
          if(lives != null){ lives--; if(lives <= 0){ lives = 0; ghost = true; gs = 0; res = "out"; } }
        }
        emit();
      }
      // 公布：每一格對錯＋正確順序
      MG.$$(".od-slot", el).forEach(function(s, i){ s.classList.toggle("ok", !!ans[i] && ans[i].w === Rd.heard[i].w); s.classList.toggle("bad", !ans[i] || ans[i].w !== Rd.heard[i].w); });
      ansEl.className = "od-ans show";
      ansEl.innerHTML = '<small>正確順序 Correct order</small><div>' + Rd.heard.map(function(w, i){ return '<span class="od-chip"><em>' + (i + 1) + '</em><span class="zh">' + MG.esc(w.w) + '</span>' + (phonOf(w) ? '<i' + (o.phon === "zy" ? ' class="zh"' : '') + '>' + MG.esc(phonOf(w)) + '</i>' : '') + '</span>'; }).join("") + '</div>';
      var T = {
        ok: ['good', '全對！ All correct! <b>+' + pts + '</b>'],
        bad: ['bad', '有 ' + pos + ' 個位置對了 ' + pos + ' of ' + L + ' in place' + (pts ? '　<b>+' + pts + '</b>' : '') + (lives != null ? '　還有 ' + lives + ' 條命 ' + lives + ' lives left' : '')],
        out: ['bad', '答錯了，命用完了 Out of lives！<br><span class="en">接下來是旁觀練習：不計分，連續答對 2 輪就能復活。 Practice mode: get 2 rounds right to come back.</span>'],
        ghostOk: ['good', '答對了（練習，不計分） Correct (practice) ' + gs + ' / 2'],
        ghostBad: ['bad', '再試試看（練習，不計分） Keep trying (practice)'],
        revive: ['good', '復活了！ You are back! ❤️　回到遊戲，有 1 條命。']
      };
      if(spectate){ msg.className = "od-msg"; msg.textContent = ""; }
      else if(T[res]){ msg.className = "od-msg " + T[res][0]; msg.innerHTML = T[res][1]; if(res === "revive") MG.beep("go"); }
      draw(); MG.$$(".od-slot", el).forEach(function(s, i){ s.classList.toggle("ok", !!ans[i] && ans[i].w === Rd.heard[i].w); s.classList.toggle("bad", !ans[i] || ans[i].w !== Rd.heard[i].w); });
      submitBtn.disabled = true; resetBtn.disabled = true; playBtn.disabled = true; hud();
    }

    function tick(){
      if(ended) return;
      var t = now(), left = 0;
      if(sync){
        var elapsed = t - startAt; if(elapsed < 0) return;
        if(elapsed >= P.total){ finish(); return; }
        var r = 0; for(var i = 0; i < P.offs.length; i++){ if(elapsed >= P.offs[i]) r = i; }
        var rel = elapsed - P.offs[r], W = R[r].win, pre = R[r].pre;
        if(r !== cur) enter(r, startAt + P.offs[r]);
        var ph = rel < LEAD ? "lead" : rel < LEAD + pre ? "listen" : rel < LEAD + pre + W ? "ask" : "reveal";
        if(ph !== phase) setPhase(ph);
        left = ph === "ask" ? LEAD + pre + W - rel : 0;
        bar.style.width = (ph === "ask" ? MG.clamp(left / W, 0, 1) * 100 : ph === "listen" ? MG.clamp((LEAD + pre - rel) / pre, 0, 1) * 100 : 0) + "%";
        bar.parentElement.classList.toggle("warn", ph === "ask" && left < 8000);
      } else {
        if(gate) return;
        if(cur < 0){ enter(0, t); setPhase("lead"); }
        var relS = t - roundStart, Ws = R[cur].win, preS = R[cur].pre;
        if(phase === "lead" && relS >= LEAD) setPhase(memory ? "listen" : "ask");
        if(phase === "listen" && relS >= LEAD + preS) setPhase("ask");
        if(phase === "ask" && (submitted || relS >= LEAD + preS + Ws)){ setPhase("reveal"); revealAt = t; }
        if(phase === "reveal" && t - revealAt >= REVEAL_SELF){
          if(cur + 1 >= nR || (lives != null && lives <= 0)){ finish(); return; }
          enter(cur + 1, t); setPhase("lead");
        }
        left = phase === "ask" ? LEAD + preS + Ws - relS : 0;
        bar.style.width = (phase === "ask" ? MG.clamp(left / Ws, 0, 1) * 100 : phase === "listen" ? MG.clamp((LEAD + preS - relS) / preS, 0, 1) * 100 : 0) + "%";
        bar.parentElement.classList.toggle("warn", phase === "ask" && left < 8000);
      }
    }
    function result(){ return Object.assign({}, sc, { time: Math.max(0, (ended || now()) - startAt), missed: Object.keys(missed).map(function(k){ return missed[k]; }), done: true, lives: lives, best: best, ghost: ghost }); }
    function finish(){
      if(ended) return; ended = now(); clearInterval(timer); if(cancelSpeech) cancelSpeech(); MG.music.stop(); MG.beep("end");
      if(o.onEnd) o.onEnd(result());
    }
    playBtn.onclick = play; submitBtn.onclick = submit;
    resetBtn.onclick = function(){ if(!canEdit()) return; for(var i = 0; i < slots.length; i++) slots[i] = null; draw(); };
    MG.$(".od-snd", el).onclick = function(){ MG.sound.on = !MG.sound.on; this.textContent = MG.sound.on ? "音效 開 Sound on" : "音效 關 Sound off"; };
    if(o.onQuit) MG.$(".od-quit", el).onclick = function(){ if(cancelSpeech) cancelSpeech(); MG.music.stop(); o.onQuit(); };
    MG.bindMusicBtn(el, o.music);
    if(!nR){ msg.className = "od-msg bad"; msg.textContent = "生詞太少了，至少要 2 個才能玩聽音排序"; return { stop: function(){}, finish: function(){}, score: function(){ return sc; }, result: result }; }
    // 語音先載好：自己練習／試玩要等到載好（最多等 10 秒）才開始；即時房間共用時鐘不能等，所以在等待室就先載
    if(!spectate){
      var pf = prefetch(o, words); 
      if(gate){ msg.className = "od-msg wait"; msg.innerHTML = '載入語音中…<span class="en">Loading the voice…</span>'; Promise.race([pf, new Promise(function(r){ setTimeout(r, 10000); })]).then(function(){ gate = false; startAt = now(); msg.className = "od-msg"; msg.textContent = ""; }, function(){ gate = false; startAt = now(); }); }
    }
    hud(); tick(); timer = setInterval(tick, 100);
    if(o.music && !spectate) MG.music.play(o.music);
    MG.audioHint(el);
    return { stop: function(){ if(cancelSpeech) cancelSpeech(); MG.music.stop(); if(!ended){ ended = now(); clearInterval(timer); } }, finish: finish, score: function(){ return sc; }, result: result };
  }
  MG.Order = { create: create, totalMs: totalMs, prefetch: prefetch, rounds: rounds, plan: plan, PACE: PACE };
})();
