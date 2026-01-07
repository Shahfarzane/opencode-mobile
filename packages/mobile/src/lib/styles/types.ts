import type { VariantProps } from "tailwind-variants";

/**
 * Type for className values that can be passed to cn()
 */
export type ClassValue = string | undefined | null | false | 0;

/**
 * Options for cn() function
 */
export type CnOptions = (ClassValue | ClassValue[])[];

/**
 * Combined styles type helper
 */
export type CombinedStyles<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K];
};

/**
 * Extract variant props from a tv() definition
 */
export type ExtractVariantProps<T> = T extends (
  ...args: infer _Args
) => unknown
  ? VariantProps<T>
  : never;
