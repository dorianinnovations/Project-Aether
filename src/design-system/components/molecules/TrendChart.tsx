/**
 * TrendChart - Simple time trend visualization
 * Shows 24-hour trend data with hourly major details
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';

// Design System
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TrendDataPoint {
  hour: number;
  value: number;
  majorDetail: string;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  theme?: 'light' | 'dark';
  color?: keyof typeof designTokens.semantic;
  height?: number;
  showPoints?: boolean;
  title?: string;
}

const TrendChart: React.FC<TrendChartProps> = ({
  data,
  theme = 'light',
  color = 'info',
  height = 120,
  showPoints = true,
  title = 'Hourly Trend',
}) => {
  const themeColors = getThemeColors(theme);
  const chartColor = designTokens.semantic[color];
  
  // Chart dimensions
  const chartWidth = SCREEN_WIDTH - (spacing[8] * 2);
  const chartHeight = height - 40; // Leave space for labels
  const padding = 20;
  
  if (!data.length) return null;

  // Find min/max values for scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const chartMaxValue = Math.max(...values);
  const valueRange = chartMaxValue - minValue || 1;

  // Generate SVG path for the trend line
  const generatePath = () => {
    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * (chartWidth - padding * 2);
      const y = padding + ((chartMaxValue - point.value) / valueRange) * (chartHeight - padding * 2);
      return { x, y };
    });

    if (points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    
    // Create smooth curved line using quadratic bezier curves
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      
      // Control point for smooth curve
      const controlX = prevPoint.x + (currentPoint.x - prevPoint.x) / 2;
      const controlY = prevPoint.y;
      
      path += ` Q ${controlX} ${controlY} ${currentPoint.x} ${currentPoint.y}`;
    }

    return path;
  };

  // Helper to convert 24-hour to 12-hour format
  const formatTo12Hour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // Get current hour's major detail
  const currentHour = new Date().getHours();
  const currentData = data.find(d => d.hour === currentHour) || data[data.length - 1];
  const maxValue = Math.max(...data.map(d => d.value));
  const currentIntensity = Math.round((currentData.value / maxValue) * 100);

  return (
    <View style={styles.container}>
      {/* Current Major Detail */}
      <Text style={[styles.currentDetail, { color: chartColor }]}>
        {currentData.majorDetail}
      </Text>
      
      {/* Current intensity indicator */}
      <Text style={[styles.intensityIndicator, { color: themeColors.textMuted }]}>
        Current: {currentIntensity}% intensity at {formatTo12Hour(currentHour)}
      </Text>

      {/* SVG Chart */}
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio, index) => (
            <Line
              key={index}
              x1={padding}
              y1={padding + ratio * (chartHeight - padding * 2)}
              x2={chartWidth - padding}
              y2={padding + ratio * (chartHeight - padding * 2)}
              stroke={themeColors.textMuted}
              strokeWidth="0.5"
              opacity="0.3"
            />
          ))}

          {/* Trend line */}
          <Path
            d={generatePath()}
            stroke={chartColor}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {showPoints && data.map((point, index) => {
            const x = padding + (index / (data.length - 1)) * (chartWidth - padding * 2);
            const y = padding + ((chartMaxValue - point.value) / valueRange) * (chartHeight - padding * 2);
            
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={chartColor}
                opacity="0.8"
              />
            );
          })}
        </Svg>

        {/* Time labels */}
        <View style={styles.timeLabels}>
          <Text style={[styles.timeLabel, { color: themeColors.textMuted }]}>
            {formatTo12Hour(data[0]?.hour || 0)}
          </Text>
          <Text style={[styles.timeLabel, { color: themeColors.textMuted }]}>
            Now
          </Text>
          <Text style={[styles.timeLabel, { color: themeColors.textMuted }]}>
            {formatTo12Hour(data[data.length - 1]?.hour || 23)}
          </Text>
        </View>
      </View>

      {/* Value range indicator */}
      <View style={styles.rangeIndicator}>
        <Text style={[styles.rangeText, { color: themeColors.textMuted }]}>
          Range: {minValue.toFixed(1)} - {maxValue.toFixed(1)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[2],
  },
  
  title: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  
  currentDetail: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  
  intensityIndicator: {
    ...typography.textStyles.caption,
    fontWeight: '500',
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  
  chartContainer: {
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: SCREEN_WIDTH - (spacing[8] * 2),
    paddingHorizontal: 20,
    marginTop: spacing[1],
  },
  
  timeLabel: {
    ...typography.textStyles.caption,
    fontWeight: '500',
  },
  
  rangeIndicator: {
    alignItems: 'center',
  },
  
  rangeText: {
    ...typography.textStyles.caption,
    fontWeight: '400',
  },
});

export default TrendChart;