/* 曼米中文 · 生詞遊戲：分組
   隨機分（依組數或每組人數，可以重抽，鎖定的學生不動）、自己分（點學生再點組別，或直接拖過去）、改組名、
   每個班存一份（teacherPlatform/{老師}/gameGroups/{班級}）。 */
(function(){
  var MG = window.MG;
  var COLORS = ["#E8825A", "#5B9BD5", "#4C8577", "#C8607A", "#F2C14E", "#9B7BD4", "#3FA7A0", "#B0703C", "#7A8B99", "#D46A9F"];
  function color(i){ return COLORS[i % COLORS.length]; }
  function blank(n){ var g = []; for(var i = 0; i < n; i++) g.push({ id: "g" + (i + 1), name: "第 " + (i + 1) + " 組", members: [] }); return { groups: g, locked: {} }; }
  function norm(d){ d = d || {}; var gs = Array.isArray(d.groups) ? d.groups : Object.keys(d.groups || {}).map(function(k){ return d.groups[k]; }); gs = gs.filter(Boolean).map(function(g, i){ return { id: g.id || "g" + (i + 1), name: g.name || "第 " + (i + 1) + " 組", members: Array.isArray(g.members) ? g.members.filter(Boolean) : Object.keys(g.members || {}).map(function(k){ return g.members[k]; }) }; }); return { groups: gs, locked: d.locked || {} }; }
  function groupOf(d, name){ for(var i = 0; i < d.groups.length; i++) if(d.groups[i].members.indexOf(name) >= 0) return d.groups[i]; return null; }
  // 名字比對：「小明 2」也算「小明」（重複名字自動加的編號）
  function baseName(n){ return String(n || "").replace(/\s+\d+$/, "").trim(); }
  function findGroupFor(d, name){ return groupOf(d, name) || groupOf(d, baseName(name)); }
  function nextId(d){ var n = 1; while(d.groups.some(function(g){ return g.id === "g" + n; })) n++; return "g" + n; }

  // 隨機分組：鎖定的學生留在原組，其他人打散平均分
  function randomize(d, names, mode, n, rnd){
    rnd = rnd || Math.random; n = Math.max(1, Math.round(n) || 1);
    var cnt = mode === "size" ? Math.max(1, Math.ceil(names.length / n)) : n;
    var old = d.groups, groups = [];
    for(var i = 0; i < cnt; i++){ var o = old[i]; groups.push({ id: o ? o.id : "g" + (i + 1), name: o ? o.name : "第 " + (i + 1) + " 組", members: [] }); }
    var free = [];
    names.forEach(function(nm){
      if(d.locked[nm]){ var g = groupOf(d, nm), idx = g ? old.indexOf(g) : -1; if(idx >= 0 && idx < cnt){ groups[idx].members.push(nm); return; } }
      free.push(nm);
    });
    MG.shuffle(free, rnd).forEach(function(nm){ var min = groups.reduce(function(a, g){ return g.members.length < a.members.length ? g : a; }, groups[0]); min.members.push(nm); });
    d.groups = groups; return d;
  }

  /* 分組編輯器：editor(box, { names, data, online, extra, onChange })
     names：要分組的人（名單或已加入的學生）；online：{ 名字: true } 標示誰在線上 */
  function editor(box, o){
    var d = norm(o.data); if(!d.groups.length) d = blank(Math.min(4, Math.max(2, Math.ceil((o.names || []).length / 4))));
    var sel = null, mode = "count";
    function names(){ return (o.names || []).slice(); }
    function change(){ if(o.onChange) o.onChange(d); }
    function chip(nm){
      var off = o.online && !o.online[nm];
      return '<span class="gp-chip' + (sel === nm ? " sel" : "") + (d.locked[nm] ? " lock" : "") + (off ? " off" : "") + '" draggable="true" data-nm="' + MG.esc(nm) + '">' + MG.esc(nm) + (d.locked[nm] ? '<span class="lk">鎖</span>' : '') + (o.onKick ? '<button class="x" data-kick="' + MG.esc(nm) + '" title="移出房間">×</button>' : '') + '</span>';
    }
    function render(){
      var all = names(), assigned = {};
      d.groups.forEach(function(g){ g.members = g.members.filter(function(m){ return all.indexOf(m) >= 0 || !o.liveOnly; }); g.members.forEach(function(m){ assigned[m] = 1; }); });
      var un = all.filter(function(n){ return !assigned[n]; });
      box.innerHTML = '<div class="gp-tools"><span class="note">隨機分：</span><div class="mg-seg"><button type="button" data-mode="count"' + (mode === "count" ? ' class="on"' : '') + '>分成幾組</button><button type="button" data-mode="size"' + (mode === "size" ? ' class="on"' : '') + '>每組幾人</button></div>' +
        '<input type="number" class="mg-num" id="gp-n" min="1" max="20" value="' + (mode === "count" ? d.groups.length || 4 : Math.max(1, Math.ceil(all.length / Math.max(1, d.groups.length)))) + '"><button class="mg-btn sm primary" data-act="rand">隨機分組</button><button class="mg-btn sm" data-act="rand">重抽</button>' +
        '<span class="grow" style="flex:1"></span><button class="mg-btn sm" data-act="lock"' + (sel ? '' : ' disabled') + '>' + (sel && d.locked[sel] ? "解除鎖定" : "鎖定選到的學生") + '</button><button class="mg-btn sm" data-act="add">＋ 加一組</button><button class="mg-btn sm ghost" data-act="clear">全部清空</button>' + (o.extra || '') + '</div>' +
        '<p class="note" style="margin:0 0 8px;">點一位學生，再點要去的組（電腦也可以直接拖過去）。點組名可以改名。鎖定的學生重抽時不會被換組。</p>' +
        '<div class="gp-grid">' + (un.length || !d.groups.length ? '<div class="gp-box unassigned" data-g=""><div class="gp-name"><span class="grow">還沒分組（' + un.length + '）</span></div><div class="gp-chips">' + un.map(chip).join("") + '</div></div>' : '') +
        d.groups.map(function(g, i){ return '<div class="gp-box" data-g="' + g.id + '"><div class="gp-name"><span class="dot" style="background:' + color(i) + '"></span><span class="grow" data-ren="' + g.id + '" title="點一下改組名">' + MG.esc(g.name) + '</span><span class="note">' + g.members.length + ' 人</span>' + (g.members.length ? '' : '<button class="mg-btn sm ghost" data-del="' + g.id + '">刪除</button>') + '</div><div class="gp-chips">' + g.members.map(chip).join("") + '</div></div>'; }).join("") + '</div>';
    }
    function moveTo(nm, gid){
      d.groups.forEach(function(g){ g.members = g.members.filter(function(m){ return m !== nm; }); });
      var g = d.groups.filter(function(x){ return x.id === gid; })[0]; if(g) g.members.push(nm);
      sel = null; render(); change();
    }
    box.onclick = async function(e){
      var t;
      if((t = e.target.closest("[data-kick]"))){ e.stopPropagation(); o.onKick(t.dataset.kick); return; }
      if((t = e.target.closest("[data-mode]"))){ mode = t.dataset.mode; render(); return; }
      if((t = e.target.closest("[data-act]"))){
        var a = t.dataset.act;
        if(a === "rand"){ randomize(d, names(), mode, Number(MG.$("#gp-n", box).value) || 2); sel = null; render(); change(); }
        else if(a === "lock" && sel){ if(d.locked[sel]) delete d.locked[sel]; else d.locked[sel] = true; render(); change(); }
        else if(a === "add"){ var id = nextId(d); d.groups.push({ id: id, name: "第 " + (d.groups.length + 1) + " 組", members: [] }); render(); change(); }
        else if(a === "clear"){ d.groups.forEach(function(g){ g.members = []; }); d.locked = {}; render(); change(); }
        return;
      }
      if((t = e.target.closest("[data-del]"))){ d.groups = d.groups.filter(function(g){ return g.id !== t.dataset.del; }); render(); change(); return; }
      if((t = e.target.closest("[data-ren]"))){ var g = d.groups.filter(function(x){ return x.id === t.dataset.ren; })[0]; var nn = await MG.ask("組名", g.name, "改名"); if(nn){ g.name = nn.slice(0, 20); render(); change(); } return; }
      if((t = e.target.closest(".gp-chip"))){ sel = sel === t.dataset.nm ? null : t.dataset.nm; render(); return; }
      if((t = e.target.closest(".gp-box")) && sel){ moveTo(sel, t.dataset.g); return; }
    };
    box.ondragstart = function(e){ var c = e.target.closest(".gp-chip"); if(!c) return; e.dataTransfer.setData("text/plain", c.dataset.nm); e.dataTransfer.effectAllowed = "move"; };
    box.ondragover = function(e){ var b = e.target.closest(".gp-box"); if(!b) return; e.preventDefault(); MG.$$(".gp-box.target", box).forEach(function(x){ if(x !== b) x.classList.remove("target"); }); b.classList.add("target"); };
    box.ondragleave = function(e){ var b = e.target.closest(".gp-box"); if(b && !b.contains(e.relatedTarget)) b.classList.remove("target"); };
    box.ondrop = function(e){ var b = e.target.closest(".gp-box"); if(!b) return; e.preventDefault(); var nm = e.dataTransfer.getData("text/plain"); if(nm) moveTo(nm, b.dataset.g); };
    render();
    return { data: function(){ return d; }, set: function(nd){ d = norm(nd); render(); }, setNames: function(n, online){ o.names = n; if(online) o.online = online; render(); }, render: render };
  }

  function path(){ var G = MG.G; return G.ctx && G.ctx.t && G.ctx.cls ? "teacherPlatform/" + G.ctx.t + "/gameGroups/" + G.ctx.cls.c : null; }
  async function load(){ var p = path(); if(!p) return null; var v = await MG.fb.get(p).catch(function(){ return null; }); return v ? norm(v) : null; }
  async function save(d){ var p = path(); if(!p) return false; try{ await MG.fb.set(p, { groups: d.groups, locked: d.locked || {}, at: Date.now() }); return true; }catch(e){ return false; } }

  // 平台設定頁的「分組」：用班級名單先分好，存起來；開即時遊戲時學生一加入就自動進到分好的組
  async function openEditor(){
    var G = MG.G, roster = (G.ctx.roster || []).slice();
    var saved = await load();
    var dlg = MG.dialog('<h3>分組（' + MG.esc(G.ctx.cls ? G.ctx.cls.name : "") + '）</h3>' + (roster.length ? '' : '<p class="note">這個班還沒有學生名單（班級 → 學生）。可以先在即時遊戲的等待室，等學生加入後再分組。</p>') + '<div id="gp-ed"></div><div class="mg-row end"><span class="note" style="margin-right:auto;">每個班存一份。學生加入即時遊戲時，名字一樣的會自動進到這裡分好的組。</span><button class="mg-btn" data-close>關閉</button><button class="mg-btn primary" id="gp-save">儲存分組</button></div>', { wide: true });
    var ed = editor(MG.$("#gp-ed", dlg), { names: roster.concat(extraNames(saved, roster)), data: saved });
    MG.$("#gp-save", dlg).onclick = async function(){ if(await save(ed.data())){ MG.toast("分組已儲存"); dlg.close(); } else MG.toast("存檔失敗，請檢查網路"); };
  }
  function extraNames(d, roster){ var out = []; if(!d) return out; d.groups.forEach(function(g){ g.members.forEach(function(m){ if(roster.indexOf(m) < 0 && out.indexOf(m) < 0) out.push(m); }); }); return out; }

  MG.Groups = { editor: editor, randomize: randomize, load: load, save: save, openEditor: openEditor, norm: norm, groupOf: groupOf, findGroupFor: findGroupFor, baseName: baseName, color: color, blank: blank };
})();
