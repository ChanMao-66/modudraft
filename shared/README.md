# MODUDRAFT 共用產品核心

## Kitchen Workflow Update

- 廚具入口分成「新手快速建立」、「專業空白工程」、「從範本開始」與「匯入既有專案」。
- 新手模式採七步驟：型態、尺寸、設備、生成、檢查、風格、輸出；一字型完整支援，L 型提供穩定簡化版，U 型與中島明確標示即將支援。
- `kitchen-workflow.js / kitchen-workflow.css` 提供標準櫃資料庫、規則式基礎配置、櫃體清單、CSV／JSON、AI 提案提示詞與手機卡片流程。
- 專業工作台保留精準編輯、AI 輔助構圖、輔助等分、估價與原有 2D／立面／3D；新增標準櫃體庫供快速配置。
- 設計檢查涵蓋牆面、重疊、設備尺寸、爐台備餐空間、排油煙機對齊、補板與連續檯面高度。
- 新手流程與專業工具共用同一份 Project Schema；任何櫃體異動都會同步圖面、清單、估價狀態與 AI 提示詞。
- 教學中心新增「新手完整流程」章節，材質、檢查、標準櫃、估價與 AI 提案均有獨立 `helpId`。

## 盲角轉角下櫃

- Project Schema v3 將盲角櫃拆成 `adjacentCabinetDepthRef`、`adjacentDoorReferencePanelWidth`、`hingeMountPanelWidth` 與 `frontDoorWidth`，預設為 `560 / 20 / 20 / 400`，總寬 1000 mm。
- 左盲角依序顯示 560 / 20 / 20 / 400；右盲角完整鏡像為 400 / 20 / 20 / 560。
- 平面圖、立面圖、Three.js 3D 與 Collada 匯出都使用同一結構；兩片 20 mm 板是獨立物件，不再合併為 40 mm 補板。
- 估價第一版視為整櫃計價：100 CM × 下櫃單價 75 = 7,500；雙 20 板包含於整櫃單價。

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
