import type { CombinedStyles } from "./types";

/**
 * Helper function to combine multiple tv() style definitions into a single object.
 * This provides better organization and type inference for component styles.
 *
 * @example
 * const root = tv({ base: 'flex-row', variants: { ... } });
 * const label = tv({ base: 'text-center', variants: { ... } });
 *
 * export const buttonStyles = combineStyles({ root, label });
 *
 * // Usage in component:
 * const rootClass = buttonStyles.root({ variant: 'primary' });
 * const labelClass = buttonStyles.label({ variant: 'primary' });
 */
export function combineStyles<T extends Record<string, unknown>>(
  styles: T
): CombinedStyles<T> {
  return styles as CombinedStyles<T>;
}
