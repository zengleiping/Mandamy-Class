#!/usr/bin/env python3
"""Firebase 搬家用：把舊專案「整個資料庫匯出的 JSON」整理成可以匯入新專案的檔案。

用法：  python3 prepare_import.py 舊專案匯出.json 輸出資料夾

做的事：
  1. 只留下要搬的資料（老師帳號、教材庫、班級資料、課表、班級代碼、時空膠囊／接力故事…）。
     不搬：uidMap（舊的登入對應）、rooms、roomStudentSnapshots、roomReactions、roomCursors、roomMasterTraceLive、docCam、liveGames（都是上課當下的暫存）。
  2. 老師帳號裡舊的 Firebase 登入身分（uid）清掉，這樣老師在新專案第一次用原本的帳號密碼登入時，會自動重新認領。
  3. 輸出「全部一次匯入.json」（建議用這個，在新專案資料頁最上層匯入一次），另外每個節點也各一個檔案備用。
"""
import json, os, sys

KEEP = ["teacherAccounts", "teacherLibraries", "teacherVocabBanks", "classCodes", "teacherPlatform",
        "capsuleLinks", "classStories", "relayStories", "capsuleLinkOwners", "capsuleMarks",
        "classLinkOwners", "relayLinkOwners"]
SKIP = ["uidMap", "rooms", "roomStudentSnapshots", "roomReactions", "roomCursors", "roomMasterTraceLive", "docCam", "liveGames"]


def main(src, outdir):
    with open(src, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        sys.exit("這不是整個資料庫的匯出檔（最外層要是物件）。請在 Realtime Database 資料頁，從最上層（根節點）按 ⋮ → 匯出 JSON。")
    os.makedirs(outdir, exist_ok=True)
    report = []
    combined = {}
    for k in KEEP:
        if k not in data or data[k] is None:
            report.append((k, 0, "（舊專案沒有這個節點，略過）"))
            continue
        node = data[k]
        if k == "teacherAccounts" and isinstance(node, dict):
            for acc in node.values():
                if isinstance(acc, dict):
                    acc.pop("uid", None)
        combined[k] = node
        path = os.path.join(outdir, k + ".json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(node, f, ensure_ascii=False)
        report.append((k, os.path.getsize(path), path))
    allp = os.path.join(outdir, "全部一次匯入.json")
    with open(allp, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False)
    print("整理完成，輸出到：", outdir)
    print("  全部一次匯入.json  %.2f MB（到新專案資料頁最上層 ⋮ → 匯入 JSON，選這個檔案就好）" % (os.path.getsize(allp) / 1e6))
    for k, n, p in report:
        print("  %-20s %10.2f MB  %s" % (k, n / 1e6, p if n else p))
    left = [k for k in data if k not in KEEP and k not in SKIP]
    if left:
        print("提醒：舊專案還有這些節點沒有搬（不在清單內）：", ", ".join(left))
    if os.path.getsize(allp) > 240 * 1024 * 1024:
        print("警告：檔案接近 Firebase 匯入上限 256 MB，請告訴我，我再幫你分段。")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
