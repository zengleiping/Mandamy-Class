/* 班級寵物園（老師端大螢幕）：全班的寵物一起在草地上走動，餓了會喊、進化有慶祝，另外可以設「全班共同目標」，大家一起賺點數把進度條填滿。 */
(function(){
  "use strict";
  var P = window.PET, A = window.PETART; if(!P || !A || !window.CT) return;
  var h = P.h, esc = P.esc;
  function I(n){ return P.UI && P.UI.ti ? P.UI.ti(n) : ""; }
  function hash(s){ var x = 0; for(var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0; return x; }
  var css = ".pk{font-family:'Huninn','Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif;position:relative;height:100%;min-height:420px;overflow:hidden;border-radius:14px;border:3px solid #5E3E26;background:#b9d6e4;user-select:none;} .pk-bg{position:absolute;inset:0;width:100%;height:100%;} .pk-top{position:absolute;left:8px;right:8px;top:8px;z-index:5;display:flex;gap:8px;align-items:center;flex-wrap:wrap;} .pk-goal{flex:1;min-width:230px;background:#F6EBCF;border:3px solid #5E3E26;border-radius:16px;box-shadow:0 3px 0 #5E3E26;padding:5px 12px;} .pk-goal b{font-size:1.05em;} .pk-bar{height:14px;background:#E9D9BC;border:2px solid #5E3E26;border-radius:99px;overflow:hidden;margin-top:3px;} .pk-bar i{display:block;height:100%;background:#7ACB6B;transition:width .8s;} .pk-btn{border:3px solid #5E3E26;background:#F6EBCF;border-radius:14px;box-shadow:0 3px 0 #5E3E26;padding:4px 12px;font-weight:700;cursor:pointer;font-family:inherit;color:#5E3E26;} .pk-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #5E3E26;} .pk-pet{position:absolute;width:var(--w);transition:left 4.2s ease-in-out,top 4.2s ease-in-out;cursor:pointer;} .pk-pet .pk-a{animation:pkBob 2.6s ease-in-out infinite;transform:scaleX(var(--f,1));} .pk-pet svg{display:block;width:100%;height:auto;} @keyframes pkBob{0%,100%{translate:0 0}50%{translate:0 -7px}} .pk-nm{position:absolute;left:50%;transform:translateX(-50%);bottom:-4px;background:#F6EBCF;border:2px solid #5E3E26;border-radius:99px;padding:0 8px;font-size:12px;font-weight:800;white-space:nowrap;color:#5E3E26;} .pk-say{position:absolute;left:50%;top:-6px;transform:translate(-50%,-100%);background:#fff;border:2.5px solid #5E3E26;border-radius:12px;padding:1px 8px;font-size:12px;font-weight:800;white-space:nowrap;color:#5E3E26;} .pk-say:after{content:'';position:absolute;left:50%;bottom:-8px;margin-left:-6px;border:6px solid transparent;border-top-color:#5E3E26;border-bottom:0;} .pk-card{position:absolute;z-index:6;left:50%;bottom:12px;transform:translateX(-50%);background:#F6EBCF;border:3px solid #5E3E26;border-radius:16px;box-shadow:0 3px 0 #5E3E26;padding:8px 14px;display:flex;gap:10px;align-items:center;} .pk-ban{position:absolute;left:50%;top:26%;transform:translateX(-50%);z-index:8;background:#FFE98A;border:4px solid #5E3E26;border-radius:22px;box-shadow:0 5px 0 #5E3E26;padding:10px 26px;font-size:1.5em;font-weight:800;text-align:center;animation:pkBan .5s cubic-bezier(.3,1.6,.5,1);color:#5E3E26;} @keyframes pkBan{0%{transform:translateX(-50%) scale(.3);opacity:0}100%{transform:translateX(-50%) scale(1);opacity:1}} .pk-spk{position:absolute;z-index:7;pointer-events:none;width:30px;height:30px;animation:pkSp 1.6s ease-out forwards;} @keyframes pkSp{0%{transform:translate(0,0) scale(.3);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1.1);opacity:0}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  window.CT.add({ id: "petpark", hide: true, cat: "fun", icon: "🌳", name: "班級寵物園", w: 900, h: 620, build: function(bd, win){
    var c = P.ctx(), r = P.root(); if(!r){ bd.textContent = "請先進到一個班級。"; return; }
    var cfg = {}, data = {}, names = [], unsubs = [], pets = {}, lastStage = {}, firstLoad = true, timer = null, selName = "";
    var wrap = h("div", { class: "pk" }); bd.style.padding = "0"; bd.appendChild(wrap);
    wrap.innerHTML = (P.UI && P.UI.scene ? '<svg class="pk-bg" viewBox="-400 0 1200 700" preserveAspectRatio="xMidYMax slice">' + (P.UI.scene("grass").replace(/^<svg[^>]*>|<\/svg>$/g, "")) + "</svg>" : "");
    var top = h("div", { class: "pk-top" }), goalBox = h("div", { class: "pk-goal" }), layer = h("div", { style: "position:absolute;inset:0;" });
    wrap.appendChild(layer); wrap.appendChild(top); top.appendChild(goalBox);
    var bGoal = h("button", { class: "pk-btn", html: I("star") + " 設定共同目標", onclick: setGoal }); top.appendChild(bGoal);
    unsubs.push(c.onValue(r.path + "/cfg/" + r.cls, function(v){ cfg = v || {}; drawGoal(); }));
    unsubs.push(c.onValue(r.path + "/s", function(v){ data = v || {}; sync(); drawGoal(); }));
    c.roster().then(function(rr){ names = rr.map(String).filter(Boolean); sync(); });
    win.onClose(function(){ unsubs.forEach(function(u){ try{ u(); }catch(e){} }); clearInterval(timer); });
    timer = setInterval(wander, 5200); win.onClose(function(){ clearInterval(timer); });

    function classRows(){ return names.map(function(nm){ var d = data[P.key ? P.key(nm) : nm] || data[nm]; return d ? { nm: nm, d: d } : null; }).filter(function(x){ return x && P.actPet(x.d); }); }
    function earnedSum(){ return names.reduce(function(s, nm){ var d = data[P.key(nm)] || {}; return s + (d.earned || 0); }, 0); }
    function drawGoal(){
      var g = cfg.goal, sum = earnedSum();
      if(!g){ goalBox.innerHTML = '<b>全班一起賺點數！</b><div style="font-size:.85em;color:#6b5b4b;">按右邊「設定共同目標」，例如：全班累積 300 點，大家一起領獎勵。</div>'; return; }
      var got = Math.max(0, sum - (g.base || 0)), pct = Math.min(100, Math.round(got / g.n * 100));
      goalBox.innerHTML = '<b>' + I("gift") + esc(g.t) + '</b>　<span style="font-weight:800;color:#C0623A;">' + got + ' / ' + g.n + '</span>' + (g.done ? '　<b style="color:#3FA25F;">已達成！</b>' : "") + '<div class="pk-bar"><i style="width:' + pct + '%"></i></div>';
      if(!g.done && got >= g.n && !firstLoad){ c.update(r.path + "/cfg/" + r.cls, { goal: Object.assign({}, g, { done: Date.now() }) }); celebrate("全班達成「" + g.t + "」！"); }
    }
    function setGoal(){
      var t = prompt("共同目標的獎勵是什麼？（例如：全班一起玩遊戲 10 分鐘）", cfg.goal ? cfg.goal.t : ""); if(!t) return;
      var n = Number(prompt("全班要一起賺多少點？", cfg.goal ? cfg.goal.n : 300)); if(!(n > 0)) return;
      c.update(r.path + "/cfg/" + r.cls, { goal: { t: t.trim(), n: Math.round(n), base: earnedSum(), set: Date.now() } });
    }
    function spark(x, y){ for(var i = 0; i < 6; i++){ var e = h("div", { class: "pk-spk", style: "left:" + x + "px;top:" + y + "px;--dx:" + Math.round((Math.random() - .5) * 160) + "px;--dy:" + Math.round(-30 - Math.random() * 110) + "px;animation-delay:" + (i * .05) + "s;", html: P.UI.ic(i % 2 ? "star" : "sparkle") }); wrap.appendChild(e); setTimeout(function(x){ x.remove(); }.bind(null, e), 1800); } }
    function celebrate(text, x, y){ var b = h("div", { class: "pk-ban", text: text }); wrap.appendChild(b); setTimeout(function(){ b.remove(); }, 3200); var W = wrap.clientWidth, H = wrap.clientHeight; for(var k = 0; k < 4; k++) setTimeout(function(){ spark(x != null ? x : Math.random() * W, y != null ? y : H * .4); }, k * 250); }
    function pos(nm){ var hs = hash(nm), W = wrap.clientWidth, H = wrap.clientHeight; return { x: 40 + (hs % 1000) / 1000 * Math.max(60, W - 160), y: H * .4 + ((hs >> 10) % 1000) / 1000 * H * .42 }; }
    function sync(){
      var rows = classRows(), W = wrap.clientWidth || 800, H = wrap.clientHeight || 500, n = rows.length, bw = Math.max(70, Math.min(130, Math.round(W / Math.max(4, Math.sqrt(n * 3.2) * 2.4))));
      rows.forEach(function(o){
        var pet = P.actPet(o.d), stg = P.stageOf(pet.xp), hg = P.hungerNow(pet, cfg.rate || 4, o.d.home), el = pets[o.nm];
        var sig = [pet.sp, stg, JSON.stringify(pet.eq || {}), hg < 30].join("|");
        if(!el){ var p0 = pos(o.nm); el = pets[o.nm] = { box: h("div", { class: "pk-pet", style: "left:" + p0.x + "px;top:" + p0.y + "px;--w:" + bw + "px;", onclick: function(){ selName = selName === o.nm ? "" : o.nm; card(); } }), sig: "" }; layer.appendChild(el.box); }
        el.box.style.setProperty("--w", bw * (0.75 + stg * 0.12) + "px");
        if(el.sig !== sig){ el.sig = sig; el.box.innerHTML = '<div class="pk-a">' + A.svg({ sp: pet.sp, style: cfg.style || "soft", mood: "neutral", stage: stg, eq: pet.eq || {}, anim: false }) + '</div>' + (hg < 30 ? '<div class="pk-say">肚子餓了</div>' : "") + '<div class="pk-nm">' + esc(o.nm) + "</div>"; }
        var py = parseFloat(el.box.style.top) || 0; el.box.style.zIndex = Math.round(py);
        if(!firstLoad && lastStage[o.nm] != null && stg > lastStage[o.nm]){ var rect = el.box.getBoundingClientRect(), wr = wrap.getBoundingClientRect(); celebrate(o.nm + " 的寵物進化了！", rect.left - wr.left + rect.width / 2, rect.top - wr.top); }
        lastStage[o.nm] = stg;
      });
      Object.keys(pets).forEach(function(k){ if(!rows.some(function(o){ return o.nm === k; })){ pets[k].box.remove(); delete pets[k]; } });
      if(rows.length || names.length) firstLoad = false;
      card();
    }
    function wander(){
      var W = wrap.clientWidth, H = wrap.clientHeight;
      Object.keys(pets).forEach(function(k){ var e = pets[k].box; if(Math.random() < .55){ var cx = parseFloat(e.style.left) || 0, nx = 20 + Math.random() * (W - 140), ny = H * .38 + Math.random() * H * .44; e.style.setProperty("--f", nx < cx ? "-1" : "1"); e.style.left = nx + "px"; e.style.top = ny + "px"; e.style.zIndex = Math.round(ny); } });
    }
    function card(){
      var old = wrap.querySelector(".pk-card"); if(old) old.remove(); if(!selName) return; var d = data[P.key(selName)]; if(!d) return; var pet = P.actPet(d); if(!pet) return;
      var hg = P.hungerNow(pet, cfg.rate || 4, d.home), el = h("div", { class: "pk-card" }, [h("div", { style: "width:60px;", html: A.svg({ sp: pet.sp, style: cfg.style || "soft", mood: "neutral", stage: P.stageOf(pet.xp), eq: pet.eq || {}, anim: false }) }), h("div", { html: '<b>' + esc(selName) + '</b>　' + esc(pet.nm) + '<br><span style="font-size:.9em;color:#6b5b4b;">' + I("feed") + ' 飽足 ' + hg + '　經驗 ' + (pet.xp || 0) + '　' + I("star") + (d.pts || 0) + '</span>' })]);
      [1, 5].forEach(function(n){ el.appendChild(h("button", { class: "pk-btn", text: "+" + n, onclick: function(){ var path = r.path + "/s/" + P.key(selName); c.get(path).then(function(cur){ cur = cur || { name: selName, pts: 0 }; c.update(path, { name: selName, c: r.cls, pts: (cur.pts || 0) + n, earned: (cur.earned || 0) + n }); }); } })); });
      wrap.appendChild(el);
    }
  } });
})();
