# TDC Finanzas — Guía de instalación

## Requisitos
- Node.js 18+ instalado → https://nodejs.org
- Cuenta en Netlify (gratis) → https://netlify.com
- Firebase Firestore activado en modo test

---

## Paso 1 — Instalar dependencias

Abre la terminal, entra a la carpeta del proyecto y ejecuta:

```bash
npm install
```

---

## Paso 2 — Probar en local (opcional)

```bash
npm run dev
```

Abre http://localhost:5173 en tu navegador.

---

## Paso 3 — Construir para producción

```bash
npm run build
```

Esto genera la carpeta `dist/` con la app lista para subir.

---

## Paso 4 — Subir a Netlify

### Opción A — Arrastrar carpeta (más fácil)
1. Ve a https://app.netlify.com
2. Inicia sesión
3. En el dashboard, busca el recuadro que dice **"drag and drop your site folder here"**
4. Arrastra la carpeta `dist/` ahí
5. ¡Listo! Netlify te dará una URL como `https://nombre-random.netlify.app`

### Opción B — Con Git (recomendado para actualizaciones)
1. Sube la carpeta `tdc-finanzas/` a un repo en GitHub
2. En Netlify → Add new site → Import from Git
3. Conecta el repo
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Deploy site

---

## Paso 5 — Firestore: activar reglas

En Firebase Console → Firestore → Rules, pega esto para que todos puedan leer/escribir:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ Esto es modo abierto. Cuando quieras agregar login, avísame y lo configuramos con Firebase Auth.

---

## Estructura de archivos

```
tdc-finanzas/
├── src/
│   ├── main.jsx          ← Entrada de React
│   ├── App.jsx           ← Layout principal + listeners Firebase
│   ├── firebase.js       ← Config Firebase + funciones CRUD
│   ├── constants.js      ← Colores, proyectos, helpers
│   ├── aiScanner.js      ← Lectura PDF con Claude AI
│   ├── exporter.js       ← Exportar a Excel (.xlsx)
│   ├── TabRendicion.jsx  ← Pestaña Caja Chica / Meta Ads
│   ├── TabDashboard.jsx  ← Dashboard global
│   └── ItemModal.jsx     ← Modal de registro con escaneo PDF
├── index.html
├── vite.config.js
├── netlify.toml
└── package.json
```

---

## ¿Cómo funciona el escaneo de PDF?

1. Haz clic en **+ Agregar registro** en cualquier rendición
2. En el modal, haz clic en **📄 Subir PDF**
3. Selecciona la factura/boleta en PDF
4. La IA (Claude) extrae: tipo de doc, número, fechas, proveedor, monto y tipo de gasto
5. El formulario se llena automáticamente — revisa y corrige si hace falta
6. Haz clic en **✓ Confirmar y Guardar**

El PDF **no se guarda** en ningún lado — solo se extraen los datos de texto.
