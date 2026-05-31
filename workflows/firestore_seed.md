# Workflow: Firestore 資料初始化

## 目標
使用 scripts/ 工具腳本為 Firestore 建立初始資料，包含機器人、組別、老師等集合。

## 必要條件
- `GOOGLE_APPLICATION_CREDENTIALS` 已設定（服務帳戶金鑰）
- 或使用 Firebase Admin SDK + service account JSON
- Node.js 18+

## 可用工具（scripts/）

| 腳本 | 功能 |
|------|------|
| `scripts/seed_robot_2027.cjs` | 新增 2027 賽季機器人資料 |
| `scripts/gen_robot_model.cjs` | 生成示範 3D 模型（.glb） |
| `scripts/gen_demo_glb.cjs` | 生成示範 GLB 檔案 |

## 執行步驟

### 新增機器人資料
```bash
node scripts/seed_robot_2027.cjs
```

### 建立 3D 模型
```bash
node scripts/gen_robot_model.cjs
node scripts/gen_demo_glb.cjs
```

## Firestore 集合結構參考

```
robots/{year}
  name: string          # 機器人名稱
  game: string          # 競賽主題
  drivetrain: string    # 底盤類型
  weight: string        # 重量
  imageUrl: string      # 封面圖 URL
  modelUrl: string      # .glb 3D 模型 URL（可選）
  specs: object         # 其他技術規格

divisions/{divId}
  name: string          # 組別名稱（中文）
  name_en: string       # 組別名稱（英文）
  description: string   # Markdown 內文（中文）
  description_en: string
  coverImage: string    # 封面圖 URL
  order: number         # 排列順序

mentors/{mentorId}
  name: string
  subject: string
  startYear: number
  endYear: number|null  # null = 至今
  photo: string
  bio: string
  order: number
```

## 邊緣案例
- 若文件已存在，腳本會以 `setDoc` 覆寫
- 圖片需另行上傳至 Firebase Storage 並取得 URL 後填入
- 建議在開發環境（Firebase emulator）測試後再操作正式資料庫
