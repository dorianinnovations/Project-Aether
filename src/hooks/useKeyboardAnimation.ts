/**
 * Custom hook for managing keyboard animations and state
 */
import { useState, useEffect, useRef } from 'react';
import { Keyboard, Animated, Easing } from 'react-native';

interface UseKeyboardAnimationReturn {
  keyboardHeight: number;
  greetingAnimY: Animated.Value;
  greetingOpacity: Animated.Value;
}

export const useKeyboardAnimation = (): UseKeyboardAnimationReturn => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const greetingAnimY = useRef(new Animated.Value(0)).current;
  const greetingOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      // Ultra-smooth spring animation for 120fps-like movement
      Animated.parallel([
        Animated.spring(greetingAnimY, {
          toValue: -120,
          tension: 300,
          friction: 25,
          useNativeDriver: true,
        }),
        Animated.timing(greetingOpacity, {
          toValue: 0.7,
          duration: 200,
          easing: Easing.bezier(0.23, 1, 0.32, 1), // Ultra-smooth easeOutQuart
          useNativeDriver: true,
        })
      ]).start();
    });

    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
      // Ultra-smooth spring animation back down with gentle settling
      Animated.parallel([
        Animated.spring(greetingAnimY, {
          toValue: 0,
          tension: 280,
          friction: 30,
          useNativeDriver: true,
        }),
        Animated.timing(greetingOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.bezier(0.165, 0.84, 0.44, 1), // Ultra-smooth easeOutQuart
          useNativeDriver: true,
        })
      ]).start();
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [greetingAnimY, greetingOpacity]);

  return {
    keyboardHeight,
    greetingAnimY,
    greetingOpacity,
  };
};