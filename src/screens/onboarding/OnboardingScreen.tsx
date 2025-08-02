/**
 * Numina - Onboarding Screen
 * Minimal swipe-based onboarding with opacity transitions and staggered animations
 * Introduces users to AI personalization and behavioral middleware concepts
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { PanGestureHandler, State, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import { RainbowShimmerText } from '../../design-system/components/atoms';
import { designTokens, getThemeColors } from '../../design-system/tokens/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../design-system/tokens/typography';

const { width, height } = Dimensions.get('window');

const getStepColor = (stepIndex: number, theme: 'light' | 'dark'): string => {
  const lightColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
  const darkColors = ['#FF8A80', '#64FFDA', '#40C4FF', '#A7FFEB'];
  
  const colors = theme === 'dark' ? darkColors : lightColors;
  return colors[stepIndex] || colors[0];
};

interface OnboardingScreenProps {
  navigation: any;
  route: any;
}

interface OnboardingStep {
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  category: 'FOUNDATION' | 'CONNECTION' | 'EXPERIENCE' | 'SOCIAL';
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: "AI That Actually Remembers You",
    subtitle: "Context as a Service",
    description: "Every conversation gets scored and weighted. Your AI doesn't just see your prompt—it sees YOUR prompt, filtered through your unique cognitive signature.",
    accent: "MEMORY",
    category: "FOUNDATION"
  },
  {
    title: "The Missing Layer", 
    subtitle: "The bridge between you and AI",
    description: "Like having someone whisper in the AI's ear about how you think and communicate. Your thinking patterns become the lens through which AI understands you.",
    accent: "CONTEXT",
    category: "CONNECTION"
  },
  {
    title: "Theme Customization for Intelligence",
    subtitle: "Like themes for your phone, but for your brain", 
    description: "Every AI interaction becomes tailored to your thinking patterns and problem-solving approach. Intelligence that actually gets how your mind works.",
    accent: "PERSONALIZATION",
    category: "EXPERIENCE"
  },
  {
    title: "Authentic Social Connection",
    subtitle: "Connect based on how minds actually work",
    description: "Find people who complement your thinking style. Not based on looks or basic interests, but on genuine cognitive compatibility and communication patterns.",
    accent: "COMPATIBILITY",
    category: "SOCIAL"
  }
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation, route }) => {
  const { theme, colors } = useTheme();
  const themeColors = getThemeColors(theme);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animation refs
  const translateX = useRef(new Animated.Value(0)).current;
  const stepOpacity = useRef(new Animated.Value(0)).current;
  const categoryOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const descriptionOpacity = useRef(new Animated.Value(0)).current;
  const accentOpacity = useRef(new Animated.Value(0)).current;
  const borderOpacity = useRef(new Animated.Value(0)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  
  const panRef = useRef<PanGestureHandler>(null);

  useEffect(() => {
    animateStepIn();
  }, []);

  const animateStepIn = () => {
    // Reset all animations
    stepOpacity.setValue(0);
    categoryOpacity.setValue(0);
    titleOpacity.setValue(0);
    subtitleOpacity.setValue(0);
    descriptionOpacity.setValue(0);
    accentOpacity.setValue(0);
    borderOpacity.setValue(0);
    progressOpacity.setValue(0);

    // Advanced staggered sequence with precision timing
    const staggerDelay = 40;
    
    Animated.stagger(staggerDelay, [
      Animated.timing(stepOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(borderOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(categoryOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(titleOpacity, {
        toValue: 1,
        tension: 300,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(descriptionOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(accentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(progressOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateStepOut = (direction: 'left' | 'right', callback: () => void) => {
    setIsAnimating(true);
    
    const targetX = direction === 'left' ? -width : width;
    
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: targetX,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(stepOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      translateX.setValue(direction === 'left' ? width : -width);
      callback();
      
      // Animate in from opposite side
      Animated.timing(translateX, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
        animateStepIn();
      });
    });
  };

  const handleNextStep = () => {
    if (isAnimating) return;
    
    // Progressive haptic intensity based on step
    const hapticIntensities = [
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Medium, 
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Heavy
    ];
    
    Haptics.impactAsync(hapticIntensities[currentStep]);
    
    if (currentStep < onboardingSteps.length - 1) {
      animateStepOut('left', () => {
        setCurrentStep(currentStep + 1);
      });
    } else {
      // Final step - premium completion haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        navigation.replace('SignUp');
      }, 200);
    }
  };

  const handlePrevStep = () => {
    if (isAnimating || currentStep === 0) return;
    
    // Subtle reverse haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    animateStepOut('right', () => {
      setCurrentStep(currentStep - 1);
    });
  };

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (isAnimating) return;
    
    const { translationX } = event.nativeEvent;
    translateX.setValue(translationX * 0.3); // Dampened movement
  };

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.BEGAN) {
      // Subtle gesture start haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // Reset position with enhanced spring
      Animated.spring(translateX, {
        toValue: 0,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }).start();

      // Refined swipe thresholds for premium feel
      const swipeThreshold = width * 0.2;
      const velocityThreshold = 800;
      
      if (Math.abs(translationX) > swipeThreshold || Math.abs(velocityX) > velocityThreshold) {
        // Gesture completion haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        if (translationX > 0 || velocityX > 0) {
          // Swipe right - previous step
          handlePrevStep();
        } else {
          // Swipe left - next step
          handleNextStep();
        }
      } else {
        // Failed gesture - subtle warning haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <PageBackground theme={theme} variant="onboarding">
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />

        <PanGestureHandler
          ref={panRef}
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-20, 20]}
          failOffsetY={[-40, 40]}
        >
          <Animated.View style={styles.gestureContainer}>
            
            {/* Advanced Progress System */}
            <Animated.View style={[styles.progressContainer, { opacity: progressOpacity }]}>
              <View style={styles.progressTrack}>
                {onboardingSteps.map((step, index) => (
                  <View key={index} style={styles.progressSegment}>
                    <View
                      style={[
                        styles.progressNode,
                        {
                          backgroundColor: index === currentStep 
                            ? getStepColor(index, theme)
                            : 'transparent',
                          borderColor: index <= currentStep
                            ? getStepColor(index, theme)
                            : (theme === 'dark' ? '#333333' : '#e5e7eb'),
                          borderWidth: 1,
                        },
                      ]}
                    />
                    {index < onboardingSteps.length - 1 && (
                      <View
                        style={[
                          styles.progressConnector,
                          {
                            backgroundColor: index < currentStep
                              ? getStepColor(index, theme)
                              : (theme === 'dark' ? '#333333' : '#e5e7eb'),
                          },
                        ]}
                      />
                    )}
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Advanced Content Framework */}
            <Animated.View
              style={[
                styles.contentFrame,
                {
                  opacity: stepOpacity,
                  transform: [{ translateX }],
                },
              ]}
            >
              {/* Futuristic Border Container */}
              <Animated.View 
                style={[
                  styles.borderContainer,
                  { 
                    opacity: borderOpacity,
                    backgroundColor: theme === 'dark' ? '#1A1A1A' : '#FAFAFA',
                    borderColor: theme === 'dark' ? '#333333' : '#e5e7eb',
                    // Neumorphic bottom-right shadow
                    shadowColor: theme === 'dark' ? '#000000' : '#000000',
                    shadowOffset: { width: 3, height: 6 },
                    shadowOpacity: theme === 'dark' ? 0.4 : 0.25,
                    shadowRadius: 10,
                    elevation: 6,
                  }
                ]}
              >
                {/* Category Header */}
                <Animated.View style={[styles.categoryHeader, { opacity: categoryOpacity }]}>
                  <View style={styles.categoryIndicator}>
                    <Text style={[
                      styles.categoryText,
                      { color: theme === 'dark' ? '#666666' : '#999999' }
                    ]}>
                      {currentStepData.category}
                    </Text>
                    <View style={[
                      styles.categoryDivider,
                      { backgroundColor: theme === 'dark' ? '#333333' : '#e5e7eb' }
                    ]} />
                  </View>
                </Animated.View>

                {/* Main Title */}
                <Animated.View style={[styles.titleSection, { opacity: titleOpacity }]}>
                  <RainbowShimmerText
                    style={[
                      styles.titleText,
                      { 
                        color: theme === 'dark' ? '#E0E0E0' : '#333333',
                      }
                    ] as any}
                    intensity="normal"
                    duration={3000}
                    delay={1200}
                    waveWidth="normal"
                  >
                    {currentStepData.title}
                  </RainbowShimmerText>
                </Animated.View>

                {/* Subtitle */}
                <Animated.View style={[styles.subtitleSection, { opacity: subtitleOpacity }]}>
                  <Text
                    style={[
                      styles.subtitleText,
                      { 
                        color: theme === 'dark' ? '#999999' : '#666666',
                      }
                    ]}
                  >
                    {currentStepData.subtitle}
                  </Text>
                </Animated.View>

                {/* Technical Description */}
                <Animated.View style={[styles.descriptionSection, { opacity: descriptionOpacity }]}>
                  <Text
                    style={[
                      styles.descriptionText,
                      { 
                        color: theme === 'dark' ? '#cccccc' : '#4a4a4a',
                      }
                    ]}
                  >
                    {currentStepData.description}
                  </Text>
                </Animated.View>

                {/* Accent Footer */}
                <Animated.View style={[styles.accentFooter, { opacity: accentOpacity }]}>
                  <View style={[
                    styles.accentLine,
                    { backgroundColor: theme === 'dark' ? '#333333' : '#e5e7eb' }
                  ]} />
                  <Text style={[
                    styles.accentText,
                    { color: theme === 'dark' ? '#666666' : '#999999' }
                  ]}>
                    {currentStepData.accent}
                  </Text>
                </Animated.View>

              </Animated.View>
            </Animated.View>

            {/* Navigation Hint */}
            <Animated.View style={[styles.navigationHint, { opacity: progressOpacity }]}>
              <View style={styles.hintIndicator}>
                <View style={[
                  styles.gestureIndicator,
                  { backgroundColor: theme === 'dark' ? '#333333' : '#e5e7eb' }
                ]} />
                <Text
                  style={[
                    styles.hintText,
                    { 
                      color: theme === 'dark' ? '#666666' : '#999999',
                    }
                  ]}
                >
                  {currentStep === onboardingSteps.length - 1 ? 'Swipe to continue' : 'Swipe to continue'}
                </Text>
              </View>
            </Animated.View>

          </Animated.View>
        </PanGestureHandler>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gestureContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  
  // Advanced Progress System
  progressContainer: {
    alignItems: 'center',
    gap: 16,
    marginTop: 60,
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressSegment: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressConnector: {
    width: 24,
    height: 1,
    marginHorizontal: 4,
  },
  progressLabel: {
    ...typography.textStyles.bodyMedium,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 1.2,
    fontFamily: 'Nunito-Regular',
  },
  
  // Futuristic Content Framework
  contentFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  borderContainer: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 32,
    gap: 24,
  },
  
  // Category System
  categoryHeader: {
    alignItems: 'flex-start',
  },
  categoryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    fontFamily: 'Nunito-SemiBold',
  },
  categoryDivider: {
    height: 1,
    flex: 1,
  },
  
  // Typography Hierarchy
  titleSection: {
    alignItems: 'flex-start',
    width: '100%',
  },
  titleText: {
    ...typography.textStyles.displayMedium,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'left',
    letterSpacing: -0.8,
    lineHeight: 28,
    fontFamily: 'CrimsonPro-Bold',
  },
  subtitleSection: {
    alignItems: 'flex-start',
    width: '100%',
  },
  subtitleText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
    letterSpacing: -0.2,
    lineHeight: 18,
    fontFamily: 'Nunito-Medium',
  },
  descriptionSection: {
    alignItems: 'flex-start',
    width: '100%',
  },
  descriptionText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'left',
    lineHeight: 24,
    letterSpacing: -0.1,
    fontFamily: 'Nunito-Regular',
  },
  
  // Accent Footer
  accentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  accentLine: {
    height: 1,
    flex: 1,
  },
  accentText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    fontFamily: 'Nunito-SemiBold',
  },
  
  // Navigation System
  navigationHint: {
    alignItems: 'center',
  },
  hintIndicator: {
    alignItems: 'center',
    gap: 8,
  },
  gestureIndicator: {
    width: 32,
    height: 2,
    borderRadius: 1,
  },
  hintText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: 'Nunito-Medium',
  },
});

export default OnboardingScreen;