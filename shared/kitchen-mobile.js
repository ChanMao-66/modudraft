(function kitchenMobileModule(global) {
  "use strict";

  const core = global.MODUDRAFTMobileCore;
  const VIEW_LABELS = { floor: "平面圖", elevation: "立面圖", three: "3D" };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
  }

  function detectLowEndDevice() {
    if (core?.detectLowEndMobile) return core.detectLowEndMobile();
    const cores = Number(navigator.hardwareConcurrency) || 4;
    const memory = Number(navigator.deviceMemory) || 4;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return cores <= 4 || memory <= 4 || reducedMotion;
  }

  function mount(options) {
    const config = options || {};
    let activeView = "floor";
    let activeSheet = null;
    let sheetSize = "half";
    let sheetDrag = null;
    let resizeFrame = 0;
    let lastLayout = null;
    let lowPowerMobileMode = false;
    let editorEnhanced = false;
    let deviceSnapshot = core?.getDeviceMode?.() || { mode: "tabletDesktop", width: innerWidth, height: innerHeight, dpr: devicePixelRatio || 1, isTouchDevice: false };
    let resizeObserver = null;
    let activationState = false;
    const gestureManager = core?.createGestureManager?.() || null;

    const shell = document.createElement("div");
    shell.dataset.mobileUi = "true";
    shell.innerHTML = `
      <header class="mobile-top-bar" aria-label="手機工作台狀態列">
        <div class="mobile-top-project">
          <strong>MODUDRAFT 廚具配置</strong>
          <div class="mobile-top-meta"><span id="mobileTopView">平面圖</span><span>·</span><span id="mobileTopWall">牆 1</span><span>·</span><span id="mobileSaveState">已儲存</span></div>
        </div>
        <button id="mobileLayerChip" class="mobile-layer-chip" type="button" data-layer="lower" data-help-id="cabinet-layer">下櫃</button>
        <button id="mobileTeachingBtn" class="mobile-teaching-button" type="button" aria-label="開啟教學模式" data-help-ui="true">?</button>
      </header>

      <nav class="mobile-view-switcher" aria-label="切換主要視圖" data-help-id="view-switch">
        <button type="button" data-mobile-view="floor" data-help-id="view-plan">平面</button>
        <button type="button" data-mobile-view="elevation" data-help-id="view-elevation">立面</button>
        <button type="button" data-mobile-view="three" data-help-id="view-3d">3D</button>
      </nav>

      <nav class="mobile-bottom-nav" aria-label="手機主要工具列">
        <button type="button" data-mobile-action="wall" data-help-id="wall-tools"><span class="mobile-nav-icon">▱</span><span class="mobile-nav-label">牆面</span></button>
        <button type="button" data-mobile-action="add" data-help-id="add-cabinet"><span class="mobile-nav-icon">＋</span><span class="mobile-nav-label">新增</span></button>
        <button type="button" data-mobile-action="edit" data-help-id="cabinet-editor"><span class="mobile-nav-icon">⌑</span><span class="mobile-nav-label">編輯</span></button>
        <button type="button" data-mobile-action="estimate" data-help-id="estimate"><span class="mobile-nav-icon">NT</span><span class="mobile-nav-label">估價</span></button>
        <button type="button" data-mobile-action="view" data-help-id="view-switch"><span class="mobile-nav-icon">◇</span><span class="mobile-nav-label">視圖</span></button>
        <button type="button" data-mobile-action="more" data-help-id="more-tools"><span class="mobile-nav-icon">•••</span><span class="mobile-nav-label">更多</span></button>
        <button type="button" class="mobile-landscape-only" data-mobile-action="teach" data-help-ui="true"><span class="mobile-nav-icon">?</span><span class="mobile-nav-label">教學</span></button>
      </nav>

      <section id="mobileCommandSheet" class="mobile-command-sheet" data-sheet-size="half" aria-labelledby="mobileSheetTitle">
        <button id="mobileSheetGrab" class="mobile-sheet-grab" type="button" aria-label="調整面板高度" data-help-id="bottom-sheet"></button>
        <header class="mobile-sheet-head">
          <button id="mobileSheetBack" type="button" aria-label="返回上一層" hidden>‹</button>
          <h2 id="mobileSheetTitle" class="mobile-sheet-title">工具</h2>
          <div class="mobile-sheet-head-actions">
            <button id="mobileSheetHelp" type="button" aria-label="查看目前功能說明" data-help-ui="true">?</button>
            <button id="mobileSheetClose" type="button" aria-label="關閉面板">×</button>
          </div>
        </header>
        <div id="mobileSheetBody" class="mobile-sheet-body"></div>
      </section>

      <aside id="mobileModeNotice" class="mobile-mode-notice" role="status"><span></span><button type="button" aria-label="關閉提示">×</button></aside>

      <div id="mobileFirstGuide" class="mobile-first-guide" role="dialog" aria-modal="true" aria-labelledby="mobileFirstGuideTitle">
        <section class="mobile-first-guide-card">
          <h2 id="mobileFirstGuideTitle">手機版操作提示</h2>
          <p>這不是桌面版縮小畫面。畫布、工具與編輯面板都已改成手機操作方式。</p>
          <ol>
            <li>雙指可縮放並移動畫布；單指移動超過 6px 會平移圖面。</li>
            <li>點櫃體可編輯尺寸、用途、門片與把手。</li>
            <li>點尺寸數字可直接修改尺寸。</li>
            <li>底部工具列可切換牆面、新增、編輯、估價、視圖與更多功能。</li>
            <li>點右上角「？」進入教學模式，再點任何功能查看專屬說明。</li>
          </ol>
          <div class="mobile-first-guide-actions">
            <button type="button" class="primary" data-guide-action="start">開始使用</button>
            <button type="button" data-guide-action="teach">開啟教學模式</button>
            <button type="button" data-guide-action="dismiss">不再顯示</button>
          </div>
        </section>
      </div>
    `;
    document.body.appendChild(shell);

    const nodes = {
      topBar: shell.querySelector(".mobile-top-bar"),
      topView: shell.querySelector("#mobileTopView"),
      topWall: shell.querySelector("#mobileTopWall"),
      saveState: shell.querySelector("#mobileSaveState"),
      layerChip: shell.querySelector("#mobileLayerChip"),
      teachingButton: shell.querySelector("#mobileTeachingBtn"),
      viewSwitcher: shell.querySelector(".mobile-view-switcher"),
      bottomNav: shell.querySelector(".mobile-bottom-nav"),
      sheet: shell.querySelector("#mobileCommandSheet"),
      sheetGrab: shell.querySelector("#mobileSheetGrab"),
      sheetTitle: shell.querySelector("#mobileSheetTitle"),
      sheetBody: shell.querySelector("#mobileSheetBody"),
      sheetHelp: shell.querySelector("#mobileSheetHelp"),
      sheetClose: shell.querySelector("#mobileSheetClose"),
      notice: shell.querySelector("#mobileModeNotice"),
      noticeText: shell.querySelector("#mobileModeNotice span"),
      firstGuide: shell.querySelector("#mobileFirstGuide")
    };

    function getDeviceMode() {
      deviceSnapshot = core?.getDeviceMode?.() || deviceSnapshot;
      return deviceSnapshot;
    }

    function isMobile() {
      return getDeviceMode().mode !== "tabletDesktop";
    }

    function isPhoneMode() {
      return isMobile();
    }

    function externalSheetHeight() {
      if (!isMobile()) return 0;
      const candidates = [
        document.querySelector("#editModal.open .modal-content"),
        document.querySelector("#tutorialModal.open .modal-content"),
        document.querySelector("#installModal.open .modal-content"),
        document.querySelector("#exportModal.open .modal-content"),
        document.querySelector("#aiRenderModal.open .modal-content"),
        document.querySelector("#aiAssistPanel.open"),
        document.querySelector("#equalizePanel.open"),
        document.querySelector("#dimensionEditor.open"),
        document.querySelector("#gapActionPanel.open")
      ].filter(Boolean);
      return candidates.reduce((height, element) => Math.max(height, element.getBoundingClientRect().height || 0), 0);
    }

    function updateViewportAndCanvasLayout(reason = "update") {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        const previousMode = deviceSnapshot.mode;
        deviceSnapshot = core?.getDeviceMode?.() || deviceSnapshot;
        const phoneMode = deviceSnapshot.mode !== "tabletDesktop";
        const viewport = window.visualViewport;
        const viewportWidth = Math.max(1, viewport?.width || window.innerWidth);
        const viewportHeight = Math.max(1, viewport?.height || window.innerHeight);
        const keyboardHeight = Math.max(0, window.innerHeight - viewportHeight - (viewport?.offsetTop || 0));
        const keyboardOpen = phoneMode && keyboardHeight > 120;
        document.body.dataset.deviceMode = deviceSnapshot.mode;
        document.body.classList.toggle("mobile-workbench", phoneMode);
        document.body.classList.toggle("mobile-keyboard-open", keyboardOpen);
        document.documentElement.style.setProperty("--app-height", `${Math.round(viewportHeight)}px`);
        document.documentElement.style.setProperty("--mobile-keyboard-height", `${Math.round(keyboardOpen ? keyboardHeight : 0)}px`);

        let activeSheetHeight = 0;
        if (nodes.sheet.classList.contains("open")) activeSheetHeight = nodes.sheet.getBoundingClientRect().height;
        activeSheetHeight = Math.max(activeSheetHeight, externalSheetHeight());
        const topRect = nodes.topBar.getBoundingClientRect();
        const viewRect = nodes.viewSwitcher.getBoundingClientRect();
        const bottomRect = nodes.bottomNav.getBoundingClientRect();
        const portrait = deviceSnapshot.mode === "mobilePortrait";
        const landscape = deviceSnapshot.mode === "mobileLandscape";
        const topBarHeight = phoneMode ? Math.max(0, topRect.height) : 0;
        const viewSwitcherHeight = phoneMode ? Math.max(0, viewRect.height) : 0;
        const bottomBarHeight = portrait ? Math.max(70, viewportHeight - bottomRect.top) : 0;
        const sideToolbarWidth = landscape ? Math.max(64, bottomRect.width) : 0;
        const maximumSheet = Math.max(0, viewportHeight - topBarHeight - bottomBarHeight - 104);
        activeSheetHeight = portrait ? Math.min(activeSheetHeight, maximumSheet) : 0;
        const externalPanel = landscape ? document.querySelector("#editModal.open .modal-content, #aiAssistPanel.open, #equalizePanel.open, #dimensionEditor.open, #gapActionPanel.open, .mobile-command-sheet.open") : null;
        const activePanelWidth = landscape && viewportWidth >= 740 && externalPanel ? Math.min(360, Math.max(300, externalPanel.getBoundingClientRect().width || 320)) : 0;
        document.documentElement.style.setProperty("--mobile-active-sheet-height", `${Math.round(activeSheetHeight)}px`);
        document.documentElement.style.setProperty("--mobile-side-toolbar-width", `${Math.round(sideToolbarWidth)}px`);
        document.documentElement.style.setProperty("--mobile-active-panel-width", `${Math.round(activePanelWidth)}px`);
        document.documentElement.style.setProperty("--mobile-view-switcher-height", `${Math.round(viewSwitcherHeight)}px`);

        const workspace = document.getElementById("workspace");
        const canvasRect = workspace?.getBoundingClientRect() || { x: 0, y: 0, width: viewportWidth, height: viewportHeight };
        const renderDpr = Math.min(lowPowerMobileMode ? 1.25 : 2, deviceSnapshot.dpr || 1);
        lastLayout = {
          reason,
          mode: deviceSnapshot.mode,
          viewportWidth,
          viewportHeight,
          visualViewportWidth: viewportWidth,
          visualViewportHeight: viewportHeight,
          canvasRect: { x: canvasRect.x, y: canvasRect.y, width: canvasRect.width, height: canvasRect.height },
          canvasCssWidth: Math.max(1, canvasRect.width),
          canvasCssHeight: Math.max(1, canvasRect.height),
          canvasPixelWidth: Math.max(1, Math.round(canvasRect.width * renderDpr)),
          canvasPixelHeight: Math.max(1, Math.round(canvasRect.height * renderDpr)),
          dpr: renderDpr,
          safeArea: { top: topBarHeight + viewSwitcherHeight + 8, bottom: bottomBarHeight + 8, left: sideToolbarWidth + 8, right: 8 },
          topBarHeight,
          bottomBarHeight,
          viewSwitcherHeight,
          sideToolbarWidth,
          activePanelWidth,
          activeSheetHeight,
          keyboardHeight: keyboardOpen ? keyboardHeight : 0,
          avoidRects: [topRect, viewRect, bottomRect, externalPanel?.getBoundingClientRect?.()].filter(Boolean)
        };
        if (phoneMode) config.onLayout?.(lastLayout);
        if (previousMode !== deviceSnapshot.mode) {
          if (phoneMode && !activationState) activateMobile(false);
          else if (!phoneMode && activationState) deactivateMobile(false);
          requestAnimationFrame(() => requestAnimationFrame(() => updateViewportAndCanvasLayout("mode-settled")));
        }
      });
      return lastLayout;
    }

    function updateMobileLayout(reason = "legacy") {
      return updateViewportAndCanvasLayout(reason);
    }

    function calculateCanvasSafeRect() {
      return core?.calculateCanvasSafeRect?.(lastLayout || {}) || lastLayout?.canvasRect || null;
    }

    function ensureTargetVisible(targetBounds, viewName = activeView) {
      if (!isMobile() || !targetBounds) return false;
      const safeRect = calculateCanvasSafeRect();
      config.ensureTargetVisible?.(targetBounds, viewName, safeRect);
      return true;
    }

    function setSaveState(label) {
      nodes.saveState.textContent = label || "已儲存";
    }

    function updateContext() {
      const context = config.getContext?.() || {};
      const layer = context.layer === "upper" ? "upper" : "lower";
      nodes.topView.textContent = VIEW_LABELS[activeView] || "平面圖";
      nodes.topWall.textContent = context.wallName || "牆 1";
      nodes.layerChip.dataset.layer = layer;
      nodes.layerChip.textContent = layer === "upper" ? "吊櫃" : "下櫃";
      nodes.viewSwitcher.querySelectorAll("[data-mobile-view]").forEach((button) => {
        button.classList.toggle("active", button.dataset.mobileView === activeView);
        button.setAttribute("aria-pressed", String(button.dataset.mobileView === activeView));
      });
      nodes.bottomNav.querySelectorAll("button").forEach((button) => {
        button.classList.toggle("active", button.dataset.mobileAction === activeSheet);
      });
    }

    function renderOnlyActiveViewOnMobile(view = activeView) {
      if (!isMobile()) return;
      document.querySelectorAll("#workspace .view").forEach((item) => item.classList.remove("mobile-active"));
      document.getElementById(`${view}View`)?.classList.add("mobile-active");
    }

    function setActiveView(view, options = {}) {
      activeView = VIEW_LABELS[view] ? view : "floor";
      renderOnlyActiveViewOnMobile(activeView);
      if (options.apply !== false) config.setView?.(activeView);
      updateContext();
      closeSheet();
      if (activeView === "three") showModeNotice("3D 模式：單指旋轉，雙指縮放與移動。", 4200);
      requestAnimationFrame(() => config.ensureSelectionVisible?.(activeView, calculateCanvasSafeRect()));
      updateViewportAndCanvasLayout("view-change");
    }

    function showModeNotice(message, duration = 0) {
      nodes.noticeText.textContent = message;
      nodes.notice.classList.add("visible");
      clearTimeout(showModeNotice.timer);
      if (duration) showModeNotice.timer = window.setTimeout(() => nodes.notice.classList.remove("visible"), duration);
    }

    function closeModeNotice() {
      nodes.notice.classList.remove("visible");
    }

    function setSheetSize(size) {
      sheetSize = ["collapsed", "half", "full"].includes(size) ? size : "half";
      nodes.sheet.dataset.sheetSize = sheetSize;
      requestAnimationFrame(updateMobileLayout);
    }

    function closeSheet() {
      activeSheet = null;
      nodes.sheet.classList.remove("open");
      nodes.sheetBody.innerHTML = "";
      updateContext();
      requestAnimationFrame(updateMobileLayout);
    }

    function openSheet(type) {
      activeSheet = type;
      setSheetSize("half");
      renderSheet(type);
      nodes.sheet.classList.add("open");
      updateContext();
      requestAnimationFrame(updateMobileLayout);
    }

    function toolCard(action, icon, title, description, helpId, danger = false) {
      return `<button type="button" class="mobile-tool-card${danger ? " danger" : ""}" data-sheet-action="${escapeHtml(action)}" data-help-id="${escapeHtml(helpId)}"><span>${icon}</span><span><b>${escapeHtml(title)}</b><small>${escapeHtml(description)}</small></span></button>`;
    }

    function renderWallSheet() {
      const context = config.getContext?.() || {};
      nodes.sheetTitle.textContent = "牆面設定";
      nodes.sheetBody.innerHTML = `
        <section class="mobile-sheet-section">
          <h3>目前牆面</h3>
          <label class="mobile-field">選擇牆面<select id="mobileWallSelect" data-help-id="select-wall">${(context.walls || []).map((wall, index) => `<option value="${index}" ${index === context.activeWallIndex ? "selected" : ""}>牆 ${index + 1} · ${Math.round(wall.width)} mm</option>`).join("")}</select></label>
        </section>
        <section class="mobile-sheet-section">
          <h3>尺寸</h3>
          <div class="mobile-inline-fields">
            <label class="mobile-field">牆寬 mm<input id="mobileWallWidth" type="number" inputmode="numeric" pattern="[0-9]*" value="${Math.round(context.wallWidth || 2300)}" data-help-id="wall-width"></label>
            <label class="mobile-field">天花高 mm<input id="mobileWallHeight" type="number" inputmode="numeric" pattern="[0-9]*" value="${Math.round(context.wallHeight || 2300)}" data-help-id="wall-height"></label>
          </div>
          <button type="button" class="primary mobile-sheet-primary" data-sheet-action="apply-wall" data-help-id="apply-wall-size">套用牆面尺寸</button>
        </section>
        <section class="mobile-sheet-section">
          <h3>排列與牆面操作</h3>
          <div class="mobile-sheet-grid">
            ${toolCard("align-left", "⇤", "靠左生成", "櫃體由左往右排列。", "align-left")}
            ${toolCard("align-right", "⇥", "靠右生成", "櫃體由右往左排列。", "align-right")}
            ${toolCard("add-wall", "＋", "新增牆面", "加入另一面可獨立設定寬度的牆。", "add-wall")}
            ${toolCard("delete-wall", "×", "刪除牆面", "刪除目前牆面與牆上櫃體。", "delete-wall", true)}
          </div>
        </section>`;
    }

    function renderAddSheet() {
      const context = config.getContext?.() || {};
      const layer = context.layer === "upper" ? "upper" : "lower";
      nodes.sheetTitle.textContent = "新增櫃體";
      nodes.sheetBody.innerHTML = `
        <section class="mobile-sheet-section">
          <div class="mobile-inline-fields">
            <label class="mobile-field">櫃體層<select id="mobileAddLayer" data-help-id="cabinet-layer"><option value="lower" ${layer === "lower" ? "selected" : ""}>下櫃</option><option value="upper" ${layer === "upper" ? "selected" : ""}>吊櫃</option></select></label>
            <label class="mobile-field">寬度 mm<input id="mobileAddWidth" type="number" inputmode="numeric" pattern="[0-9]*" value="600" min="50" data-help-id="cabinet-width"></label>
          </div>
          <label class="mobile-field" style="margin-top:9px">名稱<input id="mobileAddName" type="text" value="${layer === "upper" ? "新增吊櫃" : "新增下櫃"}" data-help-id="cabinet-name"></label>
          <label class="mobile-field" style="margin-top:9px">用途<select id="mobileAddPurpose" data-help-id="cabinet-purpose"><option value="general">一般收納櫃</option><option value="drawer">抽屜櫃</option><option value="sink">水槽櫃</option><option value="stove">爐台櫃</option><option value="blind-corner">盲角轉角下櫃 1000</option><option value="appliance">嵌入電器櫃</option><option value="open">開放櫃</option><option value="filler">補板／補邊</option></select></label>
          <p class="mobile-field-note">盲角轉角櫃採 560 / 20 / 20 / 400 結構，加入後可編輯左右方向與轉角五金。</p>
          <button type="button" class="primary mobile-sheet-primary" data-sheet-action="create-cabinet" data-help-id="add-cabinet">新增到目前牆面</button>
        </section>
        <section class="mobile-sheet-section">
          <h3>快速建立</h3>
          <div class="mobile-sheet-grid one-column">
            ${toolCard("auto-layout", "⌘", "自動配置", "依牆寬產生一版常用廚具草圖。", "auto-layout")}
            ${toolCard("ai-layout", "✦", "AI 輔助構圖", "依剩餘空間推薦櫃體或補板。", "ai-layout")}
            ${toolCard("equalize", "⇆", "輔助等分", "重新平均分割連續櫃體。", "equalize")}
          </div>
        </section>`;
    }

    function renderViewSheet() {
      const context = config.getContext?.() || {};
      nodes.sheetTitle.textContent = "切換視圖";
      nodes.sheetBody.innerHTML = `
        <section class="mobile-sheet-section">
          <h3>主要視圖</h3>
          <div class="mobile-sheet-grid">
            ${toolCard("view-floor", "⌗", "平面圖", "由上往下檢查牆面與深度。", "view-floor")}
            ${toolCard("view-elevation", "▤", "立面圖", "檢查寬高、門片與設備。", "view-elevation")}
            ${toolCard("view-three", "◇", "3D 視圖", "旋轉與縮放檢查空間比例。", "view-3d")}
            ${toolCard("reset-view", "↺", "重設視圖", "讓圖面重新置中並符合畫面。", "reset-view")}
          </div>
        </section>
        <section class="mobile-sheet-section">
          <h3>3D 顯示</h3>
          <div class="mobile-sheet-grid">
            ${toolCard("toggle-wall", context.showWalls ? "◉" : "○", context.showWalls ? "牆面已開啟" : "牆面已關閉", "切換 3D 牆面顯示。", "wall-visibility")}
            ${toolCard("toggle-top-filler", context.showTopFiller ? "◉" : "○", context.showTopFiller ? "頂部補板已開啟" : "頂部補板已關閉", "切換吊櫃頂部補板。", "top-filler")}
          </div>
        </section>`;
    }

    function renderMoreSheet() {
      nodes.sheetTitle.textContent = "更多功能";
      nodes.sheetBody.innerHTML = `<div class="mobile-sheet-grid one-column">
        ${toolCard("beginner-flow", "1→7", "新手快速建立", "依七個步驟重新建立或檢查一套廚具。", "beginner-workflow")}
        ${toolCard("standard-library", "▦", "標準櫃體庫", "用常見尺寸快速加入下櫃、吊櫃與補板。", "standard-cabinet-library")}
        ${toolCard("auto-layout", "⌘", "自動配置", "依牆寬與常用尺寸產生草稿。", "auto-layout")}
        ${toolCard("ai-layout", "✦", "AI 輔助構圖", "根據剩餘空間推薦適合櫃體。", "ai-layout")}
        ${toolCard("equalize", "⇆", "輔助等分", "把選取的連續櫃體重新平均分割。", "equalize")}
        ${toolCard("cabinet-list", "☷", "櫃體清單", "核對寬高深、門片與把手，並可複製或匯出。", "cabinet-list")}
        ${toolCard("estimate", "NT$", "模擬估價", "依目前櫃體、檯面、三機與人工產生估價明細。", "estimate")}
        ${toolCard("design-check", "✓", "設計檢查", "檢查尺寸、重疊、設備對齊與補板建議。", "design-check")}
        ${toolCard("project-center", "◇", "專案與材質", "儲存專案、套用風格與產生 AI 提示詞。", "project-center")}
        ${toolCard("material-render", "◉", "普通材質渲染", "套用內建材質並輸出目前視角。", "normal-render")}
        ${toolCard("ai-render", "✦", "AI 進階渲染", "截圖後交給 ChatGPT 或 Gemini 精緻渲染。", "ai-render")}
        ${toolCard("export", "⇧", "匯出", "輸出平面、立面、3D 或相容 3D 檔。", "export")}
        ${toolCard("share", "⌁", "分享", "複製網址、QR Code 或系統分享。", "share")}
        ${toolCard("reset-view", "↺", "重設視圖", "恢復圖面與 3D 的安全視角。", "reset-view")}
        ${toolCard("full-guide", "?", "使用說明", "開啟完整章節式操作指南。", "full-guide")}
        ${toolCard("teaching-mode", "◎", "教學模式", "點任何工具查看該功能的專屬教學。", "teaching-mode")}
        ${toolCard("clear-wall", "×", "清空牆面", "移除目前牆面的全部櫃體。", "clear-wall", true)}
      </div>`;
    }

    function renderEditSheet() {
      nodes.sheetTitle.textContent = "編輯櫃體";
      const context = config.getContext?.() || {};
      if (context.selectedIndex === null || context.selectedIndex === undefined) {
        nodes.sheetBody.innerHTML = `<div class="assist-empty">尚未選取櫃體。請關閉面板，直接點平面圖或立面圖中的櫃體。</div>`;
        return;
      }
      nodes.sheetBody.innerHTML = `<div class="mobile-sheet-grid one-column">
        ${toolCard("edit-basic", "⌑", "開啟櫃體編輯", "修改尺寸、用途、門片與把手。", "cabinet-editor")}
        ${toolCard("copy-selected", "▣", "複製此櫃體", "複製目前櫃體與所有設定。", "copy-cabinet")}
      </div>`;
    }

    function renderSheet(type) {
      if (type === "wall") renderWallSheet();
      else if (type === "add") renderAddSheet();
      else if (type === "view") renderViewSheet();
      else if (type === "edit") renderEditSheet();
      else renderMoreSheet();
      nodes.sheetHelp.dataset.helpId = ({ wall: "wall-tools", add: "add-cabinet", view: "view-switch", edit: "cabinet-editor", more: "more-tools" })[type] || "more-tools";
      config.help?.refreshMetadata?.();
    }

    function triggerOriginal(id) {
      closeSheet();
      const target = document.getElementById(id);
      if (target) target.click();
    }

    function handleSheetAction(action) {
      if (!action) return;
      if (action === "apply-wall") {
        config.applyWallSize?.(
          Number(nodes.sheetBody.querySelector("#mobileWallWidth")?.value),
          Number(nodes.sheetBody.querySelector("#mobileWallHeight")?.value)
        );
        renderWallSheet();
      } else if (action === "align-left") config.setAlignment?.("left");
      else if (action === "align-right") config.setAlignment?.("right");
      else if (action === "add-wall") config.addWall?.();
      else if (action === "delete-wall") config.deleteWall?.();
      else if (action === "create-cabinet") {
        const result = config.addCabinet?.({
          layer: nodes.sheetBody.querySelector("#mobileAddLayer")?.value,
          width: Number(nodes.sheetBody.querySelector("#mobileAddWidth")?.value),
          name: nodes.sheetBody.querySelector("#mobileAddName")?.value,
          purpose: nodes.sheetBody.querySelector("#mobileAddPurpose")?.value
        });
        if (result !== false) closeSheet();
      } else if (action === "view-floor") setActiveView("floor");
      else if (action === "view-elevation") setActiveView("elevation");
      else if (action === "view-three") setActiveView("three");
      else if (action === "toggle-wall") { config.toggleWalls?.(); renderViewSheet(); }
      else if (action === "toggle-top-filler") { config.toggleTopFiller?.(); renderViewSheet(); }
      else if (action === "beginner-flow") { closeSheet(); config.openBeginnerFlow?.(); }
      else if (action === "standard-library") { closeSheet(); config.openStandardLibrary?.(); }
      else if (action === "auto-layout") triggerOriginal("autoLayoutBtn");
      else if (action === "ai-layout") triggerOriginal("aiAssistBtn");
      else if (action === "equalize") { closeSheet(); config.startEqualize?.(); showModeNotice("輔助等分模式：請點選要重新等分的連續櫃體。", 0); }
      else if (action === "cabinet-list") { closeSheet(); config.openCabinetList?.(); }
      else if (action === "estimate") { closeSheet(); config.openEstimate?.(); }
      else if (action === "design-check") { closeSheet(); config.openProjectCenter?.("checks"); }
      else if (action === "project-center") { closeSheet(); config.openProjectCenter?.("project"); }
      else if (action === "material-render") triggerOriginal("materialRenderBtn");
      else if (action === "ai-render") triggerOriginal("renderViewBtn");
      else if (action === "export") triggerOriginal("exportBtn");
      else if (action === "share") triggerOriginal("installAppBtn");
      else if (action === "reset-view") triggerOriginal("resetViewBtn");
      else if (action === "clear-wall") triggerOriginal("clearWallBtn");
      else if (action === "full-guide") { closeSheet(); config.help?.open?.("start"); }
      else if (action === "teaching-mode") { closeSheet(); config.help?.toggleTeachingMode?.(true); }
      else if (action === "edit-basic") { closeSheet(); config.openSelectedCabinet?.("basic"); }
      else if (action === "copy-selected") triggerOriginal("copyCabinetBtn");
    }

    function enhanceSelectWithCards(selectId, helpPrefix) {
      const select = document.getElementById(selectId);
      if (!select || select.parentElement.classList.contains("has-mobile-choice")) return;
      const grid = document.createElement("div");
      grid.className = "mobile-choice-grid";
      grid.dataset.choiceFor = selectId;
      [...select.options].forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = option.textContent;
        button.dataset.choiceValue = option.value;
        button.dataset.helpId = `${helpPrefix}-${option.value}`;
        button.addEventListener("click", () => {
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          syncChoiceCards(selectId);
        });
        grid.appendChild(button);
      });
      select.parentElement.classList.add("has-mobile-choice");
      select.insertAdjacentElement("afterend", grid);
      syncChoiceCards(selectId);
    }

    function syncChoiceCards(selectId) {
      const select = document.getElementById(selectId);
      const grid = document.querySelector(`[data-choice-for="${selectId}"]`);
      if (!select || !grid) return;
      grid.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.choiceValue === select.value));
    }

    function enhanceCabinetEditor() {
      if (editorEnhanced) return;
      const modal = document.getElementById("editModal");
      const content = modal?.querySelector(".modal-content");
      if (!modal || !content) return;
      editorEnhanced = true;
      if (!content.querySelector(".mobile-edit-handle")) content.insertAdjacentHTML("afterbegin", `<span class="mobile-edit-handle" aria-hidden="true"></span>`);
      const title = content.querySelector("h2");
      title?.insertAdjacentHTML("afterend", `<nav class="mobile-edit-tabs" aria-label="櫃體編輯分頁"><button type="button" data-edit-tab-button="basic">基本</button><button type="button" data-edit-tab-button="size">尺寸</button><button type="button" data-edit-tab-button="purpose">用途</button><button type="button" data-edit-tab-button="door">門片</button><button type="button" data-edit-tab-button="handle">把手</button><button type="button" data-edit-tab-button="advanced">進階</button></nav>`);
      content.querySelectorAll("[data-edit-tab-button]").forEach((button) => button.addEventListener("click", () => setEditorTab(button.dataset.editTabButton)));
      enhanceSelectWithCards("editPurpose", "purpose");
      enhanceSelectWithCards("editFrontStyle", "door-style");
      enhanceSelectWithCards("editHandleStyle", "handle-style");
      setEditorTab("basic");
    }

    function setEditorTab(tabName) {
      const modal = document.getElementById("editModal");
      if (!modal) return;
      const tab = ["basic", "size", "purpose", "door", "handle", "advanced"].includes(tabName) ? tabName : "basic";
      modal.dataset.mobileTab = tab;
      modal.querySelectorAll("[data-edit-tab-button]").forEach((button) => button.classList.toggle("active", button.dataset.editTabButton === tab));
      ["editPurpose", "editFrontStyle", "editHandleStyle"].forEach(syncChoiceCards);
      requestAnimationFrame(updateMobileLayout);
    }

    function onCabinetEditorOpen(tab = "basic") {
      enhanceCabinetEditor();
      setEditorTab(tab);
      closeSheet();
      requestAnimationFrame(updateMobileLayout);
    }

    function setLowPowerMode(enabled) {
      lowPowerMobileMode = Boolean(enabled);
      document.body.classList.toggle("low-power-mobile", lowPowerMobileMode);
      config.setLowPowerMode?.(lowPowerMobileMode);
    }

    function activateMobile(refreshLayout = true) {
      activationState = true;
      document.body.classList.add("mobile-workbench");
      setLowPowerMode(detectLowEndDevice());
      setActiveView(activeView, { apply: true });
      enhanceCabinetEditor();
      updateContext();
      if (refreshLayout) updateViewportAndCanvasLayout("activate");
      maybeShowFirstGuide();
    }

    function deactivateMobile(refreshLayout = true) {
      activationState = false;
      closeSheet();
      document.body.classList.remove("mobile-workbench", "mobile-keyboard-open", "low-power-mobile");
      delete document.body.dataset.deviceMode;
      document.documentElement.style.setProperty("--mobile-active-sheet-height", "0px");
      config.setLowPowerMode?.(false);
      if (refreshLayout) config.onLayout?.(null);
    }

    function maybeShowFirstGuide() {
      if (!isMobile()) return;
      const overlay = document.getElementById("startOverlay");
      if (overlay && getComputedStyle(overlay).display !== "none") return;
      let seen = false;
      try {
        const legacySeen = localStorage.getItem("modudraft:kitchen:mobile-guide:v1") === "1";
        seen = localStorage.getItem("modudraft.mobileIntro.dismissed") === "true" || legacySeen;
        if (legacySeen) localStorage.setItem("modudraft.mobileIntro.dismissed", "true");
      } catch (_error) {}
      if (!seen) nodes.firstGuide.classList.add("open");
    }

    function closeFirstGuide(persist = true) {
      nodes.firstGuide.classList.remove("open");
      if (persist) {
        try {
          localStorage.setItem("modudraft:kitchen:mobile-guide:v1", "1");
          localStorage.setItem("modudraft.mobileIntro.dismissed", "true");
        } catch (_error) {}
      }
    }

    nodes.viewSwitcher.addEventListener("click", (event) => {
      const button = event.target.closest("[data-mobile-view]");
      if (!button) return;
      setActiveView(button.dataset.mobileView);
    });

    let switchSwipeStart = null;
    nodes.viewSwitcher.addEventListener("pointerdown", (event) => {
      switchSwipeStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    });
    nodes.viewSwitcher.addEventListener("pointerup", (event) => {
      if (!switchSwipeStart || switchSwipeStart.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - switchSwipeStart.x;
      const deltaY = event.clientY - switchSwipeStart.y;
      switchSwipeStart = null;
      if (Math.abs(deltaX) < 52 || Math.abs(deltaX) < Math.abs(deltaY)) return;
      const views = ["floor", "elevation", "three"];
      const index = views.indexOf(activeView);
      setActiveView(views[Math.max(0, Math.min(views.length - 1, index + (deltaX < 0 ? 1 : -1)))]);
    });
    nodes.viewSwitcher.addEventListener("pointercancel", () => { switchSwipeStart = null; });

    nodes.bottomNav.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-mobile-action]");
      if (!button) return;
      const action = button.dataset.mobileAction;
      if (action === "teach") {
        config.help?.toggleTeachingMode?.(true);
        return;
      }
      if (action === "estimate") {
        closeSheet();
        config.openEstimate?.();
        return;
      }
      if (action === activeSheet && nodes.sheet.classList.contains("open")) closeSheet();
      else openSheet(action);
    });
    nodes.sheetClose.addEventListener("click", closeSheet);
    nodes.sheetHelp.addEventListener("click", () => config.help?.openContext?.(nodes.sheetHelp));
    nodes.sheetBody.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-sheet-action]");
      if (button) handleSheetAction(button.dataset.sheetAction);
    });
    nodes.sheetBody.addEventListener("change", (event) => {
      if (event.target.id === "mobileWallSelect") {
        config.selectWall?.(Number(event.target.value));
        renderWallSheet();
      }
      if (event.target.id === "mobileAddLayer") {
        const layer = event.target.value === "upper" ? "upper" : "lower";
        config.setLayer?.(layer);
        const name = nodes.sheetBody.querySelector("#mobileAddName");
        if (name) name.value = layer === "upper" ? "新增吊櫃" : "新增下櫃";
      }
    });
    nodes.layerChip.addEventListener("click", () => {
      const next = nodes.layerChip.dataset.layer === "upper" ? "lower" : "upper";
      config.setLayer?.(next);
      updateContext();
      showModeNotice(`目前正在配置：${next === "upper" ? "吊櫃" : "下櫃"}`, 1800);
    });
    nodes.teachingButton.addEventListener("click", () => config.help?.toggleTeachingMode?.(true));
    nodes.notice.querySelector("button").addEventListener("click", closeModeNotice);
    nodes.firstGuide.addEventListener("click", (event) => {
      const action = event.target.closest("button[data-guide-action]")?.dataset.guideAction;
      if (!action) return;
      closeFirstGuide(true);
      if (action === "teach") config.help?.toggleTeachingMode?.(true);
    });

    nodes.sheetGrab.addEventListener("pointerdown", (event) => {
      sheetDrag = { pointerId: event.pointerId, startY: event.clientY, startSize: sheetSize };
      gestureManager?.setBottomSheetDragging(true);
      nodes.sheetGrab.setPointerCapture(event.pointerId);
    });
    nodes.sheetGrab.addEventListener("pointerup", (event) => {
      if (!sheetDrag) return;
      const delta = event.clientY - sheetDrag.startY;
      if (delta < -45) setSheetSize(sheetDrag.startSize === "collapsed" ? "half" : "full");
      else if (delta > 45) {
        if (sheetDrag.startSize === "full") setSheetSize("half");
        else if (sheetDrag.startSize === "half") setSheetSize("collapsed");
        else closeSheet();
      }
      if (nodes.sheetGrab.hasPointerCapture(event.pointerId)) nodes.sheetGrab.releasePointerCapture(event.pointerId);
      sheetDrag = null;
      gestureManager?.setBottomSheetDragging(false);
    });
    nodes.sheetGrab.addEventListener("pointercancel", () => { sheetDrag = null; gestureManager?.setBottomSheetDragging(false); });
    nodes.sheetGrab.addEventListener("click", () => setSheetSize(sheetSize === "collapsed" ? "half" : (sheetSize === "half" ? "full" : "collapsed")));

    const panelObserver = new MutationObserver(() => {
      requestAnimationFrame(updateMobileLayout);
      window.setTimeout(maybeShowFirstGuide, 80);
    });
    ["editModal", "tutorialModal", "installModal", "exportModal", "aiRenderModal", "aiAssistPanel", "equalizePanel", "dimensionEditor", "gapActionPanel"]
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .forEach((element) => panelObserver.observe(element, { attributes: true, attributeFilter: ["class", "data-mobile-tab"] }));
    const startOverlay = document.getElementById("startOverlay");
    if (startOverlay) panelObserver.observe(startOverlay, { attributes: true, attributeFilter: ["style", "class"] });

    const resizeHandler = () => updateViewportAndCanvasLayout("viewport");
    window.addEventListener("resize", resizeHandler, { passive: true });
    window.addEventListener("orientationchange", () => {
      updateViewportAndCanvasLayout("orientation");
      window.setTimeout(() => updateViewportAndCanvasLayout("orientation-settled"), 180);
    }, { passive: true });
    window.visualViewport?.addEventListener("resize", resizeHandler, { passive: true });
    window.visualViewport?.addEventListener("scroll", resizeHandler, { passive: true });
    document.addEventListener("focusin", (event) => {
      if (!event.target.matches("input,select,textarea,[contenteditable='true']")) return;
      gestureManager?.setEditingInput(true);
      updateViewportAndCanvasLayout("input-focus");
      window.setTimeout(() => event.target.scrollIntoView?.({ block: "center", behavior: "smooth" }), 120);
    });
    document.addEventListener("focusout", () => {
      gestureManager?.setEditingInput(false);
      window.setTimeout(() => updateViewportAndCanvasLayout("input-blur"), 80);
    });

    const workspace = document.getElementById("workspace");
    if (workspace && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => updateViewportAndCanvasLayout("workspace-resize"));
      resizeObserver.observe(workspace);
    }

    if (isMobile()) activateMobile();
    else updateViewportAndCanvasLayout("desktop-init");

    return {
      isMobile,
      isPhoneMode,
      getDeviceMode,
      update: updateContext,
      updateMobileLayout,
      updateViewportAndCanvasLayout,
      calculateCanvasSafeRect,
      ensureTargetVisible,
      openSheet,
      closeSheet,
      setActiveView,
      renderOnlyActiveViewOnMobile,
      setSaveState,
      showModeNotice,
      closeModeNotice,
      onCabinetEditorOpen,
      setEditorTab,
      maybeShowFirstGuide,
      detectLowEndDevice,
      gestureManager,
      getRenderDpr() { return Math.min(lowPowerMobileMode ? 1.25 : 2, getDeviceMode().dpr || 1); },
      get layout() { return lastLayout; },
      get lowPowerMobileMode() { return lowPowerMobileMode; }
    };
  }

  global.MODUDRAFTKitchenMobile = Object.freeze({ mount, detectLowEndDevice });
})(window);
