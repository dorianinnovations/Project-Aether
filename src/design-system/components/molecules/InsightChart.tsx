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
                  {item.value}
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
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * (chartWidth - 40);
      const y = height - 40 - ((item.value / maxValue) * (height - 80));
      return { x: x + 20, y, value: item.value, label: item.label };
    });

    return (
      <View style={styles.lineContainer}>
        <View style={[styles.lineChart, { height }]}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percentage) => (
            <View
              key={percentage}
              style={[
                styles.gridLine,
                {
                  bottom: (percentage / 100) * (height - 80) + 40,
                  backgroundColor: themeColors.surfaces.shadow + '20',
                }
              ]}
            />
          ))}
          
          {/* Data points */}
          {points.map((point, index) => (
            <View key={index}>
              <View
                style={[
                  styles.dataPoint,
                  {
                    left: point.x - 4,
                    bottom: point.y - 4,
                    backgroundColor: designTokens.brand.primary,
                  }
                ]}
              />
              {/* Connect lines */}
              {index < points.length - 1 && (
                <View
                  style={[
                    styles.connectLine,
                    {
                      left: point.x,
                      bottom: point.y,
                      width: Math.sqrt(
                        Math.pow(points[index + 1].x - point.x, 2) +
                        Math.pow(points[index + 1].y - point.y, 2)
                      ),
                      transform: [{
                        rotate: `${Math.atan2(
                          points[index + 1].y - point.y,
                          points[index + 1].x - point.x
                        )}rad`
                      }],
                      backgroundColor: designTokens.brand.primary,
                    }
                  ]}
                />
              )}
            </View>
          ))}
          
          {/* X-axis labels */}
          <View style={styles.xAxisLabels}>
            {data.map((item, index) => (
              <Text key={index} style={[styles.axisLabel, { color: themeColors.textMuted }]}>
                {item.label}
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
    transformOrigin: 'left center',
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
  },
});

export default InsightChart;