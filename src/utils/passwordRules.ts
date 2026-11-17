import type { PasswordPolicy } from "@/offline/rules";

export type PasswordRuleId = "length" | "upper" | "lower" | "number" | "symbol";

export type PasswordRule = { id: PasswordRuleId; glyph: string; min: number; met: boolean };

const count = (value: string, pattern: RegExp) => value.match(pattern)?.length ?? 0;

export const checkPassword = (policy: PasswordPolicy | undefined, value: string): PasswordRule[] => {
  if (!policy) return [];
  const rules: PasswordRule[] = [
    { id: "length", glyph: String(policy.minLength), min: policy.minLength, met: value.length >= policy.minLength },
    { id: "upper", glyph: "A", min: policy.minUppercase, met: count(value, /[A-Z]/g) >= policy.minUppercase },
    { id: "lower", glyph: "a", min: policy.minLowercase, met: count(value, /[a-z]/g) >= policy.minLowercase },
    { id: "number", glyph: "1", min: policy.minNumbers, met: count(value, /\d/g) >= policy.minNumbers },
    { id: "symbol", glyph: "&", min: policy.minSymbols, met: count(value, /[^a-zA-Z0-9]/g) >= policy.minSymbols },
  ];
  return rules.filter((rule) => rule.min > 0);
};
