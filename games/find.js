/* 找東西 Find It（只有即時多人）：一個 3×3×3 的立體小櫃子，裡面放了很多東西，其中一樣是目標。
   老師（或老師請來操作的學生）的畫面看不到目標，只能照同學的指示用方向鍵／十字鍵移動游標；
   學生的裝置看得到目標，輪到的學生（籤筒抽籤）說出「上面／下面／左邊／右邊／前面／後面」，游標走到目標那一格就找到了。
   資料（房間 find/）只有開房間的老師能寫：
     find/t    { n, k, uid, name, g, gname, phase:"draw"|"say"|"found"|"over", pos:[x,y,z], steps, t0, ms, hint:{uid,name,dir,ok}, gi }
     find/res  { 第幾局或組別: { name, steps, ms } }
   學生只寫自己的 players/{uid}/act = { n, k:"say", v:方向編號, at }；老師的畫面收到後判斷這個指示對不對，
   學生看到結果是自己的，就把分數寫進自己的 scores/{uid}。 */
(function(){
  var MG = window.MG;
  var DIR = "find/";
  // 24 樣東西（第一冊第一～五課的生詞）：圖檔、中文、注音、拼音
  var OBJS = [
    ["cat", "貓咪", "ㄇㄠ ㄇㄧ", "māomī"], ["dog", "小狗", "ㄒㄧㄠˇ ㄍㄡˇ", "xiǎogǒu"], ["mouse", "老鼠", "ㄌㄠˇ ㄕㄨˇ", "lǎoshǔ"], ["pen", "筆", "ㄅㄧˇ", "bǐ"],
    ["eraser", "橡皮擦", "ㄒㄧㄤˋ ㄆㄧˊ ㄘㄚ", "xiàngpícā"], ["paper", "紙", "ㄓˇ", "zhǐ"], ["book", "書", "ㄕㄨ", "shū"], ["money", "錢", "ㄑㄧㄢˊ", "qián"],
    ["bread", "麵包", "ㄇㄧㄢˋ ㄅㄠ", "miànbāo"], ["egg", "蛋", "ㄉㄢˋ", "dàn"], ["burger", "漢堡", "ㄏㄢˋ ㄅㄠˇ", "hànbǎo"], ["sandwich", "三明治", "ㄙㄢ ㄇㄧㄥˊ ㄓˋ", "sānmíngzhì"],
    ["riceball", "飯糰", "ㄈㄢˋ ㄊㄨㄢˊ", "fàntuán"], ["bun", "包子", "ㄅㄠ ˙ㄗ", "bāozi"], ["cookie", "餅乾", "ㄅㄧㄥˇ ㄍㄢ", "bǐnggān"], ["noodle", "泡麵", "ㄆㄠˋ ㄇㄧㄢˋ", "pàomiàn"],
    ["milk", "牛奶", "ㄋㄧㄡˊ ㄋㄞˇ", "niúnǎi"], ["juice", "果汁", "ㄍㄨㄛˇ ㄓ", "guǒzhī"], ["boba", "珍珠奶茶", "ㄓㄣ ㄓㄨ ㄋㄞˇ ㄔㄚˊ", "zhēnzhūnǎichá"], ["coffee", "咖啡", "ㄎㄚ ㄈㄟ", "kāfēi"],
    ["apple", "蘋果", "ㄆㄧㄥˊ ㄍㄨㄛˇ", "píngguǒ"], ["banana", "香蕉", "ㄒㄧㄤ ㄐㄧㄠ", "xiāngjiāo"], ["watermelon", "西瓜", "ㄒㄧ ㄍㄨㄚ", "xīguā"], ["strawberry", "草莓", "ㄘㄠˇ ㄇㄟˊ", "cǎoméi"]
  ];
  // 六個方向詞。dx：左右，dy：上下，dz：前後（前面＝靠近自己的那一層）
  var DIRS = [
    { k: "up", w: "上面", zy: "ㄕㄤˋ ㄇㄧㄢˋ", py: "shàngmiàn", dx: 0, dy: -1, dz: 0, a: "⬆" },
    { k: "down", w: "下面", zy: "ㄒㄧㄚˋ ㄇㄧㄢˋ", py: "xiàmiàn", dx: 0, dy: 1, dz: 0, a: "⬇" },
    { k: "left", w: "左邊", zy: "ㄗㄨㄛˇ ㄅㄧㄢ", py: "zuǒbiān", dx: -1, dy: 0, dz: 0, a: "⬅" },
    { k: "right", w: "右邊", zy: "ㄧㄡˋ ㄅㄧㄢ", py: "yòubiān", dx: 1, dy: 0, dz: 0, a: "➡" },
    { k: "front", w: "前面", zy: "ㄑㄧㄢˊ ㄇㄧㄢˋ", py: "qiánmiàn", dx: 0, dy: 0, dz: -1, a: "⤒" },
    { k: "back", w: "後面", zy: "ㄏㄡˋ ㄇㄧㄢˋ", py: "hòumiàn", dx: 0, dy: 0, dz: 1, a: "⤓" }
  ];
  var LAYERS = ["前面", "中間", "後面"];
  var CURSORS = { lens: "放大鏡", hand: "手指", robot: "小機器人" };
  var SHOWS = [["zh", "中文"], ["zhpy", "中文＋拼​音"], ["zhzy", "中文＋注音"], ["all", "中文＋注音＋拼​音"]];
  var KEYS = { ArrowUp: 0, ArrowDown: 1, ArrowLeft: 2, ArrowRight: 3, f: 4, F: 4, b: 5, B: 5, PageUp: 4, PageDown: 5 };

  function seedOf(c, round, k){ return (Number(c.seed) || 1) + round * 7919 + (k || 0) * 104729; }
  // 這一局的櫃子：24 樣東西放進 27 格，目標是其中一樣；起點和目標至少隔 3 步。全班（含老師）用同一個種子，排出來的都一樣
  function layout(c, round, k){
    var f = c.find || {}, rnd = MG.rng(seedOf(c, round, k)), cells = new Array(27), spots = MG.shuffle(Array.apply(null, { length: 27 }).map(function(_, i){ return i; }), rnd), ord = MG.shuffle(OBJS.map(function(_, i){ return i; }), rnd), i;
    for(i = 0; i < 27; i++) cells[i] = -1;
    for(i = 0; i < 24; i++) cells[spots[i]] = ord[i];
    var objCells = spots.slice(0, 24), tc = objCells[Math.floor(rnd() * objCells.length)], P = function(ix){ return [ix % 3, Math.floor(ix / 3) % 3, Math.floor(ix / 9)]; }, tg = P(tc), st, g = 0;
    do { st = P(Math.floor(rnd() * 27)); g++; } while(g < 80 && Math.abs(st[0] - tg[0]) + Math.abs(st[1] - tg[1]) + Math.abs(st[2] - tg[2]) < 3);
    return { cells: cells, tgt: tg, obj: cells[tc], start: st };
  }
  function dist(a, b){ return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]); }
  function step(pos, d){ var D = DIRS[d]; return [pos[0] + D.dx, pos[1] + D.dy, pos[2] + D.dz]; }
  function inside(p){ return p[0] >= 0 && p[0] < 3 && p[1] >= 0 && p[1] < 3 && p[2] >= 0 && p[2] < 3; }
  // 中文、拼音、注音三種顯示（拼音在上、注音在下）
  function lab(zh, zy, py, show){
    show = show || "zhzy";
    return '<span class="fd-lab">' + (show === "zhpy" || show === "all" ? '<i class="fd-py">' + MG.esc(py) + '</i>' : '') + '<b>' + MG.esc(zh) + '</b>' + (show === "zhzy" || show === "all" ? '<i class="fd-zy">' + MG.esc(zy) + '</i>' : '') + '</span>';
  }
  function dirLab(d, show){ var D = DIRS[d]; return lab(D.w, D.zy, D.py, show); }
  function objLab(o, show){ var O = OBJS[o]; return lab(O[1], O[2], O[3], show); }
  function cursorImg(f){ return "find/c-" + (CURSORS[f.cursor] ? f.cursor : "lens") + ".png"; }
  function fmtMs(ms){ return (Math.max(0, ms || 0) / 1000).toFixed(1) + " 秒"; }
  function list(o){ return Object.keys(o || {}).map(function(k){ return Object.assign({ uid: k }, o[k]); }); }

  // 三層並排的櫃子。showTgt：學生的畫面會標出目標；老師的畫面不標
  function cabHtml(lay, pos, f, showTgt){
    var out = '<div class="fd-cab">';
    for(var z = 0; z < 3; z++){
      var here = pos && pos[2] === z;
      out += '<div class="fd-layer' + (here ? " here" : "") + '"><div class="fd-ltitle">' + LAYERS[z] + (here ? ' <small>← 游標在這一層</small>' : '') + '</div><div class="fd-grid">';
      for(var y = 0; y < 3; y++) for(var x = 0; x < 3; x++){
        var o = lay.cells[z * 9 + y * 3 + x], isT = showTgt && lay.tgt[0] === x && lay.tgt[1] === y && lay.tgt[2] === z, isC = pos && pos[0] === x && pos[1] === y && here;
        out += '<div class="fd-cell' + (isT ? " tgt" : "") + (isC ? " cur" : "") + '">' + (o >= 0 ? '<img class="fd-o" src="find/o-' + OBJS[o][0] + '.png" alt="" draggable="false">' : '') + (isC ? '<img class="fd-c" src="' + cursorImg(f) + '" alt="" draggable="false">' : '') + (isT ? '<span class="fd-here">在這裡</span>' : '') + '</div>';
      }
      out += '</div></div>';
    }
    return out + '</div>';
  }
  function resRows(res, mode){
    var rows = list(res).filter(function(r){ return r.name; });
    if(!rows.length) return '';
    var by = rows.slice().sort(function(a, b){ return a.steps - b.steps || a.ms - b.ms; }), bt = rows.slice().sort(function(a, b){ return a.ms - b.ms || a.steps - b.steps; });
    if(mode === "coop") return '<div class="fd-res"><b>這一輪的紀錄</b>' + rows.sort(function(a, b){ return (a.k || 0) - (b.k || 0); }).slice(-6).map(function(r){ return '<span>第 ' + (r.k + 1) + ' 局：' + r.steps + ' 步・' + fmtMs(r.ms) + '</span>'; }).join("") + '</div>';
    return '<div class="fd-res two"><div><b>步數最少</b>' + by.map(function(r, i){ return '<span class="r' + (i + 1) + '">' + (i + 1) + '. ' + MG.esc(r.name) + '：' + r.steps + ' 步</span>'; }).join("") + '</div><div><b>時間最短</b>' + bt.map(function(r, i){ return '<span class="r' + (i + 1) + '">' + (i + 1) + '. ' + MG.esc(r.name) + '：' + fmtMs(r.ms) + '</span>'; }).join("") + '</div></div>';
  }
  function foundHtml(T, res, mode, extra){
    return '<div class="fd-found"><img src="find/party.png" alt=""><div class="fd-fbox"><h2>找到了！ Found it!</h2><div class="fd-fnum">' + (T.gname ? MG.esc(T.gname) + '：' : '') + T.steps + ' 步・' + fmtMs(T.ms) + '</div>' + resRows(res, mode) + (extra || '') + '</div></div>';
  }

  // =====================================================================
  // 老師：投影畫面＝操控畫面（看不到目標）
  // =====================================================================
  function host(box, api){
    var c = api.cfg(), round = api.state().round || 1, f = c.find || {}, show = f.show || "zhzy", base = api.base, pts = Number(f.pts) || 10;
    var T = { n: 0, k: 0 }, res = {}, lay = null, queue = [], tmr = null, stopped = false, drawT = null, bump = 0, rolling = "";
    function groupsOn(){ return !!api.state().groupsOn; }
    function teams(){
      var st = api.state(), pl = list(api.players()).filter(function(p){ return !p.kicked; }), pg = st.pg || {}, gn = st.gn || {};
      return Object.keys(gn).filter(function(g){ return pl.some(function(p){ return pg[p.uid] === g; }); });
    }
    function members(g){
      var st = api.state(), pg = st.pg || {};
      return list(api.players()).filter(function(p){ return !p.kicked && (!g || pg[p.uid] === g); }).sort(function(a, b){ return (a.at || 0) - (b.at || 0); });
    }
    function write(){ MG.fb.update(base + "/find", { t: T, res: Object.keys(res).length ? res : null }).catch(function(){}); }
    function startGame(k, gi){
      clearTimeout(drawT); var tm = groupsOn() ? teams() : [], g = tm[gi || 0] || "", gn = (api.state().gn || {})[g] || "";
      lay = layout(c, round, k); queue = [];
      T = { n: (T.n || 0) + 1, k: k, gi: gi || 0, g: g, gname: gn, uid: "", name: "", phase: "draw", pos: lay.start.slice(), steps: 0, t0: MG.fb.now(), hint: null };
      write(); render(); draw();
    }
    // 籤筒抽籤：名字很快跳過，停在抽到的人；同一輪沒有抽過的先抽，大家都抽過才重新洗牌
    function draw(){
      clearTimeout(drawT);
      var pool = members(T.g); if(!pool.length){ T.uid = ""; T.name = ""; write(); render(); return; }
      queue = queue.filter(function(u){ return pool.some(function(p){ return p.uid === u; }); });
      if(!queue.length) queue = MG.shuffle(pool.map(function(p){ return p.uid; }));
      var uid = queue.shift(), p = pool.filter(function(x){ return x.uid === uid; })[0], i = 0, names = MG.shuffle(pool.map(function(x){ return x.name; }));
      T.phase = "draw"; T.hint = null; T.uid = ""; T.name = "";
      (function roll(){
        if(stopped) return;
        if(i < 9){ rolling = names[i % names.length]; i++; render(); MG.beep("pop"); drawT = setTimeout(roll, 70 + i * 22); return; }
        rolling = ""; T = Object.assign({}, T, { phase: "say", uid: p.uid, name: p.name, hint: null, at: MG.fb.now() });
        write(); render(); MG.beep("ok");
      })();
    }
    function nextGame(){
      if(groupsOn()){ var tm = teams(), gi = (T.gi || 0) + 1; if(gi >= tm.length){ T = Object.assign({}, T, { phase: "over" }); write(); render(); return; } startGame(T.k, gi); }
      else startGame((T.k || 0) + 1, 0);
    }
    function move(d){
      if(T.phase !== "say" && T.phase !== "draw") return;
      var np = step(T.pos, d); if(!inside(np)){ bump = Date.now(); MG.beep("bad"); render(); return; }
      clearTimeout(drawT); T.pos = np; T.steps++; MG.beep("pop");
      if(np[0] === lay.tgt[0] && np[1] === lay.tgt[1] && np[2] === lay.tgt[2]){
        var ms = MG.fb.now() - T.t0; T = Object.assign({}, T, { phase: "found", ms: ms, n: T.n + 1 });
        var key = groupsOn() ? (T.g || "g") : "k" + T.k;
        res[key] = { name: groupsOn() ? T.gname : "", steps: T.steps, ms: ms, k: T.k };
        write(); render(); MG.beep("end"); return;
      }
      T.n++; T.hint = null; write(); render(); draw();
    }
    // 學生按了方向詞：判斷這個指示是不是讓游標更靠近目標
    function check(){
      if(T.phase !== "say" || !T.uid || T.hint) return;
      var p = api.players()[T.uid], a = p && p.act; if(!a || a.k !== "say" || a.n !== T.n || !DIRS[a.v]) return;
      var np = step(T.pos, a.v), ok = inside(np) && dist(np, lay.tgt) < dist(T.pos, lay.tgt);
      T.hint = { uid: T.uid, name: T.name, dir: a.v, ok: ok ? 1 : 0 }; write(); render();
      if(f.tts !== false && f.tts !== "off"){ try{ MG.speak(DIRS[a.v].w, { voice: f.voice }); }catch(e){} }
    }
    function clock(){ return T.phase === "found" || T.phase === "over" ? T.ms || 0 : T.t0 ? Math.max(0, MG.fb.now() - T.t0) : 0; }
    function pad(){
      return '<div class="fd-pad"><div class="fd-dp">' + [[null, 0, null], [2, null, 3], [null, 1, null]].map(function(r){ return r.map(function(d){ return d === null ? '<span class="fd-dp0"></span>' : '<button type="button" class="fd-b" data-d="' + d + '"><em>' + DIRS[d].a + '</em>' + dirLab(d, show) + '</button>'; }).join(""); }).join("") + '</div>' +
        '<div class="fd-zp">' + [4, 5].map(function(d){ return '<button type="button" class="fd-b z" data-d="' + d + '"><em>' + DIRS[d].a + '</em>' + dirLab(d, show) + '</button>'; }).join("") + '</div></div>';
    }
    function render(){
      if(!box.isConnected || !lay) return;
      var who = T.name ? MG.esc(T.name) + (T.gname ? '<small>（' + MG.esc(T.gname) + '）</small>' : '') : "", head, tm = groupsOn() ? teams() : [], mode = groupsOn() ? "grp" : "coop";
      if(T.phase === "over") head = '<div class="fd-turn"><b>每一組都玩完了！ All teams done!</b><button class="mg-btn primary" data-a="end">結束，看總排行</button></div>';
      else if(T.phase === "found") head = '<div class="fd-turn"><b>找到了！</b></div>';
      else if(T.phase === "draw") head = '<div class="fd-turn"><span>籤筒抽籤中…</span><b class="fd-roll">' + MG.esc(rolling) + '</b>' + (members(T.g).length ? '' : '<span class="note">等學生加入… Waiting for players…</span>') + '</div>';
      else head = '<div class="fd-turn"><span>輪到</span><b>' + who + '</b><span>說怎麼走</span><button class="mg-btn sm" data-a="skip">換人 Skip</button></div>';
      var hint = T.hint ? '<div class="fd-hint ' + (T.hint.ok ? "ok" : "bad") + '">' + MG.esc(T.hint.name) + '：' + dirLab(T.hint.dir, show) + '</div>' : (T.phase === "say" ? '<div class="fd-hint wait">等同學說…（也可以直接聽同學口頭說）</div>' : '');
      var info = '<div class="fd-info"><span>' + (T.gname ? MG.esc(T.gname) + '・' : '') + '步數 <b>' + T.steps + '</b></span><span>時間 <b id="fd-clk">' + MG.fmtTime(clock()) + '</b></span><span class="note">' + (mode === "grp" ? "第 " + ((T.gi || 0) + 1) + " / " + tm.length + " 組" : "第 " + ((T.k || 0) + 1) + " 局") + '</span></div>';
      var foot = T.phase === "found" ? '<div class="fd-next">' + (mode === "grp" ? '<button class="mg-btn big primary" data-a="next">' + ((T.gi || 0) + 1 < tm.length ? "下一組" : "看全部排行") + '</button>' : '<button class="mg-btn big primary" data-a="next">下一局（換新的東西）</button>') + '</div>' : '';
      box.innerHTML = '<div class="fd-host' + (Date.now() - bump < 500 ? " bump" : "") + '"><div class="fd-wall"></div>' + head + info + hint + '<div class="fd-q">要找的東西：<b>？？？</b> <span class="note">（你看不到，請同學告訴你怎麼走）</span></div>' + cabHtml(lay, T.pos, f, false) + (T.phase === "say" || T.phase === "draw" ? pad() + '<div class="note fd-keys">鍵盤：← ↑ ↓ → 移動，F 前面，B 後面；撞到牆不算步數</div>' : '') + (T.phase === "found" || T.phase === "over" ? foundHtml(T, res, mode, foot) : '') + '</div>';
    }
    box.onclick = function(e){
      var b = e.target.closest("[data-d]"); if(b){ move(Number(b.dataset.d)); return; }
      var a = e.target.closest("[data-a]"); if(!a) return; var k = a.dataset.a;
      if(k === "skip" && T.phase === "say") draw(); else if(k === "next") nextGame(); else if(k === "end") api.endRound();
    };
    function onKey(e){
      if(!box.isConnected || e.repeat || e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || "")) return;
      if(KEYS[e.key] !== undefined){ e.preventDefault(); move(KEYS[e.key]); }
    }
    document.addEventListener("keydown", onKey);
    tmr = setInterval(function(){
      if(stopped) return; var el = document.getElementById("fd-clk"); if(el && (T.phase === "say" || T.phase === "draw")) el.textContent = MG.fmtTime(clock());
      if(!T.uid && T.phase === "draw" && !drawT && members(T.g).length) draw();
    }, 500);
    // 重新整理後回到房間：接著上次的進度
    MG.fb.get(base + "/find").then(function(sv){
      if(stopped) return;
      if(sv && sv.t && sv.t.pos){ T = sv.t; res = sv.res || {}; lay = layout(c, round, T.k); render(); if(T.phase === "draw" || (T.phase === "say" && !T.uid)) draw(); else check(); }
      else startGame(0, 0);
    }).catch(function(){ startGame(0, 0); });
    return { update: check, stop: function(){ stopped = true; clearInterval(tmr); clearTimeout(drawT); document.removeEventListener("keydown", onKey); } };
  }

  // =====================================================================
  // 學生：看得到目標，輪到時按方向詞
  // =====================================================================
  function student(root, api){
    var c = api.cfg, round = api.round, f = c.find || {}, show = f.show || "zhzy", base = api.base, uid = api.uid, pts = Number(f.pts) || 10, bonus = f.bonus == null ? 20 : Number(f.bonus);
    var S = { t: null, res: {}, sc: MG.newScore(api.init), la: (api.init && api.init.la) || 0, lk: (api.init && api.init.lk) || -1 }, stopped = false, unsub = [], lay = null, layK = -1, tmr = null, sent = -1;
    root.innerHTML = '<div class="gm"><div class="gm-hud"><span class="gm-title">' + MG.esc(MG.gameTitle("find")) + '</span><span class="grow"></span><div class="gm-stat score"><small>我的分數 Score</small><b id="fd-sc">0</b></div></div><div class="fd-stu" id="fd-body"></div></div>';
    var body = root.querySelector("#fd-body");
    function mine(){ return S.t && S.t.uid === uid && S.t.phase === "say"; }
    function render(){
      if(stopped || !body) return; var T = S.t;
      if(!T || !lay){ body.innerHTML = '<div class="fd-turn"><b>等老師開始… Waiting…</b></div>'; return; }
      var head, o = lay.obj;
      if(T.phase === "over") head = '<div class="fd-turn"><b>每一組都玩完了！</b></div>';
      else if(T.phase === "found") head = '<div class="fd-turn"><b>找到了！</b></div>';
      else if(T.phase === "draw") head = '<div class="fd-turn"><span>籤筒抽籤中…</span></div>';
      else if(mine()) head = '<div class="fd-turn me"><b>輪到你了！</b><span>請大聲說出怎麼走，也可以按下面的按鈕</span><span class="note">Your turn — say it aloud!</span></div>';
      else head = '<div class="fd-turn"><span>輪到</span><b>' + MG.esc(T.name || "…") + (T.gname ? '<small>（' + MG.esc(T.gname) + '）</small>' : '') + '</b><span>說怎麼走</span></div>';
      var tgt = '<div class="fd-tgt"><img src="find/o-' + OBJS[o][0] + '.png" alt="">' + objLab(o, show) + '<span class="note">要找的東西（只有你看得到，老師看不到）</span></div>';
      var hint = T.hint ? '<div class="fd-hint ' + (T.hint.ok ? "ok" : "bad") + '">' + MG.esc(T.hint.name) + '：' + dirLab(T.hint.dir, show) + (T.hint.ok ? ' ✓' : ' ✗') + '</div>' : '';
      var btns = '';
      if(T.phase === "say" && mine() && !T.hint) btns = '<div class="fd-say">' + DIRS.map(function(D, d){ return '<button type="button" class="fd-b" data-s="' + d + '"' + (sent === T.n ? " disabled" : "") + '><em>' + D.a + '</em>' + dirLab(d, show) + '</button>'; }).join("") + '</div>';
      var info = '<div class="fd-info"><span>' + (T.gname ? MG.esc(T.gname) + '・' : '') + '步數 <b>' + T.steps + '</b></span><span>時間 <b id="fd-clk">' + MG.fmtTime(T.phase === "found" || T.phase === "over" ? T.ms || 0 : Math.max(0, MG.fb.now() - (T.t0 || 0))) + '</b></span></div>';
      var mode = S.groupsOn ? "grp" : "coop";
      body.innerHTML = '<div class="fd-wall"></div>' + head + tgt + info + hint + btns + cabHtml(lay, T.pos, f, true) + (T.phase === "found" || T.phase === "over" ? foundHtml(T, S.res, mode, '') : '');
      var scEl = root.querySelector("#fd-sc"); if(scEl) scEl.textContent = S.sc.s;
    }
    function apply(T){
      if(!T) return;
      // 我的指示被判斷了：對的加分
      if(T.hint && T.hint.uid === uid && S.la < T.n){
        S.la = T.n; S.sc.n++;
        if(T.hint.ok){ S.sc.c++; S.sc.s += pts; MG.beep("ok"); } else { S.sc.w++; MG.beep("bad"); }
        api.writeScore(Object.assign({}, S.sc, { la: S.la, lk: S.lk }));
      }
      // 找到了：全班（分組比賽時只有這一組）都加分
      if(T.phase === "found" && S.lk < T.k * 100 + (T.gi || 0)){
        S.lk = T.k * 100 + (T.gi || 0);
        if(!S.groupsOn || (api.group() && api.group() === T.g)){ S.sc.s += bonus; api.writeScore(Object.assign({}, S.sc, { la: S.la, lk: S.lk })); }
      }
    }
    unsub.push(MG.fb.on(base + "/find", function(v){
      v = v || {}; var T = v.t || null; S.groupsOn = !!(api.groupsOn && api.groupsOn()); S.t = T; S.res = v.res || {};
      if(T && T.pos && T.k !== layK){ layK = T.k; lay = layout(c, round, T.k); }
      if(T && T.phase === "say" && S.prevN !== T.n){ if(T.uid === uid) MG.beep("pop"); S.prevN = T.n; }
      apply(T); render();
    }));
    body.onclick = function(e){
      var b = e.target.closest("[data-s]"); if(!b || !mine() || b.disabled) return;
      var d = Number(b.dataset.s); sent = S.t.n; MG.beep("pop");
      if(f.tts !== false && f.tts !== "off"){ try{ MG.speak(DIRS[d].w, { voice: f.voice }); }catch(er){} }
      MG.fb.update(base + "/players/" + uid, { act: { n: S.t.n, k: "say", v: d, at: MG.fb.now() } }).catch(function(){});
      body.querySelectorAll("[data-s]").forEach(function(x){ x.disabled = true; x.classList.toggle("pickd", x === b); });
    };
    tmr = setInterval(function(){ var el = document.getElementById("fd-clk"); if(el && S.t && (S.t.phase === "say" || S.t.phase === "draw")) el.textContent = MG.fmtTime(Math.max(0, MG.fb.now() - (S.t.t0 || 0))); }, 500);
    return { stop: function(){ stopped = true; clearInterval(tmr); unsub.forEach(function(u){ try{ u(); }catch(e){} }); }, finish: function(){ this.stop(); } };
  }

  MG.Find = { host: host, student: student, layout: layout, OBJS: OBJS, DIRS: DIRS, SHOWS: SHOWS, CURSORS: CURSORS,
    summary: function(fc){ fc = fc || {}; var s = SHOWS.filter(function(x){ return x[0] === (fc.show || "zhzy"); })[0]; return "找東西 Find It・方向詞：" + (s ? s[1] : "中文＋注音") + "・游標：" + (CURSORS[fc.cursor] || "放大鏡"); } };
})();
