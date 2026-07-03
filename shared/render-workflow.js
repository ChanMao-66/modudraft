(function (global) {
  "use strict";

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function assignmentsFor(preset) {
    return { door: preset.door, body: preset.body, countertop: preset.countertop, handle: preset.handle, wall: preset.wall, floor: preset.floor };
  }

  function mount(options) {
    const core = global.MODUDRAFTCore;
    if (!core) return null;
    const adapter = Object.assign({ getStyle: () => "nordic", applyStyle: null, setMode: null, preview: null, exportImage: null }, options || {});
    let selectedStyle = adapter.getStyle() || "nordic";
    let toastTimer = 0;

    const backdrop = document.createElement("div");
    backdrop.className = "md-render-backdrop";
    backdrop.innerHTML = `<section class="md-render-dialog" role="dialog" aria-modal="true" aria-label="普通材質渲染">
      <header class="md-render-head"><div><small>LOCAL MATERIAL RENDER</small><h2>普通材質渲染</h2></div><button type="button" class="md-render-close" aria-label="關閉">×</button></header>
      <div class="md-render-body">
        <div class="md-render-intro"><section><span class="md-render-eyebrow">快速提案</span><h3>直接套用材質並產圖</h3><p>使用內建板材、牆面、地板與五金顏色，即時產生可交付的 3D 提案圖，不需連接 AI。</p></section><section><span class="md-render-eyebrow">白模保留</span><h3>尺寸檢查仍可使用白模</h3><p>白模適合確認比例，也能直接截圖交給 AI；普通渲染只改變顯示，不會修改櫃體尺寸與位置。</p></section></div>
        <div class="md-render-style-title"><h3>選擇快速材質</h3><span>六組低飽和商用提案</span></div>
        <div class="md-render-style-grid">${core.STYLE_PRESETS.map((preset) => {
          const swatches = [preset.door, preset.body, preset.countertop, preset.handle].map(core.materialById).filter(Boolean);
          return `<button type="button" class="md-render-style" data-render-style="${preset.id}"><span class="md-render-swatches">${swatches.map((material) => `<i style="background:${material.color}"></i>`).join("")}</span><span><b>${escapeHtml(preset.name)}</b><small>${escapeHtml(preset.description)}</small></span></button>`;
        }).join("")}</div>
        <div class="md-render-actions"><button type="button" data-render-action="white">返回白模</button><button type="button" data-render-action="preview">套用並預覽 3D</button><button type="button" class="primary" data-render-action="export">匯出普通渲染</button></div>
        <p class="md-render-note">普通渲染固定使用目前 3D 視角；先旋轉到希望的角度，再按「匯出普通渲染」。</p>
      </div></section>`;
    const toast = document.createElement("div");
    toast.className = "md-render-toast";
    document.body.append(backdrop, toast);

    function showToast(message) {
      clearTimeout(toastTimer);
      toast.textContent = message;
      toast.classList.add("show");
      toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
    }

    function refreshSelection() {
      backdrop.querySelectorAll("[data-render-style]").forEach((button) => button.classList.toggle("active", button.dataset.renderStyle === selectedStyle));
    }

    async function applyMaterial() {
      const preset = core.STYLE_PRESETS.find((item) => item.id === selectedStyle) || core.STYLE_PRESETS[0];
      if (adapter.applyStyle) await adapter.applyStyle(preset, assignmentsFor(preset));
      if (adapter.setMode) await adapter.setMode("material", preset.id);
      return preset;
    }

    async function openMaterial() {
      selectedStyle = adapter.getStyle() || selectedStyle;
      refreshSelection();
      backdrop.classList.add("open");
      document.documentElement.style.overflow = "hidden";
    }

    function close() {
      backdrop.classList.remove("open");
      document.documentElement.style.overflow = "";
    }

    backdrop.querySelector(".md-render-close").onclick = close;
    backdrop.onclick = (event) => { if (event.target === backdrop) close(); };
    backdrop.querySelectorAll("[data-render-style]").forEach((button) => { button.onclick = () => { selectedStyle = button.dataset.renderStyle; refreshSelection(); }; });
    backdrop.querySelector('[data-render-action="white"]').onclick = async () => {
      if (adapter.setMode) await adapter.setMode("white", selectedStyle);
      if (adapter.preview) await adapter.preview("white");
      close();
      showToast("已切回白模檢查模式");
    };
    backdrop.querySelector('[data-render-action="preview"]').onclick = async () => {
      const preset = await applyMaterial();
      if (adapter.preview) await adapter.preview("material");
      close();
      showToast(`已套用「${preset.name}」普通材質`);
    };
    backdrop.querySelector('[data-render-action="export"]').onclick = async () => {
      const button = backdrop.querySelector('[data-render-action="export"]');
      button.disabled = true;
      button.textContent = "正在產生...";
      try {
        const preset = await applyMaterial();
        if (adapter.preview) await adapter.preview("material");
        if (adapter.exportImage) await adapter.exportImage();
        close();
        showToast(`已匯出「${preset.name}」普通渲染`);
      } catch (error) { showToast(error.message || "普通渲染匯出失敗"); }
      finally { button.disabled = false; button.textContent = "匯出普通渲染"; }
    };
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && backdrop.classList.contains("open")) close(); });

    return { openMaterial, close, showToast, assignmentsFor };
  }

  global.MODUDRAFTRender = Object.freeze({ mount });
})(window);
