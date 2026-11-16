/*!
 * 曼米中文 · 生詞表製作：嵌入小幫手
 *
 * 用法（貼在教材頁的生詞區域）：
 *   <div id="vocab-tool"></div>
 *   <script src="tools/vocab/embed.js"></script>
 *   <script>
 *     MandamyVocab.mount(document.getElementById("vocab-tool"), {
 *       title: "第5課 天氣變涼了",                       // 生詞表名稱（選填）
 *       words: [{ w: "溫度", p: "wēndù", m: "temperature" }, { w: "下雪" }]   // 預先帶入的生詞（選填）
 *     });
 *   </script>
 *
 * 工具在 iframe 裡執行（樣式和程式不會跟外層頁面互相影響），高度會跟著內容自動調整。
 */
(function(){
  var here = (document.currentScript && document.currentScript.src) || "";
  var DEFAULT_SRC = here ? here.replace(/embed\.js(\?.*)?$/, "") : "tools/vocab/";

  function mount(el, opts){
    opts = opts || {};
    if(!el) throw new Error("MandamyVocab.mount：找不到要放工具的元素");
    var src = (opts.src || DEFAULT_SRC);
    src += (src.indexOf("?") < 0 ? "?" : "&") + "embed=1";
    var frame = document.createElement("iframe");
    frame.src = src;
    frame.title = "生詞表製作";
    frame.setAttribute("allow", "clipboard-write");
    frame.style.cssText = "display:block;width:100%;border:0;border-radius:18px;background:#FAF7F2;min-height:" + (opts.minHeight || 640) + "px;";
    if(opts.height) frame.style.height = typeof opts.height === "number" ? opts.height + "px" : opts.height;
    el.appendChild(frame);

    var ready = false, queued = null;
    function send(data){ try{ frame.contentWindow.postMessage(data, "*"); }catch(e){} }
    function load(title, words){
      var msg = { mmVocab: "load", title: title || "", words: words || [] };
      if(ready) send(msg); else queued = msg;
    }
    function onMessage(e){
      if(e.source !== frame.contentWindow || !e.data || !e.data.mmVocab) return;
      var d = e.data;
      if(d.mmVocab === "ready"){ ready = true; if(queued){ send(queued); queued = null; } }
      else if(d.mmVocab === "height" && !opts.height){ frame.style.height = Math.max(opts.minHeight || 640, d.h) + "px"; }
      if(typeof opts.onMessage === "function") opts.onMessage(d);
    }
    window.addEventListener("message", onMessage);
    if(opts.words && opts.words.length) load(opts.title, opts.words);

    return {
      frame: frame,
      load: load,   // 之後換一課：handle.load("第6課 …", [{ w: "…" }])
      destroy: function(){ window.removeEventListener("message", onMessage); if(frame.parentNode) frame.parentNode.removeChild(frame); }
    };
  }

  window.MandamyVocab = { mount: mount };
})();
