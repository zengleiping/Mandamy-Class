/* 互動激勵：幸運抽籤、隨機分組、小組記分板、個人榮譽榜、3D 骰子、3D 金幣翻轉、剪刀石頭布、拖曳蓋章貼紙 */
(function(){
  "use strict"; var CT = window.CT, h = CT.h;

  CT.add({ id: "draw", cat: "fun", icon: "🎡", name: "幸運抽籤", open: function(){ if(CT.ctx().openDraw) CT.ctx().openDraw(); else CT.toast("請先進到一個班級再使用抽籤"); } });

  // ---- 隨機分組 ----
  CT.add({ id: "groups", cat: "fun", icon: "👥", name: "隨機分組", w: 560, h: 520, build: function(bd, win){
    var names = [], absent = CT.load("grp_absent", {}, true), mode = "n", num = 4, result = null;
    var chips = h("div", { class: "ct-row" }), out = h("div", { style: "display:grid;grid-template-columns:repeat(auto-fill,minmax(9em,1fr));gap:8px;margin-top:8px;" });
    var sel = h("select", { class: "ct-inp" }, [h("option", { value: "n", text: "分成幾組" }), h("option", { value: "s", text: "每組幾人" })]), ni = h("input", { class: "ct-inp", type: "number", min: "1", max: "30", value: String(num), style: "width:4.5em;" });
    sel.onchange = function(){ mode = sel.value; }; ni.oninput = function(){ num = Math.max(1, Number(ni.value) || 1); };
    bd.appendChild(h("div", { class: "ct-row" }, [sel, ni, h("button", { class: "ct-btn pri", text: "🎲 分組", onclick: go }), h("button", { class: "ct-btn", text: "📋 複製", onclick: copy })]));
    bd.appendChild(h("div", { class: "ct-muted", text: "點名字＝今天沒來（不分進組裡）" })); bd.appendChild(chips); bd.appendChild(out);
    CT.roster().then(function(r){ names = r.map(String).filter(Boolean); if(!names.length) out.textContent = "這個班還沒有學生名單，請先到班級的「學生」分頁加入名單。"; drawChips(); });
    function drawChips(){ chips.innerHTML = ""; names.forEach(function(n){ chips.appendChild(h("span", { style: "padding:.2em .7em;border-radius:99px;border:1.5px solid #d9c9b5;cursor:pointer;background:" + (absent[n] ? "#eee" : "#fff") + ";" + (absent[n] ? "text-decoration:line-through;opacity:.5;" : ""), text: n, onclick: function(){ absent[n] = !absent[n]; CT.save("grp_absent", absent, true); drawChips(); } })); }); }
    function go(){
      var pool = CT.shuffle(names.filter(function(n){ return !absent[n]; })); if(!pool.length){ CT.toast("沒有可以分組的學生"); return; }
      var k = mode === "n" ? Math.min(num, pool.length) : Math.max(1, Math.ceil(pool.length / num)); result = []; for(var i = 0; i < k; i++) result.push([]);
      pool.forEach(function(n, i){ result[i % k].push(n); }); show();
    }
    function show(){
      out.innerHTML = ""; (result || []).forEach(function(g, i){ out.appendChild(h("div", { style: "border:2px solid #d9c9b5;border-radius:12px;padding:.5em .7em;background:#fffaf2;" }, [h("b", { style: "color:#C0623A;", text: "第 " + (i + 1) + " 組" })].concat(g.map(function(n){ return h("div", { text: n }); })))); });
    }
    function copy(){ if(!result) return; var t = result.map(function(g, i){ return "第" + (i + 1) + "組：" + g.join("、"); }).join("\n"); try{ navigator.clipboard.writeText(t); CT.toast("已複製分組結果"); }catch(e){} }
  }});

  // ---- 小組記分板 ----
  CT.add({ id: "teamscore", cat: "fun", icon: "🏆", name: "小組記分板", w: 560, h: 400, build: function(bd, win){
    var d = CT.load("team", { n: 4, names: [], pts: [], step: 1 }, true), box = h("div", { style: "display:grid;grid-template-columns:repeat(auto-fill,minmax(8.5em,1fr));gap:10px;" });
    var colors = ["#E0524A", "#2F86C1", "#4CAF6A", "#E0A82E", "#8E5BB5", "#E07B39", "#2AA8A8", "#C94F8A"];
    var ni = h("input", { class: "ct-inp", type: "number", min: "2", max: "12", value: String(d.n), style: "width:4em;" }), step = h("select", { class: "ct-inp" }); [1, 2, 5, 10].forEach(function(s){ step.appendChild(h("option", { value: String(s), text: "每次 ±" + s })); }); step.value = String(d.step);
    ni.onchange = function(){ d.n = Math.max(2, Math.min(12, Number(ni.value) || 4)); save(); draw(); }; step.onchange = function(){ d.step = Number(step.value); save(); };
    bd.appendChild(h("div", { class: "ct-row" }, [h("span", { text: "組數" }), ni, step, h("button", { class: "ct-btn", text: "分數歸零", onclick: function(){ if(confirm("全部歸零？")){ d.pts = []; save(); draw(); } } })]));
    bd.appendChild(box);
    function save(){ CT.save("team", d, true); }
    function draw(){
      box.innerHTML = ""; var mx = Math.max.apply(null, [0].concat(d.pts.slice(0, d.n).map(Number)));
      for(var i = 0; i < d.n; i++){ (function(i){
        var pts = d.pts[i] || 0, nm = h("div", { contenteditable: "true", style: "font-weight:800;text-align:center;outline:none;", text: d.names[i] || "第 " + (i + 1) + " 組" }); nm.oninput = function(){ d.names[i] = nm.textContent; save(); };
        var sc = h("div", { class: "ct-big ct-c", style: "font-size:3em;color:" + colors[i % 8] + ";", text: String(pts) });
        function chg(v){ d.pts[i] = (d.pts[i] || 0) + v; save(); draw(); }
        box.appendChild(h("div", { style: "border:3px solid " + colors[i % 8] + ";border-radius:14px;padding:.5em;background:#fff;" + (pts === mx && mx > 0 ? "box-shadow:0 0 0 3px #FFD76A;" : "") }, [nm, sc, h("div", { class: "ct-row", style: "justify-content:center;" }, [h("button", { class: "ct-btn", style: "font-size:1.3em;width:2.2em;", text: "−", onclick: function(){ chg(-d.step); } }), h("button", { class: "ct-btn pri", style: "font-size:1.3em;width:2.2em;", text: "＋", onclick: function(){ chg(d.step); } })])]));
      })(i); }
    }
    draw();
  }});

  // ---- 個人榮譽榜 ----
  CT.add({ id: "honor", cat: "fun", icon: "🌟", name: "個人榮譽榜", w: 520, h: 520, build: function(bd, win){
    var pts = CT.load("honor", {}, true), names = [], box = h("div"), sortOn = true;
    var bs = h("button", { class: "ct-btn on", text: "依星星排序", onclick: function(){ sortOn = !sortOn; bs.classList.toggle("on", sortOn); draw(); } });
    bd.appendChild(h("div", { class: "ct-row" }, [bs, h("button", { class: "ct-btn", text: "全部歸零", onclick: function(){ if(confirm("全部星星歸零？")){ pts = {}; save(); draw(); } } })]));
    bd.appendChild(box);
    CT.roster().then(function(r){ names = r.map(String).filter(Boolean); if(!names.length) box.textContent = "這個班還沒有學生名單，請先到班級的「學生」分頁加入名單。"; else draw(); });
    function save(){ CT.save("honor", pts, true); }
    function draw(){
      box.innerHTML = ""; var list = names.slice(); if(sortOn) list.sort(function(a, b){ return (pts[b] || 0) - (pts[a] || 0); });
      var medals = ["🥇", "🥈", "🥉"];
      list.forEach(function(n, i){ var p = pts[n] || 0;
        box.appendChild(h("div", { style: "display:flex;align-items:center;gap:.5em;padding:.35em .6em;margin:4px 0;border-radius:10px;background:" + (sortOn && i < 3 && p > 0 ? "#FFF3D6" : "#faf5ee") + ";" }, [
          h("span", { style: "width:1.8em;text-align:center;", text: sortOn && i < 3 && p > 0 ? medals[i] : "" }), h("b", { style: "flex:1;", text: n }), h("span", { style: "min-width:5em;text-align:right;color:#E0A82E;font-size:1.1em;", text: p > 0 ? (p <= 8 ? "⭐".repeat(p) : "⭐×" + p) : "" }),
          h("button", { class: "ct-btn", text: "−", onclick: function(){ pts[n] = Math.max(0, (pts[n] || 0) - 1); save(); draw(); } }), h("button", { class: "ct-btn pri", text: "＋", onclick: function(){ pts[n] = (pts[n] || 0) + 1; save(); draw(); } })]));
      });
    }
  }});

  // ---- 3D 骰子 ----
  CT.add({ id: "dice", cat: "fun", icon: "🎲", name: "3D 骰子", w: 460, h: 400, build: function(bd, win){
    var count = CT.load("dice_n", 2), cubes = [], sum = h("div", { class: "ct-big ct-c", style: "font-size:2.4em;" }), stage = h("div", { style: "display:flex;gap:1.4em;justify-content:center;flex-wrap:wrap;perspective:900px;min-height:7em;padding:1em 0;" });
    var PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }, TR = { 1: "rotateX(0) rotateY(0)", 6: "rotateY(180deg)", 2: "rotateY(-90deg)", 5: "rotateY(90deg)", 3: "rotateX(-90deg)", 4: "rotateX(90deg)" };
    var S = 5.2, FACES = [[1, "rotateY(0)"], [6, "rotateY(180deg)"], [2, "rotateY(90deg)"], [5, "rotateY(-90deg)"], [3, "rotateX(90deg)"], [4, "rotateX(-90deg)"]];
    function mk(){ var cube = h("div", { style: "width:" + S + "em;height:" + S + "em;position:relative;transform-style:preserve-3d;transition:transform 1.2s cubic-bezier(.2,.8,.3,1);" });
      FACES.forEach(function(f){ var face = h("div", { style: "position:absolute;inset:0;background:#fff;border:2px solid #444;border-radius:.6em;display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:.5em;box-sizing:border-box;transform:" + f[1] + " translateZ(" + (S / 2) + "em);backface-visibility:hidden;" });
        for(var i = 0; i < 9; i++) face.appendChild(h("i", { style: "place-self:center;width:.95em;height:.95em;border-radius:50%;background:" + (PIPS[f[0]].indexOf(i) >= 0 ? (f[0] === 1 ? "#C0392B" : "#222") : "transparent") + ";" }));
        cube.appendChild(face); });
      cube.style.transform = TR[1]; return cube; }
    var cnt = h("select", { class: "ct-inp" }); for(var i = 1; i <= 6; i++) cnt.appendChild(h("option", { value: String(i), text: i + " 顆" })); cnt.value = String(count);
    cnt.onchange = function(){ count = Number(cnt.value); CT.save("dice_n", count); build(); };
    bd.appendChild(h("div", { class: "ct-row", style: "justify-content:center;" }, [cnt, h("button", { class: "ct-btn pri", style: "font-size:1.2em;", text: "🎲 擲骰子", onclick: roll })])); bd.appendChild(stage); bd.appendChild(sum);
    var spin = 0;
    function build(){ stage.innerHTML = ""; cubes = []; for(var i = 0; i < count; i++){ var c = mk(); cubes.push(c); stage.appendChild(h("div", { style: "width:" + S + "em;height:" + S + "em;" }, [c])); } sum.textContent = ""; }
    function roll(){ spin++; var tot = 0; cubes.forEach(function(c){ var v = 1 + Math.floor(Math.random() * 6); tot += v; c.style.transform = "rotateX(" + (spin * 720) + "deg) rotateY(" + (spin * 720) + "deg) " + TR[v]; }); setTimeout(function(){ sum.textContent = count > 1 ? "合計 " + tot : "點數 " + tot; }, 1200); sum.textContent = ""; }
    build();
  }});

  // ---- 3D 金幣翻轉 ----
  CT.add({ id: "coin", cat: "fun", icon: "🪙", name: "3D 金幣翻轉", w: 380, h: 400, build: function(bd, win){
    var turns = 0, face = 0, res = h("div", { class: "ct-big ct-c", style: "font-size:2.4em;min-height:1.3em;" });
    var coin = h("div", { style: "width:8em;height:8em;position:relative;transform-style:preserve-3d;transition:transform 1.4s cubic-bezier(.2,.8,.3,1);" });
    function side(txt, rot, bg){ return h("div", { style: "position:absolute;inset:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:3.6em;font-weight:800;color:#8a5a00;border:.25em solid #E0A82E;box-sizing:border-box;background:" + bg + ";backface-visibility:hidden;transform:" + rot + ";", text: txt }); }
    coin.appendChild(side("正", "rotateY(0)", "radial-gradient(circle at 35% 30%,#FFF1A8,#F2C94C 60%,#D9A21E)")); coin.appendChild(side("反", "rotateY(180deg)", "radial-gradient(circle at 35% 30%,#FFF1A8,#F2C94C 60%,#D9A21E)"));
    var stage = h("div", { style: "display:flex;justify-content:center;perspective:900px;padding:1.4em 0;" }, [coin]);
    bd.appendChild(stage); bd.appendChild(res); bd.appendChild(h("div", { class: "ct-row", style: "justify-content:center;" }, [h("button", { class: "ct-btn pri", style: "font-size:1.2em;", text: "🪙 擲硬幣", onclick: flip })]));
    function flip(){ var r = Math.random() < 0.5 ? 0 : 1; turns += 5; face = r; coin.style.transform = "rotateY(" + (turns * 360 + r * 180) + "deg)"; res.textContent = ""; setTimeout(function(){ res.textContent = r ? "反面" : "正面"; }, 1400); }
  }});

  // ---- 剪刀石頭布 ----
  CT.add({ id: "rps", cat: "fun", icon: "✊", name: "剪刀石頭布", w: 460, h: 360, build: function(bd, win){
    var E = ["✌️", "✊", "🖐️"], L = h("div", { class: "ct-c", style: "font-size:5em;flex:1;", text: "❓" }), R = h("div", { class: "ct-c", style: "font-size:5em;flex:1;", text: "❓" }), msg = h("div", { class: "ct-c", style: "font-size:1.6em;font-weight:800;min-height:1.4em;color:#C0623A;" }), busy = false;
    bd.appendChild(h("div", { style: "display:flex;" }, [h("div", { class: "ct-c", style: "flex:1;font-weight:700;", text: "左邊" }), h("div", { class: "ct-c", style: "flex:1;font-weight:700;", text: "右邊" })])); bd.appendChild(h("div", { style: "display:flex;" }, [L, R])); bd.appendChild(msg);
    bd.appendChild(h("div", { class: "ct-row", style: "justify-content:center;" }, [h("button", { class: "ct-btn pri", style: "font-size:1.2em;", text: "✊ 開始！", onclick: go })]));
    function go(){ if(busy) return; busy = true; msg.textContent = "剪刀…石頭…布！"; var n = 0, iv = setInterval(function(){ L.textContent = E[Math.floor(Math.random() * 3)]; R.textContent = E[Math.floor(Math.random() * 3)]; if(++n > 14){ clearInterval(iv); var a = Math.floor(Math.random() * 3), b = Math.floor(Math.random() * 3); L.textContent = E[a]; R.textContent = E[b]; msg.textContent = a === b ? "平手！再一次" : ((a - b + 3) % 3 === 2 ? "左邊贏！" : "右邊贏！"); busy = false; } }, 90); }
  }});

  // ---- 拖曳蓋章獎勵貼紙：從視窗把貼紙拖到畫面任何地方；雙擊貼紙移除 ----
  CT.add({ id: "stamp", cat: "fun", icon: "🏅", name: "拖曳蓋章貼紙", w: 420, h: 300, build: function(bd, win){
    var S = ["⭐", "🌟", "👍", "💯", "🎉", "❤️", "🏆", "🥇", "🌈", "🦄", "🐶", "🐱", "🍎", "✅", "🔥", "😀"];
    var size = CT.load("stamp_size", 56), grid = h("div", { style: "display:grid;grid-template-columns:repeat(8,1fr);gap:4px;" });
    S.forEach(function(s){ var b = h("div", { style: "font-size:2em;text-align:center;cursor:grab;user-select:none;touch-action:none;padding:.1em;border-radius:8px;background:#faf5ee;", text: s });
      b.addEventListener("pointerdown", function(e){ e.preventDefault(); drag(e, s); }); grid.appendChild(b); });
    var sz = h("input", { type: "range", min: "30", max: "160", value: String(size), style: "flex:1;" }); sz.oninput = function(){ size = Number(sz.value); CT.save("stamp_size", size); };
    bd.appendChild(h("div", { class: "ct-muted", text: "把貼紙拖到畫面上想貼的地方；貼好後還可以再拖動，連點兩下移除。" })); bd.appendChild(grid);
    bd.appendChild(h("div", { class: "ct-row" }, [h("span", { text: "大小" }), sz, h("button", { class: "ct-btn", text: "清除全部貼紙", onclick: function(){ var l = CT.layer(); [].slice.call(l.querySelectorAll(".ct-stamp")).forEach(function(x){ x.remove(); }); } })]));
    function drag(e, s){
      var el = h("div", { class: "ct-stamp", text: s, style: "font-size:" + size + "px;z-index:" + (++CT.z) + ";left:" + (e.clientX - size / 2) + "px;top:" + (e.clientY - size / 2) + "px;" }); CT.layer().appendChild(el);
      CT.makeDraggable(el); el.ondblclick = function(){ el.remove(); };
      function mv(ev){ el.style.left = (ev.clientX - size / 2) + "px"; el.style.top = (ev.clientY - size / 2) + "px"; }
      function up(){ document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }
      document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
    }
  }});
})();
