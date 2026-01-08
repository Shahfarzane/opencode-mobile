import React from 'react';
import { RiFileCopyLine, RiCheckLine, RiMacLine, RiSmartphoneLine, RiTerminalBoxLine } from '@remixicon/react';

const INSTALL_COMMAND = 'curl -fsSL https://opencode.ai/install | bash';
const POLL_INTERVAL_MS = 3000;
const HINT_DELAY_MS = 30000;

type OnboardingScreenProps = {
  onCliAvailable?: () => void;
};

const FEATURES = [
  {
    icon: RiMacLine,
    title: 'Cross-Device',
    description: 'Start on desktop, continue on tablet or phone',
  },
  {
    icon: RiSmartphoneLine,
    title: 'Native Experience',
    description: 'Feels right at home on every platform',
  },
  {
    icon: RiTerminalBoxLine,
    title: 'AI-Powered',
    description: 'OpenCode agent at your fingertips',
  },
];

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  index 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  index: number;
}) {
  return (
    <div 
      className="flex items-start gap-4 opacity-0 animate-[fadeSlideIn_0.6s_ease-out_forwards]"
      style={{ animationDelay: `${0.3 + index * 0.1}s` }}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function WaitingDots() {
  return (
    <span className="inline-flex gap-1 ml-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-muted-foreground animate-[bounce_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

function InstallCommand({ onCopy, copied }: { onCopy: () => void; copied: boolean }) {
  return (
    <div 
      className="opacity-0 animate-[fadeSlideIn_0.6s_ease-out_forwards]"
      style={{ animationDelay: '0.6s' }}
    >
      <div className="relative group">
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-muted/30 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
          
          <div className="relative px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <code className="font-mono text-sm text-foreground/90 truncate flex-1">
                <span className="text-primary">curl</span>
                <span className="text-muted-foreground"> -fsSL </span>
                <span className="text-foreground/70">https://opencode.ai/install</span>
                <span className="text-muted-foreground"> | </span>
                <span className="text-primary">bash</span>
              </code>
              
              <button
                type="button"
                onClick={onCopy}
                className="flex-shrink-0 p-2 rounded-lg transition-all duration-200 hover:bg-muted/50 active:scale-95"
                aria-label={copied ? 'Copied to clipboard' : 'Copy install command'}
              >
                {copied ? (
                  <RiCheckLine className="w-4 h-4 text-green-500 animate-[scaleIn_0.2s_ease-out]" aria-hidden="true" />
                ) : (
                  <RiFileCopyLine className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div 
          className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-green-500 font-medium transition-all duration-300 ${
            copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
          aria-live="polite"
        >
          Copied to clipboard
        </div>
      </div>
    </div>
  );
}

export function OnboardingScreen({ onCliAvailable }: OnboardingScreenProps) {
  const [copied, setCopied] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);
  const [isDesktopApp, setIsDesktopApp] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), HINT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    setIsDesktopApp(typeof (window as typeof window & { opencodeDesktop?: unknown }).opencodeDesktop !== 'undefined');
  }, []);

  const handleDragStart = React.useCallback(async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea, code')) {
      return;
    }
    if (e.button !== 0) return;
    if (isDesktopApp) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const window = getCurrentWindow();
        await window.startDragging();
      } catch (error) {
        console.error('Failed to start window dragging:', error);
      }
    }
  }, [isDesktopApp]);

  const checkCliAvailability = React.useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/health');
      if (!response.ok) return false;
      const data = await response.json();
      return data.cliAvailable === true;
    } catch {
      return false;
    }
  }, []);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  React.useEffect(() => {
    const poll = async () => {
      const available = await checkCliAvailability();
      if (available) {
        onCliAvailable?.();
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    poll();

    return () => clearInterval(interval);
  }, [checkCliAvailability, onCliAvailable]);

  return (
    <main
      className="h-full flex flex-col items-center justify-center bg-transparent px-6 py-12 relative cursor-default select-none overflow-hidden"
      onMouseDown={handleDragStart}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent pointer-events-none" aria-hidden="true" />
      
      <div className="relative w-full max-w-md mx-auto flex flex-col items-center">
        <div className="text-center mb-10 opacity-0 animate-[fadeSlideIn_0.6s_ease-out_forwards]">
          <div className="w-20 h-20 mx-auto mb-6 rounded-[22px] bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 flex items-center justify-center" aria-hidden="true">
            <svg 
              viewBox="0 0 24 24" 
              className="w-10 h-10 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M8.5 12h7M12 8.5v7" />
            </svg>
          </div>
          
          <h1 className="text-[2rem] font-bold tracking-tight text-foreground leading-tight">
            Welcome to
            <br />
            <span className="text-primary">OpenChamber</span>
          </h1>
          
          <p className="mt-3 text-muted-foreground text-base max-w-xs mx-auto leading-relaxed">
            Your AI coding companion, everywhere you go.
          </p>
        </div>

        <div className="w-full space-y-4 mb-10">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </div>

        <div className="w-full space-y-4">
          <p 
            className="text-center text-sm text-muted-foreground opacity-0 animate-[fadeSlideIn_0.6s_ease-out_forwards]"
            style={{ animationDelay: '0.55s' }}
          >
            Install OpenCode to get started
          </p>
          
          <InstallCommand onCopy={handleCopy} copied={copied} />
        </div>

        <div 
          className="mt-10 text-sm text-muted-foreground flex items-center opacity-0 animate-[fadeSlideIn_0.6s_ease-out_forwards]"
          style={{ animationDelay: '0.8s' }}
          aria-live="polite"
        >
          <span>Waiting for installation</span>
          <WaitingDots />
        </div>
      </div>

      <div 
        className={`absolute bottom-8 left-0 right-0 px-6 text-center transition-all duration-500 ${
          showHint ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="max-w-md mx-auto space-y-1">
          <p className="text-xs text-muted-foreground/70">
            Already installed? Make sure{' '}
            <code className="text-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded">opencode</code>{' '}
            is in your PATH
          </p>
          <p className="text-xs text-muted-foreground/70">
            or set{' '}
            <code className="text-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded">OPENCODE_BINARY</code>{' '}
            environment variable
          </p>
        </div>
      </div>
    </main>
  );
}
