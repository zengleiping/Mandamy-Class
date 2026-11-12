/* 課堂工具箱：課堂錄影錄音、手機實物投影機。
   錄影錄音：瀏覽器內建 getDisplayMedia + MediaRecorder，停止後直接下載到這台電腦，檔案不上傳。
   手機實物投影機：手機打開 cam.html 把相機畫面用 WebRTC 傳到老師的電腦（用 Firebase 即時資料庫交換連線資訊，影像本身是點對點，不經過伺服器）。 */
(function(){
  "use strict";
  if(!window.CT) return;
  var CT = window.CT, h = CT.h;
  function stamp(){ var d = new Date(); return d.getFullYear() + CT.pad(d.getMonth() + 1) + CT.pad(d.getDate()) + "_" + CT.pad(d.getHours()) + CT.pad(d.getMinutes()); }
  function download(blob, name){ var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
  function fmt(sec){ sec = Math.floor(sec); return CT.pad(Math.floor(sec / 60)) + ":" + CT.pad(sec % 60); }

  /* ================= 課堂錄影錄音 ================= */
  CT.add({ id: "rec", cat: "board", icon: "🎥", name: "課堂錄影錄音", w: 380, h: 400, build: function(bd, win){
    var state = { rec: null, chunks: [], streams: [], ac: null, t0: 0, paused: 0, pauseAt: 0, timer: null, kind: "", ext: "webm", mime: "" };
    var micChk = h("input", { type: "checkbox", id: "ctrec-mic" }); micChk.checked = CT.load("rec_mic", true);
    micChk.onchange = function(){ CT.save("rec_mic", micChk.checked); };
    var timeEl = h("div", { class: "ct-big", text: "00:00", style: "font-size:2.6em;" }), stat = h("div", { class: "ct-muted ct-c", text: "按下面的按鈕開始" });
    var bVid = h("button", { class: "ct-btn pri", style: "width:100%;padding:.7em;text-align:left;", html: "<b>🔴 錄影：畫面＋聲音</b><br><span style='font-weight:400;font-size:.85em;'>選「這個分頁」或整個螢幕；畫筆、聚光燈、簡報都會錄進去</span>", onclick: function(){ start("video"); } });
    var bAud = h("button", { class: "ct-btn", style: "width:100%;padding:.7em;text-align:left;", html: "<b>🎙 只錄音</b><br><span style='font-weight:400;font-size:.85em;'>錄老師講課的聲音，檔案小，適合做逐字稿</span>", onclick: function(){ start("audio"); } });
    var bPause = h("button", { class: "ct-btn", text: "⏸ 暫停", onclick: togglePause }), bStop = h("button", { class: "ct-btn pri", text: "⏹ 停止並儲存", onclick: stop });
    var idle = h("div", {}, [bVid, h("div", { style: "height:8px;" }), bAud, h("label", { class: "ct-row", style: "margin-top:10px;cursor:pointer;" }, [micChk, h("span", { text: "錄影時加入麥克風（老師的聲音）" })])]);
    var running = h("div", { style: "display:none;" }, [h("div", { class: "ct-row", style: "justify-content:center;" }, [bPause, bStop])]);
    bd.appendChild(timeEl); bd.appendChild(stat); bd.appendChild(h("div", { style: "height:8px;" })); bd.appendChild(idle); bd.appendChild(running);
    bd.appendChild(h("div", { class: "ct-muted", style: "margin-top:12px;line-height:1.6;", text: "停止後會自動下載到這台電腦，檔案只存在這台電腦，不會上傳。建議用電腦版 Chrome 或 Edge。" }));
    function pick(list){ for(var i = 0; i < list.length; i++){ try{ if(window.MediaRecorder && MediaRecorder.isTypeSupported(list[i])) return list[i]; }catch(e){} } return ""; }
    function tick(){ var s = (Date.now() - state.t0 - state.paused - (state.pauseAt ? Date.now() - state.pauseAt : 0)) / 1000; timeEl.textContent = fmt(Math.max(0, s)); win.setMini((state.pauseAt ? "⏸ " : "🔴 ") + fmt(Math.max(0, s))); }
    async function start(kind){
      if(state.rec) return;
      if(!window.MediaRecorder){ CT.toast("這個瀏覽器不支援錄影，請改用電腦版 Chrome 或 Edge"); return; }
      var out, streams = [];
      try{
        if(kind === "video"){
          if(!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia){ CT.toast("手機／平板瀏覽器無法錄螢幕，請在電腦上使用（Chrome 或 Edge）"); return; }
          var disp = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
          streams.push(disp);
          var mic = null;
          if(micChk.checked){ try{ mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); streams.push(mic); }catch(e){ CT.toast("沒有取得麥克風（只錄畫面" + (disp.getAudioTracks().length ? "和分頁聲音" : "") + "）"); } }
          var tracks = disp.getVideoTracks().slice();
          if(disp.getAudioTracks().length || mic){
            var AC = window.AudioContext || window.webkitAudioContext, ac = new AC(), dest = ac.createMediaStreamDestination();
            if(disp.getAudioTracks().length) ac.createMediaStreamSource(new MediaStream(disp.getAudioTracks())).connect(dest);
            if(mic) ac.createMediaStreamSource(mic).connect(dest);
            state.ac = ac; tracks = tracks.concat(dest.stream.getAudioTracks());
          }
          out = new MediaStream(tracks);
          disp.getVideoTracks()[0].addEventListener("ended", function(){ if(state.rec) stop(); });
          state.mime = pick(["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]);
        } else {
          var m = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
          streams.push(m); out = m;
          state.mime = pick(["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]);
        }
      }catch(e){ streams.forEach(function(s){ s.getTracks().forEach(function(t){ t.stop(); }); }); CT.toast(e && e.name === "NotAllowedError" ? "沒有允許錄影／錄音（可以再按一次，選「允許」）" : "無法開始：" + (e && e.message || e)); return; }
      state.streams = streams; state.kind = kind; state.chunks = []; state.ext = /mp4/.test(state.mime) ? (kind === "audio" ? "m4a" : "mp4") : "webm";
      var mr; try{ mr = new MediaRecorder(out, state.mime ? { mimeType: state.mime } : undefined); }catch(e){ streams.forEach(function(s){ s.getTracks().forEach(function(t){ t.stop(); }); }); CT.toast("無法開始錄製：" + (e && e.message || e)); return; }
      mr.ondataavailable = function(ev){ if(ev.data && ev.data.size) state.chunks.push(ev.data); };
      mr.onstop = finish; state.rec = mr; state.t0 = Date.now(); state.paused = 0; state.pauseAt = 0;
      mr.start(1000);
      idle.style.display = "none"; running.style.display = ""; stat.textContent = kind === "video" ? "🔴 錄影中（畫面＋聲音）" : "🎙 錄音中";
      bPause.textContent = "⏸ 暫停"; state.timer = setInterval(tick, 500); tick();
    }
    function togglePause(){
      var mr = state.rec; if(!mr) return;
      if(mr.state === "recording"){ mr.pause(); state.pauseAt = Date.now(); bPause.textContent = "▶ 繼續"; stat.textContent = "⏸ 已暫停"; }
      else if(mr.state === "paused"){ mr.resume(); state.paused += Date.now() - state.pauseAt; state.pauseAt = 0; bPause.textContent = "⏸ 暫停"; stat.textContent = state.kind === "video" ? "🔴 錄影中（畫面＋聲音）" : "🎙 錄音中"; }
      tick();
    }
    function stop(){ var mr = state.rec; if(!mr) return; try{ if(mr.state !== "inactive") mr.stop(); }catch(e){ finish(); } }
    function finish(){
      var mr = state.rec; if(!mr) return; state.rec = null; clearInterval(state.timer); state.timer = null;
      state.streams.forEach(function(s){ s.getTracks().forEach(function(t){ try{ t.stop(); }catch(e){} }); }); state.streams = [];
      if(state.ac){ try{ state.ac.close(); }catch(e){} state.ac = null; }
      var blob = new Blob(state.chunks, { type: state.mime || (state.kind === "audio" ? "audio/webm" : "video/webm") }); state.chunks = [];
      win.setMini(""); idle.style.display = ""; running.style.display = "none"; timeEl.textContent = "00:00";
      if(blob.size){ download(blob, "曼米上課" + (state.kind === "audio" ? "錄音_" : "錄影_") + stamp() + "." + state.ext); stat.textContent = "✅ 已儲存到這台電腦的「下載」資料夾（" + (blob.size / 1048576).toFixed(1) + " MB）"; }
      else stat.textContent = "沒有錄到內容";
    }
    win.onClose(function(){ if(state.rec){ stop(); } });
  }});

  /* ================= 手機實物投影機 ================= */
  var ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };
  CT.add({ id: "doccam", cat: "board", icon: "📱", name: "手機實物投影機", w: 640, h: 520, build: function(bd, win){
    bd.style.cssText += "display:flex;flex-direction:column;padding:6px;";
    var stage = h("div", { style: "flex:1;min-height:0;background:#111;border-radius:10px;overflow:hidden;position:relative;" });
    var inner = h("div", { style: "position:absolute;left:50%;top:50%;transform-origin:center center;" });
    var video = h("video", { autoplay: "true", playsinline: "true", muted: "true", style: "width:100%;height:100%;object-fit:contain;display:block;background:#000;" }); video.muted = true;
    var frozen = h("canvas", { style: "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:none;" });
    inner.appendChild(video); inner.appendChild(frozen); stage.appendChild(inner);
    var info = h("div", { style: "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#ddd;text-align:center;padding:14px;" });
    stage.appendChild(info);
    var bConn = h("button", { class: "ct-btn pri", text: "📱 開啟手機連線", onclick: openSession });
    var bFreeze = h("button", { class: "ct-btn", text: "⏸ 定格", onclick: toggleFreeze }), bMir = h("button", { class: "ct-btn", text: "↔ 鏡像", onclick: function(){ mirror = !mirror; bMir.classList.toggle("on", mirror); layout(); } }), bRot = h("button", { class: "ct-btn", text: "⟳ 旋轉", onclick: function(){ rot = (rot + 90) % 360; layout(); } });
    var bFs = h("button", { class: "ct-btn", text: "⛶ 全螢幕", onclick: function(){ var r = stage.requestFullscreen || stage.webkitRequestFullscreen; if(r) try{ r.call(stage); }catch(e){} } }), bStop = h("button", { class: "ct-btn", text: "■ 關閉連線", onclick: closeSession });
    bd.appendChild(stage); bd.appendChild(h("div", { class: "ct-row", style: "margin:6px 0 0;" }, [bConn, bFreeze, bMir, bRot, bFs, bStop]));
    var mirror = false, rot = 0, sid = null, unsub = null, pc = null, offerId = null, qRemote = [], seenIce = {}, remoteSet = false, isFrozen = false, connected = false;
    function layout(){
      var sw = stage.clientWidth, sh = stage.clientHeight, w = (rot % 180) ? sh : sw, hh = (rot % 180) ? sw : sh;
      inner.style.width = w + "px"; inner.style.height = hh + "px"; inner.style.transform = "translate(-50%,-50%) rotate(" + rot + "deg) scaleX(" + (mirror ? -1 : 1) + ")";
    }
    var ro = window.ResizeObserver ? new ResizeObserver(layout) : null; if(ro) ro.observe(stage); layout();
    function showInfo(html){ info.style.display = html ? "flex" : "none"; info.innerHTML = html || ""; }
    function idleInfo(){ showInfo("<div style='font-size:1.1em;font-weight:700;'>📱 把手機當實物投影機</div><div style='font-size:.9em;opacity:.85;line-height:1.6;'>手機架在課本或作業上方，<br>畫面會直接出現在這裡。<br>按下面的「開啟手機連線」，用手機掃描 QR Code。</div>"); }
    idleInfo();
    function toggleFreeze(){
      if(!isFrozen){ if(!video.videoWidth) return; frozen.width = video.videoWidth; frozen.height = video.videoHeight; frozen.getContext("2d").drawImage(video, 0, 0); frozen.style.display = "block"; isFrozen = true; bFreeze.textContent = "▶ 取消定格"; bFreeze.classList.add("on"); }
      else { frozen.style.display = "none"; isFrozen = false; bFreeze.textContent = "⏸ 定格"; bFreeze.classList.remove("on"); }
    }
    function dbApi(){ return window.db && window.ref && window.set && window.onValue ? { db: window.db, ref: window.ref, set: window.set, onValue: window.onValue } : null; }
    function path(p){ return "docCam/" + sid + (p ? "/" + p : ""); }
    async function openSession(){
      var api = dbApi(); if(!api){ CT.toast("雲端連線還沒準備好，請稍後再試"); return; }
      if(sid) closeSession(true);
      sid = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
      try{ await api.set(api.ref(api.db, path()), { status: "wait", t: Date.now() }); }catch(e){ CT.toast("無法建立連線（請檢查網路）"); sid = null; return; }
      var url = new URL("cam.html", location.href).href + "?s=" + sid;
      showInfo("<div style='font-weight:700;'>用手機掃描，或打開網址</div><div id='ctdc-qr' style='background:#fff;padding:8px;border-radius:8px;'></div><div style='font-size:.78em;opacity:.8;word-break:break-all;max-width:90%;'>" + CT.esc(url) + "</div><div style='font-size:.85em;'>⏳ 等待手機連線…</div>");
      try{ if(!window.qrcode) await CT.loadScript("games/vendor/qrcode.js"); var q = window.qrcode(0, "M"); q.addData(url); q.make(); var n = q.getModuleCount(), cell = Math.max(3, Math.floor(200 / (n + 4))); info.querySelector("#ctdc-qr").innerHTML = q.createSvgTag({ cellSize: cell, margin: 2, scalable: false }); }catch(e){}
      unsub = api.onValue(api.ref(api.db, path()), onData);
    }
    async function onData(snap){
      var d = snap.val(); if(!d){ return; }
      if(d.status === "stopped"){ cleanupPc(); showInfo("<div>📴 手機已停止傳送</div><div style='font-size:.85em;opacity:.8;'>可以重新用手機掃描，或按「開啟手機連線」產生新的 QR Code</div>"); return; }
      if(d.offer && d.offer.id !== offerId){
        offerId = d.offer.id; cleanupPc(); seenIce = {}; qRemote = []; remoteSet = false;
        var api = dbApi();
        pc = new RTCPeerConnection(ICE);
        pc.ontrack = function(ev){ video.srcObject = ev.streams[0] || new MediaStream([ev.track]); video.play().catch(function(){}); connected = true; showInfo(""); };
        pc.onicecandidate = function(ev){ if(ev.candidate) api.set(api.ref(api.db, path("iceT/" + Math.random().toString(36).slice(2, 10))), JSON.parse(JSON.stringify(ev.candidate))).catch(function(){}); };
        pc.onconnectionstatechange = function(){ if(pc && (pc.connectionState === "failed" || pc.connectionState === "disconnected") && !video.srcObject) showInfo("<div>⚠ 連線不順，請讓手機和電腦連同一個 Wi-Fi 後重新掃描</div>"); };
        try{
          await pc.setRemoteDescription({ type: d.offer.type, sdp: d.offer.sdp }); remoteSet = true;
          var ans = await pc.createAnswer(); await pc.setLocalDescription(ans);
          await api.set(api.ref(api.db, path("answer")), { id: d.offer.id, type: ans.type, sdp: ans.sdp });
          qRemote.forEach(function(c){ pc.addIceCandidate(c).catch(function(){}); }); qRemote = [];
        }catch(e){ console.warn("doccam answer", e); }
      }
      if(d.iceP && pc){
        Object.keys(d.iceP).forEach(function(k){
          if(seenIce[k]) return; seenIce[k] = 1; var c = d.iceP[k];
          if(remoteSet) pc.addIceCandidate(c).catch(function(){}); else qRemote.push(c);
        });
      }
    }
    function cleanupPc(){ if(pc){ try{ pc.close(); }catch(e){} pc = null; } connected = false; video.srcObject = null; }
    function closeSession(keepUi){
      var api = dbApi(); if(unsub){ try{ unsub(); }catch(e){} unsub = null; }
      cleanupPc(); if(sid && api){ api.set(api.ref(api.db, path()), null).catch(function(){}); } sid = null; offerId = null;
      if(isFrozen) toggleFreeze(); if(keepUi !== true) idleInfo();
    }
    win.onClose(function(){ closeSession(true); if(ro) ro.disconnect(); });
  }});
})();
