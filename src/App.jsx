import { useState, useEffect } from "react";
import { onSnapshot } from "firebase/firestore";
import { colCC, colMeta, colSolicitudes } from "./firebase.js";
import TabRendicion from "./TabRendicion.jsx";
import TabDashboard from "./TabDashboard.jsx";
import { TDC } from "./constants.js";

export default function App() {
  const [tab, setTab] = useState("cc");
  const [rendicionesCC,   setRendicionesCC]   = useState(null);
  const [rendicionesMeta, setRendicionesMeta] = useState(null);
  const [solicitudes,     setSolicitudes]     = useState(null);

  // ── Realtime listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(colCC(), snap => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      docs.sort((a,b) => (b.fechaCreacion||"").localeCompare(a.fechaCreacion||""));
      setRendicionesCC(docs);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(colMeta(), snap => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      docs.sort((a,b) => (b.fechaCreacion||"").localeCompare(a.fechaCreacion||""));
      setRendicionesMeta(docs);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(colSolicitudes(), snap => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      docs.sort((a,b) => (b.fecha||"").localeCompare(a.fecha||""));
      setSolicitudes(docs);
    });
    return unsub;
  }, []);

  const loading = rendicionesCC===null || rendicionesMeta===null || solicitudes===null;

  const TABS = [
    { id:"cc",   icon:"💼", label:"Caja Chica" },
    { id:"meta", icon:"📣", label:"Meta Ads"   },
    { id:"dash", icon:"📊", label:"Dashboard"  },
  ];

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",minHeight:"100vh",background:TDC.navy,color:TDC.text}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${TDC.navy}}
        ::-webkit-scrollbar-thumb{background:${TDC.navyBorder};border-radius:3px}
        input,select,textarea{font-family:'DM Sans',sans-serif!important}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.5)}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>

      {/* ── Header ── */}
      <header style={{
        background:TDC.navyMid,
        borderBottom:`1px solid ${TDC.navyBorder}`,
        display:"flex",alignItems:"center",height:58,
        padding:"0 0 0 20px",position:"sticky",top:0,zIndex:100,
        boxShadow:"0 2px 20px rgba(0,0,0,0.3)",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginRight:28}}>
          <div style={{
            width:34,height:34,borderRadius:8,
            background:"linear-gradient(135deg,#D32F2F 0%,#EF5350 60%,#FF7043 100%)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontWeight:800,fontSize:14,color:"#fff",
            boxShadow:"0 2px 12px rgba(211,47,47,0.4)",
          }}>TDC</div>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:TDC.white,lineHeight:1.2}}>Finanzas</div>
            <div style={{fontSize:9,color:TDC.grayDim,fontWeight:500,letterSpacing:"0.5px",textTransform:"uppercase"}}>Marketing</div>
          </div>
        </div>

        <div style={{width:1,height:24,background:TDC.navyBorder,marginRight:20}}/>

        <nav style={{display:"flex",height:"100%"}}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              height:"100%",padding:"0 20px",border:"none",cursor:"pointer",
              background:"transparent",
              color: tab===t.id ? TDC.white : TDC.grayDim,
              fontFamily:"'DM Sans',sans-serif",
              fontWeight: tab===t.id ? 700 : 500,
              fontSize:13,transition:"all .2s",
              borderBottom: tab===t.id ? `2px solid ${TDC.red}` : "2px solid transparent",
              display:"flex",alignItems:"center",gap:7,
            }}>
              <span style={{fontSize:15}}>{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>

        {/* Live indicator */}
        <div style={{marginLeft:"auto",marginRight:18,display:"flex",alignItems:"center",gap:6,fontSize:11,color:TDC.grayDim}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:loading?"#F4A825":TDC.green,animation:loading?"pulse 1.2s ease-in-out infinite":"none"}}/>
          {loading ? "Conectando…" : "En vivo"}
        </div>
      </header>

      {/* ── Loading state ── */}
      {loading ? (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"calc(100vh - 58px)",flexDirection:"column",gap:16}}>
          <div style={{width:36,height:36,border:`3px solid ${TDC.navyBorder}`,borderTop:`3px solid ${TDC.red}`,borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/>
          <div style={{color:TDC.grayDim,fontSize:13}}>Cargando datos…</div>
        </div>
      ) : (
        <main style={{padding:"28px 24px",maxWidth:1440,margin:"0 auto",animation:"fadeUp .25s ease"}}>
          {tab==="cc"   && <TabRendicion tipo="CC"   rendiciones={rendicionesCC}/>}
          {tab==="meta" && <TabRendicion tipo="META" rendiciones={rendicionesMeta}/>}
          {tab==="dash" && <TabDashboard rendicionesCC={rendicionesCC} rendicionesMeta={rendicionesMeta} solicitudes={solicitudes}/>}
        </main>
      )}
    </div>
  );
}
