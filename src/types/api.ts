export interface KilistApiError extends Error {
  status: number;
}
export interface KilistCrudError extends Error {
  status: number;
}
export interface KilistApiResponse {
  status: number;
  message: string;
  count?: number;
  error?: any;
  body?: any;
}
export type KRes<T> = T | undefined;
export type KilistFormErrors =
  | {
      property: string;
      messages: string[];
    }[]
  | undefined;
export interface KilistResponseError {
  message: string;
  errors?: KilistFormErrors;
  error?: {
    endpoint?: string;
    traceId?: any;
  };
}
export type KilistDeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? KilistDeepPartial<T[P]> : T[P];
};
