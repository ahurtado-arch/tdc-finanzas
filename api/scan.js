export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("API KEY:", process.env.ANTHROPIC_API_KEY ? "existe" : "no existe");

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
- Adobe, Canva, Midjourney, ChatGPT, OpenAI, software → "Software / Digital"
- Impresión, banner, lona, vinil de cerco o preventa → "Impresiones Cerco"
- Impresión, banner, lona, vinil de obra → "Impresiones Obra"
- Impresión de oficina, fotochecks, útiles → "Impresiones Oficina"
- Copa, champagne, regalo, box, taza, flores → "Lovemark"
- Cerco, valla, malla → "Cerco"
- Cualquier otro → "Otros"

Si no puedes leer algún campo usa "" para texto o 0 para monto.`;

  const contentPart = mediaType.startsWith("image/")
    ? { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }
    : { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
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
    return res.status(500).json({ error: err });
  }

  const data = await response.json();
  const text = (data.content || []).map(c => c.text || "").join("").trim();
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    return res.status(200).json(JSON.parse(clean));
  } catch {
    return res.status(500).json({ error: "No se pudo interpretar el comprobante." });
  }
}