const STORAGE_KEY = "fangzhou-price-calculator-v11";
const MIX_STORAGE_KEY = "fangzhou-price-calculator-mixed-v1";
const DOC_STORAGE_KEY = "fangzhou-price-calculator-doc-v1";

const CONTAINERS = {
  "20gp": { label: "20GP", volume: 28, price: 3800 },
  "40hq": { label: "40HQ", volume: 68, price: 6800 },
  "40nor": { label: "40NOR", volume: 58, price: 6800 }
};

const EXCHANGE_RATE_PROVIDERS = [
  {
    url: "https://api.frankfurter.app/latest?from=USD&to=CNY",
    parse: (data) => ({ rate: Number(data?.rates?.CNY), date: data?.date })
  },
  {
    url: "https://open.er-api.com/v6/latest/USD",
    parse: (data) => ({ rate: Number(data?.rates?.CNY), date: data?.time_last_update_utc?.slice(0, 16) })
  },
  {
    url: "https://api.exchangerate-api.com/v4/latest/USD",
    parse: (data) => ({ rate: Number(data?.rates?.CNY), date: data?.date })
  }
];

const PACKAGING_GROUP = {
  id: "packaging",
  title: "包装选择",
  affectsPrice: false,
  affectsLogistics: false,
  items: [
    { id: "no-color-box", label: "无彩盒" },
    { id: "color-box", label: "彩盒" },
    { id: "thick-box", label: "加厚盒子" },
    { id: "thick-color-box", label: "加厚彩盒" }
  ]
};

const PACKAGING_SIZE_ADDONS = {
  "3l": { colorBox: 0.2, thickBox: 0.3 },
  "5l": { colorBox: 0.45, thickBox: 0.4 },
  "8l": { colorBox: 0.55, thickBox: 0.5 },
  "12l": { colorBox: 0.5, thickBox: 0.6 },
  "20l": { colorBox: 1, thickBox: 0.7 },
  "30l": { colorBox: 1.5, thickBox: 1 }
};

const DEFAULT_PACKAGING_ADDONS = PACKAGING_SIZE_ADDONS["3l"];

const INDOOR_FULL_SIZES = [
  { id: "3l", label: "3L" },
  { id: "5l", label: "5L" },
  { id: "8l", label: "8L" },
  { id: "12l", label: "12L" },
  { id: "20l", label: "20L" },
  { id: "30l", label: "30L" }
];

const logistics = (cartonQty, cartonSpec, unitWeight, cbm) => ({ cartonQty, cartonSpec, unitWeight, cbm });
const prices = (entries) => Object.fromEntries(entries);

function regularOnlyPrices(sizeMap) {
  return prices(Object.entries(sizeMap).map(([size, price]) => [`size:${size}|softClose:standard`, price]));
}

function toiletBrushBlackWhitePrices(basePrice) {
  const lidAddons = {
    "stainless-lid": 0,
    "bamboo-lid": 1.3,
    "black-white-iron-lid": 0.3
  };
  const handleAddons = {
    "silver-handle": 0,
    "black-white-handle": 0.3,
    "bamboo-plug-handle": 0.6
  };

  return Object.entries(lidAddons).flatMap(([lid, lidAddon]) =>
    Object.entries(handleAddons).map(([handle, handleAddon]) => [
      `finish:black-white|lid:${lid}|handle:${handle}`,
      Number((basePrice + lidAddon + handleAddon).toFixed(2))
    ])
  );
}

function paintedTrashCanPrices() {
  return [
    ["gridPattern:no-grid-pattern|size:3l", 12],
    ["gridPattern:no-grid-pattern|size:5l", 15.5],
    ["gridPattern:no-grid-pattern|size:8l", 20],
    ["gridPattern:no-grid-pattern|size:12l", 25],
    ["gridPattern:no-grid-pattern|size:20l", 30.5],
    ["gridPattern:no-grid-pattern|size:30l", 49],
    ["gridPattern:with-grid-pattern|size:3l", 13],
    ["gridPattern:with-grid-pattern|size:5l", 16],
    ["gridPattern:with-grid-pattern|size:8l", 21],
    ["gridPattern:with-grid-pattern|size:12l", 26],
    ["gridPattern:with-grid-pattern|size:20l", 31.5],
    ["gridPattern:with-grid-pattern|size:30l", 50]
  ];
}

function withSoftCloseLogistics(sizeMap) {
  const entries = {};
  Object.entries(sizeMap).forEach(([size, value]) => {
    entries[`size:${size}|softClose:standard`] = value;
    entries[`size:${size}|softClose:soft-close`] = value;
  });
  return entries;
}

function withGridPatternLogistics(noPatternMap, gridPatternMap) {
  const entries = {};
  Object.entries(noPatternMap).forEach(([size, value]) => {
    entries[`gridPattern:no-grid-pattern|size:${size}`] = value;
  });
  Object.entries(gridPatternMap).forEach(([size, value]) => {
    entries[`gridPattern:with-grid-pattern|size:${size}`] = value;
  });
  return entries;
}

function withBambooPatternLogistics(sizeMap) {
  const entries = {};
  ["plain", "embossed", "roman"].forEach((pattern) => {
    Object.entries(sizeMap).forEach(([size, value]) => {
      entries[`size:${size}|pattern:${pattern}|softClose:standard`] = value;
      entries[`size:${size}|pattern:${pattern}|softClose:soft-close`] = value;
    });
  });
  return entries;
}

function withSquareLogistics(map) {
  const entries = {};
  Object.entries(map).forEach(([finish, value]) => {
    entries[`finish:${finish}|softClose:standard`] = value;
    entries[`finish:${finish}|softClose:soft-close`] = value;
  });
  return entries;
}

function withToiletBrushLogistics(size) {
  const isLarge = size === "large";
  const entries = {};
  if (isLarge) {
    entries["finish:stainless|blackBase:no-black-base"] = logistics(48, "65*44*55", "310g", 0.1573);
    entries["finish:stainless|blackBase:with-black-base"] = logistics(48, "65*44*55", "310g", 0.1573);
  } else {
    entries["finish:stainless"] = logistics(48, "65*44*39", "240g", 0.11154);
  }

  const blackWhiteDetail = isLarge ? logistics(48, "65*44*55", "350g", 0.1573) : logistics(48, "65*44*39", "270g", 0.11154);
  ["bamboo-lid", "black-white-iron-lid", "stainless-lid"].forEach((lid) => {
    ["silver-handle", "black-white-handle", "bamboo-plug-handle"].forEach((handle) => {
      entries[`finish:black-white|lid:${lid}|handle:${handle}`] = blackWhiteDetail;
    });
  });
  return entries;
}

const initialProducts = [
  {
    id: "outdoor-bin",
    name: "户外垃圾桶",
    hint: "30L / 50L / 100L / 120L / 240L",
    options: [
      { id: "30l", label: "30L", price: 0 },
      { id: "50l", label: "50L", price: 0 },
      { id: "100l", label: "100L", price: 0 },
      { id: "120l", label: "120L", price: 0 },
      { id: "240l", label: "240L", price: 0 }
    ]
  },
  {
    id: "indoor-bin",
    name: "室内垃圾桶",
    hint: "不锈钢脚踏 / 喷漆 / 竹盖 / 方形 / 感应",
    options: [
      {
        id: "stainless-pedal",
        label: "不锈钢脚踏垃圾桶",
        configGroups: [
          {
            id: "size",
            title: "选择尺寸",
            items: INDOOR_FULL_SIZES
          },
          {
            id: "softClose",
            title: "是否缓降",
            items: [
              { id: "standard", label: "普通" },
              { id: "soft-close", label: "缓降" }
            ]
          }
        ],
        prices: regularOnlyPrices({
          "3l": 10.5,
          "5l": 14,
          "8l": 18.5,
          "12l": 21.5,
          "20l": 29.5,
          "30l": 48
        }),
        logisticsByKey: withSoftCloseLogistics({
          "3l": logistics(18, "63*53.5*52", "510g", 0.175266),
          "5l": logistics(12, "64*46*59", "720g", 0.173696),
          "8l": logistics(12, "73*49*66", "930g", 0.236082),
          "12l": logistics(8, "54*54*79", "1300g", 0.230364),
          "20l": logistics(4, "61*61*44.5", "1900g", 0.1655845),
          "30l": logistics(4, "61*61*65", "3000g", 0.241865)
        })
      },
      {
        id: "painted",
        label: "喷漆垃圾桶",
        configGroups: [
          {
            id: "gridPattern",
            title: "是否需要方格纹",
            items: [
              { id: "no-grid-pattern", label: "不需要方格纹" },
              { id: "with-grid-pattern", label: "需要方格纹" }
            ]
          },
          {
            id: "size",
            title: "选择尺寸",
            items: INDOOR_FULL_SIZES
          }
        ],
        prices: prices(paintedTrashCanPrices()),
        logisticsByKey: withGridPatternLogistics(
          {
            "3l": logistics(18, "63*53.5*52", "520g", 0.175266),
            "5l": logistics(12, "64*46*59", "730g", 0.173696),
            "8l": logistics(12, "73*49*66", "940g", 0.236082),
            "12l": logistics(8, "54*54*79", "1400g", 0.230364),
            "20l": logistics(4, "61*61*44.5", "2000g", 0.1655845)
          },
          {
            "3l": logistics(18, "63*53.5*52", "520g", 0.175266),
            "5l": logistics(12, "64*46*59", "730g", 0.173696),
            "8l": logistics(12, "73*49*66", "940g", 0.236082),
            "12l": logistics(8, "54*54*79", "1400g", 0.230364)
          }
        )
      },
      {
        id: "bamboo-lid",
        label: "竹盖垃圾桶",
        configGroups: [
          {
            id: "size",
            title: "选择尺寸",
            items: [
              { id: "3l", label: "3L" },
              { id: "5l", label: "5L" }
            ]
          },
          {
            id: "pattern",
            title: "选择花纹",
            items: [
              { id: "plain", label: "无花纹" },
              { id: "embossed", label: "凹凸纹" },
              { id: "roman", label: "罗马纹" }
            ]
          },
          {
            id: "softClose",
            title: "是否缓降",
            items: [
              { id: "standard", label: "普通" },
              { id: "soft-close", label: "缓降" }
            ]
          }
        ],
        prices: prices([
          ["size:3l|pattern:plain|softClose:standard", 14.6],
          ["size:5l|pattern:plain|softClose:standard", 17.8],
          ["size:3l|pattern:roman|softClose:standard", 15.6],
          ["size:5l|pattern:roman|softClose:standard", 18.8]
        ]),
        logisticsByKey: withBambooPatternLogistics({
          "3l": logistics(18, "63*53.5*52", "520g", 0.175266),
          "5l": logistics(12, "64*46*59", "730g", 0.173696)
        })
      },
      {
        id: "square",
        label: "方形垃圾桶",
        configGroups: [
          {
            id: "finish",
            title: "选择颜色/款式",
            items: [
              { id: "silver", label: "银色" },
              { id: "black-white-silver-bamboo-lid", label: "黑白银竹盖" }
            ]
          },
          {
            id: "softClose",
            title: "是否缓降",
            items: [
              { id: "standard", label: "普通" },
              { id: "soft-close", label: "缓降" }
            ]
          }
        ],
        prices: prices([
          ["finish:silver|softClose:standard", 22],
          ["finish:black-white-silver-bamboo-lid|softClose:standard", 24]
        ]),
        logisticsByKey: withSquareLogistics({
          "silver": logistics(12, "60*46*63", "900g", 0.17388),
          "black-white-silver-bamboo-lid": logistics(12, "60*46*63", "930g", 0.17388)
        })
      },
      { id: "sensor", label: "感应垃圾桶", price: 180, logistics: logistics(1, "61*41*22.5", "7000g", 0.0562725) }
    ]
  },
  {
    id: "toilet-brush",
    name: "马桶刷",
    hint: "大号 / 小号",
    options: [
      {
        id: "large",
        label: "大号",
        configGroups: [
          {
            id: "finish",
            title: "选择款式",
            items: [
              { id: "stainless", label: "不锈钢" },
              { id: "black-white", label: "黑白" }
            ]
          },
          {
            id: "blackBase",
            title: "是否要黑底",
            showWhen: { finish: "stainless" },
            items: [
              { id: "no-black-base", label: "不要黑底" },
              { id: "with-black-base", label: "要黑底" }
            ]
          },
          {
            id: "lid",
            title: "盖子种类",
            showWhen: { finish: "black-white" },
            items: [
              { id: "bamboo-lid", label: "竹盖" },
              { id: "black-white-iron-lid", label: "黑白铁盖" },
              { id: "stainless-lid", label: "不锈钢盖子" }
            ]
          },
          {
            id: "handle",
            title: "把手柄",
            showWhen: { finish: "black-white" },
            items: [
              { id: "silver-handle", label: "银色手柄" },
              { id: "black-white-handle", label: "黑白手柄" },
              { id: "bamboo-plug-handle", label: "带竹塞手柄" }
            ]
          }
        ],
        prices: prices([
          ["finish:stainless|blackBase:no-black-base", 7],
          ["finish:stainless|blackBase:with-black-base", 7.1],
          ...toiletBrushBlackWhitePrices(7.3)
        ]),
        logisticsByKey: withToiletBrushLogistics("large")
      },
      {
        id: "small",
        label: "小号",
        configGroups: [
          {
            id: "finish",
            title: "选择款式",
            items: [
              { id: "stainless", label: "不锈钢" },
              { id: "black-white", label: "黑白" }
            ]
          },
          {
            id: "lid",
            title: "盖子种类",
            showWhen: { finish: "black-white" },
            items: [
              { id: "bamboo-lid", label: "竹盖" },
              { id: "black-white-iron-lid", label: "黑白铁盖" },
              { id: "stainless-lid", label: "不锈钢盖子" }
            ]
          },
          {
            id: "handle",
            title: "把手柄",
            showWhen: { finish: "black-white" },
            items: [
              { id: "silver-handle", label: "银色手柄" },
              { id: "black-white-handle", label: "黑白手柄" },
              { id: "bamboo-plug-handle", label: "带竹塞手柄" }
            ]
          }
        ],
        prices: prices([
          ["finish:stainless", 6.5],
          ...toiletBrushBlackWhitePrices(6.9)
        ]),
        logisticsByKey: withToiletBrushLogistics("small")
      }
    ]
  }
];

const state = {
  products: loadProducts(),
  productId: "outdoor-bin",
  optionId: "30l",
  configSelections: {},
  quantity: 1,
  margin: 0,
  extraCost: 0,
  exchangeRate: 7.2,
  containerId: "40hq",
  includeFob: false,
  mixedItems: loadMixedItems(),
  docSettings: loadDocSettings()
};

const elements = {
  productGrid: document.querySelector("#productGrid"),
  optionGrid: document.querySelector("#optionGrid"),
  optionTitle: document.querySelector("#optionTitle"),
  modifierWrap: document.querySelector("#modifierWrap"),
  unitPrice: document.querySelector("#unitPrice"),
  discountPrice: document.querySelector("#discountPrice"),
  quantity: document.querySelector("#quantity"),
  extraCost: document.querySelector("#extraCost"),
  exchangeRate: document.querySelector("#exchangeRate"),
  refreshExchangeRate: document.querySelector("#refreshExchangeRate"),
  exchangeRateStatus: document.querySelector("#exchangeRateStatus"),
  containerType: document.querySelector("#containerType"),
  includeFob: document.querySelector("#includeFob"),
  selectedName: document.querySelector("#selectedName"),
  totalCny: document.querySelector("#totalCny"),
  totalUsd: document.querySelector("#totalUsd"),
  unitWithMargin: document.querySelector("#unitWithMargin"),
  packagingCost: document.querySelector("#packagingCost"),
  fobCost: document.querySelector("#fobCost"),
  fobUnitWithMargin: document.querySelector("#fobUnitWithMargin"),
  fobUnitUsd: document.querySelector("#fobUnitUsd"),
  fobTotalCny: document.querySelector("#fobTotalCny"),
  fobTotalUsd: document.querySelector("#fobTotalUsd"),
  containerUnits: document.querySelector("#containerUnits"),
  addMixedItem: document.querySelector("#addMixedItem"),
  clearMixedItems: document.querySelector("#clearMixedItems"),
  mixedTotalCbm: document.querySelector("#mixedTotalCbm"),
  mixedContainerUsage: document.querySelector("#mixedContainerUsage"),
  mixedFreightTotal: document.querySelector("#mixedFreightTotal"),
  mixedList: document.querySelector("#mixedList"),
  mixedEmpty: document.querySelector("#mixedEmpty"),
  resultQty: document.querySelector("#resultQty"),
  cartonSpec: document.querySelector("#cartonSpec"),
  cartonQty: document.querySelector("#cartonQty"),
  unitWeight: document.querySelector("#unitWeight"),
  quoteText: document.querySelector("#quoteText"),
  saveStatus: document.querySelector("#saveStatus"),
  savePrice: document.querySelector("#savePrice"),
  copyQuote: document.querySelector("#copyQuote"),
  resetPrices: document.querySelector("#resetPrices"),
  exportData: document.querySelector("#exportData"),
  importData: document.querySelector("#importData"),
  docPiNo: document.querySelector("#docPiNo"),
  docDate: document.querySelector("#docDate"),
  docBuyerName: document.querySelector("#docBuyerName"),
  docBuyerContact: document.querySelector("#docBuyerContact"),
  docBuyerAddress: document.querySelector("#docBuyerAddress"),
  docBuyerTaxId: document.querySelector("#docBuyerTaxId"),
  docSellerName: document.querySelector("#docSellerName"),
  docPort: document.querySelector("#docPort"),
  docDepositRate: document.querySelector("#docDepositRate"),
  docPayment: document.querySelector("#docPayment"),
  docShipment: document.querySelector("#docShipment"),
  docPacking: document.querySelector("#docPacking"),
  downloadPi: document.querySelector("#downloadPi"),
  printPi: document.querySelector("#printPi"),
  downloadPackingList: document.querySelector("#downloadPackingList")
};

function loadProducts() {
  try {
    const keys = [
      STORAGE_KEY,
      "fangzhou-price-calculator-v10",
      "fangzhou-price-calculator-v9",
      "fangzhou-price-calculator-v8",
      "fangzhou-price-calculator-v7",
      "fangzhou-price-calculator-v6",
      "fangzhou-price-calculator-v5",
      "fangzhou-price-calculator-v4",
      "fangzhou-price-calculator-v3",
      "fangzhou-price-calculator-v2",
      "fangzhou-price-calculator-v1"
    ];

    for (const key of keys) {
      const saved = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(saved?.products)) {
        return mergeSavedProducts(saved.products);
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return structuredClone(initialProducts);
}

function loadMixedItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(MIX_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((item) => item && item.name && Number.isFinite(Number(item.quantity)))
      .map((item, index) => normalizeMixedItem({
        ...item,
        id: item.id || `saved-${Date.now()}-${index}`,
        quantity: Math.max(1, Math.round(Number(item.quantity) || 1))
      }));
  } catch {
    return [];
  }
}

function todayIso() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function defaultPiNo() {
  const date = new Date();
  return `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function defaultDocSettings() {
  return {
    piNo: defaultPiNo(),
    date: todayIso(),
    buyerName: "",
    buyerContact: "",
    buyerAddress: "",
    buyerTaxId: "",
    sellerName: "Yongkang Fangzhou Hardware Factory",
    port: "Ningbo",
    depositRate: 30,
    payment: "30% T/T as deposit, balance shall be paid before shipment",
    shipment: "To be effected by the buyer",
    packing: "Packing: 1/pc poly bag; 5 layers color reinforced inner box; 5 layers master carton."
  };
}

function loadDocSettings() {
  try {
    return { ...defaultDocSettings(), ...(JSON.parse(localStorage.getItem(DOC_STORAGE_KEY) || "{}")) };
  } catch {
    return defaultDocSettings();
  }
}

function persistDocSettings() {
  localStorage.setItem(DOC_STORAGE_KEY, JSON.stringify(state.docSettings));
}

function normalizeMixedItem(item) {
  const normalized = {
    ...item,
    nested: Boolean(item.nested),
    packagingSize: item.packagingSize || inferPackagingSizeFromName(item.name)
  };
  if (!normalized.name?.includes("感应垃圾桶")) return normalized;
  return {
    ...normalized,
    logistics: {
      ...(normalized.logistics || {}),
      cartonQty: 1,
      cartonSpec: "61*41*22.5",
      unitWeight: "7000g",
      cbm: 0.0562725
    }
  };
}

function persistMixedItems() {
  localStorage.setItem(MIX_STORAGE_KEY, JSON.stringify(state.mixedItems));
}

function mergeSavedProducts(savedProducts) {
  return initialProducts.map((product) => {
    const savedProduct = savedProducts.find((item) => item.id === product.id);
    if (!savedProduct) return structuredClone(product);

    return {
      ...structuredClone(product),
      options: product.options.map((option) => {
        const savedOption = savedProduct.options?.find((item) => item.id === option.id);
        if (!savedOption) return structuredClone(option);

        return {
          ...structuredClone(option),
          price: savedOption.price ?? option.price,
          prices: applyPriceOverrides(product.id, option.id, {
            ...(option.prices || {}),
            ...(savedOption.prices || {})
          })
        };
      })
    };
  });
}

function applyPriceOverrides(productId, optionId, optionPrices) {
  if (productId === "indoor-bin" && optionId === "painted") {
    return { ...optionPrices, ...prices(paintedTrashCanPrices()) };
  }
  if (productId !== "toilet-brush") return optionPrices;
  if (optionId === "large") {
    return { ...optionPrices, ...prices(toiletBrushBlackWhitePrices(7.3)) };
  }
  if (optionId === "small") {
    return { ...optionPrices, ...prices(toiletBrushBlackWhitePrices(6.9)) };
  }
  return optionPrices;
}

function persistProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 11, products: state.products }));
  flashSaved();
}

function flashSaved(text = "已自动保存") {
  elements.saveStatus.textContent = text;
  clearTimeout(flashSaved.timer);
  flashSaved.timer = setTimeout(() => {
    elements.saveStatus.textContent = "已自动保存";
  }, 1600);
}

function currentProduct() {
  return state.products.find((product) => product.id === state.productId);
}

function currentOption() {
  return currentProduct().options.find((option) => option.id === state.optionId);
}

function selectFirstOption(product) {
  const option = product.options[0];
  state.optionId = option.id;
  selectDefaultConfigs(option);
}

function selectDefaultConfigs(option) {
  state.configSelections = {};
  visibleConfigGroups(option).forEach((group) => {
    state.configSelections[group.id] = group.items[0].id;
  });
}

function isConfigGroupVisible(group) {
  if (!group.showWhen) return true;
  return Object.entries(group.showWhen).every(([groupId, expected]) => {
    const expectedValues = Array.isArray(expected) ? expected : [expected];
    return expectedValues.includes(state.configSelections[groupId]);
  });
}

function visibleConfigGroups(option = currentOption()) {
  const groups = Array.isArray(option.configGroups) ? option.configGroups : [];
  if (currentProduct().id === "outdoor-bin") return groups.filter(isConfigGroupVisible);
  return [...groups, PACKAGING_GROUP].filter(isConfigGroupVisible);
}

function selectedConfigItems() {
  const option = currentOption();
  return visibleConfigGroups(option).map((group) => {
    const selectedId = state.configSelections[group.id] || group.items[0].id;
    return group.items.find((item) => item.id === selectedId) || group.items[0];
  });
}

function configPriceKey() {
  const option = currentOption();
  return visibleConfigGroups(option)
    .filter((group) => group.affectsPrice !== false)
    .map((group) => `${group.id}:${state.configSelections[group.id] || group.items[0].id}`)
    .join("|");
}

function logisticsPriceKey() {
  const option = currentOption();
  return visibleConfigGroups(option)
    .filter((group) => group.affectsLogistics !== false)
    .map((group) => `${group.id}:${state.configSelections[group.id] || group.items[0].id}`)
    .join("|");
}

function currentLogistics() {
  const option = currentOption();
  return option.logisticsByKey?.[logisticsPriceKey()] || option.logistics || null;
}

function directSavedPrice(option = currentOption(), key = configPriceKey()) {
  if (!option.prices || !Object.prototype.hasOwnProperty.call(option.prices, key)) return null;
  return option.prices[key];
}

function softCloseBaseKey() {
  if (state.configSelections.softClose !== "soft-close") return null;
  const option = currentOption();
  return visibleConfigGroups(option)
    .filter((group) => group.affectsPrice !== false)
    .map((group) => {
      const selectedId = group.id === "softClose" ? "standard" : state.configSelections[group.id] || group.items[0].id;
      return `${group.id}:${selectedId}`;
    })
    .join("|");
}

function bambooEmbossedBaseKey() {
  if (currentOption().id !== "bamboo-lid") return null;
  if (state.configSelections.pattern !== "embossed") return null;
  return visibleConfigGroups(currentOption())
    .filter((group) => group.affectsPrice !== false)
    .map((group) => {
      const selectedId = group.id === "pattern" ? "plain" : state.configSelections[group.id] || group.items[0].id;
      return `${group.id}:${selectedId}`;
    })
    .join("|");
}

function bambooEmbossedStandardBaseKey() {
  if (currentOption().id !== "bamboo-lid") return null;
  if (state.configSelections.pattern !== "embossed" || state.configSelections.softClose !== "soft-close") return null;
  return visibleConfigGroups(currentOption())
    .filter((group) => group.affectsPrice !== false)
    .map((group) => {
      const selectedId =
        group.id === "pattern"
          ? "plain"
          : group.id === "softClose"
            ? "standard"
            : state.configSelections[group.id] || group.items[0].id;
      return `${group.id}:${selectedId}`;
    })
    .join("|");
}

function selectedPackagingId() {
  const hasPackaging = visibleConfigGroups().some((group) => group.id === "packaging");
  if (!hasPackaging) return "no-color-box";
  return state.configSelections.packaging || "no-color-box";
}

function currentPackagingSize() {
  const product = currentProduct();
  const option = currentOption();
  if (product.id === "indoor-bin" && option.id === "square") return "5l";
  if (product.id === "indoor-bin" && state.configSelections.size) return state.configSelections.size;
  return null;
}

function packagingAddonsFor(sizeId) {
  return PACKAGING_SIZE_ADDONS[sizeId] || DEFAULT_PACKAGING_ADDONS;
}

function inferPackagingSizeFromName(name = "") {
  if (name.includes("方形垃圾桶")) return "5l";
  const match = name.match(/(?:^|[^0-9])(?:3|5|8|12|20|30)L/i);
  return match ? match[0].replace(/[^0-9]/g, "") + "l" : null;
}

function packagingCostById(packagingId, quantity, sizeId = null) {
  const addons = packagingAddonsFor(sizeId);
  if (packagingId === "color-box") return 400 / quantity + addons.colorBox;
  if (packagingId === "thick-box") return 400 / quantity + addons.thickBox;
  if (packagingId === "thick-color-box") return 400 / quantity + addons.colorBox + addons.thickBox;
  return 0;
}

function packagingCostPerUnit(quantity) {
  return packagingCostById(selectedPackagingId(), quantity, currentPackagingSize());
}

function fobInfo(logisticsInfo) {
  if (!logisticsInfo?.cbm || !logisticsInfo?.cartonQty) return null;
  const container = CONTAINERS[state.containerId] || CONTAINERS["40hq"];
  const units = (container.volume / logisticsInfo.cbm) * logisticsInfo.cartonQty;
  return { container, units, cost: container.price / units };
}

function currentSavedPrice() {
  const option = currentOption();
  if (visibleConfigGroups(option).length > 0) {
    const savedPrice = directSavedPrice(option);
    if (savedPrice !== null) return savedPrice;

    const embossedStandardBaseKey = bambooEmbossedStandardBaseKey();
    const embossedStandardBasePrice = embossedStandardBaseKey ? directSavedPrice(option, embossedStandardBaseKey) : null;
    if (embossedStandardBasePrice !== null) return embossedStandardBasePrice + 2;

    const baseKey = softCloseBaseKey();
    const basePrice = baseKey ? directSavedPrice(option, baseKey) : null;
    if (basePrice !== null) return basePrice + 1;

    const embossedBaseKey = bambooEmbossedBaseKey();
    const embossedBasePrice = embossedBaseKey ? directSavedPrice(option, embossedBaseKey) : null;
    if (embossedBasePrice !== null) return embossedBasePrice + 1;

    return option.price || 0;
  }
  return option.price || 0;
}

function saveCurrentPrice(price) {
  const option = currentOption();
  if (visibleConfigGroups(option).length > 0) {
    option.prices = option.prices || {};
    option.prices[configPriceKey()] = price;
    return;
  }
  option.price = price;
}

function formatCny(value) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2
  }).format(value);
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(value);
}

function numberFromInput(input, fallback = 0) {
  const value = Number.parseFloat(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToHtml(value = "") {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function formatDateForDoc(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return escapeHtml(value);
  return `${day}-${month}-${year}`;
}

function safeFilename(value) {
  return String(value || "document").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_");
}

function parseCartonSpec(spec = "") {
  const nums = String(spec).match(/\d+(?:\.\d+)?/g) || [];
  const [length, width, height] = nums.map(Number);
  return {
    length: Number.isFinite(length) ? length : "",
    width: Number.isFinite(width) ? width : "",
    height: Number.isFinite(height) ? height : ""
  };
}

function parseWeightKg(value = "") {
  const number = Number.parseFloat(String(value).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(number)) return "";
  return String(value).toLowerCase().includes("kg") ? number : number / 1000;
}

function fixedNumber(value, digits = 2) {
  return Number.isFinite(value) ? Number(value).toFixed(digits) : "";
}

function downloadTextFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function syncDocSettingsToForm() {
  elements.docPiNo.value = state.docSettings.piNo || "";
  elements.docDate.value = state.docSettings.date || todayIso();
  elements.docBuyerName.value = state.docSettings.buyerName || "";
  elements.docBuyerContact.value = state.docSettings.buyerContact || "";
  elements.docBuyerAddress.value = state.docSettings.buyerAddress || "";
  elements.docBuyerTaxId.value = state.docSettings.buyerTaxId || "";
  elements.docSellerName.value = state.docSettings.sellerName || "";
  elements.docPort.value = state.docSettings.port || "Ningbo";
  elements.docDepositRate.value = state.docSettings.depositRate ?? 30;
  elements.docPayment.value = state.docSettings.payment || "";
  elements.docShipment.value = state.docSettings.shipment || "";
  elements.docPacking.value = state.docSettings.packing || "";
}

function readDocSettingsFromForm() {
  state.docSettings = {
    piNo: elements.docPiNo.value.trim(),
    date: elements.docDate.value,
    buyerName: elements.docBuyerName.value.trim(),
    buyerContact: elements.docBuyerContact.value.trim(),
    buyerAddress: elements.docBuyerAddress.value.trim(),
    buyerTaxId: elements.docBuyerTaxId.value.trim(),
    sellerName: elements.docSellerName.value.trim(),
    port: elements.docPort.value.trim() || "Ningbo",
    depositRate: Math.max(0, Math.min(100, numberFromInput(elements.docDepositRate, 30))),
    payment: elements.docPayment.value.trim(),
    shipment: elements.docShipment.value.trim(),
    packing: elements.docPacking.value.trim()
  };
  persistDocSettings();
  return state.docSettings;
}

function imagePreviewHtml(dataUrl, alt = "Product photo") {
  if (!dataUrl) return "";
  return `<img src="${dataUrl}" alt="${escapeHtml(alt)}">`;
}

function volumeLabelFromName(name = "") {
  const match = String(name).match(/(?:^|[^0-9])(?:3|5|8|12|20|30|50|100|120|240)L/i);
  return match ? `${match[0].replace(/[^0-9]/g, "")}L` : "";
}

function packagingLabel(packagingId, nested = false) {
  const labels = {
    "no-color-box": nested ? "Nested inside larger item" : "1/pc poly bag",
    "color-box": "1/pc color box; 5 layers master carton",
    "thick-box": "1/pc reinforced inner box; 5 layers master carton",
    "thick-color-box": "1/pc reinforced color box; 5 layers master carton"
  };
  return labels[packagingId] || "1/pc poly bag";
}

function englishDescription(name = "") {
  const size = volumeLabelFromName(name);
  const prefix = size ? `${Number.parseInt(size, 10)} Liter ` : "";
  if (name.includes("不锈钢脚踏垃圾桶")) return `${prefix}Stainless Steel Pedal Trash Can`;
  if (name.includes("喷漆垃圾桶")) return `${prefix}Painted Pedal Trash Can`;
  if (name.includes("竹盖垃圾桶")) return `${prefix}Bamboo Lid Trash Can`;
  if (name.includes("方形垃圾桶")) return "Square Trash Can";
  if (name.includes("感应垃圾桶")) return "Sensor Trash Can";
  if (name.includes("马桶刷")) return `${name.includes("大号") ? "Large" : name.includes("小号") ? "Small" : ""} Toilet Brush`.trim();
  if (name.includes("户外垃圾桶")) return `${prefix}Outdoor Trash Bin`;
  return name;
}

function materialDescription(name = "") {
  if (name.includes("不锈钢")) return "401 Stainless Steel";
  if (name.includes("竹盖")) return "Metal body with bamboo lid";
  if (name.includes("马桶刷")) return "Stainless steel / PP";
  if (name.includes("感应")) return "Stainless steel / electronic sensor";
  return "";
}

function finishingDescription(name = "") {
  if (name.includes("喷漆")) return "Painted finish";
  if (name.includes("黑白")) return "Black and white";
  if (name.includes("银色") || name.includes("不锈钢")) return "Chrome";
  if (name.includes("竹盖")) return "Bamboo lid";
  return "";
}

function imageFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 520;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setExchangeRateStatus(text) {
  elements.exchangeRateStatus.textContent = text;
}

async function updateExchangeRate(isAutomatic = false) {
  setExchangeRateStatus(isAutomatic ? "正在自动更新..." : "正在更新...");
  try {
    let latest = null;
    for (const provider of EXCHANGE_RATE_PROVIDERS) {
      try {
        const response = await fetch(provider.url, { cache: "no-store" });
        if (!response.ok) continue;
        const parsed = provider.parse(await response.json());
        if (Number.isFinite(parsed.rate) && parsed.rate > 0) {
          latest = parsed;
          break;
        }
      } catch {
        // Try the next provider.
      }
    }
    if (!latest) throw new Error("No exchange rate provider available");

    elements.exchangeRate.value = latest.rate.toFixed(4);
    state.exchangeRate = latest.rate;
    setExchangeRateStatus(`已更新 ${latest.date || "最新"}`);
    renderSummary();
  } catch {
    setExchangeRateStatus(isAutomatic ? "自动更新失败，可手动输入" : "更新失败，可手动输入");
  }
}

function renderProducts() {
  elements.productGrid.innerHTML = "";
  state.products.forEach((product) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-card";
    button.dataset.active = product.id === state.productId;
    button.innerHTML = `<strong>${product.name}</strong><span>${product.hint}</span>`;
    button.addEventListener("click", () => {
      state.productId = product.id;
      selectFirstOption(product);
      syncUnitPrice();
      render();
    });
    elements.productGrid.append(button);
  });
}

function renderOptions() {
  const product = currentProduct();
  elements.optionTitle.textContent = product.id === "indoor-bin" ? "选择室内垃圾桶款式" : `${product.name}规格`;
  elements.optionGrid.innerHTML = "";
  product.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.dataset.active = option.id === state.optionId;
    button.textContent = option.label;
    button.addEventListener("click", () => {
      state.optionId = option.id;
      selectDefaultConfigs(option);
      syncUnitPrice();
      render();
    });
    elements.optionGrid.append(button);
  });
}

function renderModifiers() {
  const option = currentOption();
  const groups = visibleConfigGroups(option);
  if (groups.length === 0) {
    elements.modifierWrap.hidden = true;
    elements.modifierWrap.innerHTML = "";
    return;
  }

  elements.modifierWrap.hidden = false;
  elements.modifierWrap.innerHTML = "";
  groups.forEach((group) => {
    const groupEl = document.createElement("div");
    groupEl.className = "modifier-group";

    const title = document.createElement("p");
    title.className = "modifier-title";
    title.textContent = group.title;
    groupEl.append(title);

    const grid = document.createElement("div");
    grid.className = "modifier-grid";
    const selectedId = state.configSelections[group.id] || group.items[0].id;

    group.items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "modifier-button";
      button.dataset.active = item.id === selectedId;
      button.textContent = item.label;
      button.addEventListener("click", () => {
        state.configSelections[group.id] = item.id;
        syncUnitPrice();
        render();
      });
      grid.append(button);
    });

    groupEl.append(grid);
    elements.modifierWrap.append(groupEl);
  });
}

function syncUnitPrice() {
  elements.unitPrice.value = currentSavedPrice() || "";
}

function calculate() {
  state.containerId = elements.containerType.value;
  state.includeFob = elements.includeFob.checked;
  const logisticsInfo = currentLogistics();
  const currentFobInfo = fobInfo(logisticsInfo);
  const savedUnitPrice = numberFromInput(elements.unitPrice);
  const discountInput = elements.discountPrice.value.trim();
  const discountPrice = discountInput === "" ? null : Math.max(0, numberFromInput(elements.discountPrice));
  const unitPrice = discountPrice === null ? savedUnitPrice : discountPrice;
  const quantity = Math.max(1, Math.round(numberFromInput(elements.quantity, 1)));
  const margin = 0;
  const extraCost = Math.max(0, numberFromInput(elements.extraCost));
  const exchangeRate = Math.max(0.1, numberFromInput(elements.exchangeRate, 7.2));
  const packagingCost = packagingCostPerUnit(quantity);
  const fobCost = currentFobInfo?.cost || 0;
  const baseUnitCost = unitPrice + packagingCost;
  const unitCost = state.includeFob ? baseUnitCost + fobCost : baseUnitCost;
  const unitWithMargin = unitCost * (1 + margin / 100);
  const totalCny = unitWithMargin * quantity + extraCost;
  const totalUsd = totalCny / exchangeRate;
  const fobUnitCost = baseUnitCost + fobCost;
  const fobUnitWithMargin = currentFobInfo ? fobUnitCost * (1 + margin / 100) : null;
  const fobUnitUsd = fobUnitWithMargin === null ? null : fobUnitWithMargin / exchangeRate;
  const fobTotalCny = fobUnitWithMargin === null ? null : fobUnitWithMargin * quantity + extraCost;
  const fobTotalUsd = fobTotalCny === null ? null : fobTotalCny / exchangeRate;

  state.quantity = quantity;
  state.margin = margin;
  state.extraCost = extraCost;
  state.exchangeRate = exchangeRate;

  return {
    savedUnitPrice,
    discountPrice,
    unitPrice,
    packagingCost,
    fobCost,
    fobUnits: currentFobInfo?.units || null,
    unitCost,
    baseUnitCost,
    quantity,
    margin,
    extraCost,
    exchangeRate,
    unitWithMargin,
    totalCny,
    totalUsd,
    fobUnitWithMargin,
    fobUnitUsd,
    fobTotalCny,
    fobTotalUsd
  };
}

function currentSelectionLabel() {
  const product = currentProduct();
  const option = currentOption();
  const configItems = selectedConfigItems();
  return [product.name, option.label, ...configItems.map((item) => item.label)].join(" · ");
}

function addCurrentToMixed() {
  const logisticsInfo = currentLogistics();
  if (!logisticsInfo?.cbm || !logisticsInfo?.cartonQty) {
    flashSaved("这个产品缺少外箱资料");
    return;
  }

  const result = calculate();
  const id = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  state.mixedItems.push({
    id,
    name: currentSelectionLabel(),
    quantity: result.quantity,
    unitPrice: result.unitPrice,
    packagingId: selectedPackagingId(),
    packagingSize: currentPackagingSize(),
    nested: false,
    logistics: {
      cartonQty: logisticsInfo.cartonQty,
      cartonSpec: logisticsInfo.cartonSpec,
      unitWeight: logisticsInfo.unitWeight,
      cbm: logisticsInfo.cbm
    }
  });
  persistMixedItems();
  renderMixedFob();
  flashSaved("已加入混装");
}

function calculateMixedFob() {
  const container = CONTAINERS[state.containerId] || CONTAINERS["40hq"];
  const lines = state.mixedItems.map((rawItem) => {
    const item = normalizeMixedItem(rawItem);
    const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
    const cartonQty = Number(item.logistics?.cartonQty) || 0;
    const cartonCbm = Number(item.logistics?.cbm) || 0;
    const nested = Boolean(item.nested);
    const totalCbm = nested ? 0 : cartonQty && cartonCbm ? (quantity / cartonQty) * cartonCbm : 0;
    const packagingCost = packagingCostById(item.packagingId, quantity, item.packagingSize || inferPackagingSizeFromName(item.name));
    const baseUnitCost = Number(item.unitPrice || 0) + packagingCost;
    return {
      ...item,
      quantity,
      nested,
      totalCbm,
      packagingCost,
      baseUnitCost,
      freightShare: 0,
      freightTotal: 0,
      freightPerUnit: 0,
      fobUnitPrice: baseUnitCost,
      fobTotalPrice: baseUnitCost * quantity
    };
  });

  const totalCbm = lines.reduce((sum, line) => sum + line.totalCbm, 0);
  lines.forEach((line) => {
    if (!totalCbm || !line.totalCbm) return;
    line.freightShare = line.totalCbm / totalCbm;
    line.freightTotal = container.price * line.freightShare;
    line.freightPerUnit = line.freightTotal / line.quantity;
    line.fobUnitPrice = line.baseUnitCost + line.freightPerUnit;
    line.fobTotalPrice = line.fobUnitPrice * line.quantity;
  });

  return {
    container,
    lines,
    totalCbm,
    usage: container.volume ? totalCbm / container.volume : 0,
    freightTotal: totalCbm ? container.price : 0
  };
}

function renderMixedFob() {
  const mixed = calculateMixedFob();
  elements.mixedTotalCbm.textContent = mixed.totalCbm.toFixed(3);
  elements.mixedContainerUsage.textContent = `${Math.round(mixed.usage * 100)}%`;
  elements.mixedContainerUsage.dataset.warning = mixed.usage > 1 ? "true" : "false";
  elements.mixedFreightTotal.textContent = formatCny(mixed.freightTotal);
  elements.mixedList.innerHTML = "";
  elements.mixedEmpty.hidden = state.mixedItems.length > 0;

  mixed.lines.forEach((line) => {
    const row = document.createElement("article");
    row.className = "mixed-item";

    const main = document.createElement("div");
    main.className = "mixed-item-main";
    const title = document.createElement("strong");
    title.textContent = line.name;
    const meta = document.createElement("span");
    meta.textContent = `外箱 ${line.logistics?.cartonSpec || "待填写"} · ${line.logistics?.cartonQty || "待填写"} / 箱${line.nested ? " · 嵌套不占CBM" : ""}`;
    main.append(title, meta);

    const quantityLabel = document.createElement("label");
    quantityLabel.className = "mixed-quantity";
    const quantityText = document.createElement("span");
    quantityText.textContent = "数量";
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.step = "1";
    quantityInput.value = String(line.quantity);
    quantityInput.addEventListener("change", () => {
      line.quantity = Math.max(1, Math.round(Number(quantityInput.value) || 1));
      const saved = state.mixedItems.find((item) => item.id === line.id);
      if (saved) saved.quantity = line.quantity;
      persistMixedItems();
      renderMixedFob();
    });
    quantityLabel.append(quantityText, quantityInput);

    const nestedLabel = document.createElement("label");
    nestedLabel.className = "mixed-nested";
    const nestedInput = document.createElement("input");
    nestedInput.type = "checkbox";
    nestedInput.checked = line.nested;
    const nestedText = document.createElement("span");
    nestedText.textContent = "嵌套不占CBM";
    nestedInput.addEventListener("change", () => {
      const saved = state.mixedItems.find((item) => item.id === line.id);
      if (saved) saved.nested = nestedInput.checked;
      persistMixedItems();
      renderMixedFob();
    });
    nestedLabel.append(nestedInput, nestedText);

    const imageLabel = document.createElement("label");
    imageLabel.className = "mixed-image";
    const imageBox = line.imageData
      ? document.createElement("img")
      : document.createElement("span");
    if (line.imageData) {
      imageBox.src = line.imageData;
      imageBox.alt = line.name;
    } else {
      imageBox.className = "mixed-image-placeholder";
      imageBox.textContent = "图片";
    }
    const imageText = document.createElement("span");
    imageText.textContent = line.imageData ? "更换图片" : "选择图片";
    const imageInput = document.createElement("input");
    imageInput.type = "file";
    imageInput.accept = "image/*";
    imageInput.addEventListener("change", async (event) => {
      const [file] = event.target.files;
      if (!file) return;
      try {
        const saved = state.mixedItems.find((item) => item.id === line.id);
        if (saved) {
          saved.imageData = await imageFileToDataUrl(file);
          persistMixedItems();
          renderMixedFob();
          flashSaved("图片已保存");
        }
      } catch {
        flashSaved("图片读取失败");
      }
    });
    imageLabel.append(imageBox, imageText, imageInput);

    const stats = document.createElement("dl");
    stats.className = "mixed-line-stats";
    [
      ["总CBM", line.totalCbm.toFixed(3)],
      ["FOB/个", formatCny(line.freightPerUnit)],
      ["FOB后单价", formatCny(line.fobUnitPrice)]
    ].forEach(([label, value]) => {
      const div = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      div.append(dt, dd);
      stats.append(div);
    });

    const remove = document.createElement("button");
    remove.className = "text-button";
    remove.type = "button";
    remove.textContent = "删除";
    remove.addEventListener("click", () => {
      state.mixedItems = state.mixedItems.filter((item) => item.id !== line.id);
      persistMixedItems();
      renderMixedFob();
    });

    row.append(main, quantityLabel, nestedLabel, imageLabel, stats, remove);
    elements.mixedList.append(row);
  });
}

function documentLines() {
  const exchangeRate = Math.max(0.1, numberFromInput(elements.exchangeRate, 7.2));
  return calculateMixedFob().lines.map((line, index) => {
    const dims = parseCartonSpec(line.logistics?.cartonSpec);
    const cartonQty = Number(line.logistics?.cartonQty) || 0;
    const cartonCbm = Number(line.logistics?.cbm) || 0;
    const orderQty = line.quantity;
    const cartonCount = cartonQty ? Math.ceil(orderQty / cartonQty) : 0;
    const container = CONTAINERS[state.containerId] || CONTAINERS["40hq"];
    const containerCapacity = cartonCbm && cartonQty ? (container.volume / cartonCbm) * cartonQty : 0;
    const unitUsd = line.fobUnitPrice / exchangeRate;
    const totalUsd = unitUsd * orderQty;
    const unitWeightKg = parseWeightKg(line.logistics?.unitWeight);
    const cartonWeightKg = unitWeightKg === "" || !cartonQty ? "" : unitWeightKg * cartonQty;
    return {
      no: index + 1,
      name: line.name,
      description: englishDescription(line.name),
      volume: volumeLabelFromName(line.name),
      material: materialDescription(line.name),
      finishing: finishingDescription(line.name),
      packagingText: packagingLabel(line.packagingId, line.nested),
      imageData: line.imageData || "",
      packagingId: line.packagingId,
      cartonQty,
      cartonSpec: line.logistics?.cartonSpec || "",
      length: dims.length,
      width: dims.width,
      height: dims.height,
      cartonCbm,
      containerCapacity,
      unitWeightKg,
      cartonWeightKg,
      cartonCount,
      orderQty,
      totalCbm: line.totalCbm,
      productUnitRmb: Number(line.unitPrice || 0),
      packagingCost: line.packagingCost,
      baseUnitRmb: line.baseUnitCost,
      unitRmb: line.fobUnitPrice,
      unitUsd,
      totalUsd,
      nested: line.nested
    };
  });
}

function documentTotals(lines) {
  return {
    totalQty: lines.reduce((sum, line) => sum + line.orderQty, 0),
    totalCartons: lines.reduce((sum, line) => sum + line.cartonCount, 0),
    totalCbm: lines.reduce((sum, line) => sum + line.totalCbm, 0),
    totalUsd: lines.reduce((sum, line) => sum + line.totalUsd, 0)
  };
}

function ensureDocumentLines() {
  const lines = documentLines();
  if (lines.length) return lines;
  flashSaved("请先加入混装");
  return null;
}

function buildPiHtml(lines, settings = readDocSettingsFromForm()) {
  const totals = documentTotals(lines);
  const deposit = totals.totalUsd * (settings.depositRate / 100);
  const rows = lines.map((line) => `
    <tr>
      <td class="center">${line.no}</td>
      <td class="photo-cell">${imagePreviewHtml(line.imageData, line.name)}</td>
      <td>
        <strong>${escapeHtml(line.description)}</strong><br>
        ${escapeHtml(line.material)}${line.finishing ? `<br>Color/Finishing: ${escapeHtml(line.finishing)}` : ""}<br>
        Packing: ${escapeHtml(line.packagingText)}
        ${line.nested ? "<br><small>Nested inside larger item</small>" : ""}
      </td>
      <td class="center">${escapeHtml(line.volume)}</td>
      <td class="num">${line.orderQty}</td>
      <td class="num">US$${fixedNumber(line.unitUsd, 2)}</td>
      <td class="num">US$${fixedNumber(line.totalUsd, 2)}</td>
    </tr>
  `).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>PI ${escapeHtml(settings.piNo)}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#111;margin:24px;font-size:11px}
    .company{text-align:center;font-weight:bold;font-size:16px;line-height:1.4;margin-bottom:10px}
    .company span{display:block;font-size:11px;font-weight:normal}
    h1{text-align:center;font-size:20px;margin:8px 0 14px;letter-spacing:1px;text-decoration:underline}
    table{width:100%;border-collapse:collapse}
    td,th{border:1px solid #222;padding:5px;vertical-align:middle}
    th{background:#e9eef1}
    .header td{border:0;padding:3px 0}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:14px 0}
    .box{border:1px solid #222;padding:8px;min-height:92px;line-height:1.45}
    .box strong{display:block;margin-bottom:5px}
    .center{text-align:center}
    .num{text-align:right;white-space:nowrap}
    .photo-cell{width:86px;text-align:center}
    .photo-cell img{max-width:74px;max-height:58px;object-fit:contain}
    .totals{margin-top:10px;width:45%;margin-left:auto}
    .terms{margin-top:14px;line-height:1.55}
    .signature{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:44px}
    .signature div{border-top:1px solid #333;padding-top:6px;text-align:center}
    @media print{body{margin:14mm}.no-print{display:none}}
  </style>
</head>
<body>
  <div class="company">
    JINHUA WUHU INTERNATIONAL TRADE CO.,LTD
    <span>7TH FLOOR, JINDIAN TOWER, WUHU ROAD, HARDWARE CENTRE, YONGKANG, ZHEJIANG, CHINA.</span>
  </div>
  <table class="header">
    <tr><td><strong>PI NO.</strong> ${escapeHtml(settings.piNo)}</td><td class="num"><strong>DATE:</strong> ${formatDateForDoc(settings.date)}</td></tr>
  </table>
  <h1>PROFORMA_INVOICE</h1>
  <div class="two-col">
    <div class="box">
      <strong>SELLERS:</strong>
      Name: ${escapeHtml(settings.sellerName)}<br>
      ATTN: Wyatte Zhou<br>
      Email: wyatte@funzo.info<br>
      Tel: 86 183 9591 7159<br>
      ADD: Fangzhou Hardware Products Factory, No. 88 Feifeng Road, Yongkang City, Jinhua City, Zhejiang Province, China
    </div>
    <div class="box">
      <strong>BUYERS:</strong>
      Name: ${escapeHtml(settings.buyerName)}<br>
      Tel/Fax: ${escapeHtml(settings.buyerContact)}<br>
      ADD: ${textToHtml(settings.buyerAddress)}<br>
      ${settings.buyerTaxId ? `CNPJ/Tax ID: ${escapeHtml(settings.buyerTaxId)}` : ""}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>ITEM</th><th>PHOTO</th><th>DESCRIPTION</th><th>VOL</th><th>QTY</th><th>UNIT PRICE<br>FOB ${escapeHtml(settings.port)}</th><th>TOTAL USD</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <table class="totals">
    <tr><td>Total</td><td class="num">US$${fixedNumber(totals.totalUsd, 2)}</td></tr>
    <tr><td>${fixedNumber(settings.depositRate, 0)}% Deposit</td><td class="num">US$${fixedNumber(deposit, 2)}</td></tr>
  </table>
  <div class="terms">
    <strong>1. TIME OF SHIPMENT</strong><br>${textToHtml(settings.shipment)}<br>
    <strong>2. PORT OF LOADING</strong><br>${escapeHtml(settings.port)}<br>
    <strong>3. TERMS OF PAYMENT</strong><br>${textToHtml(settings.payment)}<br>
    <strong>4. PACKING</strong><br>${textToHtml(settings.packing)}<br>
    <strong>5. REMARK</strong><br>
    Beneficiary bank name: BANK OF CHINA, YONGKANG SUB BRANCH<br>
    Beneficiary bank Swift Code: BKCHCNBJ92H<br>
    Beneficiary Name: JINHUA WUHU INTERNATIONAL TRADE CO., LTD.<br>
    Beneficiary Account No.: 380558343961
  </div>
  <div class="signature"><div>SELLER: (STAMP)</div><div>BUYER: (STAMP)</div></div>
</body>
</html>`;
}

function buildPackingListHtml(lines, settings = readDocSettingsFromForm()) {
  const totals = documentTotals(lines);
  const detailRows = [
    ["Name:", (line) => line.description],
    ["Size:", (line) => line.volume || line.name],
    ["Material:", (line) => line.material],
    ["Finishing:", (line) => line.finishing],
    ["Packaging:", (line) => line.packagingText],
    ["RMB Price:", (line) => fixedNumber(line.baseUnitRmb, 2)],
    ["FOB RMB Price:", (line) => fixedNumber(line.unitRmb, 2)],
    ["Remark:", (line) => line.nested ? "Nested inside larger item; no extra CBM" : ""]
  ];
  const rows = lines.map((line) => detailRows.map(([label, getter], rowIndex) => `
    <tr>
      ${rowIndex === 0 ? `<td rowspan="8" class="photo">${imagePreviewHtml(line.imageData, line.name)}</td>` : ""}
      <td class="label">${label}</td>
      <td>${escapeHtml(getter(line))}</td>
      ${rowIndex === 0 ? `
        <td rowspan="8" class="num">${fixedNumber(line.unitUsd, 2)}</td>
        <td rowspan="8" class="num">${line.cartonQty || ""}</td>
        <td rowspan="8" class="num">${line.length}</td>
        <td rowspan="8" class="num">${line.width}</td>
        <td rowspan="8" class="num">${line.height}</td>
        <td rowspan="8" class="num">${fixedNumber(line.cartonCbm, 4)}</td>
        <td rowspan="8" class="num">${line.unitWeightKg === "" ? "" : fixedNumber(line.unitWeightKg, 3)}</td>
        <td rowspan="8" class="num">${line.cartonWeightKg === "" ? "" : fixedNumber(line.cartonWeightKg, 2)}</td>
        <td rowspan="8" class="num">${line.containerCapacity ? Math.floor(line.containerCapacity) : ""}</td>
        <td rowspan="8" class="num">${line.cartonCount || ""}</td>
        <td rowspan="8" class="num">${line.orderQty}</td>
        <td rowspan="8" class="num">${fixedNumber(line.totalUsd, 2)}</td>
        <td rowspan="8" class="num">${fixedNumber(line.totalCbm, 3)}</td>
      ` : ""}
    </tr>
  `).join("")).join("");
  return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
  <meta charset="utf-8">
  <style>
    table{border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px}
    td,th{border:1px solid #333;padding:6px;vertical-align:middle}
    th{background:#dbe9ee;font-weight:bold;text-align:center;white-space:pre-line}
    img{max-width:145px;max-height:112px;object-fit:contain}
    .photo{text-align:center;width:160px}
    .label{font-weight:bold;width:82px}
    .title{font-size:18px;font-weight:bold;text-align:center}
    .num{text-align:right}
  </style>
</head>
<body>
  <table>
    <colgroup>
      <col style="width:170px"><col style="width:90px"><col style="width:260px"><col style="width:95px"><col style="width:80px"><col style="width:58px"><col style="width:58px"><col style="width:58px"><col style="width:80px"><col style="width:80px"><col style="width:90px"><col style="width:70px"><col style="width:80px"><col style="width:80px"><col style="width:92px"><col style="width:75px">
    </colgroup>
    <tr><td class="title" colspan="16">Quotation Template - ${escapeHtml(CONTAINERS[state.containerId]?.label || "40HQ")}</td></tr>
    <tr><td colspan="2">PI NO.</td><td colspan="3">${escapeHtml(settings.piNo)}</td><td colspan="2">Date</td><td colspan="3">${formatDateForDoc(settings.date)}</td><td colspan="2">Buyer</td><td colspan="4">${escapeHtml(settings.buyerName)}</td></tr>
    <tr>
      <th rowspan="2">Photo</th><th colspan="2" rowspan="2">Description</th><th rowspan="2">FOB<br>${escapeHtml(settings.port)}<br>USD/Each</th><th rowspan="2">Packing<br>Qty/Ctn</th>
      <th colspan="3">Measurement</th><th rowspan="2">CTN<br>CBM</th><th rowspan="2">Unit<br>Weight<br>kg/pc</th><th rowspan="2">Carton<br>Weight<br>kg/ctn</th><th rowspan="2">QTY<br>${escapeHtml(CONTAINERS[state.containerId]?.label || "40HQ")}</th><th rowspan="2">Carton<br>QTY</th><th rowspan="2">Order<br>QTY</th><th rowspan="2">FOB TOTAL $</th><th rowspan="2">CBM</th>
    </tr>
    <tr>
      <th>L</th><th>W</th><th>H</th>
    </tr>
    ${rows}
    <tr><td colspan="12" class="num"><strong>Total</strong></td><td>${totals.totalCartons}</td><td>${totals.totalQty}</td><td>${fixedNumber(totals.totalUsd, 2)}</td><td>${fixedNumber(totals.totalCbm, 3)}</td></tr>
  </table>
</body>
</html>`;
}

function downloadPiFile() {
  const lines = ensureDocumentLines();
  if (!lines) return;
  const settings = readDocSettingsFromForm();
  downloadTextFile(`PI_${safeFilename(settings.piNo)}.html`, buildPiHtml(lines, settings), "text/html;charset=utf-8");
}

function printPiFile() {
  const lines = ensureDocumentLines();
  if (!lines) return;
  const settings = readDocSettingsFromForm();
  const win = window.open("", "_blank");
  if (!win) {
    flashSaved("浏览器阻止了打印窗口");
    return;
  }
  win.document.open();
  win.document.write(buildPiHtml(lines, settings));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

function downloadPackingListFile() {
  const lines = ensureDocumentLines();
  if (!lines) return;
  const settings = readDocSettingsFromForm();
  downloadTextFile(
    `Packing_Quotation_${safeFilename(settings.piNo)}.xls`,
    buildPackingListHtml(lines, settings),
    "application/vnd.ms-excel;charset=utf-8"
  );
}

function renderSummary() {
  const result = calculate();
  const logisticsInfo = currentLogistics();
  const selected = currentSelectionLabel();
  const mixed = calculateMixedFob();

  elements.selectedName.textContent = selected;
  elements.totalCny.textContent = formatCny(result.totalCny);
  elements.totalUsd.textContent = formatUsd(result.totalUsd);
  elements.unitWithMargin.textContent = formatCny(result.unitWithMargin);
  elements.packagingCost.textContent = formatCny(result.packagingCost);
  elements.fobCost.textContent = result.fobUnits ? formatCny(result.fobCost) : "待填写";
  elements.fobUnitWithMargin.textContent = result.fobUnitWithMargin === null ? "待填写" : formatCny(result.fobUnitWithMargin);
  elements.fobUnitUsd.textContent = result.fobUnitUsd === null ? "待填写" : formatUsd(result.fobUnitUsd);
  elements.fobTotalCny.textContent = result.fobTotalCny === null ? "待填写" : formatCny(result.fobTotalCny);
  elements.fobTotalUsd.textContent = result.fobTotalUsd === null ? "待填写" : formatUsd(result.fobTotalUsd);
  elements.containerUnits.textContent = result.fobUnits ? `${Math.floor(result.fobUnits).toLocaleString("zh-CN")} 件` : "待填写";
  elements.resultQty.textContent = String(result.quantity);
  elements.cartonSpec.textContent = logisticsInfo?.cartonSpec || "待填写";
  elements.cartonQty.textContent = logisticsInfo?.cartonQty ? `${logisticsInfo.cartonQty} / 箱` : "待填写";
  elements.unitWeight.textContent = logisticsInfo?.unitWeight || "待填写";
  elements.quoteText.textContent = [
    `产品：${selected}`,
    `原单价：${formatCny(result.savedUnitPrice)}`,
    `优惠后单价：${result.discountPrice === null ? "未使用" : formatCny(result.discountPrice)}`,
    `计入计算单价：${formatCny(result.unitPrice)}`,
    `包装加价/个：${formatCny(result.packagingCost)}`,
    `计价单价：${formatCny(result.unitCost)}`,
    `数量：${result.quantity}`,
    `包装/其他费用：${formatCny(result.extraCost)}`,
    `外箱尺寸：${logisticsInfo?.cartonSpec || "待填写"}`,
    `装箱量：${logisticsInfo?.cartonQty ? `${logisticsInfo.cartonQty} / 箱` : "待填写"}`,
    `单个重量：${logisticsInfo?.unitWeight || "待填写"}`,
    `FOB费用/个：${result.fobUnits ? formatCny(result.fobCost) : "待填写"}`,
    `FOB单个价格：${result.fobUnitWithMargin === null ? "待填写" : formatCny(result.fobUnitWithMargin)}`,
    `FOB单个美元：${result.fobUnitUsd === null ? "待填写" : formatUsd(result.fobUnitUsd)}`,
    `FOB人民币总价：${result.fobTotalCny === null ? "待填写" : formatCny(result.fobTotalCny)}`,
    `货柜可装：${result.fobUnits ? `${Math.floor(result.fobUnits).toLocaleString("zh-CN")} 件` : "待填写"}`,
    `混装总CBM：${mixed.totalCbm.toFixed(3)}`,
    `混装货柜占用：${Math.round(mixed.usage * 100)}%`,
    `合计：${formatCny(result.totalCny)}（约 ${formatUsd(result.totalUsd)}）`
  ].join("\n");
  renderMixedFob();
}

function render() {
  renderProducts();
  renderOptions();
  renderModifiers();
  renderSummary();
  exposeSavedData();
}

function exposeSavedData() {
  let dataNode = document.querySelector("#savedDataExport");
  if (!dataNode) {
    dataNode = document.createElement("pre");
    dataNode.id = "savedDataExport";
    dataNode.hidden = true;
    document.body.append(dataNode);
  }
  dataNode.textContent = JSON.stringify({ version: 11, products: state.products, mixedItems: state.mixedItems, docSettings: state.docSettings });
}

function bindInputs() {
  [elements.unitPrice, elements.discountPrice, elements.quantity, elements.extraCost, elements.exchangeRate].forEach((input) => {
    input.addEventListener("input", renderSummary);
  });

  elements.unitPrice.addEventListener("input", () => {
    if (elements.unitPrice.value.trim() === "") return;
    saveCurrentPrice(numberFromInput(elements.unitPrice));
    persistProducts();
    exposeSavedData();
  });

  elements.containerType.addEventListener("change", () => {
    state.containerId = elements.containerType.value;
    renderSummary();
  });

  elements.includeFob.addEventListener("change", () => {
    state.includeFob = elements.includeFob.checked;
    renderSummary();
  });

  elements.refreshExchangeRate.addEventListener("click", () => {
    updateExchangeRate(false);
  });

  elements.addMixedItem.addEventListener("click", addCurrentToMixed);

  [
    elements.docPiNo,
    elements.docDate,
    elements.docBuyerName,
    elements.docBuyerContact,
    elements.docBuyerAddress,
    elements.docBuyerTaxId,
    elements.docSellerName,
    elements.docPort,
    elements.docDepositRate,
    elements.docPayment,
    elements.docShipment,
    elements.docPacking
  ].forEach((input) => {
    input.addEventListener("input", readDocSettingsFromForm);
  });

  elements.downloadPi.addEventListener("click", downloadPiFile);
  elements.printPi.addEventListener("click", printPiFile);
  elements.downloadPackingList.addEventListener("click", downloadPackingListFile);

  elements.clearMixedItems.addEventListener("click", () => {
    state.mixedItems = [];
    persistMixedItems();
    renderMixedFob();
    flashSaved("混装已清空");
  });

  elements.savePrice.addEventListener("click", () => {
    saveCurrentPrice(numberFromInput(elements.unitPrice));
    persistProducts();
    render();
  });

  elements.copyQuote.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(elements.quoteText.textContent);
      flashSaved("报价已复制");
    } catch {
      flashSaved("复制失败");
    }
  });

  elements.resetPrices.addEventListener("click", () => {
    state.products = structuredClone(initialProducts);
    state.productId = "outdoor-bin";
    state.optionId = "30l";
    state.configSelections = {};
    syncUnitPrice();
    persistProducts();
    render();
  });

  elements.exportData.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ products: state.products, mixedItems: state.mixedItems, docSettings: state.docSettings }, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fangzhou-price-data.json";
    link.click();
    URL.revokeObjectURL(url);
  });

  elements.importData.addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!Array.isArray(imported.products)) throw new Error("Invalid data");
      state.products = mergeSavedProducts(imported.products);
      state.mixedItems = Array.isArray(imported.mixedItems)
        ? imported.mixedItems.map((item, index) => normalizeMixedItem({
            ...item,
            id: item.id || `imported-${Date.now()}-${index}`
          }))
        : state.mixedItems;
      state.docSettings = { ...state.docSettings, ...(imported.docSettings || {}) };
      state.productId = state.products[0].id;
      selectFirstOption(state.products[0]);
      syncUnitPrice();
      syncDocSettingsToForm();
      persistProducts();
      persistMixedItems();
      persistDocSettings();
      render();
      flashSaved("导入成功");
    } catch {
      flashSaved("导入失败");
    } finally {
      event.target.value = "";
    }
  });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  }).catch(() => {});
}

if ("caches" in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  }).catch(() => {});
}

syncUnitPrice();
syncDocSettingsToForm();
bindInputs();
render();
updateExchangeRate(true);
persistProducts();
