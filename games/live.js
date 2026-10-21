/* 曼米中文 · 生詞遊戲：即時多人（像 Kahoot）
   房間資料：liveGames/{代碼}（資料庫規則還沒更新時，自動改用 rooms/mmg_{代碼}）
     meta   { owner, t, exp, at }                      只有開房間的老師能改
     cfg    { game, lang, match, blast, words, seed, title, scoring, groupsOn }
     state  { phase:"lobby"|"play"|"end", round, startAt, endAt, pg:{uid:組別}, gn:{組別:組名} }
     grp    等待室的分組（給學生看自己在哪一組）
     players/{uid} { name, base, at, kicked }           學生只寫自己的
     scores/{uid}  { s, c, w, rt, n, time, done, lives, r }  學生只寫自己的；最多每 1.5 秒寫一次
     board  老師每 2.5 秒整理一次的排行榜（學生只聽這一個，省流量）
     final  最後的排行榜 */
(function(){
  var MG = window.MG, app = document.getElementById("app");
  var BASES = ["liveGames/", "rooms/mmg_"];
  var EXP_MS = 6 * 3600 * 1000, CAP_MS = 10 * 60 * 1000;

  function throttle(fn, ms){
    var last = 0, timer = null, pending;
    var f = function(v){ pending = v; var n = Date.now(); if(n - last >= ms && !timer){ last = n; fn(pending); pending = undefined; } else if(!timer){ timer = setTimeout(function(){ timer = null; last = Date.now(); if(pending !== undefined){ fn(pending); pending = undefined; } }, Math.max(0, ms - (n - last))); } };
    f.flush = function(v){ clearTimeout(timer); timer = null; last = Date.now(); fn(v !== undefined ? v : pending); pending = undefined; };
    return f;
  }
  function joinUrl(code){ return location.href.split("?")[0].split("#")[0].replace(/index\.html$/, "") + "?code=" + code; }
  async function findBase(code){
    for(var i = 0; i < BASES.length; i++){ try{ var m = await MG.fb.get(BASES[i] + code + "/meta"); if(m) return BASES[i] + code; }catch(e){} }
    return null;
  }
  function list(o){ return Object.keys(o || {}).map(function(k){ return Object.assign({ uid: k }, o[k]); }); }

  // ---------- 排行榜計算 ----------
  function computeBoards(players, scores, state, scoring){
    var round = state.round || 1, pg = state.pg || {}, gn = state.gn || {};
    var ind = list(players).filter(function(p){ return !p.kicked; }).map(function(p){
      var s = scores[p.uid] && scores[p.uid].r === round ? scores[p.uid] : {};
      return { uid: p.uid, name: p.name, g: pg[p.uid] || "", s: s.s || 0, c: s.c || 0, w: s.w || 0, rt: s.rt || 0, n: s.n || 0, time: s.time || 0, done: !!s.done, lives: s.lives, at: p.at || 0 };
    }).sort(MG.rankCmp);
    var grp = [];
    if(state.groupsOn){
      Object.keys(gn).forEach(function(gid){
        var mem = ind.filter(function(x){ return x.g === gid; });
        // 有效成員：開始時已經在房間、而且有作答（中途斷線的也算）
        var valid = mem.filter(function(x){ return x.n > 0 && (!state.startAt || x.at <= state.startAt + 1500); });
        var tot = valid.reduce(function(a, x){ return a + x.s; }, 0), k = valid.length;
        grp.push({ id: gid, name: gn[gid], s: k ? (scoring === "sum" ? tot : Math.round(tot / k)) : 0, c: k ? valid.reduce(function(a, x){ return a + MG.acc(x); }, 0) / k : 0, art: k ? valid.reduce(function(a, x){ return a + (MG.avgRt(x) || 0); }, 0) / k : 0, valid: k, size: mem.length });
      });
      grp.sort(function(a, b){ return (b.s - a.s) || (b.c - a.c) || ((a.art || 1e9) - (b.art || 1e9)); });
    }
    return { ind: ind, grp: grp };
  }
  function boardHtml(rows, opts){
    opts = opts || {};
    if(!rows.length) return '<p class="note">' + (opts.empty || "還沒有人") + '</p>';
    var max = Math.max.apply(null, rows.map(function(r){ return r.s || 0; }).concat([1]));
    return rows.slice(0, opts.limit || 100).map(function(r, i){
      var rk = r.rank || i + 1;
      return '<div class="lb-row r' + rk + (opts.me && r.uid === opts.me ? " me" : "") + '"><span class="rk">' + rk + '</span><span class="nm">' + MG.esc(r.name) + (opts.sub ? '<small>' + MG.esc(opts.sub(r)) + '</small>' : '') + '</span><span class="sc">' + (r.s || 0) + '</span>' + (opts.bars ? '<span class="lb-bar"><i style="width:' + Math.round((r.s || 0) / max * 100) + '%"></i></span>' : '') + '</div>';
    }).join("");
  }

  // =====================================================================
  // 老師
  // =====================================================================
  var TL = null;
  async function teacherStart(){
    var G = MG.G, c = G.cfg, t = G.ctx.t, uid = MG.fb.uid();
    if(!t){ MG.toast("要登入老師帳號才能開房間"); return; }
    var seed = MG.newSeed();
    app.innerHTML = '<div class="mg-loading">開房間中…</div>';
    await sweep(t);
    var code = "", base = "";
    for(var tries = 0; tries < 8 && !base; tries++){
      code = String(Math.floor(100000 + Math.random() * 900000));
      for(var i = 0; i < BASES.length; i++){
        var b = BASES[i] + code;
        try{
          var ex = await MG.fb.get(b + "/meta"); if(ex) break;
          await MG.fb.set(b + "/meta", { owner: uid, t: t, at: Date.now(), exp: Date.now() + EXP_MS });
          base = b; break;
        }catch(e){ /* 這個位置沒有權限，試下一個 */ }
      }
    }
    if(!base){ MG.toast("開房間失敗，請檢查網路"); MG.viewSetup(); return; }
    var saved = MG.Groups ? await MG.Groups.load() : null;
    var cfg = buildCfg(seed);
    try{
      await MG.fb.update(base, { cfg: cfg, state: { phase: "lobby", round: 1 } });
      MG.fb.set("teacherPlatform/" + t + "/liveGameList/" + code, { base: base, at: Date.now() }).catch(function(){});
    }catch(e){ MG.toast("開房間失敗：" + (e && e.message || "")); MG.viewSetup(); return; }
    TL = { code: code, base: base, cfg: cfg, state: { phase: "lobby", round: 1 }, players: {}, scores: {}, groups: saved || MG.Groups.blank(0), groupsOn: !!(saved && saved.groups.length), unsub: [], t: t };
    try{ window.parent.postMessage({ mmGame: "room", code: code, url: joinUrl(code) }, "*"); }catch(e){}
    TL.unsub.push(MG.fb.on(base + "/players", function(v){ TL.players = v || {}; onPlayers(); }));
    TL.unsub.push(MG.fb.on(base + "/scores", function(v){ TL.scores = v || {}; onScores(); }));
    lobby();
  }
  // 房間設定：用老師目前在設定頁的選擇（遊戲、出題範圍、翻譯、主題、音樂…）
  function buildCfg(seed){
    var G = MG.G, c = G.cfg;
    var words = MG.poolFor(seed).map(function(w){ var o = { w: w.w, p: w.p }; if(w.zy) o.zy = w.zy; if(MG.picOf(w)) o.e = MG.picOf(w); var tr = MG.trOf(w, c.lang); if(tr){ o.tr = {}; o.tr[c.lang] = tr; } return o; });
    // 即時 Blast：命用完預設「復活挑戰」，沒有設時間就用 90 秒（不然遊戲不會結束）
    var blast = Object.assign({}, c.blast);
    if(blast.liveOut !== "end" && Number(blast.lives) > 0){ blast.revive = true; if(!blast.seconds) blast.seconds = 90; }
    return { game: c.game, lang: c.lang, phon: c.phon || "py", match: c.match, blast: blast, words: words, seed: seed, title: (c.game === "match" ? "配對 Match" : "Blast"), scoring: (TL && TL.cfg && TL.cfg.scoring) || (c.live || {}).scoring || "avg", studentMusic: (c.live || {}).stuMusic !== false, cls: G.ctx.cls ? G.ctx.cls.name : "" };
  }
  // 換遊戲／改設定：學生留在等待室，老師回設定頁改好再「套用到房間」
  function changeMode(){ if(!TL) return; TL.editing = true; MG.viewSetup(); }
  function current(){ return TL && TL.editing ? { code: TL.code, n: names().length, phase: TL.state.phase } : null; }
  function backToRoom(){ if(!TL) return; TL.editing = false; if(TL.state.phase === "end" && TL.lastFinal) finalView(TL.lastFinal); else lobby(); }
  async function applyToRoom(){
    if(!TL) return;
    var seed = MG.newSeed(), cfg = buildCfg(seed), r = (TL.state.round || 1) + (TL.state.phase === "lobby" ? 0 : 1);
    var st = { phase: "lobby", round: r };
    try{ await MG.fb.update(TL.base, { cfg: cfg, state: st, scores: null, final: null, board: null }); }catch(e){ MG.toast("套用失敗，請檢查網路"); return; }
    TL.cfg = cfg; TL.state = st; TL.scores = {}; TL.editing = false; TL.lastFinal = null;
    MG.toast("已套用到房間 " + TL.code); lobby();
  }
  async function sweep(t){
    var lst = await MG.fb.get("teacherPlatform/" + t + "/liveGameList").catch(function(){ return null; }) || {};
    var now = Date.now();
    await Promise.all(Object.keys(lst).map(async function(code){
      var e = lst[code] || {};
      if(now - (e.at || 0) > EXP_MS){ try{ if(e.base) await MG.fb.remove(e.base); }catch(er){} await MG.fb.remove("teacherPlatform/" + t + "/liveGameList/" + code).catch(function(){}); }
    }));
  }
  function names(){ return list(TL.players).filter(function(p){ return !p.kicked; }).sort(function(a, b){ return (a.at || 0) - (b.at || 0); }).map(function(p){ return p.name; }); }
  function uidOf(name){ var p = list(TL.players).filter(function(x){ return x.name === name && !x.kicked; })[0]; return p ? p.uid : null; }
  // 新加入的學生：班上分好的組有這個名字就自動放進去
  function autoPlace(){
    var d = TL.groups, changed = false;
    names().forEach(function(nm){
      if(MG.Groups.groupOf(d, nm)) return;
      var g = MG.Groups.groupOf(d, MG.Groups.baseName(nm));
      if(g && g.members.indexOf(MG.Groups.baseName(nm)) >= 0 && !uidOf(MG.Groups.baseName(nm))){ g.members[g.members.indexOf(MG.Groups.baseName(nm))] = nm; changed = true; }
    });
    return changed;
  }
  var pushGrp = throttle(function(){ if(!TL) return; var d = TL.groups, live = names(); MG.fb.set(TL.base + "/grp", TL.groupsOn ? { on: true, groups: d.groups.map(function(g){ return { id: g.id, name: g.name, members: g.members.filter(function(m){ return live.indexOf(m) >= 0; }) }; }) } : { on: false }).catch(function(){}); }, 1200);
  function onPlayers(){
    if(!TL) return;
    autoPlace();
    if(TL.state.phase === "lobby"){ if(TL.ed) TL.ed.setNames(names()); updateLobbyCount(); pushGrp(); }
    else onScores();
  }
  function kick(name){
    var uid = uidOf(name); if(!uid) return;
    MG.confirm("把「" + name + "」移出房間？", "移出").then(function(ok){ if(ok) MG.fb.update(TL.base + "/players/" + uid, { kicked: true }).catch(function(){}); });
  }
  function lobby(){
    var url = joinUrl(TL.code), c = TL.cfg;
    var sum = c.game === "match" ? "配對・" + (c.match.mode === "timed" ? "限時 " + c.match.seconds + " 秒" : "比速度（全部配完）") + "・" + MG.ph(MG.MATCH_PAIRS[c.match.pair], c.phon) : "Blast・" + (c.blast.input === "type" ? "打拼音" : MG.ph(MG.BLAST_Q[c.blast.q], c.phon)) + "・" + MG.THEMES[c.blast.theme].name + (c.blast.seconds ? "・" + c.blast.seconds + " 秒" : "") + (c.blast.lives ? "・" + c.blast.lives + " 條命" : "") + (c.blast.revive ? "・命用完可以復活挑戰" : "");
    app.innerHTML = '<div class="mg-wrap"><div class="mg-head"><h2>即時遊戲・等待室</h2><span class="note">' + MG.esc(sum) + '・' + c.words.length + ' 個生詞</span><span class="grow"></span><button class="mg-btn" id="lv-mode">換遊戲／改設定</button><button class="mg-btn" id="lv-close">關閉房間</button></div>' +
      '<div class="lv-lobby"><div class="mg-panel lv-code"><div class="note">房間代碼</div><div class="code">' + TL.code + '</div><div class="qr">' + MG.qrSvg(url, 220) + '</div><div class="url">' + MG.esc(url) + '</div><div class="mg-row" style="justify-content:center;margin-top:8px;"><button class="mg-btn sm" id="lv-copy">複製連結</button></div><p class="note">學生掃 QR code，或打開連結輸入代碼，填名字就能加入。</p></div>' +
      '<div><div class="mg-panel"><h3>已加入 <span id="lv-n">0</span> 人 <span class="grow" style="flex:1"></span><label class="note" style="display:flex;gap:6px;align-items:center;font-weight:700;"><input type="checkbox" id="lv-gon"' + (TL.groupsOn ? " checked" : "") + '> 分組比賽</label></h3>' +
      '<div id="lv-gopts" style="' + (TL.groupsOn ? "" : "display:none;") + '"><div class="mg-row" style="margin-bottom:8px;"><span class="note">組別分數：</span><div class="mg-seg" id="lv-scoring"><button type="button" data-v="avg"' + (c.scoring !== "sum" ? ' class="on"' : '') + '>平均（預設）</button><button type="button" data-v="sum"' + (c.scoring === "sum" ? ' class="on"' : '') + '>總分</button></div><span class="grow" style="flex:1"></span>' + (MG.G.ctx.cls ? '<button class="mg-btn sm" id="lv-gload">載入班級分組</button><button class="mg-btn sm" id="lv-gsave">存成班級分組</button>' : '') + '</div></div>' +
      '<div id="lv-ed"></div></div>' +
      '<div class="mg-row" style="justify-content:flex-end;"><span class="note" id="lv-hint"></span><button class="mg-btn big primary" id="lv-start">開始遊戲</button></div></div></div></div>';
    var box = MG.$("#lv-ed");
    function mkEd(){
      if(TL.groupsOn){ TL.ed = MG.Groups.editor(box, { names: names(), data: TL.groups, liveOnly: true, onKick: kick, onChange: function(d){ TL.groups = d; pushGrp(); } }); }
      else { TL.ed = { setNames: function(){ box.innerHTML = '<div class="lv-pl" style="justify-content:flex-start;">' + names().map(function(n){ return '<span>' + MG.esc(n) + ' <button class="mg-btn sm ghost" data-kick="' + MG.esc(n) + '" style="padding:0 4px;">×</button></span>'; }).join("") + '</div>' + (names().length ? '' : '<p class="note">等學生加入…</p>'); } }; TL.ed.setNames(); box.onclick = function(e){ var k = e.target.closest("[data-kick]"); if(k) kick(k.dataset.kick); }; }
    }
    mkEd(); updateLobbyCount(); pushGrp();
    MG.$("#lv-copy").onclick = async function(){ if(await MG.copy(url)) MG.toast("已複製連結"); };
    MG.$("#lv-gon").onchange = function(){ TL.groupsOn = this.checked; MG.$("#lv-gopts").style.display = TL.groupsOn ? "" : "none"; if(TL.groupsOn && !TL.groups.groups.length) TL.groups = MG.Groups.blank(Math.max(2, Math.min(4, Math.ceil(names().length / 4)))); box.onclick = null; mkEd(); pushGrp(); };
    MG.$("#lv-scoring").onclick = function(e){ var b = e.target.closest("button"); if(!b) return; TL.cfg.scoring = b.dataset.v; MG.$$("button", this).forEach(function(x){ x.classList.toggle("on", x === b); }); MG.fb.update(TL.base + "/cfg", { scoring: TL.cfg.scoring }).catch(function(){}); };
    if(MG.$("#lv-gload")) MG.$("#lv-gload").onclick = async function(){ var d = await MG.Groups.load(); if(!d){ MG.toast("這個班還沒有存過分組"); return; } TL.groups = d; autoPlace(); TL.ed.set(TL.groups); pushGrp(); MG.toast("已載入班級分組"); };
    if(MG.$("#lv-gsave")) MG.$("#lv-gsave").onclick = async function(){ var d = JSON.parse(JSON.stringify(TL.groups)); d.groups.forEach(function(g){ g.members = g.members.map(MG.Groups.baseName); }); if(await MG.Groups.save(d)) MG.toast("已存成這個班的分組"); else MG.toast("存檔失敗"); };
    MG.$("#lv-close").onclick = closeRoom;
    MG.$("#lv-mode").onclick = changeMode;
    MG.$("#lv-start").onclick = startRound;
  }
  function updateLobbyCount(){ var n = MG.$("#lv-n"); if(n) n.textContent = names().length; var h = MG.$("#lv-hint"); if(h) h.textContent = names().length ? "" : "還沒有學生加入"; }
  async function startRound(){
    if(!names().length && !(await MG.confirm("還沒有學生加入，還是要開始嗎？", "開始"))) return;
    var c = TL.cfg, now = MG.fb.now(), startAt = now + 4500, endAt;
    if(c.game === "match") endAt = c.match.mode === "timed" ? startAt + c.match.seconds * 1000 : startAt + CAP_MS;
    else endAt = c.blast.seconds ? startAt + c.blast.seconds * 1000 : startAt + CAP_MS;
    var pg = {}, gn = {};
    if(TL.groupsOn){ TL.groups.groups.forEach(function(g){ gn[g.id] = g.name; g.members.forEach(function(m){ var u = uidOf(m); if(u) pg[u] = g.id; }); }); }
    var st = { phase: "play", round: TL.state.round || 1, startAt: startAt, endAt: endAt, timed: c.game === "match" ? c.match.mode === "timed" : !!c.blast.seconds, groupsOn: TL.groupsOn && Object.keys(gn).length > 0, pg: pg, gn: gn };
    TL.state = st;
    try{ await MG.fb.update(TL.base, { state: st, final: null, board: null }); }catch(e){ MG.toast("開始失敗，請檢查網路"); return; }
    playView();
  }
  var pushBoard = throttle(function(b){ if(!TL) return; MG.fb.set(TL.base + "/board", b).catch(function(){}); }, 2500);
  function onScores(){
    if(!TL || TL.state.phase !== "play") return;
    var B = computeBoards(TL.players, TL.scores, TL.state, TL.cfg.scoring);
    renderBoards(B);
    var rk = {}; B.ind.forEach(function(x, i){ rk[x.uid] = i + 1; });
    var compact = { ind: B.ind.slice(0, 5).map(function(x){ return [x.name, x.s]; }), grp: B.grp.map(function(g){ return [g.name, g.s]; }), rk: rk, n: B.ind.length, at: Date.now() };
    var js = JSON.stringify([compact.ind, compact.grp, compact.rk]);
    if(js !== TL.lastBoard){ TL.lastBoard = js; pushBoard(compact); }
    // 全部的人都做完（比速度配完、Blast 命用完）就自動結束
    if(B.ind.length && !TL.state.timed && B.ind.every(function(x){ return x.done; })) endRound();
  }
  function renderBoards(B){
    var bi = MG.$("#lv-bi"), bg = MG.$("#lv-bg"), c = TL.cfg; if(!bi) return;
    var total = c.words.length;
    bi.innerHTML = boardHtml(B.ind, { bars: true, empty: "還沒有人", sub: function(r){ var gname = TL.state.gn && TL.state.gn[r.g]; return (gname ? gname + "・" : "") + (c.game === "match" && c.match.mode !== "timed" ? Math.min(r.c, total) + "/" + total + (r.done ? " 完成 " + MG.fmtSec(r.time) : "") : "對 " + r.c + "・錯 " + r.w + (r.done ? "・結束" : "")); } });
    if(bg) bg.innerHTML = boardHtml(B.grp, { bars: true, sub: function(g){ return g.valid + " 人計分"; } });
    var dn = MG.$("#lv-done"); if(dn) dn.textContent = B.ind.filter(function(x){ return x.done; }).length + " / " + B.ind.length + " 人完成";
  }
  function playView(){
    var st = TL.state;
    app.innerHTML = '<div class="mg-wrap"><div class="mg-head"><h2>' + MG.esc(TL.cfg.title) + '</h2><span class="note">房間 ' + TL.code + '・第 ' + st.round + ' 局</span><span class="grow"></span><span class="lv-timer" id="lv-tm">0:00</span><span class="note" id="lv-done"></span>' + MG.musicBtn((TL.cfg[TL.cfg.game] || {}).music) + '<button class="mg-btn danger" id="lv-end">結束遊戲</button></div>' +
      '<div class="lv-boards"' + (st.groupsOn ? '' : ' style="grid-template-columns:1fr"') + '><div class="lb"><h3>個人排行</h3><div id="lv-bi"></div></div>' + (st.groupsOn ? '<div class="lb"><h3>組別排行 <span class="note">（' + (TL.cfg.scoring === "sum" ? "總分" : "平均") + '）</span></h3><div id="lv-bg"></div></div>' : '') + '</div></div>';
    MG.bindMusicBtn(app, (TL.cfg[TL.cfg.game] || {}).music);
    MG.$("#lv-end").onclick = async function(){ if(await MG.confirm("現在結束這一局？", "結束")) endRound(); };
    clearInterval(TL.tmr);
    TL.tmr = setInterval(function(){
      var n = MG.fb.now(), el = MG.$("#lv-tm"); if(!el){ clearInterval(TL.tmr); return; }
      if(n < st.startAt){ el.textContent = "準備 " + Math.ceil((st.startAt - n) / 1000); return; }
      var mus = (TL.cfg[TL.cfg.game] || {}).music;
      if(mus && !TL.musicOn){ TL.musicOn = true; MG.music.play(mus); }
      if(st.timed) MG.music.fast(st.endAt - n < 10000);
      el.textContent = st.timed ? MG.fmtTime(st.endAt - n + 999) : MG.fmtTime(n - st.startAt);
      if(n >= st.endAt + 1500) endRound();
    }, 250);
    onScores();
  }
  async function endRound(){
    if(!TL || TL.state.phase !== "play") return;
    clearInterval(TL.tmr); MG.music.stop(); TL.musicOn = false;
    TL.state = Object.assign({}, TL.state, { phase: "end" });
    // 等最後一筆分數寫進來
    await new Promise(function(r){ setTimeout(r, 1600); });
    var B = computeBoards(TL.players, TL.scores, TL.state, TL.cfg.scoring);
    var fin = { ind: B.ind.map(function(x){ return { uid: x.uid, name: x.name, g: x.g, s: x.s, c: x.c, w: x.w, rt: x.rt, n: x.n, time: x.time, done: x.done }; }), grp: B.grp, at: Date.now() };
    try{ await MG.fb.update(TL.base, { final: fin, "state/phase": "end" }); }catch(e){}
    MG.fb.set("teacherPlatform/" + TL.t + "/liveResults/" + TL.code + "_" + TL.state.round, { title: TL.cfg.title, game: TL.cfg.game, cls: TL.cfg.cls, at: Date.now(), ind: fin.ind.map(function(x){ var o = Object.assign({}, x); delete o.uid; return o; }), grp: fin.grp, scoring: TL.cfg.scoring }).catch(function(){});
    MG.beep("end"); finalView(fin);
  }
  function finalView(fin){
    TL.lastFinal = fin;
    var st = TL.state, gn = st.gn || {}, c = TL.cfg;
    app.innerHTML = '<div class="mg-wrap"><div class="mg-head"><h2>最後排行</h2><span class="note">房間 ' + TL.code + '・第 ' + st.round + ' 局</span><span class="grow"></span><button class="mg-btn" id="lv-csv">匯出 CSV</button><button class="mg-btn primary" id="lv-again">再玩一局</button><button class="mg-btn" id="lv-mode">換遊戲／改設定</button><button class="mg-btn" id="lv-close">關閉房間</button></div>' +
      '<div class="lv-boards"' + (st.groupsOn ? '' : ' style="grid-template-columns:1fr"') + '><div class="lb"><h3>個人</h3>' + boardHtml(fin.ind, { bars: true, sub: function(r){ return (gn[r.g] ? gn[r.g] + "・" : "") + "對 " + r.c + "・錯 " + r.w + "・正確率 " + Math.round(MG.acc(r) * 100) + "%" + (c.game === "match" && c.match.mode !== "timed" && r.done ? "・" + MG.fmtSec(r.time) : ""); } }) + '</div>' +
      (st.groupsOn ? '<div class="lb"><h3>組別 <span class="note">（' + (c.scoring === "sum" ? "總分" : "平均") + '，同分比正確率、再比反應時間）</span></h3>' + boardHtml(fin.grp, { bars: true, sub: function(g){ return g.valid + " 人計分・正確率 " + Math.round(g.c * 100) + "%"; } }) + '</div>' : '') + '</div></div>';
    MG.$("#lv-csv").onclick = function(){
      var rows = [["名次", "名字", "組別", "分數", "答對", "答錯", "正確率", "平均反應(秒)", "時間(秒)", "完成"]];
      fin.ind.forEach(function(r, i){ rows.push([i + 1, r.name, gn[r.g] || "", r.s, r.c, r.w, Math.round(MG.acc(r) * 100) + "%", MG.avgRt(r) ? (MG.avgRt(r) / 1000).toFixed(2) : "", ((r.time || 0) / 1000).toFixed(1), r.done ? "是" : ""]); });
      if(st.groupsOn){ rows.push([]); rows.push(["組別名次", "組名", "計分人數", "組別分數（" + (c.scoring === "sum" ? "總分" : "平均") + "）", "平均正確率", "平均反應(秒)"]); fin.grp.forEach(function(g, i){ rows.push([i + 1, g.name, g.valid, g.s, Math.round(g.c * 100) + "%", g.art ? (g.art / 1000).toFixed(2) : ""]); }); }
      MG.csv(rows, "生詞遊戲_" + TL.code + "_第" + st.round + "局.csv");
    };
    MG.$("#lv-again").onclick = async function(){
      var r = (st.round || 1) + 1; TL.state = { phase: "lobby", round: r };
      var seed = MG.newSeed();
      try{ await MG.fb.update(TL.base, { state: TL.state, scores: null, final: null, board: null, "cfg/seed": seed }); }catch(e){}
      TL.cfg.seed = seed; TL.scores = {}; lobby();
    };
    MG.$("#lv-close").onclick = closeRoom;
    MG.$("#lv-mode").onclick = changeMode;
  }
  async function closeRoom(){
    if(!(await MG.confirm("關閉房間？學生的畫面會顯示遊戲結束。", "關閉"))) return;
    TL.unsub.forEach(function(u){ try{ u(); }catch(e){} }); clearInterval(TL.tmr); MG.music.stop();
    await MG.fb.remove(TL.base).catch(function(){});
    MG.fb.remove("teacherPlatform/" + TL.t + "/liveGameList/" + TL.code).catch(function(){});
    try{ window.parent.postMessage({ mmGame: "room", code: null }, "*"); }catch(e){}
    TL = null; MG.viewSetup();
  }

  // 老師不小心重新整理：設定頁上方會出現「回到房間」
  async function banner(el){
    var G = MG.G, t = G.ctx && G.ctx.t; if(!el || !t || TL) return;
    var lst = await MG.fb.get("teacherPlatform/" + t + "/liveGameList").catch(function(){ return null; }) || {}, now = Date.now(), out = [];
    await Promise.all(Object.keys(lst).map(async function(code){
      var e = lst[code] || {}; if(!e.base || now - (e.at || 0) > EXP_MS) return;
      var st = await MG.fb.get(e.base + "/state").catch(function(){ return null; }); if(!st) return;
      var ps = await MG.fb.get(e.base + "/players").catch(function(){ return null; }) || {};
      out.push({ code: code, base: e.base, st: st, n: Object.keys(ps).length, at: e.at });
    }));
    out.sort(function(a, b){ return b.at - a.at; });
    el.innerHTML = out.map(function(r){ return '<div class="mg-panel" style="background:var(--seal-soft);border-color:var(--seal);"><div class="mg-row"><b>還開著的遊戲房間 ' + r.code + '</b><span class="note">' + r.n + ' 人・' + ({ lobby: "等待室", play: "遊戲中", end: "已結束" }[r.st.phase] || "") + '・第 ' + (r.st.round || 1) + ' 局</span><span class="grow" style="flex:1"></span><button class="mg-btn sm primary" data-resume="' + r.code + '">回到房間</button><button class="mg-btn sm" data-shut="' + r.code + '">關閉房間</button></div></div>'; }).join("");
    el.onclick = async function(e){
      var b = e.target.closest("[data-resume],[data-shut]"); if(!b) return; e.stopPropagation();
      var r = out.filter(function(x){ return x.code === (b.dataset.resume || b.dataset.shut); })[0]; if(!r) return;
      if(b.dataset.shut){ if(!(await MG.confirm("關閉房間 " + r.code + "？", "關閉"))) return; await MG.fb.remove(r.base).catch(function(){}); await MG.fb.remove("teacherPlatform/" + t + "/liveGameList/" + r.code).catch(function(){}); banner(el); return; }
      resume(r.code, r.base);
    };
  }
  async function resume(code, base){
    var G = MG.G, cfg = await MG.fb.get(base + "/cfg").catch(function(){ return null; }), st = await MG.fb.get(base + "/state").catch(function(){ return null; });
    if(!cfg || !st){ MG.toast("房間已經不在了"); return; }
    var grp = await MG.fb.get(base + "/grp").catch(function(){ return null; });
    var groups = grp && grp.groups ? MG.Groups.norm({ groups: grp.groups }) : (await MG.Groups.load()) || MG.Groups.blank(0);
    TL = { code: code, base: base, cfg: cfg, state: st, players: {}, scores: {}, groups: groups, groupsOn: grp ? !!grp.on : !!st.groupsOn, unsub: [], t: G.ctx.t };
    try{ window.parent.postMessage({ mmGame: "room", code: code, url: joinUrl(code) }, "*"); }catch(e){}
    var first = true;
    TL.unsub.push(MG.fb.on(base + "/players", function(v){ TL.players = v || {}; onPlayers(); }));
    TL.unsub.push(MG.fb.on(base + "/scores", function(v){ TL.scores = v || {}; onScores(); }));
    if(st.phase === "lobby") lobby();
    else if(st.phase === "play") playView();
    else { var fin = await MG.fb.get(base + "/final").catch(function(){ return null; }); if(fin) finalView(fin); else lobby(); }
  }

  // =====================================================================
  // 學生
  // =====================================================================
  var SL = null;
  function joinForm(code, msg){
    var name = ""; try{ name = localStorage.getItem("mm_game_name") || ""; }catch(e){}
    if(MG.qs.get("name")) name = MG.qs.get("name");
    app.innerHTML = '<div class="solo-card"><div class="brand-line"><img src="../icons/logo.svg" alt="">曼米中文</div><h2>加入遊戲<span class="en">Join the game</span></h2>' +
      '<label>房間代碼 Room code</label><input class="mg-in" id="cd" inputmode="numeric" maxlength="6" value="' + MG.esc(code || "") + '" placeholder="6 位數字 6 digits">' +
      '<label>你的名字 Your name</label><input class="mg-in" id="nm" maxlength="20" value="' + MG.esc(name) + '" placeholder="例如：小明">' +
      '<button class="mg-btn big primary" id="go">加入 Join</button><p class="note" id="st" style="text-align:center;margin-top:8px;color:#B23B32;">' + MG.esc(msg || "") + '</p></div>';
    var go = async function(){
      var cd = MG.$("#cd").value.replace(/\D/g, ""), nm = MG.$("#nm").value.trim().slice(0, 20);
      if(cd.length !== 6){ MG.$("#st").textContent = "請輸入 6 位數的房間代碼 Please enter the 6-digit room code"; return; }
      if(!nm){ MG.$("#st").textContent = "請填名字 Please enter your name"; MG.$("#nm").focus(); return; }
      MG.$("#go").disabled = true; MG.$("#st").textContent = "";
      var base = await findBase(cd);
      if(!base){ MG.$("#go").disabled = false; MG.$("#st").textContent = "找不到這個房間，請確認代碼 Room not found. Please check the code."; return; }
      try{ localStorage.setItem("mm_game_name", nm); }catch(e){}
      join(cd, base, nm);
    };
    MG.$("#go").onclick = go;
    MG.$("#nm").addEventListener("keydown", function(e){ if(e.key === "Enter") go(); });
    if(code && name && MG.qs.get("auto") === "1") go();
  }
  async function studentJoin(code){
    code = String(code || "").replace(/\D/g, "");
    if(code.length === 6){
      // 重新整理／斷線回來：這台裝置已經加入過，就直接回到原本的身分和分數
      var base = await findBase(code), uid = MG.fb.uid();
      if(base && uid){
        var me = await MG.fb.get(base + "/players/" + uid).catch(function(){ return null; });
        if(me && !me.kicked){ enter(code, base, me.name); return; }
        if(me && me.kicked){ app.innerHTML = '<div class="solo-card"><h2>你已經被移出房間<span class="en">You were removed from the room</span></h2><p class="note">如果是誤會，請跟老師說。 If this is a mistake, please tell your teacher.</p></div>'; return; }
      }
      if(!base){ joinForm(code, "找不到這個房間，可能已經關閉了 Room not found — it may be closed."); return; }
    }
    joinForm(code);
  }
  async function join(code, base, name){
    var uid = MG.fb.uid(), players = await MG.fb.get(base + "/players").catch(function(){ return null; }) || {};
    var taken = {}; Object.keys(players).forEach(function(k){ if(k !== uid && players[k] && !players[k].kicked) taken[players[k].name] = 1; });
    var final = name, n = 2; while(taken[final]){ final = name + " " + n; n++; }
    try{ await MG.fb.set(base + "/players/" + uid, { name: final, base: name, at: MG.fb.now() }); }
    catch(e){ joinForm(code, "加入失敗，請再試一次 Could not join. Please try again."); return; }
    if(final !== name) MG.toast("班上已經有「" + name + "」了，你的名字是「" + final + "」 Your name is " + final);
    enter(code, base, final);
  }
  function enter(code, base, name){
    var uid = MG.fb.uid();
    SL = { code: code, base: base, name: name, uid: uid, cfg: null, state: null, board: null, grp: null, players: {}, game: null, playedRound: 0, unsub: [], seen: false };
    SL.unsub.push(MG.fb.on(base + "/cfg", function(v){ SL.cfg = v; route(); }));
    SL.unsub.push(MG.fb.on(base + "/state", function(v){ if(v) SL.seen = true; SL.state = v; route(); }));
    SL.unsub.push(MG.fb.on(base + "/players", function(v){ SL.players = v || {}; var me = SL.players[uid]; if(SL.seen && (!me || me.kicked)){ kicked(!!(me && me.kicked)); return; } if(me && me.name !== SL.name) SL.name = me.name; if(SL.state && SL.state.phase === "lobby") waitView(); }));
    SL.unsub.push(MG.fb.on(base + "/board", function(v){ SL.board = v; strip(); }));
    SL.unsub.push(MG.fb.on(base + "/grp", function(v){ SL.grp = v; if(SL.state && SL.state.phase === "lobby") waitView(); }));
    SL.unsub.push(MG.fb.on(base + "/final", function(v){ SL.final = v; if(v && SL.state && SL.state.phase === "end") endView(); }));
  }
  function stopAll(){ if(!SL) return; SL.unsub.forEach(function(u){ try{ u(); }catch(e){} }); if(SL.game) SL.game.stop(); clearInterval(SL.cdT); }
  function kicked(isKick){ stopAll(); SL = null; app.innerHTML = '<div class="solo-card"><h2>' + (isKick ? "你已經被移出房間 You were removed from the room" : "遊戲結束了 The game is over") + '</h2><p class="note">' + (isKick ? "如果是誤會，請跟老師說。 If this is a mistake, please tell your teacher." : "老師已經關閉房間，謝謝你參加！ The teacher closed the room. Thanks for playing!") + '</p></div>'; }
  function route(){
    if(!SL) return;
    var st = SL.state;
    if(!st){ if(SL.seen){ kicked(false); } return; }
    if(!SL.cfg) return;
    if(st.phase === "lobby"){ if(SL.game){ SL.game.stop(); SL.game = null; } waitView(); }
    else if(st.phase === "play"){ if(SL.playedRound !== st.round) playStudent(); }
    else if(st.phase === "end"){ if(SL.game){ SL.game.finish(); } endView(); }
  }
  function myGroupName(){
    var g = SL.grp; if(!g || !g.on) return "";
    for(var i = 0; i < (g.groups || []).length; i++){ if((g.groups[i].members || []).indexOf(SL.name) >= 0) return g.groups[i].name; }
    return "還沒分組";
  }
  function waitView(){
    if(!SL || !SL.cfg) return;
    var ps = list(SL.players).filter(function(p){ return !p.kicked; }), gname = myGroupName(), c = SL.cfg;
    app.innerHTML = '<div class="lv-wait"><div class="brand-line" style="justify-content:center;"><img src="../icons/logo.svg" alt="">曼米中文・房間 ' + SL.code + '</div><div class="note">你好！ Hi!</div><div class="me">' + MG.esc(SL.name) + '</div>' + (gname ? '<div class="note" style="font-size:16px;">你在 Your team：<b>' + MG.esc(gname) + '</b></div>' : '') +
      '<div class="mg-panel" style="margin-top:14px;"><b>' + MG.esc(c.game === "match" ? "配對 Match" : "Blast") + '</b><div class="note">' + MG.esc(c.game === "match" ? (c.match.mode === "timed" ? "限時 " + c.match.seconds + " 秒，配越多越好" : "比速度，全部配完") + "・" + MG.ph(MG.MATCH_PAIRS[c.match.pair], c.phon) : (c.blast.input === "type" ? "看詞語，打拼音（數字標調）" : MG.ph(MG.BLAST_Q[c.blast.q], c.phon)) + (c.blast.lives ? "・" + c.blast.lives + " 條命" : "")) + '</div><p style="margin:10px 0 0;font-weight:700;color:var(--seal);">等老師開始… Waiting for the teacher to start…</p></div>' +
      '<div class="note">已經有 ' + ps.length + ' 人加入 · ' + ps.length + ' joined</div><div class="lv-pl">' + ps.map(function(p){ return '<span' + (p.uid === SL.uid ? ' class="me"' : '') + '>' + MG.esc(p.name) + '</span>'; }).join("") + '</div></div>';
    // 還沒點過畫面（例如上課中自動加入）：先點一下把聲音打開，遊戲開始時才有音樂和音效
    if(!MG.audioReady()){
      MG.audioCtx();   // 先試著開聲音：有些瀏覽器不用點就可以，就不必顯示按鈕
      setTimeout(function(){
        var w = MG.$(".lv-wait"); if(!w || MG.audioReady() || MG.$(".lv-snd", w)) return;
        var sb = document.createElement("button"); sb.className = "mg-btn big primary lv-snd"; sb.textContent = "點一下這裡打開聲音 Tap here to turn on sound";
        sb.onclick = function(){ MG.beep("ok"); sb.remove(); };
        w.appendChild(sb);
      }, 500);
    }
  }
  var writeScore = throttle(function(v){ if(SL) MG.fb.set(SL.base + "/scores/" + SL.uid, v).catch(function(){}); }, 1500);
  async function playStudent(){
    var st = SL.state, c = SL.cfg; SL.playedRound = st.round;
    if(SL.game){ SL.game.stop(); SL.game = null; }
    var prev = await MG.fb.get(SL.base + "/scores/" + SL.uid).catch(function(){ return null; });
    var init = prev && prev.r === st.round ? prev : null;
    if(init && init.done){ waitEnd(init); return; }
    var round = st.round;
    var go = function(){
      if(!SL || !SL.state || SL.state.round !== round || SL.state.phase !== "play") return;
      var now = MG.fb.now(), timed = st.timed;
      // 比速度：從開始（或晚到的人從加入）算時間
      var startAt = init && init.st ? init.st : Math.max(st.startAt, timed ? st.startAt : now);
      var seed = (Number(c.seed) || 1) + round * 7919;
      var noMus = c.studentMusic ? {} : { music: "" };
      SL.game = MG.playGame(app, c.game, c.words || [], { lang: c.lang, phon: c.phon, match: Object.assign({}, c.match, noMus), blast: Object.assign({}, c.blast, noMus), theme: (c[c.game] || {}).theme, seed: seed, title: c.game === "match" ? "配對 Match" : "Blast",
        now: MG.fb.now, startAt: startAt, endAt: st.endAt, init: init,
        onScore: function(sc){ writeScore(Object.assign({}, sc, { r: round, st: startAt, t: MG.fb.now() })); },
        onEnd: function(r){ var v = { s: r.s, c: r.c, w: r.w, rt: r.rt, n: r.n, time: Math.round(r.time), done: true, lives: r.lives === undefined ? null : r.lives, r: round, st: startAt, t: MG.fb.now() }; writeScore.flush(v); SL.game = null; waitEnd(r); } });
      strip(true);
    };
    var wait = st.startAt - MG.fb.now();
    if(wait > 300){
      var d = document.createElement("div"); d.className = "gm-count"; document.body.appendChild(d);
      clearInterval(SL.cdT);
      var tickF = function(){ var w = st.startAt - MG.fb.now(); if(w <= 0 || !SL || SL.state.round !== round){ clearInterval(SL && SL.cdT); d.remove(); if(w <= 0){ MG.beep("go"); go(); } return; } d.innerHTML = '<b>' + Math.ceil(w / 1000) + '</b><span>準備好了嗎？ Ready?</span>'; };
      tickF(); SL.cdT = setInterval(tickF, 200);
    } else go();
  }
  function waitEnd(r){
    if(!SL) return;
    app.innerHTML = '<div class="gm-res">' + MG.resultHtml(SL.cfg.game, Object.assign({ missed: [] }, r), "做完了！ Done!") + '<p class="note">等其他同學和老師結束這一局… Waiting for the others to finish…</p><div id="lv-mini"></div></div>';
    strip();
  }
  // 排行榜：遊戲畫面上方一條橫列（前 5 名、自己的名次、組別）
  function strip(create){
    if(!SL) return;
    var b = SL.board, el = MG.$(".lv-strip");
    if(create && !el && MG.$(".gm-hud")){ el = document.createElement("div"); el.className = "lv-strip"; MG.$(".gm-hud").insertAdjacentElement("afterend", el); }
    var mini = MG.$("#lv-mini");
    if(!b){ if(el) el.innerHTML = '<span class="ls-t">排行 Ranking</span><span class="note">遊戲開始後會出現 Shows when the game starts</span>'; return; }
    var my = b.rk && b.rk[SL.uid];
    var chip = function(name, s, rk, me){ return '<span class="ls-c r' + rk + (me ? " me" : "") + '"><b>' + rk + '</b><span class="nm">' + MG.esc(name) + '</span><i>' + s + '</i></span>'; };
    if(el) el.innerHTML = '<span class="ls-t">排行 Ranking</span>' + (b.ind || []).map(function(x, i){ return chip(x[0], x[1], i + 1, x[0] === SL.name); }).join("") +
      (my ? '<span class="ls-me">你：第 <b>' + my + '</b> 名／' + (b.n || 0) + ' 人 · You: #' + my + '</span>' : '') +
      ((b.grp || []).length ? '<span class="ls-g"><span class="ls-t">組別 Teams</span>' + b.grp.map(function(g, i){ return chip(g[0], g[1], i + 1, false); }).join("") + '</span>' : '');
    if(mini){
      var rows = (b.ind || []).map(function(x, i){ return { name: x[0], s: x[1], rank: i + 1, uid: x[0] === SL.name ? SL.uid : "" }; });
      mini.innerHTML = '<div class="lb" style="text-align:left;margin-top:10px;"><h3>目前排行<span class="en">Ranking</span></h3>' + boardHtml(rows, { me: SL.uid, limit: 5 }) + (my ? '<div class="note" style="margin-top:4px;">你是第 <b>' + my + '</b> 名（共 ' + (b.n || 0) + ' 人） You are #' + my + '</div>' : '') +
        ((b.grp || []).length ? '<div class="note" style="margin:6px 0 2px;font-weight:700;">組別 Teams</div>' + boardHtml(b.grp.map(function(g, i){ return { name: g[0], s: g[1], rank: i + 1 }; }), {}) : '') + '</div>';
    }
  }
  function endView(){
    if(!SL) return;
    var f = SL.final; if(!f){ app.innerHTML = '<div class="lv-wait"><h2>時間到！<span class="en">Time\'s up!</span></h2><p class="note">老師正在整理排行榜… The teacher is getting the results…</p></div>'; return; }
    var ind = f.ind || [], me = ind.filter(function(x){ return x.uid === SL.uid; })[0], rank = me ? ind.indexOf(me) + 1 : 0, gn = (SL.state && SL.state.gn) || {};
    app.innerHTML = '<div class="mg-wrap"><div class="gm-res" style="margin-top:10px;"><h2>' + (rank === 1 ? "第一名！太厲害了！ 1st place!" : rank && rank <= 3 ? "第 " + rank + " 名，好棒！ #" + rank + ", great job!" : "遊戲結束 Game over") + '</h2>' + (me ? '<div class="note">你的分數 Your score</div><div class="big">' + me.s + '</div><div class="note">第 ' + rank + ' 名（共 ' + ind.length + ' 人）・對 ' + me.c + '・錯 ' + me.w + '<br>#' + rank + ' of ' + ind.length + ' · ' + me.c + ' correct · ' + me.w + ' wrong</div>' : '') + '</div>' +
      '<div class="lv-boards"' + ((f.grp || []).length ? '' : ' style="grid-template-columns:1fr"') + '><div class="lb"><h3>個人排行<span class="en">Players</span></h3>' + boardHtml(ind, { me: SL.uid, bars: true, sub: function(r){ return gn[r.g] || ""; } }) + '</div>' + ((f.grp || []).length ? '<div class="lb"><h3>組別排行<span class="en">Teams</span></h3>' + boardHtml(f.grp, { bars: true }) + '</div>' : '') + '</div><p class="note" style="text-align:center;">老師可能會再開一局，請留在這個畫面。 Please stay on this page — there may be another round.</p></div>';
  }

  MG.Live = { teacherStart: teacherStart, studentJoin: studentJoin, computeBoards: computeBoards, banner: banner, current: current, applyToRoom: applyToRoom, backToRoom: backToRoom };
})();
