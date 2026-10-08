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

export async function recortarFoto(file: File, porcentaje: number) {
  const image = await cargarImagen(file);
  const ladoOriginal = Math.min(image.naturalWidth, image.naturalHeight);
  const lado = Math.max(1, Math.round(ladoOriginal * Math.min(1, Math.max(0.45, porcentaje))));
  const x = Math.round((image.naturalWidth - lado) / 2);
  const y = Math.round((image.naturalHeight - lado) / 2);
  const canvas = document.createElement("canvas");
  canvas.width = lado;
  canvas.height = lado;
  const contexto = canvas.getContext("2d");

  if (!contexto) {
    throw new Error("No se pudo preparar el recorte.");
  }

  contexto.drawImage(image, x, y, lado, lado, 0, 0, lado, lado);
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
