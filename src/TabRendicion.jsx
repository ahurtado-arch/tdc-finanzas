import { useState } from "react";
import { saveRendicion, deleteRendicion as fbDeleteRendicion } from "./firebase.js";
import { exportRendicionXLSX } from "./exporter.js";
import ItemModal from "./ItemModal.jsx";
import {
  TDC, S, PROJ_COLORS, fmt, uid, today, mesLabel,
  emptyRendicion, emptyItemCC, emptyItemMeta,
} from "./constants.js";

export default function TabRendicion({ tipo, rendiciones }) {
  const [selId, setSelId]       = useState(rendiciones[0]?.id || null);
  const [showNew, setShowNew]   = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newMonto, setNewMonto] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving]     = useState(false);

  const sel = rendiciones.find(r => r.id === selId) || null;

  // ── Rendicion CRUD ────────────────────────────────────────────────────────
  const createRendicion = async () => {
    const r = emptyRendicion(tipo);
    if (newLabel.trim()) r.label = newLabel.trim();
    if (newMonto) r.montoAsignado = parseFloat(newMonto) || 0;
    await saveRendicion(tipo, r);
    setSelId(r.id); setShowNew(false); setNewLabel(""); setNewMonto("");
  };

  const handleDeleteRendicion = async id => {
    if (!confirm("¿Eliminar esta rendición? Esta acción no se puede deshacer.")) return;
    await fbDeleteRendicion(tipo, id);
    const next = rendiciones.find(r => r.id !== id);
    setSelId(next?.id || null);
  };

  const updateMonto = async val => {
    if (!sel) return;
    const updated = { ...sel, montoAsignado: parseFloat(val) || 0 };
    await saveRendicion(tipo, updated);
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

  // ── Derived totals ────────────────────────────────────────────────────────
  const totalI = sel ? sel.items.filter(i => i.tipo === "Ingreso").reduce((a,i) => a+Number(i.monto||0), 0) : 0;
  const totalE = sel ? sel.items.filter(i => i.tipo === "Egreso").reduce((a,i)  => a+Number(i.monto||0), 0) : 0;
  const monto  = sel ? Number(sel.montoAsignado || 0) : 0;
  const saldo  = monto + totalI - totalE;

  const headersCC   = ["Proyecto","Tipo Gasto","Partida","Fecha Pago","# Comp.","Emisión","Proveedor","Referencia","Tipo Doc","Monto","Tipo","Estado",""];
  const headersMeta = ["Proyecto","Fecha Pago","# Comp.","Emisión","Proveedor","Referencia","Tipo Doc","Monto","Tipo","Estado",""];

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:TDC.white,letterSpacing:"-0.5px"}}>{tipo==="CC"?"Caja Chica":"Meta Ads"}</h1>
          <p style={{fontSize:13,color:TDC.grayDim,marginTop:3}}>{tipo==="CC"?"Gestión y rendición de fondos de caja chica":"Gestión y rendición de gastos Meta Ads"}</p>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button onClick={() => setShowNew(v => !v)} style={btnGhost}>+ Nueva rendición</button>
          {sel && <button onClick={() => exportRendicionXLSX(sel, tipo)} style={btnRed}>⬇ Descargar Excel</button>}
        </div>
      </div>

      {/* ── New rendicion form ── */}
      {showNew && (
        <div style={{background:TDC.navyMid,border:`1px solid ${TDC.red}44`,borderRadius:14,padding:20,marginBottom:20}}>
          <div style={{fontWeight:700,color:TDC.red,fontSize:13,marginBottom:14}}>● Nueva Rendición</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 200px auto",gap:12,alignItems:"end"}}>
            <div>
              <div style={S.label}>Nombre del período</div>
              <input style={S.input} value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder={`${tipo} - ${mesLabel()} - I`}/>
            </div>
            <div>
              <div style={S.label}>Monto asignado (S/)</div>
              <input type="number" style={S.input} value={newMonto} onChange={e=>setNewMonto(e.target.value)} placeholder="0.00"/>
            </div>
            <button onClick={createRendicion} style={{...btnRed,height:40}}>Crear</button>
          </div>
        </div>
      )}

      {/* ── Rendicion selector tabs ── */}
      {rendiciones.length > 0 && (
        <div style={{display:"flex",gap:8,marginBottom:22,overflowX:"auto",paddingBottom:4,flexWrap:"wrap"}}>
          {rendiciones.map(r => (
            <div key={r.id} onClick={() => setSelId(r.id)} style={{
              padding:"7px 14px",borderRadius:10,cursor:"pointer",
              whiteSpace:"nowrap",fontSize:12,fontWeight:600,
              display:"flex",alignItems:"center",gap:6,
              background: selId===r.id ? `${TDC.red}18` : TDC.navyMid,
              border: `1px solid ${selId===r.id ? TDC.red : TDC.navyBorder}`,
              color: selId===r.id ? TDC.red : TDC.grayDim,
              transition:"all .2s",
            }}>
              {r.label}
              <span onClick={e=>{e.stopPropagation();handleDeleteRendicion(r.id);}} style={{color:TDC.grayDim,marginLeft:2,fontSize:17,lineHeight:1}}>×</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!sel && (
        <div style={{background:TDC.navyMid,border:`1px dashed ${TDC.navyBorder}`,borderRadius:16,padding:60,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:12}}>📋</div>
          <div style={{fontWeight:700,color:TDC.gray,fontSize:15}}>No hay rendiciones aún</div>
          <div style={{color:TDC.grayDim,fontSize:13,marginTop:6}}>Crea una nueva rendición para comenzar a registrar gastos</div>
        </div>
      )}

      {sel && <>
        {/* ── KPIs ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
          <div style={{...S.card,borderColor:`${TDC.red}44`}}>
            <div style={S.cardLabel}>Monto Asignado</div>
            <input type="number" defaultValue={sel.montoAsignado} onBlur={e=>updateMonto(e.target.value)}
              style={{background:"transparent",border:"none",outline:"none",color:TDC.red,fontSize:20,fontWeight:800,fontFamily:"'DM Sans',sans-serif",width:"100%",marginTop:4,padding:0}}
              placeholder="0.00"/>
            <div style={{fontSize:11,color:TDC.grayDim,marginTop:2}}>Clic para editar</div>
          </div>
          {[["Total Ingresos",totalI,TDC.green],["Total Egresos",totalE,TDC.red],["Saldo Actual",saldo,saldo>=0?TDC.green:TDC.red]].map(([label,val,color])=>(
            <div key={label} style={{...S.card,borderColor:`${color}33`}}>
              <div style={S.cardLabel}>{label}</div>
              <div style={{fontSize:19,fontWeight:800,color,marginTop:4}}>{fmt(val)}</div>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div style={S.card}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <span style={{fontWeight:700,color:TDC.white,fontSize:14}}>Registros</span>
              <span style={{color:TDC.grayDim,fontSize:12,marginLeft:8}}>{sel.items.length} ítem{sel.items.length!==1?"s":""}</span>
              {saving && <span style={{color:TDC.red,fontSize:11,marginLeft:10}}>Guardando…</span>}
            </div>
            <button onClick={() => setEditingItem(tipo==="CC" ? emptyItemCC() : emptyItemMeta())} style={btnRed}>
              + Agregar registro
            </button>
          </div>

          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${TDC.navyBorder}`}}>
                  {(tipo==="CC"?headersCC:headersMeta).map(h=>(
                    <th key={h} style={{padding:"8px 10px",textAlign:"left",color:TDC.grayDim,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sel.items.length===0 && (
                  <tr><td colSpan={13} style={{padding:36,textAlign:"center",color:TDC.grayDim,fontSize:13}}>
                    Sin registros — haz clic en <b style={{color:TDC.white}}>+ Agregar registro</b> para comenzar. Puedes subir un PDF y la IA lo llenará automáticamente.
                  </td></tr>
                )}
                {sel.items.map(item => (
                  <tr key={item.id} style={{borderBottom:`1px solid ${TDC.navyBorder}40`,transition:"background .15s",cursor:"default"}}
                    onMouseEnter={e=>e.currentTarget.style.background=TDC.navyLight}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"7px 10px"}}><ProjBadge p={item.proyecto}/></td>
                    {tipo==="CC" && <>
                      <td style={{padding:"7px 10px",color:TDC.textDim,fontSize:11,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.tipoGasto}</td>
                      <td style={{padding:"7px 10px",color:TDC.grayDim,fontSize:11}}>{item.partida||"—"}</td>
                    </>}
                    <td style={{padding:"7px 10px",color:TDC.gray,fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{item.fecha}</td>
                    <td style={{padding:"7px 10px",color:TDC.grayDim,fontFamily:"monospace",fontSize:10,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.comprobante||"—"}</td>
                    <td style={{padding:"7px 10px",color:TDC.grayDim,fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{item.emision}</td>
                    <td style={{padding:"7px 10px",color:TDC.text,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.proveedor}</td>
                    <td style={{padding:"7px 10px",color:TDC.textDim,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.referencia}</td>
                    <td style={{padding:"7px 10px"}}><span style={{background:`${TDC.navyBorder}60`,color:TDC.gray,padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:600}}>{item.tipoDoc}</span></td>
                    <td style={{padding:"7px 10px",fontWeight:700,color:item.tipo==="Ingreso"?TDC.green:TDC.red,fontFamily:"monospace",whiteSpace:"nowrap"}}>{fmt(item.monto)}</td>
                    <td style={{padding:"7px 10px"}}>
                      <span style={{background:item.tipo==="Ingreso"?"rgba(30,140,90,0.15)":"rgba(211,47,47,0.15)",color:item.tipo==="Ingreso"?TDC.green:TDC.redLight,padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:700}}>{item.tipo}</span>
                    </td>
                    <td style={{padding:"7px 10px"}}><span style={{background:`${TDC.navyBorder}40`,color:TDC.grayDim,padding:"2px 7px",borderRadius:5,fontSize:10}}>{item.estadoDoc}</span></td>
                    <td style={{padding:"7px 10px"}}>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>setEditingItem({...item})} style={{background:`${TDC.navyBorder}60`,border:"none",borderRadius:6,color:TDC.gray,cursor:"pointer",padding:"4px 8px",fontSize:11}}>✏</button>
                        <button onClick={()=>deleteItem(item.id)} style={{background:"rgba(211,47,47,0.15)",border:"none",borderRadius:6,color:TDC.red,cursor:"pointer",padding:"4px 8px",fontSize:11}}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {sel.items.length > 0 && (
                <tfoot>
                  <tr style={{borderTop:`2px solid ${TDC.navyBorder}`}}>
                    <td colSpan={tipo==="CC"?9:7} style={{padding:"9px 10px",color:TDC.grayDim,fontSize:11,fontWeight:600}}>TOTALES DEL PERÍODO</td>
                    <td style={{padding:"9px 10px",fontWeight:800,color:TDC.white,fontFamily:"monospace"}}>{fmt(totalI+totalE)}</td>
                    <td colSpan={3}/>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </>}

      {editingItem && (
        <ItemModal item={editingItem} tipo={tipo} onSave={saveItem} onCancel={() => setEditingItem(null)}/>
      )}
    </div>
  );
}

function ProjBadge({ p }) {
  const c = PROJ_COLORS[p] || TDC.grayDim;
  return <span style={{background:`${c}18`,color:c,border:`1px solid ${c}33`,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{p}</span>;
}

const btnRed = {
  padding:"9px 18px",border:"none",borderRadius:10,
  background:`linear-gradient(135deg,#D32F2F,#EF5350)`,
  color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",
  boxShadow:"0 2px 12px rgba(211,47,47,0.3)",transition:"all .2s",
};
const btnGhost = {
  padding:"9px 18px",border:"1px solid #2D3D6B",borderRadius:10,
  background:"transparent",color:"#8A9BC0",fontFamily:"'DM Sans',sans-serif",
  fontWeight:600,fontSize:13,cursor:"pointer",transition:"all .2s",
};
