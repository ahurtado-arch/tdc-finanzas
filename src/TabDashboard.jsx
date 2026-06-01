import { useState } from "react";
import { saveSolicitud, deleteSolicitud as fbDeleteSolicitud } from "./firebase.js";
import {
  TDC, S, PROYECTOS, TIPOS_GASTO_CC, PROJ_COLORS, TIPO_COLORS,
  fmt, fmtMonto, uid, today,
} from "./constants.js";
import { Button, KPICard, EstadoChip, EmptyState, Hero, useToast } from "./ui.jsx";

export default function TabDashboard({ rendicionesCC, rendicionesMeta, solicitudes }) {
  const [filterProj, setFilterProj] = useState("TODOS");
  const [showSolForm, setShowSolForm] = useState(false);
  const [solForm, setSolForm] = useState({ fecha:today(), tipo:"Caja Chica", monto:"", motivo:"", proyecto:"GENERAL" });
  const toast = useToast();

  const allCC   = rendicionesCC.flatMap(r => r.items);
  const allMeta = rendicionesMeta.flatMap(r => r.items);
  const filtCC   = filterProj==="TODOS" ? allCC   : allCC.filter(i=>i.proyecto===filterProj);
  const filtMeta = filterProj==="TODOS" ? allMeta : allMeta.filter(i=>i.proyecto===filterProj);
  const filtSol  = filterProj==="TODOS" ? solicitudes : solicitudes.filter(s=>s.proyecto===filterProj);

  const ccEgreso     = filtCC.filter(i=>i.tipo==="Egreso").reduce((a,i)=>a+Number(i.monto||0),0);
  const metaEgreso   = filtMeta.filter(i=>i.tipo==="Egreso").reduce((a,i)=>a+Number(i.monto||0),0);
  const ccAsignado   = rendicionesCC.reduce((a,r)=>a+Number(r.montoAsignado||0),0);
  const metaAsignado = rendicionesMeta.reduce((a,r)=>a+Number(r.montoAsignado||0),0);

  const gastoProj = {};
  PROYECTOS.forEach(p=>gastoProj[p]=0);
  [...filtCC,...filtMeta].filter(i=>i.tipo==="Egreso").forEach(i=>{
    gastoProj[i.proyecto]=(gastoProj[i.proyecto]||0)+Number(i.monto||0);
  });
  const maxProj = Math.max(...Object.values(gastoProj),1);

  const gastoCCTipo = {};
  TIPOS_GASTO_CC.forEach(t=>gastoCCTipo[t]=0);
  filtCC.filter(i=>i.tipo==="Egreso").forEach(i=>{
    gastoCCTipo[i.tipoGasto]=(gastoCCTipo[i.tipoGasto]||0)+Number(i.monto||0);
  });
  const maxTipo = Math.max(...Object.values(gastoCCTipo),1);

  const addSolicitud = async () => {
    if (!solForm.monto||!solForm.motivo||!solForm.fecha) return;
    const s = { ...solForm, id:uid(), monto:parseFloat(solForm.monto) };
    await saveSolicitud(s);
    setSolForm(f=>({...f,monto:"",motivo:""}));
    setShowSolForm(false);
    toast("Solicitud registrada");
  };
  const handleDeleteSolicitud = async id => { await fbDeleteSolicitud(id); toast("Solicitud eliminada", { tone:"error" }); };

  const btnRed = {
    padding:"8px 16px",border:"none",borderRadius:9,
    background:`linear-gradient(135deg,${TDC.red},${TDC.redLight})`,
    color:"#fff",fontFamily:"'General Sans',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer",
    boxShadow:"0 2px 8px rgba(211,47,47,0.2)",
  };

  return (
    <div>
      {/* Hero */}
      <Hero title="Dashboard Global" subtitle="Vista consolidada de todos los fondos y gastos"
        style={{marginBottom:18}}
        right={
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:".8px",textTransform:"uppercase",color:"rgba(255,255,255,0.7)"}}>Gasto Total</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontVariantNumeric:"tabular-nums",fontSize:28,fontWeight:700,letterSpacing:"-0.5px"}}>{fmt(ccEgreso+metaEgreso)}</div>
          </div>
        }
      />

      {/* Filtro por proyecto */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:20}}>
        {["TODOS",...PROYECTOS].map(p=>{
          const active=filterProj===p;
          const c=PROJ_COLORS[p]||TDC.red500;
          return (
            <button key={p} onClick={()=>setFilterProj(p)} style={{
              padding:"5px 13px",borderRadius:999,cursor:"pointer",fontSize:11,fontWeight:700,
              fontFamily:"'General Sans',sans-serif",transition:"all .15s",
              background:active?`${c}15`:TDC.card,
              border:`1px solid ${active?c:TDC.border}`,
              color:active?c:TDC.muted,
            }}>{p}</button>
          );
        })}
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        <KPICard label="Gasto Total"      value={ccEgreso+metaEgreso} format={fmt} color={TDC.ink}    sub="CC + Meta combinados"/>
        <KPICard label="Gasto Caja Chica" value={ccEgreso}            format={fmt} color={TDC.red600}  sub={`de ${fmt(ccAsignado)} asignados`}/>
        <KPICard label="Gasto Meta Ads"   value={metaEgreso}          format={fmt} color="#6A1B9A"     sub={`de ${fmt(metaAsignado)} asignados`}/>
        <KPICard label="Solicitudes"      value={filtSol.length}      format={v=>Math.round(v)} color={TDC.amber} sub={`${fmt(filtSol.reduce((a,s)=>a+Number(s.monto||0),0))} total`}/>
      </div>

      {/* Saldo bars */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
        {[
          ["Saldo Caja Chica", ccAsignado-ccEgreso,       ccAsignado,   ccEgreso,    TDC.red],
          ["Saldo Meta Ads",   metaAsignado-metaEgreso,   metaAsignado, metaEgreso,  "#6A1B9A"],
        ].map(([label,saldo,asig,egr,color])=>{
          const pct = asig>0?Math.min(100,egr/asig*100):0;
          return (
            <div key={label} style={S.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={S.cardLabel}>{label}</div>
                  <div style={{fontSize:22,fontWeight:800,color:saldo>=0?TDC.green:TDC.red,marginTop:4}}>{fmt(saldo)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:TDC.textLight,fontWeight:600,textTransform:"uppercase"}}>Disponible</div>
                  <div style={{fontSize:13,fontWeight:700,color:TDC.textSub,marginTop:2}}>{asig>0?Math.round((1-egr/asig)*100)+"%":"—"}</div>
                </div>
              </div>
              <div style={{background:TDC.bg,borderRadius:6,height:8,overflow:"hidden",marginBottom:8}}>
                <div style={{height:"100%",width:pct+"%",background:`linear-gradient(90deg,${color},${color}99)`,borderRadius:6,transition:"width .7s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:TDC.textLight}}>
                <span>Gastado: <b style={{color:TDC.textSub}}>{fmt(egr)}</b></span>
                <span>Asignado: <b style={{color:TDC.textSub}}>{fmt(asig)}</b></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
        <div style={S.card}>
          <div style={{fontWeight:700,color:TDC.text,fontSize:13,marginBottom:16}}>Gasto por Proyecto</div>
          {PROYECTOS.filter(p=>gastoProj[p]>0).length===0?<EmptyChart/>:
            PROYECTOS.filter(p=>gastoProj[p]>0).sort((a,b)=>gastoProj[b]-gastoProj[a]).map(p=>(
              <div key={p} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <ProjBadge p={p}/>
                <div style={{flex:1,background:TDC.bg,borderRadius:5,height:12,overflow:"hidden"}}>
                  <div style={{height:"100%",width:(gastoProj[p]/maxProj*100)+"%",background:`linear-gradient(90deg,${PROJ_COLORS[p]},${PROJ_COLORS[p]}99)`,borderRadius:5,transition:"width .7s"}}/>
                </div>
                <div style={{width:90,textAlign:"right",fontSize:11,color:TDC.textSub,fontFamily:"'Sora',sans-serif"}}>{fmt(gastoProj[p])}</div>
              </div>
            ))
          }
        </div>
        <div style={S.card}>
          <div style={{fontWeight:700,color:TDC.text,fontSize:13,marginBottom:16}}>Caja Chica por Tipo de Gasto</div>
          {Object.values(gastoCCTipo).every(v=>v===0)?<EmptyChart/>:
            TIPOS_GASTO_CC.filter(t=>gastoCCTipo[t]>0).sort((a,b)=>gastoCCTipo[b]-gastoCCTipo[a]).map(t=>(
              <div key={t} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{width:4,height:26,borderRadius:2,background:TIPO_COLORS[t]||TDC.textLight,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:TDC.textDim,marginBottom:3,fontWeight:600}}>{t}</div>
                  <div style={{background:TDC.bg,borderRadius:5,height:8,overflow:"hidden"}}>
                    <div style={{height:"100%",width:(gastoCCTipo[t]/maxTipo*100)+"%",background:`linear-gradient(90deg,${TIPO_COLORS[t]||"#999"},${TIPO_COLORS[t]||"#999"}99)`,borderRadius:5,transition:"width .7s"}}/>
                  </div>
                </div>
                <div style={{width:80,textAlign:"right",fontSize:11,color:TDC.textSub,fontFamily:"'Sora',sans-serif"}}>{fmt(gastoCCTipo[t])}</div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Solicitudes */}
      <div style={S.card}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <div style={{fontWeight:700,color:TDC.ink,fontSize:14}}>Solicitudes de Fondos</div>
            <div style={{fontSize:12,color:TDC.muted,marginTop:2}}>Registro de pedidos de dinero por tipo y proyecto</div>
          </div>
          <Button variant="primary" size="sm" leftIcon="+" onClick={()=>setShowSolForm(v=>!v)}>Nueva Solicitud</Button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
          {[
            ["Total solicitado", fmt(filtSol.reduce((a,s)=>a+Number(s.monto||0),0)), TDC.ink],
            ["Solicitudes CC",   filtSol.filter(s=>s.tipo==="Caja Chica").length+" veces", TDC.red600],
            ["Solicitudes Meta", filtSol.filter(s=>s.tipo==="Meta").length+" veces", "#6A1B9A"],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:TDC.bg,borderRadius:12,padding:"12px 14px",border:`1px solid ${TDC.border}`}}>
              <div style={{fontSize:10,color:TDC.faint,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
              <div style={{fontSize:16,fontWeight:700,color:c,marginTop:5,fontFamily:"'Sora',sans-serif",fontVariantNumeric:"tabular-nums"}}>{v}</div>
            </div>
          ))}
        </div>

        {showSolForm && (
          <div style={{background:TDC.bg,borderRadius:12,padding:18,marginBottom:16,border:`1px solid ${TDC.border}`}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:12,marginBottom:14}}>
              <div><div style={S.label}>Fecha</div><input type="date" style={S.input} value={solForm.fecha} onChange={e=>setSolForm(f=>({...f,fecha:e.target.value}))}/></div>
              <div><div style={S.label}>Tipo</div>
                <select style={S.select} value={solForm.tipo} onChange={e=>setSolForm(f=>({...f,tipo:e.target.value}))}>
                  <option>Caja Chica</option><option>Meta</option>
                </select>
              </div>
              <div><div style={S.label}>Proyecto</div>
                <select style={S.select} value={solForm.proyecto} onChange={e=>setSolForm(f=>({...f,proyecto:e.target.value}))}>
                  {PROYECTOS.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div><div style={S.label}>Monto (S/)</div><input type="number" style={S.input} value={solForm.monto} onChange={e=>setSolForm(f=>({...f,monto:e.target.value}))} placeholder="0.00"/></div>
              <div style={{gridColumn:"span 2"}}><div style={S.label}>Motivo</div>
                <input style={S.input} value={solForm.motivo} onChange={e=>setSolForm(f=>({...f,motivo:e.target.value}))} placeholder="Ej: Campañas Meta febrero…"/>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Button variant="primary" size="sm" onClick={addSolicitud}>Guardar</Button>
              <Button variant="outline" size="sm" onClick={()=>setShowSolForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:`2px solid ${TDC.border}`}}>
            {["Fecha","Tipo","Proyecto","Monto","Motivo",""].map(h=>(
              <th key={h} style={{padding:"7px 10px",textAlign:"left",color:TDC.textLight,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:.5}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtSol.length===0&&<tr><td colSpan={6}><EmptyState compact icon="💸" title="Sin solicitudes registradas"/></td></tr>}
            {filtSol.map(s=>(
                <tr key={s.id} className="tdc-row" style={{borderBottom:`1px solid ${TDC.border}`,transition:"background .15s"}}>
                  <td style={{padding:"8px 10px",color:TDC.muted,fontFamily:"'Sora',sans-serif",fontSize:11}}>{s.fecha}</td>
                  <td style={{padding:"8px 10px"}}><EstadoChip tone={s.tipo==="Caja Chica"?"danger":"info"} icon="•" label={s.tipo}/></td>
                  <td style={{padding:"8px 10px"}}><ProjBadge p={s.proyecto}/></td>
                  <td style={{padding:"8px 10px",fontWeight:700,color:TDC.green,fontFamily:"'Sora',sans-serif"}}>{fmt(s.monto)}</td>
                  <td style={{padding:"8px 10px",color:TDC.textSub}}>{s.motivo}</td>
                  <td style={{padding:"8px 10px"}}><button onClick={()=>handleDeleteSolicitud(s.id)} style={{background:TDC.redLight2,border:`1px solid ${TDC.coral}`,borderRadius:8,color:TDC.red600,cursor:"pointer",padding:"3px 8px",fontSize:11}}>✕</button></td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjBadge({ p }) {
  const c = PROJ_COLORS[p]||"#455A64";
  return <span style={{background:`${c}15`,color:c,border:`1px solid ${c}30`,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap",minWidth:36,textAlign:"center",display:"inline-block"}}>{p}</span>;
}

function EmptyChart() {
  return <EmptyState compact icon="📈" title="Sin datos registrados aún"/>;
}
