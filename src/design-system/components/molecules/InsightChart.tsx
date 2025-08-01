/**
 * Aether - InsightChart Component
 * Beautiful data visualization for user insights and behavioral patterns
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

// Design System
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { createNeumorphicContainer } from '../../tokens/shadows';

const { width: screenWidth } = Dimensions.get('window');

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface InsightChartProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  type: 'bar' | 'line' | 'progress' | 'radar';
  theme?: 'light' | 'dark';
  height?: number;
}

const InsightChart: React.FC<InsightChartProps> = ({
  title,
  subtitle,
  data,
  type,
  theme = 'light',
  height = 200,
}) => {
  const themeColors = getThemeColors(theme);
  const chartWidth = screenWidth - spacing[8]; // Account for margins

  const maxValue = Math.max(...data.map(d => d.value));
  
  // Format numbers for display - keeps them human readable
  const formatAxisValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    } else if (value >= 100) {
      return Math.round(value).toString();
    } else if (value >= 10) {
      return value.toFixed(1);
    } else {
      return value.toFixed(2);
    }
  };
  
  const renderBarChart = () => {
    return (
      <View style={styles.chartContainer}>
        <View style={styles.barsContainer}>
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * (height - 60);
            const barColor = item.color || designTokens.brand.primary;
            
            return (
              <View key={index} style={styles.barColumn}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar,
                      { 
                        height: barHeight,
                        backgroundColor: barColor,
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.barLabel, { color: themeColors.textMuted }]}>
                  {item.label}
                </Text>
                <Text style={[styles.barValue, { color: themeColors.text }]}>
                  {formatAxisValue(item.value)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderProgressChart = () => {
    return (
      <View style={styles.progressContainer}>
        {data.map((item, index) => {
          const progress = (item.value / maxValue) * 100;
          const progressColor = item.color || designTokens.semantic.success;
          
          return (
            <View key={index} style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: themeColors.text }]}>
                  {item.label}
                </Text>
                <Text style={[styles.progressValue, { color: progressColor }]}>
                  {item.value}%
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: themeColors.surfaces.sunken }]}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${progress}%`,
                      backgroundColor: progressColor,
                    }
                  ]} 
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderLineChart = () => {
    // Calculate proper chart dimensions
    const chartPadding = 20;
    const chartHeight = height - 80; // Reserve space for labels
    const chartRealWidth = chartWidth - (chartPadding * 2);
    
    // Calculate points with proper scaling
    const points = data.map((item, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * chartRealWidth + chartPadding;
      const normalizedValue = maxValue > 0 ? item.value / maxValue : 0;
      const y = chartHeight - (normalizedValue * chartHeight) + 40;
      return { 
        x: Math.max(chartPadding, Math.min(x, chartWidth - chartPadding)), 
        y: Math.max(40, Math.min(y, height - 40)), 
        value: item.value, 
        label: item.label 
      };
    });

    return (
      <View style={styles.lineContainer}>
        <View style={[styles.lineChart, { height }]}>
          {/* Grid lines - simplified */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <View
              key={index}
              style={[
                styles.gridLine,
                {
                  bottom: 40 + (ratio * chartHeight),
                  backgroundColor: themeColors.surfaces.shadow + '20',
                }
              ]}
            />
          ))}
          
          {/* Simplified line path using SVG-like approach */}
          {points.map((point, index) => {
            if (index === points.length - 1) return null;
            
            const nextPoint = points[index + 1];
            const deltaX = nextPoint.x - point.x;
            const deltaY = nextPoint.y - point.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
            
            return (
              <View
                key={`line-${index}`}
                style={[
                  styles.connectLine,
                  {
                    position: 'absolute',
                    left: point.x,
                    bottom: height - point.y,
                    width: distance,
                    height: 2,
                    backgroundColor: designTokens.brand.primary,
                    transformOrigin: '0 50%',
                    transform: [{ rotate: `${angle}deg` }],
                  }
                ]}
              />
            );
          })}
          
          {/* Data points */}
          {points.map((point, index) => (
            <View
              key={`point-${index}`}
              style={[
                styles.dataPoint,
                {
                  position: 'absolute',
                  left: point.x - 4,
                  bottom: height - point.y - 4,
                  backgroundColor: designTokens.brand.primary,
                }
              ]}
            />
          ))}
          
          {/* X-axis labels */}
          <View style={styles.xAxisLabels}>
            {data.map((item, index) => (
              <Text key={index} style={[styles.axisLabel, { color: themeColors.textMuted }]}>
                {item.label}
              </Text>
            ))}
          </View>
          
          {/* Y-axis value labels */}
          <View style={styles.yAxisLabels}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
              <Text 
                key={index}
                style={[
                  styles.yAxisLabel, 
                  { 
                    color: themeColors.textMuted,
                    bottom: 35 + (ratio * chartHeight),
                  }
                ]}
              >
                {formatAxisValue(ratio * maxValue)}
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'progress':
        return renderProgressChart();
      case 'line':
        return renderLineChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <View style={[styles.container, createNeumorphicContainer(theme, 'elevated')]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Chart */}
      {renderChart()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: spacing[4],
    padding: spacing[4],
    borderRadius: 20,
  },

  header: {
    marginBottom: spacing[4],
  },
  title: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  subtitle: {
    ...typography.textStyles.body,
  },

  // Bar Chart
  chartContainer: {
    flex: 1,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '60%',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    ...typography.textStyles.caption,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  barValue: {
    ...typography.textStyles.caption,
    fontWeight: '600',
    marginTop: spacing[1],
  },

  // Progress Chart
  progressContainer: {
    gap: spacing[3],
  },
  progressItem: {
    gap: spacing[2],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    ...typography.textStyles.body,
    fontWeight: '500',
  },
  progressValue: {
    ...typography.textStyles.body,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Line Chart
  lineContainer: {
    flex: 1,
  },
  lineChart: {
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 1,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectLine: {
    position: 'absolute',
    height: 2,
    transformOrigin: '0 50%',
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    ...typography.textStyles.caption,
    textAlign: 'center',
    fontSize: 10,
  },
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    width: 18,
  },
  yAxisLabel: {
    ...typography.textStyles.caption,
    fontSize: 9,
    textAlign: 'right',
    position: 'absolute',
  },
});

export default InsightChart;