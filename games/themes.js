/* 曼米中文 · Blast 主題
   每個主題只管「長相」：背景、物件的圖形和顏色、爆開的顏色、往下掉還是往上飄。玩法都一樣。
   要加新主題：照下面的格式在 MG.THEMES 加一筆就好（圖形用 SVG，viewBox 0 0 150 110）。 */
(function(){
  var MG = window.MG;
  function pick(arr, i){ return arr[Math.abs(i) % arr.length]; }

  MG.THEMES = {
    space: {
      name: "太空隕石", dir: 1,
      bg: "radial-gradient(ellipse at 30% 20%, #3B3F7A 0%, #1C1F45 45%, #0E1030 100%)",
      deco: function(){
        var s = ""; for(var i = 0; i < 70; i++){ var x = (i * 137.5) % 100, y = (i * 61.8 * 1.7) % 100, r = (i % 5 === 0) ? 2.2 : 1.2; s += '<circle cx="' + x.toFixed(1) + '%" cy="' + y.toFixed(1) + '%" r="' + r + '" fill="#fff" opacity="' + (0.35 + (i % 4) * 0.15) + '"/>'; }
        return '<svg width="100%" height="100%" style="position:absolute;inset:0">' + s + '<circle cx="88%" cy="82%" r="46" fill="#E8825A" opacity=".55"/><ellipse cx="88%" cy="82%" rx="74" ry="14" fill="none" stroke="#F2C14E" stroke-width="4" opacity=".5"/></svg>';
      },
      shape: function(i){
        var c = pick(["#8D7B6A", "#9A8676", "#7E6F63", "#A08A73"], i);
        return '<svg class="shape" viewBox="0 0 150 110"><path d="M22 40 L40 14 L78 8 L114 16 L138 40 L142 70 L120 98 L80 104 L40 98 L14 74 Z" fill="' + c + '" stroke="#5B4D42" stroke-width="3"/><circle cx="42" cy="30" r="8" fill="#6E6055" opacity=".6"/><circle cx="118" cy="80" r="10" fill="#6E6055" opacity=".55"/><circle cx="110" cy="30" r="5" fill="#6E6055" opacity=".6"/><path d="M14 74 L-6 92 M22 84 L2 106" stroke="#F2C14E" stroke-width="5" stroke-linecap="round" opacity=".55"/></svg>';
      },
      label: { lc: "#fff", ls: "0 2px 3px rgba(0,0,0,.6)" },
      spark: ["#F2C14E", "#E8825A", "#fff"]
    },
    balloon: {
      name: "氣球", dir: -1,
      bg: "linear-gradient(#9FD3F5 0%, #CFEAFB 60%, #F4FBFF 100%)",
      deco: function(){
        function cloud(x, y, s){ return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="#fff" opacity=".9"><ellipse cx="0" cy="0" rx="40" ry="22"/><ellipse cx="30" cy="-12" rx="30" ry="24"/><ellipse cx="62" cy="2" rx="34" ry="20"/></g>'; }
        return '<svg width="100%" height="100%" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0">' + cloud(120, 140, 1.2) + cloud(700, 90, 1) + cloud(480, 380, .8) + cloud(850, 520, 1.1) + '<path d="M0 650 Q250 590 500 640 T1000 630 V700 H0Z" fill="#9CCB86"/></svg>';
      },
      shape: function(i){
        var c = pick(["#E8825A", "#5B9BD5", "#F2C14E", "#C8607A", "#4C8577", "#9B7BD4"], i);
        return '<svg class="shape" viewBox="0 0 150 110"><path d="M75 92 Q70 102 78 110 Q84 118 76 128" stroke="#8B7B6B" stroke-width="2" fill="none"/><ellipse cx="75" cy="47" rx="62" ry="45" fill="' + c + '"/><path d="M70 91 L80 91 L75 97 Z" fill="' + c + '"/><ellipse cx="50" cy="26" rx="14" ry="8" fill="#fff" opacity=".35" transform="rotate(-25 50 26)"/></svg>';
      },
      label: { ly: "26%", lh: "36%", lc: "#fff", ls: "0 2px 3px rgba(0,0,0,.35)" },
      spark: ["#E8825A", "#F2C14E", "#5B9BD5", "#C8607A"]
    },
    bubble: {
      name: "泡泡", dir: -1,
      bg: "linear-gradient(#4FB3C9 0%, #2E8FA8 55%, #1F6F89 100%)",
      deco: function(){
        return '<svg width="100%" height="100%" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0"><path d="M0 120 Q250 80 500 120 T1000 110" stroke="#fff" stroke-width="3" fill="none" opacity=".25"/><path d="M60 700 Q70 600 50 520 Q40 460 70 400" stroke="#3E9C6E" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M110 700 Q130 620 100 560" stroke="#57B585" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M900 700 Q880 610 910 540 Q930 490 905 430" stroke="#3E9C6E" stroke-width="14" fill="none" stroke-linecap="round"/><ellipse cx="500" cy="700" rx="600" ry="40" fill="#E8D6A8" opacity=".8"/></svg>';
      },
      shape: function(i){
        var c = pick(["#BFF3FF", "#D9F7FF", "#E6E1FF", "#FFE6F2"], i);
        return '<svg class="shape" viewBox="0 0 150 110"><circle cx="75" cy="55" r="56" fill="' + c + '" fill-opacity=".55" stroke="#fff" stroke-width="3" stroke-opacity=".9"/><ellipse cx="52" cy="28" rx="16" ry="9" fill="#fff" opacity=".8" transform="rotate(-30 52 28)"/><circle cx="104" cy="86" r="5" fill="#fff" opacity=".7"/></svg>';
      },
      label: { lc: "#11485A", ls: "0 1px 0 rgba(255,255,255,.8)" },
      spark: ["#fff", "#BFF3FF", "#E6E1FF"]
    },
    fruit: {
      name: "水果", dir: 1,
      bg: "linear-gradient(#FFF6E3 0%, #FCE9C8 100%)",
      deco: function(){
        var s = ""; for(var i = 0; i < 14; i++){ var x = (i * 173) % 1000, y = (i * 97) % 700; s += '<path d="M' + x + ' ' + y + ' q12 -18 26 0 q-12 18 -26 0z" fill="#9CCB86" opacity=".35" transform="rotate(' + (i * 40) + ' ' + x + ' ' + y + ')"/>'; }
        return '<svg width="100%" height="100%" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0">' + s + '<rect x="0" y="650" width="1000" height="50" fill="#D9A86C" opacity=".6"/></svg>';
      },
      shape: function(i){
        var k = Math.abs(i) % 4;
        if(k === 0) return '<svg class="shape" viewBox="0 0 150 110"><path d="M75 22 C40 0 6 26 12 60 C18 96 50 110 75 100 C100 110 132 96 138 60 C144 26 110 0 75 22Z" fill="#E25B4F"/><path d="M75 22 Q72 8 80 0" stroke="#6B4A2B" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M80 10 Q100 0 108 12 Q92 20 80 10Z" fill="#5FA463"/><ellipse cx="40" cy="40" rx="10" ry="6" fill="#fff" opacity=".35"/></svg>';
        if(k === 1) return '<svg class="shape" viewBox="0 0 150 110"><circle cx="75" cy="58" r="52" fill="#F39A2E"/><path d="M75 8 Q86 0 96 6 Q86 14 75 8Z" fill="#5FA463"/><ellipse cx="50" cy="38" rx="11" ry="6" fill="#fff" opacity=".35"/><g fill="#E0861F" opacity=".5"><circle cx="100" cy="70" r="2"/><circle cx="60" cy="84" r="2"/><circle cx="90" cy="40" r="2"/></g></svg>';
        if(k === 2) return '<svg class="shape" viewBox="0 0 150 110"><path d="M4 22 L146 22 A71 80 0 0 1 4 22Z" fill="#4E9A51"/><path d="M12 22 L138 22 A63 70 0 0 1 12 22Z" fill="#F4F0D8"/><path d="M18 22 L132 22 A57 64 0 0 1 18 22Z" fill="#EC5B66"/><g fill="#2B2320"><ellipse cx="50" cy="44" rx="2.5" ry="4"/><ellipse cx="100" cy="44" rx="2.5" ry="4"/><ellipse cx="75" cy="66" rx="2.5" ry="4"/><ellipse cx="60" cy="58" rx="2.5" ry="4"/><ellipse cx="90" cy="58" rx="2.5" ry="4"/></g></svg>';
        return '<svg class="shape" viewBox="0 0 150 110"><path d="M30 60 C30 20 120 20 120 60 C120 100 30 100 30 60Z" fill="#F6D33C" transform="rotate(-18 75 60)"/><path d="M118 34 q10 -6 14 -2" stroke="#6B4A2B" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="58" cy="44" rx="12" ry="6" fill="#fff" opacity=".4" transform="rotate(-18 58 44)"/></svg>';
      },
      label: { lc: "#fff", ls: "0 2px 3px rgba(0,0,0,.45)" },
      spark: ["#E25B4F", "#F39A2E", "#F6D33C", "#5FA463"]
    }
  };
  MG.THEME_ORDER = ["space", "balloon", "bubble", "fruit"];
  // 選主題用的小圖
  MG.themeSwatch = function(id){
    var t = MG.THEMES[id]; if(!t) return "";
    return '<div class="sw" style="background:' + t.bg + '">' + t.shape(1).replace('class="shape"', '') + '</div>';
  };
})();
