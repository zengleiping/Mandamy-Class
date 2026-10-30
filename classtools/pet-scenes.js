/* 寵物遊戲的場景與家具（SVG，跟寵物同一套畫法：黑色圓角外框＋平塗色塊＋一彎陰影），座標是 400×700。
   window.PETSCENE.scene(id) 回傳背景 SVG 內容；window.PETSCENE.furn(inv) 回傳買過的家具（畫在寵物後面）。 */
(function(){
  "use strict";
  var INK = "#1b1212", sw = 3.2;
  function ln(d, f, w){ return '<path d="' + d + '" fill="' + f + '" stroke="' + INK + '" stroke-width="' + (w || sw) + '" stroke-linejoin="round" stroke-linecap="round"/>'; }
  function sh(d, f, dark){ return ln(d, f); }
  function rect(x, y, w, h, f, r, sw2){ return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r || 0) + '" fill="' + f + '" stroke="' + INK + '" stroke-width="' + (sw2 == null ? sw : sw2) + '" stroke-linejoin="round"/>'; }
  function circ(x, y, r, f, sw2){ return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '" stroke="' + INK + '" stroke-width="' + (sw2 == null ? sw : sw2) + '"/>'; }
  function ell(x, y, rx, ry, f, sw2){ return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '" stroke="' + INK + '" stroke-width="' + (sw2 == null ? sw : sw2) + '"/>'; }
  function line(d, c, w){ return '<path d="' + d + '" fill="none" stroke="' + (c || INK) + '" stroke-width="' + (w || sw) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
  function cloud(x, y, s, cls){ return '<g class="pg-cloud ' + (cls || "") + '" transform="translate(' + x + " " + y + ") scale(" + s + ')">' + ln("M-40 12Q-54 12 -54 -2Q-54 -15 -38 -15Q-36 -32 -18 -32Q-6 -44 10 -34Q22 -46 36 -32Q54 -33 54 -13Q64 -10 60 3Q57 12 46 12Z", "#fff") + "</g>"; }
  function tree(x, y, s, c1){ return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')">' + ln("M-9 0L-6 -62L6 -62L9 0Z", "#B98482") + ln("M-52 -58Q-64 -92 -34 -104Q-30 -134 0 -132Q30 -134 36 -104Q66 -92 52 -58Q22 -42 -52 -58Z", c1 || "#6CC36B") + line("M-26 -86Q-14 -96 -2 -92", "#9BE08F", 5) + "</g>"; }
  function flower(x, y, c){ return '<g transform="translate(' + x + " " + y + ')">' + line("M0 0L0 20", "#3FA25F", 3.4) + circ(0, -2, 9, c, 2.6) + circ(0, -2, 3.4, "#FFD23F", 0) + "</g>"; }
  function bush(x, y, s){ return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')">' + ln("M-34 0Q-44 -22 -22 -28Q-14 -46 8 -38Q30 -44 34 -20Q46 -6 30 0Z", "#4FB36E") + "</g>"; }
  var SC = {
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
    bed: function(){ return '<g transform="translate(24 540)">' + rect(0, 0, 130, 54, "#B98482", 8) + rect(0, -34, 20, 88, "#B98482", 6) + ln("M20 -4Q70 -30 126 -4L126 36L20 36Z", "#7EC8F0") + ell(48, -10, 24, 12, "#FFF6E4") + ln("M20 20Q70 8 126 20L126 36L20 36Z", "#5BA6D6", 2.6) + "</g>"; },
    plant: function(){ return '<g transform="translate(338 520)">' + ln("M0 0Q-28 -34 -14 -62Q4 -44 0 0Z", "#4FB36E") + ln("M0 0Q24 -40 12 -78Q-6 -50 0 0Z", "#6CC36B") + ln("M0 0Q40 -18 46 -44Q18 -40 0 0Z", "#4FB36E") + ln("M-20 0L20 0L14 44L-14 44Z", "#FF9A80") + "</g>"; },
    lamp: function(){ return '<g transform="translate(364 470)">' + line("M0 0L0 -84", INK, 5) + ell(0, 60, 24, 7, "#B98482", 2.8).replace('cy="60"', 'cy="62"') + ln("M-26 -84L26 -84L16 -122L-16 -122Z", "#FFE98A") + '<ellipse cx="0" cy="-60" rx="38" ry="12" fill="#FFE98A" opacity=".35"/></g>'; },
    toybox: function(){ return '<g transform="translate(260 580)">' + rect(0, 0, 80, 46, "#FFB36B", 6) + rect(-4, -10, 88, 16, "#FFD23F", 5) + circ(24, -22, 12, "#FF6B6B", 2.8) + rect(42, -30, 18, 18, "#7EC8F0", 3, 2.8) + "</g>"; },
    rug: function(){ return ell(200, 590, 150, 38, "#FF9A80") + ell(200, 590, 112, 26, "#FFD3C4", 2.6) + ell(200, 590, 70, 14, "#FF9A80", 2.6); }
  };
  window.PETSCENE = {
    scene: function(id, side){ var x = (SC[id] || SC.grass)(); return side ? x.replace(/<!--C-->[\s\S]*?<!--\/C-->/g, "") : x.replace(/<!--\/?C-->/g, ""); },
    furn: function(inv){ inv = inv || {}; var out = ""; ["rug", "bed", "plant", "lamp", "toybox"].forEach(function(k){ if(inv["fu_" + k]) out += FU[k](); }); return out; },
    FURN: [{ id: "rug", n: "地毯", p: 20 }, { id: "plant", n: "盆栽", p: 20 }, { id: "lamp", n: "立燈", p: 25 }, { id: "toybox", n: "玩具箱", p: 30 }, { id: "bed", n: "小床", p: 40 }],
    furnSvg: function(k){ return '<svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMid meet">' + FU[k]() + "</svg>"; }
  };
})();
