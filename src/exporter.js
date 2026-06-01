// exporter.js — ExcelJS con estructura exacta de la plantilla TDC
import { rendicionLabel } from "./constants.js";

export async function exportRendicionXLSX(rendicion, tipo) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const periodo = rendicionLabel(rendicion, tipo);
  const wsName = periodo.substring(0, 31);
  const ws = wb.addWorksheet(wsName, {
    pageSetup: { orientation: "landscape", paperSize: 9 },
    views: [{ zoomScale: 85 }],
  });

  const GRAY_HDR  = "FFD8D8D8";
  const YELLOW    = "FFFFFF00";
  const GRAY_TOT  = "FFBFBFBF";
  const RED       = "FFFF0000";
  const BLACK     = "FF000000";
  const GRAY_TITLE= "FF595959";
  const MONEY_FMT = '_-"S/" * #,##0.00_-;\\-"S/" * #,##0.00_-;_-"S/" * "-"??_-;_-@';
  const DATE_FMT  = "dd/mm/yy";

  const solidFill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
  const thin   = { style: "thin",   color: { argb: BLACK } };
  const medium = { style: "medium", color: { argb: BLACK } };
  const mkB = (l,r,t,b) => ({
    left:   l==="m"?medium:l==="t"?thin:{},
    right:  r==="m"?medium:r==="t"?thin:{},
    top:    t==="m"?medium:t==="t"?thin:{},
    bottom: b==="m"?medium:b==="t"?thin:{},
  });

  const cal  = (sz,bold,color) => ({ name:"Calibri", size:sz, bold:!!bold, color:{argb:color||BLACK} });
  const swis = (sz,bold) => ({ name:"Swis721 Lt BT", size:sz, bold:!!bold, color:{argb:GRAY_TITLE} });

  const C = (addr, value, style) => {
    const cell = ws.getCell(addr);
    if (value !== undefined && value !== null) cell.value = value;
    if (style?.font)      cell.font      = style.font;
    if (style?.fill)      cell.fill      = style.fill;
    if (style?.border)    cell.border    = style.border;
    if (style?.alignment) cell.alignment = style.alignment;
    if (style?.numFmt)    cell.numFmt    = style.numFmt;
  };

  const titulo = tipo === "CC"
    ? `MARKETING - Caja Chica ${periodo}`
    : `META ADS - ${periodo}`;

  const egresos = rendicion.items.filter(r => r.tipo === "Egreso");
  const ingresos = rendicion.items.filter(r => r.tipo === "Ingreso");
  const totalE   = egresos.reduce((a,r) => a+Number(r.monto||0), 0);
  const totalI   = ingresos.reduce((a,r) => a+Number(r.monto||0), 0);
  const saldoAnt = Number(rendicion.montoAsignado||0);

  // ── Column widths ─────────────────────────────────────────────────────────
  ws.getColumn("A").width = 11.71;
  ws.getColumn("B").width = 10.71;
  ws.getColumn("C").width = 12.00;
  ws.getColumn("D").width = 11.71;
  ws.getColumn("E").width = 21.43;
  ws.getColumn("F").width = 11.86;
  ws.getColumn("G").width = 36.86;
  ws.getColumn("H").width = 69.14;
  ws.getColumn("I").width = 13.14;
  ws.getColumn("J").width = 8;
  ws.getColumn("K").width = 8;
  ws.getColumn("L").width = 24.43;
  ws.getColumn("L").hidden = true;
  ws.getColumn("M").width = 11.43;

  // ── Row heights ───────────────────────────────────────────────────────────
  ws.getRow(1).height  = 12;
  ws.getRow(2).height  = 15;
  ws.getRow(3).height  = 15;
  ws.getRow(4).height  = 13.5;
  for (let r=5; r<=11; r++) ws.getRow(r).height = 12;

  // ── Fila 2 ────────────────────────────────────────────────────────────────
  C("A2", "TALLER DE DISEÑO CONSTRUCTIVO S.A.C", { font: swis(10,true) });
  C("A3", titulo, { font: swis(12,true) });

  // ── Fila 5: DESCRIPCIÓN / INGRESOS / EGRESOS / BALANCE ───────────────────
  ws.mergeCells("A5:H5");
  C("A5","DESCRIPCIÓN",{ font:cal(9,true), fill:solidFill(GRAY_HDR), alignment:{horizontal:"center",vertical:"middle"}, border:mkB("m","t","m","t") });
  C("I5","INGRESOS",   { font:cal(9,true), fill:solidFill(GRAY_HDR), alignment:{horizontal:"center",vertical:"middle"}, border:mkB("m","t","m","t") });
  C("J5","EGRESOS",    { font:cal(9,true), fill:solidFill(GRAY_HDR), alignment:{horizontal:"center",vertical:"middle"}, border:mkB("t","t","m","t") });
  C("K5","BALANCE",    { font:cal(9,true), fill:solidFill(GRAY_HDR), alignment:{horizontal:"center",vertical:"middle"}, border:mkB("t","m","m","t") });
  ws.mergeCells("L5:L7");
  C("L5","ESTADO DE COMPROBANTES",{ font:cal(9,true), fill:solidFill(GRAY_HDR), alignment:{horizontal:"center",vertical:"middle",wrapText:true}, border:mkB("m","m","m","m") });

  // ── Filas 6-7: Encabezados columna ───────────────────────────────────────
  const hdrs = [["A","PROYECTO"],["B","ETAPA"],["C","PARTIDA / SUBPARTIDA"],["D","FECHA DE PAGO"],["E","# COMPROBANTE"],["F","EMISIÓN"],["G","PROVEEDOR O BENEFICIARIO"],["H","REFERENCIA"]];
  hdrs.forEach(([col, val]) => {
    ws.mergeCells(`${col}6:${col}7`);
    C(`${col}6`, val, { font:cal(9,true), fill:solidFill(GRAY_HDR), alignment:{horizontal:"center",vertical:"middle",wrapText:true}, border:mkB("t","t","t","m") });
  });
  C("I6","",{ fill:solidFill(GRAY_HDR), border:mkB("m","t","t","t") });
  C("I7","",{ fill:solidFill(GRAY_HDR), border:mkB("m","t","t","m") });
  C("J7","MONTO",{ font:cal(9,true), fill:solidFill(GRAY_HDR), alignment:{horizontal:"center",vertical:"middle"}, border:mkB("t","t","t","m") });
  C("K7","SALDO",{ font:cal(9,true), fill:solidFill(GRAY_HDR), alignment:{horizontal:"center",vertical:"middle"}, border:mkB("t","m","t","m") });
  ["J6","K6"].forEach(a => C(a,"",{ fill:solidFill(GRAY_HDR), border:mkB("t","t","t","t") }));

  // ── Fila 8: Separadora amarilla ───────────────────────────────────────────
  "ABCDEFGHIJK".split("").forEach(col =>
    C(`${col}8`,"",{ fill:solidFill(YELLOW), border:mkB("t","t","t","t") })
  );
  C("L8","",{ border:mkB(undefined,"m",undefined,undefined) });

  // ── Fila 9: SALDO ANTERIOR ────────────────────────────────────────────────
  "ABCDEFG".split("").forEach(col =>
    C(`${col}9`,"",{ fill:solidFill(YELLOW), border:mkB("t","t","t","t") })
  );
  C("H9","SALDO ANTERIOR",{ font:cal(9,true), fill:solidFill(YELLOW), alignment:{horizontal:"right",vertical:"middle",wrapText:true}, border:mkB("t","t","t","t") });
  C("I9", saldoAnt, { font:cal(10,true), fill:solidFill(YELLOW), numFmt:MONEY_FMT, alignment:{horizontal:"right"}, border:mkB("t","t","t","t") });
  C("J9", 0,        { font:cal(10,true), fill:solidFill(YELLOW), numFmt:MONEY_FMT, alignment:{horizontal:"right"}, border:mkB("t","t","t","t") });
  C("K9", saldoAnt, { font:{name:"Calibri",size:10,bold:true,color:{argb:RED}}, fill:solidFill(YELLOW), numFmt:MONEY_FMT, alignment:{horizontal:"right"}, border:mkB("t","m","t","t") });
  C("L9","",{ fill:solidFill(YELLOW), border:mkB(undefined,"m",undefined,undefined) });

  // ── Fila 10: PERIODO ──────────────────────────────────────────────────────
  ws.mergeCells("A10:H10");
  C("A10","PERIODO",{ font:cal(11,true), fill:solidFill(GRAY_TOT), alignment:{horizontal:"left",vertical:"middle"}, border:mkB("m",undefined,"m",undefined) });
  C("I10", totalI,        { font:cal(10,true), fill:solidFill(GRAY_TOT), numFmt:MONEY_FMT, alignment:{horizontal:"right"}, border:mkB("t","t","m","t") });
  C("J10", totalE,        { font:cal(10,true), fill:solidFill(GRAY_TOT), numFmt:MONEY_FMT, alignment:{horizontal:"right"}, border:mkB("t","t","m","t") });
  C("K10", totalI-totalE, { font:cal(10,true), fill:solidFill(GRAY_TOT), numFmt:MONEY_FMT, alignment:{horizontal:"right"}, border:mkB("t","m","m","t") });
  C("L10","",{ border:mkB(undefined,"m","t","t") });

  // ── Fila 11: vacía ────────────────────────────────────────────────────────
  "ABCDEFGHIJK".split("").forEach(col =>
    C(`${col}11`,"",{ border:mkB("t","t","t","t") })
  );
  C("L11","",{ border:mkB(undefined,"m",undefined,undefined) });

  // ── Filas de datos ────────────────────────────────────────────────────────
  // Estructura exacta de la plantilla:
  // A=vacío, B=vacío, C=vacío, D=num correlativo, E=comprobante, F=fecha emisión, G=proveedor, H=referencia, I=ingreso, J=egreso (monto)
  const parseDate = (s) => { if(!s) return null; const d=new Date(s); return isNaN(d)?null:d; };
  const dataBorder = mkB("t","t","t","t");
  let rowIdx = 12;

  egresos.forEach((r, i) => {
    const row = rowIdx++;
    ws.getRow(row).height = 12;
    // A, B, C vacíos
    C(`A${row}`,"",{ font:cal(10), border:dataBorder });
    C(`B${row}`,"",{ font:cal(10), border:dataBorder });
    C(`C${row}`,"",{ font:cal(10), border:dataBorder });
    // D: número correlativo
    C(`D${row}`, i+1, { font:cal(10), border:dataBorder, alignment:{horizontal:"center"} });
    // E: comprobante
    C(`E${row}`, String(r.comprobante||""), { font:cal(10), border:dataBorder, alignment:{horizontal:"center"} });
    // F: fecha emisión
    const fc = ws.getCell(`F${row}`);
    fc.value = parseDate(r.emision||r.fecha);
    fc.numFmt = DATE_FMT;
    fc.font = cal(10); fc.border = dataBorder; fc.alignment = {horizontal:"center"};
    // G: proveedor
    C(`G${row}`, r.proveedor||"", { font:cal(10), border:dataBorder, alignment:{horizontal:"left"} });
    // H: referencia
    C(`H${row}`, r.referencia||"", { font:cal(10), border:dataBorder, alignment:{horizontal:"left",wrapText:true} });
    // I: vacío para egresos
    C(`I${row}`,"",{ font:cal(10), border:dataBorder });
    // J: monto egreso
    C(`J${row}`, Number(r.monto||0), { font:cal(10), border:dataBorder, numFmt:MONEY_FMT, alignment:{horizontal:"right"} });
    C(`K${row}`,"",{ font:cal(10), border:dataBorder });
    C(`L${row}`,"",{ border:mkB(undefined,"m",undefined,undefined) });
  });

  ingresos.forEach((r) => {
    const row = rowIdx++;
    ws.getRow(row).height = 12;
    C(`A${row}`,"",{ font:cal(10), border:dataBorder });
    C(`B${row}`,"",{ font:cal(10), border:dataBorder });
    C(`C${row}`,"",{ font:cal(10), border:dataBorder });
    C(`D${row}`,"",{ font:cal(10), border:dataBorder });
    C(`E${row}`, String(r.comprobante||""), { font:cal(10), border:dataBorder });
    C(`F${row}`,"",{ font:cal(10), border:dataBorder });
    C(`G${row}`, r.proveedor||"", { font:cal(10), border:dataBorder, alignment:{horizontal:"left"} });
    C(`H${row}`, r.referencia||"", { font:cal(10), border:dataBorder, alignment:{horizontal:"left",wrapText:true} });
    C(`I${row}`, Number(r.monto||0), { font:cal(10), border:dataBorder, numFmt:MONEY_FMT, alignment:{horizontal:"right"} });
    C(`J${row}`,"",{ font:cal(10), border:dataBorder });
    C(`K${row}`,"",{ font:cal(10), border:dataBorder });
    C(`L${row}`,"",{ border:mkB(undefined,"m",undefined,undefined) });
  });

  // ── Márgenes ──────────────────────────────────────────────────────────────
  ws.pageSetup.margins = { left:0.7, right:0.7, top:0.75, bottom:0.75, header:0, footer:0 };

  // ── Descargar ─────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Rendicion_${tipo}_${periodo.replace(/[^a-zA-Z0-9]/g,"_")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
//  PLANILLA DE MOVILIDAD — réplica de la plantilla oficial FIN-FO-001
// ─────────────────────────────────────────────────────────────────────────────
export function buildMovilidadWorkbook(planilla, ExcelJS) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet((planilla.trabajador || "Movilidad").substring(0, 31), {
    pageSetup: { orientation: "portrait", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ zoomScale: 90 }],
  });

  const BLACK = "FF000000", GRAY_HDR = "FFD9D9D9", GRAY_TOT = "FFBFBFBF", DARK = "FF595959";
  const MONEY = '"S/" #,##0.00';
  const solid = argb => ({ type:"pattern", pattern:"solid", fgColor:{ argb } });
  const thin = { style:"thin", color:{ argb:BLACK } };
  const allThin = { top:thin, bottom:thin, left:thin, right:thin };
  const cal = (sz, bold, color, italic) => ({ name:"Calibri", size:sz, bold:!!bold, italic:!!italic, color:{ argb:color||BLACK } });
  const center = { horizontal:"center", vertical:"middle", wrapText:true };
  const left   = { horizontal:"left",   vertical:"middle", wrapText:true };
  const C = (addr, value, st={}) => {
    const c = ws.getCell(addr);
    if (value !== undefined && value !== null) c.value = value;
    if (st.font) c.font = st.font;
    if (st.fill) c.fill = st.fill;
    if (st.border) c.border = st.border;
    if (st.alignment) c.alignment = st.alignment;
    if (st.numFmt) c.numFmt = st.numFmt;
    return c;
  };

  // ── Anchos ──
  ws.getColumn("A").width = 6.5;   // DÍA
  ws.getColumn("B").width = 6.5;   // MES
  ws.getColumn("C").width = 6.5;   // AÑO
  ws.getColumn("D").width = 38;    // MOTIVO
  ws.getColumn("E").width = 20;    // DESTINO
  ws.getColumn("F").width = 16;    // PROYECTO
  ws.getColumn("G").width = 13;    // VIAJE
  ws.getColumn("H").width = 13;    // DÍA (subtotal)

  // ── Cabecera (filas 1-4) ──
  ws.mergeCells("A1:C4");
  C("A1", "TALLER DE DISEÑO\nCONSTRUCTIVO", { font:cal(11,true,DARK), alignment:center, border:allThin });
  ws.mergeCells("D1:F1"); C("D1","MEJORA CONTINUA",      { font:cal(10,true), alignment:center, border:allThin });
  ws.mergeCells("D2:F4"); C("D2","PLANILLA DE MOVILIDAD", { font:cal(14,true), alignment:center, border:allThin });
  C("G1","FIN-FO-001",        { font:cal(9), alignment:center, border:allThin }); ws.mergeCells("G1:H1");
  C("G2","Fecha: 07/10/2025", { font:cal(9), alignment:center, border:allThin }); ws.mergeCells("G2:H2");
  C("G3","Nro. Página 1 de 1",{ font:cal(9), alignment:center, border:allThin }); ws.mergeCells("G3:H3");
  C("G4","Versión: 01",       { font:cal(9), alignment:center, border:allThin }); ws.mergeCells("G4:H4");

  // ── Datos de la planilla ──
  C("A6","PLANILLA POR GASTO DE MOVILIDAD POR TRABAJADOR", { font:cal(11,true) }); ws.mergeCells("A6:H6");
  C("A7",`PLANILLA N° ${planilla.numero || ""}`, { font:cal(10,true) }); ws.mergeCells("A7:H7");

  const lbl = (addr, val) => C(addr, val, { font:cal(9,true), fill:solid(GRAY_HDR), alignment:left, border:allThin });
  const inp = (addr, val) => C(addr, val, { font:cal(9), alignment:left, border:allThin });
  const fmtFecha = s => { if(!s) return ""; const [y,m,d] = String(s).split("-"); return d&&m&&y ? `${d}/${m}/${y}` : s; };

  lbl("A9","FECHA");    C("B9", fmtFecha(planilla.fecha), { font:cal(9), alignment:left, border:allThin }); ws.mergeCells("B9:C9");
  lbl("A10","PERIODO"); C("B10", planilla.periodo||"",    { font:cal(9), alignment:left, border:allThin }); ws.mergeCells("B10:C10");

  C("A12","DATOS DEL EMPLEADOR", { font:cal(10,true), fill:solid(GRAY_HDR), alignment:left, border:allThin }); ws.mergeCells("A12:H12");
  lbl("A13","RAZÓN SOCIAL"); inp("B13", planilla.razonSocial||""); ws.mergeCells("B13:H13");
  lbl("A14","RUC");          inp("B14", planilla.ruc||"");          ws.mergeCells("B14:H14");

  C("A16","DATOS DEL TRABAJADOR", { font:cal(10,true), fill:solid(GRAY_HDR), alignment:left, border:allThin }); ws.mergeCells("A16:H16");
  lbl("A17","NOMBRE"); inp("B17", planilla.trabajador||""); ws.mergeCells("B17:H17");
  lbl("A18","DNI");    inp("B18", planilla.dni||"");         ws.mergeCells("B18:H18");

  // ── Encabezado de la tabla (filas 20-21) ──
  const hdr = st => ({ font:cal(9,true), fill:solid(GRAY_HDR), alignment:center, border:allThin, ...st });
  ws.mergeCells("A20:C20"); C("A20","FECHA DEL GASTO",   hdr());
  ws.mergeCells("D20:F20"); C("D20","DESPLAZAMIENTO",     hdr());
  ws.mergeCells("G20:H20"); C("G20","MONTO GASTADO POR",  hdr());
  C("A21","DÍA",hdr()); C("B21","MES",hdr()); C("C21","AÑO",hdr());
  C("D21","MOTIVO",hdr()); C("E21","DESTINO",hdr()); C("F21","PROYECTO",hdr());
  C("G21","VIAJE",hdr()); C("H21","DÍA",hdr());

  // ── Filas de datos (agrupadas por día, subtotal por día) ──
  const items = [...(planilla.items||[])].sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
  let row = 22;
  let grandTotal = 0;
  let i = 0;
  while (i < items.length) {
    const fecha = items[i].fecha;
    let j = i;
    let subtotal = 0;
    const startRow = row;
    while (j < items.length && items[j].fecha === fecha) {
      const it = items[j];
      const [y,m,d] = String(it.fecha||"").split("-");
      const monto = Number(it.monto||0);
      subtotal += monto; grandTotal += monto;
      C(`A${row}`, d?Number(d):"", { font:cal(9), alignment:center, border:allThin });
      C(`B${row}`, m?Number(m):"", { font:cal(9), alignment:center, border:allThin });
      C(`C${row}`, y?Number(y):"", { font:cal(9), alignment:center, border:allThin });
      C(`D${row}`, it.motivo||"",  { font:cal(9), alignment:left,   border:allThin });
      C(`E${row}`, it.destino||"", { font:cal(9), alignment:left,   border:allThin });
      C(`F${row}`, it.proyecto||"",{ font:cal(9), alignment:center, border:allThin });
      C(`G${row}`, monto,          { font:cal(9), alignment:{horizontal:"right",vertical:"middle"}, numFmt:MONEY, border:allThin });
      C(`H${row}`, "",             { font:cal(9), border:allThin });
      row++; j++;
    }
    // Subtotal del día en H, combinando las filas del grupo
    if (row-1 >= startRow) {
      if (row-1 > startRow) ws.mergeCells(`H${startRow}:H${row-1}`);
      C(`H${startRow}`, subtotal, { font:cal(9,true), alignment:center, numFmt:MONEY, border:allThin });
    }
    i = j;
  }
  if (items.length === 0) { // fila vacía mínima
    "ABCDEFGH".split("").forEach(col=>C(`${col}${row}`,"",{ border:allThin })); row++;
  }

  // ── Total general ──
  ws.mergeCells(`A${row}:F${row}`);
  C(`A${row}`,"TOTAL", { font:cal(10,true), fill:solid(GRAY_TOT), alignment:{horizontal:"right",vertical:"middle"}, border:allThin });
  C(`G${row}`, grandTotal, { font:cal(10,true), fill:solid(GRAY_TOT), numFmt:MONEY, alignment:{horizontal:"right",vertical:"middle"}, border:allThin });
  C(`H${row}`, grandTotal, { font:cal(10,true), fill:solid(GRAY_TOT), numFmt:MONEY, alignment:{horizontal:"right",vertical:"middle"}, border:allThin });
  row += 3;

  // ── Firma ──
  C(`A${row}`,"_____________________________", { font:cal(10) }); ws.mergeCells(`A${row}:C${row}`);
  C(`F${row}`,"_____________________________", { font:cal(10) }); ws.mergeCells(`F${row}:H${row}`);
  row++;
  C(`A${row}`,"V° B°", { font:cal(9,true), alignment:{horizontal:"center"} }); ws.mergeCells(`A${row}:C${row}`);
  C(`F${row}`,"FIRMA DEL TRABAJADOR", { font:cal(9,true), alignment:{horizontal:"center"} }); ws.mergeCells(`F${row}:H${row}`);
  row += 2;

  // ── Base legal ──
  C(`A${row}`,"BASE LEGAL", { font:cal(8,true) }); row++;
  C(`A${row}`,"Inciso a1) del artículo 37º del TUO de la Ley del Impuesto a la Renta — gastos de movilidad de los trabajadores.",
    { font:cal(8,false,BLACK,true), alignment:left }); ws.mergeCells(`A${row}:H${row}`);

  ws.pageSetup.margins = { left:0.5, right:0.5, top:0.6, bottom:0.6, header:0, footer:0 };
  return wb;
}

export async function exportMovilidadXLSX(planilla) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = buildMovilidadWorkbook(planilla, ExcelJS);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safe = (planilla.trabajador||"planilla").replace(/[^a-zA-Z0-9]/g,"_");
  a.download = `Movilidad_${safe}_${(planilla.periodo||"").replace(/[^a-zA-Z0-9]/g,"_")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}