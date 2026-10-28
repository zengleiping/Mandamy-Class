/* 寵物美術（第二版）：參考「坐姿玩偶」風格——大圓頭、圓滾滾身體、腳底朝前、小圓點眼睛。
   兩種外觀：outline＝線條填色（黑色粗外框、粉嫩色、右下一彎陰影）、flat＝扁平色塊（無外框、用深一階的色塊做陰影）。
   全部是向量，20 種寵物、16 件衣服、7 種表情、4 個成長階段，不需要任何圖檔。 */
(function(){
  "use strict";
  var A = window.PETART = {};
  A.STYLES = [{ id: "outline", name: "線條填色" }, { id: "flat", name: "扁平色塊" }];
  A.norm = function(s){ return s === "flat" ? "flat" : "outline"; };
  var INK = "#2b1c1c", UID = 0;
  function shade(hex, amt){ var n = parseInt(hex.slice(1), 16), r = Math.max(0, Math.min(255, (n >> 16) + amt)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt)), b = Math.max(0, Math.min(255, (n & 255) + amt)); return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
  A.shade = shade;
  function mkStyle(outline){
    var st = outline ? ' stroke="' + INK + '" stroke-width="4.4" stroke-linejoin="round" stroke-linecap="round"' : "";
    var S = { o: outline, st: st };
    // 基本圖形（外框風格會加黑框）
    S.P = function(d, f, x){ return '<path d="' + d + '" fill="' + f + '"' + st + (x ? " " + x : "") + '/>'; };
    S.E = function(cx, cy, rx, ry, f, x){ return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + st + (x ? " " + x : "") + '/>'; };
    S.C = function(cx, cy, r, f, x){ return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '"' + st + (x ? " " + x : "") + '/>'; };
    S.R = function(x0, y0, w, h, r, f, x){ return '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + f + '"' + st + (x ? " " + x : "") + '/>'; };
    S.L = function(d, col, w, x){ return '<path d="' + d + '" fill="none" stroke="' + (col || INK) + '" stroke-width="' + (w || 3.4) + '" stroke-linecap="round" stroke-linejoin="round"' + (x ? " " + x : "") + '/>'; };
    S.N = function(d, f, x){ return '<path d="' + d + '" fill="' + f + '"' + (x ? " " + x : "") + '/>'; };
    // 有陰影的形狀：底下先畫深色，再把亮色的同一形狀往左上（外框風）或往上（扁平風）移一點，並裁在原形狀內
    S.shaded = function(geom, base, k, dark){
      var id = "pc" + (++UID), dk = dark || shade(base, outline ? -30 : -40), ox = outline ? -k * 0.8 : 0, oy = outline ? -k * 0.6 : -k;
      var g = '<clipPath id="' + id + '">' + geom("") + '</clipPath>' + geom('fill="' + dk + '"') + '<g clip-path="url(#' + id + ')"><g transform="translate(' + ox + " " + oy + ')">' + geom('fill="' + base + '"') + "</g></g>";
      if(outline) g += geom('fill="none"' + st);
      return g;
    };
    S.SE = function(cx, cy, rx, ry, f, o){ o = o || {}; var tr = o.rot ? ' transform="rotate(' + o.rot + " " + cx + " " + cy + ')"' : ""; return S.shaded(function(a){ return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" ' + a + tr + "/>"; }, f, o.k || Math.min(rx, ry) * 0.24, o.dark); };
    S.SC = function(cx, cy, r, f, o){ o = o || {}; return S.shaded(function(a){ return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' + a + "/>"; }, f, o.k || r * 0.24, o.dark); };
    S.SP = function(d, f, o){ o = o || {}; return S.shaded(function(a){ return '<path d="' + d + '" ' + a + (o.x ? " " + o.x : "") + "/>"; }, f, o.k || 7, o.dark); };
    return S;
  }

  // ---------- 物種 ----------
  var SP = {}, E2I = {};
  function def(id, emoji, name, o){ o.id = id; o.e = emoji; o.name = name; SP[id] = o; E2I[emoji] = id; }
  // 共用零件
  function earsRound(S, c, y, dx, r, inCol){ y = y || 40; dx = dx || 50; r = r || 20; var L = 100 - dx, R = 100 + dx; return S.SC(L, y, r, c.ear || c.body) + S.C(L, y + 1, r * 0.52, inCol || c.earIn, S.o ? "" : 'opacity="1"') + S.SC(R, y, r, c.ear || c.body) + S.C(R, y + 1, r * 0.52, inCol || c.earIn); }
  function earsPoint(S, c, tip, inCol){ return S.SP("M50 62 Q44 28 56 14 Q80 22 92 38 Z", c.ear || c.body, { k: 6 }) + S.N("M56 52 Q54 34 59 24 Q72 29 79 40 Z", inCol || c.earIn) + S.SP("M150 62 Q156 28 144 14 Q120 22 108 38 Z", c.ear || c.body, { k: 6 }) + S.N("M144 52 Q146 34 141 24 Q128 29 121 40 Z", inCol || c.earIn); }
  function muzzle(S, col, rx, ry, cy){ return S.E(100, cy || 106, rx || 30, ry || 20, col); }
  function cheeks(S){ return S.N("M42 98 a9 6 0 1 0 18 0 a9 6 0 1 0 -18 0 M140 98 a9 6 0 1 0 18 0 a9 6 0 1 0 -18 0", "#FF8FA3", 'opacity=".5"'); }
  function noseDot(S, col, w){ w = w || 9; return S.E(100, 95, w, w * 0.68, col || "#3a2a2a"); }

  def("bear", "🐻", "小熊", { c: { body: "#B98255", belly: "#D2A37A", muzzle: "#EBCDA6", earIn: "#8A5A3C", nose: "#3a2a2a" },
    ears: function(S, c){ return earsRound(S, c, 40, 50, 20, S.o ? "#E8C9A8" : "#8A5A3C"); }, mid: function(S, c){ return muzzle(S, c.muzzle); }, nose: function(S, c){ return noseDot(S, c.nose, 10); } });
  def("dog", "🐶", "小狗", { c: { body: "#E3A96D", belly: "#FFE9CE", muzzle: "#FFE9CE", ear: "#A96E3E", nose: "#3a2a2a" },
    back: function(S, c){ return S.SP("M146 168 Q184 160 178 130 Q166 150 146 150 Z", c.body, { k: 5 }); },
    ears: function(S, c){ return S.SE(44, 70, 17, 34, c.ear, { rot: 14 }) + S.SE(156, 70, 17, 34, c.ear, { rot: -14 }); },
    mid: function(S, c){ return S.N("M62 60 Q76 44 92 56 Q88 78 66 84 Q56 76 62 60 Z", "#A96E3E", 'opacity=".95"') + muzzle(S, c.muzzle); }, nose: function(S, c){ return noseDot(S, c.nose, 10); } });
  def("cat", "🐱", "小貓", { c: { body: "#F0A24E", belly: "#FFF1DE", muzzle: "#FFF1DE", earIn: "#FFB4BD", nose: "#FF8FA3" },
    back: function(S, c){ return S.SP("M146 170 Q196 168 188 118 Q178 134 164 138 Q176 152 146 154 Z", c.body, { k: 5 }); },
    ears: function(S, c){ return earsPoint(S, c); },
    mid: function(S, c){ return S.N("M94 34 L94 50 M100 32 L100 50 M106 34 L106 50", "none", 'stroke="#C9772A" stroke-width="4" stroke-linecap="round"') + muzzle(S, c.muzzle, 26, 18, 104) + S.L("M48 98 L26 92 M48 106 L26 108 M152 98 L174 92 M152 106 L174 108", "#6b4a35", 2.6); },
    nose: function(S, c){ return S.P("M94 93 L106 93 L100 100 Z", c.nose); } });
  def("rabbit", "🐰", "小兔", { c: { body: "#F4EEE8", belly: "#FFFFFF", muzzle: "#FFFFFF", earIn: "#FFB4C6", nose: "#FF8FA3" },
    back: function(S, c){ return S.SC(148, 172, 16, "#FFFFFF"); },
    ears: function(S, c){ return S.SE(72, 26, 17, 46, c.body, { rot: -8 }) + S.E(72, 28, 8, 34, c.earIn, 'transform="rotate(-8 72 28)"' + (S.o ? "" : "")) + S.SE(128, 26, 17, 46, c.body, { rot: 8 }) + S.E(128, 28, 8, 34, c.earIn, 'transform="rotate(8 128 28)"'); },
    mid: function(S, c){ return muzzle(S, c.muzzle, 24, 17, 104); }, nose: function(S, c){ return S.P("M94 92 Q100 88 106 92 Q100 100 94 92 Z", c.nose); } });
  def("hamster", "🐹", "倉鼠", { c: { body: "#F2C88E", belly: "#FFF3E0", cheek: "#FFE1BD", earIn: "#FFB4BC", nose: "#E8838F" },
    ears: function(S, c){ return earsRound(S, c, 42, 46, 15, c.earIn); },
    mid: function(S, c){ return S.N("M60 48 Q72 34 88 42 Q86 62 68 70 Q56 64 60 48 Z", "#E09A4D") + S.N("M140 48 Q128 34 112 42 Q114 62 132 70 Q144 64 140 48 Z", "#E09A4D") + S.E(54, 104, 20, 17, c.cheek) + S.E(146, 104, 20, 17, c.cheek) + muzzle(S, "#FFF3E0", 20, 15, 102); },
    nose: function(S, c){ return S.E(100, 95, 6, 4.5, c.nose) + S.R(95, 104, 5, 8, 1.5, "#fff") + S.R(100, 104, 5, 8, 1.5, "#fff"); } });
  def("chick", "🐥", "小雞", { c: { body: "#FFD54A", belly: "#FFE98E", wing: "#F4B71C", beak: "#FF9A3C", foot: "#FF9A3C", nose: "#FF9A3C" }, arm: "#F4B71C", foot: "#FF9A3C",
    ears: function(){ return ""; },
    mid: function(S, c){ return S.P("M92 32 Q90 14 98 8 Q100 22 104 10 Q112 18 108 32 Z", c.wing); },
    nose: function(S, c){ return S.P("M88 94 Q100 86 112 94 Q100 108 88 94 Z", c.beak); } });
  def("fox", "🦊", "小狐狸", { c: { body: "#F07F34", belly: "#FFFFFF", earIn: "#4a3228", nose: "#3a2a2a" },
    back: function(S, c){ return S.SP("M146 170 Q204 176 196 112 Q186 144 150 148 Z", c.body, { k: 6 }) + S.N("M194 126 Q200 112 196 112 Q188 126 176 134 Z", "#FFFFFF"); },
    ears: function(S, c){ return earsPoint(S, c, 0, "#4a3228"); },
    mid: function(S, c){ return S.N("M44 92 Q54 130 100 132 Q146 130 156 92 Q132 106 100 104 Q68 106 44 92 Z", "#FFFFFF"); }, nose: function(S, c){ return noseDot(S, c.nose, 8); } });
  def("panda", "🐼", "熊貓", { c: { body: "#F7F7F7", belly: "#FFFFFF", black: "#363636", nose: "#363636" }, arm: "#363636", foot: "#363636",
    ears: function(S, c){ return S.SC(52, 40, 19, c.black, { dark: "#202020" }) + S.SC(148, 40, 19, c.black, { dark: "#202020" }); },
    mid: function(S, c){ return S.E(72, 84, 15, 19, c.black, 'transform="rotate(25 72 84)"') + S.E(128, 84, 15, 19, c.black, 'transform="rotate(-25 128 84)"'); }, nose: function(S, c){ return noseDot(S, c.nose, 9); }, eyeCol: "#FFFFFF" });
  def("frog", "🐸", "青蛙", { c: { body: "#7DCA5E", belly: "#EAF8CB", nose: "#3b7a2a" }, eyes: "frog",
    ears: function(S, c){ return S.SC(66, 40, 19, c.body) + S.SC(134, 40, 19, c.body); },
    mid: function(S, c){ return S.E(52, 104, 13, 9, "#FF9DAA", 'opacity=".6"') + S.E(148, 104, 13, 9, "#FF9DAA", 'opacity=".6"'); }, nose: function(S, c){ return S.C(94, 94, 2.2, c.nose, 'stroke="none"') + S.C(106, 94, 2.2, c.nose, 'stroke="none"'); } });
  def("penguin", "🐧", "企鵝", { c: { body: "#3E4F63", belly: "#FFFFFF", beak: "#FFA83C" }, arm: "#33424f", foot: "#FFA83C",
    ears: function(){ return ""; },
    mid: function(S, c){ return S.P("M56 80 Q56 56 80 62 Q100 70 120 62 Q144 56 144 80 Q144 124 100 136 Q56 124 56 80 Z", "#FFFFFF", S.o ? "" : "") ; },
    nose: function(S, c){ return S.P("M90 96 Q100 90 110 96 Q100 108 90 96 Z", c.beak); }, eyeCol: "#FFFFFF" });
  def("cow", "🐮", "小牛", { c: { body: "#FBFBFB", belly: "#FFFFFF", muzzle: "#FFB9C6", horn: "#F2E1B0", nose: "#C96A7C" },
    ears: function(S, c){ return S.P("M64 36 Q58 14 70 8 Q76 22 78 34 Z", c.horn) + S.P("M136 36 Q142 14 130 8 Q124 22 122 34 Z", c.horn) + S.SE(40, 60, 22, 12, c.body, { rot: -16 }) + S.SE(160, 60, 22, 12, c.body, { rot: 16 }); },
    mid: function(S, c){ return S.N("M52 66 Q62 38 90 46 Q88 70 70 82 Q56 82 52 66 Z", "#3d3a38") + S.E(100, 106, 29, 20, c.muzzle); },
    nose: function(S, c){ return S.E(90, 106, 3.4, 5, c.nose, 'stroke="none"') + S.E(110, 106, 3.4, 5, c.nose, 'stroke="none"'); }, mouthY: 14 });
  def("pig", "🐷", "小豬", { c: { body: "#FFB6C3", belly: "#FFD3DB", snout: "#FF93A9", ear: "#FF9BB0" },
    back: function(S){ return S.L("M146 168 Q170 160 164 146 Q154 140 160 130", "#E88FA0", 5); },
    ears: function(S, c){ return S.SP("M50 62 Q44 30 56 22 Q80 30 92 42 Z", c.ear, { k: 6 }) + S.SP("M150 62 Q156 30 144 22 Q120 30 108 42 Z", c.ear, { k: 6 }); },
    mid: function(S, c){ return S.E(100, 104, 24, 17, c.snout); }, nose: function(S){ return S.E(91, 104, 3.6, 5.2, "#B3506A", 'stroke="none"') + S.E(109, 104, 3.6, 5.2, "#B3506A", 'stroke="none"'); }, mouthY: 16 });
  // ----- 強化寵物 -----
  def("lion", "🦁", "獅子", { c: { body: "#EDB357", belly: "#FFF0D0", muzzle: "#FFF0D0", mane: "#BE7330", earIn: "#FFD9A8", nose: "#E8838F" },
    back: function(S, c){ return S.SP("M146 170 Q190 170 188 130 Q176 148 150 152 Z", c.body, { k: 5 }) + S.C(190, 126, 10, c.mane); },
    ears: function(S, c){ var m = ""; for(var i = 0; i < 12; i++){ var a = i / 12 * Math.PI * 2; m += S.C(100 + Math.cos(a) * 60, 86 + Math.sin(a) * 58, 19, c.mane); } return m + S.SC(100, 86, 66, c.mane, { k: 10 }) + S.SC(60, 34, 14, c.body) + S.SC(140, 34, 14, c.body); },
    mid: function(S, c){ return muzzle(S, c.muzzle, 26, 19, 104); }, nose: function(S, c){ return S.P("M92 92 L108 92 L100 101 Z", c.nose); } });
  def("tiger", "🐯", "老虎", { c: { body: "#F59A3C", belly: "#FFF1DC", muzzle: "#FFF1DC", earIn: "#FFF1DC", stripe: "#3a2a22", nose: "#E8838F" },
    back: function(S, c){ return S.SP("M146 170 Q196 166 190 120 Q176 144 150 150 Z", c.body, { k: 5 }) + S.N("M178 138 L190 132 M174 148 L188 146", "none", 'stroke="#3a2a22" stroke-width="5" stroke-linecap="round"'); },
    ears: function(S, c){ return earsRound(S, c, 40, 50, 18, c.earIn); },
    mid: function(S, c){ return S.N("M100 30 L100 52 M86 34 L89 50 M114 34 L111 50 M44 72 L64 78 M44 90 L62 90 M156 72 L136 78 M156 90 L138 90", "none", 'stroke="#3a2a22" stroke-width="5" stroke-linecap="round"') + muzzle(S, c.muzzle, 27, 19, 104); }, nose: function(S, c){ return S.P("M92 92 L108 92 L100 101 Z", c.nose); } });
  def("wolf", "🐺", "野狼", { c: { body: "#8F9BAB", belly: "#E8EDF2", earIn: "#C9D1DB", muzzle: "#E8EDF2", nose: "#2b2b30" },
    back: function(S, c){ return S.SP("M146 172 Q202 178 194 112 Q184 150 150 150 Z", c.body, { k: 6 }) + S.N("M192 128 Q198 114 194 112 Q188 128 176 136 Z", "#E8EDF2"); },
    ears: function(S, c){ return S.SP("M48 64 Q42 22 52 6 Q80 18 94 38 Z", c.body, { k: 6 }) + S.N("M54 52 Q52 28 56 16 Q72 24 80 38 Z", c.earIn) + S.SP("M152 64 Q158 22 148 6 Q120 18 106 38 Z", c.body, { k: 6 }) + S.N("M146 52 Q148 28 144 16 Q128 24 120 38 Z", c.earIn); },
    mid: function(S, c){ return S.N("M42 92 Q52 124 82 116 Q62 108 50 82 Z M158 92 Q148 124 118 116 Q138 108 150 82 Z", c.muzzle) + muzzle(S, c.muzzle, 26, 19, 104); }, nose: function(S, c){ return noseDot(S, c.nose, 9); } });
  def("eagle", "🦅", "老鷹", { c: { body: "#8B5E3E", belly: "#F1E2C6", head: "#FFFFFF", beak: "#FFC93D", wing: "#6E482F" }, arm: "#6E482F", foot: "#FFC93D", headFill: "#FFFFFF",
    back: function(S, c){ return S.SP("M58 120 Q8 100 12 168 Q38 148 60 156 Z", c.wing, { k: 6 }) + S.SP("M142 120 Q192 100 188 168 Q162 148 140 156 Z", c.wing, { k: 6 }); },
    ears: function(){ return ""; },
    mid: function(S, c){ return S.N("M66 50 Q100 24 134 50 Q100 40 66 50 Z", "#F4F4F4"); },
    nose: function(S, c){ return S.P("M86 94 Q100 86 114 94 Q110 112 100 116 Q90 112 86 94 Z", c.beak); }, mouthY: 18 });
  def("trex", "🦖", "暴龍", { c: { body: "#70C06D", belly: "#D9F1B6", jaw: "#90D88B", spike: "#4F9D4E", nose: "#3b7a2a" },
    back: function(S, c){ var sp = ""; [[74, 40], [100, 28], [126, 40]].forEach(function(p){ sp += S.SP("M" + (p[0] - 11) + " " + p[1] + " L" + p[0] + " " + (p[1] - 20) + " L" + (p[0] + 11) + " " + p[1] + " Z", c.spike, { k: 4 }); }); return S.SP("M146 166 Q204 180 196 126 Q186 156 150 148 Z", c.body, { k: 6 }) + sp; },
    ears: function(){ return ""; },
    mid: function(S, c){ return S.E(100, 106, 30, 20, c.jaw); }, nose: function(S, c){ return S.C(92, 94, 2.6, c.nose, 'stroke="none"') + S.C(108, 94, 2.6, c.nose, 'stroke="none"'); }, mouthY: 10, teeth: true });
  def("unicorn", "🦄", "獨角獸", { c: { body: "#FFF3FB", belly: "#FFFFFF", mane1: "#FF9AD0", mane2: "#9AD7FF", mane3: "#C3A0FF", horn: "#FFD76A", earIn: "#FFC7E6", nose: "#E8838F" },
    back: function(S, c){ return S.SP("M146 168 Q204 184 196 128 Q186 156 150 150 Z", c.mane3, { k: 5 }) + S.SP("M150 160 Q194 160 188 126 Q180 148 152 152 Z", c.mane2, { k: 4 }); },
    ears: function(S, c){ return S.SP("M54 52 Q48 20 60 14 Q80 22 92 38 Z", c.body, { k: 6 }) + S.N("M60 44 Q58 28 62 22 Q74 28 80 38 Z", c.earIn) + S.SP("M146 52 Q152 20 140 14 Q120 22 108 38 Z", c.body, { k: 6 }) + S.N("M140 44 Q142 28 138 22 Q126 28 120 38 Z", c.earIn) + S.SP("M52 60 Q26 50 28 100 Q42 84 58 88 Z", c.mane1, { k: 6 }) + S.SP("M148 60 Q174 50 172 100 Q158 84 142 88 Z", c.mane2, { k: 6 }); },
    mid: function(S, c){ return S.SP("M90 34 L100 -10 L110 34 Z", c.horn, { k: 4 }) + S.N("M93 22 L107 18 M95 10 L105 6", "none", 'stroke="#E0A82E" stroke-width="2.6" stroke-linecap="round"') + S.SP("M56 50 Q88 18 124 40 Q96 40 82 70 Z", c.mane3, { k: 6 }); },
    nose: function(S, c){ return S.E(94, 98, 2.6, 2, c.nose, 'stroke="none"') + S.E(106, 98, 2.6, 2, c.nose, 'stroke="none"'); }, mouthY: 6 });
  def("dragon", "🐲", "小龍", { c: { body: "#E8607A", belly: "#FFDCA8", wing: "#8F5FD3", horn: "#FFE9B8", nose: "#7a2a3a" },
    back: function(S, c){ return S.SP("M56 112 Q4 62 16 136 Q32 128 48 146 Z", c.wing, { k: 7 }) + S.SP("M144 112 Q196 62 184 136 Q168 128 152 146 Z", c.wing, { k: 7 }) + S.SP("M146 168 Q200 172 192 122 Q182 154 150 150 Z", c.body, { k: 6 }) + S.P("M188 128 L202 116 L196 138 Z", c.belly); },
    ears: function(S, c){ return S.SP("M60 50 Q48 18 52 6 Q76 14 88 36 Z", c.horn, { k: 5 }) + S.SP("M140 50 Q152 18 148 6 Q124 14 112 36 Z", c.horn, { k: 5 }); },
    mid: function(S, c){ return S.N("M86 34 L100 22 L114 34", "none", 'stroke="#8F5FD3" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"') + S.E(100, 106, 24, 17, "#FF9DB0", 'opacity=".5"'); },
    nose: function(S, c){ return S.C(94, 96, 2.4, c.nose, 'stroke="none"') + S.C(106, 96, 2.4, c.nose, 'stroke="none"'); } });
  def("god", "🐉", "神龍", { c: { body: "#F4C650", belly: "#FFF2C6", teal: "#2DB7A9", horn: "#FFEAB0", nose: "#8a5a00" },
    back: function(S, c){ return S.SP("M146 166 Q206 182 198 118 Q190 160 152 150 Z", c.body, { k: 6 }) + S.SP("M56 128 Q8 114 20 70 Q36 100 60 106 Z", c.teal, { k: 6 }) + S.SP("M144 128 Q192 114 180 70 Q164 100 140 106 Z", c.teal, { k: 6 }); },
    ears: function(S, c){ return S.SP("M62 50 Q44 16 50 4 Q78 14 90 36 Z", c.horn, { k: 5 }) + S.SP("M138 50 Q156 16 150 4 Q122 14 110 36 Z", c.horn, { k: 5 }) + S.L("M50 76 Q8 74 12 108 M150 76 Q192 74 188 108", c.teal, 5); },
    mid: function(S, c){ return S.N("M66 50 Q100 24 134 50 Q100 40 66 50 Z", c.teal) + S.E(100, 106, 24, 17, "#FFF2C6") + S.N("M86 148 L90 156 M100 150 L104 158 M114 148 L118 156", "none", 'stroke="#2DB7A9" stroke-width="3.4" stroke-linecap="round"'); },
    nose: function(S, c){ return S.C(94, 96, 2.4, c.nose, 'stroke="none"') + S.C(106, 96, 2.4, c.nose, 'stroke="none"'); } });
  A.SPECIES = SP;
  A.byEmoji = function(e){ return SP[E2I[e] || "bear"]; };

  // ---------- 表情（小圓點眼睛）----------
  function eyes(S, mood, sp){
    var L = [76, 82], R = [124, 82], out = "", dark = sp.eyeCol || INK;
    if(sp.eyes === "frog"){
      var fe = function(x){ return S.C(x, 40, 17, "#FFFFFF") + (mood === "sleep" || mood === "eat" || mood === "love" ? S.L("M" + (x - 8) + " 42 Q" + x + " 34 " + (x + 8) + " 42", INK, 3.4) : S.C(x, 42, 7, INK, 'stroke="none"') + S.C(x - 2.4, 39, 2.4, "#fff", 'stroke="none"')); };
      return '<g class="pa-eyes">' + fe(66) + fe(134) + "</g>";
    }
    var dot = function(p){ return S.C(p[0], p[1], 5, dark, 'stroke="none"') + (sp.eyeCol ? "" : '<circle cx="' + (p[0] - 1.6) + '" cy="' + (p[1] - 1.8) + '" r="1.6" fill="#fff"/>'); };
    var happy = function(p){ return S.L("M" + (p[0] - 8) + " " + (p[1] + 3) + " Q" + p[0] + " " + (p[1] - 8) + " " + (p[0] + 8) + " " + (p[1] + 3), dark, 3.8); };
    var closed = function(p){ return S.L("M" + (p[0] - 8) + " " + (p[1] - 1) + " Q" + p[0] + " " + (p[1] + 7) + " " + (p[0] + 8) + " " + (p[1] - 1), dark, 3.4); };
    var heart = function(p){ var x = p[0], y = p[1]; return '<path d="M' + x + " " + (y + 8) + " C" + (x - 14) + " " + (y - 2) + " " + (x - 7) + " " + (y - 12) + " " + x + " " + (y - 4) + " C" + (x + 7) + " " + (y - 12) + " " + (x + 14) + " " + (y - 2) + " " + x + " " + (y + 8) + ' Z" fill="#FF4D6D"/>'; };
    if(mood === "sleep") out = closed(L) + closed(R);
    else if(mood === "eat") out = happy(L) + happy(R);
    else if(mood === "love") out = heart(L) + heart(R);
    else { out = '<g class="pa-eyes">' + dot(L) + dot(R) + "</g>"; if(mood === "sad" || mood === "hungry") out += S.L("M64 68 L88 62 M136 68 L112 62", INK, 3); if(mood === "sad") out += '<path d="M70 92 Q66 104 72 106 Q78 104 70 92 Z" fill="#7CC8FF"/>'; }
    return out;
  }
  function mouth(S, mood, sp){
    var y = 104 + (sp.mouthY || 0), out = "", dark = INK;
    if(sp.teeth && mood !== "sad") out += S.N("M86 " + (y + 1) + " L90 " + (y + 10) + " L94 " + (y + 1) + " M106 " + (y + 1) + " L110 " + (y + 10) + " L114 " + (y + 1), "#fff", 'stroke="' + dark + '" stroke-width="1.6"');
    if(mood === "happy" || mood === "love") out += '<path d="M90 ' + (y - 2) + " Q100 " + (y + 17) + " 110 " + (y - 2) + ' Z" fill="#6b2a2a"' + (S.o ? ' stroke="' + INK + '" stroke-width="3.4" stroke-linejoin="round"' : "") + '/><path d="M94 ' + (y + 6) + " Q100 " + (y + 12) + " 106 " + (y + 6) + " Q100 " + (y + 3) + " 94 " + (y + 6) + ' Z" fill="#FF8FA3"/>';
    else if(mood === "eat") out += '<g class="pa-chew"><ellipse cx="100" cy="' + (y + 4) + '" rx="9" ry="8" fill="#6b2a2a"' + (S.o ? ' stroke="' + INK + '" stroke-width="3.4"' : "") + '/><ellipse cx="100" cy="' + (y + 8) + '" rx="5" ry="3.4" fill="#FF8FA3"/></g>';
    else if(mood === "sad") out += S.L("M90 " + (y + 8) + " Q100 " + (y - 3) + " 110 " + (y + 8), dark, 3.4);
    else if(mood === "hungry") out += '<ellipse cx="100" cy="' + (y + 4) + '" rx="6.5" ry="8.5" fill="#6b2a2a"' + (S.o ? ' stroke="' + INK + '" stroke-width="3.4"' : "") + '/><path d="M107 ' + (y + 8) + " Q111 " + (y + 22) + " 107 " + (y + 24) + " Q103 " + (y + 20) + " 107 " + (y + 8) + ' Z" fill="#7CC8FF"/>';
    else if(mood === "sleep") out += S.L("M95 " + (y + 3) + " Q100 " + (y + 8) + " 105 " + (y + 3), dark, 3);
    else out += S.L("M100 " + (y - 3) + " L100 " + (y + 2) + " M91 " + (y + 4) + " Q96 " + (y + 9) + " 100 " + (y + 2) + " Q104 " + (y + 9) + " 109 " + (y + 4), dark, 3.2);
    return out;
  }

  // ---------- 衣服 ----------
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
  A.accSvg = function(id, style){ var S = mkStyle(A.norm(style) === "outline"); return ACC[id] ? ACC[id](S) : ""; };
  var SLOT_DY = { head: 0, face: 0, neck: 0, side: 0 };

  // ---------- 主要輸出 ----------
  var css = ".pa-art{overflow:visible;display:block;} .pa-body-g{transform-box:fill-box;transform-origin:50% 100%;animation:paBreath 3s ease-in-out infinite;} .pa-eyes{transform-box:fill-box;transform-origin:50% 50%;animation:paBlink 4.2s infinite;} .pa-chew{transform-box:fill-box;transform-origin:50% 50%;animation:paChew .35s ease-in-out infinite;} .pa-tailg{transform-box:fill-box;transform-origin:0% 100%;animation:paTail 1.6s ease-in-out infinite;} .pa-aura{animation:paAura 3s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%;} .pa-spark{animation:paSpark 1.8s ease-in-out infinite;} .pa-zzz{animation:paZ 2.6s ease-in-out infinite;}" +
    "@keyframes paBreath{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,1.03)}} @keyframes paBlink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}} @keyframes paChew{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.55)}} @keyframes paTail{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(7deg)}} @keyframes paAura{0%,100%{opacity:.65;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}} @keyframes paSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}} @keyframes paZ{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(10px,-18px)}}";
  var st0 = document.createElement("style"); st0.textContent = css; document.head.appendChild(st0);
  var STAGE_SC = [0.76, 0.88, 1, 1.06];
  // o: { sp(emoji), style, mood, stage, eq, anim(預設 true) }
  A.svg = function(o){
    var outline = A.norm(o.style) === "outline", S = mkStyle(outline), sp = A.byEmoji(o.sp), c = sp.c, mood = o.mood || "neutral", stage = Math.max(0, Math.min(3, o.stage || 0)), eq = o.eq || {}, anim = o.anim !== false;
    var body = c.body, inn = "";
    var pre = '<ellipse cx="100" cy="201" rx="62" ry="8" fill="#000" opacity=".14"/>';
    if(stage >= 3) pre = '<g class="' + (anim ? "pa-aura" : "") + '"><circle cx="100" cy="112" r="108" fill="url(#paAuraG)"/></g>' + pre;
    var defs = '<defs><radialGradient id="paAuraG"><stop offset="0" stop-color="#FFE98A" stop-opacity=".85"/><stop offset=".7" stop-color="#FFD23F" stop-opacity=".25"/><stop offset="1" stop-color="#FFD23F" stop-opacity="0"/></radialGradient></defs>';
    var armC = sp.arm || body, footC = sp.foot || body;
    if(sp.back) inn += '<g class="' + (anim ? "pa-tailg" : "") + '">' + sp.back(S, c) + "</g>";
    inn += S.SE(46, 142, 15, 30, armC, { rot: 26 }) + S.SE(154, 142, 15, 30, armC, { rot: -26 });                       // 手臂（在身體後面）
    inn += S.SE(100, 148, 52, 48, body, { k: 11 });                                                                    // 身體
    inn += S.SE(100, 154, 33, 33, c.belly, { k: 7 });                                                                  // 肚子
    inn += S.SE(60, 182, 25, 19, footC, { rot: -10, k: 5 }) + S.E(60, 183, 13, 10, outline ? "#FFE1D0" : shade(footC, -34), S.o ? "" : 'stroke="none"'); // 腳＋腳掌
    inn += S.SE(140, 182, 25, 19, footC, { rot: 10, k: 5 }) + S.E(140, 183, 13, 10, outline ? "#FFE1D0" : shade(footC, -34), S.o ? "" : 'stroke="none"');
    if(sp.ears) inn += sp.ears(S, c);
    inn += S.SC(100, 86, 58, sp.headFill || body, { k: 13 });                                                          // 頭
    if(sp.mid) inn += sp.mid(S, c);
    if(sp.eyes !== "frog" && mood !== "sleep") inn += cheeks(S);
    inn += eyes(S, mood, sp); if(sp.nose) inn += sp.nose(S, c); inn += mouth(S, mood, sp);
    if(mood === "sleep") inn += '<g class="' + (anim ? "pa-zzz" : "") + '"><text x="146" y="40" font-size="22" font-weight="800" fill="#6b7fd6">Z</text><text x="160" y="22" font-size="16" font-weight="800" fill="#8fa0ea">z</text></g>';
    ["side", "neck", "face", "head"].forEach(function(sl){ var id = eq[sl]; if(id && ACC[id]) inn += ACC[id](S); });
    var g = '<g class="' + (anim ? "pa-body-g" : "") + '">' + inn + "</g>";
    var sc = STAGE_SC[stage], tf = "translate(" + (100 - 100 * sc) + " " + (205 - 205 * sc) + ") scale(" + sc + ")", post = "";
    if(stage >= 2){ [[22, 40, 14], [178, 66, 11], [192, 150, 9], [8, 140, 10]].forEach(function(p, i){ post += '<g class="' + (anim ? "pa-spark" : "") + '" style="animation-delay:' + (i * .45) + 's;transform-box:fill-box;transform-origin:center"><path d="M' + p[0] + " " + (p[1] - p[2]) + " L" + (p[0] + p[2] * .3) + " " + (p[1] - p[2] * .3) + " L" + (p[0] + p[2]) + " " + p[1] + " L" + (p[0] + p[2] * .3) + " " + (p[1] + p[2] * .3) + " L" + p[0] + " " + (p[1] + p[2]) + " L" + (p[0] - p[2] * .3) + " " + (p[1] + p[2] * .3) + " L" + (p[0] - p[2]) + " " + p[1] + " L" + (p[0] - p[2] * .3) + " " + (p[1] - p[2] * .3) + ' Z" fill="#FFD23F"/></g>'; }); }
    if(stage >= 3) post += '<ellipse cx="100" cy="-14" rx="30" ry="7" fill="none" stroke="#FFD23F" stroke-width="5"/>';
    return '<svg class="pa-art" viewBox="-20 -34 240 262" xmlns="http://www.w3.org/2000/svg">' + defs + pre + '<g transform="' + tf + '">' + g + "</g>" + post + "</svg>";
  };
  A.render = function(el, o){ el.innerHTML = A.svg(o); };
})();
