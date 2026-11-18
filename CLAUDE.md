# 麻醉誘島 — 給 Claude 的工作說明

麻醉誘島是 Megan 為麻醉專科護理師學員（SNA）做的 3D 互動學習網站。島嶼用 three.js 繪製：點選街區（科別），麻醉護理師小人會走過去；每個學習主題是一本書，點開就能閱讀；書裡附歷屆考古題和 AI 猜題。網站放在 GitHub Pages。

## 檔案結構

```
index.html          頁面骨架，依序載入下面的檔案（順序不能亂）
style.css           全部樣式
data/_index.js      總表：街區順序 sysOrder、主題順序 topicOrder、主題連結 links、alias
data/<街區id>.js    每個街區一個檔：街區本身（含 aiq＝AI 猜題）＋該街區所有主題
data/qbank.js       歷屆考古題，key＝年份＋G(通論)/A(進階)＋題號，例：115A34
data/scenarios.js   模擬開刀房的 OSCE 情境題（分支狀況圖，格式說明在檔案開頭）
js/assemble.js      把各街區檔組回 ISLAND_DATA = {sys, topics, links, alias}
js/icons.js         各街區的原創 SVG 醫學插圖
js/overview.js      麻醉對各器官系統影響的總覽表（OVERVIEW）
img/qrcode.svg      網站網址的 QR code（說明視窗用）
js/island.js        主程式：3D 島嶼、小人、書本、題目、音效、天氣
```

街區 id：resp 呼吸、cv 心血管、neuro 神經、pain 疼痛、pos 姿勢擺位、gi 腸胃、renal 腎臟、pharm 藥理、equip 設備、preop 術前評估、monitor 監測、ob 產科、age 小兒/老人、endoc 內分泌、fluid 輸液輸血、icu 重症、safety 病人安全。

專科手術島依科別分街區（每科一個書櫃）：cts 心臟血管外科、thor 胸腔外科、nsx 神經外科、ortho 骨科、plast 整形外科（燒傷）、gsx 一般外科與移植、uro 泌尿科、eye 眼科、ent 耳鼻喉科、trauma 外傷急診、amb 門診與手術室外。

## 改內容的規則（Megan 的固定要求）

- **器官系統島只放「全身麻醉對各器官系統的影響」；某一種手術怎麼麻醉，一律放專科手術島對應的科別。** 新的專科手術主題先看屬於哪一科，沒有對應科別就新增一個科別街區。
- **模擬開刀房的情境題要像 OSCE。** 小人走進手術室就自動開始；每個狀況四個選項，每個選項通往不同的狀況（病人反應不同），選錯有一次補救機會；病人心跳停止時一律接進 ACLS 流程（兒童用 PALS 劑量），ACLS 做錯才死亡；結尾有 OSCE 與 ACLS 評分表。題名與選項不能直接寫出診斷（要有鑑別度），診斷在結束畫面才顯示。手術室成員要會動；生理監視器只用麻醉機上那台，不要另外加儀器。情境隨機出題；選完立刻反映在病人身上（不另按「看反應」）；選項裡有「呼救」時要有廣播並讓麻醉主治醫師與三位 CRNA 衝進來；通關後和巡迴護理師推病人到恢復室，以 ISBAR 交班（每題的 isbar 欄位）。情境病人要包含兒童。
- **同一主題的所有來源都要整合成一本書。** Miller's Anesthesia 10e、Morgan & Mikhail 7e、之後的 UpToDate，全部融進同一個主題，不能分成幾本平行的書。
- **UI 上不單獨標出任何一本書。** 不要有 Morgan 專區或 Morgan 標籤。只有在不同來源對同一件事說法稍有出入時，才在內文註明「Miller」或「Morgan」。
- **每個主題要有 10 題 AI 猜題。** 新題放在該主題所屬街區檔的 `aiq` 最後面（不要改動既有題目的順序，金幣紀錄用「街區:題號」記），並加上 `"t": "<主題id>"` 指定歸屬的主題；`refs` 填相似考古題（沒有可留空陣列）。
- **AI 猜題的題目、選項、解析不要寫「依 Miller（Morgan）第幾章」之類的出處引述**，不是每個人都知道那是什麼。
- 內容一律用自己的話重點整理、改寫，不大段照貼教科書原文（網站是公開的）。
- 介面用繁體中文，醫學術語保留英文。

## 技術規則

- 只改需要改的檔案：加心血管的內容就只動 `data/cv.js`，不要碰 `island.js`。
- 新增主題：放進對應的 `data/<街區id>.js`，並把它的 id 加進 `data/_index.js` 的 `topicOrder`（沒加的話會排在最後）。
- 新增街區：建立 `data/<新id>.js`，加進 `index.html` 的 script 清單和 `_index.js` 的 `sysOrder`，`style.css` 加顏色變數，`island.js` 的 ISLAND_DEF 指定它在哪座島。
- 一律用一般的 `<script src>` 載入，不用 fetch 或 `type="module"` 的外部檔，這樣直接雙擊 `index.html` 也能開。
- 改完要開預覽確認：3D 島能載入、console 沒有錯誤、改到的書能正常打開。
- 學習進度存在瀏覽器的 localStorage：`island-coins`（答對題目，每題 10 金幣）、`island-bonus`（埋藏金幣與浮潛金幣每枚 0.1、撿垃圾每次 0.2、垃圾被海鷗或海龜吃掉扣 0.2）、`island-bag`（收集冊：key 是物品名稱、value 是數量；物品清單在 `island.js` 的 `COLLECT`，藥物、管路、血品、手術室夥伴之後要給模擬手術室使用）。測試時不要清掉使用者的這些紀錄。
- 網站放在 GitHub：儲存庫 megan9659186/anesthesia-island（main 分支根目錄），網址 https://megan9659186.github.io/anesthesia-island/ 。根目錄一定要有 `.nojekyll`，否則 `data/_index.js` 不會被發布、整座島載不出來。本機資料夾不是 git 儲存庫，目前是用 GitHub 網頁上傳檔案。
