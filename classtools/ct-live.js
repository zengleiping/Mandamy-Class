/* 與學生手機／平板即時互動：手機搶答器、即時投票器（要先按「開始上課」，學生的畫面才會收到） */
(function(){
  "use strict"; var CT = window.CT, h = CT.h;
  function L(){ return (CT.ctx().live) || null; }
  function needLive(bd){
    var l = L(); if(l && l.on()) return false;
    bd.appendChild(h("div", { style: "padding:1em;border-radius:12px;background:#FFF3D6;margin-bottom:8px;", text: "要先在班級頁面按「🎬 開始上課」，學生的手機／平板才會收到搶答和投票。" })); return true;
  }

  // ---- 手機搶答器 ----
  CT.add({ id: "buzz", cat: "fun", icon: "🔔", name: "手機搶答器", w: 420, h: 480, build: function(bd, win){
    var unsub = null, rows = h("ol", { style: "margin:8px 0;padding-left:1.8em;font-size:1.25em;" }), stat = h("div", { class: "ct-c", style: "font-weight:800;font-size:1.2em;min-height:1.4em;" });
    needLive(bd);
    var start = h("button", { class: "ct-btn pri", style: "font-size:1.1em;", text: "▶ 開始搶答", onclick: go }), stop = h("button", { class: "ct-btn", text: "⏹ 結束", onclick: function(){ var l = L(); if(l) l.stop(); paint(); } });
    bd.appendChild(h("div", { class: "ct-row", style: "justify-content:center;" }, [start, stop])); bd.appendChild(stat); bd.appendChild(h("div", { class: "ct-muted ct-c", text: "學生手機會出現大大的搶答按鈕；按下去的順序會顯示在這裡。再按一次「開始搶答」＝新的一題（清掉上一題）。" })); bd.appendChild(rows);
    function go(){
      var l = L(); if(!l || !l.on()){ CT.toast("請先按「開始上課」"); return; }
      if(unsub){ try{ unsub(); }catch(e){} }
      var t = l.start({ type: "buzz" }); rows.innerHTML = ""; unsub = l.watch(t.id, show); CT.beep(1, 660); paint();
    }
    function show(v){
      var arr = Object.keys(v).map(function(k){ return v[k]; }).sort(function(a, b){ return (a.n || 0) - (b.n || 0); }); rows.innerHTML = "";
      arr.forEach(function(r, i){ rows.appendChild(h("li", { style: i === 0 ? "font-weight:800;color:#C0623A;font-size:1.3em;" : "", text: r.name + (i === 0 ? "　🥇 最快！" : "") })); });
      if(arr.length === 1) CT.beep(1, 880);
    }
    function paint(){ var l = L(), t = l && l.current(); stat.textContent = t && t.type === "buzz" && t.open ? "🔔 搶答進行中…" : ""; }
    var l0 = L(); if(l0 && l0.on()){ var t0 = l0.current(); if(t0 && t0.type === "buzz" && t0.open){ unsub = l0.watch(t0.id, show); } } paint();
    win.onClose(function(){ if(unsub){ try{ unsub(); }catch(e){} } var l = L(); if(l && l.on()){ var t = l.current(); if(t && t.type === "buzz") l.stop(); } });
  }});

  // ---- 即時投票器 ----
  CT.add({ id: "poll", cat: "fun", icon: "🗳️", name: "即時投票器", w: 460, h: 540, build: function(bd, win){
    var unsub = null, cur = null, opts = CT.load("poll_opts", "是\n否");
    needLive(bd);
    var q = h("input", { class: "ct-inp", style: "width:100%;box-sizing:border-box;", placeholder: "問題（例如：你喜歡哪一個？）", value: CT.load("poll_q", "") }), ta = h("textarea", { class: "ct-inp", rows: "4", style: "width:100%;box-sizing:border-box;", text: opts });
    var pre = h("div", { class: "ct-row" }); [["是／否", "是\n否"], ["A B C D", "A\nB\nC\nD"], ["👍 👎", "👍\n👎"], ["1 2 3 4 5", "1\n2\n3\n4\n5"]].forEach(function(p){ pre.appendChild(h("button", { class: "ct-btn", text: p[0], onclick: function(){ ta.value = p[1]; } })); });
    var res = h("div", { style: "margin-top:8px;" }), showRes = h("label", { style: "display:flex;gap:.4em;align-items:center;" }, [h("input", { type: "checkbox" }), "讓學生也看到目前結果"]);
    bd.appendChild(q); bd.appendChild(h("div", { class: "ct-muted", text: "選項（一行一個）" })); bd.appendChild(ta); bd.appendChild(pre); bd.appendChild(showRes);
    bd.appendChild(h("div", { class: "ct-row" }, [h("button", { class: "ct-btn pri", text: "▶ 開始投票", onclick: go }), h("button", { class: "ct-btn", text: "⏹ 結束投票", onclick: function(){ var l = L(); if(l) l.stop(); } })])); bd.appendChild(res);
    showRes.firstChild.onchange = function(){ var l = L(); if(l && cur) l.patch({ showRes: showRes.firstChild.checked }); };
    function go(){
      var l = L(); if(!l || !l.on()){ CT.toast("請先按「開始上課」"); return; }
      var o = ta.value.split("\n").map(function(s){ return s.trim(); }).filter(Boolean); if(o.length < 2){ CT.toast("至少要兩個選項"); return; }
      CT.save("poll_q", q.value); CT.save("poll_opts", ta.value); if(unsub){ try{ unsub(); }catch(e){} }
      cur = l.start({ type: "poll", q: q.value.trim(), opts: o, showRes: showRes.firstChild.checked }); unsub = l.watch(cur.id, draw); draw({});
    }
    function draw(v){
      res.innerHTML = ""; if(!cur) return; var counts = cur.opts.map(function(){ return []; });
      Object.keys(v).forEach(function(k){ var r = v[k]; if(counts[r.c]) counts[r.c].push(r.name); });
      var tot = 0; counts.forEach(function(c){ tot += c.length; }); res.appendChild(h("div", { class: "ct-muted", text: "已投 " + tot + " 人" }));
      cur.opts.forEach(function(o, i){ var c = counts[i].length;
        res.appendChild(h("div", { style: "position:relative;margin:6px 0;border-radius:10px;border:2px solid #d9c9b5;overflow:hidden;padding:.5em .8em;" }, [h("div", { style: "position:absolute;left:0;top:0;bottom:0;background:rgba(224,82,74,.28);width:" + (tot ? Math.round(c / tot * 100) : 0) + "%;" }), h("div", { style: "position:relative;display:flex;gap:.6em;" }, [h("b", { text: o }), h("span", { class: "ct-muted", style: "flex:1;", text: counts[i].join("、") }), h("b", { text: String(c) })])]));
      });
    }
    var l0 = L(); if(l0 && l0.on()){ var t0 = l0.current(); if(t0 && t0.type === "poll" && t0.open){ cur = t0; unsub = l0.watch(t0.id, draw); draw({}); } }
    win.onClose(function(){ if(unsub){ try{ unsub(); }catch(e){} } });
  }});
})();
