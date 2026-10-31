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
function loadExt(){return Promise.all(["data/lexicon.txt","data/lexicon-idioms.txt","data/lexicon-freq.txt","data/lexicon-curated.txt"].map(function(f){return fetch(f).then(function(r){if(!r.ok)throw 0;return r.text()}).catch(function(){return""})})).then(function(ts){ts.forEach(function(t){t.split("\n").forEach(function(w){w=w.trim();if(w&&!LV.has(w)){EXT.add(w);addKey(w)}})});CUSTOM.forEach(function(v,w){addKey(w)})})}
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
function levelOf(w){if(CUSTOM.has(w))return CUSTOM.get(w)||null;var l=LV.get(w);if(l!=null)return l;if(EXT.has(w)&&!redup(w))return null;
  var r=redup(w);if(r){var rl=LV.get(r);if(rl!=null)return rl}return null}
/* 疊字：急急忙忙（AABB）、討論討論（ABAB）按原詞（急忙、討論）的等級算 */
function redup(w){if(w.length!==4)return null;if(w[0]===w[1]&&w[2]===w[3]&&w[0]!==w[2])return w[1]+w[2];if(w[0]===w[2]&&w[1]===w[3]&&w[0]!==w[1])return w.slice(0,2);return null}
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
var REP=null,EXPL=null,CUR=null;
function loadRep(){var f=function(u){return fetch(u).then(function(r){if(!r.ok)throw 0;return r.json()}).catch(function(){return{}})};return Promise.all([f("data/replacements.json"),f("data/explanations.json"),f("data/curated.json")]).then(function(a){REP=a[0];EXPL=a[1];CUR=a[2]})}
function loadSyn(){return SYN||(SYN=loadRep().then(function(){return fetch("data/synonyms.json")}).then(function(r){if(!r.ok)throw 0;return r.json()}).catch(function(){return{g:[],m:{}}}).then(function(d){
  SYNIDX=new Map();var add=function(a,b){if(a===b)return;var s=SYNIDX.get(a);if(!s){s=new Set();SYNIDX.set(a,s)}s.add(b)};
  d.g.forEach(function(g){g.forEach(function(a){g.forEach(function(b){add(a,b)})})});
  Object.keys(d.m).forEach(function(k){d.m[k].forEach(function(v){add(k,v);add(v,k)})});return d}))}
function splitSent(t){var re=/[^。！？!?\n]*[。！？!?]+|[^。！？!?\n]+/g,m,o=[];while((m=re.exec(t))){if(m[0].trim())o.push({s:m[0],i:m.index})}return o}
function overCount(s,t){return analyze(s,t,EX).over}
var SRCNAME={s:"辭典同義",d:"釋義用語",e:"語義相近"};
function farCands(w,t){var o=[];((REP&&REP[w])||[]).forEach(function(r){var l=levelOf(r[0]);if(l!=null&&effLv(r[0],l)>t)o.push({c:r[0],l:l})});return o.sort(function(a,b){return a.l-b.l}).slice(0,3)}
function wordCands(w,t){var out=[],seen={};
  ((REP&&REP[w])||[]).forEach(function(r){var c=r[0],l=levelOf(c);if(l!=null&&effLv(c,l)<=t&&!seen[c]&&c.indexOf(w)<0&&w.indexOf(c)<0){seen[c]=1;out.push({c:c,l:l,src:SRCNAME[r[2]]||"詞典",o:{s:0,d:2,e:3}[r[2]],sc:r[3]})}});
  (SYNIDX&&SYNIDX.get(w)||[]).forEach(function(x){var l=levelOf(x);if(l!=null&&effLv(x,l)<=t&&!seen[x]&&x.indexOf(w)<0&&w.indexOf(x)<0){seen[x]=1;out.push({c:x,l:l,src:"近義詞典",o:0,sc:100})}});
  return out}
/* 辭典說法：用辭典釋義改寫成白話；說法裡還有超綱詞時，用同一份換詞表再換一次（只用可靠的候選），最後用詞表確認沒有超綱 */
/* ---- 我的換法（老師自己的說法，存在這個瀏覽器）---- */
var MINE={};try{MINE=JSON.parse(localStorage.getItem("mm_tbcl_mine")||"{}")}catch(e){}
function saveMine(){try{localStorage.setItem("mm_tbcl_mine",JSON.stringify(MINE))}catch(e){}}
/* ---- 候選登錄：按鈕只帶編號，套用時才依「這個詞在句子裡的位置」挑合適的形式 ---- */
var CANDREG={},CANDN=0;
function reg(c){c.id="k"+(++CANDN);CANDREG[c.id]=c;return c}
/* 精選說法有四種形式：P 一般、A 後面接「的」、D 後面接「地」、C 前面有「得」；其他來源只有一般形式 */
function curForms(w,t){var f={};((CUR&&CUR[w])||[]).forEach(function(v){var role=v[2]||"P",a=analyze(v[0],t,new Set());
  if(a.total&&a.over===0){(f[role]=f[role]||[]);if(f[role].indexOf(v[0])<0)f[role].push(v[0])}});return f}
function explCands(w,t){var out=[],seen={};
  if(MINE[w]){out.push(reg({c:MINE[w],l:0,src:"我的換法",o:-1,x:1,forms:{P:[MINE[w]]},mine:1}));seen[MINE[w]]=1}
  var f=curForms(w,t),any=f.P&&f.P[0]||f.A&&f.A[0]||f.D&&f.D[0]||f.C&&f.C[0];
  if(any&&!seen[any]){seen[any]=1;out.push(reg({c:any,l:0,src:"精選說法",o:0.5,x:1,forms:f}))}
  ((EXPL&&EXPL[w])||[]).forEach(function(e){var a=analyze(e,t,new Set());
    if(a.total&&a.over===0){if(!seen[e]){seen[e]=1;out.push(reg({c:e,l:0,src:"辭典說法",o:1,x:1,forms:{P:[e]},one:EXPL[w].length===1}))}return}
    var s=e,ok=true;a.list.forEach(function(it){var cs=wordCands(it.w,t).filter(function(c){return c.o===0||c.sc>=95}).sort(function(p,q){return p.o-q.o||q.sc-p.sc});
      if(cs.length)s=s.split(it.w).join(cs[0].c);else ok=false});
    if(ok&&s!==e&&!seen[s]){var b=analyze(s,t,new Set());if(b.total&&b.over===0){seen[s]=1;out.push(reg({c:s,l:0,src:"辭典說法（再簡化）",o:1.5,x:1,forms:{P:[s]},one:EXPL[w].length===1}))}}});
  return out}
function dictCands(w,t,sent){var out=wordCands(w,t).map(function(c){c.forms={P:[c.c]};return reg(c)}).concat(explCands(w,t));
  out.sort(function(a,b){return a.o-b.o||a.l-b.l});return out.slice(0,6)}
/* ---- 位置判斷與接合（A 角色形式、B 自動修順）---- */
function roleAt(prev,next){return prev==="得"?"C":next==="地"?"D":next==="的"?"A":"P"}
var DEG=/^(很|非常|太|真|好|十分|特別)/;
/* 回傳 {text, warn}：依角色選形式；沒有該角色的形式時，截成第一個短句（接在「的／地」前面才通順），並提醒老師檢查 */
function formFor(c,role,prevWord,nextWord){var f=c.forms||{P:[c.c]},txt,warn=false;
  if(role!=="P"&&f[role]&&f[role][0]){var lst=f[role];txt=lst[0];
    if(role==="C"&&prevWord){var pv=prevWord.slice(-2),hit=function(x){return x.indexOf(pv)>=0||x.indexOf(pv.slice(-1))>=0};for(var q=0;q<lst.length;q++){if(!hit(lst[q])){txt=lst[q];break}}if(hit(txt))warn=true}}   // 「累得很累」這種重複：改選不含前一個詞的形式，沒得選就提醒
  else{txt=(f.P&&f.P[0])||c.c;
    if(role==="A"||role==="D"){var first=txt.split(/[，、；]/)[0];if(first&&first!==txt){txt=first}
      if(!c.mine)warn=true}
    else if(role==="C"){if(!/^(很|非常|太|一|不|沒|說|全)/.test(txt))warn=true}}
  if(DEG.test(txt)&&/^(很|非常|太|真|好|十分|特別)$/.test(prevWord||""))txt=txt.replace(DEG,"");          // 避免「很很」「非常很」
  txt=txt.replace(/[，。、；]+$/,"");
  if(!/[，。！？、；]$/.test(txt)&&/^[，。！？、；]/.test(nextWord||"")){}                                // 後面已有標點，不再補
  return{text:txt,warn:warn}}
function parseArr(tx){var m=tx.match(/\[[\s\S]*\]/);if(!m)return[];try{var a=JSON.parse(m[0]);return Array.isArray(a)?a.map(String):[]}catch(e){return[]}}
function sugCard(text,t){
  var ss=splitSent(text).map(function(x,k){var a=analyze(x.s,t,EX);return{k:k,s:x.s,a:a}}).filter(function(x){return x.a.list.length});
  if(!ss.length)return'<div class="card"><b>逐句修改建議</b><p class="note">沒有超綱的句子。</p></div>';
  loadSyn();var h='<div class="card" id="sug"><b>逐句修改建議</b>'+(UNDO.length?' <button data-act="undo">↶ 復原上一步</button>':"")+'<p class="note">每個難詞可以換詞：先用詞庫，沒有再問 AI（AI 給的詞會用詞表驗證）。整句換句話說需要 AI。詞庫的換法不保證通順，例如「許多書」換成「多」就不通；滑鼠移到按鈕上可以先看換完的句子，不滿意按「復原」。</p>';
  ss.forEach(function(x){h+='<div class="sent" data-k="'+x.k+'"><div class="hl" style="font-size:16px">';
    x.a.toks.forEach(function(tk){h+=tk.han?'<span class="w '+(tk.st==="ok"?"":tk.st)+'">'+esc(tk.w)+'</span>':esc(tk.w)});h+='</div><div class="row" style="margin:4px 0">';
    var seen={};x.a.list.forEach(function(it){if(seen[it.w])return;seen[it.w]=1;var cs=dictCands(it.w,t);
      h+='<span class="wc"><b>'+esc(it.w)+'</b><small>'+(it.lv==null?"未收錄":"第"+it.lv+"級")+'</small>';
      cs.forEach(function(c){h+=' <button class="cand" data-act="cand" data-k="'+x.k+'" data-w="'+esc(it.w)+'" data-cid="'+c.id+'" title="換完：'+esc(replaceInSent(x.s,it.w,c,t).trim())+'">'+esc(c.c)+'<small>'+c.src+(c.x?'':' '+c.l)+'</small></button>'});
      if(!cs.length){var far=farCands(it.w,t);h+=' <small class="nocand">'+(far.length?'辭典有相近詞，但等級都高於第 '+t+' 級：'+far.map(function(f){return esc(f.c)+'（第'+f.l+'級）'}).join('、'):'辭典裡找不到等級較低的相近詞')+'</small>'}
      h+=' <button data-act="aiw" data-k="'+x.k+'" data-w="'+esc(it.w)+'">問 AI 換詞</button><span class="aiw" data-w="'+esc(it.w)+'"></span></span>'});
    h+='<button class="pri" data-act="rw" data-k="'+x.k+'">整句換句話說（AI）</button></div><div class="rwout"></div></div>'});
  return h+'</div>'}
function replaceInSent(s,w,c,t){var i=s.indexOf(w);if(i<0)return s;var role=roleAt(s[i-1],s[i+w.length]),prev=role==="C"?s.slice(Math.max(0,i-3),i-1):s.slice(Math.max(0,i-2),i).replace(/^.*?(很|非常|太|真|好|十分|特別)$/,"$1"),f=formFor(c,role,prev,s[i+w.length]);return s.slice(0,i)+f.text+s.slice(i+w.length)}
function applyToSent(k,fn){var text=$("txt").value,ss=splitSent(text),x=ss[k];if(!x)return false;var ns=fn(x.s);if(ns===x.s)return false;UNDO.push(text);$("txt").value=text.slice(0,x.i)+ns+text.slice(x.i+x.s.length);doCheck();return true}
function logAI(step,tool,purpose,how,prompt){LOG.push({step:step,tool:tool,purpose:purpose,how:how,prompt:prompt,note:"檢核詞表："+(OFFICIAL?"官方 TBCL":"暫代（TOCFL）")});saveLog()}
async function aiWord(k,w,box){var t=+$("lv").value,ai=$("c-ai").value,x=splitSent($("txt").value)[k];if(!x)return;box.textContent="AI 找詞中…";
  try{var p="句子：「"+x.s.trim()+"」\n請列出 6 個可以取代句中「"+w+"」的詞或短語：意思相近、放在原位置語句通順、臺灣常用、而且只用臺灣華語文能力基準（TBCL）第 "+t+" 級（含以下）的詞。只輸出 JSON 陣列，例如 [\"詞1\",\"詞2\"]。";
    var r=await callAI(ai,p),base=overCount(x.s,t),good=[];
    parseArr(r.text).forEach(function(c){c=c.trim();if(!c||c===w)return;var ns=x.s.replace(w,c),o=overCount(ns,t);if(o<base)good.push({c:c,o:o})});
    good.sort(function(a,b){return a.o-b.o});logAI("超綱詞換詞","AI（"+r.model+"）","找較低等級的替代詞","AI 提出替代詞 → 程式用 TBCL 詞表驗證，只保留能讓該句超綱詞減少的 → 人工決定是否套用",p.slice(0,80));
    box.innerHTML=good.length?good.map(function(g){var cd=reg({c:g.c,l:0,src:"AI",x:1,forms:{P:[g.c]}});return'<button class="cand ai" data-act="cand" data-k="'+k+'" data-w="'+esc(w)+'" data-cid="'+cd.id+'" title="換完：'+esc(x.s.replace(w,g.c))+'">'+esc(g.c)+'<small>AI·已驗證 超綱 '+base+'→'+g.o+'</small></button>'}).join(" "):'<small>AI 的建議沒有一個能降低這句的超綱詞，改試「換句話說」。</small>'}
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
  if(act==="cand"){var w=b.getAttribute("data-w"),cd=CANDREG[b.getAttribute("data-cid")],tt=+$("lv").value;if(cd)applyToSent(k,function(s){return replaceInSent(s,w,cd,tt)})}
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
  if(kind==="puter")return callPuter(prompt);
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


/* ===== ⑥ 整篇文章：找出全部超綱詞，逐個給建議，一鍵（或逐一）套用 ===== */
var ART=null;
function artItems(r,t){var m=new Map();
  r.toks.forEach(function(tk){if(!tk.han||tk.st==="ok"||tk.st==="ex")return;var o=m.get(tk.w);if(!o){o={w:tk.w,lv:tk.lv,n:0,cs:dictCands(tk.w,t)};m.set(tk.w,o)}o.n++});
  return[...m.values()].sort(function(a,b){return(b.lv||99)-(a.lv||99)||b.n-a.n})}
function artRows(items){var h='<table><tr><th>詞</th><th>等級</th><th>次數</th><th>處理方式</th></tr>';
  items.forEach(function(it,i){
    h+='<tr><td><b>'+esc(it.w)+'</b></td><td>'+(it.lv==null?"未收錄":"第 "+it.lv+" 級")+'</td><td>'+it.n+'</td><td><select class="ar" data-i="'+i+'"><option value="keep">保持原樣</option>';
    it.cs.forEach(function(c,k){h+='<option value="c'+k+'"'+(k===0?' selected':'')+'>換成：'+esc(c.c)+'（'+c.src+(c.x?'':' 第'+c.l+'級')+'）</option>'});
    if(it.cs.length)h+='<option value="note">加註：'+esc(it.w)+'（'+esc(it.cs[0].c)+'）</option>';
    h+='</select> <input class="ac" data-i="'+i+'" placeholder="自訂換成…" size="10"> <label class="chk"><input type="checkbox" class="am" data-i="'+i+'" checked>記住</label>'+(it.cs.length?'':' <small class="nocand">沒有符合等級的建議</small>')+'</td></tr>'});
  return h+'</table>'}
function mineCard(){var ks=Object.keys(MINE);var h='<div class="card" id="mine"><b>我的換法</b>（存在這個瀏覽器；自訂換法勾「記住」就會存起來，下次同一個詞會排在最前面）';
  if(ks.length){h+='<div class="row" style="margin:4px 0">';ks.forEach(function(w){h+='<span class="wc"><b>'+esc(w)+'</b>→'+esc(MINE[w])+'<button data-act="delmine" data-s="'+esc(w)+'">✕</button></span>'});h+='</div>'}
  else h+='<p class="note">還沒有。</p>';
  return h+'<div class="row"><button data-act="mine-export">複製成文字（備份／帶到別台電腦）</button></div><div class="row"><textarea id="mine-in" style="min-height:50px" placeholder="貼上備份的文字，按匯入"></textarea><button data-act="mine-import">匯入</button></div></div>'}
function doArt(){load().then(function(){return Promise.all([loadSyn(),loadFreq().then(function(m){FREQV=m})])}).then(function(){
  var text=$("a-txt").value,t=+$("a-lv").value,lim=+$("a-lim").value;if(!text.trim()){$("a-out").innerHTML='<p class="note">請先貼上文章。</p>';return}
  var r=analyze(text,t,EX),items=artItems(r,t);ART={text:text,t:t,lim:lim,r:r,items:items};
  var okp=r.ratio<=lim,h='<div class="card"><div class="big '+(okp?"ok":"bad")+'">超綱 '+r.ratio.toFixed(1)+'%　<small>'+(okp?"✔ 符合":"✘ 超過")+" "+lim+'% 標準</small></div><div class="note">計入 '+r.total+' 個詞次；需要處理的詞 '+items.length+' 個。專有名詞請先到「① 等級檢核」標示。</div></div>';
  if(!items.length){$("a-out").innerHTML=h+'<p class="note">沒有需要處理的詞。</p>'+mineCard();return}
  h+='<div class="card"><div class="row"><button id="a-best">全部採用第一個建議</button><button id="a-keep">全部保持原樣</button><button id="a-apply" class="pri">套用，產生新文章</button></div>'+artRows(items)+'</div><div id="a-res"></div>'+mineCard();
  $("a-out").innerHTML=h})}
function artApply(){if(!ART)return;var sel=document.querySelectorAll("#a-out select.ar"),inp=document.querySelectorAll("#a-out input.ac"),mem=document.querySelectorAll("#a-out input.am"),ch={};
  ART.items.forEach(function(it,i){var v=sel[i].value,cu=inp[i].value.trim();
    if(cu){ch[it.w]={custom:cu};if(mem[i].checked&&cu!==it.w){MINE[it.w]=cu;saveMine()}}
    else if(v==="note")ch[it.w]={note:it.cs[0]};else if(v[0]==="c")ch[it.w]={c:it.cs[+v.slice(1)]}});
  var T=ART.r.toks,out="",html="",n=0,warns=[],ins=[];
  T.forEach(function(tk,i){var c=tk.han&&Object.prototype.hasOwnProperty.call(ch,tk.w)?ch[tk.w]:null;if(!c){out+=tk.w;html+=esc(tk.w);return}
    var prev=i>0?T[i-1].w:"",next=i+1<T.length?T[i+1].w:"",role=roleAt(prev,next),to,w=tk.w;
    if(role==="C"&&i>1)prev=T[i-2].w;                                              // 「得」前面的動詞／形容詞（累得…、高興得…）
    if(c.custom)to=c.custom;
    else if(c.note)to=w+"（"+formFor(c.note,"P",prev,next).text+"）";
    else{var f=formFor(c.c,role,prev,next);to=f.text;if(f.warn)warns.push({w:w,role:role,ctx:T.slice(Math.max(0,i-4),i).map(function(x){return x.w}).join("")+"【"+to+"】"+T.slice(i+1,i+5).map(function(x){return x.w}).join("")})}
    out+=to;html+='<mark>'+esc(to)+'</mark>';ins.push(to);n++});
  ART.ins=ins;var a=analyze(out,ART.t,EX),okp=a.ratio<=ART.lim;
  $("a-res").innerHTML='<div class="card"><b>改寫後</b>（換了 '+n+' 處，<mark>標色</mark>是換過的地方）<div class="big '+(okp?"ok":"bad")+'">超綱 '+ART.r.ratio.toFixed(1)+'% → '+a.ratio.toFixed(1)+'%</div>'+
    '<div class="hl" style="font-size:16px">'+html+'</div>'+
    (warns.length?'<div class="note"><b>請檢查這幾處</b>（這個成語沒有適合這個位置的形式，已自動截短，可能不通順）：<br>'+warns.map(function(x){return esc(x.ctx)}).join('<br>')+'</div>':'')+
    '<p class="note">還超綱的詞：'+(a.list.length?a.list.slice(0,20).map(function(x){return esc(x.w)}).join("、"):"沒有")+'。換進去的說法不一定通順，可以直接修改下面的文字，或按「請 AI 順稿」（需要金鑰）。</p>'+
    '<textarea id="a-new" style="min-height:140px">'+esc(out)+'</textarea>'+
    '<div class="row"><button id="a-copy">複製改寫後的文章</button><button id="a-to-check">拿去「① 等級檢核」</button><label>AI <select id="a-ai"><option value="puter">Puter（免金鑰）</option><option value="gemini">Gemini</option><option value="claude">Claude</option></select></label><button id="a-polish">請 AI 順稿（只改換過的句子）</button></div><div id="a-pol"></div></div>';
  $("a-out").querySelector("#mine").outerHTML=mineCard()}
/* 請 AI 順稿：只處理含有換過說法的句子；改完用詞表確認沒有變得更超綱，通過的才列出，老師勾選後套用 */
async function artPolish(){var box=$("a-pol"),text=$("a-new").value,t=ART.t,ai=$("a-ai").value,ins=ART.ins||[];
  var ss=splitSent(text).filter(function(x){return ins.some(function(s){return x.s.indexOf(s)>=0})});
  if(!ss.length){box.textContent="沒有換過的句子。";return}
  var props=[];ART.props=props;
  try{for(var k=0;k<ss.length;k++){box.textContent="AI 順稿中…（"+(k+1)+"／"+ss.length+"）";var s=ss[k].s.trim(),base=analyze(s,t,EX).over,best=null,res=null;
      var p0="請把下面這個句子改寫成通順自然的臺灣華語，意思不變，不要增加新的內容；詞語和句型只用臺灣華語文能力基準（TBCL）第 "+t+" 級（含以下）。只輸出改寫後的句子。\\n句子："+s,pr=p0;
      for(var i=1;i<=2;i++){res=await callAI(ai,pr);var o=res.text.trim().replace(/^[「"]|[」"]$/g,""),a=analyze(o,t,EX);if(!best||a.over<best.a.over)best={s:o,a:a};if(a.over<=base)break;pr=p0+"\\n上一版仍有超出的詞："+a.list.slice(0,10).map(function(z){return z.w}).join("、")+"。請改用較簡單的說法。"}
      if(best&&best.s!==s&&best.a.over<=base)props.push({from:s,to:best.s,over:best.a.over,base:base});
      logAI("整篇改寫後順稿","AI（"+res.model+"）","把換過說法的句子改成通順","AI 改寫 → 程式用 TBCL 詞表確認沒有更超綱 → 老師勾選後套用",p0.slice(0,60))}
    box.innerHTML=props.length?'<p class="note">勾選要採用的順稿：</p>'+props.map(function(p,i){return'<label class="chk" style="display:flex"><input type="checkbox" class="ap" data-i="'+i+'" checked><span>'+esc(p.from)+'<br>→ <b>'+esc(p.to)+'</b>（超綱詞 '+p.base+' → '+p.over+'）</span></label>'}).join("")+'<button id="a-polish-apply" class="pri">套用勾選的順稿</button>':'沒有找到比現在更好的順稿。'}
  catch(e){box.textContent="失敗："+e.message}}
$("a-run").onclick=doArt;
$("a-out").addEventListener("click",function(e){var id=e.target.id,act=e.target.getAttribute&&e.target.getAttribute("data-act");
  if(id==="a-best"){document.querySelectorAll("#a-out select.ar").forEach(function(s){if(s.querySelector('option[value="c0"]'))s.value="c0"})}
  else if(id==="a-keep"){document.querySelectorAll("#a-out select.ar").forEach(function(s){s.value="keep"})}
  else if(id==="a-apply")artApply();
  else if(id==="a-polish")artPolish();
  else if(id==="a-polish-apply"){var v=$("a-new").value;document.querySelectorAll("#a-pol input.ap").forEach(function(c){if(c.checked){var p=ART.props[+c.getAttribute("data-i")];var i=v.indexOf(p.from);if(i>=0)v=v.slice(0,i)+p.to+v.slice(i+p.from.length)}});$("a-new").value=v;$("a-pol").textContent="已套用。"}
  else if(id==="a-copy"){var tx=$("a-new").value;navigator.clipboard.writeText(tx).then(function(){alert("已複製")},function(){prompt("複製：",tx)})}
  else if(id==="a-to-check"){$("txt").value=$("a-new").value;$("lv").value=ART.t;tab("check");doCheck()}
  else if(act==="delmine"){delete MINE[e.target.getAttribute("data-s")];saveMine();$("mine").outerHTML=mineCard()}
  else if(act==="mine-export"){var js=JSON.stringify(MINE);navigator.clipboard.writeText(js).then(function(){alert("已複製")},function(){prompt("複製：",js)})}
  else if(act==="mine-import"){try{var o=JSON.parse($("mine-in").value);Object.keys(o).forEach(function(k){if(typeof o[k]==="string")MINE[k]=o[k]});saveMine();$("mine").outerHTML=mineCard()}catch(er){alert("格式不對")}}});


/* ===== ✨ 一鍵改寫：貼文章、選等級、按一個鈕 ===== */
var QK=null,QSAFE=["我的換法","精選說法","辭典說法","辭典說法（再簡化）"];     // 自動只採用：我的換法、精選說法，以及「只有一個意思」的辭典說法（多義詞如「如何」會選錯意思）；其他列成按鈕讓老師決定
/* 依「每個詞選哪個候選」把文章改寫成新文字（含依位置選形式、接合、請檢查提示）。choiceFn(item) 回傳 {c:候選}／{note:候選}／{custom:文字}／null */
function buildRewrite(r,items,choiceFn,t){var ch={};items.forEach(function(it){var c=choiceFn(it);if(c)ch[it.w]=c});
  var T=r.toks,out="",html="",n=0,warns=[],ins=[];
  T.forEach(function(tk,i){var c=tk.han&&Object.prototype.hasOwnProperty.call(ch,tk.w)?ch[tk.w]:null;if(!c){out+=tk.w;html+=esc(tk.w);return}
    var prev=i>0?T[i-1].w:"",next=i+1<T.length?T[i+1].w:"",role=roleAt(prev,next),to,w=tk.w;
    if(role==="C"&&i>1)prev=T[i-2].w;
    if(c.custom)to=c.custom;
    else if(c.note)to=w+"（"+formFor(c.note,"P",prev,next).text+"）";
    else{var f=formFor(c.c,role,prev,next);to=f.text;if(f.warn)warns.push(T.slice(Math.max(0,i-4),i).map(function(x){return x.w}).join("")+"【"+to+"】"+T.slice(i+1,i+5).map(function(x){return x.w}).join(""))}
    out+=to;html+='<mark>'+esc(to)+'</mark>';ins.push(to);n++});
  return{out:out,html:html,n:n,warns:warns,ins:ins}}
function levelWords(t,n){var arr=[];LV.forEach(function(l,w){if(l<=t&&w.length>=1&&!EXT.has(w))arr.push(w)});
  var F=FREQV||new Map();arr.sort(function(a,b){return((F.get(a)||{rank:1e9}).rank)-((F.get(b)||{rank:1e9}).rank)});return arr.slice(0,n)}
function qPrompt(text,t,bad,prev,ctx){var vw=levelWords(t,t<=3?700:450).join("、");
  return"請把下面的文章改寫成適合「臺灣華語文能力基準（TBCL）第 "+t+" 級」學習者讀的版本。\n規則：\n"+
  "1. 一句對一句：每個原句改成一到兩個短句，不要合併、不要刪掉、不要換順序。\n"+
  "2. 只改寫原文已有的意思。不要加任何原文沒有的評論、感想或形容（例如「很有意思」「很重要」「很棒」），也不要補充原文沒提到的資訊。\n"+
  "3. 人名、地名、機構名、英文和數字保持原樣。\n"+
  "4. 太難的詞，換成意思相同的簡單說法；如果找不到簡單說法、又不能省略，就保留原詞，第一次出現時在後面用括號寫一個簡單的解釋。\n"+
  "5. 用詞和句型盡量只用第 "+t+" 級（含以下）的。\n"+
  "6. 句子要像臺灣人平常會說的話，通順自然，保留原本的段落。\n"+
  (bad.length?"7. 這些詞對學生太難，請避免使用，改用簡單的說法："+bad.join("、")+"。\n":"")+
  "8. 只輸出改寫後的文章，不要加說明。\n\n參考：第 "+t+" 級以內的常用詞（可以多用這些）：\n"+vw+"\n\n"+
  (ctx?"前面已經改好的部分（只用來接上語氣，不要重寫）：\n"+ctx+"\n\n":"")+
  (prev?"原文：\n"+text+"\n\n你上一次的改寫（還有難詞，請在它的基礎上修改，並對照原文，確認沒有加或漏意思）：\n"+prev:"原文：\n"+text)}

/* ---- AI 引擎：Puter（免金鑰，使用者用自己的 Puter 帳號）／自己的金鑰／不用 AI ---- */
function engine(){var e="puter";try{e=localStorage.getItem("mm_tbcl_engine")||"puter"}catch(x){}return e}
function setEngine(e){try{localStorage.setItem("mm_tbcl_engine",e)}catch(x){}}
function aiReady(){var e=engine();if(e==="none")return false;if(e==="puter")return!!window.puter;if(e==="gemini")return!!keyOf("mm_gemini_key");if(e==="claude")return!!keyOf("mm_tr_aikey");return false}
async function ensureAi(){if(engine()!=="puter")return aiReady();if(!window.puter)return false;try{if(!(puter.auth&&puter.auth.isSignedIn&&puter.auth.isSignedIn()))await puter.auth.signIn();return true}catch(e){return false}}
var PMODEL=null;
async function callPuter(prompt){if(!window.puter)throw new Error("AI 服務沒有載入（請確認網路可以連到 js.puter.com）");
  if(!PMODEL){PMODEL="";try{var ls=await puter.ai.listModels();var ids=(ls||[]).map(function(m){return m&&m.id?m.id:String(m)});
    PMODEL=ids.filter(function(x){return/claude.*sonnet/i.test(x)})[0]||ids.filter(function(x){return/claude/i.test(x)})[0]||ids.filter(function(x){return/gemini.*flash/i.test(x)})[0]||""}catch(e){}}
  var r=await puter.ai.chat(prompt,PMODEL?{model:PMODEL}:{}),tx=typeof r==="string"?r:(r&&r.message&&r.message.content!=null?(Array.isArray(r.message.content)?r.message.content.map(function(c){return c.text||""}).join(""):String(r.message.content)):(r&&r.text)||String(r));
  return{text:tx,model:"Puter "+(PMODEL||"預設模型")}}
async function aiText(prompt){var e=engine();return e==="puter"?callPuter(prompt):callAI(e,prompt)}
/* 長文章分段（每段約 450 字，在句號處切），逐段改寫，每段用詞表檢核、超綱就帶著超綱詞再改，最多 3 輪 */
function chunkText(text,max){var ps=text.split(/\n+/).filter(function(x){return x.trim()}),out=[];
  ps.forEach(function(p){var ss=splitSent(p),buf="";ss.forEach(function(s){if(buf&&buf.length+s.s.length>max){out.push(buf);buf=""}buf+=s.s});if(buf)out.push(buf)});return out}
async function aiRewriteText(text,t,lim,onStep){var chunks=chunkText(text,260),res=[],models={};
  for(var k=0;k<chunks.length;k++){var c=chunks[k],base=analyze(c,t,EX),best={s:c,a:base},ctx=res.length?res[res.length-1].slice(-90):"";
    if(base.ratio>lim||base.over>0){var bad=base.list.slice(0,15).map(function(x){return x.w}),prev="";
      for(var round=1;round<=3;round++){onStep("AI 改寫中…第 "+(k+1)+"／"+chunks.length+" 段"+(round>1?"（再修一次）":""));
        var r=await aiText(qPrompt(c,t,bad,prev,ctx)),o=r.text.trim().replace(/^```[a-z]*\n?|```$/g,"").trim();models[r.model]=1;
        if(!o)break;var a=analyze(o,t,EX);if(a.over<best.a.over||best.s===c)best={s:o,a:a};if(a.ratio<=lim*0.6||a.over===0)break;prev=best.s;bad=a.list.slice(0,15).map(function(x){return x.w})}}
    res.push(best.s)}
  logAI("一鍵改寫","AI（"+Object.keys(models).join("、")+"）","把文章改寫成指定 TBCL 等級","AI 依等級與難詞清單，一次改幾句，每段用 TBCL 詞表檢查，還有難詞就對照原文再修（每段最多 3 次）→ 老師確認","一鍵改寫 第 "+t+" 級");
  return res.join("\n")}
/* 改完再請 AI 對照原文，找出「多加了意思、漏掉、改錯」的句子 */
async function aiVerify(orig,out){var p="下面是原文和改寫後的文章。請找出改寫後意思有問題的句子：(1) 加了原文沒有的意思或評論；(2) 漏掉原文重要的資訊；(3) 意思改錯、不通順。只列真的有問題的，最多 6 個。\n只輸出 JSON 陣列：[{\"orig\":\"原文裡對應的句子\",\"new\":\"改寫後文章裡對應的句子（必須和改寫後文章的字完全一樣）\",\"problem\":\"一句話說明問題\"}]；沒有問題就輸出 []。\n\n原文：\n"+orig+"\n\n改寫後：\n"+out;
  var r=await aiText(p),m=r.text.match(/\[[\s\S]*\]/);if(!m)return[];var arr;try{arr=JSON.parse(m[0])}catch(e){return[]}
  logAI("一鍵改寫後檢查意思","AI（"+r.model+"）","對照原文，找出改寫時多加、漏掉或改錯的句子","AI 對照原文和改寫稿 → 老師決定要不要重改","檢查改寫");
  return(Array.isArray(arr)?arr:[]).filter(function(x){return x&&typeof x["new"]==="string"&&out.indexOf(x["new"])>=0&&x["new"]!==x.orig}).slice(0,6)}
async function aiRedo(item,t){var p="請重新改寫下面這個句子：意思要和原句一致，不要加原句沒有的意思或評論；用詞和句型盡量只用臺灣華語文能力基準（TBCL）第 "+t+" 級（含以下），太難的詞換成簡單的說法，找不到簡單說法就保留原詞並在後面用括號解釋；句子要通順自然。\n原句："+item.orig+"\n目前的改寫："+item["new"]+"\n問題："+item.problem+"\n只輸出重新改寫後的句子。";
  var r=await aiText(p);return r.text.trim().replace(/^```[a-z]*\n?|```$/g,"").replace(/^[「"]|[」"]$/g,"").trim()}

/* ---- 畫面 ---- */
var QSAMPLES=["台灣的夜市文化聞名國際，每到傍晚，各式各樣的小吃攤位就擠滿了人潮。許多外國遊客慕名而來，品嚐珍珠奶茶、臭豆腐和蚵仔煎，體驗當地獨特的飲食文化。",
  "桃花源裡落英繽紛，芳草鮮美。村人怡然自樂，過著與世無爭的生活。他們見到漁人，大吃一驚，問他從哪裡來。",
  "隨著人工智慧技術的快速發展，假影音和假語音日益增加，不僅影響選舉的公平，也使民眾難以分辨真偽，因此政府必須健全法制，守住民主防線。"];
var QLEVEL_LINE=["我喜歡喝茶，你呢？","昨天我和朋友去夜市，吃了很多好吃的東西。","因為下雨，所以我們決定在家看電影。","他每天早上跑步，希望身體可以更健康。","這個城市的交通很方便，吸引了許多外國遊客。","隨著科技的進步，人們的生活方式也產生了很大的改變。","面對日益嚴峻的環境問題，各國政府必須採取更積極的因應措施。"];
function qLevel(){return+$("q-lv").value}
function qBuildLevels(){var box=$("q-levels");box.innerHTML="";
  for(var i=1;i<=7;i++){var b=document.createElement("button");b.type="button";b.setAttribute("data-l",i);b.innerHTML='<b>'+i+'</b><span></span>';box.appendChild(b)}}
function qSyncLevel(){var t=qLevel(),cnt={};LV.forEach(function(l){cnt[l]=(cnt[l]||0)+1});var acc=0,tot={};for(var i=1;i<=7;i++){acc+=cnt[i]||0;tot[i]=acc}
  document.querySelectorAll("#q-levels button").forEach(function(b){var l=+b.getAttribute("data-l");b.setAttribute("aria-pressed",l===t?"true":"false");b.querySelector("span").textContent=tot[l]?tot[l].toLocaleString():""});
  $("q-run-t").textContent="改寫成第 "+t+" 級";
  $("q-lvsample").textContent="第 "+t+" 級以內共 "+(tot[t]||0).toLocaleString()+" 個詞。例：「"+QLEVEL_LINE[t-1]+"」"}
function qSteps(names,on){var ol=$("q-steps");ol.hidden=!names;if(!names)return;ol.innerHTML=names.map(function(n,i){return'<li class="'+(i<on?"done":i===on?"on":"")+'">'+(i<on?"✓ ":i===on?'<span class="spin"></span>':"")+n+"</li>"}).join("")}
function qMark(text,t,cls){var a=analyze(text,t,EX),h="";a.toks.forEach(function(tk){h+=tk.han&&(tk.st==="over"||tk.st==="unk")?'<span class="'+cls+'" title="'+(tk.lv==null?"詞表沒有":"第 "+tk.lv+" 級")+'">'+esc(tk.w)+'</span>':esc(tk.w)});return{a:a,html:h}}
function qShow(out,marks,warns,note){var t=QK.t,lim=QK.lim,nw=qMark(out,t,"left"),og=qMark(QK.text,t,"hard"),a=nw.a,okp=a.ratio<=lim;QK.cur=out;QK.a=a;
  var h='<div class="stats"><span class="n '+(okp?"ok":"bad")+'">'+a.ratio.toFixed(1)+'%</span><span>超綱（原文 '+QK.orig.toFixed(1)+'%）</span><span>標準 '+lim+'% 以內</span>'+
    (okp?'<span class="v ok">符合</span>':'<span class="v bad">還差 '+(a.ratio-lim).toFixed(1)+' 個百分點</span>')+'</div>'+
    (note?'<p class="note-line">'+esc(note)+'</p>':'')+
    '<div class="cols"><div class="col"><h4>原文</h4><div class="rtext">'+og.html+'</div></div>'+
    '<div class="col"><h4>第 '+t+' 級版本</h4><div id="q-view" class="rtext">'+(marks||nw.html)+'</div><textarea id="q-new" hidden>'+esc(out)+'</textarea>'+
    '<div class="actions"><button class="btn pri" id="q-copy">複製</button><button class="btn" id="q-edit">編輯</button>'+(a.list.length&&aiReady()?'<button class="btn" id="q-again">再請 AI 改一次</button>':'')+'</div></div></div>'+
    (warns&&warns.length?'<p class="hint" style="margin-top:10px">這幾處換進去可能不通順：<br>'+warns.map(esc).join('<br>')+'</p>':'')+
    (QK.checks&&QK.checks.length?'<div class="rest"><b>請確認這 '+QK.checks.length+' 句有沒有改錯意思</b><span class="hint">（AI 對照原文找到的，不一定都是錯的）</span>'+QK.checks.map(function(c,i){return'<div class="fix"><div class="hint">原文：'+esc(c.orig||"")+'</div><div>改寫：'+esc(c["new"])+'</div><div class="hint" style="color:var(--red)">'+esc(c.problem||"")+'</div><div class="actions"><button class="btn" data-q="redo" data-i="'+i+'">重改這句</button><button class="btn" data-q="okc" data-i="'+i+'">這樣可以</button></div></div>'}).join("")+'</div>':'');
  if(a.list.length){h+='<div class="rest"><b>還有 '+a.list.length+' 個詞超過第 '+t+' 級</b><span class="hint">（點詞可以換掉；人名、地名請按「專有名詞」）</span><div class="chips">'+
    a.list.slice(0,24).map(function(x){return'<button class="chip" data-q="chip" data-w="'+esc(x.w)+'" aria-expanded="false">'+esc(x.w)+'<small>'+(x.lv==null?"未收錄":"第"+x.lv+"級")+(x.n>1?" ×"+x.n:"")+'</small></button>'}).join("")+'</div><div id="q-fix"></div></div>'}
  if(!okp){h+='<details class="more"><summary>不用內建 AI：複製指令到 ChatGPT、Gemini 或 Claude 網頁，再把結果貼回來</summary>'+
    '<p class="hint">指令裡附了這個等級的常用詞和還太難的詞。</p><textarea id="q-prompt" readonly style="width:100%;min-height:90px">'+esc(qPrompt(out,t,a.list.slice(0,15).map(function(x){return x.w})))+'</textarea>'+
    '<div class="actions"><button class="btn" id="q-pcopy">複製指令</button></div><textarea id="q-back" style="width:100%;min-height:90px;margin-top:10px" placeholder="把 AI 改好的文章貼在這裡"></textarea><div class="actions"><button class="btn" id="q-bcheck">檢查這篇</button></div></details>'}
  $("q-out").innerHTML=h}
function qFixPanel(w){var t=QK.t,cs=dictCands(w,t).slice(0,4),h='<div class="fix"><b>'+esc(w)+'</b>　<span class="hint">可以換成：</span>';
  cs.forEach(function(c){h+=' <button class="cand" data-q="alt" data-w="'+esc(w)+'" data-cid="'+c.id+'">'+esc(c.c)+'<small>'+c.src+'</small></button>'});
  if(!cs.length)h+='<span class="hint">詞庫裡沒有適合這個等級的說法。</span>';
  h+='<div class="row"><input class="qc" placeholder="自己輸入要換成的詞" size="14"><button data-q="swap" data-w="'+esc(w)+'">換掉</button><button data-q="proper" data-w="'+esc(w)+'">這是專有名詞，不計入</button></div></div>';$("q-fix").innerHTML=h}
async function quickGo(){var text=$("q-txt").value,t=qLevel(),lim=+$("q-lim").value;if(!text.trim()){$("q-out").innerHTML='<p class="hint">請先貼上文章。</p>';return}
  var useAi=false;if(engine()!=="none")useAi=await ensureAi();       // 要在按鈕點擊的當下登入（瀏覽器只允許使用者操作時開登入視窗）
  var btn=$("q-run");btn.disabled=true;var steps=["分析文章","換成簡單說法"].concat(useAi?["AI 改寫","檢核"]:["檢核"]);
  try{qSteps(steps,0);await load();await Promise.all([loadSyn(),loadFreq().then(function(m){FREQV=m})]);
    var r=analyze(text,t,EX),items=artItems(r,t);QK={text:text,t:t,lim:lim,orig:r.ratio};qSteps(steps,1);
    var res=buildRewrite(r,items,function(it){var c=it.cs.filter(function(x){return QSAFE.indexOf(x.src)>=0&&(x.src==="我的換法"||x.src==="精選說法"||x.one)})[0];return c?{c:c}:null},t),out=res.out,note="";
    var a1=analyze(out,t,EX),aiUsed=false;
    if(useAi&&a1.ratio>lim){qSteps(steps,2);
      try{var ai=await aiRewriteText(text,t,lim,function(m){var li=document.querySelectorAll("#q-steps li")[2];if(li)li.lastChild.textContent=m});
        var a2=analyze(ai,t,EX);if(a2.ratio<=a1.ratio+1){out=ai;note="AI 改寫過，已用詞表檢查。";aiUsed=true}else note="AI 改的沒有比詞庫換詞好，留用詞庫換詞的結果。"}
      catch(e){note="AI 沒有成功（"+e.message+"），先顯示詞庫換詞的結果。"}}
    else if(!useAi&&a1.ratio>lim&&engine()!=="none")note="沒有登入 AI，只用詞庫換詞。要改用其他方式，到右上角「其他工具」→「AI 設定」。";
    QK.checks=[];
    if(aiUsed){qSteps(steps.concat(["檢查有沒有改錯意思"]),steps.length);try{QK.checks=await aiVerify(text,out)}catch(e){QK.checks=[]}}
    qSteps(null);qShow(out,out===res.out&&res.n?res.html:"",res.warns,note)}
  catch(e){$("q-out").innerHTML='<p class="hint">失敗：'+esc(e.message)+'</p>';qSteps(null)}
  btn.disabled=false}
async function quickAgain(){var out=$("q-new").value;if(!await ensureAi())return;var st=["AI 再改一次"];qSteps(st,0);
  try{var ai=await aiRewriteText(out,QK.t,QK.lim,function(m){var li=document.querySelector("#q-steps li");if(li)li.lastChild.textContent=m});try{QK.checks=await aiVerify(QK.text,ai)}catch(e){QK.checks=[]}qSteps(null);qShow(ai,"",[],"又請 AI 改了一次。")}catch(e){qSteps(null);qShow(out,"",[],"AI 沒有成功（"+e.message+"）。")}}
$("q-run").onclick=quickGo;
document.querySelectorAll("[data-sample]").forEach(function(b){b.onclick=function(){var t=$("q-txt");t.value=QSAMPLES[+b.getAttribute("data-sample")];t.dispatchEvent(new Event("input"));t.focus()}});
$("q-txt").oninput=function(){$("q-count").textContent=this.value.replace(/\s/g,"").length+" 字"};
$("q-levels").onclick=function(e){var b=e.target.closest("button");if(!b)return;$("q-lv").value=b.getAttribute("data-l");qSyncLevel()};
function qLim(v){$("q-lim").value=v;$("q-lim15").setAttribute("aria-pressed",v===15?"true":"false");$("q-lim10").setAttribute("aria-pressed",v===10?"true":"false")}
$("q-lim15").onclick=function(){qLim(15)};$("q-lim10").onclick=function(){qLim(10)};
$("q-out").addEventListener("click",function(e){var bt=e.target.closest("button");if(!bt)return;var id=bt.id,q=bt.getAttribute("data-q");
  var cp=function(v){navigator.clipboard.writeText(v).then(function(){bt.textContent="已複製 ✓"},function(){prompt("複製：",v)})};
  if(id==="q-copy")cp($("q-new").value);
  else if(id==="q-edit"){var ta=$("q-new"),vw=$("q-view");ta.hidden=!ta.hidden;vw.hidden=!ta.hidden;bt.textContent=ta.hidden?"編輯":"完成";if(ta.hidden)qShow(ta.value,"",[])}
  else if(id==="q-again")quickAgain();
  else if(id==="q-pcopy")cp($("q-prompt").value);
  else if(id==="q-bcheck"){var v=$("q-back").value.trim();if(v)qShow(v,"",[])}
  else if(q==="chip"){var open=bt.getAttribute("aria-expanded")==="true";document.querySelectorAll("#q-out .chip").forEach(function(c){c.setAttribute("aria-expanded","false")});if(open){$("q-fix").innerHTML=""}else{bt.setAttribute("aria-expanded","true");qFixPanel(bt.getAttribute("data-w"))}}
  else if(q==="okc"){QK.checks.splice(+bt.getAttribute("data-i"),1);qShow($("q-new").value,"",[])}
  else if(q==="redo"){var it=QK.checks[+bt.getAttribute("data-i")];bt.disabled=true;bt.textContent="重改中…";
    aiRedo(it,QK.t).then(function(ns){var cur=$("q-new").value;if(ns&&cur.indexOf(it["new"])>=0){QK.checks.splice(QK.checks.indexOf(it),1);qShow(cur.replace(it["new"],ns),"",[],"已重改一句。")}else{bt.disabled=false;bt.textContent="重改這句"}}).catch(function(e){bt.disabled=false;bt.textContent="重改這句（失敗）"})}
  else if(q==="proper"){EX.add(bt.getAttribute("data-w"));qShow($("q-new").value,"",[])}
  else if(q==="alt"){var cd=CANDREG[bt.getAttribute("data-cid")],w0=bt.getAttribute("data-w");if(cd){var txt=$("q-new").value,i=txt.indexOf(w0);if(i>=0){var role=roleAt(txt[i-1],txt[i+w0.length]);txt=txt.slice(0,i)+formFor(cd,role,role==="C"?txt.slice(Math.max(0,i-3),i-1):txt.slice(Math.max(0,i-2),i),txt[i+w0.length]).text+txt.slice(i+w0.length);qShow(txt,"",[])}}}
  else if(q==="swap"){var w=bt.getAttribute("data-w"),inp=document.querySelector("#q-fix input.qc");if(inp&&inp.value.trim())qShow($("q-new").value.split(w).join(inp.value.trim()),"",[])}});
function engineUi(){var e=engine();document.querySelectorAll('input[name=eng]').forEach(function(r){r.checked=r.value===e;r.onchange=function(){if(r.checked){setEngine(r.value);engineHint()}}})}
function engineHint(){var e=engine(),m={puter:"AI：Puter（第一次要登入免費帳號）",gemini:"AI：Gemini（自己的金鑰）",claude:"AI：Claude（自己的金鑰）",none:"不用 AI（只用詞庫換詞）"};$("q-ai-hint").textContent=m[e]||""}

/* 分頁 */
function tab(n){["quick","engine","check","gen","inv","kwic","gram","art"].forEach(function(k){$("p-"+k).hidden=k!==n});[].forEach.call($("tabs").children,function(b){b.className=b.getAttribute("data-t")===n?"on":""});
  $("crumb").classList.toggle("show",n!=="quick");$("tabs").classList.remove("open");$("menu-btn").setAttribute("aria-expanded","false");
  if(n==="inv")doInv();if(n==="gram")$("gr-lv").onchange();if(n==="engine")engineUi();window.scrollTo(0,0)}
$("tabs").onclick=function(e){var b=e.target.closest("button"),t=b&&b.getAttribute("data-t");if(t)tab(t)};
$("crumb").onclick=function(){tab("quick");engineHint()};
$("menu-btn").onclick=function(e){e.stopPropagation();var o=$("tabs").classList.toggle("open");$("menu-btn").setAttribute("aria-expanded",o?"true":"false")};
document.addEventListener("click",function(e){if(!e.target.closest(".menu-wrap")){$("tabs").classList.remove("open");$("menu-btn").setAttribute("aria-expanded","false")}});
fillLv($("lv"),3);fillLv($("q-lv"),3);qBuildLevels();qSyncLevel();engineHint();fillLv($("a-lv"),3);fillLv($("g-lv"),3);fillLv($("i-lv"),3);renderLog();
var q=new URLSearchParams(location.search);if(q.get("level"))$("lv").value=$("g-lv").value=$("i-lv").value=q.get("level");
load().then(qSyncLevel);
window.MMTBCL={load:load,levelOf:levelOf,analyze:analyze};
})();
