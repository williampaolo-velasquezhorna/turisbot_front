"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Field, TagInput } from "../ui/Form";
import { InlineSpinner } from "../ui/Skeleton";
import { useToast } from "../ui/Toast";
import {
  AGE_OPTIONS,
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  DIFFICULTY_OPTIONS,
  HIGHLIGHT_SUGGESTIONS,
  INCLUDED_SUGGESTIONS,
  MAX_IMAGES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_DIMENSION,
  MONTHS,
  NOT_INCLUDED_SUGGESTIONS,
  WIZARD_STEPS,
} from "../../lib/constants";
import { formatMoney } from "../../lib/format";
import { packagesApi } from "../../lib/api/packages";
import { destinationsApi } from "../../lib/api/destinations";
import { serviceTypesApi } from "../../lib/api/service-types";
import type {
  DestinationCountry,
  DestinationRegion,
  ItineraryDay,
  Package,
  PackageFormData,
} from "@/types";
import { PackageOverview } from "./PackageOverview";

function normalizeCategory(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeText(value: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const scale = Math.min(
            MAX_IMAGE_DIMENSION / width,
            MAX_IMAGE_DIMENSION / height,
          );
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const EMPTY_FORM = {
  name: "",
  description: "",
  durationDays: 1,
  durationNights: 0,
  currency: "PEN",
  priceAmount: "",
  difficulty: "",
  ageRequirement: "",
  groupSize: "",
  seasonStart: "",
  seasonEnd: "",
  departurePoint: "",
  serviceType: "",
  country: "",
  region: "",
  province: "",
};

interface WizardDraft {
  form: typeof EMPTY_FORM;
  categories: string[];
  highlights: string[];
  included: string[];
  notIncluded: string[];
  images: string[];
  itinerary: ItineraryDay[];
}

const EMPTY_DRAFT: WizardDraft = {
  form: EMPTY_FORM,
  categories: [],
  highlights: [],
  included: [],
  notIncluded: [],
  images: [],
  itinerary: [],
};

function draftFromPackage(
  pkg: Package,
  countries?: DestinationCountry[],
  regions?: DestinationRegion[],
): WizardDraft {
  const countryNormalize = (v: string) =>
    (v || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const destinationParts = (pkg.destination || "").split(", ");
  const lastPart = countryNormalize(
    destinationParts[destinationParts.length - 1] || "",
  );
  const countryName =
    countries?.find((c) => countryNormalize(c.name) === lastPart)?.name ??
    "Perú";

  const regionName =
    destinationParts.length > 1
      ? destinationParts[destinationParts.length - 2]
      : "";
  const matchedRegion = (regions ?? []).find(
    (r) =>
      r.name.toLowerCase() === regionName.toLowerCase() &&
      (r.country || "Perú") === countryName,
  );
  const province = destinationParts.length > 2 ? destinationParts[0] : "";

  const durationMatch = (pkg.duration || "").match(
    /^(\d+)\s*d[ií]as?\s*\/\s*(\d+)\s*noches?$/i,
  );
  const seasonMatch = (pkg.bestSeason || "").match(/^(\w+)\s*a\s*(\w+)$/);

  return {
    form: {
      name: pkg.name,
      description: pkg.description,
      durationDays: durationMatch ? Number(durationMatch[1]) : 1,
      durationNights: durationMatch ? Number(durationMatch[2]) : 0,
      currency: pkg.currency || "PEN",
      priceAmount: String(pkg.priceAmount ?? ""),
      difficulty: pkg.difficulty || "",
      ageRequirement: pkg.ageRequirement || "",
      groupSize: pkg.groupSize != null ? String(pkg.groupSize) : "",
      seasonStart:
        seasonMatch && MONTHS.includes(seasonMatch[1]) ? seasonMatch[1] : "",
      seasonEnd:
        seasonMatch && MONTHS.includes(seasonMatch[2]) ? seasonMatch[2] : "",
      departurePoint: pkg.departurePoint || "",
      serviceType: pkg.serviceType || "",
      country: countryName,
      region: matchedRegion?.name ?? "",
      province: matchedRegion?.provinces.includes(province) ? province : "",
    },
    // Categorías: chip por chip incluso si el backend trae una sola cadena
    // separada por comas (datos legacy)
    categories: (pkg.category ?? []).flatMap((c) =>
      String(c)
        .split(/,\s*/)
        .map((v) => normalizeCategory(v))
        .filter(Boolean),
    ),
    highlights: pkg.highlights ?? [],
    included: pkg.included ?? [],
    notIncluded: pkg.notIncluded ?? [],
    images: pkg.images ?? [],
    itinerary: pkg.itinerary ?? [],
  };
}

export function PackageWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<WizardDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [mappedId, setMappedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // El input de nombre recibe el foco cada vez que se llega al paso 1
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 1) nameRef.current?.focus();
  }, [step]);

  // Si regresas al wizard desde el historial del navegador (bfcache), se
  // restaura la página en caliente: reinicia el borrador en ese caso
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setDraft(EMPTY_DRAFT);
        setStep(1);
        setMappedId(null);
        setErrors({});
      }
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const form = draft.form;
  const setForm = (patch: Partial<typeof EMPTY_FORM>) => {
    setDraft((d) => ({ ...d, form: { ...d.form, ...patch } }));
    // Al corregir el campo se retira su error inline de una vez
    const keys = Object.keys(patch);
    if (keys.length)
      setErrors((prev) => {
        const cleared = { ...prev };
        for (const key of keys) delete cleared[key];
        if ("seasonStart" in patch) delete cleared["seasonEnd"];
        if ("seasonEnd" in patch) delete cleared["seasonStart"];
        return cleared;
      });
  };

  // Datos de soporte
  const countries = useQuery({
    queryKey: ["countries"],
    queryFn: () => destinationsApi.findEnabledCountries(),
  });
  const regions = useQuery({
    queryKey: ["regions"],
    queryFn: () => destinationsApi.findRegions(),
  });
  const serviceTypes = useQuery({
    queryKey: ["service-types"],
    queryFn: () => serviceTypesApi.list(),
  });

  // Carga para edición: la carga por id pasa por React Query y el draft se mapea
  // durante el render (patrón "updating state during render", sin effects extra)
  const editingPackage = useQuery({
    queryKey: ["packages", editingId],
    enabled: !!editingId,
    queryFn: () => packagesApi.find(editingId!),
  });
  if (
    editingPackage.data &&
    editingId &&
    countries.data &&
    regions.data &&
    mappedId !== editingId
  ) {
    setMappedId(editingId);
    setDraft(
      draftFromPackage(editingPackage.data, countries.data, regions.data),
    );
  }
  // Entrar a "Crear Paquete" (sin id) después de una edición o visita previa:
  // reinicia todo el wizard a sus valores por defecto
  if (!editingId && mappedId !== null) {
    setMappedId(null);
    setDraft(EMPTY_DRAFT);
    setStep(1);
    setErrors({});
  }
  // Al cambiar de paquete en edición, el guardado anterior ya terminó:
  // desbloquea el botón (antes quedaba "Guardando..." de forma permanente)
  if (editingId && mappedId !== editingId && saving) {
    setSaving(false);
  }

  const countryRegions = useMemo(
    () =>
      (regions.data ?? []).filter(
        (r) => (r.country || "Perú") === form.country,
      ),
    [regions.data, form.country],
  );

  const selectedRegion = useMemo(
    () =>
      (regions.data ?? []).find(
        (r) => r.name === form.region && (r.country || "Perú") === form.country,
      ) ?? (regions.data ?? []).find((r) => r.name === form.region),
    [regions.data, form.region, form.country],
  );

  // Itinerario generado según la duración
  const generateItinerary = (
    totalDays: number,
    current: ItineraryDay[],
  ): ItineraryDay[] => {
    const next = current.slice(0, totalDays);
    while (next.length < totalDays) {
      next.push({ day: next.length + 1, title: "", description: "" });
    }
    return next.map((item, i) => ({ ...item, day: i + 1 }));
  };

  const updateItinerary = (index: number, patch: Partial<ItineraryDay>) => {
    setDraft((d) => ({
      ...d,
      itinerary: d.itinerary.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
  };

  const handleImageFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    if (draft.images.length + files.length > MAX_IMAGES) {
      showToast(`Máximo ${MAX_IMAGES} imágenes por paquete`, "error");
      return;
    }

    const processed: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        showToast("Solo se admiten imágenes", "error");
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        showToast(`La imagen "${file.name}" supera 8 MB`, "error");
        continue;
      }
      try {
        processed.push(await compressImage(file));
      } catch {
        showToast(`No se pudo procesar "${file.name}"`, "error");
      }
    }

    if (processed.length) {
      setDraft((d) => ({ ...d, images: [...d.images, ...processed] }));
    }
  };

  const collectData = (): PackageFormData => {
    const days = form.durationDays || 0;
    const nights = form.durationNights || 0;
    const priceAmount = Number(form.priceAmount) || 0;
    const destination = [form.province, form.region]
      .filter(Boolean)
      .concat(form.country ? [form.country] : [])
      .join(", ");
    const bestSeason =
      form.seasonStart && form.seasonEnd
        ? `${form.seasonStart} a ${form.seasonEnd}`
        : "";

    return {
      name: normalizeText(form.name),
      description: form.description.trim(),
      destination,
      duration: `${days} días / ${nights} noches`,
      price: formatMoney(form.currency, priceAmount),
      priceAmount: Number(priceAmount.toFixed(2)),
      currency: form.currency,
      bestSeason,
      difficulty: form.difficulty,
      ageRequirement: form.ageRequirement,
      groupSize: form.groupSize ? Number(form.groupSize) : null,
      category: draft.categories,
      highlights: draft.highlights,
      included: draft.included,
      notIncluded: draft.notIncluded,
      images: draft.images,
      itinerary: draft.itinerary,
      departurePoint: form.departurePoint.trim(),
      serviceType: form.serviceType,
    };
  };

  const saveMutation = useMutation({
    mutationFn: (data: PackageFormData) =>
      editingId
        ? packagesApi.update(editingId, data)
        : packagesApi.create(data),
    onSuccess: () => {
      showToast(editingId ? "Paquete actualizado" : "Paquete creado");
      void queryClient.invalidateQueries({ queryKey: ["packages"] });
      router.push("/manage-packages");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Error al guardar",
        "error",
      );
      setSaving(false);
    },
  });

  /** Devuelve la lista de errores de un paso dado (sin efectos) */
  const validateStepOf = (stepIndex: number): Record<string, string> => {
    const nextErrors: Record<string, string> = {};
    const req = (
      invalid: boolean,
      key: string,
      msg = "Este campo es obligatorio",
    ) => {
      if (invalid) nextErrors[key] = msg;
    };

    if (stepIndex === 1) {
      req(!form.name.trim(), "name");
      req(!form.country, "country");
      req(!form.region, "region");
      req(!form.description.trim(), "description");
      req(
        draft.categories.length === 0,
        "categories",
        "Agrega al menos una categoría",
      );
    }
    if (stepIndex === 2) {
      req(!form.priceAmount, "priceAmount");
      req(!form.difficulty, "difficulty");
      req(!form.ageRequirement, "ageRequirement");
      req(!form.groupSize, "groupSize");
      req(!form.serviceType, "serviceType");
      req(!form.seasonStart, "seasonStart");
      req(!form.seasonEnd, "seasonEnd");
      if (form.seasonStart === form.seasonEnd) {
        nextErrors["seasonEnd"] =
          "El mes de fin debe ser distinto al de inicio";
      }
    }
    if (stepIndex === 4) {
      req(
        draft.highlights.length === 0,
        "highlights",
        "Agrega al menos un destacado",
      );
      req(
        draft.included.length === 0,
        "included",
        "Agrega al menos un item en Incluye",
      );
      req(
        draft.notIncluded.length === 0,
        "notIncluded",
        "Agrega al menos un item en No incluye",
      );
    }
    if (stepIndex === 5) {
      if (draft.itinerary.length === 0) {
        nextErrors["itinerary"] = "El itinerario debe tener días generados";
      }
      draft.itinerary.forEach((d) => {
        if (!d.title.trim())
          nextErrors[`itinerary-${d.day}`] = "Este día necesita un título";
        if (!d.description?.trim())
          nextErrors[`itinerary-desc-${d.day}`] =
            "Este día necesita una descripción";
      });
    }

    return nextErrors;
  };

  const clearErrors = () => setErrors({});

  const next = () => goTo(step + 1);
  const prev = () => goTo(step - 1);
  // Navegación libre por los números (solo se valida al guardar)
  const goTo = (target: number) => {
    if (target === step || target < 1 || target > WIZARD_STEPS.length) return;
    // Al entrar al paso 5, sincroniza el itinerario con los días del paso 2
    if (target === 5) {
      setDraft((d) => ({
        ...d,
        itinerary: generateItinerary(form.durationDays, d.itinerary),
      }));
    }
    clearErrors();
    setStep(target);
  };

  const isLast = step === WIZARD_STEPS.length;

  // Cancelar: reinicia el wizard (borrador, paso y edición) antes de volver
  const handleCancel = () => {
    setDraft(EMPTY_DRAFT);
    setStep(1);
    setMappedId(null);
    setErrors({});
    router.push("/manage-packages");
  };

  const handleSubmit = () => {
    // Medida de seguridad: antes de guardar se valida TODO lo obligatorio
    // Antes de guardar se valida TODO: si falta algo, se lleva al primer
    // paso con pendientes y se marcan los errores ahí
    let firstFailing: number | null = null;
    const failed: Record<string, string> = {};
    for (let s = 1; s <= WIZARD_STEPS.length; s++) {
      const errs = validateStepOf(s);
      if (Object.keys(errs).length > 0 && firstFailing === null) {
        firstFailing = s;
      }
      Object.assign(failed, errs);
    }
    if (firstFailing !== null) {
      setErrors(failed);
      setStep(firstFailing);
      showToast("Completa los campos obligatorios antes de guardar", "error");
      return;
    }
    setSaving(true);
    saveMutation.mutate(collectData());
  };

  if (
    editingId &&
    (editingPackage.isLoading || !countries.data || !regions.data)
  ) {
    return <InlineSpinner text="Cargando paquete..." />;
  }

  const inputCls = (key: string) =>
    `form-input ${errors[key] ? "form-input-error" : ""}`;

  /** Actualiza una lista de tags y limpia su error inline */
  const setTagList = (
    key: string,
    draftKey: "highlights" | "included" | "notIncluded" | "categories",
    values: string[],
  ) => {
    setDraft((d) => ({ ...d, [draftKey]: values }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  // Variables derivadas para el render
  const seasonEndOptions = form.seasonStart
    ? [
        ...MONTHS.slice(MONTHS.indexOf(form.seasonStart) + 1),
        ...MONTHS.slice(0, MONTHS.indexOf(form.seasonStart)),
      ]
    : MONTHS;
  const usedCategories = new Set(draft.categories);

  const overviewData = collectData();
  const serviceTypeName =
    (serviceTypes.data ?? []).find((t) => t.slug === overviewData.serviceType)
      ?.name ?? "";
  const overviewPayload = {
    ...overviewData,
    category: draft.categories.map(
      (c) => CATEGORY_LABELS[c]?.replace(/^[^\s]+\s/, "") ?? c,
    ),
    serviceTypeName,
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="wizard-progress">
        <div
          className="wizard-progress-fill"
          style={{ width: `${(step / WIZARD_STEPS.length) * 100}%` }}
        />
      </div>

      <ol className="wizard-steps">
        {WIZARD_STEPS.map((label, i) => {
          // Un paso se muestra ✓ solo si tiene campos obligatorios y todos
          // están completos (pasos informativos como Imágenes/Revisión, nunca)
          const index = i + 1;
          const valid =
            index === 3
              ? // Imágenes: completo solo si el paquete tiene al menos una
                draft.images.length > 0
              : [1, 2, 4, 5].includes(index) &&
                Object.keys(validateStepOf(index)).length === 0;
          return (
            <li key={label}>
              <button
                type="button"
                className="wizard-step-indicator"
                onClick={() => goTo(index)}
              >
                <span
                  className={`wizard-step-dot ${
                    index === step ? "current" : valid ? "done" : ""
                  }`}
                >
                  {index === step ? index : valid ? "✓" : index}
                </span>
                <span
                  className={`wizard-step-label ${
                    i + 1 === step ? "current" : ""
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Paso 1: Información básica */}
      {step === 1 && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre" required error={errors["name"]}>
              <input
                ref={nameRef}
                type="text"
                id="wizard-package-name"
                className={inputCls("name")}
                placeholder="Ej: Tour Gocta Completo"
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
              />
            </Field>
            <Field
              label="Categorías"
              required
              id="wizard-category-input"
              error={errors["categories"]}
            >
              <div
                className={`flex flex-wrap items-center gap-1.5 form-input cursor-text ${
                  errors["categories"] ? "form-input-error" : ""
                }`}
              >
                {draft.categories.map((cat) => (
                  <span key={cat} className="tag">
                    {CATEGORY_LABELS[cat]?.replace(/^[^\s]+\s/, "") ?? cat}
                    <button
                      type="button"
                      className="tag-remove"
                      aria-label={`Eliminar ${cat}`}
                      onClick={() =>
                        setTagList(
                          "categories",
                          "categories",
                          draft.categories.filter((c) => c !== cat),
                        )
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  id="wizard-category-input"
                  placeholder="Agregar categoría..."
                  autoComplete="off"
                  className="flex-1 min-w-[9rem] border-0 outline-none bg-transparent text-sm py-0.5"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const value = normalizeCategory(e.currentTarget.value);
                      if (!value || draft.categories.includes(value)) return;
                      setDraft((d) => ({
                        ...d,
                        categories: [...d.categories, value],
                      }));
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <button
                  type="button"
                  className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 rounded text-sm text-blue-700 font-semibold shrink-0"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {CATEGORY_OPTIONS.filter(
                  (c) => !usedCategories.has(c.value),
                ).map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className="suggestion-chip"
                    onClick={() =>
                      setTagList("categories", "categories", [
                        ...draft.categories,
                        c.value,
                      ])
                    }
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Field label="País" required error={errors["country"]}>
              <select
                className={inputCls("country")}
                value={form.country}
                onChange={(e) =>
                  setForm({ country: e.target.value, region: "", province: "" })
                }
              >
                <option value="">Seleccionar país...</option>
                {(countries.data ?? []).map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Región / Estado / Departamento"
              required
              error={errors["region"]}
            >
              <select
                className={inputCls("region")}
                value={form.region}
                onChange={(e) =>
                  setForm({ region: e.target.value, province: "" })
                }
              >
                <option value="">Seleccionar región...</option>
                {countryRegions.map((r) => (
                  <option key={r._id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Provincia">
              <select
                className="form-input"
                value={form.province}
                onChange={(e) => setForm({ province: e.target.value })}
              >
                <option value="">Toda la región</option>
                {(selectedRegion?.provinces ?? []).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Descripción"
            required
            className="mt-4"
            error={errors["description"]}
          >
            <textarea
              required
              rows={3}
              className={inputCls("description")}
              placeholder="Qué hace único a este paquete"
              value={form.description}
              onChange={(e) => setForm({ description: e.target.value })}
            />
          </Field>
        </section>
      )}

      {/* Paso 2: Detalles */}
      {step === 2 && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Días" required>
              <input
                type="number"
                min={0}
                required
                className={inputCls("durationDays")}
                value={form.durationDays}
                onChange={(e) =>
                  setForm({ durationDays: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Noches" required>
              <input
                type="number"
                min={0}
                required
                className={inputCls("durationNights")}
                value={form.durationNights}
                onChange={(e) =>
                  setForm({ durationNights: Number(e.target.value) })
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Moneda" required>
              <select
                className={inputCls("currency")}
                value={form.currency}
                onChange={(e) => setForm({ currency: e.target.value })}
              >
                <option value="PEN">S/ (PEN)</option>
                <option value="USD">USD ($)</option>
              </select>
            </Field>
            <Field
              label="Precio por persona"
              required
              error={errors["priceAmount"]}
            >
              <input
                type="number"
                min={0}
                step="0.01"
                required
                className={inputCls("priceAmount")}
                placeholder="Ej: 250.00"
                value={form.priceAmount}
                onChange={(e) => setForm({ priceAmount: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Field label="Dificultad" required error={errors["difficulty"]}>
              <select
                required
                className={inputCls("difficulty")}
                value={form.difficulty}
                onChange={(e) => setForm({ difficulty: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Requisito de edad"
              required
              error={errors["ageRequirement"]}
            >
              <select
                required
                className={inputCls("ageRequirement")}
                value={form.ageRequirement}
                onChange={(e) => setForm({ ageRequirement: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {AGE_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Capacidad máxima del grupo"
              required
              error={errors["groupSize"]}
            >
              <input
                type="number"
                min={1}
                required
                className={inputCls("groupSize")}
                placeholder="Ej: 12"
                value={form.groupSize}
                onChange={(e) => setForm({ groupSize: e.target.value })}
              />
            </Field>
            <Field label="Tipo de servicio" error={errors["serviceType"]}>
              <select
                className={inputCls("serviceType")}
                value={form.serviceType}
                onChange={(e) => setForm({ serviceType: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {(serviceTypes.data ?? []).map((t) => (
                  <option key={t._id} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Punto de partida / recogida"
              error={errors["departurePoint"]}
            >
              <input
                type="text"
                className={inputCls("departurePoint")}
                placeholder="Ej: Plaza de Armas de Chachapoyas"
                value={form.departurePoint}
                onChange={(e) => setForm({ departurePoint: e.target.value })}
              />
            </Field>
          </div>

          <div className="mt-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">
              Mejor temporada *{" "}
              {errors["seasonEnd"] && (
                <span className="text-xs text-red-600 font-medium">
                  ⚠ {errors["seasonEnd"]}
                </span>
              )}
            </span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="wizard-season-start"
                  className="block text-xs text-gray-500 mb-1"
                >
                  Desde
                </label>
                <select
                  id="wizard-season-start"
                  required
                  className={inputCls("seasonStart")}
                  value={form.seasonStart}
                  onChange={(e) => setForm({ seasonStart: e.target.value })}
                >
                  <option value="">Seleccionar mes...</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="wizard-season-end"
                  className="block text-xs text-gray-500 mb-1"
                >
                  Hasta
                </label>
                <select
                  id="wizard-season-end"
                  required
                  className={inputCls("seasonEnd")}
                  value={form.seasonEnd}
                  onChange={(e) => setForm({ seasonEnd: e.target.value })}
                >
                  <option value="">Seleccionar mes...</option>
                  {seasonEndOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Paso 3: Galería de imágenes */}
      {step === 3 && (
        <section>
          <span className="block text-sm font-medium text-gray-700 mb-2">
            Imágenes del paquete
          </span>
          <p className="text-sm text-gray-500 mb-3">
            Sube imágenes desde tu dispositivo.
          </p>
          <input
            type="file"
            id="wizard-uploads"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              void handleImageFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => document.getElementById("wizard-uploads")?.click()}
          >
            📷 Subir fotos
          </button>
          <div className="flex flex-wrap mt-4 gap-2.5">
            {draft.images.map((src, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Imagen ${i + 1}`}
                  className="rounded-lg object-cover border border-gray-200"
                  style={{ width: 160, height: 160, maxWidth: 160 }}
                />
                <button
                  type="button"
                  aria-label="Eliminar imagen"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      images: d.images.filter((_, j) => j !== i),
                    }))
                  }
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 text-red-600 shadow hover:bg-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Paso 4: Contenido */}
      {step === 4 && (
        <section className="space-y-6">
          <Field label="Destacados" required error={errors["highlights"]}>
            <TagInput
              values={draft.highlights}
              invalid={!!errors["highlights"]}
              onChange={(values) =>
                setTagList("highlights", "highlights", values)
              }
              suggestions={HIGHLIGHT_SUGGESTIONS}
              placeholder="Agregar destacado"
            />
          </Field>
          <Field label="Incluye" required error={errors["included"]}>
            <TagInput
              values={draft.included}
              invalid={!!errors["included"]}
              onChange={(values) => setTagList("included", "included", values)}
              suggestions={INCLUDED_SUGGESTIONS}
              placeholder="Agregar item incluido"
            />
          </Field>
          <Field label="No incluye" required error={errors["notIncluded"]}>
            <TagInput
              values={draft.notIncluded}
              invalid={!!errors["notIncluded"]}
              onChange={(values) =>
                setTagList("notIncluded", "notIncluded", values)
              }
              suggestions={NOT_INCLUDED_SUGGESTIONS}
              placeholder="Agregar item no incluido"
            />
          </Field>
        </section>
      )}

      {/* Paso 5: Itinerario */}
      {step === 5 && (
        <section>
          <p className="text-sm text-gray-500 mb-1">
            Los días se generan automáticamente según la duración seleccionada
            en Detalles ({form.durationDays} día(s)). Cada día debe tener título
            y descripción obligatorios.
          </p>
          {errors["itinerary"] && (
            <p className="text-xs text-red-600 font-medium mb-3">
              ⚠ {errors["itinerary"]}
            </p>
          )}
          <div className="space-y-3">
            {draft.itinerary.map((item, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-lg p-4 bg-white"
              >
                <div className="mb-2">
                  <span className="text-sm font-bold text-blue-700">
                    Día {item.day}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field
                    label="Título"
                    required
                    error={errors[`itinerary-${item.day}`]}
                  >
                    <input
                      type="text"
                      className={inputCls(`itinerary-${item.day}`)}
                      placeholder="Ej: Visita a Kuélap"
                      value={item.title}
                      onChange={(e) =>
                        updateItinerary(i, { title: e.target.value })
                      }
                    />
                  </Field>
                  <Field
                    label="Descripción"
                    required
                    error={errors[`itinerary-desc-${item.day}`]}
                  >
                    <textarea
                      className={inputCls(`itinerary-desc-${item.day}`)}
                      rows={3}
                      placeholder="Qué se hará ese día"
                      value={item.description}
                      onChange={(e) =>
                        updateItinerary(i, { description: e.target.value })
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}
            {draft.itinerary.length === 0 && (
              <p className="text-sm text-gray-400">Sin días agregados</p>
            )}
          </div>
        </section>
      )}

      {/* Paso 6: Revisión */}
      {step === 6 && (
        <section>
          <PackageOverview data={overviewPayload} />
        </section>
      )}

      {/* Navegación del wizard */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={prev}
          className={`px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition ${
            step === 1 ? "invisible" : ""
          }`}
        >
          Atrás
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          {!isLast ? (
            <button type="button" onClick={next} className="btn-primary">
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary"
              disabled={saving || saveMutation.isPending}
            >
              {saving ? "Guardando..." : "Guardar paquete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
