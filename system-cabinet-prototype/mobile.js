(function systemCabinetMobile(global) {
  "use strict";

  const core = global.MODUDRAFTMobileCore;
  if (!core) return;

  function mount() {
    let device = core.getDeviceMode();
    let frame = 0;
    let lastMode = "";
    const lowPower = core.detectLowEndMobile();
    const shell = document.createElement("div");
    shell.className = "system-mobile-shell";
    shell.innerHTML = `
      <header class="system-mobile-status">
        <div><strong>MODUDRAFT</strong><span>系統櫃配置</span></div>
        <button type="button" data-system-mobile-action="help" aria-label="開啟教學模式" data-help-ui="true">?</button>
      </header>
      <nav class="system-mobile-view-switcher" aria-label="切換視圖" data-help-id="view-switch">
        <button type="button" data-system-view="floor" data-help-id="view-plan">平面</button>
        <button type="button" data-system-view="elevation" data-help-id="view-elevation">立面</button>
        <button type="button" data-system-view="configuration" data-help-id="cabinet-editor">配置</button>
        <button type="button" data-system-view="three" data-help-id="view-3d">3D</button>
      </nav>
      <nav class="system-mobile-tools" aria-label="手機系統櫃工具列" data-help-id="mobile-bottom-toolbar">
        <button type="button" data-system-mobile-action="wall" data-help-id="wall-tools"><b>▱</b><span>牆面</span></button>
        <button type="button" data-system-mobile-action="add" data-help-id="add-cabinet"><b>＋</b><span>新增</span></button>
        <button type="button" data-system-mobile-action="edit" data-help-id="edit-cabinet"><b>⌑</b><span>編輯</span></button>
        <button type="button" data-system-mobile-action="view" data-help-id="view-switch"><b>◇</b><span>視圖</span></button>
        <button type="button" data-system-mobile-action="more" data-help-id="mobile-more-menu"><b>•••</b><span>更多</span></button>
      </nav>`;
    document.body.appendChild(shell);

    const viewSwitcher = shell.querySelector(".system-mobile-view-switcher");
    const gestureManager = core.createGestureManager();

    function activeView() {
      return document.querySelector(".brand-rail [data-view].active")?.dataset.view || "elevation";
    }

    function syncViews() {
      const current = activeView();
      viewSwitcher.querySelectorAll("[data-system-view]").forEach((button) => {
        const active = button.dataset.systemView === current;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }

    function setView(view) {
      document.querySelector(`.brand-rail [data-view="${view}"]`)?.click();
      syncViews();
      updateViewportAndCanvasLayout("view-change");
    }

    function updateViewportAndCanvasLayout(reason = "update") {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        device = core.getDeviceMode();
        const mobile = device.mode !== "tabletDesktop";
        document.body.classList.toggle("system-mobile-workbench", mobile);
        document.body.classList.toggle("system-low-power", mobile && lowPower);
        if (mobile) document.body.dataset.deviceMode = device.mode;
        else if (!document.body.classList.contains("mobile-workbench")) delete document.body.dataset.deviceMode;
        const viewport = global.visualViewport;
        const height = Math.max(1, viewport?.height || global.innerHeight);
        document.documentElement.style.setProperty("--app-height", `${Math.round(height)}px`);
        document.documentElement.style.setProperty("--system-mobile-dpr", String(getRenderDpr()));
        syncViews();
        if (lastMode && lastMode !== device.mode) {
          requestAnimationFrame(() => requestAnimationFrame(() => {
            document.querySelector(`.brand-rail [data-view="${activeView()}"]`)?.click();
          }));
        }
        lastMode = device.mode;
      });
    }

    function getRenderDpr() {
      return Math.min(lowPower ? 1.25 : 2, device.dpr || 1);
    }

    viewSwitcher.addEventListener("click", (event) => {
      const button = event.target.closest("[data-system-view]");
      if (button) setView(button.dataset.systemView);
    });

    shell.querySelector(".system-mobile-tools").addEventListener("click", (event) => {
      const action = event.target.closest("[data-system-mobile-action]")?.dataset.systemMobileAction;
      if (!action) return;
      if (action === "wall") document.body.classList.toggle("system-mobile-wall-open");
      if (action === "add") document.getElementById("addCabinetBtn")?.click();
      if (action === "edit") document.body.classList.add("mobile-inspector-open");
      if (action === "view") viewSwitcher.classList.toggle("expanded");
      if (action === "more") document.body.classList.toggle("system-mobile-more-open");
    });

    shell.querySelector('[data-system-mobile-action="help"]').addEventListener("click", () => {
      const helpButton = document.querySelector(".md-help-button");
      helpButton?.click();
    });

    const update = () => updateViewportAndCanvasLayout("viewport");
    global.addEventListener("resize", update, { passive: true });
    global.addEventListener("orientationchange", () => {
      updateViewportAndCanvasLayout("orientation");
      global.setTimeout(() => updateViewportAndCanvasLayout("orientation-settled"), 180);
    }, { passive: true });
    global.visualViewport?.addEventListener("resize", update, { passive: true });
    global.visualViewport?.addEventListener("scroll", update, { passive: true });
    const stage = document.querySelector(".drawing-stage");
    const observer = stage && global.ResizeObserver ? new ResizeObserver(update) : null;
    if (observer) observer.observe(stage);
    updateViewportAndCanvasLayout("init");

    return Object.freeze({ getDeviceMode: () => device, getRenderDpr, updateViewportAndCanvasLayout, gestureManager, syncViews });
  }

  document.addEventListener("DOMContentLoaded", () => {
    global.MODUDRAFTSystemMobileController = mount();
  });
})(window);
