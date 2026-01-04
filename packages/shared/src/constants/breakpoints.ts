export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export type BreakpointKey = keyof typeof BREAKPOINTS;

export function getDeviceTypeFromWidth(width: number): DeviceType {
  if (width <= BREAKPOINTS.md) {
    return 'mobile';
  }
  if (width <= BREAKPOINTS.lg) {
    return 'tablet';
  }
  return 'desktop';
}

export function getBreakpointFromWidth(width: number): BreakpointKey {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}
