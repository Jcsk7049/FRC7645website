# FRC Team 7645 — NKMTC Official Website

網站連結：https://team7645.web.app

---

## 給新加入的開發夥伴

這份說明會帶你從零開始，在自己的電腦上把開發環境跑起來。

---

## 第一步：安裝必要軟體

以下三個東西需要先裝好（已裝可跳過）：

### 1. Node.js
> 這是執行這個網站所需的 JavaScript 執行環境。

前往 https://nodejs.org/，下載 **LTS** 版本並安裝。
安裝完之後開啟終端機（Windows: PowerShell，Mac: Terminal），輸入：
```
node -v
```
如果出現版本號碼（例如 `v22.x.x`）就代表安裝成功。

### 2. Git
> 用來下載（clone）和同步程式碼。

前往 https://git-scm.com/downloads，下載並安裝。
安裝完輸入：
```
git -v
```
出現版本號碼就成功。

### 3. VS Code（推薦）
> 程式碼編輯器，不一定要用但強烈推薦。

前往 https://code.visualstudio.com/ 下載安裝。

---

## 第二步：下載專案

開啟終端機，切換到你想放專案的資料夾，然後輸入：

```bash
git clone https://github.com/CHU-BO-YU/team7645-website.git
cd team7645-website
npm install
```

`npm install` 會自動下載所有需要的套件，等它跑完（可能需要 1–2 分鐘）。

---

## 第三步：設定環境變數（.env 檔）

專案需要一個 `.env` 檔來連接 Firebase 資料庫。這個檔案**不會在 GitHub 上**，需要向專案負責人索取。

拿到內容之後，在專案資料夾裡新建一個叫 `.env` 的檔案，把內容貼進去，存檔。

> **重要：** 這個檔案包含私鑰，絕對不能上傳到 GitHub，也不能分享給不相關的人。

`.env` 的格式長這樣（值請向負責人索取，不要自己填）：
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_TBA_KEY=...
```

---

## 第四步：在本機跑起來

```bash
npm run dev
```

執行後終端機會顯示一個網址，通常是 `http://localhost:5173`，用瀏覽器打開就能看到網站了。

> 儲存程式碼的當下，瀏覽器會自動重新整理（Hot Module Replacement）。

---

## 第五步：取得網站帳號

到 https://team7645.web.app 用你的 Gmail 或 Email 註冊一個帳號，然後請負責人在後台把你的角色設定為 `teacher` 或 `admin`，這樣你才能進入 CMS 管理內容。

---

## 分支架構

這個專案有兩條主要分支：

```
master  ← 穩定版本，只有確認沒問題才合併進來，部署時用這條
dev     ← 日常開發主線，兩人平時都在這裡工作
```

**clone 完之後，記得切換到 `dev` 分支：**

```bash
git checkout dev
```

---

## 日常開發流程

### 開始工作前：先同步最新的程式碼
```bash
git pull
```

> 每次開始工作前都要先 pull，避免和對方的版本差太多，之後合併時衝突很難處理。

### 做一個新功能：開一條 feature 分支

如果要做比較大的改動（例如新增一個頁面），建議從 `dev` 開一條自己的分支：

```bash
# 從 dev 建立新分支
git checkout -b feature/你的功能名稱

# 做完之後，切回 dev 並合併
git checkout dev
git merge feature/你的功能名稱

# 推上去
git push
```

小修改（改文字、修 bug）直接在 `dev` 上改就好，不用特別開分支。

### 完成修改後：存到 GitHub
```bash
git add .
git commit -m "說明你做了什麼"
git push
```

### 確認功能穩定後，合併到 master 並部署

```bash
# 切到 master
git checkout master

# 把 dev 的內容合進來
git merge dev

# 推上去
git push

# 打包並部署到線上
npm run build
firebase deploy --only hosting

# 部署完切回 dev 繼續開發
git checkout dev
```

### 部署網站（把改動更新到線上）

部署是把你本機的程式碼打包，上傳到 Firebase，讓 https://team7645.web.app 更新。

**第一次部署前，需要先做一次性設定：**

```bash
# 1. 安裝 Firebase CLI 工具
npm install -g firebase-tools

# 2. 登入你的 Google 帳號（需和被加入 Firebase 專案的帳號相同）
firebase login
```

登入後，Firebase CLI 會自動和 `team7645` 專案連接（設定已在 `.firebaserc` 裡）。

**之後每次部署：**

```bash
# 1. 打包成正式版
npm run build

# 2. 上傳到 Firebase Hosting
firebase deploy --only hosting
```

> `npm run build` 不會更新線上網站，只是在本機產生 `dist/` 資料夾（打包結果）。一定要接著跑 `firebase deploy` 才會真的更新到線上。

**只部署 Firestore 安全規則（如果有改 `firestore.rules`）：**

```bash
firebase deploy --only firestore:rules
```

---

## CMS 內容管理

登入 `teacher` 或 `admin` 帳號後，點選導覽列右上角的帳號按鈕，選擇「內容管理」。

可以管理的內容包括：
- **首頁** — 輪播圖、Bento 資訊卡
- **關於我們** — 團隊簡介、核心價值、歷史
- **機器人** — 每年賽季的機器人資料、3D 模型
- **部落格** — 文章（支援 Markdown）
- **指導老師** — 老師資料、照片、聯絡方式
- **各分組** — 各子組別的介紹
- **合作夥伴** — 贊助商 Logo、贊助分級
- **聯絡資訊** — Email、地址、社群連結

中文欄位填好之後，點「自動翻譯」可以自動產生英文版。

---

## Firebase 資料庫結構

> **重要：** 資料庫的資料請透過網站的 CMS 介面修改，**不要直接在 Firebase Console 手動編輯**，避免欄位錯誤或資料格式不符。

網站使用 Firebase Firestore 儲存所有內容，以下是各集合（Collection）的用途與欄位說明。

### `robots/{year}`
每一個文件代表一個賽季的機器人，文件 ID 就是年份（例如 `2024`）。

| 欄位 | 類型 | 說明 |
|---|---|---|
| `name` | string | 機器人名稱（中） |
| `name_en` | string | 機器人名稱（英） |
| `year` | number | 賽季年份 |
| `desc` | string | 機器人介紹（中，Markdown） |
| `desc_en` | string | 機器人介紹（英，Markdown） |
| `coverUrl` | string | 封面圖片 URL |
| `modelUrl` | string | 3D GLB 模型檔案 URL |
| `specs` | array | 規格列表，每項 `{ label, value }` |

---

### `blog/{postId}`
部落格文章，文件 ID 由 Firestore 自動產生。

| 欄位 | 類型 | 說明 |
|---|---|---|
| `title` | string | 標題（中） |
| `title_en` | string | 標題（英） |
| `body` | string | 內文（中，Markdown） |
| `body_en` | string | 內文（英，Markdown） |
| `category` | string | 分類標籤 |
| `coverUrl` | string | 封面圖片 URL |
| `published` | boolean | `true` = 公開，`false` = 草稿 |
| `createdAt` | timestamp | 建立時間 |

---

### `sponsors/{sponsorId}`
贊助商列表，文件 ID 由 Firestore 自動產生。

| 欄位 | 類型 | 說明 |
|---|---|---|
| `name` | string | 贊助商名稱 |
| `logo` | string | Logo 圖片 URL |
| `url` | string | 官網連結（選填） |
| `tier` | string | 對應 `settings/contact` 中 `tiers[].key`（選填，空 = 不分類） |

---

### `bento_cards/{id}`
首頁 Bento 資訊卡，文件 ID 由 Firestore 自動產生。

| 欄位 | 類型 | 說明 |
|---|---|---|
| `title` | string | 標題（中） |
| `title_en` | string | 標題（英） |
| `desc` | string | 說明（中） |
| `desc_en` | string | 說明（英） |
| `link` | string | 點擊連結（空 = 不可點；`http://...` = 外部；其他 = 內部路徑如 `robot`） |
| `imageUrl` | string | 背景圖片 URL（選填） |
| `order` | number | 排列順序 |
| `size` | string | 卡片大小（`normal` / `wide` / `tall`） |

---

### `pages/about`
關於我們頁面的文字內容，這是一個單一文件（不是集合）。

| 欄位 | 類型 | 說明 |
|---|---|---|
| `heroTitle` | string | 頁面大標（中） |
| `heroTitle_en` | string | 頁面大標（英） |
| `heroDesc` | string | 副標說明（中） |
| `heroDesc_en` | string | 副標說明（英） |
| `history` | string | 歷史介紹（中，Markdown） |
| `history_en` | string | 歷史介紹（英，Markdown） |
| `values` | array | 核心價值，每項 `{ title, title_en, desc, desc_en }` |

---

### `divisions/{divId}`
各子組別（例如機械組、程式組），文件 ID 由 Firestore 自動產生。

| 欄位 | 類型 | 說明 |
|---|---|---|
| `name` | string | 組別名稱（中） |
| `name_en` | string | 組別名稱（英） |
| `desc` | string | 介紹內文（中，Markdown） |
| `desc_en` | string | 介紹內文（英，Markdown） |
| `coverUrl` | string | 封面圖片 URL（選填） |
| `order` | number | 排列順序 |

---

### `mentors/{mentorId}`
指導老師，文件 ID 由 Firestore 自動產生。

| 欄位 | 類型 | 說明 |
|---|---|---|
| `name` | string | 姓名 |
| `subject` | string | 擔任科目（選填） |
| `bio` | string | 簡介（選填） |
| `photo` | string | 大頭照 URL（選填） |
| `email` | string | Email（選填） |
| `phone` | string | 電話（選填） |
| `startYear` | number | 加入年份 |
| `endYear` | number | 離開年份（選填，有填 = 已退休） |
| `order` | number | 排列順序 |

---

### `settings/socials`
社群平台連結，這是一個單一文件。

| 欄位 | 說明 |
|---|---|
| `instagram` | Instagram 頁面 URL |
| `facebook` | Facebook 頁面 URL |
| `youtube` | YouTube 頻道 URL |
| `github` | GitHub 組織 URL |
| `tba` | The Blue Alliance 隊伍頁面 URL |
| `first` | FIRST Inspires 頁面 URL |

---

### `settings/contact`
聯絡資訊與贊助分級，這是一個單一文件。

| 欄位 | 類型 | 說明 |
|---|---|---|
| `email` | string | 聯絡 Email |
| `phone` | string | 聯絡電話（選填） |
| `address` | string | 地址（中） |
| `address_en` | string | 地址（英） |
| `packetUrl` | string | 贊助企劃 PDF 下載連結（選填） |
| `showTiers` | boolean | 是否在聯絡頁顯示贊助分級 |
| `tiers` | array | 贊助分級，每項 `{ key, tier, amount, desc }` |

---

### `users/{uid}`
網站使用者資料，文件 ID 等於 Firebase Auth 的 UID。

| 欄位 | 類型 | 說明 |
|---|---|---|
| `role` | string | `admin` / `teacher` / `student`（預設新用戶為 `pending`，需管理員升級） |
| `email` | string | 使用者 Email |
| `displayName` | string | 顯示名稱 |

> **角色說明：**
> - `admin` — 最高權限，可管理帳號、所有內容
> - `teacher` — 可使用 CMS 編輯內容，無法管理帳號
> - `student` — 一般成員，無 CMS 權限
> - `pending` — 剛註冊、尚未審核，無任何權限

---

## 技術架構（參考用）

| 層面 | 使用技術 |
|---|---|
| 前端框架 | React 19 + Vite 8 |
| 路由 | React Router v7 |
| 樣式 | 純 CSS |
| 資料庫 | Firebase Firestore |
| 登入驗證 | Firebase Auth |
| 檔案儲存 | Firebase Storage（圖片、3D 模型）|
| 網站託管 | Firebase Hosting |
| 多語言 | react-i18next（中文 / 英文）|
| 競賽資料 | The Blue Alliance API |

---

## 常見問題

**Q: `npm install` 跑很久或失敗？**
確認 Node.js 版本是 18 以上（`node -v`），然後試試 `npm install --legacy-peer-deps`。

**Q: 網站打開是空白或有錯誤？**
通常是 `.env` 沒有設定好，確認檔案在專案根目錄且內容正確。

**Q: 改了程式碼但網站沒有變？**
確認 `npm run dev` 還在執行中，並且瀏覽器看的是 `localhost:5173`，不是 `team7645.web.app`。

**Q: push 被拒絕（rejected）？**
先 `git pull` 把別人的最新版本抓下來，解決衝突後再 push。
