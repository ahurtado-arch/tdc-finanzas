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
    { id:"cc",   label:"Caja Chica"   },
    { id:"meta", label:"Meta Ads"     },
    { id:"mov",  label:"Movilidad"    },
    { id:"pres", label:"Presupuestos" },
    { id:"dash", label:"Dashboard"    },
  ];

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

        /* Botones del nav (estilo SIO: pastilla por ítem) */
        .tdc-navbtn{
          display:flex;align-items:center;gap:8px;
          padding:9px 16px;border:none;border-radius:${RADIUS.pill}px;
          background:transparent;color:${TDC.muted};cursor:pointer;
          font-family:${FONT.sans};font-weight:600;font-size:13px;
          transition:background .2s ease,color .2s ease,box-shadow .2s ease;
          white-space:nowrap;
        }
        .tdc-navbtn:not(.is-active):hover{background:${TDC.bg};color:${TDC.ink}}
        .tdc-navbtn.is-active{
          background:${GRADIENT.glass};color:#fff;font-weight:700;
          box-shadow:${SHADOW.redGlow};
        }
        .tdc-navbtn svg{width:17px;height:17px;flex:none}

        /* Respetar prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce){
          *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
        }
      `}</style>

      {/* ── TopBar ── */}
      <header style={{
        background:TDC.headerBg,
        borderBottom:`1px solid ${TDC.headerBorder}`,
        display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",height:64,
        padding:"0 24px",position:"sticky",top:0,zIndex:100,
        boxShadow:SHADOW.sm,
      }}>
        {/* Logo (izquierda) */}
        <div style={{display:"flex",alignItems:"center",gap:11,justifySelf:"start"}}>
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

        {/* Nav (centro) — pastilla por ítem, iconos de línea */}
        <nav style={{justifySelf:"center",display:"flex",alignItems:"center",gap:4}}>
          {TABS.map(t => {
            const active = tab===t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`tdc-navbtn${active?" is-active":""}`}>
                <NavIcon id={t.id}/> {t.label}
              </button>
            );
          })}
        </nav>

        {/* Live indicator (derecha) */}
        <div style={{justifySelf:"end",display:"flex",alignItems:"center",gap:6,fontSize:11,color:TDC.faint,fontWeight:600}}>
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

// ── Iconos de línea minimalistas para el nav (heredan color vía currentColor) ──
function NavIcon({ id }) {
  const p = { fill:"none", stroke:"currentColor", strokeWidth:1.8, strokeLinecap:"round", strokeLinejoin:"round" };
  const svg = c => <svg viewBox="0 0 24 24" aria-hidden="true">{c}</svg>;
  switch (id) {
    case "cc": // Caja Chica → billetera
      return svg(<>
        <rect {...p} x="2.5" y="6" width="19" height="13" rx="2.5"/>
        <path {...p} d="M2.5 10h19"/>
        <circle {...p} cx="17.5" cy="14.5" r="1.2"/>
      </>);
    case "meta": // Meta Ads → megáfono
      return svg(<>
        <path {...p} d="M4 9.5v4a1 1 0 0 0 1 1h2l6 3.5v-13L7 8.5H5a1 1 0 0 0-1 1z"/>
        <path {...p} d="M17 8.5a4 4 0 0 1 0 7"/>
      </>);
    case "mov": // Movilidad → auto
      return svg(<>
        <path {...p} d="M5 16v-5l2-3.2A1.5 1.5 0 0 1 8.3 7h7.4a1.5 1.5 0 0 1 1.3.8L19 11v5"/>
        <path {...p} d="M3.5 16h17"/>
        <circle {...p} cx="7.5" cy="16.5" r="1.6"/>
        <circle {...p} cx="16.5" cy="16.5" r="1.6"/>
      </>);
    case "pres": // Presupuestos → documento
      return svg(<>
        <path {...p} d="M6.5 3.5h7l4 4V20a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/>
        <path {...p} d="M13.5 3.5v4h4"/>
        <path {...p} d="M9 12.5h6M9 16h4"/>
      </>);
    case "dash": // Dashboard → barras
      return svg(<>
        <rect {...p} x="3.5" y="12" width="4" height="8" rx="1"/>
        <rect {...p} x="10" y="8" width="4" height="12" rx="1"/>
        <rect {...p} x="16.5" y="4" width="4" height="16" rx="1"/>
      </>);
    default:
      return null;
  }
}
