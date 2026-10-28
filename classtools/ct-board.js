/* 板書多媒體：塗鴉白板、聯絡簿、跑馬燈、便利貼、圖片展示、PDF 電子書、QR Code、教學捷徑、影片、網頁嵌入、實物投影相機 */
(function(){
  "use strict"; var CT = window.CT, h = CT.h, pad = CT.pad;

  // ---- 全功能塗鴉白板 ----
  CT.add({ id: "paint", cat: "board", icon: "🖍️", name: "塗鴉白板", w: 760, h: 540, build: function(bd, win){
    bd.style.cssText += "display:flex;flex-direction:column;padding:6px;";
    var color = "#222222", size = 4, tool = "pen", bg = "#ffffff", undo = [], drawing = false, last = null;
    var cv = h("canvas", { style: "flex:1;min-height:0;width:100%;border:1.5px solid #d9c9b5;border-radius:10px;touch-action:none;background:#fff;cursor:crosshair;" }), ctx2 = null;
    var bar = h("div", { class: "ct-row", style: "margin:0 0 6px;" });
    ["#222222", "#E0524A", "#2F86C1", "#4CAF6A", "#E0A82E", "#8E5BB5", "#ffffff"].forEach(function(c){ bar.appendChild(h("button", { style: "width:1.8em;height:1.8em;border-radius:50%;border:2px solid #999;cursor:pointer;background:" + c + ";", title: c, onclick: function(){ color = c; tool = "pen"; mark(); } })); });
    var sz = h("input", { type: "range", min: "1", max: "40", value: String(size), style: "width:90px;" }); sz.oninput = function(){ size = Number(sz.value); };
    var bPen = h("button", { class: "ct-btn on", text: "✏️ 畫筆", onclick: function(){ tool = "pen"; mark(); } }), bEr = h("button", { class: "ct-btn", text: "🧽 橡皮擦", onclick: function(){ tool = "eraser"; mark(); } });
    var bgs = h("select", { class: "ct-inp" }, [h("option", { value: "#ffffff", text: "白底" }), h("option", { value: "#1f3a2f", text: "黑板" }), h("option", { value: "#fff9d6", text: "米黃" }), h("option", { value: "grid", text: "方格" })]);
    bar.appendChild(sz); bar.appendChild(bPen); bar.appendChild(bEr); bar.appendChild(h("button", { class: "ct-btn", text: "↶ 復原", onclick: undoOne })); bar.appendChild(h("button", { class: "ct-btn", text: "🗑 清除", onclick: function(){ push(); fillBg(); } })); bar.appendChild(bgs); bar.appendChild(h("button", { class: "ct-btn", text: "💾 存圖", onclick: save }));
    bd.appendChild(bar); bd.appendChild(cv);
    function mark(){ bPen.classList.toggle("on", tool === "pen"); bEr.classList.toggle("on", tool === "eraser"); }
    function fit(){ var r = cv.getBoundingClientRect(), keep = ctx2 ? cv.toDataURL() : null; var w = Math.max(200, Math.round(r.width)), hh = Math.max(120, Math.round(r.height)); if(cv.width === w && cv.height === hh) return; cv.width = w; cv.height = hh; ctx2 = cv.getContext("2d"); fillBg(); if(keep){ var im = new Image(); im.onload = function(){ ctx2.drawImage(im, 0, 0); }; im.src = keep; } }
    function fillBg(){ ctx2.fillStyle = bg === "grid" ? "#fff" : bg; ctx2.fillRect(0, 0, cv.width, cv.height); if(bg === "grid"){ ctx2.strokeStyle = "#cfd8e3"; ctx2.lineWidth = 1; for(var x = 0; x < cv.width; x += 30){ ctx2.beginPath(); ctx2.moveTo(x, 0); ctx2.lineTo(x, cv.height); ctx2.stroke(); } for(var y = 0; y < cv.height; y += 30){ ctx2.beginPath(); ctx2.moveTo(0, y); ctx2.lineTo(cv.width, y); ctx2.stroke(); } } }
    bgs.onchange = function(){ bg = bgs.value; push(); fillBg(); };
    function push(){ try{ undo.push(ctx2.getImageData(0, 0, cv.width, cv.height)); if(undo.length > 25) undo.shift(); }catch(e){} }
    function undoOne(){ var s = undo.pop(); if(s) ctx2.putImageData(s, 0, 0); }
    function pos(e){ var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; }
    cv.addEventListener("pointerdown", function(e){ e.preventDefault(); cv.setPointerCapture(e.pointerId); push(); drawing = true; last = pos(e); dot(last); });
    cv.addEventListener("pointermove", function(e){ if(!drawing) return; var p = pos(e); ctx2.strokeStyle = tool === "eraser" ? (bg === "grid" ? "#fff" : bg) : color; ctx2.lineWidth = tool === "eraser" ? size * 3 : size; ctx2.lineCap = "round"; ctx2.lineJoin = "round"; ctx2.beginPath(); ctx2.moveTo(last[0], last[1]); ctx2.lineTo(p[0], p[1]); ctx2.stroke(); last = p; });
    function end(){ drawing = false; } cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    function dot(p){ ctx2.fillStyle = tool === "eraser" ? (bg === "grid" ? "#fff" : bg) : color; ctx2.beginPath(); ctx2.arc(p[0], p[1], (tool === "eraser" ? size * 3 : size) / 2, 0, 7); ctx2.fill(); }
    function save(){ var a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = "白板-" + Date.now() + ".png"; document.body.appendChild(a); a.click(); a.remove(); }
    win.onResize = fit; setTimeout(fit, 30);
  }});

  // ---- 聯絡簿（可一鍵複製貼到 LINE）----
  CT.add({ id: "contact", cat: "board", icon: "📒", name: "聯絡簿", w: 460, h: 480, build: function(bd, win){
    var d = CT.load("contact", { text: "", items: [] }, true), W = ["日", "一", "二", "三", "四", "五", "六"];
    var n = new Date(), date = (n.getMonth() + 1) + "/" + n.getDate() + "（" + W[n.getDay()] + "）";
    var ta = h("textarea", { class: "ct-inp", style: "width:100%;box-sizing:border-box;flex:1;min-height:9em;font-size:1.05em;line-height:1.6;", placeholder: "寫今天的功課、通知…（一行一項）", text: d.text || "" });
    ta.oninput = function(){ d.text = ta.value; CT.save("contact", d, true); };
    bd.style.cssText += "display:flex;flex-direction:column;";
    bd.appendChild(h("div", { class: "ct-row" }, [h("b", { text: "📒 " + date }), h("button", { class: "ct-btn", text: "① 自動編號", onclick: numberIt }), h("button", { class: "ct-btn", text: "清空", onclick: function(){ if(confirm("清空今天的聯絡簿？")){ ta.value = ""; ta.oninput(); } } })]));
    bd.appendChild(ta);
    bd.appendChild(h("div", { class: "ct-row" }, [h("button", { class: "ct-btn pri", text: "📋 複製（貼到 LINE 群組）", onclick: copy }), h("span", { class: "ct-muted", text: "會自動加上日期標題" })]));
    function lines(){ return ta.value.split("\n").map(function(s){ return s.replace(/^\s*(\d+[\.、)]|[①-⑩])\s*/, "").trim(); }).filter(Boolean); }
    function numberIt(){ var c = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"]; ta.value = lines().map(function(s, i){ return (c[i] || (i + 1) + ".") + " " + s; }).join("\n"); ta.oninput(); }
    function copy(){ var t = "📒 聯絡簿 " + date + "\n" + ta.value.trim(); try{ navigator.clipboard.writeText(t); CT.toast("已複製，可以貼到 LINE 了"); }catch(e){ ta.select(); document.execCommand("copy"); CT.toast("已複製"); } }
  }});

  // ---- 跑馬燈廣播 ----
  var marq = null;
  CT.add({ id: "marquee", cat: "board", icon: "📣", name: "跑馬燈廣播", w: 420, h: 300, build: function(bd, win){
    var d = CT.load("marq", { text: "同學們請坐好，準備上課！", speed: 12, color: "#C0392B", bg: "#FFF3D6", pos: "top" });
    var ti = h("input", { class: "ct-inp", style: "width:100%;box-sizing:border-box;", value: d.text }), sp = h("input", { type: "range", min: "5", max: "30", value: String(31 - d.speed), style: "flex:1;" });
    var col = h("input", { type: "color", value: d.color }), bgc = h("input", { type: "color", value: d.bg }), ps = h("select", { class: "ct-inp" }, [h("option", { value: "top", text: "顯示在上方" }), h("option", { value: "bottom", text: "顯示在下方" })]); ps.value = d.pos;
    bd.appendChild(ti); bd.appendChild(h("div", { class: "ct-row" }, [h("span", { text: "速度" }), sp])); bd.appendChild(h("div", { class: "ct-row" }, [h("span", { text: "字色" }), col, h("span", { text: "底色" }), bgc, ps]));
    bd.appendChild(h("div", { class: "ct-row" }, [h("button", { class: "ct-btn pri", text: "▶ 開始播放", onclick: play }), h("button", { class: "ct-btn", text: "⏹ 停止", onclick: stop })]));
    function play(){ d = { text: ti.value || " ", speed: 31 - Number(sp.value), color: col.value, bg: bgc.value, pos: ps.value }; CT.save("marq", d); stop();
      marq = h("div", { class: "ct-keep", style: "position:fixed;left:0;right:0;" + (d.pos === "top" ? "top:0;" : "bottom:0;") + "z-index:9600;overflow:hidden;background:" + d.bg + ";color:" + d.color + ";font-size:calc(36px * var(--ct-s,1));font-weight:800;padding:.2em 0;border-" + (d.pos === "top" ? "bottom" : "top") + ":3px solid " + d.color + ";white-space:nowrap;" });
      var span = h("span", { style: "display:inline-block;padding-left:100%;animation:ctMarq " + Math.max(6, d.text.length * d.speed / 6) + "s linear infinite;", text: d.text }); marq.appendChild(span);
      if(!document.getElementById("ct-marq-css")){ var s = document.createElement("style"); s.id = "ct-marq-css"; s.textContent = "@keyframes ctMarq{from{transform:translateX(0)}to{transform:translateX(-100%)}}"; document.head.appendChild(s); }
      document.body.appendChild(marq); }
    function stop(){ if(marq){ marq.remove(); marq = null; } }
    win.onClose(function(){ /* 視窗關掉後跑馬燈繼續播，要停止請再打開這個工具按「停止」 */ });
  }});

  // ---- 隨手便利貼 ----
  var NOTE_C = ["#FFF59D", "#FFCCBC", "#C5E1A5", "#B3E5FC", "#E1BEE7"];
  function loadNotes(){ return CT.load("notes", [], true); }
  function renderNotes(){
    var layer = CT.layer(); [].slice.call(layer.querySelectorAll(".ct-note")).forEach(function(n){ n.remove(); });
    var notes = loadNotes();
    function persist(){ CT.save("notes", notes, true); }
    notes.forEach(function(n, i){
      var el = h("div", { class: "ct-note", style: "position:fixed;left:" + n.x + "px;top:" + n.y + "px;width:" + (n.w || 200) + "px;height:" + (n.h || 170) + "px;background:" + n.c + ";box-shadow:0 4px 12px rgba(0,0,0,.3);border-radius:4px;display:flex;flex-direction:column;z-index:" + (9100 + i) + ";resize:both;overflow:hidden;min-width:120px;min-height:90px;" });
      var top = h("div", { style: "height:1.5em;background:rgba(0,0,0,.12);cursor:move;display:flex;justify-content:flex-end;touch-action:none;flex:none;" }, [h("button", { style: "border:0;background:transparent;cursor:pointer;font-size:1em;", text: "✕", onclick: function(){ notes.splice(i, 1); persist(); renderNotes(); } })]);
      var ta = h("textarea", { style: "flex:1;border:0;background:transparent;resize:none;font-size:calc(18px * var(--ct-s,1));padding:.4em;outline:none;font-family:inherit;color:#222;", text: n.t || "" }); ta.oninput = function(){ n.t = ta.value; persist(); };
      el.appendChild(top); el.appendChild(ta); layer.appendChild(el);
      CT.makeDraggable(top.parentNode, function(){ var r = el.getBoundingClientRect(); n.x = Math.round(r.left); n.y = Math.round(r.top); persist(); });
      new ResizeObserver(function(){ var r = el.getBoundingClientRect(); if(Math.abs(r.width - (n.w || 200)) > 2 || Math.abs(r.height - (n.h || 170)) > 2){ n.w = Math.round(r.width); n.h = Math.round(r.height); persist(); } }).observe(el);
    });
  }
  CT.add({ id: "notes", cat: "board", icon: "🗒️", name: "隨手便利貼", w: 340, h: 200, build: function(bd, win){
    bd.appendChild(h("div", { class: "ct-muted", text: "按顏色新增便利貼，可以拖曳、拉右下角調大小；內容會記住。" }));
    var row = h("div", { class: "ct-row" }); NOTE_C.forEach(function(c){ row.appendChild(h("button", { style: "width:2.4em;height:2.4em;border-radius:6px;border:2px solid #999;cursor:pointer;background:" + c + ";", title: "新增便利貼", onclick: function(){ var ns = loadNotes(); ns.push({ x: 140 + (ns.length % 8) * 28, y: 120 + (ns.length % 8) * 28, c: c, t: "" }); CT.save("notes", ns, true); renderNotes(); } })); });
    bd.appendChild(row); bd.appendChild(h("div", { class: "ct-row" }, [h("button", { class: "ct-btn", text: "隱藏全部", onclick: function(){ [].slice.call(CT.layer().querySelectorAll(".ct-note")).forEach(function(n){ n.remove(); }); } }), h("button", { class: "ct-btn", text: "顯示全部", onclick: renderNotes }), h("button", { class: "ct-btn", text: "刪除全部", onclick: function(){ if(confirm("刪除所有便利貼？")){ CT.save("notes", [], true); renderNotes(); } } })]));
    renderNotes();
  }});

  // ---- 教材圖片展示 ----
  CT.add({ id: "gallery", cat: "board", icon: "🖼️", name: "教材圖片展示", w: 640, h: 500, build: function(bd, win){
    var imgs = [], i = 0, zoom = 1, rot = 0; bd.style.cssText += "display:flex;flex-direction:column;";
    var fi = h("input", { type: "file", accept: "image/*", multiple: "multiple", style: "display:none;" }), view = h("div", { style: "flex:1;min-height:0;overflow:auto;display:flex;align-items:center;justify-content:center;background:#222;border-radius:10px;" }), im = h("img", { style: "max-width:100%;max-height:100%;transition:transform .2s;" }), info = h("span", { class: "ct-muted" });
    view.appendChild(im);
    bd.appendChild(h("div", { class: "ct-row", style: "margin:0 0 6px;" }, [h("button", { class: "ct-btn pri", text: "📂 選擇圖片", onclick: function(){ fi.click(); } }), h("button", { class: "ct-btn", text: "◀", onclick: function(){ go(-1); } }), h("button", { class: "ct-btn", text: "▶", onclick: function(){ go(1); } }), h("button", { class: "ct-btn", text: "＋", onclick: function(){ zoom = Math.min(4, zoom + 0.25); paint(); } }), h("button", { class: "ct-btn", text: "－", onclick: function(){ zoom = Math.max(0.25, zoom - 0.25); paint(); } }), h("button", { class: "ct-btn", text: "↻", title: "旋轉", onclick: function(){ rot = (rot + 90) % 360; paint(); } }), h("button", { class: "ct-btn", text: "適合視窗", onclick: function(){ zoom = 1; rot = 0; paint(); } }), info, fi]));
    bd.appendChild(view);
    fi.onchange = function(){ imgs.forEach(function(u){ URL.revokeObjectURL(u); }); imgs = [].slice.call(fi.files).map(function(f){ return URL.createObjectURL(f); }); i = 0; zoom = 1; rot = 0; paint(); };
    function go(d){ if(!imgs.length) return; i = (i + d + imgs.length) % imgs.length; zoom = 1; rot = 0; paint(); }
    function paint(){ if(!imgs.length){ info.textContent = "還沒選圖片"; im.removeAttribute("src"); return; } im.src = imgs[i]; im.style.transform = "scale(" + zoom + ") rotate(" + rot + "deg)"; info.textContent = (i + 1) + " / " + imgs.length; }
    bd.tabIndex = 0; bd.onkeydown = function(e){ if(e.key === "ArrowRight") go(1); else if(e.key === "ArrowLeft") go(-1); };
    win.onClose(function(){ imgs.forEach(function(u){ URL.revokeObjectURL(u); }); }); paint();
  }});

  // ---- PDF 電子書翻頁（用平台已經有的 pdf.js）----
  CT.add({ id: "pdf", cat: "board", icon: "📕", name: "PDF 電子書", w: 680, h: 560, build: function(bd, win){
    bd.style.cssText += "display:flex;flex-direction:column;"; var doc = null, pg = 1, busy = false, pending = 0;
    var fi = h("input", { type: "file", accept: "application/pdf", style: "display:none;" }), cv = h("canvas", { style: "max-width:100%;box-shadow:0 2px 10px rgba(0,0,0,.3);background:#fff;" }), box = h("div", { style: "flex:1;min-height:0;overflow:auto;text-align:center;background:#8a8a8a;padding:8px;border-radius:10px;" }, [cv]), info = h("span", { class: "ct-muted" });
    var fit = h("select", { class: "ct-inp" }, [h("option", { value: "w", text: "符合寬度" }), h("option", { value: "h", text: "符合高度" })]); fit.onchange = function(){ draw(); };
    bd.appendChild(h("div", { class: "ct-row", style: "margin:0 0 6px;" }, [h("button", { class: "ct-btn pri", text: "📂 開啟 PDF", onclick: function(){ fi.click(); } }), h("button", { class: "ct-btn", text: "◀ 上一頁", onclick: function(){ go(-1); } }), h("button", { class: "ct-btn", text: "下一頁 ▶", onclick: function(){ go(1); } }), fit, info, fi])); bd.appendChild(box);
    async function lib(){ if(window.pdfjsLib) return; await CT.loadScript("slides/vendor/pdf.min.js"); window.pdfjsLib.GlobalWorkerOptions.workerSrc = "slides/vendor/pdf.worker.min.js"; }
    fi.onchange = async function(){ var f = fi.files[0]; if(!f) return; try{ await lib(); doc = await window.pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise; pg = 1; draw(); }catch(e){ CT.toast("PDF 開啟失敗：" + (e.message || e)); } };
    function go(d){ if(!doc) return; pg = Math.max(1, Math.min(doc.numPages, pg + d)); draw(); }
    async function draw(){
      if(!doc) return; if(busy){ pending = 1; return; } busy = true;
      try{ var p = await doc.getPage(pg), vp0 = p.getViewport({ scale: 1 }), bw = box.clientWidth - 16, bh = box.clientHeight - 16, sc = fit.value === "w" ? bw / vp0.width : Math.min(bw / vp0.width, bh / vp0.height), dpr = window.devicePixelRatio || 1, vp = p.getViewport({ scale: sc * dpr });
        cv.width = vp.width; cv.height = vp.height; cv.style.width = (vp.width / dpr) + "px"; cv.style.height = (vp.height / dpr) + "px"; await p.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise; info.textContent = pg + " / " + doc.numPages; }catch(e){}
      busy = false; if(pending){ pending = 0; draw(); }
    }
    bd.tabIndex = 0; bd.onkeydown = function(e){ if(e.key === "ArrowRight" || e.key === "PageDown") go(1); else if(e.key === "ArrowLeft" || e.key === "PageUp") go(-1); };
    win.onResize = draw; info.textContent = "還沒開啟 PDF";
  }});

  // ---- QR Code 產生器 ----
  CT.add({ id: "qr", cat: "board", icon: "🔳", name: "QR Code 產生器", w: 380, h: 470, build: function(bd, win){
    var ti = h("input", { class: "ct-inp", style: "width:100%;box-sizing:border-box;", placeholder: "貼上網址或文字", value: CT.load("qr_last", "") }), out = h("div", { class: "ct-c", style: "margin-top:8px;" });
    bd.appendChild(ti); bd.appendChild(h("div", { class: "ct-row" }, [h("button", { class: "ct-btn pri", text: "產生 QR Code", onclick: make }), h("button", { class: "ct-btn", text: "💾 下載圖片", onclick: dl })])); bd.appendChild(out);
    async function make(){
      if(!ti.value.trim()){ out.textContent = ""; return; } CT.save("qr_last", ti.value);
      try{ if(!window.qrcode) await CT.loadScript("games/vendor/qrcode.js"); var q = window.qrcode(0, "M"); q.addData(ti.value.trim()); q.make(); var n = q.getModuleCount(), cell = Math.max(3, Math.floor(300 / (n + 8))); out.innerHTML = q.createSvgTag({ cellSize: cell, margin: cell * 4 }); var s = out.querySelector("svg"); if(s){ s.style.maxWidth = "100%"; s.style.height = "auto"; } }catch(e){ out.textContent = "文字太長，無法產生 QR Code"; }
    }
    function dl(){ var s = out.querySelector("svg"); if(!s) return; var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(s)], { type: "image/svg+xml" })); a.download = "qrcode.svg"; document.body.appendChild(a); a.click(); a.remove(); }
    if(ti.value) make();
  }});

  // ---- 教學捷徑導航 ----
  CT.add({ id: "links", cat: "board", icon: "🔗", name: "教學捷徑導航", w: 420, h: 440, build: function(bd, win){
    var list = CT.load("links", []), box = h("div"), ni = h("input", { class: "ct-inp", placeholder: "名稱", style: "width:7em;" }), ui = h("input", { class: "ct-inp", placeholder: "網址 https://…", style: "flex:1;" });
    bd.appendChild(h("div", { class: "ct-row" }, [ni, ui, h("button", { class: "ct-btn pri", text: "＋", onclick: function(){ var u = ui.value.trim(); if(!u) return; if(!/^https?:\/\//i.test(u)) u = "https://" + u; list.push({ n: ni.value.trim() || u, u: u }); CT.save("links", list); ni.value = ui.value = ""; draw(); } })])); bd.appendChild(box);
    function draw(){ box.innerHTML = ""; if(!list.length) box.appendChild(h("div", { class: "ct-muted ct-c", style: "padding:2em 0;", text: "把常用的教學網站、影片、雲端資料夾加進來，上課時一點就開。" }));
      list.forEach(function(l, i){ box.appendChild(h("div", { style: "display:flex;gap:6px;margin:6px 0;" }, [h("a", { href: l.u, target: "_blank", rel: "noopener", class: "ct-btn pri", style: "flex:1;text-decoration:none;text-align:center;font-weight:700;", text: "🔗 " + l.n }), h("button", { class: "ct-btn", text: "✕", onclick: function(){ list.splice(i, 1); CT.save("links", list); draw(); } })])); }); }
    draw();
  }});

  // ---- 影片播放 ----
  function ytEmbed(u){ var m = u.match(/(?:youtube\.com\/watch\?[^#]*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/); return m ? "https://www.youtube.com/embed/" + m[1] + "?rel=0" : null; }
  CT.add({ id: "video", cat: "board", icon: "🎬", name: "影片播放", w: 680, h: 460, build: function(bd, win){
    bd.style.cssText += "display:flex;flex-direction:column;"; var stage = h("div", { style: "flex:1;min-height:0;background:#000;border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#aaa;", text: "貼上影片網址（YouTube 或 mp4），或選擇電腦裡的影片檔" });
    var ui = h("input", { class: "ct-inp", placeholder: "影片網址", style: "flex:1;" }), fi = h("input", { type: "file", accept: "video/*,audio/*", style: "display:none;" }), objUrl = null;
    bd.appendChild(h("div", { class: "ct-row", style: "margin:0 0 6px;" }, [ui, h("button", { class: "ct-btn pri", text: "▶ 播放", onclick: play }), h("button", { class: "ct-btn", text: "📂 選檔案", onclick: function(){ fi.click(); } }), fi])); bd.appendChild(stage);
    function play(){ var u = ui.value.trim(); if(!u) return; var y = ytEmbed(u); stage.innerHTML = ""; if(y) stage.appendChild(h("iframe", { src: y, style: "width:100%;height:100%;border:0;", allow: "autoplay; encrypted-media; fullscreen", allowfullscreen: "true" })); else stage.appendChild(h("video", { src: u, controls: "true", autoplay: "true", style: "width:100%;height:100%;" })); }
    fi.onchange = function(){ var f = fi.files[0]; if(!f) return; if(objUrl) URL.revokeObjectURL(objUrl); objUrl = URL.createObjectURL(f); stage.innerHTML = ""; stage.appendChild(h("video", { src: objUrl, controls: "true", autoplay: "true", style: "width:100%;height:100%;" })); };
    ui.onkeydown = function(e){ if(e.key === "Enter") play(); }; win.onClose(function(){ if(objUrl) URL.revokeObjectURL(objUrl); });
  }});

  // ---- 網頁嵌入 ----
  CT.add({ id: "web", cat: "board", icon: "🌐", name: "網頁嵌入", w: 700, h: 500, build: function(bd, win){
    bd.style.cssText += "display:flex;flex-direction:column;"; var frame = h("iframe", { style: "flex:1;min-height:0;width:100%;border:1.5px solid #d9c9b5;border-radius:10px;background:#fff;" }), ui = h("input", { class: "ct-inp", placeholder: "網址 https://…", style: "flex:1;" });
    function url(){ var u = ui.value.trim(); if(!u) return null; if(!/^https?:\/\//i.test(u)) u = "https://" + u; return u; }
    bd.appendChild(h("div", { class: "ct-row", style: "margin:0 0 6px;" }, [ui, h("button", { class: "ct-btn pri", text: "前往", onclick: function(){ var u = url(); if(u) frame.src = u; } }), h("button", { class: "ct-btn", text: "↗ 新分頁開啟", title: "有些網站不允許被嵌入，空白時請用這個", onclick: function(){ var u = url(); if(u) window.open(u, "_blank", "noopener"); } })])); bd.appendChild(frame);
    ui.onkeydown = function(e){ if(e.key === "Enter"){ var u = url(); if(u) frame.src = u; } };
    bd.appendChild(h("div", { class: "ct-muted", text: "有些網站（例如 Google、Facebook）不允許被嵌入，畫面會空白，請改用「新分頁開啟」。" }));
  }});

  // ---- 實物投影相機 ----
  CT.add({ id: "camera", cat: "board", icon: "📷", name: "實物投影相機", w: 640, h: 500, build: function(bd, win){
    bd.style.cssText += "display:flex;flex-direction:column;"; var stream = null, mirror = false, rot = 0;
    var vid = h("video", { autoplay: "true", playsinline: "true", muted: "true", style: "max-width:100%;max-height:100%;transition:transform .2s;" }), stage = h("div", { style: "flex:1;min-height:0;background:#111;border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;" }, [vid]);
    var sel = h("select", { class: "ct-inp", style: "max-width:12em;" }), go = h("button", { class: "ct-btn pri", text: "▶ 開啟相機", onclick: start });
    bd.appendChild(h("div", { class: "ct-row", style: "margin:0 0 6px;" }, [go, sel, h("button", { class: "ct-btn", text: "⏸ 定格", onclick: function(){ vid.paused ? vid.play() : vid.pause(); } }), h("button", { class: "ct-btn", text: "↻ 旋轉", onclick: function(){ rot = (rot + 90) % 360; fx(); } }), h("button", { class: "ct-btn", text: "⇋ 鏡像", onclick: function(){ mirror = !mirror; fx(); } }), h("button", { class: "ct-btn", text: "📸 存照片", onclick: snap })])); bd.appendChild(stage);
    function fx(){ vid.style.transform = "rotate(" + rot + "deg)" + (mirror ? " scaleX(-1)" : ""); }
    async function devs(){ try{ var ds = (await navigator.mediaDevices.enumerateDevices()).filter(function(d){ return d.kind === "videoinput"; }); sel.innerHTML = ""; ds.forEach(function(d, i){ sel.appendChild(h("option", { value: d.deviceId, text: d.label || "相機 " + (i + 1) })); }); }catch(e){} }
    async function start(){ stop(); try{ stream = await navigator.mediaDevices.getUserMedia({ video: sel.value ? { deviceId: { exact: sel.value }, width: { ideal: 1920 } } : { width: { ideal: 1920 } } }); vid.srcObject = stream; go.textContent = "⏹ 關閉相機"; go.onclick = function(){ stop(); go.textContent = "▶ 開啟相機"; go.onclick = start; }; devs(); }catch(e){ CT.toast("無法使用相機：" + (e.message || e)); } }
    function stop(){ if(stream){ stream.getTracks().forEach(function(t){ t.stop(); }); stream = null; vid.srcObject = null; } }
    sel.onchange = function(){ if(stream) start(); };
    function snap(){ if(!vid.videoWidth) return; var c = document.createElement("canvas"); c.width = vid.videoWidth; c.height = vid.videoHeight; var x = c.getContext("2d"); if(mirror){ x.translate(c.width, 0); x.scale(-1, 1); } x.drawImage(vid, 0, 0); var a = document.createElement("a"); a.href = c.toDataURL("image/jpeg", 0.92); a.download = "照片-" + Date.now() + ".jpg"; document.body.appendChild(a); a.click(); a.remove(); }
    win.onClose(stop); devs();
  }});
})();
