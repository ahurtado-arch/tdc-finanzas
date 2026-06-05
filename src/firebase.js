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
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

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
export const storage = getStorage(app);
// Que un fallo (p. ej. Storage sin habilitar) se reporte en ~20s en vez de 2 min
storage.maxUploadRetryTime = 20000;
storage.maxOperationRetryTime = 20000;

// ── Recibos de Movilidad (archivos en Firebase Storage) ───────────────────────
// Sube el recibo (PDF/imagen) de un viaje y devuelve su URL para abrirlo luego.
export async function uploadReciboMov(file, itemId) {
  const safe = (file.name || "recibo").replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `recibosMovilidad/${itemId}/${safe}`;
  const r = storageRef(storage, path);
  await uploadBytes(r, file, { contentType: file.type || "application/octet-stream" });
  const url = await getDownloadURL(r);
  return { url, nombre: file.name || safe, path };
}

export async function deleteReciboMov(path) {
  if (!path) return;
  try { await deleteObject(storageRef(storage, path)); } catch { /* archivo ya no existe */ }
}

// ── Collection refs ───────────────────────────────────────────────────────────
export const colCC        = () => collection(db, "rendicionesCC");
export const colMeta      = () => collection(db, "rendicionesMeta");
export const colMovilidad = () => collection(db, "planillasMovilidad");
export const colSolicitudes = () => collection(db, "solicitudes");
export const colPresupuestos = () => collection(db, "presupuestos");

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

// ── Movilidad CRUD ──────────────────────────────────────────────────────────
export async function saveMovilidad(planilla) {
  const items = (planilla.items || []).map(item => cleanUndefined({ ...item }));
  await setDoc(doc(db, "planillasMovilidad", planilla.id), cleanUndefined({ ...planilla, items }));
}
export async function deleteMovilidad(id) {
  await deleteDoc(doc(db, "planillasMovilidad", id));
}

// ── Presupuesto CRUD ──────────────────────────────────────────────────────────
export async function savePresupuesto(presupuesto) {
  const bloques = (presupuesto.bloques || []).map(b => cleanUndefined({
    ...b,
    items: (b.items || []).map(item => cleanUndefined({ ...item })),
  }));
  await setDoc(doc(db, "presupuestos", presupuesto.id), cleanUndefined({ ...presupuesto, bloques }));
}
export async function deletePresupuesto(id) {
  await deleteDoc(doc(db, "presupuestos", id));
}

// ── Solicitud CRUD ────────────────────────────────────────────────────────────
export async function saveSolicitud(solicitud) {
  await setDoc(doc(db, "solicitudes", solicitud.id), solicitud);
}
export async function deleteSolicitud(id) {
  await deleteDoc(doc(db, "solicitudes", id));
}
