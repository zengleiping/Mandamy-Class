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
      var f = ""; [[40, 560, "#FF8FB0"], [118, 620, "#FFD23F"], [310, 585, "#C3A0FF"], [360, 650, "#FF8FB0"], [70, 680, "#fff"], [250, 668, "#FFD23F"]].forEach(function(p){ f += flower(p[0], p[1], p[2]); });
      var fence = ""; for(var i = 0; i < 6; i++) fence += ln("M" + (292 + i * 22) + " 478L" + (292 + i * 22) + " 436L" + (298 + i * 22) + " 428L" + (304 + i * 22) + " 436L" + (304 + i * 22) + " 478Z", "#FFF1D0", 2.6);
      return rect(-60, 0, 520, 700, "#BFE6FF", 0, 0) + '<!--C-->' + circ(320, 110, 34, "#FFD23F") + '<!--/C-->' + cloud(90, 120, 1, "c1") + cloud(290, 200, .8, "c2") +
        ln("M-60 420Q70 340 170 392Q260 340 460 410L460 700L-60 700Z", "#A8DC8E") + ln("M-60 470Q120 424 250 466Q330 440 460 462L460 700L-60 700Z", "#7CC76B") +
        tree(62, 478, 1) + bush(160, 478, .9) + fence + line("M290 452L460 452M290 464L460 464", INK, 2.6) +
        '<path d="M-60 520Q150 500 460 530L460 700L-60 700Z" fill="#6DBB5E" opacity=".55"/>' + f;
    },
    room: function(){
      var st = ""; for(var i = 0; i < 10; i++) st += '<rect x="' + (i * 44) + '" y="0" width="22" height="450" fill="#F9D6B0"/>';
      var pl = ""; for(var j = 0; j < 7; j++) pl += line("M-60 " + (500 + j * 34) + "L460 " + (500 + j * 34), "#B87A45", 2); 
      return rect(-60, 0, 520, 700, "#FFE4C4", 0, 0) + st + rect(-60, 440, 520, 34, "#FFF6E4", 0) + line("M-60 440L460 440M-60 474L460 474") +
        '<rect x="-60" y="474" width="520" height="230" fill="#E3AA6E"/>' + pl + line("M-60 474L460 474") +
        '<!--C-->' + rect(246, 120, 124, 150, "#BFE6FF", 6) + line("M308 120L308 270M246 195L370 195") + circ(280, 160, 12, "#fff", 0) + cloud(330, 232, .35, "") + rect(240, 112, 136, 14, "#FFF6E4", 5) +
        ln("M236 126L236 286Q248 270 262 286L262 126Z", "#FF9A80") + ln("M380 126L380 286Q368 270 356 286L356 126Z", "#FF9A80") +
        rect(38, 150, 100, 78, "#FFF6E4", 5) + rect(48, 160, 80, 58, "#CDEBB0", 3) + ln("M48 218L72 186L92 206L106 192L128 218Z", "#7CC76B", 2.6) + circ(112, 178, 8, "#FFD23F", 2.6) +
        rect(40, 300, 100, 10, "#B98482", 4) + rect(52, 268, 24, 32, "#FF9A80", 4) + rect(84, 276, 20, 24, "#7EC8F0", 4) + '<!--/C-->';
    },
    beach: function(){
      var w = ""; for(var i = 0; i < 4; i++) w += line("M" + (20 + i * 100) + " " + (418 + (i % 2) * 14) + "Q" + (45 + i * 100) + " " + (406 + (i % 2) * 14) + " " + (70 + i * 100) + " " + (418 + (i % 2) * 14), "#fff", 3.4);
      return rect(-60, 0, 520, 700, "#9ADBF7", 0, 0) + '<!--C-->' + circ(70, 120, 36, "#FFD23F") + '<!--/C-->' + cloud(250, 150, 1, "c1") + cloud(120, 250, .7, "c2") +
        '<rect x="-60" y="380" width="520" height="90" fill="#4BB7E8"/>' + line("M-60 380L460 380") + w +
        ln("M-60 470Q150 440 300 470Q360 484 460 470L460 700L-60 700Z", "#F7E2A8") + '<path d="M-60 520Q150 500 460 535L460 700L-60 700Z" fill="#E8CF8A" opacity=".6"/>' +
        '<g transform="translate(336 470)">' + ln("M-6 0Q-10 -60 6 -118L14 -118Q2 -60 8 0Z", "#B98482") + ln("M10 -118Q-30 -140 -56 -112Q-24 -122 10 -108Z", "#4FB36E") + ln("M10 -118Q50 -142 76 -112Q40 -124 10 -108Z", "#4FB36E") + ln("M10 -118Q8 -160 -14 -170Q10 -150 10 -118Z", "#6CC36B") + "</g>" +
        '<g transform="translate(70 500)">' + line("M0 0L0 -90", INK, 4) + ln("M-62 -78Q0 -130 62 -78Z", "#FF6B6B") + ln("M-62 -78Q-31 -92 0 -78Q31 -92 62 -78Q31 -70 0 -78Q-31 -70 -62 -78Z", "#fff", 2.6) + "</g>" +
        ln("M190 640Q205 622 222 640Q205 652 190 640Z", "#FF8FB0", 2.6) + circ(300, 620, 5, "#FF8FB0", 2);
    },
    garden: function(){
      var f = ""; [[30, 520, "#FF8FB0"], [88, 560, "#FFD23F"], [150, 505, "#C3A0FF"], [250, 515, "#FF8FB0"], [320, 560, "#FFD23F"], [370, 510, "#fff"], [60, 640, "#C3A0FF"], [140, 676, "#FF8FB0"], [280, 660, "#fff"], [350, 650, "#FF8FB0"]].forEach(function(p){ f += flower(p[0], p[1], p[2]); });
      return rect(-60, 0, 520, 700, "#FFE3EE", 0, 0) + cloud(100, 130, 1, "c1") + cloud(310, 200, .8, "c2") +
        ln("M-60 450Q100 400 200 440Q300 400 460 440L460 700L-60 700Z", "#BFE8A6") + ln("M-60 490Q150 454 460 494L460 700L-60 700Z", "#9ADB86") +
        '<!--C--><g transform="translate(200 478)">' + ln("M-96 0L-96 -170Q-96 -250 0 -250Q96 -250 96 -170L96 0L78 0L78 -170Q78 -232 0 -232Q-78 -232 -78 -170L-78 0Z", "#FFF6E4") + circ(-86, -150, 12, "#FF8FB0", 2.6) + circ(-86, -100, 12, "#FFD23F", 2.6) + circ(86, -150, 12, "#C3A0FF", 2.6) + circ(86, -100, 12, "#FF8FB0", 2.6) + circ(0, -240, 12, "#FF8FB0", 2.6) + "</g><!--/C-->" +
        bush(40, 480, 1) + bush(364, 480, 1) + f +
        ln("M120 330Q108 316 118 304Q130 308 130 322Z", "#FFD23F", 2.4) + ln("M130 322Q142 312 152 322Q148 336 132 330Z", "#FF8FB0", 2.4) + line("M130 322L132 330", INK, 2.4);
    },
    space: function(){
      var s = ""; for(var i = 0; i < 40; i++) s += '<circle class="pg-star" style="animation-delay:' + ((i * .37) % 3) + 's" cx="' + ((i * 83) % 400) + '" cy="' + ((i * 127) % 420) + '" r="' + (1 + (i % 3) * .8) + '" fill="#fff"/>';
      return rect(-60, 0, 520, 700, "#241B5E", 0, 0) + s +
        '<!--C--><g transform="translate(290 150)">' + circ(0, 0, 50, "#FFB35C") + '<path d="M-36 -20Q0 -6 40 -34L46 -20Q4 4 -42 -4Z" fill="#E0883A" opacity=".7"/>' + ln("M-84 12Q0 52 84 -16Q0 24 -84 12Z", "#FFE0A8", 2.6) + "</g><!--/C-->" +
        circ(80, 220, 22, "#E6E6F2") + circ(72, 212, 5, "#C9C9DA", 0) +
        ln("M-60 470Q120 436 250 466Q330 446 460 462L460 700L-60 700Z", "#9A93C9") + ln("M-60 520Q150 500 460 530L460 700L-60 700Z", "#7E76B8") +
        ell(80, 560, 34, 11, "#6A63A6", 2.6) + ell(300, 610, 28, 9, "#6A63A6", 2.6) + ell(190, 660, 40, 12, "#6A63A6", 2.6) +
        '<g transform="translate(330 470)">' + ln("M0 -110Q26 -80 26 -34L26 0L-26 0L-26 -34Q-26 -80 0 -110Z", "#fff") + circ(0, -62, 10, "#7EC8F0") + ln("M-26 -20L-48 6L-26 0Z", "#FF6B6B") + ln("M26 -20L48 6L26 0Z", "#FF6B6B") + ln("M0 -110Q10 -100 14 -90L-14 -90Q-10 -100 0 -110Z", "#FF6B6B") + "</g>";
    },
    castle: function(){
      return rect(-60, 0, 520, 700, "#F6D2F0", 0, 0) + cloud(80, 130, 1, "c1") + cloud(320, 190, .8, "c2") +
        ln("M-60 450Q120 420 250 448Q330 436 460 448L460 700L-60 700Z", "#CDEBB0") + ln("M-60 500Q150 478 460 506L460 700L-60 700Z", "#A8DC8E") +
        '<!--C--><g transform="translate(200 470)">' + ln("M-120 0L-120 -170L-86 -170L-86 -190L-70 -190L-70 -170L-52 -170L-52 -70L52 -70L52 -170L70 -170L70 -190L86 -190L86 -170L120 -170L120 0Z", "#E8D9F7") +
        ln("M-124 -170L-103 -230L-82 -170Z", "#FF8FB0") + ln("M82 -170L103 -230L124 -170Z", "#FF8FB0") + ln("M-30 -72L-30 -150L30 -150L30 -72Z", "#E8D9F7", 2.6) + ln("M-34 -150L0 -208L34 -150Z", "#7EC8F0") + line("M0 -208L0 -240", INK, 3) + ln("M0 -240L22 -232L0 -224Z", "#FFD23F", 2.6) +
        ln("M-26 0L-26 -46Q0 -78 26 -46L26 0Z", "#B98482") + rect(-104, -128, 16, 28, "#7EC8F0", 8, 2.6) + rect(88, -128, 16, 28, "#7EC8F0", 8, 2.6) + "</g><!--/C-->" +
        flower(50, 530, "#FF8FB0") + flower(350, 540, "#FFD23F") + flower(90, 650, "#C3A0FF") + flower(310, 660, "#fff");
    }
  };
  var FU = {
    bed: function(){ return '<g transform="translate(22 478)">' + ell(48, 40, 56, 24, "#C98A6B") + ell(48, 34, 46, 18, "#E6C9A0", 1.4) + ell(48, 30, 30, 11, "#F4E9CC", 1.2) + line("M10 40Q48 58 86 40", "#9A6B44", 1.4) + "</g>"; },
    plant: function(){ return '<g transform="translate(60 468)">' + ln("M0 0Q-26 -30 -14 -58Q4 -40 0 0Z", "#7FA94B") + ln("M0 0Q22 -36 12 -72Q-6 -46 0 0Z", "#9AB85A") + ln("M0 0Q36 -16 42 -42Q16 -38 0 0Z", "#7FA94B") + ln("M-18 0L18 0L13 40L-13 40Z", "#D9806A") + line("M-15 10L15 10", "#A8574A", 1.2) + "</g>"; },
    lamp: function(){ return '<g transform="translate(120 202)">' + line("M0 0L0 40", INK, 1.4) + ln("M-11 40L11 40L8 62L-8 62Z", "#E9C25A") + '<circle cx="0" cy="54" r="26" fill="#FFE9A0" opacity=".28"/></g>'; },
    toybox: function(){ return '<g transform="translate(268 486)">' + ln("M0 10L0 46L66 46L66 10Z", "#A87B52") + ln("M-4 4Q33 -8 70 4L66 14L0 14Z", "#B98A5B") + line("M33 14L33 46", "#6E4B2E", 1.4) + circ(33, 26, 3.4, "#E9C25A", 1) + circ(18, -2, 9, "#D9806A", 1.4) + rect(40, -10, 14, 14, "#7C9FCB", 2, 1.4) + "</g>"; },
    rug: function(){ return ell(200, 524, 140, 30, "#E6909E", 1.8) + ell(200, 524, 108, 22, "#F6D3D8", 1.2) + ell(200, 524, 74, 14, "#E6909E", 1.2) + ell(200, 524, 36, 6, "#F6D3D8", 1.1); }
  };
  var DEFS = '<defs><linearGradient id="psWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9AABB6"/><stop offset="1" stop-color="#6F8392"/></linearGradient><linearGradient id="psWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9C6E46"/><stop offset=".5" stop-color="#A9794F"/><stop offset="1" stop-color="#8A5E3B"/></linearGradient><linearGradient id="psFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D7C292"/><stop offset="1" stop-color="#BCA474"/></linearGradient><filter id="psSat"><feColorMatrix type="saturate" values=".78"/></filter><filter id="psGrain" x="-60" y="0" width="520" height="700" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="n"/><feColorMatrix type="matrix" values="0 0 0 0 .3  0 0 0 0 .2  0 0 0 0 .1  0 0 0 .55 -.12"/></filter></defs>';
  window.PETSCENE = {
    scene: function(id, side){ var x = (SC[id] || SC.home)(); x = side ? x.replace(/<!--C-->[\s\S]*?<!--\/C-->/g, "") : x.replace(/<!--\/?C-->/g, ""); return DEFS + '<g filter="url(#psSat)">' + x + '</g><rect x="-60" y="0" width="520" height="700" filter="url(#psGrain)" opacity=".5" style="pointer-events:none"/>'; },
    furn: function(inv){ inv = inv || {}; var out = ""; ["rug", "bed", "plant", "lamp", "toybox"].forEach(function(k){ if(inv["fu_" + k]) out += FU[k](); }); return out; },
    FURN: [{ id: "rug", n: "地毯", p: 20 }, { id: "plant", n: "盆栽", p: 20 }, { id: "lamp", n: "吊燈", p: 25 }, { id: "toybox", n: "玩具箱", p: 30 }, { id: "bed", n: "寵物窩", p: 40 }],
    furnSvg: function(k){ return '<svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMid meet">' + FU[k]() + "</svg>"; }
  };
})();
