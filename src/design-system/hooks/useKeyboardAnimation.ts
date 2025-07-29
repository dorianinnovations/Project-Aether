/**
 * Hook for smooth keyboard animations
 */

import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Animated } from 'react-native';

export interface UseKeyboardAnimationOptions {
  /** Enable the keyboard animation */
  enabled?: boolean;
  /** Custom animation duration (defaults to platform duration) */
  duration?: number;
  /** Custom easing function */
  easing?: (value: number) => number;
  /** Callback when keyboard shows */
  onShow?: (height: number) => void;
  /** Callback when keyboard hides */
  onHide?: () => void;
}

export interface UseKeyboardAnimationReturn {
  /** Current keyboard height */
  keyboardHeight: number;
  /** Is keyboard currently visible */
  isKeyboardVisible: boolean;
  /** Animated value for keyboard height */
  keyboardAnim: Animated.Value;
  /** Get transform style for moving content up */
  getTransformStyle: (factor?: number) => {
    transform: Array<{
      translateY: Animated.AnimatedInterpolation<string | number>;
    }>;
  };
  /** Get margin style for adding space */
  getMarginStyle: (factor?: number) => {
    marginBottom: Animated.AnimatedInterpolation<string | number>;
  };
  /** Get padding style for adding space */
  getPaddingStyle: (factor?: number) => {
    paddingBottom: Animated.AnimatedInterpolation<string | number>;
  };
}

export const useKeyboardAnimation = (
  options: UseKeyboardAnimationOptions = {}
): UseKeyboardAnimationReturn => {
  const {
    enabled = true,
    duration,
    easing,
    onShow,
    onHide,
  } = options;

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const keyboardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) return;

    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const newHeight = event.endCoordinates.height;
        setKeyboardHeight(newHeight);
        setIsKeyboardVisible(true);
        onShow?.(newHeight);

        Animated.timing(keyboardAnim, {
          toValue: newHeight,
          duration: duration || (Platform.OS === 'ios' ? event.duration || 250 : 250),
          easing,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        onHide?.();

        Animated.timing(keyboardAnim, {
          toValue: 0,
          duration: duration || (Platform.OS === 'ios' ? event.duration || 250 : 250),
          easing,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, [enabled, duration, easing, onShow, onHide]);

  const getTransformStyle = (factor: number = 0.15) => ({
    transform: [{
      translateY: keyboardAnim.interpolate({
        inputRange: [0, keyboardHeight || 300],
        outputRange: [0, -Math.min(keyboardHeight * factor, 50)],
        extrapolate: 'clamp',
      }),
    }],
  });

  const getMarginStyle = (factor: number = 0.08) => ({
    marginBottom: keyboardAnim.interpolate({
      inputRange: [0, keyboardHeight || 300],
      outputRange: [0, Math.min(keyboardHeight * factor, 20)],
      extrapolate: 'clamp',
    }),
  });

  const getPaddingStyle = (factor: number = 0.08) => ({
    paddingBottom: keyboardAnim.interpolate({
      inputRange: [0, keyboardHeight || 300],
      outputRange: [0, Math.min(keyboardHeight * factor, 20)],
      extrapolate: 'clamp',
    }),
  });

  return {
    keyboardHeight,
    isKeyboardVisible,
    keyboardAnim,
    getTransformStyle,
    getMarginStyle,
    getPaddingStyle,
  };
};