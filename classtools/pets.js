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
  var SCENES = [{ id: "grass", e: "🌿", n: "草地（預設）", p: 0, bg: "radial-gradient(ellipse at 50% 88%,#DFF2D0 0 36%,transparent 37%),linear-gradient(180deg,#DDF1FF,#F6FBFF)" }, { id: "beach", e: "🏖️", n: "海灘", p: 30, bg: "radial-gradient(ellipse at 50% 92%,#F7E2A8 0 40%,transparent 41%),linear-gradient(180deg,#9ADBF7,#E3F6FF 70%,#4BB7E8 70%)" }, { id: "garden", e: "🌸", n: "花園", p: 30, bg: "radial-gradient(ellipse at 50% 88%,#BFE8A6 0 38%,transparent 39%),linear-gradient(180deg,#FFE3EE,#FFF7FA)" }, { id: "space", e: "🌌", n: "太空", p: 40, bg: "radial-gradient(circle at 20% 25%,#fff 0 1px,transparent 2px),radial-gradient(circle at 75% 35%,#fff 0 1.5px,transparent 2px),radial-gradient(circle at 60% 15%,#fff 0 1px,transparent 2px),linear-gradient(180deg,#14123A,#3B2A78)" }, { id: "castle", e: "🏰", n: "城堡", p: 60, bg: "radial-gradient(ellipse at 50% 90%,#CBB7E8 0 38%,transparent 39%),linear-gradient(180deg,#FDE9C9,#F6D6F0)" }];
  var STAGES = [{ xp: 0, name: "寶寶", sc: 0.75, acc: "" }, { xp: 40, name: "少年", sc: 0.95, acc: "" }, { xp: 120, name: "成年", sc: 1.15, acc: "✨" }, { xp: 300, name: "傳說", sc: 1.35, acc: "👑" }];
  var FOODS = [{ e: "🍪", n: "小餅乾", p: 3, h: 8, x: 2 }, { e: "🍎", n: "蘋果", p: 5, h: 15, x: 5 }, { e: "🍖", n: "肉排", p: 10, h: 35, x: 12 }, { e: "🍰", n: "蛋糕", p: 20, h: 70, x: 30 }, { e: "🍱", n: "大餐", p: 40, h: 100, x: 70 }];
  var DEF = { on: false, hw: 10, exam: 10, examBonus: 1, choice: 2, rate: 4, shop: true, rewards: [], prices: {}, off: {} };
  var NEWPET = 40;   // 再領養一隻普通寵物的價格
  var P = window.PET = { BASIC: BASIC, PREMIUM: PREMIUM, CLOTHES: CLOTHES, FOODS: FOODS, STAGES: STAGES, DEF: DEF };
  function ctx(){ return window.PET_ctx || {}; }
  function esc(s){ return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function h(tag, attrs, kids){ var e = document.createElement(tag); if(attrs) Object.keys(attrs).forEach(function(k){ var v = attrs[k]; if(v == null || v === false) return; if(k === "class") e.className = v; else if(k === "style") e.style.cssText = v; else if(k === "text") e.textContent = v; else if(k === "html") e.innerHTML = v; else if(k.slice(0, 2) === "on") e[k] = v; else e.setAttribute(k, v); }); (kids || []).forEach(function(c){ if(c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
  var ac = null; function beep(f, d){ try{ if(!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; o.type = "triangle"; o.connect(g); g.connect(ac.destination); var t = ac.currentTime; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + (d || 0.2)); o.start(t); o.stop(t + (d || 0.2) + 0.02); }catch(e){} }

  // ---------- 共用計算 ----------
  P.hungerNow = function(pet, rate, house){ if(!pet) return 0; var hrs = (Date.now() - (pet.at || Date.now())) / 3600000; return Math.max(0, Math.min(100, Math.round((pet.h == null ? 60 : pet.h) - hrs * (rate || DEF.rate) * (house ? 0.5 : 1)))); };
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
    var a = []; FOODS.forEach(function(f, i){ a.push({ k: "f" + i, g: "🍖 飼料", e: f.e, n: f.n, d: f.p }); });
    PREMIUM.forEach(function(x, i){ a.push({ k: "pm" + i, g: "🐾 更強的寵物", e: x.e, n: x.n, d: x.p }); }); a.push({ k: "new", g: "🐾 更強的寵物", e: "🥚", n: "再領養一隻普通寵物", d: NEWPET });
    ITEMS.forEach(function(x){ a.push({ k: "it_" + x.id, g: "🧪 道具", e: x.e, n: x.n, d: x.p }); }); CLOTHES.forEach(function(x){ a.push({ k: "cl_" + x.id, g: "👔 衣服", e: x.e, n: x.n, d: x.p }); });
    SCENES.forEach(function(x){ if(x.p > 0) a.push({ k: "sc_" + x.id, g: "🖼️ 場景", e: x.e, n: x.n, d: x.p }); }); return a;
  };
  function petHtml(pet, eq, sizePx, extra){
    var sg = STAGES[P.stageOf(pet.xp)], px = Math.round(sizePx * sg.sc), s = '<div class="pet-pet' + (extra || "") + '" style="font-size:' + px + 'px">' + pet.sp;
    if(sg.acc) s += '<span class="pa pa-top">' + sg.acc + '</span>';
    Object.keys(eq || {}).forEach(function(sl){ var it = cm(eq[sl]); if(it) s += '<span class="pa pa-' + sl + '">' + it.e + '</span>'; });
    return s + '</div>';
  }

  // ---------- 學生端 ----------
  var me = null, btn = null, panel = null, started = false, tab = "pet", lbData = null, lbSort = "xp";
  P.initStudent = function(){
    var c = ctx(), s = c.student && c.student(); if(!s || started) return; started = true;
    var r = root(), k = key(s.name);
    c.onValue(r.path + "/cfg/" + r.cls, function(v){ P.cfg = Object.assign({}, DEF, v || {}); paintBtn(); if(panel) drawPanel(); });
    c.onValue(r.path + "/s/" + k, function(v){ me = v || { name: s.name, pts: 0 }; paintBtn(); if(panel) drawPanel(); });
    setInterval(paintBtn, 60000);
  };
  function hungerOf(){ var p = P.actPet(me); return p ? P.hungerNow(p, P.cfg.rate, me.home) : 0; }
  function paintBtn(){
    if(!P.cfg.on){ if(btn){ btn.remove(); btn = null; } if(panel) closePanel(); return; }
    if(!btn){ btn = h("button", { id: "pet-fab", type: "button", onclick: openPanel }); document.body.appendChild(btn); }
    var pet = P.actPet(me), hg = hungerOf();
    btn.innerHTML = '<span class="pf-e">' + (pet ? pet.sp : "🥚") + '</span><span class="pf-p">⭐ ' + ((me && me.pts) || 0) + '</span>' + (pet && hg < 30 ? '<i class="pf-hungry">🍽️</i>' : "");
    btn.title = "我的寵物（點數 " + ((me && me.pts) || 0) + "）";
  }
  async function mutate(fn){
    var c = ctx(), s = c.student(), r = root(), path = r.path + "/s/" + key(s.name), cur = (await c.get(path)) || { name: s.name, pts: 0 };
    var patch = fn(cur); if(!patch) return null; patch.name = s.name; patch.c = r.cls; await c.update(path, patch); return Object.assign({}, cur, patch);
  }
  P.earn = async function(n, why, k){
    var c = ctx(), s = c.student && c.student(); if(!s || !P.cfg.on || !n || n <= 0) return;
    var done = await mutate(function(cur){ var got = cur.got || {}; if(k && got[k]) return null; if(k) got[k] = 1; var ev = (cur.ev || []).slice(-7); ev.push({ t: Date.now(), n: n, w: why }); return { pts: (cur.pts || 0) + n, earned: (cur.earned || 0) + n, got: got, ev: ev }; });
    if(done){ c.toast("🎉 獲得 " + n + " 點！（" + why + "）"); beep(660, 0.12); setTimeout(function(){ beep(880, 0.15); }, 120); }
  };
  P.onHwItem = function(id){ P.earn(P.cfg.hw, "繳交作業", "hw:" + id); };
  P.onExam = function(item, pct){ var n = (P.cfg.exam || 0) + (pct != null ? Math.floor(pct / 10) * (P.cfg.examBonus || 0) : 0); P.earn(n, "交考卷", "exam:" + item); };
  P.onChoice = function(room, qid){ P.earn(P.cfg.choice, "答對選擇題", "c:" + room + ":" + qid); };
  window.addEventListener("message", function(e){ var d = e.data; if(!d || !d.mm) return; if(d.mm === "examSubmitted") P.onExam(d.item, d.pct); else if(d.mm === "petEarn" && d.kind === "choice") P.onChoice(d.room, d.id); });

  function openPanel(){ if(panel) return; tab = "pet"; panel = h("div", { id: "pet-ov", onclick: function(e){ if(e.target === panel) closePanel(); } }); document.body.appendChild(panel); drawPanel(); }
  function closePanel(){ if(panel){ panel.remove(); panel = null; } }
  function say(t){ var m = document.getElementById("pet-mood"); if(m) m.textContent = t; ctx().toast(t); }
  function drawPanel(){
    if(!panel) return; var pts = (me && me.pts) || 0, pet = P.actPet(me);
    if(!pet && tab !== "adopt"){ tab = "adopt"; }
    var tabs = pet ? '<div class="pet-tabs">' + [["pet", "🐾 我的寵物"], ["shop", "🛒 商店"], ["rank", "🏆 排行榜"]].map(function(t){ return '<button type="button" data-tab="' + t[0] + '" class="' + (tab === t[0] ? "on" : "") + '">' + t[1] + '</button>'; }).join("") + '</div>' : "";
    panel.innerHTML = '<div class="pet-box"><button class="pet-x" type="button">✕</button>' + tabs + '<div id="pet-body"></div></div>';
    panel.querySelector(".pet-x").onclick = closePanel;
    var tb = panel.querySelector(".pet-tabs"); if(tb) tb.onclick = function(e){ var b = e.target.closest("button"); if(b){ tab = b.dataset.tab; if(tab === "rank") loadRank(); drawPanel(); } };
    var body = panel.querySelector("#pet-body");
    if(tab === "adopt") drawAdopt(body); else if(tab === "shop") drawShop(body); else if(tab === "rank") drawRank(body); else drawPet(body);
  }
  function drawAdopt(body){
    var first = !P.actPet(me), chosen = "", own = me && me.pets ? Object.keys(me.pets).map(function(k){ return me.pets[k].sp; }) : [];
    body.innerHTML = '<div class="pet-t">' + (first ? '選一隻寵物 Choose a pet' : '領養新寵物（⭐' + P.price("new", NEWPET) + '）') + '</div><div class="pet-pick">' + BASIC.map(function(e){ return '<button type="button" data-sp="' + e + '">' + e + '</button>'; }).join("") + '</div><input id="pet-name" maxlength="10" placeholder="幫牠取個名字 Name it"><div class="pet-msg">答對問題、交作業可以賺點數，用點數買飼料餵牠長大！<br>Earn points, buy food, and watch your pet grow!</div>';
    body.querySelector(".pet-pick").onclick = function(e){ var b = e.target.closest("button"); if(!b) return; chosen = b.dataset.sp; [].slice.call(body.querySelectorAll(".pet-pick button")).forEach(function(x){ x.classList.toggle("on", x === b); }); beep(700, 0.1); };
    body.appendChild(h("button", { class: "pet-go", type: "button", text: first ? "就是牠了！ Adopt!" : "領養（⭐" + P.price("new", NEWPET) + "）", onclick: async function(){
      var nm = body.querySelector("#pet-name").value.trim() || "小寶"; if(!chosen){ ctx().toast("先選一隻寵物"); return; }
      var ok = await mutate(function(cur){ var np0 = P.price("new", NEWPET); if(!first && (cur.pts || 0) < np0) return null; var pets = Object.assign({}, cur.pets), id = "p" + Date.now().toString(36); pets[id] = { sp: chosen, nm: nm, h: 70, at: Date.now(), xp: 0, pw: 1 }; return { pets: pets, act: id, pts: (cur.pts || 0) - (first ? 0 : np0) }; });
      if(!ok){ ctx().toast("點數不夠"); return; } tab = "pet"; beep(880, 0.2);
    } }));
    if(!first) body.appendChild(h("button", { class: "pet-link", type: "button", text: "← 回去", onclick: function(){ tab = "pet"; drawPanel(); } }));
  }
  function drawPet(body){
    var pet = P.actPet(me), pts = me.pts || 0, hg = hungerOf(), st = P.stageOf(pet.xp), sg = STAGES[st], nx = STAGES[st + 1], mood = P.moodOf(hg), sc = SCENES.filter(function(x){ return x.id === (me.bg || "grass"); })[0] || SCENES[0];
    var pets = Object.keys(me.pets || {});
    body.innerHTML = '<div class="pet-stage" id="pet-stage" style="background:' + sc.bg + '">' + petHtml(pet, pet.eq, 110, hg < 30 ? " sad" : "").replace('class="pet-pet', 'id="pet-pet" class="pet-pet') + '<div class="pet-mood" id="pet-mood">' + mood[0] + ' ' + mood[1] + '</div></div>' +
      '<div class="pet-nm"><b>' + esc(pet.nm) + '</b>' + (pet.pw > 1 ? ' <span class="pet-pw">⚡強化×' + pet.pw + '</span>' : '') + '　<small>' + sg.name + (nx ? '　經驗 ' + (pet.xp || 0) + ' / ' + nx.xp : '　已經是最強等級！') + '</small></div>' +
      (pets.length > 1 ? '<div class="pet-sw">' + pets.map(function(k){ return '<button type="button" data-pid="' + k + '" class="' + (k === me.act ? 'on' : '') + '">' + me.pets[k].sp + '</button>'; }).join("") + '</div>' : '') +
      '<div class="pet-bar"><span>🍽️ 飽足 Fullness</span><div><i style="width:' + hg + '%;background:' + (hg < 30 ? '#E0524A' : hg < 60 ? '#E0A82E' : '#4CAF6A') + '"></i></div><b>' + hg + '</b></div>' +
      (me.dbl > 0 ? '<div class="pet-note">🎟️ 經驗加倍中（還剩 ' + me.dbl + ' 次餵食）</div>' : '') +
      '<div class="pet-pts">⭐ 我的點數 <b>' + pts + '</b></div><div class="pet-shop">' + FOODS.map(function(f, i){ return '<button type="button" data-f="' + i + '"' + (pts < P.price("f" + i, f.p) ? ' disabled' : '') + '><span class="fe">' + f.e + '</span><span>' + f.n + '</span><em>⭐' + P.price("f" + i, f.p) + '</em></button>'; }).join("") + '</div>' +
      wardrobe() + '<div class="pet-log">' + ((me.ev || []).slice().reverse().slice(0, 3).map(function(v){ return '<div>＋' + v.n + ' 點　' + esc(v.w) + '</div>'; }).join("") || '<div>還沒有點數。答對問題、交作業就會有！ No points yet.</div>') + '</div>';
    body.querySelector("#pet-pet").onclick = function(){ var p = this; p.classList.remove("hop"); void p.offsetWidth; p.classList.add("hop"); beep(520 + Math.random() * 300, 0.12); };
    var sw = body.querySelector(".pet-sw"); if(sw) sw.onclick = function(e){ var b = e.target.closest("button"); if(b) mutate(function(){ return { act: b.dataset.pid }; }); };
    body.querySelector(".pet-shop").onclick = async function(e){
      var b = e.target.closest("button[data-f]"); if(!b || b.disabled) return; var fi = Number(b.dataset.f), f = FOODS[fi], fp = P.price("f" + fi, f.p), evolved = "", full = false, poor = false;
      var r = await mutate(function(cur){
        var p0 = P.actPet(cur); if(!p0) return null; if((cur.pts || 0) < fp){ poor = true; return null; } var hgN = P.hungerNow(p0, P.cfg.rate, cur.home); if(hgN >= 95){ full = true; return null; }
        var gain = Math.round(f.x * (p0.pw || 1) * (cur.dbl > 0 ? 2 : 1)), np = Object.assign({}, p0, { h: Math.min(100, hgN + f.h), at: Date.now(), xp: (p0.xp || 0) + gain });
        if(P.stageOf(np.xp) > P.stageOf(p0.xp)) evolved = STAGES[P.stageOf(np.xp)].name; var pets = Object.assign({}, cur.pets); pets[cur.act] = np;
        return { pets: pets, pts: cur.pts - fp, fed: (cur.fed || 0) + 1, dbl: cur.dbl > 0 ? cur.dbl - 1 : 0 };
      });
      if(poor) ctx().toast("點數不夠"); else if(full) ctx().toast("牠已經很飽了，等一下再餵吧 It's full!"); else if(r) animateEat(f.e, b, evolved);
    };
    var wd = body.querySelector(".pet-wd"); if(wd) wd.onclick = function(e){ var b = e.target.closest("button[data-c]"); if(!b) return; var it = cm(b.dataset.c);
      mutate(function(cur){ var p0 = P.actPet(cur), eq = Object.assign({}, p0.eq); if(eq[it.s] === it.id) delete eq[it.s]; else eq[it.s] = it.id; var pets = Object.assign({}, cur.pets); pets[cur.act] = Object.assign({}, p0, { eq: eq }); return { pets: pets }; }); beep(600, 0.1); };
  }
  function wardrobe(){
    var inv = me.inv || {}, owned = CLOTHES.filter(function(x){ return inv[x.id]; }), pet = P.actPet(me), scenes = SCENES.filter(function(x){ return x.p === 0 || (inv["bg_" + x.id]); });
    if(!owned.length && scenes.length < 2) return "";
    return '<div class="pet-wd"><div class="pet-sub">👔 衣櫃（點一下穿上／脫下）</div>' + owned.map(function(x){ var on = pet.eq && pet.eq[x.s] === x.id; return '<button type="button" data-c="' + x.id + '" class="' + (on ? "on" : "") + '" title="' + x.n + '">' + x.e + '</button>'; }).join("") + (scenes.length > 1 ? '<div class="pet-sub">🖼️ 場景</div>' + scenes.map(function(x){ return '<button type="button" data-bg="' + x.id + '" class="' + ((me.bg || "grass") === x.id ? "on" : "") + '" title="' + x.n + '">' + x.e + '</button>'; }).join("") : "") + '</div>';
  }
  // 場景切換（事件委派在 wardrobe 容器上）
  document.addEventListener("click", function(e){ var b = e.target.closest && e.target.closest(".pet-wd button[data-bg]"); if(!b) return; mutate(function(){ return { bg: b.dataset.bg }; }); beep(600, 0.1); });
  function animateEat(emoji, from, evolved){
    var stage = document.getElementById("pet-stage"), pet = document.getElementById("pet-pet"); if(!stage || !pet) return;
    var fl = h("div", { class: "pet-fly", text: emoji }); document.body.appendChild(fl); var a = from.getBoundingClientRect(), b = pet.getBoundingClientRect();
    fl.style.left = (a.left + a.width / 2) + "px"; fl.style.top = (a.top + a.height / 2) + "px";
    requestAnimationFrame(function(){ fl.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.6)"; fl.style.opacity = "0.2"; });
    beep(440, 0.1); setTimeout(function(){ fl.remove(); beep(660, 0.12); setTimeout(function(){ beep(880, 0.18); }, 120); var st2 = document.getElementById("pet-stage"); if(!st2) return; for(var i = 0; i < 6; i++){ var hh = h("div", { class: "pet-heart", text: "💖", style: "left:" + (30 + Math.random() * 40) + "%;animation-delay:" + (i * 0.08) + "s;" }); st2.appendChild(hh); setTimeout(function(x){ x.remove(); }.bind(null, hh), 1400); }
      if(evolved){ var m = document.getElementById("pet-mood"); if(m) m.textContent = "🎉 進化成「" + evolved + "」了！ Evolved!"; } }, 650);
  }
  // ----- 商店 -----
  function drawShop(body){
    var pts = me.pts || 0, inv = me.inv || {}, card = function(e, n, p, d, state, attrs){ return '<div class="sh-card' + (state === "own" ? " own" : "") + '"><div class="sh-e">' + e + '</div><div class="sh-n">' + n + '</div>' + (d ? '<div class="sh-d">' + d + '</div>' : '') + '<button type="button" ' + attrs + (state === "own" || pts < p ? " disabled" : "") + '>' + (state === "own" ? "已擁有" : "⭐" + p) + '</button></div>'; };
    var rewards = (P.cfg.rewards || []).filter(Boolean), vis = function(k){ return !P.hidden(k); }, pr = function(k, d){ return P.price(k, d); };
    var sec = function(title, html){ return html ? '<div class="sh-h">' + title + '</div><div class="sh-grid">' + html + '</div>' : ''; };
    body.innerHTML = '<div class="pet-pts">⭐ 我的點數 <b>' + pts + '</b></div>' +
      sec('🎁 老師的獎勵（兌換後告訴老師）', rewards.map(function(r, i){ return card(r.e || "🎁", esc(r.n), r.p, "", "", 'data-rw="' + i + '"'); }).join("")) +
      sec('🐾 更強的寵物（經驗成長更快）', PREMIUM.map(function(x, i){ return vis("pm" + i) ? card(x.e, x.n, pr("pm" + i, x.p), "⚡ 成長 ×" + x.pw, "", 'data-pm="' + i + '"') : ""; }).join("") + (vis("new") ? card("🥚", "再領養一隻普通寵物", pr("new", NEWPET), "", "", 'data-new="1"') : "")) +
      sec('🧪 道具', ITEMS.map(function(x, i){ return vis("it_" + x.id) ? card(x.e, x.n, pr("it_" + x.id, x.p), x.d, x.once && me[x.id === "house" ? "home" : x.id] ? "own" : "", 'data-it="' + i + '"') : ""; }).join("")) +
      sec('👔 寵物的衣服（買了到「我的寵物」衣櫃穿）', CLOTHES.map(function(x, i){ return vis("cl_" + x.id) ? card(x.e, x.n, pr("cl_" + x.id, x.p), SLOTS[x.s], inv[x.id] ? "own" : "", 'data-cl="' + i + '"') : ""; }).join("")) +
      sec('🖼️ 場景', SCENES.filter(function(x){ return x.p > 0 && vis("sc_" + x.id); }).map(function(x){ return card(x.e, x.n, pr("sc_" + x.id, x.p), "", inv["bg_" + x.id] ? "own" : "", 'data-sc="' + x.id + '"'); }).join(""));
    body.onclick = async function(e){
      var b = e.target.closest("button[data-rw],button[data-pm],button[data-new],button[data-it],button[data-cl],button[data-sc]"); if(!b || b.disabled) return; var d = b.dataset, msg = "", poor = false;
      if(d.new){ tab = "adopt"; drawPanel(); return; }
      var r = await mutate(function(cur){
        var price, apply; if(d.rw !== undefined){ var rw = (P.cfg.rewards || [])[Number(d.rw)]; if(!rw) return null; price = rw.p; apply = function(){ return {}; }; }
        else if(d.pm !== undefined){ var pr = PREMIUM[Number(d.pm)]; price = P.price("pm" + d.pm, pr.p); apply = function(c2){ var pets = Object.assign({}, c2.pets), id = "p" + Date.now().toString(36); pets[id] = { sp: pr.e, nm: pr.n, h: 80, at: Date.now(), xp: 0, pw: pr.pw }; msg = "領養了 " + pr.e + " " + pr.n + "！"; return { pets: pets, act: id }; }; }
        else if(d.it !== undefined){ var it = ITEMS[Number(d.it)]; price = P.price("it_" + it.id, it.p); apply = function(c2){ if(it.id === "potion"){ var p0 = P.actPet(c2); if(!p0){ return null; } var pets = Object.assign({}, c2.pets); pets[c2.act] = Object.assign({}, p0, { xp: (p0.xp || 0) + 40 }); msg = "寵物喝了成長藥水，經驗 +40！"; return { pets: pets }; } if(it.id === "dbl"){ msg = "經驗加倍券 +5 次！"; return { dbl: (c2.dbl || 0) + 5 }; } if(it.id === "house"){ if(c2.home) return null; msg = "豪華小屋蓋好了！"; return { home: 1 }; } return null; }; }
        else if(d.cl !== undefined){ var cl = CLOTHES[Number(d.cl)]; price = P.price("cl_" + cl.id, cl.p); apply = function(c2){ var inv2 = Object.assign({}, c2.inv); if(inv2[cl.id]) return null; inv2[cl.id] = 1; msg = "買了 " + cl.e + " " + cl.n + "！到「我的寵物」衣櫃穿上"; return { inv: inv2 }; }; }
        else if(d.sc){ var sc = SCENES.filter(function(x){ return x.id === d.sc; })[0]; price = P.price("sc_" + sc.id, sc.p); apply = function(c2){ var inv2 = Object.assign({}, c2.inv); if(inv2["bg_" + sc.id]) return null; inv2["bg_" + sc.id] = 1; msg = "買了場景 " + sc.e + " " + sc.n + "！"; return { inv: inv2, bg: sc.id }; }; }
        if((cur.pts || 0) < price){ poor = true; return null; } var patch = apply(cur); if(!patch) return null; patch.pts = (cur.pts || 0) - price; return patch;
      });
      if(poor){ ctx().toast("點數不夠"); return; } if(!r) return;
      if(d.rw !== undefined){ var rw2 = (P.cfg.rewards || [])[Number(d.rw)], rt = root(), s = ctx().student(); await ctx().update(rt.path + "/redeem/r" + Date.now().toString(36) + Math.floor(Math.random() * 99), { name: s.name, c: rt.cls, item: (rw2.e || "🎁") + " " + rw2.n, p: rw2.p, at: Date.now(), done: false }); msg = "已兌換「" + rw2.n + "」！請告訴老師領取。Show your teacher!"; }
      beep(880, 0.15); setTimeout(function(){ beep(1100, 0.15); }, 120); if(msg) ctx().toast("🛍️ " + msg);
    };
  }
  // ----- 排行榜 -----
  function loadRank(){ var r = root(), c = ctx(); c.get(r.path + "/s").then(function(v){ lbData = v || {}; if(panel && tab === "rank") drawPanel(); }); }
  function drawRank(body){
    var r = root(), list = Object.keys(lbData || {}).map(function(k){ return lbData[k]; }).filter(function(x){ return x && x.c === r.cls && P.bestPet(x); });
    var val = function(x){ return lbSort === "xp" ? P.power(x) : (x.earned || 0); };
    list.sort(function(a, b){ return val(b) - val(a); });
    var meName = ctx().student().name, medal = ["🥇", "🥈", "🥉"];
    body.innerHTML = '<div class="pet-t">🏆 全班寵物排行榜</div><div class="pet-sw"><button type="button" data-s="xp" class="' + (lbSort === "xp" ? "on" : "") + '">🐾 寵物經驗</button><button type="button" data-s="earned" class="' + (lbSort === "earned" ? "on" : "") + '">⭐ 累積點數</button></div>' +
      (list.length ? '<div class="lb-pod">' + list.slice(0, 3).map(function(x, i){ var p = P.bestPet(x); return '<div class="lb-p lb-p' + i + '"><div class="lb-m">' + medal[i] + '</div>' + petHtml(p, p.eq, 54) + '<div class="lb-n">' + esc(x.name) + '</div><div class="lb-v">' + val(x) + '</div></div>'; }).join("") + '</div>' : '<div class="pet-msg">還沒有人領養寵物。</div>') +
      '<div class="lb-list">' + list.map(function(x, i){ var p = P.bestPet(x); return '<div class="lb-r' + (x.name === meName ? " me" : "") + '"><span>' + (i < 3 ? medal[i] : (i + 1)) + '</span><span class="lb-e">' + p.sp + '</span><b>' + esc(x.name) + '</b><small>' + esc(p.nm) + '・' + STAGES[P.stageOf(p.xp)].name + '</small><em>' + val(x) + '</em></div>'; }).join("") + '</div>';
    body.querySelector(".pet-sw").onclick = function(e){ var b = e.target.closest("button"); if(b){ lbSort = b.dataset.s; drawPanel(); } };
  }

  // ---------- 樣式 ----------
  var css = "#pet-fab{position:fixed;left:14px;bottom:14px;z-index:9400;display:flex;align-items:center;gap:6px;padding:8px 14px 8px 10px;border-radius:99px;border:2px solid var(--seal,#C0623A);background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer;font-size:16px;font-weight:700;color:var(--ink,#2a2018);} #pet-fab .pf-e{font-size:28px;line-height:1;animation:petIdle 2.2s ease-in-out infinite;} .pf-hungry{position:absolute;top:-8px;right:-6px;font-style:normal;font-size:20px;animation:petIdle 1s infinite;}" +
    "#pet-ov{position:fixed;inset:0;z-index:99989;background:rgba(40,30,20,.55);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;} .pet-box{position:relative;width:min(480px,98vw);max-height:96vh;overflow:auto;background:linear-gradient(180deg,#FFF7E6,#FFFDF8);border-radius:22px;padding:14px 14px 18px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.4);color:#2a2018;} .pet-x{position:absolute;right:10px;top:8px;border:0;background:rgba(0,0,0,.08);border-radius:50%;width:32px;height:32px;font-size:16px;cursor:pointer;z-index:3;}" +
    ".pet-tabs{display:flex;gap:4px;margin:0 40px 10px 0;} .pet-tabs button{flex:1;border:2px solid #e6d9c8;background:#fff;border-radius:12px;padding:7px 2px;font-size:14px;font-weight:700;cursor:pointer;color:#2a2018;font-family:inherit;} .pet-tabs button.on{background:#C0623A;border-color:#C0623A;color:#fff;}" +
    ".pet-t{font-size:22px;font-weight:800;margin:6px 0 10px;} .pet-pick{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;} .pet-pick button{font-size:42px;border:3px solid #e6d9c8;border-radius:16px;background:#fff;cursor:pointer;padding:6px 0;} .pet-pick button.on{border-color:#C0623A;background:#FDECE6;transform:scale(1.06);} #pet-name{margin:12px 0 6px;width:80%;padding:8px 12px;font-size:18px;border-radius:12px;border:2px solid #d9c9b5;text-align:center;} .pet-msg{font-size:14px;color:#8a7a6a;margin:6px 0 10px;} .pet-go{border:0;background:#C0623A;color:#fff;font-size:20px;font-weight:800;border-radius:99px;padding:10px 26px;cursor:pointer;} .pet-link{display:block;margin:10px auto 0;border:0;background:none;color:#8a7a6a;cursor:pointer;font-size:14px;}" +
    ".pet-stage{position:relative;height:230px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:18px;overflow:hidden;} .pet-pet{position:relative;line-height:1.1;cursor:pointer;user-select:none;animation:petIdle 2.4s ease-in-out infinite;display:inline-block;} .pet-pet.sad{filter:grayscale(.55);animation-duration:4s;} .pet-pet.hop{animation:petHop .5s;} .pa{position:absolute;line-height:1;pointer-events:none;} .pa-top{right:-.15em;top:-.45em;font-size:.38em;} .pa-head{left:50%;top:-.34em;transform:translateX(-50%);font-size:.5em;} .pa-face{left:50%;top:.22em;transform:translateX(-50%);font-size:.5em;} .pa-neck{left:50%;bottom:-.12em;transform:translateX(-50%);font-size:.42em;} .pa-side{right:-.32em;bottom:.05em;font-size:.45em;} .pet-mood{margin-top:6px;font-weight:800;font-size:18px;position:absolute;bottom:8px;text-shadow:0 1px 3px #fff;}" +
    ".pet-nm{margin:10px 0 4px;font-size:20px;} .pet-nm small{color:#8a7a6a;font-size:14px;} .pet-pw{font-size:12px;background:#FFE9A8;border-radius:99px;padding:1px 8px;} .pet-sw{display:flex;gap:6px;justify-content:center;margin:6px 0;} .pet-sw button{border:2px solid #e6d9c8;background:#fff;border-radius:12px;padding:3px 10px;font-size:22px;cursor:pointer;font-family:inherit;} .pet-sw button.on{border-color:#C0623A;background:#FDECE6;} .pet-bar{display:flex;align-items:center;gap:8px;margin:6px 4px;font-size:14px;} .pet-bar div{flex:1;height:16px;background:#eee;border-radius:99px;overflow:hidden;} .pet-bar i{display:block;height:100%;transition:width .5s;} .pet-note{font-size:13px;color:#8a5a00;background:#FFF3D6;border-radius:10px;padding:3px 8px;margin:4px 0;} .pet-pts{font-size:20px;margin:8px 0;} .pet-pts b{color:#C0623A;font-size:26px;}" +
    ".pet-shop{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;} .pet-shop button{display:flex;flex-direction:column;align-items:center;gap:2px;border:2px solid #e6d9c8;border-radius:14px;background:#fff;padding:6px 2px;cursor:pointer;font-size:12px;color:#2a2018;font-family:inherit;} .pet-shop button .fe{font-size:30px;line-height:1.1;} .pet-shop button em{font-style:normal;color:#C0623A;font-weight:800;font-size:13px;} .pet-shop button:disabled{opacity:.38;cursor:default;} .pet-shop button:not(:disabled):hover{background:#FDECE6;border-color:#C0623A;}" +
    ".pet-wd{margin-top:10px;text-align:left;} .pet-sub{font-size:13px;color:#8a7a6a;margin:6px 0 3px;} .pet-wd button{font-size:26px;border:2px solid #e6d9c8;background:#fff;border-radius:12px;padding:2px 8px;margin:0 4px 4px 0;cursor:pointer;} .pet-wd button.on{border-color:#C0623A;background:#FDECE6;}" +
    ".sh-h{text-align:left;font-weight:800;margin:12px 0 6px;font-size:15px;} .sh-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;} .sh-card{border:2px solid #e6d9c8;border-radius:14px;background:#fff;padding:6px 4px 8px;display:flex;flex-direction:column;align-items:center;gap:2px;} .sh-card.own{background:#F1F7EC;} .sh-e{font-size:34px;line-height:1.1;} .sh-n{font-size:13px;font-weight:700;} .sh-d{font-size:11px;color:#8a7a6a;min-height:1.2em;} .sh-card button{border:0;background:#C0623A;color:#fff;border-radius:99px;padding:3px 12px;font-size:13px;font-weight:800;cursor:pointer;margin-top:2px;} .sh-card button:disabled{background:#bbb;cursor:default;}" +
    ".lb-pod{display:flex;justify-content:center;align-items:flex-end;gap:10px;margin:12px 0;} .lb-p{background:#fff;border:2px solid #e6d9c8;border-radius:16px;padding:6px 10px;min-width:84px;} .lb-p0{order:2;padding-top:14px;border-color:#E0A82E;box-shadow:0 0 0 3px #FFE9A8;} .lb-p1{order:1;} .lb-p2{order:3;} .lb-m{font-size:26px;} .lb-n{font-weight:800;font-size:14px;margin-top:4px;} .lb-v{color:#C0623A;font-weight:800;} .lb-p .pet-pet{animation:none;cursor:default;display:block;margin:0 auto;} .lb-list{text-align:left;} .lb-r{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:10px;margin:3px 0;background:#fff;} .lb-r.me{background:#FDECE6;border:2px solid #C0623A;} .lb-r span:first-child{width:1.8em;text-align:center;font-weight:800;} .lb-e{font-size:24px;} .lb-r small{color:#8a7a6a;flex:1;} .lb-r em{font-style:normal;font-weight:800;color:#C0623A;}" +
    ".pet-log{margin-top:10px;font-size:13px;color:#8a7a6a;} .pet-fly{position:fixed;font-size:40px;z-index:99999;transition:transform .6s ease-in,opacity .6s;pointer-events:none;margin:-20px 0 0 -20px;} .pet-heart{position:absolute;bottom:40%;font-size:26px;animation:petHeart 1.3s ease-out forwards;}" +
    "@keyframes petIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @keyframes petHop{0%{transform:scale(1)}30%{transform:scale(1.25,.8)}60%{transform:translateY(-26px) scale(.95,1.1)}100%{transform:scale(1)}} @keyframes petHeart{0%{transform:translateY(0) scale(.5);opacity:1}100%{transform:translateY(-120px) scale(1.2);opacity:0}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

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
        box.appendChild(h("label", { style: "display:flex;align-items:center;gap:.5em;font-weight:800;font-size:1.1em;margin-bottom:6px;" }, [h("input", { type: "checkbox", checked: cfg.on ? "checked" : null, onchange: function(){ setCfg({ on: this.checked }); } }), "啟用這個班的寵物遊戲（學生畫面左下角會出現 🐾；點數和寵物整個學期累積、跨班共用）"]));
        if(!cfg.on){ box.appendChild(h("div", { class: "ct-muted", text: "打開之後，學生登入班級頁面左下角會出現寵物按鈕。" })); return; }
        var pend = Object.keys(redeem).filter(function(k){ return !redeem[k].done && redeem[k].c === r.cls; });
        var tabs = h("div", { class: "ct-row" }); [["cls", "👥 全班點數"], ["rank", "🏆 排行榜"], ["rule", "⚙️ 規則與獎勵"], ["rd", "🎁 兌換紀錄" + (pend.length ? "（" + pend.length + " 待發放）" : "")]].forEach(function(t){ tabs.appendChild(h("button", { class: "ct-btn" + (view === t[0] ? " on" : ""), text: t[1], onclick: function(){ view = t[0]; draw(); } })); }); box.appendChild(tabs);
        if(view === "rule") rules(); else if(view === "rd") redeems(); else roster(view === "rank");
      }
      function rules(){
        var g = h("div", { style: "display:grid;grid-template-columns:repeat(auto-fill,minmax(11em,1fr));gap:6px;margin:6px 0;" });
        [["hw", "繳交作業 +"], ["exam", "交考卷 +"], ["examBonus", "考卷每 10 分再 +"], ["choice", "答對選擇題 +"]].forEach(function(x){ g.appendChild(h("label", { class: "ct-muted", style: "display:flex;align-items:center;gap:.3em;" }, [x[1], h("input", { class: "ct-inp", type: "number", min: "0", max: "100", value: String(cfg[x[0]]), style: "width:4em;", onchange: function(){ var p = {}; p[x[0]] = Math.max(0, Number(this.value) || 0); setCfg(p); } }), "點"])); });
        var rate = h("select", { class: "ct-inp", onchange: function(){ setCfg({ rate: Number(this.value) }); } }, [h("option", { value: "2", text: "慢（約 2 天餓）" }), h("option", { value: "4", text: "普通（約 1 天餓）" }), h("option", { value: "8", text: "快（約半天餓）" })]); rate.value = String(cfg.rate);
        g.appendChild(h("label", { class: "ct-muted", style: "display:flex;align-items:center;gap:.3em;" }, ["寵物變餓的速度", rate])); box.appendChild(g);
        box.appendChild(h("div", { style: "font-weight:800;margin:12px 0 4px;", text: "🎁 老師的獎勵（學生用點數兌換，會出現在他們商店最上面）" }));
        var list = (cfg.rewards || []).filter(Boolean), rl = h("div"); list.forEach(function(rw, i){ rl.appendChild(h("div", { class: "ct-row" }, [h("span", { style: "font-size:1.4em;", text: rw.e || "🎁" }), h("b", { text: rw.n }), h("span", { class: "ct-muted", text: "⭐" + rw.p }), h("button", { class: "ct-btn", text: "✕", onclick: function(){ list.splice(i, 1); setCfg({ rewards: list }); } })])); }); box.appendChild(rl);
        var ne = h("input", { class: "ct-inp", value: "🎁", style: "width:3em;text-align:center;" }), nn = h("input", { class: "ct-inp", placeholder: "獎勵名稱（例如：免寫一次作業、選座位）", style: "flex:1;min-width:10em;" }), np = h("input", { class: "ct-inp", type: "number", min: "1", value: "50", style: "width:5em;" });
        box.appendChild(h("div", { class: "ct-row" }, [ne, nn, np, h("button", { class: "ct-btn pri", text: "＋ 新增獎勵", onclick: function(){ if(!nn.value.trim()) return; list.push({ e: ne.value.trim() || "🎁", n: nn.value.trim(), p: Math.max(1, Number(np.value) || 1) }); setCfg({ rewards: list }); } })]));
        box.appendChild(h("div", { style: "font-weight:800;margin:14px 0 4px;", text: "🛒 商店價格（每一項都可以自己訂價；取消勾選＝下架，學生商店就看不到）" }));
        var bar = h("div", { class: "ct-row" }, [h("span", { class: "ct-muted", text: "全部價格 ×" }), h("button", { class: "ct-btn", text: "0.5", onclick: function(){ scaleAll(0.5); } }), h("button", { class: "ct-btn", text: "0.8", onclick: function(){ scaleAll(0.8); } }), h("button", { class: "ct-btn", text: "1.2", onclick: function(){ scaleAll(1.2); } }), h("button", { class: "ct-btn", text: "2", onclick: function(){ scaleAll(2); } }), h("button", { class: "ct-btn", text: "↺ 還原預設價格", onclick: function(){ if(confirm("全部價格還原成預設、並重新上架？")) setCfg({ prices: null, off: null }); } })]); box.appendChild(bar);
        var cat = P.catalog(), grp = ""; var pt = h("div", { style: "display:grid;grid-template-columns:repeat(auto-fill,minmax(14em,1fr));gap:4px 10px;" });
        cat.forEach(function(it){
          if(it.g !== grp){ grp = it.g; pt.appendChild(h("div", { style: "grid-column:1/-1;font-weight:700;margin-top:6px;", text: grp })); }
          var on = !P.hidden(it.k), cur = P.price(it.k, it.d);
          pt.appendChild(h("div", { style: "display:flex;align-items:center;gap:.4em;opacity:" + (on ? 1 : .45) + ";" }, [h("input", { type: "checkbox", checked: on ? "checked" : null, title: "上架", disabled: it.k.charAt(0) === "f" && it.k.length <= 2 ? "disabled" : null, onchange: function(){ var o = Object.assign({}, cfg.off || {}); if(this.checked) delete o[it.k]; else o[it.k] = 1; setCfg({ off: Object.keys(o).length ? o : null }); } }), h("span", { style: "font-size:1.3em;", text: it.e }), h("span", { style: "flex:1;font-size:.9em;", text: it.n }), h("input", { class: "ct-inp", type: "number", min: "0", max: "9999", value: String(cur), style: "width:4.5em;" + (cur !== it.d ? "border-color:#C0623A;" : ""), onchange: function(){ var o = Object.assign({}, cfg.prices || {}), v = Math.max(0, Math.round(Number(this.value) || 0)); if(v === it.d) delete o[it.k]; else o[it.k] = v; setCfg({ prices: Object.keys(o).length ? o : null }); } })]));
        });
        box.appendChild(pt);
        function scaleAll(m){ var o = {}; cat.forEach(function(it){ o[it.k] = Math.max(1, Math.round(P.price(it.k, it.d) * m)); }); setCfg({ prices: o }); }
        box.appendChild(h("div", { class: "ct-muted", style: "margin-top:8px;", text: "學生賺點數：交作業、交線上考卷（可依分數加成）、上課選擇題答對，也可以在「全班點數」直接加點。商店有衣服、場景、道具、更強的寵物；你設定的獎勵兌換後會出現在「兌換紀錄」。" }));
      }
      function redeems(){
        var ks = Object.keys(redeem).filter(function(k){ return redeem[k].c === r.cls; }).sort(function(a, b){ return (redeem[b].at || 0) - (redeem[a].at || 0); });
        if(!ks.length) box.appendChild(h("div", { class: "ct-muted", style: "padding:1em 0;", text: "還沒有人兌換。" }));
        ks.forEach(function(k){ var x = redeem[k]; box.appendChild(h("div", { class: "ct-row", style: "padding:.3em .6em;border-radius:10px;background:" + (x.done ? "#eef6ea" : "#FFF3D6") + ";" }, [h("b", { text: x.name }), h("span", { text: x.item }), h("span", { class: "ct-muted", style: "flex:1;", text: "⭐" + x.p + "・" + new Date(x.at).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) }), x.done ? h("span", { class: "ct-muted", text: "✓ 已發放" }) : h("button", { class: "ct-btn pri", text: "已發放", onclick: function(){ c.update(r.path + "/redeem/" + k, { done: true }); } })])); });
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
          tr.appendChild(h("td", { style: "padding:4px;", text: rank ? (i < 3 ? ["🥇", "🥈", "🥉"][i] : String(i + 1)) : "" })); tr.appendChild(h("td", { style: "padding:4px;font-weight:700;", text: o.nm }));
          tr.appendChild(h("td", { style: "padding:4px;", text: pet ? pet.sp + " " + pet.nm + "（" + STAGES[P.stageOf(pet.xp)].name + "）" : "—" }));
          tr.appendChild(h("td", { style: "padding:4px;color:" + (hg != null && hg < 30 ? "#B23B32" : "inherit") + ";", text: hg == null ? "" : hg + (hg < 30 ? " 😭" : "") })); tr.appendChild(h("td", { style: "padding:4px;", text: pet ? String(pet.xp || 0) : "" }));
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
