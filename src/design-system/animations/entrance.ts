/**
 * Aether Design System - Entrance Animations
 * Sophisticated staggered animation system for elegant UX
 */

import { Animated, Easing } from 'react-native';

// Animation configuration constants
export const animationConfig = {
  stagger: {
    delay: 200,        // Base delay between elements
    increment: 300,    // Additional delay per element
    duration: 500,     // Default animation duration
  },
  
  timing: {
    fast: 200,         // Quick transitions
    normal: 300,       // Standard transitions
    slow: 500,         // Deliberate transitions
    pageTransition: 400, // Screen transitions
  },
  
  easing: {
    entrance: Easing.out(Easing.cubic),      // Smooth entrance
    exit: Easing.in(Easing.cubic),           // Quick exit
    bounce: Easing.bounce,                   // Playful bounce
    spring: Easing.elastic(1.2),             // Spring effect
    smooth: Easing.bezier(0.25, 0.1, 0.25, 1), // Smooth curve
  }
};

// Staggered entrance animation for multiple elements
export const createStaggeredEntrance = (
  elements: Animated.Value[],
  config: {
    delay?: number;
    increment?: number;
    duration?: number;
    easing?: any;
  } = {}
) => {
  const {
    delay = animationConfig.stagger.delay,
    increment = animationConfig.stagger.increment,
    duration = animationConfig.stagger.duration,
    easing = animationConfig.easing.entrance
  } = config;

  const animations = elements.map((animatedValue, index) => 
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      delay: delay + (index * increment),
      easing,
      useNativeDriver: true,
    })
  );

  return Animated.stagger(increment, animations);
};

// Individual entrance animations
export const entranceAnimations = {
  // Fade in from transparent
  fadeIn: (animatedValue: Animated.Value, duration: number = animationConfig.timing.normal) => 
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: animationConfig.easing.entrance,
      useNativeDriver: true,
    }),

  // Slide in from bottom
  slideInUp: (animatedValue: Animated.Value, duration: number = animationConfig.timing.normal) =>
    Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: animationConfig.easing.entrance,
      useNativeDriver: true,
    }),

  // Slide in from right
  slideInRight: (animatedValue: Animated.Value, duration: number = animationConfig.timing.normal) =>
    Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: animationConfig.easing.entrance,
      useNativeDriver: true,
    }),

  // Scale in from small
  scaleIn: (animatedValue: Animated.Value, duration: number = animationConfig.timing.normal) =>
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: animationConfig.easing.entrance,
      useNativeDriver: true,
    }),

  // Bounce in effect
  bounceIn: (animatedValue: Animated.Value, duration: number = animationConfig.timing.slow) =>
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: animationConfig.easing.bounce,
      useNativeDriver: true,
    }),

  // Spring in effect (for special elements)
  springIn: (animatedValue: Animated.Value, duration: number = animationConfig.timing.slow) =>
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: animationConfig.easing.spring,
      useNativeDriver: true,
    }),
};

// Screen transition animations
export const screenTransitions = {
  // Screen fade transition
  fadeTransition: (animatedValue: Animated.Value) => ({
    entering: Animated.timing(animatedValue, {
      toValue: 1,
      duration: animationConfig.timing.pageTransition,
      easing: animationConfig.easing.entrance,
      useNativeDriver: true,
    }),
    exiting: Animated.timing(animatedValue, {
      toValue: 0,
      duration: animationConfig.timing.pageTransition,
      easing: animationConfig.easing.exit,
      useNativeDriver: true,
    }),
  }),

  // Slide transition (for tab navigation)
  slideTransition: (animatedValue: Animated.Value, direction: 'left' | 'right' = 'left') => ({
    entering: Animated.timing(animatedValue, {
      toValue: 0,
      duration: animationConfig.timing.pageTransition,
      easing: animationConfig.easing.smooth,
      useNativeDriver: true,
    }),
    exiting: Animated.timing(animatedValue, {
      toValue: direction === 'left' ? -100 : 100,
      duration: animationConfig.timing.pageTransition,
      easing: animationConfig.easing.smooth,
      useNativeDriver: true,
    }),
  }),
};

// Component-specific entrance sequences
export const componentSequences = {
  // Auth screen entrance (staggered form elements)
  authScreen: (elements: Animated.Value[]) => 
    createStaggeredEntrance(elements, {
      delay: 400,
      increment: 200,
      duration: 600,
    }),

  // Chat message appearance
  chatMessage: (opacity: Animated.Value, translateY: Animated.Value) =>
    Animated.parallel([
      entranceAnimations.fadeIn(opacity, 300),
      entranceAnimations.slideInUp(translateY, 300),
    ]),

  // Card reveal animation
  cardReveal: (scale: Animated.Value, opacity: Animated.Value) =>
    Animated.parallel([
      entranceAnimations.scaleIn(scale, 400),
      entranceAnimations.fadeIn(opacity, 300),
    ]),

  // Connection card special entrance
  connectionCard: (animations: {
    scale: Animated.Value;
    opacity: Animated.Value;
    glow: Animated.Value;
  }) => Animated.sequence([
    Animated.parallel([
      entranceAnimations.scaleIn(animations.scale, 500),
      entranceAnimations.fadeIn(animations.opacity, 400),
    ]),
    // Add subtle glow effect after main animation
    Animated.timing(animations.glow, {
      toValue: 1,
      duration: 300,
      easing: animationConfig.easing.smooth,
      useNativeDriver: true,
    }),
  ]),

  // Insight metric reveal
  metricReveal: (value: Animated.Value, progress: Animated.Value) =>
    Animated.sequence([
      // First reveal the container
      entranceAnimations.scaleIn(value, 400),
      // Then animate the progress/value
      Animated.timing(progress, {
        toValue: 1,
        duration: 800,
        easing: animationConfig.easing.smooth,
        useNativeDriver: false, // Often used for width/height
      }),
    ]),
};

// Utility hooks and functions
export const getInitialAnimatedValues = (count: number) => {
  return Array.from({ length: count }, () => new Animated.Value(0));
};

export const resetAnimatedValues = (values: Animated.Value[]) => {
  values.forEach(value => value.setValue(0));
};

// Transform functions for common entrance effects
export const getEntranceTransforms = (animatedValues: {
  opacity?: Animated.Value;
  translateY?: Animated.Value;
  translateX?: Animated.Value;
  scale?: Animated.Value;
  rotate?: Animated.Value;
}) => {
  const transforms: any[] = [];

  if (animatedValues.translateY) {
    transforms.push({
      translateY: animatedValues.translateY.interpolate({
        inputRange: [0, 1],
        outputRange: [30, 0], // Slide up 30px
      }),
    });
  }

  if (animatedValues.translateX) {
    transforms.push({
      translateX: animatedValues.translateX.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0], // Slide in 50px from right
      }),
    });
  }

  if (animatedValues.scale) {
    transforms.push({
      scale: animatedValues.scale.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1], // Scale from 90% to 100%
      }),
    });
  }

  if (animatedValues.rotate) {
    transforms.push({
      rotate: animatedValues.rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['5deg', '0deg'], // Subtle rotation
      }),
    });
  }

  return {
    opacity: animatedValues.opacity || 1,
    transform: transforms,
  };
};

export default {
  animationConfig,
  createStaggeredEntrance,
  entranceAnimations,
  screenTransitions,
  componentSequences,
  getInitialAnimatedValues,
  resetAnimatedValues,
  getEntranceTransforms,
};