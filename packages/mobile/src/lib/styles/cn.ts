import { twMerge } from "tailwind-merge";

/**
 * Simplified class name type to avoid TypeScript recursion issues
 */
type ClassValue = string | undefined | null | false | 0;

/**
 * Utility function for merging Tailwind CSS classes
 * Uses tailwind-merge to intelligently handle conflicting classes
 *
 * @example
 * cn('px-4 py-2', 'px-6') // => 'py-2 px-6'
 * cn('text-red-500', condition && 'text-blue-500') // => 'text-blue-500' if condition is true
 */
export function cn(...args: (ClassValue | ClassValue[])[]): string {
  // Filter out falsy values and flatten arrays
  const classes = args
    .flat()
    .filter((x): x is string => typeof x === "string" && x.length > 0);

  return twMerge(classes.join(" "));
}
