/* 寵物飼料遊戲：學生回答問題、交作業、交考卷賺「點數」，用點數買飼料餵寵物。老師在工具箱的「寵物遊戲」啟用、調整點數、幫學生加點。
   資料在 teacherPlatform/{老師}/petGame/{班級}/（cfg 設定、s/{學生} 每個學生的點數與寵物）。 */
(function(){
  "use strict";
  var SPECIES = ["🐶", "🐱", "🐰", "🐹", "🐥", "🦊", "🐼", "🐸", "🐲", "🦄", "🐧", "🐻"];
  var STAGES = [{ xp: 0, name: "寶寶", sc: 0.75, acc: "" }, { xp: 40, name: "少年", sc: 0.95, acc: "" }, { xp: 120, name: "成年", sc: 1.15, acc: "✨" }, { xp: 300, name: "傳說", sc: 1.35, acc: "👑" }];
  var FOODS = [{ e: "🍪", n: "小餅乾", p: 3, h: 8, x: 2 }, { e: "🍎", n: "蘋果", p: 5, h: 15, x: 5 }, { e: "🍖", n: "肉排", p: 10, h: 35, x: 12 }, { e: "🍰", n: "蛋糕", p: 20, h: 70, x: 30 }, { e: "🍱", n: "大餐", p: 40, h: 100, x: 70 }];
  var DEF = { on: false, hw: 10, exam: 10, examBonus: 1, choice: 2, rate: 4 };
  var P = window.PET = { SPECIES: SPECIES, FOODS: FOODS, STAGES: STAGES, DEF: DEF };
  function ctx(){ return window.PET_ctx || {}; }
  function esc(s){ return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function h(tag, attrs, kids){ var e = document.createElement(tag); if(attrs) Object.keys(attrs).forEach(function(k){ var v = attrs[k]; if(v == null || v === false) return; if(k === "class") e.className = v; else if(k === "style") e.style.cssText = v; else if(k === "text") e.textContent = v; else if(k === "html") e.innerHTML = v; else if(k.slice(0, 2) === "on") e[k] = v; else e.setAttribute(k, v); }); (kids || []).forEach(function(c){ if(c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
  var ac = null; function beep(f, d){ try{ if(!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; o.type = "triangle"; o.connect(g); g.connect(ac.destination); var t = ac.currentTime; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + (d || 0.2)); o.start(t); o.stop(t + (d || 0.2) + 0.02); }catch(e){} }

  // ---------- 共用計算 ----------
  P.hungerNow = function(pet, rate){ if(!pet) return 0; var hrs = (Date.now() - (pet.at || Date.now())) / 3600000; return Math.max(0, Math.min(100, Math.round((pet.h == null ? 60 : pet.h) - hrs * (rate || DEF.rate)))); };
  P.stageOf = function(xp){ var s = 0; STAGES.forEach(function(g, i){ if((xp || 0) >= g.xp) s = i; }); return s; };
  P.moodOf = function(hg){ return hg >= 70 ? ["😋", "吃得好飽！"] : hg >= 40 ? ["🙂", "還不錯"] : hg >= 15 ? ["🥺", "肚子餓了…"] : ["😭", "好餓好餓！"]; };
  function base(){ var c = ctx(); var s = c.student && c.student(); if(s) return "teacherPlatform/" + s.idx.t + "/petGame/" + s.idx.c; var t = c.teacherSel && c.teacherSel(); return t ? "teacherPlatform/" + t.t + "/petGame/" + t.c : null; }
  function key(n){ return ctx().key ? ctx().key(n) : String(n).replace(/[.#$\[\]\/]/g, "_"); }
  P.cfg = Object.assign({}, DEF);

  // ---------- 學生端 ----------
  var me = null, btn = null, panel = null, started = false, unsubs = [];
  P.initStudent = function(){
    var c = ctx(), s = c.student && c.student(); if(!s || started) return; started = true;
    var b = base(), k = key(s.name);
    unsubs.push(c.onValue(b + "/cfg", function(v){ P.cfg = Object.assign({}, DEF, v || {}); paintBtn(); if(panel) drawPanel(); }));
    unsubs.push(c.onValue(b + "/s/" + k, function(v){ me = v || { name: s.name, pts: 0, xp: 0 }; paintBtn(); if(panel) drawPanel(); }));
    setInterval(function(){ paintBtn(); }, 60000);
  };
  function paintBtn(){
    if(!P.cfg.on){ if(btn){ btn.remove(); btn = null; } if(panel) closePanel(); return; }
    if(!btn){ btn = h("button", { id: "pet-fab", type: "button", onclick: openPanel }); document.body.appendChild(btn); }
    var pet = me && me.pet, hg = pet ? P.hungerNow(pet, P.cfg.rate) : 0;
    btn.innerHTML = '<span class="pf-e">' + (pet ? pet.sp : "🥚") + '</span><span class="pf-p">⭐ ' + ((me && me.pts) || 0) + '</span>' + (pet && hg < 30 ? '<i class="pf-hungry">🍽️</i>' : "");
    btn.title = "我的寵物（點數 " + ((me && me.pts) || 0) + "）";
  }
  P.earn = async function(n, why, k){
    var c = ctx(), s = c.student && c.student(); if(!s || !P.cfg.on || !n || n <= 0) return;
    var path = base() + "/s/" + key(s.name); var cur = (await c.get(path)) || { name: s.name, pts: 0, xp: 0 }; var got = cur.got || {};
    if(k && got[k]) return; if(k) got[k] = 1;
    var ev = (cur.ev || []).slice(-7); ev.push({ t: Date.now(), n: n, w: why });
    await c.update(path, { name: s.name, pts: (cur.pts || 0) + n, earned: (cur.earned || 0) + n, got: k ? got : (cur.got || null), ev: ev });
    c.toast("🎉 獲得 " + n + " 點！（" + why + "）"); beep(660, 0.12); setTimeout(function(){ beep(880, 0.15); }, 120);
  };
  P.onHw = function(){ P.earn(P.cfg.hw, "繳交作業", "hw:" + Date.now()); };
  P.onHwItem = function(id){ P.earn(P.cfg.hw, "繳交作業", "hw:" + id); };
  P.onExam = function(item, pct){ var n = (P.cfg.exam || 0) + (pct != null ? Math.floor(pct / 10) * (P.cfg.examBonus || 0) : 0); P.earn(n, "交考卷", "exam:" + item); };
  P.onChoice = function(room, qid){ P.earn(P.cfg.choice, "答對選擇題", "c:" + room + ":" + qid); };
  window.addEventListener("message", function(e){ var d = e.data; if(!d || !d.mm) return; if(d.mm === "examSubmitted") P.onExam(d.item, d.pct); else if(d.mm === "petEarn" && d.kind === "choice") P.onChoice(d.room, d.id); });

  function openPanel(){ if(panel) return; panel = h("div", { id: "pet-ov", onclick: function(e){ if(e.target === panel) closePanel(); } }); document.body.appendChild(panel); drawPanel(); }
  function closePanel(){ if(panel){ panel.remove(); panel = null; } }
  function drawPanel(){
    if(!panel) return; var pet = me && me.pet, pts = (me && me.pts) || 0;
    if(!pet){
      panel.innerHTML = '<div class="pet-box"><button class="pet-x" type="button">✕</button><div class="pet-t">選一隻寵物 Choose a pet</div><div class="pet-pick">' + SPECIES.map(function(e){ return '<button type="button" data-sp="' + e + '">' + e + '</button>'; }).join("") + '</div><input id="pet-name" maxlength="10" placeholder="幫牠取個名字 Name it"><div class="pet-msg">答對問題、交作業可以賺點數，用點數買飼料餵牠長大！<br>Earn points, buy food, and watch your pet grow!</div></div>';
      var chosen = ""; panel.querySelector(".pet-pick").onclick = function(e){ var b = e.target.closest("button"); if(!b) return; chosen = b.dataset.sp; [].slice.call(panel.querySelectorAll(".pet-pick button")).forEach(function(x){ x.classList.toggle("on", x === b); }); beep(700, 0.1); };
      panel.querySelector(".pet-x").onclick = closePanel;
      var go = h("button", { class: "pet-go", type: "button", text: "就是牠了！ Adopt!", onclick: async function(){ var nm = panel.querySelector("#pet-name").value.trim() || "小寶"; if(!chosen){ ctx().toast("先選一隻寵物"); return; } var c = ctx(), s = c.student(); await c.update(base() + "/s/" + key(s.name), { name: s.name, pts: pts, xp: (me && me.xp) || 0, pet: { sp: chosen, nm: nm, h: 70, at: Date.now() } }); } });
      panel.querySelector(".pet-box").appendChild(go); return;
    }
    var hg = P.hungerNow(pet, P.cfg.rate), st = P.stageOf(me.xp), sg = STAGES[st], nx = STAGES[st + 1], mood = P.moodOf(hg);
    panel.innerHTML = '<div class="pet-box"><button class="pet-x" type="button">✕</button><div class="pet-stage" id="pet-stage"><div class="pet-pet' + (hg < 30 ? ' sad' : '') + '" id="pet-pet" style="font-size:' + Math.round(110 * sg.sc) + 'px">' + pet.sp + (sg.acc ? '<span class="pet-acc">' + sg.acc + '</span>' : '') + '</div><div class="pet-mood" id="pet-mood">' + mood[0] + ' ' + mood[1] + '</div></div>' +
      '<div class="pet-nm"><b>' + esc(pet.nm) + '</b>　<small>' + sg.name + (nx ? '　經驗 ' + (me.xp || 0) + ' / ' + nx.xp : '　已經是最強等級！') + '</small></div>' +
      '<div class="pet-bar"><span>🍽️ 飽足 Fullness</span><div><i style="width:' + hg + '%;background:' + (hg < 30 ? '#E0524A' : hg < 60 ? '#E0A82E' : '#4CAF6A') + '"></i></div><b>' + hg + '</b></div>' +
      '<div class="pet-pts">⭐ 我的點數 <b>' + pts + '</b></div><div class="pet-shop">' + FOODS.map(function(f, i){ return '<button type="button" data-f="' + i + '"' + (pts < f.p ? ' disabled' : '') + '><span class="fe">' + f.e + '</span><span>' + f.n + '</span><em>⭐' + f.p + '</em></button>'; }).join("") + '</div>' +
      '<div class="pet-log">' + ((me.ev || []).slice().reverse().slice(0, 4).map(function(v){ return '<div>＋' + v.n + ' 點　' + esc(v.w) + '</div>'; }).join("") || '<div>還沒有點數。答對問題、交作業就會有！ No points yet.</div>') + '</div></div>';
    panel.querySelector(".pet-x").onclick = closePanel;
    panel.querySelector("#pet-pet").onclick = function(){ var p = this; p.classList.remove("hop"); void p.offsetWidth; p.classList.add("hop"); beep(520 + Math.random() * 300, 0.12); };
    panel.querySelector(".pet-shop").onclick = async function(e){
      var b = e.target.closest("button[data-f]"); if(!b || b.disabled) return; var f = FOODS[Number(b.dataset.f)], c = ctx();
      var cur = (await c.get(base() + "/s/" + key(c.student().name))) || me, hgNow = P.hungerNow(cur.pet, P.cfg.rate);
      if((cur.pts || 0) < f.p){ c.toast("點數不夠"); return; }
      if(hgNow >= 95){ c.toast("牠已經很飽了，等一下再餵吧 It's full!"); return; }
      var nxp = (cur.xp || 0) + f.x, np = Object.assign({}, cur.pet, { h: Math.min(100, hgNow + f.h), at: Date.now() }), lv0 = P.stageOf(cur.xp), lv1 = P.stageOf(nxp);
      await c.update(base() + "/s/" + key(c.student().name), { pts: cur.pts - f.p, xp: nxp, fed: (cur.fed || 0) + 1, pet: np });
      animateEat(f.e, b, lv1 > lv0 ? STAGES[lv1].name : "");
    };
  }
  function animateEat(emoji, from, evolved){
    var stage = document.getElementById("pet-stage"), pet = document.getElementById("pet-pet"); if(!stage || !pet) return;
    var fl = h("div", { class: "pet-fly", text: emoji }); document.body.appendChild(fl); var a = from.getBoundingClientRect(), b = pet.getBoundingClientRect();
    fl.style.left = (a.left + a.width / 2) + "px"; fl.style.top = (a.top + a.height / 2) + "px";
    requestAnimationFrame(function(){ fl.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.6)"; fl.style.opacity = "0.2"; });
    beep(440, 0.1); setTimeout(function(){ fl.remove(); beep(660, 0.12); setTimeout(function(){ beep(880, 0.18); }, 120); for(var i = 0; i < 6; i++){ var hh = h("div", { class: "pet-heart", text: "💖", style: "left:" + (30 + Math.random() * 40) + "%;animation-delay:" + (i * 0.08) + "s;" }); stage.appendChild(hh); setTimeout(function(x){ x.remove(); }.bind(null, hh), 1400); }
      if(evolved){ var m = document.getElementById("pet-mood"); if(m) m.textContent = "🎉 進化成「" + evolved + "」了！ Evolved!"; } }, 650);
  }

  // ---------- 學生端樣式 ----------
  var css = "#pet-fab{position:fixed;left:14px;bottom:14px;z-index:9400;display:flex;align-items:center;gap:6px;padding:8px 14px 8px 10px;border-radius:99px;border:2px solid var(--seal,#C0623A);background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer;font-size:16px;font-weight:700;color:var(--ink,#2a2018);} #pet-fab .pf-e{font-size:28px;line-height:1;animation:petIdle 2.2s ease-in-out infinite;} .pf-hungry{position:absolute;top:-8px;right:-6px;font-style:normal;font-size:20px;animation:petIdle 1s infinite;}" +
    "#pet-ov{position:fixed;inset:0;z-index:99989;background:rgba(40,30,20,.55);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;} .pet-box{position:relative;width:min(460px,98vw);max-height:96vh;overflow:auto;background:linear-gradient(180deg,#FFF7E6,#FFFDF8);border-radius:22px;padding:16px 16px 18px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.4);color:#2a2018;} .pet-x{position:absolute;right:10px;top:8px;border:0;background:rgba(0,0,0,.08);border-radius:50%;width:32px;height:32px;font-size:16px;cursor:pointer;}" +
    ".pet-t{font-size:22px;font-weight:800;margin:6px 0 10px;} .pet-pick{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;} .pet-pick button{font-size:42px;border:3px solid #e6d9c8;border-radius:16px;background:#fff;cursor:pointer;padding:6px 0;} .pet-pick button.on{border-color:#C0623A;background:#FDECE6;transform:scale(1.06);} #pet-name{margin:12px 0 6px;width:80%;padding:8px 12px;font-size:18px;border-radius:12px;border:2px solid #d9c9b5;text-align:center;} .pet-msg{font-size:14px;color:#8a7a6a;margin:6px 0 10px;} .pet-go{border:0;background:#C0623A;color:#fff;font-size:20px;font-weight:800;border-radius:99px;padding:10px 26px;cursor:pointer;}" +
    ".pet-stage{position:relative;height:230px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 85%,#DFF2D0 0 38%,transparent 39%),linear-gradient(180deg,#DDF1FF,#F6FBFF);border-radius:18px;overflow:hidden;} .pet-pet{position:relative;line-height:1.1;cursor:pointer;user-select:none;animation:petIdle 2.4s ease-in-out infinite;} .pet-pet.sad{filter:grayscale(.55);animation-duration:4s;} .pet-pet.hop{animation:petHop .5s;} .pet-acc{position:absolute;right:-.15em;top:-.45em;font-size:.38em;} .pet-mood{margin-top:6px;font-weight:800;font-size:18px;position:absolute;bottom:8px;}" +
    ".pet-nm{margin:10px 0 4px;font-size:20px;} .pet-nm small{color:#8a7a6a;font-size:14px;} .pet-bar{display:flex;align-items:center;gap:8px;margin:6px 4px;font-size:14px;} .pet-bar div{flex:1;height:16px;background:#eee;border-radius:99px;overflow:hidden;} .pet-bar i{display:block;height:100%;transition:width .5s;} .pet-pts{font-size:20px;margin:8px 0;} .pet-pts b{color:#C0623A;font-size:26px;}" +
    ".pet-shop{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;} .pet-shop button{display:flex;flex-direction:column;align-items:center;gap:2px;border:2px solid #e6d9c8;border-radius:14px;background:#fff;padding:6px 2px;cursor:pointer;font-size:12px;color:#2a2018;font-family:inherit;} .pet-shop button .fe{font-size:30px;line-height:1.1;} .pet-shop button em{font-style:normal;color:#C0623A;font-weight:800;font-size:13px;} .pet-shop button:disabled{opacity:.38;cursor:default;} .pet-shop button:not(:disabled):hover{background:#FDECE6;border-color:#C0623A;}" +
    ".pet-log{margin-top:10px;font-size:13px;color:#8a7a6a;} .pet-fly{position:fixed;font-size:40px;z-index:99999;transition:transform .6s ease-in,opacity .6s;pointer-events:none;margin:-20px 0 0 -20px;} .pet-heart{position:absolute;bottom:40%;font-size:26px;animation:petHeart 1.3s ease-out forwards;}" +
    "@keyframes petIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @keyframes petHop{0%{transform:scale(1)}30%{transform:scale(1.25,.8)}60%{transform:translateY(-26px) scale(.95,1.1)}100%{transform:scale(1)}} @keyframes petHeart{0%{transform:translateY(0) scale(.5);opacity:1}100%{transform:translateY(-120px) scale(1.2);opacity:0}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---------- 老師端：工具箱裡的「寵物遊戲」 ----------
  function addTool(){
    if(!window.CT) return; var CT = window.CT;
    CT.add({ id: "pets", cat: "fun", icon: "🐾", name: "寵物遊戲", w: 640, h: 620, build: function(bd, win){
      var c = ctx(), sel = c.teacherSel && c.teacherSel(); if(!sel){ bd.textContent = "請先進到一個班級。"; return; }
      var b = base(), cfg = Object.assign({}, DEF), data = {}, names = [], unsubs2 = [], box = h("div");
      bd.appendChild(box);
      unsubs2.push(c.onValue(b + "/cfg", function(v){ cfg = Object.assign({}, DEF, v || {}); draw(); }));
      unsubs2.push(c.onValue(b + "/s", function(v){ data = v || {}; draw(); }));
      c.roster().then(function(r){ names = r.map(String).filter(Boolean); draw(); });
      win.onClose(function(){ unsubs2.forEach(function(u){ try{ u(); }catch(e){} }); });
      function setCfg(p){ c.update(b + "/cfg", p); }
      async function give(name, n){ var path = b + "/s/" + key(name), cur = (await c.get(path)) || { name: name, pts: 0, xp: 0 }; var ev = (cur.ev || []).slice(-7); if(n > 0) ev.push({ t: Date.now(), n: n, w: "老師獎勵" }); await c.update(path, { name: name, pts: Math.max(0, (cur.pts || 0) + n), earned: (cur.earned || 0) + Math.max(0, n), ev: ev }); }
      function draw(){
        var ae = document.activeElement; if(box.contains(ae) && ae.tagName === "INPUT" && (ae.type === "number" || ae.type === "text")) return;
        box.innerHTML = "";
        box.appendChild(h("label", { style: "display:flex;align-items:center;gap:.5em;font-weight:800;font-size:1.1em;margin-bottom:6px;" }, [h("input", { type: "checkbox", checked: cfg.on ? "checked" : null, onchange: function(){ setCfg({ on: this.checked }); } }), "啟用這個班的寵物遊戲（學生畫面左下角會出現 🐾）"]));
        if(cfg.on){
          var rules = h("div", { style: "display:grid;grid-template-columns:repeat(auto-fill,minmax(11em,1fr));gap:6px;margin:6px 0;" });
          [["hw", "繳交作業 +"], ["exam", "交考卷 +"], ["examBonus", "考卷每 10 分再 +"], ["choice", "答對選擇題 +"]].forEach(function(r){ rules.appendChild(h("label", { class: "ct-muted", style: "display:flex;align-items:center;gap:.3em;" }, [r[1], h("input", { class: "ct-inp", type: "number", min: "0", max: "100", value: String(cfg[r[0]]), style: "width:4em;", onchange: function(){ var p = {}; p[r[0]] = Math.max(0, Number(this.value) || 0); setCfg(p); } }), "點"])); });
          var rate = h("select", { class: "ct-inp", onchange: function(){ setCfg({ rate: Number(this.value) }); } }, [h("option", { value: "2", text: "慢（約 2 天餓）" }), h("option", { value: "4", text: "普通（約 1 天餓）" }), h("option", { value: "8", text: "快（約半天餓）" })]); rate.value = String(cfg.rate);
          rules.appendChild(h("label", { class: "ct-muted", style: "display:flex;align-items:center;gap:.3em;" }, ["寵物變餓的速度", rate])); box.appendChild(rules);
          var all = h("input", { class: "ct-inp", type: "number", min: "1", value: "5", style: "width:4em;" });
          box.appendChild(h("div", { class: "ct-row" }, [h("span", { text: "全班一起加" }), all, h("button", { class: "ct-btn pri", text: "給全班", onclick: function(){ var n = Math.max(1, Number(all.value) || 1); if(!confirm("全班每個人都加 " + n + " 點？")) return; names.forEach(function(nm){ give(nm, n); }); } })]));
          var tbl = h("table", { style: "width:100%;border-collapse:collapse;font-size:.95em;" }); tbl.appendChild(h("tr", {}, ["學生", "寵物", "飽足", "點數", "加點"].map(function(t){ return h("th", { style: "text-align:left;padding:4px;border-bottom:2px solid #d9c9b5;", text: t }); })));
          names.forEach(function(nm){
            var r = data[key(nm)] || {}, pet = r.pet, hg = pet ? P.hungerNow(pet, cfg.rate) : null;
            var tr = h("tr"); tr.appendChild(h("td", { style: "padding:4px;font-weight:700;", text: nm }));
            tr.appendChild(h("td", { style: "padding:4px;", text: pet ? pet.sp + " " + pet.nm + "（" + STAGES[P.stageOf(r.xp)].name + "）" : "—" }));
            tr.appendChild(h("td", { style: "padding:4px;color:" + (hg != null && hg < 30 ? "#B23B32" : "inherit") + ";", text: hg == null ? "" : hg + (hg < 30 ? " 😭" : "") }));
            tr.appendChild(h("td", { style: "padding:4px;font-weight:800;color:#C0623A;", text: String(r.pts || 0) }));
            var td = h("td", { style: "padding:4px;white-space:nowrap;" }); [-1, 1, 5, 10].forEach(function(n){ td.appendChild(h("button", { class: "ct-btn", style: "padding:.1em .5em;margin-right:3px;", text: (n > 0 ? "+" : "") + n, onclick: function(){ give(nm, n); } })); }); tr.appendChild(td); tbl.appendChild(tr);
          });
          if(!names.length) box.appendChild(h("div", { class: "ct-muted", text: "這個班還沒有學生名單，請先到班級的「學生」分頁加入名單。" })); else box.appendChild(tbl);
          box.appendChild(h("div", { class: "ct-muted", style: "margin-top:8px;", text: "學生賺點數的方式：交作業、交線上考卷（可依分數加成）、上課選擇題答對，也可以在這裡直接加點（例如抽籤抽到、搶答第一名）。" }));
        } else box.appendChild(h("div", { class: "ct-muted", text: "打開之後，學生登入班級頁面左下角會出現寵物按鈕。" }));
      }
    }});
  }
  if(window.CT) addTool(); else window.addEventListener("load", addTool);
})();
