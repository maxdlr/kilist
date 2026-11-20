import common from "@/i18n/common";

type Body = { message?: string; code?: string; errors?: { property?: string }[] };

type Failure = Body & {
  status?: number;
  isAxiosError?: boolean;
  response?: { data?: Body };
};

export type Problem = { message: string; code?: string; fields: string[] };

const CODE_FIELDS: Record<string, string[]> = {
  "auth.badCredentials": ["username", "password"],
  "auth.userExists": ["username", "email"],
  "auth.usernameTaken": ["username"],
  "validation.username.required": ["username"],
  "validation.username.short": ["username"],
  "validation.username.long": ["username"],
  "validation.email.invalid": ["email"],
  "validation.password.weak": ["password"],
  "validation.name.required": ["name"],
  "validation.name.long": ["name"],
  "household.codeNotFound": ["joinCode"],
  "household.alreadyMember": ["joinCode"],
  "code.invalid": ["code"],
  "code.expired": ["code"],
  "code.tooManyAttempts": ["code"],
};

export const isOffline = (error: unknown) => {
  const err = error as Failure | null;
  return Boolean(err && (err.status === 0 || (err.isAxiosError && !err.response)));
};

const bodyOf = (error: unknown): Body | null => {
  const err = error as Failure | null;
  if (!err) return null;
  if (err.response?.data) return err.response.data;
  const apiShaped = !(error instanceof Error) || typeof err.status === "number";
  return apiShaped ? err : null;
};

export const errorMessage = (error: unknown, fallback: string = common.unexpected): string => {
  if (isOffline(error)) return common.needsConnection;
  return bodyOf(error)?.message || fallback;
};

export const problemOf = (error: unknown, fallback?: string): Problem => {
  const body = bodyOf(error);
  const code = isOffline(error) ? undefined : body?.code;
  const fields = [
    ...(code ? (CODE_FIELDS[code] ?? []) : []),
    ...(body?.errors ?? []).map((entry) => entry.property).filter((field): field is string => Boolean(field)),
  ];
  return { message: errorMessage(error, fallback), ...(code && { code }), fields: [...new Set(fields)] };
};

export const isProblem = (value: unknown): value is Problem =>
  typeof value === "object" && value !== null && "fields" in value && "message" in value;
