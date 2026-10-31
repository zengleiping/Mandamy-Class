/* 寵物第三套畫風「軟萌」：參考旅行青蛙那種圓滾滾的小生物——頭和身體連成一顆大蛋形、細細的咖啡色線條、柔和的顏色、小圓點眼睛、淡淡的紅臉頰。
   用法跟 PETART 一樣：PETART.svg({ sp, style: "soft", stage, eq, anim })；衣服直接沿用原本那組。 */
(function(){
  "use strict";
  var A = window.PETART; if(!A) return;
  var OL = "#5a4033", OW = 4.6, UID = 0, shade = A.shade;
  A.STYLES = [{ id: "soft", name: "軟萌圓圓" }, { id: "outline", name: "線條填色" }, { id: "flat", name: "扁平色塊" }];
  A.norm = function(s){ return s === "flat" ? "flat" : s === "outline" ? "outline" : "soft"; };
  var orig = A.svg;
  function P(d, f, x){ return '<path d="' + d + '" fill="' + f + '" stroke="' + OL + '" stroke-width="' + OW + '" stroke-linejoin="round" stroke-linecap="round"' + (x ? " " + x : "") + '/>'; }
  function N(d, f, x){ return '<path d="' + d + '" fill="' + f + '"' + (x ? " " + x : "") + '/>'; }
  function E(cx, cy, rx, ry, f, rot, x){ return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '" stroke="' + OL + '" stroke-width="' + OW + '"' + (rot ? ' transform="rotate(' + rot + " " + cx + " " + cy + ')"' : "") + (x ? " " + x : "") + '/>'; }
  function EN(cx, cy, rx, ry, f, rot, x){ return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + (rot ? ' transform="rotate(' + rot + " " + cx + " " + cy + ')"' : "") + (x ? " " + x : "") + '/>'; }
  function C(cx, cy, r, f){ return E(cx, cy, r, r, f); }
  function L(d, c, w){ return '<path d="' + d + '" fill="none" stroke="' + (c || OL) + '" stroke-width="' + (w || 4) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
  var BODY = "M256 112C372 112 436 214 436 330C436 432 372 494 256 494C140 494 76 432 76 330C76 214 140 112 256 112Z";
  var SPEC = {
    "🐻": { c: "#B98A6B", b: "#EBD2B2", ears: function(){ return C(156, 140, 44, "#B98A6B") + EN(156, 144, 24, 24, "#E2B79A") + C(356, 140, 44, "#B98A6B") + EN(356, 144, 24, 24, "#E2B79A"); }, mid: function(){ return E(256, 306, 62, 46, "#F2DFC4") + E(256, 288, 17, 12, "#6b4636"); } },
    "🐶": { c: "#D8A872", b: "#F6E6CA", behind: function(){ return E(104, 236, 38, 82, "#A9774A", 14) + E(408, 236, 38, 82, "#A9774A", -14); }, mid: function(){ return EN(196, 252, 42, 38, "#A9774A") + E(256, 308, 58, 42, "#F8EBD4") + E(256, 290, 19, 13, "#3a2a22"); }, back: function(){ return P("M412 440Q470 420 462 360Q446 400 404 404Z", "#D8A872"); } },
    "🐱": { c: "#E8A55E", b: "#FBEBD0", ears: function(){ return P("M118 196L128 84L212 132Z", "#E8A55E") + N("M138 168L142 110L186 138Z", "#F2B5BE") + P("M394 196L384 84L300 132Z", "#E8A55E") + N("M374 168L370 110L326 138Z", "#F2B5BE"); }, mid: function(){ return L("M236 138L236 176M256 130L256 176M276 138L276 176", "#B9722F", 7) + E(256, 308, 40, 28, "#FBEBD0") + P("M244 288L268 288L256 302Z", "#E68F9C") + L("M90 296L38 284M92 322L40 330M422 296L474 284M420 322L472 330", OL, 3); }, back: function(){ return L("M410 450Q490 430 470 350", "#E8A55E", 34) + L("M410 450Q490 430 470 350", OL, 3); } },
    "🐰": { c: "#F2E9DE", b: "#FFFFFF", ears: function(){ return E(196, 80, 32, 88, "#F2E9DE", -8) + EN(196, 88, 17, 62, "#F4B6C2", -8) + E(316, 80, 32, 88, "#F2E9DE", 8) + EN(316, 88, 17, 62, "#F4B6C2", 8); }, mid: function(){ return P("M246 292L266 292L256 304Z", "#E68F9C"); }, back: function(){ return C(414, 450, 30, "#FFFFFF"); } },
    "🐹": { c: "#EBC48C", b: "#FFF2DA", ears: function(){ return C(150, 156, 30, "#EBC48C") + EN(150, 160, 16, 16, "#F2B5BE") + C(362, 156, 30, "#EBC48C") + EN(362, 160, 16, 16, "#F2B5BE"); }, mid: function(){ return EN(256, 168, 66, 36, "#D9A25E") + E(142, 326, 54, 40, "#F8E1BC") + E(370, 326, 54, 40, "#F8E1BC") + E(256, 296, 15, 11, "#E68F9C"); } },
    "🐥": { c: "#F4D35E", b: "#FBE9A0", ears: function(){ return P("M236 122Q226 76 252 58Q258 86 274 70Q290 100 276 124Z", "#F0B83A"); }, mid: function(){ return P("M230 282Q256 266 282 282Q270 314 256 320Q242 314 230 282Z", "#F0963A"); }, feet: "#F0963A", arms: "#F0B83A" },
    "🦊": { c: "#E27D3A", b: "#FFF4E6", ears: function(){ return P("M120 206L126 86L214 138Z", "#E27D3A") + N("M142 176L146 112L192 142Z", "#5a3a2a") + P("M392 206L386 86L298 138Z", "#E27D3A") + N("M370 176L366 112L320 142Z", "#5a3a2a"); }, mid: function(){ return P("M84 306Q150 262 218 318Q150 356 84 306Z", "#FFF4E6") + P("M428 306Q362 262 294 318Q362 356 428 306Z", "#FFF4E6") + E(256, 296, 16, 11, "#3a2a22"); }, back: function(){ return P("M400 460Q512 470 496 340Q480 410 396 410Z", "#E27D3A") + N("M488 372Q500 344 496 340Q486 366 462 392Z", "#FFF4E6"); } },
    "🐼": { c: "#F6F3EE", b: "#F6F3EE", ears: function(){ return C(150, 140, 42, "#3a3330") + C(362, 140, 42, "#3a3330"); }, mid: function(){ return EN(204, 266, 40, 48, "#3a3330", 24) + EN(308, 266, 40, 48, "#3a3330", -24) + E(256, 306, 20, 14, "#3a3330"); }, arms: "#3a3330", feet: "#3a3330", whiteEyes: true },
    "🐸": { c: "#8DB65A", b: "#E7F1BE", frog: true, mid: function(){ return L("M214 316Q256 340 298 316", OL, 4.5) + EN(240, 290, 5, 4, "#5a7a30") + EN(272, 290, 5, 4, "#5a7a30"); }, ears: function(){ return E(176, 150, 46, 46, "#8DB65A") + E(336, 150, 46, 46, "#8DB65A"); } },
    "🐧": { c: "#4C5E78", b: "#FFFFFF", bigBelly: true, mid: function(){ return P("M232 288Q256 272 280 288Q270 314 256 318Q242 314 232 288Z", "#F0963A"); }, feet: "#F0963A", arms: "#3e4e66" },
    "🐮": { c: "#F7F4EE", b: "#F7F4EE", ears: function(){ return E(98, 206, 38, 20, "#F7F4EE", -22) + EN(100, 208, 22, 11, "#F2B5BE", -22) + E(414, 206, 38, 20, "#F7F4EE", 22) + EN(412, 208, 22, 11, "#F2B5BE", 22) + E(176, 122, 14, 26, "#EAD9AE", -14) + E(336, 122, 14, 26, "#EAD9AE", 14); }, mid: function(){ return EN(160, 190, 40, 30, "#3a3330", -20) + EN(130, 380, 44, 56, "#3a3330", 10) + EN(392, 410, 34, 46, "#3a3330", -8) + E(256, 312, 68, 48, "#F2B5BE") + EN(232, 312, 8, 11, "#C9788A") + EN(280, 312, 8, 11, "#C9788A"); } },
    "🐷": { c: "#F2A9B6", b: "#F8C6CF", ears: function(){ return P("M138 170Q112 70 206 94Q212 140 190 170Z", "#E48D9E") + P("M374 170Q400 70 306 94Q300 140 322 170Z", "#E48D9E"); }, mid: function(){ return E(256, 304, 52, 38, "#E48D9E") + EN(238, 304, 8, 12, "#8a4a58") + EN(274, 304, 8, 12, "#8a4a58"); }, back: function(){ return L("M410 450Q460 440 444 410Q426 396 446 372", "#E48D9E", 12); } },
    "🦁": { c: "#E5B567", b: "#FBEACB", behind: function(){ var m = ""; for(var i = 0; i < 12; i++){ var a = i / 12 * Math.PI * 2; m += C(256 + Math.cos(a) * 168, 256 + Math.sin(a) * 150, 50, "#B8783A"); } return m + E(256, 256, 176, 158, "#B8783A"); }, ears: function(){ return C(142, 148, 28, "#E5B567") + C(370, 148, 28, "#E5B567"); }, mid: function(){ return E(256, 308, 58, 42, "#FBEACB") + P("M240 288L272 288L256 304Z", "#C9788A"); }, back: function(){ return L("M410 450Q480 440 470 380", "#E5B567", 20) + C(470, 372, 22, "#B8783A"); } },
    "🐯": { c: "#E8963C", b: "#FFF1DA", ears: function(){ return C(150, 142, 42, "#E8963C") + EN(150, 146, 22, 22, "#FFF1DA") + C(362, 142, 42, "#E8963C") + EN(362, 146, 22, 22, "#FFF1DA"); }, mid: function(){ return L("M256 126L256 176M214 134L226 172M298 134L286 172M92 290L148 296M96 340L150 330M420 290L364 296M416 340L362 330", "#5a3a24", 9) + E(256, 308, 58, 42, "#FFF1DA") + P("M242 288L270 288L256 302Z", "#E68F9C"); } },
    "🐺": { c: "#8E9AAA", b: "#E4E9EF", ears: function(){ return P("M112 210L118 70L214 134Z", "#8E9AAA") + N("M134 176L138 108L190 140Z", "#C9D1DB") + P("M400 210L394 70L298 134Z", "#8E9AAA") + N("M378 176L374 108L322 140Z", "#C9D1DB"); }, mid: function(){ return P("M84 310Q144 268 214 322Q144 360 84 310Z", "#E4E9EF") + P("M428 310Q368 268 298 322Q368 360 428 310Z", "#E4E9EF") + E(256, 298, 18, 13, "#2b2b30"); }, back: function(){ return P("M400 470Q512 480 498 340Q482 420 396 414Z", "#8E9AAA"); } },
    "🦅": { c: "#8B6A4E", b: "#E8D8BE", head: "#FFFFFF", mid: function(){ return P("M232 284Q256 268 282 284Q276 316 256 330Q240 312 232 284Z", "#F2C541"); }, feet: "#F2C541", arms: "#6B4E36" },
    "🦖": { c: "#7EB26D", b: "#DDEEB8", behind: function(){ return P("M210 128L222 84L240 124Z", "#5E9450") + P("M246 118L258 72L274 118Z", "#5E9450") + P("M282 126L296 84L310 130Z", "#5E9450"); }, mid: function(){ return EN(232, 292, 6, 5, "#4d7a3e") + EN(280, 292, 6, 5, "#4d7a3e") + L("M206 330Q256 350 306 330", OL, 4); }, back: function(){ return P("M400 460Q500 470 488 380Q440 420 396 410Z", "#7EB26D"); } },
    "🦄": { c: "#F6EEF8", b: "#FFFFFF", behind: function(){ return C(106, 220, 40, "#F7B3D6") + C(94, 280, 36, "#B4DDFB") + C(108, 336, 32, "#CDB5FA"); }, ears: function(){ return P("M148 168L156 94L206 134Z", "#F6EEF8") + P("M364 168L356 94L306 134Z", "#F6EEF8"); }, mid: function(){ return P("M238 132L256 32L274 132Z", "#F4D26A") + L("M244 100L270 90M242 70L266 62", "#C9A23A", 5) + EN(242, 296, 6, 4, "#C9788A") + EN(270, 296, 6, 4, "#C9788A"); }, back: function(){ return P("M404 460Q500 470 488 380Q440 420 400 410Z", "#CDB5FA") + P("M404 440Q480 440 472 384Q440 410 404 406Z", "#B4DDFB"); } },
    "🐲": { c: "#D8707F", b: "#F8D9A8", behind: function(){ return P("M84 330Q10 240 56 190Q70 270 126 296Z", "#9B6FD6") + P("M428 330Q502 240 456 190Q442 270 386 296Z", "#9B6FD6"); }, ears: function(){ return P("M156 150Q120 92 146 52Q184 86 196 140Z", "#F3E5C0") + P("M356 150Q392 92 366 52Q328 86 316 140Z", "#F3E5C0"); }, mid: function(){ return EN(240, 296, 6, 5, "#8a3a4a") + EN(272, 296, 6, 5, "#8a3a4a") + P("M226 130L256 96L286 130Z", "#9B6FD6"); }, back: function(){ return P("M404 462Q508 476 494 372Q480 432 398 418Z", "#D8707F"); } },
    "🐉": { c: "#E3BE5A", b: "#FFF0C4", behind: function(){ return L("M150 150Q90 90 110 40M150 150Q120 110 70 120M362 150Q422 90 402 40M362 150Q392 110 442 120", "#F3E5C0", 16); }, mid: function(){ return P("M150 160Q256 100 362 160Q256 148 150 160Z", "#3FB5A5") + L("M214 320Q150 380 100 360M298 320Q362 380 412 360", "#3FB5A5", 6) + EN(240, 296, 6, 5, "#8a5a1a") + EN(272, 296, 6, 5, "#8a5a1a"); }, back: function(){ return P("M404 462Q512 480 500 360Q484 432 398 418Z", "#3FB5A5"); } }
  };
  A.softSpecies = function(){ return Object.keys(SPEC); };
  function lin(id, base){ return '<linearGradient id="' + id + '" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="' + shade(base, 22) + '"/><stop offset=".5" stop-color="' + base + '"/><stop offset="1" stop-color="' + shade(base, -26) + '"/></linearGradient>'; }
  var G = { head: { cx: 256, cy: 250, rx: 150, ry: 134 }, eyes: { x1: 208, x2: 304, y: 262 } };
  var STAGE_SC = [0.74, 0.87, 1, 1.06];
  A.svg = function(o){
    if(A.norm(o.style) !== "soft") return orig(o);
    var sp = SPEC[o.sp] || SPEC["🐻"], stage = Math.max(0, Math.min(3, o.stage || 0)), eq = o.eq || {}, anim = o.anim !== false, id = "ps" + (++UID);
    var body = sp.c, belly = sp.b, hand = sp.arms || shade(body, -16), foot = sp.feet || shade(body, -14);
    var defs = '<defs>' + lin(id + "b", body) + '<radialGradient id="paAuraG"><stop offset="0" stop-color="#FFE98A" stop-opacity=".85"/><stop offset=".7" stop-color="#FFD23F" stop-opacity=".25"/><stop offset="1" stop-color="#FFD23F" stop-opacity="0"/></radialGradient><clipPath id="' + id + 'c"><path d="' + BODY + '"/></clipPath></defs>';
    var pre = '<ellipse cx="256" cy="506" rx="160" ry="14" fill="#4a3326" opacity=".16"/>'; if(stage >= 3) pre = '<g class="' + (anim ? "pa-aura" : "") + '"><circle cx="255" cy="290" r="290" fill="url(#paAuraG)"/></g>' + pre;
    var inn = "";
    if(sp.back) inn += '<g class="' + (anim ? "pa-tailg" : "") + '">' + sp.back() + "</g>";
    if(sp.behind) inn += sp.behind();
    if(sp.ears) inn += sp.ears();
    inn += E(84, 384, 30, 52, hand, 16) + E(428, 384, 30, 52, hand, -16);
    inn += '<path d="' + BODY + '" fill="url(#' + id + 'b)" stroke="' + OL + '" stroke-width="' + OW + '" stroke-linejoin="round"/>';
    inn += '<g clip-path="url(#' + id + 'c)">' + (sp.head ? EN(256, 232, 138, 112, sp.head) : "") + (sp.bigBelly ? EN(256, 380, 128, 116, belly) : EN(256, 410, 108, 84, belly, 0, 'opacity=".92"')) + '</g>';
    if(sp.head) inn += L("M122 270Q256 330 390 270", shade(sp.head, -40), 3);
    inn += E(166, 488, 46, 24, foot) + E(346, 488, 46, 24, foot);
    inn += EN(166, 478, 22, 8, shade(foot, 26), 0, 'opacity=".5"') + EN(346, 478, 22, 8, shade(foot, 26), 0, 'opacity=".5"');
    if(sp.mid) inn += sp.mid();
    if(!sp.frog){ inn += EN(166, 316, 22, 12, "#F29A9A", 0, 'opacity=".5"') + EN(346, 316, 22, 12, "#F29A9A", 0, 'opacity=".5"'); }
    var ey = '<g class="pa-eyes">';
    if(sp.frog) ey += C(176, 152, 46, "#fff").replace(/<ellipse/, "<ellipse") + C(336, 152, 46, "#fff") + EN(180, 156, 21, 22, "#3a2a22") + EN(332, 156, 21, 22, "#3a2a22") + EN(188, 146, 7, 7, "#fff") + EN(340, 146, 7, 7, "#fff");
    else ey += EN(G.eyes.x1, G.eyes.y, 12, 14, "#3a2a22") + EN(G.eyes.x2, G.eyes.y, 12, 14, "#3a2a22") + EN(G.eyes.x1 + 4, G.eyes.y - 5, 4.4, 4.4, "#fff") + EN(G.eyes.x2 + 4, G.eyes.y - 5, 4.4, 4.4, "#fff");
    inn += ey + "</g>";
    var SLOT = A.ACC_SLOT || {}, hex = { head: 1, face: 1, neck: 1, side: 1 };
    ["side", "neck", "face", "head"].forEach(function(sl){ var aid = eq[sl]; if(!aid || !SLOT[aid]) return; var raw = A.accSvg(aid, "outline").replace(/#1b1212/g, OL), k, tx, ty, g = G.head;
      if(sl === "head"){ k = (g.rx * 2) / 116 * 0.92; tx = g.cx - 100 * k; ty = (g.cy - g.ry) - 26 * k; }
      else if(sl === "face"){ k = 2.0; tx = 256 - 100 * k; ty = G.eyes.y - 84 * k; }
      else if(sl === "neck"){ k = (g.rx * 2) / 116 * 0.9; tx = 256 - 100 * k; ty = (g.cy + g.ry) - 138 * k; }
      else { k = 2.3; tx = 256 - 100 * k; ty = 392 - 150 * k; }
      inn += '<g transform="translate(' + tx + " " + ty + ") scale(" + k + ')">' + raw + "</g>"; });
    var gg = '<g class="' + (anim ? "pa-body-g" : "") + '">' + inn + "</g>", sc = STAGE_SC[stage], tf = "translate(" + (255 - 255 * sc) + " " + (505 - 505 * sc) + ") scale(" + sc + ")", post = "";
    if(stage >= 2){ [[52, 120, 34], [470, 160, 28], [500, 330, 24], [20, 340, 26]].forEach(function(p, i){ post += '<g class="' + (anim ? "pa-spark" : "") + '" style="animation-delay:' + (i * .45) + 's;transform-box:fill-box;transform-origin:center"><path d="M' + p[0] + " " + (p[1] - p[2]) + " L" + (p[0] + p[2] * .3) + " " + (p[1] - p[2] * .3) + " L" + (p[0] + p[2]) + " " + p[1] + " L" + (p[0] + p[2] * .3) + " " + (p[1] + p[2] * .3) + " L" + p[0] + " " + (p[1] + p[2]) + " L" + (p[0] - p[2] * .3) + " " + (p[1] + p[2] * .3) + " L" + (p[0] - p[2]) + " " + p[1] + " L" + (p[0] - p[2] * .3) + " " + (p[1] - p[2] * .3) + ' Z" fill="#F2D27A"/></g>'; }); }
    if(stage >= 3) post += '<ellipse cx="255" cy="30" rx="76" ry="18" fill="none" stroke="#F2D27A" stroke-width="11"/>';
    return '<svg class="pa-art" viewBox="-40 -80 592 612" xmlns="http://www.w3.org/2000/svg">' + defs + pre + '<g transform="' + tf + '">' + gg + "</g>" + post + "</svg>";
  };
  var origAcc = A.accSvg;
  A.accSvg = function(id, style){ if(A.norm(style) === "soft") return origAcc(id, "outline").replace(/#1b1212/g, OL).replace(/stroke-width="3\.6"/g, 'stroke-width="3"'); return origAcc(id, style); };
  A.render = function(el, o){ el.innerHTML = A.svg(o); };
})();
