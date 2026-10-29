/* 寵物美術（第三版）：座標改成 512×512，照著「坐姿玩偶」參考圖的比例重畫。
   outline＝線條填色：寬扁大頭、小圓點眼睛（間距窄）、大奶油色口鼻、小鼻子＋人中線、黑色粗外框、右側一彎陰影、肚子深色橢圓、大腳掌有肉墊。
   flat＝扁平色塊：圓頭、小圓點眼睛（間距寬）、大鼻子＋人中線、沒有口鼻、沒有外框，用深一階的色塊當陰影、身體很寬、大腳掌。
   全部是向量；20 種寵物共用同一套比例，只換耳朵、口鼻、顏色與特徵。 */
(function(){
  "use strict";
  var A = window.PETART = {};
  A.STYLES = [{ id: "outline", name: "線條填色" }, { id: "flat", name: "扁平色塊" }];
  A.norm = function(s){ return s === "flat" ? "flat" : "outline"; };
  var INK = "#1b1212", UID = 0;
  function shade(hex, amt){ var n = parseInt(hex.slice(1), 16), r = Math.max(0, Math.min(255, (n >> 16) + amt)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt)), b = Math.max(0, Math.min(255, (n & 255) + amt)); return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
  A.shade = shade;
  var SW = 14;
  // ---------- 兩種風格的版型（座標都是 512×512）----------
  var G = {
    outline: { head: { cx: 255.5, cy: 184, rx: 158.5, ry: 143, k: 30 }, ear: { l: [147, 60], r: [364, 60], rad: 51, inner: 21 }, eyes: { x1: 209.5, x2: 301.5, y: 146.5, r: 7 }, muzzle: { cx: 255.5, cy: 233.5, rx: 89.5, ry: 57.5 }, nose: { x: 255, y: 176, w: 49, h: 30 }, phil: { y1: 204, y2: 241, w: 14 }, mouthY: 241,
      body: { cx: 258, cy: 392, rx: 120, ry: 100 }, belly: { cx: 260, cy: 401, rx: 108, ry: 88 }, arms: [{ x: 126, y: 364, rx: 35, ry: 76, rot: 22 }, { x: 389, y: 364, rx: 35, ry: 76, rot: -22 }], feet: [{ x: 76, y: 446, rx: 46, ry: 60, rot: -14, px: 73, py: 446, prx: 24, pry: 44 }, { x: 436, y: 446, rx: 46, ry: 60, rot: 14, px: 439, py: 446, prx: 24, pry: 44 }], cheekY: 205, cheekX: [128, 382] },
    flat: { head: { cx: 255, cy: 139, rx: 142, ry: 129, k: 36 }, ear: { l: [145, 47], r: [365, 47], rad: 45, inner: 28 }, eyes: { x1: 184, x2: 327, y: 128.5, r: 11.5 }, muzzle: null, nose: { x: 255, y: 149, w: 65, h: 46 }, phil: { y1: 166, y2: 208, w: 14 }, mouthY: 208,
      body: { cx: 256, cy: 372, rx: 160, ry: 100 }, belly: null, arms: [], feet: [{ x: 102, y: 430, rx: 52, ry: 80, rot: 4, px: 103, py: 430, prx: 21, pry: 45 }, { x: 410, y: 430, rx: 52, ry: 80, rot: -4, px: 409, py: 430, prx: 21, pry: 45 }], cheekY: 170, cheekX: [112, 398] }
  };
  function mkStyle(outline){
    var st = outline ? ' stroke="' + INK + '" stroke-width="' + SW + '" stroke-linejoin="round" stroke-linecap="round"' : "";
    var S = { o: outline, st: st, g: outline ? G.outline : G.flat };
    S.P = function(d, f, x){ return '<path d="' + d + '" fill="' + f + '"' + (x && x.indexOf("stroke=") >= 0 ? "" : st) + (x ? " " + x : "") + '/>'; };
    S.E = function(cx, cy, rx, ry, f, x){ return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + (x && x.indexOf("stroke=") >= 0 ? "" : st) + (x ? " " + x : "") + '/>'; };
    S.C = function(cx, cy, r, f, x){ return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '"' + (x && x.indexOf("stroke=") >= 0 ? "" : st) + (x ? " " + x : "") + '/>'; };
    S.R = function(x0, y0, w, h, r, f, x){ return '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + f + '"' + (x && x.indexOf("stroke=") >= 0 ? "" : st) + (x ? " " + x : "") + '/>'; };
    S.L = function(d, col, w, x){ return '<path d="' + d + '" fill="none" stroke="' + (col || INK) + '" stroke-width="' + (w || 11) + '" stroke-linecap="round" stroke-linejoin="round"' + (x ? " " + x : "") + '/>'; };
    S.N = function(d, f, x){ return '<path d="' + d + '" fill="' + f + '"' + (x ? " " + x : "") + '/>'; };
    S.shaded = function(geom, base, k, dark){
      var id = "pc" + (++UID), dk = dark || shade(base, outline ? -26 : -34), ox = outline ? -k * 0.8 : 0, oy = outline ? -k * 0.6 : -k;
      var g = '<clipPath id="' + id + '">' + geom("") + '</clipPath>' + geom('fill="' + dk + '"') + '<g clip-path="url(#' + id + ')"><g transform="translate(' + ox + " " + oy + ')">' + geom('fill="' + base + '"') + "</g></g>";
      if(outline) g += geom('fill="none"' + st);
      return g;
    };
    var kf = outline ? 0.2 : 0.1;
    S.SE = function(cx, cy, rx, ry, f, o){ o = o || {}; var tr = o.rot ? ' transform="rotate(' + o.rot + " " + cx + " " + cy + ')"' : ""; return S.shaded(function(a){ return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" ' + a + tr + "/>"; }, f, o.k || Math.min(rx, ry) * kf, o.dark); };
    S.SC = function(cx, cy, r, f, o){ o = o || {}; return S.shaded(function(a){ return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' + a + "/>"; }, f, o.k || r * kf, o.dark); };
    S.SP = function(d, f, o){ o = o || {}; return S.shaded(function(a){ return '<path d="' + d + '" ' + a + "/>"; }, f, o.k || 14, o.dark); };
    return S;
  }

  // ---------- 零件 ----------
  function earCols(S, c, inCol){ var base = c.ear || c.body; return S.o ? { out: base, inn: inCol || c.earIn } : { out: c.flatEar || shade(base, -42), inn: c.flatEarIn || shade(base, -80) }; }
  function earsRound(S, c, scale, inCol, dx, dy){ var g = S.g.ear, r = g.rad * (scale || 1), l = [g.l[0] + (dx || 0), g.l[1] + (dy || 0)], rr = [g.r[0] - (dx || 0), g.r[1] + (dy || 0)], ec = earCols(S, c, inCol);
    return S.SC(l[0], l[1], r, ec.out) + S.C(l[0] + 2, l[1] + 7, g.inner * (scale || 1), ec.inn, S.o ? "" : 'stroke="none"') + S.SC(rr[0], rr[1], r, ec.out) + S.C(rr[0] - 2, rr[1] + 7, g.inner * (scale || 1), ec.inn, S.o ? "" : 'stroke="none"'); }
  function earsPoint(S, c, inCol, tipCol){ var g = S.g.ear, lx = g.l[0], rx = g.r[0], y = g.l[1], ec = earCols(S, c, inCol);
    return S.SP("M" + (lx - 60) + " " + (y + 80) + " Q" + (lx - 80) + " " + (y - 30) + " " + (lx - 20) + " " + (y - 66) + " Q" + (lx + 50) + " " + (y - 30) + " " + (lx + 76) + " " + (y + 40) + " Z", ec.out, { k: 14 }) + S.N("M" + (lx - 38) + " " + (y + 56) + " Q" + (lx - 50) + " " + (y - 10) + " " + (lx - 16) + " " + (y - 38) + " Q" + (lx + 28) + " " + (y - 14) + " " + (lx + 44) + " " + (y + 30) + " Z", ec.inn) +
      S.SP("M" + (rx + 60) + " " + (y + 80) + " Q" + (rx + 80) + " " + (y - 30) + " " + (rx + 20) + " " + (y - 66) + " Q" + (rx - 50) + " " + (y - 30) + " " + (rx - 76) + " " + (y + 40) + " Z", ec.out, { k: 14 }) + S.N("M" + (rx + 38) + " " + (y + 56) + " Q" + (rx + 50) + " " + (y - 10) + " " + (rx + 16) + " " + (y - 38) + " Q" + (rx - 28) + " " + (y - 14) + " " + (rx - 44) + " " + (y + 30) + " Z", ec.inn); }
  function muzzleShape(S, col, sx, sy){ var m = S.g.muzzle; if(!m) return ""; return S.E(m.cx, m.cy, m.rx * (sx || 1), m.ry * (sy || 1), col); }
  // 鼻子：outline 是小的圓角三角形、flat 是大的
  function noseShape(S, col, o){ var n = S.g.nose, w = n.w * ((o && o.w) || 1), h = n.h * ((o && o.h) || 1), x = n.x, y = n.y;
    return S.P("M" + (x - w / 2) + " " + (y - h * 0.35) + " Q" + x + " " + (y - h * 0.7) + " " + (x + w / 2) + " " + (y - h * 0.35) + " Q" + (x + w * 0.52) + " " + (y + h * 0.2) + " " + (x + w * 0.1) + " " + (y + h * 0.55) + " Q" + x + " " + (y + h * 0.62) + " " + (x - w * 0.1) + " " + (y + h * 0.55) + " Q" + (x - w * 0.52) + " " + (y + h * 0.2) + " " + (x - w / 2) + " " + (y - h * 0.35) + " Z", col); }
  function philtrum(S, col){ var p = S.g.phil; return S.L("M255 " + p.y1 + " L255 " + p.y2, col || (S.o ? INK : "#4a4a4a"), p.w); }
  function cheeks(S){ var g = S.g; return S.N("M" + (g.cheekX[0] - 30) + " " + g.cheekY + " a30 18 0 1 0 60 0 a30 18 0 1 0 -60 0 M" + (g.cheekX[1] - 30) + " " + g.cheekY + " a30 18 0 1 0 60 0 a30 18 0 1 0 -60 0", "#FF8FA3", 'opacity=".42"'); }

  // ---------- 物種 ----------
  var SP = {}, E2I = {};
  function def(id, emoji, name, o){ o.id = id; o.e = emoji; o.name = name; SP[id] = o; E2I[emoji] = id; }
  def("bear", "🐻", "小熊", { c: { body: "#B98482", flatBody: "#C4936A", belly: "#7E4F4C", flatBelly: "#B07B55", muzzle: "#FFDCCB", earIn: "#FFD3C4", flatEarIn: "#5E4034", flatEar: "#8B6048", nose: "#9C5A55", flatNose: "#4a4a4a", arm: "#B98482", flatArm: "#8B6048", flatFoot: "#C4936A", flatPad: "#8B6048", pad: "#FFDCCB" },
    ears: function(S, c){ return earsRound(S, c); }, mid: function(S, c){ return muzzleShape(S, c.muzzle); }, nose: function(S, c){ return noseShape(S, S.o ? c.nose : c.flatNose); } });
  def("dog", "🐶", "小狗", { c: { body: "#E3A96D", belly: "#FFE9CE", muzzle: "#FFEBD2", earIn: "#9C6338", ear: "#A96E3E", nose: "#2e2020", pad: "#FFE1CF" },
    back: function(S, c){ return S.SP("M380 470 Q470 450 470 360 Q430 420 372 410 Z", c.body, { k: 12 }); },
    ears: function(S, c){ return S.SE(92, 190, 52, 118, c.ear, { rot: 12 }) + S.SE(418, 190, 52, 118, c.ear, { rot: -12 }); },
    mid: function(S, c){ return S.N("M150 70 Q205 38 238 92 Q222 170 160 170 Q112 130 150 70 Z", c.ear, 'opacity=".95"') + muzzleShape(S, c.muzzle); }, nose: function(S, c){ return noseShape(S, c.nose, { w: 1.2, h: 1.1 }); } });
  def("cat", "🐱", "小貓", { c: { body: "#F0A24E", belly: "#FFF1DE", muzzle: "#FFF1DE", earIn: "#FFB4BD", nose: "#FF8FA3", pad: "#FFE1CF" },
    back: function(S, c){ return S.SP("M380 480 Q500 480 480 340 Q460 396 410 400 Q430 440 372 436 Z", c.body, { k: 12 }); },
    ears: function(S, c){ return earsPoint(S, c); },
    mid: function(S, c){ return S.N("M232 40 L232 84 M255 34 L255 84 M278 40 L278 84", "none", 'stroke="#C9772A" stroke-width="12" stroke-linecap="round"') + muzzleShape(S, c.muzzle, 0.86, 0.86) + S.L("M110 210 L36 192 M110 236 L36 246 M400 210 L474 192 M400 236 L474 246", "#6b4a35", 7); },
    nose: function(S, c){ return S.P("M233 182 L277 182 L255 208 Z", c.nose); } });
  def("rabbit", "🐰", "小兔", { c: { body: "#F4EEE8", belly: "#FFFFFF", muzzle: "#FFFFFF", earIn: "#FFB4C6", nose: "#FF8FA3", pad: "#FFE1E8" },
    back: function(S, c){ return S.SC(400, 470, 44, "#FFFFFF"); },
    ears: function(S, c){ return S.SE(190, 50, 50, 112, c.body, { rot: -8 }) + S.E(190, 58, 23, 80, c.earIn, 'transform="rotate(-8 190 58)"' + (S.o ? "" : ' stroke="none"')) + S.SE(320, 50, 50, 112, c.body, { rot: 8 }) + S.E(320, 58, 23, 80, c.earIn, 'transform="rotate(8 320 58)"' + (S.o ? "" : ' stroke="none"')); },
    mid: function(S, c){ return muzzleShape(S, c.muzzle, 0.82, 0.85); }, nose: function(S, c){ return noseShape(S, c.nose, { w: 0.7, h: 0.6 }); } });
  def("hamster", "🐹", "倉鼠", { c: { body: "#F2C88E", belly: "#FFF3E0", muzzle: "#FFF3E0", cheek: "#FFE1BD", earIn: "#FFB4BC", nose: "#E8838F", pad: "#FFE1CF" },
    ears: function(S, c){ return earsRound(S, c, 0.82, c.earIn, 6, 22); },
    mid: function(S, c){ return S.N("M150 80 Q190 48 238 80 Q226 140 170 160 Q124 140 150 80 Z M360 80 Q320 48 272 80 Q284 140 340 160 Q386 140 360 80 Z", "#E09A4D") + S.E(112, 225, 62, 50, c.cheek) + S.E(398, 225, 62, 50, c.cheek) + muzzleShape(S, c.muzzle, 0.62, 0.7); },
    nose: function(S, c){ return noseShape(S, c.nose, { w: 0.6, h: 0.5 }) + S.R(236, 220, 17, 26, 5, "#fff") + S.R(257, 220, 17, 26, 5, "#fff"); } });
  def("chick", "🐥", "小雞", { c: { body: "#FFD54A", belly: "#FFE98E", wing: "#F4B71C", beak: "#FF9A3C", nose: "#FF9A3C", foot: "#FF9A3C", pad: "#FFC36B", arm: "#F4B71C", flatArm: "#F4B71C", flatFoot: "#FF9A3C", flatPad: "#E27A1E" },
    ears: function(){ return ""; },
    mid: function(S, c){ return S.P("M225 40 Q216 -8 246 -22 Q250 14 268 -6 Q298 14 286 44 Z", c.wing); },
    nose: function(S, c){ var n = S.g.nose; return S.P("M" + (n.x - 46) + " " + (n.y - 12) + " Q" + n.x + " " + (n.y - 42) + " " + (n.x + 46) + " " + (n.y - 12) + " Q" + (n.x + 36) + " " + (n.y + 38) + " " + n.x + " " + (n.y + 46) + " Q" + (n.x - 36) + " " + (n.y + 38) + " " + (n.x - 46) + " " + (n.y - 12) + " Z", c.beak); }, noPhil: true });
  def("fox", "🦊", "小狐狸", { c: { body: "#F07F34", belly: "#FFFFFF", muzzle: "#FFFFFF", earIn: "#4a3228", ear: "#F07F34", nose: "#2e2020", pad: "#FFE6D2" },
    back: function(S, c){ return S.SP("M380 480 Q516 500 500 330 Q480 420 392 420 Z", c.body, { k: 12 }) + S.N("M496 360 Q510 330 500 330 Q486 366 440 400 Z", "#FFFFFF"); },
    ears: function(S, c){ return earsPoint(S, c, "#4a3228"); },
    mid: function(S, c){ return S.N("M96 214 Q130 304 214 286 Q150 262 120 196 Z M414 214 Q380 304 296 286 Q360 262 390 196 Z", "#FFFFFF") + (S.o ? muzzleShape(S, "#FFFFFF", 0.78, 0.8) : S.E(255, 214, 78, 50, "#FFFFFF")); }, nose: function(S, c){ return noseShape(S, c.nose, { w: 0.9, h: 0.9 }); } });
  def("panda", "🐼", "熊貓", { c: { body: "#F7F7F7", belly: "#FFFFFF", muzzle: "#FFFFFF", black: "#363636", earIn: "#363636", ear: "#363636", nose: "#2e2e2e", arm: "#363636", flatArm: "#363636", flatFoot: "#363636", foot: "#363636", pad: "#8a8a8a", flatPad: "#8a8a8a" },
    ears: function(S, c){ return S.SC(S.g.ear.l[0], S.g.ear.l[1], S.g.ear.rad, c.black, { dark: "#202020" }) + S.SC(S.g.ear.r[0], S.g.ear.r[1], S.g.ear.rad, c.black, { dark: "#202020" }); },
    mid: function(S, c){ var g = S.g.eyes; return S.E(g.x1 - 4, g.y + 6, 46, 58, c.black, 'transform="rotate(26 ' + (g.x1 - 4) + " " + (g.y + 6) + ')"') + S.E(g.x2 + 4, g.y + 6, 46, 58, c.black, 'transform="rotate(-26 ' + (g.x2 + 4) + " " + (g.y + 6) + ')"') + muzzleShape(S, c.muzzle); }, nose: function(S, c){ return noseShape(S, c.nose); }, eyeCol: "#FFFFFF" });
  def("frog", "🐸", "青蛙", { c: { body: "#7DCA5E", belly: "#EAF8CB", nose: "#3b7a2a", pad: "#BFE6A8" }, eyes: "frog",
    ears: function(S, c){ var g = S.g.ear; return S.SC(g.l[0] + 20, g.l[1] + 6, g.rad + 8, c.body) + S.SC(g.r[0] - 20, g.r[1] + 6, g.rad + 8, c.body); },
    mid: function(S, c){ return ""; },
    nose: function(S, c){ var n = S.g.nose; return S.C(n.x - 18, n.y, 6, c.nose, 'stroke="none"') + S.C(n.x + 18, n.y, 6, c.nose, 'stroke="none"'); }, noPhil: true, wideMouth: true });
  def("penguin", "🐧", "企鵝", { c: { body: "#3E4F63", belly: "#FFFFFF", beak: "#FFA83C", nose: "#FFA83C", pad: "#FFC36B", arm: "#33424f", flatArm: "#33424f", foot: "#FFA83C", flatFoot: "#FFA83C", flatPad: "#E27A1E" },
    ears: function(){ return ""; },
    mid: function(S, c){ var g = S.g.head; return S.P("M" + (g.cx - g.rx * 0.78) + " " + (g.cy - 6) + " Q" + (g.cx - g.rx * 0.74) + " " + (g.cy - g.ry * 0.7) + " " + (g.cx - g.rx * 0.34) + " " + (g.cy - g.ry * 0.56) + " Q" + g.cx + " " + (g.cy - g.ry * 0.38) + " " + (g.cx + g.rx * 0.34) + " " + (g.cy - g.ry * 0.56) + " Q" + (g.cx + g.rx * 0.74) + " " + (g.cy - g.ry * 0.7) + " " + (g.cx + g.rx * 0.78) + " " + (g.cy - 6) + " Q" + (g.cx + g.rx * 0.76) + " " + (g.cy + g.ry * 0.8) + " " + g.cx + " " + (g.cy + g.ry * 0.96) + " Q" + (g.cx - g.rx * 0.76) + " " + (g.cy + g.ry * 0.8) + " " + (g.cx - g.rx * 0.78) + " " + (g.cy - 6) + " Z", "#FFFFFF", S.o ? 'stroke="none"' : ""); },
    nose: function(S, c){ var n = S.g.nose; return S.P("M" + (n.x - 44) + " " + (n.y - 10) + " Q" + n.x + " " + (n.y - 36) + " " + (n.x + 44) + " " + (n.y - 10) + " Q" + (n.x + 30) + " " + (n.y + 34) + " " + n.x + " " + (n.y + 40) + " Q" + (n.x - 30) + " " + (n.y + 34) + " " + (n.x - 44) + " " + (n.y - 10) + " Z", c.beak); }, eyeCol: "#FFFFFF", noPhil: true });
  def("cow", "🐮", "小牛", { c: { body: "#FBFBFB", belly: "#FFFFFF", muzzle: "#FFB9C6", horn: "#F2E1B0", nose: "#C96A7C", earIn: "#FFB9C6", pad: "#FFB9C6" },
    ears: function(S, c){ var g = S.g.ear; return S.P("M" + (g.l[0] + 22) + " " + (g.l[1] + 10) + " Q" + (g.l[0] - 10) + " " + (g.l[1] - 76) + " " + (g.l[0] + 40) + " " + (g.l[1] - 84) + " Q" + (g.l[0] + 56) + " " + (g.l[1] - 40) + " " + (g.l[0] + 62) + " " + (g.l[1] + 8) + " Z", c.horn) + S.P("M" + (g.r[0] - 22) + " " + (g.r[1] + 10) + " Q" + (g.r[0] + 10) + " " + (g.r[1] - 76) + " " + (g.r[0] - 40) + " " + (g.r[1] - 84) + " Q" + (g.r[0] - 56) + " " + (g.r[1] - 40) + " " + (g.r[0] - 62) + " " + (g.r[1] + 8) + " Z", c.horn) + S.SE(78, 150, 62, 34, c.body, { rot: -16 }) + S.SE(432, 150, 62, 34, c.body, { rot: 16 }); },
    mid: function(S, c){ return S.N("M130 110 Q150 50 222 64 Q216 130 168 172 Q130 176 124 140 Z", "#3d3a38") + (S.o ? muzzleShape(S, c.muzzle) : S.E(255, 236, 100, 66, c.muzzle)); },
    nose: function(S, c){ var n = S.g.nose; return S.E(n.x - 24, S.o ? 238 : n.y + 62, 9, 14, c.nose, 'stroke="none"') + S.E(n.x + 24, S.o ? 238 : n.y + 62, 9, 14, c.nose, 'stroke="none"'); }, noPhil: true });
  def("pig", "🐷", "小豬", { c: { body: "#FFB6C3", belly: "#FFD3DB", muzzle: "#FF93A9", snout: "#FF93A9", ear: "#FF9BB0", earIn: "#FF93A9", nose: "#B3506A", pad: "#FFD3DB" },
    back: function(S){ return S.L("M390 470 Q460 450 446 410 Q420 394 440 366", "#E88FA0", 16); },
    ears: function(S, c){ var g = S.g.ear; return S.SP("M" + (g.l[0] - 60) + " " + (g.l[1] + 70) + " Q" + (g.l[0] - 80) + " " + (g.l[1] - 40) + " " + (g.l[0] - 20) + " " + (g.l[1] - 52) + " Q" + (g.l[0] + 50) + " " + (g.l[1] - 30) + " " + (g.l[0] + 80) + " " + (g.l[1] + 36) + " Z", c.ear, { k: 12 }) + S.SP("M" + (g.r[0] + 60) + " " + (g.r[1] + 70) + " Q" + (g.r[0] + 80) + " " + (g.r[1] - 40) + " " + (g.r[0] + 20) + " " + (g.r[1] - 52) + " Q" + (g.r[0] - 50) + " " + (g.r[1] - 30) + " " + (g.r[0] - 80) + " " + (g.r[1] + 36) + " Z", c.ear, { k: 12 }); },
    mid: function(S, c){ return S.shaded ? (S.o ? muzzleShape(S, c.snout, 0.62, 0.8) : S.E(255, 190, 70, 52, c.snout)) : ""; },
    nose: function(S, c){ var y = S.o ? 232 : 192; return S.E(232, y, 11, 17, c.nose, 'stroke="none"') + S.E(278, y, 11, 17, c.nose, 'stroke="none"'); }, noPhil: true });
  // ----- 強化寵物 -----
  def("lion", "🦁", "獅子", { c: { body: "#EDB357", belly: "#FFF0D0", muzzle: "#FFF0D0", mane: "#BE7330", earIn: "#FFD9A8", nose: "#E8838F", pad: "#FFE1B8" },
    back: function(S, c){ return S.SP("M380 480 Q500 480 486 380 Q470 430 400 430 Z", c.body, { k: 12 }) + S.C(486, 372, 28, c.mane); },
    ears: function(S, c){ var g = S.g.head, m = ""; for(var i = 0; i < 12; i++){ var a = i / 12 * Math.PI * 2; m += S.C(g.cx + Math.cos(a) * (g.rx + 14), g.cy + Math.sin(a) * (g.ry + 14), 48, c.mane); } return m + S.SE(g.cx, g.cy, g.rx + 20, g.ry + 20, c.mane, { k: 22 }) + earsRound(S, { body: c.body, earIn: c.earIn }, 0.62, c.earIn, 20, 20); },
    mid: function(S, c){ return S.o ? muzzleShape(S, c.muzzle, 0.9, 0.9) : S.E(255, 214, 96, 62, c.muzzle); }, nose: function(S, c){ var n = S.g.nose; return S.P("M" + (n.x - 28) + " " + (n.y - 12) + " L" + (n.x + 28) + " " + (n.y - 12) + " L" + n.x + " " + (n.y + 18) + " Z", c.nose); } });
  def("tiger", "🐯", "老虎", { c: { body: "#F59A3C", belly: "#FFF1DC", muzzle: "#FFF1DC", earIn: "#FFF1DC", nose: "#E8838F", pad: "#FFE1B8" },
    back: function(S, c){ return S.SP("M380 480 Q496 480 486 360 Q470 420 400 430 Z", c.body, { k: 12 }) + S.N("M452 392 L492 378 M440 424 L486 416", "none", 'stroke="#3a2a22" stroke-width="16" stroke-linecap="round"'); },
    ears: function(S, c){ return earsRound(S, c, 0.92, c.earIn); },
    mid: function(S, c){ return S.N("M255 40 L255 96 M206 52 L216 92 M304 52 L294 92 M96 170 L160 184 M92 220 L154 220 M414 170 L350 184 M418 220 L356 220", "none", 'stroke="#3a2a22" stroke-width="15" stroke-linecap="round"') + (S.o ? muzzleShape(S, c.muzzle, 0.95, 0.92) : S.E(255, 214, 90, 56, c.muzzle)); },
    nose: function(S, c){ var n = S.g.nose; return S.P("M" + (n.x - 28) + " " + (n.y - 12) + " L" + (n.x + 28) + " " + (n.y - 12) + " L" + n.x + " " + (n.y + 18) + " Z", c.nose); } });
  def("wolf", "🐺", "野狼", { c: { body: "#8F9BAB", belly: "#E8EDF2", earIn: "#C9D1DB", muzzle: "#E8EDF2", nose: "#2b2b30", pad: "#E2E7EE" },
    back: function(S, c){ return S.SP("M380 486 Q516 506 504 330 Q484 430 396 424 Z", c.body, { k: 12 }) + S.N("M500 356 Q512 330 504 330 Q490 368 444 404 Z", "#E8EDF2"); },
    ears: function(S, c){ var g = S.g.ear; return S.SP("M" + (g.l[0] - 70) + " " + (g.l[1] + 90) + " Q" + (g.l[0] - 90) + " " + (g.l[1] - 80) + " " + (g.l[0] - 40) + " " + (g.l[1] - 120) + " Q" + (g.l[0] + 40) + " " + (g.l[1] - 80) + " " + (g.l[0] + 84) + " " + (g.l[1] + 30) + " Z", c.body, { k: 14 }) + S.N("M" + (g.l[0] - 44) + " " + (g.l[1] + 56) + " Q" + (g.l[0] - 56) + " " + (g.l[1] - 44) + " " + (g.l[0] - 28) + " " + (g.l[1] - 76) + " Q" + (g.l[0] + 24) + " " + (g.l[1] - 48) + " " + (g.l[0] + 50) + " " + (g.l[1] + 16) + " Z", c.earIn) + S.SP("M" + (g.r[0] + 70) + " " + (g.r[1] + 90) + " Q" + (g.r[0] + 90) + " " + (g.r[1] - 80) + " " + (g.r[0] + 40) + " " + (g.r[1] - 120) + " Q" + (g.r[0] - 40) + " " + (g.r[1] - 80) + " " + (g.r[0] - 84) + " " + (g.r[1] + 30) + " Z", c.body, { k: 14 }) + S.N("M" + (g.r[0] + 44) + " " + (g.r[1] + 56) + " Q" + (g.r[0] + 56) + " " + (g.r[1] - 44) + " " + (g.r[0] + 28) + " " + (g.r[1] - 76) + " Q" + (g.r[0] - 24) + " " + (g.r[1] - 48) + " " + (g.r[0] - 50) + " " + (g.r[1] + 16) + " Z", c.earIn); },
    mid: function(S, c){ return S.N("M104 200 Q124 296 200 270 Q150 250 120 180 Z M406 200 Q386 296 310 270 Q360 250 390 180 Z", c.muzzle) + (S.o ? muzzleShape(S, c.muzzle, 0.9, 0.9) : S.E(255, 214, 90, 56, c.muzzle)); }, nose: function(S, c){ return noseShape(S, c.nose, { w: 1.1, h: 1 }); } });
  def("eagle", "🦅", "老鷹", { c: { body: "#8B5E3E", belly: "#F1E2C6", wing: "#6E482F", beak: "#FFC93D", nose: "#FFC93D", pad: "#FFE08A", arm: "#6E482F", flatArm: "#6E482F", foot: "#FFC93D", flatFoot: "#FFC93D", flatPad: "#E0A82E" }, headFill: "#FFFFFF",
    back: function(S, c){ return S.SP("M150 330 Q10 280 24 450 Q100 400 160 430 Z", c.wing, { k: 14 }) + S.SP("M360 330 Q500 280 486 450 Q410 400 350 430 Z", c.wing, { k: 14 }); },
    ears: function(){ return ""; },
    mid: function(S, c){ return ""; },
    nose: function(S, c){ var n = S.g.nose; return S.P("M" + (n.x - 38) + " " + (n.y - 12) + " Q" + n.x + " " + (n.y - 40) + " " + (n.x + 38) + " " + (n.y - 12) + " Q" + (n.x + 34) + " " + (n.y + 36) + " " + n.x + " " + (n.y + 52) + " Q" + (n.x - 34) + " " + (n.y + 36) + " " + (n.x - 38) + " " + (n.y - 12) + " Z", c.beak); }, noPhil: true });
  def("trex", "🦖", "暴龍", { c: { body: "#70C06D", belly: "#D9F1B6", jaw: "#90D88B", spike: "#4F9D4E", nose: "#3b7a2a", pad: "#BFE6A8" },
    back: function(S, c){ var sp = ""; [[190, 52], [255, 20], [320, 52]].forEach(function(p){ sp += S.SP("M" + (p[0] - 34) + " " + p[1] + " L" + p[0] + " " + (p[1] - 60) + " L" + (p[0] + 34) + " " + p[1] + " Z", c.spike, { k: 8 }); }); return S.SP("M380 480 Q512 510 500 340 Q480 440 396 424 Z", c.body, { k: 12 }) + sp; },
    ears: function(){ return ""; },
    mid: function(S, c){ return S.o ? muzzleShape(S, c.jaw, 1, 0.9) : S.E(255, 226, 100, 62, c.jaw); },
    nose: function(S, c){ var n = S.g.nose; return S.C(n.x - 26, n.y + 4, 8, c.nose, 'stroke="none"') + S.C(n.x + 26, n.y + 4, 8, c.nose, 'stroke="none"'); }, noPhil: true, teeth: true });
  def("unicorn", "🦄", "獨角獸", { c: { body: "#FFF3FB", belly: "#FFFFFF", mane1: "#FF9AD0", mane2: "#9AD7FF", mane3: "#C3A0FF", horn: "#FFD76A", earIn: "#FFC7E6", nose: "#E8838F", muzzle: "#FFFFFF", pad: "#FFE1F0" },
    back: function(S, c){ return S.SP("M380 486 Q516 510 500 346 Q480 440 396 426 Z", c.mane3, { k: 12 }) + S.SP("M392 452 Q490 450 478 360 Q462 420 404 424 Z", c.mane2, { k: 10 }); },
    ears: function(S, c){ var g = S.g.ear; return S.SP("M" + (g.l[0] - 40) + " " + (g.l[1] + 70) + " Q" + (g.l[0] - 60) + " " + (g.l[1] - 50) + " " + (g.l[0] - 10) + " " + (g.l[1] - 80) + " Q" + (g.l[0] + 50) + " " + (g.l[1] - 40) + " " + (g.l[0] + 64) + " " + (g.l[1] + 30) + " Z", c.body, { k: 12 }) + S.N("M" + (g.l[0] - 22) + " " + (g.l[1] + 44) + " Q" + (g.l[0] - 32) + " " + (g.l[1] - 20) + " " + (g.l[0] - 8) + " " + (g.l[1] - 48) + " Q" + (g.l[0] + 28) + " " + (g.l[1] - 20) + " " + (g.l[0] + 40) + " " + (g.l[1] + 20) + " Z", c.earIn) + S.SP("M" + (g.r[0] + 40) + " " + (g.r[1] + 70) + " Q" + (g.r[0] + 60) + " " + (g.r[1] - 50) + " " + (g.r[0] + 10) + " " + (g.r[1] - 80) + " Q" + (g.r[0] - 50) + " " + (g.r[1] - 40) + " " + (g.r[0] - 64) + " " + (g.r[1] + 30) + " Z", c.body, { k: 12 }) + S.N("M" + (g.r[0] + 22) + " " + (g.r[1] + 44) + " Q" + (g.r[0] + 32) + " " + (g.r[1] - 20) + " " + (g.r[0] + 8) + " " + (g.r[1] - 48) + " Q" + (g.r[0] - 28) + " " + (g.r[1] - 20) + " " + (g.r[0] - 40) + " " + (g.r[1] + 20) + " Z", c.earIn) + S.SP("M92 120 Q20 110 40 290 Q70 220 120 230 Z", c.mane1, { k: 14 }) + S.SP("M418 120 Q490 110 470 290 Q440 220 390 230 Z", c.mane2, { k: 14 }); },
    mid: function(S, c){ var h = S.g.head, top = h.cy - h.ry; return S.SP("M230 " + (top + 12) + " L255 " + (top - 100) + " L280 " + (top + 12) + " Z", c.horn, { k: 8 }) + S.N("M238 " + (top - 22) + " L272 " + (top - 34) + " M242 " + (top - 52) + " L268 " + (top - 62), "none", 'stroke="#E0A82E" stroke-width="8" stroke-linecap="round"') + (S.o ? muzzleShape(S, c.muzzle, 0.9, 0.9) : ""); },
    nose: function(S, c){ var n = S.g.nose; return S.E(n.x - 14, n.y + 8, 7, 5, c.nose, 'stroke="none"') + S.E(n.x + 14, n.y + 8, 7, 5, c.nose, 'stroke="none"'); }, noPhil: true });
  def("dragon", "🐲", "小龍", { c: { body: "#E8607A", belly: "#FFDCA8", wing: "#8F5FD3", horn: "#FFE9B8", nose: "#7a2a3a", muzzle: "#FF9DB0", pad: "#FFDCA8" },
    back: function(S, c){ return S.SP("M170 340 Q10 200 50 400 Q100 380 140 430 Z", c.wing, { k: 16 }) + S.SP("M340 340 Q500 200 460 400 Q410 380 370 430 Z", c.wing, { k: 16 }) + S.SP("M380 480 Q512 500 496 336 Q480 430 396 424 Z", c.body, { k: 12 }) + S.P("M476 352 L514 322 L504 380 Z", c.belly); },
    ears: function(S, c){ var g = S.g.ear; return S.SP("M" + (g.l[0] - 10) + " " + (g.l[1] + 60) + " Q" + (g.l[0] - 50) + " " + (g.l[1] - 40) + " " + (g.l[0] - 30) + " " + (g.l[1] - 100) + " Q" + (g.l[0] + 40) + " " + (g.l[1] - 60) + " " + (g.l[0] + 50) + " " + (g.l[1] + 30) + " Z", c.horn, { k: 10 }) + S.SP("M" + (g.r[0] + 10) + " " + (g.r[1] + 60) + " Q" + (g.r[0] + 50) + " " + (g.r[1] - 40) + " " + (g.r[0] + 30) + " " + (g.r[1] - 100) + " Q" + (g.r[0] - 40) + " " + (g.r[1] - 60) + " " + (g.r[0] - 50) + " " + (g.r[1] + 30) + " Z", c.horn, { k: 10 }); },
    mid: function(S, c){ var h = S.g.head, top = h.cy - h.ry; return S.N("M205 " + (top + 28) + " L255 " + (top - 14) + " L305 " + (top + 28), "none", 'stroke="#8F5FD3" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"') + (S.o ? muzzleShape(S, c.muzzle, 0.9, 0.9) : S.E(255, 222, 92, 58, c.muzzle, 'opacity=".5"')); },
    nose: function(S, c){ var n = S.g.nose; return S.C(n.x - 18, n.y + 6, 8, c.nose, 'stroke="none"') + S.C(n.x + 18, n.y + 6, 8, c.nose, 'stroke="none"'); }, noPhil: true });
  def("god", "🐉", "神龍", { c: { body: "#F4C650", belly: "#FFF2C6", teal: "#2DB7A9", horn: "#FFEAB0", nose: "#8a5a00", muzzle: "#FFF2C6", pad: "#FFF2C6" },
    back: function(S, c){ return S.SP("M380 484 Q516 520 506 330 Q490 450 396 426 Z", c.body, { k: 12 }) + S.SP("M160 360 Q16 330 44 190 Q90 280 170 290 Z", c.teal, { k: 14 }) + S.SP("M350 360 Q494 330 466 190 Q420 280 340 290 Z", c.teal, { k: 14 }); },
    ears: function(S, c){ var g = S.g.ear; return S.SP("M" + (g.l[0] - 5) + " " + (g.l[1] + 60) + " Q" + (g.l[0] - 70) + " " + (g.l[1] - 60) + " " + (g.l[0] - 40) + " " + (g.l[1] - 110) + " Q" + (g.l[0] + 36) + " " + (g.l[1] - 70) + " " + (g.l[0] + 54) + " " + (g.l[1] + 30) + " Z", c.horn, { k: 10 }) + S.SP("M" + (g.r[0] + 5) + " " + (g.r[1] + 60) + " Q" + (g.r[0] + 70) + " " + (g.r[1] - 60) + " " + (g.r[0] + 40) + " " + (g.r[1] - 110) + " Q" + (g.r[0] - 36) + " " + (g.r[1] - 70) + " " + (g.r[0] - 54) + " " + (g.r[1] + 30) + " Z", c.horn, { k: 10 }) + S.L("M110 240 Q20 240 30 320 M400 240 Q490 240 480 320", c.teal, 16); },
    mid: function(S, c){ var h = S.g.head, top = h.cy - h.ry; return S.N("M150 " + (top + 70) + " Q255 " + (top - 20) + " 360 " + (top + 70) + " Q255 " + (top + 36) + " 150 " + (top + 70) + " Z", c.teal) + (S.o ? muzzleShape(S, c.muzzle, 0.9, 0.9) : S.E(255, 222, 92, 58, c.muzzle)); },
    nose: function(S, c){ var n = S.g.nose; return S.C(n.x - 18, n.y + 6, 8, c.nose, 'stroke="none"') + S.C(n.x + 18, n.y + 6, 8, c.nose, 'stroke="none"'); }, noPhil: true });
  A.SPECIES = SP;
  A.byEmoji = function(e){ return SP[E2I[e] || "bear"]; };
  function col(sp, k, outline){ var c = sp.c; return outline ? c[k] : (c["flat" + k.charAt(0).toUpperCase() + k.slice(1)] || c[k]); }

  // ---------- 表情 ----------
  function eyesSvg(S, mood, sp){
    var g = S.g.eyes, out = "", dark = sp.eyeCol || (S.o ? INK : "#4a4a4a");
    if(sp.eyes === "frog"){
      var er = S.g.ear, fe = function(x, y){ return S.C(x, y, 40, "#FFFFFF") + (S.C(x, y + 3, 17, INK, 'stroke="none"') + S.C(x - 6, y - 4, 6, "#fff", 'stroke="none"')); };
      return '<g class="pa-eyes">' + fe(er.l[0] + 20, er.l[1] + 8) + fe(er.r[0] - 20, er.r[1] + 8) + "</g>";
    }
    var P1 = [g.x1, g.y], P2 = [g.x2, g.y], r = g.r;
    var dot = function(p){ return S.C(p[0], p[1], r, dark, 'stroke="none"') + ""; };
    var happy = function(p){ return S.L("M" + (p[0] - r * 1.8) + " " + (p[1] + r * 0.7) + " Q" + p[0] + " " + (p[1] - r * 2.2) + " " + (p[0] + r * 1.8) + " " + (p[1] + r * 0.7), INK, r * 0.95); };
    var closed = function(p){ return S.L("M" + (p[0] - r * 1.8) + " " + (p[1] - r * 0.2) + " Q" + p[0] + " " + (p[1] + r * 1.8) + " " + (p[0] + r * 1.8) + " " + (p[1] - r * 0.2), INK, r * 0.85); };
    var heart = function(p){ var x = p[0], y = p[1], s = r * 2.1; return '<path d="M' + x + " " + (y + s * 0.6) + " C" + (x - s * 1.1) + " " + (y - s * 0.1) + " " + (x - s * 0.55) + " " + (y - s * 0.95) + " " + x + " " + (y - s * 0.3) + " C" + (x + s * 0.55) + " " + (y - s * 0.95) + " " + (x + s * 1.1) + " " + (y - s * 0.1) + " " + x + " " + (y + s * 0.6) + ' Z" fill="#FF4D6D"/>'; };
    out = '<g class="pa-eyes">' + dot(P1) + dot(P2) + "</g>";
    return out;
  }
  function mouthSvg(S, mood, sp){ return "";
    var g = S.g, y = g.mouthY + (sp.mouthDy || 0), x = 255, out = "";
    if(sp.noPhil && mood !== "happy" && mood !== "love" && mood !== "eat" && mood !== "hungry" && mood !== "sad" && mood !== "sleep") out += S.L("M" + (x - 34) + " " + (y + 4) + " Q" + (x - 17) + " " + (y + 24) + " " + x + " " + (y + 6) + " Q" + (x + 17) + " " + (y + 24) + " " + (x + 34) + " " + (y + 4), INK, 10);
    if(sp.teeth && mood !== "sad") out += S.N("M" + (x - 40) + " " + y + " L" + (x - 30) + " " + (y + 24) + " L" + (x - 20) + " " + y + " M" + (x + 20) + " " + y + " L" + (x + 30) + " " + (y + 24) + " L" + (x + 40) + " " + y, "#fff", 'stroke="' + INK + '" stroke-width="4"');
    var oy = y + 4;
    if(mood === "happy" || mood === "love") out += '<path d="M' + (x - 36) + " " + oy + " Q" + x + " " + (oy + 68) + " " + (x + 36) + " " + oy + ' Z" fill="#6b2a2a"' + (S.o ? ' stroke="' + INK + '" stroke-width="10" stroke-linejoin="round"' : "") + '/><path d="M' + (x - 20) + " " + (oy + 26) + " Q" + x + " " + (oy + 52) + " " + (x + 20) + " " + (oy + 26) + " Q" + x + " " + (oy + 16) + " " + (x - 20) + " " + (oy + 26) + ' Z" fill="#FF8FA3"/>';
    else if(mood === "eat") out += '<g class="pa-chew"><ellipse cx="' + x + '" cy="' + (oy + 22) + '" rx="32" ry="28" fill="#6b2a2a"' + (S.o ? ' stroke="' + INK + '" stroke-width="10"' : "") + '/><ellipse cx="' + x + '" cy="' + (oy + 36) + '" rx="18" ry="12" fill="#FF8FA3"/></g>';
    else if(mood === "sad") out += S.L("M" + (x - 34) + " " + (oy + 30) + " Q" + x + " " + (oy - 6) + " " + (x + 34) + " " + (oy + 30), INK, 10);
    else if(mood === "hungry") out += '<ellipse cx="' + x + '" cy="' + (oy + 20) + '" rx="22" ry="30" fill="#6b2a2a"' + (S.o ? ' stroke="' + INK + '" stroke-width="10"' : "") + '/><path d="M' + (x + 24) + " " + (oy + 30) + " Q" + (x + 38) + " " + (oy + 76) + " " + (x + 24) + " " + (oy + 82) + " Q" + (x + 10) + " " + (oy + 70) + " " + (x + 24) + " " + (oy + 30) + ' Z" fill="#7CC8FF"/>';
    else if(mood === "sleep") out += S.L("M" + (x - 18) + " " + (oy + 14) + " Q" + x + " " + (oy + 30) + " " + (x + 18) + " " + (oy + 14), INK, 9);
    return out;
  }

  // ---------- 衣服（以 200 單位設計，依部位對齊到新的臉）----------
  var ACC = {
    bow: function(S){ return S.P("M132 46 L112 34 L112 60 Z", "#FF5C8A") + S.P("M132 46 L152 34 L152 60 Z", "#FF5C8A") + S.C(132, 47, 7, "#FF9DB8"); },
    cap: function(S){ return S.P("M46 56 Q50 14 100 14 Q150 14 154 56 Q100 44 46 56 Z", "#3B82F6") + S.P("M94 52 Q132 44 180 60 Q154 74 100 64 Z", "#2F6FD8") + S.C(100, 16, 6, "#fff"); },
    straw: function(S){ return S.E(100, 52, 76, 15, "#F2D58A") + S.P("M60 50 Q62 8 100 8 Q138 8 140 50 Q100 42 60 50 Z", "#F7E3A6") + S.N("M62 44 Q100 36 138 44 L138 36 Q100 28 62 36 Z", "#E0524A"); },
    grad: function(S){ return S.P("M26 38 L100 12 L174 38 L100 62 Z", "#2b2f3a") + S.P("M64 50 L64 72 Q100 88 136 72 L136 50 L100 62 Z", "#3a4050") + S.L("M174 38 L174 72", "#FFD76A", 3.4) + S.C(174, 77, 5, "#FFD76A"); },
    top: function(S){ return S.E(100, 52, 60, 11, "#2b2b34") + S.R(66, 0, 68, 52, 6, "#2b2b34") + S.R(66, 34, 68, 10, 0, "#B23B32", S.o ? 'stroke="none"' : ""); },
    helm: function(S){ return S.P("M42 70 Q40 12 100 10 Q160 12 158 70 Q100 56 42 70 Z", "#9AA7B5") + S.R(94, 8, 12, 36, 5, "#7C8896") + S.N("M56 32 Q70 20 90 20", "none", 'stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"'); },
    crown: function(S){ return S.P("M54 52 L48 10 L76 32 L100 4 L124 32 L152 10 L146 52 Q100 60 54 52 Z", "#FFD23F") + S.C(100, 26, 6, "#FF4D6D") + S.C(68, 38, 4.5, "#3AA0FF") + S.C(132, 38, 4.5, "#4CCB7A"); },
    glass: function(S){ return S.C(76, 86, 15, "rgba(190,225,255,.4)") + S.C(124, 86, 15, "rgba(190,225,255,.4)") + S.L("M91 86 L109 86", INK, 3.4) + S.L("M61 84 L46 80 M139 84 L154 80", INK, 3.4); },
    shade: function(S){ return S.P("M56 76 Q76 72 92 78 L90 96 Q76 102 60 96 Z", "#222") + S.P("M144 76 Q124 72 108 78 L110 96 Q124 102 140 96 Z", "#222") + S.L("M92 80 L108 80", INK, 3.4) + S.N("M64 80 L76 80", "none", 'stroke="#fff" stroke-width="2.6" opacity=".6" stroke-linecap="round"'); },
    mask: function(S){ return S.C(76, 86, 15, "none", 'stroke="' + INK + '" stroke-width="3.4"') + S.C(124, 86, 15, "none", 'stroke="' + INK + '" stroke-width="3.4"') + S.L("M91 86 L109 86", INK, 3.4) + S.E(100, 100, 12, 9, "#F2B6A0") + S.P("M82 112 Q100 104 118 112 Q112 120 100 116 Q88 120 82 112 Z", "#4a3426"); },
    scarf: function(S){ return S.P("M50 134 Q100 160 150 134 L154 152 Q100 178 46 152 Z", "#E0524A") + S.P("M122 156 L142 192 L124 197 L110 162 Z", "#E0524A") + S.N("M60 142 L66 158 M82 150 L86 166 M104 154 L106 170 M126 150 L128 166", "none", 'stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".7"'); },
    chain: function(S){ var b = ""; for(var i = 0; i <= 8; i++){ var t = i / 8, x = 62 + t * 76, y = 136 + Math.sin(t * Math.PI) * 26; b += S.C(x, y, 4.4, i % 2 ? "#FFD23F" : "#FF8FB0"); } return b; },
    medal: function(S){ return S.P("M80 130 L100 164 L120 130 L111 128 L100 148 L89 128 Z", "#3B82F6") + S.C(100, 172, 14, "#FFD23F") + S.N("M100 164 L103 170 L110 170 L104 175 L106 182 L100 178 L94 182 L96 175 L90 170 L97 170 Z", "#E0A82E"); },
    balloon: function(S){ return S.L("M168 142 Q158 170 150 190", "#555", 2.4) + S.E(172, 108, 21, 27, "#FF5C5C") + S.N("M163 96 Q165 85 174 85", "none", 'stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"') + S.P("M167 133 L177 133 L172 141 Z", "#FF5C5C"); },
    bag: function(S){ return S.P("M26 124 Q16 124 16 138 L16 180 Q16 194 30 194 L52 194 L52 124 Z", "#4CAF6A") + S.R(21, 150, 26, 24, 4, "#3a8f55") + S.L("M52 128 Q82 124 84 146", "#2f7a47", 4.4); },
    wand: function(S){ return S.L("M152 180 L186 120", "#8a5a3a", 5.5) + S.N("M186 100 L190 113 L203 115 L192 122 L196 135 L186 128 L176 135 L180 122 L169 115 L182 113 Z", "#FFD23F", 'stroke="#E0A82E" stroke-width="1.6"'); }
  };
  var SLOT = { bow: "head", cap: "head", straw: "head", grad: "head", top: "head", helm: "head", crown: "head", glass: "face", shade: "face", mask: "face", scarf: "neck", chain: "neck", medal: "neck", balloon: "side", bag: "side", wand: "side" };
  A.ACC_SLOT = SLOT;
  // 衣服圖示（獨立使用）：用 200 單位的小圖，線寬縮小
  function accStyle(outline){ var S = mkStyle(outline), sc = 0.36; S.st = outline ? ' stroke="' + INK + '" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"' : ""; var st = S.st;
    S.P = function(d, f, x){ return '<path d="' + d + '" fill="' + f + '"' + st + (x ? " " + x : "") + '/>'; }; S.E = function(cx, cy, rx, ry, f, x){ return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + st + (x ? " " + x : "") + '/>'; };
    S.C = function(cx, cy, r, f, x){ return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '"' + st + (x ? " " + x : "") + '/>'; }; S.R = function(x0, y0, w, h, r, f, x){ return '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + f + '"' + st + (x ? " " + x : "") + '/>'; };
    S.L = function(d, c, w, x){ return '<path d="' + d + '" fill="none" stroke="' + (c || INK) + '" stroke-width="' + (w || 3.4) + '" stroke-linecap="round" stroke-linejoin="round"' + (x ? " " + x : "") + '/>'; };
    return S; }
  A.accSvg = function(id, style){ return ACC[id] ? ACC[id](accStyle(A.norm(style) === "outline")) : ""; };
  // 衣服穿在寵物身上：換算成 512 座標（頭上、臉上、脖子、身邊）
  function accOnPet(id, S, outline){
    var g = S.g, slot = SLOT[id], a = ACC[id]; if(!a) return "";
    var S2 = accStyle(outline), k, tx, ty;
    if(slot === "head"){ k = (g.head.rx * 2) / 116 * 0.92; tx = g.head.cx - 100 * k; ty = (g.head.cy - g.head.ry) - 26 * k; }
    else if(slot === "face"){ var sp2 = (g.eyes.x2 - g.eyes.x1) / 48; k = Math.min(Math.max(sp2, 1.7), 2.5); tx = 255 - 100 * k; ty = g.eyes.y - 84 * k; }
    else if(slot === "neck"){ k = (g.head.rx * 2) / 116 * 0.9; tx = 255 - 100 * k; ty = (g.head.cy + g.head.ry) - 138 * k; }
    else { k = 2.3; tx = 255 - 100 * k; ty = 392 - 150 * k; }
    return '<g transform="translate(' + tx + " " + ty + ") scale(" + k + ')">' + a(S2) + "</g>";
  }

  // ---------- 主要輸出 ----------
  var css = ".pa-art{overflow:visible;display:block;} .pa-body-g{transform-box:fill-box;transform-origin:50% 100%;animation:paBreath 3s ease-in-out infinite;} .pa-eyes{transform-box:fill-box;transform-origin:50% 50%;animation:paBlink 4.2s infinite;} .pa-chew{transform-box:fill-box;transform-origin:50% 50%;animation:paChew .35s ease-in-out infinite;} .pa-tailg{transform-box:fill-box;transform-origin:0% 100%;animation:paTail 1.6s ease-in-out infinite;} .pa-aura{animation:paAura 3s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%;} .pa-spark{animation:paSpark 1.8s ease-in-out infinite;} .pa-zzz{animation:paZ 2.6s ease-in-out infinite;}" +
    "@keyframes paBreath{0%,100%{transform:scale(1,1)}50%{transform:scale(1.012,1.025)}} @keyframes paBlink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}} @keyframes paChew{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.55)}} @keyframes paTail{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(7deg)}} @keyframes paAura{0%,100%{opacity:.65;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}} @keyframes paSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}} @keyframes paZ{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(24px,-40px)}}";
  var st0 = document.createElement("style"); st0.textContent = css; document.head.appendChild(st0);
  var STAGE_SC = [0.74, 0.87, 1, 1.06];
  A.svg = function(o){
    var outline = A.norm(o.style) === "outline", S = mkStyle(outline), g = S.g, sp = A.byEmoji(o.sp), mood = o.mood || "neutral", stage = Math.max(0, Math.min(3, o.stage || 0)), eq = o.eq || {}, anim = o.anim !== false;
    var C = function(k){ return col(sp, k, outline); };
    var body = C("body"), belly = C("belly"), armC = C("arm") || body, footC = C("foot") || body, padC = outline ? (sp.c.pad || "#FFDCCB") : (C("pad") || shade(footC, -40));
    var pre = '<ellipse cx="255" cy="506" rx="170" ry="16" fill="#000" opacity=".13"/>';
    if(stage >= 3) pre = '<g class="' + (anim ? "pa-aura" : "") + '"><circle cx="255" cy="270" r="290" fill="url(#paAuraG)"/></g>' + pre;
    var defs = '<defs><radialGradient id="paAuraG"><stop offset="0" stop-color="#FFE98A" stop-opacity=".85"/><stop offset=".7" stop-color="#FFD23F" stop-opacity=".25"/><stop offset="1" stop-color="#FFD23F" stop-opacity="0"/></radialGradient></defs>';
    var inn = "";
    if(sp.back) inn += '<g class="' + (anim ? "pa-tailg" : "") + '">' + sp.back(S, sp.c) + "</g>";
    if(outline) g.arms.forEach(function(a){ inn += S.SE(a.x, a.y, a.rx, a.ry, armC, { rot: a.rot, k: 12 }); });
    if(outline){
      inn += S.SE(256, 440, 150, 56, body, { k: 14 });
      inn += S.SE(g.belly.cx, g.belly.cy, g.belly.rx, g.belly.ry, belly, { k: 18 });
    } else {
      var cid = "pc" + (++UID), tor = '<ellipse cx="256" cy="366" rx="155" ry="118"';
      inn += S.N("M190 196 C96 246 28 330 52 424 C70 500 440 500 458 424 C482 330 414 246 320 196 Z", shade(body, -50)) + '<clipPath id="' + cid + '">' + tor + '/></clipPath>' + tor + ' fill="' + shade(body, -22) + '"/><g clip-path="url(#' + cid + ')"><ellipse cx="255" cy="250" rx="170" ry="40" fill="' + shade(body, -50) + '"/></g>';
    }
    if(outline) g.feet.forEach(function(f){ inn += S.SE(f.x, f.y, f.rx, f.ry, footC, { rot: f.rot, k: 12 }) + S.E(f.px, f.py, f.prx, f.pry, padC, 'transform="rotate(' + f.rot + " " + f.px + " " + f.py + ')"'); });
    else [0, 1].forEach(function(i){ var m = i ? ' transform="translate(512 0) scale(-1 1)"' : ""; inn += '<g' + m + '><path d="M44 408 Q42 352 104 350 Q162 350 162 392 Q156 460 128 502 Q104 520 86 498 Q46 452 44 408 Z" fill="' + footC + '"/><path d="M74 420 Q72 386 102 384 Q134 386 132 416 Q128 450 112 470 Q96 480 88 466 Q74 446 74 420 Z" fill="' + padC + '"/></g>'; });
    if(sp.ears) inn += sp.ears(S, sp.c);
    var hc = sp.headFill || body;
    inn += S.SE(g.head.cx, g.head.cy, g.head.rx, g.head.ry, hc, { k: g.head.k });
    if(sp.mid) inn += sp.mid(S, sp.c);
    
    inn += eyesSvg(S, mood, sp); if(sp.nose) inn += sp.nose(S, sp.c); if(!sp.noPhil && (mood === "neutral" || mood === "sleep")) inn += philtrum(S);
    inn += mouthSvg(S, mood, sp);
    ["side", "neck", "face", "head"].forEach(function(sl){ if(eq[sl] && ACC[eq[sl]]) inn += accOnPet(eq[sl], S, outline); });
    var gg = '<g class="' + (anim ? "pa-body-g" : "") + '">' + inn + "</g>";
    var sc = STAGE_SC[stage], tf = "translate(" + (255 - 255 * sc) + " " + (505 - 505 * sc) + ") scale(" + sc + ")", post = "";
    if(stage >= 2){ [[52, 120, 34], [470, 160, 28], [500, 330, 24], [20, 340, 26]].forEach(function(p, i){ post += '<g class="' + (anim ? "pa-spark" : "") + '" style="animation-delay:' + (i * .45) + 's;transform-box:fill-box;transform-origin:center"><path d="M' + p[0] + " " + (p[1] - p[2]) + " L" + (p[0] + p[2] * .3) + " " + (p[1] - p[2] * .3) + " L" + (p[0] + p[2]) + " " + p[1] + " L" + (p[0] + p[2] * .3) + " " + (p[1] + p[2] * .3) + " L" + p[0] + " " + (p[1] + p[2]) + " L" + (p[0] - p[2] * .3) + " " + (p[1] + p[2] * .3) + " L" + (p[0] - p[2]) + " " + p[1] + " L" + (p[0] - p[2] * .3) + " " + (p[1] - p[2] * .3) + ' Z" fill="#FFD23F"/></g>'; }); }
    if(stage >= 3) post += '<ellipse cx="255" cy="-42" rx="76" ry="18" fill="none" stroke="#FFD23F" stroke-width="13"/>';
    return '<svg class="pa-art" viewBox="-40 -80 592 612" xmlns="http://www.w3.org/2000/svg">' + defs + pre + '<g transform="' + tf + '">' + gg + "</g>" + post + "</svg>";
  };
  A.render = function(el, o){ el.innerHTML = A.svg(o); };
})();
