import * as XLSX from "xlsx";
import { utils, write } from "xlsx";

// Helper para crear estilo de borde
const border = (left, right, top, bottom) => ({
  left:   left   ? { style: left,   color: { argb: "FF000000" } } : undefined,
  right:  right  ? { style: right,  color: { argb: "FF000000" } } : undefined,
  top:    top    ? { style: top,    color: { argb: "FF000000" } } : undefined,
  bottom: bottom ? { style: bottom, color: { argb: "FF000000" } } : undefined,
});

const fillSolid = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

const GRAY_HEADER = "FFD8D8D8";
const YELLOW_ROW  = "FFFFFF00";
const GRAY_TOTAL  = "FFBFBFBF";
const RED_TEXT    = "FFFF0000";
const GRAY_TITLE  = "FF595959";

const MONEY_FORMAT = '_-"S/" * #,##0.00_-;\\-"S/" * #,##0.00_-;_-"S/" * "-"??_-;_-@';
const DATE_FORMAT  = "dd/mm/yy";

export function exportRendicionXLSX(rendicion, tipo) {
  const titulo = tipo === "CC"
    ? `MARKETING - Caja Chica ${rendicion.label}`
    : `META ADS - ${rendicion.label}`;

  const egresos = rendicion.items.filter(r => r.tipo === "Egreso");
  const ingresos = rendicion.items.filter(r => r.tipo === "Ingreso");
  const saldoAnterior = Number(rendicion.montoAsignado || 0);

  // --- Crear workbook con estilos ---
  const wb = {
    SheetNames: [rendicion.label.substring(0, 31)],
    Sheets: {},
    Props: {}
  };

  const wsName = rendicion.label.substring(0, 31);
  const ws = {};

  const setCell = (addr, v, s) => {
    ws[addr] = { v, s, t: typeof v === "number" ? "n" : typeof v === "string" ? "s" : "s" };
    if (s?.numFmt) ws[addr].z = s.numFmt;
  };

  const setText = (addr, v, s) => { ws[addr] = { v, s, t: "s" }; };
  const setNum  = (addr, v, s) => { ws[addr] = { v, s, t: "n" }; if (s?.numFmt) ws[addr].z = s.numFmt; };
  const setForm = (addr, f, s) => { ws[addr] = { f, s, t: "n" }; if (s?.numFmt) ws[addr].z = s.numFmt; };

  // --- Fila 2: Empresa ---
  setText("A2", "TALLER DE DISEÑO CONSTRUCTIVO S.A.C", {
    font: { name: "Swis721 Lt BT", sz: 10, bold: true, color: { argb: GRAY_TITLE } }
  });

  // --- Fila 3: Título ---
  setText("A3", titulo, {
    font: { name: "Swis721 Lt BT", sz: 12, bold: true, color: { argb: GRAY_TITLE } }
  });

  // --- Fila 5: Headers sección ---
  const hdrStyle = (b) => ({
    font: { name: "Calibri", sz: 9, bold: true },
    fill: fillSolid(GRAY_HEADER),
    alignment: { horizontal: "center", vertical: "center" },
    border: b
  });

  setText("A5", "DESCRIPCIÓN", hdrStyle(border("medium","thin","medium","thin")));
  setText("I5", "INGRESOS",    hdrStyle(border("medium","thin","medium","thin")));
  setText("J5", "EGRESOS",     hdrStyle(border("thin","thin","medium","thin")));
  setText("K5", "BALANCE",     hdrStyle(border("thin","medium","medium","thin")));
  setText("L5", "ESTADO DE COMPROBANTES", hdrStyle(border("medium","medium","medium","medium")));

  // Celdas B5:H5 vacías con estilo
  ["B5","C5","D5","E5","F5","G5","H5"].forEach(a =>
    setText(a, "", hdrStyle(border(undefined,undefined,"medium","thin")))
  );

  // --- Filas 6-7: Encabezados columna ---
  const colHdrs = [
    ["A6","PROYECTO"],["B6","ETAPA"],["C6","PARTIDA / SUBPARTIDA"],
    ["D6","FECHA DE PAGO"],["E6","# COMPROBANTE"],["F6","EMISIÓN"],
    ["G6","PROVEEDOR O BENEFICIARIO"],["H6","REFERENCIA"]
  ];
  colHdrs.forEach(([addr, val]) => {
    setText(addr, val, {
      font: { name: "Calibri", sz: 9, bold: true },
      fill: fillSolid(GRAY_HEADER),
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: border("thin","thin","thin","medium")
    });
  });

  // I6, J6, K6
  setText("I6", "", { fill: fillSolid(GRAY_HEADER), border: border("medium","thin","thin","thin") });
  setText("J6", "", { fill: fillSolid(GRAY_HEADER), border: border("thin","thin","thin","thin") });
  setText("K6", "", { fill: fillSolid(GRAY_HEADER), border: border("thin","medium","thin","thin") });
  setText("L6", "", { fill: fillSolid(GRAY_HEADER), border: border(undefined,"medium",undefined,undefined) });

  // Fila 7 — MONTO y SALDO
  ["A7","B7","C7","D7","E7","F7","G7","H7"].forEach(a =>
    setText(a, "", { fill: fillSolid(GRAY_HEADER), border: border("thin","thin","thin","medium") })
  );
  setText("J7", "MONTO", {
    font: { name: "Calibri", sz: 9, bold: true },
    fill: fillSolid(GRAY_HEADER),
    alignment: { horizontal: "center", vertical: "center" },
    border: border("thin","thin","thin","medium")
  });
  setText("K7", "SALDO", {
    font: { name: "Calibri", sz: 9, bold: true },
    fill: fillSolid(GRAY_HEADER),
    alignment: { horizontal: "center", vertical: "center" },
    border: border("thin","medium","thin","medium")
  });
  setText("I7", "", { fill: fillSolid(GRAY_HEADER), border: border("medium","thin","thin","medium") });
  setText("L7", "", { fill: fillSolid(GRAY_HEADER), border: border(undefined,"medium",undefined,undefined) });

  // --- Fila 8: Separadora amarilla ---
  ["A8","B8","C8","D8","E8","F8","G8","H8","I8","J8","K8","L8"].forEach(a =>
    setText(a, "", {
      fill: fillSolid(YELLOW_ROW),
      border: border("thin","thin","thin","thin")
    })
  );

  // --- Fila 9: SALDO ANTERIOR ---
  ["A9","B9","C9","D9","E9","F9","G9"].forEach(a =>
    setText(a, "", { fill: fillSolid(YELLOW_ROW), border: border("thin","thin","thin","thin") })
  );
  setText("H9", "SALDO ANTERIOR", {
    font: { name: "Calibri", sz: 9, bold: true },
    fill: fillSolid(YELLOW_ROW),
    alignment: { horizontal: "right", vertical: "center", wrapText: true },
    border: border("thin","thin","thin","thin")
  });
  setNum("I9", saldoAnterior, {
    font: { name: "Calibri", sz: 10, bold: true },
    fill: fillSolid(YELLOW_ROW),
    numFmt: MONEY_FORMAT,
    alignment: { horizontal: "right" },
    border: border("thin","thin","thin","thin")
  });
  setNum("J9", 0, {
    font: { name: "Calibri", sz: 10, bold: true },
    fill: fillSolid(YELLOW_ROW),
    numFmt: MONEY_FORMAT,
    alignment: { horizontal: "right" },
    border: border("thin","thin","thin","thin")
  });
  setNum("K9", saldoAnterior, {
    font: { name: "Calibri", sz: 10, bold: true, color: { argb: RED_TEXT } },
    fill: fillSolid(YELLOW_ROW),
    numFmt: MONEY_FORMAT,
    alignment: { horizontal: "right" },
    border: border("thin","medium","thin","thin")
  });
  setText("L9", "", { fill: fillSolid(YELLOW_ROW), border: border(undefined,"medium",undefined,undefined) });

  // --- Fila 10: PERIODO ---
  setText("A10", "PERIODO", {
    font: { name: "Calibri", sz: 11, bold: true },
    fill: fillSolid(GRAY_TOTAL),
    alignment: { horizontal: "left", vertical: "center" },
    border: border("medium",undefined,"medium",undefined)
  });
  ["B10","C10","D10","E10","F10","G10","H10"].forEach(a =>
    setText(a, "", { fill: fillSolid(GRAY_TOTAL), border: border(undefined,undefined,"medium",undefined) })
  );

  const totalI = ingresos.reduce((a, r) => a + Number(r.monto || 0), 0);
  const totalE = egresos.reduce((a, r) => a + Number(r.monto || 0), 0);

  setNum("I10", totalI, {
    font: { name: "Calibri", sz: 10, bold: true },
    fill: fillSolid(GRAY_TOTAL),
    numFmt: MONEY_FORMAT,
    alignment: { horizontal: "right" },
    border: border("thin","thin","medium","thin")
  });
  setNum("J10", totalE, {
    font: { name: "Calibri", sz: 10, bold: true },
    fill: fillSolid(GRAY_TOTAL),
    numFmt: MONEY_FORMAT,
    alignment: { horizontal: "right" },
    border: border("thin","thin","medium","thin")
  });
  setNum("K10", totalI - totalE, {
    font: { name: "Calibri", sz: 10, bold: true },
    fill: fillSolid(GRAY_TOTAL),
    numFmt: MONEY_FORMAT,
    alignment: { horizontal: "right" },
    border: border("thin","medium","medium","thin")
  });
  setText("L10", "", { border: border(undefined,"medium","thin","thin") });

  // --- Filas 11+: Fila vacía separadora ---
  ["A11","B11","C11","D11","E11","F11","G11","H11","I11","J11","K11"].forEach(a =>
    setText(a, "", { border: border("thin","thin","thin","thin") })
  );
  setText("L11", "", { border: border(undefined,"medium",undefined,undefined) });

  // --- Filas de datos ---
  const dataFont = { name: "Calibri", sz: 10 };
  const dataBorder = border("thin","thin","thin","thin");

  const parseDate = (s) => {
    if (!s) return "";
    const d = new Date(s);
    if (isNaN(d)) return s;
    // Excel date serial
    const epoch = new Date(1899, 11, 30);
    const serial = Math.floor((d - epoch) / 86400000);
    return serial;
  };

  let rowIdx = 12;

  egresos.forEach((r, i) => {
    const row = rowIdx + i;
    const rStr = String(row);

    setText(`A${rStr}`, r.proyecto || "", { font: dataFont, alignment: { horizontal: "center", vertical: "center" }, border: dataBorder });
    setText(`B${rStr}`, r.tipoGasto || "", { font: dataFont, alignment: { horizontal: "center" }, border: dataBorder });
    setText(`C${rStr}`, "", { font: dataFont, border: dataBorder });

    const dateVal = parseDate(r.fecha);
    ws[`D${rStr}`] = { v: dateVal, t: "n", z: DATE_FORMAT, s: { font: dataFont, alignment: { horizontal: "center" }, border: dataBorder, numFmt: DATE_FORMAT } };

    setText(`E${rStr}`, String(r.comprobante || ""), { font: dataFont, alignment: { horizontal: "center" }, border: dataBorder });

    const emisionVal = parseDate(r.emision || r.fecha);
    ws[`F${rStr}`] = { v: emisionVal, t: "n", z: DATE_FORMAT, s: { font: dataFont, alignment: { horizontal: "center" }, border: dataBorder, numFmt: DATE_FORMAT } };

    setText(`G${rStr}`, r.proveedor || "", { font: dataFont, alignment: { horizontal: "left" }, border: dataBorder });
    setText(`H${rStr}`, r.referencia || "", { font: dataFont, alignment: { horizontal: "left", wrapText: true }, border: dataBorder });

    setText(`I${rStr}`, "", { font: dataFont, border: dataBorder });
    setNum(`J${rStr}`, Number(r.monto || 0), { font: dataFont, numFmt: MONEY_FORMAT, alignment: { horizontal: "right" }, border: dataBorder });
    setText(`K${rStr}`, "", { font: dataFont, alignment: { horizontal: "right", vertical: "center" }, border: dataBorder });
    setText(`L${rStr}`, "", { border: border(undefined,"medium",undefined,undefined) });
  });

  rowIdx += egresos.length;

  ingresos.forEach((r, i) => {
    const row = rowIdx + i;
    const rStr = String(row);

    setText(`A${rStr}`, r.proyecto || "", { font: dataFont, alignment: { horizontal: "center" }, border: dataBorder });
    setText(`B${rStr}`, r.tipoGasto || "", { font: dataFont, border: dataBorder });
    setText(`C${rStr}`, "", { font: dataFont, border: dataBorder });
    setText(`D${rStr}`, "", { font: dataFont, border: dataBorder });
    setText(`E${rStr}`, String(r.comprobante || ""), { font: dataFont, border: dataBorder });
    setText(`F${rStr}`, "", { font: dataFont, border: dataBorder });
    setText(`G${rStr}`, r.proveedor || "", { font: dataFont, alignment: { horizontal: "left" }, border: dataBorder });
    setText(`H${rStr}`, r.referencia || "", { font: dataFont, alignment: { horizontal: "left", wrapText: true }, border: dataBorder });
    setNum(`I${rStr}`, Number(r.monto || 0), { font: dataFont, numFmt: MONEY_FORMAT, alignment: { horizontal: "right" }, border: dataBorder });
    setText(`J${rStr}`, "", { font: dataFont, border: dataBorder });
    setText(`K${rStr}`, "", { font: dataFont, border: dataBorder });
    setText(`L${rStr}`, "", { border: border(undefined,"medium",undefined,undefined) });
  });

  const lastRow = rowIdx + ingresos.length;

  // --- Merged cells ---
  ws["!merges"] = [
    { s:{r:4,c:0}, e:{r:4,c:7} },  // A5:H5
    { s:{r:4,c:11},e:{r:6,c:11} }, // L5:L7
    { s:{r:5,c:0}, e:{r:6,c:0} },  // A6:A7
    { s:{r:5,c:1}, e:{r:6,c:1} },  // B6:B7
    { s:{r:5,c:2}, e:{r:6,c:2} },  // C6:C7
    { s:{r:5,c:3}, e:{r:6,c:3} },  // D6:D7
    { s:{r:5,c:4}, e:{r:6,c:4} },  // E6:E7
    { s:{r:5,c:5}, e:{r:6,c:5} },  // F6:F7
    { s:{r:5,c:6}, e:{r:6,c:6} },  // G6:G7
    { s:{r:5,c:7}, e:{r:6,c:7} },  // H6:H7
    { s:{r:9,c:0}, e:{r:9,c:7} },  // A10:H10
  ];

  // --- Column widths ---
  ws["!cols"] = [
    { wch: 11.71 }, // A
    { wch: 10.71 }, // B
    { wch: 12.00 }, // C
    { wch: 11.71 }, // D
    { wch: 21.43 }, // E
    { wch: 11.86 }, // F
    { wch: 36.86 }, // G
    { wch: 69.14 }, // H
    { wch: 13.14 }, // I
    { wch: 8 },     // J
    { wch: 8 },     // K
    { wch: 24.43, hidden: true }, // L — HIDDEN
    { wch: 11.43 }, // M
  ];

  // --- Row heights ---
  ws["!rows"] = [
    { hpt: 12 }, // row 1
    { hpt: 15 }, // row 2
    { hpt: 15 }, // row 3
    { hpt: 13.5 },
    { hpt: 12 },
    { hpt: 12 },
    { hpt: 12 },
    { hpt: 12 },
    { hpt: 12 },
    { hpt: 12 },
  ];

  // --- Ref range ---
  ws["!ref"] = `A1:M${lastRow + 5}`;

  // --- Page setup ---
  ws["!pageSetup"] = {
    orientation: "landscape",
    fitToPage: false,
    paperSize: 9, // A4
  };
  ws["!margins"] = {
    left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0, footer: 0
  };

  wb.Sheets[wsName] = ws;

  const wbout = write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Rendicion_${tipo}_${rendicion.label.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}