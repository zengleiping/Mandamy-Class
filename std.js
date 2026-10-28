/* 曼米中文 · 等級標準（共用）
 * 老師選一次想用哪套標準看教材，存在這個瀏覽器（localStorage: mm_std），
 * 所有頁面（教材、生詞表製作、TBCL 工具）會跟著切換。
 *   MMStd.get() / MMStd.set(id)        目前標準
 *   MMStd.ready()                      載入該標準需要的詞表（Promise）
 *   MMStd.vocabLabel(record)           一筆生詞的等級字樣，例如「TBCL 3」「HSK 2」「入門級」，沒有就是 ""
 *   MMStd.grammarLabel(name)           一個語法點的等級字樣（目前只有 TBCL 有語法點表）
 *   MMStd.mount(el)                    在 el 裡放「等級標準」下拉選單
 *   MMStd.onChange(fn)                 標準改變時呼叫 fn(id)（含別的視窗／iframe 改的） */
(function(){
"use strict";
var BASE=(function(){var s=document.currentScript&&document.currentScript.src;return s?s.replace(/[^\/]*$/,""):""})();
var LIST=[
  {id:"tocfl",label:"TOCFL 華語八千詞（華測會）"},
  {id:"tbcl",label:"TBCL 臺灣華語文能力基準（國教院）"},
  {id:"hsk21",label:"HSK 3.0（2021 版）"},
  {id:"hsk26",label:"HSK 3.0（2026 新版）"},
  {id:"none",label:"不顯示等級"}];
var KEY="mm_std",cbs=[],cache={};
function lsGet(){try{return localStorage.getItem(KEY)}catch(e){return null}}
function get(){var v=lsGet();return LIST.some(function(x){return x.id===v})?v:"tocfl"}
function set(id){if(!LIST.some(function(x){return x.id===id}))return;try{localStorage.setItem(KEY,id)}catch(e){}fire(id)}
function fire(id){cbs.slice().forEach(function(f){try{f(id)}catch(e){}})}
function onChange(f){cbs.push(f)}
window.addEventListener("storage",function(e){if(e.key===KEY)ready().then(function(){fire(get())})});

function txt(path){return cache[path]||(cache[path]=fetch(BASE+path).then(function(r){if(!r.ok)throw new Error(path);return r.text()}))}
var TB=null,HSK={21:null,26:null},GR=null,tbMap=null,hskMap=null,gramList=null;
var GRAM_WORD={"了":2,"著":2};   /* 詞語表沒有單獨收的虛詞，依語法點表（V了、V著＝第 2 級） */
function loadTbcl(){return TB||(TB=txt("tools/tbcl/data/tbcl.tsv").then(function(t){var m=new Map();
  t.split("\n").forEach(function(ln){if(!ln||ln[0]==="#")return;var f=ln.split("\t"),l=parseInt(f[1],10);if(f[0]&&l>=1&&l<=7){var o=m.get(f[0]);if(!o||l<o.l)m.set(f[0],{l:l,star:f[2]==="*"})}});
  Object.keys(GRAM_WORD).forEach(function(w){var o=m.get(w);if(!o||GRAM_WORD[w]<o.l)m.set(w,{l:GRAM_WORD[w],star:false})});tbMap=m;return m}).catch(function(){return new Map()}))}
function loadGram(){return GR||(GR=txt("tools/tbcl/data/grammar.json").then(JSON.parse).then(function(g){gramList=g;return g}).catch(function(){return[]}))}
function loadHsk(v){var p=v==="hsk21"?"n":"t",k=v==="hsk21"?21:26;
  return HSK[k]||(HSK[k]=txt("tools/vocab/data/hsk.tsv").then(function(t){var m=new Map(),re=new RegExp(p+"(\\d)");
    t.split("\n").forEach(function(ln){var f=ln.split("\t");if(f.length<3)return;var mm=re.exec(f[2]);if(!mm)return;var l=+mm[1];
      [f[0]].concat((f[1]||"").split(",")).forEach(function(w){if(w&&(!m.has(w)||l<m.get(w)))m.set(w,l)})});m._for=v;return m}).catch(function(){return new Map()}))}
function ready(){var s=get();
  if(s==="tbcl")return Promise.all([loadTbcl(),loadGram()]);
  if(s==="hsk21"||s==="hsk26")return loadHsk(s).then(function(m){hskMap=m});
  return Promise.resolve()}

var HSKN=["HSK 1","HSK 2","HSK 3","HSK 4","HSK 5","HSK 6","HSK 7–9"];
/* 同步查詢：要先等 ready() 再呼叫（切換時各頁面都會在 onChange 之後才重畫） */
function snapshot(){}
function vocabLabel(rec){var s=get(),w=rec&&rec["生詞"];if(s==="none"||!w)return"";
  if(s==="tocfl"){var t=rec["TOCFL等級"];return t&&t!=="未收錄"?t:""}
  if(s==="tbcl"){if(!tbMap)return"";var o=tbMap.get(w);return o?"TBCL "+o.l+(o.star?"*":""):""}
  if(!hskMap||hskMap._for!==s)return"";var l=hskMap.get(w);return l?HSKN[l-1]:""}
var ALIAS={"是":"繫動詞"};   /* 教材常用名稱與官方語法點名稱不同的對照 */
var strip=function(s){return String(s).replace(/[（(][^）)]*[）)]/g,"").replace(/[0-9０-９.\s_…⋯。~～]/g,"")};
function grammarLabel(name){if(get()!=="tbcl"||!gramList)return"";var core=strip(name||"");if(!core)return"";var best=null;
  gramList.forEach(function(g){var alts=strip(g.name).split(/[／/、，,]/).filter(Boolean);
    if(alts.some(function(a){return a===core||a===(ALIAS[core]||"")})){if(!best||g.lv<best.lv)best=g}});
  return best?"TBCL "+best.lv+(best.star?"*":"")+"（參考）":""}

function mount(el){var css=document.getElementById("mm-std-css");if(!css){css=document.createElement("style");css.id="mm-std-css";
    css.textContent=".mm-std{display:inline-flex;align-items:center;gap:6px;font-size:13px}.mm-std select{font:inherit;padding:4px 6px;border-radius:8px;border:1px solid #d8cfc2;background:#fff;color:inherit;max-width:230px}";document.head.appendChild(css)}
  var lab=document.createElement("label");lab.className="mm-std";lab.title="老師想用哪一套標準看教材的等級";lab.appendChild(document.createTextNode("等級標準"));
  var sel=document.createElement("select");LIST.forEach(function(x){var o=document.createElement("option");o.value=x.id;o.textContent=x.label;sel.appendChild(o)});sel.value=get();
  sel.onchange=function(){set(sel.value)};onChange(function(id){sel.value=id});lab.appendChild(sel);el.appendChild(lab);return sel}
/* 切換時先把詞表備好，再通知各頁面重畫 */
var _fire=fire;fire=function(id){ready().then(function(){snapshot();setTimeout(function(){_fire(id)},0)})};
ready().then(snapshot);
function tbclLevel(w){if(!tbMap)return null;var o=tbMap.get(w);return o?{level:o.l,star:o.star}:null}
window.MMStd={tbclLevel:tbclLevel,LIST:LIST,get:get,set:set,ready:ready,vocabLabel:vocabLabel,grammarLabel:grammarLabel,mount:mount,onChange:onChange,label:function(id){var x=LIST.filter(function(y){return y.id===(id||get())})[0];return x?x.label:""}};
})();
