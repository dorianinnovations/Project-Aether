/**
 * Aether Design System - Auth Layout Template
 * Elegant authentication screen layout with staggered animations
 */

import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { designTokens, getThemeColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { createNeumorphicContainer } from '../../tokens/shadows';
import { createStaggeredEntrance, getInitialAnimatedValues } from '../../animations/entrance';

interface AuthLayoutProps {
  theme?: 'light' | 'dark';
  children: React.ReactNode;
  showCard?: boolean;
  variant?: 'signin' | 'signup';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AuthLayout: React.FC<AuthLayoutProps> = ({
  theme = 'light',
  children,
  showCard = true,
  variant = 'signin',
}) => {
  const themeColors = getThemeColors(theme);
  
  // Animation setup
  const animatedValues = React.useRef(getInitialAnimatedValues(3)).current;
  const [backgroundAnim, cardAnim, contentAnim] = animatedValues;

  React.useEffect(() => {
    // Staggered entrance animation sequence
    const sequence = createStaggeredEntrance(animatedValues, {
      delay: 300,
      increment: 200,
      duration: 600,
    });
    
    sequence.start();
  }, []);

  const getBackgroundStyles = () => ({
    flex: 1,
    backgroundColor: theme === 'light' 
      ? designTokens.brand.backgroundLight 
      : designTokens.brand.backgroundDark,
    opacity: backgroundAnim,
  });

  const getCardStyles = () => {
    if (!showCard) return {};
    
    return [
      createNeumorphicContainer(theme, 'elevated', 24),
      {
        marginHorizontal: spacing[4],
        padding: spacing[6],
        transform: [{
          translateY: cardAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0],
          }),
        }, {
          scale: cardAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1],
          }),
        }],
        opacity: cardAnim,
      },
    ];
  };

  const getContentStyles = () => ({
    transform: [{
      translateY: contentAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0],
      }),
    }],
    opacity: contentAnim,
  });

  // Gradient overlay for enhanced depth
  const gradientOverlay = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.4,
    backgroundColor: theme === 'light' 
      ? 'rgba(173, 213, 250, 0.05)' 
      : 'rgba(77, 150, 255, 0.08)',
  };

  const bottomGradient = {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.3,
    backgroundColor: theme === 'light' 
      ? 'rgba(153, 255, 153, 0.03)' 
      : 'rgba(153, 255, 153, 0.05)',
  };

  return (
    <Animated.View style={getBackgroundStyles()}>
      <StatusBar 
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor="transparent"
        translucent
      />
      
      {/* Gradient overlays for depth */}
      <View style={gradientOverlay} />
      <View style={bottomGradient} />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Content Container */}
            <View style={styles.contentContainer}>
              {showCard ? (
                <Animated.View style={getCardStyles()}>
                  <Animated.View style={getContentStyles()}>
                    {children}
                  </Animated.View>
                </Animated.View>
              ) : (
                <Animated.View style={getContentStyles()}>
                  {children}
                </Animated.View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing[8],
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: screenHeight * 0.6,
  },
});

export default AuthLayout;