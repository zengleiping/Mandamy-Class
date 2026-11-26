/* 全站唯一的 Firebase 專案設定。
   要換 Firebase 專案（搬家）時，只要改這一個檔案，其他頁面（平台、教材、簡報、遊戲、文件相機）都會跟著用新的。
   這些值不是密碼（網頁一定看得到）；真正的保護是資料庫規則（firebase-rules-v2.json）。 */
window.FIREBASE_CONFIG = {
    apiKey: "AIzaSyC6DjPDuRCdSKuZYKKiCSlbWI_eLVM05oc",
    authDomain: "chinese-onlineboard.firebaseapp.com",
    databaseURL: "https://chinese-onlineboard-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "chinese-onlineboard",
    storageBucket: "chinese-onlineboard.firebasestorage.app",
    messagingSenderId: "635462964030",
    appId: "1:635462964030:web:4059918956a649bf6a926f"
  };

/* ---- 搬家安全機制 ----
   1) 測試用覆蓋：在「tools/testfb.html」貼上新專案的設定，只有「這一台電腦的這個瀏覽器」會改連新專案（存在 localStorage），
      其他人完全不受影響；用來在正式切換前先試用新專案。網址參數不能設定它（避免被人用連結騙去連別的專案）。
   2) 換專案提醒：頁面開著的時候，每 3 分鐘檢查一次這個檔案（只讀一個很小的靜態檔，不花 Firebase 流量）；
      如果正式專案已經換了，畫面上方會出現「請重新整理」，頁面在背景（沒人看）時會自己重新整理，避免繼續寫進舊專案。 */
(function(){
  var KEY = "mm_fb_override", src = (document.currentScript && document.currentScript.src) || "";
  try{
    var o = localStorage.getItem(KEY);
    if(o){ var cfg = JSON.parse(o); if(cfg && cfg.projectId && cfg.apiKey && cfg.databaseURL){ window.FIREBASE_CONFIG = cfg; window.__fbOverride = true; } }
  }catch(e){}
  function bar(msg, color, btn){
    if(document.getElementById("mm-fb-bar")) return;
    var d = document.createElement("div"); d.id = "mm-fb-bar";
    d.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:99999;background:" + color + ";color:#fff;padding:6px 12px;font:600 14px/1.4 sans-serif;text-align:center;";
    d.textContent = msg + " "; if(btn){ var b = document.createElement("button"); b.textContent = btn; b.style.cssText = "margin-left:8px;padding:2px 10px;border-radius:8px;border:0;font-weight:700;cursor:pointer;"; b.onclick = function(){ location.reload(); }; d.appendChild(b); }
    (document.body || document.documentElement).appendChild(d);
  }
  if(window.__fbOverride){
    var ready = function(){ bar("測試模式：這台電腦目前連到「" + window.FIREBASE_CONFIG.projectId + "」（只有你這台，其他人不受影響）。要還原請到 tools/testfb.html。", "#B23B32"); };
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready); else ready();
    return;
  }
  if(!src || !window.fetch) return;
  var mine = (window.FIREBASE_CONFIG || {}).projectId;
  function check(){
    fetch(src.split("?")[0] + "?cb=" + Date.now(), { cache: "no-store" }).then(function(r){ return r.ok ? r.text() : ""; }).then(function(t){
      var m = /projectId:\s*"([^"]+)"/.exec(t || ""); if(!m || !mine || m[1] === mine) return;
      bar("平台已經更新到新的資料庫，請重新整理頁面再繼續。", "#E8825A", "重新整理");
      if(document.hidden) setTimeout(function(){ location.reload(); }, 1500);
    }).catch(function(){});
  }
  setInterval(check, 180000);
})();
