(function kitchenAssistModule(global) {
  "use strict";

  const MIN_GAP = 20;

  function finite(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function positive(value, fallback = 0) {
    return Math.max(0, finite(value, fallback));
  }

  function stableId(parts) {
    return parts
      .map((part) => String(part ?? "").trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff-]+/g, "-"))
      .filter(Boolean)
      .join("-");
  }

  function rowTypeForLayer(layer) {
    return layer === "upper" ? "wall" : "base";
  }

  function layerForRowType(rowType) {
    return rowType === "wall" || rowType === "upper" ? "upper" : "lower";
  }

  function mergeIntervals(intervals, wallWidth) {
    const sorted = intervals
      .map((interval) => ({
        start: Math.max(0, Math.min(wallWidth, finite(interval.start))),
        end: Math.max(0, Math.min(wallWidth, finite(interval.end)))
      }))
      .filter((interval) => interval.end > interval.start)
      .sort((a, b) => a.start - b.start || a.end - b.end);

    return sorted.reduce((merged, interval) => {
      const previous = merged[merged.length - 1];
      if (!previous || interval.start > previous.end) {
        merged.push({ ...interval });
      } else {
        previous.end = Math.max(previous.end, interval.end);
      }
      return merged;
    }, []);
  }

  function detectAvailableSpaces(model) {
    const walls = Array.isArray(model?.walls) ? model.walls : [];
    const requestedWall = model?.wall || walls[finite(model?.activeWallIndex, 0)] || null;
    if (!requestedWall) return [];

    const wallWidth = positive(requestedWall.width);
    if (wallWidth <= 0) return [];
    const requestedLayers = model?.layer
      ? [layerForRowType(model.layer)]
      : ["lower", "upper"];
    const spaces = [];

    requestedLayers.forEach((layer) => {
      const cabinets = (Array.isArray(requestedWall.cabinets) ? requestedWall.cabinets : [])
        .filter((cabinet) => (cabinet?.type === "upper" ? "upper" : "lower") === layer)
        .map((cabinet, index) => ({
          id: cabinet.id || `${layer}-${index}`,
          start: finite(cabinet.x),
          end: finite(cabinet.x) + positive(cabinet.width),
          cabinet
        }))
        .filter((item) => item.end > item.start)
        .sort((a, b) => a.start - b.start || a.end - b.end);

      const occupied = mergeIntervals(cabinets, wallWidth);
      let cursor = 0;
      const rawGaps = [];
      occupied.forEach((interval) => {
        if (interval.start - cursor >= MIN_GAP) rawGaps.push({ start: cursor, end: interval.start });
        cursor = Math.max(cursor, interval.end);
      });
      if (wallWidth - cursor >= MIN_GAP) rawGaps.push({ start: cursor, end: wallWidth });

      rawGaps.forEach((gap, gapIndex) => {
        const width = Math.max(0, Math.round(gap.end - gap.start));
        if (width < MIN_GAP) return;
        const position = gap.start <= 0.5
          ? "left"
          : (gap.end >= wallWidth - 0.5 ? "right" : "middle");
        const center = (gap.start + gap.end) / 2;
        const leftNeighbor = [...cabinets].reverse().find((item) => item.end <= gap.start + 0.5)?.cabinet || null;
        const rightNeighbor = cabinets.find((item) => item.start >= gap.end - 0.5)?.cabinet || null;
        const oppositeLayer = layer === "lower" ? "upper" : "lower";
        const alignedCabinet = (requestedWall.cabinets || [])
          .filter((cabinet) => (cabinet?.type === "upper" ? "upper" : "lower") === oppositeLayer)
          .find((cabinet) => finite(cabinet.x) <= center && finite(cabinet.x) + positive(cabinet.width) >= center) || null;
        const rowType = rowTypeForLayer(layer);
        spaces.push({
          id: stableId(["gap", requestedWall.id ?? model?.activeWallIndex ?? 0, rowType, position, Math.round(gap.start), gapIndex]),
          wallId: requestedWall.id ?? model?.activeWallIndex ?? 0,
          rowType,
          layer,
          position,
          startX: Math.round(gap.start),
          width,
          height: layer === "upper" ? positive(model?.upperHeight, 700) : positive(model?.lowerHeight, 860),
          depth: layer === "upper" ? positive(model?.upperDepth, 370) : positive(model?.lowerDepth, 580),
          leftNeighborId: leftNeighbor?.id || null,
          rightNeighborId: rightNeighbor?.id || null,
          alignedCabinetId: alignedCabinet?.id || null,
          alignedPurpose: alignedCabinet?.purpose || null
        });
      });
    });

    return spaces.sort((a, b) => {
      const layerOrder = a.layer === b.layer ? 0 : (a.layer === "lower" ? -1 : 1);
      return layerOrder || a.startX - b.startX || a.width - b.width;
    });
  }

  function splitRecommendationWidths(totalWidth) {
    const width = Math.max(0, Math.round(finite(totalWidth)));
    if (width <= 900) return [width];
    let count = Math.max(2, Math.ceil(width / 750));
    while (count < 12 && width / count > 900) count += 1;
    return divideWidths(width, count);
  }

  function recommendation(config, space, order) {
    const widths = Array.isArray(config.widths) ? config.widths.map((width) => Math.round(width)) : null;
    const width = Math.round(config.width ?? space.width);
    return {
      id: stableId([space.id, config.purpose || config.kind, width, order]),
      name: config.name,
      width,
      widths,
      kind: config.kind,
      purpose: config.purpose || "general",
      frontStyle: config.frontStyle || null,
      reason: config.reason,
      suitability: config.suitability || "中",
      layer: space.layer,
      rowType: space.rowType,
      spaceId: space.id,
      order
    };
  }

  function getCabinetRecommendations(space, context = {}) {
    const width = Math.max(0, Math.round(finite(space?.width)));
    if (!space || width < MIN_GAP) return [];
    const layer = layerForRowType(space.layer || space.rowType);
    const configs = [];
    const add = (config) => {
      if (!configs.some((item) => item.name === config.name && item.purpose === config.purpose)) configs.push(config);
    };

    if (layer === "upper") {
      if (space.alignedPurpose === "stove") {
        add({ name: "排油煙機吊櫃", kind: "吊櫃", purpose: "hood", frontStyle: "double-door", reason: "下方為爐台櫃，優先保留排油煙與安全空間。", suitability: "高" });
      } else if (space.alignedPurpose === "sink") {
        add({ name: "吊掛式烘碗機", kind: "吊櫃", purpose: "dish-dryer", frontStyle: "double-door", reason: "下方為水槽櫃，洗滌後可直接收納餐具。", suitability: "高" });
      }

      if (width <= 80) {
        add({ name: "吊櫃補板", kind: "補板", purpose: "filler", frontStyle: "panel", reason: "空間過窄，不建議硬塞櫃體，補板可吸收現場誤差。", suitability: "高" });
      } else if (width <= 250) {
        add({ name: "窄開放層板", kind: "開放櫃", purpose: "open", frontStyle: "open", reason: "窄幅空間適合小物展示，不增加門片負擔。", suitability: "高" });
      } else if (width <= 450) {
        add({ name: "單門吊櫃", kind: "吊櫃", purpose: "general", frontStyle: "single-door", reason: "寬度適合單扇門片，日常收納順手。", suitability: "高" });
      } else if (width <= 600) {
        add({ name: "標準吊櫃", kind: "吊櫃", purpose: "general", frontStyle: "double-door", reason: "符合常用吊櫃尺度，收納量與門片比例均衡。", suitability: "高" });
      } else if (width <= 900) {
        add({ name: "對開門吊櫃", kind: "吊櫃", purpose: "general", frontStyle: "double-door", reason: "較寬空間適合對開門，避免單片門過寬。", suitability: "高" });
        add({ name: "烘碗機吊櫃", kind: "吊櫃", purpose: "dish-dryer", frontStyle: "double-door", reason: "若下方鄰近水槽，可配置吊掛式烘碗機。", suitability: space.alignedPurpose === "sink" ? "高" : "中" });
      } else {
        const widths = splitRecommendationWidths(width);
        add({ name: `${widths.length} 座吊櫃等分`, kind: "吊櫃組", purpose: "general", frontStyle: "double-door", widths, reason: `總寬超過 900 mm，建議拆成 ${widths.join(" + ")} mm。`, suitability: "高" });
      }
    } else {
      if (width <= 80) {
        add({ name: "補板／補邊板", kind: "補板", purpose: "filler", frontStyle: "panel", reason: "空間過窄，補板可吸收牆面角度與施工誤差。", suitability: "高" });
      } else if (width <= 150) {
        add({ name: space.position === "middle" ? "窄補板" : "見光側封板", kind: "補板", purpose: "filler", frontStyle: "panel", reason: "位於整排端部或窄縫，適合以板件完整收尾。", suitability: "高" });
        add({ name: "小開放格", kind: "開放櫃", purpose: "open", frontStyle: "open", reason: "可收納托盤或小型器具，但需先確認現場五金。", suitability: "中" });
      } else if (width <= 250) {
        add({ name: "調味品側拉籃", kind: "側拉籃", purpose: "appliance", frontStyle: "single-door", reason: "寬度較窄，適合瓶罐、調味料直立收納。", suitability: "高" });
        add({ name: "窄開放櫃", kind: "開放櫃", purpose: "open", frontStyle: "open", reason: "可作為小物收納或展示。", suitability: "中" });
      } else if (width <= 350) {
        add({ name: "窄抽屜櫃", kind: "下櫃", purpose: "drawer", frontStyle: "three-drawer", reason: "適合餐具、保鮮膜與小型廚房用品。", suitability: "高" });
        add({ name: "餐盤收納櫃", kind: "下櫃", purpose: "general", frontStyle: "single-door", reason: "窄幅直立空間適合餐盤與砧板分類。", suitability: "中" });
      } else if (width <= 450) {
        add({ name: "單門收納櫃", kind: "下櫃", purpose: "general", frontStyle: "single-door", reason: "門片比例合理，適合一般鍋具與備品。", suitability: "高" });
        add({ name: "垃圾桶櫃", kind: "下櫃", purpose: "general", frontStyle: "single-door", reason: "可配置分類垃圾桶或清潔用品。", suitability: "中" });
      } else if (width <= 600) {
        add({ name: "標準抽屜櫃", kind: "下櫃", purpose: "drawer", frontStyle: "two-small-one-large", reason: "符合常用抽屜模組尺度，收納效率高。", suitability: "高" });
        add({ name: "單門收納櫃", kind: "下櫃", purpose: "general", frontStyle: "single-door", reason: "適合一般鍋具與備品收納。", suitability: "中" });
        add({ name: "洗碗機預留櫃", kind: "電器櫃", purpose: "appliance", frontStyle: "appliance", reason: "寬度可作為標準洗碗機或嵌入電器預留。", suitability: "中" });
      } else if (width <= 750) {
        add({ name: "水槽櫃", kind: "下櫃", purpose: "sink", frontStyle: "double-door", reason: "寬度適合水槽與下方管線維修空間。", suitability: "高" });
        add({ name: "爐台櫃", kind: "下櫃", purpose: "stove", frontStyle: "double-door", reason: "寬度適合常見雙口或三口爐具。", suitability: "高" });
        add({ name: "三抽屜櫃", kind: "下櫃", purpose: "drawer", frontStyle: "three-drawer", reason: "寬幅抽屜適合鍋具與大型餐具。", suitability: "高" });
        add({ name: "對開門收納櫃", kind: "下櫃", purpose: "general", frontStyle: "double-door", reason: "對開門可避免單片門過寬。", suitability: "中" });
      } else if (width <= 900) {
        add({ name: "大抽屜櫃", kind: "下櫃", purpose: "drawer", frontStyle: "two-small-one-large", reason: "適合大型鍋具，但需確認滑軌承重。", suitability: "高" });
        add({ name: "對開門收納櫃", kind: "下櫃", purpose: "general", frontStyle: "double-door", reason: "較寬空間使用對開門，門片比例較穩定。", suitability: "高" });
      } else {
        const widths = splitRecommendationWidths(width);
        add({ name: `${widths.length} 座下櫃等分`, kind: "下櫃組", purpose: "general", frontStyle: "double-door", widths, reason: `總寬超過 900 mm，建議拆成 ${widths.join(" + ")} mm。`, suitability: "高" });
      }
    }

    if (width >= MIN_GAP && !configs.some((item) => item.purpose === "filler")) {
      add({
        name: layer === "upper" ? "吊櫃補板" : "補板",
        kind: "補板",
        purpose: "filler",
        frontStyle: "panel",
        reason: context.forceFillerReason || "若現場不適合配置櫃體或五金，可使用補板完整收尾。",
        suitability: width <= 150 || space.position !== "middle" ? "高" : "中"
      });
    }

    return configs.map((config, index) => recommendation(config, space, index));
  }

  function divideWidths(totalWidth, targetCount) {
    const total = Math.max(0, Math.floor(finite(totalWidth)));
    const count = Math.max(1, Math.min(12, Math.floor(finite(targetCount, 1))));
    if (total <= 0 || count <= 0) return [];
    const baseWidth = Math.floor(total / count);
    const remainder = total % count;
    return Array.from({ length: count }, (_, index) => baseWidth + (index < remainder ? 1 : 0));
  }

  function validateEqualizeSelection(cabinets, selectedIds) {
    const list = Array.isArray(cabinets) ? cabinets : [];
    const ids = new Set(Array.isArray(selectedIds) ? selectedIds : []);
    const selected = list.filter((cabinet) => ids.has(cabinet.id));
    if (!selected.length) return { valid: false, code: "empty", message: "請先選取要重新等分的櫃體。" };
    const layers = new Set(selected.map((cabinet) => cabinet.type === "upper" ? "upper" : "lower"));
    if (layers.size > 1) return { valid: false, code: "mixed-layer", message: "下櫃與吊櫃不能混選。" };
    const layer = [...layers][0];
    const layerCabinets = list
      .filter((cabinet) => (cabinet.type === "upper" ? "upper" : "lower") === layer)
      .sort((a, b) => finite(a.x) - finite(b.x));
    const indexes = layerCabinets
      .map((cabinet, index) => ids.has(cabinet.id) ? index : -1)
      .filter((index) => index >= 0)
      .sort((a, b) => a - b);
    const continuous = indexes.every((index, position) => position === 0 || index === indexes[position - 1] + 1);
    if (!continuous) return { valid: false, code: "not-continuous", message: "請選取連續櫃體，才能進行等分。" };
    const ordered = indexes.map((index) => layerCabinets[index]);
    return {
      valid: true,
      code: "ok",
      layer,
      selected: ordered,
      totalWidth: ordered.reduce((sum, cabinet) => sum + positive(cabinet.width), 0),
      containsSpecial: ordered.some((cabinet) => ["sink", "stove", "appliance", "hood", "dish-dryer"].includes(cabinet.purpose))
    };
  }

  global.MODUDRAFTKitchenAssist = Object.freeze({
    MIN_GAP,
    detectAvailableSpaces,
    getCabinetRecommendations,
    divideWidths,
    validateEqualizeSelection,
    splitRecommendationWidths
  });
})(window);
