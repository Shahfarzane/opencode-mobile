import React, { useMemo } from 'react';
import { View, useColorScheme } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface OpenChamberLogoProps {
  width?: number;
  height?: number;
  isAnimated?: boolean;
  opacity?: number;
}

// Generate grid cells for a face (4x4 grid)
// Returns array of parallelogram paths in isometric projection
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
      // Interpolate corners for this cell
      const t1 = col / gridSize;
      const t2 = (col + 1) / gridSize;
      const s1 = row / gridSize;
      const s2 = (row + 1) / gridSize;

      // Bilinear interpolation for each corner of the cell
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
  width = 70,
  height = 70,
  isAnimated = false,
  opacity = 1,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const strokeColor = isDark ? 'white' : 'black';
  const fillColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
  const logoFillColor = isDark ? 'white' : 'black';
  const cellHighlightColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)';

  // Isometric cube geometry (mathematically correct)
  // For true isometric: horizontal edges at +/-30deg from horizontal
  // cos(30deg) ~= 0.866, sin(30deg) = 0.5
  const edge = 48;
  const cos30 = 0.866;
  const sin30 = 0.5;
  const centerY = 50;

  // Key points of the isometric cube
  const top = { x: 50, y: centerY - edge };                           // top vertex
  const left = { x: 50 - edge * cos30, y: centerY - edge * sin30 };   // top-left
  const right = { x: 50 + edge * cos30, y: centerY - edge * sin30 };  // top-right  
  const center = { x: 50, y: centerY };                                // center (front vertex of top face)
  const bottomLeft = { x: 50 - edge * cos30, y: centerY + edge * sin30 };  // bottom-left
  const bottomRight = { x: 50 + edge * cos30, y: centerY + edge * sin30 }; // bottom-right
  const bottom = { x: 50, y: centerY + edge };                         // bottom vertex

  // Center of top face for transform
  const topFaceCenterY = (top.y + left.y + center.y + right.y) / 4;
  const isoMatrix = `matrix(0.866, 0.5, -0.866, 0.5, 50, ${topFaceCenterY})`;

  // Generate grid cells for both faces
  const leftFaceCells = generateFaceGrid(left, center, bottom, bottomLeft);
  const rightFaceCells = generateFaceGrid(center, right, bottomRight, bottom);

  // Generate random opacity values for cells (stable per component instance)
  const cellOpacities = useMemo(() => {
    const opacities: number[] = [];
    for (let i = 0; i < 32; i++) { // 16 cells per face * 2 faces
      opacities.push(0.1 + Math.random() * 0.5); // Random opacity 0.1-0.6
    }
    return opacities;
  }, []);

  return (
    <View style={{ width, height, opacity }}>
      <Svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
      >
        {/* Left face - base fill */}
        <Path
          d={`M${center.x} ${center.y} L${left.x} ${left.y} L${bottomLeft.x} ${bottomLeft.y} L${bottom.x} ${bottom.y} Z`}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {leftFaceCells.map((cell) => (
          <Path
            key={`left-${cell.row}-${cell.col}`}
            d={cell.path}
            fill={cellHighlightColor}
            opacity={cellOpacities[cell.row * 4 + cell.col]}
          />
        ))}

        {/* Right face - base fill */}
        <Path
          d={`M${center.x} ${center.y} L${right.x} ${right.y} L${bottomRight.x} ${bottomRight.y} L${bottom.x} ${bottom.y} Z`}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {rightFaceCells.map((cell) => (
          <Path
            key={`right-${cell.row}-${cell.col}`}
            d={cell.path}
            fill={cellHighlightColor}
            opacity={cellOpacities[cell.row * 4 + cell.col + 16]}
          />
        ))}

        {/* Top face - open (no fill), only stroke */}
        <Path
          d={`M${top.x} ${top.y} L${left.x} ${left.y} L${center.x} ${center.y} L${right.x} ${right.y} Z`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* OpenCode logo on top face */}
        <G opacity={isAnimated ? 0.7 : 1} transform={`${isoMatrix} scale(0.75)`}>
          {/* OpenCode logo - outer frame with inner square */}
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M-16 -20 L16 -20 L16 20 L-16 20 Z M-8 -12 L-8 12 L8 12 L8 -12 Z"
            fill={logoFillColor}
          />
          {/* Inner square */}
          <Path
            d="M-8 -4 L8 -4 L8 12 L-8 12 Z"
            fill={logoFillColor}
            fillOpacity={0.4}
          />
        </G>
      </Svg>
    </View>
  );
};

export default OpenChamberLogo;
