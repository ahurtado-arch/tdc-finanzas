export async function scanPDF(file, tipo) {
  const isImage = file.type.startsWith("image/");
  const mediaType = isImage ? file.type : "application/pdf";

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result.split(",")[1]);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });

  const response = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64, mediaType, tipo }),
  });

  if (!response.ok) {
    const text = await response.text();
    let errMsg = "Error al analizar el comprobante.";
    try { errMsg = JSON.parse(text).error || errMsg; } catch {}
    throw new Error(errMsg);
  }

  return await response.json();
}