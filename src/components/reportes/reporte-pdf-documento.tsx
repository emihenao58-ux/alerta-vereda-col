import { Document, Image, Page, Path, Svg, StyleSheet, Text, View } from "@react-pdf/renderer";
import type {
  DatosReportePdfPreparados,
  EvidenciaReportePdfPreparada,
} from "@/lib/reportes-pdf-datos";
import { tieneUbicacionReportePdf } from "@/lib/reportes-pdf-datos";

const colores = {
  bosque: "#07543f",
  bosqueOscuro: "#174735",
  verde: "#82bd3f",
  dorado: "#f5ca4c",
  tinta: "#18221d",
  textoSuave: "#56645c",
  blanco: "#ffffff",
  marcoFoto: "#f3f5f3",
  bannerAmpliacion: "#eff6e0",
};

const ANCHO_PLANTILLA = 1055;
const ALTO_PLANTILLA = 1491;
const ANCHO_A4 = 595.28;
const ALTO_A4 = 841.89;
const ESCALA_PLANTILLA = Math.min(ANCHO_A4 / ANCHO_PLANTILLA, ALTO_A4 / ALTO_PLANTILLA);
const ALTO_PLANTILLA_PUNTOS = ALTO_PLANTILLA * ESCALA_PLANTILLA;
const DESPLAZAMIENTO_VERTICAL = (ALTO_A4 - ALTO_PLANTILLA_PUNTOS) / 2;
const LIMITE_DESCRIPCION_PORTADA = 320;
const LIMITE_TEXTO_PORTADA_CON_NOTA = 160;
const PANEL_GENERACION = { x: 38, y: 1178, ancho: 704, alto: 88 };
const PANEL_VIDEO = { x: 38, y: 1024, ancho: 981, alto: 135 };
const VIDEO_SOLO_Y = 775;

type Zona = {
  position: "absolute";
  left: number;
  top: number;
  width: number;
  height: number;
};

function zona(x: number, y: number, ancho: number, alto: number): Zona {
  return {
    position: "absolute",
    left: x * ESCALA_PLANTILLA,
    top: DESPLAZAMIENTO_VERTICAL + y * ESCALA_PLANTILLA,
    width: ancho * ESCALA_PLANTILLA,
    height: alto * ESCALA_PLANTILLA,
  };
}

function RecorteDePlantilla({
  src,
  origenX,
  origenY,
  ancho,
  alto,
  destinoY,
}: {
  src: string;
  origenX: number;
  origenY: number;
  ancho: number;
  alto: number;
  destinoY: number;
}) {
  return (
    <View style={[zona(origenX, destinoY, ancho, alto), { overflow: "hidden" }]}>
      <Image
        src={src}
        style={{
          position: "absolute",
          left: -origenX * ESCALA_PLANTILLA,
          top: -origenY * ESCALA_PLANTILLA,
          width: ANCHO_A4,
          height: ALTO_PLANTILLA_PUNTOS,
          objectFit: "contain",
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pagina: {
    position: "relative",
    width: ANCHO_A4,
    height: ALTO_A4,
    padding: 0,
    backgroundColor: colores.blanco,
    color: colores.tinta,
    fontFamily: "Helvetica",
  },
  fondoPlantilla: {
    position: "absolute",
    left: 0,
    top: DESPLAZAMIENTO_VERTICAL,
    width: ANCHO_A4,
    height: ALTO_PLANTILLA_PUNTOS,
    objectFit: "contain",
  },
  tituloPrincipal: {
    color: colores.tinta,
    fontSize: 25,
    fontWeight: 700,
    lineHeight: 1.08,
  },
  subtituloPrincipal: {
    color: colores.bosqueOscuro,
    fontSize: 15,
    fontStyle: "italic",
  },
  resumenEtiqueta: {
    color: colores.bosqueOscuro,
    fontSize: 8.5,
    fontWeight: 700,
  },
  resumenValor: {
    color: colores.tinta,
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.12,
  },
  estadoPill: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
  },
  estadoRevision: {
    backgroundColor: "#f8c94b",
    color: "#392b08",
  },
  estadoNormal: {
    backgroundColor: "#dcefd4",
    color: colores.bosqueOscuro,
  },
  datoEtiqueta: {
    color: colores.bosqueOscuro,
    fontSize: 10.5,
    lineHeight: 1.05,
    fontWeight: 700,
  },
  datoValor: {
    color: colores.tinta,
    fontSize: 12,
    lineHeight: 1.18,
  },
  tituloUbicacion: {
    color: colores.tinta,
    fontSize: 14,
    lineHeight: 1.05,
    fontWeight: 700,
  },
  ubicacionTexto: {
    color: colores.tinta,
    fontSize: 11,
    lineHeight: 1.2,
  },
  coordenadas: {
    color: colores.tinta,
    fontSize: 9,
    lineHeight: 1.2,
  },
  tituloSeccion: {
    color: colores.bosqueOscuro,
    fontSize: 14,
    lineHeight: 1.05,
    fontWeight: 700,
  },
  textoDescripcion: {
    color: colores.tinta,
    fontSize: 10,
    lineHeight: 1.3,
    whiteSpace: "pre-wrap",
  },
  notaOrigen: {
    color: colores.textoSuave,
    fontSize: 8.5,
    lineHeight: 1.18,
    whiteSpace: "pre-wrap",
  },
  datoPieEtiqueta: {
    color: colores.tinta,
    fontSize: 8,
    fontWeight: 700,
  },
  datoPieValor: {
    color: colores.tinta,
    fontSize: 7.5,
    lineHeight: 1.15,
  },
  etiquetaVideo: {
    color: colores.bosqueOscuro,
    fontSize: 12,
    lineHeight: 1.05,
    fontWeight: 700,
  },
  detalleVideo: {
    color: colores.tinta,
    fontSize: 9.5,
    lineHeight: 1.2,
  },
  mascaraBlanca: {
    backgroundColor: colores.blanco,
  },
  miniaturaViewport: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colores.marcoFoto,
  },
  miniaturaViewportCompacta: {
    borderRadius: 8,
  },
  miniaturaImagen: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  miniaturaSinVista: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colores.marcoFoto,
    padding: 12,
  },
  miniaturaSinVistaTexto: {
    color: colores.textoSuave,
    fontSize: 8,
    textAlign: "center",
  },
  videoViewport: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colores.marcoFoto,
  },
  videoImagen: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  iconoReproducir: {
    width: 50,
    height: 50,
  },
  marcoAmpliacion: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colores.marcoFoto,
  },
  imagenAmpliacion: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  alternativaAmpliacion: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colores.marcoFoto,
    paddingHorizontal: 40,
    textAlign: "center",
  },
  alternativaTitulo: {
    color: colores.bosqueOscuro,
    fontSize: 16,
    fontWeight: 700,
    textAlign: "center",
  },
  alternativaDetalle: {
    marginTop: 9,
    color: colores.textoSuave,
    fontSize: 10,
    lineHeight: 1.35,
    textAlign: "center",
  },
  kickerAmpliacion: {
    color: colores.bosque,
    fontSize: 11,
    lineHeight: 1.05,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  tituloAmpliacion: {
    marginTop: 3,
    color: colores.bosqueOscuro,
    fontSize: 13.5,
    lineHeight: 1.05,
    fontWeight: 700,
  },
  detalleFalloEvidencia: {
    color: colores.bosqueOscuro,
    fontSize: 8.5,
    lineHeight: 1.25,
  },
  continuacion: {
    paddingTop: 55,
    paddingRight: 56,
    paddingBottom: 52,
    paddingLeft: 56,
    backgroundColor: colores.blanco,
    color: colores.tinta,
    fontFamily: "Helvetica",
  },
  continuacionMarca: {
    color: colores.bosqueOscuro,
    fontSize: 21,
    fontWeight: 700,
  },
  continuacionLema: {
    marginTop: 4,
    color: colores.textoSuave,
    fontSize: 11,
    fontStyle: "italic",
  },
  continuacionLinea: {
    height: 1,
    marginTop: 16,
    backgroundColor: colores.verde,
  },
  continuacionTitulo: {
    marginTop: 26,
    color: colores.bosqueOscuro,
    fontSize: 14,
    fontWeight: 700,
  },
  continuacionTexto: {
    marginTop: 12,
    color: colores.tinta,
    fontSize: 11,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  continuacionPie: {
    position: "absolute",
    right: 56,
    bottom: 24,
    left: 56,
    borderTopWidth: 1,
    borderTopColor: "#dce7d8",
    paddingTop: 8,
    color: colores.textoSuave,
    fontSize: 8,
  },
});

type Props = { datos: DatosReportePdfPreparados };

type NarrativaPdf = {
  tituloSeccion: string;
  textoPortada: string | null;
  textoContinuacion: string | null;
  tituloContinuacion: string;
};

export function ReportePdfDocumento({ datos }: Props) {
  const fotografias = datos.evidencias.filter((evidencia) => evidencia.tipo === "foto");
  const videos = datos.evidencias.filter((evidencia) => evidencia.tipo === "video");
  const narrativa = prepararNarrativa(datos);

  if (fotografias.length > 0 && !datos.plantillaAmpliacionDataUri) {
    throw new Error("No está disponible la plantilla de ampliación fotográfica.");
  }

  return (
    <Document
      title="Reporte Comunitario · AlertaVereda"
      author="AlertaVereda"
      subject={datos.titulo}
      language="es-CO"
    >
      <PaginaPrincipal
        datos={datos}
        fotografias={fotografias}
        videos={videos}
        narrativa={narrativa}
      />
      {narrativa.textoContinuacion && (
        <PaginaContinuacion
          texto={narrativa.textoContinuacion}
          titulo={narrativa.tituloContinuacion}
        />
      )}
      {fotografias.map((evidencia, index) => (
        <PaginaAmpliacion
          key={evidencia.id}
          evidencia={evidencia}
          numero={index + 1}
          total={fotografias.length}
          plantilla={datos.plantillaAmpliacionDataUri!}
        />
      ))}
    </Document>
  );
}

function PaginaPrincipal({
  datos,
  fotografias,
  videos,
  narrativa,
}: {
  datos: DatosReportePdfPreparados;
  fotografias: EvidenciaReportePdfPreparada[];
  videos: EvidenciaReportePdfPreparada[];
  narrativa: NarrativaPdf;
}) {
  const ubicacionDisponible = tieneUbicacionReportePdf(datos);
  const autorDisponible = Boolean(datos.autor?.trim());
  const resumenFotos = fotografias.slice(0, 3);
  const primerVideo = videos[0];
  const videoSolo = fotografias.length === 0 && Boolean(primerVideo);
  const desplazamientoVideoY = videoSolo
    ? VIDEO_SOLO_Y - PANEL_VIDEO.y
    : fotografias.length >= 3
      ? -12
      : 0;
  const destinoGeneracionY =
    fotografias.length === 0 ? (primerVideo ? 928 : 806) : primerVideo ? PANEL_GENERACION.y : 1020;
  const desplazamientoGeneracionY = destinoGeneracionY - PANEL_GENERACION.y;
  const estado = datos.estado.trim();
  const estadoEsRevision = estado.toLocaleLowerCase("es-CO").includes("revisión");
  const fechaGeneracionPie = datos.generadoEn.replace(/\s+a las\s+/i, "\n");
  const origenRegistroPie =
    datos.origenRegistro === "local"
      ? "Este dispositivo ·\nalmacenamiento local"
      : "Consulta pública de\nAlertaVereda";

  return (
    <Page size="A4" style={estilos.pagina}>
      <FondoPlantilla src={datos.plantillaPrincipalDataUri} />

      <Text style={[estilos.tituloPrincipal, zona(336, 52, 546, 48)]}>Reporte Comunitario</Text>
      <Text style={[estilos.subtituloPrincipal, zona(338, 110, 500, 34)]}>
        Información que nos cuida
      </Text>

      <Text style={[estilos.resumenEtiqueta, zona(70, 246, 260, 18)]}>Categoría</Text>
      <Text style={[estilos.resumenValor, zona(70, 268, 260, 36)]}>
        {datos.categoria || "No disponible"}
      </Text>
      <Text style={[estilos.resumenEtiqueta, zona(382, 246, 286, 18)]}>Tipo</Text>
      <Text style={[estilos.resumenValor, zona(382, 268, 286, 36)]}>
        {datos.tipo?.trim() || "No disponible"}
      </Text>
      {estado ? (
        <>
          <Text style={[estilos.resumenEtiqueta, zona(727, 246, 230, 18)]}>Estado</Text>
          <Text
            style={[
              estilos.estadoPill,
              estadoEsRevision ? estilos.estadoRevision : estilos.estadoNormal,
              zona(795, 266, 190, 39),
            ]}
          >
            {estado}
          </Text>
        </>
      ) : (
        <View style={[estilos.mascaraBlanca, zona(710, 227, 305, 86)]} />
      )}

      <Text style={[estilos.datoEtiqueta, zona(142, 359, 333, 22)]}>Fecha del reporte</Text>
      <Text style={[estilos.datoValor, zona(142, 385, 338, 30)]}>
        {datos.fecha || "Fecha no disponible"}
      </Text>
      {autorDisponible ? (
        <>
          <Text style={[estilos.datoEtiqueta, zona(142, 424, 330, 27)]}>Autor</Text>
          <Text style={[estilos.datoValor, zona(142, 450, 330, 27)]}>{datos.autor}</Text>
        </>
      ) : (
        <View style={[estilos.mascaraBlanca, zona(61, 412, 446, 61)]} />
      )}

      {!ubicacionDisponible ? (
        <View style={[estilos.mascaraBlanca, zona(531, 330, 487, 178)]} />
      ) : (
        <>
          <Text style={[estilos.tituloUbicacion, zona(635, 359, 340, 34)]}>Ubicación</Text>
          {datos.vereda && (
            <Text style={[estilos.ubicacionTexto, zona(636, 395, 352, 24)]}>{datos.vereda}</Text>
          )}
          {datos.referencia && (
            <Text style={[estilos.ubicacionTexto, zona(636, 420, 352, 24)]}>
              {datos.referencia}
            </Text>
          )}
          {datos.coordenadas && (
            <Text style={[estilos.coordenadas, zona(636, 448, 360, 29)]}>
              {datos.coordenadas}
              {datos.precision ? ` · precisión aprox. ${datos.precision}` : ""}
            </Text>
          )}
        </>
      )}

      {narrativa.textoPortada || datos.notaOrigen.trim() ? (
        <>
          <Text style={[estilos.tituloSeccion, zona(142, 539, 735, 35)]}>
            {narrativa.tituloSeccion}
          </Text>
          {narrativa.textoPortada && (
            <Text
              style={[
                estilos.textoDescripcion,
                zona(142, 576, 785, datos.notaOrigen.trim() ? 56 : 95),
              ]}
            >
              {narrativa.textoPortada}
              {narrativa.textoContinuacion ? "…" : ""}
            </Text>
          )}
          {datos.notaOrigen.trim() && (
            <Text
              style={[
                estilos.notaOrigen,
                zona(
                  142,
                  narrativa.textoPortada ? 636 : 576,
                  650,
                  narrativa.textoPortada ? 38 : 95,
                ),
              ]}
            >
              {datos.notaOrigen}
            </Text>
          )}
        </>
      ) : (
        <View style={[estilos.mascaraBlanca, zona(38, 518, 981, 166)]} />
      )}

      <View style={[estilos.mascaraBlanca, zona(128, 704, 218, 46)]} />
      <Text style={[estilos.tituloSeccion, zona(133, 710, 260, 35)]}>Evidencias</Text>
      {fotografias.length === 0 && !primerVideo ? (
        <>
          <View style={[estilos.mascaraBlanca, zona(38, 754, 981, 405)]} />
          <Text style={[estilos.miniaturaSinVistaTexto, zona(130, 760, 800, 28)]}>
            Este reporte no incluye fotografías ni videos
          </Text>
        </>
      ) : (
        <>
          {fotografias.length !== 2 && (
            <View style={[estilos.mascaraBlanca, zona(38, 754, 981, 253)]} />
          )}
          {videoSolo && (
            <>
              <View
                style={[
                  estilos.mascaraBlanca,
                  zona(PANEL_VIDEO.x, PANEL_VIDEO.y, PANEL_VIDEO.ancho, PANEL_VIDEO.alto),
                ]}
              />
              <RecorteDePlantilla
                src={datos.plantillaPrincipalDataUri}
                origenX={PANEL_VIDEO.x}
                origenY={PANEL_VIDEO.y}
                ancho={PANEL_VIDEO.ancho}
                alto={PANEL_VIDEO.alto}
                destinoY={VIDEO_SOLO_Y}
              />
            </>
          )}
          {resumenFotos.map((evidencia, index) => (
            <MiniaturaFoto
              key={evidencia.id}
              evidencia={evidencia}
              indice={index}
              cantidad={fotografias.length}
            />
          ))}
          {primerVideo ? (
            <TarjetaVideo
              evidencia={primerVideo}
              cantidad={videos.length}
              desplazamientoY={desplazamientoVideoY}
            />
          ) : (
            <View
              style={[
                estilos.mascaraBlanca,
                zona(PANEL_VIDEO.x, PANEL_VIDEO.y, PANEL_VIDEO.ancho, PANEL_VIDEO.alto),
              ]}
            />
          )}
        </>
      )}

      {desplazamientoGeneracionY !== 0 && (
        <>
          <View
            style={[
              estilos.mascaraBlanca,
              zona(
                PANEL_GENERACION.x - 2,
                PANEL_GENERACION.y - 3,
                PANEL_GENERACION.ancho + 4,
                PANEL_GENERACION.alto + 6,
              ),
            ]}
          />
          <RecorteDePlantilla
            src={datos.plantillaPrincipalDataUri}
            origenX={PANEL_GENERACION.x}
            origenY={PANEL_GENERACION.y}
            ancho={PANEL_GENERACION.ancho}
            alto={PANEL_GENERACION.alto}
            destinoY={destinoGeneracionY}
          />
        </>
      )}

      <Text style={[estilos.datoPieEtiqueta, zona(117, 1202 + desplazamientoGeneracionY, 257, 17)]}>
        Fecha de generación
      </Text>
      <Text style={[estilos.datoPieValor, zona(117, 1220 + desplazamientoGeneracionY, 255, 36)]}>
        {fechaGeneracionPie || "Fecha no disponible"}
      </Text>
      <Text style={[estilos.datoPieEtiqueta, zona(468, 1202 + desplazamientoGeneracionY, 244, 17)]}>
        Registrado desde
      </Text>
      <Text style={[estilos.datoPieValor, zona(468, 1220 + desplazamientoGeneracionY, 244, 36)]}>
        {origenRegistroPie}
      </Text>
    </Page>
  );
}

function MiniaturaFoto({
  evidencia,
  indice,
  cantidad,
}: {
  evidencia: EvidenciaReportePdfPreparada;
  indice: number;
  cantidad: number;
}) {
  const compacta = cantidad >= 3;
  const marco =
    cantidad === 1
      ? zona(168, 757, 720, 246)
      : compacta
        ? zona(indice === 2 ? 290 : indice === 0 ? 41 : 539, indice < 2 ? 757 : 885, 474, 116)
        : indice === 0
          ? zona(41, 757, 474, 246)
          : zona(539, 757, 474, 246);
  return (
    <View
      style={[
        estilos.miniaturaViewport,
        ...(compacta ? [estilos.miniaturaViewportCompacta] : []),
        marco,
      ]}
    >
      {evidencia.miniaturaDataUri ? (
        <Image src={evidencia.miniaturaDataUri} style={estilos.miniaturaImagen} />
      ) : (
        <View style={estilos.miniaturaSinVista}>
          <Text style={estilos.miniaturaSinVistaTexto}>
            {evidencia.incidencia ?? "Vista previa no disponible"}
          </Text>
        </View>
      )}
    </View>
  );
}

function TarjetaVideo({
  evidencia,
  cantidad,
  desplazamientoY = 0,
}: {
  evidencia: EvidenciaReportePdfPreparada;
  cantidad: number;
  desplazamientoY?: number;
}) {
  const posicion = (x: number, y: number, ancho: number, alto: number) =>
    zona(x, y + desplazamientoY, ancho, alto);

  return (
    <>
      {evidencia.miniaturaDataUri && (
        <View style={[estilos.videoViewport, posicion(50, 1041, 252, 108)]}>
          <Image src={evidencia.miniaturaDataUri} style={estilos.videoImagen} />
        </View>
      )}
      {evidencia.miniaturaDataUri && (
        <Svg style={[estilos.iconoReproducir, posicion(151, 1070, 50, 50)]} viewBox="0 0 54 54">
          <Path
            d="M27 3a24 24 0 1 0 0 48 24 24 0 0 0 0-48Z"
            fill="none"
            stroke={colores.blanco}
            strokeWidth={3}
          />
          <Path d="M23 16 39 27 23 38V16Z" fill={colores.blanco} />
        </Svg>
      )}
      <Text style={[estilos.etiquetaVideo, posicion(436, 1072, 512, 28)]}>Video adjunto</Text>
      <Text style={[estilos.detalleVideo, posicion(436, 1104, 520, 34)]}>
        {cantidad > 1 ? `${cantidad} videos adjuntos · vista previa del primero` : ""}
        {cantidad > 1 && evidencia.detalle ? " · " : ""}
        {evidencia.detalle ?? "Vista previa no disponible"}
      </Text>
    </>
  );
}

function PaginaAmpliacion({
  evidencia,
  numero,
  total,
  plantilla,
}: {
  evidencia: EvidenciaReportePdfPreparada;
  numero: number;
  total: number;
  plantilla: string;
}) {
  return (
    <Page size="A4" style={estilos.pagina}>
      <FondoPlantilla src={plantilla} />
      <View
        style={[
          estilos.mascaraBlanca,
          { ...zona(145, 241, 605, 70), backgroundColor: colores.bannerAmpliacion },
        ]}
      />
      <Text style={[estilos.kickerAmpliacion, zona(161, 247, 575, 25)]}>
        Ampliación · {numero} de {total}
      </Text>
      <Text style={[estilos.tituloAmpliacion, zona(161, 275, 585, 34)]}>
        {evidencia.etiqueta || `Evidencia fotográfica ${numero}`}
      </Text>

      <View style={[estilos.marcoAmpliacion, zona(52, 354, 951, 788)]}>
        {evidencia.imagenCompletaDataUri ? (
          <Image src={evidencia.imagenCompletaDataUri} style={estilos.imagenAmpliacion} />
        ) : (
          <View style={estilos.alternativaAmpliacion}>
            <Text style={estilos.alternativaTitulo}>Fotografía no disponible</Text>
            <Text style={estilos.alternativaDetalle}>
              {evidencia.incidencia ?? "No se pudo preparar la imagen completa."}
            </Text>
          </View>
        )}
      </View>

      {evidencia.incidencia && (
        <Text style={[estilos.detalleFalloEvidencia, zona(52, 1168, 944, 52)]}>
          {evidencia.etiqueta}: no se pudo incluir la fotografía. {evidencia.incidencia}
        </Text>
      )}
    </Page>
  );
}

function FondoPlantilla({ src }: { src: string }) {
  return <Image src={src} style={estilos.fondoPlantilla} />;
}

function PaginaContinuacion({ texto, titulo }: { texto: string; titulo: string }) {
  return (
    <Page size="A4" style={estilos.continuacion}>
      <Text style={estilos.continuacionMarca}>Reporte Comunitario</Text>
      <Text style={estilos.continuacionLema}>Información que nos cuida · AlertaVereda</Text>
      <View style={estilos.continuacionLinea} />
      <Text style={estilos.continuacionTitulo}>{titulo}</Text>
      <Text style={estilos.continuacionTexto}>{texto}</Text>
      <Text
        fixed
        style={estilos.continuacionPie}
        render={({ pageNumber, totalPages }) =>
          `AlertaVereda · Página ${pageNumber} de ${totalPages}`
        }
      />
    </Page>
  );
}

function prepararNarrativa(
  datos: Pick<DatosReportePdfPreparados, "descripcion" | "motivoSinEvidencia" | "notaOrigen">,
): NarrativaPdf {
  const secciones = [
    { tipo: "descripcion" as const, texto: datos.descripcion?.trim() ?? "" },
    { tipo: "motivo" as const, texto: datos.motivoSinEvidencia?.trim() ?? "" },
  ].filter((seccion) => seccion.texto.length > 0);
  const texto =
    secciones.length > 1
      ? secciones
          .map(
            (seccion) =>
              `${seccion.tipo === "descripcion" ? "Descripción" : "Motivo sin evidencia"}: ${seccion.texto}`,
          )
          .join(" · ")
      : (secciones[0]?.texto ?? "");
  const tituloSeccion =
    secciones.length > 1
      ? "Información del reporte"
      : secciones[0]?.tipo === "descripcion"
        ? "Descripción"
        : secciones.length === 1
          ? "Motivo sin evidencia"
          : "Procedencia del reporte";
  const tituloContinuacion =
    secciones.length > 1
      ? "Continuación de la descripción y del motivo sin evidencia"
      : secciones[0]?.tipo === "descripcion"
        ? "Continuación de la descripción"
        : secciones.length === 1
          ? "Continuación del motivo sin evidencia"
          : "Continuación del reporte";
  const limitePortada = datos.notaOrigen.trim()
    ? LIMITE_TEXTO_PORTADA_CON_NOTA
    : LIMITE_DESCRIPCION_PORTADA;
  const partes = separarDescripcion(texto || null, limitePortada, secciones.length > 1);

  return {
    tituloSeccion,
    textoPortada: partes.portada,
    textoContinuacion: partes.continuacion,
    tituloContinuacion,
  };
}

function separarDescripcion(texto: string | null, limite: number, priorizarFraseCompleta = false) {
  const contenido = texto?.trim() ?? "";
  if (!contenido) return { portada: null, continuacion: null };
  if (contenido.length <= limite) {
    return { portada: contenido, continuacion: null };
  }

  const signos = [". ", "! ", "? ", "; "];
  let corteFrase = -1;
  for (const signo of signos)
    corteFrase = Math.max(corteFrase, contenido.lastIndexOf(signo, limite));

  let corte =
    corteFrase >= limite * 0.55 || (priorizarFraseCompleta && corteFrase >= 0)
      ? corteFrase + 1
      : contenido.lastIndexOf(" ", limite);
  if (corte <= 0) corte = limite;

  return {
    portada: contenido.slice(0, corte).trimEnd(),
    continuacion: contenido.slice(corte).trimStart(),
  };
}
