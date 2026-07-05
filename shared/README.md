# MODUDRAFT 共用產品核心

## Estimate 模擬估價

- `estimate.js` 定義共用的 `EstimateItem`、`EstimateSection`、`EstimateDocument`、稅額計算、廚具／系統櫃轉換規則與 CSV／JSON 匯出。
- 金額只由明細加總；非「計價」或未勾選「計入總價」的項目不會加入合計。
- 配置變更使用 `sourceSignature` 標示估價需要更新，不會直接覆蓋手動修改；重新產生時仍保留手動新增項目。
- `estimate.css` 在桌面顯示明細工作台，手機改為可展開卡片並固定顯示合計、稅額與總計。
- 廚具與系統櫃共用同一套資料模型，`estimateDomain` 避免完整室內專案重複計價。

## 本次產品化層

- `help-system.js / help-system.css`：繁體中文教學中心、首次進入導覽、F1 說明，以及所有操作元件的長按／右鍵情境說明。
- 系統櫃工作台採四步流程：設定牆面、排列櫃體、內部配置、預覽交付；右側欄依目前選取內容切換，手機改用可收合 Bottom Sheet。
- 廚具與系統櫃共用 Project Schema、材質預設、專案中心、JSON 匯入匯出、設計檢查、AI 提示詞與客戶展示連結。
- 3D 舞台採連續地面與背景牆，不再出現有限大小的方形陰影；預設相機從工作面觀看並保留水平操作。

第一階段採「相容式重構」：廚具與系統櫃仍使用各自成熟的繪圖狀態，共用核心負責跨模式產品能力。

## 檔案

- `modudraft-core.js`：Project Schema v2、舊資料 migration、安全儲存、驗證、材質資料、估價文件、AI 提示詞、JSON 匯入匯出。
- `product-suite.js`：專案中心、最近專案、快速風格、設計檢查、AI 渲染提示詞與 URL 客戶展示資料。
- `design-system.css`：跨首頁、廚具與系統櫃共用的字體、色彩、互動、捲軸、唯讀狀態。
- `product-suite.css`：專案中心桌面側面板與手機 Bottom Sheet。

## 相容策略

`Project.sourceState` 保存原編輯器的完整狀態，`walls`、`cabinets`、`materials` 等標準欄位提供首頁、檢查、匯出及未來雲端 API 使用。第一階段不直接以新 Schema 取代舊渲染器，避免破壞既有尺寸與 3D 計算。

## 儲存鍵

- `modudraft:projects:v1`：最近專案索引。
- `modudraft:project:v1:{id}`：Project Schema v1 專案內容。
- 舊系統櫃 `modudraft-system-cabinet-v3/v4` 仍保留讀取相容性。

所有儲存與資料轉換都會清理 `NaN`、`Infinity` 與不可序列化欄位。
