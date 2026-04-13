import { useState, useRef } from "react";
import { scanPDF } from "./aiScanner.js";
import {
  PROYECTOS, TIPOS_GASTO_CC, TIPOS_DOC,
  TDC, S, today, emptyItemCC, emptyItemMeta,
} from "./constants.js";

export default function ItemModal({ item, tipo, onSave, onCancel }) {
  const [f, setF]         = useState({ ...item });
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const pdfRef  = useRef();
  const set     = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid   = f.fecha && f.proveedor && f.monto;

  // ── PDF scan ──────────────────────────────────────────────────────────────
  const handleScan = async e => {
    const file = e.target.files[0];
    pdfRef.current.value = "";
    if (!file) return;
    setScanning(true);
    setScanError("");
    try {
      const extracted = await scanPDF(file, tipo);
      // Merge AI data into current form — keep id, proyecto (user sets it)
      setF(prev => ({
        ...prev,
        tipoDoc:     extracted.tipoDoc     || prev.tipoDoc,
        comprobante: extracted.comprobante || prev.comprobante,
        emision:     extracted.emision     || prev.emision,
        fecha:       extracted.fecha       || prev.fecha,
        proveedor:   extracted.proveedor   || prev.proveedor,
        referencia:  extracted.referencia  || prev.referencia,
        monto:       extracted.monto       || prev.monto,
        tipoGasto:   extracted.tipoGasto   || prev.tipoGasto,
        adjuntoNombre: file.name,
        adjunto: null, // PDF not stored
        _aiScanned: true,
      }));
    } catch (err) {
      setScanError(err.message || "Error al analizar el PDF.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(10,14,28,0.88)",
      zIndex:300, display:"flex", alignItems:"center", justifyContent:"center",
      padding:20, backdropFilter:"blur(4px)",
    }}>
      <div style={{
        background:TDC.navyMid, border:`1px solid ${TDC.navyBorder}`,
        borderRadius:18, width:"100%", maxWidth:700,
        maxHeight:"92vh", overflowY:"auto",
        boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
      }}>

        {/* ── Header ── */}
        <div style={{
          background:`linear-gradient(135deg,${TDC.navyLight},${TDC.navyMid})`,
          borderBottom:`1px solid ${TDC.navyBorder}`,
          padding:"18px 24px", borderRadius:"18px 18px 0 0",
          display:"flex", alignItems:"center", justifyContent:"space-between",
        }}>
          <div>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <span style={{fontWeight:800, fontSize:16, color:TDC.white}}>
                {item.proveedor ? "Editar Registro" : "Nuevo Registro"}
              </span>
              {f._aiScanned && (
                <span style={{background:`${TDC.red}25`, color:TDC.red, border:`1px solid ${TDC.red}44`, borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:700}}>
                  ✨ Completado por IA
                </span>
              )}
            </div>
            <div style={{fontSize:12, color:TDC.grayDim, marginTop:2}}>
              {f._aiScanned
                ? "Revisa y corrige antes de guardar — especialmente Proyecto y Tipo de Gasto"
                : tipo === "CC" ? "Caja Chica" : "Meta Ads"}
            </div>
          </div>
          <button onClick={onCancel} style={{background:`${TDC.navyBorder}60`, border:"none", borderRadius:8, color:TDC.gray, cursor:"pointer", width:32, height:32, fontSize:20, display:"flex", alignItems:"center", justifyContent:"center"}}>×</button>
        </div>

        {/* ── AI notice ── */}
        {f._aiScanned && (
          <div style={{background:`${TDC.red}0D`, borderBottom:`1px solid ${TDC.red}22`, padding:"10px 24px", display:"flex", alignItems:"center", gap:8, fontSize:12, color:TDC.textDim}}>
            <span style={{fontSize:15}}>🤖</span>
            <span>Datos extraídos del PDF. Verifica el <b style={{color:TDC.text}}>monto</b>, el <b style={{color:TDC.text}}>proyecto</b> y el <b style={{color:TDC.text}}>tipo de gasto</b>.</span>
          </div>
        )}

        <div style={{padding:24}}>

          {/* ── PDF scan area ── */}
          <div style={{
            background:TDC.navy, border:`1.5px dashed ${scanning ? TDC.red : TDC.navyBorder}`,
            borderRadius:12, padding:"16px 20px", marginBottom:20,
            display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12,
          }}>
            <div>
              <div style={{fontWeight:700, color:TDC.white, fontSize:13, marginBottom:3}}>📄 Escanear comprobante PDF</div>
              <div style={{fontSize:11, color:TDC.grayDim}}>
                {f.adjuntoNombre
                  ? <span style={{color:TDC.red}}>✓ {f.adjuntoNombre} — datos extraídos</span>
                  : "Sube el PDF y la IA llenará los campos automáticamente"}
              </div>
            </div>
            <button
              onClick={() => !scanning && pdfRef.current.click()}
              disabled={scanning}
              style={{
                padding:"9px 18px", border:"none", borderRadius:9,
                background: scanning ? "rgba(211,47,47,0.35)" : `linear-gradient(135deg,${TDC.red},${TDC.redLight})`,
                color:"#fff", fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
                cursor: scanning ? "not-allowed" : "pointer",
                display:"flex", alignItems:"center", gap:7,
                boxShadow: scanning ? "none" : "0 2px 10px rgba(211,47,47,0.3)",
              }}
            >
              {scanning
                ? <><Spinner/> Analizando…</>
                : "📄 Subir PDF"}
            </button>
            <input ref={pdfRef} type="file" accept=".pdf,application/pdf" style={{display:"none"}} onChange={handleScan}/>
            {scanError && <div style={{width:"100%", color:TDC.red, fontSize:12, marginTop:4}}>⚠ {scanError}</div>}
          </div>

          {/* ── Tipo toggle ── */}
          <div style={{display:"flex", gap:8, marginBottom:20}}>
            {["Egreso","Ingreso"].map(t => {
              const active = f.tipo === t;
              const color  = t === "Ingreso" ? TDC.green : TDC.red;
              return (
                <button key={t} onClick={() => set("tipo", t)} style={{
                  padding:"9px 24px", borderRadius:10, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif",
                  border:`1.5px solid ${active ? color : TDC.navyBorder}`,
                  background: active ? `${color}18` : "transparent",
                  color: active ? color : TDC.grayDim,
                  fontWeight:700, fontSize:13, transition:"all .15s",
                }}>{t === "Ingreso" ? "↑ Ingreso" : "↓ Egreso"}</button>
              );
            })}
          </div>

          {/* ── Fields ── */}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
            <div>
              <div style={S.label}>Proyecto *</div>
              <select style={S.select} value={f.proyecto} onChange={e => set("proyecto", e.target.value)}>
                {PROYECTOS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {tipo === "CC" && <>
              <div>
                <div style={S.label}>Tipo de Gasto *</div>
                <select style={S.select} value={f.tipoGasto} onChange={e => set("tipoGasto", e.target.value)}>
                  {TIPOS_GASTO_CC.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{gridColumn:"span 2"}}>
                <div style={S.label}>Partida / Subpartida</div>
                <input style={S.input} value={f.partida||""} onChange={e => set("partida", e.target.value)} placeholder="Ej: Movilidad, Materiales de impresión…"/>
              </div>
            </>}

            <div>
              <div style={S.label}>Fecha de Pago *</div>
              <input type="date" style={f._aiScanned ? {...S.input, borderColor:`${TDC.red}88`} : S.input} value={f.fecha} onChange={e => set("fecha", e.target.value)}/>
            </div>
            <div>
              <div style={S.label}>Fecha de Emisión</div>
              <input type="date" style={f._aiScanned ? {...S.input, borderColor:`${TDC.red}88`} : S.input} value={f.emision||""} onChange={e => set("emision", e.target.value)}/>
            </div>
            <div>
              <div style={S.label}># Comprobante</div>
              <input style={S.input} value={f.comprobante||""} onChange={e => set("comprobante", e.target.value)} placeholder="E001-XXX / F001-XXX"/>
            </div>
            <div>
              <div style={S.label}>Tipo de Documento</div>
              <select style={S.select} value={f.tipoDoc} onChange={e => set("tipoDoc", e.target.value)}>
                {TIPOS_DOC.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{gridColumn:"span 2"}}>
              <div style={S.label}>Proveedor / Beneficiario *</div>
              <input style={f._aiScanned ? {...S.input, borderColor:`${TDC.red}88`} : S.input} value={f.proveedor} onChange={e => set("proveedor", e.target.value)} placeholder="Nombre completo o razón social"/>
            </div>
            <div style={{gridColumn:"span 2"}}>
              <div style={S.label}>Referencia / Descripción</div>
              <input style={S.input} value={f.referencia||""} onChange={e => set("referencia", e.target.value)} placeholder="Concepto del gasto o ingreso"/>
            </div>
            <div>
              <div style={S.label}>Monto (S/) *</div>
              <input
                type="number"
                style={{
                  ...S.input,
                  color: f.tipo === "Ingreso" ? TDC.green : TDC.red,
                  fontWeight:700,
                  ...(f._aiScanned ? {borderColor:`${TDC.red}88`} : {}),
                }}
                value={f.monto}
                onChange={e => set("monto", e.target.value)}
                placeholder="0.00" step="0.01"
              />
            </div>
            <div>
              <div style={S.label}>Estado del Comprobante</div>
              <select style={S.select} value={f.estadoDoc||"Pendiente"} onChange={e => set("estadoDoc", e.target.value)}>
                {["Pendiente","Recibido","Enviado a Finanzas","Observado"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{display:"flex", gap:10, justifyContent:"flex-end", marginTop:22, paddingTop:18, borderTop:`1px solid ${TDC.navyBorder}`}}>
            <button onClick={onCancel} style={{padding:"9px 20px", border:`1px solid ${TDC.navyBorder}`, borderRadius:9, background:"transparent", color:TDC.grayDim, fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13, cursor:"pointer"}}>
              Cancelar
            </button>
            <button
              onClick={() => valid && onSave({ ...f, _aiScanned: undefined })}
              style={{
                padding:"9px 22px", border:"none", borderRadius:9,
                cursor: valid ? "pointer" : "not-allowed",
                background: valid ? `linear-gradient(135deg,${TDC.red},${TDC.redLight})` : "rgba(211,47,47,0.3)",
                color:"#fff", fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13,
                boxShadow: valid ? "0 2px 10px rgba(211,47,47,0.3)" : "none",
              }}
            >
              {f._aiScanned ? "✓ Confirmar y Guardar" : "Guardar Registro"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{width:13, height:13, border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.8s linear infinite"}}/>
  );
}
