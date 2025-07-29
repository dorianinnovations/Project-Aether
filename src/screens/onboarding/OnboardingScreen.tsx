/**
 * Numina - Onboarding Screen
 * Techy editorial style with wheel-format card scrolling
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { designTokens } from '../../design-system/tokens/colors';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = height * 0.7;

interface OnboardingScreenProps {
  navigation: any;
}

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accent: string;
  technical: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: '1',
    title: 'Neural Pattern Recognition',
    subtitle: 'Your AI learns how you think',
    description: 'Advanced behavioral modeling algorithms analyze your communication patterns, emotional responses, and decision-making processes to create a personalized neural map.',
    icon: '🧠',
    accent: '#6366f1',
    technical: 'ML-powered pattern analysis',
  },
  {
    id: '2', 
    title: 'Contextual Memory System',
    subtitle: 'Conversations that remember',
    description: 'Dynamic memory architecture maintains conversation context across sessions, building long-term understanding of your preferences and growth patterns.',
    icon: '💭',
    accent: '#8b5cf6',
    technical: 'Vector-based memory storage',
  },
  {
    id: '3',
    title: 'Adaptive Response Engine',
    subtitle: 'Intelligence that evolves',
    description: 'Real-time response optimization adjusts communication style, depth, and approach based on your current context and historical interaction data.',
    icon: '⚡',
    accent: '#06b6d4',
    technical: 'Dynamic response calibration',
  },
  {
    id: '4',
    title: 'Emotional Intelligence Layer',
    subtitle: 'Understanding beyond words',
    description: 'Multi-dimensional emotion processing interprets subtle cues in your communication to provide empathetic and contextually appropriate responses.',
    icon: '❤️',
    accent: '#f59e0b',
    technical: 'Sentiment analysis pipeline',
  },
  {
    id: '5',
    title: 'Privacy-First Architecture',
    subtitle: 'Your data, your control',
    description: 'End-to-end encrypted processing ensures your personal data never leaves your device unprotected. Zero-trust security model with full user control.',
    icon: '🔒',
    accent: '#10b981',
    technical: 'E2E encrypted processing',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { theme, colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Animation values for staggered opacity effects
  const cardAnimations = useRef(
    onboardingSteps.map(() => ({
      cardOpacity: new Animated.Value(0.3),
      titleOpacity: new Animated.Value(0),
      subtitleOpacity: new Animated.Value(0),
      descriptionOpacity: new Animated.Value(0),
      badgeOpacity: new Animated.Value(0),
      iconOpacity: new Animated.Value(0),
      progressOpacity: new Animated.Value(0),
    }))
  ).current;

  const [isLastStep, setIsLastStep] = useState(false);

  useEffect(() => {
    // Initial animation
    setTimeout(() => {
      animateCard(0, true);
    }, 300);
  }, []);

  const animateCard = (index: number, isActive: boolean) => {
    const animation = cardAnimations[index];
    
    if (isActive) {
      // Staggered fade-in sequence for active card
      Animated.sequence([
        // Card background fades in first
        Animated.timing(animation.cardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Then staggered content elements
        Animated.stagger(120, [
          Animated.timing(animation.badgeOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animation.iconOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animation.titleOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animation.subtitleOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animation.descriptionOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animation.progressOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Quick fade-out for inactive cards
      Animated.parallel([
        Animated.timing(animation.cardOpacity, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animation.titleOpacity, {
          toValue: 0.4,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animation.subtitleOpacity, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animation.descriptionOpacity, {
          toValue: 0.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animation.badgeOpacity, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animation.iconOpacity, {
          toValue: 0.4,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animation.progressOpacity, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    
    if (index !== currentIndex && index >= 0 && index < onboardingSteps.length) {
      // Haptic feedback on card change
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Animate previous card
      animateCard(currentIndex, false);
      
      // Animate new card
      animateCard(index, true);
      
      setCurrentIndex(index);
      setIsLastStep(index === onboardingSteps.length - 1);
    }
  };

  // Navigation button opacity animations
  const nextButtonOpacity = useRef(new Animated.Value(1)).current;
  const backButtonOpacity = useRef(new Animated.Value(1)).current;

  const animateButtonPress = (buttonOpacity: Animated.Value) => {
    Animated.sequence([
      Animated.timing(buttonOpacity, {
        toValue: 0.6,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const goToNext = () => {
    animateButtonPress(nextButtonOpacity);
    
    if (currentIndex < onboardingSteps.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * CARD_WIDTH,
        animated: true,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      handleGetStarted();
    }
  };

  const goToPrevious = () => {
    if (currentIndex === 0) return;
    
    animateButtonPress(backButtonOpacity);
    const prevIndex = currentIndex - 1;
    scrollViewRef.current?.scrollTo({
      x: prevIndex * CARD_WIDTH,
      animated: true,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleGetStarted = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.replace('SignUp');
  };

  const renderCard = (step: OnboardingStep, index: number) => {
    const animation = cardAnimations[index];
    
    return (
      <View key={step.id} style={styles.card}>
        <Animated.View style={[
          styles.cardContent,
          {
            backgroundColor: theme === 'dark' ? '#0a0a0a' : '#ffffff',
            borderColor: theme === 'dark' ? '#262626' : '#e5e5e5',
            opacity: animation.cardOpacity,
          }
        ]}>
          {/* Technical badge with staggered opacity */}
          <Animated.View 
            style={[
              styles.technicalBadge, 
              { 
                backgroundColor: step.accent + '20',
                opacity: animation.badgeOpacity,
              }
            ]}
          >
            <Text style={[styles.technicalText, { color: step.accent }]}>
              {step.technical}
            </Text>
          </Animated.View>

          {/* Icon with staggered opacity */}
          <Animated.View 
            style={[
              styles.iconContainer,
              { opacity: animation.iconOpacity }
            ]}
          >
            <Text style={styles.icon}>{step.icon}</Text>
          </Animated.View>

          {/* Content with individual opacity controls */}
          <View style={styles.textContent}>
            <Animated.Text style={[
              styles.title,
              { 
                color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
                opacity: animation.titleOpacity,
              }
            ]}>
              {step.title}
            </Animated.Text>
            
            <Animated.Text style={[
              styles.subtitle,
              { 
                color: step.accent,
                opacity: animation.subtitleOpacity,
              }
            ]}>
              {step.subtitle}
            </Animated.Text>
            
            <Animated.Text style={[
              styles.description,
              { 
                color: theme === 'dark' ? '#a3a3a3' : '#525252',
                opacity: animation.descriptionOpacity,
              }
            ]}>
              {step.description}
            </Animated.Text>
          </View>

          {/* Progress indicator with staggered opacity */}
          <Animated.View 
            style={[
              styles.progressContainer,
              { opacity: animation.progressOpacity }
            ]}
          >
            <View style={styles.progressBar}>
              {onboardingSteps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: i === index 
                        ? step.accent 
                        : theme === 'dark' ? '#333333' : '#d1d5db',
                      width: i === index ? 24 : 8,
                    }
                  ]}
                />
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    );
  };

  return (
    <PageBackground theme={theme} variant="onboarding">
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* Header */}
        <View style={styles.header}>
          <Text style={[
            styles.headerTitle,
            { color: theme === 'dark' ? '#ffffff' : '#1a1a1a' }
          ]}>
            Numina
          </Text>
          <Text style={[
            styles.headerSubtitle,
            { color: theme === 'dark' ? '#a3a3a3' : '#525252' }
          ]}>
            Adaptive Intelligence System
          </Text>
        </View>

        {/* Card Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { 
                useNativeDriver: false,
                listener: handleScroll,
              }
            )}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollContent}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH}
            snapToAlignment="center"
          >
            {onboardingSteps.map((step, index) => renderCard(step, index))}
          </ScrollView>
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <Animated.View style={{ opacity: backButtonOpacity }}>
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.backButton,
                {
                  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f3f4f6',
                  opacity: currentIndex === 0 ? 0.3 : 1,
                }
              ]}
              onPress={goToPrevious}
              disabled={currentIndex === 0}
              activeOpacity={1} // Remove default opacity change
            >
              <Text style={[
                styles.navButtonText,
                { color: theme === 'dark' ? '#ffffff' : '#374151' }
              ]}>
                Back
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.stepIndicator}>
            <Text style={[
              styles.stepText,
              { color: theme === 'dark' ? '#a3a3a3' : '#6b7280' }
            ]}>
              {currentIndex + 1} of {onboardingSteps.length}
            </Text>
          </View>

          <Animated.View style={{ opacity: nextButtonOpacity }}>
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.nextButton,
                {
                  backgroundColor: onboardingSteps[currentIndex]?.accent || designTokens.brand.primary,
                }
              ]}
              onPress={goToNext}
              activeOpacity={1} // Remove default opacity change
            >
              <Text style={[styles.navButtonText, { color: '#ffffff' }]}>
                {isLastStep ? 'Get Started' : 'Next'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 20,
  },
  headerTitle: {
    ...typography.textStyles.displayMedium,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...typography.textStyles.bodyMedium,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: (width - CARD_WIDTH) / 2,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: spacing[2],
  },
  cardContent: {
    flex: 1,
    borderRadius: 24,
    padding: spacing[6],
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    justifyContent: 'space-between',
  },
  technicalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: spacing[4],
  },
  technicalText: {
    ...typography.textStyles.labelSmall,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing[2],
  },
  textContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...typography.textStyles.displaySmall,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing[2],
    lineHeight: 30,
  },
  subtitle: {
    ...typography.textStyles.headlineMedium,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  description: {
    ...typography.textStyles.bodyLarge,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: spacing[2],
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: spacing[4],
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
    transition: 'all 0.3s ease',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    paddingBottom: Platform.OS === 'ios' ? spacing[6] : spacing[4],
  },
  navButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    // Additional back button styles
  },
  nextButton: {
    // Additional next button styles
  },
  navButtonText: {
    ...typography.textStyles.labelMedium,
    fontSize: 16,
    fontWeight: '600',
  },
  stepIndicator: {
    flex: 1,
    alignItems: 'center',
  },
  stepText: {
    ...typography.textStyles.labelSmall,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default OnboardingScreen;