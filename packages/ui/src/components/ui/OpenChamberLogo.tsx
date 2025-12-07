import React from 'react';
import { useOptionalThemeSystem } from '@/contexts/useThemeSystem';

interface OpenChamberLogoProps {
  className?: string;
  width?: number;
  height?: number;
  isAnimated?: boolean;
}

export const OpenChamberLogo: React.FC<OpenChamberLogoProps> = ({
  className = '',
  width = 70,
  height = 70,
  isAnimated = false,
}) => {
  const themeContext = useOptionalThemeSystem();

  let isDark = true;
  if (themeContext) {
    isDark = themeContext.currentTheme.metadata.variant !== 'light';
  } else if (typeof window !== 'undefined') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  const fillColor = isDark ? 'white' : 'black';
  const gradientId = 'shimmer-gradient';

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 70 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="OpenChamber logo"
    >
      {isAnimated && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={fillColor} stopOpacity="1" />
            <stop offset="50%" stopColor={fillColor} stopOpacity="0.7" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="1" />
            <animate
              attributeName="x1"
              from="-100%"
              to="200%"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="y1"
              from="-100%"
              to="200%"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="x2"
              from="0%"
              to="300%"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="y2"
              from="0%"
              to="300%"
              dur="4s"
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>
      )}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 13H35V58H0V13ZM26.25 22.1957H8.75V48.701H26.25V22.1957Z"
        fill={isAnimated ? `url(#${gradientId})` : fillColor}
      />
      <path
        d="M43.75 13H70V22.1957H52.5V48.701H70V57.8967H43.75V13Z"
        fill={isAnimated ? `url(#${gradientId})` : fillColor}
      />
    </svg>
  );
};
