(function (global) {
  "use strict";

  const STORAGE_KEY = "modudraft:kitchen-workflow:v1";
  const CONFIG_VERSION = 2;
  const START_DISMISSED_KEY = "modudraft:kitchen-start-dismissed";
  const START_MODE_KEY = "modudraft:kitchen-start-mode";
  const CORE_RULES = global.MODUDRAFTCore?.KITCHEN_RULES || {};
  const DIMENSIONS = CORE_RULES.dimensions || {
    lowerHeight: 860,
    lowerDepth: 580,
    upperHeight: 700,
    upperDepth: 370,
    counterDepth: 600
  };
  const STRAIGHT_RULES = CORE_RULES.straight || {
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
  };
  const L_RULES = CORE_RULES.lShape || { blindCornerWidth: 1000, minWallWidth: 1200 };

  const STANDARD_CABINETS = Object.freeze([
    { id: "base-300", name: "標準下櫃 300", layer: "lower", purpose: "general", width: 300, height: DIMENSIONS.lowerHeight, depth: DIMENSIONS.lowerDepth, hasCountertop: true, hasToeKick: true, priceRuleId: "baseCabinetBasicPerCm" },
    { id: "base-400", name: "標準下櫃 400", layer: "lower", purpose: "general", width: 400, height: DIMENSIONS.lowerHeight, depth: DIMENSIONS.lowerDepth, hasCountertop: true, hasToeKick: true, priceRuleId: "baseCabinetBasicPerCm" },
    { id: "base-450", name: "標準下櫃 450", layer: "lower", purpose: "general", width: 450, height: DIMENSIONS.lowerHeight, depth: DIMENSIONS.lowerDepth, hasCountertop: true, hasToeKick: true, priceRuleId: "baseCabinetBasicPerCm" },
    { id: "base-600", name: "標準下櫃 600", layer: "lower", purpose: "general", width: 600, height: DIMENSIONS.lowerHeight, depth: DIMENSIONS.lowerDepth, hasCountertop: true, hasToeKick: true, priceRuleId: "baseCabinetBasicPerCm" },
    { id: "base-800", name: "標準下櫃 800", layer: "lower", purpose: "general", width: 800, height: DIMENSIONS.lowerHeight, depth: DIMENSIONS.lowerDepth, hasCountertop: true, hasToeKick: true, priceRuleId: "baseCabinetBasicPerCm" },
    { id: "drawer-600", name: "抽屜下櫃 600", layer: "lower", purpose: "drawer", width: 600, height: DIMENSIONS.lowerHeight, depth: DIMENSIONS.lowerDepth, hasCountertop: true, hasToeKick: true, priceRuleId: "baseCabinetMediumPerCm" },
    { id: "sink-600", name: "水槽下櫃 600", layer: "lower", purpose: "sink", width: 600, height: DIMENSIONS.lowerHeight, depth: DIMENSIONS.lowerDepth, hasCountertop: true, hasToeKick: true, priceRuleId: "baseCabinetBasicPerCm" },
    { id: "sink-800", name: "水槽下櫃 800", layer: "lower", purpose: "sink", width: 800, height: DIMENSIONS.lowerHeight, depth: DIMENSIONS.lowerDepth, hasCountertop: true, hasToeKick: true, priceRuleId: "baseCabinetBasicPerCm" },
    { id: "stove-600", name: "爐台下櫃 600", layer: "lower", purpose: "stove", width: 600, height: DIMENSIONS.lowerHeight, depth: DIMENSIONS.lowerDepth, hasCountertop: true, hasToeKick: true, priceRuleId: "baseCabinetBasicPerCm" },
    { id: "stove-700", name: "爐台下櫃 700", layer: "lower", purpose: "stove", width: 700, height: DIMENSIONS.lowerHeight, depth: DIMENSIONS.lowerDepth, hasCountertop: true, hasToeKick: true, priceRuleId: "baseCabinetBasicPerCm" },
    { id: "blind-corner-1000", name: "盲角轉角下櫃 1000", layer: "lower", purpose: "blind-corner", width: L_RULES.blindCornerWidth, totalWidth: L_RULES.blindCornerWidth, height: DIMENSIONS.lowerHeight, depth: DIMENSIONS.lowerDepth, cornerType: "blindCorner", cornerHanding: "left", adjacentCabinetDepthRef: 560, adjacentDoorReferencePanelWidth: 20, hingeMountPanelWidth: 20, frontDoorWidth: 400, hasCornerShelf: true, cornerShelfCount: 1, hasCornerHardware: false, cornerHardwareType: "none", showInternalStructure: true, hasCountertop: true, hasToeKick: true, frontStyle: "single-door", priceRuleId: "baseCabinetBasicPerCm", description: "560 / 20 / 20 / 400 結構；雙 20 板分別作為門板對位與鉸鏈安裝。" },
    { id: "wall-300", name: "標準吊櫃 300", layer: "upper", purpose: "general", width: 300, height: DIMENSIONS.upperHeight, depth: DIMENSIONS.upperDepth, priceRuleId: "upperCabinetBasicPerCm" },
    { id: "wall-400", name: "標準吊櫃 400", layer: "upper", purpose: "general", width: 400, height: DIMENSIONS.upperHeight, depth: DIMENSIONS.upperDepth, priceRuleId: "upperCabinetBasicPerCm" },
    { id: "wall-600", name: "標準吊櫃 600", layer: "upper", purpose: "general", width: 600, height: DIMENSIONS.upperHeight, depth: DIMENSIONS.upperDepth, priceRuleId: "upperCabinetBasicPerCm" },
    { id: "wall-800", name: "標準吊櫃 800", layer: "upper", purpose: "general", width: 800, height: DIMENSIONS.upperHeight, depth: DIMENSIONS.upperDepth, priceRuleId: "upperCabinetBasicPerCm" },
    { id: "hood-700", name: "排油煙機吊櫃 700", layer: "upper", purpose: "hood", width: 700, height: DIMENSIONS.upperHeight, depth: DIMENSIONS.upperDepth, priceRuleId: "upperCabinetBasicPerCm" },
    { id: "wall-open-600", name: "開放吊櫃 600", layer: "upper", purpose: "open", width: 600, height: DIMENSIONS.upperHeight, depth: DIMENSIONS.upperDepth, priceRuleId: "upperCabinetBasicPerCm" },
    { id: "tall-600", name: "高櫃 600", layer: "tall", purpose: "general", width: 600, height: 2400, depth: 600, priceRuleId: "tallCabinetPerCm" },
    { id: "tall-appliance-600", name: "電器高櫃 600", layer: "tall", purpose: "appliance", width: 600, height: 2400, depth: 600, priceRuleId: "tallCabinetPerCm" },
    { id: "tall-fridge-600", name: "冰箱旁高櫃 600", layer: "tall", purpose: "appliance", width: 600, height: 2400, depth: 600, priceRuleId: "fridgeCabinetPerCm" },
    { id: "filler-left", name: "左補板", layer: "lower", purpose: "filler", width: STRAIGHT_RULES.defaultEdgeFillerWidth, height: DIMENSIONS.lowerHeight, depth: DIMENSIONS.lowerDepth, priceRuleId: "fillerPanelPerPiece" },
    { id: "filler-right", name: "右補板", layer: "lower", purpose: "filler", width: STRAIGHT_RULES.defaultEdgeFillerWidth, height: DIMENSIONS.lowerHeight, depth: DIMENSIONS.lowerDepth, priceRuleId: "fillerPanelPerPiece" },
    { id: "filler-top", name: "頂部補板", layer: "upper", purpose: "filler", width: 600, height: 300, depth: DIMENSIONS.upperDepth, priceRuleId: "fillerPanelPerPiece" },
    { id: "finished-end", name: "側封板", layer: "lower", purpose: "filler", width: 20, height: DIMENSIONS.lowerHeight + (DIMENSIONS.sidePanelThickness || 20), depth: DIMENSIONS.counterDepth, priceRuleId: "sidePanelPerPiece" }
  ]);

  const DEFAULT_CONFIG = Object.freeze({
    kitchenType: "straight",
    mainWallWidth: 2700,
    sideWallWidth: 1800,
    ceilingHeight: 2400,
    turnDirection: "left",
    lowerHeight: DIMENSIONS.lowerHeight,
    lowerDepth: DIMENSIONS.lowerDepth,
    upperHeight: DIMENSIONS.upperHeight,
    upperDepth: DIMENSIONS.upperDepth,
    counterDepth: DIMENSIONS.counterDepth,
    sinkPosition: "right",
    stovePosition: "left",
    fridgePosition: "none",
    upperMode: "full",
    hoodMode: "follow",
    priority: "prep",
    styleId: "modern",
    layoutVariant: 0,
    workflowVersion: CONFIG_VERSION
  });

  function safeNumber(value, fallback, min, max) {
    const parsed = Number(value);
    const safe = Number.isFinite(parsed) ? parsed : fallback;
    return Math.min(max, Math.max(min, safe));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function safePosition(value, fallback) {
    return ["left", "middle", "right"].includes(value) ? value : fallback;
  }

  function sanitizeConfig(input) {
    const raw = input || {};
    const next = Object.assign({}, DEFAULT_CONFIG, raw);
    const loadedVersion = Number(raw.workflowVersion) || 0;

    next.kitchenType = ["straight", "L"].includes(next.kitchenType) ? next.kitchenType : DEFAULT_CONFIG.kitchenType;
    next.turnDirection = ["left", "right"].includes(next.turnDirection) ? next.turnDirection : DEFAULT_CONFIG.turnDirection;
    next.sinkPosition = safePosition(next.sinkPosition, DEFAULT_CONFIG.sinkPosition);
    next.stovePosition = safePosition(next.stovePosition, DEFAULT_CONFIG.stovePosition);
    next.fridgePosition = ["none", "left", "right"].includes(next.fridgePosition) ? next.fridgePosition : DEFAULT_CONFIG.fridgePosition;
    next.upperMode = ["full", "none", "partial"].includes(next.upperMode) ? next.upperMode : DEFAULT_CONFIG.upperMode;
    next.hoodMode = ["follow", "none"].includes(next.hoodMode) ? next.hoodMode : DEFAULT_CONFIG.hoodMode;
    next.priority = ["storage", "prep", "symmetry"].includes(next.priority) ? next.priority : DEFAULT_CONFIG.priority;
    next.styleId = next.styleId || DEFAULT_CONFIG.styleId;
    next.layoutVariant = Math.max(0, Math.floor(Number(next.layoutVariant) || 0));

    ["mainWallWidth", "sideWallWidth", "ceilingHeight", "lowerHeight", "lowerDepth", "upperHeight", "upperDepth", "counterDepth"].forEach((key) => {
      next[key] = safeNumber(next[key], DEFAULT_CONFIG[key], 1, 30000);
    });

    if (loadedVersion < CONFIG_VERSION && next.sinkPosition === "middle" && next.stovePosition === "right") {
      next.sinkPosition = DEFAULT_CONFIG.sinkPosition;
      next.stovePosition = DEFAULT_CONFIG.stovePosition;
      next.layoutVariant = 0;
    }

    const normalized = normalizedPositions(next);
    next.sinkPosition = normalized.sink;
    next.stovePosition = normalized.stove;
    next.workflowVersion = CONFIG_VERSION;
    return next;
  }

  function cabinet(name, width, layer, purpose, frontStyle, extra) {
    const safeWidth = Math.max(purpose === "filler" ? 10 : 50, Math.round(Number(width) || 0));
    return Object.assign({
      name,
      width: safeWidth,
      layer,
      purpose,
      frontStyle: frontStyle || (purpose === "drawer" ? "two-small-one-large" : purpose === "filler" ? "panel" : purpose === "open" ? "open" : purpose === "appliance" ? "appliance" : "double-door"),
      handleStyle: ["hood", "dish-dryer", "filler", "open"].includes(purpose) ? "none" : null,
      includeInQuote: true
    }, purpose === "sink" ? sinkSpecForWidth(safeWidth) : {}, extra || {});
  }

  function minimumStraightWidth(config, edgeFillerWidth) {
    const fridgeWidth = config.fridgePosition === "none" ? 0 : 600;
    return {
      fixedOnly: STRAIGHT_RULES.minimumSinkWidth + STRAIGHT_RULES.minimumCooktopWidth + fridgeWidth,
      withMiddle: STRAIGHT_RULES.minimumSinkWidth + STRAIGHT_RULES.minimumCooktopWidth + STRAIGHT_RULES.minimumMiddleWidth + fridgeWidth,
      withMiddleAndFillers: STRAIGHT_RULES.minimumSinkWidth + STRAIGHT_RULES.minimumCooktopWidth + STRAIGHT_RULES.minimumMiddleWidth + fridgeWidth + edgeFillerWidth * 2
    };
  }

  function edgeFillerWidthFor(config, width) {
    const configured = Number(config.edgeFillerWidth);
    if (Number.isFinite(configured) && configured >= 0) return Math.round(configured);
    return STRAIGHT_RULES.defaultEdgeFillerWidth;
  }

  function modularFloor(value, unit = 5) {
    const safe = Math.max(0, Math.round(Number(value) || 0));
    return Math.floor(safe / unit) * unit;
  }

  function cleanSplitWidths(available, count, unit = 5) {
    const safeAvailable = Math.max(0, Math.round(Number(available) || 0));
    const safeCount = Math.max(1, Math.round(Number(count) || 1));
    const baseWidth = modularFloor(safeAvailable / safeCount, unit);
    if (baseWidth < STRAIGHT_RULES.minimumStorageWidth) {
      return { widths: [], remainder: safeAvailable };
    }
    const widths = Array.from({ length: safeCount }, () => baseWidth);
    return { widths, remainder: safeAvailable - baseWidth * safeCount };
  }

  function sinkSpecForWidth(width) {
    const rules = CORE_RULES.sink || {};
    const cabinetWidth = Math.max(0, Math.round(Number(width) || STRAIGHT_RULES.minimumSinkWidth));
    const lengthMin = rules.outerLengthMin || 600;
    const lengthMax = rules.outerLengthMax || 750;
    const lengthPreferred = rules.outerLengthPreferred || 680;
    const depthMin = rules.outerDepthMin || 430;
    const depthMax = rules.outerDepthMax || 450;
    const depthPreferred = rules.outerDepthPreferred || 440;
    const bowlMin = rules.bowlDepthMin || 180;
    const bowlMax = rules.bowlDepthMax || 220;
    const bowlPreferred = rules.bowlDepthPreferred || 200;
    return {
      sinkOuterLength: Math.min(lengthMax, Math.max(lengthMin, Math.min(lengthPreferred, cabinetWidth))),
      sinkOuterDepth: Math.min(depthMax, Math.max(depthMin, depthPreferred)),
      sinkBowlDepth: Math.min(bowlMax, Math.max(bowlMin, bowlPreferred))
    };
  }

  function splitStorageWidth(total, label, layer, variant = 0) {
    const available = Math.max(0, Math.round(total));
    if (available < STRAIGHT_RULES.minimumStorageWidth) return { cabinets: [], remainder: available };
    let widths = [];
    let splitRemainder = 0;
    if (variant % 3 === 1 && available >= 900) {
      const count = Math.max(2, Math.ceil(available / STRAIGHT_RULES.preferredStorageMaxWidth));
      const reserveForRest = STRAIGHT_RULES.minimumStorageWidth * (count - 1);
      const first = Math.min(
        STRAIGHT_RULES.preferredStorageWidth,
        modularFloor(available - reserveForRest)
      );
      const rest = cleanSplitWidths(available - first, count - 1);
      if (first >= STRAIGHT_RULES.minimumStorageWidth && rest.widths.length) {
        widths = [first, ...rest.widths];
        splitRemainder = rest.remainder;
      } else {
        const fallback = cleanSplitWidths(available, count);
        widths = fallback.widths;
        splitRemainder = fallback.remainder;
      }
    } else {
      const maxWidth = variant % 3 === 2
        ? Math.max(650, STRAIGHT_RULES.preferredStorageMaxWidth - 100)
        : STRAIGHT_RULES.preferredStorageMaxWidth;
      const count = Math.max(1, Math.ceil(available / maxWidth));
      const split = cleanSplitWidths(available, count);
      widths = split.widths;
      splitRemainder = split.remainder;
    }
    if (widths.some((width) => width < STRAIGHT_RULES.minimumStorageWidth)) return { cabinets: [], remainder: available };
    return {
      cabinets: widths.map((width, index) => cabinet(`${label}${widths.length > 1 ? ` ${index + 1}` : ""}`, width, layer, layer === "lower" ? "drawer" : "general", layer === "lower" ? "two-small-one-large" : "double-door")),
      remainder: splitRemainder
    };
  }

  function layerWidth(items, layer) {
    return (items || [])
      .filter((item) => item.layer === layer)
      .reduce((sum, item) => sum + safeNumber(item.width, 0, 0, 30000), 0);
  }

  function settleLayerWithinWall(items, layer, width, warnings) {
    const layerItems = items.filter((item) => item.layer === layer);
    let total = layerWidth(items, layer);
    let over = total - width;
    if (over <= 0) return true;
    const fillers = layerItems.filter((item) => item.purpose === "filler").reverse();
    fillers.forEach((item) => {
      if (over <= 0) return;
      const reducible = Math.max(0, item.width);
      const cut = Math.min(reducible, over);
      item.width -= cut;
      over -= cut;
    });
    total = layerWidth(items, layer);
    over = total - width;
    if (over <= 0) {
      warnings.push(`${layer === "upper" ? "吊櫃" : "下櫃"}原本超出牆面，系統已優先縮減補板避免超出。`);
      return true;
    }
    const flexible = layerItems
      .filter((item) => !["sink", "stove", "hood", "dish-dryer"].includes(item.purpose))
      .sort((a, b) => b.width - a.width);
    flexible.forEach((item) => {
      if (over <= 0) return;
      const minimum = item.purpose === "filler" ? 0 : STRAIGHT_RULES.minimumStorageWidth;
      const reducible = Math.max(0, item.width - minimum);
      const cut = Math.min(reducible, over);
      item.width -= cut;
      over -= cut;
    });
    if (over > 0) return false;
    warnings.push(`${layer === "upper" ? "吊櫃" : "下櫃"}已依牆寬重新收斂，固定設備尺寸不變。`);
    return true;
  }

  function variantPositions(config, variant) {
    const base = normalizedPositions(config);
    if (variant % 3 === 1) {
      const mirror = (value) => value === "left" ? "right" : value === "right" ? "left" : value;
      return { sink: mirror(base.sink), stove: mirror(base.stove), adjusted: base.adjusted, mirrored: true };
    }
    if (variant % 3 === 2) {
      return { sink: base.sink, stove: base.stove, adjusted: base.adjusted, balanced: true };
    }
    return base;
  }

  function storageRankFor(positions) {
    if (positions.sink === "middle" && positions.stove === "right") return 20;
    if (positions.sink === "middle" && positions.stove === "left") return 80;
    if (positions.stove === "middle" && positions.sink === "right") return 20;
    if (positions.stove === "middle" && positions.sink === "left") return 80;
    return 50;
  }

  function normalizedPositions(config) {
    let sink = safePosition(config.sinkPosition, "right");
    let stove = safePosition(config.stovePosition, "left");
    const requestedSink = sink;
    const requestedStove = stove;
    let adjusted = false;

    if (sink === stove) {
      sink = "right";
      stove = "left";
      adjusted = true;
    }

    if (sink === "middle" && stove === "right") {
      sink = "left";
      adjusted = true;
    } else if (sink === "middle" && stove === "left") {
      sink = "right";
      adjusted = true;
    } else if (stove === "middle" && sink === "right") {
      stove = "left";
      adjusted = true;
    } else if (stove === "middle" && sink === "left") {
      stove = "right";
      adjusted = true;
    }

    if (sink === "middle" || stove === "middle") {
      sink = "right";
      stove = "left";
      adjusted = true;
    }

    return { sink, stove, adjusted, requestedSink, requestedStove };
  }

  function buildStraightPlan(input) {
    const config = sanitizeConfig(input || {});
    const width = safeNumber(config.mainWallWidth, DEFAULT_CONFIG.mainWallWidth, STRAIGHT_RULES.minWallWidth, 12000);
    const variant = Math.max(0, Math.floor(Number(config.layoutVariant) || 0));
    let leftFiller = edgeFillerWidthFor(config, width);
    let rightFiller = leftFiller;
    const minimum = minimumStraightWidth(config, leftFiller);
    const warnings = [];
    const errors = [];
    const assumptions = [
      `下櫃完成高採 ${DIMENSIONS.lowerHeight} mm（踢腳 ${global.MODUDRAFTCore?.KITCHEN_RULES?.dimensions?.toeKickHeight || 120} / 桶身 ${global.MODUDRAFTCore?.KITCHEN_RULES?.dimensions?.lowerBodyHeight || 700} / 檯面 ${global.MODUDRAFTCore?.KITCHEN_RULES?.dimensions?.counterThickness || 40}）。`,
      `下櫃深度採 ${DIMENSIONS.lowerDepth} mm，檯面深度採 ${DIMENSIONS.counterDepth} mm。`
    ];

    let fridgeWidth = config.fridgePosition === "none" ? 0 : 600;
    if (fridgeWidth && width < minimum.withMiddle) {
      warnings.push("牆面寬度不足以同時放入冰箱預留與基本廚具，系統先移除冰箱預留，請於專業模式另行確認。");
      fridgeWidth = 0;
    }

    let sinkWidth = STRAIGHT_RULES.minimumSinkWidth;
    let stoveWidth = STRAIGHT_RULES.minimumCooktopWidth;
    let storageWidth = width - fridgeWidth - sinkWidth - stoveWidth - leftFiller - rightFiller;

    if (storageWidth < 0 && (leftFiller || rightFiller)) {
      warnings.push("牆面較短，系統先取消左右預設補板，保留水槽櫃與爐台櫃固定尺寸。");
      leftFiller = 0;
      rightFiller = 0;
      storageWidth = width - fridgeWidth - sinkWidth - stoveWidth;
    }

    if (
      storageWidth < STRAIGHT_RULES.minimumMiddleWidth
      && (leftFiller || rightFiller)
      && width - fridgeWidth - sinkWidth - stoveWidth >= STRAIGHT_RULES.minimumMiddleWidth
    ) {
      warnings.push(`牆面寬度剛好不足以保留 ${STRAIGHT_RULES.minimumMiddleWidth} mm 中間櫃，系統先取消左右預設補板，避免把中間櫃壓縮成不合理尺寸。`);
      leftFiller = 0;
      rightFiller = 0;
      storageWidth = width - fridgeWidth - sinkWidth - stoveWidth;
    }

    if (storageWidth < 0) {
      errors.push(`牆面寬度 ${width} mm 不足，至少需要 ${minimum.fixedOnly} mm 才能放入 ${STRAIGHT_RULES.minimumSinkWidth} mm 水槽櫃與 ${STRAIGHT_RULES.minimumCooktopWidth} mm 爐台櫃。`);
      return {
        type: "straight",
        walls: [{ width, alignment: "left", cabinets: [] }],
        warnings,
        errors,
        assumptions,
        summary: summarizePlan([{ cabinets: [] }])
      };
    }

    const sharedApplianceWidth = Math.min(
      STRAIGHT_RULES.preferredSinkWidth,
      STRAIGHT_RULES.preferredCooktopWidth
    );
    const sharedUpgrade = Math.max(0, sharedApplianceWidth - STRAIGHT_RULES.minimumSinkWidth);
    if (storageWidth - STRAIGHT_RULES.minimumMiddleWidth >= sharedUpgrade * 2) {
      sinkWidth = sharedApplianceWidth;
      stoveWidth = sharedApplianceWidth;
      storageWidth -= sharedUpgrade * 2;
    }

    const storage = splitStorageWidth(storageWidth, "備餐抽屜櫃", "lower", variant);
    rightFiller += storage.remainder;
    const positions = variantPositions(config, variant);
    const rank = { left: 10, middle: 50, right: 90 };
    const storageRank = storageRankFor(positions);
    const core = [
      { rank: rank[positions.sink], priority: 1, item: cabinet("水槽下櫃", sinkWidth, "lower", "sink", "double-door") },
      { rank: rank[positions.stove], priority: 3, item: cabinet("爐台下櫃", stoveWidth, "lower", "stove", "double-door") },
      ...storage.cabinets.map((item, index) => ({ rank: storageRank, priority: 2 + index / 10, item }))
    ];
    if (fridgeWidth) core.push({ rank: config.fridgePosition === "left" ? 0 : 100, priority: 0, item: cabinet("冰箱預留", fridgeWidth, "lower", "appliance", "appliance", { applianceType: "fridge", hasCountertop: false }) });
    core.sort((a, b) => a.rank - b.rank || a.priority - b.priority);

    const lower = [];
    if (leftFiller >= 10) lower.push(cabinet("左補板", leftFiller, "lower", "filler", "panel"));
    lower.push(...core.map((entry) => entry.item));
    if (rightFiller >= 10) lower.push(cabinet("右補板", rightFiller, "lower", "filler", "panel"));

    const upper = [];
    if (config.upperMode !== "none") {
      lower.forEach((item) => {
        if (item.purpose === "filler") {
          if (config.upperMode === "full") upper.push(cabinet(item.name, item.width, "upper", "filler", "panel"));
          return;
        }
        if (item.applianceType === "fridge") return;
        if (item.purpose === "stove") {
          if (config.hoodMode === "follow") upper.push(cabinet("排油煙機吊櫃", item.width, "upper", "hood", "double-door"));
          return;
        }
        if (config.upperMode === "partial" && !["sink", "drawer"].includes(item.purpose)) return;
        upper.push(cabinet(item.purpose === "sink" ? "水槽上方收納吊櫃" : "標準收納吊櫃", item.width, "upper", "general", "double-door"));
      });
    }

    if (!storage.cabinets.length && storage.remainder > 0) warnings.push(`剩餘 ${storage.remainder} mm 不足以形成標準中間櫃，已併入右側補板或收邊。`);
    if (storage.cabinets.length && storage.remainder > 0) warnings.push(`備餐櫃已依 5 mm 模數等分，剩餘 ${storage.remainder} mm 併入右側補板。`);
    if (storageWidth < STRAIGHT_RULES.minimumMiddleWidth) warnings.push("牆面空間不足以加入 500 mm 中間櫃，系統保留水槽與爐台固定尺寸並以補板收尾。");
    if (positions.adjusted) warnings.push("水槽與爐台原本距離過近，系統已自動分到左右兩側，避免水火相鄰。");
    if (positions.mirrored) warnings.push("已切換為鏡像配置：水槽與爐台方向互換，方便比較不同現場條件。");
    if (positions.balanced) warnings.push("已切換為均衡配置：水槽靠左、爐台靠右，中間保留備餐與收納區。");
    const activeMinimum = minimumStraightWidth(Object.assign({}, config, { fridgePosition: fridgeWidth ? config.fridgePosition : "none" }), leftFiller);
    if (width < activeMinimum.withMiddleAndFillers) warnings.push(`牆面短於完整基本配置 ${activeMinimum.withMiddleAndFillers} mm，部分補板或中間櫃會被調整。`);
    const allCabinets = lower.concat(upper);
    const lowerOk = settleLayerWithinWall(allCabinets, "lower", width, warnings);
    const upperOk = settleLayerWithinWall(allCabinets, "upper", width, warnings);
    if (!lowerOk || !upperOk) errors.push(`配置總寬仍超出牆面 ${width} mm，系統已阻止輸出錯誤尺寸，請減少櫃體或調整牆寬。`);
    return {
      type: "straight",
      walls: [{ width, alignment: "left", cabinets: allCabinets }],
      warnings,
      errors,
      assumptions,
      summary: summarizePlan([{ cabinets: allCabinets }])
    };
  }

  function buildStorageWall(width, config) {
    const filler = width >= L_RULES.minWallWidth ? STRAIGHT_RULES.defaultEdgeFillerWidth : STRAIGHT_RULES.minimumUsefulFillerWidth;
    const corner = L_RULES.blindCornerWidth;
    const usable = Math.max(0, width - corner - filler);
    const split = splitStorageWidth(usable, "側牆收納櫃", "lower");
    const lower = [cabinet("盲角轉角下櫃 1000", corner, "lower", "blind-corner", "single-door", {
      cornerType: "blindCorner",
      cornerHanding: config.turnDirection === "right" ? "right" : "left",
      totalWidth: L_RULES.blindCornerWidth,
      adjacentCabinetDepthRef: 560,
      adjacentDoorReferencePanelWidth: 20,
      hingeMountPanelWidth: 20,
      frontDoorWidth: 400,
      depth: DIMENSIONS.lowerDepth,
      height: config.lowerHeight || DIMENSIONS.lowerHeight,
      hasCornerShelf: true,
      cornerShelfCount: 1,
      hasCornerHardware: false,
      cornerHardwareType: "none",
      showInternalStructure: true,
      hasCountertop: true,
      hasToeKick: true,
      priceRuleId: "baseCabinetBasicPerCm"
    }), ...split.cabinets];
    const endFiller = filler + split.remainder;
    if (endFiller >= 10) lower.push(cabinet("側牆收尾補板", endFiller, "lower", "filler", "panel"));
    const upper = config.upperMode === "none" ? [] : lower.filter((item) => item.purpose !== "blind-corner" && item.purpose !== "filler").map((item) => cabinet("側牆收納吊櫃", item.width, "upper", "general", "double-door"));
    return lower.concat(upper);
  }

  function buildLPlan(input) {
    const config = Object.assign({}, DEFAULT_CONFIG, input || {}, { kitchenType: "L" });
    const main = buildStraightPlan(config);
    const sideWidth = safeNumber(config.sideWallWidth, DEFAULT_CONFIG.sideWallWidth, L_RULES.minWallWidth, 8000);
    const sideCabinets = buildStorageWall(sideWidth, config);
    const walls = [
      { width: main.walls[0].width, alignment: config.turnDirection === "right" ? "right" : "left", cabinets: main.walls[0].cabinets },
      { width: sideWidth, alignment: config.turnDirection === "right" ? "left" : "right", cabinets: sideCabinets }
    ];
    return {
      type: "L",
      walls,
      warnings: main.warnings.concat("L 型已使用 560 / 20 / 20 / 400 盲角轉角下櫃；施工前請依現場確認左右方向與五金。"),
      errors: main.errors || [],
      assumptions: main.assumptions || [],
      summary: summarizePlan(walls)
    };
  }

  function buildPlan(config) {
    return config?.kitchenType === "L" ? buildLPlan(config) : buildStraightPlan(config);
  }

  function summarizePlan(walls) {
    const all = (walls || []).flatMap((wall) => wall.cabinets || []);
    const lower = all.filter((item) => item.layer === "lower");
    const upper = all.filter((item) => item.layer === "upper");
    const fillers = all.filter((item) => item.purpose === "filler");
    const countertop = lower.filter((item) => item.purpose !== "filler" && !item.isCornerReserve && item.applianceType !== "fridge").reduce((sum, item) => sum + item.width, 0);
    return {
      lowerCount: lower.filter((item) => item.purpose !== "filler").length,
      upperCount: upper.filter((item) => item.purpose !== "filler").length,
      sinkCount: all.filter((item) => item.purpose === "sink").length,
      stoveCount: all.filter((item) => item.purpose === "stove").length,
      fillerCount: fillers.length,
      countertopLength: countertop
    };
  }

  function cabinetList(project) {
    const cabinets = Array.isArray(project?.cabinets) ? project.cabinets : [];
    return cabinets.map((item, index) => ({
      no: index + 1,
      id: item.id,
      name: item.name || "未命名櫃體",
      type: item.category || item.type || "cabinet",
      width: safeNumber(item.width, 0, 0, 30000),
      height: safeNumber(item.height, 0, 0, 10000),
      depth: safeNumber(item.depth, 0, 0, 3000),
      quantity: 1,
      material: item.materialId || project?.materialAssignments?.door || "未指定",
      door: item.doorStyle || "未指定",
      handle: item.handleStyle || "無把手",
      note: item.notes || ""
    }));
  }

  function listToText(list) {
    return ["MODUDRAFT 櫃體清單", "", ...list.map((item) => `${item.no}. ${item.name}，${Math.round(item.width)} × ${Math.round(item.height)} × ${Math.round(item.depth)} mm，${item.quantity} 座，門片：${item.door}，把手：${item.handle}${item.note ? `，備註：${item.note}` : ""}`)].join("\n");
  }

  function listToCsv(list) {
    const quote = (value) => `"${String(value == null ? "" : value).replace(/"/g, '""')}"`;
    return [
      ["編號", "櫃體名稱", "類型", "寬度 mm", "高度 mm", "深度 mm", "數量", "材質", "門片", "把手", "備註"],
      ...list.map((item) => [item.no, item.name, item.type, item.width, item.height, item.depth, item.quantity, item.material, item.door, item.handle, item.note])
    ].map((row) => row.map(quote).join(",")).join("\r\n");
  }

  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function mount(options) {
    const adapter = Object.assign({
      enterProfessional: () => {},
      generate: () => {},
      validate: () => [],
      getProject: () => null,
      getPrompt: () => "",
      applyStyle: () => {},
      openProjectCenter: () => {},
      openImport: () => {},
      openExport: () => {},
      openEstimate: () => {},
      openGuide: () => {},
      addPreset: () => false,
      showToast: () => {},
      styles: []
    }, options || {});
    let step = 1;
    let generated = false;
    let latestPlan = null;
    let config = sanitizeConfig();
    try {
      config = sanitizeConfig(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (_error) {
      config = sanitizeConfig();
    }

    const overlay = document.createElement("div");
    overlay.className = "md-kw-overlay";
    overlay.innerHTML = `<section class="md-kw-panel" role="dialog" aria-modal="true" aria-label="廚具新手快速建立" data-help-id="beginner-workflow">
      <header class="md-kw-head"><div><small>MODUDRAFT KITCHEN WORKFLOW</small><h2>新手快速建立</h2></div><button type="button" data-kw-action="close" aria-label="關閉">×</button></header>
      <nav class="md-kw-progress" aria-label="新手步驟"></nav>
      <main class="md-kw-body"></main>
      <footer class="md-kw-foot"><button type="button" data-kw-action="back">上一步</button><span class="md-kw-save">設定會保留在這台裝置</span><button type="button" class="primary" data-kw-action="next">下一步</button></footer>
    </section>`;
    document.body.appendChild(overlay);
    const body = overlay.querySelector(".md-kw-body");
    const progress = overlay.querySelector(".md-kw-progress");
    const backButton = overlay.querySelector('[data-kw-action="back"]');
    const nextButton = overlay.querySelector('[data-kw-action="next"]');

    const libraryOverlay = document.createElement("div");
    libraryOverlay.className = "md-kw-overlay md-kw-library-overlay";
    libraryOverlay.innerHTML = `<section class="md-kw-panel md-kw-library-panel" role="dialog" aria-modal="true" aria-label="標準櫃體庫">
      <header class="md-kw-head"><div><small>MODUDRAFT CABINET LIBRARY</small><h2>標準櫃體庫</h2></div><button type="button" data-kw-library-close aria-label="關閉">×</button></header>
      <main class="md-kw-library-body"></main>
    </section>`;
    document.body.appendChild(libraryOverlay);
    const libraryBody = libraryOverlay.querySelector(".md-kw-library-body");

    function renderLibrary() {
      const groups = [
        { id: "lower", title: "下櫃", note: "含標準收納、抽屜、水槽與爐台櫃。" },
        { id: "upper", title: "吊櫃", note: "含標準吊櫃、排油煙機櫃與開放櫃。" },
        { id: "filler", title: "補板與側封", note: "用於牆邊收尾與見光側處理。" }
      ];
      libraryBody.innerHTML = `${groups.map((group) => {
        const items = STANDARD_CABINETS.filter((item) => group.id === "filler" ? item.purpose === "filler" && item.id !== "filler-top" : item.layer === group.id && item.purpose !== "filler");
        return `<section class="md-kw-library-group"><header><div><b>${group.title}</b><span>${group.note}</span></div><em>${items.length} 種</em></header><div class="md-kw-library-grid">${items.map((item) => `<button type="button" data-kw-preset="${item.id}" data-help-id="${item.purpose === "blind-corner" ? "blind-corner" : "standard-cabinet-library"}"><span>${item.layer === "upper" ? "吊" : item.purpose === "filler" ? "補" : "下"}</span><b>${item.name}</b><small>${item.description ? escapeHtml(item.description) : `寬 ${item.width} × 高 ${item.height} × 深 ${item.depth} mm`}</small><em>加入目前牆面</em></button>`).join("")}</div></section>`;
      }).join("")}<aside class="md-kw-library-note"><b>高櫃提示</b><span>目前高櫃仍可從一般櫃體進階尺寸調整建立；待高櫃檯面與踢腳規則完成後，會再開放一鍵標準高櫃。</span></aside>`;
    }

    function openLibrary() {
      renderLibrary();
      libraryOverlay.classList.add("open");
      document.body.classList.add("md-kw-open");
    }

    function closeLibrary() {
      libraryOverlay.classList.remove("open");
      if (!overlay.classList.contains("open")) document.body.classList.remove("md-kw-open");
    }

    function persist() {
      config = sanitizeConfig(config);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch (_error) {}
    }

    function fieldValue(name, value) {
      const numericFields = new Set(["mainWallWidth", "sideWallWidth", "ceilingHeight", "lowerHeight", "lowerDepth", "upperHeight", "upperDepth", "counterDepth"]);
      config[name] = numericFields.has(name) ? Number(value) : value;
      if (name === "sinkPosition" || name === "stovePosition") config.layoutVariant = 0;
      persist();
    }

    function validateDimensions() {
      const errors = [];
      if (!Number.isFinite(config.mainWallWidth) || config.mainWallWidth < 1200) errors.push("牆面寬度不可小於 1200 mm。");
      if (config.kitchenType === "L" && (!Number.isFinite(config.sideWallWidth) || config.sideWallWidth < 1200)) errors.push("側牆寬度不可小於 1200 mm。");
      if (!Number.isFinite(config.ceilingHeight) || config.ceilingHeight < 2000) errors.push("天花高度不可小於 2000 mm。");
      if (![config.lowerHeight, config.lowerDepth, config.upperHeight, config.upperDepth, config.counterDepth].every(Number.isFinite)) errors.push("請輸入有效的數字。");
      return errors;
    }

    function stepHeader(kicker, title, text) {
      return `<header class="md-kw-step-head"><span>${escapeHtml(kicker)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></header>`;
    }

    function renderStep1() {
      body.innerHTML = `${stepHeader("STEP 1 / 7", "選擇廚房型態", "先選擇最接近現場的型態；本版完整支援一字型與穩定簡化 L 型。")}
        <div class="md-kw-type-grid">
          <button class="md-kw-choice ${config.kitchenType === "straight" ? "active" : ""}" data-kw-type="straight" data-help-id="kitchen-template"><b>一字型廚房</b><span>單面牆、套房與常見住宅廚房。</span><em>完整支援</em></button>
          <button class="md-kw-choice ${config.kitchenType === "L" ? "active" : ""}" data-kw-type="L" data-help-id="kitchen-template"><b>L 型廚房</b><span>兩面牆轉角配置，增加收納與備餐空間。</span><em>基礎穩定版</em></button>
          <button class="md-kw-choice disabled" disabled><b>U 型廚房</b><span>三面牆連續配置。</span><em>即將支援</em></button>
          <button class="md-kw-choice disabled" disabled><b>中島型廚房</b><span>主牆搭配獨立中島。</span><em>即將支援</em></button>
        </div>`;
    }

    function renderStep2() {
      body.innerHTML = `${stepHeader("STEP 2 / 7", "輸入空間尺寸", "只填必要尺寸即可；進階欄位已提供安全預設值。")}
        <div class="md-kw-form-grid">
          <label data-help-id="wall-width">${config.kitchenType === "L" ? "主牆寬度" : "牆面寬度"}<span><input data-kw-field="mainWallWidth" type="number" inputmode="numeric" min="1200" max="12000" value="${config.mainWallWidth}"><b>mm</b></span></label>
          ${config.kitchenType === "L" ? `<label>側牆寬度<span><input data-kw-field="sideWallWidth" type="number" inputmode="numeric" min="1200" max="8000" value="${config.sideWallWidth}"><b>mm</b></span></label><label>轉角位置<select data-kw-field="turnDirection"><option value="left" ${config.turnDirection === "left" ? "selected" : ""}>左轉</option><option value="right" ${config.turnDirection === "right" ? "selected" : ""}>右轉</option></select></label>` : ""}
          <label>天花高度<span><input data-kw-field="ceilingHeight" type="number" inputmode="numeric" min="2000" max="4200" value="${config.ceilingHeight}"><b>mm</b></span></label>
        </div>
        <details class="md-kw-advanced"><summary>進階尺寸</summary><div class="md-kw-form-grid">
          <label>下櫃高度<span><input data-kw-field="lowerHeight" type="number" value="${config.lowerHeight}"><b>mm</b></span></label>
          <label>下櫃深度<span><input data-kw-field="lowerDepth" type="number" value="${config.lowerDepth}"><b>mm</b></span></label>
          <label>吊櫃高度<span><input data-kw-field="upperHeight" type="number" value="${config.upperHeight}"><b>mm</b></span></label>
          <label>吊櫃深度<span><input data-kw-field="upperDepth" type="number" value="${config.upperDepth}"><b>mm</b></span></label>
          <label>檯面深度<span><input data-kw-field="counterDepth" type="number" value="${config.counterDepth}"><b>mm</b></span></label>
        </div></details><div class="md-kw-errors" aria-live="polite"></div>`;
    }

    function renderStep3() {
      const helpByField = { sinkPosition: "sink-cabinet", stovePosition: "stove-cabinet", fridgePosition: "cabinet-purpose", upperMode: "wall-cabinet", hoodMode: "wall-cabinet", priority: "auto-layout" };
      const select = (field, label, values) => `<label data-help-id="${helpByField[field] || "beginner-workflow"}">${label}<select data-kw-field="${field}">${values.map(([value, text]) => `<option value="${value}" ${config[field] === value ? "selected" : ""}>${text}</option>`).join("")}</select></label>`;
      body.innerHTML = `${stepHeader("STEP 3 / 7", "設定設備與配置重點", "不必拖曳設備。選擇大致位置，系統會產生穩定草稿並修正衝突。")}
        <div class="md-kw-form-grid">
          ${select("sinkPosition", "水槽位置", [["left","左側"],["middle","中間"],["right","右側"]])}
          ${select("stovePosition", "爐台位置", [["left","左側"],["middle","中間"],["right","右側"]])}
          ${select("fridgePosition", "冰箱是否納入", [["none","不納入"],["left","左側"],["right","右側"]])}
          ${select("upperMode", "是否需要吊櫃", [["full","需要"],["none","不需要"],["partial","只在部分區域"]])}
          ${select("hoodMode", "抽油煙機", [["follow","跟隨爐台自動配置"],["none","不配置"]])}
          ${select("priority", "優先方向", [["storage","收納優先"],["prep","備餐空間優先"],["symmetry","外觀對稱優先"]])}
        </div><p class="md-kw-note">若尚未設定現場水電位置，系統預設爐台靠左、水槽靠右；若選到相鄰位置，也會自動拉開，避免水火貼在一起。</p>`;
    }

    function renderSummary(plan) {
      const summary = plan.summary;
      return `<div class="md-kw-summary"><article><b>${summary.lowerCount}</b><span>下櫃</span></article><article><b>${summary.upperCount}</b><span>吊櫃</span></article><article><b>${summary.sinkCount}</b><span>水槽櫃</span></article><article><b>${summary.stoveCount}</b><span>爐台櫃</span></article><article><b>${summary.fillerCount}</b><span>補板</span></article><article><b>${summary.countertopLength}</b><span>檯面 mm</span></article></div>`;
    }

    function renderStep4() {
      body.innerHTML = `${stepHeader("STEP 4 / 7", "自動生成基礎配置", "系統會依尺寸、設備位置與上下櫃規則建立第一版，確認後仍可進專業模式細修。")}
        <button class="md-kw-generate" type="button" data-kw-action="generate" data-help-id="auto-layout">${generated ? "換一種配置" : "產生基礎配置"}</button>
        <div class="md-kw-generation">${latestPlan ? `<h4>${latestPlan.errors?.length ? "暫時無法產生可靠配置" : `已產生${latestPlan.type === "L" ? " L 型" : "一字型"}基礎廚具`}</h4>${renderSummary(latestPlan)}${latestPlan.errors?.length ? `<ul class="md-kw-errors">${latestPlan.errors.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul>` : ""}${latestPlan.warnings?.length ? `<ul>${latestPlan.warnings.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul>` : ""}${latestPlan.assumptions?.length ? `<details class="md-kw-advanced" open><summary>本次使用的尺寸假設</summary><ul>${latestPlan.assumptions.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul></details>` : ""}<div class="md-kw-inline-actions"><button data-kw-action="back-conditions">返回修改條件</button>${latestPlan.errors?.length ? "" : `<button data-kw-action="enter-pro">進入專業編輯</button>`}</div>` : `<p>按下產生後，平面圖、立面圖與 3D 會共用同一份櫃體資料。</p>`}</div>`;
    }

    function renderStep5() {
      const issues = adapter.validate() || [];
      const errors = issues.filter((item) => item.level === "error").length;
      const warnings = issues.filter((item) => item.level === "warning").length;
      const rows = issues.length ? issues.map((item) => `<li class="${item.level}"><b>${item.level === "error" ? "需要修正" : item.level === "warning" ? "建議注意" : "正常"}</b><span>${escapeHtml(item.message)}</span></li>`).join("") : `<li class="success"><b>正常</b><span>目前沒有發現尺寸或配置衝突。</span></li>`;
      body.innerHTML = `${stepHeader("STEP 5 / 7", "尺寸與合理性檢查", "錯誤需要修正；警告可以保留，但要依現場與設備規格確認。")}
        <div class="md-kw-check-summary"><span><b>${errors}</b> 錯誤</span><span><b>${warnings}</b> 警告</span><span><b>${issues.length}</b> 全部</span></div><ul class="md-kw-checks">${rows}</ul>
        <button type="button" class="md-kw-secondary" data-kw-action="open-checks" data-help-id="design-check">開啟完整設計檢查</button>`;
    }

    function renderStep6() {
      const styles = adapter.styles || [];
      body.innerHTML = `${stepHeader("STEP 6 / 7", "選擇外觀風格", "新手先選整體方向；門片、檯面、把手與 AI 提示詞會一起同步。")}
        <div class="md-kw-style-grid">${styles.slice(0, 5).map((item) => `<button class="md-kw-style ${config.styleId === item.id ? "active" : ""}" data-kw-style="${escapeHtml(item.id)}" data-help-id="style-presets"><span>${[item.door,item.body,item.countertop,item.handle].map((id) => adapter.materialColor?.(id) || "#aaa").map((color) => `<i style="background:${color}"></i>`).join("")}</span><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.description)}</small></button>`).join("")}</div>`;
    }

    function renderStep7() {
      const project = adapter.getProject();
      const list = cabinetList(project);
      const prompt = adapter.getPrompt(project) || "尚未產生 AI 提示詞。";
      body.innerHTML = `${stepHeader("STEP 7 / 7", "輸出、清單與 AI 提案", "設計資料仍以 MODUDRAFT 的尺寸與清單為準；AI 圖只作為客戶提案視覺參考。")}
        <div class="md-kw-output-grid">
          <button data-kw-export="floor" data-help-id="export"><b>下載平面圖</b><span>檢查深度與左右位置</span></button><button data-kw-export="elevation" data-help-id="export"><b>下載立面圖</b><span>檢查高度與門片</span></button><button data-kw-export="three" data-help-id="export"><b>下載 3D 圖</b><span>目前相機視角</span></button>
          <button data-kw-action="estimate" data-help-id="estimate"><b>查看粗估價</b><span>櫃身、檯面、設備與人工</span></button><button data-kw-action="project" data-help-id="project-center"><b>專案與材質</b><span>JSON 備份與完整檢查</span></button><button data-kw-action="enter-pro" data-help-id="pro-mode"><b>進入專業模式</b><span>繼續精準細修</span></button>
        </div>
        <section class="md-kw-list" data-help-id="cabinet-list"><header><div><span>櫃體清單</span><b>${list.length} 項</b></div><div><button data-kw-action="copy-list">複製文字</button><button data-kw-action="csv-list">CSV</button><button data-kw-action="json-list">JSON</button></div></header><div>${list.length ? list.map((item) => `<article><span>${item.no}</span><div><b>${escapeHtml(item.name)}</b><small>${Math.round(item.width)} × ${Math.round(item.height)} × ${Math.round(item.depth)} mm</small></div><em>${escapeHtml(item.door)}</em></article>`).join("") : "尚未建立櫃體"}</div></section>
        <section class="md-kw-prompt" data-help-id="ai-proposal"><header><b>AI 提案助手</b><button data-kw-action="copy-prompt">複製提示詞</button></header><textarea readonly>${escapeHtml(prompt)}</textarea><p>請將下載的白模或普通材質圖與提示詞一起上傳到 ChatGPT、Gemini 或其他 AI 工具。AI 圖不可取代工程尺寸。</p></section>`;
    }

    function render() {
      progress.innerHTML = Array.from({ length: 7 }, (_, index) => `<button type="button" data-kw-step="${index + 1}" class="${step === index + 1 ? "active" : step > index + 1 ? "done" : ""}"><span>${index + 1}</span><b>${["型態","尺寸","設備","生成","檢查","風格","輸出"][index]}</b></button>`).join("");
      if (step === 1) renderStep1();
      if (step === 2) renderStep2();
      if (step === 3) renderStep3();
      if (step === 4) renderStep4();
      if (step === 5) renderStep5();
      if (step === 6) renderStep6();
      if (step === 7) renderStep7();
      backButton.disabled = step === 1;
      nextButton.textContent = step === 7 ? "完成並進入專業模式" : "下一步";
      nextButton.disabled = step === 4 && !generated;
      overlay.querySelector(".md-kw-body").scrollTop = 0;
    }

    function open(startStep) {
      step = Math.max(1, Math.min(7, Number(startStep) || 1));
      overlay.classList.add("open");
      document.documentElement.style.overflow = "hidden";
      render();
    }

    function close() {
      overlay.classList.remove("open");
      document.documentElement.style.overflow = "";
    }

    async function generate() {
      const errors = validateDimensions();
      if (errors.length) {
        adapter.showToast(errors[0], "error");
        step = 2;
        render();
        const box = body.querySelector(".md-kw-errors");
        if (box) box.innerHTML = errors.map((message) => `<p>${escapeHtml(message)}</p>`).join("");
        return;
      }
      const wasGenerated = generated;
      if (wasGenerated) config.layoutVariant = ((Number(config.layoutVariant) || 0) + 1) % 3;
      latestPlan = buildPlan(config);
      if (latestPlan.errors?.length) {
        generated = false;
        render();
        adapter.showToast(latestPlan.errors[0], "error");
        return;
      }
      await adapter.generate(config, latestPlan);
      generated = true;
      persist();
      render();
      adapter.showToast(wasGenerated ? "已切換下一套基礎配置" : "已產生基礎廚具配置");
    }

    overlay.addEventListener("input", (event) => {
      const field = event.target.dataset.kwField;
      if (field) fieldValue(field, event.target.value);
    });
    overlay.addEventListener("change", (event) => {
      const field = event.target.dataset.kwField;
      if (field) { fieldValue(field, event.target.value); render(); }
    });
    overlay.addEventListener("click", async (event) => {
      const type = event.target.closest("[data-kw-type]")?.dataset.kwType;
      if (type) { config.kitchenType = type; generated = false; persist(); render(); return; }
      const styleId = event.target.closest("[data-kw-style]")?.dataset.kwStyle;
      if (styleId) { config.styleId = styleId; persist(); await adapter.applyStyle(styleId); render(); return; }
      const targetStep = event.target.closest("[data-kw-step]")?.dataset.kwStep;
      if (targetStep && (Number(targetStep) <= step || generated)) { step = Number(targetStep); render(); return; }
      const exportView = event.target.closest("[data-kw-export]")?.dataset.kwExport;
      if (exportView) { close(); adapter.openExport(exportView); return; }
      const action = event.target.closest("[data-kw-action]")?.dataset.kwAction;
      if (!action) return;
      if (action === "close") close();
      if (action === "back") { step = Math.max(1, step - 1); render(); }
      if (action === "next") {
        if (step === 2) {
          const errors = validateDimensions();
          const box = body.querySelector(".md-kw-errors");
          if (errors.length) { if (box) box.innerHTML = errors.map((message) => `<p>${escapeHtml(message)}</p>`).join(""); return; }
        }
        if (step === 7) { close(); adapter.enterProfessional({ preserve: true }); return; }
        step = Math.min(7, step + 1); render();
      }
      if (action === "generate") await generate();
      if (action === "back-conditions") { step = 2; render(); }
      if (action === "enter-pro") { close(); adapter.enterProfessional({ preserve: true }); }
      if (action === "open-checks") { close(); adapter.openProjectCenter("checks"); }
      if (action === "estimate") { close(); adapter.openEstimate(); }
      if (action === "project") { close(); adapter.openProjectCenter("project"); }
      const project = adapter.getProject();
      const list = cabinetList(project);
      if (action === "copy-list") { await copyText(listToText(list)); adapter.showToast("櫃體清單已複製"); }
      if (action === "csv-list") download("MODUDRAFT-櫃體清單.csv", `\ufeff${listToCsv(list)}`, "text/csv;charset=utf-8");
      if (action === "json-list") download("MODUDRAFT-櫃體清單.json", JSON.stringify({ projectId: project?.id || "", cabinets: list }, null, 2), "application/json;charset=utf-8");
      if (action === "copy-prompt") { await copyText(adapter.getPrompt(project)); adapter.showToast("AI 提案提示詞已複製"); }
    });

    libraryOverlay.addEventListener("click", (event) => {
      if (event.target === libraryOverlay || event.target.closest("[data-kw-library-close]")) {
        closeLibrary();
        return;
      }
      const presetId = event.target.closest("[data-kw-preset]")?.dataset.kwPreset;
      if (!presetId) return;
      const preset = STANDARD_CABINETS.find((item) => item.id === presetId);
      if (!preset) return;
      const added = adapter.addPreset(clone(preset));
      if (added !== false) {
        adapter.showToast(`已加入${preset.name}`);
        renderLibrary();
      }
    });

    function bindStartScreen() {
      const start = document.getElementById("startOverlay");
      if (!start) return;
      start.querySelector("#startBeginnerBtn")?.addEventListener("click", () => {
        const dismiss = start.querySelector("#dismissStartChoice")?.checked;
        try { localStorage.setItem(START_MODE_KEY, "beginner"); if (dismiss) localStorage.setItem(START_DISMISSED_KEY, "true"); } catch (_error) {}
        open(1);
      });
      start.querySelector("#startProBtn")?.addEventListener("click", () => {
        const dismiss = start.querySelector("#dismissStartChoice")?.checked;
        try { localStorage.setItem(START_MODE_KEY, "pro"); if (dismiss) localStorage.setItem(START_DISMISSED_KEY, "true"); } catch (_error) {}
        adapter.enterProfessional({ blank: true });
      });
      start.querySelector("#startTemplateBtn")?.addEventListener("click", () => {
        const dismiss = start.querySelector("#dismissStartChoice")?.checked;
        try { localStorage.setItem(START_MODE_KEY, "beginner"); if (dismiss) localStorage.setItem(START_DISMISSED_KEY, "true"); } catch (_error) {}
        open(1);
      });
      start.querySelector("#startImportBtn")?.addEventListener("click", () => adapter.openImport());
      start.querySelector("#startGuideBtn")?.addEventListener("click", () => adapter.openGuide());
      let dismissed = false;
      let lastMode = "pro";
      try { dismissed = localStorage.getItem(START_DISMISSED_KEY) === "true"; lastMode = localStorage.getItem(START_MODE_KEY) || "pro"; } catch (_error) {}
      if (dismissed && !new URLSearchParams(location.search).get("project") && !location.hash.includes("project=")) {
        if (lastMode === "beginner") open(1); else adapter.enterProfessional({ blank: true });
      }
    }

    bindStartScreen();
    return { open, close, openLibrary, closeLibrary, buildPlan, getConfig: () => clone(config), cabinetList: () => cabinetList(adapter.getProject()), standardCabinets: STANDARD_CABINETS };
  }

  global.MODUDRAFTKitchenWorkflow = Object.freeze({ mount, buildPlan, buildStraightPlan, buildLPlan, summarizePlan, cabinetList, listToText, listToCsv, STANDARD_CABINETS, DEFAULT_CONFIG, KITCHEN_RULES: CORE_RULES });
})(window);
