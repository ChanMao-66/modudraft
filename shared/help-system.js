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
      ], tip: "看到不熟悉的按鈕時，手機請點右上角「？」開啟教學模式；桌面可按右鍵查看說明。"
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
      nav: "逐點說明", index: "?", title: "每個控制項都有就地說明", kicker: "CONTEXT HELP",
      summary: "手機先點右上角問號開啟教學模式，再點想了解的功能；電腦也可按右鍵直接查看說明。",
      steps: [
        ["手機逐點教學", "點右上角問號後，再點按鈕或欄位查看專屬說明。"],
        ["查看欄位", "數字欄位會說明單位、建議範圍及它會影響的圖面。"],
        ["右鍵替代", "電腦也可以在按鈕或欄位按右鍵，直接查看說明。"],
        ["重新查看完整教學", "任何時候按上方的問號按鈕，都可回到完整教學中心。"]
      ], tip: "觸控裝置不使用長按教學，避免與雙指縮放、拖曳及瀏覽器手勢衝突。"
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

  const HELP_REGISTRY = {};

  function defineHelp(id, title, category, shortDescription, whenToUse, howToUse, tips, example, related = []) {
    HELP_REGISTRY[id] = {
      helpId: id,
      title,
      category,
      shortDescription,
      whenToUse,
      howToUse: Array.isArray(howToUse) ? howToUse : [howToUse],
      tips: Array.isArray(tips) ? tips : [tips],
      example,
      related
    };
  }

  defineHelp("new-project", "新建專案", "首頁與專案", "建立一份新的廚具或系統櫃設計資料。", "開始新的客戶案件或測試配置時使用。", ["選擇廚具或系統櫃模式。", "輸入專案名稱與牆面尺寸。", "完成配置後到專案中心儲存。"], ["正式案件開始前先確認工作模式。"], "新客戶要規劃一字型廚具時，先建立廚具專案。", ["recent-projects", "import-project"]);
  defineHelp("import-project", "匯入專案", "首頁與專案", "載入先前匯出的 JSON 專案檔。", "換裝置或從備份繼續修改時使用。", ["選擇匯入專案。", "挑選 MODUDRAFT JSON 檔。", "確認模式與內容後繼續編輯。"], ["匯入不會自動覆蓋其他專案。"], "把現場平板的 JSON 帶回辦公室電腦繼續設計。", ["new-project", "project-center"]);
  defineHelp("recent-projects", "最近專案", "首頁與專案", "顯示目前瀏覽器最近儲存的設計。", "回到同一裝置繼續案件時使用。", ["找到專案名稱。", "確認更新日期與模式。", "點擊卡片重新開啟。"], ["瀏覽器資料不是永久備份，重要案件仍要匯出 JSON。"], "昨天未完成的廚具案可從最近專案繼續。", ["project-center", "import-project"]);
  defineHelp("kitchen-mode", "廚具配置", "首頁與專案", "建立下櫃、吊櫃、設備、檯面與補板配置。", "規劃廚房與系統廚具時使用。", ["建立牆面。", "選擇下櫃或吊櫃。", "配置水槽、爐台與收納櫃。", "用平面、立面與 3D 檢查。"], ["所有尺寸使用 mm。"], "一面 2500 mm 牆可先自動配置，再調整水槽與爐台。", ["wall-width", "auto-layout"]);
  defineHelp("cabinet-mode", "系統櫃配置", "首頁與專案", "配置衣櫃、鞋櫃、書櫃與收納櫃。", "需要編輯層板、分格、門片與吊衣桿時使用。", ["先建立牆面。", "在立面圖安排櫃體。", "進入立面配置修改單櫃內部。"], ["整面牆配置與單櫃內部是兩個不同階段。"], "先排三座衣櫃，再逐座設定吊衣區。", ["view-elevation", "cabinet-editor"]);
  defineHelp("project-center", "專案中心", "首頁與專案", "管理專案名稱、備份、材質、檢查與 AI 提示詞。", "每完成一個主要階段或交付前使用。", ["開啟專案中心。", "輸入專案名稱並儲存。", "需要時匯出 JSON 備份。"], ["清除瀏覽器資料前一定要備份。"], "丈量完成後先儲存一版，再開始改材質。", ["export", "share"]);

  defineHelp("add-wall", "新增牆面", "牆面", "在目前專案加入另一面可獨立設定寬度的牆。", "L 型、多面牆或不同牆段需要分開配置時使用。", ["點新增牆面。", "切換到新牆。", "輸入牆寬。", "選擇靠左或靠右排列。"], ["天花高度會與其他牆共用。"], "L 型廚房可建立 A 牆與 B 牆分別配置。", ["select-wall", "wall-width"]);
  defineHelp("select-wall", "選擇牆面", "牆面", "切換目前正在編輯的牆面。", "多面牆案件要修改指定牆段時使用。", ["打開牆面選單。", "選擇牆號與寬度。", "確認畫布與尺寸狀態已切換。"], ["新增櫃體前要先確認目前牆面。"], "要修改轉角另一側時，先從牆 1 切到牆 2。", ["add-wall", "delete-wall"]);
  defineHelp("delete-wall", "刪除牆面", "牆面", "刪除目前牆面及牆上的全部櫃體。", "建立錯誤牆段或確定不再需要時使用。", ["先確認目前牆號。", "按刪除牆面。", "閱讀警告並確認。"], ["專案至少保留一面牆；刪除前建議備份。"], "誤建第三面牆時可整面刪除。", ["select-wall", "project-center"]);
  defineHelp("wall-width", "牆寬", "牆面", "目前牆面的總寬度，單位為 mm。", "完成現場丈量後，配置櫃體之前先設定。", ["點牆寬欄位或圖面總尺寸。", "輸入現場丈量尺寸。", "按套用。", "確認剩餘空間是否合理。"], ["修改牆寬不會自動壓縮櫃體。", "櫃體超出時系統會顯示警告。"], "牆面丈量 2500 mm，就輸入 2500。", ["dimension-edit", "ai-layout"]);
  defineHelp("wall-height", "天花高度", "牆面", "全案共用的天花板高度。", "需要計算吊櫃上方補板與 3D 牆高時使用。", ["輸入天花高度。", "按套用。", "檢查吊櫃與頂部補板。"], ["所有牆面會共用這個高度。"], "天花高 2600 mm、吊櫃固定 700 mm，剩餘區可形成頂部補板。", ["top-filler", "view-elevation"]);
  defineHelp("apply-wall-size", "套用牆面尺寸", "牆面", "把牆寬與天花高度寫入目前設計。", "完成尺寸輸入後使用。", ["確認數字與單位。", "按套用。", "到平面與立面核對。"], ["空值與無效尺寸不會套用。"], "輸入 2500 與 2600 後按套用。", ["wall-width", "wall-height"]);
  defineHelp("align-left", "靠左生成", "牆面", "讓整排櫃體從牆面左端往右排列。", "左側是主要施工基準時使用。", ["選擇目前牆面。", "點靠左。", "確認剩餘空間顯示在右側。"], ["牆邊仍可能需要補板。"], "靠左後多出的 200 mm 會留在右側。", ["align-right", "gap-space"]);
  defineHelp("align-right", "靠右生成", "牆面", "讓整排櫃體從牆面右端往左排列。", "右側是主要施工基準時使用。", ["選擇目前牆面。", "點靠右。", "確認剩餘空間顯示在左側。"], ["排列方向會影響新增櫃體所在端。"], "靠右後多出的 200 mm 會留在左側。", ["align-left", "gap-space"]);
  defineHelp("wall-tools", "牆面工具", "牆面", "集中管理牆面選擇、尺寸、排列與新增刪除。", "手機版要處理牆面時使用。", ["點底部牆面。", "在 Bottom Sheet 修改。", "按套用後回畫布檢查。"], ["面板展開時畫布仍會保留可見區。"], "現場量完牆後直接從手機牆面工具輸入。", ["wall-width", "add-wall"]);

  defineHelp("view-floor", "平面圖", "視圖", "由上往下檢查牆面、深度與櫃體占用範圍。", "確認配置是否超牆、深度是否合理時使用。", ["切換平面圖。", "雙指縮放或平移。", "點櫃體編輯，點尺寸直接修改。"], ["平面圖不顯示完整門片分割。"], "檢查下櫃深度與牆面轉角。", ["view-elevation", "dimension-edit"]);
  defineHelp("view-elevation", "立面圖", "視圖", "從正面檢查櫃體寬高、門片、設備與尺寸。", "微調櫃寬、檢查吊櫃與設備對齊時使用。", ["切換立面圖。", "點選櫃體或尺寸。", "修改後檢查整排總寬。"], ["尺寸標註供設計檢查，施工前仍需複量。"], "檢查水槽櫃上方是否對到烘碗機。", ["view-floor", "view-3d"]);
  defineHelp("view-3d", "3D 視圖", "視圖", "以空間視角檢查比例、材質與完成外觀。", "完成基本配置後或準備渲染時使用。", ["切換 3D。", "單指拖曳旋轉。", "雙指縮放與移動。", "調到需要角度後截圖。"], ["3D 是配置草圖，施工尺寸仍以圖面資料為準。"], "從斜前方確認水槽、爐台與吊櫃比例。", ["normal-render", "ai-render"]);
  defineHelp("view-switch", "視圖切換", "視圖", "在平面、立面與 3D 之間切換。", "要用不同角度檢查同一份設計時使用。", ["點底部視圖。", "選擇平面、立面或 3D。", "手機一次只顯示一個主要視圖。"], ["切換視圖不會改變尺寸資料。"], "先平面確認位置，再立面確認門片。", ["view-floor", "view-elevation", "view-3d"]);
  defineHelp("reset-view", "重設視圖", "視圖", "把圖面或 3D 恢復到安全位置與大小。", "放大太多、移出畫面或找不到模型時使用。", ["點重設視圖。", "等待畫面重新置中。"], ["只改視角，不會改設計尺寸。"], "模型被拖到畫面外時，一鍵恢復。", ["mobile-pan", "mobile-zoom"]);
  defineHelp("mobile-zoom", "手機雙指縮放", "視圖", "使用兩根手指放大或縮小圖面。", "需要看細節或整面牆時使用。", ["兩指同時放在畫布。", "分開放大、靠攏縮小。", "放開後再點選物件。"], ["雙指操作不會選到櫃體。"], "放大尺寸文字後直接點擊修改。", ["mobile-pan", "dimension-edit"]);
  defineHelp("mobile-pan", "手機移動畫布", "視圖", "以單指拖移平面或立面圖。", "放大後要查看其他區域時使用。", ["手指按在畫布空白處。", "移動超過 6px。", "拖到需要的位置後放開。"], ["短點擊會選取；超過 6px 才視為拖曳。"], "放大左側櫃體後拖到右側檢查。", ["mobile-zoom", "reset-view"]);
  defineHelp("scroll-rail", "右側捲動軌", "視圖", "在舊版手機長頁面快速上下移動。", "頁面內容超過一個螢幕時使用。", ["拖曳滑塊或按上下箭頭。"], ["新版手機工作台以單畫布與 Bottom Sheet 為主，通常不需使用。"], "快速移到立面圖區。", ["view-switch"]);
  defineHelp("wall-visibility", "3D 牆面顯示", "視圖", "開啟或隱藏 3D 空間牆面。", "需要看完整空間或只看櫃體時使用。", ["開啟視圖工具。", "切換牆面。", "回到 3D 確認。"], ["隱藏牆面不會刪除牆面資料。"], "出白模時可暫時關牆。", ["view-3d", "normal-render"]);
  defineHelp("top-filler", "頂部補板", "視圖", "顯示吊櫃上方補到天花板的板件。", "天花較高且需要封頂時使用。", ["切換頂部補板。", "查看立面與 3D。"], ["吊櫃本體高度仍維持 700 mm。"], "吊櫃上方剩 300 mm 時以整片板封到天花。", ["wall-height", "view-elevation"]);

  defineHelp("add-cabinet", "新增櫃體", "櫃體", "在目前牆面新增一個下櫃或吊櫃。", "需要增加水槽櫃、爐台櫃、收納櫃或補板時使用。", ["先確認牆面與櫃體層。", "點新增櫃體。", "輸入寬度與用途。", "按新增或儲存。"], ["剩餘空間太小時可使用 AI 輔助構圖。"], "剩餘 600 mm 時新增一座抽屜櫃。", ["ai-layout", "cabinet-editor"]);
  defineHelp("cabinet-editor", "編輯櫃體", "櫃體", "修改目前櫃體的名稱、尺寸、用途、門片與把手。", "點選平面或立面中的櫃體後使用。", ["點櫃體。", "手機切換基本、尺寸、用途、門片、把手或進階分頁。", "完成後按儲存。"], ["修改前先確認目前是下櫃或吊櫃。"], "把一般櫃改為 700 mm 水槽櫃。", ["cabinet-width", "cabinet-purpose"]);
  defineHelp("cabinet-name", "櫃體名稱", "櫃體", "用容易辨識的名稱標記櫃體。", "同一面牆有多座相似櫃體時使用。", ["輸入名稱。", "按儲存。"], ["名稱不影響尺寸，但會顯示在圖面與清單。"], "將櫃體命名為「水槽下櫃」。", ["cabinet-editor"]);
  defineHelp("cabinet-width", "櫃體寬度", "櫃體", "單一櫃體的左右寬度，單位 mm。", "要調整模組大小或吸收剩餘空間時使用。", ["點櫃體或尺寸數字。", "輸入新寬度。", "按套用或儲存。"], ["下櫃超過 1200 mm、吊櫃超過 900 mm 建議拆分。"], "把 600 mm 抽屜櫃改成 700 mm。", ["dimension-edit", "equalize"]);
  defineHelp("cabinet-layer", "下櫃／吊櫃", "櫃體", "決定目前新增與 AI 建議要套用在哪一層。", "新增櫃體或查看剩餘空間前使用。", ["確認頂部狀態顯示下櫃或吊櫃。", "點擊可快速切換。"], ["下櫃與吊櫃不能在輔助等分中混選。"], "先切到吊櫃，再新增烘碗機櫃。", ["add-cabinet", "equalize"]);
  defineHelp("cabinet-purpose", "櫃體用途", "櫃體", "指定櫃體是收納、水槽、爐台、抽屜或設備櫃。", "要讓立面與 3D 顯示正確設備外觀時使用。", ["開啟用途分頁。", "選擇用途卡片。", "按儲存。"], ["用途會影響預設門片與設備外觀。"], "水槽櫃會顯示水槽與龍頭。", ["purpose-sink", "purpose-stove"]);
  defineHelp("purpose-general", "一般收納櫃", "櫃體用途", "沒有特殊設備的一般門櫃。", "收納鍋具、乾貨或清潔用品時使用。", ["用途選一般收納櫃。", "選擇門片與把手。"], ["可依寬度改成單門或對開門。"], "450 mm 單門備品櫃。", ["door-style-single-door"]);
  defineHelp("purpose-stove", "爐台櫃", "櫃體用途", "上方配置瓦斯爐或爐具的下櫃。", "規劃烹調區時使用。", ["設定下櫃用途為爐台。", "確認上方吊櫃為排油煙機。", "檢查與水槽距離。"], ["不要讓一般吊櫃直接蓋住爐台。"], "800 mm 爐台櫃搭配同寬排油煙機。", ["purpose-hood", "purpose-sink"]);
  defineHelp("purpose-sink", "水槽櫃", "櫃體用途", "容納水槽、龍頭與下方管線的下櫃。", "規劃洗滌區時使用。", ["設定用途為水槽。", "選擇水槽安裝方式。", "確認龍頭遠離爐台。"], ["下方要保留管線維修空間。"], "800 mm 對開門水槽櫃。", ["sink-undermount", "purpose-dish-dryer"]);
  defineHelp("purpose-drawer", "抽屜櫃", "櫃體用途", "以前方抽屜收納餐具與鍋具。", "需要分類收納、方便拉取時使用。", ["選抽屜櫃。", "選雙抽、三抽或兩小一大。", "按儲存。"], ["寬抽屜要確認滑軌承重。"], "600 mm 兩小一大抽屜櫃。", ["door-style-two-small-one-large"]);
  defineHelp("purpose-appliance", "嵌入電器櫃", "櫃體用途", "預留洗碗機或其他嵌入式電器位置。", "已有確定設備尺寸時使用。", ["選嵌入電器櫃。", "輸入設備所需寬度。", "檢查插座與散熱。"], ["設備尺寸應以原廠規格為準。"], "預留 600 mm 洗碗機位置。", ["cabinet-width"]);
  defineHelp("purpose-hood", "排油煙機吊櫃", "櫃體用途", "配置爐台上方的排油煙機與包覆櫃。", "爐台上方需要排煙設備時使用。", ["切到吊櫃。", "用途選排油煙機。", "與爐台對齊。"], ["機器前緣與門片位置需依設備規格檢查。"], "800 mm 爐台上方配置 800 mm 油煙機櫃。", ["purpose-stove"]);
  defineHelp("purpose-dish-dryer", "吊掛式烘碗機", "櫃體用途", "在水槽上方配置吊掛式烘碗機。", "洗滌後需要就近收納餐具時使用。", ["切到吊櫃。", "選吊掛式烘碗機。", "與水槽櫃對齊。"], ["機器高度與門片上移量要依實機確認。"], "水槽櫃上方配置 400 mm 高烘碗機。", ["purpose-sink"]);
  defineHelp("purpose-open", "開放櫃", "櫃體用途", "不生成門片的開放收納格。", "窄空間、展示或常用物品收納時使用。", ["用途選開放櫃。", "確認寬度與層板。"], ["容易積灰，使用位置要符合需求。"], "200 mm 窄開放格放置托盤。", ["ai-layout"]);
  defineHelp("purpose-filler", "補板／補邊", "櫃體用途", "吸收牆邊小尺寸與牆面角度誤差的板件。", "整排櫃體與牆之間有小空間時使用。", ["用途選補板。", "輸入現場需要寬度。", "設定靠牆補邊或見光側封。"], ["補板不是收納櫃，不應硬塞五金。"], "剩餘 40 mm 時以補板收尾。", ["gap-space", "ai-layout"]);
  defineHelp("copy-cabinet", "複製櫃體", "櫃體", "複製目前櫃體的尺寸、用途、門片與把手。", "需要連續建立相同模組時使用。", ["選取櫃體。", "到進階分頁按複製。", "再修改副本。"], ["複製後要檢查是否超出牆寬。"], "複製兩座 450 mm 抽屜櫃。", ["move-left", "move-right"]);
  defineHelp("delete-cabinet", "刪除櫃體", "櫃體", "移除目前選取的單一櫃體。", "櫃體不再需要或要重新配置時使用。", ["選取櫃體。", "到進階分頁按刪除。", "再次確認。"], ["刪除後可用復原返回。"], "移除多餘的收納櫃。", ["undo", "ai-layout"]);
  defineHelp("move-left", "櫃體往左", "櫃體", "把目前櫃體向左交換一個位置。", "調整設備與收納順序時使用。", ["選取櫃體。", "到進階分頁按往左。", "檢查整排位置。"], ["靠右排列時系統會換算正確視覺方向。"], "把水槽櫃移到爐台右側。", ["move-right"]);
  defineHelp("move-right", "櫃體往右", "櫃體", "把目前櫃體向右交換一個位置。", "調整設備與收納順序時使用。", ["選取櫃體。", "到進階分頁按往右。", "檢查整排位置。"], ["移動不改變櫃體寬度。"], "把抽屜櫃移到水槽旁。", ["move-left"]);

  defineHelp("door-style-double-door", "對開門", "門片與五金", "將正面分成左右兩片門。", "寬度較大、單片門不宜過寬時使用。", ["進入門片分頁。", "選對開門。", "按儲存。"], ["兩片門需預留開啟空間。"], "800 mm 水槽櫃使用對開門。", ["door-style-single-door"]);
  defineHelp("door-style-single-door", "單門", "門片與五金", "使用一片門板完成正面。", "窄櫃或 450 mm 左右櫃體使用。", ["進入門片分頁。", "選單門。"], ["門片過寬容易下垂。"], "400 mm 收納櫃使用單門。", ["door-style-double-door"]);
  defineHelp("door-style-two-drawer", "雙抽屜", "門片與五金", "把正面分成上下兩個抽屜。", "需要兩層大型收納時使用。", ["選雙抽屜。", "檢查抽屜比例。"], ["確認抽屜滑軌與內部管線。"], "600 mm 櫃分成上下雙抽。", ["purpose-drawer"]);
  defineHelp("door-style-three-drawer", "三抽屜", "門片與五金", "把正面平均分成三個抽屜。", "餐具與小物分類時使用。", ["選三抽屜。", "按儲存。"], ["最下層若要放鍋具，可改兩小一大。"], "450 mm 窄抽屜櫃。", ["door-style-two-small-one-large"]);
  defineHelp("door-style-two-small-one-large", "兩小一大抽屜", "門片與五金", "上方兩小抽、下方一大抽的常用廚具配置。", "同時收納餐具與大型鍋具時使用。", ["選兩小一大。", "檢查把手與分縫。"], ["下方大抽要確認承重。"], "600 mm 備餐抽屜櫃。", ["purpose-drawer"]);
  defineHelp("door-style-appliance", "電器面板", "門片與五金", "以深色面板表示嵌入電器位置。", "嵌入洗碗機或電器時使用。", ["用途選電器櫃。", "門片選電器面板。"], ["外觀僅為配置示意。"], "600 mm 洗碗機預留。", ["purpose-appliance"]);
  defineHelp("door-style-open", "開放式", "門片與五金", "不生成門片，顯示內部空間。", "開放櫃或展示格使用。", ["門片選開放式。", "檢查內部層板。"], ["開放式會直接看到櫃身材質。"], "窄格放置調味罐。", ["purpose-open"]);
  defineHelp("door-style-panel", "素面補板", "門片與五金", "以單片素面板表示補板或側封。", "補邊、封板與見光側板使用。", ["用途選補板。", "門片選素面補板。"], ["補板不應出現把手。"], "牆邊 50 mm 素面補板。", ["purpose-filler"]);
  defineHelp("handle-style-none", "無把手", "門片與五金", "門片正面不顯示明把手。", "極簡門片或使用按壓、斜把手結構時使用。", ["進入把手分頁。", "選無把手。"], ["實際開門方式仍需確認。"], "現代平板門使用無把手。", ["handle-style-bevel"]);
  defineHelp("handle-style-bevel", "斜把手", "門片與五金", "門片上緣或下緣做斜切抓手。", "要維持平整外觀又方便開門時使用。", ["選斜把手。", "立面與 3D 會顯示斜把手帶。"], ["吊櫃把手通常位於下方，下櫃位於上方。"], "木紋門片搭配斜把手。", ["handle-style-none", "handle-style-c-channel"]);
  defineHelp("handle-style-c-channel", "內嵌 C 型把手", "門片與五金", "在門片邊緣配置連續 C 型鋁把手。", "現代廚具需要水平連續線條時使用。", ["選內嵌 C 型。", "檢查全案把手方向。"], ["實際型材尺寸依供應商規格。"], "整排下櫃使用黑色 C 型把手。", ["handle-style-bevel"]);
  defineHelp("handle-style-bar", "G 型／明把手", "門片與五金", "在門片正面配置可見把手。", "需要明確抓握或特定風格時使用。", ["選 G 型／明把手。", "檢查位置與門片分割。"], ["把手突出量會影響動線。"], "鄉村風門片搭配金屬明把手。", ["handle-style-none"]);
  defineHelp("global-handle", "全案把手", "門片與五金", "一次套用目前專案所有一般櫃體的把手形式。", "要快速統一整案風格時使用。", ["選擇全案把手。", "檢查排油煙機、烘碗機與補板仍維持無把手。"], ["個別櫃體之後仍可單獨修改。"], "全案先套斜把手，再把設備櫃改為無把手。", ["handle-style-bevel"]);

  defineHelp("sink-undermount", "下嵌式水槽", "水槽", "水槽邊緣安裝在檯面下方。", "希望檯面清潔順暢、外觀俐落時使用。", ["用途選水槽櫃。", "進階設定選下嵌式。"], ["檯面開孔與固定方式需由加工廠確認。"], "石英石檯面搭配下嵌不鏽鋼水槽。", ["purpose-sink"]);
  defineHelp("sink-flush", "平接式水槽", "水槽", "水槽邊緣與檯面接近平整。", "需要平整交界與精細加工時使用。", ["選平接式。", "確認檯面加工能力。"], ["施工精度要求較高。"], "檯面與水槽邊緣平齊。", ["purpose-sink"]);
  defineHelp("sink-topmount", "上裝式水槽", "水槽", "水槽邊緣壓在檯面上方。", "需要安裝簡單或日後方便更換時使用。", ["選上裝式。", "檢查水槽外框尺寸。"], ["外框周圍較容易累積水漬。"], "不鏽鋼水槽由檯面上方放入。", ["purpose-sink"]);

  defineHelp("auto-layout", "自動配置", "AI 與自動工具", "依牆寬、方向與常用尺寸產生一版廚具草稿。", "剛輸入牆面尺寸、想快速開始時使用。", ["確認牆寬。", "選擇靠左或靠右。", "按自動配置。", "逐櫃檢查設備與尺寸。"], ["自動配置是起點，不會取代現場判斷。"], "2300 mm 牆自動生成爐台、備餐與水槽櫃。", ["ai-layout", "cabinet-editor"]);
  defineHelp("ai-layout", "AI 輔助構圖", "AI 與自動工具", "根據剩餘寬度推薦補板、側拉籃、窄櫃或抽屜櫃。", "修改或刪除櫃體後，不知道剩餘空間要放什麼時使用。", ["完成基本配置。", "點 AI 輔助構圖。", "查看推薦與原因。", "按加入此櫃體。", "檢查三個視圖。"], ["建議不會自動改設計，按加入後才會變更。"], "剩餘 200 mm 時推薦調味品側拉籃、窄開放櫃或補板。", ["gap-space", "equalize"]);
  defineHelp("gap-space", "剩餘空間推薦", "AI 與自動工具", "處理櫃體與牆面之間尚未使用的尺寸。", "圖面出現左側或右側剩餘尺寸時使用。", ["點剩餘尺寸。", "選 AI 推薦、補板、調整鄰櫃或修改牆寬。"], ["剩餘空間是計算結果，不是單一櫃體。"], "右側剩 200 mm，可加入側拉籃。", ["ai-layout", "purpose-filler"]);
  defineHelp("equalize", "輔助等分", "AI 與自動工具", "把連續櫃體的總寬重新平均分割。", "想把三座櫃改成四座，或把一座大櫃拆小時使用。", ["進入輔助等分。", "依序點選同層連續櫃體。", "輸入目標數量。", "檢查預覽後套用。"], ["下櫃與吊櫃不能混選。", "平均小於 120 mm 不建議製作。"], "1800 mm 三櫃改成四座 450 mm。", ["cabinet-width", "undo"]);
  defineHelp("dimension-edit", "尺寸標註點擊修改", "AI 與自動工具", "直接點圖面上的尺寸數字或尺寸線修改。", "看到尺寸就想直接調整時使用。", ["點尺寸文字。", "輸入新尺寸。", "按套用或 Enter。"], ["尺寸命中優先於櫃體本體。", "無效或負數不會套用。"], "點 600，改為 700 mm。", ["wall-width", "cabinet-width"]);
  defineHelp("undo", "復原", "AI 與自動工具", "回到上一個尺寸、推薦或等分操作之前。", "誤改尺寸或不滿意自動結果時使用。", ["按復原箭頭，或桌面使用 Ctrl+Z。"], ["部分早期操作可能不在歷史中。"], "撤回剛加入的 AI 推薦櫃體。", ["redo"]);
  defineHelp("redo", "重做", "AI 與自動工具", "重新套用剛被復原的操作。", "復原後又想恢復時使用。", ["按重做箭頭，或桌面使用 Ctrl+Y。"], ["執行新操作後，重做歷史會清空。"], "恢復剛才撤回的等分結果。", ["undo"]);

  defineHelp("normal-render", "普通材質渲染", "渲染與出圖", "使用內建材質與目前 3D 視角直接出圖。", "不需要 AI、想快速給客戶看基本配色時使用。", ["切到 3D。", "選擇材質風格。", "調整視角。", "匯出普通渲染。"], ["不會修改櫃體尺寸與位置。"], "套用木質北歐風後輸出 1920 × 1440。", ["view-3d", "ai-render"]);
  defineHelp("ai-render", "AI 進階渲染", "渲染與出圖", "截取白模或普通材質圖，交給 ChatGPT 或 Gemini 做真實渲染。", "需要更接近完工效果的客戶提案時使用。", ["選擇白模或普通材質。", "調好目前視角。", "先截圖下載。", "開啟 AI 並上傳。"], ["AI 圖必須人工核對尺寸與位置。"], "把白模與現場照片交給 AI 合成。", ["white-model", "material-source"]);
  defineHelp("white-model", "白模", "渲染與出圖", "只保留結構與明暗，讓 AI 自由設計材質。", "希望 AI 提出全新配色時使用。", ["AI 渲染來源選白模。", "下載截圖。", "提示 AI 保留配置。"], ["AI 可能改變材質與細節。"], "白模轉成奶油風廚具。", ["ai-render"]);
  defineHelp("material-source", "普通材質圖", "渲染與出圖", "保留目前內建材質與配色作為 AI 參考。", "已決定大致配色，只想提升真實感時使用。", ["先套普通材質。", "AI 來源選普通材質。", "下載並上傳。"], ["提示 AI 不要改尺寸與位置。"], "保留淺木門板，只加真實光影。", ["normal-render", "ai-render"]);
  defineHelp("download-screenshot", "下載截圖", "渲染與出圖", "保存目前視角圖供提案或 AI 使用。", "調整好構圖後使用。", ["確認視角。", "選解析度。", "按下載。"], ["手機下載後通常在系統下載資料夾。"], "下載 3D 4:3 圖。", ["ai-render", "export"]);
  defineHelp("open-chatgpt", "開啟 ChatGPT", "渲染與出圖", "開啟 ChatGPT 並搭配下載圖與提示詞。", "要進行 AI 進階渲染時使用。", ["先下載截圖。", "複製提示詞。", "開啟 ChatGPT 並上傳圖片。"], ["網站不會自動上傳你的圖片。"], "上傳白模請 AI 渲染成現代風。", ["ai-render"]);
  defineHelp("open-gemini", "開啟 Gemini", "渲染與出圖", "開啟 Gemini 並搭配下載圖與提示詞。", "想用 Gemini 產生效果圖時使用。", ["先下載截圖。", "開啟 Gemini。", "上傳並貼上提示詞。"], ["網站不會自動上傳你的圖片。"], "使用普通材質圖提升光影。", ["ai-render"]);
  defineHelp("export", "匯出", "渲染與出圖", "輸出平面、立面、3D、合併圖或相容 3D 檔。", "要交付客戶、工程溝通或備份時使用。", ["打開匯出。", "選格式、視圖與解析度。", "按開始匯出。"], ["出圖前先確認目前視角與尺寸。"], "輸出 1920 × 1440 立面圖。", ["export-floor", "export-elevation", "export-3d"]);
  defineHelp("export-floor", "匯出平面圖", "渲染與出圖", "輸出由上往下的平面配置圖。", "確認牆面、深度與排列時使用。", ["匯出視圖選平面圖。", "選解析度。", "開始匯出。"], ["固定為橫向 4:3。"], "輸出現場配置平面圖。", ["view-floor"]);
  defineHelp("export-elevation", "匯出立面圖", "渲染與出圖", "輸出正面櫃體與尺寸圖。", "客戶確認外觀或工程溝通時使用。", ["選立面圖。", "確認尺寸線。", "開始匯出。"], ["施工前仍需現場複量。"], "輸出含側視圖的立面圖。", ["view-elevation"]);
  defineHelp("export-3d", "匯出 3D 圖", "渲染與出圖", "依目前相機角度輸出 3D 圖。", "提案或 AI 渲染前使用。", ["切到 3D。", "調整視角。", "匯出 3D。"], ["匯出會保留目前視角。"], "輸出斜前方 3D 配置圖。", ["view-3d"]);
  defineHelp("export-all", "匯出全部視圖", "渲染與出圖", "依平面、立面、3D 順序輸出整份圖。", "要一次整理完整提案時使用。", ["匯出視圖選全部。", "選解析度。", "開始匯出。"], ["三個視圖會依固定順序排列。"], "一次輸出客戶檢查用全套圖。", ["export"]);
  defineHelp("export-sketchup", "SketchUp 相容 3D", "渲染與出圖", "輸出可供 SketchUp 等軟體參考的 Collada 3D 檔。", "要將草圖模型帶到其他 3D 流程時使用。", ["格式選 SketchUp 相容 3D。", "開始匯出 .dae。"], ["這不是原生 .skp，材質與細節需在其他軟體整理。"], "匯出 DAE 到 SketchUp 續作。", ["export"]);

  defineHelp("share", "分享網址", "分享", "分享 MODUDRAFT 公開網址或開啟系統分享面板。", "要讓手機、朋友或客戶開啟工具時使用。", ["打開分享。", "選系統分享或複製網址。"], ["一般網址不會自動帶走目前本機專案資料。"], "把公開工具網址傳給同事。", ["copy-url", "qr-code"]);
  defineHelp("copy-url", "複製網址", "分享", "把公開網站網址複製到剪貼簿。", "要貼到 LINE、Email 或訊息時使用。", ["打開分享。", "按複製網址。", "到通訊軟體貼上。"], ["專案資料仍保存在各自瀏覽器。"], "複製網址給現場平板。", ["share"]);
  defineHelp("qr-code", "QR Code", "分享", "讓另一支手機掃描後直接開啟網站。", "現場快速分享工具網址時使用。", ["打開分享。", "讓對方相機對準 QR Code。", "點通知開啟。"], ["需要網路連線才能開啟最新公開版。"], "客戶手機掃碼查看工具。", ["mobile-scan"]);
  defineHelp("mobile-scan", "手機掃碼開啟", "分享", "使用手機相機掃描 QR Code 開啟網站。", "不方便手動輸入網址時使用。", ["開啟手機相機。", "掃描 QR Code。", "點擊出現的網址。"], ["不需要安裝 APK。"], "在辦公室電腦顯示 QR Code，現場手機掃描。", ["qr-code"]);
  defineHelp("local-storage", "本機資料儲存", "分享", "專案自動保存在目前瀏覽器的 localStorage。", "了解資料保存範圍與備份責任時查看。", ["同一裝置可從最近專案繼續。", "重要案件另存 JSON。"], ["清除瀏覽器資料可能刪除專案。"], "換手機前先匯出 JSON。", ["project-center"]);

  defineHelp("more-tools", "更多功能", "手機操作", "收納自動工具、渲染、匯出、分享與教學。", "手機畫面找不到次要功能時使用。", ["點底部更多。", "向上滑動面板。", "選擇需要的工具。"], ["功能沒有刪除，只是分層收納。"], "從更多開啟 AI 進階渲染。", ["bottom-sheet"]);
  defineHelp("bottom-sheet", "底部操作面板", "手機操作", "手機版集中顯示目前情境的設定與工具。", "修改牆面、櫃體或更多功能時使用。", ["向上拖曳把手可全展開。", "向下拖曳可半展開或收合。", "按 × 關閉。"], ["面板打開時畫布會自動保留可見安全區。"], "把櫃體編輯面板拖到全展開設定進階項目。", ["more-tools"]);
  defineHelp("mobile-bottom-toolbar", "手機主工具列", "手機操作", "手機版固定的五個主要入口：牆面、新增、編輯、視圖與更多。", "需要快速進入目前最常用的工具時使用。", ["點選需要的入口。", "設定會在 Bottom Sheet 或橫屏側面板開啟。"], ["完整功能仍保留在更多，不會因手機版而刪除。"], "點新增後選擇下櫃或吊櫃。", ["mobile-more-menu", "bottom-sheet"]);
  defineHelp("mobile-more-menu", "手機更多選單", "手機操作", "集中自動配置、AI、渲染、匯出、分享與教學等完整功能。", "底部五鍵沒有顯示需要的功能時使用。", ["點底部更多。", "滑動面板查看所有工具。", "點選要執行的功能。"], ["所有桌面功能都能從這裡找到。"], "從更多開啟 AI 輔助構圖。", ["more-tools"]);
  defineHelp("teaching-mode", "教學模式", "教學", "開啟後，點任何工具只會顯示該功能教學，不會直接執行。", "第一次使用或遇到不熟悉工具時使用。", ["點右上角問號。", "再點想了解的功能。", "閱讀用途、步驟與注意事項。", "按實際操作看看可退出教學並執行。"], ["桌面與手機共用同一份教學資料。"], "在教學模式點新增櫃體，先看說明而不新增。", ["full-guide"]);
  defineHelp("full-guide", "完整使用說明", "教學", "以章節方式介紹從建牆到匯出的完整流程。", "想先理解整套軟體流程時使用。", ["從更多選單開啟使用說明。", "切換左側或上方章節。"], ["逐點細節請使用教學模式。"], "先看快速開始，再回工作台逐點操作。", ["teaching-mode"]);

  const HELP_ALIASES = Object.freeze({
    "ceiling-height": "wall-height",
    "edit-cabinet": "cabinet-editor",
    "equal-split": "equalize",
    "view-plan": "view-floor",
    "render-basic": "normal-render",
    "render-ai": "ai-render",
    "cabinet-door-style": "door-style-double-door",
    "cabinet-handle": "global-handle",
    "sink-cabinet": "purpose-sink",
    "stove-cabinet": "purpose-stove",
    "drawer-cabinet": "purpose-drawer",
    "wall-cabinet": "cabinet-layer",
    "base-cabinet": "cabinet-layer",
    "filler-panel": "purpose-filler",
    "mobile-more-menu": "mobile-more-menu",
    "canvas-zoom": "mobile-zoom",
    "canvas-pan": "mobile-pan"
  });

  Object.entries(HELP_ALIASES).forEach(([alias, target]) => {
    if (!HELP_REGISTRY[alias] && HELP_REGISTRY[target]) HELP_REGISTRY[alias] = HELP_REGISTRY[target];
  });

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

  const HELP_ID_BINDINGS = Object.freeze({
    addWallBtn: "add-wall", wallSelect: "select-wall", deleteWallBtn: "delete-wall",
    wallWidthInput: "wall-width", wallHeightInput: "wall-height", applyWallSizeBtn: "apply-wall-size",
    alignWallLeftBtn: "align-left", alignWallRightBtn: "align-right", addCabinetBtn: "add-cabinet",
    autoLayoutBtn: "auto-layout", aiAssistBtn: "ai-layout", equalizeBtn: "equalize",
    editName: "cabinet-name", editWidth: "cabinet-width", editType: "cabinet-layer",
    editPurpose: "cabinet-purpose", editFrontStyle: "door-style-double-door",
    editHandleStyle: "handle-style-none", editSinkMount: "sink-undermount",
    copyCabinetBtn: "copy-cabinet", deleteCabinetBtn: "delete-cabinet",
    moveLeftBtn: "move-left", moveRightBtn: "move-right", globalHandleStyle: "global-handle",
    viewFloor: "view-floor", viewElevation: "view-elevation", viewThree: "view-3d",
    floorCanvas: "view-floor", elevationCanvas: "view-elevation", threeCanvasContainer: "view-3d",
    resetViewBtn: "reset-view", wallVisibilityToggle: "wall-visibility",
    topFillerVisibilityToggle: "top-filler", materialRenderBtn: "normal-render",
    renderViewBtn: "ai-render", exportBtn: "export", installAppBtn: "share",
    undoKitchenBtn: "undo", redoKitchenBtn: "redo", captureAiScreenshotBtn: "download-screenshot",
    openChatGptBtn: "open-chatgpt", openGeminiBtn: "open-gemini", copyMobileUrlBtn: "copy-url"
  });

  const VALUE_HELP_BINDINGS = Object.freeze({
    editPurpose: { general: "purpose-general", stove: "purpose-stove", sink: "purpose-sink", drawer: "purpose-drawer", appliance: "purpose-appliance", hood: "purpose-hood", "dish-dryer": "purpose-dish-dryer", open: "purpose-open", filler: "purpose-filler" },
    editFrontStyle: { "double-door": "door-style-double-door", "single-door": "door-style-single-door", "two-drawer": "door-style-two-drawer", "three-drawer": "door-style-three-drawer", "two-small-one-large": "door-style-two-small-one-large", appliance: "door-style-appliance", open: "door-style-open", panel: "door-style-panel" },
    editHandleStyle: { none: "handle-style-none", bevel: "handle-style-bevel", "c-channel": "handle-style-c-channel", bar: "handle-style-bar" },
    editSinkMount: { undermount: "sink-undermount", flush: "sink-flush", topmount: "sink-topmount" }
  });

  function deriveHelpId(control) {
    if (!control) return "";
    const valueMap = VALUE_HELP_BINDINGS[control.id];
    if (valueMap && valueMap[control.value]) return valueMap[control.value];
    if (control.dataset.helpId) return control.dataset.helpId;
    if (HELP_ID_BINDINGS[control.id]) return HELP_ID_BINDINGS[control.id];
    if (control.dataset.view === "floor") return "view-floor";
    if (control.dataset.view === "elevation") return "view-elevation";
    if (control.dataset.view === "three") return "view-3d";
    return "";
  }

  function helpFor(control) {
    const helpId = deriveHelpId(control);
    if (helpId && HELP_REGISTRY[helpId]) return HELP_REGISTRY[helpId];
    const identity = [control?.id, control?.dataset?.view, control?.dataset?.panel, control?.dataset?.preset, controlName(control)].filter(Boolean).join(" ");
    for (const [pattern, content] of HELP_RULES) if (pattern.test(identity)) return {
      helpId: "legacy-context", title: content[0], category: "功能說明",
      shortDescription: content[1], whenToUse: "需要使用這項功能時。",
      howToUse: [content[2]], tips: [content[3]], example: "先確認目前選取的牆面、櫃體或視圖，再執行此功能。", related: []
    };
    const name = controlName(control);
    const isField = control && /^(INPUT|SELECT|TEXTAREA)$/.test(control.tagName);
    return {
      helpId: "unregistered", title: name, category: "尚待補充",
      shortDescription: isField ? `設定「${name}」的值，變更後會更新目前選取物件與相關圖面。` : `執行「${name}」功能。`,
      whenToUse: "需要調整目前設計或切換工具時。",
      howToUse: [isField ? "輸入或選擇內容。" : "先確認目前選取的牆面、櫃體或視圖。", "執行後到平面、立面與 3D 確認結果。"],
      tips: ["這個區域目前還沒有專屬教學內容，後續可補上 helpId。"],
      example: "若不確定影響範圍，先儲存專案或匯出 JSON 備份。", related: []
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
    let teachingMode = false;
    let currentContextTarget = null;
    const touchPointers = new Map();
    let touchGestureMoved = false;
    let touchGestureMultiple = false;
    let touchSuppressUntil = 0;
    const teachingModeState = {
      enabled: false,
      dismissedIntro: false,
      currentHelpId: null,
      overlayVisible: false
    };
    const isCoarsePointer = global.matchMedia?.("(pointer: coarse)")?.matches === true || (navigator.maxTouchPoints || 0) > 0;
    try {
      teachingModeState.dismissedIntro = localStorage.getItem("modudraft.mobileTeaching.dismissed") === "true";
      localStorage.setItem("modudraft.mobileTeaching.enabled", "false");
    } catch (_error) {}

    const button = document.createElement("button");
    button.type = "button";
    button.className = "md-help-button";
    button.textContent = "?";
    button.title = "開啟逐點教學模式";
    button.setAttribute("aria-label", "開啟逐點教學模式");
    button.dataset.helpId = "teaching-mode";
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
    toast.textContent = "提示：點問號可開啟逐點教學";
    toast.dataset.helpUi = "true";

    const teachingBanner = document.createElement("div");
    teachingBanner.className = "md-teaching-banner";
    teachingBanner.dataset.helpUi = "true";
    teachingBanner.innerHTML = `<span><b>教學模式</b> 已開啟，點擊功能查看說明</span><button type="button" data-help-ui="true">退出教學</button>`;

    const focusRing = document.createElement("div");
    focusRing.className = "md-help-focus-ring";
    focusRing.dataset.helpUi = "true";

    const target = config.buttonTarget ? document.querySelector(config.buttonTarget) : null;
    if (target) target.appendChild(button); else { button.classList.add("floating"); document.body.appendChild(button); }
    document.body.append(backdrop, hold, toast, teachingBanner, focusRing);
    const content = backdrop.querySelector(".md-help-content");
    const navButtons = Array.from(backdrop.querySelectorAll("[data-help-chapter]"));
    const navHint = backdrop.querySelector(".md-help-nav-hint");
    if (navHint && isCoarsePointer) navHint.textContent = "點右上角問號開啟教學模式，再點功能查看逐點說明。";

    function refreshMetadata(root = document) {
      const candidates = root.matches?.("button,a,input,select,textarea,canvas,[role='button'],.view")
        ? [root]
        : Array.from(root.querySelectorAll?.("button,a,input,select,textarea,canvas,[role='button'],.view") || []);
      candidates.forEach((control) => {
        if (control.closest?.("[data-help-ui='true']")) return;
        const inferred = deriveHelpId(control);
        if (inferred) {
          control.dataset.helpId = inferred;
          if (!control.title && HELP_REGISTRY[inferred]) control.title = `${HELP_REGISTRY[inferred].title}：${HELP_REGISTRY[inferred].shortDescription}`;
        }
      });
    }

    function showToast(message, duration = 1800) {
      toast.textContent = message;
      toast.classList.add("show");
      clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(() => toast.classList.remove("show"), duration);
    }

    function updateFocusRing(control) {
      if (!control || !document.documentElement.contains(control)) {
        focusRing.classList.remove("open");
        return;
      }
      const rect = control.getBoundingClientRect();
      focusRing.style.left = `${Math.max(2, rect.left - 6)}px`;
      focusRing.style.top = `${Math.max(2, rect.top - 6)}px`;
      focusRing.style.width = `${Math.max(20, rect.width + 12)}px`;
      focusRing.style.height = `${Math.max(20, rect.height + 12)}px`;
      focusRing.classList.add("open");
    }

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

    function renderContext(control, forcedHelpId = "") {
      const help = HELP_REGISTRY[forcedHelpId] || helpFor(control);
      currentContextTarget = control;
      navButtons.forEach((item) => item.classList.remove("active"));
      const related = (help.related || []).map((id) => HELP_REGISTRY[id]).filter(Boolean);
      teachingModeState.currentHelpId = help.helpId || forcedHelpId || control?.dataset?.helpId || null;
      content.innerHTML = `<article class="md-context-card"><div class="md-context-icon">?</div><span class="md-context-category">${escapeHtml(help.category || "功能說明")}</span><h3>${escapeHtml(help.title)}</h3><section class="md-context-intro"><h4>這是什麼</h4><p>${escapeHtml(help.shortDescription)}</p></section><div class="md-context-grid"><section><h4>什麼時候用</h4><p>${escapeHtml(help.whenToUse)}</p></section><section><h4>怎麼操作</h4><ol>${(help.howToUse || []).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol></section><section><h4>注意事項</h4><ul>${(help.tips || []).map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul></section><section><h4>範例</h4><p>${escapeHtml(help.example)}</p></section></div>${related.length ? `<div class="md-context-related"><b>相關功能</b>${related.map((item) => `<span>${escapeHtml(item.title)}</span>`).join("")}</div>` : ""}<div class="md-context-actions"><button type="button" data-context-action="know" data-help-ui="true">我知道了</button><button type="button" data-context-action="try" data-help-ui="true">實際操作看看</button><button type="button" data-context-action="next" data-help-ui="true">下一個教學</button><button type="button" data-context-action="exit" data-help-ui="true">退出教學</button></div></article>`;
      content.scrollTop = 0;
      updateFocusRing(control);
    }

    function open(key) {
      toggleTeachingMode(false);
      if (key) renderChapter(key); else renderChapter(activeKey);
      backdrop.classList.add("open");
      document.documentElement.style.overflow = "hidden";
    }

    function openContext(control, forcedHelpId = "") {
      const helpId = forcedHelpId || deriveHelpId(control);
      if (!helpId || !HELP_REGISTRY[helpId]) {
        showToast("此區域尚未建立教學");
        return false;
      }
      renderContext(control, forcedHelpId);
      backdrop.classList.add("open");
      backdrop.classList.add("context-open");
      teachingModeState.overlayVisible = true;
      document.documentElement.style.overflow = "hidden";
      positionHelpCard(control?.getBoundingClientRect?.());
      return true;
    }

    function close() {
      backdrop.classList.remove("open");
      backdrop.classList.remove("context-open");
      document.documentElement.style.overflow = "";
      focusRing.classList.remove("open");
      currentContextTarget = null;
      teachingModeState.currentHelpId = null;
      teachingModeState.overlayVisible = false;
    }

    function positionHelpCard(targetRect) {
      const mode = document.body.dataset.deviceMode || "tabletDesktop";
      const dialog = backdrop.querySelector(".md-help-dialog");
      backdrop.dataset.helpLayout = mode;
      if (!dialog || !targetRect) return;
      const targetCenter = targetRect.left + targetRect.width / 2;
      const targetMiddle = targetRect.top + targetRect.height / 2;
      backdrop.style.setProperty("--help-arrow-x", `${Math.max(8, Math.min(92, targetCenter / Math.max(1, innerWidth) * 100))}%`);
      backdrop.style.setProperty("--help-arrow-y", `${Math.max(10, Math.min(90, targetMiddle / Math.max(1, innerHeight) * 100))}%`);
      backdrop.dataset.targetSide = targetCenter < innerWidth / 2 ? "left" : "right";
    }

    function toggleTeachingMode(force) {
      teachingMode = typeof force === "boolean" ? force : !teachingMode;
      teachingModeState.enabled = teachingMode;
      document.body.classList.toggle("md-teaching-mode", teachingMode);
      teachingBanner.classList.toggle("open", teachingMode);
      button.classList.toggle("active", teachingMode);
      button.setAttribute("aria-pressed", String(teachingMode));
      if (!teachingMode) {
        focusRing.classList.remove("open");
        if (backdrop.classList.contains("open") && currentContextTarget) close();
      }
      try {
        localStorage.setItem("modudraft.mobileTeaching.enabled", String(teachingMode));
        if (!teachingMode) localStorage.setItem("modudraft.mobileTeaching.dismissed", "true");
      } catch (_error) {}
      if (typeof config.onTeachingModeChange === "function") config.onTeachingModeChange(teachingMode);
      return teachingMode;
    }

    function eligible(event, strict = false) {
      const selector = strict ? "[data-help-id]" : "[data-help-id],button,a,input,select,textarea,canvas,[role='button'],.view";
      const control = event.target.closest?.(selector);
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
      if (event.pointerType === "touch") {
        touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY });
        if (touchPointers.size >= 2) {
          touchGestureMultiple = true;
          touchSuppressUntil = Date.now() + 650;
          cancelHold();
        }
      }
      if (isCoarsePointer || event.button !== 0 || backdrop.classList.contains("open") || teachingMode) return;
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
      if (event.pointerType === "touch" && touchPointers.has(event.pointerId)) {
        const pointer = touchPointers.get(event.pointerId);
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        if (Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY) > 6) {
          touchGestureMoved = true;
          touchSuppressUntil = Date.now() + 650;
        }
      }
      if (!longStart) return;
      if (Math.hypot(event.clientX - longStart.x, event.clientY - longStart.y) > 12) cancelHold();
    }, true);
    document.addEventListener("pointerup", (event) => {
      if (event.pointerType === "touch") {
        touchPointers.delete(event.pointerId);
        if (touchGestureMoved || touchGestureMultiple) touchSuppressUntil = Date.now() + 650;
        if (touchPointers.size === 0) {
          window.setTimeout(() => { touchGestureMoved = false; touchGestureMultiple = false; }, 0);
        }
      }
      cancelHold();
    }, true);
    document.addEventListener("pointercancel", (event) => {
      if (event.pointerType === "touch") {
        touchPointers.delete(event.pointerId);
        touchSuppressUntil = Date.now() + 650;
      }
      cancelHold();
    }, true);
    document.addEventListener("click", (event) => {
      if (teachingMode) {
        if (Date.now() < touchSuppressUntil || touchGestureMoved || touchGestureMultiple) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
        const control = eligible(event, true);
        if (control) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const resolvedHelpId = typeof config.resolveHelpId === "function" ? config.resolveHelpId(event, control) : "";
          if (control.tagName === "CANVAS" && /^view-/.test(resolvedHelpId)) return;
          openContext(control, resolvedHelpId);
          return;
        }
        const unsupported = event.target.closest?.("button,a,input,select,textarea,[role='button']");
        if (unsupported && !unsupported.closest("[data-help-ui='true']")) {
          event.preventDefault();
          event.stopImmediatePropagation();
          showToast("此區域尚未建立教學");
          return;
        }
      }
      if (Date.now() < suppressUntil && suppressTarget && (event.target === suppressTarget || suppressTarget.contains(event.target))) {
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressTarget = null;
      }
    }, true);
    document.addEventListener("contextmenu", (event) => {
      if (isCoarsePointer) return;
      const control = eligible(event);
      if (!control) return;
      event.preventDefault();
      openContext(control);
    });

    content.addEventListener("click", (event) => {
      const action = event.target.closest("[data-context-action]")?.dataset.contextAction;
      if (!action) return;
      if (action === "know") close();
      if (action === "try") {
        const control = currentContextTarget;
        close();
        toggleTeachingMode(false);
        window.setTimeout(() => control?.click(), 80);
      }
      if (action === "exit") {
        close();
        toggleTeachingMode(false);
      }
      if (action === "next") {
        const controls = Array.from(document.querySelectorAll("[data-help-id]"))
          .filter((item) => !item.closest("[data-help-ui='true']") && item.getClientRects().length && !item.disabled);
        if (!controls.length) return;
        const index = Math.max(-1, controls.indexOf(currentContextTarget));
        const next = controls[(index + 1) % controls.length];
        next.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
        window.setTimeout(() => renderContext(next), 220);
      }
    });

    button.onclick = () => toggleTeachingMode();
    teachingBanner.querySelector("button").onclick = () => toggleTeachingMode(false);
    backdrop.querySelector(".md-help-close").onclick = close;
    backdrop.onclick = (event) => { if (event.target === backdrop) close(); };
    navButtons.forEach((item) => { item.onclick = () => renderChapter(item.dataset.helpChapter); });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && backdrop.classList.contains("open")) close();
      else if (event.key === "Escape" && teachingMode) toggleTeachingMode(false);
      if (event.key === "F1") { event.preventDefault(); open("start"); }
    });

    refreshMetadata();
    const metadataObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) refreshMetadata(node);
      }));
    });
    metadataObserver.observe(document.body, { childList: true, subtree: true });

    if (config.autoOpen !== false && !isCoarsePointer) {
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

    return {
      open,
      close,
      openContext,
      toggleTeachingMode,
      isTeaching: () => teachingMode,
      positionHelpCard,
      showToast,
      refreshMetadata,
      teachingModeState,
      registry: HELP_REGISTRY
    };
  }

  global.MODUDRAFTHelp = Object.freeze({ mount, helpFor, registry: HELP_REGISTRY });
})(window);
