/**
 * Reads a PDF file and extracts invoice data using Google Gemini Flash (free).
 * The PDF binary is NOT stored anywhere — only the extracted text fields are kept.
 */
export async function scanPDF(file, tipo) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result.split(",")[1]);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });

  const prompt = `Eres un asistente experto en comprobantes de pago peruanos (facturas, boletas, tickets, recibos por honorarios).
Extrae los datos del comprobante y devuelve SOLO un JSON válido, sin texto adicional, sin markdown, sin explicaciones.

El JSON debe tener exactamente estas claves:
{
  "tipoDoc": "Factura" | "Boleta" | "Ticket" | "RPH" | "Otro",
  "comprobante": "serie-número, ej: F001-00001234",
  "emision": "fecha de emisión YYYY-MM-DD",
  "fecha": "fecha de pago YYYY-MM-DD (si no hay, usa la de emisión)",
  "proveedor": "razón social o nombre del emisor",
  "referencia": "descripción del servicio o producto, máx 80 caracteres",
  "monto": número (total a pagar, sin símbolo ni comas),
  "tipoGasto": uno de ["Cerco / Lovemark","Entrega / Movilidad","Impresiones Cerco","Impresiones Obra","Impresiones Oficina","Software / Digital","Otros"]
}

Reglas para tipoGasto:
- Taxi, movilidad, delivery, transporte → "Entrega / Movilidad"
- Adobe, Canva, Midjourney, ChatGPT, OpenAI, software, suscripción digital → "Software / Digital"
- Impresión, banner, lona, vinil, serigrafía de cerco o preventa → "Impresiones Cerco"
- Impresión, banner, lona, vinil de obra → "Impresiones Obra"
- Impresión de oficina, fotochecks, útiles → "Impresiones Oficina"
- Copa, champagne, regalo, lovemark, box, taza → "Cerco / Lovemark"
- Cualquier otro → "Otros"

Contexto: rendición de ${tipo === "CC" ? "Caja Chica de empresa inmobiliaria" : "Meta Ads / publicidad digital"}.
Si no puedes leer algún campo, usa "" para texto o 0 para monto.`;

  const API_KEY = "AIzaSyDVDDxrovZSXM8MjbSsRbX2AKfp-6r1i80";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: "application/pdf", data: base64 } },
          { text: prompt },
        ],
      }],
      generationConfig: { temperature: 0, maxOutputTokens: 800 },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error API Gemini: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error("No se pudo interpretar el PDF. Intenta con otro archivo.");
  }
}
