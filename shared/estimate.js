(function modudraftEstimateModule(global) {
  "use strict";

  const DISCLAIMER = "此為線上模擬估價，實際價格仍需依現場丈量、材料品牌、五金設備、施工條件與廠商正式報價為準。";
  const UNITS = ["CM", "MM", "M", "式", "組", "支", "個", "片", "套", "台", "車", "次", "座", "項"];
  const PRICING_STATUSES = Object.freeze({
    priced: "計價",
    free: "贈送",
    included: "已包含",
    ownerProvided: "客供",
    pending: "待報價",
    notIncluded: "不含"
  });
  const SECTION_DEFINITIONS = Object.freeze([
    { id: "kitchen-carcass", title: "廚具櫃身", order: 1 },
    { id: "countertop-sink", title: "廚具檯面、水槽、水龍頭", order: 2 },
    { id: "hardware", title: "把手、抽屜、拉籃、五金", order: 3 },
    { id: "appliances", title: "三機與設備", order: 4 },
    { id: "system-cabinet", title: "系統櫃", order: 5 },
    { id: "other", title: "其他費用", order: 6 },
    { id: "manual", title: "手動新增項目", order: 7 }
  ]);

  const DEFAULT_RATES = Object.freeze({
    kitchen: {
      upperCabinetBasicPerCm: 60,
      upperCabinetTallPerCm: 85,
      baseCabinetBasicPerCm: 75,
      baseCabinetMediumPerCm: 90,
      tallCabinetPerCm: 180,
      premiumTallCabinetPerCm: 310,
      fridgeCabinetPerCm: 75,
      fillerPanelPerPiece: 1350,
      sidePanelPerPiece: 1650,
      toeKickPerCm: 8
    },
    countertop: {
      koreanArtificialStonePerCm: 60,
      artificialStoneUpgradePerCm: 70,
      quartzPerCm: 95,
      importedQuartzPerCm: 120,
      stainlessPerCm: 90,
      customPerCm: 0
    },
    processing: {
      sinkCutout: 3200,
      cooktopCutout: 3000,
      lShapeJoint: 5000,
      sinkInstallLabor: 2800,
      faucetInstallLabor: 1000
    },
    sinkFaucet: {
      sinkBasic: 3200,
      faucetBasic: 3000,
      sinkFaucetSetStandard: 19000
    },
    handle: {
      uHandlePerCm: 20,
      jHandlePerCm: 15,
      aluminumCHandlePerCm: 9,
      aluminumGHandlePerCm: 8,
      bevelHandlePerCm: 9,
      hangingRodPerCm: 5
    },
    hardware: {
      woodDrawerSet: 2400,
      aluminumHighDrawerWithRail: 2300,
      aluminumLowDrawer: 1800,
      sidePullBasketBasic: 1760,
      sidePullBasketPremium: 2320,
      cutleryTray: 1040,
      appliancePullOutTray: 800,
      seasoningTallPullBasket: 7600
    },
    appliance: {
      rangeHoodBasic: 6150,
      rangeHoodStandard: 6700,
      rangeHoodPremium: 15000,
      gasCooktopBasic: 7200,
      gasCooktopStandard: 8680,
      gasCooktopPremium: 11250,
      dishDryerBasic: 6060,
      dishDryerStandard: 13200,
      dishwasherBasic: 11760,
      ovenDefault: 18000
    },
    other: {
      deliveryBasic: 3000,
      deliveryPremium: 9000,
      stairLaborPerFloor: 500,
      demolitionBasic: 6000,
      wasteRemovalBasic: 8000,
      plumbingElectricalPerPoint: 2500,
      dedicatedCircuit: 4000,
      installationLaborBasic: 0,
      cabinetDeliveryLabor: 3000,
      pipeRelocation: 3000
    },
    systemCabinet: {
      wallCabinetOpenPerCm: 56,
      wallCabinetWithWoodDoorPerCm: 63,
      lowCabinetOpenPerCm: 53,
      lowCabinetWithWoodDoorPerCm: 62,
      halfHeightCabinetOpenPerCm: 88,
      halfHeightCabinetWithWoodDoorPerCm: 95,
      tallCabinetOpenPerCm: 95,
      tallCabinetWithWoodDoorPerCm: 102,
      tallCabinetWoodAndGlassDoorPerCm: 133,
      tvCabinetOpenPerCm: 53,
      tvCabinetWithWoodDoorPerCm: 70,
      deskPerCm: 63,
      doubleSlidingBookcasePerCm: 239,
      bedsideCabinetOpenPerCm: 67,
      wardrobeOpenPerCm: 109,
      wardrobeWithWoodDoorPerCm: 126,
      slidingDoorWardrobePerCm: 169,
      aluminumGlassSlidingWardrobePerCm: 193
    },
    systemAccessory: {
      shelf18mm20x30: 190,
      shelf25mm20x30: 250,
      mirror18mm20x30: 130,
      mirror25mm20x30: 170,
      uHandlePerCm: 20,
      jHandlePerCm: 15,
      aluminumCHandlePerCm: 9,
      aluminumGHandlePerCm: 8,
      bevelHandlePerCm: 9,
      hangingRodPerCm: 5,
      outerDrawerSmall: 900,
      outerDrawerMedium: 1160,
      outerDrawerLarge: 1580,
      innerDrawerSmall: 1160,
      innerDrawerMedium: 1580,
      innerDrawerLarge: 2110,
      makeupDeskDrawerCabinet: 4230,
      keyboardTray: 580,
      rotatingMirror: 3690,
      pullBasket: 850,
      woodenTieRack: 850,
      woodenHangingRodRack: 850,
      rotatingTieTray: 850,
      drawer: 800,
      lock: 300,
      fillerPanelPerPiece: 1350,
      finishedEndPerPiece: 1650
    }
  });

  const RATE_LABELS = Object.freeze({
    kitchen: {
      upperCabinetBasicPerCm: "上櫃／cm", upperCabinetTallPerCm: "加高上櫃／cm", baseCabinetBasicPerCm: "下櫃基本款／cm", baseCabinetMediumPerCm: "下櫃升級款／cm", tallCabinetPerCm: "高櫃／cm", premiumTallCabinetPerCm: "高階高櫃／cm", fridgeCabinetPerCm: "冰箱高櫃／cm", fillerPanelPerPiece: "補板／片", sidePanelPerPiece: "見光側封板／片", toeKickPerCm: "踢腳板／cm"
    },
    countertop: {
      koreanArtificialStonePerCm: "韓國人造石／cm", artificialStoneUpgradePerCm: "人造石升級款／cm", quartzPerCm: "石英石／cm", importedQuartzPerCm: "進口石英石／cm", stainlessPerCm: "不鏽鋼檯面／cm", customPerCm: "自訂檯面／cm"
    },
    processing: {
      sinkCutout: "水槽開孔加工", cooktopCutout: "爐台開孔加工", lShapeJoint: "L 型檯面接合", sinkInstallLabor: "水槽安裝工資", faucetInstallLabor: "龍頭安裝工資"
    },
    sinkFaucet: {
      sinkBasic: "基本水槽", faucetBasic: "基本龍頭", sinkFaucetSetStandard: "標準水槽龍頭組"
    },
    handle: {
      uHandlePerCm: "ㄇ型把手／cm", jHandlePerCm: "J 型把手／cm", aluminumCHandlePerCm: "鋁 C 型把手／cm", aluminumGHandlePerCm: "鋁 G 型把手／cm", bevelHandlePerCm: "斜把手／cm", hangingRodPerCm: "吊衣桿／cm"
    },
    hardware: {
      woodDrawerSet: "木抽屜／組", aluminumHighDrawerWithRail: "鋁高抽＋高桿／組", aluminumLowDrawer: "鋁低抽／組", sidePullBasketBasic: "側拉籃基本款", sidePullBasketPremium: "側拉籃升級款", cutleryTray: "餐具盤", appliancePullOutTray: "電器抽盤", seasoningTallPullBasket: "調味品高櫃拉籃"
    },
    appliance: {
      rangeHoodBasic: "油煙機入門", rangeHoodStandard: "油煙機標準", rangeHoodPremium: "油煙機高階", gasCooktopBasic: "瓦斯爐入門", gasCooktopStandard: "瓦斯爐標準", gasCooktopPremium: "瓦斯爐高階", dishDryerBasic: "烘碗機入門", dishDryerStandard: "烘碗機標準", dishwasherBasic: "洗碗機", ovenDefault: "烤箱"
    },
    other: {
      deliveryBasic: "基本運送", deliveryPremium: "高階車資／運送", stairLaborPerFloor: "爬梯工資／層", demolitionBasic: "拆除工資", wasteRemovalBasic: "清運費", plumbingElectricalPerPoint: "水電修改／點", dedicatedCircuit: "專用迴路", installationLaborBasic: "基本安裝人工", cabinetDeliveryLabor: "櫃體運送工資", pipeRelocation: "管線拆遷"
    },
    systemCabinet: {
      wallCabinetOpenPerCm: "吊櫃開放式／cm", wallCabinetWithWoodDoorPerCm: "吊櫃木門／cm", lowCabinetOpenPerCm: "矮櫃開放式／cm", lowCabinetWithWoodDoorPerCm: "矮櫃木門／cm", halfHeightCabinetOpenPerCm: "半高櫃開放式／cm", halfHeightCabinetWithWoodDoorPerCm: "半高櫃木門／cm", tallCabinetOpenPerCm: "高櫃開放式／cm", tallCabinetWithWoodDoorPerCm: "高櫃木門／cm", tallCabinetWoodAndGlassDoorPerCm: "高櫃木門＋玻璃／cm", tvCabinetOpenPerCm: "電視櫃開放式／cm", tvCabinetWithWoodDoorPerCm: "電視櫃木門／cm", deskPerCm: "書桌／cm", doubleSlidingBookcasePerCm: "雙推拉書櫃／cm", bedsideCabinetOpenPerCm: "床頭櫃開放式／cm", wardrobeOpenPerCm: "衣櫃開放式／cm", wardrobeWithWoodDoorPerCm: "衣櫃木門／cm", slidingDoorWardrobePerCm: "推拉門衣櫃／cm", aluminumGlassSlidingWardrobePerCm: "鋁框玻璃推拉衣櫃／cm"
    },
    systemAccessory: {
      shelf18mm20x30: "18 mm 層板／片", shelf25mm20x30: "25 mm 層板／片", mirror18mm20x30: "18 mm 鏡面／片", mirror25mm20x30: "25 mm 鏡面／片", uHandlePerCm: "ㄇ型把手／cm", jHandlePerCm: "J 型把手／cm", aluminumCHandlePerCm: "鋁 C 型把手／cm", aluminumGHandlePerCm: "鋁 G 型把手／cm", bevelHandlePerCm: "斜把手／cm", hangingRodPerCm: "吊衣桿／cm", outerDrawerSmall: "外抽小", outerDrawerMedium: "外抽中", outerDrawerLarge: "外抽大", innerDrawerSmall: "內抽小", innerDrawerMedium: "內抽中", innerDrawerLarge: "內抽大", makeupDeskDrawerCabinet: "化妝台抽屜櫃", keyboardTray: "鍵盤架", rotatingMirror: "旋轉鏡", pullBasket: "拉籃", woodenTieRack: "木製領帶架", woodenHangingRodRack: "木製吊衣架", rotatingTieTray: "旋轉領帶盤", drawer: "抽屜", lock: "鎖", fillerPanelPerPiece: "系統櫃補板／片", finishedEndPerPiece: "見光側板／片"
    }
  });

  const COUNTERTOP_OPTIONS = Object.freeze({
    koreanArtificialStone: { name: "韓國人造石", rateKey: "koreanArtificialStonePerCm" },
    artificialStoneUpgrade: { name: "人造石升級款", rateKey: "artificialStoneUpgradePerCm" },
    quartz: { name: "石英石", rateKey: "quartzPerCm" },
    importedQuartz: { name: "進口石英石", rateKey: "importedQuartzPerCm" },
    stainless: { name: "不鏽鋼檯面", rateKey: "stainlessPerCm" },
    custom: { name: "自訂檯面", rateKey: "customPerCm" }
  });

  let localId = Date.now();
  function uid(prefix) {
    if (global.MODUDRAFTCore?.uid) return global.MODUDRAFTCore.uid(prefix || "estimate");
    localId += 1;
    return `${prefix || "estimate"}-${localId.toString(36)}`;
  }
  function safeNumber(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const parsed = Number(value);
    const safe = Number.isFinite(parsed) ? parsed : fallback;
    return Math.min(max, Math.max(min, safe));
  }
  function roundMoney(value) { return Math.round(safeNumber(value, 0, 0)); }
  function roundQuantity(value, digits = 1) {
    const factor = 10 ** digits;
    return Math.round(safeNumber(value, 0, 0) * factor) / factor;
  }
  function clone(value) {
    if (global.structuredClone) return global.structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }
  function deepMerge(base, override) {
    const result = clone(base);
    Object.entries(override || {}).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value) && result[key] && typeof result[key] === "object") result[key] = deepMerge(result[key], value);
      else result[key] = value;
    });
    return result;
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }
  function money(value) { return new Intl.NumberFormat("zh-Hant-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 }).format(roundMoney(value)); }
  function statusLabel(status) { return PRICING_STATUSES[status] || PRICING_STATUSES.pending; }

  function createEstimateItem(input = {}) {
    const pricingStatus = Object.hasOwn(PRICING_STATUSES, input.pricingStatus) ? input.pricingStatus : "priced";
    const quantity = roundQuantity(input.quantity, input.unit === "M" ? 2 : 1);
    const unitPrice = roundMoney(input.unitPrice);
    return {
      id: input.id || uid("estimate-item"),
      sectionId: SECTION_DEFINITIONS.some((section) => section.id === input.sectionId) ? input.sectionId : "manual",
      itemNo: Math.max(0, Math.round(safeNumber(input.itemNo, 0, 0))),
      name: String(input.name || "未命名項目"),
      spec: String(input.spec || ""),
      unit: UNITS.includes(input.unit) ? input.unit : "項",
      quantity,
      unitPrice,
      subtotal: pricingStatus === "priced" ? roundMoney(quantity * unitPrice) : 0,
      note: String(input.note || ""),
      pricingStatus,
      includeInTotal: input.includeInTotal !== false,
      sourceType: String(input.sourceType || "manual"),
      sourceId: input.sourceId || "",
      editable: input.editable !== false,
      rateKey: input.rateKey || ""
    };
  }

  function flattenItems(documentLike) {
    if (Array.isArray(documentLike?.items)) return documentLike.items;
    return (documentLike?.sections || []).flatMap((section) => section.items || []);
  }

  function recalculateEstimate(documentLike = {}) {
    const items = flattenItems(documentLike).map(createEstimateItem);
    let itemNo = 1;
    const sections = SECTION_DEFINITIONS.map((definition) => {
      const sectionItems = items.filter((item) => item.sectionId === definition.id).map((item) => ({ ...item, itemNo: itemNo++ }));
      const subtotal = sectionItems.reduce((sum, item) => sum + (item.pricingStatus === "priced" && item.includeInTotal ? item.subtotal : 0), 0);
      return { ...definition, items: sectionItems, subtotal: roundMoney(subtotal) };
    });
    const subtotalBeforeTax = sections.reduce((sum, section) => sum + section.subtotal, 0);
    const taxMode = ["excluded", "included", "none"].includes(documentLike.taxMode) ? documentLike.taxMode : "excluded";
    const taxRate = safeNumber(documentLike.taxRate, 0.05, 0, 1);
    let taxAmount = 0;
    let totalWithTax = subtotalBeforeTax;
    if (taxMode === "excluded") {
      taxAmount = roundMoney(subtotalBeforeTax * taxRate);
      totalWithTax = subtotalBeforeTax + taxAmount;
    } else if (taxMode === "included") {
      taxAmount = roundMoney(subtotalBeforeTax * taxRate / (1 + taxRate));
    }
    return {
      id: documentLike.id || uid("estimate"),
      projectId: documentLike.projectId || "",
      updatedAt: new Date().toISOString(),
      currency: "NTD",
      sections,
      subtotalBeforeTax: roundMoney(subtotalBeforeTax),
      taxRate,
      taxAmount,
      totalWithTax: roundMoney(totalWithTax),
      taxMode,
      note: String(documentLike.note || ""),
      rates: deepMerge(DEFAULT_RATES, documentLike.rates || {}),
      settings: Object.assign({ countertopMaterial: "koreanArtificialStone", appliancePlan: "standard", sinkFaucetPlan: "separate", deliveryPlan: "basic", includeProcessing: true }, documentLike.settings || {}),
      sourceSignature: documentLike.sourceSignature || "",
      sourceUpdatedAt: documentLike.sourceUpdatedAt || "",
      hasManualEdits: Boolean(documentLike.hasManualEdits),
      stale: Boolean(documentLike.stale)
    };
  }

  function createEstimateDocument(input = {}) {
    return recalculateEstimate(input);
  }

  function addItem(items, input) {
    const quantity = safeNumber(input.quantity, 0, 0);
    if (quantity <= 0 && input.pricingStatus !== "pending" && input.pricingStatus !== "notIncluded") return;
    items.push(createEstimateItem(input));
  }

  function cabinetWidth(cabinet) { return safeNumber(cabinet?.width, 0, 0, 30000); }
  function cabinetUsage(cabinet) { return String(cabinet?.usage || cabinet?.purpose || cabinet?.cabinetKind || "storage").toLowerCase(); }
  function isFiller(cabinet) { return Boolean(cabinet?.isFiller) || cabinetUsage(cabinet) === "filler" || ["filler", "panel"].includes(cabinet?.category); }
  function isUpper(cabinet) { return cabinet?.runLayer === "upper" || cabinet?.type === "upper" || ["wall", "wallCabinet"].includes(cabinet?.category); }
  function isTall(cabinet) {
    const usage = cabinetUsage(cabinet);
    return ["tall", "tallCabinet"].includes(cabinet?.category) || cabinet?.type === "tall" || ["fridge", "appliance-tall", "electric-tall"].includes(usage) || safeNumber(cabinet?.height, 0) > 1400 && cabinet?.runLayer === "full";
  }
  function countedSidePanels(cabinet) {
    const side = cabinet?.sidePanel ?? cabinet?.sideTreatment;
    if (!side) return 0;
    if (typeof side === "object") return Number(Boolean(side.left)) + Number(Boolean(side.right));
    return ["finished", "exposed", "both", "left-finished", "right-finished"].includes(String(side)) ? (String(side) === "both" ? 2 : 1) : 0;
  }
  function projectSignature(project) {
    const projection = {
      type: project?.type,
      kitchenType: project?.kitchenType,
      walls: (project?.walls || []).map((wall) => [wall.id, wall.width, wall.height]),
      cabinets: (project?.cabinets || []).map((cabinet) => [cabinet.id, cabinet.wallId, cabinet.category, cabinetUsage(cabinet), cabinet.width, cabinet.height, cabinet.depth, cabinet.doorStyle, cabinet.handleStyle, cabinet.runLayer, countedSidePanels(cabinet), cabinet.drawers?.length, cabinet.shelves?.length, cabinet.accessories?.length])
    };
    const text = JSON.stringify(projection);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
    return `cfg-${(hash >>> 0).toString(36)}`;
  }

  function groupedItem(items, sectionId, sourceType, sourceId, name, spec, unit, quantity, unitPrice, rateKey, extra = {}) {
    addItem(items, { sectionId, sourceType, sourceId, name, spec, unit, quantity, unitPrice, rateKey, ...extra });
  }

  function generateKitchenItems(project, rates, settings) {
    const items = [];
    const cabinets = (project?.cabinets || []).filter((cabinet) => cabinet?.includeInQuote !== false && (project?.type !== "fullInterior" || cabinet.estimateDomain !== "system"));
    if (!cabinets.length) return items;
    const kitchenRates = rates.kitchen;
    const fillerCabinets = cabinets.filter(isFiller);
    const regular = cabinets.filter((cabinet) => !isFiller(cabinet));
    const upper = regular.filter(isUpper);
    const tall = regular.filter((cabinet) => !isUpper(cabinet) && isTall(cabinet));
    const lower = regular.filter((cabinet) => !isUpper(cabinet) && !isTall(cabinet));
    const fridgeTall = tall.filter((cabinet) => cabinetUsage(cabinet).includes("fridge"));
    const applianceTall = tall.filter((cabinet) => ["appliance", "electric-tall", "appliance-tall"].some((key) => cabinetUsage(cabinet).includes(key)));
    const storageTall = tall.filter((cabinet) => !fridgeTall.includes(cabinet) && !applianceTall.includes(cabinet));
    const sumCm = (list) => roundQuantity(list.reduce((sum, cabinet) => sum + cabinetWidth(cabinet), 0) / 10, 1);

    groupedItem(items, "kitchen-carcass", "kitchenCabinet", "upper-run", "上櫃", "木芯板桶身／六面結烤", "CM", sumCm(upper), kitchenRates.upperCabinetBasicPerCm, "kitchen.upperCabinetBasicPerCm");
    groupedItem(items, "kitchen-carcass", "kitchenCabinet", "base-run", "下櫃", "木芯板桶身／六面結烤", "CM", sumCm(lower), kitchenRates.baseCabinetBasicPerCm, "kitchen.baseCabinetBasicPerCm");
    groupedItem(items, "kitchen-carcass", "kitchenCabinet", "tall-run", "高櫃", "高櫃桶身與門片", "CM", sumCm(storageTall), kitchenRates.tallCabinetPerCm, "kitchen.tallCabinetPerCm");
    groupedItem(items, "kitchen-carcass", "kitchenCabinet", "fridge-run", "冰箱高櫃", "冰箱上櫃／側櫃", "CM", sumCm(fridgeTall), kitchenRates.fridgeCabinetPerCm, "kitchen.fridgeCabinetPerCm");
    groupedItem(items, "kitchen-carcass", "kitchenCabinet", "appliance-run", "電器高櫃", "電器收納高櫃", "CM", sumCm(applianceTall), kitchenRates.tallCabinetPerCm, "kitchen.tallCabinetPerCm");
    groupedItem(items, "kitchen-carcass", "kitchenCabinet", "fillers", "補板／補邊", "依現場牆面收尾", "片", fillerCabinets.length, kitchenRates.fillerPanelPerPiece, "kitchen.fillerPanelPerPiece");
    const sidePanelCount = regular.reduce((sum, cabinet) => sum + countedSidePanels(cabinet), 0);
    groupedItem(items, "kitchen-carcass", "kitchenCabinet", "side-panels", "見光側封板", "櫃體落地側封", "片", sidePanelCount, kitchenRates.sidePanelPerPiece, "kitchen.sidePanelPerPiece");
    const toeKickCm = roundQuantity(lower.filter((cabinet) => cabinet.hasToeKick !== false && cabinet.toeKick !== false).reduce((sum, cabinet) => sum + cabinetWidth(cabinet), 0) / 10, 1);
    groupedItem(items, "kitchen-carcass", "kitchenCabinet", "toe-kick", "踢腳板", "連續踢腳板", "CM", toeKickCm, kitchenRates.toeKickPerCm, "kitchen.toeKickPerCm");

    const countertopOption = COUNTERTOP_OPTIONS[settings.countertopMaterial] || COUNTERTOP_OPTIONS.koreanArtificialStone;
    const explicitCountertopMm = (project?.countertops || []).reduce((sum, item) => sum + safeNumber(item.length ?? item.width, 0), 0);
    const inferredCountertopMm = lower.filter((cabinet) => cabinet.hasCountertop !== false && cabinet.countertop !== false).reduce((sum, cabinet) => sum + cabinetWidth(cabinet), 0);
    const countertopCm = roundQuantity((explicitCountertopMm || inferredCountertopMm) / 10, 1);
    groupedItem(items, "countertop-sink", "countertop", "countertop-run", countertopOption.name, "連續檯面，實際接縫依現場確認", "CM", countertopCm, rates.countertop[countertopOption.rateKey], `countertop.${countertopOption.rateKey}`);

    const sinkCount = Math.max(0, regular.filter((cabinet) => cabinet.isSinkCabinet || cabinetUsage(cabinet) === "sink").length);
    const cooktopCount = Math.max(0, regular.filter((cabinet) => cabinet.isCooktopCabinet || ["stove", "cooktop"].includes(cabinetUsage(cabinet))).length);
    if (settings.sinkFaucetPlan === "set") {
      groupedItem(items, "countertop-sink", "sinkFaucet", "sink-faucet-set", "水槽龍頭標準組", "水槽、龍頭與基本安裝", "組", sinkCount, rates.sinkFaucet.sinkFaucetSetStandard, "sinkFaucet.sinkFaucetSetStandard");
    } else if (settings.sinkFaucetPlan !== "none") {
      groupedItem(items, "countertop-sink", "sinkFaucet", "sink-basic", "基本水槽", "型號可於明細覆寫", "式", sinkCount, rates.sinkFaucet.sinkBasic, "sinkFaucet.sinkBasic");
      groupedItem(items, "countertop-sink", "sinkFaucet", "faucet-basic", "基本龍頭", "型號可於明細覆寫", "式", sinkCount, rates.sinkFaucet.faucetBasic, "sinkFaucet.faucetBasic");
    }
    if (settings.includeProcessing) {
      groupedItem(items, "countertop-sink", "labor", "sink-cutout", "水槽開孔加工", "依水槽安裝方式與檯面材質調整", "式", sinkCount, rates.processing.sinkCutout, "processing.sinkCutout", { includeInTotal: false });
      groupedItem(items, "countertop-sink", "labor", "cooktop-cutout", "爐台開孔加工", "依檯面材質與現場加工調整", "式", cooktopCount, rates.processing.cooktopCutout, "processing.cooktopCutout");
      if ((project?.kitchenType === "L" || (project?.walls || []).length > 1) && countertopCm > 0) groupedItem(items, "countertop-sink", "labor", "l-joint", "L 型檯面接合", "轉角接合加工", "式", 1, rates.processing.lShapeJoint, "processing.lShapeJoint");
      groupedItem(items, "countertop-sink", "labor", "sink-install", "水槽安裝工資", "依現場固定與收邊調整", "式", sinkCount, rates.processing.sinkInstallLabor, "processing.sinkInstallLabor", { includeInTotal: false });
      groupedItem(items, "countertop-sink", "labor", "faucet-install", "龍頭安裝工資", "依現場管線條件調整", "式", sinkCount, rates.processing.faucetInstallLabor, "processing.faucetInstallLabor", { includeInTotal: false });
    }

    const handleGroups = new Map();
    regular.forEach((cabinet) => {
      const style = String(cabinet.handleStyle || "none");
      if (style === "none") return;
      const layer = isUpper(cabinet) ? "上櫃" : "下櫃";
      const key = `${layer}:${style}`;
      handleGroups.set(key, (handleGroups.get(key) || 0) + cabinetWidth(cabinet));
    });
    const handleInfo = {
      "c-channel": ["鋁 C 型把手", "aluminumCHandlePerCm"],
      bar: ["G 型／明把手", "aluminumGHandlePerCm"],
      bevel: ["斜把手", "bevelHandlePerCm"],
      j: ["J 型把手", "jHandlePerCm"],
      u: ["ㄇ型把手", "uHandlePerCm"]
    };
    handleGroups.forEach((widthMm, key) => {
      const [layer, style] = key.split(":");
      const [name, rateKey] = handleInfo[style] || handleInfo.bar;
      groupedItem(items, "hardware", "handle", key, `${layer}${name}`, "依門片總寬推估，可手動覆寫", "CM", roundQuantity(widthMm / 10, 1), rates.handle[rateKey], `handle.${rateKey}`);
    });
    const drawerCount = regular.reduce((sum, cabinet) => {
      const explicit = (cabinet.drawers || []).reduce((total, drawer) => total + safeNumber(drawer.count, 1, 0), 0);
      if (explicit) return sum + explicit;
      const front = String(cabinet.doorStyle || cabinet.frontStyle || "");
      if (front.includes("three")) return sum + 3;
      if (front.includes("two")) return sum + 2;
      return sum + (cabinetUsage(cabinet) === "drawer" ? 3 : 0);
    }, 0);
    groupedItem(items, "hardware", "hardware", "drawers", "鋁高抽＋高桿", "依抽屜配置推估", "組", drawerCount, rates.hardware.aluminumHighDrawerWithRail, "hardware.aluminumHighDrawerWithRail");
    const sidePullCount = regular.filter((cabinet) => /pull|basket|seasoning/.test(cabinetUsage(cabinet))).length;
    groupedItem(items, "hardware", "hardware", "side-pull", "側拉籃", "窄櫃收納五金", "組", sidePullCount, rates.hardware.sidePullBasketPremium, "hardware.sidePullBasketPremium");

    generateApplianceItems(items, project, rates, settings, { sinkCount, cooktopCount });
    generateOtherItems(items, rates, settings);
    return items;
  }

  function applianceTier(plan) {
    if (plan === "entry") return "Basic";
    if (plan === "premium") return "Premium";
    return "Standard";
  }
  function generateApplianceItems(items, project, rates, settings, counts = {}) {
    if (settings.appliancePlan === "none") return;
    const tier = applianceTier(settings.appliancePlan);
    const pricingStatus = settings.appliancePlan === "custom" ? "pending" : "priced";
    const names = { Basic: "入門", Standard: "標準", Premium: "高階" };
    const addAppliance = (sourceId, name, rateKey, quantity = 1, status = "priced") => groupedItem(items, "appliances", "appliance", sourceId, name, "品牌型號可於明細編輯", "台", quantity, rates.appliance[rateKey], `appliance.${rateKey}`, { pricingStatus: status });
    addAppliance("range-hood", `${settings.appliancePlan === "custom" ? "自訂" : names[tier]}油煙機`, `rangeHood${tier}`, 1, pricingStatus);
    addAppliance("gas-cooktop", `${settings.appliancePlan === "custom" ? "自訂" : names[tier]}瓦斯爐`, `gasCooktop${tier}`, 1, pricingStatus);
    addAppliance("dish-dryer", `${settings.appliancePlan === "custom" ? "自訂" : names[tier === "Premium" ? "Standard" : tier]}烘碗機`, tier === "Basic" ? "dishDryerBasic" : "dishDryerStandard", 1, pricingStatus);
    const usages = (project?.cabinets || []).map(cabinetUsage);
    if (usages.some((usage) => usage.includes("dishwasher"))) addAppliance("dishwasher", "洗碗機", "dishwasherBasic");
    if (usages.some((usage) => usage.includes("oven"))) addAppliance("oven", "烤箱", "ovenDefault");
  }
  function generateOtherItems(items, rates, settings) {
    if (settings.deliveryPlan !== "none") {
      const premium = settings.deliveryPlan === "premium";
      groupedItem(items, "other", "delivery", "delivery", premium ? "車資／高階運送" : "運送工資", "依樓層、距離與搬運條件調整", "車", 1, premium ? rates.other.deliveryPremium : rates.other.deliveryBasic, premium ? "other.deliveryPremium" : "other.deliveryBasic");
    }
    [
      ["stair", "爬梯工資", "層", "stairLaborPerFloor"],
      ["demolition", "拆除工資", "式", "demolitionBasic"],
      ["waste", "清運費", "車", "wasteRemovalBasic"],
      ["plumbing", "水電修改", "點", "plumbingElectricalPerPoint"],
      ["circuit", "專用迴路", "式", "dedicatedCircuit"],
      ["installation", "基本安裝人工", "式", "installationLaborBasic"],
      ["pipe", "管線拆遷", "式", "pipeRelocation"]
    ].forEach(([id, name, unit, rateKey]) => groupedItem(items, "other", "labor", id, name, "需要時勾選計入總價", unit, 1, rates.other[rateKey], `other.${rateKey}`, { includeInTotal: false }));
  }

  function systemCabinetRate(cabinet) {
    const usage = cabinetUsage(cabinet);
    const door = String(cabinet.doorStyle || "");
    const open = !door || door.includes("open") || (cabinet.doors || []).length === 0;
    const sliding = door.includes("sliding");
    const height = safeNumber(cabinet.height, 2400);
    if (usage.includes("wardrobe")) return sliding ? ["推拉門衣櫃", "slidingDoorWardrobePerCm"] : open ? ["衣櫃開放式", "wardrobeOpenPerCm"] : ["衣櫃木門", "wardrobeWithWoodDoorPerCm"];
    if (usage.includes("book") && sliding) return ["雙推拉書櫃", "doubleSlidingBookcasePerCm"];
    if (usage.includes("tv")) return open ? ["電視櫃開放式", "tvCabinetOpenPerCm"] : ["電視櫃木門", "tvCabinetWithWoodDoorPerCm"];
    if (usage.includes("desk")) return ["書桌", "deskPerCm"];
    if (height <= 900) return open ? ["矮櫃開放式", "lowCabinetOpenPerCm"] : ["矮櫃木門", "lowCabinetWithWoodDoorPerCm"];
    if (height <= 1600) return open ? ["半高櫃開放式", "halfHeightCabinetOpenPerCm"] : ["半高櫃木門", "halfHeightCabinetWithWoodDoorPerCm"];
    return open ? ["高櫃開放式", "tallCabinetOpenPerCm"] : ["高櫃木門", "tallCabinetWithWoodDoorPerCm"];
  }

  function generateSystemItems(project, rates, settings) {
    const items = [];
    const cabinets = (project?.cabinets || []).filter((cabinet) => cabinet?.includeInQuote !== false && (project?.type !== "fullInterior" || cabinet.estimateDomain === "system"));
    if (!cabinets.length) return items;
    const fillers = cabinets.filter(isFiller);
    const regular = cabinets.filter((cabinet) => !isFiller(cabinet));
    const grouped = new Map();
    regular.forEach((cabinet) => {
      const [name, rateKey] = systemCabinetRate(cabinet);
      const key = `${name}:${rateKey}`;
      const current = grouped.get(key) || { name, rateKey, width: 0, ids: [] };
      current.width += cabinetWidth(cabinet);
      current.ids.push(cabinet.id);
      grouped.set(key, current);
    });
    grouped.forEach((group) => groupedItem(items, "system-cabinet", "systemCabinet", group.ids.join(","), group.name, "系統板材櫃體，實際色號與門片另確認", "CM", roundQuantity(group.width / 10, 1), rates.systemCabinet[group.rateKey], `systemCabinet.${group.rateKey}`));
    groupedItem(items, "system-cabinet", "systemCabinet", "system-fillers", "系統櫃補板", "獨立補板", "片", fillers.length, rates.systemAccessory.fillerPanelPerPiece, "systemAccessory.fillerPanelPerPiece");
    const finishedEndCount = regular.reduce((sum, cabinet) => sum + countedSidePanels(cabinet), 0);
    groupedItem(items, "system-cabinet", "systemCabinet", "system-finished-ends", "系統櫃見光側板", "落地見光側封", "片", finishedEndCount, rates.systemAccessory.finishedEndPerPiece, "systemAccessory.finishedEndPerPiece");
    const shelfCount = regular.reduce((sum, cabinet) => sum + Math.max(0, (cabinet.shelves || []).length - 1), 0);
    groupedItem(items, "system-cabinet", "hardware", "system-shelves", "18 mm 活動／固定層板", "依目前分格數推估", "片", shelfCount, rates.systemAccessory.shelf18mm20x30, "systemAccessory.shelf18mm20x30");
    const drawerCount = regular.reduce((sum, cabinet) => sum + (cabinet.drawers || []).reduce((total, drawer) => total + safeNumber(drawer.count, 1, 0), 0), 0);
    groupedItem(items, "system-cabinet", "hardware", "system-drawers", "系統櫃抽屜", "依目前抽屜配件推估", "個", drawerCount, rates.systemAccessory.drawer, "systemAccessory.drawer");
    const rodLengthCm = regular.reduce((sum, cabinet) => {
      const rods = (cabinet.accessories || []).filter((accessory) => accessory.type === "rod").length;
      return sum + rods * cabinetWidth(cabinet) / 10;
    }, 0);
    groupedItem(items, "system-cabinet", "hardware", "system-rods", "吊衣桿", "依吊衣格淨寬推估", "CM", roundQuantity(rodLengthCm, 1), rates.systemAccessory.hangingRodPerCm, "systemAccessory.hangingRodPerCm");
    generateOtherItems(items, rates, settings);
    return items;
  }

  function generateEstimate(project, options = {}) {
    const previous = options.previousDocument || project?.estimateDocument || null;
    const rates = deepMerge(DEFAULT_RATES, options.rates || previous?.rates || project?.estimateRates || {});
    const settings = Object.assign({ countertopMaterial: "koreanArtificialStone", appliancePlan: "standard", sinkFaucetPlan: "separate", deliveryPlan: "basic", includeProcessing: true }, previous?.settings || {}, options.settings || {});
    const type = project?.type || options.type || "kitchen";
    let items = [];
    if (type === "kitchen" || type === "fullInterior" || project?.sourceState?.kitchen) items.push(...generateKitchenItems(project, rates, settings));
    if (type === "cabinet" || type === "fullInterior" || project?.sourceState?.system) items.push(...generateSystemItems(project, rates, settings));
    const manualItems = previous ? flattenItems(previous).filter((item) => item.sourceType === "manual") : [];
    items.push(...manualItems);
    return createEstimateDocument({
      id: previous?.id,
      projectId: project?.id || previous?.projectId || "",
      items,
      taxMode: previous?.taxMode || "excluded",
      taxRate: previous?.taxRate ?? 0.05,
      note: previous?.note || "",
      rates,
      settings,
      sourceSignature: projectSignature(project),
      sourceUpdatedAt: project?.updatedAt || "",
      hasManualEdits: false,
      stale: false
    });
  }

  function estimateToText(documentLike) {
    const document = recalculateEstimate(documentLike);
    const lines = ["MODUDRAFT 廚具與系統櫃估價", ""];
    document.sections.forEach((section) => {
      if (!section.items.length) return;
      lines.push(`【${section.title}】`, "");
      section.items.forEach((item, index) => {
        const amount = item.pricingStatus === "priced" ? `小計 ${item.subtotal.toLocaleString("zh-TW")}` : statusLabel(item.pricingStatus);
        lines.push(`${index + 1}. ${item.name}${item.spec ? ` / ${item.spec}` : ""}，${item.unit}，${item.quantity.toLocaleString("zh-TW")}，${item.unitPrice.toLocaleString("zh-TW")}，${amount}${item.includeInTotal ? "" : "（未計入總價）"}`);
      });
      lines.push("");
    });
    lines.push(`合計金額：${document.subtotalBeforeTax.toLocaleString("zh-TW")}`);
    if (document.taxMode === "none") lines.push("稅額：不計稅");
    else lines.push(`${document.taxMode === "included" ? "內含" : "稅額"} ${Math.round(document.taxRate * 10000) / 100}%：${document.taxAmount.toLocaleString("zh-TW")}`);
    lines.push(`總計金額：${document.totalWithTax.toLocaleString("zh-TW")}`, "", DISCLAIMER);
    return lines.join("\n");
  }

  function estimateToCsv(documentLike) {
    const document = recalculateEstimate(documentLike);
    const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [["分類", "編號", "品名", "規格", "單位", "數量", "單價", "小計", "計價狀態", "計入總價", "備註"]];
    document.sections.forEach((section) => section.items.forEach((item) => rows.push([section.title, item.itemNo, item.name, item.spec, item.unit, item.quantity, item.unitPrice, item.subtotal, statusLabel(item.pricingStatus), item.includeInTotal ? "是" : "否", item.note])));
    rows.push([], ["合計", "", "", "", "", "", "", document.subtotalBeforeTax], ["稅額", "", "", "", "", "", "", document.taxAmount], ["總計", "", "", "", "", "", "", document.totalWithTax]);
    return rows.map((row) => row.map(quote).join(",")).join("\r\n");
  }

  function estimateWorkbookData(documentLike) {
    const document = recalculateEstimate(documentLike);
    return {
      workbookName: "MODUDRAFT-模擬估價",
      sheets: [
        { name: "估價總覽", rows: [["合計金額", document.subtotalBeforeTax], ["稅額", document.taxAmount], ["總計金額", document.totalWithTax], ["提醒", DISCLAIMER]] },
        { name: "估價明細", csv: estimateToCsv(document) }
      ]
    };
  }

  function downloadText(filename, content, type) {
    const blob = new Blob([content], { type: type || "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function mount(options = {}) {
    const adapter = Object.assign({
      type: "kitchen",
      buttonTarget: "body",
      getProject: () => null,
      saveDocument: () => {},
      showToast: (message) => console.info(message)
    }, options);
    const target = typeof adapter.buttonTarget === "string" ? document.querySelector(adapter.buttonTarget) : adapter.buttonTarget;
    if (!target) return null;
    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "md-estimate-open";
    openButton.dataset.helpId = "estimate";
    openButton.innerHTML = `<span aria-hidden="true">NT$</span><b>估價</b>`;
    openButton.title = "廚具與系統櫃粗估價";
    target.appendChild(openButton);

    const overlay = document.createElement("div");
    overlay.className = "md-estimate-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <section class="md-estimate-panel" role="dialog" aria-modal="true" aria-label="MODUDRAFT 廚具與系統櫃粗估價">
        <header class="md-estimate-header">
          <div><span>MODUDRAFT Estimate</span><h2>廚具與系統櫃粗估價</h2><p>${DISCLAIMER}</p></div>
          <button type="button" class="md-estimate-close" aria-label="關閉估價">×</button>
        </header>
        <div class="md-estimate-stale" hidden><b>目前配置已變更</b><span>是否重新依配置產生估價？手動修改的明細可能會被更新。</span><button type="button" data-estimate-action="regenerate">重新產生</button></div>
        <nav class="md-estimate-tabs" aria-label="估價功能"><button class="active" data-estimate-tab="overview">總覽</button><button data-estimate-tab="details">明細</button><button data-estimate-tab="rates">單價設定</button><button data-estimate-tab="manual">手動新增</button></nav>
        <main class="md-estimate-content"></main>
        <footer class="md-estimate-footer"><div class="md-estimate-footer-totals"><span>合計 <b data-total="subtotal">NT$0</b></span><span>稅額 <b data-total="tax">NT$0</b></span><span class="grand">總計 <b data-total="grand">NT$0</b></span></div><div class="md-estimate-footer-actions"><button data-estimate-action="copy">複製明細</button><button data-estimate-action="csv">CSV／Excel</button><button data-estimate-action="json">匯出 JSON</button></div></footer>
      </section>`;
    document.body.appendChild(overlay);
    const content = overlay.querySelector(".md-estimate-content");
    const staleBanner = overlay.querySelector(".md-estimate-stale");
    let activeTab = "overview";
    let currentDocument = null;
    let currentProject = null;

    function persist() {
      if (!currentDocument) return;
      currentDocument = recalculateEstimate(currentDocument);
      adapter.saveDocument(clone(currentDocument));
      updateFooter();
    }

    function updateFooter() {
      if (!currentDocument) return;
      overlay.querySelector('[data-total="subtotal"]').textContent = money(currentDocument.subtotalBeforeTax);
      overlay.querySelector('[data-total="tax"]').textContent = money(currentDocument.taxAmount);
      overlay.querySelector('[data-total="grand"]').textContent = money(currentDocument.totalWithTax);
    }

    function open() {
      currentProject = adapter.getProject();
      if (!currentProject) return adapter.showToast("尚未建立可估價項目");
      const stored = currentProject.estimateDocument;
      currentDocument = stored ? recalculateEstimate(stored) : generateEstimate(currentProject, { type: adapter.type });
      const signature = projectSignature(currentProject);
      currentDocument.stale = Boolean(stored && stored.sourceSignature && stored.sourceSignature !== signature);
      staleBanner.hidden = !currentDocument.stale;
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
      render();
      if (!stored) persist();
    }

    function close() {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
    }

    function regenerate(force = false) {
      if (currentDocument?.hasManualEdits && !force && !global.confirm("目前估價含手動修改。重新依配置產生後，系統產生項目會更新，手動新增項目仍會保留。是否繼續？")) return false;
      currentProject = adapter.getProject();
      currentDocument = generateEstimate(currentProject, { type: adapter.type, previousDocument: currentDocument, rates: currentDocument?.rates, settings: currentDocument?.settings });
      staleBanner.hidden = true;
      persist();
      render();
      adapter.showToast("已依目前配置重新產生估價");
      return true;
    }

    function overviewHtml() {
      const document = currentDocument;
      const populated = document.sections.filter((section) => section.items.length);
      return `<section class="md-estimate-overview">
        <div class="md-estimate-hero"><span>線上模擬估價</span><h3>${money(document.totalWithTax)}</h3><p>由 ${flattenItems(document).length} 個明細項目加總，非模糊總價公式。</p></div>
        <div class="md-estimate-summary"><article><span>合計金額</span><b>${money(document.subtotalBeforeTax)}</b></article><article><span>${document.taxMode === "included" ? "內含稅額" : "稅額"}</span><b>${money(document.taxAmount)}</b></article><article class="grand"><span>總計金額</span><b>${money(document.totalWithTax)}</b></article></div>
        <div class="md-estimate-settings-grid"><label>稅額模式<select data-document-field="taxMode"><option value="excluded" ${document.taxMode === "excluded" ? "selected" : ""}>未稅另加</option><option value="included" ${document.taxMode === "included" ? "selected" : ""}>金額已含稅</option><option value="none" ${document.taxMode === "none" ? "selected" : ""}>不計稅</option></select></label><label>稅率<span><input data-document-field="taxRate" type="number" min="0" max="100" step="0.1" value="${roundQuantity(document.taxRate * 100, 2)}"><b>%</b></span></label>${adapter.type === "kitchen" ? `<label>檯面材質<select data-setting-field="countertopMaterial">${Object.entries(COUNTERTOP_OPTIONS).map(([id, option]) => `<option value="${id}" ${document.settings.countertopMaterial === id ? "selected" : ""}>${option.name}</option>`).join("")}</select></label><label>三機方案<select data-setting-field="appliancePlan"><option value="none" ${document.settings.appliancePlan === "none" ? "selected" : ""}>不含三機</option><option value="entry" ${document.settings.appliancePlan === "entry" ? "selected" : ""}>入門三機</option><option value="standard" ${document.settings.appliancePlan === "standard" ? "selected" : ""}>標準三機</option><option value="premium" ${document.settings.appliancePlan === "premium" ? "selected" : ""}>高階三機</option><option value="custom" ${document.settings.appliancePlan === "custom" ? "selected" : ""}>自訂三機／待報價</option></select></label><label>水槽龍頭<select data-setting-field="sinkFaucetPlan"><option value="none" ${document.settings.sinkFaucetPlan === "none" ? "selected" : ""}>不含／客供</option><option value="separate" ${document.settings.sinkFaucetPlan === "separate" ? "selected" : ""}>基本水槽＋龍頭</option><option value="set" ${document.settings.sinkFaucetPlan === "set" ? "selected" : ""}>標準水槽龍頭組</option></select></label>` : ""}<label>運送方案<select data-setting-field="deliveryPlan"><option value="none" ${document.settings.deliveryPlan === "none" ? "selected" : ""}>暫不計入</option><option value="basic" ${document.settings.deliveryPlan === "basic" ? "selected" : ""}>基本運送</option><option value="premium" ${document.settings.deliveryPlan === "premium" ? "selected" : ""}>高階車資／運送</option></select></label></div>
        <button type="button" class="md-estimate-regenerate" data-estimate-action="regenerate">依目前配置重新產生估價</button>
        <div class="md-estimate-section-cards">${populated.length ? populated.map((section) => `<article><span>${escapeHtml(section.title)}</span><b>${money(section.subtotal)}</b><small>${section.items.length} 項明細</small></article>`).join("") : `<div class="md-estimate-empty"><b>尚未建立可估價項目</b><span>請先新增廚具或系統櫃，再重新產生估價。</span></div>`}</div>
        <p class="md-estimate-disclaimer">${DISCLAIMER}</p>
      </section>`;
    }

    function itemCard(item) {
      const statusOptions = Object.entries(PRICING_STATUSES).map(([value, label]) => `<option value="${value}" ${item.pricingStatus === value ? "selected" : ""}>${label}</option>`).join("");
      return `<article class="md-estimate-item ${item.includeInTotal ? "" : "excluded"}" data-item-id="${escapeHtml(item.id)}"><div class="md-estimate-item-head"><span>${item.itemNo}</span><div><input data-item-field="name" value="${escapeHtml(item.name)}" aria-label="品名"><input data-item-field="spec" value="${escapeHtml(item.spec)}" aria-label="規格"></div><b>${item.pricingStatus === "priced" ? money(item.subtotal) : statusLabel(item.pricingStatus)}</b></div><div class="md-estimate-item-grid"><label>單位<select data-item-field="unit">${UNITS.map((unit) => `<option ${item.unit === unit ? "selected" : ""}>${unit}</option>`).join("")}</select></label><label>數量<input data-item-field="quantity" type="number" inputmode="decimal" min="0" step="0.1" value="${item.quantity}"></label><label>單價<input data-item-field="unitPrice" type="number" inputmode="numeric" min="0" step="1" value="${item.unitPrice}"></label><label>狀態<select data-item-field="pricingStatus">${statusOptions}</select></label></div><label class="md-estimate-note">備註<input data-item-field="note" value="${escapeHtml(item.note)}"></label><div class="md-estimate-item-foot"><label><input data-item-field="includeInTotal" type="checkbox" ${item.includeInTotal ? "checked" : ""}>計入總價</label>${item.sourceType === "manual" ? `<button type="button" data-estimate-action="delete-item">刪除此項</button>` : `<span>來源：${escapeHtml(item.sourceType)}</span>`}</div></article>`;
    }

    function detailsHtml() {
      const sections = currentDocument.sections.filter((section) => section.items.length);
      if (!sections.length) return `<div class="md-estimate-empty"><b>尚未建立可估價項目</b><span>請先新增櫃體，或到「手動新增」建立明細。</span></div>`;
      return `<section class="md-estimate-details">${sections.map((section, index) => `<details ${index < 3 ? "open" : ""}><summary><span>${escapeHtml(section.title)}<small>${section.items.length} 項</small></span><b>${money(section.subtotal)}</b></summary><div class="md-estimate-items">${section.items.map(itemCard).join("")}</div></details>`).join("")}</section>`;
    }

    function ratesHtml() {
      return `<section class="md-estimate-rates"><div class="md-estimate-rate-intro"><h3>專案單價設定</h3><p>修改後按「套用單價並重新產生」，不會影響其他專案。</p></div>${Object.entries(RATE_LABELS).map(([group, labels]) => `<details ${["kitchen", "countertop", "appliance", "systemCabinet"].includes(group) ? "open" : ""}><summary>${escapeHtml({ kitchen: "廚具櫃身", countertop: "檯面", processing: "加工與安裝", sinkFaucet: "水槽與龍頭", handle: "把手", hardware: "五金", appliance: "三機設備", other: "其他費用", systemCabinet: "系統櫃", systemAccessory: "系統櫃配件" }[group] || group)}</summary><div class="md-estimate-rate-grid">${Object.entries(labels).map(([key, label]) => `<label>${escapeHtml(label)}<span><input type="number" min="0" step="1" data-rate-group="${group}" data-rate-key="${key}" value="${safeNumber(currentDocument.rates?.[group]?.[key], 0)}"><b>NT$</b></span></label>`).join("")}</div></details>`).join("")}<div class="md-estimate-rate-actions"><button type="button" data-estimate-action="reset-rates">恢復系統預設</button><button type="button" class="primary" data-estimate-action="apply-rates">套用單價並重新產生</button></div></section>`;
    }

    function manualHtml() {
      return `<section class="md-estimate-manual"><div><span>手動明細</span><h3>新增估價項目</h3><p>用於玻璃加工、特殊五金或現場臨時費用。所有金額仍會進入同一套明細加總。</p></div><form id="mdEstimateManualForm"><label>分類<select name="sectionId">${SECTION_DEFINITIONS.map((section) => `<option value="${section.id}" ${section.id === "manual" ? "selected" : ""}>${section.title}</option>`).join("")}</select></label><label>名稱<input name="name" required placeholder="例如：玻璃條工資"></label><label>規格<input name="spec" placeholder="選填"></label><label>單位<select name="unit">${UNITS.map((unit) => `<option>${unit}</option>`).join("")}</select></label><label>數量<input name="quantity" type="number" inputmode="decimal" min="0" step="0.1" value="1" required></label><label>單價<input name="unitPrice" type="number" inputmode="numeric" min="0" step="1" value="0" required></label><label>計價狀態<select name="pricingStatus">${Object.entries(PRICING_STATUSES).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label><label class="wide">備註<input name="note" placeholder="選填"></label><label class="check"><input name="includeInTotal" type="checkbox" checked>計入總價</label><button type="submit" class="primary">新增到估價明細</button></form></section>`;
    }

    function render() {
      if (!currentDocument) return;
      overlay.querySelectorAll("[data-estimate-tab]").forEach((button) => button.classList.toggle("active", button.dataset.estimateTab === activeTab));
      if (activeTab === "overview") content.innerHTML = overviewHtml();
      if (activeTab === "details") content.innerHTML = detailsHtml();
      if (activeTab === "rates") content.innerHTML = ratesHtml();
      if (activeTab === "manual") content.innerHTML = manualHtml();
      updateFooter();
    }

    function findItem(id) { return flattenItems(currentDocument).find((item) => item.id === id); }
    function replaceItems(items) { currentDocument = recalculateEstimate({ ...currentDocument, items }); }
    function updateItem(id, field, rawValue, checked) {
      const items = flattenItems(currentDocument);
      const item = items.find((entry) => entry.id === id);
      if (!item || item.editable === false) return;
      if (["quantity", "unitPrice"].includes(field)) item[field] = safeNumber(rawValue, 0, 0);
      else if (field === "includeInTotal") item[field] = Boolean(checked);
      else if (field === "pricingStatus" && Object.hasOwn(PRICING_STATUSES, rawValue)) item[field] = rawValue;
      else if (field === "unit" && UNITS.includes(rawValue)) item[field] = rawValue;
      else if (["name", "spec", "note"].includes(field)) item[field] = String(rawValue || "");
      currentDocument.hasManualEdits = true;
      replaceItems(items);
      persist();
    }

    overlay.addEventListener("click", async (event) => {
      const tab = event.target.closest("[data-estimate-tab]")?.dataset.estimateTab;
      if (tab) { activeTab = tab; render(); return; }
      if (event.target.closest(".md-estimate-close") || event.target === overlay) { close(); return; }
      const action = event.target.closest("[data-estimate-action]")?.dataset.estimateAction;
      if (!action) return;
      if (action === "regenerate") regenerate();
      if (action === "copy") { await copyText(estimateToText(currentDocument)); adapter.showToast("估價明細已複製"); }
      if (action === "csv") downloadText("MODUDRAFT-模擬估價.csv", `\ufeff${estimateToCsv(currentDocument)}`, "text/csv;charset=utf-8");
      if (action === "json") downloadText("MODUDRAFT-模擬估價.json", JSON.stringify({ estimateDocument: currentDocument, workbook: estimateWorkbookData(currentDocument) }, null, 2), "application/json;charset=utf-8");
      if (action === "delete-item") {
        const id = event.target.closest("[data-item-id]")?.dataset.itemId;
        replaceItems(flattenItems(currentDocument).filter((item) => item.id !== id));
        currentDocument.hasManualEdits = true;
        persist();
        render();
      }
      if (action === "reset-rates") { currentDocument.rates = deepMerge(DEFAULT_RATES, {}); render(); }
      if (action === "apply-rates") {
        content.querySelectorAll("[data-rate-group][data-rate-key]").forEach((input) => {
          const group = input.dataset.rateGroup;
          const key = input.dataset.rateKey;
          if (!currentDocument.rates[group]) currentDocument.rates[group] = {};
          currentDocument.rates[group][key] = roundMoney(input.value);
        });
        regenerate(true);
      }
    });

    overlay.addEventListener("change", (event) => {
      const itemField = event.target.dataset.itemField;
      if (itemField) {
        const id = event.target.closest("[data-item-id]")?.dataset.itemId;
        updateItem(id, itemField, event.target.value, event.target.checked);
        render();
        return;
      }
      const documentField = event.target.dataset.documentField;
      if (documentField === "taxMode") currentDocument.taxMode = event.target.value;
      if (documentField === "taxRate") currentDocument.taxRate = safeNumber(event.target.value, 5, 0, 100) / 100;
      if (documentField) { persist(); render(); return; }
      const settingField = event.target.dataset.settingField;
      if (settingField) {
        currentDocument.settings[settingField] = event.target.value;
        regenerate(true);
      }
    });

    overlay.addEventListener("submit", (event) => {
      if (event.target.id !== "mdEstimateManualForm") return;
      event.preventDefault();
      const form = event.target;
      const item = createEstimateItem({
        sectionId: form.elements.sectionId.value,
        name: form.elements.name.value,
        spec: form.elements.spec.value,
        unit: form.elements.unit.value,
        quantity: form.elements.quantity.value,
        unitPrice: form.elements.unitPrice.value,
        pricingStatus: form.elements.pricingStatus.value,
        includeInTotal: form.elements.includeInTotal.checked,
        note: form.elements.note.value,
        sourceType: "manual",
        editable: true
      });
      replaceItems([...flattenItems(currentDocument), item]);
      currentDocument.hasManualEdits = true;
      persist();
      activeTab = "details";
      render();
      adapter.showToast("已新增手動估價項目");
    });

    openButton.addEventListener("click", open);
    return Object.freeze({
      open,
      close,
      regenerate,
      getDocument: () => currentDocument ? clone(currentDocument) : null,
      markStale() { if (currentDocument) { currentDocument.stale = true; staleBanner.hidden = false; } },
      button: openButton
    });
  }

  global.MODUDRAFTEstimate = Object.freeze({
    DISCLAIMER,
    UNITS,
    PRICING_STATUSES,
    SECTION_DEFINITIONS,
    DEFAULT_RATES,
    RATE_LABELS,
    COUNTERTOP_OPTIONS,
    safeNumber,
    roundMoney,
    createEstimateItem,
    createEstimateDocument,
    recalculateEstimate,
    generateKitchenItems,
    generateSystemItems,
    generateEstimate,
    projectSignature,
    estimateToText,
    estimateToCsv,
    estimateWorkbookData,
    mount
  });
})(window);
