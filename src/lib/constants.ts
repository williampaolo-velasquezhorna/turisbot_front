export const CATEGORY_OPTIONS = [
  { value: "naturaleza", label: "🌿 Naturaleza" },
  { value: "aventura", label: "🏔️ Aventura" },
  { value: "cultura", label: "🎭 Cultura" },
  { value: "arqueologia", label: "🗿 Arqueología" },
  { value: "gastronomia", label: "🍽️ Gastronomía" },
  { value: "playa", label: "🏖️ Playa" },
  { value: "trekking", label: "🥾 Trekking" },
  { value: "fauna", label: "🦜 Fauna" },
  { value: "religioso", label: "⛪ Religioso" },
  { value: "city-tour", label: "🏙️ City tour" },
] as const;

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((c) => [c.value, c.label]),
);

export const HIGHLIGHT_SUGGESTIONS = [
  "Vistas panorámicas",
  "Cascada entre las más altas",
  "Pueblo con encanto",
  "Aventura y adrenalina",
  "Patrimonio de la humanidad",
  "Contacto con la naturaleza",
  "Fotografía escénica",
  "Cultura local",
];

export const INCLUDED_SUGGESTIONS = [
  "Transporte",
  "Guía profesional",
  "Almuerzo",
  "Cena",
  "Desayuno",
  "Alojamiento",
  "Entradas",
  "Ingreso a reservas",
  "Soporte de primeros auxilios",
];

export const NOT_INCLUDED_SUGGESTIONS = [
  "Propinas",
  "Gastos personales",
  "Traslados externos",
  "Bebidas extra",
  "Alquiler de caballos",
  "Paseo en bote",
  "Fotos profesionales",
  "Equipo de senderismo opcional",
  "Seguro de viaje",
  "Tour privado",
];

export const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const AGE_OPTIONS = [
  "Apto para todas las edades",
  "Mayores de 4 años",
  "Mayores de 8 años",
  "Mayores de 12 años",
  "Mayores de 18 años",
];

export const DIFFICULTY_OPTIONS = ["Baja", "Moderada", "Alta"];

export const WIZARD_STEPS = [
  "Información básica",
  "Detalles",
  "Imágenes",
  "Contenido",
  "Itinerario",
  "Revisión",
];

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1600;
export const MAX_IMAGES = 10;
