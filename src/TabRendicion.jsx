import { useState } from "react";
import { saveRendicion, deleteRendicion as fbDeleteRendicion } from "./firebase.js";
import { exportRendicionXLSX } from "./exporter.js";
import ItemModal from "./ItemModal.jsx";
import BulkUpload from "./BulkUpload.jsx";
import {
  TDC, S, PROJ_COLORS, fmtMonto, fmt, uid, today,
  emptyRendicion, emptyItemCC, emptyItemMeta, MONEDAS,
  MESES, PROGRAMACIONES, ANIOS, periodoActual, rendicionLabel,
} from "./constants.js";
import { Button, KPICard, EstadoChip, MonedaChip, EmptyState, useToast } from "./ui.jsx";

export default function TabRendicion({ tipo, rendiciones, presupuestos = [] }) {
  const [selId, setSelId]           = useState(rendiciones[0]?.id || null);
  const [showNew, setShowNew]       = useState(false);
  const [newPeriodo, setNewPeriodo] = useState(periodoActual());
  const [newMonto, setNewMonto]     = useState("");
  const [newMoneda, setNewMoneda]   = useState("Soles (S/)");
  const [editingItem, setEditingItem] = useState(null);
  const [showBulk, setShowBulk]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false); // pop-up state
  const toast = useToast();

  const sel = rendiciones.find(r => r.id === selId) || null;
  const moneda = sel?.moneda || "Soles (S/)";

  // ── Rendicion CRUD ────────────────────────────────────────────────────────
  const createRendicion = async () => {
    const r = { ...emptyRendicion(), ...newPeriodo };
    if (newMonto) r.montoAsignado = parseFloat(newMonto) || 0;
    r.moneda = newMoneda;
    await saveRendicion(tipo, r);
    setSelId(r.id); setShowNew(false); setNewPeriodo(periodoActual()); setNewMonto(""); setNewMoneda("Soles (S/)");
    toast("Rendición creada");
  };

  const handleDeleteRendicion = async () => {
    if (!sel) return;
    await fbDeleteRendicion(tipo, sel.id);
    const next = rendiciones.find(r => r.id !== sel.id);
    setSelId(next?.id || null);
    setConfirmDelete(false);
    toast("Rendición eliminada", { tone:"error" });
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
    toast("Registro guardado");
  };

  const deleteItem = async itemId => {
    if (!sel) return;
    const items = sel.items.filter(i => i.id !== itemId);
    await saveRendicion(tipo, { ...sel, items });
    toast("Registro eliminado", { tone:"error" });
  };

  // Carga masiva: agrega varios registros de una sola vez
  const saveBulk = async items => {
    if (!sel || !items.length) return;
    setSaving(true);
    await saveRendicion(tipo, { ...sel, items: [...sel.items, ...items] });
    setSaving(false);
    setShowBulk(false);
    toast(`${items.length} registro${items.length!==1?"s":""} agregado${items.length!==1?"s":""}`);
  };

  // ── Totals ────────────────────────────────────────────────────────────────
  // Egreso efectivo = monto de la factura + impuesto (excedente del banco, solo Meta)
  const egresoTotal = i => Number(i.monto||0) + Number(i.impuesto||0);
  const totalI = sel ? sel.items.filter(i=>i.tipo==="Ingreso").reduce((a,i)=>a+Number(i.monto||0),0) : 0;
  const totalE = sel ? sel.items.filter(i=>i.tipo==="Egreso").reduce((a,i)=>a+egresoTotal(i),0)        : 0;
  const monto  = sel ? Number(sel.montoAsignado||0) : 0;
  const saldo  = monto + totalI - totalE;

  const headersCC   = ["Proyecto","Tipo Gasto","Fecha Pago","# Comp.","Emisión","Proveedor","Referencia","Tipo Doc","Monto","Tipo",""];
  const headersMeta = ["Proyecto","Fecha Pago","# Comp.","Emisión","Proveedor","Referencia","Tipo Doc","Monto","Tipo",""];

  // ── Styles ────────────────────────────────────────────────────────────────
  const btnRed = {
    padding:"9px 18px",border:"none",borderRadius:9,
    background:`linear-gradient(135deg,${TDC.red},${TDC.redLight})`,
    color:"#fff",fontFamily:"'General Sans',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",
    boxShadow:"0 2px 8px rgba(211,47,47,0.25)",transition:"all .2s",
  };
  const btnOutline = {
    padding:"9px 18px",border:`1px solid ${TDC.border}`,borderRadius:9,
    background:"transparent",color:TDC.textDim,fontFamily:"'General Sans',sans-serif",
    fontWeight:600,fontSize:13,cursor:"pointer",transition:"all .2s",
  };
  const btnDanger = {
    padding:"9px 18px",border:`1px solid ${TDC.redLight}`,borderRadius:9,
    background:TDC.redLight2,color:TDC.red,fontFamily:"'General Sans',sans-serif",
    fontWeight:600,fontSize:13,cursor:"pointer",transition:"all .2s",
  };

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:TDC.ink,letterSpacing:"-0.5px"}}>{tipo==="CC"?"Caja Chica":"Meta Ads"}</h1>
          <p style={{fontSize:13,color:TDC.muted,marginTop:3}}>{tipo==="CC"?"Gestión y rendición de fondos de caja chica":"Gestión y rendición de gastos Meta Ads"}</p>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <Button variant="outline" leftIcon="+" onClick={()=>setShowNew(v=>!v)}>Nueva rendición</Button>
          {sel && <Button variant="primary" leftIcon="⬇" onClick={()=>exportRendicionXLSX(sel,tipo)}>Descargar Excel</Button>}
        </div>
      </div>

      {/* ── New rendicion form ── */}
      {showNew && (
        <div style={{...S.card,marginBottom:20,borderColor:`${TDC.coral}55`,background:"#FFF8F8"}}>
          <div style={{fontWeight:700,color:TDC.red600,fontSize:13,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:TDC.red500,display:"inline-block"}}/>
            Nueva Rendición
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1.2fr 0.9fr 0.9fr 140px 150px auto",gap:12,alignItems:"end"}}>
            <div>
              <div style={S.label}>Mes</div>
              <select style={S.select} value={newPeriodo.mes} onChange={e=>setNewPeriodo(p=>({...p,mes:e.target.value}))}>
                {MESES.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <div style={S.label}># Programación</div>
              <select style={S.select} value={newPeriodo.prog} onChange={e=>setNewPeriodo(p=>({...p,prog:e.target.value}))}>
                {PROGRAMACIONES.map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <div style={S.label}>Año</div>
              <select style={S.select} value={newPeriodo.anio} onChange={e=>setNewPeriodo(p=>({...p,anio:e.target.value}))}>
                {ANIOS.map(a=><option key={a}>{a}</option>)}
              </select>
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
            <Button variant="primary" onClick={createRendicion} style={{height:40}}>Crear</Button>
          </div>
          <div style={{fontSize:11,color:TDC.faint,marginTop:10}}>Se mostrará como <b style={{color:TDC.muted}}>{rendicionLabel({...newPeriodo}, tipo)}</b>. El período conecta esta rendición con el presupuesto del mismo Mes · # · Año.</div>
        </div>
      )}

      {/* ── Rendicion selector (desplegable) ── */}
      {rendiciones.length > 0 && (
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:TDC.faint,fontWeight:600,textTransform:"uppercase",letterSpacing:.6}}>Rendición</span>
          <select
            value={selId || ""}
            onChange={e=>setSelId(e.target.value)}
            style={{
              ...S.select,
              width:"auto",minWidth:260,maxWidth:"100%",cursor:"pointer",
              fontWeight:600,color:TDC.red600,
              border:`1px solid ${TDC.coral}`,background:TDC.redLight2,
            }}>
            {rendiciones.map(r => (
              <option key={r.id} value={r.id}>{rendicionLabel(r, tipo)}</option>
            ))}
          </select>
          {sel && <MonedaChip moneda={moneda}/>}
          <span style={{fontSize:12,color:TDC.faint}}>
            {rendiciones.length} rendici{rendiciones.length!==1?"ones":"ón"}
          </span>
        </div>
      )}

      {/* ── Empty state ── */}
      {!sel && (
        <div style={S.card}>
          <EmptyState icon="📋" title="No hay rendiciones aún" subtitle="Crea una nueva rendición para comenzar">
            <Button variant="primary" leftIcon="+" onClick={()=>setShowNew(true)}>Nueva rendición</Button>
          </EmptyState>
        </div>
      )}

      {sel && <>
        {/* ── KPIs ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
          {/* Monto asignado con moneda (editable) */}
          <div className="tdc-card-hover" style={{...S.card,borderLeft:`4px solid ${TDC.red500}`,transition:"transform .2s ease, box-shadow .2s ease"}}>
            <div style={S.cardLabel}>Monto Asignado</div>
            <div style={{display:"flex",gap:6,alignItems:"center",marginTop:6}}>
              <input type="number" defaultValue={sel.montoAsignado} onBlur={e=>updateMonto(e.target.value)}
                style={{background:"transparent",border:"none",outline:"none",color:TDC.red500,fontSize:22,fontWeight:700,fontFamily:"'Sora',sans-serif",fontVariantNumeric:"tabular-nums",flex:1,padding:0,minWidth:0}}
                placeholder="0.00"/>
              <select value={moneda} onChange={e=>updateMoneda(e.target.value)}
                style={{border:`1px solid ${TDC.border}`,borderRadius:8,padding:"3px 6px",fontSize:11,color:TDC.textSub,background:TDC.bg,fontFamily:"'General Sans',sans-serif",cursor:"pointer"}}>
                {MONEDAS.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div style={{fontSize:11,color:TDC.faint,marginTop:2}}>Clic para editar</div>
          </div>
          <KPICard label="Total Ingresos" value={totalI} format={v=>fmtMonto(v,moneda)} color={TDC.green}/>
          <KPICard label="Total Egresos"  value={totalE} format={v=>fmtMonto(v,moneda)} color={TDC.red600}/>
          <KPICard label="Saldo Actual"   value={saldo}  format={v=>fmtMonto(v,moneda)} color={saldo>=0?TDC.green:TDC.red600}/>
        </div>

        {/* ── Table ── */}
        <div style={S.card}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <span style={{fontWeight:700,color:TDC.ink,fontSize:14}}>Registros</span>
              <span style={{color:TDC.faint,fontSize:12,marginLeft:8}}>{sel.items.length} ítem{sel.items.length!==1?"s":""}</span>
              {saving && <span style={{color:TDC.red500,fontSize:11,marginLeft:10}}>Guardando…</span>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <Button variant="outline" leftIcon="📥" onClick={()=>setShowBulk(true)}>Subir facturas</Button>
              <Button variant="primary" leftIcon="+" onClick={()=>setEditingItem(tipo==="CC"?emptyItemCC():emptyItemMeta())}>
                Agregar registro
              </Button>
            </div>
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
                  <tr><td colSpan={11}>
                    <EmptyState compact icon="🧾" title="Sin registros" subtitle="Haz clic en “+ Agregar registro” para comenzar."/>
                  </td></tr>
                )}
                {sel.items.map(item => (
                  <tr key={item.id} className="tdc-row" style={{borderBottom:`1px solid ${TDC.border}`,transition:"background .15s"}}>
                    <td style={{padding:"8px 10px"}}><ProjBadge p={item.proyecto}/></td>
                    {tipo==="CC" && <td style={{padding:"8px 10px",color:TDC.textSub,fontSize:11,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.tipoGasto}</td>}
                    <td style={{padding:"8px 10px",color:TDC.textDim,fontFamily:"'Sora',sans-serif",fontSize:11,whiteSpace:"nowrap"}}>{item.fecha}</td>
                    <td style={{padding:"8px 10px",color:TDC.textLight,fontFamily:"'Sora',sans-serif",fontSize:10,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.comprobante||"—"}</td>
                    <td style={{padding:"8px 10px",color:TDC.textLight,fontFamily:"'Sora',sans-serif",fontSize:11,whiteSpace:"nowrap"}}>{item.emision}</td>
                    <td style={{padding:"8px 10px",color:TDC.text,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.proveedor}</td>
                    <td style={{padding:"8px 10px",color:TDC.textSub,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.referencia}</td>
                    <td style={{padding:"8px 10px"}}><span style={{background:TDC.bg,color:TDC.muted,border:`1px solid ${TDC.border}`,padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:600}}>{item.tipoDoc}</span></td>
                    <td style={{padding:"8px 10px",fontWeight:700,color:item.tipo==="Ingreso"?TDC.green:TDC.red600,fontFamily:"'Sora',sans-serif",whiteSpace:"nowrap"}}>
                      {fmtMonto(item.monto, moneda)}
                      {Number(item.impuesto)>0 && <div style={{fontSize:10,fontWeight:600,color:TDC.amber}}>+ imp. {fmtMonto(item.impuesto, moneda)}</div>}
                    </td>
                    <td style={{padding:"8px 10px"}}>
                      <EstadoChip tone={item.tipo==="Ingreso"?"success":"danger"} label={item.tipo}/>
                    </td>
                    <td style={{padding:"8px 10px"}}>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>setEditingItem({...item})} style={{background:TDC.bg,border:`1px solid ${TDC.border}`,borderRadius:8,color:TDC.muted,cursor:"pointer",padding:"4px 8px",fontSize:11,fontFamily:"'General Sans',sans-serif"}}>✏</button>
                        <button onClick={()=>deleteItem(item.id)} style={{background:TDC.redLight2,border:`1px solid ${TDC.coral}`,borderRadius:8,color:TDC.red600,cursor:"pointer",padding:"4px 8px",fontSize:11}}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {sel.items.length>0 && (
                <tfoot>
                  <tr style={{borderTop:`2px solid ${TDC.border}`,background:TDC.bg}}>
                    <td colSpan={tipo==="CC"?8:7} style={{padding:"9px 10px",color:TDC.muted,fontSize:11,fontWeight:600}}>TOTALES DEL PERÍODO</td>
                    <td style={{padding:"9px 10px",fontWeight:800,color:TDC.ink,fontFamily:"'Sora',sans-serif"}}>{fmtMonto(totalI+totalE, moneda)}</td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ── Danger zone — Eliminar rendición ── */}
        <div style={{marginTop:24,padding:"16px 20px",background:TDC.redLight2,border:`1px solid ${TDC.coral}`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontWeight:700,color:TDC.red600,fontSize:13}}>Eliminar rendición</div>
            <div style={{fontSize:12,color:TDC.muted,marginTop:2}}>Esta acción no se puede deshacer. Todos los registros se perderán.</div>
          </div>
          <Button variant="danger" leftIcon="🗑" onClick={()=>setConfirmDelete(true)}>Eliminar rendición</Button>
        </div>
      </>}

      {/* ── Modal confirmar eliminar ── */}
      {confirmDelete && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(3px)"}}>
          <div style={{background:TDC.card,borderRadius:16,padding:32,maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(15,27,39,0.18)",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>🗑</div>
            <div style={{fontWeight:700,fontSize:18,color:TDC.ink,marginBottom:8}}>¿Eliminar esta rendición?</div>
            <div style={{fontSize:13,color:TDC.muted,marginBottom:6}}>
              <b style={{color:TDC.ink}}>{rendicionLabel(sel, tipo)}</b>
            </div>
            <div style={{fontSize:13,color:TDC.red600,marginBottom:24,background:TDC.redLight2,padding:"10px 14px",borderRadius:8,border:`1px solid ${TDC.coral}`}}>
              ⚠ Esta acción no se puede recuperar. Se eliminarán todos los registros de esta rendición.
            </div>
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <Button variant="outline" onClick={()=>setConfirmDelete(false)}>No, cancelar</Button>
              <Button variant="primary" onClick={handleDeleteRendicion}>Sí, eliminar</Button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <ItemModal item={editingItem} tipo={tipo} moneda={moneda} presupuestos={presupuestos} periodo={sel} onSave={saveItem} onCancel={()=>setEditingItem(null)}/>
      )}

      {showBulk && sel && (
        <BulkUpload tipo={tipo} moneda={moneda} onSave={saveBulk} onCancel={()=>setShowBulk(false)}/>
      )}
    </div>
  );
}

function ProjBadge({ p }) {
  const c = PROJ_COLORS[p] || "#455A64";
  return <span style={{background:`${c}15`,color:c,border:`1px solid ${c}30`,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{p}</span>;
}
