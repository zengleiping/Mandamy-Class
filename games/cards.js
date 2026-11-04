/* 翻卡選題 Card Pick（只有即時多人）：一排蓋著的卡，卡背是數字、水果或動物；輪到的學生用自己的裝置選一張，翻開是生詞，要回答問題，答對幫小組得分。
   資料（房間 cards/）只有開房間的老師能寫：
     cards/t   { n, uid, name, g, gname, phase:"pick"|"answer"|"result", card, t0, dl, ok, pts, ans, at }   目前這一手
     cards/done { 卡片編號: { ok, by, g } }                                                          已經翻過的卡
   學生選卡、作答：寫自己的 players/{uid}/act = { n, k:"pick"|"ans", v, at }；老師的畫面收到後判定、公布結果；
   學生看到結果是自己的，就把分數寫進自己的 scores/{uid}（跟其他遊戲一樣，組別分數＝成員分數加總）。 */
(function(){
  var MG = window.MG;
  var FRUITS = [["🍎", "蘋果"], ["🍌", "香蕉"], ["🍇", "葡萄"], ["🍉", "西瓜"], ["🍓", "草莓"], ["🍊", "橘子"], ["🍍", "鳳梨"], ["🥭", "芒果"], ["🍑", "桃子"], ["🍒", "櫻桃"], ["🍋", "檸檬"], ["🥝", "奇異果"], ["🍐", "梨子"], ["🥥", "椰子"], ["🍈", "哈密瓜"], ["🍅", "番茄"], ["🥑", "酪梨"], ["🍏", "青蘋果"]];
  var ANIMALS = [["🐶", "小狗"], ["🐱", "小貓"], ["🐰", "兔子"], ["🐻", "熊"], ["🐼", "熊貓"], ["🦊", "狐狸"], ["🐯", "老虎"], ["🦁", "獅子"], ["🐮", "牛"], ["🐷", "豬"], ["🐸", "青蛙"], ["🐵", "猴子"], ["🐔", "雞"], ["🐧", "企鵝"], ["🐘", "大象"], ["🦒", "長頸鹿"], ["🐴", "馬"], ["🐑", "羊"], ["🐢", "烏龜"], ["🐟", "魚"], ["🐬", "海豚"], ["🦋", "蝴蝶"], ["🐝", "蜜蜂"], ["🦆", "鴨子"], ["🐭", "老鼠"], ["🐹", "倉鼠"], ["🦉", "貓頭鷹"], ["🐍", "蛇"], ["🦓", "斑馬"], ["🐊", "鱷魚"]];
  var OPTC = ["#E8825A", "#5B9BD5", "#6FAE5B", "#D9A441"];
  function seedOf(c, round){ return (Number(c.seed) || 1) + round * 7919; }
  function backList(cc){ return cc.back === "fruit" ? FRUITS : cc.back === "animal" ? ANIMALS : null; }
  function maxCards(cc, nWords){ var l = backList(cc); return Math.min(nWords, l ? l.length : 40); }
  function pyOfZh(zh, phon){
    try{ if(phon === "zy") return MG.zyOf({ w: zh }); var pp = window.pinyinPro; return pp && pp.pinyin ? pp.pinyin(zh, { toneType: "symbol" }) : ""; }catch(e){ return ""; }
  }
  // 這一局的卡：每張卡一個卡背、一個生詞（全班用同一個種子，所以每台裝置排出來的卡都一樣）
  function layout(c, round){
    var cc = c.cards || {}, rnd = MG.rng(seedOf(c, round)), ws = MG.shuffle(MG.withPhon(c.words || [], c.phon), rnd);
    var n = Math.max(2, Math.min(Number(cc.n) || 12, maxCards(cc, ws.length))), bl = backList(cc), backs = bl ? MG.shuffle(bl, rnd).slice(0, n) : null;
    return ws.slice(0, n).map(function(w, i){ var b = backs ? backs[i] : null; return { i: i, w: w, num: i + 1, e: b ? b[0] : "", zh: b ? b[1] : "", bp: b ? pyOfZh(b[1], c.phon) : "" }; });
  }
  // 題目：選擇題（看詞選讀音／看讀音選詞／看詞選翻譯），老師和學生用同一個種子算出同一題
  function question(c, round, card){
    var cc = c.cards || {}; if(cc.ans === "oral") return null;
    var ws = MG.withPhon(c.words || [], c.phon), rnd = MG.rng(seedOf(c, round) + card.i * 131 + 7), w = card.w, lang = c.lang;
    var tr = function(x){ return MG.trOf(x, lang); };
    var kinds = { w2p: { ok: !!w.p, f: function(x){ return x.p; }, show: w.w, sub: "選出正確的" + MG.phonName(c.phon) + " Pick the right " + (c.phon === "zy" ? "zhuyin" : "pinyin"), big: true },
      p2w: { ok: !!w.p, f: function(x){ return x.w; }, show: w.p, sub: "這個" + MG.phonName(c.phon) + "是哪個詞？ Which word is it?", big: false },
      w2t: { ok: !!tr(w), f: tr, show: w.w, sub: "這個詞是什麼意思？ What does it mean?", big: true } };
    var order = cc.q && cc.q !== "mix" ? [cc.q] : MG.shuffle(["w2p", "p2w", "w2t"], rnd);
    for(var k = 0; k < order.length; k++){
      var K = kinds[order[k]]; if(!K || !K.ok) continue;
      var right = String(K.f(w) || ""), pool = MG.shuffle(ws.filter(function(x){ return x !== w && K.f(x) && String(K.f(x)) !== right; }), rnd), seen = {}, opts = [];
      pool.forEach(function(x){ var v = String(K.f(x)); if(!seen[v] && opts.length < 3){ seen[v] = 1; opts.push(v); } });
      if(opts.length < 2) continue;
      opts.push(right); opts = MG.shuffle(opts, rnd);
      return { type: order[k], show: K.show, sub: K.sub, big: K.big, opts: opts, ans: opts.indexOf(right) };
    }
    return null;
  }
  function backHtml(c, card, cc){
    if(!card.e) return '<span class="cp-num">' + card.num + '</span>';
    return '<span class="cp-emo">' + card.e + '</span>' + (cc.label === "hide" ? '<span class="cp-no">' + card.num + '</span>' : '<span class="cp-nm">' + MG.esc(card.zh) + '</span><span class="cp-py">' + MG.esc(card.bp) + '</span>');
  }
  function gridHtml(c, cards, done, curCard, canPick){
    var cc = c.cards || {};
    return '<div class="cp-grid">' + cards.map(function(cd){
      var d = done[cd.i], cls = "cp-card" + (d ? (d.ok ? " ok" : " bad") : "") + (curCard === cd.i ? " cur" : "") + (canPick && !d && curCard == null ? " can" : "");
      var face = d || curCard === cd.i ? '<span class="cp-w">' + MG.esc(cd.w.w) + '</span>' + (d ? '<span class="cp-by">' + (d.ok ? "✓ " : "✗ ") + MG.esc(d.by || "") + '</span>' : '') : backHtml(c, cd, cc);
      return '<button type="button" class="' + cls + '" data-i="' + cd.i + '"' + (d ? " disabled" : "") + '>' + face + '</button>';
    }).join("") + '</div>';
  }
  function list(o){ return Object.keys(o || {}).map(function(k){ return Object.assign({ uid: k }, o[k]); }); }

  // =====================================================================
  // 老師：投影畫面＋判定
  // =====================================================================
  function host(box, api){
    var c = api.cfg(), round = api.state().round || 1, cc = c.cards || {}, cards = layout(c, round), base = api.base, oral = cc.ans === "oral", sec = Number(cc.sec) || 0, pts = Number(cc.pts) || 10;
    var T = { n: 0 }, done = {}, tmr = null, stopped = false, nextT = null, qNow = null;
    function members(){
      var st = api.state(), pl = list(api.players()).filter(function(p){ return !p.kicked; }).sort(function(a, b){ return (a.at || 0) - (b.at || 0); }), pg = st.pg || {}, gn = st.gn || {};
      return { pl: pl, pg: pg, gn: gn, teams: st.groupsOn ? Object.keys(gn).filter(function(g){ return pl.some(function(p){ return pg[p.uid] === g; }); }) : [] };
    }
    function pickerFor(n){
      var m = members(); if(!m.pl.length) return null;
      if(m.teams.length){ var g = m.teams[(n - 1) % m.teams.length], mem = m.pl.filter(function(p){ return m.pg[p.uid] === g; }), k = Math.floor((n - 1) / m.teams.length); var p = mem[k % mem.length]; return { uid: p.uid, name: p.name, g: g, gname: m.gn[g] || "" }; }
      var q = m.pl[(n - 1) % m.pl.length]; return { uid: q.uid, name: q.name, g: m.pg[q.uid] || "", gname: m.gn[m.pg[q.uid]] || "" };
    }
    function remain(){ return cards.filter(function(cd){ return !done[cd.i]; }).length; }
    function write(){ MG.fb.update(base + "/cards", { t: T, done: Object.keys(done).length ? done : null }).catch(function(){}); }
    function turn(){
      clearTimeout(nextT);
      if(!remain()){ T = Object.assign({}, T, { phase: "over" }); write(); render(); nextT = setTimeout(function(){ if(!stopped) api.endRound(); }, 2500); return; }
      T.n++; var p = pickerFor(T.n);
      T = p ? { n: T.n, uid: p.uid, name: p.name, g: p.g, gname: p.gname, phase: "pick", card: null, at: MG.fb.now() } : { n: T.n, uid: "", name: "", g: "", gname: "", phase: "pick", card: null, at: MG.fb.now() };
      qNow = null; write(); render();
    }
    function open(i){
      if(T.phase !== "pick" || done[i] || !cards[i]) return;
      T = Object.assign({}, T, { phase: "answer", card: i, t0: MG.fb.now(), dl: !oral && sec ? MG.fb.now() + sec * 1000 : 0 });
      qNow = question(c, round, cards[i]); write(); render(); MG.beep("pop");
      try{ MG.speak(cards[i].w.w, { voice: cc.voice }); }catch(e){}
    }
    function result(ok, v){
      if(T.phase !== "answer") return;
      var cd = cards[T.card]; done[cd.i] = { ok: ok ? 1 : 0, by: T.name, g: T.g };
      T = Object.assign({}, T, { phase: "result", ok: ok ? 1 : 0, pts: ok ? pts : 0, ans: v == null ? -1 : v, at: MG.fb.now() });
      write(); render(); MG.beep(ok ? "ok" : "bad");
      nextT = setTimeout(function(){ if(!stopped) turn(); }, remain() ? 4200 : 3000);
    }
    function check(){
      if(!T.uid) return; var p = api.players()[T.uid], a = p && p.act; if(!a || a.n !== T.n) return;
      if(T.phase === "pick" && a.k === "pick" && cards[a.v] && !done[a.v]) open(a.v);
      else if(T.phase === "answer" && a.k === "ans" && !oral && qNow && a.v >= 0 && a.v < qNow.opts.length) result(a.v === qNow.ans, a.v);
    }
    function render(){
      if(!box.isConnected) return; var curCd = T.card != null ? cards[T.card] : null, who = T.name ? MG.esc(T.name) + (T.gname ? '<small>（' + MG.esc(T.gname) + '）</small>' : '') : "";
      var head;
      if(T.phase === "over") head = '<div class="cp-turn"><b>所有的卡都翻完了！ All cards done!</b></div>';
      else if(!T.uid) head = '<div class="cp-turn"><b>等學生加入… Waiting for players…</b><button class="mg-btn sm" data-a="skip">重新找人</button></div>';
      else if(T.phase === "pick") head = '<div class="cp-turn"><span>輪到</span><b>' + who + '</b><span>選一張卡</span><span class="note">Pick a card</span><button class="mg-btn sm" data-a="skip">換人 Skip</button></div>';
      else {
        var ans = '';
        if(T.phase === "answer"){
          ans = oral ? '<div class="cp-oral">請 ' + who + ' 大聲唸出來，說說這個詞的意思，或造一個句子。<button class="mg-btn primary" data-a="ok">✓ 答對</button><button class="mg-btn" data-a="bad">✗ 答錯</button></div>' :
            qNow ? '<div class="cp-q"><div class="cp-qsub">' + MG.esc(qNow.sub) + '</div><div class="cp-qopts">' + qNow.opts.map(function(o, k){ return '<span style="background:' + OPTC[k % 4] + '">' + MG.esc(o) + '</span>'; }).join("") + '</div></div>' : '<div class="cp-oral">口頭回答 <button class="mg-btn primary" data-a="ok">✓ 答對</button><button class="mg-btn" data-a="bad">✗ 答錯</button></div>';
        } else ans = '<div class="cp-res ' + (T.ok ? "ok" : "bad") + '">' + (T.ok ? "答對了！+" + T.pts + " 分 Correct!" : "答錯了 Not this time") + (qNow && !oral ? '<small>答案：' + MG.esc(qNow.opts[qNow.ans]) + '</small>' : '') + '</div>';
        var shown = qNow && !oral ? (qNow.type === "p2w" ? qNow.show : cd(curCd)) : cd(curCd);
        head = '<div class="cp-open"><div class="cp-who"><b>' + who + '</b>' + (T.phase === "answer" && T.dl ? '<span class="cp-cd" id="cp-cd"></span>' : '') + '</div><div class="cp-big">' + MG.esc(shown) + '</div>' + (curCd && curCd.w.p && qNow && qNow.type !== "p2w" && qNow.type !== "w2p" ? '<div class="cp-sm">' + MG.esc(curCd.w.p) + '</div>' : '') + ans + '</div>';
      }
      function cd(x){ return x ? x.w.w : ""; }
      box.innerHTML = '<div class="cp-host">' + head + '<div class="cp-prog note">已翻 ' + (cards.length - remain()) + ' / ' + cards.length + ' 張・老師也可以直接點卡片代替沒有裝置的學生選卡</div>' + gridHtml(c, cards, done, T.phase === "pick" ? null : T.card, T.phase === "pick") + '</div>';
      var cdH = box.querySelector("#cp-cd"); if(cdH && T.dl) cdH.textContent = Math.max(0, Math.ceil((T.dl - MG.fb.now()) / 1000));
    }
    box.onclick = function(e){
      var b = e.target.closest("[data-i]"); if(b && T.phase === "pick"){ open(Number(b.dataset.i)); return; }
      var a = e.target.closest("[data-a]"); if(!a) return; var k = a.dataset.a;
      if(k === "skip"){ if(T.phase === "pick") turn(); }
      else if(k === "ok") result(true); else if(k === "bad") result(false);
    };
    tmr = setInterval(function(){
      if(stopped) return; var now = MG.fb.now();
      if(T.phase === "answer" && T.dl){ var el = document.getElementById("cp-cd"); if(el) el.textContent = Math.max(0, Math.ceil((T.dl - now) / 1000)); if(now > T.dl + 800) result(false); }
      else if(T.phase === "pick" && T.at && now - T.at > 90000 && T.uid) turn();
      else if(!T.uid && members().pl.length) turn();
    }, 500);
    // 重新整理後回到房間：接著上次的進度
    MG.fb.get(base + "/cards").then(function(sv){
      if(stopped) return;
      if(sv && sv.t && sv.t.n){ T = sv.t; done = sv.done || {}; if(T.phase === "answer"){ qNow = T.card != null ? question(c, round, cards[T.card]) : null; if(T.dl && Date.now() > T.dl) result(false); } if(T.phase === "result"){ if(T.card != null) qNow = question(c, round, cards[T.card]); nextT = setTimeout(turn, 2500); } render(); if(T.phase === "pick" && !T.uid) turn(); }
      else turn();
    }).catch(function(){ turn(); });
    return { update: check, stop: function(){ stopped = true; clearInterval(tmr); clearTimeout(nextT); } };
  }

  // =====================================================================
  // 學生
  // =====================================================================
  function student(root, api){
    var c = api.cfg, round = api.round, cc = c.cards || {}, cards = layout(c, round), oral = cc.ans === "oral", base = api.base, uid = api.uid;
    var S = { t: null, done: {}, sc: MG.newScore(api.init), la: (api.init && api.init.la) || 0 }, stopped = false, unsub = [], qNow = null, qKey = "", tmr = null;
    root.innerHTML = '<div class="gm"><div class="gm-hud"><span class="gm-title">' + MG.esc(MG.gameTitle("cards")) + '</span><span class="grow"></span><div class="gm-stat score"><small>我的分數 Score</small><b id="cp-sc">0</b></div></div><div class="cp-stu" id="cp-body"></div></div>';
    var body = root.querySelector("#cp-body");
    function mine(){ return S.t && S.t.uid === uid; }
    function act(k, v){ MG.fb.update(base + "/players/" + uid, { act: { n: S.t.n, k: k, v: v, at: MG.fb.now() } }).catch(function(){}); }
    function render(){
      if(stopped || !body) return; var T = S.t, curCd = T && T.card != null ? cards[T.card] : null, head = "", ans = "";
      if(!T) head = '<div class="cp-turn"><b>等老師開始… Waiting…</b></div>';
      else if(T.phase === "over") head = '<div class="cp-turn"><b>卡片都翻完了！ All cards done!</b></div>';
      else if(!T.uid) head = '<div class="cp-turn"><b>等人加入… Waiting for players…</b></div>';
      else if(T.phase === "pick") head = '<div class="cp-turn' + (mine() ? " me" : "") + '">' + (mine() ? '<b>輪到你了！選一張卡</b><span class="note">Your turn — pick a card!</span>' : '<span>輪到</span><b>' + MG.esc(T.name) + (T.gname ? '<small>（' + MG.esc(T.gname) + '）</small>' : '') + '</b><span>選卡</span><span class="note">is picking</span>') + '</div>';
      else {
        var q = qNow, big = curCd ? curCd.w.w : "";
        if(q && q.type === "p2w") big = q.show;
        if(T.phase === "answer"){
          if(oral) ans = '<div class="cp-oral">' + (mine() ? '大聲唸出來，說說它的意思或造句，老師會判定！ Say it aloud — the teacher will judge.' : MG.esc(T.name) + ' 正在回答… answering…') + '</div>';
          else if(q) ans = '<div class="cp-q"><div class="cp-qsub">' + MG.esc(q.sub) + '</div><div class="cp-qopts' + (mine() ? " me" : "") + '">' + q.opts.map(function(o, k){ return '<button type="button" data-o="' + k + '" style="background:' + OPTC[k % 4] + '"' + (mine() ? "" : " disabled") + '>' + MG.esc(o) + '</button>'; }).join("") + '</div></div>';
        } else ans = '<div class="cp-res ' + (T.ok ? "ok" : "bad") + '">' + (T.ok ? "答對了！+" + T.pts + " 分 Correct!" : "答錯了 Not this time") + (q && !oral ? '<small>答案：' + MG.esc(q.opts[q.ans]) + '</small>' : '') + '</div>';
        head = '<div class="cp-open"><div class="cp-who"><b>' + MG.esc(T.name) + '</b>' + (T.gname ? '<small>' + MG.esc(T.gname) + '</small>' : '') + (T.phase === "answer" && T.dl ? '<span class="cp-cd" id="cp-cd"></span>' : '') + '</div><div class="cp-big">' + MG.esc(big) + '</div>' + ans + '</div>';
      }
      body.innerHTML = head + gridHtml(c, cards, S.done, T && T.phase !== "pick" ? T.card : null, T && T.phase === "pick" && mine());
      var scEl = root.querySelector("#cp-sc"); if(scEl) scEl.textContent = S.sc.s;
      var cdE = body.querySelector("#cp-cd"); if(cdE && T && T.dl) cdE.textContent = Math.max(0, Math.ceil((T.dl - MG.fb.now()) / 1000));
    }
    function apply(T){
      // 這一手的結果是我的：把分數記進我的分數
      if(!T || T.phase !== "result" || T.uid !== uid || S.la >= T.n) return;
      S.la = T.n; var rt = Math.max(0, (T.at || 0) - (T.t0 || 0));
      if(T.ok){ S.sc.c++; S.sc.n++; S.sc.rt += rt; S.sc.s += T.pts || 0; MG.beep("ok"); } else { S.sc.w++; S.sc.n++; MG.beep("bad"); }
      api.writeScore(Object.assign({}, S.sc, { la: T.n }));
    }
    unsub.push(MG.fb.on(base + "/cards", function(v){
      v = v || {}; var T = v.t || null, prevN = S.t && S.t.n, prevPh = S.t && S.t.phase;
      S.t = T; S.done = v.done || {};
      var key = T && T.phase !== "pick" && T.card != null ? T.n + ":" + T.card : "";
      if(key !== qKey){ qKey = key; qNow = key ? question(c, round, cards[T.card]) : null; }
      if(T && T.phase === "answer" && (T.n !== prevN || prevPh !== "answer")) MG.beep("pop");
      apply(T); render();
    }));
    body.onclick = function(e){
      if(!S.t || !mine()) return;
      var b = e.target.closest("[data-i]"); if(b && S.t.phase === "pick" && !b.disabled){ act("pick", Number(b.dataset.i)); MG.beep("pop"); b.classList.add("sent"); return; }
      var o = e.target.closest("[data-o]"); if(o && S.t.phase === "answer" && !o.disabled){ act("ans", Number(o.dataset.o)); root.querySelectorAll("[data-o]").forEach(function(x){ x.disabled = true; x.classList.toggle("pickd", x === o); }); }
    };
    tmr = setInterval(function(){ var el = document.getElementById("cp-cd"); if(el && S.t && S.t.dl) el.textContent = Math.max(0, Math.ceil((S.t.dl - MG.fb.now()) / 1000)); }, 400);
    return { stop: function(){ stopped = true; clearInterval(tmr); unsub.forEach(function(u){ try{ u(); }catch(e){} }); }, finish: function(){ this.stop(); } };
  }

  MG.Cards = { host: host, student: student, layout: layout, question: question, FRUITS: FRUITS, ANIMALS: ANIMALS, maxCards: maxCards,
    summary: function(cc, phon){ cc = cc || {}; return "翻卡選題 Card Pick・" + cc.n + " 張・卡背" + ({ num: "數字", fruit: "水果", animal: "動物" }[cc.back] || "數字") + "・" + (cc.ans === "oral" ? "口說（老師判定）" : "選擇題" + (cc.sec ? "・每題 " + cc.sec + " 秒" : "")); } };
})();
