"use client";

import { Children, cloneElement, isValidElement, useId, useState } from "react";
import type {
  ReactElement,
  ReactNode,
  ChangeEvent,
  KeyboardEvent,
} from "react";

export function Field({
  label,
  required,
  hint,
  className = "",
  id,
  error,
  children,
}: {
  label?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  /** Id explícito del control si no hay un único hijo simple */
  id?: string;
  /** Mensaje de validación inline (se muestra debajo del control) */
  error?: string;
  children: ReactNode;
}) {
  const autoId = useId();
  const controlId = id ?? autoId;
  const childrenArray = Children.toArray(children);

  // Un solo hijo simple: inyectar el id directamente para asociar el label
  const child =
    childrenArray.length === 1 && isValidElement(childrenArray[0])
      ? cloneElement(childrenArray[0] as ReactElement<{ id?: string }>, {
          id:
            (childrenArray[0] as ReactElement<{ id?: string }>).props.id ??
            controlId,
        })
      : children;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={controlId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && " *"}
        </label>
      )}
      {hint && <p className="text-sm text-gray-500 mb-1">{hint}</p>}
      {child}
      {error && (
        <p className="text-xs text-red-600 mt-1 font-medium">⚠ {error}</p>
      )}
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  placeholder,
  required = true,
  minLength,
  autoComplete,
  inputClassName = "auth-input auth-input-password",
  id,
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  inputClassName?: string;
  id?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="auth-input-wrapper">
      <input
        type={show ? "text" : "password"}
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={inputClassName}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="auth-toggle-password"
        aria-label="Mostrar u ocultar contraseña"
      >
        {show ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

/** Input de tags/chips multi-campo con sugerencias */
export function TagInput({
  values,
  onChange,
  suggestions,
  placeholder,
  id,
  allowCustom = true,
  invalid = false,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  id?: string;
  allowCustom?: boolean;
  /** Borde rojo del contenedor cuando la lista está vacía (solo estado inválido) */
  invalid?: boolean;
}) {
  const add = (value: string) => {
    const v = value.trim();
    if (!v || values.some((t) => t.toLowerCase() === v.toLowerCase())) return;
    onChange([...values, v]);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add(e.currentTarget.value);
      e.currentTarget.value = "";
    }
  };

  return (
    <div>
      <div
        className={`flex flex-wrap items-center gap-1.5 form-input cursor-text ${
          invalid ? "form-input-error" : ""
        }`}
        onClick={(e) => {
          const input = e.currentTarget.querySelector("input");
          input?.focus();
        }}
      >
        {values.map((v) => (
          <span key={v} className="tag">
            {v}
            <button
              type="button"
              className="tag-remove"
              aria-label={`Eliminar ${v}`}
              onClick={() => onChange(values.filter((t) => t !== v))}
            >
              ×
            </button>
          </span>
        ))}
        {allowCustom && (
          <input
            type="text"
            id={id}
            placeholder={placeholder}
            autoComplete="off"
            onKeyDown={handleKey}
            onBlur={(e) => {
              add(e.target.value);
              e.target.value = "";
            }}
            className="flex-1 min-w-[9rem] border-0 outline-none bg-transparent text-sm py-0.5"
          />
        )}
      </div>
      {suggestions && (
        <div className="flex flex-wrap gap-2 mt-2">
          {suggestions.map((s) => {
            const used = values.some(
              (t) => t.toLowerCase() === s.toLowerCase(),
            );
            return (
              <button
                key={s}
                type="button"
                className="suggestion-chip"
                disabled={used}
                onClick={() => add(s)}
              >
                {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
