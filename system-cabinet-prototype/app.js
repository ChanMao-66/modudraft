"use strict";

const STORAGE_KEY = "modudraft-system-cabinet-v4";
const LEGACY_KEY = "modudraft-system-cabinet-v3";
const STANDARD = { board: 18, back: 8, door: 20, track: 50, filler: 20, finishedEnd: 20, rodOffset: 50 };
const PRESETS = {
  wardrobe: { label: "衣櫃", depth: 580, width: 1200, spacing: 300 },
  shoe: { label: "玄關鞋櫃", depth: 380, width: 800, spacing: 180 },
  book: { label: "書櫃／展示櫃", depth: 330, width: 800, spacing: 300 },
  storage: { label: "儲藏櫃", depth: 430, width: 800, spacing: 300 }
};
const state = {
  walls: [], activeWallId: null,
  selection: { wallId: null, itemId: null, cabinetId: null, compartmentId: null, objectType: "wall", objectId: null },
  view: "elevation", panel: "carcass", showDoors: true, zoom: 1, flowStep: 0, showAdvanced: false,
  manualDraft: [], hitRegions: [], three: null, drag: null, materialPalette: null, renderMode: "white", renderStyle: "nordic"
};
const el = {};
let idSeed = Date.now();
const FLOW_STEPS = [
  { view: "elevation", panel: "carcass", label: "步驟 1／4", hint: "先確認牆寬、天花高與排列基準。" },
  { view: "elevation", panel: "carcass", label: "步驟 2／4", hint: "新增櫃體與補板，調整順序並確認牆面餘量。" },
  { view: "configuration", panel: "shelves", label: "步驟 3／4", hint: "點選單櫃與分格，再設定層板、門片和配件。" },
  { view: "three", panel: "doors", label: "步驟 4／4", hint: "切換有門／無門，套用材質並準備匯出或分享。" }
];

function uid(prefix = "item") { idSeed += 1; return `${prefix}-${idSeed.toString(36)}`; }
function clamp(value, min, max, fallback = min) { const n = Number(value); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback; }
function formatMm(value) { return Math.round(value || 0).toLocaleString("zh-TW"); }
function distributeInteger(total, count) {
  const base = Math.floor(total / count), remainder = Math.round(total - base * count);
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}
function makeCompartment(height, autoFill = false, accessory = "open") {
  return { id: uid("cell"), height: Math.max(1, Math.round(height)), autoFill, accessory, drawerCount: 3, drawerHeight: 180, rodOffset: STANDARD.rodOffset };
}
function createCabinet(index = 0, kind = "wardrobe") {
  const preset = PRESETS[kind] || PRESETS.wardrobe;
  const cabinet = {
    id: uid("cab"), type: "cabinet", name: `系統高櫃 ${String(index + 1).padStart(2, "0")}`,
    cabinetKind: kind, width: preset.width, bodyHeight: 2400, depth: preset.depth, plinthHeight: 100,
    boardThickness: STANDARD.board, toCeiling: true, doorSystem: "hinged", doorPosition: "overlay",
    doorLayout: "full", maxDoorWidth: 500, slidingDoorCount: "auto", partitionMode: "auto", bayCount: 2,
    shelfMode: "auto", maxShelfSpacing: preset.spacing, shelfKind: "fixed", compartments: [], doors: [],
    wallRelation: "none", leftFinishedEnd: false, rightFinishedEnd: false
  };
  generateAutoCompartments(cabinet);
  generateDoorData(cabinet);
  return cabinet;
}
function createFiller(wall, index = 0) {
  return { id: uid("filler"), type: "filler", name: `補板 ${index + 1}`, width: STANDARD.filler, height: wall.height - 100, depth: 600 };
}
function createWall(index = 0) {
  const wall = { id: uid("wall"), name: `${String.fromCharCode(65 + index)} 牆`, width: 3000, height: 2500, align: "left", items: [] };
  wall.items.push(createCabinet(0));
  return wall;
}
function activeWall() { return state.walls.find(w => w.id === state.activeWallId) || state.walls[0] || null; }
function selectedItem() { const wall = activeWall(); return wall?.items.find(item => item.id === state.selection.itemId) || wall?.items.find(item => item.type === "cabinet") || wall?.items[0] || null; }
function selectedCabinet() { const item = selectedItem(); return item?.type === "cabinet" ? item : null; }
function selectedCompartment() { const cabinet = selectedCabinet(); return cabinet?.compartments.find(c => c.id === state.selection.compartmentId) || null; }
function cabinetTotalHeight(cabinet) { return cabinet.bodyHeight + cabinet.plinthHeight; }
function cabinetTotalDepth(cabinet) { return cabinet.depth + STANDARD.door + (cabinet.doorSystem === "sliding" ? STANDARD.track : 0); }
function cabinetRunWidth(cabinet) { return cabinet.width + (cabinet.leftFinishedEnd ? STANDARD.finishedEnd : 0) + (cabinet.rightFinishedEnd ? STANDARD.finishedEnd : 0); }
function itemWidth(item) { return item.type === "filler" ? item.width : cabinetRunWidth(item); }
function configurableHeight(cabinet) { return Math.max(1, cabinet.bodyHeight - cabinet.boardThickness); }
function autoBayWidths(cabinet) {
  if (cabinet.partitionMode === "none") return [cabinet.width];
  const count = cabinet.partitionMode === "custom" ? clamp(cabinet.bayCount, 2, 8, 2) : Math.max(1, Math.ceil(cabinet.width / 800));
  return distributeInteger(cabinet.width, count);
}
function calculateLayout(wall = activeWall()) {
  if (!wall) return [];
  const used = wall.items.reduce((sum, item) => sum + itemWidth(item), 0);
  let x = wall.align === "right" ? wall.width - used : wall.align === "center" ? (wall.width - used) / 2 : 0;
  return wall.items.map(item => { const row = { item, x, width: itemWidth(item) }; x += row.width; return row; });
}
function projectValidation(wall = activeWall()) {
  const used = wall ? wall.items.reduce((sum, item) => sum + itemWidth(item), 0) : 0;
  return { used, remaining: (wall?.width || 0) - used, valid: used <= (wall?.width || 0) };
}
function resolveCompartments(cabinet) {
  const total = configurableHeight(cabinet), cells = cabinet.compartments;
  const autoIndex = cells.findIndex(c => c.autoFill);
  if (autoIndex >= 0) cells[autoIndex].height = Math.max(1, total - cells.reduce((sum, c, i) => sum + (i === autoIndex ? 0 : Number(c.height) || 0), 0));
  return cells;
}
function generateAutoCompartments(cabinet) {
  const count = Math.max(1, Math.ceil(configurableHeight(cabinet) / clamp(cabinet.maxShelfSpacing, 150, 600, 300)));
  cabinet.compartments = distributeInteger(configurableHeight(cabinet), count).map((h, i) => makeCompartment(h, i === count - 1));
}
function generateDoorData(cabinet) {
  const result = [];
  if (cabinet.doorSystem === "sliding") {
    const count = cabinet.slidingDoorCount === "auto" ? Math.max(2, Math.min(4, Math.ceil(cabinet.width / 800))) : Number(cabinet.slidingDoorCount);
    const width = (cabinet.width + (count - 1) * 30) / count;
    for (let i = 0; i < count; i++) result.push({ id: uid("door"), x: i * (width - 30), y: 0, width, height: cabinet.bodyHeight, lane: i % 2 });
  } else if (cabinet.doorLayout === "segmented") {
    let y = 0;
    resolveCompartments(cabinet).forEach(cell => {
      const count = Math.max(1, Math.ceil(cabinet.width / cabinet.maxDoorWidth));
      distributeInteger(cabinet.width, count).forEach((width, i) => result.push({ id: uid("door"), x: i * width, y, width, height: cell.height, compartmentId: cell.id }));
      y += cell.height;
    });
  } else {
    const count = Math.max(1, Math.ceil(cabinet.width / cabinet.maxDoorWidth));
    let x = 0; distributeInteger(cabinet.width, count).forEach(width => { result.push({ id: uid("door"), x, y: 0, width, height: cabinet.bodyHeight }); x += width; });
  }
  cabinet.doors = result;
  return result;
}
function normalizeCompartment(raw, index, total) {
  return { ...makeCompartment(raw?.height || Math.round(total / 4), false), ...raw, id: raw?.id || uid("cell"), autoFill: Boolean(raw?.autoFill ?? index === 3), accessory: raw?.accessory || "open" };
}
function normalizeCabinet(raw, index = 0) {
  const base = createCabinet(index, raw.cabinetKind || raw.use || "wardrobe"), total = raw.bodyHeight ? raw.bodyHeight - (raw.boardThickness || STANDARD.board) : 2382;
  const cabinet = { ...base, ...raw, type: "cabinet", cabinetKind: raw.cabinetKind || raw.use || "wardrobe", depth: raw.depth ?? raw.bodyDepth ?? base.depth };
  const heights = raw.compartmentHeights || [];
  cabinet.compartments = (raw.compartments?.length ? raw.compartments : heights.map(height => ({ height }))).map((c, i, all) => normalizeCompartment(c, i, total));
  if (!cabinet.compartments.length) generateAutoCompartments(cabinet);
  if (cabinet.compartments.filter(c => c.autoFill).length > 1) cabinet.compartments.forEach((c, i) => c.autoFill = i === cabinet.compartments.length - 1);
  resolveCompartments(cabinet); generateDoorData(cabinet); return cabinet;
}
function migrateLegacy(raw) {
  const wall = createWall(0); wall.width = raw.wallWidth || 3000; wall.height = raw.ceilingHeight || 2500; wall.items = [];
  (raw.cabinets || []).forEach((old, index) => {
    if (["left", "both"].includes(old.fillerMode) && old.leftFiller) wall.items.push({ ...createFiller(wall), name: `左補板 ${index + 1}`, width: old.leftFiller, depth: old.bodyDepth || 600 });
    const cabinet = normalizeCabinet(old, index); delete cabinet.leftFiller; delete cabinet.rightFiller; delete cabinet.fillerMode; wall.items.push(cabinet);
    if (["right", "both"].includes(old.fillerMode) && old.rightFiller) wall.items.push({ ...createFiller(wall), name: `右補板 ${index + 1}`, width: old.rightFiller, depth: old.bodyDepth || 600 });
  });
  if (!wall.items.length) wall.items.push(createCabinet(0));
  return [wall];
}
function loadState() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (current?.walls?.length) {
      state.walls = current.walls.map((w, wi) => ({ ...createWall(wi), ...w, items: (w.items || []).map((item, i) => item.type === "filler" ? { ...createFiller(w), ...item } : normalizeCabinet(item, i)) }));
      state.activeWallId = current.activeWallId || state.walls[0].id; state.showDoors = current.showDoors !== false; state.materialPalette = current.materialPalette || null; state.renderMode = current.renderMode === "material" ? "material" : "white"; state.renderStyle = current.renderStyle || "nordic";
    } else {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY)); state.walls = legacy?.cabinets ? migrateLegacy(legacy) : [createWall(0)]; state.activeWallId = state.walls[0].id;
    }
  } catch { state.walls = [createWall(0)]; state.activeWallId = state.walls[0].id; }
  const first = activeWall().items.find(i => i.type === "cabinet") || activeWall().items[0]; selectItem(first?.id, first?.type || "wall", null, false);
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ walls: state.walls, activeWallId: state.activeWallId, showDoors: state.showDoors, materialPalette: state.materialPalette, renderMode: state.renderMode, renderStyle: state.renderStyle })); }
  catch (error) { console.warn("系統櫃本機儲存失敗", error); }
}

function cacheElements() {
  document.querySelectorAll("[id]").forEach(node => el[node.id] = node);
}
function selectItem(itemId, objectType = "cabinet", compartmentId = null, rerender = true) {
  const wall = activeWall(), item = wall?.items.find(i => i.id === itemId);
  state.selection = { wallId: wall?.id, itemId: item?.id || null, cabinetId: item?.type === "cabinet" ? item.id : null, compartmentId, objectType, objectId: compartmentId || item?.id || null };
  if (rerender) { updateForms(); renderAll(); openMobileInspector(); }
}
function updateForms() {
  const wall = activeWall(), item = selectedItem(), cabinet = selectedCabinet(); if (!wall) return;
  el.wallWidth.value = wall.width; el.ceilingHeight.value = wall.height; el.activeWallLabel.textContent = wall.name;
  el.cabinetEditor.classList.toggle("hidden", !cabinet); el.fillerEditor.classList.toggle("hidden", item?.type !== "filler");
  document.querySelectorAll(".property-tabs button").forEach(button => button.disabled = !cabinet && button.dataset.panel !== "carcass");
  if (item?.type === "filler") { el.fillerName.value = item.name; el.fillerWidth.value = item.width; el.fillerHeight.value = item.height; el.fillerDepth.value = item.depth; switchPropertyPanel("carcass"); return; }
  if (!cabinet) return;
  const values = { cabinetName: cabinet.name, cabinetUse: cabinet.cabinetKind, doorSystem: cabinet.doorSystem, cabinetWidth: cabinet.width, bodyHeight: cabinet.bodyHeight, bodyDepth: cabinet.depth, plinthHeight: cabinet.plinthHeight, boardThickness: cabinet.boardThickness, partitionMode: cabinet.partitionMode, bayCount: cabinet.bayCount, wallRelation: cabinet.wallRelation || "none", maxShelfSpacing: cabinet.maxShelfSpacing, maxHingedDoorWidth: cabinet.maxDoorWidth, slidingDoorCount: cabinet.slidingDoorCount };
  Object.entries(values).forEach(([key, value]) => { if (el[key]) el[key].value = value; });
  el.toCeiling.checked = cabinet.toCeiling; el.leftFinishedEnd.checked = cabinet.leftFinishedEnd; el.rightFinishedEnd.checked = cabinet.rightFinishedEnd;
  el.bayCountField.classList.toggle("hidden", cabinet.partitionMode !== "custom");
  el.hingedDoorControls.classList.toggle("hidden", cabinet.doorSystem !== "hinged"); el.slidingDoorControls.classList.toggle("hidden", cabinet.doorSystem !== "sliding");
  setActive("[data-shelf-mode]", "shelfMode", cabinet.shelfMode); setActive("[data-shelf-kind]", "shelfKind", cabinet.shelfKind); setActive("[data-door-position]", "doorPosition", cabinet.doorPosition); setActive("[data-door-layout]", "doorLayout", cabinet.doorLayout);
  state.manualDraft = cabinet.compartments.map(c => ({ ...c })); renderManualStack(); updateDerivedLabels();
}
function setActive(selector, key, value) { document.querySelectorAll(selector).forEach(button => button.classList.toggle("active", button.dataset[key] === value)); }
function syncCabinetFromForm() {
  const cabinet = selectedCabinet(); if (!cabinet) return;
  const oldKind = cabinet.cabinetKind, oldDoor = cabinet.doorSystem;
  cabinet.name = el.cabinetName.value.trim() || cabinet.name; cabinet.cabinetKind = el.cabinetUse.value; cabinet.doorSystem = el.doorSystem.value;
  cabinet.width = clamp(el.cabinetWidth.value, 300, 3600, cabinet.width); cabinet.bodyHeight = clamp(el.bodyHeight.value, 400, 3000, cabinet.bodyHeight);
  cabinet.depth = clamp(el.bodyDepth.value, 250, 900, cabinet.depth); cabinet.plinthHeight = clamp(el.plinthHeight.value, 0, 300, cabinet.plinthHeight); cabinet.boardThickness = clamp(el.boardThickness.value, 15, 25, STANDARD.board);
  cabinet.toCeiling = el.toCeiling.checked; cabinet.partitionMode = el.partitionMode.value; cabinet.bayCount = clamp(el.bayCount.value, 2, 8, 2); cabinet.wallRelation = el.wallRelation.value;
  cabinet.leftFinishedEnd = el.leftFinishedEnd.checked; cabinet.rightFinishedEnd = el.rightFinishedEnd.checked;
  if (cabinet.toCeiling) cabinet.bodyHeight = Math.max(400, activeWall().height - cabinet.plinthHeight);
  if (oldDoor !== cabinet.doorSystem && cabinet.doorSystem === "sliding" && cabinet.cabinetKind === "wardrobe") cabinet.depth = 580;
  if (oldKind !== cabinet.cabinetKind && cabinet.doorSystem !== "sliding") cabinet.depth = PRESETS[cabinet.cabinetKind].depth;
  resolveCompartments(cabinet); generateDoorData(cabinet); saveState(); updateForms(); renderAll();
}
function syncFillerFromForm() {
  const item = selectedItem(); if (item?.type !== "filler") return;
  item.name = el.fillerName.value.trim() || "補板"; item.width = clamp(el.fillerWidth.value, 5, 500, 20); item.height = clamp(el.fillerHeight.value, 100, 5000, activeWall().height); item.depth = clamp(el.fillerDepth.value, 20, 900, 600); saveState(); renderAll();
}
function updateDerivedLabels() {
  const cabinet = selectedCabinet(); if (!cabinet) return;
  el.totalHeightHint.textContent = `總高 ${formatMm(cabinetTotalHeight(cabinet))} mm`; el.configurableHeight.textContent = `${formatMm(configurableHeight(cabinet))} mm`;
  el.baySummary.textContent = autoBayWidths(cabinet).map(formatMm).join(" + ") + " mm";
  const count = Math.max(1, Math.ceil(configurableHeight(cabinet) / cabinet.maxShelfSpacing)); el.autoShelfResult.textContent = `${count} 格 · 約 ${formatMm(configurableHeight(cabinet) / count)} mm`;
  el.slidingDoorControls.querySelector(".result-line strong").textContent = `${formatMm(cabinetTotalDepth(cabinet))} mm`;
}
function renderWallSelector() {
  el.wallSelector.innerHTML = state.walls.map(w => `<option value="${w.id}">${w.name}</option>`).join(""); el.wallSelector.value = activeWall().id;
  setActive("[data-wall-align]", "wallAlign", activeWall().align);
}
function renderSidebar() {
  const wall = activeWall(), validation = projectValidation(wall), cabinets = wall.items.filter(i => i.type === "cabinet");
  el.cabinetCount.textContent = `${cabinets.length} 座`; el.usedWidthMetric.textContent = formatMm(validation.used); el.remainingWidthMetric.textContent = formatMm(validation.remaining); el.boardThicknessMetric.textContent = selectedCabinet()?.boardThickness || STANDARD.board;
  el.runDirectionLabel.textContent = wall.align === "right" ? "由右往左" : wall.align === "center" ? "置中排列" : "由左往右";
  el.cabinetList.innerHTML = wall.items.map((item, index) => `<button type="button" class="cabinet-list-item ${item.id === state.selection.itemId ? "active" : ""}" data-item-id="${item.id}"><span>${item.type === "filler" ? "補" : String(index + 1).padStart(2, "0")}</span><div><b>${escapeHtml(item.name)}</b><small>${formatMm(item.width)} × ${formatMm(item.height || cabinetTotalHeight(item))} × ${formatMm(item.depth || cabinetTotalDepth(item))} mm</small></div><i data-lucide="${item.type === "filler" ? "panel-left" : "chevron-right"}"></i></button>`).join("");
  el.cabinetList.querySelectorAll("[data-item-id]").forEach(button => button.addEventListener("click", () => selectItem(button.dataset.itemId)));
  el.duplicateCabinetBtn.disabled = !selectedItem(); el.selectedReadout.textContent = selectedCompartment() ? `${selectedItem().name} · 分格 ${selectedCabinet().compartments.findIndex(c => c.id === selectedCompartment().id) + 1}` : selectedItem()?.name || wall.name; el.inspectorSelection.textContent = selectedCompartment() ? `${wall.name} / ${selectedItem().name} / 格 ${selectedCabinet().compartments.findIndex(c => c.id === selectedCompartment().id) + 1}` : `${wall.name} / ${selectedItem()?.name || "尚未選取"}`;
  if (window.lucide) window.lucide.createIcons();
}
function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value || ""; return div.innerHTML; }
function updateValidation() {
  const result = projectValidation(); el.validationStrip.classList.toggle("valid", result.valid); el.validationStrip.classList.toggle("invalid", !result.valid); el.validationStrip.querySelector("span").textContent = result.valid ? `牆面尚餘 ${formatMm(result.remaining)} mm` : `超出牆面 ${formatMm(-result.remaining)} mm`;
}
function updateFlowUI() {
  const step = FLOW_STEPS[state.flowStep] || FLOW_STEPS[0];
  document.body.classList.remove("flow-step-0", "flow-step-1", "flow-step-2", "flow-step-3");
  document.body.classList.add(`flow-step-${state.flowStep}`);
  document.body.classList.toggle("show-advanced", state.showAdvanced);
  document.querySelectorAll("[data-flow-step]").forEach(button => {
    const index = Number(button.dataset.flowStep);
    button.classList.toggle("active", index === state.flowStep);
    button.classList.toggle("done", index < state.flowStep);
  });
  if (el.flowStepLabel) el.flowStepLabel.textContent = step.label;
  if (el.flowHint) el.flowHint.textContent = step.hint;
  if (el.flowPreviousBtn) el.flowPreviousBtn.disabled = state.flowStep === 0;
  if (el.flowNextBtn) {
    el.flowNextBtn.disabled = state.flowStep === FLOW_STEPS.length - 1;
    const label = el.flowNextBtn.querySelector("span");
    if (label) label.textContent = state.flowStep === FLOW_STEPS.length - 1 ? "已完成" : "下一步";
  }
  if (el.toggleAdvancedBtn) el.toggleAdvancedBtn.textContent = state.showAdvanced ? "收起進階" : "顯示進階";
  if (el.workflowStatus) el.workflowStatus.textContent = ["空櫃設定", "牆面排列", "內部配置", "準備交付"][state.flowStep];
  document.querySelectorAll("[data-workflow]").forEach((item, index) => {
    item.classList.toggle("done", index < Math.max(1, state.flowStep + (state.flowStep > 1 ? 1 : 0)));
    item.classList.toggle("active", (state.panel === item.dataset.workflow) || (state.panel === "carcass" && index === 0));
  });
}
function openMobileInspector() { if (window.innerWidth <= 700) document.body.classList.add("mobile-inspector-open"); }
function closeMobileInspector() { document.body.classList.remove("mobile-inspector-open"); }
function goToFlowStep(index) {
  state.flowStep = Math.round(clamp(index, 0, FLOW_STEPS.length - 1, 0));
  const step = FLOW_STEPS[state.flowStep];
  switchView(step.view, true);
  switchPropertyPanel(step.panel, true);
  if (state.flowStep === 2) openMobileInspector(); else closeMobileInspector();
  updateFlowUI();
}
function renderAll() { renderWallSelector(); renderSidebar(); updateValidation(); updateDerivedLabels(); updateFlowUI(); if (state.view === "three") render3D(); else { dispose3D(); render2D(); } saveState(); scheduleSystemProjectAutosave(); }

function addWall() { const wall = createWall(state.walls.length); state.walls.push(wall); state.activeWallId = wall.id; selectItem(wall.items[0].id); showToast("已新增牆面"); }
function deleteWall() { if (state.walls.length === 1) return showToast("至少保留一面牆"); const index = state.walls.findIndex(w => w.id === state.activeWallId); state.walls.splice(index, 1); state.activeWallId = state.walls[Math.max(0, index - 1)].id; selectItem(activeWall().items[0]?.id); }
function addCabinet(kind = "wardrobe") { const wall = activeWall(), cabinet = createCabinet(wall.items.filter(i => i.type === "cabinet").length, kind); wall.items.push(cabinet); state.flowStep = 1; selectItem(cabinet.id); }
function addFiller() { const wall = activeWall(), filler = createFiller(wall, wall.items.filter(i => i.type === "filler").length); const selectedIndex = wall.items.findIndex(i => i.id === state.selection.itemId); wall.items.splice(selectedIndex < 0 ? wall.items.length : selectedIndex + 1, 0, filler); selectItem(filler.id, "filler"); }
function duplicateItem() { const item = selectedItem(); if (!item) return; const copy = structuredClone(item); copy.id = uid(item.type); copy.name += " 複本"; if (copy.type === "cabinet") { copy.compartments.forEach(c => c.id = uid("cell")); generateDoorData(copy); } const index = activeWall().items.indexOf(item); activeWall().items.splice(index + 1, 0, copy); selectItem(copy.id, copy.type); }
function deleteItem() { const wall = activeWall(), index = wall.items.findIndex(i => i.id === state.selection.itemId); if (index < 0) return; wall.items.splice(index, 1); selectItem(wall.items[Math.min(index, wall.items.length - 1)]?.id, "wall"); }
function moveItem(delta) { const wall = activeWall(), index = wall.items.findIndex(i => i.id === state.selection.itemId), next = index + delta; if (index < 0 || next < 0 || next >= wall.items.length) return; [wall.items[index], wall.items[next]] = [wall.items[next], wall.items[index]]; renderAll(); }
function regenerateWall() {
  const wall = activeWall(), fillers = wall.items.filter(i => i.type === "filler"), available = wall.width - fillers.reduce((s, i) => s + i.width, 0), items = [];
  let remaining = available, index = 0; while (remaining >= 400) { const width = remaining >= 800 ? 800 : remaining >= 600 ? 600 : 400; const cabinet = createCabinet(index++); cabinet.width = width; generateDoorData(cabinet); items.push(cabinet); remaining -= width; }
  if (remaining > 0) { const filler = createFiller(wall, fillers.length); filler.width = remaining; fillers.push(filler); }
  wall.items = wall.align === "right" ? [...fillers, ...items] : [...items, ...fillers]; selectItem(items[0]?.id || fillers[0]?.id); showToast("已依牆寬重新配置，可再逐座調整");
}
function applyPreset(kind) { const cabinet = selectedCabinet(); if (!cabinet) return; const preset = PRESETS[kind]; cabinet.cabinetKind = kind; cabinet.width = preset.width; cabinet.maxShelfSpacing = preset.spacing; cabinet.depth = cabinet.doorSystem === "sliding" && kind === "wardrobe" ? 580 : preset.depth; generateAutoCompartments(cabinet); generateDoorData(cabinet); updateForms(); renderAll(); }

function buildManualFields() {
  const cabinet = selectedCabinet(); if (!cabinet) return; const count = clamp(el.manualCompartmentCount.value, 1, 12, 4), old = cabinet.compartments;
  state.manualDraft = distributeInteger(configurableHeight(cabinet), count).map((height, i) => ({ ...(old[i] || makeCompartment(height)), id: old[i]?.id || uid("cell"), height, autoFill: i === count - 1 })); renderManualStack();
}
function renderManualStack() {
  const cabinet = selectedCabinet(); if (!cabinet || !el.manualStack) return; if (!state.manualDraft.length) state.manualDraft = cabinet.compartments.map(c => ({ ...c })); el.manualCompartmentCount.value = state.manualDraft.length;
  el.manualStack.innerHTML = state.manualDraft.map((cell, index) => `<div class="manual-compartment ${cell.id === state.selection.compartmentId ? "selected" : ""}" data-cell-id="${cell.id}"><button class="cell-focus" type="button">格 ${index + 1}</button><span class="unit-input"><input class="cell-height" type="number" min="80" step="1" value="${Math.round(cell.height)}" ${cell.autoFill ? "disabled" : ""}><b>mm</b></span><label class="auto-cell"><input class="cell-auto" type="checkbox" ${cell.autoFill ? "checked" : ""}><span>自動</span></label><select class="cell-accessory" aria-label="此處功能"><option value="open" ${cell.accessory === "open" ? "selected" : ""}>開放格</option><option value="rod" ${cell.accessory === "rod" ? "selected" : ""}>吊衣桿</option><option value="drawers" ${cell.accessory === "drawers" ? "selected" : ""}>抽屜</option></select></div>`).join("");
  el.manualStack.querySelectorAll(".manual-compartment").forEach(row => {
    const cell = state.manualDraft.find(c => c.id === row.dataset.cellId);
    row.querySelector(".cell-focus").onclick = () => { state.selection.compartmentId = cell.id; state.selection.objectType = "compartment"; renderManualStack(); render2D(); };
    row.querySelector(".cell-height").oninput = event => { cell.height = Math.max(1, Number(event.target.value) || 1); resolveManualDraft(cabinet); };
    row.querySelector(".cell-auto").onchange = event => { state.manualDraft.forEach(c => c.autoFill = false); cell.autoFill = event.target.checked; resolveManualDraft(cabinet); renderManualStack(); };
    row.querySelector(".cell-accessory").onchange = event => { cell.accessory = event.target.value; state.selection.compartmentId = cell.id; state.selection.objectType = event.target.value; };
  }); updateManualTotal(cabinet);
}
function resolveManualDraft(cabinet) { const auto = state.manualDraft.find(c => c.autoFill); if (auto) auto.height = Math.max(1, configurableHeight(cabinet) - state.manualDraft.reduce((s, c) => s + (c === auto ? 0 : Number(c.height) || 0), 0)); updateManualTotal(cabinet); }
function updateManualTotal(cabinet) { const sum = state.manualDraft.reduce((s, c) => s + Number(c.height || 0), 0), valid = Math.round(sum) === Math.round(configurableHeight(cabinet)); el.manualTotal.classList.toggle("valid", valid); el.manualTotal.classList.toggle("invalid", !valid); el.manualTotal.innerHTML = `<span>合計</span><strong>${formatMm(sum)} / ${formatMm(configurableHeight(cabinet))} mm</strong>`; }
function applyManualShelves() { const cabinet = selectedCabinet(); resolveManualDraft(cabinet); if (Math.round(state.manualDraft.reduce((s,c)=>s+c.height,0)) !== Math.round(configurableHeight(cabinet))) return showToast("分格合計需等於可配置高度"); cabinet.compartments = state.manualDraft.map(c => ({ ...c })); cabinet.shelfMode = "manual"; generateDoorData(cabinet); renderAll(); showToast("已套用單櫃分格"); }
function autoGenerateShelves() { const cabinet = selectedCabinet(); cabinet.maxShelfSpacing = clamp(el.maxShelfSpacing.value, 150, 600, 300); cabinet.shelfMode = "auto"; generateAutoCompartments(cabinet); state.manualDraft = cabinet.compartments.map(c => ({ ...c })); generateDoorData(cabinet); renderManualStack(); renderAll(); }
function accessoryTarget() { const cabinet = selectedCabinet(); return selectedCompartment() || cabinet?.compartments[0] || null; }
function applyRod() {
  const cell = accessoryTarget(); if (!cell) return;
  const preset = el.rodHeightPreset.value;
  if (preset !== "0" && preset !== "custom") cell.height = Number(preset);
  if (preset === "custom") cell.height = clamp(el.customRodHeight.value, 600, 2100, cell.height);
  cell.accessory = preset === "0" ? "open" : "rod"; cell.rodOffset = STANDARD.rodOffset;
  resolveCompartments(selectedCabinet()); state.selection.compartmentId = cell.id; state.selection.objectType = "rod"; state.manualDraft = selectedCabinet().compartments.map(c => ({...c})); renderManualStack(); renderAll();
}
function applyDrawers() {
  const cell = accessoryTarget(); if (!cell) return;
  cell.accessory = "drawers"; cell.drawerCount = clamp(el.drawerCount.value, 1, 6, 3); cell.drawerHeight = clamp(el.drawerHeight.value, 120, 400, 180);
  state.selection.compartmentId = cell.id; state.selection.objectType = "drawers"; state.manualDraft = selectedCabinet().compartments.map(c => ({...c})); renderManualStack(); renderAll();
}
function clearAccessories() { const cell = accessoryTarget(); if (!cell) return; cell.accessory = "open"; state.selection.objectType = "compartment"; state.manualDraft = selectedCabinet().compartments.map(c => ({...c})); renderManualStack(); renderAll(); }

function switchView(view, preserveFlow = false) { state.view = view; if (!preserveFlow) state.flowStep = view === "three" ? 3 : view === "configuration" ? 2 : 1; document.querySelectorAll("[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === view)); const titles = { floor: ["01", "平面圖 · 牆面配置"], elevation: ["02", "立面圖 · 整面牆配置"], configuration: ["03", "立面配置 · 單櫃內部"], three: ["04", "3D · 整面牆預覽"] }; [el.viewIndex.textContent, el.viewTitle.textContent] = titles[view]; el.threeStage.classList.toggle("hidden", view !== "three"); el.draftCanvas.classList.toggle("hidden", view === "three"); renderAll(); }
function switchPropertyPanel(panel, preserveFlow = false) { state.panel = panel; if (!preserveFlow && panel !== "carcass") state.flowStep = 2; document.querySelectorAll("[data-panel]").forEach(b => b.classList.toggle("active", b.dataset.panel === panel)); document.querySelectorAll("[data-property-view]").forEach(v => v.classList.toggle("active", v.dataset.propertyView === panel)); if (!preserveFlow && panel !== "carcass") openMobileInspector(); updateFlowUI(); }
function switchShelfMode(mode) { const cabinet = selectedCabinet(); if (!cabinet) return; cabinet.shelfMode = mode; document.querySelectorAll("[data-shelf-mode]").forEach(b => b.classList.toggle("active", b.dataset.shelfMode === mode)); el.autoShelfPanel.classList.toggle("active", mode === "auto"); el.manualShelfPanel.classList.toggle("active", mode === "manual"); if (mode === "manual") renderManualStack(); }

function resizeCanvas() { const rect = el.drawingStage.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); el.draftCanvas.width = Math.max(1, Math.round(rect.width * dpr)); el.draftCanvas.height = Math.max(1, Math.round(rect.height * dpr)); el.draftCanvas.style.width = `${rect.width}px`; el.draftCanvas.style.height = `${rect.height}px`; const ctx = el.draftCanvas.getContext("2d"); ctx.setTransform(dpr,0,0,dpr,0,0); return { ctx, width: rect.width, height: rect.height }; }
function render2D() {
  if (!el.draftCanvas || state.view === "three") return; const { ctx, width, height } = resizeCanvas(); ctx.clearRect(0,0,width,height); drawGrid(ctx,width,height); state.hitRegions = [];
  if (state.view === "floor") drawFloor(ctx,width,height); else if (state.view === "configuration") drawConfiguration(ctx,width,height); else drawElevation(ctx,width,height);
}
function drawGrid(ctx,w,h) { ctx.fillStyle="#f5efe4"; ctx.fillRect(0,0,w,h); ctx.strokeStyle="rgba(108,81,45,.08)"; ctx.lineWidth=1; for(let x=0;x<w;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();} for(let y=0;y<h;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();} }
function fitScale(w,h,physicalW,physicalH,marginX=90,marginY=85) { return Math.max(.05, Math.min((w-marginX*2)/Math.max(1,physicalW),(h-marginY*2)/Math.max(1,physicalH))*state.zoom); }
function drawFloor(ctx,w,h) {
  const wall=activeWall(), maxDepth=Math.max(650,...wall.items.map(i=>i.type==="filler"?i.depth:cabinetTotalDepth(i))), scale=fitScale(w,h,wall.width,maxDepth+250,70,80), ox=(w-wall.width*scale)/2, oy=(h-maxDepth*scale)/2;
  ctx.strokeStyle="#38434e";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(ox,oy-8);ctx.lineTo(ox+wall.width*scale,oy-8);ctx.stroke();
  calculateLayout(wall).forEach(row=>{const i=row.item,x=ox+row.x*scale,d=(i.type==="filler"?i.depth:cabinetTotalDepth(i))*scale,ww=row.width*scale;ctx.fillStyle=i.type==="filler"?"#d3aa59":"#e4ddd0";ctx.strokeStyle=i.id===state.selection.itemId?"#c58e34":"#59636b";ctx.lineWidth=i.id===state.selection.itemId?3:1.5;ctx.fillRect(x,oy,ww,d);ctx.strokeRect(x,oy,ww,d);hit(x,oy,ww,d,i.id,i.type);dimH(ctx,x,x+ww,oy+d+28,`${formatMm(row.width)}`);}); dimH(ctx,ox,ox+wall.width*scale,oy-42,`${formatMm(wall.width)} mm`);
  drawWallCaption(ctx,w,wall);
}
function drawElevation(ctx,w,h) {
  const wall=activeWall(), scale=fitScale(w,h,wall.width,wall.height,75,90), ox=(w-wall.width*scale)/2, floorY=(h+wall.height*scale)/2;
  ctx.fillStyle="rgba(130,140,145,.08)";ctx.fillRect(ox,floorY-wall.height*scale,wall.width*scale,wall.height*scale);ctx.strokeStyle="#737c82";ctx.strokeRect(ox,floorY-wall.height*scale,wall.width*scale,wall.height*scale);
  calculateLayout(wall).forEach(row=>row.item.type==="filler"?drawFillerElevation(ctx,row,ox,floorY,scale):drawCabinetElevation(ctx,row,ox,floorY,scale,false));
  dimH(ctx,ox,ox+wall.width*scale,floorY+57,`${formatMm(wall.width)} mm`); drawWallCaption(ctx,w,wall);
}
function drawConfiguration(ctx,w,h) {
  const cabinet=selectedCabinet(); if(!cabinet){ctx.fillStyle="#59636b";ctx.font="600 15px sans-serif";ctx.textAlign="center";ctx.fillText("請先在立面圖選取一座櫃體",w/2,h/2);return;}
  const physicalW=cabinetRunWidth(cabinet)+220, physicalH=cabinetTotalHeight(cabinet)+120, scale=fitScale(w,h,physicalW,physicalH,70,65), ox=(w-cabinetRunWidth(cabinet)*scale)/2, floorY=(h+cabinetTotalHeight(cabinet)*scale)/2;
  drawCabinetElevation(ctx,{item:cabinet,x:0,width:cabinetRunWidth(cabinet)},ox,floorY,scale,true); dimH(ctx,ox,ox+cabinetRunWidth(cabinet)*scale,floorY+50,`${formatMm(cabinetRunWidth(cabinet))} mm`);
}
function drawFillerElevation(ctx,row,ox,floorY,s) { const i=row.item,x=ox+row.x*s,y=floorY-i.height*s,w=row.width*s,h=i.height*s;ctx.fillStyle="#d6b36e";ctx.strokeStyle=i.id===state.selection.itemId?"#9c6718":"#7d6743";ctx.lineWidth=i.id===state.selection.itemId?3:1.2;ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);hit(x,y,w,h,i.id,"filler");dimH(ctx,x,x+w,floorY+28,`${formatMm(i.width)}`); }
function drawCabinetElevation(ctx,row,ox,floorY,s,configuration) {
  const c=row.item,left=c.leftFinishedEnd?STANDARD.finishedEnd:0,x=ox+row.x*s+left*s,bodyTop=floorY-c.plinthHeight*s-c.bodyHeight*s,bw=c.width*s,bh=c.bodyHeight*s,bt=c.boardThickness*s;
  ctx.fillStyle="#e7e0d4";ctx.strokeStyle=c.id===state.selection.itemId?"#b4771f":"#414b54";ctx.lineWidth=c.id===state.selection.itemId?3:1.4;ctx.fillRect(x,bodyTop,bw,bh);ctx.strokeRect(x,bodyTop,bw,bh);hit(x,bodyTop,bw,bh,c.id,"cabinet");
  ctx.fillStyle="#6d7478";ctx.fillRect(x+8*s,floorY-c.plinthHeight*s,bw-16*s,c.plinthHeight*s);ctx.strokeRect(x+8*s,floorY-c.plinthHeight*s,bw-16*s,c.plinthHeight*s);
  if(c.leftFinishedEnd){ctx.fillStyle="#d8d0c3";ctx.fillRect(x-STANDARD.finishedEnd*s,bodyTop,STANDARD.finishedEnd*s,(c.bodyHeight+c.plinthHeight)*s);ctx.strokeRect(x-STANDARD.finishedEnd*s,bodyTop,STANDARD.finishedEnd*s,(c.bodyHeight+c.plinthHeight)*s);}
  if(c.rightFinishedEnd){ctx.fillStyle="#d8d0c3";ctx.fillRect(x+bw,bodyTop,STANDARD.finishedEnd*s,(c.bodyHeight+c.plinthHeight)*s);ctx.strokeRect(x+bw,bodyTop,STANDARD.finishedEnd*s,(c.bodyHeight+c.plinthHeight)*s);}
  const bayWidths=autoBayWidths(c);let bx=x;bayWidths.slice(0,-1).forEach(width=>{bx+=width*s;ctx.fillStyle="#a99f91";ctx.fillRect(bx-bt/2,bodyTop,bt,bh);});
  if(configuration||!state.showDoors) drawInternals(ctx,c,x,bodyTop,bw,bh,s); else drawDoors2D(ctx,c,x,bodyTop,s);
  if(!configuration) dimH(ctx,x,x+bw,floorY+28,`${formatMm(c.width)}`); else dimV(ctx,x+bw+48,bodyTop,bodyTop+bh,`${formatMm(c.bodyHeight)} mm`);
}
function drawInternals(ctx,c,x,top,bw,bh,s) {
  const cells=resolveCompartments(c), bt=c.boardThickness*s;let bottom=top+bh;
  cells.forEach((cell,index)=>{const ch=cell.height*s,y=bottom-ch;ctx.fillStyle=cell.id===state.selection.compartmentId?"rgba(201,148,59,.18)":"rgba(255,255,255,.26)";ctx.fillRect(x+bt,y,bw-2*bt,ch);hit(x+bt,y,bw-2*bt,ch,c.id,"compartment",cell.id); if(index<cells.length-1){ctx.fillStyle="#9e9589";ctx.fillRect(x,y-bt/2,bw,bt);hit(x,y-bt/2,bw,bt,c.id,"shelf",cell.id);} drawAccessory2D(ctx,cell,x+bt,y,bw-2*bt,ch,s);dimV(ctx,x+bw/2,y,bottom,`${formatMm(cell.height)}`,true);bottom=y;});
}
function drawAccessory2D(ctx,cell,x,y,w,h,s){ctx.strokeStyle="#80622e";ctx.fillStyle="#d8c29a";if(cell.accessory==="rod"&&h>100*s){const ry=y+STANDARD.rodOffset*s;ctx.lineWidth=Math.max(2,8*s);ctx.beginPath();ctx.moveTo(x+35*s,ry);ctx.lineTo(x+w-35*s,ry);ctx.stroke();hit(x+30*s,ry-12,x+w-60*s,24,selectedCabinet().id,"rod",cell.id);}if(cell.accessory==="drawers"){const count=Math.min(cell.drawerCount||3,Math.max(1,Math.floor(h/(cell.drawerHeight*s))));for(let i=0;i<count;i++){const dh=Math.min(cell.drawerHeight*s,h/count);ctx.fillRect(x+10*s,y+h-(i+1)*dh,w-20*s,dh-2);ctx.strokeRect(x+10*s,y+h-(i+1)*dh,w-20*s,dh-2);}hit(x+10*s,y+h-count*Math.min(cell.drawerHeight*s,h/count),w-20*s,count*Math.min(cell.drawerHeight*s,h/count),selectedCabinet().id,"drawers",cell.id);}}
function drawDoors2D(ctx,c,x,top,s){generateDoorData(c).forEach(d=>{const dx=x+d.x*s,dy=top+(c.bodyHeight-d.y-d.height)*s,dw=d.width*s,dh=d.height*s;ctx.fillStyle=c.doorSystem==="sliding"?(d.lane?"rgba(183,190,189,.92)":"rgba(214,217,212,.94)"):"rgba(226,225,218,.96)";ctx.strokeStyle="#4e5961";ctx.lineWidth=1.2;ctx.fillRect(dx,dy,dw,dh);ctx.strokeRect(dx,dy,dw,dh);ctx.beginPath();ctx.moveTo(dx+dw*.5,dy+dh*.48);ctx.lineTo(dx+dw*.5,dy+dh*.52);ctx.stroke();hit(dx,dy,dw,dh,c.id,"door",d.compartmentId||null);if(c.doorLayout==="segmented")centerLabel(ctx,dx+dw/2,dy+dh/2,formatMm(d.height),Math.min(10,Math.max(7,dw/7)));});}
function hit(x,y,w,h,itemId,type,compartmentId=null){state.hitRegions.push({x,y,w,h,itemId,type,compartmentId});}
function dimH(ctx,x1,x2,y,label){ctx.strokeStyle="#7b5d2c";ctx.fillStyle="#5f4828";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.moveTo(x1,y-5);ctx.lineTo(x1,y+5);ctx.moveTo(x2,y-5);ctx.lineTo(x2,y+5);ctx.stroke();centerLabel(ctx,(x1+x2)/2,y-7,label,9);}
function dimV(ctx,x,y1,y2,label,inside=false){ctx.strokeStyle="#7b5d2c";ctx.fillStyle="#5f4828";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y2);ctx.moveTo(x-4,y1);ctx.lineTo(x+4,y1);ctx.moveTo(x-4,y2);ctx.lineTo(x+4,y2);ctx.stroke();ctx.save();ctx.translate(x+(inside?-5:12),(y1+y2)/2);ctx.rotate(-Math.PI/2);centerLabel(ctx,0,0,label,Math.max(7,Math.min(9,(y2-y1)/7)));ctx.restore();}
function centerLabel(ctx,x,y,text,size=9){ctx.font=`700 ${size}px "Noto Sans TC",sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";const m=ctx.measureText(text).width;ctx.fillStyle="rgba(245,239,228,.88)";ctx.fillRect(x-m/2-3,y-size/2-2,m+6,size+4);ctx.fillStyle="#5f4828";ctx.fillText(text,x,y);}
function drawWallCaption(ctx,w,wall){ctx.font="700 12px sans-serif";ctx.textAlign="center";ctx.fillStyle="#3f4950";ctx.fillText(`${wall.name} · ${wall.align==="right"?"靠右":wall.align==="center"?"置中":"靠左"}`,w/2,24);}

function dispose3D(){if(!state.three)return;cancelAnimationFrame(state.three.raf);state.three.renderer?.dispose();el.threeStage.innerHTML="";state.three=null;}
function mat(color,rough=.72,metal=.01){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function shadeColor(color,amount=.86){const c=new THREE.Color(color);c.multiplyScalar(amount);return c;}
function projectColor(role,fallback){if(state.renderMode==="white"){const white={door:0xe4e1db,body:0xc8c4bc,countertop:0xd8d5cf,handle:0x666a69,wall:0x817b73,floor:0x685c50};return white[role]??fallback;}const id=state.materialPalette?.[role],hex=window.MODUDRAFTCore?.materialById(id)?.color;return hex?Number.parseInt(hex.slice(1),16):fallback;}
function box(group,w,h,d,x,y,z,material,userData={}){const geometry=new THREE.BoxGeometry(Math.max(.5,w),Math.max(.5,h),Math.max(.5,d)),mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.userData=userData;mesh.castShadow=true;mesh.receiveShadow=true;if(userData.type!=="room"){const lineColor=state.renderMode==="white"?0x252a29:0x342e29,lines=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,24),new THREE.LineBasicMaterial({color:lineColor,transparent:true,opacity:.72,depthWrite:false,toneMapped:false}));lines.renderOrder=8;lines.raycast=()=>{};mesh.add(lines);}group.add(mesh);return mesh;}
function render3D(){if(!window.THREE)return;dispose3D();const rect=el.threeStage.getBoundingClientRect(),renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height));renderer.setClearColor(0x393531);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.72;if("outputEncoding" in renderer)renderer.outputEncoding=THREE.sRGBEncoding;el.threeStage.appendChild(renderer.domElement);const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,Math.max(1,rect.width)/Math.max(1,rect.height),1,50000);scene.fog=new THREE.Fog(0x393531,14000,30000);scene.add(new THREE.HemisphereLight(0xffead0,0x292c2b,.52));const key=new THREE.DirectionalLight(0xffd5a2,.92);key.position.set(-2200,4300,3400);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-6500;key.shadow.camera.right=6500;key.shadow.camera.top=5500;key.shadow.camera.bottom=-1800;key.shadow.bias=-.00025;scene.add(key);const fill=new THREE.DirectionalLight(0xbec9c9,.16);fill.position.set(3600,2100,1800);scene.add(fill);const wall=activeWall(),layout=calculateLayout(wall),group=new THREE.Group();scene.add(group);const bodyColor=projectColor("body",0xb9aa98),doorColor=projectColor("door",0xd2c7b9),carcass=mat(shadeColor(bodyColor,.74),.84),edge=mat(0x4b4641,.88),door=mat(shadeColor(doorColor,.82),.78),filler=mat(shadeColor(doorColor,.68),.82),metal=mat(projectColor("handle",0x817d77),.24,.72);
  layout.forEach(row=>{const i=row.item;if(i.type==="filler"){box(group,i.width,i.height,i.depth,row.x+i.width/2,i.height/2,i.depth/2,filler,{itemId:i.id,type:"filler"});return;}const c=i,left=c.leftFinishedEnd?STANDARD.finishedEnd:0,x=row.x+left,t=c.boardThickness,d=c.depth,base=c.plinthHeight,top=base+c.bodyHeight;box(group,t,c.bodyHeight,d,x+t/2,base+c.bodyHeight/2,d/2,carcass);box(group,t,c.bodyHeight,d,x+c.width-t/2,base+c.bodyHeight/2,d/2,carcass);box(group,c.width-2*t,t,d,x+c.width/2,base+t/2,d/2,carcass);box(group,c.width-2*t,t,d,x+c.width/2,top-t/2,d/2,carcass);box(group,c.width-2*t,c.bodyHeight-2*t,STANDARD.back,x+c.width/2,base+c.bodyHeight/2,STANDARD.back/2,edge);
    let cy=base+t;resolveCompartments(c).slice(0,-1).forEach(cell=>{cy+=cell.height;box(group,c.width-2*t,t,d-STANDARD.back-3,x+c.width/2,cy,d/2+STANDARD.back/2+1,carcass,{itemId:c.id,type:"shelf",compartmentId:cell.id});});let cellBottom=base+t;resolveCompartments(c).forEach(cell=>{if(cell.accessory==="rod"&&cell.height>100){const y=cellBottom+cell.height-STANDARD.rodOffset;const geom=new THREE.CylinderGeometry(8,8,c.width-2*t-60,16);geom.rotateZ(Math.PI/2);const rod=new THREE.Mesh(geom,metal);rod.position.set(x+c.width/2,y,d*.58);rod.userData={itemId:c.id,type:"rod",compartmentId:cell.id};group.add(rod);}if(cell.accessory==="drawers"){const count=Math.min(cell.drawerCount||3,Math.max(1,Math.floor(cell.height/(cell.drawerHeight||180))));for(let n=0;n<count;n++){const dh=Math.min(cell.drawerHeight||180,cell.height/count);box(group,c.width-2*t-8,dh-4,18,x+c.width/2,cellBottom+dh*(n+.5),d-10,door,{itemId:c.id,type:"drawers",compartmentId:cell.id});}}cellBottom+=cell.height;});
    if(c.leftFinishedEnd)box(group,STANDARD.finishedEnd,c.bodyHeight+c.plinthHeight,d+STANDARD.door,x-STANDARD.finishedEnd/2,(top)/2,(d+STANDARD.door)/2,door);if(c.rightFinishedEnd)box(group,STANDARD.finishedEnd,c.bodyHeight+c.plinthHeight,d+STANDARD.door,x+c.width+STANDARD.finishedEnd/2,top/2,(d+STANDARD.door)/2,door);
    if(state.showDoors)generateDoorData(c).forEach(front=>{const z=d+STANDARD.door/2+(c.doorSystem==="sliding"?STANDARD.track+front.lane*4:1);box(group,front.width-2,front.height-2,STANDARD.door,x+front.x+front.width/2,base+front.y+front.height/2,z,door,{itemId:c.id,type:"door",compartmentId:front.compartmentId});});});
  const used=Math.max(wall.width,projectValidation(wall).used),height=wall.height,roomDepth=Math.max(1500,...wall.items.map(i=>i.type==="filler"?i.depth:cabinetTotalDepth(i)))+500,stageSize=Math.max(18000,used*5,height*6,roomDepth*7),modelStart=layout.length?Math.min(...layout.map(row=>row.x)):0,modelEnd=layout.length?Math.max(...layout.map(row=>row.x+row.width)):wall.width,modelWidth=Math.max(600,modelEnd-modelStart),centerX=(modelStart+modelEnd)/2;const floor=box(group,stageSize,24,stageSize,centerX,-12,stageSize/2-1500,mat(shadeColor(projectColor("floor",0x66594d),.62),.96),{type:"room"});floor.castShadow=false;const backWall=box(group,used+1200,height+800,24,used/2,(height+800)/2,-22,mat(shadeColor(projectColor("wall",0x776d63),.58),.98),{type:"room"});backWall.castShadow=false;const sideWall=box(group,24,height+800,roomDepth*.92,-580,(height+800)/2,roomDepth*.46-25,mat(shadeColor(projectColor("wall",0x655c54),.5),.98),{type:"room"});sideWall.castShadow=false;const cameraDistance=Math.max(4700,modelWidth*2.15,height*2.05);camera.position.set(centerX+modelWidth*.64,height*.68,cameraDistance);camera.lookAt(centerX,height*.41,260);state.three={renderer,scene,camera,group,raf:0,orbit:{yaw:0,pitch:0,targetX:centerX,targetY:height*.41,distance:cameraDistance}};bindThreeControls(renderer.domElement);const loop=()=>{state.three.raf=requestAnimationFrame(loop);renderer.render(scene,camera);};loop();}
function bindThreeControls(canvas){let down=false,lastX=0,lastY=0,startX=0,startY=0,mode="orbit";canvas.onpointerdown=e=>{down=true;lastX=startX=e.clientX;lastY=startY=e.clientY;mode=e.button===1||e.shiftKey?"pan":"orbit";canvas.setPointerCapture(e.pointerId);};canvas.onpointerup=e=>{down=false;if(Math.hypot(e.clientX-startX,e.clientY-startY)>5)return;const rect=canvas.getBoundingClientRect(),pointer=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(pointer,state.three.camera);const target=ray.intersectObjects(state.three.group.children,true).find(hit=>hit.object.userData?.itemId);if(target){const data=target.object.userData;selectItem(data.itemId,data.type,data.compartmentId||null);}};canvas.onpointermove=e=>{if(!down||!state.three)return;const dx=e.clientX-lastX,dy=e.clientY-lastY,last=state.three.camera.position.clone();if(mode==="pan"){state.three.camera.position.x-=dx*3;state.three.camera.position.y+=dy*3;}else{const target=new THREE.Vector3(state.three.orbit.targetX,state.three.orbit.targetY,220),offset=last.sub(target),spherical=new THREE.Spherical().setFromVector3(offset);spherical.theta-=dx*.008;spherical.phi=clamp(spherical.phi+dy*.008,.22,Math.PI/2.05,1);state.three.camera.position.copy(target.clone().add(new THREE.Vector3().setFromSpherical(spherical)));state.three.camera.lookAt(target);}lastX=e.clientX;lastY=e.clientY;};canvas.onwheel=e=>{e.preventDefault();const target=new THREE.Vector3(state.three.orbit.targetX,state.three.orbit.targetY,220),offset=state.three.camera.position.clone().sub(target).multiplyScalar(e.deltaY>0?1.1:.9);state.three.camera.position.copy(target.clone().add(offset));state.three.camera.lookAt(target);};}

function exportSystemView() {
  try {
    const source = state.view === "three" ? state.three?.renderer?.domElement : el.draftCanvas;
    if (!source || !source.width || !source.height) return showToast("目前視圖尚未完成，請稍後再匯出");
    if (state.view === "three" && state.three) state.three.renderer.render(state.three.scene, state.three.camera);
    const width = 1920, height = 1440, margin = 72, header = 122, footer = 78;
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    context.fillStyle = state.view === "three" ? "#2b2926" : "#f1eadf"; context.fillRect(0,0,width,height);
    context.fillStyle = state.view === "three" ? "#eee5da" : "#2e3334"; context.font = '700 34px "Noto Sans TC",sans-serif'; context.fillText("MODUDRAFT",margin,58);
    context.font = '500 20px "Noto Sans TC",sans-serif'; context.fillStyle = state.view === "three" ? "#bdb3a8" : "#6c6862"; context.fillText(`${activeWall().name} · ${el.viewTitle.textContent}`,margin,94);
    const maxW = width - margin*2, maxH = height - header - footer, scale = Math.min(maxW/source.width,maxH/source.height), drawW = source.width*scale, drawH = source.height*scale, x = (width-drawW)/2, y = header+(maxH-drawH)/2;
    context.drawImage(source,x,y,drawW,drawH);
    context.fillStyle = state.view === "three" ? "#bdb3a8" : "#6c6862"; context.font = '500 17px "Noto Sans TC",sans-serif'; context.fillText(`牆寬 ${formatMm(activeWall().width)} mm · 天花高 ${formatMm(activeWall().height)} mm · 單位 mm`,margin,height-34);
    const link = document.createElement("a"); link.href = canvas.toDataURL("image/jpeg",.94); link.download = `MODUDRAFT-${activeWall().name}-${state.view}-1920x1440.jpg`; document.body.appendChild(link); link.click(); link.remove(); showToast("已匯出 1920 × 1440 提案圖");
  } catch (error) { console.error(error); showToast("匯出失敗，請重新整理後再試"); }
}

function bindEvents(){
  document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>switchView(b.dataset.view));document.querySelectorAll("[data-panel]").forEach(b=>b.onclick=()=>switchPropertyPanel(b.dataset.panel));document.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>applyPreset(b.dataset.preset));
  document.querySelectorAll("[data-flow-step]").forEach(b=>b.onclick=()=>goToFlowStep(Number(b.dataset.flowStep)));el.flowPreviousBtn.onclick=()=>goToFlowStep(state.flowStep-1);el.flowNextBtn.onclick=()=>goToFlowStep(state.flowStep+1);el.quickAddBtn.onclick=()=>{addCabinet(el.quickAddKind.value);showToast(`已新增${PRESETS[el.quickAddKind.value]?.label||"櫃體"}`);};el.mobileEditSelectionBtn.onclick=()=>openMobileInspector();el.closeInspectorBtn.onclick=closeMobileInspector;el.toggleAdvancedBtn.onclick=()=>{state.showAdvanced=!state.showAdvanced;updateFlowUI();};document.querySelectorAll("[data-workflow]").forEach(item=>item.onclick=()=>{state.flowStep=2;switchView("configuration",true);switchPropertyPanel(item.dataset.workflow,true);openMobileInspector();updateFlowUI();});
  document.querySelectorAll("[data-wall-align]").forEach(b=>b.onclick=()=>{activeWall().align=b.dataset.wallAlign;renderAll();}); document.querySelectorAll("[data-shelf-mode]").forEach(b=>b.onclick=()=>switchShelfMode(b.dataset.shelfMode));document.querySelectorAll("[data-shelf-kind]").forEach(b=>b.onclick=()=>{selectedCabinet().shelfKind=b.dataset.shelfKind;setActive("[data-shelf-kind]","shelfKind",b.dataset.shelfKind);});document.querySelectorAll("[data-door-position]").forEach(b=>b.onclick=()=>{selectedCabinet().doorPosition=b.dataset.doorPosition;generateDoorData(selectedCabinet());renderAll();});document.querySelectorAll("[data-door-layout]").forEach(b=>b.onclick=()=>{selectedCabinet().doorLayout=b.dataset.doorLayout;generateDoorData(selectedCabinet());renderAll();});
  el.wallSelector.onchange=()=>{state.activeWallId=el.wallSelector.value;selectItem(activeWall().items[0]?.id);};el.addWallBtn.onclick=addWall;el.deleteWallBtn.onclick=deleteWall;el.regenerateWallBtn.onclick=regenerateWall;el.addCabinetBtn.onclick=addCabinet;el.addFillerBtn.onclick=addFiller;el.duplicateCabinetBtn.onclick=duplicateItem;el.deleteCabinetBtn.onclick=deleteItem;el.moveItemLeftBtn.onclick=()=>moveItem(-1);el.moveItemRightBtn.onclick=()=>moveItem(1);
  el.dockAddCabinet.onclick=addCabinet;el.dockAddFiller.onclick=addFiller;el.dockExportHint.onclick=exportSystemView;
  [el.wallWidth,el.ceilingHeight].forEach(input=>input.onchange=()=>{const wall=activeWall();wall.width=clamp(el.wallWidth.value,600,12000,3000);wall.height=clamp(el.ceilingHeight.value,2100,5000,2500);wall.items.filter(i=>i.type==="cabinet"&&i.toCeiling).forEach(c=>c.bodyHeight=Math.max(400,wall.height-c.plinthHeight));renderAll();updateForms();});
  ["cabinetName","cabinetUse","doorSystem","cabinetWidth","bodyHeight","bodyDepth","plinthHeight","boardThickness","toCeiling","partitionMode","bayCount","wallRelation","leftFinishedEnd","rightFinishedEnd"].forEach(id=>el[id].addEventListener("change",syncCabinetFromForm));
  ["fillerName","fillerWidth","fillerHeight","fillerDepth"].forEach(id=>el[id].addEventListener("change",syncFillerFromForm));
  el.autoShelvesBtn.onclick=autoGenerateShelves;el.buildManualFieldsBtn.onclick=buildManualFields;el.applyManualShelvesBtn.onclick=applyManualShelves;el.generateDoorsBtn.onclick=()=>{generateDoorData(selectedCabinet());renderAll();showToast("已重新生成門片");};
  el.rodHeightPreset.onchange=()=>el.customRodHeightField.classList.toggle("hidden",el.rodHeightPreset.value!=="custom");el.applyRodBtn.onclick=applyRod;el.applyDrawersBtn.onclick=applyDrawers;el.clearAccessoriesBtn.onclick=clearAccessories;
  el.showDoorsBtn.onclick=()=>{state.showDoors=!state.showDoors;el.showDoorsBtn.classList.toggle("active",state.showDoors);el.showDoorsBtn.innerHTML=`<i data-lucide="${state.showDoors?"eye":"eye-off"}"></i>`;if(window.lucide)lucide.createIcons();renderAll();};
  el.zoomInBtn.onclick=()=>{state.zoom=clamp(state.zoom+.1,.5,2,1);el.zoomValue.textContent=`${Math.round(state.zoom*100)}%`;renderAll();};el.zoomOutBtn.onclick=()=>{state.zoom=clamp(state.zoom-.1,.5,2,1);el.zoomValue.textContent=`${Math.round(state.zoom*100)}%`;renderAll();};el.fitViewBtn.onclick=()=>{state.zoom=1;el.zoomValue.textContent="100%";renderAll();};
  el.draftCanvas.onclick=e=>{const rect=el.draftCanvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,region=[...state.hitRegions].reverse().find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);if(region){selectItem(region.itemId,region.type,region.compartmentId,false);if(region.compartmentId){state.panel=region.type==="door"?"doors":region.type==="rod"||region.type==="drawers"?"accessories":"shelves";switchPropertyPanel(state.panel);}updateForms();renderAll();openMobileInspector();}};
  el.resetBtn.onclick=()=>{if(!confirm("確定重設系統櫃原型？"))return;localStorage.removeItem(STORAGE_KEY);state.walls=[createWall(0)];state.activeWallId=state.walls[0].id;state.flowStep=0;state.showAdvanced=false;state.renderMode="white";state.renderStyle="nordic";selectItem(state.walls[0].items[0].id);};window.addEventListener("resize",()=>{if(window.innerWidth>700)closeMobileInspector();state.view==="three"?render3D():render2D();});
}
function showToast(message){el.toast.textContent=message;el.toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>el.toast.classList.remove("show"),2200);}

let systemProductProject = null;
let systemProductAutosaveTimer = 0;
let systemProductSuite = null;
let systemRenderHub = null;

function systemProjectSnapshot() {
  const core = window.MODUDRAFTCore;
  if (!core) return null;
  if (!systemProductProject) {
    const activeId = core.storageGet("modudraft:system:active-project", "");
    systemProductProject = core.createProject({ id: activeId || undefined, name: "我的系統櫃配置", type: "cabinet" });
  }
  const walls = state.walls.map((wall, index) => core.normalizeWall({ id: wall.id, name: wall.name, width: wall.width, height: wall.height, thickness: 120, alignment: wall.align }, index));
  const cabinets = [];
  state.walls.forEach((wall) => {
    calculateLayout(wall).forEach(({ item, x }) => {
      if (item.type === "filler") {
        cabinets.push(core.normalizeCabinet({ id: item.id, name: item.name, category: "filler", usage: "filler", wallId: wall.id, runLayer: "full", x, width: item.width, height: item.height, depth: item.depth }));
        return;
      }
      cabinets.push(core.normalizeCabinet({
        id: item.id, name: item.name, category: "tall", usage: item.cabinetKind, wallId: wall.id, runLayer: "full", x,
        width: itemWidth(item), height: item.bodyHeight + item.plinthHeight, depth: cabinetTotalDepth(item),
        doorStyle: `${item.doorSystem}-${item.doorPosition}-${item.doorLayout}`,
        sidePanel: { left: item.leftFinishedEnd, right: item.rightFinishedEnd },
        shelves: item.compartments.map((cell) => ({ id: cell.id, height: cell.height, kind: item.shelfKind, autoFill: cell.autoFill })),
        doors: item.doors,
        drawers: item.compartments.filter((cell) => cell.accessory === "drawers").map((cell) => ({ compartmentId: cell.id, count: cell.drawerCount, height: cell.drawerHeight })),
        accessories: item.compartments.filter((cell) => cell.accessory !== "open").map((cell) => ({ compartmentId: cell.id, type: cell.accessory, rodOffset: cell.rodOffset }))
      }));
    });
  });
  return core.createProject({
    ...systemProductProject,
    type: "cabinet",
    walls,
    cabinets,
    stylePreset: state.projectStyle || systemProductProject.stylePreset,
    materialAssignments: state.materialPalette || systemProductProject.materialAssignments,
    sourceState: { system: { walls: core.cleanData(state.walls), activeWallId: state.activeWallId, showDoors: state.showDoors, materialPalette: state.materialPalette, renderMode: state.renderMode, renderStyle: state.renderStyle } }
  });
}

function scheduleSystemProjectAutosave() {
  if (!window.MODUDRAFTCore || !state.walls.length) return;
  clearTimeout(systemProductAutosaveTimer);
  systemProductAutosaveTimer = setTimeout(() => {
    const snapshot = systemProjectSnapshot();
    if (!snapshot) return;
    systemProductProject = window.MODUDRAFTCore.saveProject(snapshot) || snapshot;
    window.MODUDRAFTCore.storageSet("modudraft:system:active-project", snapshot.id);
  }, 900);
}

function importSystemProject(project) {
  const core = window.MODUDRAFTCore;
  const source = project?.sourceState?.system;
  if (!core || !source?.walls?.length) throw new Error("此專案缺少可編輯的系統櫃配置資料");
  state.walls = core.cleanData(source.walls).map((wall, wallIndex) => ({
    ...createWall(wallIndex),
    ...wall,
    align: ["left", "center", "right"].includes(wall.align) ? wall.align : "left",
    items: (wall.items || []).map((item, itemIndex) => item.type === "filler" ? { ...createFiller(wall), ...item } : normalizeCabinet(item, itemIndex))
  }));
  state.activeWallId = state.walls.some((wall) => wall.id === source.activeWallId) ? source.activeWallId : state.walls[0].id;
  state.showDoors = source.showDoors !== false;
  state.materialPalette = source.materialPalette || project.materialAssignments || null;
  state.projectStyle = project.stylePreset || "modern";
  state.renderMode = source.renderMode === "material" ? "material" : "white";
  state.renderStyle = source.renderStyle || state.projectStyle || "nordic";
  systemProductProject = core.createProject(project);
  core.storageSet("modudraft:system:active-project", systemProductProject.id);
  const wall = activeWall();
  const first = wall.items.find((item) => item.type === "cabinet") || wall.items[0];
  selectItem(first?.id, first?.type || "wall", null, false);
  updateForms();
  renderAll();
  saveState();
}

function applySystemStyle(preset, assignments) {
  state.materialPalette = assignments;
  state.projectStyle = preset.id;
  state.renderStyle = preset.id;
  state.renderMode = "material";
  document.documentElement.dataset.projectStyle = preset.id;
  el.normalRenderBtn?.classList.add("active");
  saveState();
  renderAll();
}

function systemExtraValidation() {
  const issues = [];
  state.walls.forEach((wall) => {
    const validation = projectValidation(wall);
    if (!validation.valid) issues.push({ id: `overflow-${wall.id}`, code: "wall-overflow", level: "error", message: `${wall.name} 的配置超出牆面 ${formatMm(Math.abs(validation.remaining))} mm`, target: wall.id });
    wall.items.filter((item) => item.type === "cabinet").forEach((cabinet) => {
      const total = resolveCompartments(cabinet).reduce((sum, cell) => sum + Number(cell.height || 0), 0);
      if (Math.abs(total - configurableHeight(cabinet)) > 2) issues.push({ id: `cells-${cabinet.id}`, code: "compartment-total", level: "error", message: `${cabinet.name} 的分格合計與可配置高度不一致`, target: cabinet.id });
    });
  });
  return issues;
}

function setSystemReadOnly(readOnly) {
  if (!readOnly) return;
  document.querySelectorAll("input, select, textarea").forEach((node) => { if (!node.closest(".md-suite-panel")) node.disabled = true; });
  document.querySelectorAll("button").forEach((node) => {
    if (!node.closest(".md-suite-panel") && !node.matches("[data-view], #showDoorsBtn, #zoomInBtn, #zoomOutBtn, #fitViewBtn, #normalRenderBtn, #advancedAiRenderBtn, #dockNormalRender, #dockAdvancedAi")) node.disabled = true;
  });
  showToast("客戶展示模式：僅供檢視");
}

function initializeSystemProductSuite() {
  if (!window.MODUDRAFTCore || !window.MODUDRAFTSuite) return;
  const requestedId = new URLSearchParams(location.search).get("project");
  if (requestedId) {
    const stored = window.MODUDRAFTCore.loadProject(requestedId);
    if (stored?.type === "cabinet") importSystemProject(stored);
  }
  systemProductSuite = window.MODUDRAFTSuite.mount({ type: "cabinet", buttonTarget: ".header-actions", getProject: systemProjectSnapshot, importProject: importSystemProject, applyStyle: applySystemStyle, getRenderMode: () => state.renderMode, setRenderMode: setSystemRenderMode, extraValidation: systemExtraValidation, setReadOnly: setSystemReadOnly });
}

function setSystemRenderMode(mode, styleId) {
  state.renderMode = mode === "material" ? "material" : "white";
  if (styleId) state.renderStyle = styleId;
  document.body.dataset.renderMode = state.renderMode;
  el.normalRenderBtn?.classList.toggle("active", state.renderMode === "material");
  saveState();
  renderAll();
}

function previewSystemRender() {
  switchView("three");
  renderAll();
}

function initializeSystemRenderWorkflow() {
  if (!window.MODUDRAFTRender) return;
  systemRenderHub = window.MODUDRAFTRender.mount({
    mode: "cabinet",
    getStyle: () => state.renderStyle || state.projectStyle || "nordic",
    applyStyle: applySystemStyle,
    setMode: setSystemRenderMode,
    preview: previewSystemRender,
    exportImage: async () => { previewSystemRender(); await new Promise((resolve) => setTimeout(resolve, 160)); exportSystemView(); }
  });
  const openNormal = () => systemRenderHub.openMaterial();
  const openAi = () => { systemProductSuite?.setTab("ai"); systemProductSuite?.open(); };
  el.normalRenderBtn.onclick = openNormal;
  el.dockNormalRender.onclick = openNormal;
  el.advancedAiRenderBtn.onclick = openAi;
  el.dockAdvancedAi.onclick = openAi;
  el.normalRenderBtn.classList.toggle("active", state.renderMode === "material");
}

function initialize(){cacheElements();loadState();bindEvents();el.showDoorsBtn.classList.toggle("active",state.showDoors);updateForms();switchView(state.view,true);updateFlowUI();if(window.lucide)window.lucide.createIcons();initializeSystemProductSuite();initializeSystemRenderWorkflow();window.MODUDRAFTHelp?.mount({mode:"cabinet",assetBase:"../",buttonTarget:".header-actions"});}
document.addEventListener("DOMContentLoaded",initialize);
