export type RecorteFoto = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function cargarImagen(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo abrir la fotografía."));
    };
    image.src = url;
  });
}

export async function recortarFoto(file: File, recorte: RecorteFoto) {
  const image = await cargarImagen(file);
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;
  const x = Math.max(0, Math.min(naturalWidth - 1, Math.round(recorte.x)));
  const y = Math.max(0, Math.min(naturalHeight - 1, Math.round(recorte.y)));
  const width = Math.max(1, Math.min(naturalWidth - x, Math.round(recorte.width)));
  const height = Math.max(1, Math.min(naturalHeight - y, Math.round(recorte.height)));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const contexto = canvas.getContext("2d");

  if (!contexto) {
    throw new Error("No se pudo preparar el recorte.");
  }

  contexto.drawImage(image, x, y, width, height, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (resultado) => {
        if (resultado) resolve(resultado);
        else reject(new Error("No se pudo guardar el recorte."));
      },
      "image/jpeg",
      0.9,
    );
  });

  return new File([blob], `evidencia-recortada-${Date.now()}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
