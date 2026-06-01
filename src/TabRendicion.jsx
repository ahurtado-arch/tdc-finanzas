import { useState } from "react";
import { saveRendicion, deleteRendicion as fbDeleteRendicion } from "./firebase.js";
import { exportRendicionXLSX } from "./exporter.js";
import ItemModal from "./ItemModal.jsx";
import {
  TDC, S, PROJ_COLORS, fmtMonto, fmt, uid, today, mesLabel,
  emptyRendicion, emptyItemCC, emptyItemMeta, MONEDAS,
} from "./constants.js";

export default function TabRendicion({ tipo, rendiciones }) {
  const [selId, setSelId]           = useState(rendiciones[0]?.id || null);
  const [showNew, setShowNew]       = useState(false);
  const [newLabel, setNewLabel]     = useState("");
  const [newMonto, setNewMonto]     = useState("");
  const [newMoneda, setNewMoneda]   = useState("Soles (S/)");
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false); // pop-up state

  const sel = rendiciones.find(r => r.id === selId) || null;
  const moneda = sel?.moneda || "Soles (S/)";

  // ── Rendicion CRUD ────────────────────────────────────────────────────────
  const createRendicion = async () => {
    const r = emptyRendicion(tipo);
    if (newLabel.trim()) r.label = newLabel.trim();
    if (newMonto) r.montoAsignado = parseFloat(newMonto) || 0;
    r.moneda = newMoneda;
    await saveRendicion(tipo, r);
    setSelId(r.id); setShowNew(false); setNewLabel(""); setNewMonto(""); setNewMoneda("Soles (S/)");
  };

  const handleDeleteRendicion = async () => {
    if (!sel) return;
    await fbDeleteRendicion(tipo, sel.id);
    const next = rendiciones.find(r => r.id !== sel.id);
    setSelId(next?.id || null);
    setConfirmDelete(false);
  };

  const updateMonto = async val => {
    if (!sel) return;
    await saveRendicion(tipo, { ...sel, montoAsignado: parseFloat(val) || 0 });
  };

  const updateMoneda = async val => {
    if (!sel) return;
    await saveRendicion(tipo, { ...sel, moneda: val });
  };

  // ── Item CRUD ─────────────────────────────────────────────────────────────
  const saveItem = async item => {
    if (!sel) return;
    setSaving(true);
    const items = sel.items.some(i => i.id === item.id)
      ? sel.items.map(i => i.id === item.id ? item : i)
      : [...sel.items, item];
    await saveRendicion(tipo, { ...sel, items });
    setSaving(false);
    setEditingItem(null);
  };

  const deleteItem = async itemId => {
    if (!sel) return;
    const items = sel.items.filter(i => i.id !== itemId);
    await saveRendicion(tipo, { ...sel, items });
  };

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalI = sel ? sel.items.filter(i=>i.tipo==="Ingreso").reduce((a,i)=>a+Number(i.monto||0),0) : 0;
  const totalE = sel ? sel.items.filter(i=>i.tipo==="Egreso").reduce((a,i)=>a+Number(i.monto||0),0)  : 0;
  const monto  = sel ? Number(sel.montoAsignado||0) : 0;
  const saldo  = monto + totalI - totalE;

  const headersCC   = ["Proyecto","Tipo Gasto","Fecha Pago","# Comp.","Emisión","Proveedor","Referencia","Tipo Doc","Monto","Tipo",""];
  const headersMeta = ["Proyecto","Fecha Pago","# Comp.","Emisión","Proveedor","Referencia","Tipo Doc","Monto","Tipo",""];

  // ── Styles ────────────────────────────────────────────────────────────────
  const btnRed = {
    padding:"9px 18px",border:"none",borderRadius:9,
    background:`linear-gradient(135deg,${TDC.red},${TDC.redLight})`,
    color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",
    boxShadow:"0 2px 8px rgba(211,47,47,0.25)",transition:"all .2s",
  };
  const btnOutline = {
    padding:"9px 18px",border:`1px solid ${TDC.border}`,borderRadius:9,
    background:"transparent",color:TDC.textDim,fontFamily:"'DM Sans',sans-serif",
    fontWeight:600,fontSize:13,cursor:"pointer",transition:"all .2s",
  };
  const btnDanger = {
    padding:"9px 18px",border:`1px solid ${TDC.redLight}`,borderRadius:9,
    background:TDC.redLight2,color:TDC.red,fontFamily:"'DM Sans',sans-serif",
    fontWeight:600,fontSize:13,cursor:"pointer",transition:"all .2s",
  };

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:TDC.text,letterSpacing:"-0.5px"}}>{tipo==="CC"?"Caja Chica":"Meta Ads"}</h1>
          <p style={{fontSize:13,color:TDC.textDim,marginTop:3}}>{tipo==="CC"?"Gestión y rendición de fondos de caja chica":"Gestión y rendición de gastos Meta Ads"}</p>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button onClick={()=>setShowNew(v=>!v)} style={btnOutline}>+ Nueva rendición</button>
          {sel && <button onClick={()=>exportRendicionXLSX(sel,tipo)} style={btnRed}>⬇ Descargar Excel</button>}
        </div>
      </div>

      {/* ── New rendicion form ── */}
      {showNew && (
        <div style={{...S.card,marginBottom:20,borderColor:`${TDC.red}33`,background:"#FFF8F8"}}>
          <div style={{fontWeight:700,color:TDC.red,fontSize:13,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:TDC.red,display:"inline-block"}}/>
            Nueva Rendición
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 160px 160px auto",gap:12,alignItems:"end"}}>
            <div>
              <div style={S.label}>Nombre del período</div>
              <input style={S.input} value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder={`${tipo} - ${mesLabel()} - I`}/>
            </div>
            <div>
              <div style={S.label}>Monto asignado</div>
              <input type="number" style={S.input} value={newMonto} onChange={e=>setNewMonto(e.target.value)} placeholder="0.00"/>
            </div>
            <div>
              <div style={S.label}>Moneda</div>
              <select style={S.select} value={newMoneda} onChange={e=>setNewMoneda(e.target.value)}>
                {MONEDAS.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <button onClick={createRendicion} style={{...btnRed,height:40}}>Crear</button>
          </div>
        </div>
      )}

      {/* ── Rendicion selector (desplegable) ── */}
      {rendiciones.length > 0 && (
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:TDC.textLight,fontWeight:600,textTransform:"uppercase",letterSpacing:.6}}>Rendición</span>
          <select
            value={selId || ""}
            onChange={e=>setSelId(e.target.value)}
            style={{
              ...S.select,
              width:"auto",minWidth:260,maxWidth:"100%",cursor:"pointer",
              fontWeight:600,color:TDC.text,
              border:`1px solid ${TDC.red}`,background:TDC.redLight2,
            }}>
            {rendiciones.map(r => (
              <option key={r.id} value={r.id}>
                {r.label}{r.moneda === "Dólares ($)" ? "  ·  $" : ""}
              </option>
            ))}
          </select>
          <span style={{fontSize:12,color:TDC.textLight}}>
            {rendiciones.length} rendici{rendiciones.length!==1?"ones":"ón"}
          </span>
        </div>
      )}

      {/* ── Empty state ── */}
      {!sel && (
        <div style={{...S.card,textAlign:"center",padding:60,background:TDC.surface}}>
          <div style={{fontSize:36,marginBottom:12}}>📋</div>
          <div style={{fontWeight:700,color:TDC.textDim,fontSize:15}}>No hay rendiciones aún</div>
          <div style={{color:TDC.textLight,fontSize:13,marginTop:6}}>Crea una nueva rendición para comenzar</div>
        </div>
      )}

      {sel && <>
        {/* ── KPIs ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
          {/* Monto asignado con moneda */}
          <div style={{...S.card,borderLeft:`4px solid ${TDC.red}`}}>
            <div style={S.cardLabel}>Monto Asignado</div>
            <div style={{display:"flex",gap:6,alignItems:"center",marginTop:6}}>
              <input type="number" defaultValue={sel.montoAsignado} onBlur={e=>updateMonto(e.target.value)}
                style={{background:"transparent",border:"none",outline:"none",color:TDC.red,fontSize:20,fontWeight:800,fontFamily:"'DM Sans',sans-serif",flex:1,padding:0,minWidth:0}}
                placeholder="0.00"/>
              <select value={moneda} onChange={e=>updateMoneda(e.target.value)}
                style={{border:`1px solid ${TDC.border}`,borderRadius:6,padding:"3px 6px",fontSize:11,color:TDC.textSub,background:TDC.bg,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
                {MONEDAS.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div style={{fontSize:11,color:TDC.textLight,marginTop:2}}>Clic para editar</div>
          </div>
          {[
            ["Total Ingresos", totalI, TDC.green],
            ["Total Egresos",  totalE, TDC.red],
            ["Saldo Actual",   saldo,  saldo>=0?TDC.green:TDC.red],
          ].map(([label,val,color])=>(
            <div key={label} style={{...S.card,borderLeft:`4px solid ${color}`}}>
              <div style={S.cardLabel}>{label}</div>
              <div style={{fontSize:19,fontWeight:800,color,marginTop:6}}>{fmtMonto(val, moneda)}</div>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div style={S.card}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <span style={{fontWeight:700,color:TDC.text,fontSize:14}}>Registros</span>
              <span style={{color:TDC.textLight,fontSize:12,marginLeft:8}}>{sel.items.length} ítem{sel.items.length!==1?"s":""}</span>
              {saving && <span style={{color:TDC.red,fontSize:11,marginLeft:10}}>Guardando…</span>}
            </div>
            <button onClick={()=>setEditingItem(tipo==="CC"?emptyItemCC():emptyItemMeta())} style={btnRed}>
              + Agregar registro
            </button>
          </div>

          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${TDC.border}`}}>
                  {(tipo==="CC"?headersCC:headersMeta).map(h=>(
                    <th key={h} style={{padding:"8px 10px",textAlign:"left",color:TDC.textLight,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:.6,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sel.items.length===0 && (
                  <tr><td colSpan={11} style={{padding:36,textAlign:"center",color:TDC.textLight,fontSize:13}}>
                    Sin registros — haz clic en <b style={{color:TDC.text}}>+ Agregar registro</b> para comenzar.
                  </td></tr>
                )}
                {sel.items.map(item => (
                  <tr key={item.id} className="tdc-row" style={{borderBottom:`1px solid ${TDC.border}`,transition:"background .15s"}}>
                    <td style={{padding:"8px 10px"}}><ProjBadge p={item.proyecto}/></td>
                    {tipo==="CC" && <td style={{padding:"8px 10px",color:TDC.textSub,fontSize:11,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.tipoGasto}</td>}
                    <td style={{padding:"8px 10px",color:TDC.textDim,fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{item.fecha}</td>
                    <td style={{padding:"8px 10px",color:TDC.textLight,fontFamily:"monospace",fontSize:10,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.comprobante||"—"}</td>
                    <td style={{padding:"8px 10px",color:TDC.textLight,fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{item.emision}</td>
                    <td style={{padding:"8px 10px",color:TDC.text,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.proveedor}</td>
                    <td style={{padding:"8px 10px",color:TDC.textSub,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.referencia}</td>
                    <td style={{padding:"8px 10px"}}><span style={{background:TDC.bg,color:TDC.textDim,border:`1px solid ${TDC.border}`,padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:600}}>{item.tipoDoc}</span></td>
                    <td style={{padding:"8px 10px",fontWeight:700,color:item.tipo==="Ingreso"?TDC.green:TDC.red,fontFamily:"monospace",whiteSpace:"nowrap"}}>{fmtMonto(item.monto, moneda)}</td>
                    <td style={{padding:"8px 10px"}}>
                      <span style={{background:item.tipo==="Ingreso"?TDC.greenLight:TDC.redLight2,color:item.tipo==="Ingreso"?TDC.green:TDC.red,padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:700}}>{item.tipo}</span>
                    </td>
                    <td style={{padding:"8px 10px"}}>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>setEditingItem({...item})} style={{background:TDC.bg,border:`1px solid ${TDC.border}`,borderRadius:6,color:TDC.textDim,cursor:"pointer",padding:"4px 8px",fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>✏</button>
                        <button onClick={()=>deleteItem(item.id)} style={{background:TDC.redLight2,border:`1px solid ${TDC.redLight}`,borderRadius:6,color:TDC.red,cursor:"pointer",padding:"4px 8px",fontSize:11}}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {sel.items.length>0 && (
                <tfoot>
                  <tr style={{borderTop:`2px solid ${TDC.border}`,background:TDC.bg}}>
                    <td colSpan={tipo==="CC"?8:7} style={{padding:"9px 10px",color:TDC.textDim,fontSize:11,fontWeight:600}}>TOTALES DEL PERÍODO</td>
                    <td style={{padding:"9px 10px",fontWeight:800,color:TDC.text,fontFamily:"monospace"}}>{fmtMonto(totalI+totalE, moneda)}</td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ── Danger zone — Eliminar rendición ── */}
        <div style={{marginTop:24,padding:"16px 20px",background:TDC.redLight2,border:`1px solid ${TDC.redLight}`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontWeight:700,color:TDC.red,fontSize:13}}>Eliminar rendición</div>
            <div style={{fontSize:12,color:TDC.textDim,marginTop:2}}>Esta acción no se puede deshacer. Todos los registros se perderán.</div>
          </div>
          <button onClick={()=>setConfirmDelete(true)} style={btnDanger}>
            🗑 Eliminar rendición
          </button>
        </div>
      </>}

      {/* ── Modal confirmar eliminar ── */}
      {confirmDelete && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(3px)"}}>
          <div style={{background:TDC.surface,borderRadius:16,padding:32,maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.15)",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>🗑</div>
            <div style={{fontWeight:800,fontSize:18,color:TDC.text,marginBottom:8}}>¿Eliminar esta rendición?</div>
            <div style={{fontSize:13,color:TDC.textDim,marginBottom:6}}>
              <b style={{color:TDC.text}}>{sel?.label}</b>
            </div>
            <div style={{fontSize:13,color:TDC.red,marginBottom:24,background:TDC.redLight2,padding:"10px 14px",borderRadius:8,border:`1px solid ${TDC.redLight}`}}>
              ⚠ Esta acción no se puede recuperar. Se eliminarán todos los registros de esta rendición.
            </div>
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <button onClick={()=>setConfirmDelete(false)} style={{
                padding:"10px 24px",border:`1px solid ${TDC.border}`,borderRadius:9,
                background:TDC.surface,color:TDC.textDim,fontFamily:"'DM Sans',sans-serif",
                fontWeight:600,fontSize:13,cursor:"pointer",
              }}>No, cancelar</button>
              <button onClick={handleDeleteRendicion} style={{
                padding:"10px 24px",border:"none",borderRadius:9,
                background:`linear-gradient(135deg,${TDC.red},${TDC.redLight})`,
                color:"#fff",fontFamily:"'DM Sans',sans-serif",
                fontWeight:700,fontSize:13,cursor:"pointer",
                boxShadow:"0 2px 8px rgba(211,47,47,0.3)",
              }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <ItemModal item={editingItem} tipo={tipo} moneda={moneda} onSave={saveItem} onCancel={()=>setEditingItem(null)}/>
      )}
    </div>
  );
}

function ProjBadge({ p }) {
  const c = PROJ_COLORS[p] || "#455A64";
  return <span style={{background:`${c}15`,color:c,border:`1px solid ${c}30`,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{p}</span>;
}
