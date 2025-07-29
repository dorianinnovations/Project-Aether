/**
 * Aether Design System - Animated Auth Status Component
 * Loading, success, and error states with smooth animations
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface AnimatedAuthStatusProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  color?: string;
  size?: number;
  onAnimationComplete?: () => void;
}

export const AnimatedAuthStatus: React.FC<AnimatedAuthStatusProps> = ({
  status,
  color = '#ffffff',
  size = 16,
  onAnimationComplete,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'loading') {
      // Continuous rotation for loading
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();

      return () => rotateAnimation.stop();
    } else if (status === 'success') {
      // Success animation: scale up then back
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Fade out after success animation
        setTimeout(() => {
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(onAnimationComplete);
        }, 500);
      });
    } else if (status === 'error') {
      // Error animation: shake effect
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Fade out after error animation
        setTimeout(() => {
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(onAnimationComplete);
        }, 1500);
      });
    } else {
      // Reset animations for idle state
      rotateAnim.setValue(0);
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [status]);

  const getRotation = () => {
    return rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
  };

  const getIconName = () => {
    switch (status) {
      case 'loading':
        return 'loader';
      case 'success':
        return 'check';
      case 'error':
        return 'x';
      default:
        return 'loader';
    }
  };

  if (status === 'idle') {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { rotate: status === 'loading' ? getRotation() : '0deg' },
          ],
        },
      ]}
    >
      <Feather
        name={getIconName()}
        size={size}
        color={color}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AnimatedAuthStatus;