import { useState, useRef } from "react";
import { saveMovilidad, deleteMovilidad, uploadReciboMov, deleteReciboMov } from "./firebase.js";
import { exportMovilidadXLSX } from "./exporter.js";
import {
  TDC, S, fmt, uid, today, mesLabel, movLabel,
  EMPLEADORES_MOV, PROYECTOS_MOV, emptyPlanillaMov, emptyItemMov,
} from "./constants.js";
import { Button, KPICard, EmptyState, useToast } from "./ui.jsx";

export default function TabMovilidad({ planillas }) {
  const [selId, setSelId]         = useState(planillas[0]?.id || null);
  const [showNew, setShowNew]     = useState(false);
  const [nuevo, setNuevo]         = useState(emptyPlanillaMov());
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  const sel = planillas.find(p => p.id === selId) || null;

  // ── Planilla CRUD ──
  const createPlanilla = async () => {
    if (!nuevo.trabajador.trim()) { toast("Ingresa el nombre del trabajador", { tone:"error" }); return; }
    const p = { ...nuevo, id: uid(), fechaCreacion: today(), items: [] };
    await saveMovilidad(p);
    setSelId(p.id); setShowNew(false); setNuevo(emptyPlanillaMov());
    toast("Planilla creada");
  };

  const handleDeletePlanilla = async () => {
    if (!sel) return;
    await deleteMovilidad(sel.id);
    const next = planillas.find(p => p.id !== sel.id);
    setSelId(next?.id || null);
    setConfirmDelete(false);
    toast("Planilla eliminada", { tone:"error" });
  };

  const updateCampo = async (campo, val) => {
    if (!sel) return;
    await saveMovilidad({ ...sel, [campo]: val });
  };

  // ── Item CRUD ──
  const saveItem = async item => {
    if (!sel) return;
    setSaving(true);
    const items = sel.items.some(i => i.id === item.id)
      ? sel.items.map(i => i.id === item.id ? item : i)
      : [...sel.items, item];
    await saveMovilidad({ ...sel, items });
    setSaving(false); setEditingItem(null);
    toast("Viaje guardado");
  };
  const deleteItem = async itemId => {
    if (!sel) return;
    const it = sel.items.find(i => i.id === itemId);
    if (it?.reciboPath) deleteReciboMov(it.reciboPath); // limpia el archivo del recibo
    await saveMovilidad({ ...sel, items: sel.items.filter(i => i.id !== itemId) });
    toast("Viaje eliminado", { tone:"error" });
  };

  // ── Totales + agrupación por día ──
  const items = sel ? [...sel.items].sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))) : [];
  const total = items.reduce((a,i)=>a+Number(i.monto||0),0);
  const dias  = new Set(items.map(i=>i.fecha)).size;

  // grupos consecutivos por fecha
  const grupos = [];
  items.forEach(it => {
    const g = grupos[grupos.length-1];
    if (g && g.fecha === it.fecha) g.items.push(it);
    else grupos.push({ fecha: it.fecha, items: [it] });
  });
  const fmtFecha = s => { if(!s) return ""; const [y,m,d]=String(s).split("-"); return `${d}/${m}/${y}`; };

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:TDC.ink,letterSpacing:"-0.5px"}}>Movilidad</h1>
          <p style={{fontSize:13,color:TDC.muted,marginTop:3}}>Planillas de gastos de movilidad por trabajador (FIN-FO-001)</p>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <Button variant="outline" leftIcon="+" onClick={()=>setShowNew(v=>!v)}>Nueva planilla</Button>
          {sel && <Button variant="primary" leftIcon="⬇" onClick={()=>exportMovilidadXLSX(sel)}>Descargar Excel</Button>}
        </div>
      </div>

      {/* Nueva planilla */}
      {showNew && (
        <div style={{...S.card,marginBottom:20,borderColor:`${TDC.coral}55`,background:"#FFF8F8"}}>
          <div style={{fontWeight:700,color:TDC.red600,fontSize:13,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:TDC.red500,display:"inline-block"}}/>
            Nueva Planilla de Movilidad
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12,marginBottom:14}}>
            <div>
              <div style={S.label}>Trabajador *</div>
              <input style={S.input} value={nuevo.trabajador} onChange={e=>setNuevo(n=>({...n,trabajador:e.target.value}))} placeholder="Nombre completo"/>
            </div>
            <div>
              <div style={S.label}>DNI</div>
              <input style={S.input} value={nuevo.dni} onChange={e=>setNuevo(n=>({...n,dni:e.target.value}))} placeholder="00000000"/>
            </div>
            <div>
              <div style={S.label}>Empleador</div>
              <select style={S.select} value={nuevo.razonSocial}
                onChange={e=>{ const emp=EMPLEADORES_MOV.find(x=>x.razonSocial===e.target.value); setNuevo(n=>({...n,razonSocial:emp.razonSocial,ruc:emp.ruc})); }}>
                {EMPLEADORES_MOV.map(emp=><option key={emp.ruc} value={emp.razonSocial}>{emp.razonSocial}</option>)}
              </select>
            </div>
            <div>
              <div style={S.label}>N° Planilla</div>
              <input style={S.input} value={nuevo.numero} onChange={e=>setNuevo(n=>({...n,numero:e.target.value}))} placeholder="00001"/>
            </div>
            <div>
              <div style={S.label}>Periodo</div>
              <input style={S.input} value={nuevo.periodo} onChange={e=>setNuevo(n=>({...n,periodo:e.target.value}))} placeholder={mesLabel()}/>
            </div>
            <div>
              <div style={S.label}>Fecha</div>
              <input type="date" style={S.input} value={nuevo.fecha} onChange={e=>setNuevo(n=>({...n,fecha:e.target.value}))}/>
            </div>
          </div>
          <Button variant="primary" onClick={createPlanilla}>Crear planilla</Button>
        </div>
      )}

      {/* Selector */}
      {planillas.length > 0 && (
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:TDC.faint,fontWeight:600,textTransform:"uppercase",letterSpacing:.6}}>Planilla</span>
          <select value={selId||""} onChange={e=>setSelId(e.target.value)}
            style={{...S.select,width:"auto",minWidth:280,maxWidth:"100%",cursor:"pointer",fontWeight:600,color:TDC.red600,border:`1px solid ${TDC.coral}`,background:TDC.redLight2}}>
            {planillas.map(p=><option key={p.id} value={p.id}>{movLabel(p)}</option>)}
          </select>
          <span style={{fontSize:12,color:TDC.faint}}>{planillas.length} planilla{planillas.length!==1?"s":""}</span>
        </div>
      )}

      {/* Empty */}
      {!sel && (
        <div style={S.card}>
          <EmptyState icon="🚕" title="No hay planillas aún" subtitle="Crea una planilla de movilidad para comenzar">
            <Button variant="primary" leftIcon="+" onClick={()=>setShowNew(true)}>Nueva planilla</Button>
          </EmptyState>
        </div>
      )}

      {sel && <>
        {/* Datos de la planilla (editables) */}
        <div style={{...S.card,marginBottom:20}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:14}}>
            <Campo label="Trabajador" value={sel.trabajador} onSave={v=>updateCampo("trabajador",v)}/>
            <Campo label="DNI" value={sel.dni} onSave={v=>updateCampo("dni",v)}/>
            <div>
              <div style={S.label}>Empleador</div>
              <select style={S.select} value={sel.razonSocial}
                onChange={e=>{ const emp=EMPLEADORES_MOV.find(x=>x.razonSocial===e.target.value); if(emp){ saveMovilidad({...sel,razonSocial:emp.razonSocial,ruc:emp.ruc}); } }}>
                {EMPLEADORES_MOV.map(emp=><option key={emp.ruc} value={emp.razonSocial}>{emp.razonSocial}</option>)}
                {!EMPLEADORES_MOV.some(e=>e.razonSocial===sel.razonSocial) && <option value={sel.razonSocial}>{sel.razonSocial}</option>}
              </select>
            </div>
            <Campo label="N° Planilla" value={sel.numero} onSave={v=>updateCampo("numero",v)}/>
            <Campo label="Periodo" value={sel.periodo} onSave={v=>updateCampo("periodo",v)}/>
          </div>
        </div>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
          <KPICard label="Total Movilidad" value={total} format={fmt} color={TDC.red600}/>
          <KPICard label="Viajes" value={items.length} format={v=>Math.round(v)} color={TDC.ink}/>
          <KPICard label="Días" value={dias} format={v=>Math.round(v)} color={TDC.green}/>
        </div>

        {/* Tabla agrupada por día */}
        <div style={S.card}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <span style={{fontWeight:700,color:TDC.ink,fontSize:14}}>Viajes</span>
              <span style={{color:TDC.faint,fontSize:12,marginLeft:8}}>{items.length} registro{items.length!==1?"s":""}</span>
              {saving && <span style={{color:TDC.red500,fontSize:11,marginLeft:10}}>Guardando…</span>}
            </div>
            <Button variant="primary" leftIcon="+" onClick={()=>setEditingItem(emptyItemMov())}>Agregar viaje</Button>
          </div>

          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${TDC.border}`}}>
                  {["Fecha","Motivo","Destino","Proyecto","Monto viaje","Subtotal día","Recibo",""].map(h=>(
                    <th key={h} style={{padding:"8px 10px",textAlign:"left",color:TDC.faint,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:.6,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length===0 && (
                  <tr><td colSpan={8}>
                    <EmptyState compact icon="🛣️" title="Sin viajes" subtitle="Haz clic en “+ Agregar viaje” para comenzar."/>
                  </td></tr>
                )}
                {grupos.map(g => {
                  const sub = g.items.reduce((a,i)=>a+Number(i.monto||0),0);
                  return g.items.map((item, idx) => (
                    <tr key={item.id} className="tdc-row" style={{borderBottom:`1px solid ${TDC.border}`,transition:"background .15s"}}>
                      <td style={{padding:"8px 10px",color:TDC.muted,fontFamily:"'Sora',sans-serif",fontSize:11,whiteSpace:"nowrap"}}>{idx===0?fmtFecha(item.fecha):""}</td>
                      <td style={{padding:"8px 10px",color:TDC.ink,maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.motivo}</td>
                      <td style={{padding:"8px 10px",color:TDC.textSub,whiteSpace:"nowrap"}}>{item.destino}</td>
                      <td style={{padding:"8px 10px"}}>{item.proyecto ? <ProjBadge p={item.proyecto}/> : "—"}</td>
                      <td style={{padding:"8px 10px",fontWeight:700,color:TDC.red600,fontFamily:"'Sora',sans-serif",whiteSpace:"nowrap"}}>{fmt(item.monto)}</td>
                      <td style={{padding:"8px 10px",fontFamily:"'Sora',sans-serif",fontWeight:700,color:idx===0?TDC.ink:"transparent",whiteSpace:"nowrap"}}>{idx===0?fmt(sub):""}</td>
                      <td style={{padding:"8px 10px",whiteSpace:"nowrap"}}>
                        {item.reciboUrl
                          ? <a href={item.reciboUrl} target="_blank" rel="noopener noreferrer" title={item.reciboNombre||"Ver recibo"} style={{color:TDC.red600,fontWeight:600,fontSize:11,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>📎 Ver</a>
                          : <span style={{color:TDC.faint,fontSize:11}}>—</span>}
                      </td>
                      <td style={{padding:"8px 10px"}}>
                        <div style={{display:"flex",gap:4}}>
                          <button onClick={()=>setEditingItem({...item})} style={{background:TDC.bg,border:`1px solid ${TDC.border}`,borderRadius:8,color:TDC.muted,cursor:"pointer",padding:"4px 8px",fontSize:11,fontFamily:"'General Sans',sans-serif"}}>✏</button>
                          <button onClick={()=>deleteItem(item.id)} style={{background:TDC.redLight2,border:`1px solid ${TDC.coral}`,borderRadius:8,color:TDC.red600,cursor:"pointer",padding:"4px 8px",fontSize:11}}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
              {items.length>0 && (
                <tfoot>
                  <tr style={{borderTop:`2px solid ${TDC.border}`,background:TDC.bg}}>
                    <td colSpan={4} style={{padding:"9px 10px",color:TDC.muted,fontSize:11,fontWeight:600}}>TOTAL DE LA PLANILLA</td>
                    <td colSpan={2} style={{padding:"9px 10px",fontWeight:800,color:TDC.ink,fontFamily:"'Sora',sans-serif"}}>{fmt(total)}</td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{marginTop:24,padding:"16px 20px",background:TDC.redLight2,border:`1px solid ${TDC.coral}`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontWeight:700,color:TDC.red600,fontSize:13}}>Eliminar planilla</div>
            <div style={{fontSize:12,color:TDC.muted,marginTop:2}}>Esta acción no se puede deshacer. Todos los viajes se perderán.</div>
          </div>
          <Button variant="danger" leftIcon="🗑" onClick={()=>setConfirmDelete(true)}>Eliminar planilla</Button>
        </div>
      </>}

      {/* Confirmar eliminar */}
      {confirmDelete && sel && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(3px)"}}>
          <div style={{background:TDC.card,borderRadius:16,padding:32,maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(15,27,39,0.18)",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>🗑</div>
            <div style={{fontWeight:700,fontSize:18,color:TDC.ink,marginBottom:8}}>¿Eliminar esta planilla?</div>
            <div style={{fontSize:13,color:TDC.muted,marginBottom:6}}><b style={{color:TDC.ink}}>{movLabel(sel)}</b></div>
            <div style={{fontSize:13,color:TDC.red600,marginBottom:24,background:TDC.redLight2,padding:"10px 14px",borderRadius:8,border:`1px solid ${TDC.coral}`}}>
              ⚠ Esta acción no se puede recuperar. Se eliminarán todos los viajes.
            </div>
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <Button variant="outline" onClick={()=>setConfirmDelete(false)}>No, cancelar</Button>
              <Button variant="primary" onClick={handleDeletePlanilla}>Sí, eliminar</Button>
            </div>
          </div>
        </div>
      )}

      {editingItem && <MovItemModal item={editingItem} onSave={saveItem} onCancel={()=>setEditingItem(null)}/>}
    </div>
  );
}

// Campo editable inline (blur guarda)
function Campo({ label, value, onSave }) {
  return (
    <div>
      <div style={S.label}>{label}</div>
      <input style={S.input} defaultValue={value||""} onBlur={e=>{ if(e.target.value!==(value||"")) onSave(e.target.value); }}/>
    </div>
  );
}

function ProjBadge({ p }) {
  return <span style={{background:`${TDC.muted}12`,color:TDC.textSub,border:`1px solid ${TDC.border}`,borderRadius:8,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{p}</span>;
}

// ── Modal de viaje ──
function MovItemModal({ item, onSave, onCancel }) {
  const [f, setF] = useState({ ...item });
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef();
  const set = (k,v) => setF(p=>({ ...p, [k]: v }));
  const valid = f.fecha && f.motivo && f.monto;

  const handleUpload = async e => {
    const file = e.target.files[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setUploading(true); setUploadError("");
    try {
      if (f.reciboPath) await deleteReciboMov(f.reciboPath); // reemplaza el anterior
      const res = await uploadReciboMov(file, f.id);
      setF(p => ({ ...p, reciboUrl: res.url, reciboNombre: res.nombre, reciboPath: res.path }));
    } catch (err) {
      setUploadError(err?.message || "No se pudo subir el recibo. ¿Está habilitado Firebase Storage?");
    } finally {
      setUploading(false);
    }
  };
  const removeRecibo = async () => {
    if (f.reciboPath) await deleteReciboMov(f.reciboPath);
    setF(p => ({ ...p, reciboUrl:"", reciboNombre:"", reciboPath:"" }));
  };

  const upBtn = { background:TDC.bg, border:`1px solid ${TDC.border}`, borderRadius:8, color:TDC.textSub, cursor:"pointer", padding:"6px 10px", fontSize:11, fontWeight:600 };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:TDC.card,borderRadius:18,width:"100%",maxWidth:560,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(15,27,39,0.16)"}}>
        <div style={{borderBottom:`1px solid ${TDC.border}`,padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontWeight:700,fontSize:16,color:TDC.ink}}>{item.motivo ? "Editar viaje" : "Nuevo viaje"}</div>
            <div style={{fontSize:12,color:TDC.muted,marginTop:2}}>Gasto de movilidad</div>
          </div>
          <button onClick={onCancel} style={{background:TDC.bg,border:`1px solid ${TDC.border}`,borderRadius:8,color:TDC.muted,cursor:"pointer",width:32,height:32,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>

        <div style={{padding:24}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"span 2"}}>
              <div style={S.label}>Fecha del gasto *</div>
              <input type="date" style={S.input} value={f.fecha} onChange={e=>set("fecha",e.target.value)}/>
            </div>
            <div style={{gridColumn:"span 2"}}>
              <div style={S.label}>Motivo *</div>
              <input style={S.input} value={f.motivo} onChange={e=>set("motivo",e.target.value)} placeholder="Ej: Trabajos de post venta…"/>
            </div>
            <div>
              <div style={S.label}>Destino</div>
              <input list="mov-destinos" style={S.input} value={f.destino} onChange={e=>set("destino",e.target.value)} placeholder="Ej: Oficina principal"/>
              <datalist id="mov-destinos">{PROYECTOS_MOV.map(p=><option key={p} value={p}/>)}</datalist>
            </div>
            <div>
              <div style={S.label}>Proyecto</div>
              <input list="mov-proyectos" style={S.input} value={f.proyecto} onChange={e=>set("proyecto",e.target.value)} placeholder="Elige o escribe"/>
              <datalist id="mov-proyectos">{PROYECTOS_MOV.map(p=><option key={p} value={p}/>)}</datalist>
            </div>
            <div>
              <div style={S.label}>Monto del viaje *</div>
              <input type="number" step="0.01" style={{...S.input,...S.num,color:TDC.red600,fontWeight:700}} value={f.monto} onChange={e=>set("monto",e.target.value)} placeholder="0.00"/>
              <div style={{fontSize:10,color:TDC.faint,marginTop:3}}>Soles (S/)</div>
            </div>

            {/* Recibo (RPH) — archivo en Firebase Storage */}
            <div style={{gridColumn:"span 2"}}>
              <div style={S.label}>Recibo (RPH)</div>
              {f.reciboUrl ? (
                <div style={{display:"flex",alignItems:"center",gap:10,background:TDC.bg,border:`1px solid ${TDC.border}`,borderRadius:8,padding:"9px 12px"}}>
                  <a href={f.reciboUrl} target="_blank" rel="noopener noreferrer" style={{color:TDC.red600,fontWeight:600,fontSize:12,textDecoration:"none",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📎 {f.reciboNombre||"Ver recibo"}</a>
                  <button type="button" onClick={()=>!uploading&&fileRef.current?.click()} style={upBtn}>{uploading?"Subiendo…":"Reemplazar"}</button>
                  <button type="button" onClick={removeRecibo} style={{...upBtn,background:TDC.redLight2,border:`1px solid ${TDC.coral}`,color:TDC.red600}}>Quitar</button>
                </div>
              ) : (
                <button type="button" onClick={()=>!uploading&&fileRef.current?.click()} disabled={uploading}
                  style={{width:"100%",border:`1.5px dashed ${uploading?TDC.red:TDC.border}`,borderRadius:10,background:TDC.bg,color:uploading?TDC.red600:TDC.textSub,cursor:uploading?"default":"pointer",padding:"11px 14px",fontSize:12,fontWeight:600,fontFamily:"'General Sans',sans-serif"}}>
                  {uploading ? "Subiendo…" : "📎 Subir recibo (PDF o foto)"}
                </button>
              )}
              <input ref={fileRef} type="file" accept=".pdf,application/pdf,image/*" style={{display:"none"}} onChange={handleUpload}/>
              {uploadError && <div style={{color:TDC.red600,fontSize:11,marginTop:4}}>⚠ {uploadError}</div>}
              <div style={{fontSize:10,color:TDC.faint,marginTop:4}}>Se guarda para abrirlo al cierre de mes. Opcional.</div>
            </div>
          </div>

          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:22,paddingTop:18,borderTop:`1px solid ${TDC.border}`}}>
            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button variant="primary" disabled={!valid} onClick={()=>valid&&onSave(f)}>Guardar viaje</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
