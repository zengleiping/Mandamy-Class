/*!
 * 曼米中文 Mandamy · 生詞表製作（備課工具）
 * 原始工具：厭世華師教學筆記（作者授權改寫）。功能與互動邏輯完整保留；
 * 曼米版調整：資料檔路徑（MMV.data）、元件路徑（MMV.vendor）、品牌字樣（MMV.brand）、匯出配色、
 * 欄位名稱對齊教材庫（英文翻譯、TOCFL 等級）、分頁切換、每一課各自保存，以及嵌入用的訊息介面（見檔案最後）。
 * 已移除：錯誤回報、使用統計、贊助邀請。
 * 設定請看 index.html 的 window.MMV_CONFIG 與 README.md。
 */
/* ===== 語言資料引擎：詞典、分級、拼音／注音、繁簡轉換、斷詞 ===== */
const Lang=(()=>{
const LEVELS={
  tocfl:{label:'TOCFL 等級',names:['準備一級','準備二級','入門級','基礎級','進階級','高階級','流利級']},
  hsk26:{label:'HSK 等級（2026 新版）',prefix:'t',names:['HSK 1','HSK 2','HSK 3','HSK 4','HSK 5','HSK 6','HSK 7–9']},
  hsk21:{label:'HSK 等級（2021 版）',prefix:'n',names:['HSK 1','HSK 2','HSK 3','HSK 4','HSK 5','HSK 6','HSK 7–9']},
  hsk20:{label:'HSK 等級（舊版）',prefix:'o',names:['HSK 1','HSK 2','HSK 3','HSK 4','HSK 5','HSK 6']}
};
let ready=false;
const E={T:[],S:[],P:[],TW:[],D:[]};
const byT=new Map(),byS=new Map(),tocfl=new Map(),hsk=new Map();
let s2t=new Map(),t2s=new Map(),poly={},SYL=new Set(),maxLen=6;
const keys=new Set();
function text(id){const el=document.getElementById(id);return el?el.textContent:''}
function push(map,k,v){const a=map.get(k);if(a)a.push(v);else map.set(k,[v])}
let dictReady=false;
function addDict(src){
  if(dictReady)return;
  const lines=src.split('\n');
  for(let i=0;i<lines.length;i++){
    const f=lines[i].split('\t');if(f.length<5)continue;
    const t=f[0],s=f[1]||f[0],n=E.T.length;
    E.T.push(t);E.S.push(s);E.P.push(f[2]);E.TW.push(f[3]);E.D.push(f[4]);
    push(byT,t,n);if(s!==t)push(byS,s,n);keys.add(t);keys.add(s);
  }
  dictReady=lines.length>1000;
}
function init(){
  if(ready)return;
  const maps=JSON.parse(text('data-maps'));
  const a=Array.from(maps.s2t),b=Array.from(maps.t2s);
  for(let i=0;i<a.length;i+=2)s2t.set(a[i],a[i+1]);
  for(let i=0;i<b.length;i+=2)t2s.set(b[i],b[i+1]);
  poly=maps.poly;SYL=new Set(maps.syl.split(' '));
  if(document.getElementById('data-cedict'))addDict(text('data-cedict'));
  for(const ln of text('data-tocfl').split('\n')){
    const f=ln.split('\t');if(f.length<4)continue;
    const rec={level:+f[3],pinyin:f[2],trad:f[0],pos:(f[4]||'').trim()};
    push(tocfl,f[0],rec);if(f[1]&&f[1]!==f[0])push(tocfl,f[1],rec);keys.add(f[0]);if(f[1])keys.add(f[1]);
  }
  for(const ln of text('data-hsk').split('\n')){
    const f=ln.split('\t');if(f.length<4)continue;
    const rec={levels:f[2],pinyin:f[3].split(',')[0],simp:f[0],trads:f[1].split(','),pos:(f[4]||'').split(',').filter(Boolean)};
    hsk.set(f[0],rec);keys.add(f[0]);
    for(const t of rec.trads){if(!hsk.has(t))hsk.set(t,rec);keys.add(t)}
  }
  ready=true;
}
const isHan=c=>/[㐀-鿿豈-﫿〇]/.test(c);

/* ---------- 斷詞（雙向最大匹配） ---------- */
function fmm(s){const out=[];let i=0;while(i<s.length){let L=Math.min(maxLen,s.length-i),w=s[i];for(;L>1;L--){const c=s.substr(i,L);if(keys.has(c)){w=c;break}}out.push(w);i+=w.length}return out}
function bmm(s){const out=[];let j=s.length;while(j>0){let L=Math.min(maxLen,j),w=s[j-1];for(;L>1;L--){const c=s.substr(j-L,L);if(keys.has(c)){w=c;break}}out.unshift(w);j-=w.length}return out}
function segRun(s){const a=fmm(s),b=bmm(s);if(a.length!==b.length)return a.length<b.length?a:b;const sa=a.filter(x=>x.length===1).length,sb=b.filter(x=>x.length===1).length;return sb<sa?b:a}
function segment(str){init();const out=[];let buf='';const flush=()=>{if(buf){out.push(...segRun(buf).map(w=>({w,han:true})));buf=''}};
  for(const ch of str){if(isHan(ch))buf+=ch;else{flush();out.push({w:ch,han:false})}}flush();return out}

/* ---------- 繁簡轉換 ---------- */
function convWord(w,toTrad){
  if(w.length===1)return toTrad?(s2t.get(w)||w):(t2s.get(w)||w);
  if(toTrad){const ids=byS.get(w)||[];if(ids.length){const pick=ids.find(i=>tocfl.has(E.T[i]))??ids.find(i=>!/^[A-Z]/.test(E.P[i]))??ids[0];return E.T[pick]}
    if(byT.has(w))return w;const h=hsk.get(w);if(h&&h.simp===w)return h.trads[0];return [...w].map(c=>s2t.get(c)||c).join('')}
  else{const ids=byT.get(w)||[];if(ids.length)return E.S[ids[0]];const t=tocfl.get(w);if(t){const h=hsk.get(w);if(h)return h.simp}return [...w].map(c=>t2s.get(c)||c).join('')}
}
function convert(str,toTrad){if(!str)return str;init();return segment(str).map(t=>t.han?convWord(t.w,toTrad):t.w).join('')}
const toTrad=s=>convert(s,true),toSimp=s=>convert(s,false);

/* ---------- 拼音工具 ---------- */
const TONEV={a:'āáǎà',e:'ēéěè',i:'īíǐì',o:'ōóǒò',u:'ūúǔù','ü':'ǖǘǚǜ'};
const MARK={};for(const [v,s] of Object.entries(TONEV))[...s].forEach((c,i)=>MARK[c]=[v,i+1]);
function numToMark(syl,tone){
  let s=syl.replace(/u:|v/g,'ü');const lower=s.toLowerCase();
  if(!tone||tone===5||tone===0)return s;
  let idx=lower.indexOf('a');if(idx<0)idx=lower.indexOf('e');if(idx<0&&lower.includes('ou'))idx=lower.indexOf('o');
  if(idx<0){for(let i=lower.length-1;i>=0;i--)if('iouü'.includes(lower[i])){idx=i;break}}
  if(idx<0)return s;const base=lower[idx];let m=TONEV[base][tone-1];if(s[idx]!==base)m=m.toUpperCase();return s.slice(0,idx)+m+s.slice(idx+1);
}
/* 音節：{s:'huan',t:1,cap:false} */
function parseNumeric(p){return p.split(/\s+/).filter(Boolean).map(x=>{const m=x.match(/^([A-Za-zü:]+)([1-5])?$/);if(!m)return {raw:x};const base=m[1].replace(/u:|v/g,'ü');return {s:base.toLowerCase(),t:+(m[2]||5),cap:/^[A-Z]/.test(base)}})}
function splitLetters(letters,target){
  const n=letters.length,best=Array.from({length:n+1},()=>new Map());best[0].set(0,-1);
  for(let i=0;i<n;i++){if(!best[i].size)continue;for(let L=1;L<=6&&i+L<=n;L++){if(!SYL.has(letters.slice(i,i+L)))continue;for(const k of best[i].keys()){if(!best[i+L].has(k+1))best[i+L].set(k+1,i)}}}
  if(!best[n].size)return null;
  let ks=[...best[n].keys()];ks.sort((a,b)=>target?(Math.abs(a-target)-Math.abs(b-target))||(a-b):a-b);
  let k=ks[0],j=n;const cuts=[n];while(j>0){const p=best[j].get(k);cuts.unshift(p);j=p;k--}
  const parts=[];for(let i=0;i<cuts.length-1;i++)parts.push([cuts[i],cuts[i+1]]);return parts;
}
function parseMarked(str,target){
  init();const out=[];
  const chunks=str.replace(/[()（）]/g,'').split(/[\s'’\-]+/).filter(Boolean);
  let remaining=target;
  chunks.forEach((chunk,ci)=>{
    let letters='',tones=[],caps=[];
    for(const ch of chunk.normalize('NFC')){const m=MARK[ch.toLowerCase()];
      if(m){letters+=m[0];tones.push(m[1]);caps.push(ch!==ch.toLowerCase())}
      else if(/[a-zA-Zü]/.test(ch)){letters+=ch.toLowerCase();tones.push(0);caps.push(ch!==ch.toLowerCase())}
      else if(ch==='v'){letters+='ü';tones.push(0);caps.push(false)}}
    const est=target&&chunks.length===1?target:0;
    const parts=splitLetters(letters,est);
    if(!parts){out.push({raw:chunk});return}
    for(const [a,b] of parts){let t=5;for(let i=a;i<b;i++)if(tones[i])t=tones[i];out.push({s:letters.slice(a,b),t,cap:caps[a]})}
  });
  return out;
}
const ZI={b:'ㄅ',p:'ㄆ',m:'ㄇ',f:'ㄈ',d:'ㄉ',t:'ㄊ',n:'ㄋ',l:'ㄌ',g:'ㄍ',k:'ㄎ',h:'ㄏ',j:'ㄐ',q:'ㄑ',x:'ㄒ',zh:'ㄓ',ch:'ㄔ',sh:'ㄕ',r:'ㄖ',z:'ㄗ',c:'ㄘ',s:'ㄙ'};
const ZF={a:'ㄚ',o:'ㄛ',e:'ㄜ','ê':'ㄝ',ai:'ㄞ',ei:'ㄟ',ao:'ㄠ',ou:'ㄡ',an:'ㄢ',en:'ㄣ',ang:'ㄤ',eng:'ㄥ',ong:'ㄨㄥ',er:'ㄦ',i:'ㄧ',ia:'ㄧㄚ',io:'ㄧㄛ',ie:'ㄧㄝ',iai:'ㄧㄞ',iao:'ㄧㄠ',iu:'ㄧㄡ',ian:'ㄧㄢ',in:'ㄧㄣ',iang:'ㄧㄤ',ing:'ㄧㄥ',iong:'ㄩㄥ',u:'ㄨ',ua:'ㄨㄚ',uo:'ㄨㄛ',uai:'ㄨㄞ',ui:'ㄨㄟ',uan:'ㄨㄢ',un:'ㄨㄣ',uang:'ㄨㄤ',ueng:'ㄨㄥ','ü':'ㄩ','üe':'ㄩㄝ','üan':'ㄩㄢ','ün':'ㄩㄣ',ue:'ㄩㄝ'};
const ZY={yi:'ㄧ',ya:'ㄧㄚ',yo:'ㄧㄛ',ye:'ㄧㄝ',yai:'ㄧㄞ',yao:'ㄧㄠ',you:'ㄧㄡ',yan:'ㄧㄢ',yin:'ㄧㄣ',yang:'ㄧㄤ',ying:'ㄧㄥ',yong:'ㄩㄥ',yu:'ㄩ',yue:'ㄩㄝ',yuan:'ㄩㄢ',yun:'ㄩㄣ',wu:'ㄨ',wa:'ㄨㄚ',wo:'ㄨㄛ',wai:'ㄨㄞ',wei:'ㄨㄟ',wan:'ㄨㄢ',wen:'ㄨㄣ',wang:'ㄨㄤ',weng:'ㄨㄥ',r:'ㄦ',er:'ㄦ',m:'ㄇ',n:'ㄋ',ng:'ㄫ',hm:'ㄏㄇ',hng:'ㄏㄫ',ê:'ㄝ',e:'ㄜ',a:'ㄚ',o:'ㄛ',ai:'ㄞ',ei:'ㄟ',ao:'ㄠ',ou:'ㄡ',an:'ㄢ',en:'ㄣ',ang:'ㄤ',eng:'ㄥ'};
const ZTONE=['','','ˊ','ˇ','ˋ'];
function sylToZhuyin(s){
  if(ZY[s])return ZY[s];
  const m=s.match(/^(zh|ch|sh|[bpmfdtnlgkhjqxrzcs])(.*)$/);if(!m)return null;
  let [,ini,fin]=m;
  if(['zh','ch','sh','r','z','c','s'].includes(ini)&&fin==='i')return ZI[ini];
  if('jqx'.includes(ini)&&fin.startsWith('u'))fin='ü'+fin.slice(1);
  const f=ZF[fin];if(f===undefined)return null;return ZI[ini]+f;
}
const ZREV=new Map();
function buildRev(){if(ZREV.size)return;for(const s of SYL){const z=sylToZhuyin(s);if(z&&!ZREV.has(z))ZREV.set(z,s)}}
function renderPinyin(sy){
  let out='';sy.forEach((x,i)=>{if(x.raw){out+=(out?' ':'')+x.raw;return}let m=numToMark(x.s,x.t);if(x.cap)m=m[0].toUpperCase()+m.slice(1);
    if(i>0&&!sy[i-1].raw&&/^[aoeāáǎàōóǒòēéěè]/i.test(m)&&x.s!=='r')out+="'";out+=m});return out;
}
function renderZhuyin(sy){return sy.map(x=>{if(x.raw)return x.raw;if(x.s==='r')return 'ㄦ';const z=sylToZhuyin(x.s);if(!z)return numToMark(x.s,x.t);return x.t===5?'˙'+z:z+ZTONE[x.t]}).join(' ')}
function parseZhuyin(str){init();buildRev();return str.trim().split(/\s+/).filter(Boolean).map(tok=>{let t=1,b=tok;if(b.startsWith('˙')){t=5;b=b.slice(1)}const last=b.slice(-1);const ti=ZTONE.indexOf(last);if(ti>1){t=ti;b=b.slice(0,-1)}const s=ZREV.get(b);return s?{s,t,cap:false}:{raw:tok}})}
function parseAny(str,target){if(!str)return [];return /[ㄅ-ㄯ]/.test(str)?parseZhuyin(str):parseMarked(str,target)}
function render(sy,mode){return mode==='zhuyin'?renderZhuyin(sy):renderPinyin(sy)}
const sylKey=sy=>sy.map(x=>x.raw||x.s+x.t).join(' ');

/* ---------- 查詢 ---------- */
function forms(w){init();const t=toTrad(w),s=toSimp(w);return {t,s,list:[...new Set([w,t,s])]}}
function dictIds(w){const f=forms(w);const ids=new Set();for(const x of f.list){(byT.get(x)||[]).forEach(i=>ids.add(i));(byS.get(x)||[]).forEach(i=>ids.add(i))}return [...ids]}
const TAGS={tocfl:['Pre-A1','Pre-A1','A1','A2','B1','B2','C1–C2'],hsk:['初等','初等','初等','中等','中等','中等','高等']};
/* 先用與輸入字形完全相同的詞表條目；查不到才借用繁簡另一個字形 */
function ownTocfl(w){return (tocfl.get(w)||[]).filter(r=>r.trad===w)}
function tocflRecs(w){const own=ownTocfl(w);if(own.length)return own;const f=forms(w);let recs=[];for(const x of f.list)recs.push(...(tocfl.get(x)||[]));return recs}
function hskRec(w){const f=forms(w);for(const x of f.list){if(hsk.get(x))return hsk.get(x)}return null}
function levelInfo(w,std){
  init();
  if(std==='tocfl'){const lv=[...new Set(tocflRecs(w).map(r=>r.level))].sort((a,b)=>a-b);return {levels:lv,names:lv.map(i=>LEVELS.tocfl.names[i])}}
  const p=LEVELS[std].prefix,rec=hskRec(w);
  if(!rec)return {levels:[],names:[]};const lv=[...rec.levels.matchAll(new RegExp(p+'(\\d)','g'))].map(m=>+m[1]-1).sort((a,b)=>a-b);
  return {levels:lv,names:lv.map(i=>LEVELS[std].names[i])};
}
function levelText(w,std){const {levels,names}=levelInfo(w,std);if(!names.length)return '未收錄';const tag=std==='tocfl'?TAGS.tocfl:TAGS.hsk;const full=levels.map((l,i)=>{const types=std==='tocfl'?[...new Set(tocflRecs(w).filter(r=>r.level===l).map(r=>TPOS[r.pos]||r.pos).filter(Boolean))]:[];return names[i]+' · '+tag[l]+(levels.length>1&&types.length?'（'+types.join('／')+'）':'')});return full.length===1?full[0]:'依詞性分級：'+full.join('；')}
const TPOS={N:'名詞',V:'動作動詞',Vi:'不及物動作動詞',Vs:'狀態動詞',Vst:'及物狀態動詞',Vp:'變化動詞',Vpt:'及物變化動詞','V-sep':'離合詞','Vs-sep':'離合詞（狀態）','Vp-sep':'離合詞（變化）','Vs-attr':'唯定狀態動詞','Vs-pred':'唯謂狀態動詞',Vaux:'助動詞',Adv:'副詞',Conj:'連詞',Prep:'介詞',Det:'限定詞',M:'量詞',Ptc:'助詞'};
const HPOS={v:'動詞',n:'名詞',vn:'動詞／名詞',a:'形容詞',d:'副詞',an:'形容詞／名詞',ad:'形容詞／副詞',b:'區別詞',q:'量詞',t:'時間詞',l:'慣用語',f:'方位詞',c:'連詞',cc:'連詞',r:'代詞',nr:'人名',p:'介詞',s:'處所詞',m:'數詞',z:'狀態詞',nz:'專有名詞',u:'助詞',qv:'動量詞',y:'語氣詞',ns:'地名',e:'嘆詞',mq:'數量詞',qt:'時量詞',o:'擬聲詞',nt:'機構名',k:'後綴',h:'前綴'};
/* 詞性：回傳 {text, kinds}；kinds 用來挑英文意思 */
function posInfo(w,std){
  init();const useT=std==='tocfl'||(std==='none'&&tocflRecs(w).length);
  if(useT){const codes=[...new Set(tocflRecs(w).flatMap(r=>r.pos.split('/').map(x=>x.trim()).filter(Boolean)).map(x=>x==='conj'?'Conj':x))];
    if(codes.length)return {text:codes.map(c=>TPOS[c]?c+' '+TPOS[c]:c).join('／'),kinds:codes.map(c=>c==='N'?'n':c==='M'?'m':/^Vs/.test(c)?'adj':/^V/.test(c)?'v':c==='Adv'?'adv':'x')}}
  const rec=hskRec(w);if(!rec||!rec.pos.length)return {text:'',kinds:[]};
  const labels=[...new Set(rec.pos.map(c=>HPOS[c]).filter(Boolean).flatMap(x=>x.split('／')))];
  return {text:labels.join('／'),kinds:rec.pos.map(c=>/^n/.test(c)?'n':/^q/.test(c)?'m':/^a|^b|^z/.test(c)?'adj':/^v/.test(c)?'v':c==='d'?'adv':'x')};
}
/* 英文意思：依詞性把最可能的意思排前面 */
function senses(w,sy,kinds=[]){
  const ids=dictIds(w);if(!ids.length)return [];const k=sylKey(sy||[]).toLowerCase();
  let pick=ids.filter(i=>sylKey(parseNumeric(E.P[i])).toLowerCase()===k||(E.TW[i]&&sylKey(parseNumeric(E.TW[i])).toLowerCase()===k));
  if(!pick.length)pick=ids.slice(0,1);
  const list=[...new Set(pick.flatMap(i=>E.D[i].split('/')).map(x=>x.trim()).filter(Boolean))];
  const weak=x=>/^\((literary|old|archaic|dialect|classical|abbr\.|onom\.)[^)]*\)|^surname |^variant of|^see |^used in /.test(x)?2:/^\(/.test(x)?1:0;
  const fit=x=>{if(!kinds.length)return 0;const isTo=/^(\([^)]*\) )?to /.test(x),isCl=/classifier for/.test(x);
    const i=kinds.findIndex(t=>t==='v'?isTo:t==='m'?isCl:t==='n'||t==='adj'?(!isTo&&!isCl):false);return i<0?kinds.length:i};
  return list.map((x,i)=>({x,i})).sort((a,b)=>fit(a.x)-fit(b.x)||weak(a.x)-weak(b.x)||a.i-b.i).map(o=>o.x.replace(/^\(loanword\) /,''));
}
/* 讀音候選：回傳 [{sy,source,def}] 依優先順序 */
function readings(w,region){
  init();const f=forms(w),n=[...f.t].length,out=[],seen=new Set();
  const add=(sy,def,src)=>{if(!sy||!sy.length||sy.some(x=>x.raw))return;const k=sylKey(sy);if(seen.has(k))return;seen.add(k);out.push({sy,def:def||'',src})};
  const ids=dictIds(w).sort((a,b)=>(/^[A-Z]/.test(E.P[a])?1:0)-(/^[A-Z]/.test(E.P[b])?1:0));
  const defFor=sy=>{const k=sylKey(sy).toLowerCase();for(const i of ids){if(sylKey(parseNumeric(E.P[i])).toLowerCase()===k||(E.TW[i]&&sylKey(parseNumeric(E.TW[i])).toLowerCase()===k))return E.D[i]}return ids.length?E.D[ids[0]]:''};
  if(region==='tw'){
    /* 先用輸入字形本身的詞表讀音；只有查不到時才借用繁簡另一個字形（避免「隻」借到「只 zhǐ」、「髮」借到「发 fā」） */
    for(const r of tocflRecs(w)){const sy=parseMarked(r.pinyin,n);add(sy,defFor(sy),'tocfl')}
    for(const i of ids)if(E.TW[i])add(parseNumeric(E.TW[i]),E.D[i],'dict-tw');
    for(const i of ids)add(parseNumeric(E.P[i]),E.D[i],'dict');
    for(const x of f.list){const h=hsk.get(x);if(h){const sy=parseMarked(h.pinyin,n);add(sy,defFor(sy),'hsk');break}}
  }else{
    for(const x of f.list){const h=hsk.get(x);if(h){const sy=parseMarked(h.pinyin,n);add(sy,defFor(sy),'hsk');break}}
    for(const i of ids)add(parseNumeric(E.P[i]),E.D[i],'dict');
    for(const i of ids)if(E.TW[i])add(parseNumeric(E.TW[i]),E.D[i],'dict-tw');
  }
  if(n===1){const ch=f.t,alt=poly[ch]||poly[f.s];if(alt&&out.length>1){const order=alt.map(x=>x.replace('u:','ü'));const rank=r=>(region==='tw'&&r.src==='tocfl'?0:1);const pos=r=>{const i=order.indexOf(sylKey(r.sy));return i<0?99:i};out.sort((a,b)=>rank(a)-rank(b)||pos(a)-pos(b))}}
  if(!out.length&&n>1){ // 由部件組合
    let parts=segment(f.t).filter(x=>x.han);if(parts.length<2)parts=[...f.t].map(c=>({w:c,han:true}));const sy=[];let ok=true;
    for(const p of parts){const r=readings(p.w,region);if(r.length)sy.push(...r[0].sy);else{ok=false;break}}
    if(ok&&sy.length)out.push({sy,def:'',src:'compose'});
  }
  return out;
}
function meaningFor(w,sy){const ids=dictIds(w);if(!ids.length)return '';const k=sylKey(sy||[]).toLowerCase();for(const i of ids){if(sylKey(parseNumeric(E.P[i])).toLowerCase()===k||(E.TW[i]&&sylKey(parseNumeric(E.TW[i])).toLowerCase()===k))return E.D[i]}return E.D[ids[0]]}
const STOP=new Set('我去 的 了 嗎 吗 呢 吧 啊 呀 哦 喔 嗯 和 跟 與 与 及 或 也 都 就 才 很 在 是 有 我 你 妳 他 她 它 我們 我们 你們 你们 他們 他们 她們 她们 這 这 那 這個 这个 那個 那个 個 个 一 二 三 四 五 六 七 八 九 十 不 沒 没 著 着 過 过 得 地 之 被 把 給 给 讓 让 對 对 說 说 去 來 来 上 下 裡 里 中 好 要 會 会 能 可以 還 还 又 再 而 但 但是 所以 因為 因为 如果 什麼 什么 怎麼 怎么 哪 誰 谁 啦 嘛 哈'.split(' '));
function extractWords(str){
  const toks=segment(str).filter(t=>t.han).map(t=>t.w);const seen=new Set(),out=[];
  for(const w of toks){if(STOP.has(w))continue;if(w.length===1&&!keys.has(w))continue;const key=toTrad(w);if(seen.has(key))continue;seen.add(key);out.push(w)}
  return out;
}
return {LEVELS,posInfo,senses,init,addKey:w=>{init();keys.add(w)},loadDict:t=>{init();addDict(t)},hasDict:()=>dictReady,isReady:()=>ready,toTrad,toSimp,segment,readings,meaningFor,levelInfo,levelText,parseAny,render,renderPinyin,renderZhuyin,sylKey,extractWords};
})();

const $=s=>document.querySelector(s),body=$('#vocab-body');
const pref={standard:'tocfl',script:'trad',phonetic:'pinyin',region:'tw',pos:'on',posLanguage:'zh',tone:'sandhi',skip:'',maxLevel:'',aiLevel:''};
let inputMode='list';
try{const saved=JSON.parse(localStorage.getItem('vocab-prefs')||'{}');for(const k in pref)if(saved[k])pref[k]=saved[k]}catch{}
if(!['sandhi','base'].includes(pref.tone))pref.tone='sandhi';
if(!['tocfl','hsk26','hsk21','none'].includes(pref.standard))pref.standard='tocfl';if(!['zh','en'].includes(pref.posLanguage))pref.posLanguage='zh';
function savePrefs(){try{localStorage.setItem('vocab-prefs',JSON.stringify(pref))}catch{}}
const phoneticLabel=()=>pref.phonetic==='zhuyin'?'注音':'拼音';
const noLevel=()=>pref.standard==='none';
const levelLabel=()=>noLevel()?'':Lang.LEVELS[pref.standard].label;
const POS_EN={'名詞':'Noun','動作動詞':'Action verb','不及物動作動詞':'Intransitive action verb','狀態動詞':'Stative verb','及物狀態動詞':'Transitive stative verb','變化動詞':'Change-of-state verb','及物變化動詞':'Transitive change-of-state verb','離合詞':'Separable verb','離合詞（狀態）':'Separable stative verb','離合詞（變化）':'Separable change-of-state verb','唯定狀態動詞':'Attributive stative verb','唯謂狀態動詞':'Predicative stative verb','助動詞':'Auxiliary verb','副詞':'Adverb','連詞':'Conjunction','介詞':'Preposition','限定詞':'Determiner','量詞':'Classifier','助詞':'Particle','動詞':'Verb','形容詞':'Adjective','區別詞':'Distinguishing word','時間詞':'Time word','慣用語':'Idiom','方位詞':'Localizer','代詞':'Pronoun','人名':'Personal name','處所詞':'Place word','數詞':'Numeral','狀態詞':'State word','專有名詞':'Proper noun','動量詞':'Verbal classifier','語氣詞':'Modal particle','地名':'Place name','嘆詞':'Interjection','數量詞':'Numeral-classifier phrase','時量詞':'Time classifier','擬聲詞':'Onomatopoeia','機構名':'Organization name','後綴':'Suffix','前綴':'Prefix'};
const POS_ZH=Object.fromEntries(Object.entries(POS_EN).map(([zh,en])=>[en,zh]));
function posInLanguage(text,language=pref.posLanguage){return text.split('／').map(part=>{const clean=part.trim().replace(/^(?:N|V|Vi|Vs|Vst|Vp|Vpt|V-sep|Vs-sep|Vp-sep|Vs-attr|Vs-pred|Vaux|Adv|Conj|Prep|Det|M|Ptc)\s+/, '');return language==='en'?(POS_EN[clean]||part.trim()):(POS_ZH[part.trim()]||clean)}).join('／')}
function applyPosLanguage(){for(const row of rows()){const old=val(row,'pos');setVal(row,'pos',posInLanguage(row.dataset.otouched?old:Lang.posInfo(val(row,'word'),pref.standard).text));}applyPos();savePrefs();scheduleSave()}
const toScript=s=>pref.script==='trad'?Lang.toTrad(s):Lang.toSimp(s);

/* ---------- 教學常用義：高頻詞的英文意思優先採用這裡（CC-CEDICT 的第一義常不是課堂上要教的意思） ---------- */
const GLOSS=new Map(`他|he; him
妳|you (female)
是|to be (am, is, are); yes
姓|(one's) surname is; surname
知道|to know
怕|to be afraid of; to fear
告訴|to tell
錯|wrong; mistake
穿|to wear (clothes, shoes)
奶奶|grandma (father's mother)
男|male
先生|Mr.; husband; sir
太太|Mrs.; wife
小姐|Miss; young lady
媽|mom; mother
媽媽|mom; mother
早上|morning
字|(Chinese) character; word
課|lesson; class
叫|to be called; to call
謝謝|thank you; thanks
對不起|sorry; excuse me
那|that; then (in that case)
錢|money
便宜|cheap; inexpensive
有|to have; there is / there are
飯|meal; cooked rice
請|please; to invite; to treat (sb to a meal)
沒有|to not have; there is not; did not
月|month; moon
在|at; in; to be (located) at; (in the middle of) doing
愛|to love; love
太|too (much); extremely
分|minute; cent; point
點|o'clock; dot; a little; to order (food)
個|(general classifier)
還是|or (in questions); still; had better
就|then; right away; only
裡|in; inside
裏|in; inside
上|on; above; to get on; previous
下|under; below; to get off; next
地方|place
帶|to bring; to take; to carry
快|fast; quick; soon
進|to enter; to come in
店|store; shop
飽|full (after eating)
舊|old (not new); used
像|to look like; to resemble
少|few; little; less
和|and; with
跟|with; and; to follow
別|don't; other
一定|certainly; definitely; must
男生|boy; guy
女生|girl
市|city
城|city; town
剛|just (now)
剛剛|just now; a moment ago
生氣|to get angry; angry
辛苦|hard; tough; to have a hard time
願意|to be willing to
當然|of course; certainly
更|even more
打算|to plan; to intend; plan
決定|to decide; decision
棒|great; awesome
行|OK; all right; capable
算|to calculate; to count; to consider as
租|to rent
電|electricity
地|ground; earth
海|sea; ocean
騎|to ride (a bicycle, motorcycle, horse)
活動|activity; event
才|only then; not until; just
不好意思|sorry; excuse me; to feel embarrassed
寄|to send by mail; to mail
接|to pick up (sb); to receive; to answer (the phone)
壞|bad; broken
認識|to know (sb); to get to know; to recognize
最近|recently; lately
錢包|wallet; purse
車站|station (bus, train)
相片|photo; photograph
離|(distance) from; away from
經過|to pass by; to go through; process
掉|to fall; to drop; to lose
一直|all along; continuously; straight (ahead)
健康|healthy; health
希望|to hope; to wish; hope
眼鏡|glasses; spectacles
表|form; table; watch (timepiece)
裙|skirt
褲|pants; trousers
雙|pair (of shoes, chopsticks, etc.)
試|to try; to test
輕|light (in weight)
樣子|appearance; look; manner
好像|to seem; it seems; as if
漢堡|hamburger
點心|snack; dessert; dim sum
包|to wrap; bag; package
需要|to need; need
把|(marks the object before the verb); classifier for things with a handle
被|(passive marker) by
讓|to let; to allow; to make (sb do sth)
本來|originally; at first
替|for; on behalf of
一下|(after a verb) briefly; a bit; for a moment
一下子|all at once; in a short while
不過|but; however
不錯|not bad; pretty good
生意|business; trade
意思|meaning; idea
東西|thing; stuff
房|house; room
樓|floor (of a building); building
冷氣|air conditioning
運動|to exercise; sports; exercise
起來|to get up; to stand up
花兒|flower
畫兒|picture; painting
事兒|matter; thing
外面|outside
旁|side; beside
前面|front; ahead; in front of
平常|usually; ordinary
差不多|almost; about the same
重|heavy; important
其它|other
聲|sound; voice
相片兒|photo
一半兒|half
部份|part; portion
甚麼|what
飯店|hotel; restaurant
路口|intersection; crossing
吧|(particle for suggestions or guesses) ..., OK?; ..., right?
號|date (day of the month); number; size
天|day; sky
杯|cup; glass; (classifier for drinks)
麵|noodles
菜|dish (of food); vegetable
雞|chicken
豬|pig
鹹|salty
香|fragrant; good-smelling
冰|ice; iced
痛|to hurt; painful; ache
餐廳|restaurant
司機|driver
家|home; family; (classifier for businesses)
網路|internet; network
脫|to take off (clothes, shoes)
搬|to move (house); to carry
比賽|competition; match; to compete
故事|story
麻煩|troublesome; trouble; to trouble (sb)
送|to give (as a gift); to deliver; to see (sb) off
病人|patient; sick person
小心|to be careful; careful
比較|relatively; to compare
特別|special; especially
啤酒|beer
這麼|so; like this
還|still; also; yet
又|again; both ... and ...
事|matter; thing; business
哪|which
右|right
拿|to take; to hold
站|to stand; station; stop
身體|body; health
感冒|to catch a cold; cold (illness)
元|dollar; yuan (unit of currency)
比|than; to compare
酒|alcohol; liquor; wine
小吃|snack; street food
所以|so; therefore
馬上|right away; immediately
一會兒|a moment; a little while
一會|a moment; a little while
能力|ability
努力|to work hard; hard-working; effort
計畫|plan; to plan
作業|homework; assignment
字典|dictionary
讀書|to study; to read
借|to borrow; to lend
辦法|way; method; solution
樓梯|stairs
洗澡|to take a bath or shower
發現|to discover; to find; to notice
餐|meal
聽說|to hear (that); it is said that
馬路|road; street
最後|finally; last
手指頭|finger
時間|time
高|tall; high
真|really; real; true
筆|pen
對|right; correct; to; toward
早|early; good morning
找|to look for; to find; to give change
做|to do; to make
坐|to sit; to take (a bus, train, etc.)
想|to want to; to think; to miss
過|(experience marker); to pass; to cross
晚|late; evening
最|most; -est
工作|to work; job; work
會|can (learned skill); will; meeting
開|to open; to drive; to turn on
睡覺|to sleep; to go to bed
常|often
打|to hit; to play (ball games); to make (a phone call)
玩|to play; to have fun
沒關係|it doesn't matter; that's OK
可能|maybe; possibly; possible
成績|grade; score; results
班|class (group of students); shift
圖|picture; chart; map
盤子|plate; dish
道|(classifier for dishes, questions); road; way
年|year
隻|(classifier for animals, one of a pair)
髮|hair
領|to receive; to collect; to lead; collar
領錢|to withdraw money
提款|to withdraw money
存錢|to save money; to deposit money`.split('\n').map(l=>{const i=l.indexOf('|');return [l.slice(0,i),l.slice(i+1)]}));
function glossFor(w){return w?GLOSS.get(Lang.toTrad(w)):undefined}
const charCount=w=>[...w].filter(c=>/[㐀-鿿豈-﫿]/.test(c)).length;

function toneSyllables(word,sy){
 const out=sy.map(x=>({...x}));
 const chars=[...Lang.toTrad(word)].filter(c=>/[㐀-鿿豈-﫿]/.test(c));
 if(chars.length!==out.length)return out;
 for(let i=0;i<out.length;i++){if(chars[i]==='一'&&out[i].s==='yi')out[i].t=1;if(chars[i]==='不'&&out[i].s==='bu')out[i].t=4;}
 if(pref.tone==='base')return out;
 const original=out.map(x=>x.t);
 const verbs=new Set(Array.from('看想試聽讀寫問說走等坐站跑跳笑唱畫摸碰聞猜找學數查量算選挑洗刷掃擦搖拍敲拉推抱換練休玩用做吃喝買賣停望瞧'));
 for(let i=0;i<out.length;i++){
  if(out[i].raw)continue;
  const ch=chars[i],prev=chars[i-1],next=chars[i+1];
  if(ch==='一'&&prev&&prev===next&&verbs.has(prev)){out[i].t=5;continue}
  if(ch==='不'&&prev&&prev===next){out[i].t=prev==='會'?2:5;continue}
  if(ch==='一'&&next&&prev!=='統'&&prev!=='單'&&prev!=='第'&&!/[零〇○一二三四五六七八九十百千萬億兆點]/.test(prev||'')&&!/[零〇○一二三四五六七八九]/.test(next)){
   const t=next==='個'?4:original[i+1];if(t===4)out[i].t=2;else if(t>=1&&t<=3)out[i].t=4;
  }else if(ch==='不'&&original[i+1]===4)out[i].t=2;
 }
 return out;
}
function renderReading(word,sy){return Lang.render(toneSyllables(word,sy),pref.phonetic)}
function applyTone(){for(const r of rows()){if(!r.dataset.ptouched&&r._sy)setVal(r,'pinyin',renderReading(val(r,'word'),r._sy));renderAlts(r);if(currentMark()==='phonetic')renderPreview(r)}scheduleSave();schedulePreview()}
function blankUnits(word){return Math.max(3,charCount(word)*2+1)}
function blankWidth(word){return blankUnits(word)+'em'}

const relationFields=[['synonym','近義詞'],['antonym','反義詞']];
function withRelation(key){return $('#'+key+'-toggle').checked}
function relationHeaders(){return relationFields.filter(([k])=>withRelation(k)).map(([,label])=>label)}
function relationValues(row){return relationFields.filter(([k])=>withRelation(k)).map(([k])=>val(row,k))}
function setRelations(){for(const [k] of relationFields)document.querySelectorAll('.'+k+'-column').forEach(el=>el.hidden=!withRelation(k));if(relationFields.some(([k])=>withRelation(k)))ensureRelations().then(()=>rows().forEach(refreshRelations)).catch(()=>{})}
for(const [k] of relationFields)$('#'+k+'-toggle').addEventListener('change',setRelations);
let relationData=JSON.parse(document.getElementById('data-relations').textContent).entries,relationLoading=null;
function ensureRelations(){
 if(relationData)return Promise.resolve(relationData);
 if(relationLoading)return relationLoading;
 $('#relations-status').textContent='教育部詞彙資料載入中…';
 relationLoading=fetch(MMV.data+'moe-relations.json').then(r=>{if(!r.ok)throw Error('load');return r.json()}).then(d=>{if(d.version!=='2014_20260929'||!d.entries)throw Error('data');relationData=d.entries;$('#relations-status').textContent='已載入教育部《國語辭典簡編本》（2026／09／29 版）。';return relationData}).catch(e=>{$('#relations-status').textContent='辭典資料暫時無法載入，仍可手動填寫。';relationLoading=null;throw e});return relationLoading;
}
function relationLookup(word){if(!word||!relationData)return null;return relationData[Lang.toTrad(word)]||null}
function relationText(rec,key){return toScript((rec[key]||'').replace(/^\[(?:似|反)\]/,'').trim())}
function refreshRelations(row){
 const word=val(row,'word');
 if(row._relationWord!==undefined&&row._relationWord!==Lang.toTrad(word)){for(const [k] of relationFields){setVal(row,k,'');delete row.dataset[k+'Touched']}row._relationChoice=undefined}
 row._relationWord=Lang.toTrad(word);
 if(!relationData){if(word&&relationFields.some(([k])=>withRelation(k)))ensureRelations().then(()=>{if(row.isConnected&&val(row,'word')===word)refreshRelations(row)}).catch(()=>{});return}
 const found=relationLookup(word);row._relationRecords=found;
 const usable=(found||[]).filter(r=>r.synonym.trim()||r.antonym.trim());
 if(usable.length===1)row._relationChoice=0;
 const selected=usable[row._relationChoice];row._relationSelected=selected||null;
 if(selected)for(const [k] of relationFields)if(!row.dataset[k+'Touched'])setVal(row,k,relationText(selected,k));
 renderRelationReference(row);scheduleSave();
}
function renderRelationReference(row){
 const word=val(row,'word'),found=row._relationRecords,rec=row._relationSelected;
 for(const [k,label] of relationFields){const box=row.querySelector('.'+k+'-column .relation-reference');box.replaceChildren();if(!word||!relationData)continue;
 /* 辭典沒有資料、老師也沒填時保持空白，不再每格都顯示「未收錄」提示 */
 const usableAll=(found||[]).filter(r=>r.synonym.trim()||r.antonym.trim());
 if(!row.dataset[k+'Touched']&&!(rec&&rec[k].trim())&&usableAll.length<2)continue;
 const link=document.createElement('a');link.href='https://dict.concised.moe.edu.tw/search.jsp?la=0&word='+encodeURIComponent(Lang.toTrad(word));link.target='_blank';link.rel='noopener noreferrer';link.textContent='查教育部辭典';
 const status=document.createElement('span');status.textContent=row.dataset[k+'Touched']?'自行編輯 · ':!found?'辭典未收錄 · ':rec&&!rec[k].trim()?'辭典未提供'+label+' · ':!rec?'無自動帶入資料 · ':'辭典參考 · ';box.append(status,link);
 if(rec&&rec[k].trim()){const details=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('div');summary.textContent='辭典原文';text.className='original';text.textContent=rec[k];details.append(summary,text);box.append(details)}
 const usable=(found||[]).filter(r=>r.synonym.trim()||r.antonym.trim());
 if(usable.length>1){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='選擇詞條（'+usable.length+' 筆）';details.append(summary);usable.forEach((r,i)=>{const button=document.createElement('button');button.type='button';button.textContent=r.pinyin+'｜'+r.synonym+'｜'+r.antonym;button.addEventListener('click',()=>{row._relationChoice=i;for(const [key] of relationFields)if(!row.dataset[key+'Touched'])setVal(row,key,relationText(r,key));row._relationSelected=r;renderRelationReference(row);scheduleSave()});details.append(button)});box.append(details)}
 }
}

/* ---------- 列 ---------- */
function newRow(word='',pinyin='',meaning='',sentence=''){
 const tr=document.createElement('tr');
 const fields=[['word',word,'生詞'],['pinyin',pinyin,phoneticLabel()],['pos','','詞性'],['meaning',meaning,'英文翻譯']];
 for(const [key,value,label] of fields){const td=document.createElement('td'),input=document.createElement(key==='meaning'?'textarea':'input');if(key==='meaning')input.rows=1;else input.type='text';input.dataset.field=key;input.value=value;input.setAttribute('aria-label',label);td.dataset.label=label;if(key==='word')input.placeholder='輸入生詞';if(key==='meaning')input.placeholder='輸入英文翻譯';td.append(input);if(key==='pinyin'){td.className='phonetic-cell';const alt=document.createElement('div');alt.className='alt-readings';alt.hidden=true;td.append(alt)}if(key==='pos'){td.className='pos-cell';input.placeholder=posLabel();td.dataset.label=posLabel();input.setAttribute('aria-label',posLabel())}if(key==='meaning'){td.className='meaning-cell';const note=document.createElement('div');note.className='auto-note';note.hidden=true;const tag=document.createElement('span');tag.className='auto-tag-sample';tag.textContent='自動';note.append(tag,'詞典推測');td.append(note);const alt=document.createElement('div');alt.className='alt-readings alt-senses';alt.hidden=true;td.append(alt)}tr.append(td)}
 const levelCell=document.createElement('td');levelCell.className='level-cell';levelCell.dataset.field='level';levelCell.dataset.label='級別';tr.append(levelCell);
 for(const [key,label] of [['synonym','近義詞'],['antonym','反義詞']]){const td=document.createElement('td'),input=document.createElement('input');td.className=key+'-column';td.dataset.label=label;td.hidden=!withRelation(key);input.type='text';input.dataset.field=key;input.setAttribute('aria-label',label);input.placeholder='可留白';td.append(input);const ref=document.createElement('div');ref.className='relation-reference';td.append(ref);tr.append(td)}
 const sentenceCell=document.createElement('td');sentenceCell.className='sentence-column';sentenceCell.dataset.label='例句';sentenceCell.hidden=!$('#sentences-toggle').checked;const sentenceInput=document.createElement('textarea');sentenceInput.rows=1;sentenceInput.className='sentence-input';sentenceInput.dataset.field='sentence';sentenceInput.value=sentence;sentenceInput.placeholder='輸入例句';sentenceInput.setAttribute('aria-label','例句');sentenceCell.append(sentenceInput);const preview=document.createElement('span');preview.className='sentence-preview';preview.hidden=true;sentenceCell.append(preview);const check=document.createElement('span');check.className='sentence-check';check.hidden=true;check.setAttribute('role','status');sentenceCell.append(check);tr.append(sentenceCell);
 const action=document.createElement('td');action.className='action-column';const del=document.createElement('button');del.type='button';del.className='delete-row';del.textContent='刪除';del.setAttribute('aria-label','刪除這一列');action.append(del);tr.append(action);
 if(pinyin)tr.dataset.ptouched='1';if(meaning)tr.dataset.mtouched='1';
 body.append(tr);autosizeRow(tr);return tr;
}
function rows(){return [...body.querySelectorAll('tr')]}
function val(row,key){const el=row.querySelector(`[data-field="${key}"]`);return (el?.value??el?.textContent??'').trim()}
function setVal(row,key,v){const el=row.querySelector(`[data-field="${key}"]`);if(el){el.value=v;if(el.tagName==='TEXTAREA')autosize(el)}}
/* 意思、例句用可自動換行的欄位，長英文不會被截斷 */
function autosize(el){if(!el.offsetParent)return;el.style.height='auto';el.style.height=el.scrollHeight+2+'px'}
function autosizeRow(row){row.querySelectorAll('textarea').forEach(autosize)}
function autosizeAll(){rows().forEach(autosizeRow)}
/* 「自動」標記：英文意思由 CC-CEDICT 推測且尚未經老師確認時顯示 */
function updateAuto(row){const cell=row.querySelector('.meaning-cell'),note=cell.querySelector('.auto-note');const auto=!row.dataset.mtouched&&!row._curated&&!!val(row,'meaning');note.hidden=!auto;cell.classList.toggle('is-auto',auto)}

function updateLevel(row){const cell=row.querySelector('[data-field="level"]'),w=val(row,'word');const t=w&&!noLevel()?Lang.levelText(w,pref.standard):'';cell.textContent=toScript(t);cell.classList.toggle('unlisted',t==='未收錄')}
function renderAlts(row){
 const box=row.querySelector('.alt-readings');box.replaceChildren();const list=row._readings||[];
 const composed=!row.dataset.ptouched&&list[row._chosen||0]?.src==='compose';
 if(composed){const warning=document.createElement('span');warning.className='reading-warning';warning.setAttribute('role','status');warning.textContent='請確認：此讀音由字或詞組合，未找到完整詞語的讀音資料。';box.append(warning)}
 if(list.length<2){box.hidden=!composed;return}
 const label=document.createElement('span');label.textContent='其他讀音';box.append(label);
 list.forEach((r,i)=>{if(i===row._chosen)return;const b=document.createElement('button');b.type='button';b.dataset.alt=i;b.textContent=renderReading(val(row,'word'),r.sy);b.title=r.def||'';box.append(b)});
 box.hidden=false;
}
function fillRow(row,{keepTouched=true}={}){
 const w=val(row,'word');
 refreshRelations(row);
 if(!w){row._readings=[];row._sy=null;renderAlts(row);updateLevel(row);return}
 const list=Lang.readings(w,pref.region);row._readings=list;
 if(!(keepTouched&&row.dataset.ptouched)){row._chosen=0;row._sy=list[0]?.sy||null;setVal(row,'pinyin',row._sy?renderReading(w,row._sy):'')}
 const pi=Lang.posInfo(w,pref.standard);row._kinds=pi.kinds;
 if(!(keepTouched&&row.dataset.otouched))setVal(row,'pos',posInLanguage(pi.text));
 refreshSenses(row,keepTouched);
 renderAlts(row);updateLevel(row);renderPreview(row);
}
function refreshSenses(row,keepTouched=true){
 const w=val(row,'word');row._senses=w?Lang.senses(w,row._sy,row._kinds||[]):[];
 /* 預設讀音才套用教學常用義；老師改選其他讀音時（如 還 huán、會 kuài）就回到詞典意思 */
 const g=(row._chosen||0)===0&&!row.dataset.ptouched?glossFor(w):undefined;
 if(g)row._senses=[g,...row._senses.filter(x=>x!==g)];
 if(!(keepTouched&&row.dataset.mtouched)){setVal(row,'meaning',row._senses[0]||'');row._curated=!!g}
 renderSenses(row);updateAuto(row);
}
function renderSenses(row){
 const box=row.querySelector('.alt-senses');box.replaceChildren();const cur=val(row,'meaning').split('；').map(x=>x.trim());const others=(row._senses||[]);
 if(!others.length){box.hidden=true;return}
 const d=document.createElement('details');d.className='sense-more';const sm=document.createElement('summary');sm.textContent=`選擇英文意思（可多選）`;d.append(sm);
 const wrap=document.createElement('div');wrap.className='sense-list';
 others.forEach(x=>{const b=document.createElement('button');b.type='button';b.dataset.sense=x;b.textContent=x;const selected=cur.includes(x);b.textContent=(selected?'✓ ':'＋ ')+x;b.setAttribute('aria-pressed',String(selected));b.title=selected?'移除這個意思':'加入這個意思';wrap.append(b)});d.append(wrap);box.append(d);box.hidden=false;
}
function chooseAlt(row,i){
 const r=row._readings[i];if(!r)return;row._chosen=i;row._sy=r.sy;delete row.dataset.ptouched;
 setVal(row,'pinyin',renderReading(val(row,'word'),r.sy));
 refreshSenses(row);
 renderAlts(row);
}

/* ---------- 例句標記 ---------- */
function resetSentenceMark(){for(const input of document.querySelectorAll('input[name="mark-style"]'))input.checked=input.value==='blank';$('#color-options').hidden=true;syncWsOptions()}
function currentMark(){return document.querySelector('input[name="mark-style"]:checked').value}
function escaped(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function colorFor(i){const palette=['#C4623A','#2e6f78','#78528d','#a34b62','#47734d','#a27620','#365f9d'];return palette[i%palette.length]}
function makeMarked(sentence,word,index){if(!sentence||!word)return escaped(sentence);let mark=currentMark();if(mark==='bank')return escaped(sentence);const pattern=escaped(word).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');try{return escaped(sentence).replace(new RegExp(pattern,'g'),match=>{if(mark==='blank'||mark==='bank')return `<span class="preview-blank" style="width:${blankWidth(word)}" aria-label="生詞填空"><span class="blank-line">${'　'.repeat(Math.max(2,charCount(word)))}</span></span>`;if(mark==='phonetic')return phoneticRuby(word,rows()[index]);if(mark==='underline')return `<span class="preview-underline">${match}</span>`;const same=document.querySelector('input[name="color-style"]:checked').value==='same';const color=same?$('#mark-color').value:colorFor(index);return `<span class="preview-mark" style="color:${color};font-weight:700">${match}</span>`})}catch{return escaped(sentence)}}
/* 僅檢查字面與常見完整詞語；提示不代表語意判定，不更動老師的句子。 */
function sentenceCheck(word,sentence){
 if(!word||!sentence)return '';
 const w=Lang.toTrad(word),t=Lang.toTrad(sentence);
 if(!t.includes(w))return '請確認：例句沒有出現「'+word+'」。';
 const compounds={'在下':['在下面','在下方'],'已':['已經'],'收':['收到'],'起':['起床'],'入':['入口'],'實':['實話'],'機':['飛機']};
 const matches=(compounds[w]||[]).filter(x=>t.includes(x));
 if(matches.length){let remaining=t;for(const x of matches)remaining=remaining.split(x).join('');
  if(!remaining.includes(w))return '請確認：句中使用的是「'+matches.join('、')+'」，是否要以完整詞語列入生詞表？';
 }
 return '';
}
function renderPreview(row){
 const area=row.querySelector('.sentence-preview'),sentence=val(row,'sentence'),word=val(row,'word'),on=$('#sentences-toggle').checked;
 area.innerHTML=makeMarked(sentence,word,rows().indexOf(row));area.hidden=!on||!sentence;area.tabIndex=on&&sentence?0:-1;area.setAttribute('role','button');area.title='點一下修改例句';area.setAttribute('aria-label','修改例句：'+sentence);area.closest('td').classList.toggle('sentence-has-text',!!sentence);
 const check=row.querySelector('.sentence-check');if(check){const message=sentenceCheck(word,sentence);check.textContent=message;check.hidden=!on||!message}
}
function ensureBlankRows(){if(!rows().length)for(let i=0;i<3;i++)newRow()}
function removeBlankRows(){rows().forEach(r=>{if(!val(r,'word')&&!val(r,'sentence'))r.remove()})}
function refreshAll(){ensureBlankRows();for(const r of rows()){updateLevel(r);renderPreview(r)}updateCount();buildPrompt();if(typeof scheduleSave==='function'){scheduleSave();syncWsOptions()}}
function updateCount(){const n=rows().filter(r=>val(r,'word')).length;$('#word-count').textContent=`${n} 個詞`;$('#add-mode').hidden=!n;$('#add-mode-count').textContent=n;if(typeof updateSteps==='function')updateSteps()}
function setSentences(){const on=$('#sentences-toggle').checked;$('#sentence-options').hidden=!on;document.querySelectorAll('.sentence-column').forEach(e=>e.hidden=!on);rows().forEach(renderPreview);autosizeAll()}

/* ---------- 格式設定 ---------- */
function levelRange(){
 if(noLevel())return {skip:-1,max:-1};
 const sv=$('#skip-level').value,mv=$('#max-level').value;
 return {skip:sv===''?-1:+sv,max:mv===''?-1:+mv};
}
function updateRangeHint(){
 const el=$('#range-hint');if(!el)return;if(noLevel()){el.textContent='';return}
 const names=Lang.LEVELS[pref.standard].names,{skip,max}=levelRange(),last=names.length-1;
 let t,warn=false;
 if(max>=0&&max<=skip){t='這個範圍找不到詞：「只留到」要比略過的級別高。';warn=true}
 else if(skip<0&&max<0)t='會列出課文裡所有的詞。';
 else if(skip>=last)t='所有級別都略過了，只會列出詞表未收錄的詞。';
 else{const lo=skip+1,hi=max<0?last:max;
  t=lo===hi?`只找出${names[lo]}的詞`:max<0?`會找出${names[lo]}以上的詞`:skip<0?`只找出${names[hi]}（含）以下的詞`:`只找出${names[lo]}～${names[hi]}的詞`;
  t+='；詞表未收錄的詞會保留，標「未收錄」。'}
 el.textContent=t;el.classList.toggle('warn',warn);
}
function levelOptions(select,firstLabel,suffix){
 const names=noLevel()?[]:Lang.LEVELS[pref.standard].names,prev=select.value;select.replaceChildren(new Option(firstLabel,''));
 names.forEach((n,i)=>select.append(new Option(n+suffix,String(i))));
 if([...select.options].some(o=>o.value===prev))select.value=prev;
}
function applyStandard(old){
 const off=noLevel();$('#vocab-table').classList.toggle('no-level',off);$('#export-level-opt').hidden=off;
 $('#skip-level').closest('label').hidden=off;$('#max-level').closest('label').hidden=off;$('.skip-hint').hidden=off;$('#ai-level').closest('label').hidden=off;
 $('#th-level').textContent=levelLabel();
 /* 換分級標準時，各標準的級距不同，記住的程度要重設 */
 if(old!==undefined&&old!==pref.standard){pref.skip='';pref.maxLevel='';pref.aiLevel='';savePrefs()}
 levelOptions($('#skip-level'),'不略過','以下');
 levelOptions($('#max-level'),'不限','');
 levelOptions($('#ai-level'),'不指定','');
 for(const [id,key] of [['#skip-level','skip'],['#max-level','maxLevel'],['#ai-level','aiLevel']]){const el=$(id);if([...el.options].some(o=>o.value===pref[key]))el.value=pref[key]}
 updateRangeHint();
 updatePrefsSummary();
 const note=$('#source-note');
 const lv=off?'':pref.standard==='tocfl'
  ?'級別依華測會公開的《華語八千詞表》（2024 年 9 月版）比對，供教學備課參考；未收錄詞、異體字或多筆對應請再確認。工具不是華測會官方服務。 <a href="https://tocfl.edu.tw/tocfl/index.php/teach/download" target="_blank" rel="noopener noreferrer">查看華測會詞表與教學資源</a>'
  :`級別依 ${Lang.LEVELS[pref.standard].label.replace(/\s*等級/,'')} 詞彙表比對（整理自 <a href="https://github.com/drkameleon/complete-hsk-vocabulary" target="_blank" rel="noopener noreferrer">complete-hsk-vocabulary</a>，MIT 授權），供教學備課參考；未收錄詞或多筆對應請再確認。工具不是 HSK 官方服務。`;
 note.innerHTML=`${lv?`<span>${lv}</span>`:''}<span>常用詞的英文意思採本站整理的教學常用義；其餘標「自動」的意思與拼音由程式帶入，參考 <a href="https://www.mdbg.net/chinese/dictionary?page=cc-cedict" target="_blank" rel="noopener noreferrer">CC-CEDICT</a> 詞典（MDBG，<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>），請以教學判斷為準。</span>`;
 rows().forEach(r=>{if(val(r,'word'))fillRow(r)});buildPrompt();
}
function applyPhonetic(old){
 $('#th-phonetic').textContent=phoneticLabel();
 for(const r of rows()){const el=r.querySelector('[data-field="pinyin"]');el.setAttribute('aria-label',phoneticLabel());el.closest('td').dataset.label=phoneticLabel();
  const text=el.value.trim();if(!text){continue}
  let sy=r.dataset.ptouched?Lang.parseAny(text,charCount(val(r,'word'))):(r._sy||Lang.parseAny(text,charCount(val(r,'word'))));
  if(sy&&sy.length){r._sy=sy;el.value=r.dataset.ptouched?Lang.render(sy,pref.phonetic):renderReading(val(r,'word'),sy)}
  renderAlts(r);if(currentMark()==='phonetic')renderPreview(r)}
}
function applyScript(){
 for(const r of rows()){const w=val(r,'word');if(w)setVal(r,'word',toScript(w));const s=val(r,'sentence');if(s)setVal(r,'sentence',toScript(s));for(const k of ['synonym','antonym','meaning','pos']){const v=val(r,k);if(v)setVal(r,k,toScript(v))}fillRow(r)}
 $('#doc-title').value=toScript($('#doc-title').value);const chips=document.querySelectorAll('#chip-list .chip');chips.forEach(c=>{const inp=c.querySelector('input');inp.value=toScript(inp.value);c.querySelector('.chip-word').textContent=inp.value});
 refreshAll();
}
function applyRegion(){rows().forEach(r=>fillRow(r))}
function posLabel(){return pref.posLanguage==='en'?'Part of speech':'詞性'}
function applyPos(){
 $('#vocab-table').classList.toggle('no-pos',pref.pos!=='on');$('#th-pos').textContent=posLabel();$('#pos-display').value=pref.pos==='on'?pref.posLanguage:'off';
 rows().forEach(row=>{const input=row.querySelector('[data-field="pos"]');input.setAttribute('aria-label',posLabel());input.closest('td').dataset.label=posLabel()});
}
function setPosDisplay(value){pref.pos=value==='off'?'off':'on';if(value!=='off')pref.posLanguage=value;applyPosLanguage();schedulePreview()}
$('#pos-display').addEventListener('change',e=>setPosDisplay(e.target.value));
function bindPref(id,key,fn){const el=$(id);el.value=pref[key];el.addEventListener('change',()=>{const old=pref[key];pref[key]=el.value;savePrefs();fn(old);updatePrefsSummary()})}
/* 格式設定收合時，摘要列出目前的選擇 */
function updatePrefsSummary(){if(!$('#prefs-summary'))return;const t=id=>{const s=$(id);return (s.options[s.selectedIndex]?.text||'').replace(/（.*?）/,'')};$('#prefs-summary').textContent=[t('#pref-standard'),t('#pref-script'),t('#pref-phonetic'),t('#pref-region'),t('#pref-tone')].join(' · ')}


/* ---------- 分頁：貼上生詞／生詞表／例句・近反義詞／匯出（跟曼米其他頁面一樣用分頁切換） ---------- */
const STEP_IDS=['step-input','step-list','step-extend','step-export'];
function showStep(id){
 if(!STEP_IDS.includes(id))id='step-input';
 for(const s of STEP_IDS){const el=document.getElementById(s);if(el)el.hidden=s!==id}
 document.querySelectorAll('.mm-tab[data-step]').forEach(t=>{const on=t.dataset.step===id;t.classList.toggle('on',on);t.setAttribute('aria-selected',String(on))});
 autosizeAll();if(id==='step-export')schedulePreview();window.scrollTo({top:0});
}
function updateSteps(){const n=rows().filter(r=>val(r,'word')).length,c=document.getElementById('tab-count');if(c)c.textContent=n?String(n):''}
document.addEventListener('click',e=>{const b=e.target.closest('.mm-tab[data-step],[data-goto]');if(!b)return;e.preventDefault();showStep(b.dataset.step||b.dataset.goto)});
window.addEventListener('resize',()=>{clearTimeout(window._rz);window._rz=setTimeout(autosizeAll,150)});

/* ---------- 輸入 ---------- */
function setMode(m){
 inputMode=m;$('#tab-list').setAttribute('aria-selected',m==='list');$('#tab-text').setAttribute('aria-selected',m==='text');
 $('#text-options').hidden=m!=='text';$('#candidates').hidden=true;$('#input-message').textContent='';
 const ta=$('#word-input');
 if(m==='list'){$('#input-hint').textContent='每行一個詞，也可以用 Tab 依序貼上「生詞、拼音、英文翻譯」。貼上後都能再修改。';ta.placeholder='例如：\n咖啡\n備課\n領養';$('#make-list').textContent='✨ 整理成生詞表';ta.previousElementSibling.textContent='生詞清單'}
 else{$('#input-hint').textContent='貼上課文、對話或文章，工具會自動斷詞，列出可能的生詞讓你挑選。';ta.placeholder='例如：今天太太帶我去動物收容所，我們決定領養一隻小狗。';$('#make-list').textContent='🔍 找出生詞';ta.previousElementSibling.textContent='課文內容'}
}
/* 加入生詞前的共同處理：表裡已有詞時，依「加在後面／取代整張表」決定；取代可以復原 */
function addMode(){return document.querySelector('input[name="add-mode"]:checked')?.value||'append'}
function prepareAdd(){
 const before=rows().filter(r=>val(r,'word')).length;
 if(before&&addMode()==='replace'){const prev=rows();body.replaceChildren();return {replaced:prev,before}}
 removeBlankRows();return {replaced:null,before};
}
let undoRows=null;
function offerUndo(prev,text){
 const msg=$('#list-message');undoRows=prev;msg.replaceChildren(document.createTextNode(text));
 const undo=document.createElement('button');undo.type='button';undo.className='text-link';undo.textContent='復原';
 undo.addEventListener('click',()=>{if(undoRows){body.replaceChildren(...undoRows);undoRows=null;refreshAll();autosizeAll();msg.textContent='已復原。'}});msg.append(' ',undo);
}
function reportAdd(added,dup,{replaced,before}){
 const dupText=dup?`（${dup} 個已在表裡，略過）`:'';
 const text=replaced?`已用 ${added} 個新詞取代原本的 ${before} 個詞${dupText}。`:before?`已在原本 ${before} 個詞後面加入 ${added} 個詞${dupText}。`:`已整理 ${added} 個詞${dupText}，每一格都可以修改。`;
 $('#input-message').textContent=text;
 if(replaced)offerUndo(replaced,text);else{undoRows=null;$('#list-message').textContent=text}
 refreshAll();autosizeAll();
 showStep('step-list');
}
function parseList(){
 const lines=$('#word-input').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 if(!lines.length){$('#input-message').textContent='先貼上至少一個生詞。';return}
 const state=prepareAdd();const existing=new Set(rows().map(r=>Lang.toTrad(val(r,'word'))).filter(Boolean));let added=0,dup=0;
 for(const line of lines){const [w='',p='',m='']=line.split('\t').map(x=>x.trim());if(!w)continue;const key=Lang.toTrad(w);if(existing.has(key)){dup++;continue}existing.add(key);const row=newRow(toScript(w),p,m);if(p){row._sy=Lang.parseAny(p,charCount(w));if(row._sy.length&&!row._sy.some(x=>x.raw))setVal(row,'pinyin',Lang.render(row._sy,pref.phonetic))}fillRow(row);added++}
 reportAdd(added,dup,state);
}
function findWords(){
 const txt=$('#word-input').value.trim();if(!txt){$('#input-message').textContent='先貼上一段課文。';return}
 const {skip,max}=levelRange();
 if(max>=0&&max<=skip){$('#input-message').textContent='「只留到」要比略過的級別高，請調整其中一邊。';$('#candidates').hidden=true;return}
 const words=Lang.extractWords(txt);let skipped=0,tooHard=0;const list=$('#chip-list');list.replaceChildren();
 for(const w0 of words){const w=toScript(w0);const info=noLevel()?{levels:[]}:Lang.levelInfo(w,pref.standard);const min=info.levels.length?Math.min(...info.levels):null;
  if(skip>=0&&min!==null&&min<=skip){skipped++;continue}
  if(max>=0&&min!==null&&min>max){tooHard++;continue}
  const label=document.createElement('label');label.className='chip'+(min===null&&!noLevel()?' unknown':'');const cb=document.createElement('input');cb.type='checkbox';cb.checked=true;cb.value=w;
  const span=document.createElement('span');span.className='chip-word';span.textContent=w;const small=document.createElement('small');small.textContent=noLevel()?'':min===null?'未收錄':Lang.LEVELS[pref.standard].names[min];
  label.append(cb,span);if(!noLevel())label.append(small);list.append(label)}
 const n=list.children.length;$('#candidates').hidden=!n;
 const dropped=[skipped?`${skipped} 個學過的詞`:'',tooHard?`${tooHard} 個超過上限的詞`:''].filter(Boolean).join('、');
 $('#input-message').textContent=n?`找到 ${n} 個詞${dropped?`，已略過 ${dropped}`:''}。`:(dropped?`課文裡沒有這個範圍的詞（已略過 ${dropped}）。`:'沒有找到中文詞語。');
}
function addCandidates(){
 const picked=[...document.querySelectorAll('#chip-list input:checked')].map(x=>x.value);
 if(!picked.length){$('#input-message').textContent='至少勾選一個詞。';return}
 const state=prepareAdd();
 const existing=new Set(rows().map(r=>Lang.toTrad(val(r,'word'))).filter(Boolean));let added=0,dup=0;
 for(const w of picked){if(existing.has(Lang.toTrad(w))){dup++;continue}existing.add(Lang.toTrad(w));fillRow(newRow(w));added++}
 $('#candidates').hidden=true;reportAdd(added,dup,state);
}

/* ---------- AI 例句助手 ---------- */
function buildPrompt(){
 const words=rows().map(r=>val(r,'word')).filter(Boolean);const lv=noLevel()?'':$('#ai-level').value;
 const std=noLevel()?null:Lang.LEVELS[pref.standard];const scriptName=pref.script==='trad'?'繁體中文':'簡體中文';
 const levelLine=lv===''?'學習者程度：未指定（請寫簡單、常用的句子）':`學習者程度：${pref.standard==='tocfl'?'華測會 TOCFL ':''}${std.names[+lv]}`;
 const text=`請幫我為下面的華語生詞各寫一個例句。\n${levelLine}\n\n規則：\n1. 使用${scriptName}${pref.region==='tw'?'，用台灣常用的說法':''}。\n2. 句子要自然、生活化，長度 8 到 20 個字，盡量只用比學習者程度簡單的詞。\n3. 每個句子都要包含該生詞，而且寫法要和清單完全一樣。\n4. 每行一個，格式是「生詞｜例句」，不要加編號、拼音、翻譯或其他說明。\n\n生詞：\n${words.join('\n')||'（請先在生詞表加入生詞）'}`;
 $('#ai-prompt').value=pref.script==='simp'?Lang.toSimp(text):text;
}
async function copyText(text,msgEl,ok){
 try{await navigator.clipboard.writeText(text);msgEl.textContent=ok}catch{const ta=$('#ai-prompt');ta.focus();ta.select();msgEl.textContent='已選取文字，請按 Ctrl＋C（Mac 按 ⌘＋C）複製。'}
}
function fillSentences(){
 const lines=$('#ai-reply').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 if(!lines.length){$('#fill-message').textContent='先把 AI 的回覆貼在上面。';return}
 const byKey=new Map(rows().filter(r=>val(r,'word')).map(r=>[Lang.toTrad(val(r,'word')),r]));let filled=0,invalid=0;const missed=[],checked=new Set();
 for(const line of lines){const m=line.replace(/^\s*(?:[-*•]|\d+[.、)）])\s*/,'').match(/^(.+?)\s*[｜|:：]\s*(.+)$/);if(!m){invalid++;continue}
  const key=Lang.toTrad(m[1].replace(/[「」『』"“”*]/g,'').trim());const row=byKey.get(key);if(!row){missed.push(m[1]);continue}
  setVal(row,'sentence',toScript(m[2].trim()));if(sentenceCheck(val(row,'word'),val(row,'sentence')))checked.add(row);filled++}
 if(filled)resetSentenceMark();
 if(!$('#sentences-toggle').checked){$('#sentences-toggle').checked=true;setSentences()}
 rows().forEach(renderPreview);
 autosizeAll();
 const fm=$('#fill-message');fm.textContent=filled?`已填入 ${filled} 句例句。${checked.size?` ${checked.size} 句請確認，提示已標在例句下方。`:''}${missed.length?` 這些詞沒有對到：${missed.join('、')}。`:''}${invalid?` ${invalid} 行格式無法辨識，未填入。`:''}`:'沒有對到任何生詞。請確認 AI 回覆是「生詞｜例句」的格式。';
 if(filled){const go=document.createElement('button');go.type='button';go.className='text-link';go.textContent='到生詞表看看 ›';go.addEventListener('click',()=>showStep('step-list'));fm.append(' ',go)}
}

/* ---------- 匯出 ---------- */
const withSent=()=>$('#sentences-toggle').checked;
const showPos=()=>pref.pos==='on';
const exportPos=()=>showPos();
const exportLevel=()=>!noLevel()&&$('#export-level').checked;
const headers=()=>['生詞',phoneticLabel(),...(exportPos()?[posLabel()]:[]),'英文翻譯',...(!exportLevel()?[]:[levelLabel()]),...relationHeaders(),...(withSent()?['例句']:[])].map(toScript);
function relationAttribution(){return relationFields.some(([k])=>withRelation(k))?'詞彙參考來源：中華民國教育部（Ministry of Education, R.O.C.）。《國語辭典簡編本》（版本編號：2014_20260929），https://dict.concised.moe.edu.tw/ 。CC BY-ND 3.0 TW。公眾授權使用說明：https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/conciseddict_10312.pdf 。手動修改內容為使用者編輯，請與辭典原文分別核對。':''}
function copySentenceHtml(row,index){
 const marked=makeMarked(val(row,'sentence'),val(row,'word'),index);
 return marked.replace(/<span class="preview-underline">([\s\S]*?)<\/span>/g,'<u style="text-decoration:underline;text-decoration-color:#C4623A;text-underline-offset:.32em">$1</u>')
  .replace(/<span class="preview-blank"[^>]*><span class="blank-line">([\s\S]*?)<\/span><\/span>/g,'<u style="color:#2B2320;text-decoration:underline">$1</u>');
}
function tableHtml(){
 const base='border:1px solid #888;padding:6px;vertical-align:top;text-align:left;font-family:Microsoft JhengHei,PingFang TC,Arial,sans-serif;font-size:14px;line-height:1.8;';
 let html='<table style="border-collapse:collapse;width:100%;background-color:#FFFFFF;color:#2B2320;font-family:Microsoft JhengHei,PingFang TC,Arial,sans-serif;font-size:14px;line-height:1.8"><thead><tr>'+headers().map(x=>`<th bgcolor="#F2EAE0" style="${base}background-color:#F2EAE0;color:#2B2320;font-weight:600">${escaped(x)}</th>`).join('')+'</tr></thead><tbody>';
 rows().forEach((r,i)=>{const cells=rowValues(r).slice(0,withSent()?-1:undefined).map((x,k)=>((k===0&&blankWord())||(k===1&&blankPhonetic()))?'<u>　　　　　</u>':escaped(toScript(x)));if(withSent())cells.push(copySentenceHtml(r,i));html+='<tr>'+cells.map(x=>`<td bgcolor="#FFFFFF" style="${base}background-color:#FFFFFF;color:#2B2320">${x}</td>`).join('')+'</tr>'});return html+'</tbody></table>'+copyPracticeHtml();
}
function copyTableBySelection(html){
 const selection=window.getSelection?.(),active=document.activeElement;if(!selection||!document.execCommand)return false;
 const ranges=[];for(let i=0;i<selection.rangeCount;i++)ranges.push(selection.getRangeAt(i).cloneRange());
 const temp=document.createElement('div');temp.contentEditable='true';temp.style.cssText='position:fixed;left:-10000px;top:0;width:1000px;background:#FFFFFF';temp.innerHTML=html;document.body.append(temp);
 try{const range=document.createRange();range.selectNodeContents(temp);selection.removeAllRanges();selection.addRange(range);return document.execCommand('copy')}
 finally{temp.remove();selection.removeAllRanges();for(const range of ranges)selection.addRange(range);active?.focus?.({preventScroll:true})}
}
async function copyFormattedTable(){
 const html=tableHtml(),plain=rows().map(r=>rowValues(r).join('\t')).join('\n');let copied=false;
 try{await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([plain],{type:'text/plain'})})]);copied=true}catch{try{copied=copyTableBySelection(html)}catch{}}
 $('#export-message').textContent=copied?'表格已複製，包含顏色與格式。':'瀏覽器未允許複製，請改用下載 Word。';
}
function documentHtml(){return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,'Noto Sans TC',sans-serif;color:#2B2320}h1{font-size:22pt}p{font-size:10pt;color:#555}table{margin-top:1rem}th{background:#F2EAE0}</style><style>.relation-reference{font-size:.78rem;color:var(--muted);padding:.2rem .5rem;line-height:1.5}.relation-reference details{margin:.25rem 0}.relation-reference button{font-size:.8rem;margin:.2rem 0}.relation-reference a{color:var(--ink)}.relation-reference .original{white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body><h1>${escaped(docTitle())}</h1><p>${escaped(MMV.brand)}${!exportLevel()?'':'｜'+escaped(levelLabel())+'為詞表參考'}</p>${tableHtml()}<p>${escaped(relationAttribution())}</p></body></html>`}
function download(name,content,type){const blob=new Blob([content],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function csvCell(x){return '"'+String(x??'').replaceAll('"','""')+'"'}
function rowValues(r){return [blankWord()?'':val(r,'word'),blankPhonetic()?'':val(r,'pinyin'),...(exportPos()?[val(r,'pos')]:[]),val(r,'meaning'),...(!exportLevel()?[]:[val(r,'level')]),...relationValues(r),...(withSent()?[val(r,'sentence')]:[])].map(toScript)}
function csv(){const out=[headers().map(csvCell).join(',')];rows().filter(r=>val(r,'word')).forEach(r=>out.push(rowValues(r).map(csvCell).join(',')));if(relationAttribution())out.push(csvCell(relationAttribution()));download(safeDocName()+'.csv','﻿'+out.join('\r\n'),'text/csv;charset=utf-8')}
async function cards(){const clean=s=>String(s??'').replace(/[\t\r\n\u2028\u2029]+/g,' ').trim();const cardRows=rows().filter(r=>val(r,'word'));const out=cardRows.map(r=>{const back=[val(r,'pinyin'),...(exportPos()?[val(r,'pos')]:[]),val(r,'meaning'),...relationFields.filter(([k])=>withRelation(k)&&val(r,k)).map(([k,label])=>label+'：'+val(r,k))].filter(Boolean).join('｜')+(withSent()&&val(r,'sentence')?'｜'+val(r,'sentence'):'');return clean(val(r,'word'))+'\t'+clean(back)});
 if(!out.length){$('#export-message').textContent='生詞表還是空的。';return}
 const name=safeDocName()+'_字卡_Anki_Quizlet',content=out.join('\r\n');
 const instructions='字卡匯入說明\r\n\r\nQuizlet：解壓縮後，用文字編輯器開啟字卡 .txt，複製全部內容，貼到 Quizlet 的「匯入」。詞語與定義之間選「Tab／定位點」，卡片之間選「換行」。不要把本說明檔貼進匯入框。\r\nAnki：匯入字卡 .txt，編碼選 UTF-8、分隔符號選 Tab，第一欄為正面，第二欄為背面。\r\n\r\n每行一張卡；中文在正面，拼音／注音、詞性、意思及所選內容在背面。\r\n\r\n';
 try{if(!window.JSZip){$('#export-message').textContent='字卡元件尚未載入，請重新整理後再試。';return}
 const zip=new JSZip();zip.file(name+'.txt',content);zip.file('匯入說明與資料來源.txt',instructions+relationAttribution()+'\r\n詞典英文釋義來源：CC-CEDICT（MDBG），https://www.mdbg.net/chinese/dictionary?page=cc-cedict ，CC BY-SA 4.0。使用者編輯的內容請另行核對。');
 const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});download(name+'.zip',blob,'application/zip');$('#export-message').textContent='已下載字卡 ZIP：解壓縮後，將字卡 .txt 內容貼到 Quizlet「匯入」，詞語與定義選 Tab／定位點，卡片之間選換行；Anki 可直接匯入該 .txt。來源說明另附，不會混入字卡。';
 }catch(e){$('#export-message').textContent='字卡檔下載失敗，請再試一次。'}
}

/* ---------- 事件 ---------- */
body.addEventListener('input',e=>{const row=e.target.closest('tr');if(!row)return;const f=e.target.dataset.field;
 if(f==='pinyin'){row.dataset.ptouched='1';row._sy=null;renderAlts(row);if(currentMark()==='phonetic')renderPreview(row)}
 if(f==='synonym'||f==='antonym'){row.dataset[f+'Touched']='1';renderRelationReference(row)}
 if(e.target.tagName==='TEXTAREA')autosize(e.target);
 if(f==='meaning'){row.dataset.mtouched='1';renderSenses(row);updateAuto(row)}
 if(f==='pos')row.dataset.otouched='1';
 if(f==='word'){clearTimeout(row._t);row._t=setTimeout(()=>{delete row.dataset.ptouched;delete row.dataset.mtouched;delete row.dataset.otouched;fillRow(row);updateCount();buildPrompt()},250)}
 else if(f==='sentence'&&!e.isComposing&&!e.target._composing)renderPreview(row);updateCount()});
body.addEventListener('click',e=>{if(e.target.closest('.sentence-preview')){editSentence(e.target.closest('tr'));return}if(e.target.matches('.delete-row')){e.target.closest('tr').remove();refreshAll()}else if(e.target.dataset.alt!==undefined){chooseAlt(e.target.closest('tr'),+e.target.dataset.alt)}else if(e.target.dataset.sense!==undefined){const row=e.target.closest('tr');const sense=e.target.dataset.sense,selected=val(row,'meaning').split('；').map(x=>x.trim()).filter(Boolean);setVal(row,'meaning',(selected.includes(sense)?selected.filter(x=>x!==sense):[...selected,sense]).join('；'));row.dataset.mtouched='1';renderSenses(row);updateAuto(row)}});
/* 意思、例句欄不換行：按 Enter 等於離開欄位 */
body.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='TEXTAREA'&&!e.isComposing&&e.keyCode!==229&&!e.target._composing){e.preventDefault();e.target.blur()}});
$('#clear-input').addEventListener('click',()=>{$('#word-input').value='';$('#chip-list').replaceChildren();$('#candidates').hidden=true;$('#word-input').focus();scheduleSave()});
$('#make-list').addEventListener('click',()=>inputMode==='list'?parseList():findWords());
$('#tab-list').addEventListener('click',()=>setMode('list'));$('#tab-text').addEventListener('click',()=>setMode('text'));
$('#add-candidates').addEventListener('click',addCandidates);
$('#cand-all').addEventListener('click',()=>document.querySelectorAll('#chip-list input').forEach(x=>x.checked=true));
$('#cand-none').addEventListener('click',()=>document.querySelectorAll('#chip-list input').forEach(x=>x.checked=false));
$('#add-row').addEventListener('click',()=>{const r=newRow();r.querySelector('[data-field="word"]').focus();refreshAll()});$('#sentences-toggle').addEventListener('change',()=>{if($('#sentences-toggle').checked)resetSentenceMark();setSentences();syncWsOptions()});
document.querySelectorAll('input[name="mark-style"],input[name="color-style"],#mark-color').forEach(e=>e.addEventListener('input',()=>{const colored=currentMark()==='color';$('#color-options').hidden=!colored;$('#single-color-label').hidden=document.querySelector('input[name="color-style"]:checked').value!=='same';rows().forEach(renderPreview);syncWsOptions()}));document.querySelectorAll('input[name="color-style"]').forEach(e=>e.addEventListener('change',()=>{$('#single-color-label').hidden=document.querySelector('input[name="color-style"]:checked').value!=='same';rows().forEach(renderPreview)}));
$('#max-level').addEventListener('change',()=>{pref.maxLevel=$('#max-level').value;savePrefs();updateRangeHint();if(!$('#candidates').hidden)findWords()});
$('#ai-level').addEventListener('change',()=>{pref.aiLevel=$('#ai-level').value;savePrefs();buildPrompt()});
/* 上方學生程度變更時，同步 AI 例句程度；下方仍可另行選擇 */
$('#skip-level').addEventListener('change',()=>{const v=$('#skip-level').value;pref.skip=v;$('#ai-level').value=v;pref.aiLevel=v;buildPrompt();savePrefs();updateRangeHint();if(!$('#candidates').hidden)findWords()});$('#ai-helper').addEventListener('toggle',buildPrompt);
$('#copy-prompt').addEventListener('click',()=>{buildPrompt();copyText($('#ai-prompt').value,$('#prompt-message'),'已複製！貼到你的 ChatGPT 或 Claude 就可以了。')});
$('#fill-sentences').addEventListener('click',fillSentences);
/* 清空生詞表（按兩次確認，可復原） */
let clearArmed=null;
function resetClearBtn(){clearTimeout(clearArmed);clearArmed=null;const b=$('#clear-list');b.textContent='🗑️ 清空';b.classList.remove('armed')}
$('#clear-list').addEventListener('click',()=>{
 const msg=$('#list-message');
 if(!rows().length){msg.textContent='生詞表已經是空的。';return}
 if(!clearArmed){const b=$('#clear-list');b.textContent='再按一次確認清空';b.classList.add('armed');clearArmed=setTimeout(resetClearBtn,4000);return}
 resetClearBtn();const prev=rows(),n=prev.filter(r=>val(r,'word')).length;body.replaceChildren();refreshAll();
 offerUndo(prev,`已清空 ${n} 個詞。`);
});
$('#export-level').addEventListener('change',e=>{$('#vocab-table').classList.toggle('print-no-level',!e.target.checked);scheduleSave();schedulePreview()});
$('#download-doc').addEventListener('click',downloadDocx);$('#download-csv').addEventListener('click',csv);$('#download-cards').addEventListener('click',cards);$('#print-list').addEventListener('click',printSheet);$('#copy-table').addEventListener('click',copyFormattedTable);$('#download-pptx').addEventListener('click',()=>exportVocabSlides('pptx'));$('#download-slides').addEventListener('click',()=>exportVocabSlides('google'));

function editSentence(row){const cell=row.querySelector('.sentence-column');cell.classList.add('is-editing');const field=cell.querySelector('textarea');field.focus();autosize(field)}
body.addEventListener('focusin',e=>{if(e.target.matches('textarea.sentence-input'))e.target.closest('td').classList.add('is-editing')});
body.addEventListener('compositionstart',e=>{if(e.target.matches('textarea.sentence-input')){e.target._composing=true;e.target.closest('td').classList.add('is-editing')}});
body.addEventListener('compositionend',e=>{if(e.target.matches('textarea.sentence-input')){e.target._composing=false;if(document.activeElement!==e.target)e.target.closest('td').classList.remove('is-editing');renderPreview(e.target.closest('tr'));scheduleSave();schedulePreview()}});
body.addEventListener('focusout',e=>{if(e.target.matches('textarea.sentence-input')&&!e.target._composing){e.target.closest('td').classList.remove('is-editing');renderPreview(e.target.closest('tr'))}});
body.addEventListener('keydown',e=>{if(e.target.matches('.sentence-preview')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();editSentence(e.target.closest('tr'))}});
for(const id of ['ws-blank-word','ws-blank-phonetic','extra-practice'])$('#'+id).addEventListener('change',()=>{syncWsOptions();scheduleSave();schedulePreview()});

/* ---------- 啟動 ---------- */
setSentences();$('#color-options').hidden=true;$('#vocab-table').classList.toggle('print-no-level',!$('#export-level').checked);
$('#input-message').textContent='詞典載入中…';
setTimeout(()=>{
 Lang.init();
 bindPref('#pref-standard','standard',applyStandard);bindPref('#pref-script','script',applyScript);
 bindPref('#pref-phonetic','phonetic',applyPhonetic);bindPref('#pref-tone','tone',applyTone);
 applyPos();bindPref('#pref-region','region',applyRegion);
 $('#th-phonetic').textContent=phoneticLabel();applyStandard();
 for(const w of GLOSS.keys())if(w.length>1)Lang.addKey(w); // 讓「領錢」等常用搭配在整段課文裡不被拆開
 restoreDraft();
 /* 第一次使用不放範例詞，避免和老師自己的詞混在一起；空白列可以直接輸入 */
 const restored=rows().filter(r=>val(r,'word')).length;
 $('#list-message').textContent=restored?`已恢復上次的生詞表（${restored} 個詞）。`:'還沒有生詞：在「📥 貼上生詞」分頁貼上生詞，或直接在下面的空白列輸入。';
 $('#input-message').textContent='';refreshAll();syncWsOptions();ensureDict();updatePrefsSummary();showStep(restored?'step-list':'step-input');updateSteps();
 if(window.matchMedia('(min-width: 900px)').matches)$('#sheet-preview').open=true;
},20);

/* ===== 自動保存草稿 ===== */
const DRAFT_KEY='vocab-draft-v1'+(MMV.lesson?'|'+MMV.lesson:'');
let saveTimer=null,restoring=false;
function snapshot(){
 return {v:1,rows:rows().map(r=>({w:val(r,'word'),p:val(r,'pinyin'),o:val(r,'pos'),m:val(r,'meaning'),s:val(r,'sentence'),synonym:val(r,'synonym'),antonym:val(r,'antonym'),synonymTouched:!!r.dataset.synonymTouched,antonymTouched:!!r.dataset.antonymTouched,relationChoice:r._relationChoice,pt:!!r.dataset.ptouched,mt:!!r.dataset.mtouched,ot:!!r.dataset.otouched,ch:r._chosen||0})),
  synonym:withRelation('synonym'),antonym:withRelation('antonym'),sentences:$('#sentences-toggle').checked,mark:currentMark(),colorStyle:document.querySelector('input[name="color-style"]:checked').value,color:$('#mark-color').value,
  exportPos:showPos(),exportLevel:$('#export-level').checked,wsHeader:$('#ws-header').checked,blankWord:blankWord(),blankPhonetic:blankPhonetic(),wsAnswers:$('#ws-answers').checked,title:$('#doc-title').value,input:$('#word-input').value,mode:inputMode};
}
function scheduleSave(){if(restoring)return;clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem(DRAFT_KEY,JSON.stringify(snapshot()))}catch{}},400)}
function restoreDraft(){
 let d=null;try{d=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null')}catch{}
 if(!d||d.v!==1)return false;
 restoring=true;
 try{
  for(const [k] of relationFields)$('#'+k+'-toggle').checked=!!d[k];setRelations();
  $('#sentences-toggle').checked=!!d.sentences;
  $('#extra-practice').checked=false;resetSentenceMark();
  const cs=document.querySelector(`input[name="color-style"][value="${d.colorStyle}"]`);if(cs)cs.checked=true;
  if(d.color)$('#mark-color').value=d.color;
  $('#color-options').hidden=currentMark()!=='color';$('#single-color-label').hidden=document.querySelector('input[name="color-style"]:checked').value!=='same';
  applyPos();$('#export-level').checked=d.exportLevel===true;$('#vocab-table').classList.toggle('print-no-level',!$('#export-level').checked);
  $('#ws-header').checked=!!d.wsHeader;$('#ws-blank-word').checked=false;$('#ws-blank-phonetic').checked=false;$('#ws-answers').checked=d.wsAnswers!==false;$('#doc-title').value=d.title||'我的生詞表';
  if(d.mode==='text')setMode('text');$('#word-input').value=d.input||'';
  setSentences();
  body.replaceChildren();
  for(const x of (d.rows||[]).filter(x=>x.w||x.s)){
   const r=newRow(x.w,x.pt?x.p:'',x.mt?x.m:'',x.s);for(const [k] of relationFields){setVal(r,k,x[k]||'');if(x[k+'Touched']||(x[k+'Touched']===undefined&&x[k]))r.dataset[k+'Touched']='1'}
   r._relationChoice=x.relationChoice;
   if(x.ot){r.dataset.otouched='1';setVal(r,'pos',posInLanguage(x.o))}
   fillRow(r);
   if(!x.pt&&x.ch&&r._readings?.[x.ch])chooseAlt(r,x.ch);
  }
 }finally{restoring=false}
 return (d.rows||[]).length>0||true;
}
document.addEventListener('input',scheduleSave,true);document.addEventListener('change',scheduleSave,true);document.addEventListener('click',()=>setTimeout(scheduleSave,0),true);

/* ===== 學習單與答案頁的共同資料 ===== */
const blankWord=()=>$('#ws-blank-word').checked;
const blankPhonetic=()=>$('#ws-blank-phonetic').checked;
const hasBankPractice=()=>withSent()&&$('#extra-practice').checked;
const practiceRows=()=>exportRows().filter(r=>val(r,'sentence'));
const mainAnswersNeeded=()=>blankWord()||blankPhonetic()||(withSent()&&currentMark()==='blank');
const isWorksheetBlank=()=>withSent()&&(currentMark()==='blank'||hasBankPractice());
function phoneticRuby(word,row){return `<ruby style="ruby-position:over">${escaped(word)}<rp>（</rp><rt style="font-size:.55em">${escaped(row?val(row,'pinyin'):'')}</rt><rp>）</rp></ruby>`}
let practiceCache={key:'',list:[],bank:[]};
function shufflePractice(list){
 const out=list.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
 if(out.length>1&&out.every((r,i)=>r===list[i]))out.push(out.shift());return out;
}
function practiceOrder(){
 const list=practiceRows();if(practiceCache.list.length!==list.length||practiceCache.list.some(r=>!list.includes(r))||practiceCache.key!==JSON.stringify(list.map(r=>val(r,'word')))){
  practiceCache={key:JSON.stringify(list.map(r=>val(r,'word'))),list:shufflePractice(list),bank:shufflePractice(list)};
 }
 return practiceCache;
}
function practiceHtml(cellSentence){
 if(!hasBankPractice()||!practiceRows().length)return '';
 const order=practiceOrder(),font='font-family:Microsoft JhengHei,PingFang TC,Arial,sans-serif;font-size:11pt;line-height:2;color:#2B2320;';
 const bank=order.bank.map(r=>`<span style="white-space:nowrap">${escaped(val(r,'word'))}</span>`).join('　　');
 const questions=order.list.map((r,i)=>`<tr class="practice-question" style="page-break-inside:avoid"><td style="${font}border:0;width:32px;padding:6px 4px 6px 0;vertical-align:top">${i+1}.</td><td style="${font}border:0;padding:6px 0;vertical-align:top">${cellSentence(r,rows().indexOf(r),true)}</td></tr>`).join('');
 return `<section class="fill-practice" style="page-break-before:always;break-before:page;margin-top:7mm;${font}"><h2 style="font-family:Microsoft JhengHei,PingFang TC,Arial,sans-serif;font-size:14pt;color:#2B2320;margin:0 0 3mm">填空練習</h2><table class="word-bank" style="display:table;width:100%;border-collapse:collapse;border:1px solid #888;margin-bottom:3mm"><tbody><tr><td style="${font}border:1px solid #888;padding:3mm">${bank}</td></tr></tbody></table><table class="practice-questions" style="width:100%;border:0;border-collapse:collapse"><tbody>${questions}</tbody></table></section>`;
}
function copyPracticeHtml(){
 return practiceHtml((r,i)=>sentenceParts(val(r,'sentence'),val(r,'word')).map(p=>p.hit?`<u style="color:#2B2320;text-decoration:underline">${'　'.repeat(Math.max(2,charCount(p.t)))}</u>`:escaped(p.t)).join(''));
}
const wantAnswers=()=>(isWorksheetBlank()||blankWord()||blankPhonetic())&&$('#ws-answers').checked&&(hasBankPractice()?(practiceRows().length>0||mainAnswersNeeded()):(!withSent()||exportRows().every(r=>val(r,'sentence'))));
const docTitle=()=>toScript($('#doc-title').value.trim()||'我的生詞表');
function safeDocName(){return docTitle().replace(/[\\/:*?"<>|\x00-\x1f]/g,'').replace(/[. ]+$/g,'').trim()||'我的生詞表'}
function sentenceParts(sentence,word){ // [{t,hit}]
 if(!sentence)return [];if(!word)return [{t:sentence,hit:false}];
 const out=[];let i=0;while(true){const j=sentence.indexOf(word,i);if(j<0){out.push({t:sentence.slice(i),hit:false});break}if(j>i)out.push({t:sentence.slice(i,j),hit:false});out.push({t:word,hit:true});i=j+word.length}
 return out.filter(p=>p.t);
}
function exportRows(){return rows().filter(r=>val(r,'word'))}
function markColor(i){return document.querySelector('input[name="color-style"]:checked').value==='same'?$('#mark-color').value:colorFor(i)}

/* ===== 列印：在隱藏頁框裡排版後列印 ===== */
function checkExportSentences(){
 if(!withSent()||hasBankPractice())return true;
 const missing=exportRows().filter(r=>!val(r,'sentence'));
 if(!missing.length)return true;
 $('#export-message').textContent='還有 '+missing.length+' 個生詞沒有例句：請先填入例句，或取消「在生詞表加入例句」後匯出。';
 return false;
}
function answerHeaders(){return ['#','生詞',...(blankPhonetic()?[phoneticLabel()]:[]),...(withSent()?['例句']:[])].map(toScript)}
function answerValues(r,i){return [String(i+1),val(r,'word'),...(blankPhonetic()?[val(r,'pinyin')]:[]),...(withSent()?[val(r,'sentence')]:[])].map(toScript)}

function sheetHtml(){
 const heads=headers(),list=exportRows(),num=$('#ws-header').checked||wantAnswers();
 const cellSentence=(r,i,practice=false)=>sentenceParts(val(r,'sentence'),val(r,'word')).map(p=>{if(!p.hit)return escaped(p.t);const m=practice?'blank':currentMark();if(m==='blank'||m==='bank')return practice?`<u style="color:#2B2320;text-decoration:underline">${'　'.repeat(Math.max(2,charCount(p.t)))}</u>`:`<span class="blank">${'　'.repeat(Math.max(2,charCount(p.t)))}</span>`;if(m==='phonetic')return phoneticRuby(p.t,r);if(m==='underline')return `<u>${escaped(p.t)}</u>`;return `<b style="color:${markColor(i)}">${escaped(p.t)}</b>`}).join('');
 const body=list.map((r,i)=>{const v=rowValues(r);if(withSent())v.pop();const cells=v.map((x,k)=>((k===0&&blankWord())||(k===1&&blankPhonetic()))?'<span class="field-blank">　　　　　　</span>':escaped(x));if(withSent())cells.push(cellSentence(r,i));return '<tr>'+(num?`<td class="n">${i+1}</td>`:'')+cells.map(c=>`<td>${c}</td>`).join('')+'</tr>'}).join('');
 const answerList=hasBankPractice()?practiceOrder().list:list;
 const answerTable=(answerRows)=>`<table><thead><tr>${answerHeaders().map(h=>`<th>${escaped(h)}</th>`).join('')}</tr></thead><tbody>${answerRows.map((r,i)=>'<tr>'+answerValues(r,i).map(x=>`<td>${escaped(x)}</td>`).join('')+'</tr>').join('')}</tbody></table>`;
 const vocabAnswers=hasBankPractice()&&mainAnswersNeeded()?`<h2>生詞表答案</h2>${answerTable(list)}`:'';
 const practiceAnswers=hasBankPractice()&&practiceRows().length?`<h2>填空練習答案</h2>${answerTable(answerList)}`:'';
 const answers=wantAnswers()?`<section class="answers">${hasBankPractice()?vocabAnswers+practiceAnswers:`<h2>答案</h2>${answerTable(list)}`}</section>`:'';
 const practice=practiceHtml(cellSentence),paged=hasBankPractice()&&practiceRows().length>0;
 const ws=$('#ws-header').checked?'<p class="ws">班級：<span></span>姓名：<span></span>日期：<span></span></p>':'';
 const sub=exportLevel()?`<p class="sub">${escaped(levelLabel())}為詞表參考</p>`:'';
 const W={'生詞':1.1,'拼音':1.4,'注音':1.6,'詞性':1.3,'英文翻譯':2.4,'例句':3.6},ks=[...(num?['#']:[]),...heads],wt=ks.map(k=>k==='#'?0.45:(W[Lang.toTrad(k)]||1.5)),tot=wt.reduce((x,y)=>x+y,0),cols='<colgroup>'+wt.map(w=>`<col style="width:${(100*w/tot).toFixed(1)}%">`).join('')+'</colgroup>';
 return toScript(`<!doctype html><html lang="${pref.script==='simp'?'zh-Hans':'zh-Hant'}"><head><meta charset="utf-8"><title>${escaped(docTitle())}</title><style>
 @page{size:A4;margin:16mm 14mm}body{font-family:"Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif;color:#2B2320;font-size:11pt;margin:0}
 h1{font-size:18pt;margin:0 0 2mm}h2{font-size:14pt;margin:0 0 3mm}.sub{font-size:9pt;color:#666;margin:0 0 3mm}
 .ws{margin:2mm 0 5mm;font-size:11pt}.ws span{display:inline-block;width:38mm;border-bottom:1px solid #333;margin:0 6mm 0 1mm}
 table{width:100%;border-collapse:collapse}th,td{border:1px solid #888;padding:2mm 2.4mm;text-align:left;vertical-align:top}th{background:#F2EAE0;font-size:9.5pt}
 td.n,th.n{text-align:center;color:#555}tr{page-break-inside:avoid}
 .blank{display:inline-block;min-width:16mm;border-bottom:1px solid #222;margin:0 1mm;vertical-align:baseline;padding-bottom:.12em}
 .fill-practice{margin-top:7mm}.fill-practice h2{break-after:avoid}.word-bank{border:1px solid #888;padding:3mm;display:flex;flex-wrap:wrap;gap:3mm 6mm;break-inside:avoid}.fill-practice li{margin:4mm 0;line-height:2;break-inside:avoid}
 .field-blank{display:inline-block;width:90%;max-width:100%;overflow:hidden;min-height:1.5em;border-bottom:1px solid #222}.blank u,u{text-underline-offset:.32em}.answers{page-break-before:always}.foot{margin-top:4mm;font-size:8pt;color:#888}
 ${paged?'@media screen{body.practice-document{background:#F2EAE0}.practice-document>.worksheet-page,.practice-document>.fill-practice,.practice-document>.answers{background:#fff;box-sizing:border-box;min-height:265mm;padding:16px;margin:0 0 24px!important;border:1px solid #E6DDD2}}':''}
 </style><style>.relation-reference{font-size:.78rem;color:var(--muted);padding:.2rem .5rem;line-height:1.5}.relation-reference details{margin:.25rem 0}.relation-reference button{font-size:.8rem;margin:.2rem 0}.relation-reference a{color:var(--ink)}.relation-reference .original{white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body${paged?' class="practice-document"':''}>${paged?'<section class="worksheet-page">':''}<h1>${escaped(docTitle())}</h1>${sub}${ws}<table style="table-layout:fixed">${cols}<thead><tr>${num?'<th class="n">#</th>':''}${heads.map(h=>`<th>${escaped(h)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>${paged?'<p class="foot">${escaped(MMV.brand)} · 生詞表製作</p></section>':''}${practice}${paged?'':'<p class="foot">${escaped(MMV.brand)} · 生詞表製作</p>'}${answers}<p class="foot">${escaped(relationAttribution())}</p></body></html>`);
}
function printSheet(){
 if(!checkExportSentences())return;
 if(!exportRows().length){$('#export-message').textContent='生詞表還是空的。';return}
 let f=$('#print-frame');if(f)f.remove();
 f=document.createElement('iframe');f.id='print-frame';f.setAttribute('aria-hidden','true');f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
 document.body.append(f);
 const doc=f.contentDocument;doc.open();doc.write(sheetHtml());doc.close();
 setTimeout(()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch{window.print()}},250);
 $('#export-message').textContent='已開啟列印視窗，可選「另存為 PDF」。';
}

/* ===== 真正的 Word（.docx） ===== */
function docxEsc(s){return String(s).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
function wrun(text,{size=22,bold=false,color='',u=false,latin=false}={}){
 const ea=pref.script==='simp'?'Microsoft YaHei':'Microsoft JhengHei',lat=latin?'Arial':ea;
 return `<w:r><w:rPr><w:rFonts w:ascii="${lat}" w:hAnsi="${lat}" w:eastAsia="${ea}"/>${bold?'<w:b/>':''}${u?'<w:u w:val="single"/>':''}${color?`<w:color w:val="${color.replace('#','')}"/>`:''}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:t xml:space="preserve">${docxEsc(toScript(text))}</w:t></w:r>`;
}
const wpara=(runs,{after=120,jc=''}={})=>`<w:p><w:pPr><w:spacing w:after="${after}"/>${jc?`<w:jc w:val="${jc}"/>`:''}</w:pPr>${runs}</w:p>`;
function wcell(runs,width,{shade='',center=false}={}){return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${shade?`<w:shd w:val="clear" w:color="auto" w:fill="${shade}"/>`:''}</w:tcPr>${wpara(runs,{after:0,jc:center?'center':''})}</w:tc>`}
function wtable(headRow,bodyRows,widths){
 const b='<w:top w:val="single" w:sz="4" w:color="888888"/><w:left w:val="single" w:sz="4" w:color="888888"/><w:bottom w:val="single" w:sz="4" w:color="888888"/><w:right w:val="single" w:sz="4" w:color="888888"/><w:insideH w:val="single" w:sz="4" w:color="888888"/><w:insideV w:val="single" w:sz="4" w:color="888888"/>';
 const tr=(cells,head)=>`<w:tr>${head?'<w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>':'<w:trPr><w:cantSplit/></w:trPr>'}${cells.map((c,i)=>wcell(c.runs,widths[i],{shade:head?'F2EAE0':'',center:c.center})).join('')}</w:tr>`;
 return `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a,x)=>a+x,0)}" w:type="dxa"/><w:tblBorders>${b}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="70" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="70" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(w=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${tr(headRow,true)}${bodyRows.map(r=>tr(r,false)).join('')}</w:tbl>`;
}
function wordRuby(word,reading){
 return `<w:r><w:ruby><w:rubyPr><w:rubyAlign w:val="center"/><w:hps w:val="11"/><w:hpsRaise w:val="24"/><w:hpsBaseText w:val="22"/><w:lid w:val="${pref.script==='simp'?'zh-CN':'zh-TW'}"/></w:rubyPr><w:rt>${wrun(reading,{size:11,latin:pref.phonetic==='pinyin'})}</w:rt><w:rubyBase>${wrun(word)}</w:rubyBase></w:ruby></w:r>`;
}
function docxXml(){
 const heads=headers(),list=exportRows(),num=$('#ws-header').checked||wantAnswers(),TOTAL=10204;
 const weight={'生詞':1.1,'拼音':1.4,'注音':1.6,'詞性':1.3,'英文翻譯':2.4,'例句':3.6};
 const keys=[...(num?['#']:[]),...heads];const ws=keys.map(k=>k==='#'?0.45:(weight[Lang.toTrad(k)]||1.5));const sum=ws.reduce((a,x)=>a+x,0);
 const widths=ws.map(x=>Math.floor(TOTAL*x/sum));widths[widths.length-1]+=TOTAL-widths.reduce((a,x)=>a+x,0);
 const H=t=>({runs:wrun(t,{size:19,bold:true}),center:false});
 const sentRuns=(r,i,practice=false)=>sentenceParts(val(r,'sentence'),val(r,'word')).map(p=>{if(!p.hit)return wrun(p.t);const m=practice?'blank':currentMark();if(m==='blank'||m==='bank')return wrun('＿'.repeat(blankUnits(p.t)));if(m==='phonetic')return wordRuby(p.t,val(r,'pinyin'));if(m==='underline')return wrun(p.t,{u:true});return wrun(p.t,{bold:true,color:markColor(i)})}).join('')||wrun('');
 const bodyRows=list.map((r,i)=>{const v=rowValues(r);if(withSent())v.pop();const phIdx=1;
  const cells=v.map((x,k)=>({runs:wrun(((k===0&&blankWord())||(k===1&&blankPhonetic()))?'＿＿＿＿＿':x,{latin:k===phIdx&&pref.phonetic==='pinyin',size:k===phIdx?20:22})}));
  if(withSent())cells.push({runs:sentRuns(r,i)});
  return [...(num?[{runs:wrun(String(i+1),{size:20,color:'666666'}),center:true}]:[]),...cells]});
 let x=wpara(wrun(docTitle(),{size:36,bold:true}),{after:80});
 if(exportLevel())x+=wpara(wrun(levelLabel()+'為詞表參考',{size:18,color:'666666'}),{after:120});
 if($('#ws-header').checked)x+=wpara(wrun('班級：＿＿＿＿＿＿　　姓名：＿＿＿＿＿＿＿＿　　日期：＿＿＿＿＿＿'),{after:200});
 x+=wtable([...(num?[{runs:wrun('#',{size:19,bold:true}),center:true}]:[]),...heads.map(H)],bodyRows,widths);
 if(hasBankPractice()&&practiceRows().length){
  x+='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  const order=practiceOrder();x+=wpara(wrun('填空練習',{size:28,bold:true}),{after:160});
  x+=wtable([{runs:order.bank.map(r=>wrun(val(r,'word')+'　　')).join('')}],[],[TOTAL]);
  order.list.forEach((r,i)=>{x+=wpara(wrun((i+1)+'. ')+sentRuns(r,rows().indexOf(r),true),{after:180})});
 }
 x+=wpara(wrun(MMV.brand+' · 生詞表製作',{size:16,color:'888888'}),{after:0});
 if(wantAnswers()){
  const ah=answerHeaders(),weights=ah.map((_,i)=>i===0?0.5:i===1?1.3:2.5),sum=weights.reduce((a,b)=>a+b,0),aw=weights.map(w=>Math.floor(TOTAL*w/sum));aw[aw.length-1]+=TOTAL-aw.reduce((a,b)=>a+b,0);
  x+='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  if(hasBankPractice()){
   if(mainAnswersNeeded()){
    x+=wpara(wrun('生詞表答案',{size:30,bold:true}),{after:160});
    x+=wtable(ah.map(H),list.map((r,i)=>answerValues(r,i).map(t=>({runs:wrun(t)}))),aw);
   }
   if(practiceRows().length){
    x+=wpara(wrun('填空練習答案',{size:30,bold:true}),{after:160});
    x+=wtable(ah.map(H),practiceOrder().list.map((r,i)=>answerValues(r,i).map(t=>({runs:wrun(t)}))),aw);
   }
  }else{
   x+=wpara(wrun('答案',{size:30,bold:true}),{after:160});
   x+=wtable(ah.map(H),list.map((r,i)=>answerValues(r,i).map(t=>({runs:wrun(t)}))),aw);
  }
 }
 const sect='<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="851" w:bottom="1000" w:left="851" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>';
 return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${x}${sect}</w:body></w:document>`;
}
async function downloadDocx(){
 
 if(!checkExportSentences())return;
 if(!exportRows().length){$('#export-message').textContent='生詞表還是空的。';return}
 if(!window.JSZip){$('#export-message').textContent='Word 元件尚未載入，請重新整理後再試。';return}
 const zip=new JSZip();
 zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 zip.file('word/document.xml',docxXml());
 const blob=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=safeDocName()+'.docx';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
 $('#export-message').textContent='已下載 Word 檔（.docx），Word、Pages、Google 文件都能打開編輯。';
}
/* ===== PPT／Google 簡報：一詞一頁＋生詞總覽（例句照匯出設定的呈現方式） ===== */
let pptxLoading=null;
function loadPptx(){
 if(window.PptxGenJS)return Promise.resolve(window.PptxGenJS);
 if(!pptxLoading)pptxLoading=new Promise((resolve,reject)=>{const sc=document.createElement('script');sc.src=MMV.vendor+'pptxgen.bundle.js';sc.onload=()=>window.PptxGenJS?resolve(window.PptxGenJS):reject(new Error('PPT 元件載入失敗，請重新整理後再試。'));sc.onerror=()=>{pptxLoading=null;reject(new Error('PPT 元件載入失敗，請確認網路後再試。'))};document.head.append(sc)});
 return pptxLoading;
}
function pptSentenceRuns(r,i,base){
 const parts=sentenceParts(toScript(val(r,'sentence')),toScript(val(r,'word')));const m=currentMark();
 return parts.flatMap(pt=>{
  if(!pt.hit)return [{text:pt.t,options:{...base}}];
  if(m==='blank'||m==='bank')return [{text:'＿'.repeat(blankUnits(pt.t)),options:{...base}}];
  if(m==='underline')return [{text:pt.t,options:{...base,underline:{style:'sng'}}}];
  if(m==='phonetic')return [{text:pt.t,options:{...base,bold:true,color:'C4623A'}},{text:'（'+val(r,'pinyin')+'）',options:{...base,fontSize:Math.round(base.fontSize*0.6),color:'C4623A',fontFace:pref.phonetic==='pinyin'?'Arial':base.fontFace}}];
  return [{text:pt.t,options:{...base,bold:true,color:markColor(i).replace('#','').toUpperCase()}}];
 });
}
function buildVocabPptx(Ctor){
 const list=exportRows(),N=list.length,face=pref.script==='simp'?'Microsoft YaHei':'Microsoft JhengHei',ink='2B2320',accent='C4623A',muted='6B5F55';
 const p=new Ctor();p.layout='LAYOUT_WIDE';p.author=MMV.brand;p.title=docTitle();p.lang=pref.script==='simp'?'zh-CN':'zh-TW';
 p.theme={headFontFace:face,bodyFontFace:face,lang:p.lang};
 const foot=sl=>sl.addText(MMV.brand+' · 生詞表製作',{x:7.3,y:7.0,w:5.7,h:.35,fontSize:10,color:'9AA3AB',fontFace:face,align:'right'});
 // 封面
 const cover=p.addSlide();cover.background={color:'FAF7F2'};
 cover.addShape(p.ShapeType.rect,{x:0,y:0,w:13.333,h:.18,fill:{color:'E8825A'},line:{color:'E8825A'}});
 cover.addText(docTitle(),{x:.8,y:2.4,w:11.7,h:1.4,fontSize:48,bold:true,color:ink,fontFace:face,align:'center'});
 cover.addText(toScript(N+' 個生詞'+(exportLevel()?'｜'+levelLabel()+'為詞表參考':'')),{x:.8,y:3.9,w:11.7,h:.6,fontSize:20,color:muted,fontFace:face,align:'center'});
 foot(cover);
 // 一詞一頁
 list.forEach((r,i)=>{
  const sl=p.addSlide();sl.background={color:'FFFFFF'};
  sl.addText(toScript(docTitle()+'　'+(i+1)+' / '+N),{x:.5,y:.3,w:8,h:.4,fontSize:12,color:'9AA3AB',fontFace:face});
  const word=toScript(val(r,'word')),len=Array.from(word).length;
  sl.addText(word,{x:.5,y:.9,w:12.3,h:1.8,fontSize:len>4?60:84,bold:true,color:ink,fontFace:face,align:'center',valign:'middle'});
  const ph=val(r,'pinyin');if(ph)sl.addText(ph,{x:.5,y:2.75,w:12.3,h:.8,fontSize:34,color:accent,fontFace:pref.phonetic==='pinyin'?'Arial':face,align:'center'});
  const pos=exportPos()?toScript(val(r,'pos')):'',meaning=val(r,'meaning');
  const line=[pos,meaning].filter(Boolean).join('｜');if(line)sl.addText(line,{x:.8,y:3.65,w:11.7,h:.7,fontSize:22,color:ink,fontFace:face,align:'center'});
  const rel=relationFields.filter(([k])=>withRelation(k)&&val(r,k)).map(([k,label])=>label+'：'+val(r,k)).join('　');
  if(rel)sl.addText(toScript(rel),{x:.8,y:4.3,w:11.7,h:.5,fontSize:16,color:muted,fontFace:face,align:'center'});
  if(withSent()&&val(r,'sentence')){
   sl.addShape(p.ShapeType.line,{x:2.2,y:5.05,w:8.9,h:0,line:{color:'E6DDD2',width:1}});
   sl.addText(pptSentenceRuns(r,i,{fontSize:28,color:ink,fontFace:face}),{x:.8,y:5.25,w:11.7,h:1.2,align:'center',valign:'middle'});
  }
  foot(sl);
 });
 // 生詞總覽（每頁 6 個詞，字放大方便投影）
 const heads=headers(),W={'生詞':1.1,'拼音':1.4,'注音':1.6,'詞性':1.2,'英文翻譯':2.4,'例句':3.6},ws=[0.45,...heads.map(h=>W[h]||1.4)],tot=ws.reduce((a,b)=>a+b,0),colW=ws.map(w=>+(12.3*w/tot).toFixed(2));
 const per=6,pages=Math.ceil(N/per);
 for(let pg=0;pg<pages;pg++){
  const sl=p.addSlide();sl.background={color:'FFFFFF'};
  sl.addText(toScript('生詞總覽'+(pages>1?'（'+(pg+1)+'／'+pages+'）':'')),{x:.5,y:.3,w:12.3,h:.6,fontSize:24,bold:true,color:ink,fontFace:face});
  const head=['#',...heads].map(h=>({text:toScript(h),options:{bold:true,fill:{color:'F2EAE0'},color:ink}}));
  const body=list.slice(pg*per,pg*per+per).map((r,k)=>{const i=pg*per+k,v=rowValues(r);if(withSent())v.pop();
   const cells=[{text:String(i+1),options:{align:'center',color:muted}},...v.map((x,c)=>({text:x||'',options:c===1&&pref.phonetic==='pinyin'?{fontFace:'Arial'}:{}}))];
   if(withSent())cells.push({text:val(r,'sentence')?pptSentenceRuns(r,i,{fontSize:18,color:ink,fontFace:face}):'',options:{}});
   return cells});
  sl.addTable([head,...body],{x:.5,y:1.05,w:12.3,colW,fontSize:18,fontFace:face,color:ink,valign:'middle',border:{type:'solid',pt:.75,color:'9AA3AB'},margin:.06});
  foot(sl);
 }
 return p;
}
async function exportVocabSlides(kind){
 
 const msg=$('#export-message');
 if(!exportRows().length){msg.textContent='生詞表還是空的。';return}
 const btn=$(kind==='google'?'#download-slides':'#download-pptx');btn.disabled=true;msg.textContent='投影片製作中…';
 try{
  const Ctor=await loadPptx();
  await buildVocabPptx(Ctor).writeFile({fileName:safeDocName()+(kind==='google'?'_Google簡報版.pptx':'_投影片.pptx'),compression:true});
  msg.textContent=kind==='google'?'已下載 Google 簡報版（.pptx）：上傳到 Google 雲端硬碟後，按右鍵 →「開啟工具」→「Google 簡報」。':'已下載 PPT 投影片：一詞一頁，最後附生詞總覽，可直接編輯。';
  
 }catch(e){msg.textContent=(e&&e.message)||'投影片匯出失敗，請再試一次。'}
 finally{btn.disabled=false}
}
function syncWsOptions(){const ok=isWorksheetBlank()||blankWord()||blankPhonetic();$('#ws-answers').disabled=!ok;$('#ws-answers-label').classList.toggle('disabled',!ok)}

/* ===== 詞典背景載入（網站版） ===== */
const dictionaryExportButtons=['download-doc','download-csv','download-cards','print-list','copy-table'];
function setDictionaryExportWaiting(waiting){
 for(const id of dictionaryExportButtons){const button=$('#'+id);button.disabled=waiting;button.setAttribute('aria-disabled',String(waiting));if(waiting)button.title='英文詞典載入完成後即可匯出';else button.removeAttribute('title')}
 $('#dict-export-status').textContent=waiting?'英文詞典載入中，完成後即可匯出。你可以先編輯生詞與例句。':'';
}
async function ensureDict(){
 if(Lang.hasDict())return;
 const note=$('#dict-status');note.hidden=false;note.setAttribute('aria-busy','true');note.textContent='英文詞典載入中，拼音已可使用；英文意思稍後會自動補上。載入時間依網路及裝置而異。';setDictionaryExportWaiting(true);
 try{const res=await fetch(MMV.data+'cedict.txt',{cache:'force-cache'});if(!res.ok)throw 0;const t=await res.text();Lang.loadDict(t);
  restoring=true;try{rows().forEach(r=>{if(val(r,'word'))fillRow(r)})}finally{restoring=false}refreshAll();note.textContent='英文詞典已載入；未手動編輯的意思已自動補上，匯出前請確認讀音與意思。'}
 catch{note.textContent='英文詞典載入失敗，自動英文意思可能空白。你可以手動填寫意思後匯出，或重新整理頁面再試。';$('#dict-export-status').textContent='詞典載入失敗：請先確認並補上意思，再匯出。'}
 finally{note.setAttribute('aria-busy','false');for(const id of dictionaryExportButtons){const button=$('#'+id);button.disabled=false;button.setAttribute('aria-disabled','false');button.removeAttribute('title')}if(Lang.hasDict())$('#dict-export-status').textContent=''}
}


/* Collapsible export preview; build only while open. */
let previewTimer=null,previewHtml='';
function updateSheetPreview(){
 const panel=$('#sheet-preview');if(!panel.open)return;
 const frame=$('#sheet-preview-frame'),empty=!exportRows().length;$('#preview-empty').hidden=!empty;frame.hidden=empty;if(empty)return;
 const missing=withSent()?exportRows().filter(r=>!val(r,'sentence')).length:0;$('#preview-empty').textContent=missing?'還有 '+missing+' 個生詞沒有例句，請先填入例句再匯出。':'先加入生詞，就能在這裡預覽表格。';$('#preview-empty').hidden=!missing;const html=sheetHtml().replace('</head>','<style>body{padding:16px;box-sizing:border-box;font-size:10pt;overflow-wrap:anywhere}.ws span{width:12%;margin-right:2%}td,th{padding:1.5mm}.answers{margin-top:24px}.foot{overflow-wrap:anywhere}</style></head>');
 if(html!==previewHtml){frame.srcdoc=html;previewHtml=html}
}
function schedulePreview(){if(!$('#sheet-preview').open)return;clearTimeout(previewTimer);previewTimer=setTimeout(updateSheetPreview,180)}
$('#sheet-preview').addEventListener('toggle',updateSheetPreview);
document.addEventListener('input',schedulePreview,true);document.addEventListener('change',schedulePreview,true);document.addEventListener('click',schedulePreview,true);
new MutationObserver(schedulePreview).observe(body,{childList:true,subtree:true,characterData:true});

/* ===== 曼米嵌入：接收教材頁傳來的生詞、存回本課教材、回報高度給外層頁面 ===== */
function mmLoadWords(d){
 const list=(d.words||[]).filter(x=>x&&x.w);if(!list.length)return;
 const title=d.title?toScript(String(d.title)):'';
 const hasRows=rows().some(r=>val(r,'word'));
 setMode('list');
 $('#word-input').value=list.map(x=>[x.w,x.p||'',x.m||''].map(v=>String(v).replace(/[\t\r\n]+/g,' ').trim()).join('\t')).join('\n');
 if(hasRows){$('#list-message').textContent='這是你上次編輯的生詞表。教材裡的 '+list.length+' 個生詞已經放在「貼上生詞」，要重新整理請到那裡按「整理成生詞表」。';showStep('step-list');scheduleSave();return}
 if(title)$('#doc-title').value=title;
 parseList();
}
/* 把整理好的拼音／注音、詞性、英文翻譯、TOCFL 等級、例句交給平台，存回這一課的教材（平台只補空白欄位、加新生詞） */
function mmLessonRows(){
 return exportRows().map(r=>{
  let lv='';if(pref.standard==='tocfl'){const t=Lang.toTrad(val(r,'level'));lv=t==='未收錄'?'未收錄':(t.replace(/^依詞性分級：/,'').split(/[；（]/)[0].split(' · ')[0]||'').trim()}
  return {w:val(r,'word'),ph:val(r,'pinyin'),pos:pref.posLanguage==='zh'?val(r,'pos'):'',m:val(r,'meaning'),lv,s:withSent()?val(r,'sentence'):''};
 });
}
(function mmEmbed(){
 const inFrame=window.parent!==window,save=$('#mm-save-lesson');
 if(save&&MMV.lesson&&inFrame){save.hidden=false;save.addEventListener('click',()=>{
  const list=mmLessonRows();if(!list.length){$('#list-message').textContent='生詞表還是空的。';return}
  save.disabled=true;$('#list-message').textContent='存回本課教材中…';
  try{window.parent.postMessage({mmVocab:'save',lesson:MMV.lesson,phonetic:pref.phonetic,rows:list},'*')}catch{save.disabled=false}
 })}
 let pending=null;
 window.addEventListener('message',e=>{const d=e.data;if(!d||!d.mmVocab)return;
  if(d.mmVocab==='load'){if(Lang.isReady())mmLoadWords(d);else pending=d}
  if(d.mmVocab==='saved'&&save){save.disabled=false;$('#list-message').textContent=d.text||'已存回本課教材。'}
 });
 const wait=setInterval(()=>{if(!Lang.isReady())return;clearInterval(wait);if(pending){mmLoadWords(pending);pending=null}if(inFrame)try{window.parent.postMessage({mmVocab:'ready'},'*')}catch{}},60);
 if(inFrame&&window.ResizeObserver){let last=0;new ResizeObserver(()=>{const h=Math.ceil(document.documentElement.scrollHeight);if(Math.abs(h-last)>4){last=h;try{window.parent.postMessage({mmVocab:'height',h},'*')}catch{}}}).observe(document.body)}
})();
