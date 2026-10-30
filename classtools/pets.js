/* 寵物遊戲：學生回答問題、交作業、交考卷賺「點數」，用點數買飼料餵寵物、買衣服／道具／更強的寵物，或兌換老師設定的獎勵。
   資料在 teacherPlatform/{老師}/petGame/{學期}/ 底下：cfg/{班級}（這個班的設定）、s/{學生}（整個學期累積的點數與寵物，跨班共用）、redeem（兌換紀錄）。 */
(function(){
  "use strict";
  var BASIC = ["🐶", "🐱", "🐰", "🐹", "🐥", "🦊", "🐼", "🐸", "🐧", "🐻", "🐮", "🐷"];
  var PREMIUM = [{ e: "🦁", n: "獅子", p: 150, pw: 1.5 }, { e: "🐯", n: "老虎", p: 150, pw: 1.5 }, { e: "🐺", n: "野狼", p: 180, pw: 1.5 }, { e: "🦅", n: "老鷹", p: 180, pw: 1.5 }, { e: "🦖", n: "暴龍", p: 250, pw: 1.8 }, { e: "🦄", n: "獨角獸", p: 300, pw: 2 }, { e: "🐲", n: "小龍", p: 350, pw: 2 }, { e: "🐉", n: "神龍", p: 500, pw: 2.5 }];
  var SLOTS = { head: "頭", face: "臉", neck: "脖子", side: "身邊" };
  var CLOTHES = [{ id: "bow", s: "head", e: "🎀", n: "蝴蝶結", p: 15 }, { id: "cap", s: "head", e: "🧢", n: "棒球帽", p: 20 }, { id: "straw", s: "head", e: "👒", n: "草帽", p: 20 }, { id: "grad", s: "head", e: "🎓", n: "畢業帽", p: 30 }, { id: "top", s: "head", e: "🎩", n: "紳士帽", p: 30 }, { id: "helm", s: "head", e: "🪖", n: "頭盔", p: 35 }, { id: "crown", s: "head", e: "👑", n: "皇冠", p: 90 },
    { id: "glass", s: "face", e: "👓", n: "眼鏡", p: 20 }, { id: "shade", s: "face", e: "🕶️", n: "墨鏡", p: 25 }, { id: "mask", s: "face", e: "🥸", n: "偽裝眼鏡", p: 20 },
    { id: "scarf", s: "neck", e: "🧣", n: "圍巾", p: 20 }, { id: "chain", s: "neck", e: "📿", n: "項鍊", p: 30 }, { id: "medal", s: "neck", e: "🏅", n: "金牌", p: 55 },
    { id: "balloon", s: "side", e: "🎈", n: "氣球", p: 15 }, { id: "bag", s: "side", e: "🎒", n: "背包", p: 25 }, { id: "wand", s: "side", e: "🪄", n: "魔杖", p: 45 }];
  var ITEMS = [{ id: "potion", e: "🧪", n: "成長藥水", p: 30, d: "馬上讓目前的寵物 +40 經驗" }, { id: "dbl", e: "🎟️", n: "經驗加倍券", p: 40, d: "接下來 5 次餵食經驗變 2 倍" }, { id: "house", e: "🏠", n: "豪華小屋", p: 80, d: "永久：寵物變餓的速度減半", once: true }];
  var SCENES = [{ id: "grass", e: "🌿", n: "草地（預設）", p: 0, bg: "radial-gradient(ellipse at 50% 88%,#DFF2D0 0 36%,transparent 37%),linear-gradient(180deg,#DDF1FF,#F6FBFF)" }, { id: "room", e: "🏠", n: "小房間", p: 30, bg: "linear-gradient(180deg,#FFE4C4,#E3AA6E)" }, { id: "beach", e: "🏖️", n: "海灘", p: 30, bg: "radial-gradient(ellipse at 50% 92%,#F7E2A8 0 40%,transparent 41%),linear-gradient(180deg,#9ADBF7,#E3F6FF 70%,#4BB7E8 70%)" }, { id: "garden", e: "🌸", n: "花園", p: 30, bg: "radial-gradient(ellipse at 50% 88%,#BFE8A6 0 38%,transparent 39%),linear-gradient(180deg,#FFE3EE,#FFF7FA)" }, { id: "space", e: "🌌", n: "太空", p: 40, bg: "radial-gradient(circle at 20% 25%,#fff 0 1px,transparent 2px),radial-gradient(circle at 75% 35%,#fff 0 1.5px,transparent 2px),radial-gradient(circle at 60% 15%,#fff 0 1px,transparent 2px),linear-gradient(180deg,#14123A,#3B2A78)" }, { id: "castle", e: "🏰", n: "城堡", p: 60, bg: "radial-gradient(ellipse at 50% 90%,#CBB7E8 0 38%,transparent 39%),linear-gradient(180deg,#FDE9C9,#F6D6F0)" }];
  var STAGES = [{ xp: 0, name: "寶寶", sc: 0.75, acc: "" }, { xp: 40, name: "少年", sc: 0.95, acc: "" }, { xp: 120, name: "成年", sc: 1.15, acc: "✨" }, { xp: 300, name: "傳說", sc: 1.35, acc: "👑" }];
  var FOODS = [{ e: "🍪", n: "小餅乾", p: 3, h: 8, x: 2 }, { e: "🍎", n: "蘋果", p: 5, h: 15, x: 5 }, { e: "🍖", n: "肉排", p: 10, h: 35, x: 12 }, { e: "🍰", n: "蛋糕", p: 20, h: 70, x: 30 }, { e: "🍱", n: "大餐", p: 40, h: 100, x: 70 }];
  var DEF = { on: false, inClass: false, daily: 2, style: "outline", hw: 10, exam: 10, examBonus: 1, choice: 2, rate: 4, shop: true, rewards: [], prices: {}, off: {} };
  var NEWPET = 40;   // 再領養一隻普通寵物的價格
  var P = window.PET = { BASIC: BASIC, PREMIUM: PREMIUM, CLOTHES: CLOTHES, FOODS: FOODS, STAGES: STAGES, DEF: DEF };
  function I(n){ return P.UI && P.UI.ti ? P.UI.ti(n) : ""; }
  function ctx(){ return window.PET_ctx || {}; }
  function esc(s){ return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function h(tag, attrs, kids){ var e = document.createElement(tag); if(attrs) Object.keys(attrs).forEach(function(k){ var v = attrs[k]; if(v == null || v === false) return; if(k === "class") e.className = v; else if(k === "style") e.style.cssText = v; else if(k === "text") e.textContent = v; else if(k === "html") e.innerHTML = v; else if(k.slice(0, 2) === "on") e[k] = v; else e.setAttribute(k, v); }); (kids || []).forEach(function(c){ if(c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
  var ac = null; function beep(f, d){ try{ if(!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; o.type = "triangle"; o.connect(g); g.connect(ac.destination); var t = ac.currentTime; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + (d || 0.2)); o.start(t); o.stop(t + (d || 0.2) + 0.02); }catch(e){} }

  // ---------- 共用計算 ----------
  P.hungerNow = function(pet, rate, house){ if(!pet) return 0; var hrs = (Date.now() - (pet.at || Date.now())) / 3600000; return Math.max(0, Math.min(100, Math.round((pet.h == null ? 60 : pet.h) - hrs * (rate || DEF.rate) * (house ? 0.5 : 1)))); };
  P.loveNow = function(pet){ if(!pet) return 0; var hrs = (Date.now() - (pet.lt || Date.now())) / 3600000; return Math.max(0, Math.min(100, Math.round((pet.l == null ? 40 : pet.l) - hrs * 2))); };
  P.stageOf = function(xp){ var s = 0; STAGES.forEach(function(g, i){ if((xp || 0) >= g.xp) s = i; }); return s; };
  P.moodOf = function(hg){ return hg >= 70 ? ["😋", "吃得好飽！"] : hg >= 40 ? ["🙂", "還不錯"] : hg >= 15 ? ["🥺", "肚子餓了…"] : ["😭", "好餓好餓！"]; };
  P.actPet = function(r){ return r && r.pets && r.act && r.pets[r.act] ? r.pets[r.act] : null; };
  P.bestPet = function(r){ var b = null; Object.keys((r && r.pets) || {}).forEach(function(k){ var p = r.pets[k]; if(!b || (p.xp || 0) > (b.xp || 0)) b = p; }); return b; };
  P.power = function(r){ var p = P.bestPet(r); return p ? (p.xp || 0) : 0; };
  function cm(c){ return CLOTHES.filter(function(x){ return x.id === c; })[0]; }
  function root(){ var c = ctx(), s = c.student && c.student(); if(s) return { path: "teacherPlatform/" + s.idx.t + "/petGame/" + s.idx.tm, cls: s.idx.c }; var t = c.teacherSel && c.teacherSel(); return t ? { path: "teacherPlatform/" + t.t + "/petGame/" + t.tm, cls: t.c } : null; }
  function key(n){ return ctx().key ? ctx().key(n) : String(n).replace(/[.#$\[\]\/]/g, "_"); }
  P.cfg = Object.assign({}, DEF);
  // 商店價格：老師可以每個品項自己訂價、也可以下架（cfg.prices / cfg.off）
  P.price = function(k, def){ var v = P.cfg.prices && P.cfg.prices[k]; return (typeof v === "number" && v >= 0) ? v : def; };
  P.hidden = function(k){ return !!(P.cfg.off && P.cfg.off[k]); };
  P.catalog = function(){
    var a = []; FOODS.forEach(function(f, i){ a.push({ k: "f" + i, g: "飼料", e: f.e, n: f.n, d: f.p }); });
    PREMIUM.forEach(function(x, i){ a.push({ k: "pm" + i, g: "更強的寵物", e: x.e, n: x.n, d: x.p }); }); a.push({ k: "new", g: "更強的寵物", e: "🥚", n: "再領養一隻普通寵物", d: NEWPET });
    ITEMS.forEach(function(x){ a.push({ k: "it_" + x.id, g: "道具", e: x.e, n: x.n, d: x.p }); }); CLOTHES.forEach(function(x){ a.push({ k: "cl_" + x.id, g: "衣服", e: x.e, n: x.n, d: x.p }); });
    (window.PETSCENE ? window.PETSCENE.FURN : []).forEach(function(x){ a.push({ k: "fu_" + x.id, g: "家具", e: "", n: x.n, d: x.p }); }); SCENES.forEach(function(x){ if(x.p > 0) a.push({ k: "sc_" + x.id, g: "場景", e: x.e, n: x.n, d: x.p }); }); return a;
  };
  function petHtml(pet, eq, sizePx, extra){
    var sg = STAGES[P.stageOf(pet.xp)], px = Math.round(sizePx * sg.sc), s = '<div class="pet-pet' + (extra || "") + '" style="font-size:' + px + 'px">' + pet.sp;
    if(sg.acc) s += '<span class="pa pa-top">' + sg.acc + '</span>';
    Object.keys(eq || {}).forEach(function(sl){ var it = cm(eq[sl]); if(it) s += '<span class="pa pa-' + sl + '">' + it.e + '</span>'; });
    return s + '</div>';
  }

  // ---------- 學生端 ----------
  var me = null, btn = null, started = false;
  P.todayKey = function(){ var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() < 9 ? "0" : "") + (d.getMonth() + 1) + "-" + (d.getDate() < 10 ? "0" : "") + d.getDate(); };
  P.qOf = function(cur){ var q = cur && cur.q; return q && q.d === P.todayKey() ? Object.assign({}, q) : { d: P.todayKey() }; };
  P.bumpQ = function(cur, k, n){ var q = P.qOf(cur); q[k] = (q[k] || 0) + (n || 1); return q; };
  P.initStudent = function(){
    var c = ctx(), s = c.student && c.student(); if(!s || started) return; started = true;
    var r = root(), k = key(s.name);
    c.onValue(r.path + "/cfg/" + r.cls, function(v){ P.cfg = Object.assign({}, DEF, v || {}); paintBtn(); if(P.UI) P.UI.refresh(); });
    c.onValue(r.path + "/s/" + k, function(v){ me = v || { name: s.name, pts: 0 }; paintBtn(); if(P.UI) P.UI.refresh(); });
    setInterval(paintBtn, 60000);
  };
  function hungerOf(){ var p = P.actPet(me); return p ? P.hungerNow(p, P.cfg.rate, me.home) : 0; }
  // 上課中（老師開著「開始上課」）預設不開放寵物商店，讓學生專心上課；老師可以在寵物視窗打開「上課中也開放」。測試教室不受限，方便老師測試。
  function blocked(){ var c = ctx(); return !!(c.liveBlocked && c.liveBlocked() && !P.cfg.inClass); }
  P.refresh = function(){ paintBtn(); };
  function paintBtn(){
    if(!P.cfg.on || blocked()){ if(btn){ btn.remove(); btn = null; } closePanel(); return; }
    if(!btn){ btn = h("button", { id: "pet-fab", type: "button", onclick: openPanel }); document.body.appendChild(btn); }
    var pet = P.actPet(me), hg = hungerOf();
    var art = pet && window.PETART ? window.PETART.svg({ sp: pet.sp, style: P.cfg.style, mood: hg < 30 ? "sad" : "happy", stage: P.stageOf(pet.xp), eq: pet.eq, anim: false }) : "🥚";
    btn.innerHTML = '<span class="pf-e">' + art + '</span><span class="pf-p">⭐ ' + ((me && me.pts) || 0) + '</span>' + (pet && hg < 30 ? '<i class="pf-hungry">🍽️</i>' : "");
    btn.title = "我的寵物（點數 " + ((me && me.pts) || 0) + "）";
  }
  async function mutate(fn){
    var c = ctx(), s = c.student(), r = root(), path = r.path + "/s/" + key(s.name), cur = (await c.get(path)) || { name: s.name, pts: 0 };
    var patch = fn(cur); if(!patch) return null; patch.name = s.name; patch.c = r.cls; await c.update(path, patch); return Object.assign({}, cur, patch);
  }
  P.earn = async function(n, why, k){
    var c = ctx(), s = c.student && c.student(); if(!s || !P.cfg.on || !n || n <= 0) return;
    var done = await mutate(function(cur){ var got = cur.got || {}; if(k && got[k]) return null; if(k) got[k] = 1; var ev = (cur.ev || []).slice(-7); ev.push({ t: Date.now(), n: n, w: why }); return { pts: (cur.pts || 0) + n, earned: (cur.earned || 0) + n, got: got, ev: ev, q: P.bumpQ(cur, "earn", n) }; });
    if(done){ c.toast("🎉 獲得 " + n + " 點！（" + why + "）"); beep(660, 0.12); setTimeout(function(){ beep(880, 0.15); }, 120); }
  };
  P.onHwItem = function(id){ P.earn(P.cfg.hw, "繳交作業", "hw:" + id); };
  P.onExam = function(item, pct){ var n = (P.cfg.exam || 0) + (pct != null ? Math.floor(pct / 10) * (P.cfg.examBonus || 0) : 0); P.earn(n, "交考卷", "exam:" + item); };
  P.onChoice = function(room, qid){ P.earn(P.cfg.choice, "答對選擇題", "c:" + room + ":" + qid); };
  window.addEventListener("message", function(e){ var d = e.data; if(!d || !d.mm) return; if(d.mm === "examSubmitted") P.onExam(d.item, d.pct); else if(d.mm === "petEarn" && d.kind === "choice") P.onChoice(d.room, d.id); });

  // 學生端的完整遊戲畫面在 pet-ui.js（P.UI）；這裡只留按鈕與共用資料
  function openPanel(){ if(P.UI) P.UI.open(); }
  function closePanel(){ if(P.UI) P.UI.close(); }
  P.me = function(){ return me; };
  P.mutate = mutate; P.root = root; P.key = key; P.beepOld = beep; P.NEWPET = NEWPET; P.ITEMS = ITEMS; P.SCENES = SCENES; P.SLOTS = SLOTS; P.esc = esc; P.h = h; P.cm = cm;
  P.ctx = ctx; P.isBlocked = function(){ return blocked(); };
  var cssFab = "#pet-fab{position:fixed;left:14px;bottom:14px;z-index:9400;display:flex;align-items:center;gap:6px;padding:4px 14px 4px 6px;border-radius:99px;border:2px solid var(--seal,#C0623A);background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer;font-size:16px;font-weight:700;color:var(--ink,#2a2018);} #pet-fab .pf-e{width:40px;height:42px;display:block;animation:petIdle 2.2s ease-in-out infinite;} .pf-hungry{position:absolute;top:-8px;right:-6px;font-style:normal;font-size:20px;animation:petIdle 1s infinite;} @keyframes petIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}";
  var st = document.createElement("style"); st.textContent = cssFab; document.head.appendChild(st);

  // ---------- 老師端：工具箱裡的「寵物遊戲」 ----------
  function addTool(){
    if(!window.CT) return; var CT = window.CT;
    CT.add({ id: "pets", cat: "fun", icon: "🐾", name: "寵物遊戲", w: 700, h: 680, build: function(bd, win){
      var c = ctx(), sel = c.teacherSel && c.teacherSel(); if(!sel){ bd.textContent = "請先進到一個班級。"; return; }
      var r = root(), cfg = Object.assign({}, DEF), data = {}, redeem = {}, names = [], unsubs = [], box = h("div"), view = "cls";
      bd.appendChild(box);
      unsubs.push(c.onValue(r.path + "/cfg/" + r.cls, function(v){ cfg = Object.assign({}, DEF, v || {}); draw(); }));
      unsubs.push(c.onValue(r.path + "/s", function(v){ data = v || {}; draw(); }));
      unsubs.push(c.onValue(r.path + "/redeem", function(v){ redeem = v || {}; draw(); }));
      c.roster().then(function(rr){ names = rr.map(String).filter(Boolean); draw(); });
      win.onClose(function(){ unsubs.forEach(function(u){ try{ u(); }catch(e){} }); });
      function setCfg(p){ c.update(r.path + "/cfg/" + r.cls, p); }
      async function give(name, n){ var path = r.path + "/s/" + key(name), cur = (await c.get(path)) || { name: name, pts: 0 }; var ev = (cur.ev || []).slice(-7); if(n > 0) ev.push({ t: Date.now(), n: n, w: "老師獎勵" }); await c.update(path, { name: name, c: r.cls, pts: Math.max(0, (cur.pts || 0) + n), earned: (cur.earned || 0) + Math.max(0, n), ev: ev }); }
      function draw(){
        var ae = document.activeElement; if(box.contains(ae) && ae.tagName === "INPUT" && (ae.type === "number" || ae.type === "text")) return;
        box.innerHTML = "";
        box.appendChild(h("label", { style: "display:flex;align-items:center;gap:.5em;font-weight:800;font-size:1.1em;margin-bottom:6px;" }, [h("input", { type: "checkbox", checked: cfg.on ? "checked" : null, onchange: function(){ setCfg({ on: this.checked }); } }), "啟用這個班的寵物遊戲（學生畫面左下角會出現寵物按鈕；點數和寵物整個學期累積、跨班共用）"]));
        if(!cfg.on){ box.appendChild(h("div", { class: "ct-muted", text: "打開之後，學生登入班級頁面左下角會出現寵物按鈕。" })); return; }
        var pend = Object.keys(redeem).filter(function(k){ return !redeem[k].done && redeem[k].c === r.cls; });
        var tabs = h("div", { class: "ct-row" }); [["cls", "全班點數", "coin"], ["rank", "排行榜", "rank"], ["rule", "規則與獎勵", "set"], ["rd", "兌換紀錄" + (pend.length ? "（" + pend.length + " 待發放）" : ""), "gift"]].forEach(function(t){ tabs.appendChild(h("button", { class: "ct-btn" + (view === t[0] ? " on" : ""), html: I(t[2]) + t[1], onclick: function(){ view = t[0]; draw(); } })); }); box.appendChild(tabs);
        if(view === "rule") rules(); else if(view === "rd") redeems(); else roster(view === "rank");
      }
      function rules(){
        box.appendChild(h("label", { style: "display:flex;align-items:center;gap:.5em;margin:6px 0;" }, [h("input", { type: "checkbox", checked: cfg.inClass ? "checked" : null, onchange: function(){ setCfg({ inClass: this.checked }); } }), "上課中（按了「開始上課」）也開放學生玩寵物　", h("span", { class: "ct-muted", text: "預設關閉：上課時學生的寵物按鈕會先收起來，下課後再出現，不會分心買東西" })]));
        var g = h("div", { style: "display:grid;grid-template-columns:repeat(auto-fill,minmax(11em,1fr));gap:6px;margin:6px 0;" });
        [["hw", "繳交作業 +"], ["exam", "交考卷 +"], ["examBonus", "考卷每 10 分再 +"], ["choice", "答對選擇題 +"]].forEach(function(x){ g.appendChild(h("label", { class: "ct-muted", style: "display:flex;align-items:center;gap:.3em;" }, [x[1], h("input", { class: "ct-inp", type: "number", min: "0", max: "100", value: String(cfg[x[0]]), style: "width:4em;", onchange: function(){ var p = {}; p[x[0]] = Math.max(0, Number(this.value) || 0); setCfg(p); } }), "點"])); });
        g.appendChild(h("label", { class: "ct-muted", style: "display:flex;align-items:center;gap:.3em;" }, ["每日簽到基本點數", h("input", { class: "ct-inp", type: "number", min: "0", max: "20", value: String(cfg.daily == null ? DEF.daily : cfg.daily), style: "width:4em;", onchange: function(){ setCfg({ daily: Math.max(0, Number(this.value) || 0) }); } }), "（0＝關閉簽到）"]));
        var sty = h("select", { class: "ct-inp", onchange: function(){ setCfg({ style: this.value }); } }, (window.PETART ? window.PETART.STYLES : [{ id: "outline", name: "線條填色" }]).map(function(x){ return h("option", { value: x.id, text: x.name }); })); sty.value = window.PETART ? window.PETART.norm(cfg.style) : "outline";
        g.appendChild(h("label", { class: "ct-muted", style: "display:flex;align-items:center;gap:.3em;" }, ["學生預設外觀", sty, "（學生也可以自己換）"]));
        var rate = h("select", { class: "ct-inp", onchange: function(){ setCfg({ rate: Number(this.value) }); } }, [h("option", { value: "2", text: "慢（約 2 天餓）" }), h("option", { value: "4", text: "普通（約 1 天餓）" }), h("option", { value: "8", text: "快（約半天餓）" })]); rate.value = String(cfg.rate);
        g.appendChild(h("label", { class: "ct-muted", style: "display:flex;align-items:center;gap:.3em;" }, ["寵物變餓的速度", rate])); box.appendChild(g);
        box.appendChild(h("div", { style: "font-weight:800;margin:12px 0 4px;", html: I("gift") + "老師的獎勵（學生用點數兌換，會出現在他們商店最上面）" }));
        var list = (cfg.rewards || []).filter(Boolean), rl = h("div"); list.forEach(function(rw, i){ rl.appendChild(h("div", { class: "ct-row" }, [h("span", { html: I("gift") }), h("b", { text: rw.n }), h("span", { class: "ct-muted", html: I("star") + rw.p }), h("button", { class: "ct-btn", text: "✕", onclick: function(){ list.splice(i, 1); setCfg({ rewards: list }); } })])); }); box.appendChild(rl);
        var nn = h("input", { class: "ct-inp", placeholder: "獎勵名稱（例如：免寫一次作業、選座位）", style: "flex:1;min-width:10em;" }), np = h("input", { class: "ct-inp", type: "number", min: "1", value: "50", style: "width:5em;" });
        box.appendChild(h("div", { class: "ct-row" }, [nn, np, h("button", { class: "ct-btn pri", text: "＋ 新增獎勵", onclick: function(){ if(!nn.value.trim()) return; list.push({ n: nn.value.trim(), p: Math.max(1, Number(np.value) || 1) }); setCfg({ rewards: list }); } })]));
        box.appendChild(h("div", { style: "font-weight:800;margin:14px 0 4px;", html: I("shop") + "商店價格（每一項都可以自己訂價；取消勾選＝下架，學生商店就看不到）" }));
        var bar = h("div", { class: "ct-row" }, [h("span", { class: "ct-muted", text: "全部價格 ×" }), h("button", { class: "ct-btn", text: "0.5", onclick: function(){ scaleAll(0.5); } }), h("button", { class: "ct-btn", text: "0.8", onclick: function(){ scaleAll(0.8); } }), h("button", { class: "ct-btn", text: "1.2", onclick: function(){ scaleAll(1.2); } }), h("button", { class: "ct-btn", text: "2", onclick: function(){ scaleAll(2); } }), h("button", { class: "ct-btn", text: "↺ 還原預設價格", onclick: function(){ if(confirm("全部價格還原成預設、並重新上架？")) setCfg({ prices: null, off: null }); } })]); box.appendChild(bar);
        var cat = P.catalog(), grp = ""; var pt = h("div", { style: "display:grid;grid-template-columns:repeat(auto-fill,minmax(14em,1fr));gap:4px 10px;" });
        cat.forEach(function(it){
          if(it.g !== grp){ grp = it.g; pt.appendChild(h("div", { style: "grid-column:1/-1;font-weight:700;margin-top:6px;", text: grp })); }
          var on = !P.hidden(it.k), cur = P.price(it.k, it.d);
          pt.appendChild(h("div", { style: "display:flex;align-items:center;gap:.4em;opacity:" + (on ? 1 : .45) + ";" }, [h("input", { type: "checkbox", checked: on ? "checked" : null, title: "上架", disabled: it.k.charAt(0) === "f" && it.k.length <= 2 ? "disabled" : null, onchange: function(){ var o = Object.assign({}, cfg.off || {}); if(this.checked) delete o[it.k]; else o[it.k] = 1; setCfg({ off: Object.keys(o).length ? o : null }); } }), h("span", { style: "display:inline-block;width:30px;height:30px;flex:none;", html: P.UI && P.UI.catIc ? P.UI.catIc(it) : "" }), h("span", { style: "flex:1;font-size:.9em;", text: it.n }), h("input", { class: "ct-inp", type: "number", min: "0", max: "9999", value: String(cur), style: "width:4.5em;" + (cur !== it.d ? "border-color:#C0623A;" : ""), onchange: function(){ var o = Object.assign({}, cfg.prices || {}), v = Math.max(0, Math.round(Number(this.value) || 0)); if(v === it.d) delete o[it.k]; else o[it.k] = v; setCfg({ prices: Object.keys(o).length ? o : null }); } })]));
        });
        box.appendChild(pt);
        function scaleAll(m){ var o = {}; cat.forEach(function(it){ o[it.k] = Math.max(1, Math.round(P.price(it.k, it.d) * m)); }); setCfg({ prices: o }); }
        box.appendChild(h("div", { class: "ct-muted", style: "margin-top:8px;", text: "學生賺點數：交作業、交線上考卷（可依分數加成）、上課選擇題答對，也可以在「全班點數」直接加點。商店有衣服、場景、道具、更強的寵物；你設定的獎勵兌換後會出現在「兌換紀錄」。" }));
      }
      function redeems(){
        var ks = Object.keys(redeem).filter(function(k){ return redeem[k].c === r.cls; }).sort(function(a, b){ return (redeem[b].at || 0) - (redeem[a].at || 0); });
        if(!ks.length) box.appendChild(h("div", { class: "ct-muted", style: "padding:1em 0;", text: "還沒有人兌換。" }));
        ks.forEach(function(k){ var x = redeem[k]; box.appendChild(h("div", { class: "ct-row", style: "padding:.3em .6em;border-radius:10px;background:" + (x.done ? "#eef6ea" : "#FFF3D6") + ";" }, [h("b", { text: x.name }), h("span", { text: x.item }), h("span", { class: "ct-muted", style: "flex:1;", html: I("star") + x.p + "・" + new Date(x.at).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) }), x.done ? h("span", { class: "ct-muted", text: "✓ 已發放" }) : h("button", { class: "ct-btn pri", text: "已發放", onclick: function(){ c.update(r.path + "/redeem/" + k, { done: true }); } })])); });
      }
      function roster(rank){
        if(!rank){
          var all = h("input", { class: "ct-inp", type: "number", min: "1", value: "5", style: "width:4em;" });
          box.appendChild(h("div", { class: "ct-row" }, [h("span", { text: "全班一起加" }), all, h("button", { class: "ct-btn pri", text: "給全班", onclick: function(){ var n = Math.max(1, Number(all.value) || 1); if(!confirm("全班每個人都加 " + n + " 點？")) return; names.forEach(function(nm){ give(nm, n); }); } })]));
        }
        var rows = names.map(function(nm){ return { nm: nm, r: data[key(nm)] || {} }; });
        if(rank) rows.sort(function(a, b){ return P.power(b.r) - P.power(a.r) || (b.r.earned || 0) - (a.r.earned || 0); });
        var tbl = h("table", { style: "width:100%;border-collapse:collapse;font-size:.95em;" }); tbl.appendChild(h("tr", {}, [rank ? "名次" : "", "學生", "寵物", "飽足", "經驗", "累積", "點數"].concat(rank ? [] : ["加點"]).map(function(t){ return h("th", { style: "text-align:left;padding:4px;border-bottom:2px solid #d9c9b5;", text: t }); })));
        rows.forEach(function(o, i){
          var pet = rank ? P.bestPet(o.r) : P.actPet(o.r), hg = pet ? P.hungerNow(pet, cfg.rate, o.r.home) : null, tr = h("tr");
          tr.appendChild(h("td", { style: "padding:4px;", text: rank ? String(i + 1) : "" })); tr.appendChild(h("td", { style: "padding:4px;font-weight:700;", text: o.nm }));
          var pc = h("td", { style: "padding:4px;white-space:nowrap;" }); if(pet){ var th = h("span", { style: "display:inline-block;width:34px;height:36px;vertical-align:middle;margin-right:4px;", html: window.PETART ? window.PETART.svg({ sp: pet.sp, style: "outline", mood: "happy", stage: P.stageOf(pet.xp), eq: pet.eq, anim: false }) : pet.sp }); pc.appendChild(th); pc.appendChild(document.createTextNode(pet.nm + "（" + STAGES[P.stageOf(pet.xp)].name + "）")); } else pc.textContent = "—"; tr.appendChild(pc);
          tr.appendChild(h("td", { style: "padding:4px;color:" + (hg != null && hg < 30 ? "#B23B32" : "inherit") + ";", text: hg == null ? "" : hg + (hg < 30 ? "（餓了）" : "") })); tr.appendChild(h("td", { style: "padding:4px;", text: pet ? String(pet.xp || 0) : "" }));
          tr.appendChild(h("td", { style: "padding:4px;", text: String(o.r.earned || 0) })); tr.appendChild(h("td", { style: "padding:4px;font-weight:800;color:#C0623A;", text: String(o.r.pts || 0) }));
          if(!rank){ var td = h("td", { style: "padding:4px;white-space:nowrap;" }); [-1, 1, 5, 10].forEach(function(n){ td.appendChild(h("button", { class: "ct-btn", style: "padding:.1em .5em;margin-right:3px;", text: (n > 0 ? "+" : "") + n, onclick: function(){ give(o.nm, n); } })); }); tr.appendChild(td); }
          tbl.appendChild(tr);
        });
        if(!names.length) box.appendChild(h("div", { class: "ct-muted", text: "這個班還沒有學生名單，請先到班級的「學生」分頁加入名單。" })); else box.appendChild(tbl);
      }
    }});
  }
  if(window.CT) addTool(); else window.addEventListener("load", addTool);
})();
