import type { ItineraryDay } from "@/types";
import { formatMoney } from "@/lib/format";

export interface PackageOverviewData {
  name: string;
  description: string;
  destination: string;
  duration: string;
  priceAmount: number;
  currency: string;
  categories?: string[];
  bestSeason?: string;
  difficulty?: string;
  ageRequirement?: string;
  groupSize?: number | null;
  serviceTypeName?: string;
  departurePoint?: string;
  itinerary?: ItineraryDay[];
  images?: string[];
  highlights?: string[];
  included?: string[];
  notIncluded?: string[];
}

function TagList({ items }: { items: string[] | undefined }) {
  if (!items?.length)
    return <p className="text-sm text-gray-400">Sin elementos</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="tag">
          {item}
        </span>
      ))}
    </div>
  );
}

/**
 * Vista resumen de un paquete: se reutiliza en el modal de detalle
 * del listado y en el paso de revisión del wizard.
 */
export function PackageOverview({ data }: { data: PackageOverviewData }) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-xl font-bold text-gray-900">{data.name}</h4>
            <p className="text-sm text-gray-500 mt-1">
              📍 {data.destination} · {data.duration}
            </p>
            {(data.categories ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(data.categories ?? []).map((c, i) => (
                  <span key={`${c}-${i}`} className="tag">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
          <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
            {formatMoney(data.currency, data.priceAmount)}
          </span>
        </div>

        <p className="text-sm text-gray-600 mt-4 whitespace-pre-line">
          {data.description}
        </p>

        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
          <div>
            <dt className="text-gray-500">Dificultad</dt>
            <dd className="font-medium text-gray-800">
              {data.difficulty || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Temporada</dt>
            <dd className="font-medium text-gray-800">
              {data.bestSeason || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Edad</dt>
            <dd className="font-medium text-gray-800">
              {data.ageRequirement || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Grupo</dt>
            <dd className="font-medium text-gray-800">
              {data.groupSize ? `${data.groupSize} personas` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Tipo de servicio</dt>
            <dd className="font-medium text-gray-800">
              {data.serviceTypeName || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Punto de partida</dt>
            <dd className="font-medium text-gray-800">
              {data.departurePoint || "—"}
            </dd>
          </div>
        </dl>

        {(data.images ?? []).length > 0 && (
          <div className="flex flex-wrap mt-4 gap-2.5">
            {(data.images ?? []).map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${img.slice(-12)}-${i}`}
                src={img}
                alt="Imagen del paquete"
                className="rounded-lg object-cover border border-gray-200"
                style={{ width: 160, height: 160, maxWidth: 160 }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h5 className="text-sm font-semibold text-green-700 mb-3">
            Destacados
          </h5>
          <TagList items={data.highlights} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h5 className="text-sm font-semibold text-blue-700 mb-3">Incluye</h5>
          <TagList items={data.included} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h5 className="text-sm font-semibold text-red-700 mb-3">
            No incluye
          </h5>
          <TagList items={data.notIncluded} />
        </div>
      </div>

      {(data.itinerary ?? []).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h5 className="text-sm font-semibold text-gray-700 mb-3">
            Itinerario
          </h5>
          <ol className="text-sm text-gray-700 space-y-2">
            {(data.itinerary ?? []).map((d) => (
              <li key={d.day}>
                <span className="font-semibold">Día {d.day}:</span> {d.title}
                {d.description && (
                  <div className="whitespace-pre-line text-gray-600 mt-1">
                    {d.description}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
