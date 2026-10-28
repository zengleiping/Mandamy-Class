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
    "#ct-box .ct-cat{font-weight:800;margin:10px 0 4px;} #ct-box .ct-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(8.2em,1fr));gap:6px;}",
    "#ct-box .ct-tool{display:flex;flex-direction:column;align-items:center;gap:2px;padding:.5em .3em;border:1.5px solid #d9c9b5;border-radius:12px;background:#fff;cursor:pointer;font-size:.9em;font-family:inherit;color:inherit;} #ct-box .ct-tool:hover{background:#FDECE6;border-color:var(--seal,#C0623A);} #ct-box .ct-tool b{font-size:1.7em;font-weight:400;line-height:1.1;}",
    "#ct-wall{position:fixed;inset:0;z-index:8000;display:none;} body.ct-clean #ct-wall{display:block;}",
    "body.ct-clean > *:not(.ct-win):not(#ct-wall):not(#ct-dock):not(.ct-layer):not(.ct-keep):not(.toast):not(#drawov):not(#brk):not(script):not(style):not(link){display:none!important;}",
    "#ct-dock{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:9800;display:none;gap:8px;align-items:center;background:rgba(255,255,255,.92);border:2px solid #d9c9b5;border-radius:99px;padding:6px 14px;box-shadow:0 6px 20px rgba(0,0,0,.25);font-size:calc(15px * var(--ct-s,1));} body.ct-clean #ct-dock{display:flex;}",
    ".ct-layer{position:fixed;inset:0;z-index:8990;pointer-events:none;} .ct-layer > *{pointer-events:auto;}",
    ".ct-stamp{position:fixed;font-size:56px;line-height:1;cursor:grab;user-select:none;touch-action:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3));}",
    "@keyframes ctPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}"
  ].join("\n");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---------- 浮動視窗 ----------
  var cascade = 0;
  CT.win = function(id, title, w, hgt, build){
    if(CT.wins[id]){ CT.front(CT.wins[id]); return CT.wins[id]; }
    var W = Math.min(w, window.innerWidth - 20), H = Math.min(hgt, window.innerHeight - 20);
    var el = h("div", { class: "ct-win", id: "ctw-" + id, style: "width:" + W + "px;height:" + H + "px;left:" + Math.max(10, 80 + (cascade % 6) * 34) + "px;top:" + Math.max(10, 70 + (cascade % 6) * 30) + "px;" });
    cascade++;
    var hd = h("div", { class: "ct-hd" }, [h("span", { class: "ct-t", text: title })]);
    var bMin = h("button", { type: "button", title: "縮小／展開", text: "—" }), bX = h("button", { type: "button", title: "關閉", text: "✕" });
    hd.appendChild(bMin); hd.appendChild(bX);
    var bd = h("div", { class: "ct-bd" }), rz = h("div", { class: "ct-rz" });
    el.appendChild(hd); el.appendChild(bd); el.appendChild(rz); document.body.appendChild(el);
    var win = { id: id, el: el, body: bd, title: title, cleanups: [], close: null, setTitle: function(t){ hd.firstChild.textContent = t; }, onClose: function(fn){ win.cleanups.push(fn); } };
    win.close = function(){ win.cleanups.forEach(function(f){ try{ f(); }catch(e){} }); el.remove(); delete CT.wins[id]; };
    bX.onclick = win.close; bMin.onclick = function(){ el.classList.toggle("ct-min"); };
    el.addEventListener("pointerdown", function(){ CT.front(win); }, true);
    hd.addEventListener("pointerdown", function(e){
      if(e.target.closest("button")) return; e.preventDefault();
      var r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      function mv(ev){ el.style.left = Math.max(-r.width + 80, Math.min(window.innerWidth - 80, ev.clientX - dx)) + "px"; el.style.top = Math.max(0, Math.min(window.innerHeight - 40, ev.clientY - dy)) + "px"; }
      function up(){ document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }
      document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
    });
    rz.addEventListener("pointerdown", function(e){
      e.preventDefault(); e.stopPropagation(); var r = el.getBoundingClientRect(), sx = e.clientX, sy = e.clientY;
      function mv(ev){ el.style.width = Math.max(220, r.width + ev.clientX - sx) + "px"; el.style.height = Math.max(140, r.height + ev.clientY - sy) + "px"; win.onResize && win.onResize(); }
      function up(){ document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }
      document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
    });
    CT.wins[id] = win; CT.front(win);
    try{ build(bd, win); }catch(e){ bd.textContent = "這個工具發生錯誤：" + e.message; console.error(e); }
    return win;
  };
  CT.front = function(win){ CT.z++; win.el.style.zIndex = CT.z > 9700 ? (CT.z = 9001) : CT.z; };

  // ---------- 工具註冊與工具箱 ----------
  CT.add = function(t){ CT.tools.push(t); };
  CT.open = function(id){
    var t = CT.tools.filter(function(x){ return x.id === id; })[0]; if(!t) return;
    if(t.open){ t.open(); return; }
    CT.win(id, t.icon + " " + t.name, t.w || 420, t.h || 360, function(bd, win){ t.build(bd, win); });
  };
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
  CT.setClean = function(on){
    document.body.classList.toggle("ct-clean", !!on); applyWall(); applyScale();
    var d = document.getElementById("ct-dock");
    if(!d){ d = h("div", { id: "ct-dock" }); document.body.appendChild(d); }
    d.innerHTML = ""; var clk = h("b", { id: "ct-dock-clk", style: "font-variant-numeric:tabular-nums;" });
    d.appendChild(h("button", { class: "ct-btn pri", text: "🧰 工具箱", onclick: function(){ CT.openBox(); } }));
    d.appendChild(h("button", { class: "ct-btn", text: "A−", title: "字級縮小", onclick: function(){ CT.setScale(CT.scale - 0.1); } }));
    d.appendChild(h("button", { class: "ct-btn", text: "A＋", title: "字級放大", onclick: function(){ CT.setScale(CT.scale + 0.1); } }));
    d.appendChild(h("button", { class: "ct-btn", text: "🖼 桌布", onclick: function(){ CT.save("wall", (CT.load("wall", 0) + 1) % WALLS.length); applyWall(); } }));
    d.appendChild(clk);
    d.appendChild(h("button", { class: "ct-btn", text: "離開純淨桌面", onclick: function(){ CT.setClean(false); } }));
    if(CT._clk) clearInterval(CT._clk);
    function tick(){ var n = new Date(), e = document.getElementById("ct-dock-clk"); if(e) e.textContent = CT.pad(n.getHours()) + ":" + CT.pad(n.getMinutes()); }
    tick(); CT._clk = setInterval(tick, 10000);
  };
  CT.setScale = function(v){ CT.scale = Math.max(0.7, Math.min(2.4, Math.round(v * 10) / 10)); CT.save("scale", CT.scale); applyScale(); };
  CT.openBox = function(){
    CT.win("box", "🧰 課堂工具箱", 560, 520, function(bd, win){
      win.el.id = "ct-box"; bd.innerHTML = "";
      var top = h("div", { class: "ct-row" });
      top.appendChild(h("button", { class: "ct-btn pri", text: "🪟 一鍵純淨桌面", title: "隱藏平台其他畫面，只留下桌布和你開著的工具視窗", onclick: function(){ CT.setClean(true); } }));
      top.appendChild(h("span", { text: "字級" })); 
      var sc = h("input", { type: "range", min: "0.7", max: "2.4", step: "0.1", value: String(CT.scale), style: "width:110px;" }); sc.oninput = function(){ CT.setScale(Number(sc.value)); }; top.appendChild(sc);
      var ws = h("select", { class: "ct-inp" }); WALLS.forEach(function(w, i){ ws.appendChild(h("option", { value: String(i), text: "桌布：" + w[0] })); }); ws.value = String(CT.load("wall", 0) % WALLS.length);
      ws.onchange = function(){ CT.save("wall", Number(ws.value)); applyWall(); }; top.appendChild(ws);
      bd.appendChild(top);
      bd.appendChild(h("div", { class: "ct-muted", text: "所有資料只存在這台電腦的瀏覽器，不會上傳。視窗可以拖曳、拉右下角調整大小、按 — 縮小。" }));
      CT.cats.forEach(function(c){
        var list = CT.tools.filter(function(t){ return t.cat === c.id; }); if(!list.length) return;
        bd.appendChild(h("div", { class: "ct-cat", text: c.name }));
        var g = h("div", { class: "ct-grid" });
        list.forEach(function(t){ g.appendChild(h("button", { class: "ct-tool", type: "button", onclick: function(){ CT.open(t.id); } }, [h("b", { text: t.icon }), t.name])); });
        bd.appendChild(g);
      });
    });
  };
  CT.toggleBox = function(){ if(CT.wins.box) CT.wins.box.close(); else CT.openBox(); };
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
