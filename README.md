# 🎧 MUSIC DJ AGENT V1

一個專為深夜打造的 AI 音樂電台。使用自然語言描述你的心情或想聽的曲風，AI DJ 會為你挑選最合適的歌曲，並直接從 YouTube Music 串流播放。
(練習調用LLM 與 youtube music api 的小作品)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)

## ✨ 特色功能

- **自然語言點歌**：支援「來點深夜 chill 的音樂」、「想聽周杰倫的慢歌」等模糊需求。
- **混合隊列機制 (Hybrid Queue)**：搜尋時優先填充前 5 筆最相關結果，確保播放內容高度符合描述。
- **無縫廣播模式 (Radio Mode)**：當搜尋結果播放完畢，系統自動切換至 YouTube Music 相關推薦，實現無限續播。
- **多模型支援**：整合 OpenAI SDK，支援 DeepSeek、GPT-4o-mini、Gemini 等主流模型。
- **沉浸式體驗**：專為深夜設計的深色模式 UI，採用 YouTube IFrame API 實現精準的播放狀態監控與自動轉場。
- **智慧容錯解析**：具備強健的 LLM JSON 解析與意圖辨識，支援中英文混合點歌。

## 🚀 快速開始

### 1. 前置需求
- [Node.js](https://nodejs.org/) (v18 或更高版本)
- [npm](https://www.npmjs.com/)

### 2. 安裝
clone 專案後，在根目錄執行：
```bash
npm install
```

### 3. 環境設定
進入 `apps/server` 資料夾，將 `.env.example` 複製並更名為 `.env`：
```bash
cp apps/server/.env.example apps/server/.env
```
編輯 `.env` 填入您的 API Key：
```env
OPENAI_API_KEY=sk-...           # 用於 OpenAI 或 DeepSeek
GEMINI_API_KEY=                 # 用於 Gemini 模式
LLM_PROVIDER=deepseek           # 可選: openai | deepseek | gemini | local
```

### 4. 啟動開發伺服器
在根目錄執行：
```bash
npm run dev
```
- **前端介面**: http://localhost:3000
- **後端 API**: http://localhost:4000

## 🛠 核心技術棧

- **Monorepo 管理**: npm workspaces
- **前端**: Next.js 15 (App Router), React 19, TailwindCSS, YouTube IFrame Player API
- **後端**: Express 4 (ESM), TypeScript, OpenAI SDK
- **音樂搜尋**: `ytmusic-api` (支援搜尋與相關曲目推薦)
- **開發工具**: `tsx`, `concurrently` (已配置自動終止關聯程序)

## 📝 開發與架構規範

- **無分號 (No Semicolons)**：全專案遵守無分號 JavaScript 風格。
- **穩定性優化**：播放器容器常駐 DOM，透過 CSS 控制顯示隱藏，確保 IFrame 實體不因 React 渲染而毀損。
- **狀態管理**：使用 `useRef` 同步播放隊列，解決非同步 API 回呼中的閉包過時問題。
- **ESM 模組**：後端引用本地檔案需包含 `.js` 副檔名。

## 🛑 常見問題 (Troubleshooting)

**Q: 出現 `EADDRINUSE` Port 佔用錯誤？**
A: `npm run dev` 已配置 `--kill-others`。若仍有殘留程序，請執行：
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess -Force
```

**Q: 自動播放沒有聲音？**
A: 現代瀏覽器通常阻擋未經互動的自動播放。請在頁面首次加載後，點擊頁面任何地方或手動點擊一次播放按鈕。

## 📄 授權協議

本專案採用 [MIT License](LICENSE) 授權。
