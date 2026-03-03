import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export default function RadarChart({ data = {}, size = 260 }) {
  const { theme } = useTheme();

  const labels = Object.keys(data);
  const values = labels.map(k => Number(data[k] || 0));
  const max = 10;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const levels = 5;

  if (!labels.length) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', height: size }}>
        <Text style={{ color: theme.colors.textMuted }}>Sem dados de habilidades ainda.</Text>
      </View>
    );
  }

  const angleStep = (Math.PI * 2) / labels.length;
  const pointAt = (value, idx) => {
    const angle = -Math.PI / 2 + idx * angleStep;
    const r = (value / max) * radius;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  };

  const polygonPoints = values.map((v, i) => pointAt(v, i).join(',')).join(' ');

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {[...Array(levels)].map((_, i) => {
          const levelValue = ((i + 1) / levels) * max;
          const ringPoints = labels.map((_, idx) => pointAt(levelValue, idx).join(',')).join(' ');
          return (
            <Polygon
              key={`ring-${i}`}
              points={ringPoints}
              fill="none"
              stroke={theme.colors.border}
              strokeWidth="1"
            />
          );
        })}

        {labels.map((label, i) => {
          const [x, y] = pointAt(max, i);
          return (
            <React.Fragment key={label}>
              <Line x1={cx} y1={cy} x2={x} y2={y} stroke={theme.colors.border} strokeWidth="1" />
              <SvgText
                x={x}
                y={y}
                fill={theme.colors.textMuted}
                fontSize="11"
                textAnchor="middle"
                dy={y < cy ? -6 : 14}
              >
                {label}
              </SvgText>
            </React.Fragment>
          );
        })}

        <Polygon
          points={polygonPoints}
          fill="rgba(59,130,246,0.25)"
          stroke={theme.colors.accent}
          strokeWidth="2"
        />
        {values.map((v, i) => {
          const [x, y] = pointAt(v, i);
          return <Circle key={`pt-${i}`} cx={x} cy={y} r={3} fill={theme.colors.accent} />;
        })}
      </Svg>
    </View>
  );
}
