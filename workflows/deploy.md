# Workflow: 建置與部署

## 目標
將最新程式碼建置為生產版本，並部署至 Firebase Hosting（team7645.web.app）。

## 必要條件
- Node.js 18+
- Firebase CLI 已登入（`firebase login`）
- `.env` 已設定所有 `VITE_FIREBASE_*` 與 `VITE_TBA_KEY`

## 執行步驟

### 1. 安裝相依套件（首次或 package.json 有變更時）
```bash
npm install
```

### 2. 建置生產版本
```bash
npm run build
```
產出目錄：`dist/`

### 3. 本地預覽（可選）
```bash
npm run preview
```

### 4. 部署至 Firebase Hosting
```bash
firebase deploy --only hosting
```

### 4b. 僅更新 Firestore 規則
```bash
firebase deploy --only firestore:rules
```

## 邊緣案例與注意事項
- 若 `build` 失敗，先跑 `npm run lint` 確認語法錯誤
- 若 Firebase 部署報 quota 錯誤，等待 1 分鐘後重試
- 環境變數必須以 `VITE_` 開頭，否則 Vite 不會注入至前端

## 預期輸出
- `https://team7645.web.app` 更新為最新版本
- Firebase Console → Hosting 顯示新部署記錄
