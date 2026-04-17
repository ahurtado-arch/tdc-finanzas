export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { base64, mediaType, tipo } = req.body;

    if (!base64 || !mediaType) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    const systemPrompt = `Eres un asistente experto en comprobantes de pago peruanos.
Extrae los datos y devuelve SOLO un JSON válido sin texto adicional ni markdown.
Claves requeridas:
{
  "tipoDoc": "Factura"|"Boleta"|"Ticket"|"RPH"|"Otro",
  "comprobante": "serie-número",
  "emision": "YYYY-MM-DD",
  "fecha": "YYYY-MM-DD",
  "proveedor": "nombre o razón social",
  "referencia": "descripción máx 80 chars",
  "monto": número,
  "tipoGasto": "Cerco"|"Lovemark"|"Entrega"|"Movilidad"|"Impresiones Cerco"|"Impresiones Obra"|"Impresiones Oficina"|"Software / Digital"|"Otros"
}`;

    const contentPart = mediaType.startsWith("image/")
      ? { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }
      : { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } };

    const apiKey = process.env.ANTHROPIC_API_KEY || "";
    console.log("KEY EXISTS:", !!process.env.ANTHROPIC_API_KEY);
    console.log("KEY LENGTH:", (process.env.ANTHROPIC_API_KEY || "").length);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 800,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: [
            contentPart,
            { type: "text", text: `Comprobante de ${tipo === "CC" ? "Caja Chica" : "Meta Ads"}.` },
          ],
        }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: JSON.stringify(data) });
    }

    const text = (data.content || []).map(c => c.text || "").join("").trim();
    const clean = text.replace(/```json|```/g, "").trim();

    return res.status(200).json(JSON.parse(clean));

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}