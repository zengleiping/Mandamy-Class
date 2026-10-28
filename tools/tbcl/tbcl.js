/* 曼米中文 · TBCL 等級檢核與語料庫工具
 * 詞表：優先讀 data/tbcl.tsv（官方 TBCL，格式：詞<TAB>等級1-7<TAB>詞類，# 開頭是註解）；
 * 沒有時暫用 TOCFL 華語八千詞對應（只是參考，不等於官方 TBCL），畫面上方會標示。 */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
var EXT=new Set(),CUSTOM=new Map(),SKIP=new Set(),STAR=new Set(),FREQ=null,GRAM=null,LV=new Map(),KEYS=new Set(),MAXLEN=1,OFFICIAL=false,READY=null;
var isHan=function(c){return /[㐀-鿿豈-﫿〇]/.test(c)};
function add(w,l){if(!w)return;var o=LV.get(w);if(o==null||l<o)LV.set(w,l);KEYS.add(w);if(w.length>MAXLEN)MAXLEN=w.length}
/* 詞語表沒有單獨收、但語法點表有的虛詞用法：依語法點表的等級（V了＝第 2 級、V著＝第 2 級）計算 */
var GRAM_WORD={"了":2,"著":2};
try{var _c=JSON.parse(localStorage.getItem("mm_tbcl_custom")||"{}");Object.keys(_c).forEach(function(w){CUSTOM.set(w,+_c[w]||0)})}catch(e){}
function saveCustom(){var o={};CUSTOM.forEach(function(v,k){o[k]=v});try{localStorage.setItem("mm_tbcl_custom",JSON.stringify(o))}catch(e){}}
function addKey(w){KEYS.add(w);if(w.length>MAXLEN)MAXLEN=w.length}
function loadExt(){return Promise.all(["data/lexicon.txt","data/lexicon-idioms.txt"].map(function(f){return fetch(f).then(function(r){if(!r.ok)throw 0;return r.text()}).catch(function(){return""})})).then(function(ts){ts.forEach(function(t){t.split("\n").forEach(function(w){w=w.trim();if(w&&!LV.has(w)){EXT.add(w);addKey(w)}})});CUSTOM.forEach(function(v,w){addKey(w)})})}
function load(){
  if(READY)return READY;
  READY=fetch("data/tbcl.tsv").then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(t){
    var n=0;t.split("\n").forEach(function(ln){if(!ln||ln[0]==="#")return;var f=ln.split("\t"),l=parseInt(f[1],10);if(f[0]&&l>=1&&l<=7){add(f[0].trim(),l);if(f[2]==="*")STAR.add(f[0].trim());n++}});
    if(!n)throw 0;OFFICIAL=true;$("src").textContent="詞表：國家教育研究院 TBCL 詞語表（"+n+" 筆，第 1*–4* 級併入該級計算）";
  }).then(function(){Object.keys(GRAM_WORD).forEach(function(w){var o=LV.get(w);if(o==null||GRAM_WORD[w]<o){add(w,GRAM_WORD[w])}})}).catch(function(){
    return fetch("../vocab/data/tocfl.tsv").then(function(r){return r.text()}).then(function(t){
      t.split("\n").forEach(function(ln){var f=ln.split("\t");if(f.length<4)return;var l=Math.max(1,Math.min(7,+f[3]||1));add(f[0],l);if(f[1])add(f[1],l)});
      var s=$("src");s.className="src prov";s.textContent="⚠ 暫用 TOCFL 華語八千詞對應（TOCFL 0–6 級 → 1–6 級），不是官方 TBCL。把官方詞表放到 tools/tbcl/data/tbcl.tsv 就會自動改用。";
    });
  });
  READY=READY.then(loadExt);
  return READY;
}
/* 斷詞：雙向最大匹配 */
function fmm(s){var o=[],i=0;while(i<s.length){var L=Math.min(MAXLEN,s.length-i),w=s[i];for(;L>1;L--){var c=s.substr(i,L);if(KEYS.has(c)){w=c;break}}o.push(w);i+=w.length}return o}
function bmm(s){var o=[],j=s.length;while(j>0){var L=Math.min(MAXLEN,j),w=s[j-1];for(;L>1;L--){var c=s.substr(j-L,L);if(KEYS.has(c)){w=c;break}}o.unshift(w);j-=w.length}return o}
function segRun(s){var a=fmm(s),b=bmm(s);if(a.length!==b.length)return a.length<b.length?a:b;var sa=a.filter(function(x){return x.length===1}).length,sb=b.filter(function(x){return x.length===1}).length;return sb<sa?b:a}
function tokens(str){var o=[],buf="";function f(){if(buf){segRun(buf).forEach(function(w){o.push({w:w,han:true})});buf=""}}
  for(var ch of str){if(isHan(ch))buf+=ch;else{f();o.push({w:ch,han:false})}}f();return o}
function levelOf(w){if(CUSTOM.has(w))return CUSTOM.get(w)||null;if(EXT.has(w))return null;var l=LV.get(w);return l==null?null:l}
/* 檢核：「* 級」詞（如第 3* 級）可選擇算在該級內，或算比該級更高 */
function effLv(w,l){return(!$("incstar").checked&&STAR.has(w))?l+0.5:l}

function analyze(text,target,excl){
  var toks=tokens(text),tot=0,over=0,types=new Map(),exN=0;
  toks.forEach(function(t){
    if(!t.han)return;t.lv=levelOf(t.w);t.ex=excl.has(t.w);
    if(t.ex){exN++;t.st="ex";return}
    tot++;t.st=(t.lv==null)?"unk":(effLv(t.w,t.lv)>target?"over":"ok");
    var e=types.get(t.w)||{w:t.w,lv:t.lv,n:0,st:t.st};e.n++;types.set(t.w,e);
    if(t.st!=="ok")over++;
  });
  var tv=[...types.values()],tover=tv.filter(function(x){return x.st!=="ok"}).length;
  return{toks:toks,total:tot,over:over,ratio:tot?over/tot*100:0,types:tv.length,typeOver:tover,typeRatio:tv.length?tover/tv.length*100:0,list:tv.filter(function(x){return x.st!=="ok"}).sort(function(a,b){return(b.lv||99)-(a.lv||99)||b.n-a.n}),exN:exN,dist:tv}
}
function fillLv(sel,def){sel.innerHTML="";for(var i=1;i<=7;i++){var o=document.createElement("option");o.value=i;o.textContent="第 "+i+" 級";sel.appendChild(o)}sel.value=def||3}
var EX=new Set(),LAST=null;
function report(r,target,limit){
  var okp=r.ratio<=limit,h='<div class="card"><div class="big '+(okp?"ok":"bad")+'">超綱 '+r.ratio.toFixed(1)+'%　<small>'+(okp?"✔ 符合":"✘ 超過")+" "+limit+'% 標準</small></div>'+
   '<div class="note">目標第 '+target+' 級；計入 '+r.total+' 個詞次，超綱 '+r.over+'（含未收錄）；不重複詞 '+r.types+' 個，超綱 '+r.typeOver+'（'+r.typeRatio.toFixed(1)+'%）；已排除專有名詞 '+r.exN+' 詞次。'+(OFFICIAL?"":"（目前是暫代詞表）")+'</div></div>';
  h+='<div class="card"><b>標示後的文字</b>（<span class="w over">超綱</span> <span class="w unk">詞表沒有</span> <span class="w ex">已排除的專有名詞</span>；點一下詞可切換「專有名詞」）<div class="hl" id="hl">';
  r.toks.forEach(function(t){if(!t.han){h+=esc(t.w);return}var tip=t.lv==null?"詞表沒有":"第 "+t.lv+" 級";h+='<span class="w '+(t.st==="ok"?"":t.st)+'" data-w="'+esc(t.w)+'" title="'+tip+'">'+esc(t.w)+'</span>'});
  h+='</div></div>';
  var mx=Math.max.apply(null,[1].concat([1,2,3,4,5,6,7].map(function(l){return r.dist.filter(function(x){return x.lv===l}).length})));
  h+='<div class="card"><b>各級詞數（不重複）</b><table>';
  for(var l=1;l<=7;l++){var n=r.dist.filter(function(x){return x.lv===l}).length;h+='<tr><td>第 '+l+' 級'+(l===target?' ◀':'')+'</td><td>'+n+'</td><td><span class="bar" style="width:'+Math.round(n/mx*220)+'px"></span></td></tr>'}
  h+='<tr><td>詞表沒有</td><td>'+r.dist.filter(function(x){return x.lv==null}).length+'</td><td></td></tr></table></div>';
  if(r.list.length){h+='<div class="card"><b>超綱詞清單</b><table><tr><th>詞</th><th>等級</th><th>次數</th></tr>';r.list.forEach(function(x){h+='<tr><td>'+esc(x.w)+'</td><td>'+(x.lv==null?"未收錄":x.lv+(STAR.has(x.w)?"*":""))+'</td><td>'+x.n+'</td></tr>'});h+='</table></div>'}
  return h}
function doCheck(){load().then(function(){return Promise.all([loadSyn(),loadFreq().then(function(m){FREQV=m})])}).then(function(){
  var t=+$("lv").value,lim=+$("lim").value,r=analyze($("txt").value,t,EX);LAST={r:r,t:t,lim:lim};
  $("res").innerHTML=r.total?suspectCard(r)+report(r,t,lim)+sugCard($("txt").value,t):'<p class="note">請先貼上文字。</p>'})}
$("run").onclick=doCheck;
$("res").onclick=function(e){if(e.target.closest&&e.target.closest("[data-act]"))return;var w=e.target.getAttribute&&e.target.getAttribute("data-w");if(!w||!e.target.classList.contains("w"))return;EX.has(w)?EX.delete(w):EX.add(w);doCheck()};
$("exportc").onclick=function(){if(!LAST)return;var r=LAST.r,s="TBCL 第 "+LAST.t+" 級檢核（標準 "+LAST.lim+"%）\n詞次 "+r.total+"，超綱 "+r.over+"（"+r.ratio.toFixed(1)+"%）\n不重複詞 "+r.types+"，超綱 "+r.typeOver+"（"+r.typeRatio.toFixed(1)+"%）\n詞表："+(OFFICIAL?"官方 TBCL":"暫代（TOCFL）")+"\n"+CITE+"\n超綱詞："+r.list.map(function(x){return x.w+"("+(x.lv==null?"未收錄":x.lv)+")"}).join("、");
  navigator.clipboard.writeText(s).then(function(){alert("已複製")},function(){prompt("複製：",s)})};
$("official").onclick=function(){var t=$("txt").value.trim();if(!t){alert("請先貼上文字");return}
  var f=document.createElement("form");f.method="POST";f.action="https://coct.naer.edu.tw/edit.jsp";f.target="_blank";
  [["no",""],["lv","0"],["db","1"],["num","10"],["WORD",t]].forEach(function(p){var i=document.createElement(p[0]==="WORD"?"textarea":"input");i.name=p[0];i.value=p[1];f.appendChild(i)});
  f.style.display="none";document.body.appendChild(f);f.submit();f.remove()};
$("incstar").onchange=function(){if($("txt").value.trim())doCheck()};
$("printc").onclick=function(){window.print()};



/* ===== 疑似「詞表沒有的詞組」（成語、新詞）：斷詞切成單字時，單字都在詞表裡，會被低估；請老師確認 ===== */
function suspects(r,F){var out=[],cur=[];
  function flush(){var ok4=cur.length>=4&&cur.every(function(c){return(F.get(c)||{rank:99999}).rank>60}),ok3=cur.length>=3&&cur.every(function(c){return(F.get(c)||{rank:99999}).rank>400});
    if((ok4||ok3)){var s=cur.join("");if(!SKIP.has(s)&&out.indexOf(s)<0)out.push(s)}cur=[]}
  r.toks.forEach(function(t){if(t.han&&t.w.length===1&&!t.ex&&!CUSTOM.has(t.w))cur.push(t.w);else flush()});flush();return out}
function levelSel(){var h='<select class="cl"><option value="0">詞表沒有</option>';for(var i=1;i<=7;i++)h+='<option value="'+i+'">第 '+i+' 級</option>';return h+'</select>'}
function suspectCard(r){
  var F=FREQV||new Map(),sp=suspects(r,F),h="";
  if(sp.length){h+='<div class="card" id="susp"><b>⚠ 可能有詞表沒有的詞組（成語或新詞）</b><p class="note">下面這些字連在一起，每個字單獨都在詞表裡，系統只能逐字判斷，超綱比例可能被低估。如果它們其實是一個詞（例如成語），請確認範圍後按「確認為一個詞」，之後就會當成一個詞檢核。不是詞就按「略過」。</p>';
    sp.forEach(function(s){var d=s.length>4?s.slice(-4):s;h+='<div class="row" style="margin:4px 0"><span class="note">原文：'+esc(s)+'　詞組範圍：</span><input class="cw" value="'+esc(d)+'" size="'+Math.max(6,d.length+2)+'"> '+levelSel()+' <button class="pri" data-act="defw">確認為一個詞</button> <button data-act="skipw" data-s="'+esc(s)+'">略過</button></div>'});h+='</div>'}
  if(CUSTOM.size){h+='<div class="card"><b>我認定的詞</b>（存在這個瀏覽器）<div class="row" style="margin:4px 0">';CUSTOM.forEach(function(v,w){h+='<span class="wc"><b>'+esc(w)+'</b><small>'+(v?"第 "+v+" 級":"詞表沒有")+'</small><button data-act="delw" data-s="'+esc(w)+'">✕</button></span>'});h+='</div></div>'}
  return h}

/* ===== 超綱詞替換建議：換詞（詞典＋AI，AI 的建議都用詞表驗證）、換句話說（AI，改完再檢核，最多 3 輪） ===== */
var FREQV=null,SYN=null,SYNIDX=null,UNDO=[],NEWS={};
function loadSyn(){return SYN||(SYN=fetch("data/synonyms.json").then(function(r){if(!r.ok)throw 0;return r.json()}).catch(function(){return{g:[],m:{}}}).then(function(d){
  SYNIDX=new Map();var add=function(a,b){if(a===b)return;var s=SYNIDX.get(a);if(!s){s=new Set();SYNIDX.set(a,s)}s.add(b)};
  d.g.forEach(function(g){g.forEach(function(a){g.forEach(function(b){add(a,b)})})});
  Object.keys(d.m).forEach(function(k){d.m[k].forEach(function(v){add(k,v);add(v,k)})});return d}))}
function splitSent(t){var re=/[^。！？!?\n]*[。！？!?]+|[^。！？!?\n]+/g,m,o=[];while((m=re.exec(t))){if(m[0].trim())o.push({s:m[0],i:m.index})}return o}
function overCount(s,t){return analyze(s,t,EX).over}
function dictCands(w,t,sent){var out=[];(SYNIDX&&SYNIDX.get(w)||[]).forEach(function(x){var l=levelOf(x);if(l!=null&&effLv(x,l)<=t)out.push({c:x,l:l,src:"詞典"})});
  out.sort(function(a,b){return a.l-b.l});return out.slice(0,6)}
function parseArr(tx){var m=tx.match(/\[[\s\S]*\]/);if(!m)return[];try{var a=JSON.parse(m[0]);return Array.isArray(a)?a.map(String):[]}catch(e){return[]}}
function sugCard(text,t){
  var ss=splitSent(text).map(function(x,k){var a=analyze(x.s,t,EX);return{k:k,s:x.s,a:a}}).filter(function(x){return x.a.list.length});
  if(!ss.length)return'<div class="card"><b>逐句修改建議</b><p class="note">沒有超綱的句子。</p></div>';
  loadSyn();var h='<div class="card" id="sug"><b>逐句修改建議</b>'+(UNDO.length?' <button data-act="undo">↶ 復原上一步</button>':"")+'<p class="note">每個超綱詞可以「換詞」（先查詞典，沒有再問 AI，AI 給的詞一律用詞表驗證）；整句改不動時用「換句話說」。需要 AI 金鑰（Gemini 或 Claude）。詞典的建議只看詞義與等級，不保證放進句子還通順（例如「許多書」換成「多」就不通），滑鼠移上去可以先看換完的句子；套用前請老師確認語意，按「復原上一步」可以退回。</p>';
  ss.forEach(function(x){h+='<div class="sent" data-k="'+x.k+'"><div class="hl" style="font-size:16px">';
    x.a.toks.forEach(function(tk){h+=tk.han?'<span class="w '+(tk.st==="ok"?"":tk.st)+'">'+esc(tk.w)+'</span>':esc(tk.w)});h+='</div><div class="row" style="margin:4px 0">';
    var seen={};x.a.list.forEach(function(it){if(seen[it.w])return;seen[it.w]=1;var cs=dictCands(it.w,t);
      h+='<span class="wc"><b>'+esc(it.w)+'</b><small>'+(it.lv==null?"未收錄":"第"+it.lv+"級")+'</small>';
      cs.forEach(function(c){h+=' <button class="cand" data-act="cand" data-k="'+x.k+'" data-w="'+esc(it.w)+'" data-c="'+esc(c.c)+'" title="換完：'+esc(x.s.replace(it.w,c.c).trim())+'">'+esc(c.c)+'<small>'+c.src+" "+c.l+'</small></button>'});
      h+=' <button data-act="aiw" data-k="'+x.k+'" data-w="'+esc(it.w)+'">問 AI 換詞</button><span class="aiw" data-w="'+esc(it.w)+'"></span></span>'});
    h+='<button class="pri" data-act="rw" data-k="'+x.k+'">整句換句話說（AI）</button></div><div class="rwout"></div></div>'});
  return h+'</div>'}
function applyToSent(k,fn){var text=$("txt").value,ss=splitSent(text),x=ss[k];if(!x)return false;var ns=fn(x.s);if(ns===x.s)return false;UNDO.push(text);$("txt").value=text.slice(0,x.i)+ns+text.slice(x.i+x.s.length);doCheck();return true}
function logAI(step,tool,purpose,how,prompt){LOG.push({step:step,tool:tool,purpose:purpose,how:how,prompt:prompt,note:"檢核詞表："+(OFFICIAL?"官方 TBCL":"暫代（TOCFL）")});saveLog()}
async function aiWord(k,w,box){var t=+$("lv").value,ai=$("c-ai").value,x=splitSent($("txt").value)[k];if(!x)return;box.textContent="AI 找詞中…";
  try{var p="句子：「"+x.s.trim()+"」\n請列出 6 個可以取代句中「"+w+"」的詞或短語：意思相近、放在原位置語句通順、臺灣常用、而且只用臺灣華語文能力基準（TBCL）第 "+t+" 級（含以下）的詞。只輸出 JSON 陣列，例如 [\"詞1\",\"詞2\"]。";
    var r=await callAI(ai,p),base=overCount(x.s,t),good=[];
    parseArr(r.text).forEach(function(c){c=c.trim();if(!c||c===w)return;var ns=x.s.replace(w,c),o=overCount(ns,t);if(o<base)good.push({c:c,o:o})});
    good.sort(function(a,b){return a.o-b.o});logAI("超綱詞換詞","AI（"+r.model+"）","找較低等級的替代詞","AI 提出替代詞 → 程式用 TBCL 詞表驗證，只保留能讓該句超綱詞減少的 → 人工決定是否套用",p.slice(0,80));
    box.innerHTML=good.length?good.map(function(g){return'<button class="cand ai" data-act="cand" data-k="'+k+'" data-w="'+esc(w)+'" data-c="'+esc(g.c)+'" title="'+esc(x.s.replace(w,g.c))+'">'+esc(g.c)+'<small>AI·已驗證 超綱 '+base+'→'+g.o+'</small></button>'}).join(" "):'<small>AI 的建議沒有一個能降低這句的超綱詞，改試「換句話說」。</small>'}
  catch(e){box.textContent="失敗："+e.message}}
async function aiRewrite(k,box){var t=+$("lv").value,ai=$("c-ai").value,x=splitSent($("txt").value)[k];if(!x)return;var orig=x.s.trim(),base=overCount(orig,t),best=null,prompt0="請把下面這句話換句話說：意思不變、語氣自然，臺灣用語、繁體中文，並且只用臺灣華語文能力基準（TBCL）第 "+t+" 級（含以下）的詞語與句型，必要時可拆成兩三個短句。只輸出改寫後的句子，不要說明。\n原句："+orig,prompt=prompt0,rounds=0,res=null;
  try{for(var i=1;i<=3;i++){rounds=i;box.textContent="換句話說中…（第 "+i+" 輪）";res=await callAI(ai,prompt);var out=res.text.trim().replace(/^[「"]|[」"]$/g,""),a=analyze(out,t,EX);
      if(!best||a.over<best.a.over)best={s:out,a:a};if(a.over===0)break;
      prompt=prompt0+"\n上一版：「"+out+"」仍有超出的詞："+a.list.slice(0,12).map(function(z){return z.w}).join("、")+"。請改成較簡單的說法，意思不變。"}
    logAI("超綱句換句話說","AI（"+res.model+"）","把含超綱詞的句子改寫成目標等級","AI 改寫 → 程式用 TBCL 詞表自動檢核，仍超綱就帶著超綱詞再改（共 "+rounds+" 輪）→ 人工確認語意後套用",prompt0.slice(0,80));
    var id="n"+Date.now();NEWS[id]=best.s;var ok=best.a.over<base;
    box.innerHTML='<div class="card" style="margin:6px 0"><div class="note">改寫（超綱 '+base+' → '+best.a.over+'，'+rounds+' 輪）'+(ok?"":"　⚠ 沒有改善")+'</div><div class="hl" style="font-size:16px">'+esc(best.s)+'</div>'+(ok?'<button class="pri" data-act="apply" data-k="'+k+'" data-id="'+id+'">套用這個改寫</button>':"")+'</div>'}
  catch(e){box.textContent="失敗："+e.message}}
$("res").addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-act]");if(!b)return;var act=b.getAttribute("data-act"),k=+b.getAttribute("data-k");
  if(act==="defw"){var row=b.closest(".row"),w0=row.querySelector(".cw").value.trim(),lv0=+row.querySelector(".cl").value;if(/^[㐀-鿿]{2,}$/.test(w0)){CUSTOM.set(w0,lv0);addKey(w0);saveCustom();doCheck()}return}
  if(act==="skipw"){SKIP.add(b.getAttribute("data-s"));doCheck();return}
  if(act==="delw"){CUSTOM.delete(b.getAttribute("data-s"));saveCustom();doCheck();return}
  if(act==="cand"){var w=b.getAttribute("data-w"),c=b.getAttribute("data-c");applyToSent(k,function(s){return s.replace(w,c)})}
  else if(act==="undo"){if(UNDO.length){$("txt").value=UNDO.pop();doCheck()}}
  else if(act==="aiw"){aiWord(k,b.getAttribute("data-w"),b.nextElementSibling)}
  else if(act==="rw"){aiRewrite(k,b.closest(".sent").querySelector(".rwout"))}
  else if(act==="apply"){var ns=NEWS[b.getAttribute("data-id")];applyToSent(k,function(s){var lead=s.match(/^\s*/)[0],trail=s.match(/\s*$/)[0];return lead+ns+trail})}});

/* 出處 */
var CITE="資料來源：國家教育研究院，臺灣華語文能力基準詞語表、漢字表、語法點表與通用詞頻表，臺灣華語文語料庫與能力基準整合應用系統（https://coct.naer.edu.tw/）。檢核工具為曼米中文自行開發，非官方服務；詞語表第 1*–4* 級併入該級計算。";
$("cite-copy").onclick=function(){navigator.clipboard.writeText(CITE).then(function(){alert("已複製")},function(){prompt("複製：",CITE)})};

/* ② AI 依等級生成 */
var LOG=[];try{LOG=JSON.parse(localStorage.getItem("mm_tbcl_log")||"[]")}catch(e){}
function saveLog(){try{localStorage.setItem("mm_tbcl_log",JSON.stringify(LOG))}catch(e){}renderLog()}
function renderLog(){var h='<table><tr><th>使用環節</th><th>使用工具（版本）</th><th>使用目的</th><th>使用方式（人機協作說明）</th><th>使用範例（指令）</th><th>備註</th></tr>';
  LOG.forEach(function(x){h+='<tr><td>'+esc(x.step)+'</td><td>'+esc(x.tool)+'</td><td>'+esc(x.purpose)+'</td><td>'+esc(x.how)+'</td><td>'+esc(x.prompt)+'</td><td>'+esc(x.note)+'</td></tr>'});
  $("g-log").innerHTML=LOG.length?h+'</table>':'<p class="note">還沒有紀錄。</p>'}
function keyOf(k){try{return localStorage.getItem(k)||""}catch(e){return""}}
async function callAI(kind,prompt){
  if(kind==="claude"){var k=keyOf("mm_tr_aikey");if(!k)throw new Error("找不到 Claude 金鑰（到平台翻譯設定填一次）");
    var r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"content-type":"application/json","x-api-key":k,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-haiku-5-5",max_tokens:1800,messages:[{role:"user",content:prompt}]})});
    var d=await r.json();if(!r.ok)throw new Error((d.error&&d.error.message)||r.status);return{text:d.content.map(function(c){return c.text||""}).join(""),model:"claude-haiku-5-5"}}
  var g=keyOf("mm_gemini_key");if(!g)throw new Error("找不到 Gemini 金鑰（到簡報編輯區「AI 造句」貼一次）");
  var ms=["gemini-flash-latest","gemini-2.5-flash"],err="";
  for(var i=0;i<ms.length;i++){try{var r2=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+ms[i]+":generateContent?key="+encodeURIComponent(g),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});
    var d2=await r2.json();if(!r2.ok)throw new Error((d2.error&&d2.error.message)||r2.status);return{text:d2.candidates[0].content.parts.map(function(p){return p.text||""}).join(""),model:ms[i]}}catch(e){err=e.message}}
  throw new Error(err)}
$("g-go").onclick=async function(){
  await load();var lv=+$("g-lv").value,kind=$("g-kind").value,topic=$("g-topic").value.trim(),must=$("g-must").value.trim(),len=$("g-len").value,ai=$("g-ai").value,st=$("g-st");
  if(!topic){st.textContent="請先填主題";return}
  var base="你是台灣華語老師，請為母語非華語學習者寫「"+kind+"」，主題：「"+topic+"」。\n- 一律用繁體中文、台灣用語。\n- 難度：臺灣華語文能力基準（TBCL）第 "+lv+" 級；詞語和句型盡量只用第 "+lv+" 級以內（含以下）的詞。\n- 長度約 "+len+" 字。"+(must?"\n- 一定要用到這些詞："+must+"。":"")+"\n- 只輸出內容本身，不要說明。";
  var prompt=base,limit=+$("lim").value,res=null,rounds=0,out="";
  try{for(rounds=1;rounds<=4;rounds++){st.textContent="第 "+rounds+" 輪產生中…";
      res=await callAI(ai,prompt);out=res.text.trim();var r=analyze(out,lv,new Set());
      if(r.ratio<=limit||rounds===4){st.textContent="完成：超綱 "+r.ratio.toFixed(1)+"%（"+rounds+" 輪）";break}
      prompt=base+"\n\n上一版文字：\n"+out+"\n\n上一版有這些超出第 "+lv+" 級的詞："+r.list.slice(0,25).map(function(x){return x.w}).join("、")+"。請改寫，把這些詞換成較簡單的詞，其他意思不變。"}
    $("g-out").value=out;
    LOG.push({step:"教材／試題初稿",tool:(ai==="claude"?"Claude":"Gemini")+"（"+res.model+"）",purpose:"依 TBCL 第 "+lv+" 級產出"+kind+"初稿",how:"設計者提供主題、等級與字數 → AI 生成 → 程式用 TBCL 詞表自動檢核超綱比例，過高就帶超綱詞清單請 AI 改寫（共 "+rounds+" 輪）→ 人工審閱修訂",prompt:"主題："+topic+"；等級：TBCL "+lv+"；類型："+kind+(must?"；必用詞："+must:""),note:"檢核詞表："+(OFFICIAL?"官方 TBCL":"暫代（TOCFL）")});saveLog();
  }catch(e){st.textContent="失敗："+e.message}};
$("g-chk").onclick=function(){$("txt").value=$("g-out").value;$("lv").value=$("g-lv").value;tab("check");doCheck()};
$("g-copy").onclick=function(){var s="使用環節\t使用工具（版本）\t使用目的\t使用方式\t使用範例\t備註\n"+LOG.map(function(x){return[x.step,x.tool,x.purpose,x.how,x.prompt,x.note].join("\t")}).join("\n");navigator.clipboard.writeText(s).then(function(){alert("已複製，可貼到 Word／Excel 表格")})};
$("g-clear").onclick=function(){if(confirm("清空紀錄？")){LOG=[];saveLog()}};

/* ③ 教材等級盤點 */
function lessons(){return typeof courseData!=="undefined"?courseData:[]}
function doInv(){load().then(function(){
  var t=+$("i-lv").value,L=lessons(),h="",cnt={},unk=[],rows=[["課","生詞","TOCFL等級","TBCL（參考）"]],all=0;
  h+='<table><tr><th>課</th><th>生詞數</th><th>未收錄</th><th>高於第 '+t+' 級</th><th>課文超綱</th></tr>';
  L.forEach(function(les){var v=les.vocab||[],u=0,o=0;
    v.forEach(function(x){var l=levelOf(x["生詞"]);all++;cnt[l==null?"未":l]=(cnt[l==null?"未":l]||0)+1;if(l==null){u++;unk.push(les.lesson+" "+x["生詞"])}else if(l>t)o++;rows.push([les.lesson,x["生詞"],x["TOCFL等級"]||"",l==null?"未收錄":l])});
    var tx="";(les.texts||[]).forEach(function(T){(T.lines||[]).forEach(function(ln){tx+=(ln.text||"")+"\n"})});var r=analyze(tx,t,new Set());
    h+='<tr><td>'+esc(les.lesson+" "+(les.title||""))+'</td><td>'+v.length+'</td><td>'+u+'</td><td>'+o+'</td><td>'+(r.total?r.ratio.toFixed(1)+"%":"–")+'</td></tr>'});
  h+='</table>';
  var d='<div class="card"><b>全部 '+all+' 個生詞的等級分布</b>：'+[1,2,3,4,5,6,7].map(function(l){return"第"+l+"級 "+(cnt[l]||0)}).join("　")+"　詞表沒有 "+(cnt["未"]||0)+'</div>';
  gramSection(L).then(function(gs){$("i-out").insertAdjacentHTML("beforeend",gs)});
  $("i-out").innerHTML=d+h+(unk.length?'<div class="card"><b>詞表沒有的生詞（建議老師補等級）</b><div class="note">'+esc(unk.join("、"))+'</div></div>':"");
  window.__invRows=rows})}
$("i-lv").onchange=doInv;
$("i-csv").onclick=function(){if(!window.__invRows)return;var s="﻿"+window.__invRows.map(function(r){return r.map(function(c){return'"'+String(c).replace(/"/g,'""')+'"'}).join(",")}).join("\n");
  var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([s],{type:"text/csv"}));a.download="曼米生詞等級.csv";a.click()};

/* ④ 語料庫例句（KWIC） */
var SENT=null;
function sentences(){if(SENT)return SENT;SENT=[];lessons().forEach(function(les){var tag="第"+les.lesson+"課 "+(les.title||"");
  (les.texts||[]).forEach(function(T){(T.lines||[]).forEach(function(ln){if(ln.text)SENT.push({s:ln.text,src:tag})})});
  (les.vocab||[]).forEach(function(v){var e=v["例句（中文）"];if(e)SENT.push({s:e,src:tag+"（例句）"})})});return SENT}
function doKwic(){load().then(function(){
  var q=$("k-q").value.trim();if(!q)return;loadFreq().then(function(F){var f=F.get(q);$("k-freq").innerHTML=f?'<div class="card"><b>COCT 通用詞頻</b>：「'+esc(q)+'」綜合序位第 '+f.rank+'，每百萬詞 '+f.pm.toFixed(1)+'（書面 '+f.wr.toFixed(1)+'／口語 '+f.sp.toFixed(1)+'／新聞 '+f.nw.toFixed(1)+'）'+(LV.has(q)?'；TBCL 第 '+LV.get(q)+(STAR.has(q)?'*':'')+' 級':'')+'</div>':'<div class="card note">COCT 通用詞頻前 30000 詞裡沒有「'+esc(q)+'」。</div>'});var hits=sentences().filter(function(x){return x.s.indexOf(q)>=0}),co=new Map();
  hits.forEach(function(x){var tk=tokens(x.s).filter(function(t){return t.han}).map(function(t){return t.w}),i=tk.indexOf(q);
    if(i<0){var j=tk.findIndex(function(w){return w.indexOf(q)>=0});i=j}
    if(i<0)return;[-2,-1,1,2].forEach(function(d){var w=tk[i+d];if(w&&w!==q&&w.length>1||(w&&w.length===1&&levelOf(w)!=null&&"的了是不也就都很在有和".indexOf(w)<0))co.set(w,(co.get(w)||0)+1)})});
  var top=[...co.entries()].sort(function(a,b){return b[1]-a[1]}).slice(0,12),h='<div class="card"><b>「'+esc(q)+'」共 '+hits.length+' 句</b>'+(hits.length?"":"（教材裡沒有，換個詞試試）")+'</div>';
  if(top.length)h+='<div class="card"><b>常一起出現的詞（前後 2 詞）</b>：'+top.map(function(e){return esc(e[0])+"×"+e[1]}).join("　")+'</div>';
  if(hits.length){h+='<div class="card"><table>';hits.slice(0,60).forEach(function(x){var i=x.s.indexOf(q);h+='<tr><td class="kw">'+esc(x.s.slice(Math.max(0,i-12),i))+'</td><td class="kw" style="text-align:center"><b>'+esc(q)+'</b></td><td>'+esc(x.s.slice(i+q.length,i+q.length+14))+'</td><td class="note">'+esc(x.src)+'</td></tr>'});h+='</table></div>'}
  $("k-out").innerHTML=h})}
$("k-go").onclick=doKwic;$("k-q").onkeydown=function(e){if(e.key==="Enter")doKwic()};


/* COCT 通用詞頻（data/freq.tsv，前 30000 詞）與語法點表（data/grammar.json） */
function loadFreq(){if(FREQ)return FREQ;FREQ=fetch("data/freq.tsv").then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(t){var m=new Map();t.split("\n").forEach(function(ln){if(!ln||ln[0]==="#")return;var f=ln.split("\t");m.set(f[0],{rank:+f[1],pm:+f[2],wr:+f[3],sp:+f[4],nw:+f[5]})});return m}).catch(function(){return new Map()});return FREQ}
function loadGram(){if(GRAM)return GRAM;GRAM=fetch("data/grammar.json").then(function(r){if(!r.ok)throw 0;return r.json()}).catch(function(){return[]});return GRAM}
var GALIAS={"是":"繫動詞"};
var stripG=function(s){return String(s).replace(/[（(][^）)]*[）)]/g,"").replace(/[0-9０-９.\s_…⋯。~～…]/g,"")};
function matchGram(name,G){var core=stripG(name);if(!core)return[];var hit=[];
  G.forEach(function(g){var alts=stripG(g.name).split(/[／/、，,]/).filter(Boolean),ok=alts.some(function(a){return a===core||a===(GALIAS[core]||"")});if(ok)hit.push(g)});
  return hit.slice(0,4)}
function gramSection(L){return loadGram().then(function(G){
  if(!G.length)return"";var rows="";
  L.forEach(function(les){(les.grammar||[]).forEach(function(g){var m=matchGram(g["語法點"]||"",G);
    rows+='<tr><td>'+esc(les.lesson)+'</td><td>'+esc(g["語法點"])+'</td><td>'+(m.length?m.map(function(x){return"第 "+x.lv+(x.star?"*":"")+" 級「"+esc(x.name)+"」"}).join("<br>"):'<span class="note">沒有對到（請老師確認）</span>')+'</td></tr>'})});
  return'<div class="card"><b>教材語法點 ↔ TBCL 語法點表（自動比對名稱，僅供參考）</b><table><tr><th>課</th><th>教材語法點</th><th>TBCL 對應</th></tr>'+rows+'</table></div>'})}
$("gr-q").oninput=$("gr-lv").onchange=function(){loadGram().then(function(G){var lv=+$("gr-lv").value,q=$("gr-q").value.trim(),h='<table><tr><th>級</th><th>序號</th><th>語法點</th><th>例句</th></tr>';
  G.filter(function(g){return(!lv||g.lv===lv)&&(!q||g.name.indexOf(q)>=0||g.ex.indexOf(q)>=0)}).slice(0,300).forEach(function(g){h+='<tr><td>'+g.lv+(g.star?"*":"")+'</td><td>'+g.no+'</td><td>'+esc(g.name)+'</td><td>'+esc(g.ex)+'</td></tr>'});$("gr-out").innerHTML=h+'</table>'})};
for(var gi=1;gi<=5;gi++){var go=document.createElement("option");go.value=gi;go.textContent="第 "+gi+" 級";$("gr-lv").appendChild(go)}

/* 分頁 */
function tab(n){["check","gen","inv","kwic","gram"].forEach(function(k){$("p-"+k).hidden=k!==n});[].forEach.call($("tabs").children,function(b){b.className=b.getAttribute("data-t")===n?"on":""});if(n==="inv")doInv();if(n==="gram")$("gr-lv").onchange()}
$("tabs").onclick=function(e){var t=e.target.getAttribute("data-t");if(t)tab(t)};
fillLv($("lv"),3);fillLv($("g-lv"),3);fillLv($("i-lv"),3);renderLog();
var q=new URLSearchParams(location.search);if(q.get("level"))$("lv").value=$("g-lv").value=$("i-lv").value=q.get("level");
load();
window.MMTBCL={load:load,levelOf:levelOf,analyze:analyze};
})();
