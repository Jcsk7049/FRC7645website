# Team 介紹頁重設計計畫

## 路由結構

```
/team              — 隊伍總覽（歷史段落 + 核心價值 + TBA 時間軸 + 各組預覽 grid）
/team/mentor       — 指導老師（獨立頁）
/team/:groupId     — 各組獨立頁面（動態，CMS 管理）
/about             → redirect → /team
```

## Navbar

- 「團隊介紹」放在「首頁」右邊，點擊展開 dropdown
- Dropdown 結構（組別從 Firestore 動態載入）：

```
團隊介紹 ▾
  ├─ 隊伍總覽    → /team
  ├─ 指導老師    → /team/mentor
  ├─ ─────────
  ├─ 機構組      → /team/mechanics   （動態）
  ├─ 電控組      → /team/electrical  （動態）
  └─ ...
```

- Divisions 在 App 層級預先載入並傳給 Navbar，避免 dropdown 開啟時閃爍
- 現有 NavLink 順序改為：首頁 → 團隊介紹▾ → 機器人 → 部落格 → 贊助商 → 聯絡我們

## 頁面設計

### /team（隊伍總覽）
- Hero：badge + 標題 + 短描述（CMS 可編輯）
- 隊伍歷史段落（從現有 /about 移過來）
- 核心價值 3 格 grid（從現有 /about 移過來）
- TBA 賽事時間軸（從 /about 移過來）
- 各組預覽 grid（bento cards，連結到 /team/:groupId）

### /team/mentor（指導老師）
- 每位老師一張卡片
- 欄位：姓名、負責科目、服務年限（起始年 → 結束年，空白 = 至今）、照片、簡介
- 支援多位老師（含已離任者）

### /team/:groupId（各組頁面）
- 上方封面圖（可上傳）
- 下方 Tiptap 內文（markdown 格式，與 Blog 相容）

## Firestore 資料結構

```
divisions/{docId}
  name: string
  name_en: string
  description: string          # markdown 字串
  description_en: string
  coverImage: string           # URL
  order: number                # 排列順序

pages/team
  heroDesc: string
  heroDesc_en: string
  paragraphs: string[]         # 歷史段落
  paragraphs_en: string[]
  coreValues: [{title, desc, title_en, desc_en}]
  mentors: [{
    name: string
    subject: string
    startYear: number
    endYear: number | null     # null = 至今
    photo: string              # URL
    bio: string
  }]
```

## CMS 新增區塊

### 組別管理
- 新增 / 刪除組別
- 編輯：名稱（中/英）、封面圖上傳、內文 Tiptap（中/英）
- 排列順序（order 欄位）

### 指導老師管理
- 新增 / 刪除老師
- 編輯：姓名、科目、起始年、結束年（空白 = 至今）、照片、簡介

### 隊伍總覽內容（移入現有 About CMS 區塊）
- Hero 描述（中/英）
- 歷史段落
- 核心價值

## 首頁 bento cards

- 從 Firestore `divisions` 動態讀取，有幾組顯示幾張，點擊連結 /team/:groupId
- 若無資料則 fallback 到目前的靜態預設內容

## 技術選型

| 需求 | 方案 |
|------|------|
| 組別內文編輯 | Tiptap + tiptap-markdown |
| 存取格式 | Markdown 字串（與 Blog 相容） |
| Divisions 資料載入 | App 層級一次載入，prop 傳給 Navbar |

## 待確認

- [x] 成員名單 — 不做
- [x] TBA 時間軸 — 保留，搬到 /team
