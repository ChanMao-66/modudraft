# 草圖魔方 ModuDraft UI Redesign V1 Notes

本次 UI V1 只做視覺與版面層，不修改櫃體配置、尺寸計算、3D、儲存、匯出、分享、AI 流程與 localStorage 格式。

## 不可更動的核心綁定

- 視圖與畫布：`viewFloor`、`viewElevation`、`viewThree`、`floorCanvas`、`elevationCanvas`、`threeCanvasContainer`
- 牆面尺寸：`wallSelect`、`wallWidthInput`、`wallHeightInput`、`addWallBtn`、`applyWallSizeBtn`、`alignWallLeftBtn`、`alignWallRightBtn`
- 主要操作：`addCabinetBtn`、`standardCabinetLibraryBtn`、`beginnerModeBtn`、`autoLayoutBtn`、`aiAssistBtn`、`equalizeBtn`
- 輸出與檢查：`materialRenderBtn`、`renderViewBtn`、`cabinetListBtn`、`exportBtn`、`installAppBtn`、`clearWallBtn`
- 教學與手機：`data-help-id`、`data-mobile-edit-tab`、`data-view`、`data-layer`、`data-assist-action`、`data-kw-action`

## 已完成的視覺方向

- 加入 `shared/modudraft-ui-v2.css`，以 `body.modudraft-ui-v2` 命名空間覆蓋，不刪除舊 CSS。
- 首頁、廚具工作台、系統櫃工作台加入「草圖魔方 ModuDraft」品牌呈現。
- 廚具工作台調整為左側深色主導覽、上方專案與尺寸列、右側快捷操作面板、中央最大化畫布、底部設計檢核列。
- 按鈕層級初步分為橘色主動作、青綠輔助工具、白色次要操作、紅色危險操作。
- 手機版保留既有 mobile workbench，不以桌面縮小方式強行覆蓋。

## 後續需要的資源

- 更精緻的線性圖示集，建議同一套 20px 或 24px 線性圖示，不混用 emoji。
- 廚具標準模組縮圖：下櫃、吊櫃、水槽櫃、爐台櫃、抽屜櫃、補板、盲角轉角櫃。
- 材質縮圖：白色門片、淺木紋、奶油色、深色門片、石英石、人造石、不鏽鋼、把手材質。
- 首頁 hero / 工作台示意圖可再替換為真實軟體截圖，而不是生成示意圖。

## 已知限制

- 這版仍是 CSS-first 改版，保守保留 DOM 結構。後續若要更接近參考圖，可在不改 ID 的前提下逐步加 wrapper。
- 右側快捷面板目前仍使用原本所有操作按鈕，之後可依「專案 / 櫃體 / 輸出 / 檢查」分群，但需要回歸測試事件綁定。
- 系統櫃只套用品牌與基礎色系，尚未做完整工作台 UI 分層。
