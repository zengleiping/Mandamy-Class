/* 時間考程：計時器、視覺計時器、競賽碼錶、數位時鐘、月曆、功課表、四步驟流程表、考試日程倒數、重要日子倒數 */
(function(){
  "use strict"; var CT = window.CT, h = CT.h, pad = CT.pad;
  function mmss(ms){ var s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60); return pad(m) + ":" + pad(s % 60); }

  // ---- 倒數計時器 ----
  CT.add({ id: "timer", cat: "time", icon: "⏱️", name: "計時器", w: 380, h: 340, build: function(bd, win){
    var total = 5 * 60000, left = total, end = 0, run = false, tm = null, flash = false;
    var disp = h("div", { class: "ct-big ct-c", style: "font-size:4.4em;margin:6px 0;" }), msg = h("div", { class: "ct-c", style: "min-height:1.4em;font-weight:700;color:#C0623A;" });
    var presets = h("div", { class: "ct-row", style: "justify-content:center;" });
    [1, 3, 5, 10, 15, 30].forEach(function(m){ presets.appendChild(h("button", { class: "ct-btn", text: m + " 分", onclick: function(){ set(m * 60000); } })); });
    var adj = h("div", { class: "ct-row", style: "justify-content:center;" });
    [["−1分", -60000], ["−10秒", -10000], ["＋10秒", 10000], ["＋1分", 60000]].forEach(function(a){ adj.appendChild(h("button", { class: "ct-btn", text: a[0], onclick: function(){ set(Math.max(1000, total + a[1])); } })); });
    var go = h("button", { class: "ct-btn pri", text: "▶ 開始", onclick: toggle }), rs = h("button", { class: "ct-btn", text: "↺ 重設", onclick: function(){ set(total); } });
    var ctl = h("div", { class: "ct-row", style: "justify-content:center;" }, [go, rs]);
    bd.appendChild(disp); bd.appendChild(msg); bd.appendChild(ctl); bd.appendChild(presets); bd.appendChild(adj);
    function paint(){ disp.textContent = mmss(left); disp.style.color = left <= 0 ? "#B23B32" : left <= 10000 && run ? "#C0623A" : ""; go.textContent = run ? "⏸ 暫停" : "▶ 開始"; }
    function set(ms){ stop(); total = ms; left = ms; msg.textContent = ""; paint(); }
    function stop(){ run = false; if(tm){ clearInterval(tm); tm = null; } }
    function toggle(){
      if(run){ left = end - Date.now(); stop(); paint(); return; }
      if(left <= 0) left = total; CT.audio(); run = true; end = Date.now() + left; msg.textContent = "";
      tm = setInterval(function(){ left = end - Date.now(); if(left <= 0){ left = 0; stop(); msg.textContent = "⏰ 時間到！"; CT.beep(4); } paint(); }, 200); paint();
    }
    win.onClose(stop); paint();
  }});

  // ---- 視覺計時器（紅色扇形慢慢縮小）----
  CT.add({ id: "vtimer", cat: "time", icon: "🥧", name: "視覺計時器", w: 360, h: 440, build: function(bd, win){
    var total = 5 * 60000, left = total, end = 0, run = false, tm = null;
    var svg = h("div", { class: "ct-c" }), lab = h("div", { class: "ct-big ct-c", style: "font-size:2.2em;" });
    var mins = h("input", { type: "range", min: "1", max: "60", step: "1", value: "5", style: "width:60%;" }), ml = h("span", { text: "5 分鐘" });
    var go = h("button", { class: "ct-btn pri", text: "▶ 開始", onclick: toggle });
    bd.appendChild(svg); bd.appendChild(lab);
    bd.appendChild(h("div", { class: "ct-row", style: "justify-content:center;" }, [mins, ml]));
    bd.appendChild(h("div", { class: "ct-row", style: "justify-content:center;" }, [go, h("button", { class: "ct-btn", text: "↺ 重設", onclick: function(){ set(total); } })]));
    mins.oninput = function(){ ml.textContent = mins.value + " 分鐘"; set(Number(mins.value) * 60000); };
    function paint(){
      var f = Math.max(0, Math.min(1, left / total)), a = f * 2 * Math.PI, R = 100, x = 110 + R * Math.sin(a), y = 110 - R * Math.cos(a), big = f > 0.5 ? 1 : 0;
      var path = f >= 0.9999 ? '<circle cx="110" cy="110" r="100" fill="#E0524A"/>' : f <= 0 ? "" : '<path d="M110 110 L110 10 A100 100 0 ' + big + ' 1 ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' Z" fill="#E0524A"/>';
      var ticks = ""; for(var i = 0; i < 12; i++){ var t = i * Math.PI / 6; ticks += '<line x1="' + (110 + 100 * Math.sin(t)) + '" y1="' + (110 - 100 * Math.cos(t)) + '" x2="' + (110 + 90 * Math.sin(t)) + '" y2="' + (110 - 90 * Math.cos(t)) + '" stroke="#6b5b4b" stroke-width="2"/>'; }
      svg.innerHTML = '<svg viewBox="0 0 220 220" style="width:min(100%,260px);"><circle cx="110" cy="110" r="104" fill="#fff" stroke="#6b5b4b" stroke-width="4"/>' + path + ticks + '<circle cx="110" cy="110" r="5" fill="#6b5b4b"/></svg>';
      lab.textContent = left <= 0 ? "⏰ 時間到！" : mmss(left); go.textContent = run ? "⏸ 暫停" : "▶ 開始";
    }
    function stop(){ run = false; if(tm){ clearInterval(tm); tm = null; } }
    function set(ms){ stop(); total = ms; left = ms; paint(); }
    function toggle(){
      if(run){ left = end - Date.now(); stop(); paint(); return; }
      if(left <= 0) left = total; CT.audio(); run = true; end = Date.now() + left;
      tm = setInterval(function(){ left = end - Date.now(); if(left <= 0){ left = 0; stop(); CT.beep(4); } paint(); }, 200); paint();
    }
    win.onClose(stop); paint();
  }});

  // ---- 競賽碼錶 ----
  CT.add({ id: "stopwatch", cat: "time", icon: "⏲️", name: "競賽碼錶", w: 380, h: 420, build: function(bd, win){
    var t0 = 0, acc = 0, run = false, raf = 0, laps = [];
    var disp = h("div", { class: "ct-big ct-c", style: "font-size:3.6em;" }), list = h("ol", { style: "margin:6px 0;padding-left:1.6em;max-height:9em;overflow:auto;" });
    var go = h("button", { class: "ct-btn pri", text: "▶ 開始", onclick: toggle });
    bd.appendChild(disp);
    bd.appendChild(h("div", { class: "ct-row", style: "justify-content:center;" }, [go, h("button", { class: "ct-btn", text: "⚑ 計圈", onclick: lap }), h("button", { class: "ct-btn", text: "↺ 歸零", onclick: reset })]));
    bd.appendChild(list);
    function now(){ return acc + (run ? performance.now() - t0 : 0); }
    function fmt(ms){ var m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60, c = Math.floor(ms / 10) % 100; return pad(m) + ":" + pad(s) + "." + pad(c); }
    function loop(){ disp.textContent = fmt(now()); if(run) raf = requestAnimationFrame(loop); }
    function toggle(){ if(run){ acc = now(); run = false; cancelAnimationFrame(raf); go.textContent = "▶ 繼續"; loop(); } else { t0 = performance.now(); run = true; go.textContent = "⏸ 暫停"; loop(); } }
    function lap(){ if(!run && !acc) return; laps.push(now()); list.innerHTML = ""; laps.forEach(function(l, i){ list.appendChild(h("li", { text: fmt(l) + (i ? "　（＋" + fmt(l - laps[i - 1]) + "）" : "") })); }); }
    function reset(){ run = false; cancelAnimationFrame(raf); acc = 0; laps = []; list.innerHTML = ""; go.textContent = "▶ 開始"; loop(); }
    win.onClose(function(){ cancelAnimationFrame(raf); }); loop();
  }});

  // ---- 數位時鐘 ----
  CT.add({ id: "clock", cat: "time", icon: "🕒", name: "數位時鐘", w: 420, h: 250, build: function(bd, win){
    var is24 = CT.load("clock24", true), secs = CT.load("clocksec", true);
    var t = h("div", { class: "ct-big ct-c", style: "font-size:4.6em;" }), d = h("div", { class: "ct-c", style: "font-size:1.3em;" });
    var b24 = h("button", { class: "ct-btn", onclick: function(){ is24 = !is24; CT.save("clock24", is24); tick(); } }), bs = h("button", { class: "ct-btn", onclick: function(){ secs = !secs; CT.save("clocksec", secs); tick(); } });
    bd.appendChild(t); bd.appendChild(d); bd.appendChild(h("div", { class: "ct-row", style: "justify-content:center;" }, [b24, bs]));
    var W = ["日", "一", "二", "三", "四", "五", "六"];
    function tick(){ var n = new Date(), hr = n.getHours(), ap = ""; if(!is24){ ap = hr < 12 ? "上午 " : "下午 "; hr = hr % 12 || 12; }
      t.textContent = ap + (is24 ? pad(hr) : hr) + ":" + pad(n.getMinutes()) + (secs ? ":" + pad(n.getSeconds()) : ""); d.textContent = n.getFullYear() + " 年 " + (n.getMonth() + 1) + " 月 " + n.getDate() + " 日　星期" + W[n.getDay()];
      b24.textContent = is24 ? "24 小時制" : "12 小時制"; bs.textContent = secs ? "顯示秒" : "隱藏秒"; }
    var iv = setInterval(tick, 500); win.onClose(function(){ clearInterval(iv); }); tick();
  }});

  // ---- 月曆 ----
  CT.add({ id: "calendar", cat: "time", icon: "📅", name: "月曆", w: 430, h: 420, build: function(bd, win){
    var cur = new Date(); cur.setDate(1); var sel = null;
    var head = h("div", { class: "ct-row", style: "justify-content:space-between;" }), grid = h("div", { style: "display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center;" });
    bd.appendChild(head); bd.appendChild(grid);
    function draw(){
      head.innerHTML = ""; head.appendChild(h("button", { class: "ct-btn", text: "◀", onclick: function(){ cur.setMonth(cur.getMonth() - 1); draw(); } }));
      head.appendChild(h("b", { style: "font-size:1.3em;", text: cur.getFullYear() + " 年 " + (cur.getMonth() + 1) + " 月" }));
      head.appendChild(h("button", { class: "ct-btn", text: "今天", onclick: function(){ cur = new Date(); cur.setDate(1); draw(); } }));
      head.appendChild(h("button", { class: "ct-btn", text: "▶", onclick: function(){ cur.setMonth(cur.getMonth() + 1); draw(); } }));
      grid.innerHTML = ""; ["日", "一", "二", "三", "四", "五", "六"].forEach(function(w, i){ grid.appendChild(h("div", { style: "font-weight:700;color:" + (i === 0 || i === 6 ? "#B23B32" : "#6b5b4b") + ";", text: w })); });
      var first = cur.getDay(), days = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate(), today = new Date();
      for(var i = 0; i < first; i++) grid.appendChild(h("div"));
      for(var d = 1; d <= days; d++){ (function(d){
        var isT = today.getFullYear() === cur.getFullYear() && today.getMonth() === cur.getMonth() && today.getDate() === d, key = cur.getFullYear() + "-" + cur.getMonth() + "-" + d;
        var wk = (first + d - 1) % 7, c = h("div", { style: "padding:.55em 0;border-radius:10px;cursor:pointer;font-size:1.15em;" + (isT ? "background:#C0623A;color:#fff;font-weight:800;" : sel === key ? "background:#FDECE6;border:2px solid #C0623A;" : "background:#faf5ee;") + (!isT && (wk === 0 || wk === 6) ? "color:#B23B32;" : ""), text: String(d), onclick: function(){ sel = key; draw(); } }); grid.appendChild(c); })(d);
      }
    }
    draw();
  }});

  // ---- 功課表（每週課表，可自己填）----
  CT.add({ id: "timetable", cat: "time", icon: "🗓️", name: "功課表", w: 620, h: 460, build: function(bd, win){
    var def = { rows: ["第一節", "第二節", "第三節", "第四節", "午休", "第五節", "第六節", "第七節"], cells: {} };
    var data = CT.load("timetable", def, true);
    var tbl = h("table", { style: "width:100%;border-collapse:collapse;table-layout:fixed;" }); bd.appendChild(tbl);
    bd.appendChild(h("div", { class: "ct-muted", text: "直接點格子打字；每個班級各自記住。" }));
    function save(){ CT.save("timetable", data, true); }
    var tr = h("tr"); tr.appendChild(h("th", { style: "width:5.5em;" })); ["一", "二", "三", "四", "五"].forEach(function(d){ tr.appendChild(h("th", { style: "padding:.4em;background:#f5ebdf;border:1px solid #d9c9b5;", text: "週" + d })); }); tbl.appendChild(tr);
    data.rows.forEach(function(r, ri){
      var row = h("tr"), th = h("td", { contenteditable: "true", style: "padding:.3em;border:1px solid #d9c9b5;background:#f5ebdf;font-weight:700;text-align:center;", text: r });
      th.oninput = function(){ data.rows[ri] = th.textContent; save(); }; row.appendChild(th);
      for(var d = 0; d < 5; d++){ (function(d){ var k = ri + "_" + d, td = h("td", { contenteditable: "true", style: "padding:.3em;border:1px solid #d9c9b5;text-align:center;height:2.6em;word-break:break-all;", text: data.cells[k] || "" }); td.oninput = function(){ data.cells[k] = td.textContent; save(); }; row.appendChild(td); })(d); }
      tbl.appendChild(row);
    });
  }});

  // ---- 四步驟流程表 ----
  CT.add({ id: "flow", cat: "time", icon: "🪜", name: "四步驟流程表", w: 400, h: 400, build: function(bd, win){
    var steps = CT.load("flow_steps", ["預習／暖身", "講解新知", "練習活動", "總結回顧"], true), act = CT.load("flow_act", 0, true), edit = false;
    var box = h("div"); bd.appendChild(box);
    function draw(){
      box.innerHTML = "";
      if(edit){
        var ta = h("textarea", { class: "ct-inp", rows: String(Math.max(4, steps.length)), style: "width:100%;box-sizing:border-box;", text: steps.join("\n") });
        box.appendChild(ta); box.appendChild(h("div", { class: "ct-row" }, [h("button", { class: "ct-btn pri", text: "完成", onclick: function(){ steps = ta.value.split("\n").map(function(s){ return s.trim(); }).filter(Boolean); if(!steps.length) steps = ["步驟一"]; act = Math.min(act, steps.length - 1); CT.save("flow_steps", steps, true); edit = false; draw(); } }), h("span", { class: "ct-muted", text: "一行一個步驟" })]));
        return;
      }
      steps.forEach(function(s, i){
        box.appendChild(h("div", { style: "display:flex;align-items:center;gap:.6em;padding:.7em .8em;margin:6px 0;border-radius:12px;cursor:pointer;font-size:1.25em;border:2px solid " + (i === act ? "#C0623A" : "#e3d6c5") + ";background:" + (i === act ? "#FDECE6" : i < act ? "#eef6ea" : "#fff") + ";" + (i < act ? "opacity:.7;" : ""), onclick: function(){ act = i; CT.save("flow_act", act, true); draw(); } },
          [h("b", { style: "display:inline-flex;width:1.7em;height:1.7em;border-radius:50%;align-items:center;justify-content:center;color:#fff;background:" + (i === act ? "#C0623A" : i < act ? "#5a9a5a" : "#b9a68f") + ";", text: i < act ? "✓" : String(i + 1) }), h("span", { style: i === act ? "font-weight:800;" : "", text: s })]));
      });
      box.appendChild(h("div", { class: "ct-row" }, [h("button", { class: "ct-btn", text: "▶ 下一步", onclick: function(){ act = Math.min(steps.length - 1, act + 1); CT.save("flow_act", act, true); draw(); } }), h("button", { class: "ct-btn", text: "↺ 從頭", onclick: function(){ act = 0; CT.save("flow_act", act, true); draw(); } }), h("button", { class: "ct-btn", text: "✎ 編輯步驟", onclick: function(){ edit = true; draw(); } })]));
    }
    draw();
  }});

  // ---- 倒數日（考試／重要日子共用）----
  function countdownTool(id, icon, name, key, defTitle){
    CT.add({ id: id, cat: "time", icon: icon, name: name, w: 430, h: 420, build: function(bd, win){
      var list = CT.load(key, [], true), box = h("div");
      var ti = h("input", { class: "ct-inp", placeholder: defTitle, style: "flex:1;" }), di = h("input", { class: "ct-inp", type: "date" });
      bd.appendChild(h("div", { class: "ct-row" }, [ti, di, h("button", { class: "ct-btn pri", text: "＋ 新增", onclick: function(){ if(!ti.value.trim() || !di.value){ CT.toast("請輸入名稱和日期"); return; } list.push({ t: ti.value.trim(), d: di.value }); CT.save(key, list, true); ti.value = ""; draw(); } })]));
      bd.appendChild(box);
      function days(d){ var a = new Date(d + "T00:00:00"), n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((a - n) / 86400000); }
      function draw(){
        box.innerHTML = ""; var s = list.map(function(x, i){ return { x: x, i: i, n: days(x.d) }; }).sort(function(a, b){ return (a.n < 0) - (b.n < 0) || Math.abs(a.n) - Math.abs(b.n); });
        if(!s.length) box.appendChild(h("div", { class: "ct-muted ct-c", style: "padding:2em 0;", text: "還沒有資料，上面輸入名稱和日期後按「新增」。" }));
        s.forEach(function(o){
          var n = o.n, big = n === 0 ? "今天！" : n > 0 ? "還有 " + n + " 天" : "已過 " + (-n) + " 天";
          box.appendChild(h("div", { style: "display:flex;align-items:center;gap:.6em;padding:.6em .8em;margin:6px 0;border-radius:12px;background:" + (n === 0 ? "#FDECE6" : n > 0 && n <= 7 ? "#FFF3D6" : "#faf5ee") + ";" + (n < 0 ? "opacity:.55;" : "") },
            [h("div", { style: "flex:1;" }, [h("b", { style: "font-size:1.15em;", text: o.x.t }), h("div", { class: "ct-muted", text: o.x.d })]), h("b", { style: "font-size:1.5em;color:" + (n >= 0 ? "#C0623A" : "#8a7a6a") + ";", text: big }), h("button", { class: "ct-btn", text: "✕", title: "刪除", onclick: function(){ list.splice(o.i, 1); CT.save(key, list, true); draw(); } })]));
        });
      }
      draw();
    }});
  }
  countdownTool("exam", "📝", "考試日程倒數", "exams", "例如：期中考");
  countdownTool("days", "🎉", "重要日子倒數", "days", "例如：校慶、旅行");
})();
