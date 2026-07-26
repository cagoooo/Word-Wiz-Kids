# 單字小英雄 (VocabKids)

台灣兒童英文單字學習平台，透過遊戲化方式（Kahoot 風格）幫助 5–10 歲小朋友學習英文單字，結合 Three.js 3D 動畫、TTS 發音、Firebase 即時排行榜與 Gemini Vision 後台辨識。

## Run & Operate

- `pnpm --filter @workspace/vocab-kids run dev` — 執行前端 (port 22362)
- `pnpm --filter @workspace/api-server run dev` — 執行 API Server (port 8080)
- `pnpm run typecheck` — 全專案 TypeScript 型別檢查
- `pnpm run build` — 建置全部套件

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- 前端：React + Vite、Three.js / @react-three/fiber、framer-motion、wouter、Tailwind CSS
- 後端：Express 5（API Server，Task #4 後主要改用 Firebase）
- 資料庫：Firebase Firestore（Task #4 串接，需填入 VITE_FIREBASE_* 環境變數）
- AI：Gemini 2.5 Flash（Task #5 後台圖片辨識）
- PWA：manifest.webmanifest + Service Worker

## Where things live

- `artifacts/vocab-kids/` — 前端 React 應用程式
  - `src/pages/` — 各頁面：首頁、學習、遊戲、排行榜、管理
  - `src/components/hero/HeroScene.tsx` — Three.js 3D 首頁動畫
  - `src/components/layout/Navbar.tsx` — 導覽列（含手機漢堡選單）
  - `public/manifest.webmanifest` — PWA 設定
  - `public/sw.js` — Service Worker（cache-first 策略）
- `artifacts/api-server/` — Express API Server
- `lib/api-spec/openapi.yaml` — API 合約（單一真實來源）
- `lib/db/src/schema/` — Drizzle ORM 資料庫 Schema

## Architecture decisions

- Firebase 作為主要後端（Task #4），Express API Server 保留供非 Firebase 功能使用
- Gemini API Key 以環境變數（VITE_GEMINI_API_KEY）管理，或透過 Replit Gemini Integration
- Service Worker 採 cache-first 策略，版本號碼在 `public/sw.js` 中的 CACHE_NAME 控制
- Three.js 場景在無 WebGL 環境下（如測試沙盒）自動降級為 CSS 動畫背景
- 全介面採繁體中文

## Product

- **首頁** (`/`)：Three.js 3D 動畫主視覺 + 功能介紹卡
- **學習** (`/learn`)：單字卡學習模式，含 TTS 發音與音標高亮（Task #2）
- **遊戲** (`/game`)：Kahoot 風格四選一測驗、計時計分、Combo（Task #3）
- **排行榜** (`/leaderboard`)：Firebase 即時排名（Task #4）
- **管理** (`/admin`)：PIN 碼保護後台，Gemini Vision 單字辨識（Task #5）

## User preferences

- 全介面使用繁體中文（台灣用語）
- 品牌名稱：單字小英雄

## Gotchas

- 修改 Service Worker 快取策略後，需同步更新 `CACHE_NAME` 版本號碼避免舊快取問題
- Three.js WebGL 在 Replit 預覽沙盒中無法使用，已實作 CSS 星點動畫作為 fallback
- Firebase 環境變數尚未設定，Task #4 完成後填入即可
- PWA 圖示存於 `artifacts/vocab-kids/public/`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
