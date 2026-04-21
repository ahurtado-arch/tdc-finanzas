export const PROYECTOS      = ["LC","A3","LM2","LM3","AQ","PC","GENERAL"];
export const TIPOS_GASTO_CC = ["Cerco","Lovemark","Entrega","Movilidad","Impresiones Cerco","Impresiones Obra","Impresiones Oficina","Software / Digital","Otros"];
export const TIPOS_DOC      = ["Factura","Boleta","Ticket","RPH","Otro"];
export const MESES          = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
export const MONEDAS        = ["Soles (S/)", "Dólares ($)"];

export const TDC = {
  red:         "#D32F2F",
  redLight:    "#EF5350",
  redDark:     "#B71C1C",
  bg:          "#F5F5F5",
  surface:     "#FFFFFF",
  surfaceHov:  "#F8F8F8",
  border:      "#E0E0E0",
  borderStrong:"#BDBDBD",
  text:        "#212121",
  textSub:     "#424242",
  textDim:     "#757575",
  textLight:   "#9E9E9E",
  white:       "#FFFFFF",
  green:       "#2E7D32",
  greenLight:  "#E8F5E9",
  redLight2:   "#FFEBEE",
  headerBg:    "#FFFFFF",
  headerBorder:"#E0E0E0",
};

export const PROJ_COLORS = {
  LC:"#C62828", A3:"#6A1B9A", LM2:"#AD1457",
  LM3:"#E65100", AQ:"#2E7D32", PC:"#1565C0", GENERAL:"#455A64",
};

export const TIPO_COLORS = {
  "Cerco":               "#C62828",
  "Lovemark":            "#AD1457",
  "Entrega":             "#2E7D32",
  "Movilidad":           "#00695C",
  "Impresiones Cerco":   "#E65100",
  "Impresiones Obra":    "#1565C0",
  "Impresiones Oficina": "#6A1B9A",
  "Software / Digital":  "#0277BD",
  "Otros":               "#455A64",
};

export const fmtMonto = (n, moneda) => {
  const num = Number(n||0).toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2});
  return moneda === "Dólares ($)" ? `$ ${num}` : `S/ ${num}`;
};
export const fmt   = n => `S/ ${Number(n||0).toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
export const uid   = () => Math.random().toString(36).slice(2,10);
export const today = () => new Date().toISOString().slice(0,10);
export const mesLabel = () => { const d=new Date(); return `${MESES[d.getMonth()]} ${d.getFullYear()}`; };

export const emptyRendicion = tipo => ({
  id: uid(),
  label: `${tipo==="CC"?"CC":"META"} - ${mesLabel()} - I`,
  montoAsignado: 0,
  moneda: "Soles (S/)",
  fechaCreacion: today(),
  items: [],
});

export const emptyItemCC = () => ({
  id:uid(), proyecto:"GENERAL", tipoGasto:"Otros", partida:"",
  fecha:today(), comprobante:"", emision:today(),
  proveedor:"", referencia:"", tipoDoc:"Boleta",
  monto:"", tipo:"Egreso", adjunto:null, adjuntoNombre:"",
});

export const emptyItemMeta = () => ({
  id:uid(), proyecto:"GENERAL",
  fecha:today(), comprobante:"", emision:today(),
  proveedor:"Meta Platforms Ireland Limited", referencia:"",
  tipoDoc:"Factura", monto:"", tipo:"Egreso",
  adjunto:null, adjuntoNombre:"",
});

export const S = {
  card:      { background:"#FFFFFF", border:"1px solid #E0E0E0", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" },
  cardLabel: { fontSize:10, fontWeight:700, color:"#9E9E9E", textTransform:"uppercase", letterSpacing:"0.8px" },
  label:     { fontSize:11, color:"#757575", marginBottom:5, fontWeight:600 },
  input:     { background:"#FAFAFA", border:"1px solid #E0E0E0", borderRadius:8, padding:"9px 12px", color:"#212121", fontSize:13, width:"100%", outline:"none", fontFamily:"'DM Sans',sans-serif" },
  select:    { background:"#FAFAFA", border:"1px solid #E0E0E0", borderRadius:8, padding:"9px 12px", color:"#212121", fontSize:13, width:"100%", outline:"none", fontFamily:"'DM Sans',sans-serif" },
};
