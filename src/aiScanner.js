export async function scanPDF(file, tipo) {
  const isImage = file.type.startsWith("image/");
  const mediaType = isImage ? file.type : "application/pdf";

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result.split(",")[1]);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });

  const systemPrompt = `Eres un asistente experto en comprobantes de pago peruanos (facturas, boletas, tickets, recibos por honorarios).
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
  "tipoGasto": uno de ["Cerco","Lovemark","Entrega","Movilidad","Impresiones Cerco","Impresiones Obra","Impresiones Oficina","Software / Digital","Otros"]
}

Reglas para tipoGasto:
- Taxi, movilidad, delivery, transporte → "Movilidad"
- Delivery de productos, envíos → "Entrega"
- Adobe, Canva, Midjourney, ChatGPT, OpenAI, software, suscripción digital → "Software / Digital"
- Impresión, banner, lona, vinil de cerco o preventa → "Impresiones Cerco"
- Impresión, banner, lona, vinil de obra → "Impresiones Obra"
- Impresión de oficina, fotochecks, útiles → "Impresiones Oficina"
- Copa, champagne, regalo, box, taza, flores → "Lovemark"
- Cerco, valla, malla → "Cerco"
- Cualquier otro → "Otros"

Si no puedes leer algún campo usa "" para texto o 0 para monto.`;

  const contentPart = isImage
    ? { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }
    : { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "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",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-allow-browser": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: [
          contentPart,
          { type: "text", text: `Extrae los datos de este comprobante peruano. Contexto: rendición de ${tipo === "CC" ? "Caja Chica de empresa inmobiliaria" : "Meta Ads / publicidad digital"}.` },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error API: ${err}`);
  }

  const data = await response.json();
  const text = (data.content || []).map(c => c.text || "").join("").trim();
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error("No se pudo interpretar el comprobante. Intenta de nuevo.");
  }
}