import * as XLSX from "xlsx";

export function exportRendicionXLSX(rendicion, tipo) {
  const titulo = tipo === "CC"
    ? `MARKETING - Caja Chica ${rendicion.label}`
    : `META ADS - ${rendicion.label}`;

  const egresos = rendicion.items.filter(r => r.tipo === "Egreso");
  const ingresos = rendicion.items.filter(r => r.tipo === "Ingreso");
  const totalEgreso  = egresos.reduce((a, r) => a + Number(r.monto || 0), 0);
  const totalIngreso = ingresos.reduce((a, r) => a + Number(r.monto || 0), 0);
  const saldoAnterior = Number(rendicion.montoAsignado || 0);

  // Filas de datos — col A vacía, col B=etapa, col C=partida, col D=num, col E=comprobante, col F=emisión, col G=proveedor, col H=referencia, col I=ingreso, col J=egreso
  const dataRows = egresos.map((r, i) => [
    "",                          // A - PROYECTO (vacío como en el original)
    r.tipoGasto || "",           // B - ETAPA
    "",                          // C - PARTIDA
    i + 1,                       // D - número correlativo
    r.comprobante || "",         // E - # COMPROBANTE
    r.emision || r.fecha || "",  // F - EMISIÓN
    r.proveedor || "",           // G - PROVEEDOR
    r.referencia || "",          // H - REFERENCIA
    "",                          // I - INGRESOS (vacío para egresos)
    Number(r.monto || 0),        // J - EGRESOS
    "",                          // K - SALDO
    "",                          // L - ESTADO
  ]);

  // Ingresos/dotaciones
  ingresos.forEach((r, i) => {
    dataRows.push([
      "", r.tipoGasto || "", "", egresos.length + i + 1,
      r.comprobante || "", r.emision || r.fecha || "",
      r.proveedor || "", r.referencia || "",
      Number(r.monto || 0), "", "", "",
    ]);
  });

  const aoa = [
    // Fila 1 — vacía
    [],
    // Fila 2
    ["TALLER DE DISEÑO CONSTRUCTIVO S.A.C"],
    // Fila 3
    [titulo],
    // Fila 4 — vacía
    [],
    // Fila 5 — headers principales
    ["DESCRIPCIÓN","","","","","","","","INGRESOS","EGRESOS","BALANCE","ESTADO DE COMPROBANTES"],
    // Fila 6 — sub-headers columnas
    ["PROYECTO","ETAPA","PARTIDA / SUBPARTIDA","FECHA DE PAGO","# COMPROBANTE","EMISIÓN","PROVEEDOR O BENEFICIARIO","REFERENCIA","","","",""],
    // Fila 7
    ["","","","","","","","","","MONTO","SALDO",""],
    // Fila 8 — vacía
    [],
    // Fila 9 — saldo anterior
    ["","","","","","","","SALDO ANTERIOR", saldoAnterior, "", saldoAnterior, ""],
    // Fila 10 — periodo
    ["PERIODO","","","","","","","", totalIngreso, totalEgreso, "", ""],
    // Fila 11 — vacía
    [],
    // Filas de datos
    ...dataRows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, rendicion.label.substring(0, 31));
  XLSX.writeFile(wb, `Rendicion_${tipo}_${rendicion.label.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`);
}