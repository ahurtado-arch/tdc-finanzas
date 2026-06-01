import { useState, useRef } from "react";
import { scanPDF } from "./aiScanner.js";
import { PROYECTOS, TIPOS_GASTO_CC, TIPOS_DOC, TDC, S, today, MONEDAS, samePeriodo, presLabel } from "./constants.js";
import { Button } from "./ui.jsx";

export default function ItemModal({ item, tipo, moneda, presupuestos = [], periodo, onSave, onCancel }) {
  const [f, setF]           = useState({ ...item });
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const pdfRef = useRef();
  const set    = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid  = f.fecha && f.proveedor && f.monto;

  // ── Vínculo con partida de presupuesto (cascada Presupuesto → Bloque → Partida) ──
  // Prioriza presupuestos del mismo período (Mes · # · Año) que la rendición.
  const matching = presupuestos.filter(p => samePeriodo(p, periodo));
  const usaFallback = matching.length === 0;
  let pool = matching.length ? matching : presupuestos;
  // Mantener visible el presupuesto ya vinculado aunque no coincida el período.
  const linked = presupuestos.find(p => p.id === f.presId);
  if (linked && !pool.some(p => p.id === linked.id)) pool = [linked, ...pool];

  const selPres   = pool.find(p => p.id === f.presId) || null;
  const selBloque = (selPres?.bloques || []).find(b => b.id === f.bloqueId) || null;
  const setPres    = v => setF(p => ({ ...p, presId: v, bloqueId: "", partidaId: "" }));
  const setBloque  = v => setF(p => ({ ...p, bloqueId: v, partidaId: "" }));
  const setPartida = v => setF(p => ({ ...p, partidaId: v }));

  const handleScan = async e => {
    const file = e.target.files[0];
    pdfRef.current.value = "";
    if (!file) return;
    setScanning(true); setScanError("");
    try {
      const extracted = await scanPDF(file, tipo);
      setF(prev => ({
        ...prev,
        tipoDoc:       extracted.tipoDoc     || prev.tipoDoc,
        comprobante:   extracted.comprobante || prev.comprobante,
        emision:       extracted.emision     || prev.emision,
        fecha:         extracted.fecha       || prev.fecha,
        proveedor:     extracted.proveedor   || prev.proveedor,
        referencia:    extracted.referencia  || prev.referencia,
        monto:         extracted.monto       || prev.monto,
        tipoGasto:     extracted.tipoGasto   || prev.tipoGasto,
        adjuntoNombre: file.name,
        adjunto:       null,
        _aiScanned:    true,
      }));
    } catch (err) {
      setScanError(err.message || "Error al analizar el PDF.");
    } finally {
      setScanning(false);
    }
  };

  const btnRed = {
    padding:"9px 22px",border:"none",borderRadius:9,cursor:valid?"pointer":"not-allowed",
    background:valid?`linear-gradient(135deg,${TDC.red},${TDC.redLight})`:"#FFCDD2",
    color:valid?"#fff":TDC.redLight,fontFamily:"'General Sans',sans-serif",fontWeight:700,fontSize:13,
    transition:"all .2s",boxShadow:valid?"0 2px 8px rgba(211,47,47,0.25)":"none",
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:TDC.surface,borderRadius:18,width:"100%",maxWidth:700,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.12)"}}>

        {/* Header */}
        <div style={{borderBottom:`1px solid ${TDC.border}`,padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontWeight:800,fontSize:16,color:TDC.text}}>
                {item.proveedor ? "Editar Registro" : "Nuevo Registro"}
              </div>
              {f._aiScanned && (
                <span style={{background:"#FFF3E0",color:"#E65100",border:"1px solid #FFCC02",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700}}>
                  ✨ Completado por IA
                </span>
              )}
            </div>
            <div style={{fontSize:12,color:TDC.textDim,marginTop:2}}>
              {f._aiScanned ? "Revisa y corrige antes de guardar" : tipo==="CC"?"Caja Chica":"Meta Ads"}
            </div>
          </div>
          <button onClick={onCancel} style={{background:TDC.bg,border:`1px solid ${TDC.border}`,borderRadius:8,color:TDC.textDim,cursor:"pointer",width:32,height:32,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>

        {/* AI notice */}
        {f._aiScanned && (
          <div style={{background:"#FFF8E1",borderBottom:`1px solid #FFE082`,padding:"10px 24px",display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#795548"}}>
            <span>🤖</span>
            <span>Datos extraídos del PDF. Verifica el <b>monto</b>, el <b>proyecto</b> y el <b>tipo de gasto</b>.</span>
          </div>
        )}

        <div style={{padding:24}}>
          {/* PDF scan */}
          <div style={{background:TDC.bg,border:`1.5px dashed ${scanning?TDC.red:TDC.border}`,borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,transition:"border-color .2s"}}>
            <div>
              <div style={{fontWeight:700,color:TDC.text,fontSize:13,marginBottom:3}}>📄 Escanear comprobante</div>
              <div style={{fontSize:11,color:TDC.textDim}}>
                {f.adjuntoNombre
                  ? <span style={{color:TDC.green}}>✓ {f.adjuntoNombre} — datos extraídos</span>
                  : "Sube el PDF o imagen y la IA llenará los campos automáticamente"}
              </div>
            </div>
            <button onClick={()=>!scanning&&pdfRef.current.click()} disabled={scanning} style={{
              padding:"8px 16px",border:"none",borderRadius:9,
              background:scanning?"#EF9A9A":`linear-gradient(135deg,${TDC.red},${TDC.redLight})`,
              color:"#fff",fontFamily:"'General Sans',sans-serif",fontWeight:700,fontSize:12,
              cursor:scanning?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:7,
              boxShadow:scanning?"none":"0 2px 8px rgba(211,47,47,0.25)",
            }}>
              {scanning
                ? <><Spinner/> Analizando…</>
                : "📄 Subir PDF"}
            </button>
            <input ref={pdfRef} type="file" accept=".pdf,application/pdf,image/*" style={{display:"none"}} onChange={handleScan}/>
            {scanError && <div style={{width:"100%",color:TDC.red,fontSize:12,marginTop:4}}>⚠ {scanError}</div>}
          </div>

          {/* Tipo toggle */}
          <div style={{display:"flex",gap:8,marginBottom:20}}>
            {["Egreso","Ingreso"].map(t => {
              const active = f.tipo===t;
              const color  = t==="Ingreso" ? TDC.green : TDC.red;
              const bg     = t==="Ingreso" ? TDC.greenLight : TDC.redLight2;
              return (
                <button key={t} onClick={()=>set("tipo",t)} style={{
                  padding:"9px 24px",borderRadius:10,cursor:"pointer",fontFamily:"'General Sans',sans-serif",
                  border:`1.5px solid ${active?color:TDC.border}`,
                  background:active?bg:"transparent",
                  color:active?color:TDC.textDim,fontWeight:700,fontSize:13,transition:"all .15s",
                }}>{t==="Ingreso"?"↑ Ingreso":"↓ Egreso"}</button>
              );
            })}
          </div>

          {/* Fields */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div>
              <div style={S.label}>Proyecto *</div>
              <select style={S.select} value={f.proyecto} onChange={e=>set("proyecto",e.target.value)}>
                {PROYECTOS.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            {tipo==="CC" && (
              <div>
                <div style={S.label}>Tipo de Gasto *</div>
                <select style={S.select} value={f.tipoGasto} onChange={e=>set("tipoGasto",e.target.value)}>
                  {TIPOS_GASTO_CC.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            )}
            <div>
              <div style={S.label}>Fecha de Pago *</div>
              <input type="date" style={f._aiScanned?{...S.input,borderColor:"#FFAB91"}:S.input} value={f.fecha} onChange={e=>set("fecha",e.target.value)}/>
            </div>
            <div>
              <div style={S.label}>Fecha de Emisión</div>
              <input type="date" style={f._aiScanned?{...S.input,borderColor:"#FFAB91"}:S.input} value={f.emision||""} onChange={e=>set("emision",e.target.value)}/>
            </div>
            <div>
              <div style={S.label}># Comprobante</div>
              <input style={S.input} value={f.comprobante||""} onChange={e=>set("comprobante",e.target.value)} placeholder="E001-XXX / F001-XXX"/>
            </div>
            <div>
              <div style={S.label}>Tipo de Documento</div>
              <select style={S.select} value={f.tipoDoc} onChange={e=>set("tipoDoc",e.target.value)}>
                {TIPOS_DOC.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{gridColumn:"span 2"}}>
              <div style={S.label}>Proveedor / Beneficiario *</div>
              <input style={f._aiScanned?{...S.input,borderColor:"#FFAB91"}:S.input} value={f.proveedor} onChange={e=>set("proveedor",e.target.value)} placeholder="Nombre completo o razón social"/>
            </div>
            <div style={{gridColumn:"span 2"}}>
              <div style={S.label}>Referencia / Descripción</div>
              <input style={S.input} value={f.referencia||""} onChange={e=>set("referencia",e.target.value)} placeholder="Concepto del gasto o ingreso"/>
            </div>
            <div>
              <div style={S.label}>Monto *</div>
              <input type="number"
                style={{...S.input,...S.num,color:f.tipo==="Ingreso"?TDC.green:TDC.red600,fontWeight:700,...(f._aiScanned?{borderColor:"#FFAB91"}:{})}}
                value={f.monto} onChange={e=>set("monto",e.target.value)} placeholder="0.00" step="0.01"/>
              <div style={{fontSize:10,color:TDC.textLight,marginTop:3}}>{moneda}</div>
            </div>

            {/* Vínculo con partida de presupuesto — cascada de 3 desplegables */}
            <div style={{gridColumn:"span 2"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <div style={S.label}>Partida de presupuesto (vincular)</div>
                {f.presId && (
                  <button type="button" onClick={()=>setPres("")}
                    style={{background:"transparent",border:"none",color:TDC.red,cursor:"pointer",fontSize:11,fontWeight:600,padding:0}}>
                    Quitar vínculo
                  </button>
                )}
              </div>
              {pool.length === 0 ? (
                <div style={{...S.input,color:TDC.textLight,display:"flex",alignItems:"center"}}>No hay presupuestos creados todavía.</div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {/* 1) Presupuesto */}
                  <select style={S.select} value={f.presId||""} onChange={e=>setPres(e.target.value)}>
                    <option value="">1· Presupuesto…</option>
                    {pool.map(p=><option key={p.id} value={p.id}>{presLabel(p)}</option>)}
                  </select>
                  {/* 2) Bloque */}
                  <select style={{...S.select,opacity:selPres?1:.5,cursor:selPres?"pointer":"not-allowed"}}
                    value={f.bloqueId||""} disabled={!selPres} onChange={e=>setBloque(e.target.value)}>
                    <option value="">2· Bloque…</option>
                    {(selPres?.bloques||[]).map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                  </select>
                  {/* 3) Partida */}
                  <select style={{...S.select,opacity:selBloque?1:.5,cursor:selBloque?"pointer":"not-allowed"}}
                    value={f.partidaId||""} disabled={!selBloque} onChange={e=>setPartida(e.target.value)}>
                    <option value="">3· Partida…</option>
                    {(selBloque?.items||[]).map(it=><option key={it.id} value={it.id}>{it.concepto||"(sin concepto)"}</option>)}
                  </select>
                </div>
              )}
              <div style={{fontSize:10,color:TDC.textLight,marginTop:3}}>
                {pool.length === 0
                  ? ""
                  : usaFallback
                    ? `⚠ No hay presupuesto para ${periodo?.mes ? `${periodo.mes} ${periodo.prog} · ${periodo.anio}` : "este período"}; se muestran todos. El monto sumará al “Monto Final” de la partida elegida.`
                    : "Elige Presupuesto → Bloque → Partida. Los egresos vinculados suman automáticamente al “Monto Final” de esa partida."}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:22,paddingTop:18,borderTop:`1px solid ${TDC.border}`}}>
            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button variant="primary" disabled={!valid} onClick={()=>valid&&onSave({...f,_aiScanned:undefined})}>
              {f._aiScanned ? "✓ Confirmar y Guardar" : "Guardar Registro"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <div style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.4)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>;
}
