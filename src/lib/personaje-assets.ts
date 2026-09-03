export type PersonajePose =
  "reposo" | "saludo" | "izquierda" | "derecha" | "arriba" | "abajo" | "escuchar" | "celebrar";

/**
 * Assets aprobados del acompañante visual de AlertaVereda.
 * Se mantienen como imágenes completas, con el mismo lienzo y transparencia.
 */
export const PERSONAJE_POSES: Record<PersonajePose, string> = {
  reposo: "/images/mi-vereda/personaje-reposo.webp",
  saludo: "/images/mi-vereda/personaje-saludo.webp",
  izquierda: "/images/mi-vereda/personaje-izquierda.webp",
  derecha: "/images/mi-vereda/personaje-derecha.webp",
  arriba: "/images/mi-vereda/personaje-arriba.webp",
  abajo: "/images/mi-vereda/personaje-abajo.webp",
  escuchar: "/images/mi-vereda/personaje-escuchar.webp",
  celebrar: "/images/mi-vereda/personaje-celebrar.webp",
};
