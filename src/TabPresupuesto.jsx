import { useState } from "react";
import { savePresupuesto, deletePresupuesto } from "./firebase.js";
import {
  TDC, S, fmt, uid, today,
  PRIORIDADES_PRES, ESTADOS_PRES, REGISTRADO_PRES,
  CATEGORIAS_PRES, PROYECTOS_PRES,
  PRIORIDAD_COLORS, ESTADO_COLORS,
  MESES, PROGRAMACIONES, ANIOS, periodoActual, presLabel,
  emptyPresupuesto, emptyItemPres, emptyBloquePres,
} from "./constants.js";
import { Button, KPICard, EmptyState, useToast } from "./ui.jsx";

const sumBloque = (b, campo) => (b.items || []).reduce((a, i) => a + Number(i[campo] || 0), 0);

export default function TabPresupuesto({ presupuestos, rendicionesCC = [], rendicionesMeta = [] }) {
  const [selId, setSelId]             = useState(presupuestos[0]?.id || null);
  const [showNew, setShowNew]         = useState(false);
  const [nuevoPeriodo, setNuevoPeriodo] = useState(periodoActual());
  const [editing, setEditing]         = useState(null); // { bloqueId, item }
  const [saving, setSaving]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  const sel = presupuestos.find(p => p.id === selId) || null;

  // ── Monto Final ejecutado por partida (suma automática de registros) ──
  // Recorre todos los registros de CC y Meta vinculados a una partida y suma
  // sus egresos. Mapas partidaId → monto / cantidad de registros.
  const ejecMap = {};
  const cntMap  = {};
  [...rendicionesCC, ...rendicionesMeta].forEach(r =>
    (r.items || []).forEach(it => {
      if (!it.partidaId || it.tipo === "Ingreso") return;
      // Lo ejecutado incluye el impuesto (excedente del banco en Meta)
      ejecMap[it.partidaId] = (ejecMap[it.partidaId] || 0) + Number(it.monto || 0) + Number(it.impuesto || 0);
      cntMap[it.partidaId]  = (cntMap[it.partidaId]  || 0) + 1;
    })
  );
  // Monto final de una partida: registros vinculados si existen; si no, el valor
  // manual heredado (compatibilidad con presupuestos antiguos).
  const finalDe = item => (item.id in ejecMap ? ejecMap[item.id] : Number(item.montoFinal || 0));
  const cntDe   = item => cntMap[item.id] || 0;
  const finalBloque = b => (b.items || []).reduce((a, i) => a + finalDe(i), 0);

  // ── Presupuesto CRUD ──
  const createPresupuesto = async () => {
    const p = { ...emptyPresupuesto(), ...nuevoPeriodo };
    await savePresupuesto(p);
    setSelId(p.id); setShowNew(false); setNuevoPeriodo(periodoActual());
    toast("Presupuesto creado");
  };

  const handleDelete = async () => {
    if (!sel) return;
    await deletePresupuesto(sel.id);
    setSelId(presupuestos.find(p => p.id !== sel.id)?.id || null);
    setConfirmDelete(false);
    toast("Presupuesto eliminado", { tone: "error" });
  };

  const updatePeriodo = async (campo, val) => {
    if (!sel || sel[campo] === val) return;
    await savePresupuesto({ ...sel, [campo]: val });
  };

  // ── Bloque CRUD ──
  const addBloque = async () => {
    if (!sel) return;
    await savePresupuesto({ ...sel, bloques: [...sel.bloques, emptyBloquePres()] });
    toast("Bloque agregado");
  };
  const renameBloque = async (bloqueId, nombre) => {
    if (!sel) return;
    await savePresupuesto({ ...sel, bloques: sel.bloques.map(b => b.id === bloqueId ? { ...b, nombre } : b) });
  };
  const deleteBloque = async bloqueId => {
    if (!sel) return;
    await savePresupuesto({ ...sel, bloques: sel.bloques.filter(b => b.id !== bloqueId) });
    toast("Bloque eliminado", { tone: "error" });
  };

  // ── Item CRUD ──
  const saveItem = async (bloqueId, item) => {
    if (!sel) return;
    setSaving(true);
    const bloques = sel.bloques.map(b => {
      if (b.id !== bloqueId) return b;
      const items = b.items.some(i => i.id === item.id)
        ? b.items.map(i => i.id === item.id ? item : i)
        : [...b.items, item];
      return { ...b, items };
    });
    await savePresupuesto({ ...sel, bloques });
    setSaving(false); setEditing(null);
    toast("Partida guardada");
  };
  const deleteItem = async (bloqueId, itemId) => {
    if (!sel) return;
    const bloques = sel.bloques.map(b =>
      b.id === bloqueId ? { ...b, items: b.items.filter(i => i.id !== itemId) } : b);
    await savePresupuesto({ ...sel, bloques });
    toast("Partida eliminada", { tone: "error" });
  };

  // ── Totales ──
  const bloques = sel?.bloques || [];
  const totalProy  = bloques.reduce((a, b) => a + sumBloque(b, "montoProyectado"), 0);
  const totalFinal = bloques.reduce((a, b) => a + finalBloque(b), 0);
  const diff       = totalProy - totalFinal;
  const nItems     = bloques.reduce((a, b) => a + (b.items?.length || 0), 0);

  // Resumen por proyecto (sobre monto proyectado)
  const porProyecto = {};
  bloques.forEach(b => (b.items || []).forEach(i => {
    const k = (i.proyecto || "").trim() || "Sin asignar";
    porProyecto[k] = (porProyecto[k] || 0) + Number(i.montoProyectado || 0);
  }));
  const proyectoRows = Object.entries(porProyecto).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:TDC.ink,letterSpacing:"-0.5px"}}>Presupuestos</h1>
          <p style={{fontSize:13,color:TDC.muted,marginTop:3}}>Presupuesto de marketing por bloques · proyectado vs. ejecutado</p>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <Button variant="outline" leftIcon="+" onClick={()=>setShowNew(v=>!v)}>Nuevo presupuesto</Button>
        </div>
      </div>

      {/* Nuevo presupuesto */}
      {showNew && (
        <div style={{...S.card,marginBottom:20,borderColor:`${TDC.coral}55`,background:"#FFF8F8"}}>
          <div style={{fontWeight:700,color:TDC.red600,fontSize:13,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:TDC.red500,display:"inline-block"}}/>
            Nuevo Presupuesto
          </div>
          <div style={{display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap"}}>
            <div style={{flex:"1 1 160px",minWidth:140}}>
              <div style={S.label}>Mes</div>
              <select style={S.select} value={nuevoPeriodo.mes} onChange={e=>setNuevoPeriodo(p=>({...p,mes:e.target.value}))}>
                {MESES.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div style={{flex:"0 1 130px",minWidth:110}}>
              <div style={S.label}># Programación</div>
              <select style={S.select} value={nuevoPeriodo.prog} onChange={e=>setNuevoPeriodo(p=>({...p,prog:e.target.value}))}>
                {PROGRAMACIONES.map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={{flex:"0 1 130px",minWidth:110}}>
              <div style={S.label}>Año</div>
              <select style={S.select} value={nuevoPeriodo.anio} onChange={e=>setNuevoPeriodo(p=>({...p,anio:e.target.value}))}>
                {ANIOS.map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
            <Button variant="primary" onClick={createPresupuesto}>Crear presupuesto</Button>
          </div>
          <div style={{fontSize:11,color:TDC.faint,marginTop:10}}>Se crea con los 6 bloques base. El período (Mes · # · Año) conecta este presupuesto con las rendiciones del mismo período.</div>
        </div>
      )}

      {/* Selector */}
      {presupuestos.length > 0 && (
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:TDC.faint,fontWeight:600,textTransform:"uppercase",letterSpacing:.6}}>Presupuesto</span>
          <select value={selId||""} onChange={e=>setSelId(e.target.value)}
            style={{...S.select,width:"auto",minWidth:240,maxWidth:"100%",cursor:"pointer",fontWeight:600,color:TDC.red600,border:`1px solid ${TDC.coral}`,background:TDC.redLight2}}>
            {presupuestos.map(p=><option key={p.id} value={p.id}>{presLabel(p)}</option>)}
          </select>
          <span style={{fontSize:12,color:TDC.faint}}>{presupuestos.length} presupuesto{presupuestos.length!==1?"s":""}</span>
        </div>
      )}

      {/* Empty */}
      {!sel && (
        <div style={S.card}>
          <EmptyState icon="🧾" title="No hay presupuestos aún" subtitle="Crea un presupuesto para comenzar a planificar por bloques">
            <Button variant="primary" leftIcon="+" onClick={()=>setShowNew(true)}>Nuevo presupuesto</Button>
          </EmptyState>
        </div>
      )}

      {sel && <>
        {/* Período editable */}
        <div style={{...S.card,marginBottom:20}}>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
            <div style={{flex:"1 1 160px",minWidth:140}}>
              <div style={S.label}>Mes</div>
              <select style={S.select} value={sel.mes||""} onChange={e=>updatePeriodo("mes",e.target.value)}>
                {!sel.mes && <option value="">—</option>}
                {MESES.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div style={{flex:"0 1 130px",minWidth:110}}>
              <div style={S.label}># Programación</div>
              <select style={S.select} value={sel.prog||""} onChange={e=>updatePeriodo("prog",e.target.value)}>
                {!sel.prog && <option value="">—</option>}
                {PROGRAMACIONES.map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={{flex:"0 1 130px",minWidth:110}}>
              <div style={S.label}>Año</div>
              <select style={S.select} value={sel.anio||""} onChange={e=>updatePeriodo("anio",e.target.value)}>
                {!sel.anio && <option value="">—</option>}
                {ANIOS.map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
          <KPICard label="Total Proyectado" value={totalProy} format={fmt} color={TDC.red600}/>
          <KPICard label="Total Ejecutado"  value={totalFinal} format={fmt} color={TDC.ink}/>
          <KPICard label="Diferencia" value={diff} format={fmt} color={diff>=0?TDC.green:TDC.red500} sub={diff>=0?"Bajo presupuesto":"Sobre presupuesto"}/>
          <KPICard label="Partidas" value={nItems} format={v=>Math.round(v)} color={TDC.muted}/>
        </div>

        {/* Bloques */}
        {bloques.map(b => (
          <BloqueCard
            key={b.id} bloque={b} saving={saving} finalDe={finalDe} cntDe={cntDe}
            onRename={nombre=>renameBloque(b.id, nombre)}
            onDelete={()=>deleteBloque(b.id)}
            onAddItem={()=>setEditing({ bloqueId:b.id, item:emptyItemPres() })}
            onEditItem={item=>setEditing({ bloqueId:b.id, item:{...item} })}
            onDeleteItem={itemId=>deleteItem(b.id, itemId)}
          />
        ))}

        <div style={{marginTop:4,marginBottom:24}}>
          <Button variant="outline" leftIcon="+" onClick={addBloque}>Agregar bloque</Button>
        </div>

        {/* Resumen Ejecutivo */}
        {nItems > 0 && (
          <div style={{...S.card,marginBottom:24}}>
            <div style={{fontWeight:700,color:TDC.ink,fontSize:14,marginBottom:16}}>Resumen Ejecutivo</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:24}}>
              <ResumenTabla
                titulo="Por bloque"
                rows={bloques.map(b=>[b.nombre, sumBloque(b,"montoProyectado")])}
                total={totalProy}
              />
              <ResumenTabla
                titulo="Por proyecto / frente"
                rows={proyectoRows}
                total={totalProy}
              />
            </div>
          </div>
        )}

        {/* Danger zone */}
        <div style={{padding:"16px 20px",background:TDC.redLight2,border:`1px solid ${TDC.coral}`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontWeight:700,color:TDC.red600,fontSize:13}}>Eliminar presupuesto</div>
            <div style={{fontSize:12,color:TDC.muted,marginTop:2}}>Esta acción no se puede deshacer. Todos los bloques y partidas se perderán.</div>
          </div>
          <Button variant="danger" leftIcon="🗑" onClick={()=>setConfirmDelete(true)}>Eliminar presupuesto</Button>
        </div>
      </>}

      {/* Confirmar eliminar */}
      {confirmDelete && sel && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(3px)"}}>
          <div style={{background:TDC.card,borderRadius:16,padding:32,maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(15,27,39,0.18)",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>🗑</div>
            <div style={{fontWeight:700,fontSize:18,color:TDC.ink,marginBottom:8}}>¿Eliminar este presupuesto?</div>
            <div style={{fontSize:13,color:TDC.muted,marginBottom:6}}><b style={{color:TDC.ink}}>{presLabel(sel)}</b></div>
            <div style={{fontSize:13,color:TDC.red600,marginBottom:24,background:TDC.redLight2,padding:"10px 14px",borderRadius:8,border:`1px solid ${TDC.coral}`}}>
              ⚠ Esta acción no se puede recuperar. Se eliminarán todos los bloques y partidas.
            </div>
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <Button variant="outline" onClick={()=>setConfirmDelete(false)}>No, cancelar</Button>
              <Button variant="primary" onClick={handleDelete}>Sí, eliminar</Button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <PresItemModal
          item={editing.item}
          ejecutado={finalDe(editing.item)}
          nReg={cntDe(editing.item)}
          onSave={item=>saveItem(editing.bloqueId, item)}
          onCancel={()=>setEditing(null)}
        />
      )}
    </div>
  );
}

// ── Tarjeta de bloque ──
function BloqueCard({ bloque, saving, finalDe, cntDe, onRename, onDelete, onAddItem, onEditItem, onDeleteItem }) {
  const items   = bloque.items || [];
  const subProy = sumBloque(bloque, "montoProyectado");
  const subFin  = items.reduce((a, i) => a + finalDe(i), 0);

  return (
    <div style={{...S.card,marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:14,flexWrap:"wrap"}}>
        <input
          defaultValue={bloque.nombre} key={bloque.nombre}
          onBlur={e=>{ const v=e.target.value.trim(); if(v && v!==bloque.nombre) onRename(v); else e.target.value=bloque.nombre; }}
          style={{fontWeight:700,color:TDC.ink,fontSize:15,border:"1px solid transparent",background:"transparent",borderRadius:8,padding:"4px 8px",outline:"none",minWidth:200,flex:"1 1 240px",fontFamily:"'General Sans',sans-serif"}}
          onFocus={e=>{e.target.style.background=TDC.bg;e.target.style.borderColor=TDC.border;}}
          onMouseLeave={e=>{if(document.activeElement!==e.target){e.target.style.background="transparent";e.target.style.borderColor="transparent";}}}
        />
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {saving && <span style={{color:TDC.red500,fontSize:11}}>Guardando…</span>}
          <Button variant="outline" size="sm" leftIcon="+" onClick={onAddItem}>Partida</Button>
          <button onClick={onDelete} title="Eliminar bloque" style={{background:TDC.redLight2,border:`1px solid ${TDC.coral}`,borderRadius:8,color:TDC.red600,cursor:"pointer",padding:"6px 10px",fontSize:12}}>🗑</button>
        </div>
      </div>

      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:980}}>
          <thead>
            <tr style={{borderBottom:`2px solid ${TDC.border}`}}>
              {["Concepto","Categoría","Proyecto","Encargado","Proveedor","Prioridad","Fecha req.","Estado","Proyectado","Final","¿Reg.?",""].map(h=>(
                <th key={h} style={{padding:"8px 9px",textAlign:"left",color:TDC.faint,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length===0 && (
              <tr><td colSpan={12}>
                <EmptyState compact icon="📋" title="Sin partidas" subtitle="Haz clic en “+ Partida” para agregar."/>
              </td></tr>
            )}
            {items.map(item=>(
              <tr key={item.id} className="tdc-row" style={{borderBottom:`1px solid ${TDC.border}`,transition:"background .15s"}}>
                <td style={{padding:"8px 9px",color:TDC.ink,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{item.concepto||"—"}</td>
                <td style={{padding:"8px 9px",color:TDC.textSub,whiteSpace:"nowrap"}}>{item.categoria||"—"}</td>
                <td style={{padding:"8px 9px"}}>{item.proyecto ? <Badge text={item.proyecto}/> : "—"}</td>
                <td style={{padding:"8px 9px",color:TDC.textSub,whiteSpace:"nowrap"}}>{item.encargado||"—"}</td>
                <td style={{padding:"8px 9px",color:TDC.textSub,whiteSpace:"nowrap",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis"}}>{item.proveedor||"—"}</td>
                <td style={{padding:"8px 9px"}}><Dot color={PRIORIDAD_COLORS[item.prioridad]} label={item.prioridad}/></td>
                <td style={{padding:"8px 9px",color:TDC.muted,fontFamily:"'Sora',sans-serif",fontSize:11,whiteSpace:"nowrap"}}>{item.fechaRequerida||"—"}</td>
                <td style={{padding:"8px 9px"}}><Dot color={ESTADO_COLORS[item.estado]} label={item.estado}/></td>
                <td style={{padding:"8px 9px",fontWeight:700,color:TDC.red600,fontFamily:"'Sora',sans-serif",whiteSpace:"nowrap"}}>{fmt(item.montoProyectado)}</td>
                <td style={{padding:"8px 9px",fontWeight:600,color:finalDe(item)>0?TDC.ink:TDC.faint,fontFamily:"'Sora',sans-serif",whiteSpace:"nowrap"}}>
                  {fmt(finalDe(item))}
                  {cntDe(item)>0 && <span title={`${cntDe(item)} registro(s) vinculado(s)`} style={{marginLeft:6,fontSize:9,fontWeight:700,color:TDC.green,background:TDC.greenLight,borderRadius:6,padding:"1px 5px",fontFamily:"'General Sans',sans-serif"}}>🔗{cntDe(item)}</span>}
                </td>
                <td style={{padding:"8px 9px",textAlign:"center"}}>{item.registrado==="Sí" ? <span style={{color:TDC.green,fontWeight:700}}>✓</span> : <span style={{color:TDC.faint}}>—</span>}</td>
                <td style={{padding:"8px 9px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>onEditItem(item)} style={{background:TDC.bg,border:`1px solid ${TDC.border}`,borderRadius:8,color:TDC.muted,cursor:"pointer",padding:"4px 8px",fontSize:11}}>✏</button>
                    <button onClick={()=>onDeleteItem(item.id)} style={{background:TDC.redLight2,border:`1px solid ${TDC.coral}`,borderRadius:8,color:TDC.red600,cursor:"pointer",padding:"4px 8px",fontSize:11}}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {items.length>0 && (
            <tfoot>
              <tr style={{borderTop:`2px solid ${TDC.border}`,background:TDC.bg}}>
                <td colSpan={8} style={{padding:"9px 9px",color:TDC.muted,fontSize:11,fontWeight:600}}>SUBTOTAL — {bloque.nombre}</td>
                <td style={{padding:"9px 9px",fontWeight:800,color:TDC.red600,fontFamily:"'Sora',sans-serif"}}>{fmt(subProy)}</td>
                <td style={{padding:"9px 9px",fontWeight:800,color:TDC.ink,fontFamily:"'Sora',sans-serif"}}>{fmt(subFin)}</td>
                <td colSpan={2}/>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ── Tabla de resumen ──
function ResumenTabla({ titulo, rows, total }) {
  return (
    <div>
      <div style={{fontSize:11,color:TDC.faint,fontWeight:700,textTransform:"uppercase",letterSpacing:.6,marginBottom:10}}>{titulo}</div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <tbody>
          {rows.map(([nombre, monto])=>{
            const pct = total>0 ? (monto/total*100) : 0;
            return (
              <tr key={nombre} style={{borderBottom:`1px solid ${TDC.border}`}}>
                <td style={{padding:"7px 4px",color:TDC.textSub}}>{nombre}</td>
                <td style={{padding:"7px 4px",textAlign:"right",fontWeight:700,color:TDC.ink,fontFamily:"'Sora',sans-serif",whiteSpace:"nowrap"}}>{fmt(monto)}</td>
                <td style={{padding:"7px 4px",textAlign:"right",color:TDC.muted,fontFamily:"'Sora',sans-serif",width:48}}>{pct.toFixed(1)}%</td>
              </tr>
            );
          })}
          <tr style={{borderTop:`2px solid ${TDC.border}`}}>
            <td style={{padding:"8px 4px",fontWeight:800,color:TDC.ink}}>TOTAL</td>
            <td style={{padding:"8px 4px",textAlign:"right",fontWeight:800,color:TDC.red600,fontFamily:"'Sora',sans-serif"}}>{fmt(total)}</td>
            <td style={{padding:"8px 4px",textAlign:"right",color:TDC.muted,fontFamily:"'Sora',sans-serif"}}>100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Badge({ text }) {
  return <span style={{background:`${TDC.muted}12`,color:TDC.textSub,border:`1px solid ${TDC.border}`,borderRadius:8,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{text}</span>;
}

function Dot({ color = TDC.muted, label }) {
  if (!label) return <span style={{color:TDC.faint}}>—</span>;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
      <span style={{width:7,height:7,borderRadius:"50%",background:color,display:"inline-block"}}/>
      <span style={{color:TDC.textSub,fontSize:11,fontWeight:600}}>{label}</span>
    </span>
  );
}

// ── Modal de partida ──
function PresItemModal({ item, ejecutado = 0, nReg = 0, onSave, onCancel }) {
  const [f, setF] = useState({ ...item });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.concepto.trim();

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:TDC.card,borderRadius:18,width:"100%",maxWidth:620,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(15,27,39,0.16)"}}>
        <div style={{borderBottom:`1px solid ${TDC.border}`,padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontWeight:700,fontSize:16,color:TDC.ink}}>{item.concepto ? "Editar partida" : "Nueva partida"}</div>
            <div style={{fontSize:12,color:TDC.muted,marginTop:2}}>Partida del presupuesto</div>
          </div>
          <button onClick={onCancel} style={{background:TDC.bg,border:`1px solid ${TDC.border}`,borderRadius:8,color:TDC.muted,cursor:"pointer",width:32,height:32,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>

        <div style={{padding:24}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"span 2"}}>
              <div style={S.label}>Concepto *</div>
              <input style={S.input} value={f.concepto} onChange={e=>set("concepto",e.target.value)} placeholder="Ej: Pauta Meta Ads — LC"/>
            </div>
            <div>
              <div style={S.label}>Categoría</div>
              <input list="pres-categorias" style={S.input} value={f.categoria} onChange={e=>set("categoria",e.target.value)} placeholder="Elige o escribe"/>
              <datalist id="pres-categorias">{CATEGORIAS_PRES.map(c=><option key={c} value={c}/>)}</datalist>
            </div>
            <div>
              <div style={S.label}>Proyecto / Frente</div>
              <input list="pres-proyectos" style={S.input} value={f.proyecto} onChange={e=>set("proyecto",e.target.value)} placeholder="Elige o escribe"/>
              <datalist id="pres-proyectos">{PROYECTOS_PRES.map(p=><option key={p} value={p}/>)}</datalist>
            </div>
            <div>
              <div style={S.label}>Encargado</div>
              <input style={S.input} value={f.encargado} onChange={e=>set("encargado",e.target.value)} placeholder="Responsable"/>
            </div>
            <div>
              <div style={S.label}>Proveedor</div>
              <input style={S.input} value={f.proveedor} onChange={e=>set("proveedor",e.target.value)} placeholder="Proveedor"/>
            </div>
            <div>
              <div style={S.label}>Prioridad</div>
              <select style={S.select} value={f.prioridad} onChange={e=>set("prioridad",e.target.value)}>
                {PRIORIDADES_PRES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <div style={S.label}>Fecha requerida</div>
              <input style={S.input} value={f.fechaRequerida} onChange={e=>set("fechaRequerida",e.target.value)} placeholder="Ej: 06/26 o Junio"/>
            </div>
            <div>
              <div style={S.label}>Estado</div>
              <select style={S.select} value={f.estado} onChange={e=>set("estado",e.target.value)}>
                {ESTADOS_PRES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={S.label}>¿Se registró?</div>
              <select style={S.select} value={f.registrado} onChange={e=>set("registrado",e.target.value)}>
                {REGISTRADO_PRES.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={S.label}>Monto Proyectado</div>
              <input type="number" step="0.01" style={{...S.input,...S.num,color:TDC.red600,fontWeight:700}} value={f.montoProyectado} onChange={e=>set("montoProyectado",e.target.value)} placeholder="0.00"/>
              <div style={{fontSize:10,color:TDC.faint,marginTop:3}}>Soles (S/)</div>
            </div>
            <div>
              <div style={S.label}>Monto Final (automático)</div>
              <div style={{...S.input,...S.num,display:"flex",alignItems:"center",justifyContent:"space-between",background:TDC.bg,color:nReg>0?TDC.ink:TDC.faint,fontWeight:700}}>
                <span>{fmt(ejecutado)}</span>
                {nReg>0 && <span style={{fontSize:10,fontWeight:700,color:TDC.green,background:TDC.greenLight,borderRadius:6,padding:"1px 6px",fontFamily:"'General Sans',sans-serif"}}>🔗 {nReg}</span>}
              </div>
              <div style={{fontSize:10,color:TDC.faint,marginTop:3}}>
                {nReg>0 ? `Suma de ${nReg} registro(s) vinculado(s) (S/)` : "Se llena al vincular registros desde Caja Chica / Meta"}
              </div>
            </div>
          </div>

          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:22,paddingTop:18,borderTop:`1px solid ${TDC.border}`}}>
            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button variant="primary" disabled={!valid} onClick={()=>valid&&onSave(f)}>Guardar partida</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
