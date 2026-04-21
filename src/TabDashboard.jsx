import { useState } from "react";
import { saveSolicitud, deleteSolicitud as fbDeleteSolicitud } from "./firebase.js";
import {
  TDC, S, PROYECTOS, TIPOS_GASTO_CC, PROJ_COLORS, TIPO_COLORS,
  fmt, fmtMonto, uid, today,
} from "./constants.js";

export default function TabDashboard({ rendicionesCC, rendicionesMeta, solicitudes }) {
  const [filterProj, setFilterProj] = useState("TODOS");
  const [showSolForm, setShowSolForm] = useState(false);
  const [solForm, setSolForm] = useState({ fecha:today(), tipo:"Caja Chica", monto:"", motivo:"", proyecto:"GENERAL" });

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
  };
  const handleDeleteSolicitud = async id => await fbDeleteSolicitud(id);

  const btnRed = {
    padding:"8px 16px",border:"none",borderRadius:9,
    background:`linear-gradient(135deg,${TDC.red},${TDC.redLight})`,
    color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer",
    boxShadow:"0 2px 8px rgba(211,47,47,0.2)",
  };

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:TDC.text,letterSpacing:"-0.5px"}}>Dashboard Global</h1>
          <p style={{fontSize:13,color:TDC.textDim,marginTop:3}}>Vista consolidada de todos los fondos y gastos</p>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {["TODOS",...PROYECTOS].map(p=>{
            const active=filterProj===p;
            const c=PROJ_COLORS[p]||TDC.red;
            return (
              <button key={p} onClick={()=>setFilterProj(p)} style={{
                padding:"5px 13px",borderRadius:20,cursor:"pointer",fontSize:11,fontWeight:700,
                fontFamily:"'DM Sans',sans-serif",transition:"all .15s",
                background:active?`${c}15`:"transparent",
                border:`1px solid ${active?c:TDC.border}`,
                color:active?c:TDC.textDim,
              }}>{p}</button>
            );
          })}
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {[
          ["Gasto Total",      ccEgreso+metaEgreso,  TDC.text,  "CC + Meta combinados"],
          ["Gasto Caja Chica", ccEgreso,              TDC.red,   `de ${fmt(ccAsignado)} asignados`],
          ["Gasto Meta Ads",   metaEgreso,            "#6A1B9A", `de ${fmt(metaAsignado)} asignados`],
          ["Solicitudes",      filtSol.length,        "#E65100", `${fmt(filtSol.reduce((a,s)=>a+Number(s.monto||0),0))} total`],
        ].map(([label,val,color,sub])=>(
          <div key={label} style={{...S.card,borderLeft:`4px solid ${color}`}}>
            <div style={S.cardLabel}>{label}</div>
            <div style={{fontSize:20,fontWeight:800,color,marginTop:6}}>{typeof val==="number"&&val>0?fmt(val):val}</div>
            <div style={{fontSize:11,color:TDC.textLight,marginTop:3}}>{sub}</div>
          </div>
        ))}
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
                <div style={{width:90,textAlign:"right",fontSize:11,color:TDC.textSub,fontFamily:"monospace"}}>{fmt(gastoProj[p])}</div>
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
                <div style={{width:80,textAlign:"right",fontSize:11,color:TDC.textSub,fontFamily:"monospace"}}>{fmt(gastoCCTipo[t])}</div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Solicitudes */}
      <div style={S.card}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <div style={{fontWeight:700,color:TDC.text,fontSize:14}}>Solicitudes de Fondos</div>
            <div style={{fontSize:12,color:TDC.textDim,marginTop:2}}>Registro de pedidos de dinero por tipo y proyecto</div>
          </div>
          <button onClick={()=>setShowSolForm(v=>!v)} style={btnRed}>+ Nueva Solicitud</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
          {[
            ["Total solicitado", fmt(filtSol.reduce((a,s)=>a+Number(s.monto||0),0)), TDC.text],
            ["Solicitudes CC",   filtSol.filter(s=>s.tipo==="Caja Chica").length+" veces", TDC.red],
            ["Solicitudes Meta", filtSol.filter(s=>s.tipo==="Meta").length+" veces", "#6A1B9A"],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:TDC.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${TDC.border}`}}>
              <div style={{fontSize:10,color:TDC.textLight,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
              <div style={{fontSize:16,fontWeight:800,color:c,marginTop:5}}>{v}</div>
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
              <button onClick={addSolicitud} style={btnRed}>Guardar</button>
              <button onClick={()=>setShowSolForm(false)} style={{padding:"8px 16px",border:`1px solid ${TDC.border}`,borderRadius:9,background:"transparent",color:TDC.textDim,fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,cursor:"pointer"}}>Cancelar</button>
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
            {filtSol.length===0&&<tr><td colSpan={6} style={{padding:24,textAlign:"center",color:TDC.textLight,fontStyle:"italic",fontSize:13}}>Sin solicitudes registradas.</td></tr>}
            {filtSol.map(s=>{
              const tc=s.tipo==="Caja Chica"?TDC.red:"#6A1B9A";
              return (
                <tr key={s.id} className="tdc-row" style={{borderBottom:`1px solid ${TDC.border}`,transition:"background .15s"}}>
                  <td style={{padding:"8px 10px",color:TDC.textDim,fontFamily:"monospace",fontSize:11}}>{s.fecha}</td>
                  <td style={{padding:"8px 10px"}}><span style={{background:`${tc}15`,color:tc,border:`1px solid ${tc}30`,padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:700}}>{s.tipo}</span></td>
                  <td style={{padding:"8px 10px"}}><ProjBadge p={s.proyecto}/></td>
                  <td style={{padding:"8px 10px",fontWeight:700,color:TDC.green,fontFamily:"monospace"}}>{fmt(s.monto)}</td>
                  <td style={{padding:"8px 10px",color:TDC.textSub}}>{s.motivo}</td>
                  <td style={{padding:"8px 10px"}}><button onClick={()=>handleDeleteSolicitud(s.id)} style={{background:TDC.redLight2,border:`1px solid ${TDC.redLight}`,borderRadius:5,color:TDC.red,cursor:"pointer",padding:"3px 8px",fontSize:11}}>✕</button></td>
                </tr>
              );
            })}
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
  return <div style={{padding:"20px 0",textAlign:"center",color:TDC.textLight,fontSize:12,fontStyle:"italic"}}>Sin datos registrados aún.</div>;
}
