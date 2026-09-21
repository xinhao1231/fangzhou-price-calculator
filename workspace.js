const SAMPLE_STORAGE_KEY = "fangzhou-sample-order-v1";

function defaultSampleDraft() {
  return { number: `S-${defaultPiNo()}`, currency: "USD", carrier: "", freight: 0,
    payment: "100% payment before dispatch", notes: "", items: [] };
}

function normalizeSampleDraft(value) {
  const draft = { ...defaultSampleDraft(), ...value };
  draft.currency = draft.currency === "CNY" ? "CNY" : "USD";
  draft.freight = Math.max(0, Number(draft.freight) || 0);
  draft.items = (Array.isArray(draft.items) ? draft.items : []).map((item) => ({
    ...item, quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    unitRmb: Math.max(0, Number(item.unitRmb) || 0)
  }));
  return draft;
}

function loadSampleDraft() {
  try { return normalizeSampleDraft(JSON.parse(localStorage.getItem(SAMPLE_STORAGE_KEY) || "{}")); }
  catch { return defaultSampleDraft(); }
}

state.sampleDraft = loadSampleDraft();
const workspaceElements = Object.fromEntries([
  "productSearch", "productSearchResults", "searchResultCount", "searchResultList", "showMoreSearch",
  "orderDocumentTab", "sampleDocumentTab", "orderDocumentActions", "sampleDocumentPanel",
  "sampleNo", "sampleCurrency", "sampleCarrier", "sampleFreight", "samplePayment", "sampleNotes",
  "sampleList", "sampleEmpty", "sampleItemCount", "sampleSubtotal", "sampleFreightTotal", "sampleGrandTotal",
  "addSampleItem", "downloadSample", "printSample", "downloadSampleTemplate"
].map((id) => [id, document.getElementById(id)]));

function searchableProducts() {
  const entries = [];
  state.products.forEach((product) => product.options.forEach((option) => {
    const groups = option.configGroups || [];
    function visit(index, selections, labels) {
      if (index === groups.length) {
        entries.push({ product, option, selections,
          title: [option.label, ...labels].join(" · "),
          text: [product.name, option.id, option.label, option.material, ...labels].filter(Boolean).join(" ") });
        return;
      }
      const group = groups[index];
      if (!isConfigGroupVisibleForSelections(group, selections)) return visit(index + 1, selections, labels);
      group.items.forEach((item) => visit(index + 1, { ...selections, [group.id]: item.id }, [...labels, item.label]));
    }
    visit(0, {}, []);
  }));
  return entries;
}

function findProducts(query) {
  const normalize = (text) => String(text).normalize("NFKC").toLowerCase().replace(/(\d)\s+l\b/g, "$1l");
  const tokens = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return searchableProducts().filter((entry) => {
    const text = normalize(entry.text);
    return tokens.every((token) => /^\d+l$/.test(token)
      ? new RegExp(`(^|[^0-9])${token}(?![a-z0-9])`).test(text)
      : text.replace(/[-_/]/g, "").includes(token.replace(/[-_/]/g, "")));
  });
}

let searchLimit = 24;
function renderProductSearch() {
  const query = workspaceElements.productSearch.value.trim();
  workspaceElements.productSearchResults.hidden = !query;
  elements.productGrid.hidden = Boolean(query);
  workspaceElements.searchResultList.replaceChildren();
  if (!query) return;
  const matches = findProducts(query);
  workspaceElements.searchResultCount.textContent = matches.length ? `找到 ${matches.length} 个规格` : "没有找到匹配产品，请更换名称或型号";
  matches.slice(0, searchLimit).forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    const title = document.createElement("strong");
    title.textContent = entry.title;
    const category = document.createElement("span");
    category.textContent = entry.product.name;
    button.append(title, category);
    button.addEventListener("click", () => {
      state.productId = entry.product.id;
      state.optionId = entry.option.id;
      selectDefaultConfigs(entry.option);
      Object.assign(state.configSelections, entry.selections);
      elements.discountPrice.value = "";
      syncUnitPrice();
      workspaceElements.productSearch.value = "";
      renderProductSearch();
      render();
      const selected = elements.optionGrid.querySelector('[data-active="true"]');
      if (selected) {
        selected.focus({ preventScroll: true });
        elements.optionGrid.scrollTop = selected.offsetTop;
      }
      document.querySelector(".option-panel").scrollIntoView({ block: "nearest" });
      flashSaved("已选中产品");
    });
    workspaceElements.searchResultList.append(button);
  });
  workspaceElements.showMoreSearch.hidden = matches.length <= searchLimit;
}

function selectDocumentTab(sample) {
  document.getElementById("documentForm").classList.toggle("sample-parties", sample);
  workspaceElements.orderDocumentTab.setAttribute("aria-selected", String(!sample));
  workspaceElements.sampleDocumentTab.setAttribute("aria-selected", String(sample));
  workspaceElements.orderDocumentTab.tabIndex = sample ? -1 : 0;
  workspaceElements.sampleDocumentTab.tabIndex = sample ? 0 : -1;
  document.querySelectorAll(".order-only").forEach((field) => { field.hidden = sample; });
  workspaceElements.orderDocumentActions.hidden = sample;
  workspaceElements.sampleDocumentPanel.hidden = !sample;
}

function persistSampleDraft() {
  try {
    localStorage.setItem(SAMPLE_STORAGE_KEY, JSON.stringify(state.sampleDraft));
    exposeSavedData();
    flashSaved();
    return true;
  } catch {
    flashSaved("样品单未保存，存储空间不足，请导出数据备份");
    return false;
  }
}

function sampleAmounts(draft = state.sampleDraft) {
  const rate = Math.max(0.1, numberFromInput(elements.exchangeRate, 7.2));
  const divisor = draft.currency === "USD" ? rate : 1;
  // Shift decimal places before rounding to match Excel ROUND at half-cent boundaries.
  const round = (value, digits = 2) => {
    const [coefficient, exponent = "0"] = String(value).split("e");
    return Number(`${Math.round(Number(`${coefficient}e${Number(exponent) + digits}`))}e-${digits}`);
  };
  const lines = draft.items.map((item) => {
    const unit = round(item.unitRmb / divisor, 4);
    return { ...item, unit, amount: round(unit * item.quantity) };
  });
  const subtotal = round(lines.reduce((sum, item) => sum + item.amount, 0));
  const freight = round(draft.freight / divisor);
  return { lines, rate, subtotal, freight, total: round(subtotal + freight) };
}

function sampleMoney(value) {
  return state.sampleDraft.currency === "USD" ? formatUsd(value) : formatCny(value);
}

function renderSampleTotals() {
  const totals = sampleAmounts();
  workspaceElements.sampleSubtotal.textContent = sampleMoney(totals.subtotal);
  workspaceElements.sampleFreightTotal.textContent = sampleMoney(totals.freight);
  workspaceElements.sampleGrandTotal.textContent = sampleMoney(totals.total);
  workspaceElements.sampleItemCount.textContent = state.sampleDraft.items.length;
  workspaceElements.sampleEmpty.hidden = state.sampleDraft.items.length > 0;
  workspaceElements.downloadSample.disabled = !state.sampleDraft.items.length;
  workspaceElements.printSample.disabled = !state.sampleDraft.items.length;
}

function addSampleItem() {
  const result = calculate();
  const name = currentSelectionLabel();
  state.sampleDraft.items.push({
    id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    name, description: englishDescription(name), size: currentProductSize(), quantity: 1,
    unitRmb: result.unitPrice, imageData: "", notes: ""
  });
  persistSampleDraft();
  renderSampleList();
  flashSaved("已加入样品单");
}

function renderSampleList() {
  workspaceElements.sampleList.replaceChildren();
  state.sampleDraft.items.forEach((item, index) => {
    const row = document.createElement("article");
    row.className = "sample-item";
    row.innerHTML = `<div class="sample-item-head"><strong>${index + 1}. ${escapeHtml(item.name)}</strong><button class="text-button" type="button" data-remove>删除</button></div>
      <div class="sample-item-body"><label class="sample-photo" title="选择产品图片">${item.imageData ? `<img src="${escapeHtml(item.imageData)}" alt="产品图片">` : '<span>选择图片</span>'}<input type="file" accept="image/*" aria-label="选择样品图片"></label>
      <div class="sample-item-fields">
        <label class="field wide-field"><span>产品描述</span><input data-field="description" value="${escapeHtml(item.description || "")}"></label>
        <label class="field"><span>产品尺寸（cm）</span><input data-field="size" value="${escapeHtml(item.size || "")}"></label>
        <label class="field"><span>样品数量</span><input data-field="quantity" type="number" inputmode="numeric" min="1" step="1" value="${item.quantity}"></label>
        <label class="field"><span>样品单价（人民币）</span><input data-field="unitRmb" type="number" inputmode="decimal" min="0" step="0.01" value="${item.unitRmb}"></label>
        <label class="field"><span>产品备注</span><input data-field="notes" value="${escapeHtml(item.notes || "")}"></label>
      </div></div>`;
    row.querySelector("[data-remove]").addEventListener("click", () => {
      state.sampleDraft.items = state.sampleDraft.items.filter((entry) => entry.id !== item.id);
      persistSampleDraft();
      renderSampleList();
    });
    row.querySelectorAll("[data-field]").forEach((input) => {
      input.addEventListener("input", () => {
        const field = input.dataset.field;
        if (field === "quantity" || field === "unitRmb") {
          if (!input.value.trim() || !input.validity.valid) return;
          item[field] = Number(input.value);
        } else item[field] = input.value;
        persistSampleDraft();
        renderSampleTotals();
      });
      input.addEventListener("change", () => { input.value = item[input.dataset.field]; });
    });
    row.querySelector('input[type="file"]').addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const previous = item.imageData;
        item.imageData = await imageFileToDataUrl(file);
        if (!persistSampleDraft()) item.imageData = previous;
        renderSampleList();
      } catch { flashSaved("图片读取失败，请选择其他图片"); }
    });
    if (item.imageData) {
      const removePhoto = document.createElement("button");
      removePhoto.className = "text-button remove-sample-photo";
      removePhoto.type = "button";
      removePhoto.textContent = "移除图片";
      removePhoto.addEventListener("click", () => { item.imageData = ""; persistSampleDraft(); renderSampleList(); });
      row.append(removePhoto);
    }
    workspaceElements.sampleList.append(row);
  });
  renderSampleTotals();
}

function syncSampleForm() {
  const fields = { sampleNo: "number", sampleCurrency: "currency", sampleCarrier: "carrier", sampleFreight: "freight", samplePayment: "payment", sampleNotes: "notes" };
  Object.entries(fields).forEach(([id, key]) => { workspaceElements[id].value = state.sampleDraft[key]; });
  renderSampleList();
}

function sampleStylesXml() {
  const style = (font, fill, format = 0, align = "left", border = 1) => `<xf numFmtId="${format}" fontId="${font}" fillId="${fill}" borderId="${border}" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="${align}" vertical="center" wrapText="1"/></xf>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <numFmts count="1"><numFmt numFmtId="165" formatCode="0.0000"/></numFmts>
    <fonts count="4"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="20"/><color rgb="FF243B40"/><name val="Arial"/></font><font><b/><sz val="10"/><name val="Arial"/></font><font><sz val="10"/><color rgb="FF176B82"/><name val="Arial"/></font></fonts>
    <fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEDF3F3"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF7FAFA"/><bgColor indexed="64"/></patternFill></fill></fills>
    <borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFDDE5E5"/></left><right style="thin"><color rgb="FFDDE5E5"/></right><top style="thin"><color rgb="FFDDE5E5"/></top><bottom style="thin"><color rgb="FFDDE5E5"/></bottom><diagonal/></border></borders>
    <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
    <cellXfs count="10">${style(0, 0, 0, "left", 0)}${style(1, 0, 0, "left", 0)}${style(2, 2)}${style(0, 0)}${style(3, 0, 2, "right")}${style(0, 0, 4, "right")}${style(2, 2, 4, "right")}${style(3, 0)}${style(0, 0, 165, "right")}${style(3, 0, 165, "right")}</cellXfs>
    <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
}

function buildSampleSheetXml(draft, settings, imageEntries) {
  const totals = sampleAmounts(draft);
  const rows = [];
  const merges = [];
  const textRow = (row, label, value, height = 30) => {
    rows.push(xlsxPiFullRow(row, { 1: xlsxStringCell(1, row, label, 2), 3: xlsxStringCell(3, row, value, 7) }, 3, height));
    merges.push(`A${row}:B${row}`, `C${row}:H${row}`);
  };
  rows.push(xlsxPiFullRow(1, { 1: xlsxStringCell(1, 1, "SAMPLE ORDER / 样品单", 1) }, 0, 38));
  merges.push("A1:H1");
  textRow(2, "SELLER / 卖方", settings.sellerName);
  textRow(3, "EXPORT AGENT FOR SELLER", settings.exportAgent, 34);
  rows.push(xlsxPiFullRow(4, { 1: xlsxStringCell(1, 4, "ORDER NO.", 2), 3: xlsxStringCell(3, 4, draft.number, 7), 5: xlsxStringCell(5, 4, "DATE", 2), 6: xlsxStringCell(6, 4, settings.date, 7) }, 3, 28));
  merges.push("A4:B4", "C4:D4", "F4:H4");
  textRow(5, "BUYER / 买方", settings.buyerName);
  textRow(6, "CONTACT / 联系方式", [settings.buyerContact, settings.buyerTaxId].filter(Boolean).join(" / "));
  textRow(7, "ADDRESS / 收件地址", settings.buyerAddress, Math.max(36, Math.ceil((settings.buyerAddress || "").length / 75) * 16));
  rows.push(xlsxPiFullRow(8, { 1: xlsxStringCell(1, 8, "CURRENCY / 币种", 2), 3: xlsxStringCell(3, 8, draft.currency, 7), 4: xlsxStringCell(4, 8, "RMB / USD", 2), 5: xlsxNumberCell(5, 8, totals.rate, 9), 6: xlsxStringCell(6, 8, "COURIER", 2), 7: xlsxStringCell(7, 8, draft.carrier, 7) }, 3, 28));
  merges.push("A8:B8", "G8:H8");
  rows.push(xlsxPiFullRow(9, {}, 0, 10));
  const headers = ["NO.", "PHOTO / 图片", "PRODUCT / 产品描述", "SIZE (cm)", "QTY / 数量", "UNIT RMB", "UNIT PRICE", "AMOUNT"];
  rows.push(xlsxPiFullRow(10, Object.fromEntries(headers.map((title, i) => [i + 1, xlsxStringCell(i + 1, 10, title, 2)])), 2, 32));
  totals.lines.forEach((item, index) => {
    const row = 11 + index;
    rows.push(xlsxPiFullRow(row, {
      1: xlsxNumberCell(1, row, index + 1, 3),
      3: xlsxStringCell(3, row, [item.description, item.notes].filter(Boolean).join("\n"), 7),
      4: xlsxStringCell(4, row, item.size || "", 7),
      5: xlsxNumberCell(5, row, item.quantity, 7),
      6: xlsxNumberCell(6, row, item.unitRmb, 4),
      7: xlsxFormulaCell(7, row, `ROUND(IF($C$8="USD",F${row}/$E$8,F${row}),4)`, item.unit, 8),
      8: xlsxFormulaCell(8, row, `ROUND(E${row}*G${row},2)`, item.amount, 5)
    }, 3, Math.max(80, Math.ceil(([item.description, item.notes].join("\n")).length / 30) * 15)));
  });
  const end = 10 + totals.lines.length;
  const subtotalRow = end + 1;
  const freightRow = end + 2;
  const totalRow = end + 3;
  rows.push(xlsxPiFullRow(subtotalRow, { 1: xlsxStringCell(1, subtotalRow, "SUBTOTAL / 样品金额", 2), 8: xlsxFormulaCell(8, subtotalRow, `SUM(H11:H${end})`, totals.subtotal, 6) }, 2, 28));
  merges.push(`A${subtotalRow}:G${subtotalRow}`);
  rows.push(xlsxPiFullRow(freightRow, { 1: xlsxStringCell(1, freightRow, "COURIER FEE / 快递费", 2), 5: xlsxStringCell(5, freightRow, "RMB", 2), 6: xlsxNumberCell(6, freightRow, draft.freight, 4), 8: xlsxFormulaCell(8, freightRow, `ROUND(IF($C$8="USD",F${freightRow}/$E$8,F${freightRow}),2)`, totals.freight, 5) }, 3, 28));
  merges.push(`A${freightRow}:D${freightRow}`);
  rows.push(xlsxPiFullRow(totalRow, { 1: xlsxStringCell(1, totalRow, "TOTAL / 总计", 2), 8: xlsxFormulaCell(8, totalRow, `H${subtotalRow}+H${freightRow}`, totals.total, 6) }, 2, 32));
  merges.push(`A${totalRow}:G${totalRow}`);
  textRow(totalRow + 1, "PAYMENT / 付款方式", draft.payment, Math.max(32, Math.ceil(draft.payment.length / 70) * 16));
  textRow(totalRow + 2, "REMARKS / 备注", draft.notes, Math.max(48, Math.ceil(draft.notes.length / 70) * 16));
  const widths = [6, 18, 38, 18, 10, 14, 14, 16];
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:H${totalRow + 2}"/><sheetViews><sheetView showGridLines="0" workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="20"/>
    <cols>${widths.map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`).join("")}</cols>
    <sheetData>${rows.join("")}</sheetData><mergeCells count="${merges.length}">${merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>
    <dataValidations count="2"><dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="C8"><formula1>"USD,CNY"</formula1></dataValidation><dataValidation type="decimal" operator="greaterThan" allowBlank="0" showErrorMessage="1" sqref="E8"><formula1>0</formula1></dataValidation></dataValidations>
    <pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>${imageEntries.length ? '<drawing r:id="rId1"/>' : ""}</worksheet>`;
}

async function sampleImageEntry(item, index, imageIndex) {
  const data = dataUrlToBytes(item.imageData);
  if (!data) return null;
  const image = new Image();
  await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = item.imageData; });
  const scale = Math.min(112 / image.naturalWidth, 92 / image.naturalHeight);
  return { data, entry: { anchor: "oneCell", startRow: 11 + index, startCol: 1,
    startColOff: 60000, startRowOff: 60000, cx: Math.round(image.naturalWidth * scale * 9525),
    cy: Math.round(image.naturalHeight * scale * 9525), mediaName: `sample-${imageIndex}.${data.extension}`,
    relId: `rId${imageIndex}`, extension: data.extension } };
}

async function buildSampleXlsxBlob(draft, settings) {
  const images = [];
  for (const [index, item] of draft.items.entries()) {
    const image = await sampleImageEntry(item, index, images.length + 1);
    if (image) images.push(image);
  }
  const entries = images.map((image) => image.entry);
  const files = [
    { name: "[Content_Types].xml", data: xlsxContentTypesXml(entries) },
    { name: "_rels/.rels", data: xlsxRootRelsXml() },
    { name: "xl/workbook.xml", data: xlsxWorkbookXml("Sample Order") },
    { name: "xl/_rels/workbook.xml.rels", data: xlsxWorkbookRelsXml() },
    { name: "xl/styles.xml", data: sampleStylesXml() },
    { name: "xl/worksheets/sheet1.xml", data: buildSampleSheetXml(draft, settings, entries) },
    ...images.map((image) => ({ name: `xl/media/${image.entry.mediaName}`, data: image.data.bytes }))
  ];
  if (entries.length) files.push(
    { name: "xl/worksheets/_rels/sheet1.xml.rels", data: xlsxSheetRelsXml() },
    { name: "xl/drawings/drawing1.xml", data: xlsxDrawingXml(entries) },
    { name: "xl/drawings/_rels/drawing1.xml.rels", data: xlsxDrawingRelsXml(entries) }
  );
  return new Blob([createStoredZip(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

async function downloadSampleFile(blank = false) {
  if (!blank && !state.sampleDraft.items.length) return;
  const settings = readDocSettingsFromForm();
  const draft = structuredClone(state.sampleDraft);
  if (blank) draft.items = Array.from({ length: 5 }, () => ({ description: "", size: "", notes: "", quantity: 1, unitRmb: 0, imageData: "" }));
  try {
    downloadBlobFile(blank ? "Sample_Order_Template.xlsx" : `Sample_${safeFilename(draft.number)}.xlsx`, await buildSampleXlsxBlob(draft, settings));
    flashSaved("样品单已生成");
  } catch { flashSaved("样品单生成失败，请检查产品图片后重试"); }
}

function buildSampleHtml(draft, settings) {
  const totals = sampleAmounts(draft);
  const text = textToHtml;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>Sample ${escapeHtml(draft.number)}</title><style>
    @page{size:A4;margin:12mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#263638;margin:0}h1{font-size:24px;margin:0 0 16px}h2{font-size:14px}p{line-height:1.5;margin:8px 0;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;table-layout:fixed;margin:16px 0}th,td{border:1px solid #dce4e4;padding:8px;text-align:left;overflow-wrap:anywhere}th{background:#edf3f3}td img{max-width:70px;max-height:70px;object-fit:contain}tr{break-inside:avoid}.amount{text-align:right}thead{display:table-header-group}.totals{text-align:right}.total{font-size:17px;font-weight:bold}.terms{border-top:1px solid #dce4e4;padding-top:10px}</style></head><body>
    <h1>SAMPLE ORDER / 样品单</h1><p><b>NO.</b> ${text(draft.number)} &nbsp; <b>DATE</b> ${text(settings.date)} &nbsp; <b>CURRENCY</b> ${draft.currency}</p>
    <p><b>SELLER:</b> ${text(settings.sellerName)}<br><b>EXPORT AGENT FOR SELLER:</b> ${text(settings.exportAgent)}</p>
    <p><b>BUYER:</b> ${text(settings.buyerName)}<br><b>CONTACT:</b> ${text(settings.buyerContact)}<br><b>ADDRESS:</b> ${text(settings.buyerAddress)}${settings.buyerTaxId ? `<br><b>TAX ID:</b> ${text(settings.buyerTaxId)}` : ""}</p>
    <p><b>COURIER:</b> ${text(draft.carrier)} &nbsp; <b>RMB / USD:</b> ${totals.rate}</p>
    <table><colgroup><col style="width:6%"><col style="width:14%"><col style="width:30%"><col style="width:16%"><col style="width:8%"><col style="width:13%"><col style="width:13%"></colgroup><thead><tr><th>NO.</th><th>PHOTO</th><th>PRODUCT</th><th>SIZE (cm)</th><th>QTY</th><th>UNIT ${draft.currency}</th><th>AMOUNT ${draft.currency}</th></tr></thead><tbody>
    ${totals.lines.map((item, i) => `<tr><td>${i + 1}</td><td>${imagePreviewHtml(item.imageData)}</td><td>${text(item.description)}${item.notes ? `<br>${text(item.notes)}` : ""}</td><td>${text(item.size)}</td><td>${item.quantity}</td><td class="amount">${item.unit.toFixed(4)}</td><td class="amount">${item.amount.toFixed(2)}</td></tr>`).join("")}</tbody></table>
    <div class="totals"><p>SUBTOTAL: ${draft.currency} ${totals.subtotal.toFixed(2)}</p><p>COURIER FEE: ${draft.currency} ${totals.freight.toFixed(2)}</p><p class="total">TOTAL: ${draft.currency} ${totals.total.toFixed(2)}</p></div>
    <div class="terms"><p><b>PAYMENT:</b> ${text(draft.payment)}</p><p><b>REMARKS:</b> ${text(draft.notes)}</p></div></body></html>`;
}

function printSampleFile() {
  if (!state.sampleDraft.items.length) return;
  const win = window.open("", "_blank");
  if (!win) return flashSaved("浏览器阻止了打印窗口");
  win.document.open();
  win.document.write(buildSampleHtml(state.sampleDraft, readDocSettingsFromForm()));
  win.document.close();
  const readyImages = [...win.document.images].map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => { image.onload = resolve; image.onerror = resolve; }));
  Promise.all(readyImages).then(() => { win.focus(); win.print(); });
}

workspaceElements.productSearch.addEventListener("input", () => { searchLimit = 24; renderProductSearch(); });
workspaceElements.productSearch.addEventListener("keydown", (event) => {
  if (event.key === "Escape") { event.target.value = ""; renderProductSearch(); }
  if (event.key === "ArrowDown") { event.preventDefault(); workspaceElements.searchResultList.querySelector("button")?.focus(); }
});
workspaceElements.showMoreSearch.addEventListener("click", () => { searchLimit += 24; renderProductSearch(); });
workspaceElements.orderDocumentTab.addEventListener("click", () => selectDocumentTab(false));
workspaceElements.sampleDocumentTab.addEventListener("click", () => selectDocumentTab(true));
document.querySelector(".document-tabs").addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const sample = event.key === "End" || (event.key !== "Home" && workspaceElements.orderDocumentTab.getAttribute("aria-selected") === "true");
  selectDocumentTab(sample);
  (sample ? workspaceElements.sampleDocumentTab : workspaceElements.orderDocumentTab).focus();
});
Object.entries({ sampleNo: "number", sampleCurrency: "currency", sampleCarrier: "carrier", sampleFreight: "freight", samplePayment: "payment", sampleNotes: "notes" }).forEach(([id, key]) => {
  workspaceElements[id].addEventListener("input", (event) => {
    if (key === "freight" && (!event.target.value.trim() || !event.target.validity.valid)) return;
    state.sampleDraft[key] = key === "freight" ? Number(event.target.value) : event.target.value;
    persistSampleDraft();
    renderSampleTotals();
  });
});
workspaceElements.sampleFreight.addEventListener("change", () => { workspaceElements.sampleFreight.value = state.sampleDraft.freight; });
workspaceElements.addSampleItem.addEventListener("click", addSampleItem);
document.getElementById("quickAddSample").addEventListener("click", addSampleItem);
workspaceElements.downloadSample.addEventListener("click", () => downloadSampleFile());
workspaceElements.downloadSampleTemplate.addEventListener("click", () => downloadSampleFile(true));
workspaceElements.printSample.addEventListener("click", printSampleFile);
elements.exchangeRate.addEventListener("input", renderSampleTotals);
syncSampleForm();
exposeSavedData();
