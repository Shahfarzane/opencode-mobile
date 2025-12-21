import React, { useMemo } from 'react';

interface OpenChamberLogoProps {
  className?: string;
  width?: number;
  height?: number;
  isAnimated?: boolean;
}

// Generate grid cells for a face (4x4 grid)
const generateFaceGrid = (
  topLeft: { x: number; y: number },
  topRight: { x: number; y: number },
  bottomRight: { x: number; y: number },
  bottomLeft: { x: number; y: number },
  gridSize: number = 4
) => {
  const cells: Array<{ path: string; row: number; col: number }> = [];
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const t1 = col / gridSize;
      const t2 = (col + 1) / gridSize;
      const s1 = row / gridSize;
      const s2 = (row + 1) / gridSize;
      
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const bilinear = (tl: number, tr: number, br: number, bl: number, t: number, s: number) => {
        const top = lerp(tl, tr, t);
        const bottom = lerp(bl, br, t);
        return lerp(top, bottom, s);
      };
      
      const p1 = {
        x: bilinear(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x, t1, s1),
        y: bilinear(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y, t1, s1),
      };
      const p2 = {
        x: bilinear(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x, t2, s1),
        y: bilinear(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y, t2, s1),
      };
      const p3 = {
        x: bilinear(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x, t2, s2),
        y: bilinear(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y, t2, s2),
      };
      const p4 = {
        x: bilinear(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x, t1, s2),
        y: bilinear(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y, t1, s2),
      };
      
      cells.push({
        path: `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y} L${p4.x} ${p4.y} Z`,
        row,
        col,
      });
    }
  }
  
  return cells;
};

export const OpenChamberLogo: React.FC<OpenChamberLogoProps> = ({
  className = '',
  width = 70,
  height = 70,
  isAnimated = false,
}) => {
  // VSCode uses CSS variables for theming
  const strokeColor = 'var(--vscode-foreground)';
  const fillColor = 'var(--vscode-foreground)';
  const logoFillColor = 'var(--vscode-foreground)';
  const cellHighlightColor = 'var(--vscode-foreground)';

  // Isometric cube geometry
  const edge = 48;
  const cos30 = 0.866;
  const sin30 = 0.5;
  const centerY = 50;
  
  const top = { x: 50, y: centerY - edge };
  const left = { x: 50 - edge * cos30, y: centerY - edge * sin30 };
  const right = { x: 50 + edge * cos30, y: centerY - edge * sin30 };
  const center = { x: 50, y: centerY };
  const bottomLeft = { x: 50 - edge * cos30, y: centerY + edge * sin30 };
  const bottomRight = { x: 50 + edge * cos30, y: centerY + edge * sin30 };
  const bottom = { x: 50, y: centerY + edge };

  const topFaceCenterY = (top.y + left.y + center.y + right.y) / 4;
  const isoMatrix = `matrix(0.866, 0.5, -0.866, 0.5, 50, ${topFaceCenterY})`;

  const leftFaceCells = generateFaceGrid(left, center, bottom, bottomLeft);
  const rightFaceCells = generateFaceGrid(center, right, bottomRight, bottom);

  const cellOpacities = useMemo(() => {
    const opacities: number[] = [];
    for (let i = 0; i < 32; i++) {
      opacities.push(0.1 + Math.random() * 0.5);
    }
    return opacities;
  }, []);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="OpenChamber logo"
    >
      {/* Left face */}
      <path
        d={`M${center.x} ${center.y} L${left.x} ${left.y} L${bottomLeft.x} ${bottomLeft.y} L${bottom.x} ${bottom.y} Z`}
        fill={fillColor}
        fillOpacity="0.15"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* Left face grid cells */}
      {leftFaceCells.map((cell, i) => (
        <path
          key={`left-${i}`}
          d={cell.path}
          fill={cellHighlightColor}
          fillOpacity={0.35 * cellOpacities[i]}
        />
      ))}
      
      {/* Right face */}
      <path
        d={`M${center.x} ${center.y} L${right.x} ${right.y} L${bottomRight.x} ${bottomRight.y} L${bottom.x} ${bottom.y} Z`}
        fill={fillColor}
        fillOpacity="0.15"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* Right face grid cells */}
      {rightFaceCells.map((cell, i) => (
        <path
          key={`right-${i}`}
          d={cell.path}
          fill={cellHighlightColor}
          fillOpacity={0.35 * cellOpacities[i + 16]}
        />
      ))}
      
      {/* Top face - open */}
      <path
        d={`M${top.x} ${top.y} L${left.x} ${left.y} L${center.x} ${center.y} L${right.x} ${right.y} Z`}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* OpenCode logo on top face */}
      <g opacity={isAnimated ? undefined : 1}>
        {isAnimated && (
          <animate
            attributeName="opacity"
            values="0.4;1;0.4"
            dur="3s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
          />
        )}
        <g transform={`${isoMatrix} scale(0.75)`}>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M-16 -20 L16 -20 L16 20 L-16 20 Z M-8 -12 L-8 12 L8 12 L8 -12 Z"
            fill={logoFillColor}
          />
          <path
            d="M-8 -4 L8 -4 L8 12 L-8 12 Z"
            fill={logoFillColor}
            fillOpacity="0.4"
          />
        </g>
      </g>
    </svg>
  );
};

export default OpenChamberLogo;
