/* 寵物第四套畫風「像素貓咪」：像素藝術（pixel art）的側身小貓（頭朝前、身體側面、四隻細腳、尾巴翹起、長鬍鬚），深色外框、一格一格的色塊，有橘虎斑、灰虎斑、黑貓、燕尾服、三花、暹羅六種花色。
   用法跟 PETART 一樣：PETART.svg({ sp, style: "pixel", stage, eq, anim })。選了「像素貓咪」風格的班級，領養／神蛋孵出的是這六隻貓；
   不是貓的寵物（獅子、老虎…）在這個風格下仍用「軟萌」畫風；貓的花色在其他風格下一律畫成橘貓。 */
(function(){
  "use strict";
  var A = window.PETART; if(!A) return;
  var OL = "#2c2331", UID = 0, shade = A.shade;
  var CATS = [
    { e: "🐱", n: "橘貓", r: "c", B: "#F0A24C", S: "#D07A2A", W: "#FFF0D6", E: "#3a2a22" },
    { e: "🐈", n: "灰貓", r: "c", B: "#9AA0B4", S: "#747A92", W: "#E9EBF2", E: "#3a2a22" },
    { e: "🐈‍⬛", n: "黑貓", r: "c", B: "#3c3a47", S: "#2b2933", W: "#555362", E: "#F2D14F" },
    { e: "😺", n: "燕尾服貓", r: "r", B: "#34323e", S: "#34323e", W: "#FFFFFF", E: "#7CCB62" },
    { e: "😸", n: "三花貓", r: "r", B: "#FBF6EC", S: "#FBF6EC", W: "#FBF6EC", E: "#3a2a22", C: "#EDA04A", D: "#3b3945", calico: true },
    { e: "😻", n: "暹羅貓", r: "e", B: "#F3E6D2", S: "#F3E6D2", W: "#FBF3E6", E: "#6FA8DC", D: "#7A5646", siamese: true }
  ];
  var BY = {}; CATS.forEach(function(c){ BY[c.e] = c; });
  A.pixelCats = CATS.map(function(c){ return c.e; });
  A.pixelName = function(e){ return BY[e] ? BY[e].n : ""; };
  A.pixelRarity = function(e){ return BY[e] ? BY[e].r : ""; };
  A.STYLES = [{ id: "soft", name: "軟萌圓圓" }, { id: "pixel", name: "像素貓咪" }, { id: "outline", name: "線條填色" }, { id: "flat", name: "扁平色塊" }];
  var normPrev = A.norm;
  A.norm = function(s){ return s === "pixel" ? "pixel" : normPrev(s); };
  var orig = A.svg;

  // 側身貓（參考像素風小貓：頭朝向前方、身體側面、四隻細腳、尾巴翹起來、長長的鬍鬚）。一格一格用「畫長方形」的方式組出來
  var CELL = 13, OFF = 2, GW = 40, GH = 21, X0 = -4, Y0 = 222, HEAD = { c1: 16, c2: 29, r1: 3, r2: 12 };
  function build(c){
    var g = [], r, x;
    for(r = 0; r < GH; r++){ g.push([]); for(x = 0; x < GW; x++) g[r][x] = ""; }
    function P(r1, r2, c1, c2, k){ for(var y = r1; y <= r2; y++) for(var xx = c1; xx <= c2; xx++) g[y][xx + OFF] = k; }
    function Q(y, xx, k){ g[y][xx + OFF] = k; }
    function inGrid(y, xx){ return g[y] && g[y][xx + OFF] !== undefined; }
    // 身體、腳
    P(11, 17, 5, 24, "B"); Q(11, 5, ""); Q(17, 5, ""); Q(11, 24, ""); P(18, 20, 6, 7, "B"); P(18, 20, 10, 11, "B"); P(18, 20, 19, 20, "B"); P(18, 20, 23, 24, "B");
    P(20, 20, 6, 7, "W"); P(20, 20, 10, 11, "W"); P(20, 20, 19, 20, "W"); P(20, 20, 23, 24, "W");
    P(17, 17, 10, 16, "P");                       // 肚子上粉紅色的一塊
    [8, 11, 14].forEach(function(cx){ P(11, 14, cx, cx, "S"); });   // 背上的條紋
    // 頭、耳朵
    P(3, 12, 16, 29, "B"); Q(12, 16, ""); Q(12, 29, ""); Q(3, 16, ""); Q(3, 29, "");
    P(1, 2, 16, 17, "B"); P(1, 2, 28, 29, "B"); Q(1, 17, ""); Q(1, 28, ""); Q(2, 17, "P"); Q(2, 28, "P"); Q(3, 17, "B"); Q(3, 28, "B");
    P(4, 5, 19, 19, "S"); P(4, 5, 22, 22, "S"); P(4, 5, 25, 25, "S");     // 額頭條紋
    P(8, 11, 20, 25, "W");                        // 白色的嘴巴周圍
    Q(6, 19, "E"); Q(7, 19, "E"); Q(6, 26, "E"); Q(7, 26, "E");     // 眼睛（點點眼）
    Q(8, 22, "N"); Q(8, 23, "N"); Q(9, 22, "M"); Q(9, 23, "M");
    P(13, 16, 22, 24, "W");                       // 胸口
    // 鬍鬚（外框色，不會再被描邊）
    P(8, 8, 12, 15, "K"); P(10, 10, 13, 15, "K"); P(8, 8, 30, 33, "K"); P(10, 10, 30, 32, "K");
    // 尾巴：從屁股往上翹
    var tail = {};
    function T(y, xx, k){ tail[(xx + OFF) + "," + y] = k || "B"; }
    [[13, 5], [13, 4], [12, 4], [12, 3], [11, 3], [10, 3], [9, 2], [8, 2], [7, 2], [6, 2], [5, 2], [4, 2]].forEach(function(t){ T(t[0], t[1]); });
    T(4, 3, "S"); T(3, 3, "S"); T(3, 2, "S");
    var plain = ["B", "S", "W"];
    function fill(r1, r2, c1, c2, k, only){ for(var y = r1; y <= r2; y++) for(var xx = c1; xx <= c2; xx++){ var cur = inGrid(y, xx) && g[y][xx + OFF]; if(cur && only.indexOf(cur) >= 0) g[y][xx + OFF] = k; } }
    var tailMark = null;
    if(c.calico){ fill(1, 8, 16, 21, "D", plain); fill(3, 9, 26, 29, "C", plain); fill(11, 15, 8, 14, "C", plain); fill(12, 17, 17, 22, "D", plain); fill(18, 20, 6, 7, "C", plain); tailMark = "D"; }
    if(c.siamese){ fill(1, 4, 16, 18, "D", ["B", "S"]); fill(1, 4, 27, 29, "D", ["B", "S"]); fill(5, 12, 19, 26, "D", ["B", "S", "W"]); fill(19, 20, 6, 7, "D", ["B", "W"]); fill(19, 20, 10, 11, "D", ["B", "W"]); fill(19, 20, 19, 20, "D", ["B", "W"]); fill(19, 20, 23, 24, "D", ["B", "W"]); tailMark = "D"; }
    return { g: g, tail: tail, W: GW, H: GH, tailMark: tailMark };
  }
  function colorOf(c, k){
    if(k === "B") return c.B; if(k === "S") return c.S; if(k === "W") return c.W; if(k === "C") return c.C; if(k === "D") return c.D;
    if(k === "P") return "#F4A6B4"; if(k === "N") return "#E57F8F"; if(k === "M") return OL; if(k === "E") return c.E; if(k === "L") return "#ffffff"; if(k === "K") return OL; return c.B;
  }
  function rect(x, y, w, h, f){ return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + f + '"/>'; }
  // 一格一格畫，同一列顏色相同的連續格子合併成一塊（檔案小，也不會有縫）
  function rowsSvg(map){   // map: { "x,y": color }
    var byRow = {}, out = "";
    Object.keys(map).forEach(function(key){ var p = key.split(","), x = +p[0], y = +p[1]; (byRow[y] = byRow[y] || []).push([x, map[key]]); });
    Object.keys(byRow).forEach(function(y){
      var a = byRow[y].sort(function(p, q){ return p[0] - q[0]; }), i = 0;
      while(i < a.length){ var j = i; while(j + 1 < a.length && a[j + 1][0] === a[j][0] + 1 && a[j + 1][1] === a[i][1]) j++; out += rect(X0 + a[i][0] * CELL, Y0 + y * CELL, (a[j][0] - a[i][0] + 1) * CELL + 0.7, CELL + 0.7, a[i][1]); i = j + 1; }
    });
    return out;
  }
  function render(c){
    var m = build(c), g = m.g, tail = m.tail, H = m.H, W = m.W, x, y, body = {}, eyes = {}, bodyO = {}, tailF = {}, tailO = {};
    for(y = 0; y < H; y++) for(x = 0; x < W; x++){ var k = g[y][x]; if(!k) continue; if(k === "E" || k === "L") eyes[x + "," + y] = colorOf(c, k); else body[x + "," + y] = colorOf(c, k); }
    Object.keys(tail).forEach(function(key){ tailF[key] = m.tailMark ? colorOf(c, m.tailMark) : (tail[key] === "S" ? c.S : c.B); });
    function solid(yy, xx){ var k2 = g[yy] && g[yy][xx]; return !!k2 && k2 !== "K"; }
    function filled(xx, yy){ return solid(yy, xx) || !!tail[xx + "," + yy]; }
    var D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for(y = -1; y <= H; y++) for(x = -1; x <= W + 1; x++){
      if(filled(x, y) || (g[y] && g[y][x] === "K")) continue;
      var nearBody = false, nearTail = false;
      D4.forEach(function(d){ var nx = x + d[0], ny = y + d[1]; if(solid(ny, nx)) nearBody = true; if(tail[nx + "," + ny]) nearTail = true; });
      if(nearBody) bodyO[x + "," + y] = OL; else if(nearTail) tailO[x + "," + y] = OL;
    }
    return { body: rowsSvg(bodyO) + rowsSvg(body), eyes: rowsSvg(eyes), tail: rowsSvg(tailO) + rowsSvg(tailF) };
  }

  var STAGE_SC = [0.74, 0.87, 1, 1.06], G = { head: { cx: X0 + (23 + OFF + 0.5) * CELL, cy: Y0 + 8 * CELL, rx: 7.5 * CELL, ry: 5.5 * CELL }, eyes: { y: Y0 + 7 * CELL } };
  A.svg = function(o){
    var st = A.norm(o.style), cat = BY[o.sp];
    if(st !== "pixel"){
      if(cat && o.sp !== "🐱") return orig(Object.assign({}, o, { sp: "🐱" }));
      return orig(o);
    }
    if(!cat) return orig(Object.assign({}, o, { style: "soft" }));
    var stage = Math.max(0, Math.min(3, o.stage || 0)), eq = o.eq || {}, anim = o.anim !== false, id = "px" + (++UID), R = render(cat);
    var defs = '<defs><radialGradient id="paAuraG"><stop offset="0" stop-color="#FFE98A" stop-opacity=".85"/><stop offset=".7" stop-color="#FFD23F" stop-opacity=".25"/><stop offset="1" stop-color="#FFD23F" stop-opacity="0"/></radialGradient></defs>';
    var pre = '<ellipse cx="256" cy="' + (Y0 + 21 * CELL + 8) + '" rx="190" ry="12" fill="#2c2331" opacity=".16"/>';
    if(stage >= 3) pre = '<g class="' + (anim ? "pa-aura" : "") + '"><circle cx="255" cy="290" r="290" fill="url(#paAuraG)"/></g>' + pre;
    var inn = '<g class="' + (anim ? "pa-tailg" : "") + '" shape-rendering="crispEdges">' + R.tail + '</g>';
    inn += '<g shape-rendering="crispEdges">' + R.body + '<g class="pa-eyes">' + R.eyes + '</g></g>';
    var SLOT = A.ACC_SLOT || {};
    ["side", "neck", "face", "head"].forEach(function(sl){ var aid = eq[sl]; if(!aid || !SLOT[aid]) return; var raw = A.accSvg(aid, "outline").replace(/#1b1212/g, OL), k, tx, ty, g = G.head;
      if(sl === "head"){ k = (g.rx * 2) / 116 * 0.92; tx = g.cx - 100 * k; ty = (g.cy - g.ry) - 26 * k + 6; }
      else if(sl === "face"){ k = (g.rx * 2) / 116 * 1.0; tx = g.cx - 100 * k; ty = G.eyes.y - 84 * k; }
      else if(sl === "neck"){ k = (g.rx * 2) / 116 * 0.9; tx = g.cx - 100 * k; ty = (g.cy + g.ry) - 138 * k - 4; }
      else { k = 1.4; tx = (X0 + 12 * CELL) - 100 * k; ty = (Y0 + 14 * CELL) - 150 * k; }
      inn += '<g transform="translate(' + tx + " " + ty + ") scale(" + k + ')">' + raw + "</g>"; });
    var gg = '<g class="' + (anim ? "pa-body-g" : "") + '">' + inn + "</g>", sc = STAGE_SC[stage], tf = "translate(" + (255 - 255 * sc) + " " + (505 - 505 * sc) + ") scale(" + sc + ")", post = "";
    if(stage >= 2){ [[52, 120, 34], [470, 160, 28], [500, 330, 24], [20, 340, 26]].forEach(function(p, i){ post += '<g class="' + (anim ? "pa-spark" : "") + '" style="animation-delay:' + (i * .45) + 's;transform-box:fill-box;transform-origin:center"><path d="M' + p[0] + " " + (p[1] - p[2]) + " L" + (p[0] + p[2] * .3) + " " + (p[1] - p[2] * .3) + " L" + (p[0] + p[2]) + " " + p[1] + " L" + (p[0] + p[2] * .3) + " " + (p[1] + p[2] * .3) + " L" + p[0] + " " + (p[1] + p[2]) + " L" + (p[0] - p[2] * .3) + " " + (p[1] + p[2] * .3) + " L" + (p[0] - p[2]) + " " + p[1] + " L" + (p[0] - p[2] * .3) + " " + (p[1] - p[2] * .3) + ' Z" fill="#F2D27A"/></g>'; }); }
    if(stage >= 3) post += '<ellipse cx="255" cy="30" rx="76" ry="18" fill="none" stroke="#F2D27A" stroke-width="11"/>';
    return '<svg class="pa-art" viewBox="-40 -80 592 612" xmlns="http://www.w3.org/2000/svg">' + defs + pre + '<g transform="' + tf + '">' + gg + "</g>" + post + "</svg>";
  };
  A.render = function(el, o){ el.innerHTML = A.svg(o); };
})();
