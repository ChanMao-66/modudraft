(function (global) {
  "use strict";

  const core = global.MODUDRAFTCore;
  if (!core) return;

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(value);
    const area = document.createElement("textarea");
    area.value = value;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    return Promise.resolve();
  }

  function encodeShare(project) {
    const lightweight = core.cleanData(Object.assign({}, project, { thumbnail: "" }));
    const json = JSON.stringify(lightweight);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeShare(value) {
    try {
      const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
      const binary = atob(padded);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      return core.migrateProject(JSON.parse(new TextDecoder().decode(bytes)));
    } catch (error) {
      return null;
    }
  }

  function mount(options) {
    const adapter = Object.assign({
      type: "kitchen",
      getProject: () => core.createProject({ type: "kitchen" }),
      importProject: null,
      applyStyle: null,
      getRenderMode: () => "white",
      setRenderMode: null,
      extraValidation: null,
      setReadOnly: null
    }, options || {});
    let currentProject = null;
    let currentTab = "project";
    let toastTimer = 0;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "md-product-button";
    button.dataset.helpId = "project-center";
    button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 5.5h16v13H4z"/><path d="M8 9h8M8 13h5"/></svg><span>專案中心</span>';
    button.setAttribute("aria-label", "開啟專案中心");

    const backdrop = document.createElement("div");
    backdrop.className = "md-suite-backdrop";
    backdrop.innerHTML = `
      <section class="md-suite-panel" role="dialog" aria-modal="true" aria-label="MODUDRAFT 專案中心">
        <header class="md-suite-head"><div><small>MODUDRAFT PRODUCT CORE</small><h2>專案中心</h2></div><button class="md-suite-close" type="button" aria-label="關閉">×</button></header>
        <nav class="md-suite-tabs" aria-label="專案功能">
          <button type="button" data-md-tab="project" data-help-id="project-center" class="active">專案</button>
          <button type="button" data-md-tab="materials" data-help-id="material-library">材質</button>
          <button type="button" data-md-tab="checks" data-help-id="design-check">檢查</button>
          <button type="button" data-md-tab="ai" data-help-id="ai-proposal">AI 渲染</button>
        </nav>
        <div class="md-suite-content">
          <section class="md-suite-view active" data-md-view="project"></section>
          <section class="md-suite-view" data-md-view="materials"></section>
          <section class="md-suite-view" data-md-view="checks"></section>
          <section class="md-suite-view" data-md-view="ai"></section>
        </div>
        <footer class="md-suite-foot"><span class="md-save-state">本機安全儲存</span><span>Project Schema v${core.SCHEMA_VERSION}</span></footer>
      </section>`;

    const toast = document.createElement("div");
    toast.className = "md-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    const buttonTarget = adapter.buttonTarget ? document.querySelector(adapter.buttonTarget) : null;
    if (buttonTarget) {
      button.classList.add("embedded");
      buttonTarget.appendChild(button);
      document.body.append(backdrop, toast);
    } else {
      document.body.append(button, backdrop, toast);
    }

    const views = Array.from(backdrop.querySelectorAll("[data-md-view]"));
    const tabs = Array.from(backdrop.querySelectorAll("[data-md-tab]"));
    const projectView = backdrop.querySelector('[data-md-view="project"]');
    const materialsView = backdrop.querySelector('[data-md-view="materials"]');
    const checksView = backdrop.querySelector('[data-md-view="checks"]');
    const aiView = backdrop.querySelector('[data-md-view="ai"]');

    function showToast(message) {
      clearTimeout(toastTimer);
      toast.textContent = message;
      toast.classList.add("show");
      toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
    }

    function snapshot() {
      const fromAdapter = adapter.getProject ? adapter.getProject() : null;
      const merged = core.createProject(Object.assign({}, currentProject || {}, fromAdapter || {}, { type: adapter.type }));
      currentProject = merged;
      return merged;
    }

    function setTab(tab) {
      currentTab = tab;
      tabs.forEach((item) => item.classList.toggle("active", item.dataset.mdTab === tab));
      views.forEach((item) => item.classList.toggle("active", item.dataset.mdView === tab));
      if (tab === "project") renderProject();
      if (tab === "materials") renderMaterials();
      if (tab === "checks") renderChecks();
      if (tab === "ai") renderAi();
    }

    function renderProject() {
      const project = snapshot();
      const recent = core.listProjects().slice(0, 4);
      projectView.innerHTML = `
        <div class="md-section">
          <div class="md-section-title"><h3>目前專案</h3><span>${project.type === "kitchen" ? "廚具配置" : "系統櫃配置"}</span></div>
          <label class="md-field">專案名稱<input id="mdProjectName" data-help-id="project-center" value="${escapeHtml(project.name)}" maxlength="60"></label>
          <div class="md-actions"><button class="md-action primary" type="button" data-md-action="save" data-help-id="project-center">儲存專案</button><button class="md-action" type="button" data-md-action="export" data-help-id="export">匯出 JSON</button><button class="md-action" type="button" data-md-action="import" data-help-id="import-project">匯入 JSON</button><button class="md-action" type="button" data-md-action="share" data-help-id="share">客戶分享連結</button></div>
          <input id="mdImportFile" type="file" accept="application/json,.json" hidden>
        </div>
        <div class="md-section">
          <div class="md-section-title"><h3>最近專案</h3><span>目前裝置</span></div>
          ${recent.length ? `<div class="md-issue-list">${recent.map((item) => `<button class="md-action" type="button" data-md-project="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${item.type === "kitchen" ? "廚具" : "系統櫃"}</button>`).join("")}</div>` : '<div class="md-empty">第一次儲存後，專案會出現在這裡。</div>'}
        </div>
        <div class="md-section"><div class="md-section-title"><h3>資料說明</h3><span>相容舊版</span></div><div class="md-empty">尺寸統一使用 mm。舊編輯器資料會保存在 <b>sourceState</b>，可逐步遷移而不破壞目前圖面。</div></div>`;

      projectView.querySelector('[data-md-action="save"]').onclick = () => {
        currentProject = snapshot();
        currentProject.name = projectView.querySelector("#mdProjectName").value.trim() || currentProject.name;
        const saved = core.saveProject(currentProject);
        showToast(saved ? "專案已儲存在這台裝置" : "儲存空間不足，請先匯出 JSON 備份");
        renderProject();
      };
      projectView.querySelector('[data-md-action="export"]').onclick = () => {
        const projectToExport = snapshot();
        projectToExport.name = projectView.querySelector("#mdProjectName").value.trim() || projectToExport.name;
        core.downloadJson(projectToExport);
        showToast("JSON 專案檔已建立");
      };
      const fileInput = projectView.querySelector("#mdImportFile");
      projectView.querySelector('[data-md-action="import"]').onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        try {
          const imported = await core.importJson(fileInput.files[0], adapter.type);
          if (imported.type !== adapter.type) throw new Error(`這是${imported.type === "kitchen" ? "廚具" : "系統櫃"}專案，請從正確工作台匯入`);
          if (adapter.importProject) await adapter.importProject(imported);
          currentProject = imported;
          core.saveProject(imported);
          showToast("專案已匯入並套用");
          renderProject();
        } catch (error) { showToast(error.message || "匯入失敗"); }
        fileInput.value = "";
      };
      projectView.querySelector('[data-md-action="share"]').onclick = async () => {
        const payload = encodeShare(snapshot());
        if (payload.length > 12000) {
          showToast("專案內容較大，請改用 JSON 檔分享");
          return;
        }
        const url = new URL(location.href);
        url.searchParams.set("view", "client");
        url.hash = `project=${payload}`;
        await copyText(url.toString());
        showToast("客戶唯讀連結已複製");
      };
      projectView.querySelectorAll("[data-md-project]").forEach((item) => {
        item.onclick = async () => {
          const loaded = core.loadProject(item.dataset.mdProject);
          if (!loaded || loaded.type !== adapter.type) return showToast("請從對應工作台開啟此專案");
          if (adapter.importProject) await adapter.importProject(loaded);
          currentProject = loaded;
          showToast("最近專案已開啟");
          renderProject();
        };
      });
    }

    function renderMaterials() {
      const project = snapshot();
      materialsView.innerHTML = `
        <div class="md-section"><div class="md-section-title"><h3>快速換風格</h3><span>整案套用</span></div><div class="md-style-grid">${core.STYLE_PRESETS.map((preset) => {
          const swatches = [preset.door, preset.body, preset.countertop, preset.handle].map(core.materialById).filter(Boolean);
          return `<button type="button" class="md-style-card ${project.stylePreset === preset.id ? "active" : ""}" data-style="${preset.id}" data-help-id="style-presets"><span class="md-style-swatches">${swatches.map((material) => `<i style="background:${material.color}"></i>`).join("")}</span><b>${escapeHtml(preset.name)}</b><small>${escapeHtml(preset.description)}</small></button>`;
        }).join("")}</div></div>
        <div class="md-section"><div class="md-section-title"><h3>材質庫 Demo</h3><span>${core.MATERIALS.length} 項</span></div><div class="md-material-grid">${core.MATERIALS.map((material) => `<article class="md-material-card"><div class="md-material-chip" style="background:${material.color}"></div><b>${escapeHtml(material.name)}</b><small>${escapeHtml(material.note)} · ${escapeHtml(material.category)}</small></article>`).join("")}</div></div>`;
      materialsView.querySelectorAll("[data-style]").forEach((item) => {
        item.onclick = async () => {
          const preset = core.STYLE_PRESETS.find((entry) => entry.id === item.dataset.style);
          if (!preset) return;
          currentProject = snapshot();
          currentProject.stylePreset = preset.id;
          currentProject.materialAssignments = { door: preset.door, body: preset.body, countertop: preset.countertop, handle: preset.handle, wall: preset.wall, floor: preset.floor };
          if (adapter.applyStyle) await adapter.applyStyle(preset, currentProject.materialAssignments);
          core.saveProject(currentProject);
          showToast(`已套用「${preset.name}」`);
          renderMaterials();
        };
      });
    }

    function renderChecks() {
      const project = snapshot();
      let issues = core.validateProject(project);
      if (adapter.extraValidation) issues = issues.concat(adapter.extraValidation(project) || []);
      const errors = issues.filter((item) => item.level === "error").length;
      const warnings = issues.filter((item) => item.level === "warning").length;
      checksView.innerHTML = `<div class="md-section"><div class="md-section-title"><h3>設計檢查</h3><span>即時資料驗證</span></div><div class="md-check-summary"><div><b>${issues.length}</b><span>全部</span></div><div><b>${errors}</b><span>需修正</span></div><div><b>${warnings}</b><span>建議</span></div></div>${issues.length ? `<div class="md-issue-list">${issues.map((item) => `<div class="md-issue ${item.level}"><i></i><span>${escapeHtml(item.message)}</span></div>`).join("")}</div>` : '<div class="md-empty">目前沒有發現尺寸或配置衝突。</div>'}</div>`;
    }

    function renderAi() {
      const project = snapshot();
      const prompt = core.generateAiPrompt(project);
      aiView.innerHTML = `<div class="md-section"><div class="md-section-title"><h3>AI 進階渲染提示詞</h3><span>依目前專案生成</span></div><label class="md-field">3D 圖像來源<select id="mdAiSource" data-help-id="ai-proposal"><option value="white">白模（讓 AI 自由設計材質）</option><option value="material">普通材質（保留目前配色）</option></select></label><label class="md-field">渲染用途<textarea id="mdAiPrompt" data-help-id="ai-proposal">${escapeHtml(prompt)}</textarea></label><div class="md-actions"><button type="button" class="md-action primary" data-ai="copy" data-help-id="ai-proposal">複製提示詞</button><button type="button" class="md-action" data-ai="refresh" data-help-id="ai-proposal">重新生成</button><button type="button" class="md-action" data-ai="chatgpt" data-help-id="open-chatgpt">開啟 ChatGPT</button><button type="button" class="md-action" data-ai="gemini" data-help-id="open-gemini">開啟 Gemini</button></div></div><div class="md-section"><div class="md-section-title"><h3>使用順序</h3><span>保留原配置</span></div><div class="md-empty">白模適合讓 AI 自由發揮；普通材質圖適合要求 AI 保留目前門片、櫃身與五金配色。</div></div>`;
      const source = aiView.querySelector("#mdAiSource");
      source.value = adapter.getRenderMode() === "material" ? "material" : "white";
      source.onchange = async () => { if (adapter.setRenderMode) await adapter.setRenderMode(source.value); showToast(source.value === "material" ? "AI 將使用普通材質圖" : "AI 將使用白模圖"); };
      aiView.querySelector('[data-ai="copy"]').onclick = async () => { await copyText(aiView.querySelector("#mdAiPrompt").value); showToast("AI 提示詞已複製"); };
      aiView.querySelector('[data-ai="refresh"]').onclick = () => { aiView.querySelector("#mdAiPrompt").value = core.generateAiPrompt(snapshot()); showToast("提示詞已依目前設計更新"); };
      aiView.querySelector('[data-ai="chatgpt"]').onclick = () => global.open("https://chatgpt.com/", "_blank", "noopener");
      aiView.querySelector('[data-ai="gemini"]').onclick = () => global.open("https://gemini.google.com/", "_blank", "noopener");
    }

    async function open() {
      currentProject = snapshot();
      backdrop.classList.add("open");
      document.documentElement.style.overflow = "hidden";
      setTab(currentTab);
    }

    function close() {
      backdrop.classList.remove("open");
      document.documentElement.style.overflow = "";
    }

    button.onclick = open;
    backdrop.querySelector(".md-suite-close").onclick = close;
    backdrop.onclick = (event) => { if (event.target === backdrop) close(); };
    tabs.forEach((item) => { item.onclick = () => setTab(item.dataset.mdTab); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && backdrop.classList.contains("open")) close(); });

    const hashMatch = location.hash.match(/(?:^#|&)project=([^&]+)/);
    if (hashMatch && adapter.importProject) {
      const shared = decodeShare(hashMatch[1]);
      if (shared && shared.type === adapter.type) {
        Promise.resolve(adapter.importProject(shared)).then(() => {
          currentProject = shared;
          if (new URL(location.href).searchParams.get("view") === "client") {
            document.documentElement.dataset.clientView = "true";
            if (adapter.setReadOnly) adapter.setReadOnly(true);
            showToast("已開啟客戶唯讀展示");
          }
        });
      }
    }

    return { open, close, snapshot, showToast, setTab };
  }

  global.MODUDRAFTSuite = Object.freeze({ mount, encodeShare, decodeShare });
})(window);
