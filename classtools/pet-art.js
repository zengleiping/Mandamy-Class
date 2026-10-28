/* 寵物美術：用向量（SVG）畫出 20 種寵物與 16 件衣服，支援三種風格（可愛手繪 cute／扁平簡約 flat／像素復古 pixel）、
   各種心情（開心、普通、難過、餓、吃東西、睡覺、愛心）、成長階段與動畫。不需要任何圖檔。 */
(function(){
  "use strict";
  var A = window.PETART = {};
  A.STYLES = [{ id: "cute", name: "可愛手繪" }, { id: "pixel", name: "像素復古" }, { id: "flat", name: "扁平簡約" }];
  var DK = "#4a2f22";
  function shade(hex, amt){ var n = parseInt(hex.slice(1), 16), r = Math.max(0, Math.min(255, (n >> 16) + amt)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt)), b = Math.max(0, Math.min(255, (n & 255) + amt)); return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
  A.shade = shade;
  function mkStyle(cute){
    var st = cute ? ' stroke="' + DK + '" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"' : ' stroke="rgba(70,45,30,.32)" stroke-width="2" stroke-linejoin="round"';
    return { cute: cute,
      P: function(d, f, x){ return '<path d="' + d + '" fill="' + f + '"' + st + (x ? " " + x : "") + '/>'; },
      E: function(cx, cy, rx, ry, f, x){ return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + st + (x ? " " + x : "") + '/>'; },
      C: function(cx, cy, r, f, x){ return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '"' + st + (x ? " " + x : "") + '/>'; },
      R: function(x0, y0, w, h, r, f, x){ return '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + f + '"' + st + (x ? " " + x : "") + '/>'; },
      L: function(d, col, w, x){ return '<path d="' + d + '" fill="none" stroke="' + (col || DK) + '" stroke-width="' + (w || 3) + '" stroke-linecap="round" stroke-linejoin="round"' + (x ? " " + x : "") + '/>'; },
      N: function(d, f, x){ return '<path d="' + d + '" fill="' + f + '"' + (x ? " " + x : "") + '/>'; }   // 無外框的細節
    };
  }

  // ---------- 物種 ----------
  var SP = {};
  function def(id, emoji, name, body, belly, o){ o = o || {}; o.id = id; o.e = emoji; o.name = name; o.body = body; o.belly = belly; SP[id] = o; }
  var inner = function(c){ return shade(c, 40); };

  def("dog", "🐶", "小狗", "#E8B77D", "#FFF1DC", {
    back: function(S, c){ return S.P("M140 150 Q172 130 168 108 Q166 124 150 140 Z", c.body); },
    ears: function(S, c){ return S.E(50, 82, 17, 30, "#9C6B3F", 'transform="rotate(14 50 82)"') + S.E(150, 82, 17, 30, "#9C6B3F", 'transform="rotate(-14 150 82)"'); },
    mid: function(S, c){ return S.E(100, 118, 25, 19, "#FFF1DC") + (S.cute ? S.N("M64 84 Q72 70 86 76 Q82 92 66 96 Z", "#9C6B3F", 'opacity=".9"') : S.N("M64 84 Q72 70 86 76 Q82 92 66 96 Z", "#9C6B3F")); },
    nose: function(S){ return S.E(100, 108, 8.5, 6, "#2b1d16"); } });
  def("cat", "🐱", "小貓", "#F2A65A", "#FFF3E0", {
    back: function(S, c){ return S.P("M142 160 Q192 150 184 100 Q172 124 150 138 Z", c.body) + S.N("M176 118 Q184 108 182 100 Q172 124 160 132 Z", "#D9822B"); },
    ears: function(S, c){ return S.P("M52 66 L58 26 L88 52 Z", c.body) + S.N("M60 56 L62 38 L77 51 Z", "#FFB8C0") + S.P("M148 66 L142 26 L112 52 Z", c.body) + S.N("M140 56 L138 38 L123 51 Z", "#FFB8C0"); },
    mid: function(S){ return S.N("M95 52 L95 66 M100 50 L100 66 M105 52 L105 66", "none", 'stroke="#D9822B" stroke-width="4" stroke-linecap="round"') + S.L("M52 112 L28 108 M52 120 L28 124 M148 112 L172 108 M148 120 L172 124", "#6b4a35", 2.2); },
    nose: function(S){ return S.P("M94 107 L106 107 L100 114 Z", "#FF8FA3"); } });
  def("rabbit", "🐰", "小兔", "#F5F0EA", "#FFFFFF", {
    back: function(S){ return S.C(150, 168, 14, "#FFFFFF"); },
    ears: function(S, c){ return S.E(72, 30, 16, 42, c.body, 'transform="rotate(-8 72 30)"') + S.E(72, 32, 8, 32, "#FFB8C8", 'transform="rotate(-8 72 32)"') + S.E(128, 30, 16, 42, c.body, 'transform="rotate(8 128 30)"') + S.E(128, 32, 8, 32, "#FFB8C8", 'transform="rotate(8 128 32)"'); },
    mid: function(S){ return ""; },
    nose: function(S){ return S.P("M95 107 Q100 104 105 107 Q100 114 95 107 Z", "#FF8FA3") + S.L("M100 112 L100 118", DK, 2); } });
  def("hamster", "🐹", "倉鼠", "#F2CF9B", "#FFFFFF", {
    ears: function(S){ return S.C(56, 58, 14, "#F2CF9B") + S.C(56, 58, 7, "#FFB8C0", S.cute ? 'stroke="none"' : "") + S.C(144, 58, 14, "#F2CF9B") + S.C(144, 58, 7, "#FFB8C0", S.cute ? 'stroke="none"' : ""); },
    mid: function(S){ return S.N("M60 78 Q70 62 86 70 Q80 84 66 90 Z", "#E09B4D") + S.N("M140 78 Q130 62 114 70 Q120 84 134 90 Z", "#E09B4D") + S.E(52, 118, 20, 17, "#FFE3C2", S.cute ? 'stroke="none"' : "") + S.E(148, 118, 20, 17, "#FFE3C2", S.cute ? 'stroke="none"' : ""); },
    nose: function(S){ return S.E(100, 108, 5, 4, "#E8838F") + S.R(95, 119, 5, 8, 1.5, "#fff") + S.R(100, 119, 5, 8, 1.5, "#fff"); } });
  def("chick", "🐥", "小雞", "#FFD84D", "#FFF3A8", {
    arms: "#F2B71F", feet: "#FF9A3C",
    ears: function(S){ return ""; },
    back: function(S){ return ""; },
    mid: function(S){ return S.P("M94 48 Q92 34 98 28 Q100 40 102 28 Q108 34 106 48 Z", "#F2B71F"); },
    nose: function(S){ return S.P("M90 106 Q100 100 110 106 Q100 120 90 106 Z", "#FF9A3C"); } });
  def("fox", "🦊", "小狐狸", "#EE7B30", "#FFFFFF", {
    back: function(S){ return S.P("M140 164 Q200 170 196 108 Q184 144 150 146 Z", "#EE7B30") + S.N("M190 130 Q198 112 196 108 Q186 120 178 128 Z", "#FFFFFF"); },
    ears: function(S, c){ return S.P("M48 70 L52 24 L90 52 Z", c.body) + S.N("M54 50 L52 32 L72 46 Z", "#3a2a22") + S.P("M152 70 L148 24 L110 52 Z", c.body) + S.N("M146 50 L148 32 L128 46 Z", "#3a2a22"); },
    mid: function(S){ return S.N("M48 106 Q60 134 100 132 Q140 134 152 106 Q130 116 100 114 Q70 116 48 106 Z", "#FFFFFF") ; },
    nose: function(S){ return S.E(100, 112, 7, 5, "#2b1d16"); } });
  def("panda", "🐼", "熊貓", "#FFFFFF", "#FFFFFF", {
    arms: "#33302e", feet: "#33302e",
    ears: function(S){ return S.C(54, 56, 17, "#33302e") + S.C(146, 56, 17, "#33302e"); },
    mid: function(S){ return S.E(76, 100, 15, 19, "#33302e", 'transform="rotate(24 76 100)"') + S.E(124, 100, 15, 19, "#33302e", 'transform="rotate(-24 124 100)"'); },
    eyeFill: "#ffffff", nose: function(S){ return S.E(100, 112, 8, 5.5, "#33302e"); } });
  def("frog", "🐸", "青蛙", "#7CC85A", "#E8F7C8", {
    eyes: "frog",
    ears: function(S){ return S.C(68, 56, 19, "#7CC85A") + S.C(132, 56, 19, "#7CC85A"); },
    mid: function(S){ return S.E(56, 118, 14, 10, "#FF9DAA", S.cute ? 'stroke="none" opacity=".55"' : 'opacity=".55"') + S.E(144, 118, 14, 10, "#FF9DAA", S.cute ? 'stroke="none" opacity=".55"' : 'opacity=".55"'); },
    nose: function(S){ return S.C(94, 108, 2, "#3b7a2a", 'stroke="none"') + S.C(106, 108, 2, "#3b7a2a", 'stroke="none"'); } });
  def("penguin", "🐧", "企鵝", "#3B4A5A", "#FFFFFF", {
    arms: "#2f3b49", feet: "#FF9A3C",
    mid: function(S){ return S.P("M60 92 Q62 70 82 78 Q100 86 118 78 Q138 70 140 92 Q140 128 100 136 Q60 128 60 92 Z", "#FFFFFF", S.cute ? 'stroke="none"' : ""); },
    ears: function(S){ return ""; },
    nose: function(S){ return S.P("M90 108 Q100 102 110 108 Q100 120 90 108 Z", "#FF9A3C"); } });
  def("bear", "🐻", "小熊", "#A8734A", "#D9B68A", {
    ears: function(S, c){ return S.C(54, 56, 17, c.body) + S.C(54, 56, 8, "#D9B68A", S.cute ? 'stroke="none"' : "") + S.C(146, 56, 17, c.body) + S.C(146, 56, 8, "#D9B68A", S.cute ? 'stroke="none"' : ""); },
    mid: function(S){ return S.E(100, 118, 24, 18, "#E6C9A0"); },
    nose: function(S){ return S.E(100, 108, 8, 5.5, "#2b1d16"); } });
  def("cow", "🐮", "小牛", "#F8F8F8", "#FFFFFF", {
    ears: function(S, c){ return S.E(40, 78, 22, 12, "#F8F8F8", 'transform="rotate(-18 40 78)"') + S.E(160, 78, 22, 12, "#F8F8F8", 'transform="rotate(18 160 78)"') + S.P("M62 56 Q58 36 70 30 Q74 44 76 54 Z", "#F2E3B8") + S.P("M138 56 Q142 36 130 30 Q126 44 124 54 Z", "#F2E3B8"); },
    mid: function(S){ return S.N("M60 78 Q72 56 92 62 Q90 82 76 92 Q64 92 60 78 Z", "#3d3a38") + S.E(100, 120, 28, 18, "#FFB8C4"); },
    nose: function(S){ return S.E(90, 120, 3.5, 5, "#C96A7C", S.cute ? 'stroke="none"' : "") + S.E(110, 120, 3.5, 5, "#C96A7C", S.cute ? 'stroke="none"' : ""); }, mouthY: 8 });
  def("pig", "🐷", "小豬", "#FFB6C1", "#FFD6DC", {
    back: function(S){ return S.L("M142 160 Q168 150 160 136 Q150 130 156 122", "#E88FA0", 4); },
    ears: function(S, c){ return S.P("M52 70 L50 34 L84 54 Z", "#FF9DB0") + S.P("M148 70 L150 34 L116 54 Z", "#FF9DB0"); },
    mid: function(S){ return S.E(100, 116, 22, 16, "#FF8FA3"); },
    nose: function(S){ return S.E(92, 116, 3.5, 5, "#B3506A", S.cute ? 'stroke="none"' : "") + S.E(108, 116, 3.5, 5, "#B3506A", S.cute ? 'stroke="none"' : ""); }, mouthY: 14 });
  // ----- 強化寵物 -----
  def("lion", "🦁", "獅子", "#E9B14F", "#FFF1D0", {
    back: function(S){ return S.P("M142 160 Q186 158 184 122 Q170 142 148 146 Z", "#E9B14F") + S.C(186, 118, 9, "#B36B2E"); },
    ears: function(S){ var m = ""; for(var i = 0; i < 14; i++){ var a = i / 14 * Math.PI * 2; m += S.C(100 + Math.cos(a) * 58, 98 + Math.sin(a) * 52, 20, "#B36B2E"); } return m + S.C(100, 98, 62, "#B36B2E") + S.C(56, 60, 13, "#E9B14F") + S.C(144, 60, 13, "#E9B14F"); },
    mid: function(S){ return S.E(100, 118, 25, 18, "#FFF1D0"); },
    nose: function(S){ return S.P("M92 106 L108 106 L100 115 Z", "#E8838F"); } });
  def("tiger", "🐯", "老虎", "#F29A32", "#FFF1D8", {
    back: function(S){ return S.P("M142 162 Q190 156 186 112 Q172 140 148 148 Z", "#F29A32") + S.N("M176 130 L186 126 M172 138 L184 136", "none", 'stroke="#2b1d16" stroke-width="5" stroke-linecap="round"'); },
    ears: function(S, c){ return S.C(54, 56, 16, c.body) + S.C(54, 56, 8, "#FFF1D8", S.cute ? 'stroke="none"' : "") + S.C(146, 56, 16, c.body) + S.C(146, 56, 8, "#FFF1D8", S.cute ? 'stroke="none"' : ""); },
    mid: function(S){ return S.N("M100 50 L100 70 M88 54 L90 68 M112 54 L110 68 M48 90 L66 94 M48 104 L64 104 M152 90 L134 94 M152 104 L136 104", "none", 'stroke="#2b1d16" stroke-width="5" stroke-linecap="round"') + S.E(100, 118, 25, 18, "#FFF1D8"); },
    nose: function(S){ return S.P("M92 106 L108 106 L100 115 Z", "#E8838F"); } });
  def("wolf", "🐺", "野狼", "#8F9BAA", "#E6EBF0", {
    back: function(S){ return S.P("M142 164 Q196 170 190 112 Q178 150 148 148 Z", "#8F9BAA") + S.N("M186 128 Q192 114 190 112 Q182 126 172 134 Z", "#E6EBF0"); },
    ears: function(S, c){ return S.P("M50 72 L48 18 L92 54 Z", c.body) + S.N("M56 56 L54 34 L76 50 Z", "#C9D1DB") + S.P("M150 72 L152 18 L108 54 Z", c.body) + S.N("M144 56 L146 34 L124 50 Z", "#C9D1DB"); },
    mid: function(S){ return S.N("M46 108 Q54 132 76 124 Q60 116 50 100 Z M154 108 Q146 132 124 124 Q140 116 150 100 Z", "#E6EBF0") + S.E(100, 118, 24, 17, "#E6EBF0"); },
    nose: function(S){ return S.E(100, 108, 8, 5.5, "#2b1d16"); } });
  def("eagle", "🦅", "老鷹", "#8B5A3C", "#F2E3C8", {
    arms: "#6f4630", feet: "#FFC83D",
    back: function(S){ return S.P("M58 128 Q10 112 14 168 Q40 150 60 156 Z", "#6f4630") + S.P("M142 128 Q190 112 186 168 Q160 150 140 156 Z", "#6f4630"); },
    ears: function(S){ return ""; },
    headFill: "#FFFFFF", mid: function(S){ return S.N("M62 62 Q100 40 138 62", "none", 'stroke="#fff" stroke-width="1"'); },
    nose: function(S){ return S.P("M88 108 Q100 98 112 108 Q108 126 100 130 Q92 126 88 108 Z", "#FFC83D"); }, mouthY: 20 });
  def("trex", "🦖", "暴龍", "#6DBE6A", "#D9F0B0", {
    back: function(S){ var sp = ""; [[78, 56], [100, 46], [122, 56]].forEach(function(p){ sp += S.P("M" + (p[0] - 9) + " " + p[1] + " L" + p[0] + " " + (p[1] - 18) + " L" + (p[0] + 9) + " " + p[1] + " Z", "#4E9B4C"); }); return S.P("M140 156 Q196 170 190 124 Q180 154 148 142 Z", "#6DBE6A") + sp; },
    ears: function(S){ return ""; },
    mid: function(S){ return S.N("M60 74 L66 62 L74 74 M126 74 L134 62 L140 74", "none", 'stroke="#4E9B4C" stroke-width="3" stroke-linecap="round"') + S.E(100, 120, 30, 18, "#8FD88A"); },
    nose: function(S){ return S.C(92, 106, 2.5, "#3b7a2a", 'stroke="none"') + S.C(108, 106, 2.5, "#3b7a2a", 'stroke="none"'); }, mouthY: 6, teeth: true });
  def("unicorn", "🦄", "獨角獸", "#FFF3FA", "#FFFFFF", {
    back: function(S){ return S.P("M142 160 Q196 174 190 124 Q180 148 150 146 Z", "#B58CFF") + S.P("M150 154 Q190 150 184 120 Q176 140 152 144 Z", "#7CD4FF"); },
    ears: function(S, c){ return S.P("M60 62 L58 30 L84 52 Z", c.body) + S.P("M140 62 L142 30 L116 52 Z", c.body) + S.P("M66 60 Q40 40 36 90 Q50 76 70 84 Z", "#FF8FC8") + S.P("M134 60 Q160 40 164 90 Q150 76 130 84 Z", "#7CD4FF"); },
    mid: function(S){ return S.P("M92 54 L100 6 L108 54 Z", "#FFD76A") + S.N("M94 44 L106 40 M96 32 L104 28 M98 20 L102 18", "none", 'stroke="#E0A82E" stroke-width="2.5" stroke-linecap="round"') + S.P("M60 70 Q90 36 118 60 Q94 54 80 80 Z", "#B58CFF"); },
    nose: function(S){ return S.E(94, 110, 2.5, 2, "#E8838F") + S.E(106, 110, 2.5, 2, "#E8838F"); } });
  def("dragon", "🐲", "小龍", "#E85D75", "#FFD9A0", {
    back: function(S){ return S.P("M60 120 Q8 70 20 140 Q36 130 50 146 Z", "#8E5BD0") + S.P("M140 120 Q192 70 180 140 Q164 130 150 146 Z", "#8E5BD0") + S.P("M142 160 Q196 166 188 118 Q178 150 148 148 Z", "#E85D75") + S.P("M184 124 L198 114 L192 134 Z", "#FFD9A0"); },
    ears: function(S){ return S.P("M62 62 L54 22 L84 50 Z", "#FFE9B8") + S.P("M138 62 L146 22 L116 50 Z", "#FFE9B8"); },
    mid: function(S){ return S.N("M88 52 L100 38 L112 52", "none", 'stroke="#8E5BD0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"') + S.E(100, 118, 24, 16, "#FF8FA3", 'opacity=".5"'); },
    nose: function(S){ return S.C(94, 108, 2.2, "#7a2a3a", 'stroke="none"') + S.C(106, 108, 2.2, "#7a2a3a", 'stroke="none"'); } });
  def("god", "🐉", "神龍", "#F2C14E", "#FFF3C4", {
    back: function(S){ return S.P("M142 158 Q200 172 192 112 Q184 156 150 146 Z", "#F2C14E") + S.P("M60 140 Q10 130 22 84 Q38 112 62 118 Z", "#2BB5A7") + S.P("M140 140 Q190 130 178 84 Q162 112 138 118 Z", "#2BB5A7"); },
    ears: function(S){ return S.P("M64 62 L48 14 L52 12 L86 50 Z", "#FFE9A8") + S.P("M136 62 L152 14 L148 12 L114 50 Z", "#FFE9A8") + S.L("M54 70 Q10 70 14 102 M146 70 Q190 70 186 102", "#2BB5A7", 4); },
    mid: function(S){ return S.N("M70 64 Q100 40 130 64 Q100 54 70 64 Z", "#2BB5A7") + S.E(100, 118, 24, 16, "#FFF3C4") + S.N("M86 150 L90 156 M100 152 L104 158 M114 150 L118 156", "none", 'stroke="#2BB5A7" stroke-width="3" stroke-linecap="round"'); },
    nose: function(S){ return S.C(94, 108, 2.2, "#8a5a00", 'stroke="none"') + S.C(106, 108, 2.2, "#8a5a00", 'stroke="none"'); } });
  A.SPECIES = SP;
  var E2I = {}; Object.keys(SP).forEach(function(k){ E2I[SP[k].e] = k; }); A.byEmoji = function(e){ return SP[E2I[e] || "dog"]; };

  // ---------- 表情 ----------
  function eyes(S, mood, sp){
    var out = "", L = [76, 98], R = [124, 98], big = S.cute ? 1 : 0.85;
    if(sp.eyes === "frog"){
      var eyeFrog = function(x){ return S.C(x, 58, 15, "#FFFFFF") + (mood === "sleep" || mood === "eat" || mood === "love" ? S.L("M" + (x - 8) + " 60 Q" + x + " 52 " + (x + 8) + " 60", DK, 3.5) : S.C(x, 60, 7.5, "#2b1d16") + S.C(x - 2.5, 57, 2.4, "#fff", 'stroke="none"')); };
      return '<g class="pa-eyes">' + eyeFrog(68) + eyeFrog(132) + "</g>";
    }
    function open(cx, cy){
      var w = sp.eyeFill ? "#FFFFFF" : null, g = "";
      if(S.cute) g = S.E(cx, cy, 9.5 * big, 11 * big, "#2b1d16", 'stroke="none"') + '<circle cx="' + (cx - 3) + '" cy="' + (cy - 4) + '" r="3.6" fill="#fff"/><circle cx="' + (cx + 3.5) + '" cy="' + (cy + 4) + '" r="1.8" fill="#fff"/>';
      else g = '<circle cx="' + cx + '" cy="' + cy + '" r="7.5" fill="#2b2b2b"/>' + '<circle cx="' + (cx - 2) + '" cy="' + (cy - 2.5) + '" r="2" fill="#fff"/>';
      return g;
    }
    var happyArc = function(cx, cy){ return S.L("M" + (cx - 9) + " " + (cy + 3) + " Q" + cx + " " + (cy - 10) + " " + (cx + 9) + " " + (cy + 3), "#2b1d16", 4); };
    var closeArc = function(cx, cy){ return S.L("M" + (cx - 9) + " " + (cy - 1) + " Q" + cx + " " + (cy + 8) + " " + (cx + 9) + " " + (cy - 1), "#2b1d16", 3.6); };
    var heart = function(cx, cy){ return '<path d="M' + cx + ' ' + (cy + 9) + ' C' + (cx - 16) + ' ' + (cy - 2) + ' ' + (cx - 8) + ' ' + (cy - 14) + ' ' + cx + ' ' + (cy - 5) + ' C' + (cx + 8) + ' ' + (cy - 14) + ' ' + (cx + 16) + ' ' + (cy - 2) + ' ' + cx + ' ' + (cy + 9) + ' Z" fill="#FF4D6D"/>'; };
    if(mood === "sleep") out = '<g class="pa-eyes-sleep">' + closeArc(L[0], L[1]) + closeArc(R[0], R[1]) + "</g>";
    else if(mood === "eat") out = happyArc(L[0], L[1]) + happyArc(R[0], R[1]);
    else if(mood === "love") out = heart(L[0], L[1]) + heart(R[0], R[1]);
    else { out = '<g class="pa-eyes">' + open(L[0], L[1]) + open(R[0], R[1]) + "</g>"; if(mood === "sad" || mood === "hungry") out += S.L("M62 86 L88 80 M138 86 L112 80", DK, 3.2); if(mood === "sad") out += '<path d="M70 112 Q66 124 72 126 Q78 124 70 112 Z" fill="#7CC8FF"/>'; }
    return out;
  }
  function mouth(S, mood, sp){
    var y = 118 + (sp.mouthY || 0), x = 100, out = "";
    if(sp.teeth && mood !== "sad") out += S.N("M86 " + (y + 2) + " L90 " + (y + 12) + " L94 " + (y + 2) + " M106 " + (y + 2) + " L110 " + (y + 12) + " L114 " + (y + 2), "#fff", 'stroke="' + DK + '" stroke-width="1.5"');
    if(mood === "happy" || mood === "love") out += '<path d="M89 ' + (y - 3) + ' Q100 ' + (y + 20) + ' 111 ' + (y - 3) + ' Z" fill="#6b2a2a"' + (S.cute ? ' stroke="' + DK + '" stroke-width="3" stroke-linejoin="round"' : "") + '/><path d="M94 ' + (y + 8) + ' Q100 ' + (y + 15) + ' 106 ' + (y + 8) + ' Q100 ' + (y + 5) + ' 94 ' + (y + 8) + ' Z" fill="#FF8FA3"/>';
    else if(mood === "eat") out += '<g class="pa-chew"><ellipse cx="100" cy="' + (y + 4) + '" rx="9" ry="8" fill="#6b2a2a"' + (S.cute ? ' stroke="' + DK + '" stroke-width="3"' : "") + '/><ellipse cx="100" cy="' + (y + 8) + '" rx="5" ry="3.5" fill="#FF8FA3"/></g>';
    else if(mood === "sad") out += S.L("M90 " + (y + 8) + " Q100 " + (y - 2) + " 110 " + (y + 8), "#2b1d16", 3.4);
    else if(mood === "hungry") out += '<ellipse cx="100" cy="' + (y + 4) + '" rx="7" ry="9" fill="#6b2a2a"' + (S.cute ? ' stroke="' + DK + '" stroke-width="3"' : "") + '/><path d="M108 ' + (y + 8) + ' Q112 ' + (y + 22) + ' 108 ' + (y + 24) + ' Q104 ' + (y + 20) + ' 108 ' + (y + 8) + ' Z" fill="#7CC8FF"/>';
    else if(mood === "sleep") out += S.L("M95 " + (y + 4) + " Q100 " + (y + 9) + " 105 " + (y + 4), "#2b1d16", 3);
    else out += S.L("M90 " + (y + 1) + " Q95 " + (y + 8) + " 100 " + (y + 2) + " Q105 " + (y + 8) + " 110 " + (y + 1), "#2b1d16", 3.2);
    return out;
  }

  // ---------- 衣服 ----------
  var ACC = {
    bow: function(S){ return S.P("M138 56 L120 44 L120 70 Z", "#FF5C8A") + S.P("M138 56 L156 44 L156 70 Z", "#FF5C8A") + S.C(138, 57, 7, "#FF8FB0"); },
    cap: function(S){ return S.P("M52 66 Q56 24 100 24 Q144 24 148 66 Q100 52 52 66 Z", "#3B82F6") + S.P("M92 62 Q130 54 176 70 Q150 84 98 74 Z", "#2F6FD8") + S.C(100, 26, 6, "#fff"); },
    straw: function(S){ return S.E(100, 62, 72, 14, "#F2D58A") + S.P("M62 60 Q64 20 100 20 Q136 20 138 60 Q100 52 62 60 Z", "#F7E3A6") + S.N("M64 54 Q100 46 136 54 L136 46 Q100 38 64 46 Z", "#E0524A"); },
    grad: function(S){ return S.P("M30 46 L100 22 L170 46 L100 70 Z", "#2b2f3a") + S.P("M66 58 L66 78 Q100 92 134 78 L134 58 L100 70 Z", "#3a4050") + S.L("M170 46 L170 78", "#FFD76A", 3) + S.C(170, 82, 5, "#FFD76A"); },
    top: function(S){ return S.E(100, 62, 58, 11, "#2b2b34") + S.R(68, 8, 64, 54, 6, "#2b2b34") + S.R(68, 42, 64, 10, 0, "#B23B32", 'stroke="none"'); },
    helm: function(S){ return S.P("M48 78 Q46 22 100 20 Q154 22 152 78 Q100 64 48 78 Z", "#9AA7B5") + S.R(94, 18, 12, 34, 5, "#7C8896") + S.N("M60 40 Q74 28 92 28", "none", 'stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"'); },
    crown: function(S){ return S.P("M58 62 L52 22 L78 42 L100 14 L122 42 L148 22 L142 62 Q100 70 58 62 Z", "#FFD23F") + S.C(100, 36, 6, "#FF4D6D") + S.C(70, 48, 4.5, "#3AA0FF") + S.C(130, 48, 4.5, "#4CCB7A"); },
    glass: function(S){ return S.C(76, 98, 15, "rgba(180,220,255,.35)") + S.C(124, 98, 15, "rgba(180,220,255,.35)") + S.L("M91 98 L109 98", DK, 3) + S.L("M61 96 L48 92 M139 96 L152 92", DK, 3); },
    shade: function(S){ return S.P("M58 88 Q76 84 92 90 L90 108 Q76 114 62 108 Z", "#222") + S.P("M142 88 Q124 84 108 90 L110 108 Q124 114 138 108 Z", "#222") + S.L("M92 92 L108 92", DK, 3) + S.N("M64 92 L76 92", "none", 'stroke="#fff" stroke-width="2.5" opacity=".6" stroke-linecap="round"'); },
    mask: function(S){ return S.C(76, 98, 15, "none", 'stroke="' + DK + '" stroke-width="3"') + S.C(124, 98, 15, "none", 'stroke="' + DK + '" stroke-width="3"') + S.L("M91 98 L109 98", DK, 3) + S.E(100, 112, 11, 8, "#F2B6A0") + S.P("M82 124 Q100 116 118 124 Q112 132 100 128 Q88 132 82 124 Z", "#4a3426"); },
    scarf: function(S){ return S.P("M56 138 Q100 160 144 138 L148 154 Q100 176 52 154 Z", "#E0524A") + S.P("M120 158 L140 192 L122 196 L108 164 Z", "#E0524A") + S.N("M64 146 L70 160 M84 152 L88 166 M104 156 L106 170 M124 152 L126 166", "none", 'stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"'); },
    chain: function(S){ var b = ""; for(var i = 0; i <= 8; i++){ var t = i / 8, x = 66 + t * 68, y = 142 + Math.sin(t * Math.PI) * 24; b += S.C(x, y, 4.2, i % 2 ? "#FFD23F" : "#FF8FB0"); } return b; },
    medal: function(S){ return S.P("M82 136 L100 168 L118 136 L110 134 L100 152 L90 134 Z", "#3B82F6") + S.C(100, 174, 13, "#FFD23F") + S.N("M100 166 L103 172 L109 172 L104 176 L106 182 L100 178 L94 182 L96 176 L91 172 L97 172 Z", "#E0A82E"); },
    balloon: function(S){ return S.L("M168 142 Q158 170 150 186", "#555", 2) + S.E(172, 112, 20, 26, "#FF5C5C") + S.N("M164 100 Q166 90 174 90", "none", 'stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"') + S.P("M168 137 L176 137 L172 144 Z", "#FF5C5C"); },
    bag: function(S){ return S.P("M30 126 Q22 126 22 138 L22 176 Q22 188 34 188 L54 188 L54 126 Z", "#4CAF6A") + S.R(26, 150, 24, 22, 4, "#3a8f55") + S.L("M54 128 Q80 124 82 144", "#2f7a47", 4); },
    wand: function(S){ return S.L("M152 176 L184 118", "#8a5a3a", 5) + S.N("M184 100 L188 112 L200 114 L190 121 L194 133 L184 126 L174 133 L178 121 L168 114 L180 112 Z", "#FFD23F", 'stroke="#E0A82E" stroke-width="1.5"') ; }
  };
  var SLOT = { bow: "head", cap: "head", straw: "head", grad: "head", top: "head", helm: "head", crown: "head", glass: "face", shade: "face", mask: "face", scarf: "neck", chain: "neck", medal: "neck", balloon: "side", bag: "side", wand: "side" };
  A.ACC_SLOT = SLOT;
  A.accSvg = function(id, style){ var S = mkStyle(style !== "flat"); return ACC[id] ? ACC[id](S) : ""; };

  // ---------- 主要輸出 ----------
  var css = ".pa-art{overflow:visible;display:block;} .pa-body-g{transform-box:fill-box;transform-origin:50% 100%;animation:paBreath 3s ease-in-out infinite;} .pa-eyes{transform-box:fill-box;transform-origin:50% 50%;animation:paBlink 4.2s infinite;} .pa-chew{transform-box:fill-box;transform-origin:50% 50%;animation:paChew .35s ease-in-out infinite;} .pa-tailg{transform-box:fill-box;transform-origin:0% 100%;animation:paTail 1.6s ease-in-out infinite;} .pa-aura{animation:paAura 3s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%;} .pa-spark{animation:paSpark 1.8s ease-in-out infinite;} .pa-zzz{animation:paZ 2.6s ease-in-out infinite;} .pa-pix{image-rendering:pixelated;display:block;}" +
    "@keyframes paBreath{0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,1.035)}} @keyframes paBlink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}} @keyframes paChew{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.55)}} @keyframes paTail{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(7deg)}} @keyframes paAura{0%,100%{opacity:.65;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}} @keyframes paSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}} @keyframes paZ{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(10px,-18px)}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var STAGE_SC = [0.74, 0.86, 1, 1.06];
  // o: { sp(emoji), style, mood, stage, eq, anim(預設 true) }
  A.svg = function(o){
    var style = o.style === "flat" || o.style === "pixel" ? "flat" : "cute", S = mkStyle(style === "cute"), sp = A.byEmoji(o.sp), mood = o.mood || "neutral", stage = Math.max(0, Math.min(3, o.stage || 0)), eq = o.eq || {};
    var body = sp.body, belly = sp.belly, g = "";
    var anim = o.anim !== false;
    // 地面陰影、背景光環
    var pre = '<ellipse cx="100" cy="199" rx="56" ry="9" fill="#000" opacity=".16"/>';
    if(stage >= 3) pre = '<g class="' + (anim ? "pa-aura" : "") + '"><circle cx="100" cy="116" r="104" fill="url(#paAuraG)"/></g>' + pre;
    var defs = '<defs><radialGradient id="paAuraG"><stop offset="0" stop-color="#FFE98A" stop-opacity=".85"/><stop offset=".7" stop-color="#FFD23F" stop-opacity=".25"/><stop offset="1" stop-color="#FFD23F" stop-opacity="0"/></radialGradient></defs>';
    var arms = sp.arms || body, feet = sp.feet || body;
    // 身體
    var inn = "";
    if(sp.back) inn += '<g class="' + (anim ? "pa-tailg" : "") + '">' + sp.back(S, sp) + "</g>";
    inn += S.E(78, 186, 16, 10, feet) + S.E(122, 186, 16, 10, feet);
    inn += S.E(58, 150, 11, 17, arms, 'transform="rotate(18 58 150)"') + S.E(142, 150, 11, 17, arms, 'transform="rotate(-18 142 150)"');
    inn += S.E(100, 152, 45, 38, body);
    inn += S.E(100, 158, 28, 25, belly, S.cute ? 'stroke="none"' : "");
    if(S.cute) inn += S.N("M66 138 Q76 124 96 126", "none", 'stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".28"');
    if(sp.ears) inn += sp.ears(S, sp);
    inn += S.E(100, 98, 56, 50, sp.headFill || body);
    if(S.cute) inn += S.N("M58 76 Q70 54 96 50", "none", 'stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".3"');
    if(sp.mid) inn += sp.mid(S, sp);
    if(S.cute && mood !== "sleep" && sp.eyes !== "frog") inn += S.E(58, 114, 11, 7.5, "#FF8FA3", 'opacity=".5"') + S.E(142, 114, 11, 7.5, "#FF8FA3", 'opacity=".5"');
    inn += eyes(S, mood, sp); if(sp.nose) inn += sp.nose(S); inn += mouth(S, mood, sp);
    if(mood === "sleep") inn += '<g class="' + (anim ? "pa-zzz" : "") + '"><text x="140" y="56" font-size="22" font-weight="800" fill="#6b7fd6">Z</text><text x="154" y="40" font-size="16" font-weight="800" fill="#8fa0ea">z</text></g>';
    // 衣服：依部位排序（脖子→臉→頭→身邊）
    ["side", "neck", "face", "head"].forEach(function(sl){ var id = eq[sl]; if(id && ACC[id]) inn += ACC[id](S); });
    g = '<g class="' + (anim ? "pa-body-g" : "") + '">' + inn + "</g>";
    var sc = STAGE_SC[stage], tf = "translate(" + (100 - 100 * sc) + " " + (205 - 205 * sc) + ") scale(" + sc + ")";
    var post = "";
    if(stage >= 2){ [[22, 40, 14], [176, 64, 11], [190, 150, 9], [10, 140, 10]].forEach(function(p, i){ post += '<g class="' + (anim ? "pa-spark" : "") + '" style="animation-delay:' + (i * .45) + 's;transform-box:fill-box;transform-origin:center"><path d="M' + p[0] + " " + (p[1] - p[2]) + " L" + (p[0] + p[2] * .3) + " " + (p[1] - p[2] * .3) + " L" + (p[0] + p[2]) + " " + p[1] + " L" + (p[0] + p[2] * .3) + " " + (p[1] + p[2] * .3) + " L" + p[0] + " " + (p[1] + p[2]) + " L" + (p[0] - p[2] * .3) + " " + (p[1] + p[2] * .3) + " L" + (p[0] - p[2]) + " " + p[1] + " L" + (p[0] - p[2] * .3) + " " + (p[1] - p[2] * .3) + ' Z" fill="#FFD23F"/></g>'; }); }
    if(stage >= 3) post += '<ellipse cx="100" cy="2" rx="30" ry="7" fill="none" stroke="#FFD23F" stroke-width="5"/>';
    return '<svg class="pa-art" viewBox="-20 -22 240 250" xmlns="http://www.w3.org/2000/svg">' + defs + pre + '<g transform="' + tf + '">' + g + "</g>" + post + "</svg>";
  };

  // ---------- 像素風：把向量縮小成 40×42 的點陣再放大（顏色降到少量色階），做出復古感 ----------
  var pixCache = {};
  A.pixel = function(svgStr, cb){
    if(pixCache[svgStr]){ cb(pixCache[svgStr]); return; }
    var img = new Image(), url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr.replace("<svg ", '<svg width="480" height="500" '));
    img.onload = function(){
      try{
        var W = 44, H = 46, c = document.createElement("canvas"); c.width = W; c.height = H; var x = c.getContext("2d"); x.imageSmoothingEnabled = true; x.drawImage(img, 0, 0, W, H);
        var d = x.getImageData(0, 0, W, H), p = d.data, q = 40;
        for(var i = 0; i < p.length; i += 4){ if(p[i + 3] < 110){ p[i + 3] = 0; continue; } p[i + 3] = 255; p[i] = Math.round(p[i] / q) * q; p[i + 1] = Math.round(p[i + 1] / q) * q; p[i + 2] = Math.round(p[i + 2] / q) * q; }
        // 加一圈深色外框
        var o = new Uint8ClampedArray(p); for(var yy = 0; yy < H; yy++) for(var xx = 0; xx < W; xx++){ var k = (yy * W + xx) * 4; if(p[k + 3] === 0){ var n = (xx > 0 && p[k - 1] === 255 && p[k - 4 + 3] === 255) || (xx < W - 1 && p[k + 7] === 255) || (yy > 0 && p[k - W * 4 + 3] === 255) || (yy < H - 1 && p[k + W * 4 + 3] === 255); if(n){ o[k] = 58; o[k + 1] = 38; o[k + 2] = 30; o[k + 3] = 255; } } }
        for(var j = 0; j < o.length; j++) d.data[j] = o[j]; x.putImageData(d, 0, 0);
        pixCache[svgStr] = c.toDataURL(); cb(pixCache[svgStr]);
      }catch(e){ cb(null); }
    };
    img.onerror = function(){ cb(null); }; img.src = url;
  };
  // 放進容器：依風格輸出向量或像素圖（像素圖是非同步，先放向量當底）
  A.render = function(el, o){
    var svg = A.svg(Object.assign({}, o, o.style === "pixel" ? { anim: false } : {}));
    if(o.style !== "pixel"){ el.innerHTML = svg; return; }
    el.innerHTML = '<div class="pa-pixwrap" style="width:100%;height:100%;position:relative;"></div>';
    var w = el.firstChild, token = A._tok = (A._tok || 0) + 1; w._t = token;
    A.pixel(svg, function(u){ if(!u || !w.isConnected) return; w.innerHTML = '<img class="pa-pix pa-pix-img" alt="" src="' + u + '" style="width:100%;height:100%;object-fit:contain;' + (o.anim === false ? "" : "animation:paPixBob 1.6s steps(2) infinite;") + '">'; });
  };
  var st2 = document.createElement("style"); st2.textContent = "@keyframes paPixBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3%)}}"; document.head.appendChild(st2);
})();
