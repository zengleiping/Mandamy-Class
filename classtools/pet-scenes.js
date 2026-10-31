/* 寵物遊戲的場景與家具（SVG，參考「旅行青蛙」那種溫暖手繪感：細細的咖啡色線條、偏灰的柔和色、淡淡的紙張顆粒）。座標是 400×700。
   window.PETSCENE.scene(id, side) 回傳背景 SVG 內容；window.PETSCENE.furn(inv) 回傳買過的家具（畫在寵物後面）。 */
(function(){
  "use strict";
  var INK = "#4a3326", sw = 1.8;
  function ln(d, f, w){ return '<path d="' + d + '" fill="' + f + '" stroke="' + INK + '" stroke-width="' + (w || sw) + '" stroke-linejoin="round" stroke-linecap="round" stroke-opacity=".92"/>'; }
  function sh(d, f, dark){ return ln(d, f); }
  function rect(x, y, w, h, f, r, sw2){ return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r || 0) + '" fill="' + f + '" stroke="' + INK + '" stroke-width="' + (sw2 == null ? sw : sw2) + '" stroke-linejoin="round" stroke-opacity=".92"/>'; }
  function circ(x, y, r, f, sw2){ return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '" stroke="' + INK + '" stroke-width="' + (sw2 == null ? sw : sw2) + '" stroke-opacity=".92"/>'; }
  function ell(x, y, rx, ry, f, sw2){ return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '" stroke="' + INK + '" stroke-width="' + (sw2 == null ? sw : sw2) + '" stroke-opacity=".92"/>'; }
  function line(d, c, w){ return '<path d="' + d + '" fill="none" stroke="' + (c || INK) + '" stroke-width="' + (w || sw) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
  function cloud(x, y, s, cls){ return '<g class="pg-cloud ' + (cls || "") + '" transform="translate(' + x + " " + y + ") scale(" + s + ')">' + ln("M-40 12Q-54 12 -54 -2Q-54 -15 -38 -15Q-36 -32 -18 -32Q-6 -44 10 -34Q22 -46 36 -32Q54 -33 54 -13Q64 -10 60 3Q57 12 46 12Z", "#fff") + "</g>"; }
  function tree(x, y, s, c1){ return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')">' + ln("M-9 0L-6 -62L6 -62L9 0Z", "#B98482") + ln("M-52 -58Q-64 -92 -34 -104Q-30 -134 0 -132Q30 -134 36 -104Q66 -92 52 -58Q22 -42 -52 -58Z", c1 || "#6CC36B") + line("M-26 -86Q-14 -96 -2 -92", "#9BE08F", 4) + "</g>"; }
  function flower(x, y, c){ return '<g transform="translate(' + x + " " + y + ')">' + line("M0 0L0 20", "#3FA25F", 2.4) + circ(0, -2, 8, c, 1.6) + circ(0, -2, 3, "#FFD23F", 0) + "</g>"; }
  function bush(x, y, s){ return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')">' + ln("M-34 0Q-44 -22 -22 -28Q-14 -46 8 -38Q30 -44 34 -20Q46 -6 30 0Z", "#4FB36E") + "</g>"; }
  function tufts(list, c){ return list.map(function(p){ return line("M" + p[0] + " " + p[1] + "q-3 -8 -6 -10M" + p[0] + " " + p[1] + "q0 -9 1 -12M" + p[0] + " " + p[1] + "q3 -8 7 -9", c || "#6F9238", 1.5); }).join(""); }
  function plank(x, y, w, h){ var o = rect(x, y, w, h, "url(#psWood)"); for(var i = 1; i < Math.round(w / 34); i++) o += line("M" + (x + i * 34) + " " + y + "L" + (x + i * 34) + " " + (y + h), INK, 1.1); return o; }
  var SC = {
    home: function(){
      var o = rect(-60, 0, 520, 440, "url(#psWall)", 0, 0);
      [[40, 60, 50, 22], [200, 30, 60, 18], [330, 230, 54, 20], [120, 300, 48, 18], [260, 150, 40, 16], [380, 360, 44, 20]].forEach(function(b){ o += '<ellipse cx="' + b[0] + '" cy="' + b[1] + '" rx="' + b[2] + '" ry="' + b[3] + '" fill="#B3C2CB" opacity=".32"/>'; });
      // 大樹幹（兩側也看得到）
      o += '<g transform="translate(0 40)">';
      o += ln("M-70 0L72 0Q88 140 74 300Q66 400 84 440L-70 440Z", "url(#psWood)") + line("M10 0Q22 120 14 260M44 10Q54 110 48 300M-20 30Q-10 140 -16 330", "#6E4B2E", 1.3) + ell(14, 190, 22, 28, "#C9A06E", 1.6) + ell(14, 190, 14, 18, "none", 1.1) + ell(14, 190, 6, 8, "none", 1.1);
      [[86, 330, 26, 9], [64, 372, 28, 9], [92, 404, 24, 8]].forEach(function(m){ o += ell(m[0], m[1], m[2], m[3], "#B8B0C4"); o += line("M" + (m[0] - m[2] + 6) + " " + (m[1] + 2) + "Q" + m[0] + " " + (m[1] + m[3] - 1) + " " + (m[0] + m[2] - 6) + " " + (m[1] + 2), "#8C849C", 1.1); });
      o += '</g>';
      o += '<!--C--><g transform="translate(0 40)">';
      // 窗戶
      o += rect(98, 62, 66, 78, "#D9E6C4", 12, 2.4) + line("M131 62L131 140M98 101L164 101", "#F4E9CC", 3.2) + rect(98, 62, 66, 78, "none", 12, 2.4) + '<path d="M104 70Q116 68 124 74L104 98Z" fill="#fff" opacity=".35"/>';
      // 佈告欄與紙條
      o += rect(232, 54, 74, 58, "#C8A672", 4) + '<g><rect x="238" y="60" width="26" height="22" fill="#F4E9CC" stroke="' + INK + '" stroke-width="1.2" transform="rotate(-6 251 71)"/><rect x="268" y="62" width="30" height="18" fill="#EBA9B3" stroke="' + INK + '" stroke-width="1.2" transform="rotate(5 283 71)"/><rect x="244" y="86" width="34" height="20" fill="#B9D0EA" stroke="' + INK + '" stroke-width="1.2" transform="rotate(3 261 96)"/><circle cx="251" cy="62" r="2.6" fill="#D9604C"/><circle cx="283" cy="64" r="2.6" fill="#E9C25A"/><circle cx="262" cy="88" r="2.6" fill="#7C9FCB"/></g>';
      // 地圖卷軸
      o += ln("M326 28Q352 22 384 30L388 110Q366 120 330 112Q338 70 326 28Z", "#E8D6A4") + line("M338 50L372 52M338 66L368 68M340 82L374 80", "#B79A5E", 1.5) + ln("M322 26Q328 22 334 28L332 40Q324 36 322 26Z", "#CDB07A", 1.4);
      // 樓板（閣樓）
      o += plank(92, 168, 320, 22) + rect(92, 190, 320, 12, "#7B5233", 1) + line("M92 196L412 196", "#5C3D25", 1);
      for(var k = 0; k < 9; k++) o += circ(104 + k * 36, 179, 1.5, "#4a3326", 0);
      // 支柱
      o += rect(186, 202, 12, 220, "url(#psWood)", 2) + rect(372, 202, 12, 220, "url(#psWood)", 2) + line("M186 212L198 218M186 226L198 232", "#E8D6A4", 2.2);
      // 閣樓上的床
      o += ln("M236 168L236 134Q238 118 262 116Q316 112 340 130L344 168Z", "#7C9FCB") + ln("M236 150Q274 134 344 148L344 168L236 168Z", "#6A8DBA") + ell(258, 124, 18, 9, "#B9D0EA", 1.6) + line("M246 160Q290 150 332 160", "#5A7BA6", 1.2);
      o += rect(110, 160, 72, 8, "#E6909E", 2) + line("M116 160L116 168M128 160L128 168M140 160L140 168M152 160L152 168M164 160L164 168M176 160L176 168", "#F6D3D8", 1.4);
      // 梯子
      o += line("M140 190L118 420", INK, 3.4) + line("M168 190L150 420", INK, 3.4) + line("M140 190L118 420", "#B98A5B", 1.8) + line("M168 190L150 420", "#B98A5B", 1.8);
      for(var r = 0; r < 7; r++){ var yy = 214 + r * 30, xa = 140 - (yy - 190) / 230 * 22, xb = 168 - (yy - 190) / 230 * 18; o += line("M" + xa + " " + yy + "L" + xb + " " + yy, "#8E5F3A", 3); }
      // 吊燈籠
      o += line("M276 202L276 232", INK, 1.4) + ln("M266 232L286 232L282 252L270 252Z", "#E9C25A") + '<circle cx="276" cy="244" r="3" fill="#FFF1B8"/><circle cx="276" cy="244" r="22" fill="#FFE9A0" opacity=".25"/>';
      // 架子與罐子
      o += rect(306, 296, 80, 8, "url(#psWood)", 2) + rect(312, 304, 6, 18, "#7B5233", 1) + rect(374, 304, 6, 18, "#7B5233", 1);
      o += ln("M316 296L316 272Q316 266 322 266L334 266Q340 266 340 272L340 296Z", "#D9A56A") + rect(318, 258, 20, 8, "#B98A5B", 2) + ln("M346 296L346 278Q346 270 356 270Q366 270 366 278L366 296Z", "#EBDDB8") + rect(350, 262, 12, 8, "#B98A5B", 2) + circ(376, 286, 10, "#9AB85A") + line("M376 276L376 270", INK, 1.4);
      o += rect(306, 342, 80, 8, "url(#psWood)", 2) + ell(326, 336, 14, 8, "#C98A6B") + ell(352, 334, 11, 9, "#9AB85A") + ell(372, 337, 9, 6, "#D9A56A") + line("M318 342L318 366M330 342L330 358M342 342L342 370", "#6F9238", 2.2);
      o += '</g><!--/C-->';
      // 地板
      o += ln("M-60 424Q80 408 220 422Q330 410 460 424L460 700L-60 700Z", "url(#psFloor)", 1.8);
      [[250, 432, 7, 4], [264, 435, 5, 3], [278, 431, 6, 4], [296, 434, 5, 3]].forEach(function(p){ o += ell(p[0], p[1], p[2], p[3], "#A9A29A", 1.2); });
      o += '<ellipse cx="200" cy="506" rx="182" ry="66" fill="#8FAE50" stroke="' + INK + '" stroke-width="1.8" stroke-opacity=".9"/><ellipse cx="194" cy="498" rx="150" ry="50" fill="#A8C766" opacity=".85"/><ellipse cx="170" cy="488" rx="80" ry="22" fill="#BBD57A" opacity=".55"/>';
      o += tufts([[70, 520], [120, 545], [300, 530], [330, 505], [240, 556], [150, 510], [60, 490]]);
      o += '<!--C-->';
      // 樹墩桌＋蠟燭
      o += '<g transform="translate(332 470)">' + ln("M-34 4L-34 30Q0 42 34 30L34 4Z", "#9A6B44") + ell(0, 4, 36, 14, "#C9A06E", 1.8) + ell(0, 4, 24, 8, "none", 1.1) + ell(0, 4, 12, 4, "none", 1.1) + rect(-4, -14, 8, 14, "#F4E9CC", 1.5) + ln("M0 -26Q6 -20 0 -14Q-6 -20 0 -26Z", "#F0A93C", 1.2) + '<circle cx="0" cy="-18" r="14" fill="#FFE9A0" opacity=".25"/></g>';
      // 黃色圓地墊
      o += ell(66, 600, 54, 16, "#E9C25A", 1.6) + ell(66, 600, 40, 11, "none", 1.1) + ell(66, 600, 26, 7, "none", 1.1) + ell(66, 600, 12, 3, "none", 1.1);
      // 火把
      o += '<g transform="translate(372 560)">' + line("M0 0L0 70", INK, 5) + line("M0 0L0 70", "#B98A5B", 2.6) + ln("M-8 0L8 0L4 -12L-4 -12Z", "#7B5233", 1.4) + ln("M0 -34Q12 -24 6 -12L-6 -12Q-12 -24 0 -34Z", "#F0A93C", 1.3) + '<circle cx="0" cy="-20" r="20" fill="#FFE9A0" opacity=".22"/></g>';
      o += '<!--/C-->';
      return o;
    },
    grass: function(){
      var o = rect(-60, 0, 520, 480, "url(#psSky)", 0, 0) + cloud(90, 110, 1, "c1") + cloud(300, 190, .8, "c2") + cloud(210, 60, .6, "c1");
      o += ln("M-60 330Q40 270 140 316Q230 262 330 310Q400 280 460 320L460 700L-60 700Z", "#B9CF8E") + tree(36, 372, .8, "#8FB56E") + tree(352, 366, .72, "#9CBF78");
      o += ln("M-60 392Q80 346 200 384Q320 350 460 388L460 700L-60 700Z", "#9DBE63");
      o += '<!--C-->' + '<g transform="translate(76 438)">' + ln("M-12 0L-8 -96L8 -96L12 0Z", "#A9794F") + line("M-4 -10L-3 -80M5 -20L4 -86", "#6E4B2E", 1.2) + ln("M-76 -90Q-98 -150 -48 -166Q-40 -214 14 -206Q70 -214 80 -160Q112 -128 74 -92Q20 -62 -76 -90Z", "#8DB560") + ln("M-44 -122Q-18 -146 6 -128", "#A9CC7C", 1.5).replace('fill="#A9CC7C"','fill="none"') + circ(-30, -110, 6, "#D9604C", 1.4) + circ(36, -134, 6, "#D9604C", 1.4) + circ(20, -96, 6, "#D9604C", 1.4) + "</g>";
      for(var i = 0; i < 5; i++) o += ln("M" + (284 + i * 24) + " 468L" + (284 + i * 24) + " 428L" + (291 + i * 24) + " 420L" + (298 + i * 24) + " 428L" + (298 + i * 24) + " 468Z", "#F1E6C8", 1.6);
      o += line("M280 442L400 442M280 456L400 456", INK, 1.6) + '<!--/C-->';
      o += ln("M-60 440Q100 420 230 436Q340 424 460 440L460 700L-60 700Z", "#8FAE50") + '<path d="M-60 520Q150 500 460 530L460 700L-60 700Z" fill="#7C9A44" opacity=".4"/>';
      o += tufts([[40, 470], [150, 500], [300, 486], [372, 520], [90, 560], [250, 580], [340, 640], [60, 650]]);
      [[56, 540, "#E6909E"], [112, 600, "#E9C25A"], [322, 560, "#B8A0DE"], [372, 628, "#E6909E"], [228, 660, "#F4E9CC"], [168, 520, "#E9C25A"]].forEach(function(p){ o += flower(p[0], p[1], p[2]); });
      o += '<!--C-->' + ell(200, 556, 120, 24, "#E6909E", 1.6) + ell(200, 556, 96, 17, "#F6D9DC", 1.1) + '<path d="M120 556L280 556M140 546L260 546M140 566L260 566" stroke="#E6909E" stroke-width="1.4" opacity=".7"/>' + '<!--/C-->';
      return o;
    },
    room: function(){
      var o = rect(-60, 0, 520, 450, "#EFD9B8", 0, 0), d;
      for(d = 0; d < 11; d++) o += '<rect x="' + (-40 + d * 46) + '" y="0" width="23" height="450" fill="#E7CDA6" opacity=".7"/>';
      for(var r = 0; r < 5; r++) for(var c = 0; c < 10; c++) o += '<circle cx="' + (-30 + c * 46 + (r % 2) * 23) + '" cy="' + (30 + r * 80) + '" r="4" fill="#D9A58A" opacity=".5"/>';
      o += rect(-60, 400, 520, 30, "#F8EEDC", 0) + line("M-60 400L460 400");
      o += '<!--C--><g transform="translate(0 30)">' + rect(236, 54, 118, 150, "#CFE3EA", 8, 2.2) + line("M295 54L295 204M236 129L354 129", "#F8EEDC", 4) + rect(230, 46, 130, 14, "#A9794F", 4) + ln("M226 56L226 226Q242 206 258 226L258 56Z", "#D9806A") + ln("M362 56L362 226Q346 206 330 226L330 56Z", "#D9806A") + '<path d="M246 70Q262 66 270 76L246 110Z" fill="#fff" opacity=".4"/>';
      o += rect(40, 70, 82, 98, "#F8EEDC", 4) + rect(50, 80, 62, 78, "#CFE0B0", 2) + ln("M50 158L72 120L90 144L102 130L112 158Z", "#8DB560", 1.6) + circ(98, 100, 8, "#E9C25A", 1.4);
      o += rect(34, 232, 96, 8, "url(#psWood)", 2) + rect(40, 196, 14, 36, "#D9806A", 2) + rect(58, 204, 12, 28, "#7C9FCB", 2) + rect(74, 192, 16, 40, "#9AB85A", 2) + rect(94, 208, 20, 24, "#E9C25A", 2);
      o += '</g><!--/C-->';
      o += ln("M-60 424L460 424L460 700L-60 700Z", "url(#psFloor)");
      for(d = 0; d < 7; d++) o += line("M-60 " + (456 + d * 38) + "L460 " + (456 + d * 38), "#A98C5C", 1.2);
      o += '<!--C-->' + ell(200, 560, 150, 36, "#7C9FCB", 1.8) + ell(200, 560, 114, 26, "#E9D9B0", 1.2) + ell(200, 560, 74, 15, "#7C9FCB", 1.2) + '<g transform="translate(350 470)">' + ln("M-18 60L-14 0L14 0L18 60Z", "#D9806A") + ln("M0 0Q-34 -20 -26 -56Q-2 -40 0 0Z", "#8DB560") + ln("M0 0Q30 -26 24 -70Q-2 -44 0 0Z", "#9AB85A") + "</g>" + '<!--/C-->';
      return o;
    },
    beach: function(){
      var o = rect(-60, 0, 520, 340, "url(#psSkyB)", 0, 0) + '<!--C-->' + circ(300, 96, 34, "#F4D98A", 1.6) + '<!--/C-->' + cloud(110, 110, 1, "c1") + cloud(330, 190, .7, "c2");
      o += rect(-60, 320, 520, 110, "#8BC1D2", 0, 0) + rect(-60, 320, 520, 26, "#A5D1DE", 0, 0) + line("M-60 320L460 320", INK, 1.4);
      for(var i = 0; i < 6; i++) o += line("M" + (-20 + i * 90) + " " + (372 + (i % 2) * 16) + "q22 -12 44 0", "#F4F7F0", 2.6);
      o += '<!--C-->' + '<g transform="translate(120 338)">' + ln("M-26 0L26 0L18 12L-18 12Z", "#A9794F") + line("M0 0L0 -52", INK, 1.8) + ln("M0 -50L28 -8L0 -8Z", "#F4E9CC") + ln("M-2 -44L-22 -8L-2 -8Z", "#E6909E") + "</g>" + '<!--/C-->';
      o += ln("M-60 420Q90 392 240 416Q350 398 460 414L460 700L-60 700Z", "#E9D8A8") + '<path d="M-60 428Q90 402 240 424Q350 408 460 424L460 440Q350 424 240 440Q90 418 -60 446Z" fill="#CBB886" opacity=".5"/><path d="M-60 520Q150 500 460 532L460 700L-60 700Z" fill="#D8C48E" opacity=".5"/>';
      o += '<!--C-->' + '<g transform="translate(346 470)">' + ln("M-6 0Q-12 -70 6 -150L14 -150Q0 -70 8 0Z", "#A9794F") + ln("M10 -150Q-30 -176 -62 -140Q-26 -154 10 -136Z", "#6F9A5A") + ln("M10 -150Q52 -178 84 -140Q46 -156 10 -136Z", "#6F9A5A") + ln("M10 -150Q-6 -192 -34 -196Q-2 -176 10 -150Z", "#8DB560") + ln("M10 -150Q34 -194 64 -194Q30 -176 10 -150Z", "#8DB560") + circ(12, -146, 7, "#8A5E3B", 1.4) + "</g>";
      o += '<g transform="translate(66 520)">' + line("M0 0L0 -104", INK, 3.4) + line("M0 0L0 -104", "#C9A06E", 1.6) + ln("M-76 -92Q0 -156 76 -92Z", "#D9806A") + ln("M-76 -92Q-38 -108 0 -92Q38 -108 76 -92Q38 -80 0 -92Q-38 -80 -76 -92Z", "#F4E9CC", 1.6) + ln("M-30 -126Q0 -150 30 -126Q0 -100 -30 -126Z", "#F4E9CC", 1.2).replace('fill="#F4E9CC"','fill="#F4E9CC" opacity=".0"') + "</g>";
      o += ell(220, 600, 56, 14, "#F4E9CC", 1.4) + line("M180 600Q220 592 260 600", "#D9806A", 3) + ln("M300 640Q316 624 330 640Q316 652 300 640Z", "#E6909E", 1.4) + ln("M130 650L136 632L142 650L158 650L146 660L150 676L136 666L122 676L126 660L114 650Z", "#E9A06A", 1.3) + '<!--/C-->';
      return o;
    },
    garden: function(){
      var o = rect(-60, 0, 520, 450, "url(#psSkyG)", 0, 0) + cloud(90, 100, 1, "c1") + cloud(320, 170, .75, "c2");
      o += ln("M-60 360Q70 316 190 350Q300 318 460 356L460 700L-60 700Z", "#B7D08C") + bush(40, 410, 1.3) + bush(362, 408, 1.2) + bush(136, 420, .9);
      for(var i = 0; i < 9; i++) o += ln("M" + (-20 + i * 52) + " 440L" + (-20 + i * 52) + " 392L" + (-12 + i * 52) + " 382L" + (-4 + i * 52) + " 392L" + (-4 + i * 52) + " 440Z", "#F1E6C8", 1.5);
      o += line("M-60 404L460 404M-60 424L460 424", INK, 1.5);
      o += '<!--C-->' + '<g transform="translate(200 440)">' + ln("M-92 0L-92 -150Q-92 -232 0 -232Q92 -232 92 -150L92 0L76 0L76 -150Q76 -216 0 -216Q-76 -216 -76 -150L-76 0Z", "#F4E9CC");
      [[-84, -60, "#E6909E"], [-86, -110, "#F4E9CC"], [-80, -160, "#E6909E"], [-56, -204, "#E9C25A"], [0, -222, "#E6909E"], [58, -204, "#F4E9CC"], [82, -160, "#E9C25A"], [86, -110, "#E6909E"], [84, -60, "#F4E9CC"]].forEach(function(p){ o += circ(p[0], p[1], 11, p[2], 1.5) + ell(p[0] + 12, p[1] + 8, 9, 5, "#8DB560", 1.2); });
      o += "</g>" + '<!--/C-->';
      o += ln("M-60 440Q100 424 220 438Q330 426 460 440L460 700L-60 700Z", "#9ABF68") + '<path d="M-60 520Q150 504 460 534L460 700L-60 700Z" fill="#86AB54" opacity=".45"/>';
      o += tufts([[50, 480], [150, 520], [320, 500], [380, 560], [100, 600], [260, 610], [60, 660]]);
      [[34, 512, "#E6909E"], [78, 548, "#E9C25A"], [136, 506, "#B8A0DE"], [262, 516, "#E6909E"], [318, 552, "#F4E9CC"], [372, 508, "#E9C25A"], [60, 628, "#B8A0DE"], [140, 660, "#E6909E"], [288, 652, "#F4E9CC"], [350, 640, "#E6909E"]].forEach(function(p){ o += flower(p[0], p[1], p[2]); });
      o += '<!--C-->' + '<g transform="translate(336 560)">' + ln("M-20 0L-16 -34L20 -34L24 0Z", "#7C9FCB") + ln("M20 -26Q44 -30 46 -50L38 -52Q36 -38 20 -34Z", "#7C9FCB") + line("M-16 -30Q-40 -50 -34 -74", "#5E86B5", 3) + ell(0, -34, 20, 5, "#A9C6E4", 1.2) + "</g>" + ln("M110 360Q98 346 108 334Q120 338 120 352Z", "#E9C25A", 1.3) + ln("M120 352Q132 342 142 352Q138 366 122 360Z", "#E6909E", 1.3) + '<!--/C-->';
      return o;
    },
    space: function(){
      var o = rect(-60, 0, 520, 470, "url(#psSkyS)", 0, 0), i;
      for(i = 0; i < 46; i++) o += '<circle class="pg-star" style="animation-delay:' + ((i * .37) % 3) + 's" cx="' + (-40 + (i * 83) % 480) + '" cy="' + ((i * 127) % 420) + '" r="' + (1 + (i % 3) * .7) + '" fill="#F4EBD0"/>';
      o += '<!--C-->' + '<g transform="translate(296 140)">' + circ(0, 0, 52, "#E9B97A", 1.8) + '<path d="M-40 -22Q0 -4 44 -34L50 -20Q4 8 -46 -6Z" fill="#CB925A" opacity=".7"/>' + ln("M-92 12Q0 56 92 -18Q0 24 -92 12Z", "#F2DDB0", 1.6) + "</g>" + circ(76, 210, 24, "#E2DFE8", 1.6) + circ(68, 202, 5, "#C4C0D0", 0) + circ(84, 220, 4, "#C4C0D0", 0) + '<!--/C-->';
      o += ln("M-60 440Q100 410 240 436Q350 418 460 434L460 700L-60 700Z", "#A9A3C4") + '<path d="M-60 520Q150 500 460 532L460 700L-60 700Z" fill="#8D86AE" opacity=".55"/>';
      [[70, 540, 38, 11], [300, 590, 30, 9], [190, 650, 44, 12], [372, 520, 22, 7], [40, 640, 26, 8]].forEach(function(c){ o += ell(c[0], c[1], c[2], c[3], "#8D86AE", 1.4) + ell(c[0], c[1] - 1, c[2] - 5, c[3] - 3, "#9C95BC", 0); });
      o += '<!--C-->' + '<g transform="translate(340 470)">' + ln("M0 -118Q30 -84 30 -34L30 0L-30 0L-30 -34Q-30 -84 0 -118Z", "#F4E9CC") + circ(0, -62, 11, "#8BC1D2", 1.6) + ln("M-30 -22L-52 6L-30 0Z", "#D9806A") + ln("M30 -22L52 6L30 0Z", "#D9806A") + ln("M0 -118Q12 -108 16 -96L-16 -96Q-12 -108 0 -118Z", "#D9806A") + ln("M-14 0L14 0L8 22L-8 22Z", "#E9C25A", 1.4) + "</g>";
      o += '<g transform="translate(60 470)">' + line("M0 0L0 -70", INK, 2.4) + ln("M0 -70L40 -60L0 -48Z", "#D9806A", 1.5) + "</g>" + '<!--/C-->';
      return o;
    },
    castle: function(){
      var o = rect(-60, 0, 520, 450, "url(#psSkyC)", 0, 0) + cloud(80, 110, 1, "c1") + cloud(330, 180, .8, "c2");
      o += ln("M-60 350Q70 306 190 344Q300 312 460 350L460 700L-60 700Z", "#C4D8A0");
      o += '<!--C-->' + '<g transform="translate(200 440)">' + ln("M-120 0L-120 -170L-86 -170L-86 -184L-70 -184L-70 -170L-52 -170L-52 -76L52 -76L52 -170L70 -170L70 -184L86 -184L86 -170L120 -170L120 0Z", "#E7DAF2") + ln("M-126 -170L-103 -232L-80 -170Z", "#E6909E") + ln("M80 -170L103 -232L126 -170Z", "#E6909E") + ln("M-36 -150L-36 -76L36 -76L36 -150Z", "#E7DAF2", 1.6) + ln("M-40 -150L0 -216L40 -150Z", "#8BC1D2") + line("M0 -216L0 -246", INK, 2) + ln("M0 -246L24 -238L0 -230Z", "#E9C25A", 1.4);
      o += ln("M-28 0L-28 -48Q0 -82 28 -48L28 0Z", "#A9794F") + line("M0 -70L0 0", "#6E4B2E", 1.2) + rect(-104, -132, 16, 30, "#8BC1D2", 8, 1.6) + rect(88, -132, 16, 30, "#8BC1D2", 8, 1.6) + rect(-8, -128, 16, 26, "#8BC1D2", 8, 1.6) + "</g>" + '<!--/C-->';
      o += ln("M-60 440Q100 420 230 436Q340 424 460 440L460 700L-60 700Z", "#A9C98A") + '<path d="M-60 520Q150 504 460 534L460 700L-60 700Z" fill="#92B572" opacity=".45"/>';
      o += '<path d="M150 442Q200 470 250 442L300 700L100 700Z" fill="#E7D9B0" stroke="' + INK + '" stroke-width="1.6" stroke-opacity=".7"/>';
      o += tufts([[50, 480], [330, 500], [370, 560], [80, 600], [320, 640], [60, 660]]);
      [[40, 530, "#E6909E"], [96, 580, "#F4E9CC"], [350, 540, "#E9C25A"], [372, 630, "#E6909E"], [56, 650, "#B8A0DE"]].forEach(function(p){ o += flower(p[0], p[1], p[2]); });
      return o;
    }
  };
  var FU = {
    bed: function(){ return '<g transform="translate(22 478)">' + ell(48, 40, 56, 24, "#C98A6B") + ell(48, 34, 46, 18, "#E6C9A0", 1.4) + ell(48, 30, 30, 11, "#F4E9CC", 1.2) + line("M10 40Q48 58 86 40", "#9A6B44", 1.4) + "</g>"; },
    plant: function(){ return '<g transform="translate(60 468)">' + ln("M0 0Q-26 -30 -14 -58Q4 -40 0 0Z", "#7FA94B") + ln("M0 0Q22 -36 12 -72Q-6 -46 0 0Z", "#9AB85A") + ln("M0 0Q36 -16 42 -42Q16 -38 0 0Z", "#7FA94B") + ln("M-18 0L18 0L13 40L-13 40Z", "#D9806A") + line("M-15 10L15 10", "#A8574A", 1.2) + "</g>"; },
    lamp: function(){ return '<g transform="translate(120 202)">' + line("M0 0L0 40", INK, 1.4) + ln("M-11 40L11 40L8 62L-8 62Z", "#E9C25A") + '<circle cx="0" cy="54" r="26" fill="#FFE9A0" opacity=".28"/></g>'; },
    toybox: function(){ return '<g transform="translate(268 486)">' + ln("M0 10L0 46L66 46L66 10Z", "#A87B52") + ln("M-4 4Q33 -8 70 4L66 14L0 14Z", "#B98A5B") + line("M33 14L33 46", "#6E4B2E", 1.4) + circ(33, 26, 3.4, "#E9C25A", 1) + circ(18, -2, 9, "#D9806A", 1.4) + rect(40, -10, 14, 14, "#7C9FCB", 2, 1.4) + "</g>"; },
    rug: function(){ return ell(200, 524, 140, 30, "#E6909E", 1.8) + ell(200, 524, 108, 22, "#F6D3D8", 1.2) + ell(200, 524, 74, 14, "#E6909E", 1.2) + ell(200, 524, 36, 6, "#F6D3D8", 1.1); }
  };
  var DEFS = '<defs><linearGradient id="psWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9AABB6"/><stop offset="1" stop-color="#6F8392"/></linearGradient><linearGradient id="psWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9C6E46"/><stop offset=".5" stop-color="#A9794F"/><stop offset="1" stop-color="#8A5E3B"/></linearGradient><linearGradient id="psSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9D6E4"/><stop offset="1" stop-color="#EEF1D8"/></linearGradient><linearGradient id="psSkyB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFDDE8"/><stop offset="1" stop-color="#F0EEDC"/></linearGradient><linearGradient id="psSkyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F1D9D6"/><stop offset="1" stop-color="#FAF0DC"/></linearGradient><linearGradient id="psSkyS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262657"/><stop offset="1" stop-color="#5A4C8A"/></linearGradient><linearGradient id="psSkyC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EBCFE0"/><stop offset="1" stop-color="#FBEBD6"/></linearGradient><linearGradient id="psFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D7C292"/><stop offset="1" stop-color="#BCA474"/></linearGradient><filter id="psSat"><feColorMatrix type="saturate" values=".78"/></filter><filter id="psGrain" x="-60" y="0" width="520" height="700" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="n"/><feColorMatrix type="matrix" values="0 0 0 0 .3  0 0 0 0 .2  0 0 0 0 .1  0 0 0 .55 -.12"/></filter></defs>';
  window.PETSCENE = {
    scene: function(id, side){ var x = (SC[id] || SC.home)(); x = side ? x.replace(/<!--C-->[\s\S]*?<!--\/C-->/g, "") : x.replace(/<!--\/?C-->/g, ""); return DEFS + '<g filter="url(#psSat)">' + x + '</g><rect x="-60" y="0" width="520" height="700" filter="url(#psGrain)" opacity=".5" style="pointer-events:none"/>'; },
    furn: function(inv){ inv = inv || {}; var out = ""; ["rug", "bed", "plant", "lamp", "toybox"].forEach(function(k){ if(inv["fu_" + k]) out += FU[k](); }); return out; },
    FURN: [{ id: "rug", n: "地毯", p: 20 }, { id: "plant", n: "盆栽", p: 20 }, { id: "lamp", n: "吊燈", p: 25 }, { id: "toybox", n: "玩具箱", p: 30 }, { id: "bed", n: "寵物窩", p: 40 }],
    furnSvg: function(k){ return '<svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMid meet">' + FU[k]() + "</svg>"; }
  };
})();
