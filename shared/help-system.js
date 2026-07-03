(function (global) {
  "use strict";

  const MODE_LABELS = { home: "專案首頁", kitchen: "廚具配置", cabinet: "系統櫃配置" };
  const COMMON_CHAPTERS = {
    start: {
      nav: "快速開始", index: "01", title: "先完成一條可交付的設計流程", kicker: "GETTING STARTED",
      summary: "不必先學會所有功能。依序建立牆面、配置櫃體、檢查視圖、套用材質，最後再匯出或交給 AI 渲染。",
      steps: [
        ["建立專案", "從首頁選擇廚具或系統櫃；專案會自動保存於目前裝置。"],
        ["輸入空間", "先輸入牆寬與天花高，所有尺寸統一使用 mm。"],
        ["完成配置", "使用自動配置或新增櫃體，再逐一修改用途、寬度與門片。"],
        ["檢查交付", "切換平面、立面、3D，進入專案中心做設計檢查、備份與分享。"]
      ], tip: "看到不熟悉的按鈕時，直接長按約 0.65 秒，即可查看該按鈕的用途與操作方式。"
    },
    views: {
      nav: "2D 與 3D", index: "02", title: "同一份資料，從不同視圖交叉檢查", kicker: "DRAWING & 3D",
      summary: "平面圖確認牆面與深度；立面圖確認寬高與門片；3D 用來檢查空間比例與客戶觀看角度。",
      steps: [
        ["平面圖", "檢查櫃體是否超出牆面、深度是否合理，以及多面牆的轉向。"],
        ["立面圖", "核對每座櫃體寬度、高度、補板、門片與設備位置。"],
        ["移動畫布", "滑鼠滾輪或雙指縮放；按下滾輪或雙指拖移可平移圖面。"],
        ["3D 視角", "拖曳旋轉、滾輪縮放、按下滾輪平移；使用符合畫面可回到安全視角。"]
      ], tip: "正式出圖前，至少各看一次平面、立面與 3D，能提早發現多數尺寸或排列問題。"
    },
    project: {
      nav: "專案與材質", index: "03", title: "保存版本、快速換風格並執行設計檢查", kicker: "PROJECT CORE",
      summary: "專案中心不只是存檔：它會保存可編輯資料、套用整案材質、檢查尺寸異常並產生 AI 渲染提示詞。",
      steps: [
        ["儲存與最近專案", "命名後按儲存；首頁會顯示最近專案，可在同一裝置繼續編輯。"],
        ["JSON 備份", "重要案件匯出 JSON；更換裝置或清除瀏覽器前務必備份。"],
        ["快速材質", "選擇現代白灰、奶油、木質北歐等風格，3D 會同步更新。"],
        ["設計檢查", "確認超牆、櫃體過寬、推拉門深度與分格高度等警告。"]
      ], tip: "本機儲存適合測量與提案階段；正式施工案件建議同時保留 JSON 與輸出圖。"
    },
    output: {
      nav: "匯出與分享", index: "04", title: "依用途選擇工程圖、客戶圖或 AI 渲染", kicker: "DELIVERY",
      summary: "出圖前先固定目前視角。工程溝通保留尺寸；客戶展示可降低標註；AI 渲染需先截取目前構圖。",
      steps: [
        ["圖面匯出", "選擇平面、立面、3D 或合併圖，手機與電腦都可輸出高解析 JPG。"],
        ["普通材質渲染", "選擇內建材質風格，依目前 3D 視角直接產生 1920 × 1440 提案圖，不需要 AI。"],
        ["AI 進階渲染", "可選白模或普通材質圖，先截圖，再複製提示詞並開啟 ChatGPT 或 Gemini。"],
        ["分享連結", "公開網站可複製連結或 QR Code；客戶連結以唯讀方式開啟。"],
        ["施工備份", "同時匯出 JSON，避免只留下圖片而無法繼續修改。"]
      ], tip: "AI 渲染提示詞已要求保留原櫃體尺寸與位置，但交付前仍要人工核對。"
    },
    longpress: {
      nav: "長按說明", index: "?", title: "每個控制項都有就地說明", kicker: "CONTEXT HELP",
      summary: "手機用手指長按；電腦用滑鼠長按或按右鍵。看到環形進度完成後，就會顯示目前控制項的專屬說明。",
      steps: [
        ["長按按鈕", "按住約 0.65 秒，不要移動手指；放開後不會誤觸原本功能。"],
        ["長按欄位", "數字欄位會說明單位、建議範圍及它會影響的圖面。"],
        ["右鍵替代", "電腦也可以在按鈕或欄位按右鍵，直接查看說明。"],
        ["重新查看完整教學", "任何時候按上方的問號按鈕，都可回到完整教學中心。"]
      ], tip: "新增功能即使尚未建立專屬文字，也會自動顯示依按鈕名稱產生的通用說明。"
    }
  };

  const MODE_CHAPTERS = {
    kitchen: {
      mode: {
        nav: "廚具配置", index: "K", title: "廚具：先牆面，再上下櫃與設備", kicker: "KITCHEN WORKFLOW",
        summary: "自動配置先建立可用草稿，再針對水槽、爐台、抽屜、排油煙機與烘碗機逐一修正。",
        steps: [
          ["選牆與方向", "切換目前牆面，設定靠左或靠右；自動配置會依該方向生成。"],
          ["設定牆寬／天花高", "按套用後所有牆共用天花高度，櫃體總寬不應超過牆面。"],
          ["自動配置後微調", "點選圖面上的櫃體，修改用途、寬度、門片、把手與側封。"],
          ["檢查設備與出圖", "確認水槽／爐台位置、吊櫃 700 mm、補板、連續檯面與踢腳板。"]
        ], tip: "平面與立面共用縮放比例；調整其中一張後，另一張會保持相同比例。"
      }
    },
    cabinet: {
      mode: {
        nav: "系統櫃配置", index: "C", title: "系統櫃：整面牆與單櫃內部分開處理", kicker: "CABINET WORKFLOW",
        summary: "立面圖只排整面牆；立面配置只修改目前選取櫃體的層板、分格、門片與配件。",
        steps: [
          ["牆面配置", "先輸入牆寬與天花高，再新增櫃體或獨立補板，設定靠左、置中或靠右。"],
          ["選取單櫃", "在左側牆面物件或圖面點選櫃體；右側會自動顯示它的尺寸。"],
          ["進入立面配置", "調整自動等分或手動分格，指定任一格自動補足，再加入吊衣桿或抽屜。"],
          ["門片與 3D", "生成對開門、分段門或推拉門；用眼睛切換有門／無門確認內部。"]
        ], tip: "補板是牆面上的獨立物件，不會加入櫃體層板或門片計算。"
      }
    },
    home: {
      mode: {
        nav: "專案首頁", index: "H", title: "從首頁建立、重開或匯入專案", kicker: "PROJECT HOME",
        summary: "首頁是專案入口，不只是模式選單。最近專案會保留在目前瀏覽器，也可匯入 JSON 繼續編輯。",
        steps: [
          ["選擇模式", "廚具適合上下櫃與設備；系統櫃適合衣櫃、鞋櫃、書櫃與收納。"],
          ["最近專案", "點選最近專案會帶回對應工作台並恢復可編輯資料。"],
          ["匯入 JSON", "從其他裝置帶回備份時，首頁會判斷類型並開啟正確模式。"],
          ["裝置提醒", "未來雲端功能上線前，瀏覽器資料不等於永久備份。"]
        ], tip: "第一次使用可先建立一個測試專案，熟悉流程後再開始正式案件。"
      }
    }
  };

  const HELP_RULES = [
    [/新增牆面|addWall/i, ["新增牆面", "在目前專案加入另一面可獨立設定寬度的牆。", "新增後先輸入牆寬，再決定靠左或靠右配置。", "天花高度會與其他牆共用；刪除牆面會一併刪除其櫃體。"]],
    [/刪除牆面|deleteWall/i, ["刪除牆面", "移除目前選取的整面牆與牆上所有物件。", "先確認牆面選單顯示正確，再按刪除並確認。", "專案至少保留一面牆，重要資料先匯出 JSON。"]],
    [/新增櫃體|addCabinet/i, ["新增櫃體", "在目前牆面新增一座可編輯櫃體。", "新增後點選櫃體，於右側或彈出面板設定用途與尺寸。", "新增前先確認目前牆面與櫃體層。"]],
    [/自動配置|重新生成|regenerate/i, ["自動／重新配置", "依牆寬、排列方向與常用尺寸產生一版合理草稿。", "先輸入牆面尺寸，再執行；生成後逐櫃檢查與微調。", "重新生成可能取代目前牆面的排列，正式案件先備份。"]],
    [/補板|filler/i, ["獨立補板", "補足櫃體與不垂直牆面的施工縫，並讓門片正常開啟。", "插入後可獨立調整寬、高、深與排列位置。", "補板不是櫃體的一部分，不參與內部分格與門片計算。"]],
    [/靠左|align.*left/i, ["靠左排列", "讓整排物件從牆面左端往右生成，餘量留在右側。", "適合左側作為固定施工基準的牆面。", "靠牆處通常仍需依現場角度保留補板。"]],
    [/靠右|align.*right/i, ["靠右排列", "讓整排物件從牆面右端往左生成，餘量留在左側。", "適合右側作為固定施工基準的牆面。", "水槽龍頭方向與設備位置仍需另行確認。"]],
    [/置中|align.*center/i, ["置中排列", "把整排系統櫃置於牆面中央，左右保留相同餘量。", "展示櫃或非靠牆收納可使用。", "施工靠牆案件通常以靠左或靠右更容易定位。"]],
    [/平面/i, ["平面圖", "由上往下檢查牆面、深度、轉角與櫃體占用範圍。", "點選櫃體可編輯；滾輪／雙指縮放，拖移可平移。", "平面圖不負責顯示完整門片與內部分格。"]],
    [/立面配置|configuration/i, ["立面配置", "只編輯目前選取櫃體的內部結構。", "在此調整層板、分格高度、吊衣桿與抽屜。", "整排櫃體順序、補板與靠左靠右請回立面圖處理。"]],
    [/立面/i, ["立面圖", "從正面檢查整面牆的櫃體數量、寬高、門片與設備。", "點選櫃體後，使用右側屬性面板修改。", "尺寸標註可作設計檢查，施工前仍需現場複量。"]],
    [/3D/i, ["3D 預覽", "以空間視角檢查比例、材質、牆面與櫃體外觀。", "拖曳旋轉、滾輪縮放、滾輪按住平移；雙擊或符合畫面可重置。", "3D 是配置草圖，精細渲染請先截圖再交給 AI。"]],
    [/顯示門片|showDoors/i, ["顯示／隱藏門片", "切換外觀門片與內部結構視圖，不會刪除門片資料。", "關閉時檢查層板、抽屜與吊衣桿；開啟時檢查完成外觀。", "推拉門、對開門、內門與外門都會受此開關控制。"]],
    [/層板/i, ["層板與分格", "設定單櫃內每一格的高度與層板形式。", "自動等分適合快速配置；手動模式可指定任一格自動補足。", "尺寸從一片板上緣量到下一片板上緣，總和須等於可配置內高。"]],
    [/門片/i, ["門片配置", "生成整片長門、分段門、對開門或推拉門。", "先設定門型、內外門與最大門寬，再按生成門片。", "單扇門片過寬容易下垂；推拉衣櫃建議成品深 650 mm。"]],
    [/配件|吊衣桿|抽屜/i, ["配件配置", "在指定分格加入吊衣桿或抽屜外觀。", "先於立面配置點選分格，再選擇功能並套用。", "吊衣桿預設位於上層板下方 50 mm，過矮分格不適合使用。"]],
    [/衣櫃|鞋櫃|書櫃|儲藏櫃/i, ["用途預設", "將常用深度、層板間距與用途套用到目前選取櫃體。", "先選取一座櫃體，再按用途卡片；套用後仍可逐項修改。", "預設值是草稿起點，需依現場與實際收納物確認。"]],
    [/專案中心/i, ["專案中心", "管理專案名稱、JSON 備份、材質風格、設計檢查與 AI 提示詞。", "建議完成每個主要階段後儲存一次，重要案件再匯出 JSON。", "本機瀏覽器資料可能因清除網站資料而消失。"]],
    [/普通.*渲染|materialRender|normalRender/i, ["普通材質渲染", "套用內建材質並依目前 3D 視角直接產圖，不需要連接 AI。", "先選材質風格、套用並旋轉到需要的視角，再匯出普通渲染。", "普通渲染只改變顯示材質，不會修改櫃體尺寸與位置。"]],
    [/AI.*渲染|advancedAi|renderView/i, ["AI 進階渲染", "截取白模或普通材質圖，搭配自動提示詞交給 ChatGPT 或 Gemini。", "先選圖像來源並調好 3D 視角，再截圖、複製提示詞並上傳 AI。", "AI 圖必須回頭核對尺寸，不能直接作施工依據。"]],
    [/匯出/i, ["匯出", "輸出目前選取的平面、立面、3D 或合併圖。", "依用途選擇視圖與解析度；客戶圖建議 1920 以上。", "匯出前先確認比例、視角與尺寸標註是否完整。"]],
    [/分享/i, ["分享", "複製公開網址、顯示 QR Code，或建立客戶唯讀連結。", "手機可掃描 QR Code 開啟；客戶版不能修改設計資料。", "大型專案建議以 JSON 檔備份，不要只依靠網址。"]],
    [/複製/i, ["複製物件", "在目前牆面複製選取的櫃體與設定。", "複製後調整寬度、用途或內部分格，再檢查牆面餘量。", "複製可能讓總寬超出牆面，請查看設計檢查。"]],
    [/刪除/i, ["刪除物件", "移除目前選取的櫃體、補板或其他物件。", "刪除前確認目前選取名稱，必要時先複製或備份。", "刪除後無完整復原歷史，請謹慎使用。"]],
    [/向左|move.*left/i, ["向左移動", "把目前物件在牆面排列中往左移一個位置。", "用於調整櫃體與補板的先後順序。", "靠右排列時，視覺方向與資料陣列方向會由系統自動換算。"]],
    [/向右|move.*right/i, ["向右移動", "把目前物件在牆面排列中往右移一個位置。", "用於調整櫃體與補板的先後順序。", "移動後請重新檢查設備相對位置與牆面餘量。"]],
    [/縮小/i, ["縮小視圖", "縮小目前畫布內容，不會修改真實尺寸。", "用於查看整面牆或更多周邊空間。", "出圖比例與實際尺寸資料不會因畫面縮放改變。"]],
    [/放大/i, ["放大視圖", "放大目前畫布內容，方便點選與檢查細節。", "手機可搭配雙指縮放；桌面也可用滾輪。", "過度放大後可按符合畫面快速復位。"]],
    [/符合畫面|重設視圖/i, ["符合畫面", "自動把目前圖面或 3D 模型置中並調整到安全大小。", "視角迷失、模型跑出畫面或出圖前都可使用。", "只改變相機，不會改動櫃體尺寸與位置。"]],
    [/清空牆面/i, ["清空牆面", "移除目前牆面的全部櫃體，但保留牆面本身。", "適合重新開始配置；執行前先確認牆面與備份。", "此操作影響整面牆，不等同刪除單一櫃體。"]],
    [/套用/i, ["套用設定", "把目前欄位中的尺寸或選項寫入設計資料並更新圖面。", "輸入完成後按套用，再到其他視圖交叉檢查。", "無效、空白或超出範圍的數值會被限制為安全值。"]]
  ];

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function controlName(control) {
    if (!control) return "這個控制項";
    const label = control.labels && control.labels[0] ? control.labels[0].innerText : "";
    return (control.getAttribute("aria-label") || control.title || label || control.innerText || control.name || control.id || "這個控制項").trim().replace(/\s+/g, " ").slice(0, 80);
  }

  function helpFor(control) {
    const identity = [control?.id, control?.dataset?.view, control?.dataset?.panel, control?.dataset?.preset, controlName(control)].filter(Boolean).join(" ");
    for (const [pattern, content] of HELP_RULES) if (pattern.test(identity)) return { title: content[0], summary: content[1], steps: content[2], caution: content[3] };
    const name = controlName(control);
    const isField = control && /^(INPUT|SELECT|TEXTAREA)$/.test(control.tagName);
    return {
      title: name,
      summary: isField ? `設定「${name}」的值，變更後會更新目前選取物件與相關圖面。` : `執行「${name}」功能。`,
      steps: isField ? "輸入或選擇內容後，離開欄位或按套用；再到平面、立面或 3D 確認結果。" : "先確認目前牆面、櫃體或視圖是否正確，再點按執行。",
      caution: "若不確定影響範圍，先儲存專案或匯出 JSON 備份。"
    };
  }

  function mount(options) {
    const config = Object.assign({ mode: "home", assetBase: "./", buttonTarget: null, autoOpen: true }, options || {});
    const modeChapter = MODE_CHAPTERS[config.mode]?.mode || MODE_CHAPTERS.home.mode;
    const chapters = { start: COMMON_CHAPTERS.start, mode: modeChapter, views: COMMON_CHAPTERS.views, project: COMMON_CHAPTERS.project, output: COMMON_CHAPTERS.output, longpress: COMMON_CHAPTERS.longpress };
    let activeKey = "start";
    let longTarget = null;
    let longTimer = 0;
    let longStart = null;
    let suppressTarget = null;
    let suppressUntil = 0;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "md-help-button";
    button.textContent = "?";
    button.title = "使用教學（也可長按任何按鈕）";
    button.setAttribute("aria-label", "開啟使用教學");
    button.dataset.helpUi = "true";

    const backdrop = document.createElement("div");
    backdrop.className = "md-help-backdrop";
    backdrop.dataset.helpUi = "true";
    backdrop.innerHTML = `<section class="md-help-dialog" role="dialog" aria-modal="true" aria-label="MODUDRAFT 使用教學"><aside class="md-help-nav"><div class="md-help-brand"><small>MODUDRAFT GUIDE</small><b>${escapeHtml(MODE_LABELS[config.mode] || "使用教學")}</b></div><nav class="md-help-nav-list">${Object.entries(chapters).map(([key,chapter]) => `<button type="button" data-help-chapter="${key}" data-help-ui="true"><span>${escapeHtml(chapter.index)}</span>${escapeHtml(chapter.nav)}</button>`).join("")}</nav><p class="md-help-nav-hint">長按任一按鈕約 0.65 秒，可查看該功能的就地說明。</p></aside><main class="md-help-main"><header class="md-help-head"><div><small>繁體中文操作指南</small><h2>MODUDRAFT 使用教學</h2></div><button type="button" class="md-help-close" data-help-ui="true" aria-label="關閉教學">×</button></header><div class="md-help-content"></div></main></section>`;
    const hold = document.createElement("div");
    hold.className = "md-help-hold";
    hold.dataset.helpUi = "true";
    const toast = document.createElement("div");
    toast.className = "md-help-toast";
    toast.textContent = "提示：長按任何按鈕可查看說明";
    toast.dataset.helpUi = "true";

    const target = config.buttonTarget ? document.querySelector(config.buttonTarget) : null;
    if (target) target.appendChild(button); else { button.classList.add("floating"); document.body.appendChild(button); }
    document.body.append(backdrop, hold, toast);
    const content = backdrop.querySelector(".md-help-content");
    const navButtons = Array.from(backdrop.querySelectorAll("[data-help-chapter]"));

    function chapterImage() {
      return config.mode === "cabinet" ? `${config.assetBase}assets/system-workbench.png` : `${config.assetBase}assets/kitchen-workbench.png`;
    }

    function renderChapter(key) {
      const chapter = chapters[key] || chapters.start;
      activeKey = key;
      navButtons.forEach((item) => item.classList.toggle("active", item.dataset.helpChapter === key));
      content.innerHTML = `<article class="md-help-hero"><div class="md-help-hero-copy"><em>${escapeHtml(chapter.kicker)}</em><h3>${escapeHtml(chapter.title)}</h3><p>${escapeHtml(chapter.summary)}</p></div><img src="${chapterImage()}" alt="${escapeHtml(MODE_LABELS[config.mode])}操作畫面"></article><div class="md-help-steps">${chapter.steps.map((step,index) => `<section class="md-help-step"><span>${index + 1}</span><div><b>${escapeHtml(step[0])}</b><p>${escapeHtml(step[1])}</p></div></section>`).join("")}</div><p class="md-help-tip">${escapeHtml(chapter.tip)}</p>`;
      content.scrollTop = 0;
    }

    function renderContext(control) {
      const help = helpFor(control);
      navButtons.forEach((item) => item.classList.remove("active"));
      content.innerHTML = `<article class="md-context-card"><div class="md-context-icon">?</div><span class="eyebrow">就地操作說明</span><h3>${escapeHtml(help.title)}</h3><p>${escapeHtml(help.summary)}</p><div class="md-context-grid"><section><h4>怎麼使用</h4><p>${escapeHtml(help.steps)}</p></section><section><h4>注意事項</h4><p>${escapeHtml(help.caution)}</p></section></div><p class="md-help-tip">按左側「長按說明」可查看完整的就地說明方式。</p></article>`;
      content.scrollTop = 0;
    }

    function open(key) {
      if (key) renderChapter(key); else renderChapter(activeKey);
      backdrop.classList.add("open");
      document.documentElement.style.overflow = "hidden";
    }

    function openContext(control) {
      renderContext(control);
      backdrop.classList.add("open");
      document.documentElement.style.overflow = "hidden";
    }

    function close() {
      backdrop.classList.remove("open");
      document.documentElement.style.overflow = "";
    }

    function eligible(event) {
      const control = event.target.closest("button,a,input,select,textarea,[role='button']");
      return control && !control.closest("[data-help-ui='true']") && !control.disabled ? control : null;
    }

    function cancelHold() {
      clearTimeout(longTimer);
      longTimer = 0;
      hold.classList.remove("active");
      longTarget = null;
      longStart = null;
    }

    document.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || backdrop.classList.contains("open")) return;
      const control = eligible(event);
      if (!control) return;
      longTarget = control;
      longStart = { x: event.clientX, y: event.clientY };
      hold.style.left = `${event.clientX}px`;
      hold.style.top = `${event.clientY}px`;
      hold.classList.add("active");
      longTimer = window.setTimeout(() => {
        suppressTarget = control;
        suppressUntil = Date.now() + 750;
        if (navigator.vibrate) navigator.vibrate(20);
        hold.classList.remove("active");
        openContext(control);
      }, 650);
    }, true);

    document.addEventListener("pointermove", (event) => {
      if (!longStart) return;
      if (Math.hypot(event.clientX - longStart.x, event.clientY - longStart.y) > 12) cancelHold();
    }, true);
    document.addEventListener("pointerup", cancelHold, true);
    document.addEventListener("pointercancel", cancelHold, true);
    document.addEventListener("click", (event) => {
      if (Date.now() < suppressUntil && suppressTarget && (event.target === suppressTarget || suppressTarget.contains(event.target))) {
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressTarget = null;
      }
    }, true);
    document.addEventListener("contextmenu", (event) => {
      const control = eligible(event);
      if (!control) return;
      event.preventDefault();
      openContext(control);
    });

    button.onclick = () => open("start");
    backdrop.querySelector(".md-help-close").onclick = close;
    backdrop.onclick = (event) => { if (event.target === backdrop) close(); };
    navButtons.forEach((item) => { item.onclick = () => renderChapter(item.dataset.helpChapter); });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && backdrop.classList.contains("open")) close();
      if (event.key === "F1") { event.preventDefault(); open("start"); }
    });

    if (config.autoOpen !== false) {
      let seen = false;
      try { seen = localStorage.getItem(`modudraft:guide-seen:${config.mode}:v2`) === "1"; } catch (error) {}
      if (!seen) {
        window.setTimeout(() => {
          open("start");
          try { localStorage.setItem(`modudraft:guide-seen:${config.mode}:v2`, "1"); } catch (error) {}
        }, 450);
      } else {
        window.setTimeout(() => { toast.classList.add("show"); window.setTimeout(() => toast.classList.remove("show"), 3200); }, 700);
      }
    }

    return { open, close, openContext };
  }

  global.MODUDRAFTHelp = Object.freeze({ mount, helpFor });
})(window);
