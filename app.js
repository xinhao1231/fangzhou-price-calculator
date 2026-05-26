const STORAGE_KEY = "fangzhou-price-calculator-v11";

const CONTAINERS = {
  "20gp": { label: "20GP", volume: 28, price: 3800 },
  "40hq": { label: "40HQ", volume: 68, price: 6800 },
  "40nor": { label: "40NOR", volume: 58, price: 6800 }
};

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
      { id: "sensor", label: "感应垃圾桶", price: 180, logistics: logistics(1, "61*41*22.5 / 45*45*65", "7000g", 0.1878975) }
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
  includeFob: false
};

const elements = {
  productGrid: document.querySelector("#productGrid"),
  optionGrid: document.querySelector("#optionGrid"),
  optionTitle: document.querySelector("#optionTitle"),
  modifierWrap: document.querySelector("#modifierWrap"),
  unitPrice: document.querySelector("#unitPrice"),
  quantity: document.querySelector("#quantity"),
  extraCost: document.querySelector("#extraCost"),
  exchangeRate: document.querySelector("#exchangeRate"),
  containerType: document.querySelector("#containerType"),
  includeFob: document.querySelector("#includeFob"),
  selectedName: document.querySelector("#selectedName"),
  totalCny: document.querySelector("#totalCny"),
  totalUsd: document.querySelector("#totalUsd"),
  unitWithMargin: document.querySelector("#unitWithMargin"),
  packagingCost: document.querySelector("#packagingCost"),
  fobCost: document.querySelector("#fobCost"),
  fobUnitWithMargin: document.querySelector("#fobUnitWithMargin"),
  fobTotalCny: document.querySelector("#fobTotalCny"),
  fobTotalUsd: document.querySelector("#fobTotalUsd"),
  containerUnits: document.querySelector("#containerUnits"),
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
  importData: document.querySelector("#importData")
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

function packagingCostPerUnit(quantity) {
  const packagingId = selectedPackagingId();
  if (packagingId === "color-box") return 400 / quantity + 0.2;
  if (packagingId === "thick-box") return 0.3;
  if (packagingId === "thick-color-box") return 400 / quantity + 0.2 + 0.3;
  return 0;
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
  const unitPrice = numberFromInput(elements.unitPrice);
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
  const fobTotalCny = fobUnitWithMargin === null ? null : fobUnitWithMargin * quantity + extraCost;
  const fobTotalUsd = fobTotalCny === null ? null : fobTotalCny / exchangeRate;

  state.quantity = quantity;
  state.margin = margin;
  state.extraCost = extraCost;
  state.exchangeRate = exchangeRate;

  return {
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
    fobTotalCny,
    fobTotalUsd
  };
}

function renderSummary() {
  const product = currentProduct();
  const option = currentOption();
  const configItems = selectedConfigItems();
  const result = calculate();
  const logisticsInfo = currentLogistics();
  const selected = [product.name, option.label, ...configItems.map((item) => item.label)].join(" · ");

  elements.selectedName.textContent = selected;
  elements.totalCny.textContent = formatCny(result.totalCny);
  elements.totalUsd.textContent = formatUsd(result.totalUsd);
  elements.unitWithMargin.textContent = formatCny(result.unitWithMargin);
  elements.packagingCost.textContent = formatCny(result.packagingCost);
  elements.fobCost.textContent = result.fobUnits ? formatCny(result.fobCost) : "待填写";
  elements.fobUnitWithMargin.textContent = result.fobUnitWithMargin === null ? "待填写" : formatCny(result.fobUnitWithMargin);
  elements.fobTotalCny.textContent = result.fobTotalCny === null ? "待填写" : formatCny(result.fobTotalCny);
  elements.fobTotalUsd.textContent = result.fobTotalUsd === null ? "待填写" : formatUsd(result.fobTotalUsd);
  elements.containerUnits.textContent = result.fobUnits ? `${Math.floor(result.fobUnits).toLocaleString("zh-CN")} 件` : "待填写";
  elements.resultQty.textContent = String(result.quantity);
  elements.cartonSpec.textContent = logisticsInfo?.cartonSpec || "待填写";
  elements.cartonQty.textContent = logisticsInfo?.cartonQty ? `${logisticsInfo.cartonQty} / 箱` : "待填写";
  elements.unitWeight.textContent = logisticsInfo?.unitWeight || "待填写";
  elements.quoteText.textContent = [
    `产品：${selected}`,
    `产品单价：${formatCny(result.unitPrice)}`,
    `包装加价/个：${formatCny(result.packagingCost)}`,
    `计价单价：${formatCny(result.unitCost)}`,
    `数量：${result.quantity}`,
    `包装/其他费用：${formatCny(result.extraCost)}`,
    `外箱尺寸：${logisticsInfo?.cartonSpec || "待填写"}`,
    `装箱量：${logisticsInfo?.cartonQty ? `${logisticsInfo.cartonQty} / 箱` : "待填写"}`,
    `单个重量：${logisticsInfo?.unitWeight || "待填写"}`,
    `FOB费用/个：${result.fobUnits ? formatCny(result.fobCost) : "待填写"}`,
    `FOB单个价格：${result.fobUnitWithMargin === null ? "待填写" : formatCny(result.fobUnitWithMargin)}`,
    `FOB人民币总价：${result.fobTotalCny === null ? "待填写" : formatCny(result.fobTotalCny)}`,
    `货柜可装：${result.fobUnits ? `${Math.floor(result.fobUnits).toLocaleString("zh-CN")} 件` : "待填写"}`,
    `合计：${formatCny(result.totalCny)}（约 ${formatUsd(result.totalUsd)}）`
  ].join("\n");
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
  dataNode.textContent = JSON.stringify({ version: 11, products: state.products });
}

function bindInputs() {
  [elements.unitPrice, elements.quantity, elements.extraCost, elements.exchangeRate].forEach((input) => {
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
    const blob = new Blob([JSON.stringify({ products: state.products }, null, 2)], {
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
      state.products = imported.products;
      state.productId = state.products[0].id;
      selectFirstOption(state.products[0]);
      syncUnitPrice();
      persistProducts();
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
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

bindInputs();
syncUnitPrice();
render();
persistProducts();
