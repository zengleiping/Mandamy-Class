/* 曼米中文：台灣讀音修正表（pinyin-pro 的補充）。簡報（slides/practice.html）和生詞遊戲（games）共用；需要先載入 pinyin-pro.js */
  // 台灣讀音修正表：pinyin-pro 的內建字典偏大陸讀音，也有些常用詞會判斷錯（例如「企鵝」qǐ é、「餅乾」bǐng qián、
  // 「公車」gōng jū、「還是」huán shì、「因為」yīn wéi、「銀行」yín xíng）。這裡用官方 customPinyin() 蓋掉；
  // 單字＝這個字的預設讀音，詞語＝整個詞的讀音（詞語優先）。輕聲寫沒有調號的音節（me、men、zi…）。
  // 之後發現還有讀錯的字詞，加在這份表裡就好；單一個字想改，也可以直接點字上面的注音改。
  (function(){
    var T = {
      // ── 單字預設 ──
      "企":"qì", "車":"chē", "們":"men", "麼":"me", "蘋":"píng", "乾":"gān", "危":"wéi", "期":"qí", "髮":"fǎ", "著":"zhe", "還":"hái", "誰":"shéi", "和":"hàn",
      // ── 詞語 ──
      "研究":"yán jiù", "研究所":"yán jiù suǒ", "研究生":"yán jiù shēng", "鑰匙":"yào shi", "乾坤":"qián kūn",
      "為了":"wèi le", "因為":"yīn wèi", "為什麼":"wèi shén me", "為甚麼":"wèi shén me", "為何":"wèi hé", "為止":"wéi zhǐ",
      "長大":"zhǎng dà", "長高":"zhǎng gāo", "長得":"zhǎng de", "生長":"shēng zhǎng", "成長":"chéng zhǎng", "增長":"zēng zhǎng", "家長":"jiā zhǎng",
      "校長":"xiào zhǎng", "班長":"bān zhǎng", "隊長":"duì zhǎng", "組長":"zǔ zhǎng", "村長":"cūn zhǎng", "市長":"shì zhǎng", "縣長":"xiàn zhǎng",
      "部長":"bù zhǎng", "院長":"yuàn zhǎng", "船長":"chuán zhǎng", "會長":"huì zhǎng", "社長":"shè zhǎng", "師長":"shī zhǎng", "兄長":"xiōng zhǎng",
      "年長":"nián zhǎng", "長輩":"zhǎng bèi", "長者":"zhǎng zhě",
      "銀行":"yín háng", "行業":"háng yè", "內行":"nèi háng", "同行":"tóng háng",
      "音樂":"yīn yuè", "音樂會":"yīn yuè huì", "樂器":"yuè qì", "樂團":"yuè tuán", "樂隊":"yuè duì", "樂曲":"yuè qǔ", "樂譜":"yuè pǔ", "國樂":"guó yuè", "樂手":"yuè shǒu",
      "重寫":"chóng xiě", "重複":"chóng fù", "重來":"chóng lái", "重做":"chóng zuò", "重唱":"chóng chàng", "重畫":"chóng huà", "重播":"chóng bō", "重讀":"chóng dú",
      "還給":"huán gěi", "還錢":"huán qián", "還書":"huán shū", "歸還":"guī huán", "償還":"cháng huán", "還回":"huán huí", "還原":"huán yuán", "還債":"huán zhài",
      "射中":"shè zhòng", "打中":"dǎ zhòng", "命中":"mìng zhòng", "擊中":"jī zhòng", "猜中":"cāi zhòng", "說中":"shuō zhòng", "看中":"kàn zhòng", "選中":"xuǎn zhòng",
      "中獎":"zhòng jiǎng", "中毒":"zhòng dú", "中暑":"zhòng shǔ", "中風":"zhòng fēng", "中彈":"zhòng dàn",
      "教書":"jiāo shū", "教我":"jiāo wǒ", "教你":"jiāo nǐ", "教他":"jiāo tā", "教她":"jiāo tā", "教我們":"jiāo wǒ men", "教中文":"jiāo zhōng wén", "教英文":"jiāo yīng wén", "教數學":"jiāo shù xué",
      "睡覺":"shuì jiào", "午覺":"wǔ jiào", "睡午覺":"shuì wǔ jiào", "一覺":"yí jiào", "睡一覺":"shuì yí jiào",
      "著名":"zhù míng", "著作":"zhù zuò", "顯著":"xiǎn zhù", "著重":"zhuó zhòng",
      "睡著":"shuì zháo", "著急":"zháo jí", "著火":"zháo huǒ", "著涼":"zháo liáng", "找著":"zhǎo zháo", "猜著":"cāi zháo", "摸不著":"mō bù zháo", "夠不著":"gòu bù zháo",
      "到處":"dào chù", "好處":"hǎo chù", "壞處":"huài chù", "用處":"yòng chù", "住處":"zhù chù", "去處":"qù chù", "難處":"nán chù", "長處":"cháng chù",
      "益處":"yì chù", "處處":"chù chù", "四處":"sì chù", "各處":"gè chù", "別處":"bié chù", "遠處":"yuǎn chù", "近處":"jìn chù", "高處":"gāo chù",
      "垃圾":"lè sè", "和平":"hé píng", "和好":"hé hǎo", "和諧":"hé xié", "和氣":"hé qì", "溫和":"wēn hé", "暖和":"nuǎn huo", "和藹":"hé ǎi", "和解":"hé jiě", "和睦":"hé mù", "附和":"fù hè", "和面":"huó miàn",
      "調皮":"tiáo pí", "調味":"tiáo wèi",
      "覺得":"jué de", "記得":"jì de", "懂得":"dǒng de", "曉得":"xiǎo de", "值得":"zhí de", "捨得":"shě de", "顯得":"xiǎn de", "免得":"miǎn de", "省得":"shěng de",
      "星期":"xīng qí", "日期":"rì qí", "學期":"xué qí", "期待":"qí dài", "期末":"qí mò", "期中":"qí zhōng", "週期":"zhōu qí", "假期":"jià qí", "時期":"shí qí",
      "長期":"cháng qí", "短期":"duǎn qí", "期間":"qí jiān", "到期":"dào qí", "過期":"guò qí", "預期":"yù qí", "定期":"dìng qí"
    };
    try{ if(typeof pinyinPro !== "undefined" && typeof pinyinPro.customPinyin === "function") pinyinPro.customPinyin(T); } catch(e){}
    // 規則修正（沒辦法一個一個列詞的）：①「得」跟在動詞／形容詞後面（跑得快、說得好）讀輕聲 de；「我得走」讀 děi；「得到、得分、取得」仍讀 dé。
    // ②「子」放在名詞後面（桌子、橘子、獅子）讀輕聲 zi；「王子、電子、種子（zhǒng zi 仍輕聲）」這類少數例外保留原音。
    var DE_NEXT_KEEP = "到分獎病意罪出以失救勝", DE_PREV_KEEP = "取獲博贏賺習心難獨所", DE_PRON = "我你他她它咱";
    var ZI_KEEP = { "王":1, "電":1, "孔":1, "孟":1, "莊":1, "老":1, "君":1, "男":1, "女":1, "父":1, "母":1, "分":1, "原":1, "因":1, "太":1, "天":1, "赤":1, "才":1, "骰":0 };
    function isHan(c){ return !!c && /[㐀-䶿一-鿿豈-﫿]/.test(c); }
    window.mmTwPost = function(chars, symP, symN){
      for(var i = 0; i < chars.length; i++){
        var c = chars[i], pv = chars[i - 1], nx = chars[i + 1];
        if(c === "得" && isHan(pv) && isHan(nx) && DE_NEXT_KEEP.indexOf(nx) < 0 && DE_PREV_KEEP.indexOf(pv) < 0){
          if(DE_PRON.indexOf(pv) >= 0){ if(symP) symP[i] = "děi"; if(symN) symN[i] = "dei3"; }
          else { if(symP) symP[i] = "de"; if(symN) symN[i] = "de0"; }
        } else if(c === "子" && isHan(pv) && !ZI_KEEP[pv] && (!isHan(nx) || "們的裡上很是也都在有和又還"
          .indexOf(nx) >= 0)){
          if(symP) symP[i] = "zi"; if(symN) symN[i] = "zi0";
        }
      }
    };
  })();

