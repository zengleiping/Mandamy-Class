# 學生 Google 登入：Firebase 後台設定（只需要做一次）

程式已經做好，但 Google 登入要先在 Firebase 後台打開才能用。大約 3 分鐘。

## 步驟一：開啟 Google 登入方式

1. 打開 Firebase 主控台：https://console.firebase.google.com ，選專案 **chinese-onlineboard**。
2. 左邊選單 **Build（建構）→ Authentication（驗證）**。
3. 上方分頁選 **Sign-in method（登入方式）**。
4. 在清單中找到 **Google**，點進去。
5. 把右上角的開關打開（**Enable／啟用**）。
6. **Project support email（專案支援電子郵件）** 選你自己的 Gmail。
7. 按 **Save（儲存）**。

> 如果清單裡本來就有「Anonymous（匿名）」並且是啟用的，不要關掉，平台其他功能還需要它。

## 步驟二：允許 GitHub Pages 的網址

1. 還是在 Authentication，上方分頁選 **Settings（設定）**。
2. 左邊選 **Authorized domains（已授權網域）**。
3. 按 **Add domain（新增網域）**，輸入：

   ```
   zengleiping.github.io
   ```

4. 按 **Add（新增）**。清單中要看到 `zengleiping.github.io`。

> 如果你之後換成自己的網址，也要用同樣方式把新網址加進來，不然學生按 Google 登入會看到「這個網站還沒有被允許使用 Google 登入」。

## 怎麼確認成功

1. 用手機或另一個瀏覽器打開學生入口：`https://zengleiping.github.io/Mandamy-Class/app.html?class=你的班級代碼`
2. 按 **🔑 用 Google 帳號登入**，選一個 Google 帳號。
3. 選自己在班上的名字，按「送出申請」。
4. 回到你的畫面，右上角 🔔 會出現通知；或到班級的「聯絡簿 → 名單與帳號」，往下找到 **Google 登入**，按「確認」。
5. 學生重新整理，就會直接進入班級，不用輸入名字和密碼。

## 常見問題

- **按了沒有跳出 Google 視窗**：瀏覽器可能擋了彈出視窗。程式會自動改用整頁跳轉的方式登入，如果還是不行，請改用名字＋密碼登入，並告訴我是哪種裝置。
- **「老師還沒有在 Firebase 後台開啟 Google 登入」**：步驟一還沒做或沒有儲存。
- **「這個網站還沒有被允許使用 Google 登入」**：步驟二還沒做，或網域拼錯。
- **學校提供的 Google 帳號進不去**：學校的 Google Workspace 管理員有可能禁止登入第三方網站，這種學生請用名字＋密碼。
- **兩種登入可以一起用**：沒連結 Google 的學生照舊用名字（和密碼）。連結後的學生兩種都能用。
- **共用裝置**：學生按右上角「離開」會一併登出 Google，下一位同學不會自動進到他的帳號。

## 安全提醒

這是「應用程式層級」的確認：能防止一般情況的冒名（沒被你確認的 Google 帳號進不了班級）。但目前資料庫規則是「登入過的人都能讀寫」，懂技術的人還是可能繞過。若之後要真正的資料保護，需要把規則改成依每位學生的登入身分限制，那是另一個階段。
