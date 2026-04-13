import * as XLSX from "xlsx";

export function exportRendicionXLSX(rendicion, tipo) {
  const empresa = "TALLER DE DISEÑO CONSTRUCTIVO S.A.C";
  const titulo  = tipo === "CC"
    ? `MARKETING - Caja Chica ${rendicion.label}`
    : `META ADS - ${rendicion.label}`;

  const headersCC = [
    "PROYECTO","ETAPA","PARTIDA / SUBPARTIDA","FECHA DE PAGO",
    "# COMPROBANTE","EMISIÓN","PROVEEDOR O BENEFICIARIO","REFERENCIA",
    "TIPO DOC","INGRESOS","EGRESOS","BALANCE","ESTADO",
  ];
  const headersMeta = [
    "PROYECTO","FECHA DE PAGO","# COMPROBANTE","EMISIÓN",
    "PROVEEDOR O BENEFICIARIO","REFERENCIA","TIPO DOC",
    "INGRESOS","EGRESOS","BALANCE","ESTADO",
  ];

  const rows = rendicion.items.map(r =>
    tipo === "CC"
      ? [r.proyecto||"", r.tipoGasto||"", r.partida||"", r.fecha||"",
         r.comprobante||"", r.emision||"", r.proveedor||"", r.referencia||"",
         r.tipoDoc||"",
         r.tipo==="Ingreso" ? Number(r.monto)||0 : "",
         r.tipo==="Egreso"  ? Number(r.monto)||0 : "",
         "", r.estadoDoc||""]
      : [r.proyecto||"", r.fecha||"", r.comprobante||"", r.emision||"",
         r.proveedor||"", r.referencia||"", r.tipoDoc||"",
         r.tipo==="Ingreso" ? Number(r.monto)||0 : "",
         r.tipo==="Egreso"  ? Number(r.monto)||0 : "",
         "", r.estadoDoc||""]
  );

  const totalI = rendicion.items
    .filter(r => r.tipo === "Ingreso")
    .reduce((a, r) => a + Number(r.monto||0), 0);
  const totalE = rendicion.items
    .filter(r => r.tipo === "Egreso")
    .reduce((a, r) => a + Number(r.monto||0), 0);

  const aoa = [
    [empresa],
    [titulo],
    [],
    ["DESCRIPCIÓN","","","","","","","","","INGRESOS","EGRESOS","BALANCE","ESTADO"],
    tipo === "CC" ? headersCC : headersMeta,
    [],
    ["","","","","","","","SALDO ANTERIOR","",
      rendicion.montoAsignado||0, "", -(rendicion.montoAsignado||0), ""],
    ["PERIODO","","","","","","","","", rendicion.montoAsignado||0,"","",""],
    [],
    ...rows,
    [],
    ["","","","","","","","TOTALES","", totalI, totalE, totalI - totalE, ""],
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, rendicion.label.substring(0, 31));
  XLSX.writeFile(wb, `Rendicion_${tipo}_${rendicion.label.replace(/[^a-zA-Z0-9]/g,"_")}.xlsx`);
}
