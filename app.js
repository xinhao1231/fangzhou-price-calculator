const STORAGE_KEY = "fangzhou-price-calculator-v11";
const MIX_STORAGE_KEY = "fangzhou-price-calculator-mixed-v1";
const DOC_STORAGE_KEY = "fangzhou-price-calculator-doc-v1";
const PI_VALIDITY_NOTE = "This quotation is valid for 7 days from the date of issue. Pricing may be subject to adjustment thereafter based on exchange rate fluctuations and material costs.";
const PI_OTHER_CONDITIONS = "The above pricing is based on an exchange rate of USD 1 = RMB 6.73. Should the exchange rate fluctuate by more than 2% at the time of payment, the price will be adjusted proportionally.";

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

const PORTUGUESE_PRODUCT_NAMES = {
  "outdoor-bin": "cesto de lixo externo",
  "indoor-bin|stainless-pedal": "cesto de lixo inox com pedal",
  "indoor-bin|painted": "cesto de lixo pintado com pedal",
  "indoor-bin|bamboo-lid": "cesto de lixo com tampa de bambu",
  "indoor-bin|square": "cesto de lixo quadrado",
  "indoor-bin|sensor": "cesto de lixo automático",
  "toilet-brush|large": "escova sanitária grande",
  "toilet-brush|small": "escova sanitária pequena"
};

const PRICE_TEXT_CRITICAL_CSS = `
.price-text-panel {
  margin-top: 16px !important;
  border: 1px solid #d8e5e5 !important;
  border-radius: 8px !important;
  padding: 14px !important;
  background: linear-gradient(180deg, #fbfefe 0%, #f4f8f7 100%) !important;
}
.price-text-head {
  display: flex !important;
  align-items: flex-start !important;
  justify-content: space-between !important;
  gap: 12px !important;
}
.price-text-head .summary-section-title {
  margin: 0 0 3px !important;
}
.price-text-head p {
  margin: 0 !important;
  color: #68777f !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  line-height: 1.35 !important;
}
.copy-price-button {
  flex: 0 0 auto !important;
  min-height: 34px !important;
  border: 1px solid rgba(31, 78, 95, 0.18) !important;
  border-radius: 8px !important;
  padding: 7px 12px !important;
  background: #1f4e5f !important;
  color: #fff !important;
  font-size: 12px !important;
  font-weight: 900 !important;
}
.price-text-name {
  margin-top: 12px !important;
}
.price-text-name input {
  width: 100% !important;
  min-height: 42px !important;
  border: 1px solid #d7e4e5 !important;
  border-radius: 8px !important;
  padding: 10px 12px !important;
  background: rgba(255, 255, 255, 0.92) !important;
  color: #17242b !important;
  font: inherit !important;
}
.price-text-options {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 8px !important;
  margin-top: 12px !important;
}
.price-text-choice {
  position: relative !important;
  display: grid !important;
  grid-template-columns: 1fr !important;
  align-items: center !important;
  gap: 4px !important;
  min-height: 54px !important;
  border: 1px solid #d7e4e5 !important;
  border-radius: 8px !important;
  padding: 9px 10px !important;
  background: rgba(255, 255, 255, 0.86) !important;
  cursor: pointer !important;
}
.price-text-choice[data-active="true"] {
  border-color: #799ca5 !important;
  background: #fff !important;
  box-shadow: 0 8px 18px rgba(31, 78, 95, 0.08) !important;
}
.price-text-choice[data-active="true"]::after {
  content: "" !important;
  position: absolute !important;
  top: 9px !important;
  right: 9px !important;
  width: 8px !important;
  height: 8px !important;
  border-radius: 999px !important;
  background: #1f4e5f !important;
}
.price-text-choice input {
  position: absolute !important;
  width: 1px !important;
  min-height: 1px !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
.price-text-choice span {
  color: #153844 !important;
  font-size: 13px !important;
  font-weight: 900 !important;
  overflow-wrap: anywhere !important;
}
.price-text-choice strong {
  color: #d96d4b !important;
  font-size: 12px !important;
  font-weight: 900 !important;
}
.price-text-output {
  width: 100% !important;
  min-height: 150px !important;
  margin-top: 12px !important;
  padding: 13px !important;
  border: 1px solid #d7e4e5 !important;
  border-radius: 8px !important;
  background: #fff !important;
  color: #223239 !important;
  font: inherit !important;
  font-size: 13px !important;
  line-height: 1.55 !important;
  resize: none !important;
  white-space: pre-line !important;
  outline: none !important;
  box-shadow: inset 0 1px 0 rgba(23, 36, 43, 0.03) !important;
}
@media (max-width: 700px) {
  .price-text-panel {
    padding: 12px !important;
  }
  .price-text-options {
    grid-template-columns: 1fr !important;
  }
}
`;

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
  docSettings: loadDocSettings(),
  priceTextSelectionKey: "",
  priceTextSelectedIds: new Set()
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
  priceTextProductName: document.querySelector("#priceTextProductName"),
  priceTextOptions: document.querySelector("#priceTextOptions"),
  priceTextOutput: document.querySelector("#priceTextOutput"),
  copyPriceText: document.querySelector("#copyPriceText"),
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
  docExportAgent: document.querySelector("#docExportAgent"),
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
    exportAgent: "JINHUA WUHU INTERNATIONAL TRADE CO.,LTD",
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

function isConfigGroupVisibleForSelections(group, selections = state.configSelections) {
  if (!group.showWhen) return true;
  return Object.entries(group.showWhen).every(([groupId, expected]) => {
    const expectedValues = Array.isArray(expected) ? expected : [expected];
    return expectedValues.includes(selections[groupId]);
  });
}

function isConfigGroupVisible(group) {
  return isConfigGroupVisibleForSelections(group);
}

function visibleConfigGroupsForSelections(option = currentOption(), selections = state.configSelections, product = currentProduct()) {
  const groups = Array.isArray(option.configGroups) ? option.configGroups : [];
  if (product.id === "outdoor-bin") return groups.filter((group) => isConfigGroupVisibleForSelections(group, selections));
  return [...groups, PACKAGING_GROUP].filter((group) => isConfigGroupVisibleForSelections(group, selections));
}

function visibleConfigGroups(option = currentOption()) {
  return visibleConfigGroupsForSelections(option);
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
  return configPriceKeyForSelections(option, state.configSelections);
}

function configPriceKeyForSelections(option, selections) {
  return visibleConfigGroupsForSelections(option, selections)
    .filter((group) => group.affectsPrice !== false)
    .map((group) => `${group.id}:${selections[group.id] || group.items[0].id}`)
    .join("|");
}

function logisticsPriceKey() {
  const option = currentOption();
  return logisticsPriceKeyForSelections(option, state.configSelections);
}

function logisticsPriceKeyForSelections(option, selections) {
  return visibleConfigGroupsForSelections(option, selections)
    .filter((group) => group.affectsLogistics !== false)
    .map((group) => `${group.id}:${selections[group.id] || group.items[0].id}`)
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

function configPriceKeyWithOverrides(option, selections, overrides = {}) {
  const nextSelections = { ...selections, ...overrides };
  return configPriceKeyForSelections(option, nextSelections);
}

function savedPriceForSelections(option = currentOption(), selections = state.configSelections) {
  if (visibleConfigGroupsForSelections(option, selections).length > 0) {
    const savedPrice = directSavedPrice(option, configPriceKeyForSelections(option, selections));
    if (savedPrice !== null) return savedPrice;

    if (option.id === "bamboo-lid" && selections.pattern === "embossed" && selections.softClose === "soft-close") {
      const baseKey = configPriceKeyWithOverrides(option, selections, { pattern: "plain", softClose: "standard" });
      const basePrice = directSavedPrice(option, baseKey);
      if (basePrice !== null) return basePrice + 2;
    }

    if (selections.softClose === "soft-close") {
      const baseKey = configPriceKeyWithOverrides(option, selections, { softClose: "standard" });
      const basePrice = directSavedPrice(option, baseKey);
      if (basePrice !== null) return basePrice + 1;
    }

    if (option.id === "bamboo-lid" && selections.pattern === "embossed") {
      const baseKey = configPriceKeyWithOverrides(option, selections, { pattern: "plain" });
      const basePrice = directSavedPrice(option, baseKey);
      if (basePrice !== null) return basePrice + 1;
    }

    return option.price || 0;
  }
  return option.price || 0;
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
  return savedPriceForSelections(currentOption(), state.configSelections);
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
  if (!year || !month || !day) return value;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = monthNames[Math.max(0, Math.min(11, Number(month) - 1))];
  return `${Number(day)}-${monthName}-${String(year).slice(-2)}`;
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

function formatPiUsd(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return `US$${number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function downloadTextFile(filename, content, type) {
  const blob = new Blob([content], { type });
  downloadBlobFile(filename, blob);
}

function downloadBlobFile(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function injectPriceTextCriticalStyles() {
  if (document.querySelector("#priceTextCriticalStyles")) return;
  const style = document.createElement("style");
  style.id = "priceTextCriticalStyles";
  style.textContent = PRICE_TEXT_CRITICAL_CSS;
  document.head.append(style);
}

function xmlEscape(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xlsxColumnName(index) {
  let column = "";
  let value = index;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    value = Math.floor((value - 1) / 26);
  }
  return column;
}

function xlsxCellRef(columnIndex, rowIndex) {
  return `${xlsxColumnName(columnIndex)}${rowIndex}`;
}

function xlsxBlankCell(columnIndex, rowIndex, style = 3) {
  return `<c r="${xlsxCellRef(columnIndex, rowIndex)}" s="${style}"/>`;
}

function xlsxStringCell(columnIndex, rowIndex, value, style = 3) {
  if (value === "" || value === null || value === undefined) return xlsxBlankCell(columnIndex, rowIndex, style);
  const preserved = String(value).startsWith(" ") || String(value).endsWith(" ");
  return `<c r="${xlsxCellRef(columnIndex, rowIndex)}" s="${style}" t="inlineStr"><is><t${preserved ? ' xml:space="preserve"' : ""}>${xmlEscape(value)}</t></is></c>`;
}

function xlsxNumberCell(columnIndex, rowIndex, value, style = 4) {
  const number = Number(value);
  if (!Number.isFinite(number)) return xlsxBlankCell(columnIndex, rowIndex, style);
  return `<c r="${xlsxCellRef(columnIndex, rowIndex)}" s="${style}"><v>${number}</v></c>`;
}

function xlsxFormulaCell(columnIndex, rowIndex, formula, cachedValue = "", style = 4) {
  const number = Number(cachedValue);
  const cached = Number.isFinite(number) ? `<v>${number}</v>` : "";
  return `<c r="${xlsxCellRef(columnIndex, rowIndex)}" s="${style}"><f>${xmlEscape(formula)}</f>${cached}</c>`;
}

function xlsxRow(rowIndex, cells, height = "", spans = "1:16") {
  const heightAttr = height ? ` ht="${height}" customHeight="1"` : "";
  return `<row r="${rowIndex}" spans="${spans}"${heightAttr}>${cells.join("")}</row>`;
}

function xlsxFullRow(rowIndex, cellMap = {}, defaultStyle = 3, height = "") {
  const cells = [];
  for (let column = 1; column <= 16; column += 1) {
    cells.push(cellMap[column] || xlsxBlankCell(column, rowIndex, defaultStyle));
  }
  return xlsxRow(rowIndex, cells, height);
}

function xlsxPiFullRow(rowIndex, cellMap = {}, defaultStyle = 20, height = "") {
  const cells = [];
  for (let column = 1; column <= 8; column += 1) {
    cells.push(cellMap[column] || xlsxBlankCell(column, rowIndex, defaultStyle));
  }
  return xlsxRow(rowIndex, cells, height, "1:8");
}

function xlsxPackingRow(rowIndex, cellMap = {}, height = "15") {
  const styles = {
    1: 7,
    2: 2,
    3: 3,
    4: 5,
    5: 6,
    6: 5,
    7: 5,
    8: 5,
    9: 5,
    10: 5,
    11: 5,
    12: 5,
    13: 10,
    14: 10,
    15: 9,
    16: 9
  };
  const cells = [];
  for (let column = 1; column <= 16; column += 1) {
    cells.push(cellMap[column] || xlsxBlankCell(column, rowIndex, styles[column] || 3));
  }
  return xlsxRow(rowIndex, cells, height);
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let j = 0; j < 8; j += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pushUint16LE(parts, value) {
  parts.push(value & 0xff, (value >>> 8) & 0xff);
}

function pushUint32LE(parts, value) {
  parts.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function concatUint8Arrays(parts, totalLength) {
  const output = new Uint8Array(totalLength);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function createStoredZip(files) {
  const encoder = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const data = typeof file.data === "string" ? encoder.encode(file.data) : file.data;
    const checksum = crc32(data);
    const localHeader = [];
    pushUint32LE(localHeader, 0x04034b50);
    pushUint16LE(localHeader, 20);
    pushUint16LE(localHeader, 0);
    pushUint16LE(localHeader, 0);
    pushUint16LE(localHeader, dosTime);
    pushUint16LE(localHeader, dosDate);
    pushUint32LE(localHeader, checksum);
    pushUint32LE(localHeader, data.length);
    pushUint32LE(localHeader, data.length);
    pushUint16LE(localHeader, nameBytes.length);
    pushUint16LE(localHeader, 0);
    const localHeaderBytes = Uint8Array.from(localHeader);
    localParts.push(localHeaderBytes, nameBytes, data);

    const centralHeader = [];
    pushUint32LE(centralHeader, 0x02014b50);
    pushUint16LE(centralHeader, 20);
    pushUint16LE(centralHeader, 20);
    pushUint16LE(centralHeader, 0);
    pushUint16LE(centralHeader, 0);
    pushUint16LE(centralHeader, dosTime);
    pushUint16LE(centralHeader, dosDate);
    pushUint32LE(centralHeader, checksum);
    pushUint32LE(centralHeader, data.length);
    pushUint32LE(centralHeader, data.length);
    pushUint16LE(centralHeader, nameBytes.length);
    pushUint16LE(centralHeader, 0);
    pushUint16LE(centralHeader, 0);
    pushUint16LE(centralHeader, 0);
    pushUint16LE(centralHeader, 0);
    pushUint32LE(centralHeader, 0);
    pushUint32LE(centralHeader, offset);
    centralParts.push(Uint8Array.from(centralHeader), nameBytes);

    offset += localHeaderBytes.length + nameBytes.length + data.length;
  });

  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endHeader = [];
  pushUint32LE(endHeader, 0x06054b50);
  pushUint16LE(endHeader, 0);
  pushUint16LE(endHeader, 0);
  pushUint16LE(endHeader, files.length);
  pushUint16LE(endHeader, files.length);
  pushUint32LE(endHeader, centralSize);
  pushUint32LE(endHeader, centralOffset);
  pushUint16LE(endHeader, 0);
  const endHeaderBytes = Uint8Array.from(endHeader);

  const allParts = [...localParts, ...centralParts, endHeaderBytes];
  const totalLength = allParts.reduce((sum, part) => sum + part.length, 0);
  return concatUint8Arrays(allParts, totalLength);
}

function dataUrlToBytes(dataUrl = "") {
  const match = String(dataUrl).match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1].toLowerCase();
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const extension = mimeType.includes("png") ? "png" : mimeType.includes("jpg") || mimeType.includes("jpeg") ? "jpeg" : "jpeg";
  return { bytes, mimeType, extension };
}

async function fetchAssetBytes(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const mimeType = blob.type || (path.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
    const extension = mimeType.includes("png") ? "png" : path.toLowerCase().endsWith(".jpg") ? "jpg" : "jpeg";
    return { bytes, mimeType, extension };
  } catch {
    return null;
  }
}

function syncDocSettingsToForm() {
  elements.docPiNo.value = state.docSettings.piNo || "";
  elements.docDate.value = state.docSettings.date || todayIso();
  elements.docBuyerName.value = state.docSettings.buyerName || "";
  elements.docBuyerContact.value = state.docSettings.buyerContact || "";
  elements.docBuyerAddress.value = state.docSettings.buyerAddress || "";
  elements.docBuyerTaxId.value = state.docSettings.buyerTaxId || "";
  elements.docSellerName.value = state.docSettings.sellerName || "";
  elements.docExportAgent.value = state.docSettings.exportAgent || "JINHUA WUHU INTERNATIONAL TRADE CO.,LTD";
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
    exportAgent: elements.docExportAgent.value.trim(),
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

function priceTextCurrentLineLabel() {
  const option = currentOption();
  const configItems = visibleConfigGroupsForSelections(option, state.configSelections)
    .filter((group) => group.affectsPrice !== false)
    .map((group) => {
      const selectedId = state.configSelections[group.id] || group.items[0].id;
      return group.items.find((item) => item.id === selectedId) || group.items[0];
    });
  return [option.label, ...configItems.map((item) => item.label)].join(" · ");
}

function defaultPortugueseProductName() {
  const product = currentProduct();
  const option = currentOption();
  return PORTUGUESE_PRODUCT_NAMES[`${product.id}|${option.id}`] || PORTUGUESE_PRODUCT_NAMES[product.id] || option.label;
}

function syncPriceTextProductName() {
  const key = `${state.productId}|${state.optionId}`;
  if (elements.priceTextProductName.dataset.selectionKey === key) return;
  elements.priceTextProductName.dataset.selectionKey = key;
  elements.priceTextProductName.value = defaultPortugueseProductName();
}

function priceTextCandidates() {
  const product = currentProduct();
  const option = currentOption();
  const groups = visibleConfigGroupsForSelections(option, state.configSelections, product);
  const sizeGroup = groups.find((group) => group.id === "size");

  if (sizeGroup) {
    return sizeGroup.items.map((item) => ({
      id: `size:${item.id}`,
      label: item.label,
      option,
      selections: { ...state.configSelections, size: item.id }
    }));
  }

  const simpleProductOptions = product.options.length > 1 && product.options.every((item) => !item.configGroups?.length);
  if (simpleProductOptions) {
    return product.options.map((item) => ({
      id: `option:${item.id}`,
      label: item.label,
      option: item,
      selections: {}
    }));
  }

  return [{
    id: "current",
    label: priceTextCurrentLineLabel(),
    option,
    selections: { ...state.configSelections }
  }];
}

function priceTextContextKey(candidates) {
  const option = currentOption();
  const hasSizeCandidates = candidates.some((candidate) => candidate.id.startsWith("size:"));
  const configKey = visibleConfigGroupsForSelections(option, state.configSelections)
    .filter((group) => group.affectsPrice !== false)
    .filter((group) => !(hasSizeCandidates && group.id === "size"))
    .map((group) => `${group.id}:${state.configSelections[group.id] || group.items[0].id}`)
    .join("|");
  return [state.productId, state.optionId, configKey, candidates.map((candidate) => candidate.id).join(",")].join("::");
}

function syncPriceTextSelectedIds(candidates) {
  const contextKey = priceTextContextKey(candidates);
  if (state.priceTextSelectionKey !== contextKey) {
    state.priceTextSelectionKey = contextKey;
    state.priceTextSelectedIds = new Set(candidates.map((candidate) => candidate.id));
    return;
  }

  const availableIds = new Set(candidates.map((candidate) => candidate.id));
  state.priceTextSelectedIds = new Set([...state.priceTextSelectedIds].filter((id) => availableIds.has(id)));
}

function formatPriceTextRmb(value) {
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatPriceTextUsd(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function priceTextIntro(productName) {
  const normalized = productName.trim().toLowerCase();
  const article = normalized.startsWith("escova") || normalized.startsWith("lixeira") ? "da" : "do";
  return `Segue abaixo o preço ${article} ${productName}:`;
}

function buildPortuguesePriceText(candidates = priceTextCandidates()) {
  const exchangeRate = Math.max(0.1, numberFromInput(elements.exchangeRate, 7.2));
  const selectedCandidates = candidates.filter((candidate) => state.priceTextSelectedIds.has(candidate.id));
  const productName = elements.priceTextProductName.value.trim() || defaultPortugueseProductName();

  if (!selectedCandidates.length) return "请选择需要复制的规格。";

  const lines = selectedCandidates.map((candidate) => {
    const price = Number(savedPriceForSelections(candidate.option, candidate.selections));
    if (!Number.isFinite(price) || price <= 0) return `${candidate.label}: preço a confirmar`;
    return `${candidate.label}: RMB ${formatPriceTextRmb(price)} / unidade ≈ USD ${formatPriceTextUsd(price / exchangeRate)} / unidade`;
  });

  return [priceTextIntro(productName), ...lines].join("\n");
}

function renderPriceTextOutput(candidates = priceTextCandidates()) {
  elements.priceTextOutput.value = buildPortuguesePriceText(candidates);
}

function renderPriceTextBuilder() {
  syncPriceTextProductName();
  const candidates = priceTextCandidates();
  syncPriceTextSelectedIds(candidates);
  elements.priceTextOptions.innerHTML = "";

  candidates.forEach((candidate) => {
    const price = Number(savedPriceForSelections(candidate.option, candidate.selections));
    const label = document.createElement("label");
    label.className = "price-text-choice";
    label.dataset.active = state.priceTextSelectedIds.has(candidate.id);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.priceTextSelectedIds.has(candidate.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.priceTextSelectedIds.add(candidate.id);
      } else {
        state.priceTextSelectedIds.delete(candidate.id);
      }
      label.dataset.active = checkbox.checked;
      renderPriceTextOutput(candidates);
    });

    const name = document.createElement("span");
    name.textContent = candidate.label;

    const priceLabel = document.createElement("strong");
    priceLabel.textContent = Number.isFinite(price) && price > 0 ? `RMB ${formatPriceTextRmb(price)}` : "待确认";

    label.append(checkbox, name, priceLabel);
    elements.priceTextOptions.append(label);
  });

  renderPriceTextOutput(candidates);
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
  const exportAgentName = settings.exportAgent || "JINHUA WUHU INTERNATIONAL TRADE CO.,LTD";
  const exportAgentAddress = "7TH FLOOR, JINDIAN TOWER, WUHU ROAD, HARDWARE CENTRE, YONGKANG, ZHEJIANG, CHINA.";
  const rows = lines.map((line) => `
    <tr>
      <td><strong>${escapeHtml(line.description)}</strong></td>
      <td>
        ${escapeHtml(line.material)}${line.finishing ? `<br>${escapeHtml(line.finishing)}` : ""}<br>
        Packing: ${escapeHtml(line.packagingText)}
        ${line.nested ? "<br><small>Nested inside larger item</small>" : ""}
      </td>
      <td class="center">${escapeHtml(line.volume)}</td>
      <td class="num">${line.orderQty}</td>
      <td class="num">${line.cartonCount || ""}</td>
      <td class="num">${fixedNumber(line.totalCbm, 2)}</td>
      <td class="num">${formatPiUsd(line.unitUsd)}</td>
      <td class="num">${formatPiUsd(line.totalUsd)}</td>
    </tr>
  `).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>PI ${escapeHtml(settings.piNo)}</title>
  <style>
    @page{size:A3 portrait;margin:12mm}
    body{font-family:Arial,sans-serif;color:#111;margin:24px;font-size:11px}
    .company{text-align:center;font-weight:bold;font-size:16px;line-height:1.4;margin-bottom:10px}
    .company span{display:block;font-size:11px;font-weight:normal}
    .validity-note{text-align:center;font-size:10px;font-style:italic;margin:0 0 8px}
    h1{text-align:center;font-size:20px;margin:6px 0 22px;letter-spacing:1px;text-decoration:underline}
    table{width:100%;border-collapse:collapse}
    td,th{border:1px solid #222;padding:5px;vertical-align:middle}
    th{font-weight:bold}
    .meta{width:38%;margin-left:auto;margin-top:-4px;margin-bottom:2px}
    .meta td{border:0;padding:2px 0}
    .info{margin:8px 0 22px}
    .info td{border:0;padding:3px 0;line-height:1.35}
    .info .label{width:18%;font-weight:bold;vertical-align:top}
    .info .details{width:82%}
    .center{text-align:center}
    .num{text-align:right;white-space:nowrap}
    .product-table th{text-align:center}
    .product-table td{height:24px}
    .totals{margin-top:12px;width:34%;margin-left:auto}
    .terms{margin-top:14px;line-height:1.55}
    .signature{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:44px}
    .signature div{border-top:1px solid #333;padding-top:6px;text-align:center;min-height:92px}
    .seller-stamp{display:block;max-width:260px;max-height:110px;object-fit:contain;margin:8px auto 0}
    @media print{body{margin:14mm}.no-print{display:none}}
  </style>
</head>
<body>
  <div class="company">
    JINHUA WUHU INTERNATIONAL TRADE CO.,LTD
    <span>7TH FLOOR, JINDIAN TOWER, WUHU ROAD, HARDWARE CENTRE, YONGKANG, ZHEJIANG, CHINA.</span>
  </div>
  <div class="validity-note">${escapeHtml(PI_VALIDITY_NOTE)}</div>
  <table class="meta">
    <tr><td><strong>PI NO.</strong></td><td class="num">${escapeHtml(settings.piNo)}</td></tr>
    <tr><td><strong>DATE:</strong></td><td class="num">${formatDateForDoc(settings.date)}</td></tr>
  </table>
  <h1>PROFORMA_INVOICE</h1>
  <table class="info">
    <tr>
      <td class="label">BUYERS:</td>
      <td class="details">Name: ${escapeHtml(settings.buyerName)}<br>
        Tel/Fax: ${escapeHtml(settings.buyerContact)}<br>
        ADD: ${textToHtml(settings.buyerAddress)}<br>
        ${settings.buyerTaxId ? `CNPJ: ${escapeHtml(settings.buyerTaxId)}` : ""}
      </td>
    </tr>
    <tr>
      <td class="label">SELLERS:</td>
      <td class="details">Name: ${escapeHtml(settings.sellerName)}<br>
      ATTN: Wyatte Zhou<br>
      Email: wyatte@funzo.info<br>
      Tel: 86 183 9591 7159<br>
      ADD: Fangzhou Hardware Products Factory, No. 88 Feifeng Road, Yongkang City, Jinhua City, Zhejiang Province, China
      </td>
    </tr>
    <tr>
      <td class="label">EXPORT AGENT<br>FOR SELLER</td>
      <td class="details">Name: ${escapeHtml(exportAgentName)}<br>
        ADD: ${escapeHtml(exportAgentAddress)}
      </td>
    </tr>
  </table>
  <table class="product-table">
    <thead>
      <tr>
        <th rowspan="2">ITEM</th><th rowspan="2">DESCRIPTION</th><th rowspan="2">VOL</th><th colspan="3">QTY</th><th rowspan="2">UNIT PRICE<br>FOB ${escapeHtml(settings.port)}</th><th rowspan="2">TOTAL USD</th>
      </tr>
      <tr>
        <th>UNT</th><th>CTN</th><th>CBM</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <table class="totals">
    <tr><td>Total:</td><td class="num">${formatPiUsd(totals.totalUsd)}</td></tr>
    <tr><td>${fixedNumber(settings.depositRate, 0)}% DEPOSIT:</td><td class="num">${formatPiUsd(deposit)}</td></tr>
  </table>
  <div class="terms">
    <strong>1. TIME OF SHIPMENT</strong><br>${textToHtml(settings.shipment)}<br>
    <strong>2. PORT OF LOADING</strong><br>${escapeHtml(settings.port)}<br>
    <strong>3. TERMS OF PAYMENT</strong><br>${textToHtml(settings.payment)}<br>
    <strong>4. Other conditions:</strong><br>${escapeHtml(PI_OTHER_CONDITIONS)}<br>
    <strong>5. T/T Remittance</strong><br>
    Beneficiary bank name: BANK OF CHINA, YONGKANG SUB BRANCH<br>
    Beneficiary bank address: NO.28 LIZHOU MIDDLE RD YONGKANG ZHEJIANG CHINA<br>
    Beneficiary bank Swift Code: BKCHCNBJ92H<br>
    Beneficiary Name: JINHUA WUHU INTERNATIONAL TRADE CO., LTD.<br>
    Beneficiary Address: 7TH FLOOR JINDIAN TOWER, WUHU ROAD, HARDWARE CENTER YONGKANG ZHEJIANG, CHINA<br>
    Beneficiary Account No.: 380558343961
  </div>
  <div class="signature">
    <div>SELLER: (STAMP)<img class="seller-stamp" src="seller-stamp.png" alt="Seller stamp"></div>
    <div>BUYER: (STAMP)</div>
  </div>
</body>
</html>`;
}

function docxText(value = "") {
  return xmlEscape(value);
}

function docxRun(text, options = {}) {
  const props = [
    options.bold ? "<w:b/>" : "",
    options.italic ? "<w:i/>" : "",
    options.size ? `<w:sz w:val="${options.size}"/>` : "",
    options.color ? `<w:color w:val="${options.color}"/>` : ""
  ].join("");
  const rPr = props ? `<w:rPr>${props}</w:rPr>` : "";
  return `<w:r>${rPr}<w:t xml:space="preserve">${docxText(text)}</w:t></w:r>`;
}

function docxParagraph(text = "", options = {}) {
  const pPr = [
    options.align ? `<w:jc w:val="${options.align}"/>` : "",
    `<w:spacing w:before="${options.before || 0}" w:after="${options.after ?? 80}"/>`
  ].join("");
  const lines = String(text ?? "").split("\n");
  const runs = lines.map((line, index) => `${index ? "<w:r><w:br/></w:r>" : ""}${docxRun(line, options)}`).join("");
  return `<w:p><w:pPr>${pPr}</w:pPr>${runs || docxRun("", options)}</w:p>`;
}

function docxImageParagraph(entry, options = {}) {
  if (!entry) return docxParagraph("");
  const cx = options.cx || 950000;
  const cy = options.cy || 720000;
  return `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:drawing>
    <wp:inline distT="0" distB="0" distL="0" distR="0">
      <wp:extent cx="${cx}" cy="${cy}"/>
      <wp:effectExtent l="0" t="0" r="0" b="0"/>
      <wp:docPr id="${entry.docPrId}" name="Product ${entry.docPrId}"/>
      <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
      <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
        <pic:pic>
          <pic:nvPicPr><pic:cNvPr id="${entry.docPrId}" name="${docxText(entry.mediaName)}"/><pic:cNvPicPr/></pic:nvPicPr>
          <pic:blipFill><a:blip r:embed="${entry.relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
          <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
        </pic:pic>
      </a:graphicData></a:graphic>
    </wp:inline>
  </w:drawing></w:r></w:p>`;
}

function docxTableCell(content, width, options = {}) {
  const paragraphs = Array.isArray(content) ? content.join("") : docxParagraph(content, options);
  const shade = options.fill ? `<w:shd w:fill="${options.fill}"/>` : "";
  const gridSpan = options.gridSpan ? `<w:gridSpan w:val="${options.gridSpan}"/>` : "";
  const vAlign = `<w:vAlign w:val="${options.vAlign || "center"}"/>`;
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${gridSpan}${shade}${vAlign}</w:tcPr>${paragraphs}</w:tc>`;
}

function docxTable(rows, widths, options = {}) {
  const borders = options.noBorders
    ? `<w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>`
    : `<w:tblBorders><w:top w:val="single" w:sz="4" w:color="333333"/><w:left w:val="single" w:sz="4" w:color="333333"/><w:bottom w:val="single" w:sz="4" w:color="333333"/><w:right w:val="single" w:sz="4" w:color="333333"/><w:insideH w:val="single" w:sz="4" w:color="333333"/><w:insideV w:val="single" w:sz="4" w:color="333333"/></w:tblBorders>`;
  const grid = widths.map((width) => `<w:gridCol w:w="${width}"/>`).join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="${options.width || widths.reduce((sum, width) => sum + width, 0)}" w:type="dxa"/>${borders}<w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${rows.join("")}</w:tbl>`;
}

function docxTableRow(cells) {
  return `<w:tr>${cells.join("")}</w:tr>`;
}

function docxPiDescription(line) {
  return [
    line.material,
    line.finishing || "",
    `Packing: ${line.packagingText}`,
    line.nested ? "Nested inside larger item" : ""
  ].filter(Boolean).join("\n");
}

function docxContentTypesXml(imageEntries) {
  const imageDefaults = [...new Set(imageEntries.map((entry) => entry.extension))]
    .map((extension) => `<Default Extension="${extension}" ContentType="${extension === "png" ? "image/png" : "image/jpeg"}"/>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${imageDefaults}
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
}

function docxRootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

function docxDocumentRelsXml(imageEntries) {
  const relationships = imageEntries.map((entry) =>
    `<Relationship Id="${entry.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${entry.mediaName}"/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`;
}

function buildPiDocxDocumentXml(lines, settings, imageEntries, sellerStampEntry = null) {
  const totals = documentTotals(lines);
  const deposit = totals.totalUsd * (settings.depositRate / 100);
  const exportAgentName = settings.exportAgent || "JINHUA WUHU INTERNATIONAL TRADE CO.,LTD";
  const exportAgentAddress = "7TH FLOOR, JINDIAN TOWER, WUHU ROAD, HARDWARE CENTRE, YONGKANG, ZHEJIANG, CHINA.";
  const productWidths = [3100, 4100, 850, 900, 900, 900, 1800, 2100];
  const productRows = [
    docxTableRow([
      docxTableCell("ITEM", productWidths[0], { align: "center", bold: true }),
      docxTableCell("DESCRIPTION", productWidths[1], { align: "center", bold: true }),
      docxTableCell("VOL", productWidths[2], { align: "center", bold: true }),
      docxTableCell("QTY", productWidths[3] + productWidths[4] + productWidths[5], { gridSpan: 3, align: "center", bold: true }),
      docxTableCell(`UNIT PRICE\nFOB ${settings.port}`, productWidths[6], { align: "center", bold: true }),
      docxTableCell("TOTAL USD", productWidths[7], { align: "center", bold: true })
    ]),
    docxTableRow([
      docxTableCell("", productWidths[0], { align: "center" }),
      docxTableCell("", productWidths[1], { align: "center" }),
      docxTableCell("", productWidths[2], { align: "center" }),
      docxTableCell("UNT", productWidths[3], { align: "center", bold: true }),
      docxTableCell("CTN", productWidths[4], { align: "center", bold: true }),
      docxTableCell("CBM", productWidths[5], { align: "center", bold: true }),
      docxTableCell("", productWidths[6], { align: "center" }),
      docxTableCell("", productWidths[7], { align: "center" })
    ])
  ];
  lines.forEach((line) => {
    productRows.push(docxTableRow([
      docxTableCell(line.description, productWidths[0], { size: 18 }),
      docxTableCell(docxPiDescription(line), productWidths[1], { size: 18 }),
      docxTableCell(line.volume, productWidths[2], { align: "center" }),
      docxTableCell(String(line.orderQty), productWidths[3], { align: "center" }),
      docxTableCell(String(line.cartonCount || ""), productWidths[4], { align: "center" }),
      docxTableCell(fixedNumber(line.totalCbm, 2), productWidths[5], { align: "center" }),
      docxTableCell(formatPiUsd(line.unitUsd), productWidths[6], { align: "center" }),
      docxTableCell(formatPiUsd(line.totalUsd), productWidths[7], { align: "center" })
    ]));
  });

  const partyTable = docxTable([
    docxTableRow([
      docxTableCell("BUYERS:", 2300, { bold: true }),
      docxTableCell(`Name: ${settings.buyerName}\nTel/Fax: ${settings.buyerContact}\nADD: ${settings.buyerAddress}${settings.buyerTaxId ? `\nCNPJ: ${settings.buyerTaxId}` : ""}`, 12300, { size: 18 })
    ]),
    docxTableRow([
      docxTableCell("SELLERS:", 2300, { bold: true }),
      docxTableCell(`Name: ${settings.sellerName}\nATTN: Wyatte Zhou\nEmail: wyatte@funzo.info\nTel: 86 183 9591 7159\nADD: Fangzhou Hardware Products Factory, No. 88 Feifeng Road, Yongkang City, Jinhua City, Zhejiang Province, China`, 12300, { size: 18 })
    ]),
    docxTableRow([
      docxTableCell("EXPORT AGENT\nFOR SELLER", 2300, { bold: true }),
      docxTableCell(`Name: ${exportAgentName}\nADD: ${exportAgentAddress}`, 12300, { size: 18 })
    ])
  ], [2300, 12300], { noBorders: true, width: 14600 });

  const totalsTable = docxTable([
    docxTableRow([docxTableCell("Total:", 2200, { bold: true }), docxTableCell(formatPiUsd(totals.totalUsd), 2200, { align: "center" })]),
    docxTableRow([docxTableCell(`${fixedNumber(settings.depositRate, 0)}% DEPOSIT:`, 2200, { bold: true }), docxTableCell(formatPiUsd(deposit), 2200, { align: "center" })])
  ], [2200, 2200], { width: 4400 });
  const piMetaTable = docxTable([
    docxTableRow([
      docxTableCell("", 9400, {}),
      docxTableCell(`PI NO.`, 2200, { bold: true }),
      docxTableCell(settings.piNo, 2400, { align: "center" })
    ]),
    docxTableRow([
      docxTableCell("", 9400, {}),
      docxTableCell("DATE:", 2200, { bold: true }),
      docxTableCell(formatDateForDoc(settings.date), 2400, { align: "center" })
    ])
  ], [9400, 2200, 2400], { noBorders: true, width: 14000 });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    ${docxParagraph("JINHUA WUHU INTERNATIONAL TRADE CO.,LTD", { align: "center", bold: true, size: 28, after: 40 })}
    ${docxParagraph("7TH FLOOR, JINDIAN TOWER, WUHU ROAD, HARDWARE CENTRE, YONGKANG, ZHEJIANG, CHINA.", { align: "center", size: 18, after: 80 })}
    ${docxParagraph(PI_VALIDITY_NOTE, { align: "center", italic: true, size: 18, after: 80 })}
    ${piMetaTable}
    ${docxParagraph("PROFORMA_INVOICE", { align: "center", bold: true, size: 30, before: 0, after: 180 })}
    ${partyTable}
    ${docxParagraph("", { after: 180 })}
    ${docxTable(productRows, productWidths)}
    ${docxParagraph("", { after: 80 })}
    ${totalsTable}
    ${docxParagraph(`1. TIME OF SHIPMENT\n${settings.shipment}`, { bold: true, before: 120, after: 80 })}
    ${docxParagraph(`2. PORT OF LOADING\n${settings.port}`, { bold: true, after: 80 })}
    ${docxParagraph(`3. TERMS OF PAYMENT\n${settings.payment}`, { bold: true, after: 80 })}
    ${docxParagraph(`4. Other conditions:\n${PI_OTHER_CONDITIONS}`, { bold: true, after: 80 })}
    ${docxParagraph("5. T/T Remittance\nBeneficiary bank name: BANK OF CHINA, YONGKANG SUB BRANCH\nBeneficiary bank address: NO.28 LIZHOU MIDDLE RD YONGKANG ZHEJIANG CHINA\nBeneficiary bank Swift Code: BKCHCNBJ92H\nBeneficiary Name: JINHUA WUHU INTERNATIONAL TRADE CO., LTD.\nBeneficiary Address: 7TH FLOOR JINDIAN TOWER, WUHU ROAD, HARDWARE CENTER YONGKANG ZHEJIANG, CHINA\nBeneficiary Account No.: 380558343961", { bold: true, after: 160 })}
    ${docxTable([docxTableRow([
      docxTableCell([
        docxParagraph("SELLER: (STAMP)", { align: "center", after: 60 }),
        docxImageParagraph(sellerStampEntry, { cx: 3300000, cy: 2190000 })
      ], 6900, { align: "center" }),
      docxTableCell("BUYER: (STAMP)", 6900, { align: "center" })
    ])], [6900, 6900])}
    <w:sectPr><w:pgSz w:w="16838" w:h="23811"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/></w:sectPr>
  </w:body>
</w:document>`;
}

async function buildPiDocxBlob(lines, settings = readDocSettingsFromForm()) {
  const imageEntries = [];
  const mediaFiles = [];
  const sellerStamp = await fetchAssetBytes("seller-stamp.png");
  let sellerStampEntry = null;
  if (sellerStamp) {
    const imageIndex = 1;
    const mediaName = `seller-stamp.${sellerStamp.extension}`;
    sellerStampEntry = {
      mediaName,
      relId: `rId${imageIndex}`,
      extension: sellerStamp.extension,
      docPrId: imageIndex + 1
    };
    imageEntries.push({
      mediaName,
      relId: `rId${imageIndex}`,
      extension: sellerStamp.extension,
      docPrId: imageIndex + 1
    });
    mediaFiles.push({ name: `word/media/${mediaName}`, data: sellerStamp.bytes });
  }
  const files = [
    { name: "[Content_Types].xml", data: docxContentTypesXml(imageEntries) },
    { name: "_rels/.rels", data: docxRootRelsXml() },
    { name: "word/document.xml", data: buildPiDocxDocumentXml(lines, settings, imageEntries, sellerStampEntry) },
    { name: "word/_rels/document.xml.rels", data: docxDocumentRelsXml(imageEntries) },
    ...mediaFiles
  ];
  return new Blob([createStoredZip(files)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
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

function xlsxContentTypesXml(imageEntries) {
  const imageDefaults = [...new Set(imageEntries.map((entry) => entry.extension))]
    .map((extension) => `<Default Extension="${extension}" ContentType="${extension === "png" ? "image/png" : "image/jpeg"}"/>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${imageDefaults}
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${imageEntries.length ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : ""}
</Types>`;
}

function xlsxRootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function xlsxWorkbookXml(sheetName = "Quotation Template") {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
  <calcPr calcId="0" fullCalcOnLoad="1" forceFullCalc="1"/>
</workbook>`;
}

function xlsxWorkbookRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function xlsxSheetRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`;
}

function xlsxStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="10"/><name val="Arial"/></font>
    <font><b/><color rgb="FF111111"/><sz val="10"/><name val="Arial"/></font>
    <font><sz val="10"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><name val="Arial"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF4F84BD"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF200"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="3">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border>
    <border><left style="thin"><color rgb="FFD9D9D9"/></left><right style="thin"><color rgb="FFD9D9D9"/></right><top style="thin"><color rgb="FFD9D9D9"/></top><bottom style="thin"><color rgb="FFD9D9D9"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="13">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="2" fontId="2" fillId="3" borderId="2" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="4" fontId="2" fillId="3" borderId="2" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="1" fontId="2" fillId="3" borderId="2" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="4" fontId="2" fillId="4" borderId="2" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="1" fontId="2" fillId="4" borderId="2" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="4" fontId="3" fillId="3" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function xlsxPiStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="&quot;US$&quot;#,##0.00"/>
  </numFmts>
  <fonts count="9">
    <font><sz val="10"/><name val="Arial"/></font>
    <font><b/><color rgb="FF111111"/><sz val="16"/><name val="Arial"/></font>
    <font><color rgb="FF444444"/><sz val="9"/><name val="Arial"/></font>
    <font><i/><color rgb="FF666666"/><sz val="9"/><name val="Arial"/></font>
    <font><b/><color rgb="FF111111"/><sz val="18"/><name val="Arial"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Arial"/></font>
    <font><sz val="10"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><name val="Arial"/></font>
    <font><b/><color rgb="FF111111"/><sz val="11"/><name val="Arial"/></font>
  </fonts>
  <fills count="8">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE1E4E8"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF6F6F6"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF7F7F7"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEDEDED"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE1E4E8"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="4">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD9D9D9"/></left><right style="thin"><color rgb="FFD9D9D9"/></right><top style="thin"><color rgb="FFD9D9D9"/></top><bottom style="thin"><color rgb="FFD9D9D9"/></bottom><diagonal/></border>
    <border><left style="thin"><color rgb="FF333333"/></left><right style="thin"><color rgb="FF333333"/></right><top style="thin"><color rgb="FF333333"/></top><bottom style="thin"><color rgb="FF333333"/></bottom><diagonal/></border>
    <border><left style="medium"><color rgb="FF333333"/></left><right style="medium"><color rgb="FF333333"/></right><top style="medium"><color rgb="FF333333"/></top><bottom style="medium"><color rgb="FF333333"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="21">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf numFmtId="0" fontId="1" fillId="4" borderId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="5" fillId="2" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="6" fillId="4" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="5" fillId="2" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="7" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="6" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="5" fillId="7" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="6" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="2" fontId="6" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="6" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="7" fillId="6" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="7" fillId="6" borderId="2" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="7" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="6" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="8" fillId="5" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="6" fillId="4" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="6" fillId="4" borderId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function xlsxDrawingXml(imageEntries) {
  const pictureXml = (entry, index) => `
    <xdr:pic>
      <xdr:nvPicPr><xdr:cNvPr id="${index + 2}" name="Picture ${index + 1}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>
      <xdr:blipFill><a:blip r:embed="${entry.relId}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>
      <xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln><a:prstDash val="solid"/></a:ln></xdr:spPr>
    </xdr:pic>`;
  const anchors = imageEntries.map((entry, index) => entry.anchor === "oneCell" ? `
  <xdr:oneCellAnchor>
    <xdr:from><xdr:col>${entry.startCol ?? 0}</xdr:col><xdr:colOff>${entry.startColOff ?? 80000}</xdr:colOff><xdr:row>${entry.startRow - 1}</xdr:row><xdr:rowOff>${entry.startRowOff ?? 80000}</xdr:rowOff></xdr:from>
    <xdr:ext cx="${entry.cx || 3300000}" cy="${entry.cy || 2190000}"/>
    ${pictureXml(entry, index)}
    <xdr:clientData/>
  </xdr:oneCellAnchor>` : `
  <xdr:twoCellAnchor editAs="oneCell">
    <xdr:from><xdr:col>${entry.startCol ?? 0}</xdr:col><xdr:colOff>${entry.startColOff ?? 80000}</xdr:colOff><xdr:row>${entry.startRow - 1}</xdr:row><xdr:rowOff>${entry.startRowOff ?? 80000}</xdr:rowOff></xdr:from>
    <xdr:to><xdr:col>${entry.endCol ?? 1}</xdr:col><xdr:colOff>${entry.endColOff ?? 80000}</xdr:colOff><xdr:row>${entry.endRow}</xdr:row><xdr:rowOff>${entry.endRowOff ?? 0}</xdr:rowOff></xdr:to>
    ${pictureXml(entry, index)}
    <xdr:clientData/>
  </xdr:twoCellAnchor>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${anchors}</xdr:wsDr>`;
}

function xlsxDrawingRelsXml(imageEntries) {
  const relationships = imageEntries.map((entry) =>
    `<Relationship Id="${entry.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${entry.mediaName}"/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`;
}

function xlsxDetailRows(line) {
  return [
    ["Name:", line.description],
    ["Size:", line.volume || line.name],
    ["Material:", line.material],
    ["Finishing:", line.finishing],
    ["Packaging:", line.packagingText],
    ["RMB Price:", fixedNumber(line.baseUnitRmb, 2)],
    ["Remark:", line.nested ? "Nested inside larger item; no extra CBM" : ""]
  ];
}

function buildPackingListSheetXml(lines, settings, imageEntries) {
  const container = CONTAINERS[state.containerId] || CONTAINERS["40hq"];
  const totals = documentTotals(lines);
  const rows = [];
  const merges = ["A1:A2", "B1:C2", "D1:D2", "E1:E2", "F1:H1", "I1:I2", "M1:M2", "N1:N2", "O1:O2", "P1:P2"];

  rows.push(xlsxFullRow(1, {
    1: xlsxStringCell(1, 1, "Photo", 1),
    2: xlsxStringCell(2, 1, "Description", 1),
    4: xlsxStringCell(4, 1, `FOB\n${settings.port}\nUSD/Each`, 1),
    5: xlsxStringCell(5, 1, "Packing\nQty/Ctn", 1),
    6: xlsxStringCell(6, 1, "Measurement", 1),
    9: xlsxStringCell(9, 1, "CTN\nCBM", 1),
    10: xlsxStringCell(10, 1, "Unit\nWeight", 1),
    11: xlsxStringCell(11, 1, "Carton\nWeight", 1),
    12: xlsxStringCell(12, 1, "QTY", 1),
    13: xlsxStringCell(13, 1, "Carton\nQTY", 1),
    14: xlsxStringCell(14, 1, "Order\nQTY", 1),
    15: xlsxStringCell(15, 1, "FOB TOTAL $", 1),
    16: xlsxStringCell(16, 1, "CBM", 1)
  }, 1, "36"));
  rows.push(xlsxFullRow(2, {
    6: xlsxStringCell(6, 2, "L", 1),
    7: xlsxStringCell(7, 2, "W", 1),
    8: xlsxStringCell(8, 2, "H", 1),
    10: xlsxStringCell(10, 2, "kg/pc", 1),
    11: xlsxStringCell(11, 2, "kg/ctn", 1),
    12: xlsxStringCell(12, 2, container.label, 1)
  }, 1, "36"));

  lines.forEach((line, index) => {
    const startRow = 3 + index * 7;
    const endRow = startRow + 6;
    ["A", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"].forEach((column) => {
      merges.push(`${column}${startRow}:${column}${endRow}`);
    });

    xlsxDetailRows(line).forEach(([label, value], offset) => {
      const rowNumber = startRow + offset;
      const cells = {
        2: xlsxStringCell(2, rowNumber, label, 2),
        3: xlsxStringCell(3, rowNumber, value, 3)
      };
      if (offset === 0) {
        cells[1] = xlsxBlankCell(1, rowNumber, 7);
        cells[4] = xlsxNumberCell(4, rowNumber, fixedNumber(line.unitUsd, 2), 5);
        cells[5] = xlsxNumberCell(5, rowNumber, line.cartonQty, 6);
        cells[6] = xlsxNumberCell(6, rowNumber, line.length, 5);
        cells[7] = xlsxNumberCell(7, rowNumber, line.width, 5);
        cells[8] = xlsxNumberCell(8, rowNumber, line.height, 5);
        cells[9] = xlsxFormulaCell(9, rowNumber, `IF(OR(F${startRow}="",G${startRow}="",H${startRow}=""),"",F${startRow}*G${startRow}*H${startRow}/1000000)`, line.cartonCbm, 5);
        cells[10] = xlsxNumberCell(10, rowNumber, line.unitWeightKg === "" ? "" : line.unitWeightKg, 5);
        cells[11] = xlsxNumberCell(11, rowNumber, line.cartonWeightKg === "" ? "" : line.cartonWeightKg, 5);
        cells[12] = xlsxFormulaCell(12, rowNumber, `IFERROR(${container.volume}/I${startRow}*E${startRow},"")`, line.containerCapacity, 5);
        cells[13] = xlsxFormulaCell(13, rowNumber, `IF(OR(N${startRow}="",E${startRow}="",E${startRow}=0),"",N${startRow}/E${startRow})`, line.cartonQty ? line.orderQty / line.cartonQty : "", 10);
        cells[14] = xlsxNumberCell(14, rowNumber, line.orderQty, 10);
        cells[15] = xlsxFormulaCell(15, rowNumber, `IF(OR(N${startRow}="",D${startRow}=""),"",N${startRow}*D${startRow})`, line.totalUsd, 9);
        cells[16] = xlsxFormulaCell(16, rowNumber, line.nested ? "0" : `IF(OR(N${startRow}="",E${startRow}="",I${startRow}=""),"",N${startRow}/E${startRow}*I${startRow})`, line.totalCbm, 9);
      }
      rows.push(xlsxPackingRow(rowNumber, cells, "15"));
    });
  });

  const totalRow = lines.length ? 3 + lines.length * 7 : 3;
  const sumRangeEnd = Math.max(3, totalRow - 1);
  const totalCartonsByFormula = lines.reduce((sum, line) => sum + (line.cartonQty ? line.orderQty / line.cartonQty : 0), 0);
  rows.push(xlsxFullRow(totalRow, {
    12: xlsxStringCell(12, totalRow, "Total", 11),
    13: xlsxFormulaCell(13, totalRow, `SUMIF($B$3:$B$${sumRangeEnd},"Name:",M$3:M$${sumRangeEnd})`, totalCartonsByFormula, 12),
    14: xlsxFormulaCell(14, totalRow, `SUMIF($B$3:$B$${sumRangeEnd},"Name:",N$3:N$${sumRangeEnd})`, totals.totalQty, 12),
    15: xlsxFormulaCell(15, totalRow, `SUMIF($B$3:$B$${sumRangeEnd},"Name:",O$3:O$${sumRangeEnd})`, totals.totalUsd, 12),
    16: xlsxFormulaCell(16, totalRow, `SUMIF($B$3:$B$${sumRangeEnd},"Name:",P$3:P$${sumRangeEnd})`, totals.totalCbm, 12)
  }, 0, "15"));

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>
    <col min="1" max="1" width="23.83203125" customWidth="1"/><col min="2" max="2" width="12" customWidth="1"/><col min="3" max="3" width="34" customWidth="1"/><col min="4" max="4" width="15.1640625" customWidth="1"/><col min="5" max="5" width="12" customWidth="1"/><col min="6" max="8" width="10" customWidth="1"/><col min="9" max="9" width="11" customWidth="1"/><col min="10" max="11" width="9.1640625" customWidth="1"/><col min="12" max="12" width="10" customWidth="1"/><col min="13" max="14" width="12" customWidth="1"/><col min="15" max="15" width="14" customWidth="1"/><col min="16" max="16" width="10" customWidth="1"/>
  </cols>
  <sheetData>${rows.join("")}</sheetData>
  <mergeCells count="${merges.length}">${merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>
  ${imageEntries.length ? '<drawing r:id="rId1"/>' : ""}
</worksheet>`;
}

function piLayoutRows(lines) {
  const productStartRow = 14;
  const totalRow = productStartRow + lines.length;
  const depositRow = totalRow + 1;
  const termsHeaderRow = depositRow + 3;
  const bankRow = termsHeaderRow + 6;
  const signatureHeaderRow = bankRow + 2;
  const signatureBoxStartRow = signatureHeaderRow + 1;
  const signatureBoxEndRow = signatureHeaderRow + 5;
  return {
    productStartRow,
    totalRow,
    depositRow,
    termsHeaderRow,
    bankRow,
    signatureHeaderRow,
    signatureBoxStartRow,
    signatureBoxEndRow
  };
}

function piBankDetails() {
  return [
    "Beneficiary bank name: BANK OF CHINA, YONGKANG SUB BRANCH",
    "Beneficiary bank address: NO.28 LIZHOU MIDDLE RD YONGKANG ZHEJIANG CHINA",
    "Beneficiary bank Swift Code: BKCHCNBJ92H",
    "Beneficiary Name: JINHUA WUHU INTERNATIONAL TRADE CO., LTD.",
    "Beneficiary Address: 7TH FLOOR JINDIAN TOWER, WUHU ROAD, HARDWARE CENTER YONGKANG ZHEJIANG, CHINA",
    "Beneficiary Account No.: 380558343961"
  ].join("\n");
}

function buildPiXlsxSheetXml(lines, settings, imageEntries = []) {
  const totals = documentTotals(lines);
  const layout = piLayoutRows(lines);
  const exportAgentName = settings.exportAgent || "JINHUA WUHU INTERNATIONAL TRADE CO.,LTD";
  const exportAgentAddress = "7TH FLOOR, JINDIAN TOWER, WUHU ROAD, HARDWARE CENTRE, YONGKANG, ZHEJIANG, CHINA.";
  const rows = [];
  const merges = [
    "A1:H1",
    "A2:H2",
    "A3:H3",
    "A4:H4",
    "A5:B5",
    "C5:D5",
    "E5:F5",
    "G5:H5",
    "A6:H6",
    "B7:H7",
    "B8:H8",
    "B9:H9",
    "A11:H11",
    "A12:A13",
    "B12:B13",
    "C12:C13",
    "D12:F12",
    "G12:G13",
    "H12:H13"
  ];

  rows.push(xlsxPiFullRow(1, { 1: xlsxStringCell(1, 1, "JINHUA WUHU INTERNATIONAL TRADE CO.,LTD", 1) }, 1, "28"));
  rows.push(xlsxPiFullRow(2, { 1: xlsxStringCell(1, 2, "7TH FLOOR, JINDIAN TOWER, WUHU ROAD, HARDWARE CENTRE, YONGKANG, ZHEJIANG, CHINA.", 2) }, 2, "22"));
  rows.push(xlsxPiFullRow(3, { 1: xlsxStringCell(1, 3, PI_VALIDITY_NOTE, 3) }, 3, "32"));
  rows.push(xlsxPiFullRow(4, { 1: xlsxStringCell(1, 4, "PROFORMA INVOICE", 4) }, 4, "32"));
  rows.push(xlsxPiFullRow(5, {
    1: xlsxStringCell(1, 5, "PI NO.", 5),
    2: xlsxBlankCell(2, 5, 5),
    3: xlsxStringCell(3, 5, settings.piNo, 6),
    4: xlsxBlankCell(4, 5, 6),
    5: xlsxStringCell(5, 5, "DATE", 5),
    6: xlsxBlankCell(6, 5, 5),
    7: xlsxStringCell(7, 5, formatDateForDoc(settings.date), 6),
    8: xlsxBlankCell(8, 5, 6)
  }, 20, "24"));
  rows.push(xlsxPiFullRow(6, { 1: xlsxStringCell(1, 6, "PARTIES", 7) }, 7, "22"));
  rows.push(xlsxPiFullRow(7, {
    1: xlsxStringCell(1, 7, "BUYERS", 8),
    2: xlsxStringCell(2, 7, `Name: ${settings.buyerName}\nTel/Fax: ${settings.buyerContact}\nADD: ${settings.buyerAddress}${settings.buyerTaxId ? `\nCNPJ: ${settings.buyerTaxId}` : ""}`, 9)
  }, 9, "66"));
  rows.push(xlsxPiFullRow(8, {
    1: xlsxStringCell(1, 8, "SELLERS", 8),
    2: xlsxStringCell(2, 8, `Name: ${settings.sellerName}\nATTN: Wyatte Zhou\nEmail: wyatte@funzo.info\nTel: 86 183 9591 7159\nADD: Fangzhou Hardware Products Factory, No. 88 Feifeng Road, Yongkang City, Jinhua City, Zhejiang Province, China`, 9)
  }, 9, "80"));
  rows.push(xlsxPiFullRow(9, {
    1: xlsxStringCell(1, 9, "EXPORT AGENT\nFOR SELLER", 8),
    2: xlsxStringCell(2, 9, `Name: ${exportAgentName}\nADD: ${exportAgentAddress}`, 9)
  }, 9, "48"));
  rows.push(xlsxPiFullRow(10, {}, 20, "8"));
  rows.push(xlsxPiFullRow(11, { 1: xlsxStringCell(1, 11, "PRODUCT DETAILS", 7) }, 7, "22"));
  rows.push(xlsxPiFullRow(12, {
    1: xlsxStringCell(1, 12, "ITEM", 10),
    2: xlsxStringCell(2, 12, "DESCRIPTION", 10),
    3: xlsxStringCell(3, 12, "VOL", 10),
    4: xlsxStringCell(4, 12, "QTY", 10),
    7: xlsxStringCell(7, 12, `UNIT PRICE\nFOB ${settings.port}`, 10),
    8: xlsxStringCell(8, 12, "TOTAL USD", 10)
  }, 10, "28"));
  rows.push(xlsxPiFullRow(13, {
    4: xlsxStringCell(4, 13, "UNT", 10),
    5: xlsxStringCell(5, 13, "CTN", 10),
    6: xlsxStringCell(6, 13, "CBM", 10)
  }, 10, "24"));

  lines.forEach((line, index) => {
    const rowNumber = layout.productStartRow + index;
    const cartonQty = Number(line.cartonQty) || 0;
    const cartonCbm = Number(line.cartonCbm) || 0;
    const descriptionDetails = [
      line.material,
      line.finishing,
      `Packing: ${line.packagingText}`,
      line.nested ? "Nested inside larger item; no extra CBM" : ""
    ].filter(Boolean).join("\n");
    rows.push(xlsxPiFullRow(rowNumber, {
      1: xlsxStringCell(1, rowNumber, line.description, 11),
      2: xlsxStringCell(2, rowNumber, descriptionDetails, 11),
      3: xlsxStringCell(3, rowNumber, line.volume, 11),
      4: xlsxNumberCell(4, rowNumber, line.orderQty, 12),
      5: cartonQty
        ? xlsxFormulaCell(5, rowNumber, `ROUNDUP(D${rowNumber}/${cartonQty},0)`, line.cartonCount, 12)
        : xlsxNumberCell(5, rowNumber, line.cartonCount, 12),
      6: line.nested
        ? xlsxFormulaCell(6, rowNumber, "0", 0, 12)
        : cartonCbm
          ? xlsxFormulaCell(6, rowNumber, `E${rowNumber}*${cartonCbm}`, line.totalCbm, 12)
          : xlsxNumberCell(6, rowNumber, line.totalCbm, 12),
      7: xlsxNumberCell(7, rowNumber, line.unitUsd, 13),
      8: xlsxFormulaCell(8, rowNumber, `D${rowNumber}*G${rowNumber}`, line.totalUsd, 13)
    }, 20, "48"));
  });

  const lastProductRow = Math.max(layout.productStartRow, layout.totalRow - 1);
  const totalFormula = lines.length ? `SUM(H${layout.productStartRow}:H${lastProductRow})` : "0";
  const depositRate = Math.max(0, Math.min(100, Number(settings.depositRate) || 0));
  const depositMultiplier = Number((depositRate / 100).toFixed(4));
  rows.push(xlsxPiFullRow(layout.totalRow, {
    7: xlsxStringCell(7, layout.totalRow, "Total:", 14),
    8: xlsxFormulaCell(8, layout.totalRow, totalFormula, totals.totalUsd, 15)
  }, 20, "24"));
  rows.push(xlsxPiFullRow(layout.depositRow, {
    7: xlsxStringCell(7, layout.depositRow, `${fixedNumber(depositRate, 0)}% DEPOSIT:`, 14),
    8: xlsxFormulaCell(8, layout.depositRow, `H${layout.totalRow}*${depositMultiplier}`, totals.totalUsd * depositMultiplier, 15)
  }, 20, "24"));
  rows.push(xlsxPiFullRow(layout.depositRow + 1, {}, 20, "8"));
  rows.push(xlsxPiFullRow(layout.termsHeaderRow, { 1: xlsxStringCell(1, layout.termsHeaderRow, "TERMS", 7) }, 7, "22"));
  merges.push(`A${layout.termsHeaderRow}:H${layout.termsHeaderRow}`);

  [
    ["1. TIME OF SHIPMENT", settings.shipment],
    ["2. PORT OF LOADING", settings.port],
    ["3. TERMS OF PAYMENT", settings.payment],
    ["4. Other conditions:", PI_OTHER_CONDITIONS]
  ].forEach(([label, value], index) => {
    const rowNumber = layout.termsHeaderRow + 1 + index;
    const valueText = String(value || "");
    const lineCount = Math.max(1, valueText.split("\n").length, Math.ceil(valueText.length / 95));
    rows.push(xlsxPiFullRow(rowNumber, {
      1: xlsxStringCell(1, rowNumber, label, 16),
      2: xlsxBlankCell(2, rowNumber, 16),
      3: xlsxStringCell(3, rowNumber, value, 17)
    }, 17, String(Math.max(28, lineCount * 18))));
    merges.push(`A${rowNumber}:B${rowNumber}`, `C${rowNumber}:H${rowNumber}`);
  });

  const remittanceHeaderRow = layout.termsHeaderRow + 5;
  rows.push(xlsxPiFullRow(remittanceHeaderRow, { 1: xlsxStringCell(1, remittanceHeaderRow, "T/T Remittance", 7) }, 7, "22"));
  merges.push(`A${remittanceHeaderRow}:H${remittanceHeaderRow}`);
  rows.push(xlsxPiFullRow(layout.bankRow, { 1: xlsxStringCell(1, layout.bankRow, piBankDetails(), 17) }, 17, "104"));
  merges.push(`A${layout.bankRow}:H${layout.bankRow}`);
  rows.push(xlsxPiFullRow(layout.bankRow + 1, {}, 20, "8"));
  rows.push(xlsxPiFullRow(layout.signatureHeaderRow, {
    1: xlsxStringCell(1, layout.signatureHeaderRow, "SELLER: (STAMP)", 18),
    5: xlsxStringCell(5, layout.signatureHeaderRow, "BUYER: (STAMP)", 18)
  }, 18, "24"));
  merges.push(`A${layout.signatureHeaderRow}:D${layout.signatureHeaderRow}`, `E${layout.signatureHeaderRow}:H${layout.signatureHeaderRow}`);
  for (let rowNumber = layout.signatureBoxStartRow; rowNumber <= layout.signatureBoxEndRow; rowNumber += 1) {
    rows.push(xlsxPiFullRow(rowNumber, {}, 19, "24"));
  }
  merges.push(`A${layout.signatureBoxStartRow}:D${layout.signatureBoxEndRow}`, `E${layout.signatureBoxStartRow}:H${layout.signatureBoxEndRow}`);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:H${layout.signatureBoxEndRow}"/>
  <sheetViews><sheetView showGridLines="0" workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>
    <col min="1" max="1" width="24" customWidth="1"/>
    <col min="2" max="2" width="42" customWidth="1"/>
    <col min="3" max="3" width="10" customWidth="1"/>
    <col min="4" max="4" width="12" customWidth="1"/>
    <col min="5" max="6" width="12" customWidth="1"/>
    <col min="7" max="8" width="18" customWidth="1"/>
  </cols>
  <sheetData>${rows.join("")}</sheetData>
  <mergeCells count="${merges.length}">${merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>
  <pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
  <pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>
  ${imageEntries.length ? '<drawing r:id="rId1"/>' : ""}
</worksheet>`;
}

async function buildPiXlsxBlob(lines, settings = readDocSettingsFromForm()) {
  const imageEntries = [];
  const mediaFiles = [];
  const layout = piLayoutRows(lines);
  const sellerStamp = await fetchAssetBytes("seller-stamp.png");
  if (sellerStamp) {
    const mediaName = `seller-stamp.${sellerStamp.extension}`;
    imageEntries.push({
      anchor: "oneCell",
      startRow: layout.signatureBoxStartRow,
      endRow: layout.signatureBoxEndRow,
      startCol: 0,
      endCol: 4,
      startColOff: 520000,
      startRowOff: 120000,
      endColOff: 0,
      endRowOff: 0,
      cx: 3000000,
      cy: 1995000,
      mediaName,
      relId: "rId1",
      extension: sellerStamp.extension
    });
    mediaFiles.push({ name: `xl/media/${mediaName}`, data: sellerStamp.bytes });
  }

  const files = [
    { name: "[Content_Types].xml", data: xlsxContentTypesXml(imageEntries) },
    { name: "_rels/.rels", data: xlsxRootRelsXml() },
    { name: "xl/workbook.xml", data: xlsxWorkbookXml("Proforma Invoice") },
    { name: "xl/_rels/workbook.xml.rels", data: xlsxWorkbookRelsXml() },
    { name: "xl/styles.xml", data: xlsxPiStylesXml() },
    { name: "xl/worksheets/sheet1.xml", data: buildPiXlsxSheetXml(lines, settings, imageEntries) },
    ...mediaFiles
  ];
  if (imageEntries.length) {
    files.push(
      { name: "xl/worksheets/_rels/sheet1.xml.rels", data: xlsxSheetRelsXml() },
      { name: "xl/drawings/drawing1.xml", data: xlsxDrawingXml(imageEntries) },
      { name: "xl/drawings/_rels/drawing1.xml.rels", data: xlsxDrawingRelsXml(imageEntries) }
    );
  }

  return new Blob([createStoredZip(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function buildPackingListXlsxBlob(lines, settings = readDocSettingsFromForm()) {
  const imageEntries = [];
  const mediaFiles = [];
  lines.forEach((line, index) => {
    const image = dataUrlToBytes(line.imageData);
    if (!image) return;
    const imageIndex = imageEntries.length + 1;
    const startRow = 3 + index * 7;
    const mediaName = `image${imageIndex}.${image.extension}`;
    imageEntries.push({
      startRow,
      endRow: startRow + 6,
      mediaName,
      relId: `rId${imageIndex}`,
      extension: image.extension
    });
    mediaFiles.push({ name: `xl/media/${mediaName}`, data: image.bytes });
  });

  const files = [
    { name: "[Content_Types].xml", data: xlsxContentTypesXml(imageEntries) },
    { name: "_rels/.rels", data: xlsxRootRelsXml() },
    { name: "xl/workbook.xml", data: xlsxWorkbookXml() },
    { name: "xl/_rels/workbook.xml.rels", data: xlsxWorkbookRelsXml() },
    { name: "xl/styles.xml", data: xlsxStylesXml() },
    { name: "xl/worksheets/sheet1.xml", data: buildPackingListSheetXml(lines, settings, imageEntries) },
    ...mediaFiles
  ];
  if (imageEntries.length) {
    files.push(
      { name: "xl/worksheets/_rels/sheet1.xml.rels", data: xlsxSheetRelsXml() },
      { name: "xl/drawings/drawing1.xml", data: xlsxDrawingXml(imageEntries) },
      { name: "xl/drawings/_rels/drawing1.xml.rels", data: xlsxDrawingRelsXml(imageEntries) }
    );
  }

  return new Blob([createStoredZip(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

async function downloadPiFile() {
  const lines = ensureDocumentLines();
  if (!lines) return;
  const settings = readDocSettingsFromForm();
  downloadBlobFile(`PI_${safeFilename(settings.piNo)}.xlsx`, await buildPiXlsxBlob(lines, settings));
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
  downloadBlobFile(`Packing_Quotation_${safeFilename(settings.piNo)}.xlsx`, buildPackingListXlsxBlob(lines, settings));
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
  renderPriceTextBuilder();
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
    elements.docExportAgent,
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

  elements.priceTextProductName.addEventListener("input", () => {
    renderPriceTextOutput();
  });

  elements.copyPriceText.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(elements.priceTextOutput.value);
      flashSaved("葡语报价已复制");
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

injectPriceTextCriticalStyles();
syncUnitPrice();
syncDocSettingsToForm();
bindInputs();
render();
updateExchangeRate(true);
persistProducts();
