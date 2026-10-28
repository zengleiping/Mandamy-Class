/* 曼米中文：課堂工具箱（老師用）。浮動視窗系統＋純淨桌面＋桌布＋各種小工具。資料只存在這台電腦的瀏覽器（localStorage），不會上傳。 */
(function(){
  "use strict";
  var CT = window.CT = { tools: [], wins: {}, z: 9000, scale: 1, cats: [
    { id: "time", name: "⏰ 時間考程" }, { id: "order", name: "🚦 常規秩序" }, { id: "fun", name: "🎯 互動激勵" }, { id: "board", name: "🎨 板書多媒體" } ] };
  var ctx = function(){ return window.CT_ctx || {}; };
  CT.ctx = ctx;

  // ---------- 小幫手 ----------
  function h(tag, attrs, kids){
    var e = document.createElement(tag);
    if(attrs) Object.keys(attrs).forEach(function(k){
      var v = attrs[k]; if(v == null || v === false) return;
      if(k === "class") e.className = v; else if(k === "style") e.style.cssText = v; else if(k === "html") e.innerHTML = v; else if(k === "text") e.textContent = v;
      else if(k.slice(0, 2) === "on") e[k] = v; else e.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function(c){ if(c == null) return; e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  CT.h = h;
  CT.esc = function(s){ return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  CT.pad = function(n){ return (n < 10 ? "0" : "") + n; };
  function classKey(){ var c = ctx().classKey ? ctx().classKey() : ""; return c || "x"; }
  CT.classKey = classKey;
  CT.load = function(key, def, perClass){ try{ var v = JSON.parse(localStorage.getItem("mm_ct_" + key + (perClass ? "_" + classKey() : "")) || "null"); return v == null ? def : v; }catch(e){ return def; } };
  CT.save = function(key, val, perClass){ try{ localStorage.setItem("mm_ct_" + key + (perClass ? "_" + classKey() : ""), JSON.stringify(val)); }catch(e){} };
  CT.toast = function(m){ if(ctx().toast) ctx().toast(m); };
  CT.roster = async function(){ try{ return ctx().roster ? await ctx().roster() : []; }catch(e){ return []; } };
  CT.shuffle = function(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var audioCtx = null;
  CT.audio = function(){ try{ if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if(audioCtx.state === "suspended") audioCtx.resume(); }catch(e){} return audioCtx; };
  CT.beep = function(times, freq){
    var a = CT.audio(); if(!a) return; times = times || 3;
    for(var i = 0; i < times; i++){ (function(i){ var o = a.createOscillator(), g = a.createGain(); o.frequency.value = freq || 880; o.type = "sine"; o.connect(g); g.connect(a.destination); var t0 = a.currentTime + i * 0.4; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3); o.start(t0); o.stop(t0 + 0.32); })(i); }
  };
  CT.loadScript = function(src){ return new Promise(function(res, rej){ var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); };

  // ---------- 樣式 ----------
  var css = [
    ".ct-win{position:fixed;z-index:9000;background:var(--surface,#fff);color:var(--ink,#2a2018);border:2px solid #d9c9b5;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.28);display:flex;flex-direction:column;font-size:calc(16px * var(--ct-s,1));min-width:200px;min-height:120px;max-width:98vw;max-height:96vh;}",
    ".ct-hd{display:flex;align-items:center;gap:6px;padding:6px 8px 6px 12px;background:#f5ebdf;border-radius:12px 12px 0 0;font-weight:700;cursor:move;user-select:none;touch-action:none;font-size:.95em;}",
    ".ct-hd .ct-t{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
    ".ct-hd button{border:0;background:rgba(0,0,0,.08);border-radius:8px;width:1.8em;height:1.8em;cursor:pointer;font-size:.9em;line-height:1;color:inherit;}",
    ".ct-hd button:hover{background:rgba(0,0,0,.18);}",
    ".ct-bd{flex:1;overflow:auto;padding:10px;position:relative;min-height:0;}",
    ".ct-win.ct-min .ct-bd,.ct-win.ct-min .ct-rz{display:none;} .ct-win.ct-min{min-height:0;height:auto!important;}",
    ".ct-rz{position:absolute;right:0;bottom:0;width:20px;height:20px;cursor:nwse-resize;touch-action:none;background:linear-gradient(135deg,transparent 55%,#b9a68f 55%,#b9a68f 62%,transparent 62%,transparent 72%,#b9a68f 72%,#b9a68f 79%,transparent 79%);border-radius:0 0 12px 0;}",
    ".ct-btn{border:1.5px solid #c9b8a5;background:#fff;border-radius:10px;padding:.35em .8em;font-size:.95em;cursor:pointer;color:inherit;font-family:inherit;}",
    ".ct-btn:hover{background:#faf3ea;} .ct-btn.pri{background:var(--seal,#C0623A);color:#fff;border-color:var(--seal,#C0623A);} .ct-btn.on{background:#FDECE6;border-color:var(--seal,#C0623A);font-weight:700;}",
    ".ct-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0;} .ct-c{text-align:center;} .ct-big{font-size:3.2em;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums;}",
    ".ct-inp{border:1.5px solid #c9b8a5;border-radius:8px;padding:.3em .5em;font-size:1em;font-family:inherit;color:inherit;background:#fff;min-width:0;}",
    ".ct-muted{color:#8a7a6a;font-size:.88em;}",
    "#ct-more .ct-cat{font-weight:800;margin:8px 0 4px;} #ct-more .ct-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(7.6em,1fr));gap:6px;}",
    "#ct-more .ct-tool{display:flex;flex-direction:column;align-items:center;gap:2px;padding:.5em .3em;border:1.5px solid #d9c9b5;border-radius:12px;background:#fff;cursor:pointer;font-size:.9em;font-family:inherit;color:inherit;} #ct-more .ct-tool:hover{background:#FDECE6;border-color:var(--seal,#C0623A);} #ct-more .ct-tool b{font-size:1.7em;font-weight:400;line-height:1.1;}",
    "#ct-wall{position:fixed;inset:0;z-index:8000;display:none;} body.ct-clean #ct-wall{display:block;}",
    "body.ct-clean:not(.ct-off) > *:not(.ct-win):not(#ct-wall):not(#ct-dock):not(#ct-more):not(.ct-layer):not(.ct-keep):not(.toast):not(#drawov):not(#brk):not(script):not(style):not(link){display:none!important;}",
    "#ct-dock{position:fixed;left:50%;bottom:8px;transform:translateX(-50%);z-index:9800;display:flex;gap:2px;align-items:center;background:rgba(255,255,255,.95);border:2px solid #d9c9b5;border-radius:18px;padding:4px 8px;box-shadow:0 6px 20px rgba(0,0,0,.28);font-size:calc(14px * var(--ct-s,1));max-width:98vw;overflow-x:auto;}",
    ".ct-dk{display:flex;flex-direction:column;align-items:center;gap:0;border:0;background:transparent;border-radius:12px;padding:.25em .55em;cursor:pointer;color:var(--ink,#2a2018);font-family:inherit;min-width:3.2em;white-space:nowrap;} .ct-dk b{font-size:1.5em;font-weight:400;line-height:1.15;} .ct-dk span{font-size:.78em;} .ct-dk:hover{background:#FDECE6;} .ct-dk.on{background:#FDECE6;box-shadow:inset 0 -3px 0 var(--seal,#C0623A);} .ct-sep{width:1px;align-self:stretch;background:#d9c9b5;margin:3px 4px;flex:none;}",
    "#ct-more{position:fixed;left:50%;bottom:calc(72px * var(--ct-s,1));transform:translateX(-50%);z-index:9810;width:min(640px,96vw);max-height:68vh;overflow:auto;background:#fff;border:2px solid #d9c9b5;border-radius:16px;padding:10px 12px;box-shadow:0 10px 30px rgba(0,0,0,.3);font-size:calc(15px * var(--ct-s,1));} #ct-more .ct-tool{position:relative;} .ct-star{position:absolute;right:4px;top:0;font-size:1.1em;color:#E0A82E;padding:2px 4px;}",
    "body.ct-off .ct-win,body.ct-off #ct-dock,body.ct-off #ct-more,body.ct-off .ct-layer,body.ct-off #ct-wall{display:none!important;}",
    ".ct-mini{font-variant-numeric:tabular-nums;color:#C0623A;display:none;margin-right:.3em;} .ct-win.ct-min .ct-mini{display:inline;} .ct-btn-on{background:#FDECE6!important;}",
    ".ct-layer{position:fixed;inset:0;z-index:8990;pointer-events:none;} .ct-layer > *{pointer-events:auto;}",
    ".ct-stamp{position:fixed;font-size:56px;line-height:1;cursor:grab;user-select:none;touch-action:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3));}",
    "@keyframes ctPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}"
  ].join("\n");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---------- 浮動視窗（會記住每個工具上次的位置與大小，也會記住開著哪些）----------
  var cascade = 0;
  CT.geo = CT.load("geo", {});
  function saveGeo(win){
    var r = win.el.getBoundingClientRect(); CT.geo[win.id] = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: win.el.classList.contains("ct-min") ? (CT.geo[win.id] && CT.geo[win.id].h) || Math.round(r.height) : Math.round(r.height), min: win.el.classList.contains("ct-min") };
    CT.save("geo", CT.geo);
  }
  function saveOpen(){ CT.save("open", Object.keys(CT.wins)); }
  CT.win = function(id, title, w, hgt, build){
    if(CT.wins[id]){ CT.front(CT.wins[id]); return CT.wins[id]; }
    var g = CT.geo[id], W = Math.min(g ? g.w : w, window.innerWidth - 20), H = Math.min(g ? g.h : hgt, window.innerHeight - 20);
    var left = g ? Math.max(0, Math.min(window.innerWidth - 120, g.x)) : Math.max(10, 80 + (cascade % 6) * 34), top = g ? Math.max(0, Math.min(window.innerHeight - 60, g.y)) : Math.max(10, 70 + (cascade % 6) * 30);
    var el = h("div", { class: "ct-win" + (g && g.min ? " ct-min" : ""), id: "ctw-" + id, style: "width:" + W + "px;height:" + H + "px;left:" + left + "px;top:" + top + "px;" });
    cascade++;
    var mini = h("span", { class: "ct-mini" }), hd = h("div", { class: "ct-hd" }, [h("span", { class: "ct-t", text: title }), mini]);
    var bMin = h("button", { type: "button", title: "縮小／展開", text: "—" }), bX = h("button", { type: "button", title: "關閉", text: "✕" });
    hd.appendChild(bMin); hd.appendChild(bX);
    var bd = h("div", { class: "ct-bd" }), rz = h("div", { class: "ct-rz" });
    el.appendChild(hd); el.appendChild(bd); el.appendChild(rz); document.body.appendChild(el);
    var win = { id: id, el: el, body: bd, title: title, cleanups: [], close: null, setTitle: function(t){ hd.firstChild.textContent = t; }, setMini: function(t){ mini.textContent = t || ""; }, onClose: function(fn){ win.cleanups.push(fn); } };
    win.close = function(){ win.cleanups.forEach(function(f){ try{ f(); }catch(e){} }); saveGeo(win); el.remove(); delete CT.wins[id]; saveOpen(); CT.refreshDock(); };
    bX.onclick = win.close; bMin.onclick = function(){ el.classList.toggle("ct-min"); saveGeo(win); };
    el.addEventListener("pointerdown", function(){ CT.front(win); }, true);
    hd.addEventListener("pointerdown", function(e){
      if(e.target.closest("button")) return; e.preventDefault();
      var r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      function mv(ev){ el.style.left = Math.max(-r.width + 80, Math.min(window.innerWidth - 80, ev.clientX - dx)) + "px"; el.style.top = Math.max(0, Math.min(window.innerHeight - 40, ev.clientY - dy)) + "px"; }
      function up(){ document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); saveGeo(win); }
      document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
    });
    rz.addEventListener("pointerdown", function(e){
      e.preventDefault(); e.stopPropagation(); var r = el.getBoundingClientRect(), sx = e.clientX, sy = e.clientY;
      function mv(ev){ el.style.width = Math.max(220, r.width + ev.clientX - sx) + "px"; el.style.height = Math.max(140, r.height + ev.clientY - sy) + "px"; win.onResize && win.onResize(); }
      function up(){ document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); saveGeo(win); }
      document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
    });
    CT.wins[id] = win; CT.front(win); saveOpen();
    try{ build(bd, win); }catch(e){ bd.textContent = "這個工具發生錯誤：" + e.message; console.error(e); }
    CT.refreshDock(); return win;
  };
  CT.front = function(win){ CT.z++; win.el.style.zIndex = CT.z > 9700 ? (CT.z = 9001) : CT.z; };
  CT.minAll = function(){ var ws = Object.keys(CT.wins).map(function(k){ return CT.wins[k]; }); var allMin = ws.length && ws.every(function(w){ return w.el.classList.contains("ct-min"); }); ws.forEach(function(w){ w.el.classList.toggle("ct-min", !allMin); saveGeo(w); }); };
  CT.closeAll = function(){ Object.keys(CT.wins).forEach(function(k){ CT.wins[k].close(); }); };
  CT.tidy = function(){
    var ws = Object.keys(CT.wins).map(function(k){ return CT.wins[k]; }).filter(function(w){ return !w.el.classList.contains("ct-min"); }); if(!ws.length) return;
    var n = ws.length, cols = Math.ceil(Math.sqrt(n * window.innerWidth / Math.max(400, window.innerHeight - 90))), rows = Math.ceil(n / cols), gap = 8, aw = window.innerWidth - gap * (cols + 1), ah = window.innerHeight - 84 - gap * (rows + 1);
    ws.forEach(function(w, i){ var c = i % cols, r = Math.floor(i / cols); w.el.style.width = Math.max(220, aw / cols) + "px"; w.el.style.height = Math.max(140, ah / rows) + "px"; w.el.style.left = (gap + c * (aw / cols + gap)) + "px"; w.el.style.top = (gap + r * (ah / rows + gap)) + "px"; saveGeo(w); w.onResize && w.onResize(); });
  };

  // ---------- 工具註冊 ----------
  CT.add = function(t){ CT.tools.push(t); };
  CT.alias = { vtimer: "timer" };
  CT.find = function(id){ id = CT.alias[id] || id; return CT.tools.filter(function(x){ return x.id === id; })[0]; };
  CT.open = function(id){
    var t = CT.find(id); if(!t) return;
    if(t.open){ t.open(); return; }
    CT.win(t.id, t.icon + " " + t.name, t.w || 420, t.h || 360, function(bd, win){ t.build(bd, win); });
  };
  CT.toggleTool = function(id){ var t = CT.find(id); if(!t) return; if(!t.open && CT.wins[t.id]) CT.wins[t.id].close(); else CT.open(id); };
  var WALLS = [
    ["晨曦", "linear-gradient(160deg,#ffe9d6,#ffc8a2 55%,#f9a889)"], ["森林", "linear-gradient(160deg,#d8f0d0,#8fcf9d 55%,#4f9b6b)"], ["海洋", "linear-gradient(180deg,#d4f1ff,#79c7ec 55%,#2f86c1)"],
    ["櫻花", "radial-gradient(circle at 30% 20%,#fff,#ffd9e6 50%,#f7a8c4)"], ["星空", "radial-gradient(circle at 70% 25%,#4b4a9a,#1d1b4d 60%,#0a0a26)"], ["沙漠", "linear-gradient(180deg,#fff0c9,#f3c77a 60%,#d99b4a)"],
    ["雪山", "linear-gradient(180deg,#eaf4ff,#bcd7f0 60%,#8fb3d9)"], ["糖果", "linear-gradient(135deg,#ffd1e8,#c9f0ff 50%,#fff3b8)"], ["極光", "linear-gradient(160deg,#0d2b3a,#1c7c6b 50%,#7ee0a8)"],
    ["秋楓", "linear-gradient(160deg,#ffe2c2,#f2a65a 55%,#c4572b)"], ["薄荷", "linear-gradient(160deg,#e6fff6,#a9ead2 60%,#5fc7a2)"], ["黑板", "linear-gradient(180deg,#2f4a3f,#233a31)"]
  ];
  CT.walls = WALLS;
  function applyWall(){
    var i = CT.load("wall", 0), wall = document.getElementById("ct-wall"); if(!wall){ wall = h("div", { id: "ct-wall" }); document.body.appendChild(wall); }
    wall.style.background = WALLS[i % WALLS.length][1];
  }
  function applyScale(){ document.documentElement.style.setProperty("--ct-s", CT.scale); }
  CT.scale = CT.load("scale", 1);
  CT.setScale = function(v){ CT.scale = Math.max(0.7, Math.min(2.4, Math.round(v * 10) / 10)); CT.save("scale", CT.scale); applyScale(); };
  CT.setClean = function(on){ document.body.classList.toggle("ct-clean", !!on); applyWall(); applyScale(); CT.refreshDock(); };

  // ---------- 底部工具列（常駐；放釘選的常用工具）----------
  CT.pins = CT.load("pins", ["timer", "draw", "groups", "teamscore", "dice", "paint"]);
  CT.dockOn = CT.load("dock", false);
  function togglePin(id){ var i = CT.pins.indexOf(id); if(i >= 0) CT.pins.splice(i, 1); else CT.pins.push(id); CT.save("pins", CT.pins); CT.refreshDock(); if(document.getElementById("ct-more")) CT.openMore(true); }
  CT.refreshDock = function(){
    var d = document.getElementById("ct-dock"); if(!CT.dockOn){ if(d) d.remove(); return; }
    if(!d){ d = h("div", { id: "ct-dock" }); document.body.appendChild(d); }
    d.innerHTML = "";
    CT.pins.forEach(function(id){ var t = CT.find(id); if(!t) return; var on = !t.open && CT.wins[t.id];
      d.appendChild(h("button", { class: "ct-dk" + (on ? " on" : ""), title: t.name, onclick: function(){ CT.toggleTool(id); } }, [h("b", { text: t.icon }), h("span", { text: t.name })])); });
    d.appendChild(h("button", { class: "ct-dk", title: "所有工具（可以按星星釘選常用的）", onclick: function(){ CT.openMore(); } }, [h("b", { text: "⋯" }), h("span", { text: "更多" })]));
    d.appendChild(h("i", { class: "ct-sep" }));
    d.appendChild(h("button", { class: "ct-dk", title: "全部縮小／還原", onclick: CT.minAll }, [h("b", { text: "▁" }), h("span", { text: "全縮" })]));
    d.appendChild(h("button", { class: "ct-dk", title: "整齊排列開著的視窗", onclick: CT.tidy }, [h("b", { text: "▦" }), h("span", { text: "排列" })]));
    d.appendChild(h("button", { class: "ct-dk", title: "關閉全部視窗", onclick: CT.closeAll }, [h("b", { text: "✕" }), h("span", { text: "全關" })]));
    d.appendChild(h("i", { class: "ct-sep" }));
    d.appendChild(h("button", { class: "ct-dk", title: "字級縮小", onclick: function(){ CT.setScale(CT.scale - 0.1); } }, [h("b", { text: "A−" }), h("span", { text: "字小" })]));
    d.appendChild(h("button", { class: "ct-dk", title: "字級放大", onclick: function(){ CT.setScale(CT.scale + 0.1); } }, [h("b", { text: "A＋" }), h("span", { text: "字大" })]));
    var clean = document.body.classList.contains("ct-clean");
    d.appendChild(h("button", { class: "ct-dk" + (clean ? " on" : ""), title: "純淨桌面：隱藏平台其他畫面，只留桌布和工具視窗", onclick: function(){ CT.setClean(!document.body.classList.contains("ct-clean")); } }, [h("b", { text: "🪟" }), h("span", { text: clean ? "離開純淨" : "純淨桌面" })]));
    if(clean) d.appendChild(h("button", { class: "ct-dk", title: "換桌布", onclick: function(){ CT.save("wall", (CT.load("wall", 0) + 1) % WALLS.length); applyWall(); } }, [h("b", { text: "🖼" }), h("span", { text: "桌布" })]));
    d.appendChild(h("button", { class: "ct-dk", title: "收起這條工具列", onclick: function(){ CT.showDock(false); } }, [h("b", { text: "⌄" }), h("span", { text: "收起" })]));
  };
  CT.showDock = function(on){
    CT.dockOn = !!on; CT.save("dock", CT.dockOn); applyScale(); CT.refreshDock(); if(!on){ CT.closeMore(); if(document.body.classList.contains("ct-clean")) CT.setClean(false); }
    var b = document.querySelector("[data-ct]"); if(b) b.classList.toggle("ct-btn-on", CT.dockOn);
  };
  CT.toggleBox = function(){ CT.showDock(!CT.dockOn); };
  CT.closeMore = function(){ var m = document.getElementById("ct-more"); if(m) m.remove(); document.removeEventListener("pointerdown", moreOut, true); };
  function moreOut(e){ var m = document.getElementById("ct-more"); if(m && !m.contains(e.target) && !e.target.closest("#ct-dock")) CT.closeMore(); }
  CT.openMore = function(keep){
    var old = document.getElementById("ct-more"); if(old && !keep){ CT.closeMore(); return; } if(old) old.remove();
    var m = h("div", { id: "ct-more" }); document.body.appendChild(m);
    m.appendChild(h("div", { class: "ct-muted", style: "margin-bottom:4px;", text: "點工具開啟；點右上角的 ☆ 可以釘到底部工具列。" }));
    CT.cats.forEach(function(c){
      var list = CT.tools.filter(function(t){ return t.cat === c.id; }); if(!list.length) return;
      m.appendChild(h("div", { class: "ct-cat", text: c.name })); var g = h("div", { class: "ct-grid" });
      list.forEach(function(t){
        var pinned = CT.pins.indexOf(t.id) >= 0;
        g.appendChild(h("div", { class: "ct-tool", onclick: function(){ CT.closeMore(); CT.open(t.id); } }, [h("b", { text: t.icon }), t.name, h("span", { class: "ct-star", title: pinned ? "取消釘選" : "釘到底部工具列", text: pinned ? "★" : "☆", onclick: function(ev){ ev.stopPropagation(); togglePin(t.id); } })]));
      });
      m.appendChild(g);
    });
    var ws = h("select", { class: "ct-inp", style: "margin-top:8px;" }); WALLS.forEach(function(w, i){ ws.appendChild(h("option", { value: String(i), text: "純淨桌面桌布：" + w[0] })); }); ws.value = String(CT.load("wall", 0) % WALLS.length); ws.onchange = function(){ CT.save("wall", Number(ws.value)); applyWall(); };
    m.appendChild(ws); m.appendChild(h("div", { class: "ct-muted", style: "margin-top:6px;", text: "所有資料只存在這台電腦的瀏覽器，不會上傳。視窗位置會記住。" }));
    setTimeout(function(){ document.addEventListener("pointerdown", moreOut, true); }, 0);
  };
  CT.openBox = CT.openMore;

  // ---------- 進出班級：只在班級頁顯示；換班級就關掉舊視窗；回到班級時還原上次開著的視窗 ----------
  var lastKey = null, restored = false;
  CT.restore = function(){ if(restored) return; restored = true; (CT.load("open", []) || []).forEach(function(id){ if(CT.find(id) && !(CT.find(id).open)) CT.open(id); }); };
  setInterval(function(){
    var inC = !!(ctx().inClass && ctx().inClass()); document.body.classList.toggle("ct-off", !inC);
    if(!inC) return;
    var k = classKey(); if(lastKey && k !== lastKey){ CT.closeAll(); }
    lastKey = k; if(CT.dockOn){ if(!document.getElementById("ct-dock")) CT.refreshDock(); CT.restore(); }
    var b = document.querySelector("[data-ct]"); if(b) b.classList.toggle("ct-btn-on", CT.dockOn);
  }, 1200);
  CT.layer = function(){ var l = document.getElementById("ct-layer"); if(!l){ l = h("div", { id: "ct-layer", class: "ct-layer" }); document.body.appendChild(l); } return l; };
  // 讓工具視窗可以把滑鼠拖曳變成「放置物」（貼紙、便利貼共用）
  CT.makeDraggable = function(el, onEnd){
    el.addEventListener("pointerdown", function(e){
      if(e.target.closest("textarea,button,input")) return; e.preventDefault();
      var r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top; el.style.zIndex = ++CT.z;
      function mv(ev){ el.style.left = (ev.clientX - dx) + "px"; el.style.top = (ev.clientY - dy) + "px"; }
      function up(){ document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); onEnd && onEnd(); }
      document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
    });
  };
  applyScale();
})();
