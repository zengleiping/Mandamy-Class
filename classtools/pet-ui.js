/* 寵物遊戲：學生端完整遊戲畫面（場景、走動的寵物、餵食／玩耍／摸摸、衣櫃、商店、每日簽到與任務、成就、排行榜、三種外觀）。 */
(function(){
  "use strict";
  var P = window.PET, A = window.PETART; if(!P || !A) return;
  var h = P.h, esc = P.esc, U = P.UI = {};
  var STYLE_KEY = "mm_pet_style", MUTE_KEY = "mm_pet_mute";
  var root = null, sheet = null, sheetName = "", fx = null, petEl = null, walker = null, sig = "", style = "", override = null, lastTouch = Date.now(), walkTimer = null, idleTimer = null, flushTimer = null, pend = { love: 0, pats: 0 }, lbData = null, lbSort = "xp", shownPts = null, ptsAnim = 0, achBusy = false, busyAct = false;
  try{ style = localStorage.getItem(STYLE_KEY) || ""; }catch(e){} if(style) style = A.norm(style);
  function curStyle(){ return A.norm(style || P.cfg.style || "outline"); }
  function muted(){ try{ return localStorage.getItem(MUTE_KEY) === "1"; }catch(e){ return false; } }

  // ---------- 音效（Web Audio 即時合成）----------
  var ac = null;
  function AC(){ try{ if(!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if(ac.state === "suspended") ac.resume(); }catch(e){} return ac; }
  function tone(f, d, type, vol, delay, slide){ if(muted()) return; var a = AC(); if(!a) return; var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (delay || 0); o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if(slide) o.frequency.exponentialRampToValueAtTime(slide, t + d); o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.start(t); o.stop(t + d + 0.03); }
  function noise(d, vol, delay, freq){ if(muted()) return; var a = AC(); if(!a) return; var len = Math.floor(a.sampleRate * d), b = a.createBuffer(1, len, a.sampleRate), ch = b.getChannelData(0); for(var i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len); var s = a.createBufferSource(); s.buffer = b; var f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq || 1800; var g = a.createGain(); g.gain.value = vol || 0.3; s.connect(f); f.connect(g); g.connect(a.destination); s.start(a.currentTime + (delay || 0)); }
  var SFX = {
    tap: function(){ tone(520 + Math.random() * 260, 0.09, "triangle", 0.2, 0, 900); },
    eat: function(){ for(var i = 0; i < 4; i++) noise(0.07, 0.35, i * 0.14, 2200 + i * 200); tone(330, 0.1, "sine", 0.12, 0.6, 520); },
    coin: function(){ tone(988, 0.09, "square", 0.1); tone(1319, 0.2, "square", 0.1, 0.08); },
    buy: function(){ [523, 659, 784, 1047].forEach(function(f, i){ tone(f, 0.16, "triangle", 0.2, i * 0.07); }); },
    claim: function(){ [659, 784, 988, 1319].forEach(function(f, i){ tone(f, 0.14, "square", 0.1, i * 0.08); }); },
    evolve: function(){ [392, 523, 659, 784, 1047, 784, 1047, 1319].forEach(function(f, i){ tone(f, 0.22, "triangle", 0.22, i * 0.11); }); },
    ach: function(){ [784, 988, 1175, 1568].forEach(function(f, i){ tone(f, 0.2, "triangle", 0.2, i * 0.1); }); },
    play: function(){ for(var i = 0; i < 4; i++) tone(260 + i * 60, 0.12, "sine", 0.2, i * 0.16, 520 + i * 60); },
    sad: function(){ tone(400, 0.3, "sine", 0.15, 0, 260); },
    pop: function(){ tone(700, 0.06, "sine", 0.15, 0, 1200); }
  };
  U.sfx = SFX;

  // ---------- 場景（SVG 背景）----------
  function cloud(x, y, s, cls){ return '<g class="pg-cloud ' + cls + '" transform="translate(' + x + " " + y + ") scale(" + s + ')"><ellipse cx="0" cy="0" rx="46" ry="15" fill="#fff"/><ellipse cx="22" cy="-12" rx="26" ry="17" fill="#fff"/><ellipse cx="-20" cy="-9" rx="20" ry="13" fill="#fff"/></g>'; }
  var SCENES = {
    grass: function(){ var f = ""; [[40, 600], [120, 640], [210, 610], [300, 650], [360, 600], [70, 670], [260, 680]].forEach(function(p, i){ f += '<g transform="translate(' + p[0] + " " + p[1] + ')"><circle r="5" cx="0" cy="0" fill="' + ["#FF8FB0", "#FFD23F", "#fff", "#B58CFF"][i % 4] + '"/><circle r="2" fill="#FFB400"/><path d="M0 5 L0 16" stroke="#4E9B3C" stroke-width="2"/></g>'; });
      return '<defs><linearGradient id="sgA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset=".75" stop-color="#e9f8ff"/></linearGradient></defs><rect width="400" height="700" fill="url(#sgA)"/><circle cx="320" cy="96" r="54" fill="#FFE27A" opacity=".35"/><circle cx="320" cy="96" r="36" fill="#FFE27A"/>' + cloud(80, 130, 1, "c1") + cloud(250, 190, .8, "c2") + '<path d="M0 470 Q100 400 220 450 T400 440 L400 700 L0 700Z" fill="#A5E093"/><path d="M0 520 Q140 470 260 510 T400 500 L400 700 L0 700Z" fill="#84D06F"/><rect y="560" width="400" height="140" fill="#6BBF59"/>' + f; },
    beach: function(){ return '<defs><linearGradient id="sgB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd0ff"/><stop offset="1" stop-color="#e8f9ff"/></linearGradient></defs><rect width="400" height="700" fill="url(#sgB)"/><circle cx="90" cy="90" r="40" fill="#FFE27A"/>' + cloud(260, 120, .9, "c1") + '<rect y="400" width="400" height="120" fill="#3AAFE0"/><path class="pg-wave" d="M0 410 Q25 394 50 410 T100 410 T150 410 T200 410 T250 410 T300 410 T350 410 T400 410 L400 440 L0 440Z" fill="#7CD3F5" opacity=".9"/><path d="M0 500 Q100 470 200 500 T400 495 L400 700 L0 700Z" fill="#F6E1A5"/><rect y="540" width="400" height="160" fill="#F0D58C"/><g transform="translate(330 380)"><path d="M0 130 Q6 60 -4 0" stroke="#8a5a3a" stroke-width="10" fill="none"/><path d="M-4 0 Q-50 -20 -64 20 Q-30 -4 -4 0Z M-4 0 Q40 -30 70 4 Q30 -8 -4 0Z M-4 0 Q-20 -50 -2 -60 Q0 -30 -4 0Z" fill="#3FA55A"/></g><g fill="#FF9DB0"><circle cx="70" cy="620" r="7"/><circle cx="300" cy="650" r="6"/></g><path d="M130 610 q12 -14 24 0z" fill="#fff"/>'; },
    garden: function(){ var f = ""; for(var i = 0; i < 22; i++){ var x = 12 + (i * 37) % 380, y = 560 + (i * 53) % 130, c = ["#FF8FB0", "#FFD23F", "#fff", "#B58CFF", "#FF9A5C"][i % 5]; f += '<g transform="translate(' + x + " " + y + ')"><path d="M0 6 L0 24" stroke="#4E9B3C" stroke-width="2.5"/>' + [0, 72, 144, 216, 288].map(function(a){ return '<ellipse cx="0" cy="-6" rx="4" ry="7" fill="' + c + '" transform="rotate(' + a + ')"/>'; }).join("") + '<circle r="3.4" fill="#FFB400"/></g>'; }
      return '<defs><linearGradient id="sgG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD9EA"/><stop offset="1" stop-color="#FFF6FA"/></linearGradient></defs><rect width="400" height="700" fill="url(#sgG)"/>' + cloud(90, 110, .9, "c1") + cloud(280, 170, .7, "c2") + '<path d="M0 480 Q120 440 240 478 T400 470 L400 700 L0 700Z" fill="#C6EBB0"/><rect y="560" width="400" height="140" fill="#A9DB8E"/><g stroke="#fff" stroke-width="6"><path d="M10 500 L10 560 M50 495 L50 560 M90 492 L90 560 M130 494 L130 560 M170 498 L170 560"/><path d="M0 515 L190 512 M0 540 L190 538"/></g>' + f + '<g class="pg-fly"><path d="M300 300 q-14 -16 -24 0 q10 12 24 0 q14 -16 24 0 q-10 12 -24 0z" fill="#FF9DD0"/></g>'; },
    space: function(){ var s = ""; for(var i = 0; i < 46; i++){ s += '<circle class="pg-star" style="animation-delay:' + ((i * 0.37) % 3) + 's" cx="' + ((i * 83) % 400) + '" cy="' + ((i * 131) % 520) + '" r="' + (1 + (i % 3) * .7) + '" fill="#fff"/>'; }
      return '<defs><linearGradient id="sgS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f0c33"/><stop offset="1" stop-color="#4a2f85"/></linearGradient></defs><rect width="400" height="700" fill="url(#sgS)"/>' + s + '<g transform="translate(300 130)"><circle r="42" fill="#FFB35C"/><ellipse rx="70" ry="14" fill="none" stroke="#FFE0A8" stroke-width="6" transform="rotate(-20)"/><circle cx="-12" cy="-10" r="8" fill="#E0883A" opacity=".6"/></g><circle cx="70" cy="190" r="20" fill="#E6E6F2"/><circle cx="62" cy="184" r="4" fill="#C9C9DA"/><path d="M0 520 Q100 480 200 515 T400 505 L400 700 L0 700Z" fill="#7B5CC9"/><rect y="560" width="400" height="140" fill="#5E43A8"/><g fill="#9B80E0"><circle cx="60" cy="600" r="14"/><circle cx="330" cy="640" r="18"/><circle cx="200" cy="670" r="10"/></g>'; },
    castle: function(){ return '<defs><linearGradient id="sgC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE3B8"/><stop offset=".6" stop-color="#F6D2F0"/><stop offset="1" stop-color="#D9C2FF"/></linearGradient></defs><rect width="400" height="700" fill="url(#sgC)"/>' + cloud(90, 120, 1, "c1") + cloud(300, 170, .8, "c2") + '<g transform="translate(200 330)"><rect x="-90" y="20" width="180" height="150" fill="#E8D9F7" stroke="#B9A3DD" stroke-width="3"/><rect x="-120" y="-20" width="50" height="190" fill="#D9C4F0" stroke="#B9A3DD" stroke-width="3"/><rect x="70" y="-20" width="50" height="190" fill="#D9C4F0" stroke="#B9A3DD" stroke-width="3"/><path d="M-130 -20 L-95 -80 L-60 -20Z M60 -20 L95 -80 L130 -20Z" fill="#E0524A"/><rect x="-30" y="-50" width="60" height="100" fill="#D9C4F0" stroke="#B9A3DD" stroke-width="3"/><path d="M-40 -50 L0 -120 L40 -50Z" fill="#E0524A"/><path d="M0 -120 L0 -150 L22 -142 L0 -134" fill="#FFD23F" stroke="#E0A82E" stroke-width="2"/><path d="M-28 170 L-28 110 Q0 80 28 110 L28 170Z" fill="#8A5A3A"/><rect x="-100" y="60" width="14" height="24" rx="7" fill="#FFE98A"/><rect x="86" y="60" width="14" height="24" rx="7" fill="#FFE98A"/></g><path d="M0 520 Q120 490 240 515 T400 510 L400 700 L0 700Z" fill="#B7E6A0"/><rect y="560" width="400" height="140" fill="#9BD883"/><path d="M200 520 Q170 600 120 700 L280 700 Q230 600 200 520Z" fill="#F0E2C4" opacity=".85"/>'; }
  };
  function sceneHtml(id, inv){ var ps = window.PETSCENE; if(!ps) return '<svg class="pg-bg" viewBox="0 0 400 700" preserveAspectRatio="xMidYMax slice">' + (SCENES[id] || SCENES.grass)() + "</svg>"; var sc = ps.scene(id), sd = ps.scene(id, true);
    return '<svg class="pg-bg" viewBox="-400 0 1200 700" preserveAspectRatio="xMidYMax slice"><defs><clipPath id="pscc"><rect x="0" y="0" width="400" height="700"/></clipPath></defs><g transform="scale(-1 1)"><g clip-path="url(#pscc)">' + sd + '</g></g><g transform="translate(800 0) scale(-1 1)"><g clip-path="url(#pscc)">' + sd + '</g></g><g clip-path="url(#pscc)">' + sc + "</g>" + ps.furn(inv) + "</svg>"; }


  // ---------- 介面圖示（跟寵物同一套畫法：黑色圓角外框＋色塊＋一彎陰影）----------
  var INK = "#1b1212", ICU = 0;
  function icShade(d, f){ var id = "pu" + (++ICU); return '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath><path d="' + d + '" fill="' + A.shade(f, -34) + '"/><g clip-path="url(#' + id + ')"><path d="' + d + '" fill="' + f + '" transform="translate(-3 -2.5)"/></g><path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>'; }
  function icLine(d, c, w){ return '<path d="' + d + '" fill="none" stroke="' + (c || INK) + '" stroke-width="' + (w || 2.6) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
  function icCircle(cx, cy, r, f, shaded){ return shaded ? icShade("M" + (cx - r) + " " + cy + "a" + r + " " + r + " 0 1 0 " + (r * 2) + " 0a" + r + " " + r + " 0 1 0 " + (-r * 2) + " 0Z", f) : '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '" stroke="' + INK + '" stroke-width="2.6"/>'; }
  function gearPath(){ var pts = [], n = 8, R = 20, r = 14.5; for(var i = 0; i < n; i++){ var a = i / n * 2 * Math.PI - Math.PI / 2, w = Math.PI / n * 0.5; [[a - w * 1.5, r], [a - w * 0.8, R], [a + w * 0.8, R], [a + w * 1.5, r]].forEach(function(q){ pts.push((24 + Math.cos(q[0]) * q[1]).toFixed(1) + " " + (24 + Math.sin(q[0]) * q[1]).toFixed(1)); }); } return "M" + pts.join("L") + "Z"; }
  function icScene(sky, inner){ var id = "pu" + (++ICU), d = "M9 5H39Q44 5 44 10V38Q44 43 39 43H9Q4 43 4 38V10Q4 5 9 5Z"; return '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath><g clip-path="url(#' + id + ')"><rect width="48" height="48" fill="' + sky + '"/>' + inner + '</g><path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="2.6"/>'; }
  var ICONS = {
    feed: function(){ return icCircle(16, 20, 5, "#C98A52") + icCircle(25, 15, 5.5, "#B97A44") + icCircle(33, 20, 5, "#C98A52") + icShade("M5 24H43Q43 41 24 42Q5 41 5 24Z", "#FF9A80"); },
    play: function(){ return icCircle(24, 25, 16, "#C9E46A", true) + icLine("M11.5 15Q22 25 11.5 35", "#fff", 2.6) + icLine("M36.5 15Q26 25 36.5 35", "#fff", 2.6); },
    wear: function(){ return icShade("M16 7L5 14L10 22L15 20V41H33V20L38 22L43 14L32 7Q24 13 16 7Z", "#7EC8F0"); },
    shop: function(){ return icLine("M16 19V13Q16 6 24 6Q32 6 32 13V19") + icShade("M9 16H39L41 40Q41 43 38 43H10Q7 43 7 40Z", "#FFB36B") + icLine("M18 26Q24 32 30 26"); },
    quest: function(){ return icShade("M9 9H39Q41 9 41 11V41Q41 43 39 43H9Q7 43 7 41V11Q7 9 9 9Z", "#FFF1D0") + icShade("M17 4H31Q33 4 33 6V11Q33 13 31 13H17Q15 13 15 11V6Q15 4 17 4Z", "#B98482") + icLine("M14 24L18 28L25 20", "#3FA25F", 3.2) + icLine("M29 25H34") + icLine("M14 36H34"); },
    rank: function(){ return icLine("M13 11H6Q6 22 14 24") + icLine("M35 11H42Q42 22 34 24") + icShade("M12 6H36V20Q36 31 24 31Q12 31 12 20Z", "#FFD23F") + icShade("M20 31H28V37H20Z", "#E0A82E") + icShade("M13 37H35Q37 37 37 39V41Q37 43 35 43H13Q11 43 11 41V39Q11 37 13 37Z", "#FFD23F"); },
    ach: function(){ return icShade("M12 3L22 22L28 19L19 3Z", "#7EC8F0") + icShade("M36 3L26 22L20 19L29 3Z", "#FF9A80") + icCircle(24, 31, 12, "#FFD23F", true) + icLine("M24 25L26 29.5L31 30L27.3 33.3L28.4 38L24 35.5L19.6 38L20.7 33.3L17 30L22 29.5Z", INK, 2); },
    set: function(){ return icShade(gearPath(), "#B8C2CC") + icCircle(24, 24, 6, "#FFF6E4"); },

    cookie: function(){ return icCircle(24, 25, 17, "#E3B06B", true) + '<g fill="#6B3F22"><circle cx="17" cy="19" r="2.6"/><circle cx="30" cy="17" r="2.6"/><circle cx="25" cy="29" r="2.6"/><circle cx="15" cy="31" r="2.3"/><circle cx="34" cy="28" r="2.3"/></g>'; },
    apple: function(){ return icLine("M24 14Q24 8 28 4") + icShade("M24 14C16 9 6 13 7 25C8 36 16 43 24 41C32 43 40 36 41 25C42 13 32 9 24 14Z", "#FF6B6B") + icShade("M28 9Q35 4 39 9Q33 13 28 9Z", "#7ACB6B"); },
    steak: function(){ return icLine("M29 30L40 41", INK, 10) + icLine("M29 30L40 41", "#FFF6E4", 5) + icShade("M6 20Q6 7 21 7Q37 8 37 22Q37 33 26 36Q13 39 8 29Q6 25 6 20Z", "#D9604C") + icCircle(20, 19, 5, "#F2A89A"); },
    cake: function(){ return icShade("M7 28H41V40Q41 42 39 42H9Q7 42 7 40Z", "#E8A0A8") + icShade("M9 16H39Q41 16 41 18V28H7V18Q7 16 9 16Z", "#FFF1D0") + icLine("M7 22Q13 27 18 22Q24 27 30 22Q36 27 41 22", "#E8A0A8", 2.4) + icCircle(24, 10, 4.2, "#E0524A"); },
    bento: function(){ return icCircle(15, 17, 7, "#FFFFFF") + icCircle(31, 17, 7, "#FFD23F") + icShade("M5 20H43V38Q43 41 40 41H8Q5 41 5 38Z", "#FFB36B") + icLine("M5 27H43", INK, 2.2); },
    potion: function(){ return icShade("M19 7H29V17L38 36Q41 43 34 43H14Q7 43 10 36L19 17Z", "#FF7AA8") + icShade("M17 3H31Q32 3 32 4V8Q32 9 31 9H17Q16 9 16 8V4Q16 3 17 3Z", "#B98482") + '<circle cx="20" cy="33" r="2.4" fill="#fff"/><circle cx="27" cy="28" r="1.8" fill="#fff"/>'; },
    ticket: function(){ return icShade("M5 12H43V20Q39 24 43 28V36H5V28Q9 24 5 20Z", "#7EC8F0") + icShade("M24 15L26.6 21L33 21.6L28.2 25.8L29.6 32L24 28.8L18.4 32L19.8 25.8L15 21.6L21.4 21Z", "#FFD23F"); },
    house: function(){ return icShade("M9 23L24 9L39 23V40Q39 42 37 42H11Q9 42 9 40Z", "#FFE9C2") + icShade("M3 25L24 4L45 25Q45 28 42 26L24 10L6 26Q3 28 3 25Z", "#E0524A") + icShade("M20 42V31Q20 29 22 29H26Q28 29 28 31V42Z", "#B98482"); },
    egg: function(){ return icShade("M24 4C34 4 40 20 40 30C40 38 33 43 24 43C15 43 8 38 8 30C8 20 14 4 24 4Z", "#FFF1D0") + '<g fill="#F2A89A"><circle cx="19" cy="26" r="3"/><circle cx="29" cy="20" r="2.4"/><circle cx="28" cy="33" r="2.8"/></g>'; },
    gift: function(){ return icShade("M7 20H41V41Q41 43 39 43H9Q7 43 7 41Z", "#FF7A9A") + icShade("M5 14H43V20H5Z", "#FFB3C7") + icShade("M21 14H27V43H21Z", "#FFD23F") + icLine("M24 14Q15 2 12 8Q12 14 24 14Q33 2 36 8Q36 14 24 14Z"); },
    lock: function(){ return icLine("M15 21V15Q15 6 24 6Q33 6 33 15V21", INK, 3.2) + icShade("M10 21H38Q40 21 40 23V40Q40 42 38 42H10Q8 42 8 40V23Q8 21 10 21Z", "#B8C2CC") + icCircle(24, 30, 3, INK); },
    coin: function(){ return icCircle(24, 24, 18, "#FFD23F", true) + '<circle cx="24" cy="24" r="11" fill="none" stroke="#1b1212" stroke-width="2"/>' + icLine("M24 19V29", INK, 2.6); },
    calendar: function(){ return icShade("M8 10H40Q42 10 42 12V40Q42 42 40 42H8Q6 42 6 40V12Q6 10 8 10Z", "#FFF1D0") + icShade("M6 12Q6 10 8 10H40Q42 10 42 12V19H6Z", "#FF7A6A") + icLine("M15 5V13M33 5V13") + icCircle(24, 30, 4, "#FF7A6A"); },
    bolt: function(){ return icShade("M27 3L9 27H21L18 45L39 19H26Z", "#FFD23F"); },
    sparkle: function(){ return icShade("M24 4L28.5 19.5L44 24L28.5 28.5L24 44L19.5 28.5L4 24L19.5 19.5Z", "#FFE98A"); },
    grass: function(){ return icScene("#DDF1FF", '<path d="M0 34Q24 24 48 34V48H0Z" fill="#8FD07A"/><circle cx="14" cy="32" r="3" fill="#FFB3C7"/><circle cx="33" cy="35" r="3" fill="#FFD23F"/>'); },
    beach: function(){ return icScene("#9ADBF7", '<rect y="25" width="48" height="9" fill="#4BB7E8"/><path d="M0 34Q24 30 48 36V48H0Z" fill="#F7E2A8"/><circle cx="36" cy="14" r="5" fill="#FFD23F"/>'); },
    garden: function(){ return icScene("#FFE3EE", '<path d="M0 32Q24 25 48 32V48H0Z" fill="#BFE8A6"/><circle cx="13" cy="30" r="3.4" fill="#FF7A9A"/><circle cx="24" cy="34" r="3.4" fill="#FFD23F"/><circle cx="35" cy="29" r="3.4" fill="#C3A0FF"/>'); },
    space: function(){ return icScene("#2E2570", '<g fill="#fff"><circle cx="11" cy="12" r="1.4"/><circle cx="20" cy="30" r="1.2"/><circle cx="37" cy="36" r="1.4"/><circle cx="14" cy="38" r="1"/></g><circle cx="31" cy="19" r="8" fill="#FFB35C"/><path d="M21 21Q31 27 42 17" fill="none" stroke="#FFE0A8" stroke-width="2.4"/>'); },
    castle: function(){ return icScene("#F6D2F0", '<path d="M0 38Q24 33 48 38V48H0Z" fill="#CDEBB0"/><path d="M13 40V22H17V19H21V22H27V19H31V22H35V40Z" fill="#E8D9F7" stroke="#1b1212" stroke-width="1.6"/><path d="M21 40V32Q24 28 27 32V40Z" fill="#B98482"/>'); },
    room: function(){ return icScene("#FFE4C4", '<rect y="34" width="48" height="14" fill="#E3AA6E"/><rect x="26" y="9" width="14" height="16" fill="#BFE6FF" stroke="#1b1212" stroke-width="1.8"/><path d="M33 9V25M26 17H40" stroke="#1b1212" stroke-width="1.4"/><rect x="8" y="14" width="10" height="9" fill="#CDEBB0" stroke="#1b1212" stroke-width="1.6"/>'); },
    bed: function(){ return icShade("M5 30H43V40H5Z", "#B98482") + icShade("M5 14H12V40H5Z", "#B98482") + icShade("M12 24Q26 14 43 24V34H12Z", "#7EC8F0") + icCircle(20, 22, 5, "#FFF6E4"); },
    plant: function(){ return icShade("M24 30Q8 24 10 10Q22 12 24 30Z", "#4FB36E") + icShade("M24 30Q40 22 38 6Q26 10 24 30Z", "#6CC36B") + icShade("M13 30H35L31 44H17Z", "#FF9A80"); },
    lamp: function(){ return icLine("M24 20V40", INK, 3.4) + icShade("M14 40H34V43H14Z", "#B98482") + icShade("M12 20L16 6H32L36 20Z", "#FFE98A"); },
    toybox: function(){ return icCircle(17, 12, 6, "#FF6B6B") + icShade("M31 7H41V17H31Z", "#7EC8F0") + icShade("M5 22H43V43H5Z", "#FFB36B") + icShade("M3 16H45V24H3Z", "#FFD23F"); },
    rug: function(){ return icShade("M3 24Q3 14 24 14Q45 14 45 24Q45 34 24 34Q3 34 3 24Z", "#FF9A80") + '<ellipse cx="24" cy="24" rx="14" ry="5.5" fill="#FFD3C4" stroke="#1b1212" stroke-width="2"/>'; },
    book: function(){ return icShade("M5 9Q16 6 24 12Q32 6 43 9V38Q32 35 24 41Q16 35 5 38Z", "#7EC8F0") + icLine("M24 12V41") + icLine("M10 17Q16 16 20 19M10 23Q16 22 20 25M28 19Q32 16 38 17M28 25Q32 22 38 23", INK, 2); },
    study: function(){ return ICONS.book(); },
    close: function(){ return icLine("M13 13L35 35M35 13L13 35", INK, 5); },
    star: function(){ return icShade("M24 4L29.5 17L43 18L33 27.5L36 41L24 34L12 41L15 27.5L5 18L18.5 17Z", "#FFD23F"); },
    heart: function(){ return icShade("M24 41C10 31 5 23 5 16Q5 8 13 8Q20 8 24 15Q28 8 35 8Q43 8 43 16C43 23 38 31 24 41Z", "#FF7A9A"); },
    paint: function(){ return icShade("M24 5C12 5 4 14 4 24C4 34 11 43 22 43C28 43 28 38 25 35C22 32 24 28 29 28H35C40 28 44 25 44 20C44 11 35 5 24 5Z", "#FFDCCB") + icCircle(15, 21, 3, "#FF7A9A") + icCircle(24, 14, 3, "#7EC8F0") + icCircle(34, 18, 3, "#7ACB6B"); },
    sound: function(m){ return icShade("M6 18H14L24 9V39L14 30H6Z", "#7EC8F0") + (m ? icLine("M31 18L41 30M41 18L31 30", "#E0524A", 3) : icLine("M30 17Q35 24 30 31") + icLine("M35 12Q43 24 35 36")); }
  };
  var FOODIC = { "🍪": "cookie", "🍎": "apple", "🍖": "steak", "🍰": "cake", "🍱": "bento" }, ITEMIC = { potion: "potion", dbl: "ticket", house: "house" }, PARTIC = { "💖": "heart", "⭐": "star", "✨": "sparkle", "🪙": "coin" };
  function ti(n){ return '<span class="pg-ti2">' + ic(n) + "</span>"; }
  function ic(n, m){ return '<svg viewBox="0 0 48 48" class="pg-i2" aria-hidden="true">' + ICONS[n](m) + "</svg>"; }

  // ---------- 小幫手 ----------
  function nowStage(me){ var p = P.actPet(me); return p ? P.stageOf(p.xp) : 0; }
  function moodOf(me){
    if(override && override.until > Date.now()) return override.mood;
    var pet = P.actPet(me); if(!pet) return "neutral"; var hg = P.hungerNow(pet, P.cfg.rate, me.home), lv = P.loveNow(pet);
    if(hg < 15) return "hungry"; if(hg < 40) return "sad";
    if(Date.now() - lastTouch > 50000 && hg > 30) return "sleep";
    return lv > 70 ? "love" : lv > 35 ? "happy" : "neutral";
  }
  var stick = "", MOODTXT = { hungry: "肚子好餓⋯⋯給我吃的！", sad: "有點餓了⋯⋯", sleep: "zZz⋯⋯" };
  function say(t, ms){ var b = root && root.querySelector(".pg-bubble"); if(!b) return; b.textContent = t; b.classList.add("on"); clearTimeout(b._t); b._t = setTimeout(function(){ showStick(); }, ms || 2600); }
  function showStick(){ var b = root && root.querySelector(".pg-bubble"); if(!b) return; if(stick){ b.textContent = stick; b.classList.add("on"); } else b.classList.remove("on"); }
  function setStick(m){ var t = MOODTXT[m] || ""; if(t === stick) return; stick = t; var b = root && root.querySelector(".pg-bubble"); if(b && !b._busy) showStick(); }
  function burst(emoji, n, ox, oy){
    if(!fx) return; var r = fx.getBoundingClientRect(), pr = petEl ? petEl.getBoundingClientRect() : null, cx = ox != null ? ox : (pr ? pr.left + pr.width / 2 - r.left : r.width / 2), cy = oy != null ? oy : (pr ? pr.top + pr.height * 0.35 - r.top : r.height / 2);
    for(var i = 0; i < n; i++){ var e = h("div", { class: "pg-p", style: "left:" + cx + "px;top:" + cy + "px;--dx:" + Math.round((Math.random() - 0.5) * 220) + "px;--dy:" + Math.round(-60 - Math.random() * 150) + "px;animation-delay:" + (i * 0.04) + "s;font-size:" + (18 + Math.random() * 16) + "px;" }); e.innerHTML = PARTIC[emoji] ? ic(PARTIC[emoji]) : emoji; e.style.width = e.style.height = e.style.fontSize; fx.appendChild(e); setTimeout(function(x){ x.remove(); }.bind(null, e), 1400); }
  }
  function floatText(t, color){ if(!fx || !petEl) return; var r = fx.getBoundingClientRect(), pr = petEl.getBoundingClientRect(); var e = h("div", { class: "pg-ft", text: t, style: "left:" + (pr.left + pr.width / 2 - r.left) + "px;top:" + (pr.top - r.top + 20) + "px;color:" + (color || "#C0623A") + ";" }); fx.appendChild(e); setTimeout(function(){ e.remove(); }, 1500); }
  function banner(title, sub){ if(!root) return; var b = h("div", { class: "pg-ban" }, [h("div", { class: "pg-ban-t", text: title }), h("div", { class: "pg-ban-s", text: sub || "" })]); root.appendChild(b); setTimeout(function(){ b.classList.add("out"); }, 2200); setTimeout(function(){ b.remove(); }, 2700); }
  function mut(fn){ return P.mutate(fn); }
  function setPetPatch(cur, patch){ var pets = Object.assign({}, cur.pets), p0 = pets[cur.act]; pets[cur.act] = Object.assign({}, p0, patch); return pets; }

  // ---------- 打開／關閉 ----------
  U.open = function(){
    if(root) return; var me = P.me(); lastTouch = Date.now(); override = null; sheetName = ""; sig = "";
    root = h("div", { id: "pg" }); document.body.appendChild(root);
    root.innerHTML = '<div class="pg-scene"></div><div class="pg-top"><button type="button" class="pg-x" data-a="close" title="離開">'+ic("close")+'</button><div class="pg-info"><div class="pg-name"></div><div class="pg-xp"><i></i></div></div><div class="pg-pts" title="我的點數"><span class="pg-star">'+ic("star")+'</span><b>0</b></div></div>' +
      '<div class="pg-meters"><div class="pg-m" title="飽足度"><span class="pg-mi">'+ic("feed")+'</span><div><i data-m="hg"></i></div></div><div class="pg-m" title="心情"><span class="pg-mi">'+ic("heart")+'</span><div><i data-m="lv"></i></div></div><button type="button" class="pg-mini" data-a="style" title="換外觀">'+ic("paint")+'</button><button type="button" class="pg-mini" data-a="mute" title="音效">'+ic("sound",muted())+'</button></div>' +
      '<div class="pg-stage"><div class="pg-walker"><div class="pg-bubble"></div><div class="pg-pet" id="pg-pet"></div></div></div><div class="pg-fx"></div>' +
      '<div class="pg-dock"></div><div class="pg-sheet" style="display:none"></div>';
    fx = root.querySelector(".pg-fx"); sheet = root.querySelector(".pg-sheet"); petEl = root.querySelector("#pg-pet"); walker = root.querySelector(".pg-walker");
    root.addEventListener("click", onRoot); petEl.addEventListener("click", onPet);
    initDrag(); update(true);
    walkTimer = setInterval(wander, 6500); idleTimer = setInterval(function(){ if(root) update(); }, 5000); setTimeout(wander, 1200);
    if(!P.me() || !P.actPet(P.me())) openSheet("adopt"); else setTimeout(checkDaily, 700);
  };
  U.ic = ic; U.ti = ti; U._quiz = function(){ return quiz; }; U.scene = sceneHtml;
  U.catIc = function(it){ var k = it.k || "", i; if(k.indexOf("fu_") === 0) return ic(k.slice(3));
    if(k === "new") return ic("egg"); if(k.indexOf("pm") === 0) return A.svg({ sp: it.e, style: "outline", mood: "happy", stage: 1, anim: false });
    if(k.indexOf("cl_") === 0) return A.accSvg(k.slice(3), "outline"); if(k.indexOf("sc_") === 0) return ic(k.slice(3)); if(k.indexOf("it_") === 0) return ic(ITEMIC[k.slice(3)] || "potion");
    return ic(FOODIC[it.e] || "cookie"); };
  U.close = function(){ if(!root) return; flushPets(); clearInterval(walkTimer); clearInterval(idleTimer); root.remove(); root = null; sheet = null; fx = null; petEl = null; sheetName = ""; };
  U.refresh = function(){ if(root) update(); };

  function onRoot(e){
    var b = e.target.closest("[data-a]"); if(!b) return; var a = b.dataset.a; lastTouch = Date.now();
    if(a === "close") U.close();
    else if(a === "style"){ var order = ["outline", "flat"], i = order.indexOf(curStyle()); style = order[(i + 1) % 2]; try{ localStorage.setItem(STYLE_KEY, style); }catch(er){} sig = ""; update(true); say("外觀：" + A.STYLES.filter(function(s){ return s.id === style; })[0].name); SFX.pop(); }
    else if(a === "mute"){ try{ localStorage.setItem(MUTE_KEY, muted() ? "0" : "1"); }catch(er){} update(true); SFX.pop(); }
    else if(a === "sheet"){ openSheet(b.dataset.s); }
    else if(a === "sheetx"){ closeSheet(); }
  }
  function openSheet(n){ if(sheetName === n && n !== "adopt"){ closeSheet(); return; } sheetName = n; root.classList.add("so"); sheet.style.display = ""; sheet.className = "pg-sheet s-" + n; renderSheet(); SFX.pop(); }
  function closeSheet(){ sheetName = ""; if(root) root.classList.remove("so"); if(sheet) sheet.style.display = "none"; update(); }

  // ---------- 主畫面更新 ----------
  function update(force){
    if(!root) return; var me = P.me() || { pts: 0 }, pet = P.actPet(me), st = P.stageOf(pet && pet.xp), sg = P.STAGES[st], nx = P.STAGES[st + 1];
    var sc = (me.bg && me.inv && me.inv["bg_" + me.bg]) || me.bg === "grass" || !me.bg ? (me.bg || "grass") : "grass";
    var sceneEl = root.querySelector(".pg-scene"); var fsig = sc + "|" + Object.keys(me.inv || {}).filter(function(k){ return k.indexOf("fu_") === 0; }).sort().join(","); if(sceneEl.dataset.id !== fsig || force){ sceneEl.dataset.id = fsig; sceneEl.innerHTML = sceneHtml(sc, me.inv); }
    root.querySelector(".pg-name").innerHTML = pet ? '<b>' + esc(pet.nm) + '</b><small>' + sg.name + (pet.pw > 1 ? "　" + ti("bolt") + "×" + pet.pw : "") + '</small>' : '<b>歡迎！</b>';
    root.querySelector(".pg-xp i").style.width = pet ? (nx ? Math.min(100, Math.round(((pet.xp || 0) - sg.xp) / (nx.xp - sg.xp) * 100)) : 100) + "%" : "0%";
    var hg = pet ? P.hungerNow(pet, P.cfg.rate, me.home) : 0, lv = pet ? P.loveNow(pet) : 0;
    var mh = root.querySelector('[data-m="hg"]'), ml = root.querySelector('[data-m="lv"]'); mh.style.width = hg + "%"; mh.style.background = hg < 30 ? "#E0524A" : hg < 60 ? "#E0A82E" : "#4CAF6A"; ml.style.width = lv + "%"; ml.style.background = "#FF7A9A";
    root.querySelector('[data-a="mute"]').innerHTML = ic("sound", muted());
    animPts(me.pts || 0);
    var mood = moodOf(me), eqj = JSON.stringify(pet && pet.eq || {}), s2 = [pet && pet.sp, st, mood, eqj, curStyle()].join("|");
    setStick(pet ? mood : "");
    if(walker){ if(mood === "sleep" && me.inv && me.inv.fu_bed){ if(walker.dataset.bed !== "1"){ walker.dataset.bed = "1"; walker.dataset.x = String(Math.round(-root.querySelector(".pg-stage").clientWidth * 0.27)); petEl.style.setProperty("--flip", "1"); walker.style.transform = "translateX(" + walker.dataset.x + "px)"; } } else delete walker.dataset.bed; }
    if(pet && (s2 !== sig || force)){ sig = s2; A.render(petEl, { sp: pet.sp, style: curStyle(), mood: mood, stage: st, eq: pet && pet.eq || {} }); }
    if(!pet) petEl.innerHTML = '<div class="pg-egg">' + ic("egg") + '</div>';
    renderDock(me);
    if(sheetName && sheetName !== "adopt") renderSheet(true);
    checkAch();
  }
  function animPts(v){
    var b = root.querySelector(".pg-pts b"); if(shownPts == null){ shownPts = v; b.textContent = v; return; } if(v === shownPts) return;
    var from = shownPts, to = v, t0 = Date.now(), dur = 600; cancelAnimationFrame(ptsAnim); root.querySelector(".pg-pts").classList.add("pop"); setTimeout(function(){ if(root) root.querySelector(".pg-pts").classList.remove("pop"); }, 500);
    (function step(){ var k = Math.min(1, (Date.now() - t0) / dur); shownPts = Math.round(from + (to - from) * k); if(root) b.textContent = shownPts; if(k < 1 && root) ptsAnim = requestAnimationFrame(step); })();
  }
  function renderDock(me){
    var d = root.querySelector(".pg-dock"), q = questList(me), claim = q.filter(function(x){ return x.done && !x.claimed; }).length + (canDaily(me) ? 1 : 0);
    var items = [["feed", ic("feed"), "餵食"], ["play", ic("play"), "玩耍"], ["wear", ic("wear"), "衣櫃"], ["shop", ic("shop"), "商店"], ["quest", ic("quest"), "任務", claim], ["rank", ic("rank"), "排行"], ["ach", ic("ach"), "成就"], ["set", ic("set"), "設定"]];
    var html = items.map(function(i){ return '<button type="button" class="pg-d' + (sheetName === i[0] ? " on" : "") + '" data-a="sheet" data-s="' + i[0] + '"><span class="pg-di">' + i[1] + (i[3] ? '<em>' + i[3] + '</em>' : "") + '</span><span>' + i[2] + '</span></button>'; }).join("");
    if(d._h !== html){ d._h = html; d.innerHTML = html; }
  }

  // ---------- 寵物動作 ----------
  function wander(){
    if(!root || !walker || sheetName === "adopt") return; var me = P.me(), pet = P.actPet(me); if(!pet) return; var m = moodOf(me); if(m === "sleep" || m === "eat") return;
    var w = root.querySelector(".pg-stage").clientWidth, x = Math.round((Math.random() - 0.5) * w * 0.4), cur = parseFloat(walker.dataset.x || 0);
    walker.dataset.x = x; petEl.style.setProperty("--flip", x < cur ? "-1" : "1"); walker.style.transform = "translateX(" + x + "px)"; petEl.classList.add("walk"); setTimeout(function(){ if(petEl) petEl.classList.remove("walk"); }, 1800);
  }
  function onPet(){
    var me = P.me(), pet = P.actPet(me); if(!pet) return; var wasSleep = moodOf(me) === "sleep"; lastTouch = Date.now(); SFX.tap();
    petEl.classList.remove("hop"); void petEl.offsetWidth; petEl.classList.add("hop"); burst("💖", 3); if(wasSleep){ say("哈～你來啦！"); sig = ""; update(); }
    pend.love += 6; pend.pats++; var hg = P.hungerNow(pet, P.cfg.rate, me.home); if(hg < 25) say("我好餓…給我吃的吧！"); else if(Math.random() < 0.35) say(["好舒服～", "再摸一下！", "我最喜歡你了！", "嘿嘿～", "今天也要加油喔！"][Math.floor(Math.random() * 5)]);
    clearTimeout(flushTimer); flushTimer = setTimeout(flushPets, 1500);
  }
  function flushPets(){
    if(!pend.pats) return; var love = pend.love, pats = pend.pats; pend = { love: 0, pats: 0 };
    mut(function(cur){ var p0 = P.actPet(cur); if(!p0) return null; var pets = setPetPatch(cur, { l: Math.min(100, P.loveNow(p0) + love), lt: Date.now() }); return { pets: pets, pats: (cur.pats || 0) + pats, q: P.bumpQ(cur, "pet", pats) }; });
  }
  function eatSeq(food, from, evolved){
    if(!root || !petEl) return; var fl = h("div", { class: "pg-fly" }); fl.innerHTML = ic(FOODIC[food.e] || "cookie"); root.appendChild(fl); var a = from ? from.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight - 60, width: 0, height: 0 }, b = petEl.getBoundingClientRect();
    fl.style.left = (a.left + a.width / 2) + "px"; fl.style.top = (a.top + a.height / 2) + "px";
    requestAnimationFrame(function(){ fl.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height * 0.5 - a.top - a.height / 2) + "px) scale(.5) rotate(200deg)"; fl.style.opacity = ".15"; });
    setTimeout(function(){ fl.remove(); override = { mood: "eat", until: Date.now() + 1700 }; sig = ""; update(); SFX.eat(); burst("✨", 5); }, 560);
    setTimeout(function(){ override = { mood: "love", until: Date.now() + 1800 }; sig = ""; update(); burst("💖", 7); say("謝謝你！好好吃～"); floatText("+" + food.x + " 經驗", "#2E8B57"); }, 2300);
    if(evolved) setTimeout(function(){ evolveFx(evolved); }, 3200);
  }
  function evolveFx(name){ if(!root) return; var f = h("div", { class: "pg-flash" }); root.appendChild(f); setTimeout(function(){ f.remove(); }, 1500); SFX.evolve(); burst("⭐", 14); burst("✨", 10); banner("進化成「" + name + "」！", "你的寵物長大了！"); petEl.classList.add("evo"); setTimeout(function(){ if(petEl) petEl.classList.remove("evo"); }, 1800); }

  // ---------- 拖曳餵食 ----------
  function initDrag(){
    root.addEventListener("pointerdown", function(e){
      var f = e.target.closest(".pg-food"); if(!f || f.disabled) return; var idx = Number(f.dataset.f), sx = e.clientX, sy = e.clientY, ghost = null, moved = false;
      function mv(ev){ if(!ghost){ if(Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 10) return; ghost = h("div", { class: "pg-ghost" }); ghost.innerHTML = ic(FOODIC[P.FOODS[idx].e] || "cookie"); root.appendChild(ghost); moved = true; } ev.preventDefault(); ghost.style.left = ev.clientX + "px"; ghost.style.top = ev.clientY + "px"; if(petEl){ var r = petEl.getBoundingClientRect(); petEl.classList.toggle("want", ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom); } }
      function up(ev){ document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); if(!ghost) return; ghost.remove(); if(petEl) petEl.classList.remove("want"); var r = petEl.getBoundingClientRect(); if(ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom) feed(idx, null); }
      document.addEventListener("pointermove", mv, { passive: false }); document.addEventListener("pointerup", up);
    });
    root.addEventListener("click", function(e){ var f = e.target.closest(".pg-food"); if(f && !f.disabled){ feed(Number(f.dataset.f), f); } });
  }
  async function feed(i, from){
    if(busyAct) return; busyAct = true; lastTouch = Date.now(); var f = P.FOODS[i], fp = P.price("f" + i, f.p), why = "", evolved = "";
    var r = await mut(function(cur){
      var p0 = P.actPet(cur); if(!p0) return null; if((cur.pts || 0) < fp){ why = "poor"; return null; } var hgN = P.hungerNow(p0, P.cfg.rate, cur.home); if(hgN >= 95){ why = "full"; return null; }
      var gain = Math.round(f.x * (p0.pw || 1) * (cur.dbl > 0 ? 2 : 1)), np = { h: Math.min(100, hgN + f.h), at: Date.now(), xp: (p0.xp || 0) + gain, l: Math.min(100, P.loveNow(p0) + 6), lt: Date.now() };
      if(P.stageOf(np.xp) > P.stageOf(p0.xp)) evolved = P.STAGES[P.stageOf(np.xp)].name;
      return { pets: setPetPatch(cur, np), pts: cur.pts - fp, fed: (cur.fed || 0) + 1, dbl: cur.dbl > 0 ? cur.dbl - 1 : 0, q: P.bumpQ(cur, "feed", 1) };
    });
    busyAct = false;
    if(why === "poor"){ say("點數不夠喔～多寫作業、多答題賺點數！"); SFX.sad(); return; } if(why === "full"){ say("我肚子好飽，吃不下了～"); SFX.pop(); return; }
    if(r) eatSeq(f, from, evolved);
  }
  async function play(){
    if(busyAct) return; var me = P.me(), q = P.qOf(me); if((q.play || 0) >= 5){ say("今天玩累了，明天再玩吧！"); SFX.sad(); return; }
    busyAct = true; lastTouch = Date.now(); var evolved = "";
    var r = await mut(function(cur){ var p0 = P.actPet(cur); if(!p0) return null; var q2 = P.qOf(cur); if((q2.play || 0) >= 5) return null; var np = { l: Math.min(100, P.loveNow(p0) + 25), lt: Date.now(), xp: (p0.xp || 0) + 3 }; if(P.stageOf(np.xp) > P.stageOf(p0.xp)) evolved = P.STAGES[P.stageOf(np.xp)].name; return { pets: setPetPatch(cur, np), q: P.bumpQ(cur, "play", 1) }; });
    busyAct = false; if(!r) return; closeSheet();
    var ball = h("div", { class: "pg-ball" }); ball.innerHTML = ic("play"); root.querySelector(".pg-stage").appendChild(ball); SFX.play(); petEl.classList.add("hop2"); override = { mood: "happy", until: Date.now() + 2600 }; sig = ""; update();
    setTimeout(function(){ ball.remove(); if(petEl) petEl.classList.remove("hop2"); burst("💖", 6); say("好好玩！再來一次！"); floatText("+3 經驗", "#2E8B57"); if(evolved) evolveFx(evolved); }, 2600);
  }

  // ---------- 每日簽到、任務 ----------
  var DAILY_BASE = [1, 1, 2, 2, 3, 4, 6];
  function canDaily(me){ return P.cfg.daily > 0 && (!me.dc || me.dc.last !== P.todayKey()); }
  function dailyInfo(me){
    var today = P.todayKey(), y = new Date(); y.setDate(y.getDate() - 1); var yk = y.getFullYear() + "-" + (y.getMonth() < 9 ? "0" : "") + (y.getMonth() + 1) + "-" + (y.getDate() < 10 ? "0" : "") + y.getDate();
    var dc = me.dc || { streak: 0 }, claimed = dc.last === today, next = claimed ? dc.streak : (dc.last === yk ? dc.streak + 1 : 1);
    var day = ((next - 1) % 7) + 1, mult = (P.cfg.daily || 2) / 2, reward = Math.max(1, Math.round(DAILY_BASE[day - 1] * mult * 2));
    return { claimed: claimed, streak: dc.streak || 0, next: next, day: day, reward: reward, mult: mult };
  }
  function checkDaily(){ var me = P.me(); if(!root || !me || !canDaily(me) || sheetName) return; openSheet("quest"); }
  async function claimDaily(){
    var info = dailyInfo(P.me()); if(info.claimed) return;
    var r = await mut(function(cur){ if(!canDaily(cur)) return null; var inf = dailyInfo(cur), ev = (cur.ev || []).slice(-7); ev.push({ t: Date.now(), n: inf.reward, w: "每日簽到" }); return { dc: { last: P.todayKey(), streak: inf.next }, pts: (cur.pts || 0) + inf.reward, earned: (cur.earned || 0) + inf.reward, ev: ev }; });
    if(r){ SFX.claim(); burst("⭐", 10, innerWidth / 2, innerHeight * 0.5); say("簽到成功！＋" + info.reward + " 點"); }
  }
  var QPOOL = [{ id: "feed", t: "餵寵物吃東西", n: 1, p: 2, k: "feed" }, { id: "pet", t: "摸摸寵物", n: 5, p: 2, k: "pet" }, { id: "play", t: "陪寵物玩球", n: 2, p: 3, k: "play" }, { id: "dress", t: "幫寵物換一次造型", n: 1, p: 2, k: "dress" }];
  function hashDay(){ var s = P.todayKey(), n = 0; for(var i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 9973; return n; }
  function questList(me){
    var q = P.qOf(me), n = hashDay(), a = QPOOL[n % 4], b = QPOOL[(n + 1 + (n >> 2) % 3) % 4]; if(b.id === a.id) b = QPOOL[(n + 2) % 4];
    var list = [a, b, { id: "earn", t: "今天學習賺到 10 點（交作業、答題）", n: 10, p: 5, k: "earn" }];
    return list.map(function(x){ var v = q[x.k] || 0; return { id: x.id, t: x.t, n: x.n, p: x.p, v: Math.min(v, x.n), done: v >= x.n, claimed: !!(q.done && q.done[x.id]) }; });
  }
  async function claimQuest(id){
    var q = questList(P.me()).filter(function(x){ return x.id === id; })[0]; if(!q || !q.done || q.claimed) return;
    var r = await mut(function(cur){ var qq = P.qOf(cur); if(qq.done && qq.done[id]) return null; qq.done = Object.assign({}, qq.done); qq.done[id] = 1; var ev = (cur.ev || []).slice(-7); ev.push({ t: Date.now(), n: q.p, w: "每日任務" }); return { q: qq, pts: (cur.pts || 0) + q.p, earned: (cur.earned || 0) + q.p, ev: ev }; });
    if(r){ SFX.claim(); burst("⭐", 8, innerWidth / 2, innerHeight * 0.55); }
  }

  // ---------- 成就 ----------
  function clothesCount(me){ return P.CLOTHES.filter(function(c){ return me.inv && me.inv[c.id]; }).length; }
  var ACH = [
    { id: "feed1", t: "第一餐", d: "餵寵物吃東西", p: 3, ok: function(m){ return (m.fed || 0) >= 1; } }, { id: "feed30", t: "大胃王", d: "餵食 30 次", p: 12, ok: function(m){ return (m.fed || 0) >= 30; } },
    { id: "st1", t: "長大了", d: "寵物成長到少年", p: 5, ok: function(m){ return maxStage(m) >= 1; } }, { id: "st2", t: "帥氣成年", d: "寵物成長到成年", p: 10, ok: function(m){ return maxStage(m) >= 2; } }, { id: "st3", t: "傳說誕生", d: "寵物成長到傳說", p: 30, ok: function(m){ return maxStage(m) >= 3; } },
    { id: "cl5", t: "時尚新手", d: "擁有 5 件衣服", p: 8, ok: function(m){ return clothesCount(m) >= 5; } }, { id: "cl12", t: "衣櫃達人", d: "擁有 12 件衣服", p: 25, ok: function(m){ return clothesCount(m) >= 12; } },
    { id: "pet3", t: "寵物大家庭", d: "擁有 3 隻寵物", p: 15, ok: function(m){ return Object.keys(m.pets || {}).length >= 3; } }, { id: "prem", t: "強者的證明", d: "擁有強化寵物", p: 10, ok: function(m){ return Object.keys(m.pets || {}).some(function(k){ return m.pets[k].pw > 1; }); } },
    { id: "e100", t: "小富翁", d: "累積賺到 100 點", p: 5, ok: function(m){ return (m.earned || 0) >= 100; } }, { id: "e500", t: "點數大亨", d: "累積賺到 500 點", p: 20, ok: function(m){ return (m.earned || 0) >= 500; } }, { id: "e1000", t: "學習之星", d: "累積賺到 1000 點", p: 40, ok: function(m){ return (m.earned || 0) >= 1000; } },
    { id: "s7", t: "七天不間斷", d: "連續簽到 7 天", p: 10, ok: function(m){ return m.dc && m.dc.streak >= 7; } }, { id: "s30", t: "月月有恆", d: "連續簽到 30 天", p: 50, ok: function(m){ return m.dc && m.dc.streak >= 30; } },
    { id: "scene", t: "裝飾家園", d: "買過一個場景", p: 5, ok: function(m){ return Object.keys(m.inv || {}).some(function(k){ return k.indexOf("bg_") === 0; }); } }, { id: "pat50", t: "摸摸大師", d: "摸摸寵物 50 次", p: 5, ok: function(m){ return (m.pats || 0) >= 50; } }
  ];
  function maxStage(m){ var s = 0; Object.keys(m.pets || {}).forEach(function(k){ s = Math.max(s, P.stageOf(m.pets[k].xp)); }); return s; }
  function checkAch(){
    if(achBusy) return; var me = P.me(); if(!me || !P.actPet(me)) return; var got = me.ach || {}, fresh = ACH.filter(function(a){ return !got[a.id] && a.ok(me); }); if(!fresh.length) return;
    achBusy = true;
    mut(function(cur){ var g = Object.assign({}, cur.ach), add = 0, ev = (cur.ev || []).slice(-7); ACH.forEach(function(a){ if(!g[a.id] && a.ok(cur)){ g[a.id] = Date.now(); add += a.p; ev.push({ t: Date.now(), n: a.p, w: "成就：" + a.t }); } }); if(!add && !Object.keys(g).length) return null; return { ach: g, pts: (cur.pts || 0) + add, earned: (cur.earned || 0) + add, ev: ev }; }).then(function(){ achBusy = false; if(root){ SFX.ach(); banner("解鎖成就：" + fresh.map(function(a){ return a.t; }).join("、"), "獲得 " + fresh.reduce(function(s, a){ return s + a.p; }, 0) + " 點"); } }, function(){ achBusy = false; });
  }

  // ---------- 底部面板 ----------
  function renderSheet(keepScroll){
    if(!sheet || !sheetName) return; var me = P.me() || { pts: 0 }, sc = sheet.querySelector(".pg-sb"), top = sc ? sc.scrollTop : 0;
    var TT = { study: "學習餵食", feed: "餵食（點一下或拖到寵物身上）", play: "玩耍", wear: "衣櫃", shop: "商店", quest: "簽到與任務", rank: "排行榜", ach: "成就", set: "設定", adopt: "領養寵物" }, title = (ICONS[sheetName] ? '<span class="pg-ti">' + ic(sheetName) + "</span>" : "") + TT[sheetName];
    sheet.innerHTML = '<div class="pg-sh"><b>' + title + '</b>' + (sheetName === "adopt" && !P.actPet(P.me()) ? "" : '<button type="button" class="pg-sx" data-a="sheetx">'+ic("close")+'</button>') + '</div><div class="pg-sb"></div>';
    var body = sheet.querySelector(".pg-sb");
    ({ study: sStudy, feed: sFeed, play: sPlay, wear: sWear, shop: sShop, quest: sQuest, rank: sRank, ach: sAch, set: sSet, adopt: sAdopt }[sheetName])(body, me);
    if(keepScroll) body.scrollTop = top;
  }
  function artThumb(sp, o){ var d = h("div", { class: "pg-th" }); A.render(d, Object.assign({ sp: sp, style: curStyle(), mood: "happy", stage: 1, anim: false }, o || {})); return d; }
  function sFeed(body, me){
    var pts = me.pts || 0, hg = P.actPet(me) ? P.hungerNow(P.actPet(me), P.cfg.rate, me.home) : 0;
    body.innerHTML = '<button type="button" class="pg-big sm pg-study" id="pg-study">' + ti("book") + ' 學習餵食：答生詞題，答對就有東西吃（免費）</button><div class="pg-hint">' + ti("star") + ' 我的點數 <b>' + pts + '</b>　' + ti("feed") + ' 飽足 ' + hg + (me.dbl > 0 ? '　' + ti("ticket") + ' 經驗加倍 ×' + me.dbl : '') + '</div><div class="pg-foods">' + P.FOODS.map(function(f, i){ var pr = P.price("f" + i, f.p); return '<button type="button" class="pg-food" data-f="' + i + '"' + (pts < pr ? " disabled" : "") + '><span class="fe">' + ic(FOODIC[f.e] || "cookie") + '</span><span class="fn">' + f.n + '</span><em>' + ti("star") + pr + '</em><small>飽足 +' + f.h + '　經驗 +' + f.x + '</small></button>'; }).join("") + '</div>'; var sb = body.querySelector("#pg-study"); if(sb) sb.onclick = openStudy;
  }

  // ---------- 學習餵食：用這個班學過的生詞答題，答對寵物就有東西吃 ----------
  var quiz = null, vocabCache = null, VQ = 5;
  function shuf(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  async function loadVocab(){
    if(vocabCache) return vocabCache; var st = P.ctx().student && P.ctx().student(); if(!st) return []; var data = null;
    try{ data = await P.ctx().get("teacherPlatform/" + st.idx.t + "/classVocab/" + st.idx.c); }catch(e){}
    var seen = {}, out = []; (Array.isArray(data) ? data : Object.keys(data || {}).map(function(k){ return data[k]; })).forEach(function(x){ (Array.isArray(x.w) ? x.w : Object.keys(x.w || {}).map(function(k){ return x.w[k]; })).forEach(function(v){ if(!v || !v.w || seen[v.w]) return; seen[v.w] = 1; var o = { py: "", zy: "", tr: [] }; String(v.s || "").split(/\s*·\s*/).filter(Boolean).forEach(function(t){ if(!o.zy && /[ㄅ-ㄯ]/.test(t)) o.zy = t; else if(!o.py && /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(t) && !/[㐀-鿿぀-ヿ]/.test(t)) o.py = t; else o.tr.push(t); }); out.push({ w: v.w, py: o.py || o.zy, tr: o.tr[0] || "" }); }); });
    vocabCache = out; return out;
  }
  function buildQs(words){
    var can = !!window.speechSynthesis, qs = [], pool = shuf(words);
    for(var i = 0; i < VQ; i++){
      var w0 = pool[i % pool.length], types = []; if(can) types.push("listen"); if(w0.tr && words.filter(function(x){ return x.tr; }).length >= 3) types.push("mean"); if(w0.py) types.push("pron"); if(!types.length) types.push("look");
      var ty = types[Math.floor(Math.random() * types.length)], key = ty === "mean" ? "tr" : "w", others = shuf(words.filter(function(x){ return x.w !== w0.w && (ty !== "mean" || x.tr); })).slice(0, 3);
      var opts = shuf([w0].concat(others)); qs.push({ ty: ty, w: w0, opts: opts.map(function(o){ return ty === "mean" ? o.tr : o.w; }), a: opts.indexOf(w0) });
    }
    return qs;
  }
  function speak(t){ try{ var u = new SpeechSynthesisUtterance(t); u.lang = "zh-TW"; u.rate = 0.85; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){} }
  async function openStudy(){ quiz = { stage: "load" }; openSheet("study"); var words = await loadVocab(); if(!quiz || quiz.stage !== "load") return; quiz = words.length < 2 ? { stage: "none" } : { stage: "intro", words: words }; if(sheetName === "study") renderSheet(true); }
  function startQuiz(){ quiz = { stage: "q", words: quiz.words, qs: buildQs(quiz.words), i: 0, ok: 0, combo: 0, picked: null, gained: 0, bonus: 0 }; renderSheet(true); if(quiz.qs[0].ty === "listen") speak(quiz.qs[0].w.w); }
  function sStudy(body, me){
    var lw = me.lw || [], cap = P.cfg.learn == null ? 10 : P.cfg.learn, lq = me.lq && me.lq.d === P.todayKey() ? me.lq : { n: 0 };
    if(!quiz || quiz.stage === "load"){ body.innerHTML = '<div class="pg-hint">正在找這個班學過的生詞⋯⋯</div>'; return; }
    if(quiz.stage === "none"){ body.innerHTML = '<div class="pg-hint">這個班還沒有生詞可以考你。等老師上完課、把生詞記到課堂記錄，這裡就會出現題目囉！先用點數買食物餵寵物吧。</div>'; return; }
    var learned = '<div class="pg-sec">寵物學會的詞　<small>' + lw.length + ' 個</small></div><div class="pg-chips">' + (lw.length ? lw.slice(-24).reverse().map(function(w){ return '<span class="pg-chip">' + esc(w) + '</span>'; }).join("") : '<small>還沒有，答對的詞會變成寵物學會的詞！</small>') + '</div>';
    if(quiz.stage === "intro"){ body.innerHTML = '<div class="pg-hint">用上課學過的生詞答題，答對寵物就有東西吃（飽足、經驗都會增加），每天前 ' + cap + ' 題答對還能賺點數！今天已賺 <b>' + lq.n + ' / ' + cap + '</b>。</div><button type="button" class="pg-big" id="pg-qstart">' + ti("book") + ' 開始（' + VQ + ' 題）</button>' + learned; body.querySelector("#pg-qstart").onclick = function(){ SFX.pop(); startQuiz(); }; return; }
    if(quiz.stage === "end"){ body.innerHTML = '<div class="pg-hint">這一輪答對 <b>' + quiz.ok + ' / ' + VQ + '</b>' + (quiz.bonus ? '，全對！額外 +' + quiz.bonus + ' 點' : '') + '，一共賺到 ' + ti("star") + '<b>' + quiz.gained + '</b> 點。</div><button type="button" class="pg-big" id="pg-qstart">再來一輪</button>' + learned; body.querySelector("#pg-qstart").onclick = function(){ SFX.pop(); startQuiz(); }; return; }
    var q = quiz.qs[quiz.i], pr;
    if(q.ty === "listen") pr = '<button type="button" class="pg-qsay" id="pg-qsay">' + ic("sound") + '</button><div class="pg-qh">聽聽看，是哪一個詞？</div>';
    else if(q.ty === "mean") pr = '<div class="pg-qw">' + esc(q.w.w) + '</div><div class="pg-qh">這個詞是什麼意思？</div>';
    else if(q.ty === "pron") pr = '<div class="pg-qw sm">' + esc(q.w.py) + '</div><div class="pg-qh">這個發音是哪一個詞？</div>';
    else pr = '<div class="pg-qh">找出「' + esc(q.w.w) + '」</div>';
    body.innerHTML = '<div class="pg-hint">第 <b>' + (quiz.i + 1) + ' / ' + VQ + '</b> 題　' + (quiz.combo > 1 ? '連對 ×' + quiz.combo + '　' : '') + '今天學習點數 ' + lq.n + ' / ' + cap + '</div><div class="pg-qz">' + pr + '<div class="pg-qo">' + q.opts.map(function(o, i){ return '<button type="button" class="pg-qopt' + (quiz.picked != null ? (i === q.a ? " ok" : i === quiz.picked ? " bad" : " dim") : "") + '" data-o="' + i + '">' + esc(o) + '</button>'; }).join("") + '</div></div>' + (quiz.picked != null && quiz.picked !== q.a ? '<button type="button" class="pg-big sm" id="pg-qnext">下一題</button>' : "");
    var sy = body.querySelector("#pg-qsay"); if(sy) sy.onclick = function(){ speak(q.w.w); };
    [].forEach.call(body.querySelectorAll(".pg-qopt"), function(b){ b.onclick = function(){ answer(Number(b.dataset.o)); }; });
    var nx = body.querySelector("#pg-qnext"); if(nx) nx.onclick = nextQ;
  }
  function nextQ(){ if(!quiz || quiz.stage !== "q") return; quiz.i++; quiz.picked = null; if(quiz.i >= VQ){ quiz.stage = "end"; renderSheet(true); return; } renderSheet(true); if(quiz.qs[quiz.i].ty === "listen") speak(quiz.qs[quiz.i].w.w); }
  async function answer(i){
    if(!quiz || quiz.stage !== "q" || quiz.picked != null) return; var q = quiz.qs[quiz.i], good = i === q.a; quiz.picked = i; lastTouch = Date.now();
    if(good){ quiz.ok++; quiz.combo++; } else quiz.combo = 0; renderSheet(true);
    if(good){
      SFX.eat(); override = { mood: "eat", until: Date.now() + 1500 }; sig = ""; burst(quiz.combo >= 3 ? "⭐" : "💖", quiz.combo >= 3 ? 8 : 4); say(["好吃！", "答對了～", "我學會了！", "還要還要！"][Math.floor(Math.random() * 4)]);
      var last = quiz.i === VQ - 1, perfect = last && quiz.ok === VQ, cap = P.cfg.learn == null ? 10 : P.cfg.learn, gotPts = 0, gotBonus = 0;
      await mut(function(cur){ var p0 = P.actPet(cur); if(!p0) return null; var lq = cur.lq && cur.lq.d === P.todayKey() ? Object.assign({}, cur.lq) : { d: P.todayKey(), n: 0 }; gotPts = lq.n < cap ? 1 : 0; lq.n += gotPts; if(perfect && lq.pf !== P.todayKey()){ gotBonus = 3; lq.pf = P.todayKey(); }
        var lw = (cur.lw || []).slice(); if(lw.indexOf(q.w.w) < 0){ lw.push(q.w.w); if(lw.length > 150) lw.shift(); } var add = gotPts + gotBonus, ev = (cur.ev || []).slice(-7); if(add) ev.push({ t: Date.now(), n: add, w: "學習餵食" });
        return { pets: setPetPatch(cur, { h: Math.min(100, P.hungerNow(p0, P.cfg.rate, cur.home) + 6), at: Date.now(), xp: (p0.xp || 0) + Math.round(2 * (p0.pw || 1)), l: Math.min(100, P.loveNow(p0) + 3), lt: Date.now() }), lq: lq, lw: lw, pts: (cur.pts || 0) + add, earned: (cur.earned || 0) + add, ev: ev, q: P.bumpQ(cur, "feed", 1) }; });
      quiz.gained += gotPts + gotBonus; quiz.bonus = gotBonus; if(gotPts) SFX.coin(); if(quiz.stage === "q") renderSheet(true);
      setTimeout(function(){ if(quiz && quiz.stage === "q" && quiz.picked === i) nextQ(); }, 1100);
    } else { SFX.sad(); say("沒關係，下次一定會！"); }
  }

  function sPlay(body, me){
    var q = P.qOf(me), left = 5 - (q.play || 0);
    body.innerHTML = '<div class="pg-hint">陪牠玩球可以提高心情、增加一點經驗。今天還可以玩 <b>' + left + '</b> 次。</div><button type="button" class="pg-big" id="pg-doplay"' + (left <= 0 ? " disabled" : "") + '>' + ti("play") + ' 丟球！</button>';
    body.querySelector("#pg-doplay").onclick = play;
  }
  function slotIcon(id){ var box = { head: "20 -4 160 96", face: "36 70 128 60", neck: "36 118 128 86", side: "0 96 200 108" }[A.ACC_SLOT[id]]; return '<svg viewBox="' + box + '" xmlns="http://www.w3.org/2000/svg">' + A.accSvg(id, curStyle()) + "</svg>"; }
  function sWear(body, me){
    var pet = P.actPet(me), inv = me.inv || {}, owned = P.CLOTHES.filter(function(c){ return inv[c.id]; });
    var html = '<div class="pg-hint">點一下穿上或脫下。每個部位只能穿一件。' + (owned.length ? "" : "還沒有衣服，去商店買吧！") + '</div>';
    ["head", "face", "neck", "side"].forEach(function(sl){
      var list = P.CLOTHES.filter(function(c){ return c.s === sl; }); html += '<div class="pg-sec">' + P.SLOTS[sl] + '</div><div class="pg-grid">' + list.map(function(c){ var own = inv[c.id], on = pet.eq && pet.eq[sl] === c.id; return '<button type="button" class="pg-it' + (on ? " on" : "") + (own ? "" : " lock") + '" data-w="' + c.id + '"' + (own ? "" : " disabled") + '><span class="pg-ic">' + slotIcon(c.id) + '</span><span class="pg-in">' + c.n + '</span>' + (own ? (on ? "<em>穿著中</em>" : "") : "<em>未擁有</em>") + '</button>'; }).join("") + '</div>';
    });
    var scs = P.SCENES.filter(function(x){ return x.p === 0 || inv["bg_" + x.id]; }); html += '<div class="pg-sec">場景</div><div class="pg-grid">' + scs.map(function(x){ return '<button type="button" class="pg-it' + ((me.bg || "grass") === x.id ? " on" : "") + '" data-bg="' + x.id + '"><span class="pg-ic">' + ic(x.id) + '</span><span class="pg-in">' + x.n + '</span></button>'; }).join("") + '</div>';
    body.innerHTML = html;
    body.onclick = function(e){ var b = e.target.closest("button"); if(!b || b.disabled) return; if(b.dataset.bg){ mut(function(){ return { bg: b.dataset.bg }; }); SFX.pop(); return; }
      if(b.dataset.w){ var c = P.cm(b.dataset.w), eq0 = pet.eq && pet.eq[c.s] === c.id; mut(function(cur){ var p0 = P.actPet(cur), eq = Object.assign({}, p0.eq); if(eq[c.s] === c.id) delete eq[c.s]; else eq[c.s] = c.id; return { pets: setPetPatch(cur, { eq: eq }), q: eq0 ? undefined : P.bumpQ(cur, "dress", 1) }; }); SFX.coin(); burst("✨", 4); } };
  }
  function sShop(body, me){
    var pts = me.pts || 0, inv = me.inv || {}, vis = function(k){ return !P.hidden(k); }, pr = function(k, d){ return P.price(k, d); };
    var card = function(icon, n, p, d, own, attrs){ return '<div class="pg-card' + (own ? " own" : "") + '"><div class="pg-ci">' + icon + '</div><div class="pg-cn">' + n + '</div>' + (d ? '<div class="pg-cd">' + d + '</div>' : "") + '<button type="button" ' + attrs + (own || pts < p ? " disabled" : "") + '>' + (own ? "已擁有" : ti("star") + " " + p) + '</button></div>'; };
    var sec = function(t, c){ return c ? '<div class="pg-sec">' + t + '</div><div class="pg-cards">' + c + '</div>' : ""; };
    var tmp = document.createElement("div");
    var premium = P.PREMIUM.map(function(x, i){ return vis("pm" + i) ? card('<span class="pg-pi" data-sp="' + x.e + '"></span>', x.n, pr("pm" + i, x.p), ti("bolt") + " 成長 ×" + x.pw, false, 'data-pm="' + i + '"') : ""; }).join("") + (vis("new") ? card('<span class="pg-pi" data-sp="🐶"></span>', "再領養一隻", pr("new", P.NEWPET), "", false, 'data-new="1"') : "");
    var rewards = (P.cfg.rewards || []).filter(Boolean).map(function(r, i){ return card(ic("gift"), esc(r.n), r.p, "", false, 'data-rw="' + i + '"'); }).join("");
    body.innerHTML = '<div class="pg-hint">' + ti("star") + ' 我的點數 <b>' + pts + '</b></div>' + sec(ti("gift") + " 老師的獎勵（兌換後告訴老師）", rewards) + sec(ti("heart") + " 更強的寵物", premium) +
      sec(ti("potion") + " 道具", P.ITEMS.map(function(x, i){ return vis("it_" + x.id) ? card(ic(ITEMIC[x.id] || "potion"), x.n, pr("it_" + x.id, x.p), x.d, x.once && me[x.id === "house" ? "home" : x.id], 'data-it="' + i + '"') : ""; }).join("")) +
      sec(ti("wear") + " 衣服", P.CLOTHES.map(function(x, i){ return vis("cl_" + x.id) ? card('<span class="pg-sv">' + slotIcon(x.id) + '</span>', x.n, pr("cl_" + x.id, x.p), P.SLOTS[x.s], inv[x.id], 'data-cl="' + i + '"') : ""; }).join("")) +
      sec(ti("bed") + " 家具（會擺在你的家裡）", (window.PETSCENE ? window.PETSCENE.FURN : []).map(function(x, i){ return vis("fu_" + x.id) ? card(ic(x.id), x.n, pr("fu_" + x.id, x.p), "", inv["fu_" + x.id], 'data-fu="' + x.id + '"') : ""; }).join("")) +
      sec(ti("grass") + " 場景", P.SCENES.filter(function(x){ return x.p > 0 && vis("sc_" + x.id); }).map(function(x){ return card(ic(x.id), x.n, pr("sc_" + x.id, x.p), "", inv["bg_" + x.id], 'data-sc="' + x.id + '"'); }).join(""));
    [].forEach.call(body.querySelectorAll(".pg-pi"), function(el){ A.render(el, { sp: el.dataset.sp, style: curStyle(), mood: "happy", stage: 1, anim: false }); });
    body.onclick = async function(e){
      var b = e.target.closest("button"); if(!b || b.disabled) return; var d = b.dataset, msg = "", poor = false, newPet = false;
      if(d.new){ openSheet("adopt"); return; }
      var r = await mut(function(cur){
        var price, apply;
        if(d.rw !== undefined){ var rw = (P.cfg.rewards || [])[Number(d.rw)]; if(!rw) return null; price = rw.p; apply = function(){ return {}; }; }
        else if(d.pm !== undefined){ var x = P.PREMIUM[Number(d.pm)]; price = P.price("pm" + d.pm, x.p); apply = function(c2){ var pets = Object.assign({}, c2.pets), id = "p" + Date.now().toString(36); pets[id] = { sp: x.e, nm: x.n, h: 80, at: Date.now(), xp: 0, pw: x.pw, l: 60, lt: Date.now() }; msg = "領養了 " + x.n + "！"; return { pets: pets, act: id }; }; }
        else if(d.it !== undefined){ var it = P.ITEMS[Number(d.it)]; price = P.price("it_" + it.id, it.p); apply = function(c2){ if(it.id === "potion"){ var p0 = P.actPet(c2); if(!p0) return null; msg = "寵物喝了成長藥水，經驗 +40！"; return { pets: setPetPatch(c2, { xp: (p0.xp || 0) + 40 }) }; } if(it.id === "dbl"){ msg = "經驗加倍券 +5 次！"; return { dbl: (c2.dbl || 0) + 5 }; } if(it.id === "house"){ if(c2.home) return null; msg = "豪華小屋蓋好了！"; return { home: 1 }; } return null; }; }
        else if(d.cl !== undefined){ var cl = P.CLOTHES[Number(d.cl)]; price = P.price("cl_" + cl.id, cl.p); apply = function(c2){ var inv2 = Object.assign({}, c2.inv); if(inv2[cl.id]) return null; inv2[cl.id] = 1; msg = "買了「" + cl.n + "」！到衣櫃穿上"; return { inv: inv2 }; }; }
        else if(d.fu){ var fu = window.PETSCENE.FURN.filter(function(f){ return f.id === d.fu; })[0]; price = P.price("fu_" + fu.id, fu.p); apply = function(c2){ var inv2 = Object.assign({}, c2.inv); if(inv2["fu_" + fu.id]) return null; inv2["fu_" + fu.id] = 1; msg = "「" + fu.n + "」擺進家裡了！"; return { inv: inv2 }; }; }
        else if(d.sc){ var scn = P.SCENES.filter(function(s){ return s.id === d.sc; })[0]; price = P.price("sc_" + scn.id, scn.p); apply = function(c2){ var inv2 = Object.assign({}, c2.inv); if(inv2["bg_" + scn.id]) return null; inv2["bg_" + scn.id] = 1; msg = "買了場景「" + scn.n + "」！"; return { inv: inv2, bg: scn.id }; }; }
        if((cur.pts || 0) < price){ poor = true; return null; } var patch = apply(cur); if(!patch) return null; patch.pts = (cur.pts || 0) - price; return patch;
      });
      if(poor){ say("點數不夠喔～"); SFX.sad(); return; } if(!r) return;
      if(d.rw !== undefined){ var rw2 = (P.cfg.rewards || [])[Number(d.rw)], rt = P.root(), s = P.ctx().student(); await P.ctx().update(rt.path + "/redeem/r" + Date.now().toString(36) + Math.floor(Math.random() * 99), { name: s.name, c: rt.cls, item: rw2.n, p: rw2.p, at: Date.now(), done: false }); msg = "已兌換「" + rw2.n + "」！請告訴老師領取。"; }
      SFX.buy(); burst("🪙", 8, innerWidth / 2, innerHeight * 0.55); if(msg){ closeSheet(); say(msg, 3500); }
    };
  }
  function sQuest(body, me){
    var info = dailyInfo(me), q = questList(me), days = "";
    for(var i = 1; i <= 7; i++){ var reward = Math.max(1, Math.round(DAILY_BASE[i - 1] * info.mult * 2)), past = info.claimed ? i <= info.day : i < info.day, today = !info.claimed && i === info.day; days += '<div class="pg-day' + (past ? " done" : "") + (today ? " today" : "") + '"><span>第' + i + '天</span><b>' + (past ? "✓" : ti("star") + reward) + '</b></div>'; }
    body.innerHTML = (P.cfg.daily > 0 ? '<div class="pg-sec">每日簽到　<small>連續 ' + info.streak + ' 天</small></div><div class="pg-days">' + days + '</div>' + (info.claimed ? '<div class="pg-hint">今天已簽到，明天再來！</div>' : '<button type="button" class="pg-big" id="pg-claimd">' + ti("calendar") + ' 簽到領 ' + ti("star") + info.reward + '</button>') : "") +
      '<div class="pg-sec">今日任務</div>' + q.map(function(x){ return '<div class="pg-q"><div class="pg-qt"><b>' + x.t + '</b><div class="pg-qb"><i style="width:' + Math.round(x.v / x.n * 100) + '%"></i></div><small>' + x.v + ' / ' + x.n + '</small></div>' + (x.claimed ? '<span class="pg-got">已領取</span>' : x.done ? '<button type="button" data-qc="' + x.id + '">領 ' + ti("star") + x.p + '</button>' : '<span class="pg-reward">' + ti("star") + x.p + '</span>') + '</div>'; }).join("") + '<div class="pg-hint">每天會換新的任務。</div>';
    var cd = body.querySelector("#pg-claimd"); if(cd) cd.onclick = claimDaily; body.onclick = function(e){ var b = e.target.closest("[data-qc]"); if(b) claimQuest(b.dataset.qc); };
  }
  function loadRank(){ var r = P.root(); P.ctx().get(r.path + "/s").then(function(v){ lbData = v || {}; if(sheetName === "rank") renderSheet(true); }); }
  function sRank(body, me){
    if(!lbData){ body.innerHTML = '<div class="pg-hint">載入中…</div>'; loadRank(); return; }
    var r = P.root(), list = Object.keys(lbData).map(function(k){ return lbData[k]; }).filter(function(x){ return x && x.c === r.cls && P.bestPet(x); }), val = function(x){ return lbSort === "xp" ? P.power(x) : (x.earned || 0); };
    list.sort(function(a, b){ return val(b) - val(a); }); var meName = P.ctx().student().name, medal = [0, 1, 2].map(function(i){ return '<span class="pg-md m' + i + '">' + (i + 1) + "</span>"; });
    body.innerHTML = '<div class="pg-tabs"><button type="button" data-s="xp" class="' + (lbSort === "xp" ? "on" : "") + '">寵物經驗</button><button type="button" data-s="earned" class="' + (lbSort === "earned" ? "on" : "") + '">累積點數</button></div>' + (list.length ? '<div class="pg-pod">' + list.slice(0, 3).map(function(x, i){ return '<div class="pg-pp p' + i + '"><div class="pm">' + medal[i] + '</div><div class="pa" data-i="' + i + '"></div><div class="pn">' + esc(x.name) + '</div><div class="pv">' + val(x) + '</div></div>'; }).join("") + '</div>' : '<div class="pg-hint">還沒有人領養寵物。</div>') +
      '<div class="pg-lb">' + list.map(function(x, i){ var p = P.bestPet(x); return '<div class="pg-lr' + (x.name === meName ? " me" : "") + '"><span class="rk">' + (i < 3 ? medal[i] : i + 1) + '</span><span class="re" data-j="' + i + '"></span><b>' + esc(x.name) + '</b><small>' + esc(p.nm) + '・' + P.STAGES[P.stageOf(p.xp)].name + '</small><em>' + val(x) + '</em></div>'; }).join("") + '</div>';
    [].forEach.call(body.querySelectorAll(".pa"), function(el){ var x = list[Number(el.dataset.i)], p = P.bestPet(x); A.render(el, { sp: p.sp, style: curStyle(), mood: "happy", stage: P.stageOf(p.xp), eq: p.eq, anim: false }); });
    [].forEach.call(body.querySelectorAll(".re"), function(el){ var x = list[Number(el.dataset.j)], p = P.bestPet(x); A.render(el, { sp: p.sp, style: curStyle(), mood: "happy", stage: 1, anim: false }); });
    body.querySelector(".pg-tabs").onclick = function(e){ var b = e.target.closest("button"); if(b){ lbSort = b.dataset.s; renderSheet(); } };
  }
  function sAch(body, me){
    var got = me.ach || {}, n = ACH.filter(function(a){ return got[a.id]; }).length;
    body.innerHTML = '<div class="pg-hint">已解鎖 <b>' + n + ' / ' + ACH.length + '</b>（解鎖會給點數喔）</div><div class="pg-cards">' + ACH.map(function(a){ var ok = got[a.id]; return '<div class="pg-card' + (ok ? " own" : " lockc") + '"><div class="pg-ci">' + ic(ok ? "ach" : "lock") + '</div><div class="pg-cn">' + a.t + '</div><div class="pg-cd">' + a.d + '</div><div class="pg-cd">' + (ok ? "✓ 已完成" : "獎勵 " + ti("star") + a.p) + '</div></div>'; }).join("") + '</div>';
  }
  function sSet(body, me){
    var pet = P.actPet(me), pets = Object.keys(me.pets || {});
    body.innerHTML = '<div class="pg-sec">外觀風格</div><div class="pg-styles">' + A.STYLES.map(function(s){ return '<button type="button" class="pg-st' + (curStyle() === s.id ? " on" : "") + '" data-st="' + s.id + '"><span class="pg-sp" data-s="' + s.id + '"></span><b>' + s.name + '</b></button>'; }).join("") + '</div><div class="pg-sec">我的寵物（點一下換成牠）</div><div class="pg-grid">' + pets.map(function(k){ var p = me.pets[k]; return '<button type="button" class="pg-it' + (k === me.act ? " on" : "") + '" data-pid="' + k + '"><span class="pg-ic pgp" data-k="' + k + '"></span><span class="pg-in">' + esc(p.nm) + '</span><em>' + P.STAGES[P.stageOf(p.xp)].name + '</em></button>'; }).join("") + '</div><div class="pg-sec">替寵物改名</div><div class="pg-row"><input id="pg-rn" maxlength="10" value="' + esc(pet ? pet.nm : "") + '"><button type="button" id="pg-rnb">改名</button></div><div class="pg-sec">音效</div><button type="button" class="pg-big sm" id="pg-mute">' + (muted() ? "🔇 音效已關閉（點一下開啟）" : "🔊 音效已開啟（點一下關閉）") + '</button>';
    [].forEach.call(body.querySelectorAll(".pg-sp"), function(el){ A.render(el, { sp: pet ? pet.sp : "🐶", style: el.dataset.s, mood: "happy", stage: 1, anim: false }); });
    [].forEach.call(body.querySelectorAll(".pgp"), function(el){ var p = me.pets[el.dataset.k]; A.render(el, { sp: p.sp, style: curStyle(), mood: "happy", stage: 1, anim: false }); });
    body.onclick = function(e){ var b = e.target.closest("button"); if(!b) return;
      if(b.dataset.st){ style = b.dataset.st; try{ localStorage.setItem(STYLE_KEY, style); }catch(er){} sig = ""; update(true); SFX.pop(); }
      else if(b.dataset.pid){ mut(function(){ return { act: b.dataset.pid }; }); SFX.pop(); sig = ""; }
      else if(b.id === "pg-rnb"){ var nm = body.querySelector("#pg-rn").value.trim(); if(nm){ mut(function(cur){ return { pets: setPetPatch(cur, { nm: nm.slice(0, 10) }) }; }); SFX.claim(); } }
      else if(b.id === "pg-mute"){ try{ localStorage.setItem(MUTE_KEY, muted() ? "0" : "1"); }catch(er){} renderSheet(); } };
  }
  function sAdopt(body, me){
    var first = !P.actPet(me), chosen = "";
    body.innerHTML = '<div class="pg-hint">' + (first ? "選一隻寵物當你的夥伴！答對問題、交作業賺點數，就能買飼料、衣服，把牠養大。" : "領養新寵物（" + ti("star") + P.price("new", P.NEWPET) + "）") + '</div><div class="pg-grid4">' + P.BASIC.map(function(e){ return '<button type="button" class="pg-it" data-sp="' + e + '"><span class="pg-ic pga" data-e="' + e + '"></span></button>'; }).join("") + '</div><div class="pg-row"><input id="pg-nm" maxlength="10" placeholder="幫牠取個名字"></div><button type="button" class="pg-big" id="pg-ad">就是牠了！</button>';
    [].forEach.call(body.querySelectorAll(".pga"), function(el){ A.render(el, { sp: el.dataset.e, style: curStyle(), mood: "happy", stage: 1, anim: false }); });
    body.querySelector(".pg-grid4").onclick = function(e){ var b = e.target.closest("[data-sp]"); if(!b) return; chosen = b.dataset.sp; [].forEach.call(body.querySelectorAll("[data-sp]"), function(x){ x.classList.toggle("on", x === b); }); SFX.pop(); };
    body.querySelector("#pg-ad").onclick = async function(){ var nm = body.querySelector("#pg-nm").value.trim() || "小寶"; if(!chosen){ say("先選一隻寵物喔"); return; } var np0 = P.price("new", P.NEWPET);
      var r = await mut(function(cur){ if(P.actPet(cur) && (cur.pts || 0) < np0) return null; var pets = Object.assign({}, cur.pets), id = "p" + Date.now().toString(36); pets[id] = { sp: chosen, nm: nm, h: 70, at: Date.now(), xp: 0, pw: 1, l: 50, lt: Date.now() }; return { pets: pets, act: id, pts: (cur.pts || 0) - (P.actPet(cur) ? np0 : 0) }; });
      if(!r){ say("點數不夠喔"); return; } SFX.buy(); closeSheet(); sig = ""; update(true); burst("💖", 10); say("你好呀！我是 " + nm + "！", 3500); };
  }

  // ---------- 樣式 ----------
  var css = [
    "#pg{position:fixed;inset:0;z-index:99989;display:flex;flex-direction:column;overflow:hidden;color:#2a2018;font-family:inherit;user-select:none;-webkit-user-select:none;touch-action:manipulation;}",
    ".pg-scene,.pg-bg{position:absolute;inset:0;width:100%;height:100%;} .pg-cloud{animation:pgDrift 40s linear infinite;} .pg-cloud.c2{animation-duration:62s;animation-delay:-20s;} @keyframes pgDrift{0%{transform:translateX(-80px)}100%{transform:translateX(90px)}} .pg-wave{animation:pgWave 3s ease-in-out infinite;} @keyframes pgWave{0%,100%{transform:translateX(0)}50%{transform:translateX(-24px)}} .pg-star{animation:pgTw 3s ease-in-out infinite;} @keyframes pgTw{0%,100%{opacity:.25}50%{opacity:1}} .pg-fly{animation:pgFly 6s ease-in-out infinite;} @keyframes pgFly{0%,100%{transform:translate(0,0)}50%{transform:translate(-60px,-30px)}}",
    ".pg-top{position:relative;z-index:3;display:flex;align-items:center;gap:10px;padding:10px 12px 4px;} .pg-x{width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.92);box-shadow:0 2px 8px rgba(0,0,0,.2);font-size:18px;cursor:pointer;} .pg-info{flex:1;background:rgba(255,255,255,.92);border-radius:16px;padding:5px 12px;box-shadow:0 2px 8px rgba(0,0,0,.15);} .pg-name b{font-size:18px;} .pg-name small{margin-left:8px;color:#8a7a6a;font-size:13px;} .pg-xp{height:8px;background:#eee;border-radius:99px;overflow:hidden;margin-top:3px;} .pg-xp i{display:block;height:100%;background:linear-gradient(90deg,#5CC8FF,#7A6CFF);transition:width .6s;} .pg-pts{background:rgba(255,255,255,.95);border-radius:99px;padding:6px 14px;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,.2);display:flex;align-items:center;gap:6px;} .pg-pts b{color:#C0623A;min-width:1.5em;text-align:right;} .pg-pts.pop{animation:pgPop .5s;} @keyframes pgPop{0%,100%{transform:scale(1)}40%{transform:scale(1.25)}}",
    ".pg-stage{transition:padding-bottom .3s;} #pg.so .pg-stage{padding-bottom:calc(min(50vh,430px) + 40px);} #pg.so .pg-pet{width:min(46vw,28vh);} .pg-pet{transition:width .3s;} .pg-meters{position:relative;z-index:3;display:flex;align-items:center;gap:8px;padding:2px 12px;} .pg-m{display:flex;align-items:center;gap:4px;flex:1;max-width:190px;background:rgba(255,255,255,.88);border-radius:99px;padding:2px 8px;} .pg-m div{flex:1;height:10px;background:#eee;border-radius:99px;overflow:hidden;} .pg-m i{display:block;height:100%;transition:width .6s;} .pg-mini{width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.88);box-shadow:0 2px 6px rgba(0,0,0,.18);cursor:pointer;font-size:16px;}",
    ".pg-stage{position:relative;z-index:2;flex:1;display:flex;align-items:flex-end;justify-content:center;padding-bottom:26vh;min-height:0;} .pg-walker{position:relative;transition:transform 1.8s ease-in-out;display:flex;flex-direction:column;align-items:center;} .pg-pet{width:min(72vw,44vh);aspect-ratio:240/250;cursor:pointer;position:relative;animation:pgBob 3.2s ease-in-out infinite;transform:scaleX(var(--flip,1));-webkit-tap-highlight-color:transparent;} .pg-pet.pix{animation:none;} .pg-pet svg{width:100%;height:100%;} @keyframes pgBob{0%,100%{translate:0 0}50%{translate:0 -10px}} .pg-pet.walk{animation:pgStep .45s ease-in-out infinite;} @keyframes pgStep{0%,100%{translate:0 0;rotate:-2deg}50%{translate:0 -12px;rotate:2deg}} .pg-pet.hop{animation:pgHop .5s;} .pg-pet.hop2{animation:pgHop2 .5s ease-in-out infinite;} .pg-pet.want{filter:drop-shadow(0 0 14px #FFD23F);scale:1.06;} .pg-pet.evo{animation:pgEvo 1.6s;} @keyframes pgHop{0%{transform:scaleX(var(--flip,1)) scale(1)}30%{transform:scaleX(var(--flip,1)) scale(1.18,.82)}60%{transform:scaleX(var(--flip,1)) translateY(-40px) scale(.95,1.1)}100%{transform:scaleX(var(--flip,1)) scale(1)}} @keyframes pgHop2{0%,100%{translate:0 0}50%{translate:0 -34px}} @keyframes pgEvo{0%{filter:brightness(1)}30%{filter:brightness(4) saturate(0);transform:scaleX(var(--flip,1)) scale(1.2)}100%{filter:brightness(1)}} .pg-egg{font-size:120px;text-align:center;animation:pgBob 2s infinite;}",
    ".pg-bubble{position:absolute;top:-6px;left:50%;transform:translate(-50%,-100%) scale(.6);background:#fff;border:3px solid #4a2f22;border-radius:18px;padding:6px 14px;font-weight:700;font-size:16px;white-space:nowrap;opacity:0;transition:.25s;max-width:80vw;white-space:normal;text-align:center;z-index:4;} .pg-bubble.on{opacity:1;transform:translate(-50%,-100%) scale(1);} .pg-bubble:after{content:'';position:absolute;left:50%;bottom:-11px;margin-left:-8px;border:8px solid transparent;border-top-color:#4a2f22;border-bottom:0;}",
    ".pg-fx{position:absolute;inset:0;z-index:6;pointer-events:none;overflow:hidden;} .pg-p{position:absolute;animation:pgP 1.3s ease-out forwards;} @keyframes pgP{0%{transform:translate(0,0) scale(.4);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1.1);opacity:0}} .pg-ft{position:absolute;transform:translateX(-50%);font-weight:800;font-size:22px;text-shadow:0 2px 0 #fff;animation:pgFt 1.4s ease-out forwards;} @keyframes pgFt{0%{opacity:0;translate:0 0}20%{opacity:1}100%{opacity:0;translate:0 -70px}} .pg-fly{position:fixed;font-size:46px;z-index:9;transition:transform .55s ease-in,opacity .55s;pointer-events:none;margin:-23px 0 0 -23px;} .pg-ghost{position:fixed;font-size:56px;z-index:12;pointer-events:none;transform:translate(-50%,-60%);filter:drop-shadow(0 6px 6px rgba(0,0,0,.3));} .pg-flash{position:absolute;inset:0;z-index:8;background:#fff;animation:pgFlash 1.4s ease-out forwards;pointer-events:none;} @keyframes pgFlash{0%{opacity:0}20%{opacity:.95}100%{opacity:0}} .pg-ball{position:absolute;bottom:18%;left:-10%;font-size:44px;z-index:5;animation:pgBall 2.6s linear forwards;} @keyframes pgBall{0%{left:-10%;bottom:30%}25%{left:25%;bottom:10%}40%{left:40%;bottom:40%}55%{left:55%;bottom:12%}70%{left:70%;bottom:34%}85%{left:85%;bottom:14%}100%{left:105%;bottom:20%}}",
    ".pg-ban{position:absolute;left:50%;top:18%;transform:translateX(-50%);z-index:10;background:linear-gradient(180deg,#FFF3B8,#FFD23F);border:4px solid #E0A82E;border-radius:22px;padding:10px 24px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.3);animation:pgBan .5s cubic-bezier(.3,1.6,.5,1);max-width:92vw;} .pg-ban.out{opacity:0;transition:.4s;} .pg-ban-t{font-size:22px;font-weight:800;} .pg-ban-s{font-size:15px;color:#6b5000;} @keyframes pgBan{0%{transform:translateX(-50%) scale(.3);opacity:0}100%{transform:translateX(-50%) scale(1);opacity:1}}",
    ".pg-dock{position:relative;z-index:8;display:flex;justify-content:space-around;gap:2px;padding:6px 6px calc(8px + env(safe-area-inset-bottom));background:rgba(255,255,255,.93);border-radius:22px 22px 0 0;box-shadow:0 -4px 16px rgba(0,0,0,.18);} .pg-d{flex:1;min-width:0;border:0;background:transparent;display:flex;flex-direction:column;align-items:center;gap:1px;font-size:12px;font-weight:700;cursor:pointer;color:#4a2f22;padding:2px 0;font-family:inherit;} .pg-di{position:relative;width:44px;height:44px;border-radius:14px;background:linear-gradient(180deg,#FFF1D0,#FFD98A);display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 3px 0 #E0A82E;} .pg-d.on .pg-di{background:linear-gradient(180deg,#FFD2C4,#FF9A80);box-shadow:0 3px 0 #D9694F;transform:translateY(-4px);} .pg-di em{position:absolute;top:-5px;right:-5px;background:#E0524A;color:#fff;border-radius:99px;font-style:normal;font-size:11px;min-width:18px;height:18px;line-height:18px;text-align:center;}",
    ".pg-sheet{position:absolute;left:0;right:0;bottom:0;z-index:7;max-height:50vh;display:flex;flex-direction:column;background:linear-gradient(180deg,#FFFDF6,#FFF6E4);border-radius:24px 24px 0 0;box-shadow:0 -8px 30px rgba(0,0,0,.3);animation:pgUp .28s ease-out;padding-bottom:calc(84px + env(safe-area-inset-bottom));} @keyframes pgUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}} .pg-sh{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 4px;font-size:18px;} .pg-sx{border:0;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:15px;} .pg-sb{overflow:auto;padding:4px 14px 12px;flex:1;min-height:0;-webkit-overflow-scrolling:touch;} .pg-hint{font-size:14px;color:#6b5b4b;margin:6px 0;} .pg-hint b{color:#C0623A;font-size:18px;} .pg-sec{font-weight:800;margin:12px 0 6px;font-size:15px;} .pg-sec small{font-weight:400;color:#8a7a6a;}",
    ".pg-foods{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px;} .pg-food{display:flex;flex-direction:column;align-items:center;border:3px solid #F0DFC0;border-radius:18px;background:#fff;padding:8px 2px;cursor:grab;font-family:inherit;color:#2a2018;touch-action:none;} .pg-food .fe{font-size:42px;line-height:1.1;} .pg-food .fn{font-weight:700;font-size:13px;} .pg-food em{font-style:normal;color:#C0623A;font-weight:800;} .pg-food small{font-size:10px;color:#8a7a6a;} .pg-food:disabled{opacity:.4;cursor:default;} .pg-food:not(:disabled):hover{border-color:#C0623A;background:#FDECE6;}",
    ".pg-big{display:block;width:100%;margin:12px 0;border:0;border-radius:18px;padding:14px;font-size:20px;font-weight:800;color:#fff;background:linear-gradient(180deg,#FF9A80,#E0624A);box-shadow:0 5px 0 #B5442F;cursor:pointer;font-family:inherit;} .pg-big:active{transform:translateY(3px);box-shadow:0 2px 0 #B5442F;} .pg-big:disabled{background:#bbb;box-shadow:0 5px 0 #888;} .pg-big.sm{font-size:15px;padding:10px;}",
    ".pg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:8px;} .pg-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;} .pg-it{position:relative;border:3px solid #F0DFC0;border-radius:16px;background:#fff;padding:4px 2px 6px;display:flex;flex-direction:column;align-items:center;cursor:pointer;font-family:inherit;color:#2a2018;} .pg-it.on{border-color:#C0623A;background:#FDECE6;} .pg-it.lock{opacity:.45;} .pg-ic{display:block;width:64px;height:60px;} .pg-ic svg,.pg-ic .pa-pixwrap{width:100%;height:100%;} .pg-in{font-size:12px;font-weight:700;} .pg-it em{font-style:normal;font-size:10px;color:#C0623A;} .pg-th{width:64px;height:64px;} .pg-row{display:flex;gap:8px;margin:8px 0;} .pg-row input{flex:1;border:3px solid #F0DFC0;border-radius:14px;padding:8px 12px;font-size:16px;font-family:inherit;min-width:0;} .pg-row button{border:0;border-radius:14px;padding:0 18px;background:#C0623A;color:#fff;font-weight:800;cursor:pointer;font-size:15px;}",
    ".pg-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:8px;} .pg-card{border:3px solid #F0DFC0;border-radius:18px;background:#fff;padding:8px 4px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:2px;} .pg-card.own{background:#F1F7EC;border-color:#CFE5C3;} .pg-card.lockc{opacity:.55;} .pg-ci{font-size:38px;line-height:1.1;height:56px;display:flex;align-items:center;justify-content:center;} .pg-pi{display:block;width:64px;height:62px;} .pg-pi svg,.pg-pi .pa-pixwrap{width:100%;height:100%;} .pg-sv{display:block;width:70px;height:48px;} .pg-sv svg{width:100%;height:100%;} .pg-cn{font-weight:800;font-size:13px;} .pg-cd{font-size:11px;color:#8a7a6a;min-height:1.1em;} .pg-card button{margin-top:4px;border:0;background:linear-gradient(180deg,#FFB36B,#F2862F);color:#fff;border-radius:99px;padding:5px 14px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 3px 0 #C5651A;font-family:inherit;} .pg-card button:disabled{background:#c9c9c9;box-shadow:0 3px 0 #999;cursor:default;}",
    ".pg-days{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;} .pg-day{background:#fff;border:2px solid #F0DFC0;border-radius:12px;text-align:center;padding:5px 0;font-size:11px;} .pg-day b{display:block;font-size:14px;color:#C0623A;} .pg-day.done{background:#E3F4DA;border-color:#B9DFA6;} .pg-day.done b{color:#4CAF6A;} .pg-day.today{border-color:#C0623A;background:#FDECE6;animation:pgPulse 1.2s infinite;} @keyframes pgPulse{50%{transform:scale(1.07)}} .pg-q{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid #F0DFC0;border-radius:14px;padding:8px 12px;margin:6px 0;} .pg-qt{flex:1;} .pg-qb{height:8px;background:#eee;border-radius:99px;overflow:hidden;margin:4px 0;} .pg-qb i{display:block;height:100%;background:#7ACB6B;} .pg-q button{border:0;background:linear-gradient(180deg,#FFB36B,#F2862F);color:#fff;border-radius:99px;padding:6px 14px;font-weight:800;cursor:pointer;} .pg-got,.pg-reward{font-size:13px;color:#8a7a6a;font-weight:700;}",
    ".pg-tabs{display:flex;gap:6px;margin:6px 0;} .pg-tabs button{flex:1;border:2px solid #F0DFC0;background:#fff;border-radius:12px;padding:6px;font-weight:700;cursor:pointer;font-family:inherit;color:#2a2018;} .pg-tabs button.on{background:#C0623A;border-color:#C0623A;color:#fff;} .pg-pod{display:flex;justify-content:center;align-items:flex-end;gap:8px;margin:10px 0;} .pg-pp{background:#fff;border:3px solid #F0DFC0;border-radius:18px;padding:4px 8px;text-align:center;min-width:84px;} .pg-pp.p0{order:2;border-color:#E0A82E;box-shadow:0 0 0 3px #FFE9A8;padding-top:10px;} .pg-pp.p1{order:1;} .pg-pp.p2{order:3;} .pg-pp .pm{font-size:24px;} .pg-pp .pa{width:70px;height:72px;margin:0 auto;} .pg-pp .pa svg,.pg-pp .pa .pa-pixwrap{width:100%;height:100%;} .pg-pp .pn{font-weight:800;font-size:13px;} .pg-pp .pv{color:#C0623A;font-weight:800;} .pg-lr{display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:12px;margin:3px 0;background:#fff;} .pg-lr.me{background:#FDECE6;border:2px solid #C0623A;} .pg-lr .rk{width:1.8em;text-align:center;font-weight:800;} .pg-lr .re{width:38px;height:38px;} .pg-lr .re svg,.pg-lr .re .pa-pixwrap{width:100%;height:100%;} .pg-lr small{flex:1;color:#8a7a6a;} .pg-lr em{font-style:normal;font-weight:800;color:#C0623A;}",
    ".pg-styles{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;} .pg-st{border:3px solid #F0DFC0;border-radius:16px;background:#fff;padding:4px;display:flex;flex-direction:column;align-items:center;cursor:pointer;font-family:inherit;color:#2a2018;} .pg-st.on{border-color:#C0623A;background:#FDECE6;} .pg-sp{display:block;width:84px;height:88px;} .pg-sp svg,.pg-sp .pa-pixwrap{width:100%;height:100%;}"
  ,".pg-qz{background:#fff;border:3px solid #1b1212;border-radius:18px;padding:12px;text-align:center;} .pg-qw{font-size:44px;font-weight:800;line-height:1.2;} .pg-qw.sm{font-size:28px;} .pg-qh{font-size:15px;color:#6b5b4b;margin:2px 0 10px;font-weight:700;} .pg-qsay{width:64px;height:64px;border-radius:50%;border:3px solid #1b1212;background:#FFE9C2;box-shadow:0 3px 0 #1b1212;padding:10px;cursor:pointer;margin:0 auto 4px;display:block;} .pg-qsay:active{transform:translateY(2px);} .pg-qo{display:grid;grid-template-columns:1fr 1fr;gap:8px;} .pg-qopt{border:3px solid #1b1212;border-radius:14px;background:#FFF6E4;box-shadow:0 3px 0 #1b1212;padding:10px 6px;font-size:20px;font-weight:800;font-family:inherit;color:#1b1212;cursor:pointer;min-height:54px;} .pg-qopt:active{transform:translateY(2px);box-shadow:0 1px 0 #1b1212;} .pg-qopt.ok{background:#BFE8A6;} .pg-qopt.bad{background:#FFB3A8;animation:pgShake .3s;} .pg-qopt.dim{opacity:.45;} @keyframes pgShake{25%{translate:-5px 0}75%{translate:5px 0}} .pg-chips{display:flex;flex-wrap:wrap;gap:6px;} .pg-chip{background:#FFF6E4;border:2px solid #1b1212;border-radius:99px;padding:2px 10px;font-weight:700;font-size:15px;} .pg-ti2{display:inline-block;width:1.15em;height:1.15em;vertical-align:-.2em;margin:0 .1em;} .pg-food .fe,.pg-ci{line-height:0;} .pg-food .fe svg{width:54px;height:54px;} .pg-ci svg{width:52px;height:52px;} .pg-p svg{width:100%;height:100%;} .pg-fly svg,.pg-ghost svg,.pg-ball svg{width:56px;height:56px;display:block;} .pg-egg svg{width:140px;height:140px;} .pg-d{gap:7px !important;} .pg-di{margin-bottom:2px;} .pg-ti{display:inline-block;width:28px;height:28px;vertical-align:-7px;margin-right:6px;} .pg-sx{padding:5px !important;width:34px !important;height:34px !important;} .pg-md{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;border:2.6px solid #1b1212;font-weight:800;font-size:14px;color:#1b1212;} .pg-md.m0{background:#FFD23F;} .pg-md.m1{background:#D5DCE4;} .pg-md.m2{background:#E3A36B;} .pg-i2{display:block;width:100%;height:100%;} .pg-x{padding:6px;background:#FFF6E4 !important;border:3px solid #1b1212 !important;box-shadow:0 3px 0 #1b1212 !important;} .pg-info{background:#FFF6E4 !important;border:3px solid #1b1212;box-shadow:0 3px 0 #1b1212 !important;border-radius:18px !important;} .pg-xp{background:#E9D9BC !important;border:2px solid #1b1212;height:10px !important;} .pg-xp i{background:#7ACB6B !important;} .pg-pts{background:#FFF6E4 !important;border:3px solid #1b1212;box-shadow:0 3px 0 #1b1212 !important;} .pg-star{width:26px;height:26px;display:block;} .pg-m{background:#FFF6E4 !important;border:3px solid #1b1212;border-radius:99px !important;padding:1px 8px 1px 4px !important;} .pg-mi{width:22px;height:22px;display:block;} .pg-m div{background:#E9D9BC !important;border:2px solid #1b1212;} .pg-mini{padding:4px !important;background:#FFF6E4 !important;border:3px solid #1b1212 !important;box-shadow:0 3px 0 #1b1212 !important;width:38px !important;height:38px !important;}",
    ".pg-dock{background:#FFF6E4 !important;border:3px solid #1b1212 !important;border-bottom:0 !important;box-shadow:none !important;padding-top:8px !important;} .pg-d{color:#1b1212 !important;font-size:12px !important;} .pg-di{background:#FFE9C2 !important;border:3px solid #1b1212;box-shadow:0 3px 0 #1b1212 !important;padding:3px;width:48px !important;height:48px !important;border-radius:16px !important;} .pg-d.on .pg-di{background:#FFC9B8 !important;box-shadow:0 3px 0 #1b1212 !important;transform:translateY(-4px);} .pg-di em{border:2px solid #1b1212;} .pg-bubble{border-color:#1b1212 !important;} .pg-bubble:after{border-top-color:#1b1212 !important;} .pg-sheet{border:3px solid #1b1212;border-bottom:0;background:#FFF6E4 !important;} .pg-sx{border:2px solid #1b1212 !important;background:#fff !important;}"
  ].join("\n");
  var stl = document.createElement("style"); stl.textContent = css; document.head.appendChild(stl);
})();
