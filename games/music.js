/* 曼米中文 · 生詞遊戲：背景音樂
   用 WebAudio 即時合成（不用音檔、沒有版權問題）。每首曲子 4 小節循環：旋律＋低音＋和弦＋鼓。
   MG.music.play("happy")、MG.music.stop()、MG.music.fast(true)（最後 10 秒加快）、MG.music.on 開關 */
(function(){
  var MG = window.MG;
  // 共用一個 AudioContext（音效也用這個）；第一次點畫面時解鎖，瀏覽器才肯出聲
  var ctx = null;
  MG.audioCtx = function(){
    if(!ctx){ try{ ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return null; } }
    if(ctx.state === "suspended") try{ ctx.resume(); }catch(e){}
    return ctx;
  };
  // 瀏覽器（尤其 iPad／iPhone）要在「點一下」的當下才肯讓網頁出聲：任何一種點擊、按鍵都順便解鎖聲音
  // （在點擊當下建立 AudioContext、播一段無聲的音，iOS 才算解鎖；卡片用的 pointerdown 在 iOS 不算，所以 touchend、click 也要聽）
  var unlockedOnce = false;
  function unlock(){
    var c = MG.audioCtx(); if(!c) return;
    if(c.state !== "running") try{ c.resume(); }catch(e){}
    if(!unlockedOnce){ try{ var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); unlockedOnce = true; }catch(e){} }
  }
  ["pointerdown", "pointerup", "touchend", "click", "keydown"].forEach(function(ev){ document.addEventListener(ev, unlock, true); });
  MG.audioReady = function(){ return !!(ctx && ctx.state === "running"); };
  // 遊戲開始時聲音還沒解鎖（例如上課中自動加入、還沒點過畫面）：上方出現小提示，點一下就有聲音
  MG.audioHint = function(root){
    if(MG.audioReady() || !root) return;
    var h = document.createElement("div"); h.className = "gm-sndhint"; h.textContent = "點一下畫面就有聲音"; root.appendChild(h);
    var t = setInterval(function(){ if(MG.audioReady() || !h.isConnected){ clearInterval(t); h.remove(); } }, 300);
  };

  // 旋律寫法：音階的第幾音（1～7），後面加 + 高八度、- 低八度；「.」是休止（每格是八分音符，32 格＝4 小節）
  var MAJOR = [0, 2, 4, 5, 7, 9, 11], MINOR = [0, 2, 3, 5, 7, 8, 10];
  function parse(str, key, scale){
    return str.replace(/\|/g, " ").trim().split(/\s+/).map(function(t){
      if(t === ".") return null;
      var m = /^([1-7])([+-]*)$/.exec(t); if(!m) return null;
      var oct = (m[2].match(/\+/g) || []).length - (m[2].match(/-/g) || []).length;
      return key + scale[Number(m[1]) - 1] + 12 * oct;
    });
  }
  // chords：每小節的和弦（根音、是不是小調）
  MG.MUSIC = {
    happy: { name: "快樂", bpm: 128, key: 72, scale: MAJOR, drums: true, wave: "triangle",
      mel: "3 5 1+ 5 6 5 3 . | 2 4 7 4 5 . 2 . | 1 3 6 3 5 3 1 . | 4 6 1+ 6 5 . . .",
      chords: [[48, 0], [43, 0], [45, 1], [41, 0]] },
    adventure: { name: "冒險", bpm: 138, key: 69, scale: MINOR, drums: true, wave: "square",
      mel: "1 . 3 5 4 3 1 . | 6- . 1 3 2 1 6- . | 3 . 5 1+ 7 5 3 . | 7- . 2 5 4 2 7- .",
      chords: [[45, 1], [41, 0], [48, 0], [43, 0]] },
    relax: { name: "放鬆", bpm: 92, key: 72, scale: MAJOR, drums: false, wave: "sine",
      mel: "5 . . 3 . . 1 . | 6 . . 4 . . 2 . | 4 . . 2 . . 7- . | 5 . 6 . 7 . 1+ .",
      chords: [[41, 0], [38, 1], [46, 0], [48, 0]] },
    space: { name: "太空", bpm: 112, key: 62, scale: MINOR, drums: true, wave: "sawtooth",
      mel: "1 5 1+ 5 3+ 5 1+ 5 | 7- 4 7 4 2+ 4 7 4 | 6- 3 6 3 1+ 3 6 3 | 7- 4 7 4 2+ 4 5 7",
      chords: [[50, 1], [48, 0], [46, 0], [48, 0]] }
  };
  MG.MUSIC.ocean = { name: "海洋", bpm: 100, key: 67, scale: MAJOR, drums: false, wave: "sine",
    mel: "1 3 5 . 3 5 1+ . | 6- 1 4 . 1 4 6 . | 4- 6- 2 . 6- 2 4 . | 5- 7- 2 . 5 . 4 .",
    chords: [[43, 0], [40, 1], [36, 0], [38, 0]] };
  MG.MUSIC_ORDER = ["happy", "adventure", "relax", "space", "ocean"];

  var st = { track: null, timer: null, step: 0, next: 0, fast: false, master: null, mel: null };
  function freq(m){ return 440 * Math.pow(2, (m - 69) / 12); }
  function note(t, m, dur, type, vol){
    var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = freq(m);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(st.master); o.start(t); o.stop(t + dur + 0.05);
  }
  function kick(t){ var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16); o.connect(g); g.connect(st.master); o.start(t); o.stop(t + 0.2); }
  var noiseBuf = null;
  function hat(t){
    if(!noiseBuf){ noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate); var d = noiseBuf.getChannelData(0); for(var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = "highpass"; f.frequency.value = 7000;
    g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04); s.connect(f); f.connect(g); g.connect(st.master); s.start(t);
  }
  function schedule(){
    var T = MG.MUSIC[st.track]; if(!T || !ctx) return;
    var stepDur = 60 / (T.bpm * (st.fast ? 1.22 : 1)) / 2;
    while(st.next < ctx.currentTime + 0.2){
      var i = st.step % 32, bar = Math.floor(i / 8), ch = T.chords[bar], t = st.next;
      var m = st.mel[i]; if(m != null) note(t, m, stepDur * 1.6, T.wave, T.wave === "square" || T.wave === "sawtooth" ? 0.05 : 0.11);
      if(i % 2 === 0) note(t, ch[0] - 12 + (i % 4 === 2 ? 7 : 0), stepDur * 1.8, "sine", 0.22);   // 低音：根音、五度
      if(i % 8 === 0){ [0, ch[1] ? 3 : 4, 7].forEach(function(iv){ note(t, ch[0] + 12 + iv, stepDur * 7.5, "sine", 0.035); }); }   // 和弦
      if(T.drums){ if(i % 4 === 0) kick(t); if(i % 2 === 1) hat(t); }
      st.next += stepDur; st.step++;
    }
  }
  MG.music = {
    on: true,
    playing: function(){ return !!st.track; },
    play: function(track){
      MG.music.stop();
      if(!track || !MG.MUSIC[track] || !MG.music.on) return;
      if(!MG.audioCtx()) return;
      var T = MG.MUSIC[track];
      st.master = ctx.createGain(); st.master.gain.value = 0.5;
      var comp = ctx.createDynamicsCompressor(); st.master.connect(comp); comp.connect(ctx.destination); st.out = comp;
      st.track = track; st.step = 0; st.next = ctx.currentTime + 0.08; st.fast = false; st.mel = parse(T.mel, T.key, T.scale);
      schedule(); st.timer = setInterval(schedule, 40);
    },
    stop: function(){
      clearInterval(st.timer); st.timer = null;
      if(st.master){ var m = st.master, o = st.out; try{ m.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08); }catch(e){} setTimeout(function(){ try{ m.disconnect(); o.disconnect(); }catch(e){} }, 400); }
      st.master = null; st.track = null;
    },
    fast: function(v){ st.fast = !!v; },
    // 試聽 6 秒
    preview: function(track){ MG.music.play(track); clearTimeout(st.pv); st.pv = setTimeout(function(){ if(st.track === track) MG.music.stop(); }, 6000); }
  };
  // 遊戲畫面上的「音樂 開／關」
  MG.musicBtn = function(track){ return track ? '<button class="mg-btn sm ghost gm-mus">' + (MG.music.on ? "音樂 開" : "音樂 關") + '</button>' : ''; };
  MG.bindMusicBtn = function(root, track){
    var b = MG.$(".gm-mus", root); if(!b) return;
    b.onclick = function(){ MG.music.on = !MG.music.on; b.textContent = MG.music.on ? "音樂 開" : "音樂 關"; if(MG.music.on) MG.music.play(track); else MG.music.stop(); };
  };
  // 每次打開遊戲，音樂和音效都是開的；玩家關掉只在這次有效（不記住，下次打開又是開的）
  try{ localStorage.removeItem("mm_game_music"); }catch(e){}
})();
