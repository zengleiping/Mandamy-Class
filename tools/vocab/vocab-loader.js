/* 曼米中文 · 生詞表製作：先載入分級詞表與繁簡對照，再啟動工具。
   英文詞典（cedict.txt）和教育部近反義詞（moe-relations.json）由工具本身在需要時才下載。 */
(function(){
  var files = [["data-maps", "maps.json"], ["data-tocfl", "tocfl.tsv"], ["data-hsk", "hsk.tsv"]];
  function msg(t){ var el = document.getElementById("input-message"); if(el) el.textContent = t; }
  function addScript(src){
    return new Promise(function(ok, bad){ var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = function(){ bad(new Error(src)); }; document.body.appendChild(s); });
  }
  msg("詞表載入中…");
  Promise.all(files.map(function(f){
    return fetch(MMV.data + f[1] + "?v=" + MMV.v).then(function(r){ if(!r.ok) throw new Error(f[1]); return r.text(); }).then(function(t){
      var s = document.createElement("script"); s.type = "text/plain"; s.id = f[0]; s.textContent = t; document.body.appendChild(s);
    });
  }))
  .then(function(){ return window.MMStd ? MMStd.ready() : null; })
  .then(function(){ return window.JSZip ? null : addScript(MMV.vendor + "jszip.min.js"); })
  .then(function(){ return addScript("vocab-tool.js?v=" + MMV.v); })
  .catch(function(e){ console.error(e); msg("資料載入失敗，請確認網路後重新整理頁面。"); });
})();
