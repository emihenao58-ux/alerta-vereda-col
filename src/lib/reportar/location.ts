import type { ReporteUbicacion } from "@/lib/reportar/types";

export async function obtenerUbicacion(): Promise<ReporteUbicacion> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Este dispositivo no permite obtener la ubicación.");
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
          reject(new Error("El acceso a la ubicación fue denegado. Puedes continuar sin ella."));
          return;
        }
        if (error.code === error.TIMEOUT) {
          reject(new Error("La ubicación tardó demasiado. Puedes continuar sin ella."));
          return;
        }
        reject(new Error("No se pudo obtener la ubicación. Puedes continuar sin ella."));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      },
    );
  });
}
