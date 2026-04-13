import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCm4H4QNm3lxq1S1C8cS3zkN2bfkmBIVHM",
  authDomain: "cuadro-de-gastos-mensuales.firebaseapp.com",
  projectId: "cuadro-de-gastos-mensuales",
  storageBucket: "cuadro-de-gastos-mensuales.firebasestorage.app",
  messagingSenderId: "522619632703",
  appId: "1:522619632703:web:6a14913aa3b8342fa24c8a",
  measurementId: "G-DQHSVCS9V9",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── Collection refs ───────────────────────────────────────────────────────────
export const colCC        = () => collection(db, "rendicionesCC");
export const colMeta      = () => collection(db, "rendicionesMeta");
export const colSolicitudes = () => collection(db, "solicitudes");

// ── Rendicion CRUD ────────────────────────────────────────────────────────────
function cleanUndefined(obj) {
  return JSON.parse(JSON.stringify(obj, (_, v) => v === undefined ? null : v));
}

export async function saveRendicion(tipo, rendicion) {
  const col = tipo === "CC" ? "rendicionesCC" : "rendicionesMeta";
  const items = (rendicion.items || []).map(item => cleanUndefined({
    ...item,
    adjunto: null,
    adjuntoNombre: item.adjuntoNombre || "",
  }));
  await setDoc(doc(db, col, rendicion.id), cleanUndefined({ ...rendicion, items }));
}

export async function deleteRendicion(tipo, id) {
  const col = tipo === "CC" ? "rendicionesCC" : "rendicionesMeta";
  await deleteDoc(doc(db, col, id));
}

// ── Solicitud CRUD ────────────────────────────────────────────────────────────
export async function saveSolicitud(solicitud) {
  await setDoc(doc(db, "solicitudes", solicitud.id), solicitud);
}
export async function deleteSolicitud(id) {
  await deleteDoc(doc(db, "solicitudes", id));
}
