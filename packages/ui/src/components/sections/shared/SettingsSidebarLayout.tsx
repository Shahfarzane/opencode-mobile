import React from 'react';
import { ScrollableOverlay } from '@/components/ui/ScrollableOverlay';
import { isVSCodeRuntime } from '@/lib/desktop';
import { cn } from '@/lib/utils';

interface SettingsSidebarLayoutProps {
  /** Header content (typically SettingsSidebarHeader) */
  header?: React.ReactNode;
  /** Footer content (e.g., AboutSettings on mobile) */
  footer?: React.ReactNode;
  /** Main scrollable content */
  children: React.ReactNode;
  /** Additional className for the outer container */
  className?: string;
}

/**
 * Standard layout wrapper for settings sidebars.
 * Provides consistent background, scrolling, and header/footer slots.
 *
 * @example
 * <SettingsSidebarLayout
 *   header={<SettingsSidebarHeader count={items.length} onAdd={handleAdd} />}
 * >
 *   {items.map(item => (
 *     <SettingsSidebarItem key={item.id} ... />
 *   ))}
 * </SettingsSidebarLayout>
 */
export const SettingsSidebarLayout: React.FC<SettingsSidebarLayoutProps> = ({
  header,
  footer,
  children,
  className,
}) => {
  const [isDesktopRuntime, setIsDesktopRuntime] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return typeof window.opencodeDesktop !== 'undefined';
  });

  const isVSCode = React.useMemo(() => isVSCodeRuntime(), []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsDesktopRuntime(typeof window.opencodeDesktop !== 'undefined');
  }, []);

  // Desktop app: transparent for blur effect
  // VS Code: bg-background (same as page content)
  // Web/mobile: bg-sidebar
  const bgClass = isDesktopRuntime
    ? 'bg-transparent'
    : isVSCode
      ? 'bg-background'
      : 'bg-sidebar';

  return (
    <div
      className={cn(
        'flex h-full flex-col',
        bgClass,
        className
      )}
    >
      {header}

      <ScrollableOverlay
        outerClassName="flex-1 min-h-0"
        className="space-y-1 px-3 py-2 overflow-x-hidden"
      >
        {children}
      </ScrollableOverlay>

      {footer}
    </div>
  );
};
