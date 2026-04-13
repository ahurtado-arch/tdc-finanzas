export const PROYECTOS     = ["LC","A3","LM2","LM3","AQ","PC","GENERAL"];
export const TIPOS_GASTO_CC = ["Cerco / Lovemark","Entrega / Movilidad","Impresiones Cerco","Impresiones Obra","Impresiones Oficina","Software / Digital","Otros"];
export const TIPOS_DOC     = ["Factura","Boleta","Ticket","RPH","Otro"];
export const MESES         = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export const TDC = {
  red:        "#D32F2F",
  redLight:   "#EF5350",
  navy:       "#1A2340",
  navyMid:    "#1E2B4A",
  navyLight:  "#243158",
  navyBorder: "#2D3D6B",
  white:      "#FFFFFF",
  gray:       "#8A9BC0",
  grayDim:    "#4A5A80",
  text:       "#E8EDF8",
  textDim:    "#7A8AB0",
  green:      "#1E8C5A",
};

export const PROJ_COLORS = {
  LC:"#E53935", A3:"#8E24AA", LM2:"#E91E63",
  LM3:"#F4A825", AQ:"#1E8C5A", PC:"#1565C0", GENERAL:"#546E8A",
};

export const TIPO_COLORS = {
  "Cerco / Lovemark":    "#D32F2F",
  "Entrega / Movilidad": "#1E8C5A",
  "Impresiones Cerco":   "#F4A825",
  "Impresiones Obra":    "#1565C0",
  "Impresiones Oficina": "#8E24AA",
  "Software / Digital":  "#0288D1",
  "Otros":               "#546E8A",
};

export const fmt  = n => `S/ ${Number(n||0).toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
export const uid  = () => Math.random().toString(36).slice(2,10);
export const today= () => new Date().toISOString().slice(0,10);
export const mesLabel = () => { const d=new Date(); return `${MESES[d.getMonth()]} ${d.getFullYear()}`; };

export const emptyRendicion = tipo => ({
  id: uid(),
  label: `${tipo==="CC"?"CC":"META"} - ${mesLabel()} - I`,
  montoAsignado: 0,
  fechaCreacion: today(),
  items: [],
});

export const emptyItemCC = () => ({
  id:uid(), proyecto:"GENERAL", tipoGasto:"Otros", partida:"",
  fecha:today(), comprobante:"", emision:today(),
  proveedor:"", referencia:"", tipoDoc:"Boleta",
  monto:"", tipo:"Egreso", estadoDoc:"Pendiente",
  adjunto:null, adjuntoNombre:"",
});

export const emptyItemMeta = () => ({
  id:uid(), proyecto:"GENERAL",
  fecha:today(), comprobante:"", emision:today(),
  proveedor:"Meta Platforms Ireland Limited", referencia:"",
  tipoDoc:"Factura", monto:"", tipo:"Egreso",
  estadoDoc:"Pendiente", adjunto:null, adjuntoNombre:"",
});

// Shared card / input styles
export const S = {
  card:      { background:"#1E2B4A", border:"1px solid #2D3D6B", borderRadius:14, padding:20 },
  cardLabel: { fontSize:10, fontWeight:700, color:"#4A5A80", textTransform:"uppercase", letterSpacing:"0.8px" },
  label:     { fontSize:11, color:"#4A5A80", marginBottom:5, fontWeight:600 },
  input:     { background:"#1A2340", border:"1px solid #2D3D6B", borderRadius:8, padding:"9px 12px", color:"#E8EDF8", fontSize:13, width:"100%", outline:"none", fontFamily:"'DM Sans',sans-serif" },
  select:    { background:"#1A2340", border:"1px solid #2D3D6B", borderRadius:8, padding:"9px 12px", color:"#E8EDF8", fontSize:13, width:"100%", outline:"none", fontFamily:"'DM Sans',sans-serif" },
};
