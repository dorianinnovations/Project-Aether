/**
 * Aether MetricDetailModal Component
 * Beautiful glassmorphic modal with blur effect for displaying detailed metric information
 * Features: Real blur background, snappy animations, theme support, haptic feedback
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
  Easing,
  BackHandler,
  Platform,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { FontAwesome5 } from '@expo/vector-icons';
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { getNeumorphicStyle } from '../../tokens/shadows';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MetricDetail {
  title: string;
  description: string;
  details: string;
  value: string | number;
  trendValue?: string;
}

interface MetricDetailModalProps {
  visible: boolean;
  onClose: () => void;
  metric: MetricDetail | null;
  theme?: 'light' | 'dark';
  color?: keyof typeof designTokens.semantic;
}

export const MetricDetailModal: React.FC<MetricDetailModalProps> = ({
  visible,
  onClose,
  metric,
  theme = 'light',
  color = 'info',
}) => {
  const themeColors = getThemeColors(theme);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(visible);
  const metricColor = designTokens.semantic[color];
  
  // Main modal animations
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(50)).current;
  
  // Button animations
  const closeButtonScale = useRef(new Animated.Value(1)).current;
  
  // Icon animation
  const iconScale = useRef(new Animated.Value(0)).current;

  // Cleanup animations
  const resetAnimations = useCallback(() => {
    backgroundOpacity.setValue(0);
    modalScale.setValue(0.8);
    modalOpacity.setValue(0);
    modalTranslateY.setValue(50);
    iconScale.setValue(0);
    closeButtonScale.setValue(1);
    setIsAnimating(false);
  }, []);

  // Show animation - Optimized for snappy performance
  const showModal = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    resetAnimations();
    
    // Background fade in - faster
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
    
    // Modal entrance with spring effect - snappier
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 200,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(modalTranslateY, {
        toValue: 0,
        tension: 200,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Icon bounce animation - much faster
      Animated.sequence([
        Animated.spring(iconScale, {
          toValue: 1.1,
          tension: 300,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
      
      setIsAnimating(false);
    });
  }, [isAnimating, resetAnimations]);

  // Hide animation - Fast exit for responsive feel
  const hideModal = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Super fast exit animation
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
      Animated.timing(modalTranslateY, {
        toValue: 20,
        duration: 80,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
    ]).start(() => {
      resetAnimations();
    });
  }, [isAnimating, resetAnimations]);

  // Effect to handle render state timing
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      // Delay unmounting to allow exit animation to complete
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Effect to handle visibility changes
  useEffect(() => {
    if (visible) {
      showModal();
    } else {
      hideModal();
    }
  }, [visible, showModal, hideModal]);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!isAnimating) {
          handleClose();
        }
        return true;
      });
      return () => backHandler.remove();
    }
  }, [visible, isAnimating]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetAnimations();
    };
  }, [resetAnimations]);

  const handleClose = () => {
    if (isAnimating) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Quick button feedback animation
    Animated.sequence([
      Animated.timing(closeButtonScale, {
        toValue: 0.96,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(closeButtonScale, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Get contextual icon based on metric type
  const getMetricIcon = () => {
    if (!metric) return 'chart-bar';
    
    const iconMap: Record<string, string> = {
      'Profile Confidence Level': 'user-check',
      'Detected Behavior Patterns': 'brain',
      'Communication Style Analysis': 'comments',
      'Emotional Response Patterns': 'heart',
      'Personality Trait Analysis': 'user-cog',
      'Profile Data Quality': 'database',
    };
    
    return iconMap[metric.title] || 'chart-bar';
  };

  if (!shouldRender || !metric) return null;

  return (
    <Modal
      transparent
      visible={shouldRender}
      statusBarTranslucent
      animationType="none"
    >
      <View style={styles.overlay}>
        {/* Background */}
        <Animated.View
          style={[
            styles.background,
            {
              opacity: backgroundOpacity,
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            }
          ]}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={handleClose}
            disabled={isAnimating}
          />
        </Animated.View>

        {/* Modal Content */}
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.modalWrapper,
              {
                opacity: modalOpacity,
                transform: [
                  { scale: modalScale },
                  { translateY: modalTranslateY }
                ],
              }
            ]}
          >
            <BlurView
              intensity={theme === 'dark' ? 50 : 40}
              tint={theme === 'dark' ? 'dark' : 'light'}
              style={styles.modal}
            >
            {/* Icon */}
            <Animated.View style={[
              styles.iconContainer,
              {
                backgroundColor: metricColor + '15',
                borderColor: metricColor + '30',
                transform: [{ scale: iconScale }],
              }
            ]}>
              <FontAwesome5
                name={getMetricIcon()}
                size={24}
                color={metricColor}
              />
            </Animated.View>

            {/* Title */}
            <Text style={[
              styles.title,
              typography.textStyles.headlineSmall,
              { color: themeColors.text }
            ]}>
              {metric.title}
            </Text>

            {/* Current Value */}
            <View style={styles.valueContainer}>
              <Text style={[
                styles.currentValue,
                { color: metricColor }
              ]}>
                {metric.value}
              </Text>
              {metric.trendValue && (
                <Text style={[
                  styles.trendValue,
                  { color: themeColors.textMuted }
                ]}>
                  {metric.trendValue}
                </Text>
              )}
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Description */}
              <Text style={[
                styles.description,
                typography.textStyles.bodyMedium,
                { color: themeColors.textSecondary }
              ]}>
                {metric.description}
              </Text>

              {/* Details */}
              <Text style={[
                styles.details,
                typography.textStyles.bodyMedium,
                { color: themeColors.text }
              ]}>
                {metric.details}
              </Text>
            </ScrollView>

            {/* Close Button */}
            <Animated.View style={[
              styles.closeButton,
              getNeumorphicStyle('elevated', theme),
              {
                backgroundColor: metricColor,
                transform: [{ scale: closeButtonScale }],
              }
            ]}>
              <TouchableOpacity
                onPress={handleClose}
                disabled={isAnimating}
                style={styles.closeButtonInner}
              >
                <Text style={[
                  styles.closeButtonText,
                  typography.textStyles.bodyMedium,
                  { color: '#ffffff' }
                ]}>
                  Got it
                </Text>
              </TouchableOpacity>
            </Animated.View>
            </BlurView>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Layout containers
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  
  // Modal glassmorphic styling
  modalWrapper: {
    width: Math.min(screenWidth - spacing[6], 360),
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modal: {
    padding: spacing[6],
    alignItems: 'center',
    backgroundColor: 'transparent',
    minHeight: 400,
  },
  
  // Content styling
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
    borderWidth: 1,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  valueContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  currentValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: spacing[1],
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  contentContainer: {
    width: '100%',
    maxHeight: 200,
    marginBottom: spacing[5],
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  details: {
    textAlign: 'left',
    lineHeight: 24,
  },
  closeButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  closeButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontWeight: '700',
  },
});

export default MetricDetailModal;