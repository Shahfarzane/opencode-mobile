import React from 'react';
import { ScrollableOverlay } from '@/components/ui/ScrollableOverlay';
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

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsDesktopRuntime(typeof window.opencodeDesktop !== 'undefined');
  }, []);

  return (
    <div
      className={cn(
        'flex h-full flex-col',
        isDesktopRuntime ? 'bg-transparent' : 'bg-sidebar',
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
