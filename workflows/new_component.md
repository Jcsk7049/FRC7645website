# Workflow: 新增頁面元件

## 目標
依照 FRC7645 架構規範，新增一個新的頁面元件（React component）。

## 必要條件
- 熟悉 React 19 hooks
- 了解 Firestore onSnapshot / getDoc 模式
- 了解 i18next 翻譯架構

## 執行步驟

### 1. 建立元件檔案
路徑：`src/components/MyPage.jsx`

最小元件模板：
```jsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function MyPage() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, "collection", "docId")).then(snap => {
      if (snap.exists()) setData(snap.data());
    }).catch(console.warn).finally(() => setLoading(false));
  }, []);

  return (
    <main className="container" id="mypage-page" style={{ paddingTop: "40px", paddingBottom: "80px" }}>
      <span className="badge">BADGE</span>
      <h1>{t("myPage.pageTitle")}</h1>
    </main>
  );
}
```

### 2. 新增路由（App.jsx）
```jsx
import MyPage from "./components/MyPage";
// 在 <Routes> 中加入：
<Route path="/mypage" element={<MyPage />} />
```

### 3. 新增 Navbar 連結（Navbar.jsx）
在 `nav` 區塊加入 `<NavLink to="/mypage">`。

### 4. 新增翻譯字串
- `src/locales/zh.json` → 加入 `"myPage": { "pageTitle": "..." }`
- `src/locales/en.json` → 加入對應英文

### 5. 新增 CMS 管理區塊（可選）
在 `src/components/CMS.jsx` 加入新的 sidebar 項目與對應 panel。

## 關鍵規則
- **TDZ 陷阱**：若元件同時 import i18n 且用 `useTranslation()`，不要從 hook 解構 `i18n`（見 CLAUDE.md）
- **Tiptap**：`StarterKit.configure({ link: false })` 避免重複擴充
- **bento-card class**：所有卡片使用此 class，避免寫死樣式
- Firestore 讀取失敗要用 `console.warn` 不是 `throw`

## 預期輸出
- 新頁面在 `/mypage` 可正常訪問
- 中英文切換正常
- 在未登入狀態可正常瀏覽（若為公開頁面）
