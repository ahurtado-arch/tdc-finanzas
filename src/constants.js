export const PROYECTOS      = ["LC","A3","LM2","LM3","AQ","PC","GENERAL"];
export const TIPOS_GASTO_CC = ["Cerco","Lovemark","Entrega","Movilidad","Impresiones Cerco","Impresiones Obra","Impresiones Oficina","Software / Digital","Otros"];
export const TIPOS_DOC      = ["Factura","Boleta","Ticket","RPH","Otro"];
export const MESES          = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
export const MONEDAS        = ["Soles (S/)", "Dólares ($)"];

// ─────────────────────────────────────────────────────────────────────────
//  SISTEMA DE DISEÑO TDC
//  Paleta, tipografía, redondez, sombras y gradientes en tokens.
//  El objeto TDC conserva las claves antiguas (remapeadas) para no romper
//  los componentes existentes que las consumen.
// ─────────────────────────────────────────────────────────────────────────

// Tipografía
export const FONT = {
  sans: "'General Sans', system-ui, -apple-system, sans-serif", // texto
  num:  "'Sora', system-ui, sans-serif",                        // números
};

// Redondez
export const RADIUS = { sm: 8, md: 12, lg: 16, pill: 999 };

// Sombras
export const SHADOW = {
  sm:      "0 1px 3px rgba(15,27,39,0.06), 0 1px 2px rgba(15,27,39,0.04)",
  md:      "0 6px 18px rgba(15,27,39,0.08), 0 2px 6px rgba(15,27,39,0.05)",
  lg:      "0 18px 48px rgba(15,27,39,0.14), 0 6px 16px rgba(15,27,39,0.08)",
  redGlow: "0 6px 20px rgba(238,43,47,0.35), 0 2px 6px rgba(238,43,47,0.25)",
};

// Gradientes de marca
export const GRADIENT = {
  // Glass de marca: coral → red500 → red600
  glass: "linear-gradient(135deg, #F14757 0%, #EE2B2F 55%, #C81E22 100%)",
  // Hero: 5 puntos radiales superpuestos + base linear (wine → dkred → red500)
  hero: [
    "radial-gradient(circle at 14% 18%, rgba(241,71,87,0.55), transparent 45%)",
    "radial-gradient(circle at 82% 12%, rgba(238,43,47,0.50), transparent 42%)",
    "radial-gradient(circle at 72% 88%, rgba(161,27,33,0.60), transparent 52%)",
    "radial-gradient(circle at 22% 82%, rgba(77,14,22,0.75), transparent 48%)",
    "radial-gradient(circle at 50% 48%, rgba(241,71,87,0.22), transparent 60%)",
    "linear-gradient(135deg, #4D0E16 0%, #A11B21 52%, #EE2B2F 100%)",
  ].join(", "),
};

export const TDC = {
  // — Marca —
  red500:      "#EE2B2F",
  red600:      "#C81E22",
  coral:       "#F14757",
  // — Tinta —
  ink:         "#0F1B27",
  muted:       "#6B7C8C",
  faint:       "#9AAAB8",
  // — Semántica —
  green:       "#16A34A",
  amber:       "#F59E0B",
  sky:         "#7CBCDE",
  // — Neutros —
  bg:          "#F4F7FA",
  card:        "#FFFFFF",
  border:      "#E7EDF3",

  // — Claves heredadas (remapeadas a la nueva paleta) —
  red:         "#EE2B2F",  // → red500
  redLight:    "#F14757",  // → coral
  redDark:     "#C81E22",  // → red600
  surface:     "#FFFFFF",
  surfaceHov:  "#EEF3F8",
  borderStrong:"#D6DFE8",
  text:        "#0F1B27",  // → ink
  textSub:     "#243544",
  textDim:     "#6B7C8C",  // → muted
  textLight:   "#9AAAB8",  // → faint
  white:       "#FFFFFF",
  greenLight:  "#DCFCE7",
  redLight2:   "#FDECEC",  // tint de red500
  headerBg:    "#FFFFFF",
  headerBorder:"#E7EDF3",
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
  card:      { background:TDC.card, border:`1px solid ${TDC.border}`, borderRadius:RADIUS.lg, padding:20, boxShadow:SHADOW.sm },
  cardLabel: { fontSize:10, fontWeight:700, color:TDC.faint, textTransform:"uppercase", letterSpacing:"0.8px" },
  label:     { fontSize:11, color:TDC.muted, marginBottom:5, fontWeight:600 },
  input:     { background:TDC.bg, border:`1px solid ${TDC.border}`, borderRadius:RADIUS.sm, padding:"9px 12px", color:TDC.ink, fontSize:13, width:"100%", outline:"none", fontFamily:FONT.sans },
  select:    { background:TDC.bg, border:`1px solid ${TDC.border}`, borderRadius:RADIUS.sm, padding:"9px 12px", color:TDC.ink, fontSize:13, width:"100%", outline:"none", fontFamily:FONT.sans },
  // Estilo de número: Sora + tabular-nums (usar en montos, fechas, contadores)
  num:       { fontFamily:FONT.num, fontVariantNumeric:"tabular-nums" },
};
