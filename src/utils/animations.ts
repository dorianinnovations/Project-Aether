/**
 * Animation utility functions for modal and UI animations
 */
import { Animated, Easing } from 'react-native';

export interface ModalAnimationRefs {
  opacity: Animated.Value;
  scale: Animated.Value;
  translateY: Animated.Value;
}

export const createModalAnimationRefs = (): ModalAnimationRefs => ({
  opacity: new Animated.Value(0),
  scale: new Animated.Value(0.95),
  translateY: new Animated.Value(10),
});

export const showModalAnimation = (refs: ModalAnimationRefs): void => {
  // Reset values
  refs.opacity.setValue(0);
  refs.scale.setValue(0.95);
  refs.translateY.setValue(10);

  // Smooth fade-in with gentle scale and slide
  Animated.parallel([
    Animated.timing(refs.opacity, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(refs.scale, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.back(1.1)), // Very subtle bounce
      useNativeDriver: true,
    }),
    Animated.timing(refs.translateY, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]).start();
};

export const hideModalAnimation = (refs: ModalAnimationRefs, onComplete?: () => void): void => {
  Animated.parallel([
    Animated.timing(refs.opacity, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(refs.scale, {
      toValue: 0.95,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(refs.translateY, {
      toValue: 5,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
  ]).start(() => {
    if (onComplete) {
      onComplete();
    }
  });
};

export const createTooltipPressAnimation = (scaleRef: Animated.Value): void => {
  Animated.sequence([
    Animated.timing(scaleRef, {
      toValue: 0.96,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.timing(scaleRef, {
      toValue: 1,
      duration: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]).start();
};