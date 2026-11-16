/* 常規秩序：課堂分貝儀、課堂紅綠燈、工作符號指引、教室白噪音 */
(function(){
  "use strict"; var CT = window.CT, h = CT.h;

  // ---- 課堂分貝儀（用麥克風估計音量；數值是相對值，可以用「靈敏度」調整）----
  CT.add({ id: "db", cat: "order", icon: "📢", name: "課堂分貝儀", w: 380, h: 440, build: function(bd, win){
    var stream = null, an = null, raf = 0, warn = CT.load("db_warn", 70), off = CT.load("db_off", 0), lastBeep = 0, peak = 0;
    var face = h("div", { class: "ct-c", style: "font-size:4em;" , text: "🎤" }), val = h("div", { class: "ct-big ct-c", text: "-- dB" }), bar = h("div", { style: "height:1.4em;background:#eee;border-radius:99px;overflow:hidden;margin:8px 0;position:relative;" }), fill = h("div", { style: "height:100%;width:0;background:#5a9a5a;transition:width .1s;" });
    var mark = h("div", { style: "position:absolute;top:0;bottom:0;width:3px;background:#B23B32;" }); bar.appendChild(fill); bar.appendChild(mark);
    var msg = h("div", { class: "ct-c", style: "min-height:1.6em;font-weight:800;font-size:1.2em;" }), pk = h("div", { class: "ct-muted ct-c" });
    var go = h("button", { class: "ct-btn pri", text: "🎤 開始偵測", onclick: toggle });
    var wr = h("input", { type: "range", min: "40", max: "100", step: "1", value: String(warn), style: "width:55%;" }), wl = h("span");
    var orr = h("input", { type: "range", min: "-20", max: "20", step: "1", value: String(off), style: "width:55%;" }), ol = h("span");
    bd.appendChild(face); bd.appendChild(val); bd.appendChild(bar); bd.appendChild(msg); bd.appendChild(pk);
    bd.appendChild(h("div", { class: "ct-row", style: "justify-content:center;" }, [go, h("button", { class: "ct-btn", text: "清除最高值", onclick: function(){ peak = 0; pk.textContent = ""; } })]));
    bd.appendChild(h("div", { class: "ct-row" }, [h("span", { text: "太吵門檻" }), wr, wl])); bd.appendChild(h("div", { class: "ct-row" }, [h("span", { text: "靈敏度" }), orr, ol]));
    bd.appendChild(h("div", { class: "ct-muted", text: "數字是用麥克風估算的相對音量，不是專業儀器；可以用「靈敏度」把安靜教室調到 30–40。" }));
    function lab(){ wl.textContent = warn + " dB"; ol.textContent = (off > 0 ? "＋" : "") + off; mark.style.left = (warn - 20) / 80 * 100 + "%"; }
    wr.oninput = function(){ warn = Number(wr.value); CT.save("db_warn", warn); lab(); }; orr.oninput = function(){ off = Number(orr.value); CT.save("db_off", off); lab(); }; lab();
    async function toggle(){
      if(stream){ stop(); return; }
      try{ stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }catch(e){ CT.toast("無法使用麥克風：" + (e.message || e)); return; }
      var a = CT.audio(), src = a.createMediaStreamSource(stream); an = a.createAnalyser(); an.fftSize = 1024; src.connect(an); go.textContent = "⏹ 停止偵測"; loop();
    }
    function stop(){ cancelAnimationFrame(raf); if(stream){ stream.getTracks().forEach(function(t){ t.stop(); }); stream = null; } an = null; go.textContent = "🎤 開始偵測"; face.textContent = "🎤"; val.textContent = "-- dB"; fill.style.width = "0"; msg.textContent = ""; }
    function loop(){
      if(!an) return; var buf = new Float32Array(an.fftSize); an.getFloatTimeDomainData(buf); var s = 0; for(var i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      var rms = Math.sqrt(s / buf.length), db = Math.max(20, Math.min(100, Math.round(20 * Math.log10(Math.max(rms, 1e-5)) + 94 + off)));
      val.textContent = db + " dB"; fill.style.width = (db - 20) / 80 * 100 + "%"; peak = Math.max(peak, db); pk.textContent = "最高 " + peak + " dB";
      var cls = db < warn - 15 ? 0 : db < warn ? 1 : 2; fill.style.background = ["#5a9a5a", "#E0A82E", "#B23B32"][cls]; face.textContent = ["😊", "😐", "😫"][cls]; msg.textContent = ["很安靜，很棒！", "有點吵了，小聲一點", "太吵了！請安靜"][cls]; msg.style.color = ["#5a9a5a", "#B8860B", "#B23B32"][cls];
      if(cls === 2 && Date.now() - lastBeep > 4000){ lastBeep = Date.now(); CT.beep(1, 520); }
      raf = requestAnimationFrame(loop);
    }
    win.onClose(stop);
  }});

  // ---- 課堂紅綠燈 ----
  CT.add({ id: "light", cat: "order", icon: "🚦", name: "課堂紅綠燈", w: 300, h: 470, build: function(bd, win){
    var cur = CT.load("light", 2), labels = [["停！安靜", "#E0524A"], ["準備", "#F2B632"], ["可以開始", "#4CAF6A"]], box = h("div", { class: "ct-c" });
    bd.appendChild(box);
    function draw(){
      box.innerHTML = ""; var body = h("div", { style: "display:inline-flex;flex-direction:column;gap:.5em;background:#333;padding:.7em;border-radius:1.2em;" });
      labels.forEach(function(l, i){ body.appendChild(h("div", { style: "width:4.2em;height:4.2em;border-radius:50%;cursor:pointer;background:" + (cur === i ? l[1] : "#555") + ";box-shadow:" + (cur === i ? "0 0 1.4em " + l[1] : "none") + ";", onclick: function(){ cur = i; CT.save("light", cur); draw(); } })); });
      box.appendChild(body); box.appendChild(h("div", { style: "margin-top:.5em;font-weight:800;font-size:1.6em;color:" + labels[cur][1] + ";", text: labels[cur][0] }));
      box.appendChild(h("div", { class: "ct-muted", text: "點燈號切換" }));
    }
    draw();
  }});

  // ---- 工作符號指引 ----
  CT.add({ id: "symbols", cat: "order", icon: "🧭", name: "工作符號指引", w: 460, h: 460, build: function(bd, win){
    var S = [["🤫", "安靜"], ["🗣️", "小聲討論"], ["🙋", "舉手發言"], ["✍️", "書寫"], ["📖", "閱讀"], ["👂", "專心聽"], ["🎤", "輪流說話"], ["🤝", "小組合作"], ["🧍", "回座位"], ["🚶", "排隊"], ["📦", "收拾整理"], ["👀", "看老師"]];
    var show = h("div", { class: "ct-c", style: "min-height:8.5em;padding:.4em;border-radius:14px;background:#FDECE6;margin-bottom:8px;" }), grid = h("div", { style: "display:grid;grid-template-columns:repeat(4,1fr);gap:6px;" });
    var cur = CT.load("sym", 0);
    function paint(){ show.innerHTML = '<div style="font-size:5.5em;line-height:1.15;">' + S[cur][0] + '</div><div style="font-size:2em;font-weight:800;">' + S[cur][1] + '</div>'; }
    S.forEach(function(s, i){ grid.appendChild(h("button", { class: "ct-btn", style: "font-size:1.7em;padding:.2em;", title: s[1], text: s[0], onclick: function(){ cur = i; CT.save("sym", cur); paint(); } })); });
    bd.appendChild(show); bd.appendChild(grid); paint();
  }});

  // ---- 教室白噪音（用 Web Audio 現場合成，不需要音檔）----
  CT.add({ id: "noise", cat: "order", icon: "🌧️", name: "教室白噪音", w: 360, h: 330, build: function(bd, win){
    var a = null, nodes = [], cur = null, vol = CT.load("noise_vol", 0.4), master = null, timers = [];
    function noiseBuf(sec, brown){ var c = CT.audio(), len = c.sampleRate * sec, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0), last = 0; for(var i = 0; i < len; i++){ var w = Math.random() * 2 - 1; if(brown){ last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; } return b; }
    function src(buf){ var s = CT.audio().createBufferSource(); s.buffer = buf; s.loop = true; s.start(); nodes.push(s); return s; }
    function stop(){ timers.forEach(clearInterval); timers = []; nodes.forEach(function(n){ try{ n.stop && n.stop(); n.disconnect(); }catch(e){} }); nodes = []; cur = null; paint(); }
    function start(kind){
      stop(); a = CT.audio(); if(!a) return; cur = kind; master = a.createGain(); master.gain.value = vol; master.connect(a.destination); nodes.push(master);
      if(kind === "rain"){ var s = src(noiseBuf(3)), hp = a.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900; var lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 8000; var g = a.createGain(); g.gain.value = 0.5; s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(master); nodes.push(hp, lp, g); }
      else if(kind === "ocean"){ var s2 = src(noiseBuf(4, true)), lp2 = a.createBiquadFilter(); lp2.type = "lowpass"; lp2.frequency.value = 700; var g2 = a.createGain(); g2.gain.value = 0.5; var lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 0.4; lfo.connect(lg); lg.connect(g2.gain); lfo.start(); s2.connect(lp2); lp2.connect(g2); g2.connect(master); nodes.push(lp2, g2, lfo, lg); }
      else if(kind === "forest"){
        var s3 = src(noiseBuf(4, true)), bp = a.createBiquadFilter(); bp.type = "lowpass"; bp.frequency.value = 500; var g3 = a.createGain(); g3.gain.value = 0.25; s3.connect(bp); bp.connect(g3); g3.connect(master); nodes.push(bp, g3);
        timers.push(setInterval(function(){ if(Math.random() < 0.55){ var o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime, f = 2200 + Math.random() * 1800; o.type = "sine"; o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * (0.7 + Math.random() * 0.6), t0 + 0.12); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 0.2); } }, 700));
      } else { var s4 = src(noiseBuf(3)), g4 = a.createGain(); g4.gain.value = 0.25; s4.connect(g4); g4.connect(master); nodes.push(g4); }
      paint();
    }
    var row = h("div", { class: "ct-row" }); var btns = {};
    [["rain", "🌧️ 雨聲"], ["ocean", "🌊 海浪"], ["forest", "🌲 森林"], ["white", "📻 白噪音"]].forEach(function(k){ btns[k[0]] = h("button", { class: "ct-btn", style: "flex:1;font-size:1.1em;padding:.8em .4em;", text: k[1], onclick: function(){ cur === k[0] ? stop() : start(k[0]); } }); row.appendChild(btns[k[0]]); });
    var vr = h("input", { type: "range", min: "0", max: "1", step: "0.05", value: String(vol), style: "flex:1;" }); vr.oninput = function(){ vol = Number(vr.value); CT.save("noise_vol", vol); if(master) master.gain.value = vol; };
    bd.appendChild(row); bd.appendChild(h("div", { class: "ct-row" }, [h("span", { text: "🔈 音量" }), vr])); bd.appendChild(h("div", { class: "ct-muted", text: "再按一次同一個按鈕就會停止。聲音是即時合成的，不需要網路。" }));
    function paint(){ Object.keys(btns).forEach(function(k){ btns[k].classList.toggle("on", cur === k); }); }
    win.onClose(stop);
  }});
})();
