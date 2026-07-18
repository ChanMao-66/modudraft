(function (global) {
  "use strict";

  const SCHEMA_VERSION = 3;
  const BLIND_CORNER_DEFAULTS = Object.freeze({
    cornerType: "blindCorner",
    cornerHanding: "left",
    adjacentCabinetDepthRef: 560,
    adjacentDoorReferencePanelWidth: 20,
    hingeMountPanelWidth: 20,
    frontDoorWidth: 400,
    depth: 560,
    height: 850,
    hasCornerShelf: true,
    cornerShelfCount: 1,
    hasCornerHardware: false,
    cornerHardwareType: "none",
    showInternalStructure: true
  });
  const PROJECT_INDEX_KEY = "modudraft:projects:v1";
  const PROJECT_KEY_PREFIX = "modudraft:project:v1:";
  const DEFAULT_PRICING = Object.freeze({
    baseCabinetPricePerMm: 12,
    wallCabinetPricePerMm: 9,
    tallCabinetPricePerMm: 16,
    countertopPricePerMm: 7,
    fillerPricePerPiece: 1200,
    handlePricePerPiece: 280,
    sinkDefaultPrice: 8500,
    cooktopDefaultPrice: 12000,
    hoodDefaultPrice: 9800,
    installationBasePrice: 18000
  });

  const KITCHEN_RULES = Object.freeze({
    dimensions: Object.freeze({
      lowerHeight: 860,
      toeKickHeight: 120,
      lowerBodyHeight: 700,
      counterThickness: 40,
      lowerDepth: 580,
      counterDepth: 600,
      upperHeight: 700,
      upperDepth: 370,
      middleGap: 700,
      wallThickness: 120,
      backsplashHeight: 80,
      backsplashThickness: 20,
      sidePanelThickness: 20,
      doorThickness: 20
    }),
    straight: Object.freeze({
      minWallWidth: 1200,
      minimumSinkWidth: 600,
      preferredSinkWidth: 800,
      minimumCooktopWidth: 600,
      preferredCooktopWidth: 700,
      minimumMiddleWidth: 500,
      minimumStorageWidth: 250,
      preferredStorageWidth: 600,
      preferredStorageMaxWidth: 750,
      defaultEdgeFillerWidth: 20,
      minimumUsefulFillerWidth: 20
    }),
    sink: Object.freeze({
      outerLengthMin: 580,
      outerLengthPreferred: 680,
      outerLengthMax: 750,
      outerDepthMin: 430,
      outerDepthPreferred: 440,
      outerDepthMax: 450,
      bowlDepthMin: 180,
      bowlDepthPreferred: 200,
      bowlDepthMax: 220
    }),
    lShape: Object.freeze({
      blindCornerWidth: 1000,
      minWallWidth: 1200
    }),
    sinkStove: Object.freeze({
      // 先作為提醒值，不作為阻止配置的硬性限制；待教學規則確認後可調整。
      suggestedMinimumDistance: 300
    })
  });

  const MATERIALS = [
    { id: "door-mist-white", name: "霧面暖白", category: "door", color: "#e8e5df", roughness: 0.78, metalness: 0, price: 1380, note: "柔霧門板" },
    { id: "door-cream", name: "奶油米", category: "door", color: "#d9cdbd", roughness: 0.75, metalness: 0, price: 1480, note: "低飽和奶油色" },
    { id: "body-oak", name: "淺橡木", category: "body", color: "#b99a76", roughness: 0.72, metalness: 0, price: 1280, note: "自然木質櫃身" },
    { id: "body-walnut", name: "煙燻胡桃", category: "body", color: "#5c4637", roughness: 0.7, metalness: 0, price: 1680, note: "深色精品木紋" },
    { id: "counter-quartz", name: "雲霧石英", category: "countertop", color: "#d9d5cd", roughness: 0.42, metalness: 0, price: 6200, note: "淺色人造石" },
    { id: "counter-charcoal", name: "炭灰岩板", category: "countertop", color: "#474744", roughness: 0.55, metalness: 0, price: 7600, note: "深色霧面檯面" },
    { id: "handle-champagne", name: "香檳金", category: "handle", color: "#9c7b58", roughness: 0.28, metalness: 0.72, price: 420, note: "金屬把手" },
    { id: "handle-graphite", name: "石墨灰", category: "handle", color: "#373a3b", roughness: 0.35, metalness: 0.65, price: 360, note: "低調深色五金" },
    { id: "wall-warm", name: "暖灰牆面", category: "wall", color: "#d1cbc1", roughness: 0.88, metalness: 0, price: 0, note: "展示空間牆面" },
    { id: "floor-oak", name: "自然木地板", category: "floor", color: "#9a8065", roughness: 0.76, metalness: 0, price: 0, note: "暖木地坪" }
  ];

  const STYLE_PRESETS = [
    { id: "modern", name: "現代白灰", description: "暖白門板、雲霧石英與石墨五金", door: "door-mist-white", body: "door-mist-white", countertop: "counter-quartz", handle: "handle-graphite", wall: "wall-warm", floor: "floor-oak" },
    { id: "cream", name: "奶油風", description: "奶油米門板與香檳金細節", door: "door-cream", body: "door-cream", countertop: "counter-quartz", handle: "handle-champagne", wall: "wall-warm", floor: "floor-oak" },
    { id: "nordic", name: "木質北歐", description: "淺橡木與霧面暖白的明亮組合", door: "body-oak", body: "door-mist-white", countertop: "counter-quartz", handle: "handle-graphite", wall: "wall-warm", floor: "floor-oak" },
    { id: "dark", name: "深色高級感", description: "煙燻胡桃、炭灰岩板與香檳金", door: "body-walnut", body: "body-walnut", countertop: "counter-charcoal", handle: "handle-champagne", wall: "wall-warm", floor: "floor-oak" },
    { id: "japanese", name: "日式簡約", description: "淺木色、暖白與低對比材質", door: "body-oak", body: "door-mist-white", countertop: "counter-quartz", handle: "handle-graphite", wall: "wall-warm", floor: "floor-oak" },
    { id: "industrial", name: "工業風", description: "深胡桃、炭灰與石墨五金", door: "body-walnut", body: "body-walnut", countertop: "counter-charcoal", handle: "handle-graphite", wall: "wall-warm", floor: "floor-oak" }
  ];

  function uid(prefix) {
    const random = Math.random().toString(36).slice(2, 8);
    return `${prefix || "item"}-${Date.now().toString(36)}-${random}`;
  }

  function finiteNumber(value, fallback, min, max) {
    const parsed = Number(value);
    const safe = Number.isFinite(parsed) ? parsed : fallback;
    return Math.min(max == null ? Number.MAX_SAFE_INTEGER : max, Math.max(min == null ? 0 : min, safe));
  }

  function normalizeBlindCorner(input) {
    const source = input || {};
    const adjacentCabinetDepthRef = finiteNumber(source.adjacentCabinetDepthRef, BLIND_CORNER_DEFAULTS.adjacentCabinetDepthRef, 0, 1500);
    const adjacentDoorReferencePanelWidth = finiteNumber(source.adjacentDoorReferencePanelWidth, BLIND_CORNER_DEFAULTS.adjacentDoorReferencePanelWidth, 0, 200);
    const hingeMountPanelWidth = finiteNumber(source.hingeMountPanelWidth ?? source.clearancePanelWidth / 2, BLIND_CORNER_DEFAULTS.hingeMountPanelWidth, 0, 200);
    const frontDoorWidth = finiteNumber(source.frontDoorWidth, BLIND_CORNER_DEFAULTS.frontDoorWidth, 0, 1200);
    const totalWidth = adjacentCabinetDepthRef + adjacentDoorReferencePanelWidth + hingeMountPanelWidth + frontDoorWidth;
    const sourceTotalWidth = Number(source.totalWidth ?? source.width);
    const cornerStructureAdjusted = source.cornerStructureAdjusted === true
      || (Number.isFinite(sourceTotalWidth) && Math.abs(sourceTotalWidth - totalWidth) > 0.5);
    const hasCornerHardware = source.hasCornerHardware === true;
    const hardwareTypes = ["none", "magicCorner", "lemans", "halfLazySusan"];
    const cornerHardwareType = hasCornerHardware && hardwareTypes.includes(source.cornerHardwareType)
      ? source.cornerHardwareType
      : "none";
    return {
      cornerType: "blindCorner",
      cornerHanding: source.cornerHanding === "right" ? "right" : "left",
      totalWidth,
      width: totalWidth,
      originalTotalWidth: Number.isFinite(sourceTotalWidth) ? sourceTotalWidth : totalWidth,
      cornerStructureAdjusted,
      depth: finiteNumber(source.depth, BLIND_CORNER_DEFAULTS.depth, 300, 900),
      height: finiteNumber(source.height ?? source.customHeight, BLIND_CORNER_DEFAULTS.height, 300, 1500),
      adjacentCabinetDepthRef,
      adjacentDoorReferencePanelWidth,
      hingeMountPanelWidth,
      frontDoorWidth,
      hasCornerShelf: source.hasCornerShelf !== false,
      cornerShelfCount: Math.round(finiteNumber(source.cornerShelfCount, BLIND_CORNER_DEFAULTS.cornerShelfCount, 0, 8)),
      hasCornerHardware,
      cornerHardwareType,
      showInternalStructure: source.showInternalStructure !== false
    };
  }

  function blindCornerSegments(input) {
    const corner = normalizeBlindCorner(input);
    const segments = [
      { key: "adjacentDepth", label: "另一側櫃體深度對應區", width: corner.adjacentCabinetDepthRef },
      { key: "adjacentDoorPanel", label: "相鄰門板對應板", width: corner.adjacentDoorReferencePanelWidth },
      { key: "hingePanel", label: "鉸鏈安裝板", width: corner.hingeMountPanelWidth },
      { key: "frontDoor", label: "正面門片區", width: corner.frontDoorWidth }
    ];
    return corner.cornerHanding === "right" ? segments.slice().reverse() : segments;
  }

  function validateBlindCorner(input, targetId) {
    const source = input || {};
    const corner = normalizeBlindCorner(source);
    const result = [];
    const rawTotal = Number(source.totalWidth ?? source.width);
    if (corner.cornerStructureAdjusted || (Number.isFinite(rawTotal) && Math.abs(rawTotal - corner.totalWidth) > 0.5)) result.push(issue("blind-corner-total", "error", `盲角轉角下櫃總寬應為 ${corner.adjacentCabinetDepthRef} + ${corner.adjacentDoorReferencePanelWidth} + ${corner.hingeMountPanelWidth} + ${corner.frontDoorWidth} = ${corner.totalWidth} mm。`, targetId));
    if (corner.adjacentDoorReferencePanelWidth < 18) result.push(issue("blind-corner-reference-panel", "warning", "相鄰門板對應板不可小於 18 mm，建議使用 20 mm。", targetId));
    if (corner.hingeMountPanelWidth < 18) result.push(issue("blind-corner-hinge-panel", "warning", "鉸鏈安裝板不足，門片開啟時可能撞擊相鄰櫃體門板。", targetId));
    if (corner.frontDoorWidth < 350) result.push(issue("blind-corner-door-width", "warning", "盲角轉角下櫃正面門片不可小於 350 mm，建議使用 400 mm。", targetId));
    if (Math.abs(corner.adjacentCabinetDepthRef - corner.depth) > 1) result.push(issue("blind-corner-depth-reference", "warning", `另一側櫃體深度對應值 ${corner.adjacentCabinetDepthRef} mm 與目前櫃深 ${corner.depth} mm 不一致。`, targetId));
    if (source.cornerHanding != null && !["left", "right"].includes(source.cornerHanding)) result.push(issue("blind-corner-handing", "error", "盲角方向必須選擇左盲角或右盲角。", targetId));
    if (["magicCorner", "lemans"].includes(corner.cornerHardwareType) && corner.frontDoorWidth < 450) result.push(issue("blind-corner-hardware-door", "warning", `${corner.cornerHardwareType === "lemans" ? "LeMans" : "Magic Corner"} 五金建議門片至少 450 mm。`, targetId));
    return result;
  }

  function cleanData(value) {
    if (Array.isArray(value)) return value.map(cleanData);
    if (!value || typeof value !== "object") {
      return typeof value === "number" && !Number.isFinite(value) ? 0 : value;
    }
    return Object.keys(value).reduce((result, key) => {
      if (typeof value[key] !== "function" && value[key] !== undefined) result[key] = cleanData(value[key]);
      return result;
    }, {});
  }

  function createProject(input) {
    const source = input || {};
    const now = new Date().toISOString();
    return {
      schemaVersion: SCHEMA_VERSION,
      version: source.version || "3.0",
      id: source.id || uid("project"),
      name: source.name || (source.type === "cabinet" ? "未命名系統櫃" : "未命名廚具"),
      type: ["kitchen", "cabinet", "fullInterior"].includes(source.type) ? source.type : "kitchen",
      mode: ["kitchen", "systemCabinet"].includes(source.mode) ? source.mode : (source.type === "cabinet" ? "systemCabinet" : "kitchen"),
      editorMode: source.editorMode === "beginner" ? "beginner" : "pro",
      kitchenType: ["straight", "L", "U", "island"].includes(source.kitchenType) ? source.kitchenType : "straight",
      createdAt: source.createdAt || now,
      updatedAt: now,
      thumbnail: source.thumbnail || "",
      unit: "mm",
      rooms: Array.isArray(source.rooms) ? source.rooms : [],
      walls: Array.isArray(source.walls) ? source.walls.map(normalizeWall) : [],
      openings: Array.isArray(source.openings) ? source.openings : [],
      cabinets: Array.isArray(source.cabinets) ? source.cabinets.map(normalizeCabinet) : [],
      appliances: Array.isArray(source.appliances) ? source.appliances : [],
      panels: Array.isArray(source.panels) ? source.panels : [],
      countertops: Array.isArray(source.countertops) ? source.countertops : [],
      materials: Array.isArray(source.materials) ? source.materials : MATERIALS.slice(),
      materialAssignments: source.materialAssignments || {},
      stylePreset: source.stylePreset || "modern",
      cameras: Array.isArray(source.cameras) ? source.cameras : [],
      renderSettings: Object.assign({ ratio: "4:3", resolution: "1920x1440", lighting: "自然柔光", style: "現代簡約" }, source.renderSettings || {}),
      exportSettings: Object.assign({ format: "jpg", includeDimensions: true, includeNotes: true }, source.exportSettings || {}),
      quotationItems: Array.isArray(source.quotationItems) ? source.quotationItems : [],
      estimateDocument: source.estimateDocument && typeof source.estimateDocument === "object" ? cleanData(source.estimateDocument) : null,
      estimateRates: source.estimateRates && typeof source.estimateRates === "object" ? cleanData(source.estimateRates) : {},
      pricing: Object.assign({}, DEFAULT_PRICING, source.pricing || source.pricingSettings || {}),
      validations: Array.isArray(source.validations) ? source.validations : [],
      viewSettings: Object.assign({ activeView: "floor", showDimensions: true, showWalls: true }, source.viewSettings || {}),
      workflowState: cleanData(source.workflowState || {}),
      cabinetListSettings: Object.assign({ includeMaterials: true, includeNotes: true }, source.cabinetListSettings || {}),
      sourceState: cleanData(source.sourceState || {})
    };
  }

  function migrateProject(raw, fallbackType) {
    if (!raw || typeof raw !== "object") return createProject({ type: fallbackType });
    if (raw.schemaVersion === SCHEMA_VERSION) return createProject(raw);
    const legacy = raw.project && typeof raw.project === "object" ? raw.project : raw;
    const migrated = createProject({
      id: legacy.id,
      name: legacy.name,
      type: fallbackType || legacy.type,
      mode: legacy.mode,
      editorMode: legacy.editorMode,
      kitchenType: legacy.kitchenType || (legacy.sourceState?.kitchen?.walls?.length > 1 ? "L" : "straight"),
      createdAt: legacy.createdAt,
      updatedAt: legacy.updatedAt,
      walls: legacy.walls,
      cabinets: legacy.cabinets,
      appliances: legacy.appliances,
      panels: legacy.panels,
      countertops: legacy.countertops,
      materials: legacy.materials,
      materialAssignments: legacy.materialAssignments,
      stylePreset: legacy.stylePreset,
      pricing: legacy.pricing || legacy.pricingSettings,
      estimateDocument: legacy.estimateDocument,
      estimateRates: legacy.estimateRates,
      renderSettings: legacy.renderSettings,
      exportSettings: legacy.exportSettings,
      viewSettings: legacy.viewSettings,
      workflowState: legacy.workflowState,
      cabinetListSettings: legacy.cabinetListSettings,
      sourceState: legacy.sourceState && Object.keys(legacy.sourceState).length ? legacy.sourceState : legacy
    });
    migrated.migratedFrom = Number(raw.schemaVersion) || 0;
    return migrated;
  }

  function normalizeWall(wall, index) {
    const source = wall || {};
    const width = finiteNumber(source.width, 3000, 300, 30000);
    const height = finiteNumber(source.height, 2500, 300, 10000);
    return Object.assign({}, source, {
      id: source.id || uid("wall"),
      name: source.name || `${String.fromCharCode(65 + (index || 0))}牆`,
      width,
      height,
      thickness: finiteNumber(source.thickness, 120, 20, 1000),
      x: finiteNumber(source.x ?? source.startPoint?.x, 0, -30000, 30000),
      y: finiteNumber(source.y ?? source.startPoint?.y, 0, -30000, 30000),
      angle: finiteNumber(source.angle, 0, -360, 360),
      type: ["main", "side", "island"].includes(source.type) ? source.type : ((index || 0) === 0 ? "main" : "side"),
      alignment: ["left", "center", "right"].includes(source.alignment || source.align) ? (source.alignment || source.align) : "left",
      openings: Array.isArray(source.openings) ? source.openings : []
    });
  }

  function normalizeCabinet(cabinet) {
    const source = cabinet || {};
    const categoryMap = { lower: "baseCabinet", upper: "wallCabinet", base: "baseCabinet", wall: "wallCabinet", tall: "tallCabinet", filler: "filler", appliance: "appliance" };
    const isBlindCorner = source.cornerType === "blindCorner" || ["blind-corner", "blindCorner"].includes(source.usage || source.purpose || source.cabinetKind);
    const corner = isBlindCorner ? normalizeBlindCorner(source) : null;
    const usage = isBlindCorner ? "blind-corner" : (source.usage || source.purpose || source.cabinetKind || "storage");
    const category = source.category || categoryMap[source.type] || (usage === "filler" ? "filler" : "baseCabinet");
    const typeMap = { baseCabinet: "base", wallCabinet: "wall", tallCabinet: "tall", filler: "filler", appliance: "appliance" };
    return Object.assign({}, source, corner || {}, {
      id: source.id || uid("cabinet"),
      name: source.name || (isBlindCorner ? "盲角轉角下櫃 1000" : "未命名櫃體"),
      type: source.type && !["lower", "upper"].includes(source.type) ? source.type : (typeMap[category] || (source.type === "upper" ? "wall" : "base")),
      category,
      usage,
      wallId: source.wallId || "",
      orderIndex: finiteNumber(source.orderIndex, 0, 0, 9999),
      width: isBlindCorner ? corner.totalWidth : finiteNumber(source.width, 600, 50, 5000),
      totalWidth: isBlindCorner ? corner.totalWidth : finiteNumber(source.totalWidth ?? source.width, 600, 50, 5000),
      height: finiteNumber(source.height == null ? source.bodyHeight : source.height, isBlindCorner ? BLIND_CORNER_DEFAULTS.height : 2400, 50, 5000),
      depth: finiteNumber(source.depth, isBlindCorner ? BLIND_CORNER_DEFAULTS.depth : 600, 50, 1500),
      x: finiteNumber(source.x, 0, -30000, 30000),
      y: finiteNumber(source.y, 0, -30000, 30000),
      z: finiteNumber(source.z, 0, -30000, 30000),
      materialId: source.materialId || "door-mist-white",
      doorStyle: source.doorStyle || source.frontStyle || (isBlindCorner ? "single-door" : "double-door"),
      handleStyle: source.handleStyle || "none",
      hasCountertop: source.hasCountertop ?? source.countertop ?? category === "baseCabinet",
      hasToeKick: source.hasToeKick ?? source.toeKick ?? category === "baseCabinet",
      isSinkCabinet: source.isSinkCabinet ?? usage === "sink",
      isCooktopCabinet: source.isCooktopCabinet ?? ["stove", "cooktop"].includes(usage),
      isFiller: source.isFiller ?? (usage === "filler" || category === "filler"),
      canResize: source.canResize !== false,
      canMove: source.canMove !== false,
      includeInQuote: source.includeInQuote !== false,
      priceRuleId: source.priceRuleId || "",
      notes: source.notes || "",
      warnings: Array.isArray(source.warnings) ? source.warnings : [],
      shelves: Array.isArray(source.shelves) ? source.shelves : [],
      doors: Array.isArray(source.doors) ? source.doors : [],
      drawers: Array.isArray(source.drawers) ? source.drawers : [],
      accessories: Array.isArray(source.accessories) ? source.accessories : []
    });
  }

  function issue(code, level, message, target) {
    return { id: uid("issue"), code, level, message, target: target || null };
  }

  function validateWall(wall) {
    const result = [];
    if (!wall || !Number.isFinite(Number(wall.width)) || Number(wall.width) <= 0) result.push(issue("wall-width", "error", "請輸入有效的牆面寬度。", wall && wall.id));
    else if (Number(wall.width) < 1200) result.push(issue("wall-width-small", "error", "牆面寬度不可小於 1200 mm。", wall.id));
    if (!wall || !Number.isFinite(Number(wall.height)) || Number(wall.height) <= 0) result.push(issue("wall-height", "error", "請輸入有效的天花高度。", wall && wall.id));
    else if (Number(wall.height) < 2000) result.push(issue("wall-height-small", "error", "天花高度不可小於 2000 mm。", wall.id));
    return result;
  }

  function validateCabinet(cabinet, wall) {
    const result = [];
    const normalized = normalizeCabinet(cabinet);
    if (normalized.cornerType === "blindCorner") result.push(...validateBlindCorner(cabinet, normalized.id));
    if (normalized.width < 200 && normalized.usage !== "filler") result.push(issue("cabinet-narrow", "warning", `${normalized.name} 寬度過窄，請確認施工可行性`, normalized.id));
    if (normalized.height > finiteNumber(wall && wall.height, 10000, 0, 10000)) result.push(issue("cabinet-ceiling", "error", `${normalized.name} 高度超過天花`, normalized.id));
    if (normalized.doorSystem === "sliding" && normalized.usage === "wardrobe" && normalized.depth < 650) result.push(issue("sliding-depth", "warning", `${normalized.name} 為衣櫃推拉門，建議深度至少 650 mm`, normalized.id));
    if (normalized.width > 1100 && normalized.usage !== "filler") result.push(issue("door-wide", "warning", `${normalized.name} 寬度較大，建議加入中立板或分櫃`, normalized.id));
    if (normalized.isSinkCabinet && normalized.width < 600) result.push(issue("sink-width", "warning", `${normalized.name} 寬度低於建議值，建議至少 600 mm。`, normalized.id));
    if (normalized.isCooktopCabinet && normalized.width < 600) result.push(issue("cooktop-width", "warning", `${normalized.name} 寬度低於建議值，建議至少 600 mm。`, normalized.id));
    if (normalized.category === "baseCabinet" && (normalized.depth < 500 || normalized.depth > 700)) result.push(issue("base-depth", "warning", `${normalized.name} 深度 ${Math.round(normalized.depth)} mm，請確認是否符合下櫃施工需求。`, normalized.id));
    if (normalized.category === "wallCabinet" && (normalized.depth < 280 || normalized.depth > 450)) result.push(issue("wall-depth", "warning", `${normalized.name} 深度 ${Math.round(normalized.depth)} mm，請確認是否符合吊櫃施工需求。`, normalized.id));
    return result;
  }

  function validateProject(project) {
    const normalized = migrateProject(project, project && project.type);
    const result = [];
    normalized.walls.forEach((wall, index) => {
      result.push(...validateWall(wall));
      const wallCabinets = normalized.cabinets.filter((cabinet) => !cabinet.wallId || cabinet.wallId === wall.id);
      const layerWidths = wallCabinets.reduce((groups, cabinet) => {
        const layer = cabinet.runLayer || "default";
        groups[layer] = (groups[layer] || 0) + finiteNumber(cabinet.width, 0, 0, 30000);
        return groups;
      }, {});
      const used = Math.max(0, ...Object.values(layerWidths));
      if (used > finiteNumber(wall.width, 0, 0, 30000)) result.push(issue("wall-overflow", "error", `${wall.name || "牆面"} 的櫃體總寬超出牆面 ${Math.round(used - wall.width)} mm，請減少櫃體寬度或刪除櫃體。`, wall.id));
      const remaining = finiteNumber(wall.width, 0, 0, 30000) - used;
      if (remaining >= 20 && remaining < 150) result.push(issue("filler-suggestion", "warning", `目前剩餘 ${Math.round(remaining)} mm，建議設定為補板。`, wall.id));
      wallCabinets.forEach((cabinet) => result.push(...validateCabinet(cabinet, wall)));
      const ordered = wallCabinets.filter((cabinet) => (cabinet.runLayer || "default") !== "upper").map(normalizeCabinet).sort((a,b)=>a.x-b.x);
      for (let cursor = 1; cursor < ordered.length; cursor += 1) {
        const previous = ordered[cursor - 1];
        const current = ordered[cursor];
        if (current.x < previous.x + previous.width - 0.5) result.push(issue("cabinet-overlap", "error", `${current.name} 與 ${previous.name} 發生重疊，請調整位置或寬度。`, current.id));
      }
    });
    return result;
  }

  function storageGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (error) {
      console.warn("MODUDRAFT 儲存讀取失敗", error);
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(cleanData(value)));
      return true;
    } catch (error) {
      console.warn("MODUDRAFT 儲存寫入失敗", error);
      return false;
    }
  }

  function saveProject(project) {
    const normalized = migrateProject(project, project && project.type);
    normalized.updatedAt = new Date().toISOString();
    if (!storageSet(PROJECT_KEY_PREFIX + normalized.id, normalized)) return false;
    const index = storageGet(PROJECT_INDEX_KEY, []).filter((item) => item.id !== normalized.id);
    index.unshift({ id: normalized.id, name: normalized.name, type: normalized.type, updatedAt: normalized.updatedAt, thumbnail: normalized.thumbnail || "" });
    storageSet(PROJECT_INDEX_KEY, index.slice(0, 24));
    return normalized;
  }

  function listProjects() {
    return storageGet(PROJECT_INDEX_KEY, []).filter((item) => item && item.id);
  }

  function loadProject(id) {
    const raw = storageGet(PROJECT_KEY_PREFIX + id, null);
    return raw ? migrateProject(raw, raw.type) : null;
  }

  function deleteProject(id) {
    try { localStorage.removeItem(PROJECT_KEY_PREFIX + id); } catch (error) { console.warn(error); }
    storageSet(PROJECT_INDEX_KEY, listProjects().filter((item) => item.id !== id));
  }

  function downloadJson(project) {
    const normalized = migrateProject(project, project && project.type);
    const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: "application/json;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${(normalized.name || "MODUDRAFT-專案").replace(/[\\/:*?\"<>|]/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function importJson(file, fallbackType) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("尚未選擇 JSON 專案檔"));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("無法讀取專案檔"));
      reader.onload = () => {
        try { resolve(migrateProject(JSON.parse(reader.result), fallbackType)); }
        catch (error) { reject(new Error("JSON 專案檔格式不正確")); }
      };
      reader.readAsText(file, "utf-8");
    });
  }

  function materialById(id) {
    return MATERIALS.find((item) => item.id === id) || null;
  }

  function generateAiPrompt(project, options) {
    const normalized = migrateProject(project, project && project.type);
    const settings = Object.assign({}, normalized.renderSettings, options || {});
    const preset = STYLE_PRESETS.find((item) => item.id === normalized.stylePreset);
    const assignments = normalized.materialAssignments || {};
    const names = [assignments.door, assignments.body, assignments.countertop, assignments.handle]
      .map(materialById).filter(Boolean).map((item) => item.name);
    const roomType = normalized.type === "kitchen" ? "廚房廚具" : normalized.type === "cabinet" ? "系統櫃收納空間" : "室內空間";
    const cabinets = normalized.cabinets.map(normalizeCabinet);
    const lower = cabinets.filter((item) => item.category === "baseCabinet").length;
    const upper = cabinets.filter((item) => item.category === "wallCabinet").length;
    const tall = cabinets.filter((item) => item.category === "tallCabinet").length;
    const sink = cabinets.find((item) => item.isSinkCabinet);
    const cooktop = cabinets.find((item) => item.isCooktopCabinet);
    const wallSummary = normalized.walls.map((wall) => `${wall.name || "牆面"} ${Math.round(finiteNumber(wall.width, 0, 0, 30000))} × ${Math.round(finiteNumber(wall.height, 0, 0, 10000))} mm`).join("、");
    const kitchenTypeLabel = { straight: "一字型", L: "L 型", U: "U 型", island: "中島型" }[normalized.kitchenType] || normalized.kitchenType;
    return [
      `請將這張 MODUDRAFT ${roomType}配置截圖渲染成高品質、寫實的室內設計提案圖。`,
      normalized.type === "kitchen" ? `廚房型態：${kitchenTypeLabel}；牆面尺寸：${wallSummary || "依原圖"}。` : `空間尺寸：${wallSummary || "依原圖"}。`,
      `目前配置：下櫃 ${lower} 座、吊櫃 ${upper} 座、高櫃 ${tall} 座${sink ? `，包含${sink.name}` : ""}${cooktop ? `，包含${cooktop.name}` : ""}。`,
      `設計風格：${settings.style || (preset && preset.name) || "現代簡約"}；光線：${settings.lighting || "自然柔光"}。`,
      names.length ? `主要材質：${names.join("、")}。` : "材質請維持低飽和、耐看的室內設計質感。",
      `請嚴格保留原圖的牆面、櫃體尺寸比例、櫃體數量、門片分割、設備位置與目前相機視角。`,
      `不得任意新增或刪除櫃體，不得改變水槽、爐台、吊櫃、層板、抽屜或吊衣桿的位置。`,
      `請補上合理的牆面、地板、柔和陰影與真實材質細節，輸出比例 ${settings.ratio || "4:3"}，解析度 ${settings.resolution || "1920x1440"}。`
    ].join("\n");
  }

  global.MODUDRAFTCore = Object.freeze({
    SCHEMA_VERSION,
    MATERIALS,
    STYLE_PRESETS,
    DEFAULT_PRICING,
    KITCHEN_RULES,
    BLIND_CORNER_DEFAULTS,
    uid,
    finiteNumber,
    cleanData,
    createProject,
    migrateProject,
    normalizeWall,
    normalizeCabinet,
    normalizeBlindCorner,
    blindCornerSegments,
    validateBlindCorner,
    validateWall,
    validateCabinet,
    validateProject,
    saveProject,
    listProjects,
    loadProject,
    deleteProject,
    downloadJson,
    importJson,
    generateAiPrompt,
    materialById,
    storageGet,
    storageSet
  });
})(window);
