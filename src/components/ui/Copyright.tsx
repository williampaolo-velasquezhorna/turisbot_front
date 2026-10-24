/**
 * Pie con el año actual. Se evalúa a nivel de módulo (constante por build),
 * evitando valores inestables (`new Date()`) durante el render.
 */
const YEAR = new Date().getFullYear();

export function Copyright({ className }: { className?: string }) {
  return (
    <p className={className ?? "text-center text-xs text-slate-400 mt-6"}>
      © {YEAR} TurisBot. Todos los derechos reservados.
    </p>
  );
}
