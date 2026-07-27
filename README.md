# 🧙‍♂️ Word-Wiz-Kids 兒童英語單字大冒險

![GitHub Pages Deployment](https://img.shields.io/badge/Deployment-GitHub%20Pages-brightgreen)
![Firebase Integrated](https://img.shields.io/badge/Backend-Firebase-orange)
![Gemini 2.5 Flash Lite](https://img.shields.io/badge/AI-Gemini%202.5%20Flash%20Lite-purple)
![Web Speech TTS](https://img.shields.io/badge/Audio-Web%20Speech%20TTS-blue)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

> 一款專為國小兒童設計的魔法英語單字學習與競賽平台，結合 Gemini 2.5 Flash Lite 視覺 AI 辨識、真人美音朗讀、等級成就系統、教師 CSV 匯入導出與 Firebase 雲端排行榜！

---

## 🔗 線上體驗網址 (Live Demo)

👉 **點此立即體驗：** [https://cagoooo.github.io/Word-Wiz-Kids/#/](https://cagoooo.github.io/Word-Wiz-Kids/#/)

---

## ✅ 已完成開發進度與里程碑 (Completed Milestones)

| 類別 | 功能 / 技術項目 | 說明與成果 | 狀態 |
| :--- | :--- | :--- | :---: |
| **部署與 CI/CD** | **GitHub Actions + Pages** | 自動化流水線，`push main` 自動編譯發布至 `gh-pages` 分支 | ✅ 完成 |
| **前端路由** | **Wouter Hash Router (`#/`)** | 重構為 `useHashLocation`，100% 根治 GitHub Pages 子目錄白屏問題 | ✅ 完成 |
| **PWA 與快取** | **SW 自癒與更新通告** | 實現 `pwa-cache-bust`，偵測新版滑出通知，支援手動 skipWaiting 與舊 SW 自動解綁 | ✅ 完成 |
| **UI 與社群** | **AI 生成 Favicons & OG 卡片** | 產出 3D 魔法貓頭鷹圖示、向量 SVG 及 1200x630 LINE/FB 滿版社群分享卡片 | ✅ 完成 |
| **後端雲端** | **Firebase Secrets 安全串接** | 7 組連線參數全數寫入 GitHub Repository Secrets，打包動態注入，0 金鑰洩漏 | ✅ 完成 |
| **AI 視覺辨識** | **Gemini 2.5 Flash Lite** | 上傳課本/字卡照片，AI 自動提取英文單字、繁中註釋、KK音標與詞性分類 | ✅ 完成 |
| **語音朗讀 (P0)** | **真人美音 & 慢速朗讀 (TTS)** | 點擊播放純正美音朗讀，提供慢速朗讀 (🐢) 按鈕幫助兒童聽清發音細節 | ✅ 完成 |
| **遊戲化 (P0)** | **等級 EXP / 打卡 / 成就殿堂** | 冒險者 Level & EXP 進度條、連續登入打卡天數 (`🔥 Streak`) 與 8 款成就徽章 | ✅ 完成 |
| **教師管理 (P0)** | **一鍵批次匯入/導出 CSV** | 提供「單字庫匯入範本.csv」，支援一鍵批次匯入全冊單字與導出備份 | ✅ 完成 |

---

## ✨ 專案核心亮點 (Features)

- 🎨 **生動活潑的視覺設計**：精美的卡片與流暢動畫，提升兒童學習專注度。
- 🤖 **Gemini 2.5 Flash Lite 圖片辨識**：拍攝字卡或課本頁面，AI 自動辨識單字並自動標註 KK 音標與繁體中文。
- 🔊 **正統美音與慢速發音**：支援慢速與正常美語發音。
- 🎖️ **遊戲化等級與成就系統**：提升學習樂趣，激勵學生每日連續打卡學習。
- 📄 **教師一鍵 CSV 批次管理**：輕鬆管理與匯入全校各年級英文單字。
- 🔥 **Firebase 雲端同步與排行榜**：學生學習與遊戲得分即時同步雲端資料庫。

---

## 🛠️ 技術架構 (Tech Stack)

- **前端框架**：React 18 + TypeScript + Wouter (Hash Mode)
- **建置工具**：Vite 6 + Tailwind CSS v4 + Radix UI + Lucide Icons
- **後端與 AI**：Firebase (Firestore & Realtime DB) + Google Gemini 2.5 Flash Lite Vision API + Web Speech TTS
- **套件管理**：pnpm workspace
- **自動化部署**：GitHub Actions + GitHub Pages (Secrets Injected)

---

## 👨‍🏫 作者資訊 (Author)

- **作者**：阿凱老師 (cagoooo)
- **GitHub**：[https://github.com/cagoooo](https://github.com/cagoooo)
