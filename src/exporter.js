import * as XLSX from "xlsx";

export function exportRendicionXLSX(rendicion, tipo) {
  const titulo = tipo === "CC"
    ? `MARKETING - Caja Chica ${rendicion.label}`
    : `META ADS - ${rendicion.label}`;

  const egresos = rendicion.items.filter(r => r.tipo === "Egreso");
  const ingresos = rendicion.items.filter(r => r.tipo === "Ingreso");
  const totalEgreso = egresos.reduce((a, r) => a + Number(r.monto || 0), 0);
  const totalIngreso = ingresos.reduce((a, r) => a + Number(r.monto || 0), 0);
  const saldoAnterior = Number(rendicion.montoAsignado || 0);

  // Rows de datos — empiezan en fila 12 (índice 11)
  const dataRows = egresos.map(r => [
    r.proyecto || "",
    r.tipoGasto || "",
    "",
    r.fecha || "",
    r.comprobante || "",
    r.emision || "",
    r.proveedor || "",
    r.referencia || "",
    "",
    Number(r.monto || 0),
    "",
    "",
  ]);

  // Dotaciones / ingresos al final
  ingresos.forEach(r => {
    dataRows.push([
      "", "", "", r.fecha || "", "", r.emision || "",
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
    // Fila 6 — sub-headers
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
