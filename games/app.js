/* 曼米中文 · 生詞遊戲：頁面流程
   老師（從平台的課堂活動打開）：設定 → 自己投影試玩／作業連結／即時多人遊戲
   學生：?t=老師&set=作業連結 → 自己練習；?code=房間代碼（或 ?join）→ 加入即時遊戲 */
(function(){
  var MG = window.MG, app = document.getElementById("app");
  var G = MG.G = { ctx: null, cfg: null, trStore: {}, pool: [] };
  var EMBED = MG.qs.get("embed") === "1";

  // ---------- 預設設定 ----------
  function defaults(game){
    return {
      game: game || "match", lessons: {}, sample: "fixed", cap: 30, lang: "en", phon: "zy",
      match: { mode: "speed", seconds: 60, pair: "p", batch: 6, theme: "plain", themeFree: true, music: "happy" },
      blast: { q: "w2p", input: "tap", lives: 3, speed: 3, seconds: 0, theme: "space", themeFree: true, music: "space", liveOut: "revive" },
      live: { scoring: "avg", seconds: 90, studentMusic: false }
    };
  }
  function merge(a, b){ Object.keys(b || {}).forEach(function(k){ if(b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && a[k] && typeof a[k] === "object") merge(a[k], b[k]); else if(b[k] !== undefined) a[k] = b[k]; }); return a; }
  function prefKey(){ return "mm_game_cfg_" + (G.ctx.t || "") + "_" + (G.ctx.cls ? G.ctx.cls.c : ""); }
  function saveCfg(){
    try{ localStorage.setItem(prefKey(), JSON.stringify(G.cfg)); }catch(e){}
    clearTimeout(saveCfg.t); saveCfg.t = setTimeout(function(){ if(G.ctx.t) MG.fb.set("teacherPlatform/" + G.ctx.t + "/gamePrefs/" + (G.ctx.cls ? G.ctx.cls.c : "_"), G.cfg).catch(function(){}); }, 1200);
  }

  // ---------- 出題範圍 ----------
  function lessonsSel(){ var L = G.cfg.lessons || {}; return G.ctx.lessons.map(function(l){ return Object.assign({}, l, { pct: Number(L[l.key]) || 0 }); }).filter(function(l){ return l.pct > 0; }); }
  function poolFor(seed){ return MG.applyTr(MG.buildPool(lessonsSel().map(cloneLesson), G.cfg.sample, seed || 1, G.cfg.cap), G.trStore); }
  function cloneLesson(l){ return Object.assign({}, l, { words: l.words.map(function(w){ return Object.assign({}, w, { tr: Object.assign({}, w.tr) }); }) }); }
  function presetFrom(key){
    var keys = G.ctx.lessons.map(function(l){ return l.key; }), i = keys.indexOf(key); if(i < 0) return;
    var steps = [100, 80, 60, 40, 20], L = {};
    for(var j = 0; j < steps.length && i - j >= 0; j++) L[keys[i - j]] = steps[j];
    G.cfg.lessons = L;
  }

  // ---------- 老師：設定頁 ----------
  function viewSetup(){
    var c = G.cfg, ctx = G.ctx, m = c.match, b = c.blast;
    var pctOpts = function(v){ var s = ""; for(var p = 0; p <= 100; p += 10) s += '<option value="' + p + '"' + (p === v ? " selected" : "") + '>' + (p ? p + "%" : "不用") + '</option>'; return s; };
    var selL = lessonsSel(), cnts = MG.poolCounts(selL, c.cap), cntOf = {}; selL.forEach(function(l, i){ cntOf[l.key] = cnts[i]; });
    var rows = ctx.lessons.map(function(l){
      var pct = Number(c.lessons[l.key]) || 0, n = l.words.length;
      return '<label class="sc-row' + (pct ? " on" : "") + '"><input type="checkbox" data-lk="' + MG.esc(l.key) + '"' + (pct ? " checked" : "") + '><span class="t" title="' + MG.esc(l.title) + '">' + MG.esc(l.title) + '</span><span class="n note">' + n + ' 個</span><select data-lp="' + MG.esc(l.key) + '">' + pctOpts(pct) + '</select><span class="note">抽 ' + (cntOf[l.key] || 0) + ' 個</span></label>';
    }).join("");
    var sum = MG.buildPool(selL, "fixed", 1, c.cap).length;
    var recent = ctx.recent && ctx.lessons.some(function(l){ return l.key === ctx.recent; }) ? ctx.recent : (ctx.lessons[ctx.lessons.length - 1] || {}).key;
    var recOpts = ctx.lessons.map(function(l){ return '<option value="' + MG.esc(l.key) + '"' + (l.key === recent ? " selected" : "") + '>' + MG.esc(l.title) + '</option>'; }).join("");
    var langOpts = MG.LANGS.map(function(l){ return '<option value="' + l.k + '"' + (l.k === c.lang ? " selected" : "") + '>' + MG.esc(l.n) + '</option>'; }).join("");
    var seg = function(name, val, list){ return '<div class="mg-seg" data-seg="' + name + '">' + list.map(function(x){ return '<button type="button" data-v="' + x[0] + '"' + (String(val) === String(x[0]) ? ' class="on"' : '') + '>' + MG.esc(x[1]) + '</button>'; }).join("") + '</div>'; };
    var gameOpts = c.game === "match" ?
      '<div class="mg-opt"><label>模式</label>' + seg("match.mode", m.mode, [["speed", "比速度：全部配完"], ["timed", "限時：時間內配越多越好"]]) +
      '<label>時間（限時模式）</label><span><input type="number" class="mg-num" min="15" max="600" step="5" data-num="match.seconds" value="' + m.seconds + '"> 秒</span>' +
      '<label>配對方式</label>' + seg("match.pair", m.pair, [["p", "詞語 ↔ 拼音"], ["t", "詞語 ↔ 翻譯"], ["pt", "詞語 ↔ 拼音＋翻譯"], ["i", "詞語 ↔ 圖片"]]) +
      '<label>一次幾組</label>' + seg("match.batch", m.batch, [[4, "4"], [5, "5"], [6, "6"], [8, "8"]]) + '</div>' :
      '<div class="mg-opt"><label>題目</label>' + seg("blast.q", b.q, [["w2p", "看詞語選拼音"], ["w2t", "看詞語選翻譯"], ["p2w", "看拼音選詞語"], ["t2w", "看翻譯選詞語"], ["w2i", "看詞語選圖片"], ["i2w", "看圖片選詞語"]]) +
      '<label>作答方式</label>' + seg("blast.input", c.phon === "zy" ? "tap" : b.input, [["tap", "點選"]].concat(c.phon === "zy" ? [] : [["type", "打拼音（數字標調）"]])) +
      '<label>生命</label><span><input type="number" class="mg-num" min="0" max="10" data-num="blast.lives" value="' + b.lives + '"> 條 <span class="note">（0＝不限，要搭配時間）</span></span>' +
      '<label>速度</label>' + seg("blast.speed", b.speed, [[1, "1 很慢"], [2, "2"], [3, "3"], [4, "4"], [5, "5 很快"]]) +
      '<label>時間</label>' + seg("blast.seconds", b.seconds, [[0, "不限（命用完就結束）"], [60, "60 秒"], [90, "90 秒"], [120, "2 分鐘"], [180, "3 分鐘"]]) +
      '<label>即時多人命用完</label><div>' + seg("blast.liveOut", b.liveOut || "revive", [["revive", "復活挑戰"], ["end", "直接結束"]]) + '<div class="note" style="margin-top:4px;">復活挑戰：命用完時，連續答對自己答錯的詞（3 題起，每復活一次多 1 題）就帶 1 條命回到遊戲，挑戰本身不加分。時間選「不限」時，即時遊戲會用 90 秒。學生自己練習時命用完就結束。</div></div>' +
      '</div>';

    gameOpts = MG.ph(gameOpts, c.phon);
    var gm = c.game === "match" ? m : b, thList = c.game === "match" ? MG.MATCH_THEMES : MG.THEME_ORDER;
    gameOpts += '<div class="mg-opt" style="margin-top:12px;"><label>主題（背景）</label><div><div class="th-list">' + thList.map(function(id){ return '<button type="button" class="th-card' + (gm.theme === id ? " on" : "") + '" data-theme="' + id + '">' + MG.themeSwatch(id) + '<b>' + MG.esc(MG.THEMES[id].name) + '</b></button>'; }).join("") + '</div>' +
      '<label style="display:flex;gap:6px;align-items:center;margin-top:8px;font-weight:400;"><input type="checkbox" data-chk="' + c.game + '.themeFree"' + (gm.themeFree !== false ? " checked" : "") + '> 學生自己練習時可以換主題</label><div class="note" style="margin-top:4px;">選主題時，背景音樂會換成搭配的曲子（下面還可以改）。</div></div></div>' +
      '<div class="mg-opt" style="margin-top:12px;"><label>背景音樂</label><div class="mg-row">' + seg(c.game + ".music", gm.music || "", [["", "關"]].concat(MG.MUSIC_ORDER.map(function(k){ return [k, MG.MUSIC[k].name]; }))) + (gm.music ? '<button type="button" class="mg-btn sm" data-preview="' + gm.music + '">試聽</button>' : '') + '</div>' +
      '<label></label><label style="display:flex;gap:6px;align-items:center;font-weight:400;"><input type="checkbox" data-chk="live.studentMusic"' + (c.live.studentMusic ? " checked" : "") + '> 即時多人時，學生的裝置也播放音樂（預設只有老師的畫面播放）</label></div>';
    app.innerHTML = '<div class="mg-wrap">' +
      '<div id="lv-resume"></div><div class="mg-head"><h2>生詞遊戲</h2><span class="note">' + MG.esc(ctx.cls ? ctx.cls.name : "沒有指定班級") + '</span><span class="grow"></span></div>' +
      '<div class="mg-panel"><div class="mg-games">' +
      '<button class="mg-game' + (c.game === "match" ? " on" : "") + '" data-game="match"><b>配對 Match</b><span class="note">詞語和拼音／翻譯配成一對，比速度或限時。</span></button>' +
      '<button class="mg-game' + (c.game === "blast" ? " on" : "") + '" data-game="blast"><b>Blast</b><span class="note">答案從畫面掉下來，點對的那個。可以選主題。</span></button></div></div>' +
      '<div class="mg-panel"><h3>出題範圍 <span class="note">勾選課次，設定每一課抽幾成的生詞</span></h3>' +
      '<div class="mg-row" style="margin-bottom:10px;"><span class="note">從最近一課往前：100%、80%、60%、40%、20%</span><select class="mg-sel" id="sc-rec" style="max-width:280px;">' + recOpts + '</select><button class="mg-btn sm" id="sc-preset">套用</button><button class="mg-btn sm ghost" id="sc-clear">全部不用</button></div>' +
      (rows ? '<div class="sc-list"><div class="sc-row head"><span></span><span>課次</span><span class="n">生詞</span><span>抽幾成</span><span></span></div>' + rows + '</div>' : '<p class="note">這個班的教材還沒有生詞。</p>') +
      '<div class="mg-row" style="margin-top:10px;"><span>抽題方式</span>' + seg("sample", c.sample, [["fixed", "固定（照課本順序取前面的）"], ["random", "隨機（每次不一樣）"]]) + '</div><div class="mg-row" style="margin-top:8px;"><span>一局最多</span>' + seg("cap", c.cap, [[10, "10 個"], [20, "20 個"], [30, "30 個"], [50, "50 個"], [0, "不限"]]) + '<span class="note">超過時每一課照比例一起減少</span><span class="grow" style="flex:1"></span><span class="sc-sum">共 ' + sum + ' 個生詞</span></div></div>' +
      '<div class="mg-panel"><h3>讀音 <span class="note">遊戲裡顯示注音還是拼音</span></h3>' + seg("phon", c.phon || "zy", [["zy", "注音"], ["py", "拼音"]]) + '</div>' +
      '<div class="mg-panel"><h3>翻譯語言 <span class="note">配對的翻譯、Blast 的意思都用這個語言</span></h3><div class="mg-row"><select class="mg-sel" id="lang">' + langOpts + '</select><button class="mg-btn sm" id="tr-edit">檢查／修改翻譯</button><span class="note" id="tr-miss"></span></div></div>' +
      '<div class="mg-panel"><h3>' + (c.game === "match" ? "配對設定" : "Blast 設定") + '</h3>' + gameOpts + '</div>' +
      '<div class="mg-panel"><h3>開始</h3><div class="mg-row">' +
      '<button class="mg-btn big primary" id="go-live">即時多人遊戲</button>' +
      '<button class="mg-btn big" id="go-solo">老師投影試玩</button>' +
      '<button class="mg-btn big" id="go-link">作業／自主練習連結</button>' +
      (ctx.cls ? '<button class="mg-btn big" id="go-groups">分組</button>' : '') +
      '</div><p class="note" style="margin-top:8px;">即時多人：學生用手機或電腦輸入房間代碼（或掃 QR code）加入，只要填名字。作業連結：學生自己練習，成績會記在這裡。</p>' +
      '<div class="mg-row" style="margin-top:6px;"><button class="mg-btn sm ghost" id="go-results">查看作業連結的成績</button></div></div>' +
      '</div>';
    bindSetup();
    updateMissing();
    var cur = MG.Live && MG.Live.current && MG.Live.current();
    if(cur){
      MG.$("#lv-resume").innerHTML = '<div class="mg-panel" style="background:var(--seal-soft);border-color:var(--seal);"><div class="mg-row"><b>房間 ' + cur.code + ' 還開著，' + cur.n + ' 位學生在等你</b><span class="note">改好遊戲或設定後按「套用到房間」，學生不用重新加入。</span><span class="grow" style="flex:1"></span><button class="mg-btn sm" id="lv-back">回到房間（不改）</button><button class="mg-btn sm primary" id="lv-apply">套用到房間</button></div></div>';
      var gl = MG.$("#go-live"); gl.textContent = "套用到房間 " + cur.code; gl.id = "go-apply";
      MG.$("#lv-back").onclick = function(e){ e.stopPropagation(); MG.Live.backToRoom(); };
      MG.$("#lv-apply").onclick = function(e){ e.stopPropagation(); if(checkPool()) MG.Live.applyToRoom(); };
    } else if(MG.Live && MG.Live.banner) MG.Live.banner(MG.$("#lv-resume"));
  }
  function setPath(path, v){ var p = path.split("."), o = G.cfg; while(p.length > 1) o = o[p.shift()]; o[p[0]] = v; }
  function bindSetup(){
    app.onclick = function(e){
      var t;
      if((t = e.target.closest("[data-game]"))){ G.cfg.game = t.dataset.game; saveCfg(); viewSetup(); return; }
      if((t = e.target.closest("[data-seg] button"))){ var seg = t.closest("[data-seg]").dataset.seg, v = t.dataset.v; setPath(seg, /^\d+$/.test(v) ? Number(v) : v); if(seg === "phon" && v === "zy") G.cfg.blast.input = "tap"; saveCfg(); viewSetup(); return; }
      if((t = e.target.closest("[data-theme]"))){ var gc = G.cfg[G.cfg.game], th = MG.THEMES[t.dataset.theme]; gc.theme = t.dataset.theme; if(gc.music && th && th.music) gc.music = th.music; saveCfg(); viewSetup(); return; }
      if(e.target.id === "sc-preset"){ presetFrom(MG.$("#sc-rec").value); saveCfg(); viewSetup(); return; }
      if(e.target.id === "sc-clear"){ G.cfg.lessons = {}; saveCfg(); viewSetup(); return; }
      if(e.target.id === "tr-edit"){ trEditor(); return; }
      if((t = e.target.closest("[data-preview]"))){ MG.music.preview(t.dataset.preview); return; }
      if(e.target.id === "go-solo"){ if(checkPool()) teacherSolo(); return; }
      if(e.target.id === "go-link"){ if(checkPool()) makeLink(); return; }
      if(e.target.id === "go-results"){ viewResults(); return; }
      if(e.target.id === "go-apply"){ if(checkPool()) MG.Live.applyToRoom(); return; }
      if(e.target.id === "go-live"){ if(checkPool()){ if(MG.Live) MG.Live.teacherStart(); else MG.toast("即時多人遊戲還沒準備好"); } return; }
      if(e.target.id === "go-groups"){ if(MG.Groups) MG.Groups.openEditor(); return; }
    };
    app.onchange = function(e){
      var t = e.target;
      if(t.dataset.lk){ var k = t.dataset.lk; if(t.checked) G.cfg.lessons[k] = G.cfg.lessons[k] || 100; else delete G.cfg.lessons[k]; saveCfg(); viewSetup(); return; }
      if(t.dataset.lp){ var p = Number(t.value); if(p) G.cfg.lessons[t.dataset.lp] = p; else delete G.cfg.lessons[t.dataset.lp]; saveCfg(); viewSetup(); return; }
      if(t.dataset.num){ var v = Math.round(Number(t.value)); if(isNaN(v)) return; v = MG.clamp(v, Number(t.min), Number(t.max)); t.value = v; setPath(t.dataset.num, v); saveCfg(); return; }
      if(t.dataset.chk){ setPath(t.dataset.chk, t.checked); saveCfg(); return; }
      if(t.id === "lang"){ G.cfg.lang = t.value; saveCfg(); updateMissing(); return; }
    };
  }
  function checkPool(){
    var pool = poolFor(1);
    if(!pool.length){ MG.toast("請先在「出題範圍」勾選課次"); return false; }
    var need = G.cfg.game === "match" ? 3 : 4;
    if(pool.length < need){ MG.toast("生詞太少了，至少要 " + need + " 個，請多勾幾課或提高比例"); return false; }
    var lang = G.cfg.lang, usesTr = G.cfg.game === "match" ? G.cfg.match.pair !== "p" : (G.cfg.blast.q === "w2t" || G.cfg.blast.q === "t2w") && G.cfg.blast.input !== "type";
    var usesPic = G.cfg.game === "match" ? G.cfg.match.pair === "i" : (G.cfg.blast.q === "w2i" || G.cfg.blast.q === "i2w") && G.cfg.blast.input !== "type";
    if(usesPic){
      var withPic = pool.filter(function(w){ return MG.picOf(w); }).length;
      if(withPic < need){ MG.toast("有圖片的詞語只有 " + withPic + " 個，至少要 " + need + " 個；請在表格裡補上 Emoji 或圖片"); trEditor(); return false; }
      if(withPic < pool.length) MG.toast("有 " + (pool.length - withPic) + " 個詞語沒有圖片，這一局先不出現");
      return true;
    }
    var miss = pool.filter(function(w){ return !MG.trOf(w, lang); }).length;
    if(usesTr && miss){ MG.toast("有 " + miss + " 個詞語還沒有" + MG.langShort(lang) + "翻譯，先幫你自動翻譯"); trEditor(); return false; }
    return true;
  }
  function updateMissing(){
    var pool = poolFor(1), lang = G.cfg.lang, miss = pool.filter(function(w){ return !MG.trOf(w, lang); }).length, el = MG.$("#tr-miss");
    if(el) el.textContent = pool.length ? (miss ? "有 " + miss + " 個詞語還沒有翻譯，按「檢查／修改翻譯」會自動翻譯" : "這些詞語都有" + MG.langShort(lang) + "翻譯了") : "";
  }

  // ---------- 翻譯／拼音修改表（自動翻譯缺的，存在老師帳號；同一個詞以後都用這個翻譯） ----------
  async function trEditor(){
    var lang = G.cfg.lang, pool = MG.buildPool(lessonsSel().map(cloneLesson), "fixed", 1, 0);
    MG.applyTr(pool, G.trStore);
    var d = MG.dialog('<h3>翻譯（' + MG.esc(MG.langName(lang)) + '）、拼音和圖片</h3><p class="note">空白的翻譯會自動翻譯。可以直接修改，改好按「儲存」，以後所有遊戲都用這個版本（不會改到教材）。拼音可以打數字標調，例如 ni3 hao3。圖片可以貼 Emoji、圖片網址，或按「上傳」用自己的圖。</p>' +
      '<div class="tr-wrap"><table class="tr-table"><thead><tr><th>詞語</th><th>拼音</th><th>' + MG.esc(MG.langShort(lang)) + '</th><th>圖片</th></tr></thead><tbody>' +
      pool.map(function(w, i){ var pic = MG.picOf(w); return '<tr><td class="zh">' + MG.esc(w.w) + '</td><td><input data-i="' + i + '" data-f="p" value="' + MG.esc(w.p) + '"></td><td><input data-i="' + i + '" data-f="t" value="' + MG.esc(MG.trOf(w, lang)) + '"' + (MG.trOf(w, lang) ? "" : ' class="miss" placeholder="翻譯中…"') + '></td>' +
        '<td><div class="tr-pic"><span class="pv">' + (pic ? MG.picHtml(pic) : '') + '</span><input data-i="' + i + '" data-f="i" value="' + MG.esc(pic) + '" placeholder="Emoji 或網址"><button type="button" class="mg-btn sm" data-up="' + i + '">上傳</button></div></td></tr>'; }).join("") +
      '</tbody></table></div><div class="mg-row end"><span class="note" id="tr-st" style="margin-right:auto;"></span><button class="mg-btn" data-close>取消</button><button class="mg-btn primary" id="tr-save">儲存</button></div>', { wide: true });
    var auto = {};
    d.addEventListener("change", function(e){ var t = e.target; if(t.dataset.f === "p") t.value = MG.pyNum(t.value); });
    d.addEventListener("input", function(e){ var t = e.target; if(t.dataset.f === "i"){ var v = t.value.trim(); t.parentNode.querySelector(".pv").innerHTML = v ? MG.picHtml(v) : ""; } });
    d.addEventListener("click", function(e){
      var b = e.target.closest("[data-up]"); if(!b) return;
      var fi = document.createElement("input"); fi.type = "file"; fi.accept = "image/*";
      fi.onchange = async function(){
        var f = fi.files && fi.files[0]; if(!f) return;
        b.disabled = true; b.textContent = "上傳中";
        try{
          var url = await MG.uploadImage(f, "teacherMedia/" + G.ctx.t + "/game-img-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6));
          var inp = d.querySelector('input[data-i="' + b.dataset.up + '"][data-f="i"]'); inp.value = url; inp.dispatchEvent(new Event("input", { bubbles: true }));
        }catch(er){ MG.toast("上傳失敗：" + (er && er.message || "")); }
        b.disabled = false; b.textContent = "上傳";
      };
      fi.click();
    });
    var st = MG.$("#tr-st", d), left = pool.filter(function(w){ return !MG.trOf(w, lang); }).length;
    if(left){
      st.textContent = "自動翻譯中…（" + left + " 個）";
      await MG.translateMissing(pool, lang, function(w, t){
        var i = pool.indexOf(w), inp = d.querySelector('input[data-i="' + i + '"][data-f="t"]');
        if(inp && !inp.value){ inp.value = t || ""; inp.placeholder = t ? "" : "翻不出來，請手動輸入"; if(t){ inp.classList.remove("miss"); auto[i] = t; } }
        left--; st.textContent = left > 0 ? "自動翻譯中…（還有 " + left + " 個）" : "自動翻譯完成，看一下有沒有要改的，再按儲存";
      });
    }
    MG.$("#tr-save", d).onclick = async function(){
      var up = {}, t = G.ctx.t;
      pool.forEach(function(w, i){
        var k = MG.wkey(w.w), pv = d.querySelector('input[data-i="' + i + '"][data-f="p"]').value.trim(), tv = d.querySelector('input[data-i="' + i + '"][data-f="t"]').value.trim();
        var orig = findWord(w.w);
        if(pv && orig && pv !== orig.p){ up["_py/" + k] = pv; } else if(orig && pv === orig.p && (G.trStore._py || {})[k]){ up["_py/" + k] = null; }
        var base = orig ? (orig.tr || {})[lang] || "" : "";
        if(tv && tv !== base) up[lang + "/" + k] = tv; else if(tv === base && (G.trStore[lang] || {})[k]) up[lang + "/" + k] = null;
        var iv = d.querySelector('input[data-i="' + i + '"][data-f="i"]').value.trim(), ib = orig ? orig.e || "" : "";
        if(iv !== ib) up["_img/" + k] = iv || "-"; else if((G.trStore._img || {})[k]) up["_img/" + k] = null;
      });
      Object.keys(up).forEach(function(p){ var a = p.split("/"); G.trStore[a[0]] = G.trStore[a[0]] || {}; if(up[p] == null) delete G.trStore[a[0]][a[1]]; else G.trStore[a[0]][a[1]] = up[p]; });
      if(Object.keys(up).length && t){ try{ await MG.fb.update("teacherPlatform/" + t + "/gameTr", up); }catch(e){ MG.toast("存檔失敗，請檢查網路"); return; } }
      d.close(); MG.toast("已儲存"); updateMissing();
    };
  }
  function findWord(w){ for(var i = 0; i < G.ctx.lessons.length; i++){ var x = G.ctx.lessons[i].words.filter(function(y){ return y.w === w; })[0]; if(x) return x; } return null; }

  // ---------- 開始一局（老師試玩、學生練習、即時遊戲都用這個） ----------
  MG.playGame = function(root, game, words, o){
    var opts = Object.assign({ words: words, lang: o.lang }, o);
    if(game === "match") return MG.Match.create(root, Object.assign(opts, o.match || {}, o.theme ? { theme: o.theme } : {}));
    return MG.Blast.create(root, Object.assign(opts, o.blast || {}, { theme: o.theme || (o.blast || {}).theme }));
  };
  MG.resultHtml = function(game, r, title){
    var acc = Math.round(MG.acc(r) * 100), avg = MG.avgRt(r);
    var stats = '<div><small>答對</small><b>' + r.c + '</b></div><div><small>答錯</small><b>' + r.w + '</b></div><div><small>正確率</small><b>' + acc + '%</b></div>' +
      (game === "match" ? '<div><small>' + (r.done ? "完成時間" : "時間") + '</small><b>' + MG.fmtSec(r.time) + '</b></div>' : '<div><small>平均反應</small><b>' + (avg ? (avg / 1000).toFixed(1) + " 秒" : "—") + '</b></div>');
    var miss = (r.missed || []).length ? '<div class="gm-miss"><div class="note">再複習一下：</div>' + r.missed.map(function(w){ return '<span>' + MG.esc(w.w) + '<i>' + MG.esc(w.p || "") + '</i></span>'; }).join("") + '</div>' : '';
    return '<h2>' + MG.esc(title || (r.done ? "全部配完了！" : "時間到！")) + '</h2><div class="note">分數</div><div class="big">' + r.s + '</div><div class="grid">' + stats + '</div>' + miss;
  };
  function gameOpts(cfg){ return { lang: cfg.lang, phon: cfg.phon, match: cfg.match, blast: cfg.blast }; }

  function teacherSolo(){
    var seed = MG.newSeed(), words = poolFor(seed), cfg = G.cfg;
    var run = function(){
      var g = MG.playGame(app, cfg.game, words, Object.assign(gameOpts(cfg), { seed: seed, title: cfg.game === "match" ? "配對 Match" : "Blast",
        onQuit: function(){ g.stop(); viewSetup(); },
        onEnd: function(r){ setTimeout(function(){ app.innerHTML = '<div class="gm-res">' + MG.resultHtml(cfg.game, r, cfg.game === "blast" ? "遊戲結束" : null) + '<div class="mg-row" style="justify-content:center;margin-top:14px;"><button class="mg-btn big primary" id="again">再玩一次</button><button class="mg-btn big" id="back">回設定</button></div></div>'; MG.$("#again").onclick = function(){ seed = MG.newSeed(); if(cfg.sample === "random") words = poolFor(seed); run(); }; MG.$("#back").onclick = viewSetup; }, 700); } }));
    };
    countdown(3, run);
  }
  function countdown(n, cb, label){
    var d = document.createElement("div"); d.className = "gm-count"; document.body.appendChild(d);
    (function step(k){ if(k <= 0){ d.remove(); MG.beep("go"); cb(); return; } d.innerHTML = '<b>' + k + '</b><span>' + MG.esc(label || "準備好了嗎？") + '</span>'; MG.beep("tick"); setTimeout(function(){ step(k - 1); }, 900); })(n);
  }
  MG.countdown = countdown;

  // ---------- 作業／自主練習連結 ----------
  function baseUrl(){ return location.href.split("?")[0].split("#")[0].replace(/index\.html$/, ""); }
  async function makeLink(){
    var c = G.cfg, t = G.ctx.t; if(!t){ MG.toast("要登入老師帳號才能產生連結"); return; }
    var lessons = lessonsSel().map(function(l){ return { title: l.title, pct: l.pct, words: MG.applyTr(cloneLesson(l).words, G.trStore).map(slim) }; });
    var title = await MG.ask("連結名稱（學生會看到）", (c.game === "match" ? "配對 Match" : "Blast") + "：" + lessonsSel().map(function(l){ return l.short || l.title; }).join("、"), "產生連結");
    if(!title) return;
    var id = MG.fb.newId(), set = { title: title.slice(0, 120), game: c.game, sample: c.sample, cap: c.cap || 0, lang: c.lang, phon: c.phon || "py", match: c.match, blast: c.blast, lessons: lessons, cls: G.ctx.cls ? G.ctx.cls.name : "", clsId: G.ctx.cls ? G.ctx.cls.c : "", createdAt: Date.now() };
    try{ await MG.fb.set("teacherPlatform/" + t + "/gameSets/" + id, set); }catch(e){ MG.toast("產生失敗，請檢查網路"); return; }
    showLink(id, set);
  }
  function slim(w){ var o = { w: w.w, p: w.p }; if(w.zy) o.zy = w.zy; if(MG.picOf(w)) o.e = MG.picOf(w); var tr = {}; Object.keys(w.tr || {}).forEach(function(k){ if(w.tr[k]) tr[k] = w.tr[k]; }); if(Object.keys(tr).length) o.tr = tr; return o; }
  function linkUrl(id){ return baseUrl() + "?t=" + encodeURIComponent(G.ctx.t) + "&set=" + encodeURIComponent(id); }
  function showLink(id, set){
    var url = linkUrl(id);
    var d = MG.dialog('<h3>' + MG.esc(set.title) + '</h3><div class="link-box"><div class="qr">' + MG.qrSvg(url, 200) + '</div><div class="url">' + MG.esc(url) + '</div></div><p class="note">學生打開連結、填名字就能練習，可以一直重玩；每次的成績都會記在「查看作業連結的成績」。也可以把連結貼到作業或聯絡簿。</p><div class="mg-row end"><button class="mg-btn" data-close>關閉</button><button class="mg-btn primary" id="cp">複製連結</button></div>');
    MG.$("#cp", d).onclick = async function(){ if(await MG.copy(url)) MG.toast("已複製連結"); };
  }
  async function viewResults(){
    var t = G.ctx.t, sets = await MG.fb.get("teacherPlatform/" + t + "/gameSets").catch(function(){ return null; }) || {};
    var res = await MG.fb.get("teacherPlatform/" + t + "/gameResults").catch(function(){ return null; }) || {};
    var ids = Object.keys(sets).sort(function(a, b){ return (sets[b].createdAt || 0) - (sets[a].createdAt || 0); });
    var mine = G.ctx.cls ? ids.filter(function(id){ return !sets[id].clsId || sets[id].clsId === G.ctx.cls.c; }) : ids;
    var html = '<h3>作業連結的成績</h3>' + (mine.length ? mine.map(function(id){
      var s = sets[id], rs = res[id] || {}, by = {};
      Object.keys(rs).forEach(function(k){ var r = rs[k]; if(!r || !r.name) return; var b = by[r.name] = by[r.name] || { name: r.name, n: 0, best: null, last: 0 }; b.n++; b.last = Math.max(b.last, r.at || 0); if(!b.best || MG.rankCmp(r, b.best) < 0) b.best = r; });
      var list = Object.keys(by).map(function(k){ return by[k]; }).sort(function(a, b){ return MG.rankCmp(a.best, b.best); });
      return '<details class="mg-panel" style="padding:10px 14px;"><summary><b>' + MG.esc(s.title) + '</b> <span class="note">' + MG.esc(s.cls || "") + '　' + new Date(s.createdAt || 0).toLocaleDateString() + '　' + list.length + ' 人玩過</span></summary>' +
        '<div class="mg-row" style="margin:8px 0;"><button class="mg-btn sm" data-showlink="' + id + '">連結與 QR code</button><button class="mg-btn sm" data-csv="' + id + '">匯出 CSV</button><button class="mg-btn sm danger" data-delset="' + id + '">刪除這個連結</button></div>' +
        (list.length ? '<div style="overflow:auto;"><table class="res-table"><tr><th>名字</th><th>最高分</th><th>答對</th><th>答錯</th><th>正確率</th><th>' + (s.game === "match" ? "時間" : "平均反應") + '</th><th>玩了幾次</th><th>最後一次</th></tr>' + list.map(function(b){ var r = b.best; return '<tr><td>' + MG.esc(b.name) + '</td><td><b>' + r.s + '</b></td><td>' + r.c + '</td><td>' + r.w + '</td><td>' + Math.round(MG.acc(r) * 100) + '%</td><td>' + (s.game === "match" ? MG.fmtSec(r.time) : (MG.avgRt(r) ? (MG.avgRt(r) / 1000).toFixed(1) + " 秒" : "—")) + '</td><td>' + b.n + '</td><td>' + new Date(b.last).toLocaleString() + '</td></tr>'; }).join("") + '</table></div>' : '<p class="note">還沒有人玩。</p>') + '</details>';
    }).join("") : '<p class="note">還沒有產生過作業連結。</p>') + '<div class="mg-row end"><button class="mg-btn" data-close>關閉</button></div>';
    var d = MG.dialog(html, { wide: true });
    d.addEventListener("click", async function(e){
      var b = e.target.closest("[data-showlink],[data-csv],[data-delset]"); if(!b) return;
      if(b.dataset.showlink){ showLink(b.dataset.showlink, sets[b.dataset.showlink]); }
      else if(b.dataset.csv){ var id = b.dataset.csv, rs = res[id] || {}; MG.csv([["名字", "分數", "答對", "答錯", "正確率", "時間(秒)", "平均反應(秒)", "時間點"]].concat(Object.keys(rs).map(function(k){ var r = rs[k]; return [r.name, r.s, r.c, r.w, Math.round(MG.acc(r) * 100) + "%", ((r.time || 0) / 1000).toFixed(1), MG.avgRt(r) ? (MG.avgRt(r) / 1000).toFixed(2) : "", new Date(r.at || 0).toLocaleString()]; })), (sets[id].title || "成績") + ".csv"); }
      else if(b.dataset.delset){ if(!(await MG.confirm("刪除這個連結和它的成績？學生就打不開了。", "刪除"))) return; var id2 = b.dataset.delset; await MG.fb.remove("teacherPlatform/" + t + "/gameSets/" + id2).catch(function(){}); await MG.fb.remove("teacherPlatform/" + t + "/gameResults/" + id2).catch(function(){}); d.close(); viewResults(); }
    });
  }

  // ---------- 學生：作業／自主練習連結 ----------
  async function viewSoloLink(t, id){
    var set = await MG.fb.get("teacherPlatform/" + t + "/gameSets/" + id).catch(function(){ return null; });
    if(!set){ app.innerHTML = '<div class="solo-card"><h2>找不到這個練習</h2><p class="note">連結可能已經被老師刪除，請跟老師確認。</p></div>'; return; }
    var name = ""; try{ name = localStorage.getItem("mm_game_name") || ""; }catch(e){}
    var gcfg = set[set.game] || {}, lang = set.lang || "en", theme = gcfg.theme || (set.game === "match" ? "plain" : "space"), thList = set.game === "match" ? MG.MATCH_THEMES : MG.THEME_ORDER;
    var usesTr = set.game === "match" ? (set.match || {}).pair !== "p" : ["w2t", "t2w"].indexOf((set.blast || {}).q) >= 0 && (set.blast || {}).input !== "type";
    function form(){
      app.innerHTML = '<div class="solo-card"><div class="brand-line"><img src="../icons/logo.svg" alt="">曼米中文</div><h2>' + MG.esc(set.title) + '</h2><div class="note">' + MG.esc(set.game === "match" ? "配對 Match・" + (set.match.mode === "timed" ? "限時 " + set.match.seconds + " 秒" : "比速度") + "・" + MG.ph(MG.MATCH_PAIRS[set.match.pair], set.phon) : "Blast・" + (set.blast.input === "type" ? "打拼音" : MG.ph(MG.BLAST_Q[set.blast.q], set.phon))) + '</div>' +
        '<label>你的名字</label><input class="mg-in" id="nm" maxlength="20" value="' + MG.esc(name) + '" placeholder="老師才知道是誰玩的">' +
        (usesTr ? '<label>翻譯語言</label><select class="mg-sel" id="lg" style="width:100%;">' + MG.LANGS.map(function(l){ return '<option value="' + l.k + '"' + (l.k === lang ? " selected" : "") + '>' + MG.esc(l.n) + '</option>'; }).join("") + '</select>' : '') +
        (gcfg.themeFree !== false ? '<label>主題</label><div class="th-list">' + thList.map(function(k){ return '<button type="button" class="th-card' + (k === theme ? " on" : "") + '" data-theme="' + k + '">' + MG.themeSwatch(k) + '<b>' + MG.esc(MG.THEMES[k].name) + '</b></button>'; }).join("") + '</div>' : '') +
        '<button class="mg-btn big primary" id="start">開始</button><p class="note" id="st" style="text-align:center;margin-top:8px;"></p></div>';
      app.onclick = function(e){ var b = e.target.closest("[data-theme]"); if(b){ theme = b.dataset.theme; MG.$$(".th-card").forEach(function(x){ x.classList.toggle("on", x === b); }); } };
      MG.$("#start").onclick = start;
    }
    async function start(){
      name = MG.$("#nm").value.trim(); if(!name){ MG.toast("請先填名字"); MG.$("#nm").focus(); return; }
      try{ localStorage.setItem("mm_game_name", name); }catch(e){}
      if(MG.$("#lg")) lang = MG.$("#lg").value;
      var seed = MG.newSeed(), words = MG.buildPool(set.lessons || [], set.sample, seed, set.cap || 0).map(function(w){ return Object.assign({}, w, { tr: Object.assign({}, w.tr) }); });
      if(usesTr){
        var miss = words.filter(function(w){ return !MG.trOf(w, lang); }).length;
        if(miss){ MG.$("#st").textContent = "準備" + MG.langShort(lang) + "翻譯中…"; MG.$("#start").disabled = true; await MG.translateMissing(words, lang); MG.$("#start").disabled = false; MG.$("#st").textContent = ""; }
      }
      countdown(3, function(){
        // 學生換了主題：音樂也換成搭配的（老師有開音樂才會播）
        var musOv = theme !== gcfg.theme && gcfg.music && MG.THEMES[theme] ? { music: MG.THEMES[theme].music } : {};
        var g = MG.playGame(app, set.game, words, { lang: lang, phon: set.phon, match: Object.assign({}, set.match, musOv), blast: Object.assign({}, set.blast, musOv), theme: theme, seed: seed, title: set.title,
          onQuit: function(){ g.stop(); form(); },
          onEnd: function(r){
            MG.fb.set("teacherPlatform/" + t + "/gameResults/" + id + "/" + MG.fb.newId(), { name: name.slice(0, 20), s: r.s, c: r.c, w: r.w, rt: r.rt, n: r.n, time: Math.round(r.time), done: !!r.done, lang: lang, at: Date.now() }).catch(function(){});
            setTimeout(function(){ app.innerHTML = '<div class="gm-res">' + MG.resultHtml(set.game, r, set.game === "blast" ? "遊戲結束" : null) + '<p class="note">成績已經記下來了，可以再玩一次挑戰更高分。</p><div class="mg-row" style="justify-content:center;margin-top:14px;"><button class="mg-btn big primary" id="again">再玩一次</button><button class="mg-btn big" id="back">換設定</button></div></div>'; MG.$("#again").onclick = function(){ form(); start(); }; MG.$("#back").onclick = form; }, 700);
          } });
      });
    }
    form();
  }

  // ---------- 啟動 ----------
  async function startTeacher(ctx){
    G.ctx = ctx; G.cfg = defaults(ctx.game);
    var saved = null; try{ saved = JSON.parse(localStorage.getItem(prefKey()) || "null"); }catch(e){}
    if(!saved && ctx.t){ saved = await MG.fb.get("teacherPlatform/" + ctx.t + "/gamePrefs/" + (ctx.cls ? ctx.cls.c : "_")).catch(function(){ return null; }); }
    if(saved) merge(G.cfg, saved);
    if(ctx.game) G.cfg.game = ctx.game;
    // 課次：清掉這個班已經沒有的；什麼都沒選就用「最近一課往前」的預設
    var keys = ctx.lessons.map(function(l){ return l.key; });
    Object.keys(G.cfg.lessons || {}).forEach(function(k){ if(keys.indexOf(k) < 0) delete G.cfg.lessons[k]; });
    if(ctx.sel && ctx.sel.length && ctx.selExplicit){ G.cfg.lessons = {}; ctx.sel.forEach(function(k){ if(keys.indexOf(k) >= 0) G.cfg.lessons[k] = 100; }); }
    if(!Object.keys(G.cfg.lessons).length && keys.length) presetFrom(ctx.recent && keys.indexOf(ctx.recent) >= 0 ? ctx.recent : keys[keys.length - 1]);
    if(ctx.t){ G.trStore = await MG.fb.get("teacherPlatform/" + ctx.t + "/gameTr").catch(function(){ return null; }) || {}; }
    viewSetup();
  }
  MG.viewSetup = function(){ viewSetup(); };
  MG.poolFor = poolFor;
  MG.gameOpts = gameOpts;

  window.addEventListener("message", function(e){
    var d = e.data; if(!d || d.mmGame !== "init") return;
    if(e.source !== window.parent) return;
    var ctx = d.ctx || {};
    ctx.lessons = (ctx.lessons || []).map(function(l){ return { key: l.key, title: l.title, short: l.short, words: (l.words || []).map(function(v, i){ return v.w !== undefined ? Object.assign({ id: String(i), tr: {} }, v) : MG.fromBank(v, i); }).filter(function(w){ return w.w; }) }; }).filter(function(l){ return l.words.length; });
    MG.fb.ready.then(function(){ startTeacher(ctx); });
  });

  MG.fb.ready.then(function(ok){
    var t = MG.qs.get("t"), set = MG.qs.get("set"), code = MG.qs.get("code");
    if(!ok){ app.innerHTML = '<div class="solo-card"><h2>連不上網路</h2><p class="note">請檢查網路後重新整理。</p></div>'; return; }
    if(t && set){ viewSoloLink(t, set); return; }
    if(code || MG.qs.has("join")){ if(MG.Live) MG.Live.studentJoin(code || ""); return; }
    if(EMBED && window.parent !== window){ window.parent.postMessage({ mmGame: "ready" }, "*"); app.innerHTML = '<div class="mg-loading">準備中…</div>'; return; }
    app.innerHTML = '<div class="solo-card"><div class="brand-line"><img src="../icons/logo.svg" alt="">曼米中文</div><h2>生詞遊戲</h2><p class="note">老師請從曼米平台的「課堂活動」打開；學生請輸入老師給的房間代碼。</p><label>房間代碼</label><input class="mg-in" id="cd" inputmode="numeric" maxlength="6" placeholder="6 位數字"><button class="mg-btn big primary" id="go">加入</button></div>';
    MG.$("#go").onclick = function(){ var v = MG.$("#cd").value.trim(); if(MG.Live) MG.Live.studentJoin(v); };
  });
})();
