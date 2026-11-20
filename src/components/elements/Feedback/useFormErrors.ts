import { useCallback, useState } from "react";

export type FieldError = { message: string; attempt: number } | null;

const useFormErrors = <K extends string>() => {
  const [errors, setErrors] = useState<Partial<Record<K, FieldError>>>({});

  const fail = useCallback(
    (key: K, message: string) =>
      setErrors((current) => ({ ...current, [key]: { message, attempt: (current[key]?.attempt ?? 0) + 1 } })),
    [],
  );

  const clear = useCallback(
    (key?: K) => setErrors((current) => (key ? (current[key] ? { ...current, [key]: null } : current) : {})),
    [],
  );

  return {
    of: (key: K): FieldError => errors[key] ?? null,
    fail,
    clear,
    any: Object.values(errors).some(Boolean),
  };
};

export default useFormErrors;
