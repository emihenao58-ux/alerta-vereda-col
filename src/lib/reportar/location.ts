import type { ReporteUbicacion } from "@/lib/reportar/types";

export type CodigoErrorUbicacion = "denegado" | "tiempo-agotado" | "no-disponible";

export class ErrorUbicacion extends Error {
  constructor(
    message: string,
    readonly codigo: CodigoErrorUbicacion,
  ) {
    super(message);
    this.name = "ErrorUbicacion";
  }
}

export async function obtenerUbicacion(): Promise<ReporteUbicacion> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new ErrorUbicacion("Este dispositivo no permite obtener la ubicación.", "no-disponible");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        resolve({
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
          precision: posicion.coords.accuracy,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(
            new ErrorUbicacion(
              "El acceso a la ubicación fue denegado. Puedes continuar sin ella.",
              "denegado",
            ),
          );
          return;
        }
        if (error.code === error.TIMEOUT) {
          reject(
            new ErrorUbicacion(
              "La ubicación tardó demasiado. Puedes continuar sin ella.",
              "tiempo-agotado",
            ),
          );
          return;
        }
        reject(
          new ErrorUbicacion(
            "No se pudo obtener la ubicación. Puedes continuar sin ella.",
            "no-disponible",
          ),
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      },
    );
  });
}
