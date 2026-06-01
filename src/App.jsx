import { useState, useEffect } from "react";
import { onSnapshot } from "firebase/firestore";
import { colCC, colMeta, colMovilidad, colSolicitudes, colPresupuestos } from "./firebase.js";
import TabRendicion from "./TabRendicion.jsx";
import TabMovilidad from "./TabMovilidad.jsx";
import TabPresupuesto from "./TabPresupuesto.jsx";
import TabDashboard from "./TabDashboard.jsx";
import { TDC, FONT, RADIUS, SHADOW, GRADIENT } from "./constants.js";
import { ToastProvider } from "./ui.jsx";

export default function App() {
  const [tab, setTab]       = useState("cc");
  const [rendicionesCC,   setRendicionesCC]   = useState(null);
  const [rendicionesMeta, setRendicionesMeta] = useState(null);
  const [planillasMov,    setPlanillasMov]    = useState(null);
  const [presupuestos,    setPresupuestos]    = useState(null);
  const [solicitudes,     setSolicitudes]     = useState(null);

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
    const unsub = onSnapshot(colMovilidad(), snap => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      docs.sort((a,b) => (b.fechaCreacion||"").localeCompare(a.fechaCreacion||""));
      setPlanillasMov(docs);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(colPresupuestos(), snap => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      docs.sort((a,b) => (b.fechaCreacion||"").localeCompare(a.fechaCreacion||""));
      setPresupuestos(docs);
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

  const loading = rendicionesCC===null || rendicionesMeta===null || planillasMov===null || presupuestos===null || solicitudes===null;

  const TABS = [
    { id:"cc",   icon:"💼", label:"Caja Chica"   },
    { id:"meta", icon:"📣", label:"Meta Ads"     },
    { id:"mov",  icon:"🚕", label:"Movilidad"    },
    { id:"pres", icon:"🧾", label:"Presupuestos" },
    { id:"dash", icon:"📊", label:"Dashboard"    },
  ];
  const activeIdx = TABS.findIndex(t => t.id === tab);
  const TAB_W = 142; // ancho fijo por pestaña → posiciona la pastilla

  return (
    <ToastProvider>
    <div style={{fontFamily:FONT.sans,minHeight:"100vh",background:TDC.bg,color:TDC.ink}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{background:${TDC.bg};font-family:${FONT.sans};font-variant-numeric:tabular-nums}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:${TDC.bg}}
        ::-webkit-scrollbar-thumb{background:${TDC.border};border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:${TDC.faint}}
        input,select,textarea{font-family:${FONT.sans}!important}
        input[type=date]::-webkit-calendar-picker-indicator{filter:none;opacity:.5}

        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes toastIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}

        /* Botones */
        .tdc-btn:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.04)}
        .tdc-btn:active:not(:disabled){transform:translateY(0)}

        /* Cards con hover: elevación 2px + shadow md */
        .tdc-card-hover:hover{transform:translateY(-2px);box-shadow:${SHADOW.md}}

        /* Filas de tabla */
        .tdc-row:hover{background:${TDC.bg}!important}

        /* Skeleton shimmer */
        .tdc-skeleton{
          background:linear-gradient(90deg,${TDC.border} 25%,#F1F5F9 37%,${TDC.border} 63%);
          background-size:800px 100%;
          animation:shimmer 1.4s ease-in-out infinite;
        }

        /* Toast */
        .tdc-toast{animation:toastIn .28s cubic-bezier(.34,1.45,.5,1)}

        /* Pastilla deslizante del nav */
        .tdc-pill{
          position:absolute;top:4px;bottom:4px;width:${TAB_W}px;border-radius:${RADIUS.pill}px;
          background:${GRADIENT.glass};box-shadow:${SHADOW.redGlow};
          transition:transform .38s cubic-bezier(.34,1.45,.5,1);
          z-index:0;
        }

        /* Respetar prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce){
          *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
        }
      `}</style>

      {/* ── TopBar ── */}
      <header style={{
        background:TDC.headerBg,
        borderBottom:`1px solid ${TDC.headerBorder}`,
        display:"flex",alignItems:"center",height:64,
        padding:"0 24px",position:"sticky",top:0,zIndex:100,
        boxShadow:SHADOW.sm,
      }}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:11,marginRight:28}}>
          <div style={{
            width:38,height:38,borderRadius:RADIUS.md,
            background:GRADIENT.glass,backdropFilter:"blur(8px)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontWeight:800,fontSize:14,color:"#fff",fontFamily:FONT.sans,
            boxShadow:SHADOW.redGlow,
          }}>TDC</div>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:TDC.ink,letterSpacing:"-0.3px",lineHeight:1.2}}>Finanzas</div>
            <div style={{fontSize:9,color:TDC.faint,fontWeight:600,letterSpacing:"0.9px",textTransform:"uppercase"}}>Marketing</div>
          </div>
        </div>

        <div style={{width:1,height:26,background:TDC.border,marginRight:24}}/>

        {/* Nav con pastilla deslizante */}
        <nav style={{position:"relative",display:"flex",background:TDC.bg,borderRadius:RADIUS.pill,padding:4}}>
          <div className="tdc-pill" style={{transform:`translateX(${Math.max(activeIdx,0)*TAB_W}px)`}}/>
          {TABS.map(t => {
            const active = tab===t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                position:"relative",zIndex:1,width:TAB_W,height:40,border:"none",cursor:"pointer",
                background:"transparent",
                color: active ? "#fff" : TDC.muted,
                fontFamily:FONT.sans,
                fontWeight: active ? 700 : 600,
                fontSize:13,transition:"color .25s ease",
                display:"flex",alignItems:"center",justifyContent:"center",gap:7,
              }}>
                <span style={{fontSize:15}}>{t.icon}</span> {t.label}
              </button>
            );
          })}
        </nav>

        {/* Live indicator */}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,fontSize:11,color:TDC.faint,fontWeight:600}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:loading?TDC.amber:TDC.green,boxShadow:`0 0 0 3px ${loading?TDC.amber:TDC.green}22`,animation:loading?"pulse 1.2s ease-in-out infinite":"none"}}/>
          {loading ? "Conectando…" : "En vivo"}
        </div>
      </header>

      {/* ── Loading ── */}
      {loading ? (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"calc(100vh - 64px)",flexDirection:"column",gap:16}}>
          <div style={{width:38,height:38,border:`3px solid ${TDC.border}`,borderTop:`3px solid ${TDC.red500}`,borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/>
          <div style={{color:TDC.muted,fontSize:13}}>Cargando datos…</div>
        </div>
      ) : (
        <main style={{padding:"28px 24px",maxWidth:1440,margin:"0 auto",animation:"fadeUp .25s ease"}}>
          {tab==="cc"   && <TabRendicion tipo="CC"   rendiciones={rendicionesCC}   presupuestos={presupuestos}/>}
          {tab==="meta" && <TabRendicion tipo="META" rendiciones={rendicionesMeta} presupuestos={presupuestos}/>}
          {tab==="mov"  && <TabMovilidad planillas={planillasMov}/>}
          {tab==="pres" && <TabPresupuesto presupuestos={presupuestos} rendicionesCC={rendicionesCC} rendicionesMeta={rendicionesMeta}/>}
          {tab==="dash" && <TabDashboard rendicionesCC={rendicionesCC} rendicionesMeta={rendicionesMeta} solicitudes={solicitudes}/>}
        </main>
      )}
    </div>
    </ToastProvider>
  );
}
