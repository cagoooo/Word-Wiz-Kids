# 🧙‍♂️ Word-Wiz-Kids 兒童英語單字大冒險

![GitHub Pages Deployment](https://img.shields.io/badge/Deployment-GitHub%20Pages-brightgreen)
![Firebase Integrated](https://img.shields.io/badge/Backend-Firebase-orange)
![Gemini 2.5 Flash Lite](https://img.shields.io/badge/AI-Gemini%202.5%20Flash%20Lite-purple)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

> 一款專為國小兒童設計的魔法英語單字學習與競賽平台，結合 Gemini 2.5 Flash Lite 視覺 AI 辨識、Firebase 雲端排行榜與生動活潑的遊戲化體驗！

---

## 🔗 線上體驗網址 (Live Demo)

👉 **點此立即體驗：** [https://cagoooo.github.io/Word-Wiz-Kids/#/](https://cagoooo.github.io/Word-Wiz-Kids/#/)

---

## ✅ 已完成開發進度與里程碑 (Completed Milestones)

| 類別 | 功能 / 技術項目 | 說明與現狀 | 狀態 |
| :--- | :--- | :--- | :---: |
| **部署與 CI/CD** | **GitHub Actions + Pages 部署** | 設定自動化工作流，push 至 main 自動發布至 `gh-pages` 分支 | ✅ 完成 |
| **前端路由** | **Wouter Hash Router (`#/`)** | 重構為 `useHashLocation`，徹底根治 GitHub Pages 子目錄白屏與 404 問題 | ✅ 完成 |
| **PWA 與快取** | **ServiceWorker 自癒與更新通告** | 實現 `pwa-cache-bust`，偵測新版滑出「🎉 發現新版單字小英雄！」通知，支援手動 skipWaiting 與舊 SW 自動解綁 | ✅ 完成 |
| **UI與社群資產** | **AI 生成 Favicons 與 OG 卡片** | 製作 3D 魔法貓頭鷹圖示、高清向量 SVG 及 1200x630 LINE/FB/Twitter 滿版社群分享卡片 | ✅ 完成 |
| **後端雲端** | **Firebase Secrets 安全串接** | 7 組 Firebase 配置參數全數寫入 GitHub Repository Secrets，打包時自動動態注入，源碼庫 0 金鑰硬編碼 | ✅ 完成 |
| **AI 視覺辨識** | **Gemini 2.5 Flash Lite 直連** | 上傳課本/字卡照片，AI 自動辨識英文單字、繁中註釋、KK音標與詞性，支援 Secrets 或後台手動填寫 API Key | ✅ 完成 |

---

## ✨ 專案核心亮點 (Features)

- 🎨 **生動活潑的視覺設計**：精美的卡片與流暢動畫，提升兒童學習專注度。
- 🤖 **Gemini 2.5 Flash Lite 圖片辨識**：拍攝字卡或課本頁面，AI 自動辨識單字並自動標註 KK 音標與繁體中文。
- 🔥 **Firebase 雲端同步與排行榜**：學生學習與遊戲得分即時同步雲端資料庫。
- 📱 **響應式跨裝置支援 (RWD)**：無論是平板、手機還是電腦，均能獲得最佳瀏覽體驗。

---

## 🛠️ 技術架構 (Tech Stack)

- **前端框架**：React 18 + TypeScript + Wouter (Hash Mode)
- **建置工具**：Vite 6 + Tailwind CSS v4 + Radix UI + Lucide Icons
- **後端與 AI**：Firebase (Firestore & Realtime DB) + Google Gemini 2.5 Flash Lite Vision API
- **套件管理**：pnpm workspace
- **自動化部署**：GitHub Actions + GitHub Pages (Secrets Injected)

---

## 👨‍🏫 作者資訊 (Author)

- **作者**：阿凱老師 (cagoooo)
- **GitHub**：[https://github.com/cagoooo](https://github.com/cagoooo)
