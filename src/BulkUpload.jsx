import { useState, useRef } from "react";
import { scanPDF } from "./aiScanner.js";
import {
  PROYECTOS, TIPOS_GASTO_CC, TIPOS_DOC, TDC, S, uid,
  emptyItemCC, emptyItemMeta, fmtMonto,
} from "./constants.js";
import { Button } from "./ui.jsx";

// Ejecuta `worker` sobre cada elemento con un pool de concurrencia limitado.
async function runQueue(items, worker, concurrency = 3) {
  let i = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) { const idx = i++; await worker(items[idx]); }
  });
  await Promise.all(runners);
}

const ST = {
  pending:  { label: "En cola",     color: TDC.faint },
  scanning: { label: "Analizando…", color: TDC.amber },
  done:     { label: "Listo",       color: TDC.green },
  error:    { label: "Error",       color: TDC.red600 },
};

export default function BulkUpload({ tipo, moneda, onSave, onCancel }) {
  const [rows, setRows]   = useState([]);
  const [busy, setBusy]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [drag, setDrag]   = useState(false);
  const fileRef = useRef();

  const setItem = (id, k, v) =>
    setRows(rs => rs.map(r => r.id === id ? { ...r, item: { ...r.item, [k]: v } } : r));
  const removeRow = id => setRows(rs => rs.filter(r => r.id !== id));

  const onFiles = async fileList => {
    const files = [...fileList].filter(f =>
      f.type.startsWith("image/") || f.type === "application/pdf" || /\.pdf$/i.test(f.name));
    if (!files.length) return;

    const nuevos = files.map(f => ({
      id: uid(), fileName: f.name, status: "pending", error: "", file: f,
      item: { ...(tipo === "CC" ? emptyItemCC() : emptyItemMeta()), adjuntoNombre: f.name },
    }));
    setRows(rs => [...rs, ...nuevos]);
    setBusy(true);

    await runQueue(nuevos, async row => {
      setRows(rs => rs.map(r => r.id === row.id ? { ...r, status: "scanning" } : r));
      try {
        const ex = await scanPDF(row.file, tipo);
        setRows(rs => rs.map(r => r.id === row.id ? {
          ...r, status: "done",
          item: {
            ...r.item,
            tipoDoc:     ex.tipoDoc     || r.item.tipoDoc,
            comprobante: ex.comprobante || r.item.comprobante,
            emision:     ex.emision     || r.item.emision,
            fecha:       ex.fecha       || r.item.fecha,
            proveedor:   ex.proveedor   || r.item.proveedor,
            referencia:  ex.referencia  || r.item.referencia,
            monto:       (ex.monto ?? "") !== "" ? ex.monto : r.item.monto,
            ...(tipo === "CC" ? { tipoGasto: ex.tipoGasto || r.item.tipoGasto } : {}),
          },
        } : r));
      } catch (err) {
        setRows(rs => rs.map(r => r.id === row.id
          ? { ...r, status: "error", error: err.message || "No se pudo analizar" } : r));
      }
    });

    setBusy(false);
  };

  const handlePick = e => { const fl = e.target.files; if (fileRef.current) fileRef.current.value = ""; onFiles(fl); };
  const handleDrop = e => { e.preventDefault(); setDrag(false); if (e.dataTransfer?.files) onFiles(e.dataTransfer.files); };

  const isValid = it => it.fecha && it.proveedor && (it.monto !== "" && it.monto != null);
  const validRows = rows.filter(r => isValid(r.item));
  const totalMonto = validRows.reduce((a, r) => a + Number(r.item.monto || 0) + Number(r.item.impuesto || 0), 0);
  const nDone = rows.filter(r => r.status === "done").length;
  const nErr  = rows.filter(r => r.status === "error").length;

  const handleSave = async () => {
    if (!validRows.length) return;
    setSaving(true);
    // Quitar la referencia al File antes de persistir
    const items = validRows.map(r => { const { _file, ...item } = r.item; return item; });
    await onSave(items);
    setSaving(false);
  };

  const cell = { padding: "6px 6px", borderBottom: `1px solid ${TDC.border}`, verticalAlign: "top" };
  const miniInput  = { ...S.input, padding: "6px 8px", fontSize: 12 };
  const miniSelect = { ...S.select, padding: "6px 8px", fontSize: 12 };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(4px)" }}>
      <div style={{ background:TDC.surface, borderRadius:18, width:"100%", maxWidth:1180, maxHeight:"92vh", display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,0.12)" }}>

        {/* Header */}
        <div style={{ borderBottom:`1px solid ${TDC.border}`, padding:"18px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:TDC.text }}>Subir facturas masivamente</div>
            <div style={{ fontSize:12, color:TDC.textDim, marginTop:2 }}>
              {tipo === "CC" ? "Caja Chica" : "Meta Ads"} · la IA llena cada comprobante; revisa antes de guardar
            </div>
          </div>
          <button onClick={onCancel} style={{ background:TDC.bg, border:`1px solid ${TDC.border}`, borderRadius:8, color:TDC.textDim, cursor:"pointer", width:32, height:32, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>

        <div style={{ padding:24, overflowY:"auto" }}>
          {/* Dropzone */}
          <div
            onClick={() => !busy && fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            style={{
              border:`1.5px dashed ${drag ? TDC.red : TDC.border}`, borderRadius:12, padding:"22px 18px",
              textAlign:"center", cursor:busy?"default":"pointer", background:drag?TDC.redLight2:TDC.bg,
              transition:"all .2s", marginBottom:18,
            }}>
            <div style={{ fontSize:26, marginBottom:6 }}>📥</div>
            <div style={{ fontWeight:700, color:TDC.text, fontSize:14 }}>Arrastra varios PDF o imágenes aquí</div>
            <div style={{ fontSize:12, color:TDC.textDim, marginTop:3 }}>o haz clic para seleccionarlos · puedes elegir varios a la vez</div>
            <input ref={fileRef} type="file" accept=".pdf,application/pdf,image/*" multiple style={{ display:"none" }} onChange={handlePick}/>
          </div>

          {/* Progreso */}
          {rows.length > 0 && (
            <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:12, fontSize:12, color:TDC.textDim, flexWrap:"wrap" }}>
              <span><b style={{ color:TDC.text }}>{rows.length}</b> archivo(s)</span>
              <span style={{ color:TDC.green }}>✓ {nDone} listos</span>
              {nErr > 0 && <span style={{ color:TDC.red600 }}>⚠ {nErr} con error</span>}
              {busy && <span style={{ color:TDC.amber }}>Analizando…</span>}
              <span style={{ marginLeft:"auto" }}>Total a registrar: <b style={{ color:TDC.text, fontFamily:"'Sora',sans-serif" }}>{fmtMonto(totalMonto, moneda)}</b> ({validRows.length})</span>
            </div>
          )}

          {/* Tabla de revisión */}
          {rows.length > 0 && (
            <div style={{ overflowX:"auto", border:`1px solid ${TDC.border}`, borderRadius:10 }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:980 }}>
                <thead>
                  <tr style={{ background:TDC.bg }}>
                    {["Archivo","Estado","Proyecto",tipo==="CC"?"Tipo Gasto":null,"Fecha *","Proveedor *","Referencia","Tipo Doc","Monto *",tipo==="META"?"Impuesto":null,"Tipo",""]
                      .filter(Boolean).map(h => (
                        <th key={h} style={{ padding:"8px 6px", textAlign:"left", color:TDC.textLight, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:.5, whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const it = r.item; const st = ST[r.status] || ST.pending;
                    const bad = r.status !== "scanning" && !isValid(it);
                    return (
                      <tr key={r.id} style={{ background: bad ? "#FFF8F8" : "transparent" }}>
                        <td style={{ ...cell, maxWidth:150 }}>
                          <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:TDC.textSub, fontSize:11 }} title={r.fileName}>{r.fileName}</div>
                        </td>
                        <td style={{ ...cell, whiteSpace:"nowrap" }}>
                          <span style={{ color:st.color, fontWeight:700, fontSize:11 }}>● {st.label}</span>
                          {r.status === "error" && <div style={{ color:TDC.red600, fontSize:10, maxWidth:120 }} title={r.error}>{r.error}</div>}
                        </td>
                        <td style={cell}>
                          <select style={miniSelect} value={it.proyecto} onChange={e=>setItem(r.id,"proyecto",e.target.value)}>
                            {PROYECTOS.map(p=><option key={p}>{p}</option>)}
                          </select>
                        </td>
                        {tipo==="CC" && (
                          <td style={cell}>
                            <select style={miniSelect} value={it.tipoGasto} onChange={e=>setItem(r.id,"tipoGasto",e.target.value)}>
                              {(it.tipoGasto && !TIPOS_GASTO_CC.includes(it.tipoGasto) ? [it.tipoGasto, ...TIPOS_GASTO_CC] : TIPOS_GASTO_CC).map(t=><option key={t}>{t}</option>)}
                            </select>
                          </td>
                        )}
                        <td style={cell}>
                          <input type="date" style={{ ...miniInput, minWidth:130 }} value={it.fecha||""} onChange={e=>setItem(r.id,"fecha",e.target.value)}/>
                        </td>
                        <td style={cell}>
                          <input style={{ ...miniInput, minWidth:150 }} value={it.proveedor||""} onChange={e=>setItem(r.id,"proveedor",e.target.value)} placeholder="Proveedor"/>
                        </td>
                        <td style={cell}>
                          <input style={{ ...miniInput, minWidth:150 }} value={it.referencia||""} onChange={e=>setItem(r.id,"referencia",e.target.value)} placeholder="Referencia"/>
                        </td>
                        <td style={cell}>
                          <select style={miniSelect} value={it.tipoDoc} onChange={e=>setItem(r.id,"tipoDoc",e.target.value)}>
                            {TIPOS_DOC.map(t=><option key={t}>{t}</option>)}
                          </select>
                        </td>
                        <td style={cell}>
                          <input type="number" step="0.01" style={{ ...miniInput, ...S.num, minWidth:90, color:TDC.red600, fontWeight:700 }} value={it.monto} onChange={e=>setItem(r.id,"monto",e.target.value)} placeholder="0.00"/>
                        </td>
                        {tipo==="META" && (
                          <td style={cell}>
                            <input type="number" step="0.01" style={{ ...miniInput, ...S.num, minWidth:90, color:TDC.amber, fontWeight:700 }} value={it.impuesto||""} onChange={e=>setItem(r.id,"impuesto",e.target.value)} placeholder="0.00"/>
                          </td>
                        )}
                        <td style={cell}>
                          <select style={miniSelect} value={it.tipo} onChange={e=>setItem(r.id,"tipo",e.target.value)}>
                            <option>Egreso</option><option>Ingreso</option>
                          </select>
                        </td>
                        <td style={cell}>
                          <button onClick={()=>removeRow(r.id)} title="Quitar" style={{ background:TDC.redLight2, border:`1px solid ${TDC.coral}`, borderRadius:8, color:TDC.red600, cursor:"pointer", padding:"5px 9px", fontSize:11 }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop:`1px solid ${TDC.border}`, padding:"16px 24px", display:"flex", gap:10, justifyContent:"flex-end", alignItems:"center" }}>
          {rows.length > 0 && <span style={{ fontSize:12, color:TDC.textDim, marginRight:"auto" }}>Se guardarán <b style={{ color:TDC.text }}>{validRows.length}</b> registro(s){rows.length-validRows.length>0?` · ${rows.length-validRows.length} incompleto(s) se omiten`:""}</span>}
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button variant="primary" disabled={busy || saving || validRows.length===0} onClick={handleSave}>
            {saving ? "Guardando…" : busy ? "Analizando…" : `Guardar ${validRows.length} registro(s)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
