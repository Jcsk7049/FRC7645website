# Workflow: 網站內容更新

## 目標
透過 CMS（內容管理中心）或直接 Firestore 操作，更新網站各頁面的文字、圖片、組別資訊。

## 必要條件
- Firebase 帳號具備 `admin` 或 `teacher` 角色
- 已登入 `/login`

## 內容對應表

| 頁面 | Firestore 位置 | CMS 入口 |
|------|----------------|----------|
| 首頁輪播 | `bento_cards/{id}` | CMS → 首頁卡片 |
| 隊伍歷史/英雄區 | `pages/about` | CMS → 關於我們 |
| 各組介紹 | `divisions/{divId}` | CMS → 組別管理 |
| 指導老師 | `mentors/{mentorId}` | CMS → 老師管理 |
| 部落格文章 | `blog/{postId}` | CMS → 部落格 |
| 贊助商 | `sponsors/{sponsorId}` | CMS → 贊助商 |
| 社群連結 | `settings/socials` | CMS → 社群設定 |
| 聯絡資訊 | `settings/contact` | CMS → 聯絡設定 |

## 執行步驟

### 文字內容更新
1. 前往 `/cms`
2. 選擇對應區塊
3. 編輯欄位（支援中/英雙語）
4. 點擊「儲存」

### 圖片上傳
1. 在 CMS 對應欄位點擊上傳
2. 接受格式：JPG, PNG, WebP（建議 < 2MB）
3. 圖片自動上傳至 Firebase Storage，URL 寫入 Firestore

### 組別管理（新增/刪除）
1. CMS → 組別管理
2. 點擊「新增組別」填入：名稱（中/英）、封面圖、內文（Tiptap）
3. `order` 欄位控制 Navbar dropdown 與 /team 頁面排列順序

## 邊緣案例
- 圖片超過 5MB 會上傳失敗 → 請先壓縮
- 中文自動翻譯英文：點擊「Auto Translate」（使用 MyMemory，每次 ~500 字）
- IndexedDB 快取：若頁面顯示舊資料，強制重新整理（Ctrl+Shift+R）
