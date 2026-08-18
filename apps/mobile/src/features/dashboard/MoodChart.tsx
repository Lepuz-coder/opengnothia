import { useState } from "react";
import { Text as RNText, View } from "react-native";
import Svg, { Circle, G, Line, Polygon, Polyline, Text as SvgText } from "react-native-svg";
import type { MoodEntry } from "@opengnothia/shared/types";
import { useThemeColors } from "@/theme/useAppTheme";

interface MoodChartProps {
  entries: MoodEntry[];
  daysInMonth: number;
  noDataText: string;
}

const HEIGHT = 180;
const PAD = { top: 16, right: 12, bottom: 26, left: 28 };

/**
 * react-native-svg port of desktop's MoodChart. The transform math is
 * verbatim; instead of a fixed 600×200 viewBox scaled down (which would
 * shrink the labels), the chart draws at the measured on-screen width.
 */
export function MoodChart({ entries, daysInMonth, noDataText }: MoodChartProps) {
  const { colors } = useThemeColors();
  const [width, setWidth] = useState(0);

  if (entries.length === 0) {
    return (
      <View className="mt-4 h-40 items-center justify-center">
        <RNText className="text-sm text-ink-mute">{noDataText}</RNText>
      </View>
    );
  }

  const chartW = width - PAD.left - PAD.right;
  const chartH = HEIGHT - PAD.top - PAD.bottom;

  const points = entries.map((entry) => {
    const day = parseInt(entry.date.split("-")[2], 10);
    const x = PAD.left + ((day - 1) / Math.max(daysInMonth - 1, 1)) * chartW;
    const y = PAD.top + chartH - ((entry.mood - 1) / 9) * chartH;
    return { x, y, day };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const baselineY = PAD.top + chartH;

  const xLabels = [1, 5, 10, 15, 20, 25, daysInMonth].filter(
    (d, i, arr) => d <= daysInMonth && arr.indexOf(d) === i
  );

  return (
    <View className="mt-4" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {[2, 4, 6, 8, 10].map((value) => {
            const y = PAD.top + chartH - ((value - 1) / 9) * chartH;
            return (
              <G key={value}>
                <Line
                  x1={PAD.left}
                  y1={y}
                  x2={width - PAD.right}
                  y2={y}
                  stroke={colors.line}
                  strokeDasharray={[4, 4]}
                />
                <SvgText x={PAD.left - 8} y={y + 4} textAnchor="end" fill={colors.inkMute} fontSize={10}>
                  {value}
                </SvgText>
              </G>
            );
          })}

          {points.length > 1 && (
            <Polygon
              points={`${points[0].x},${baselineY} ${linePoints} ${points[points.length - 1].x},${baselineY}`}
              fill={colors.tint}
              opacity={0.1}
            />
          )}

          {points.length > 1 && (
            <Polyline
              points={linePoints}
              fill="none"
              stroke={colors.tint}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((p) => (
            <Circle key={p.day} cx={p.x} cy={p.y} r={4} fill={colors.tint} />
          ))}

          {xLabels.map((day) => {
            const x = PAD.left + ((day - 1) / Math.max(daysInMonth - 1, 1)) * chartW;
            return (
              <SvgText key={day} x={x} y={HEIGHT - 5} textAnchor="middle" fill={colors.inkMute} fontSize={10}>
                {day}
              </SvgText>
            );
          })}
        </Svg>
      )}
    </View>
  );
}
