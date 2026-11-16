/* 曼米中文 · 介面圖示
   把畫面上「當圖示用」的 emoji 換成統一風格的圖（icons/ui/ui-*.png）。
   做法：不改各處的程式，頁面上出現（或之後動態產生）的文字裡有對得上的 emoji，就把那個字包進
   <span class="mmi" data-i="圖示代號">原本的字</span>，用 CSS 顯示成圖、把原本的字藏起來。
   - 原本的 emoji 還在文字裡，所以 textContent、複製貼上、螢幕閱讀器、程式裡比對文字都不受影響。
   - 輸入框、下拉選單、程式碼、可編輯的區塊、標了 data-noicon 的區塊不處理。
   - 沒有對應圖示的 emoji（水果、動物、食物等內容用的）保持原樣。
   - 想關掉：在主控台執行 localStorage.setItem("mm_icons","off") 後重新整理。 */
(function(){
  "use strict";
  if(window.MMIcons) return;
  try{ if(localStorage.getItem("mm_icons") === "off") return; }catch(e){}
  var cs = document.currentScript, BASE = (cs && cs.src ? cs.src.replace(/[^\/]*$/, "") : "icons/") + "ui/ui-";

  // 圖示代號 → 對應的 emoji／符號（空白分隔）。同一個意思在不同地方用過不同的字，這裡都收進來。
  var G = {
    home: "🏠", school: "🏫", books: "📚 📖 📒 📕 📔 📇", activities: "🎲", records: "📊 📈", check: "🔎 🔍", testroom: "🧪", toolbox: "🧰", settings: "⚙", bell: "🔔", menu: "☰",
    teacher: "👩‍🏫", student: "👤 👥 🧒 🎒", login: "🔑", lock: "🔒",
    add: "➕", remove: "➖", delete: "🗑 🧹 🧽", edit: "✏ ✎ ✍ 🖋 🖌 🖍", pen: "🖊", note: "📝 📋 📄 🗒", upload: "⬆ 📤 📥", download: "⬇ 💾", package: "📦", folder: "📂 🗂", link: "🔗 📎 📌",
    cloud: "☁", offline: "📴", refresh: "🔄 ↻ ↺", history: "🕘", translate: "🌐 🔤", image: "🖼 📷 📸", crop: "✂", ai: "✨ 🪄", shuffle: "🔀",
    play: "▶ ⏩", pause: "⏸", stop: "⏹", rec: "🎙 🎤", video: "🎬 🎥", speaker: "🔊 🔈 🔇 📢 📣", music: "🎵", ear: "👂", phone: "📱",
    alarm: "⏰", timer: "⏱ ⏲", hourglass: "⏳", calendar: "📅 🗓", clock: "🕒",
    ok: "✓ ✔ ✅ ☑", no: "✕ ✗ ❌ ✘", warn: "⚠", help: "❓ ❔", tip: "💡", party: "🎉", thumb: "👍 💪", face: "🙂 😊 ☺", eyes: "👀",
    target: "🎯", trophy: "🏆 🏅", star: "⭐ 🌟 ★ ☆", wheel: "🎡", coin: "🪙 💵", vote: "🗳", flag: "🏁 ⚑", heart: "❤ ♥ 💖",
    rule: "🚦", pie: "🥧", steps: "🪜", games: "🎮", paint: "🎨", fullscreen: "⛶ 🖥"
  };
  // 這些是「文字符號」（沒有 emoji 的外觀）：只在按鈕、頁籤、標籤、標題這類介面元件裡才換，內文裡的不動
  var TEXTSYM = "✓ ✔ ✕ ✗ ✘ ▶ ⏸ ⏹ ★ ☆ ♥ ☁ ✎ ☰ ⛶ ↻ ↺ ☺ ⚑ ❤".split(" ");
  // 箭頭：換成跟文字同色的向量箭頭（只在介面元件的開頭／結尾）
  var ARROWS = { "←": "l", "◀": "l", "⇤": "l", "⬅": "l", "→": "r", "➡": "r", "⇥": "r", "↑": "u", "↓": "d", "↗": "ne" };
  var ARROW_SVG = {
    r: "M4 12h15M13 6l6 6-6 6", l: "M20 12H5M11 6l-6 6 6 6", u: "M12 20V5M6 11l6-6 6 6", d: "M12 4v15M6 13l6 6 6-6", ne: "M6 18L18 6M9 6h9v9"
  };

  var map = {}, tier2 = {}, alts = [];
  Object.keys(G).forEach(function(k){ G[k].split(" ").forEach(function(e){ map[e] = k; alts.push(e); }); });
  TEXTSYM.forEach(function(s){ tier2[s] = 1; });
  Object.keys(ARROWS).forEach(function(a){ alts.push(a); });
  alts.sort(function(a, b){ return b.length - a.length; });
  var RE = new RegExp("(" + alts.join("|") + ")(\\uFE0F?)", "g"), HAS = new RegExp(alts.join("|"));

  var CHROME = "button,a,summary,th,label,legend,h1,h2,h3,h4,h5,h6,[role=button],[role=tab],.tab,.btn,.pill,.chip,.badge,.tag,.toast";
  var SKIP = "script,style,textarea,input,select,option,noscript,svg,canvas,code,pre,head,[contenteditable]:not([contenteditable=false]),[data-noicon],.mmi";

  var css = document.createElement("style");
  var arrowCss = Object.keys(ARROW_SVG).map(function(k){
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='" + ARROW_SVG[k] + "' fill='none' stroke='black' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/></svg>";
    return ".mmi-ar[data-i='" + k + "']{-webkit-mask-image:url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\");mask-image:url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\");}";
  }).join("");
  css.textContent =
    ".mmi{display:inline-block;width:1.2em;height:1.2em;vertical-align:-.25em;overflow:hidden;white-space:nowrap;text-indent:-9999em;font-style:normal;line-height:1;background:center/contain no-repeat;-webkit-text-stroke:0;text-shadow:none}" +
    ".mmi-ar{width:1em;height:1em;vertical-align:-.15em;background:currentColor;-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat}" + arrowCss;
  (document.head || document.documentElement).appendChild(css);
  // 每個圖示的圖檔：用 CSS 規則一次寫好，不用在每個 span 上寫 style
  var imgCss = Object.keys(G).map(function(k){ return ".mmi[data-i='" + k + "']{background-image:url('" + BASE + k + ".png')}"; }).join("");
  css.textContent += imgCss;

  function wrap(txt, key, arrow){
    var s = document.createElement("span");
    s.className = arrow ? "mmi mmi-ar" : "mmi"; s.setAttribute("data-i", key); s.textContent = txt; return s;
  }
  function processText(t){
    var s = t.nodeValue; if(!s || !HAS.test(s)) return;
    var p = t.parentElement; if(!p || p.closest(SKIP)) return;
    var chrome = !!p.closest(CHROME), frag = null, last = 0, m, any = false;
    RE.lastIndex = 0;
    while((m = RE.exec(s))){
      var ch = m[1], hasVS = !!m[2], arrow = ARROWS[ch], key = arrow || map[ch];
      if(!key) continue;
      if(arrow){ if(!chrome) continue; }                         // 箭頭只在介面元件裡換
      else if(tier2[ch] && !hasVS && !chrome) continue;         // 文字符號只在介面元件裡換
      if(!frag){ frag = document.createDocumentFragment(); }
      if(m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
      frag.appendChild(wrap(m[0], key, !!arrow)); last = m.index + m[0].length; any = true;
    }
    if(!any) return;
    if(last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    t.parentNode.replaceChild(frag, t);
  }
  function scan(node){
    if(!node) return;
    if(node.nodeType === 3){ processText(node); return; }
    if(node.nodeType !== 1 || (node.closest && node.closest(SKIP))) return;
    var w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null), list = [], n;
    while((n = w.nextNode())) if(n.nodeValue && HAS.test(n.nodeValue)) list.push(n);
    for(var i = 0; i < list.length; i++) processText(list[i]);
  }
  var pending = [], timer = 0;
  function flush(){ timer = 0; var list = pending; pending = []; for(var i = 0; i < list.length; i++) scan(list[i]); }
  var mo = new MutationObserver(function(ms){
    for(var i = 0; i < ms.length; i++){
      var m = ms[i];
      if(m.type === "characterData") pending.push(m.target);
      else for(var j = 0; j < m.addedNodes.length; j++) pending.push(m.addedNodes[j]);
    }
    // 在畫面重繪之前處理完，才不會先閃一下 emoji
    if(pending.length && !timer) timer = 1, queueMicrotask(flush);
  });
  function start(){ scan(document.body || document.documentElement); mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true }); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.MMIcons = { scan: scan, map: map, base: BASE, off: function(){ mo.disconnect(); } };
})();
