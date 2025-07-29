/**
 * Aether Enhanced Swipeable Tab Bar
 * Integrates with header menu system for seamless navigation
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import {
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { getNeumorphicStyle } from '../../tokens/shadows';
import Icon from '../atoms/Icon';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface EnhancedSwipeableTabBarProps extends BottomTabBarProps {
  theme?: 'light' | 'dark';
  isHidden?: boolean;
  onToggle?: (hidden: boolean) => void;
  onRevealHeaderMenu?: () => void;
  swipeToRevealThreshold?: number;
}

export const EnhancedSwipeableTabBar: React.FC<EnhancedSwipeableTabBarProps> = ({
  state,
  descriptors,
  navigation,
  theme = 'light',
  isHidden = false,
  onToggle,
  onRevealHeaderMenu,
  swipeToRevealThreshold = 0.3, // 30% of screen height
}) => {
  const themeColors = getThemeColors(theme);
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);
  const [lastSwipeY, setLastSwipeY] = useState(0);
  
  // Animations
  const translateY = useRef(new Animated.Value(isHidden ? 100 : 0)).current;
  const indicatorScale = useRef(new Animated.Value(isHidden ? 0 : 1)).current;
  const swipeIndicatorOpacity = useRef(new Animated.Value(0)).current;
  const buttonScales = useRef(
    state.routes.map(() => new Animated.Value(1))
  ).current;

  // Animate tab bar visibility
  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: isHidden ? 100 : 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(indicatorScale, {
        toValue: isHidden ? 0 : 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, [isHidden]);

  // Handle swipe gesture for tab bar and header menu reveal
  const handleSwipeGesture = (event: any) => {
    const { translationY, velocityY, state: gestureState, absoluteY } = event.nativeEvent;
    
    if (gestureState === State.BEGAN) {
      setIsSwipeInProgress(true);
      setLastSwipeY(absoluteY);
    }
    
    if (gestureState === State.ACTIVE) {
      // Show swipe indicator when swiping up significantly
      const swipeProgress = Math.max(0, Math.min(1, -translationY / (screenHeight * swipeToRevealThreshold)));
      
      Animated.timing(swipeIndicatorOpacity, {
        toValue: swipeProgress > 0.1 ? swipeProgress : 0,
        duration: 50,
        useNativeDriver: true,
      }).start();
    }

    if (gestureState === State.END) {
      setIsSwipeInProgress(false);
      
      // Hide swipe indicator
      Animated.timing(swipeIndicatorOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      const shouldHide = translationY > 30 || velocityY > 500;
      const shouldShow = translationY < -30 || velocityY < -500;
      const shouldRevealHeaderMenu = translationY < -100 || velocityY < -800;

      // Priority: Header menu reveal > Tab bar show/hide
      if (shouldRevealHeaderMenu && onRevealHeaderMenu) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onRevealHeaderMenu();
      } else if (shouldHide && !isHidden) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle?.(true);
      } else if (shouldShow && isHidden) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle?.(false);
      }
    }
  };

  const handleIndicatorPress = () => {
    if (isHidden) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggle?.(false);
    }
  };

  const handleTabPress = (route: any, index: number) => {
    const isFocused = state.index === index;
    
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        // Animate button press
        Animated.sequence([
          Animated.timing(buttonScales[index], {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(buttonScales[index], {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
          }),
        ]).start();
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate(route.name);
      }
    };

    const onLongPress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    return { onPress, onLongPress };
  };

  const renderTabItem = (route: any, index: number) => {
    const { options } = descriptors[route.key];
    const label = options.tabBarLabel || route.name;
    const isFocused = state.index === index;
    const { onPress, onLongPress } = handleTabPress(route, index);

    const icon = options.tabBarIcon?.({
      focused: isFocused,
      color: isFocused ? designTokens.brand.primary : themeColors.textMuted,
      size: 24,
    });

    return (
      <Animated.View
        key={route.key}
        style={[
          styles.tabItem,
          { transform: [{ scale: buttonScales[index] }] }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabButton,
            isFocused && [
              getNeumorphicStyle('subtle', theme),
              { backgroundColor: designTokens.brand.primary + '15' }
            ]
          ]}
          onPress={onPress}
          onLongPress={onLongPress}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconContainer}>
            {icon}
          </View>
          <Text
            style={[
              styles.tabLabel,
              typography.textStyles.caption,
              {
                color: isFocused ? designTokens.brand.primary : themeColors.textMuted,
                fontWeight: isFocused ? '600' : '500',
              },
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSwipeIndicator = () => (
    <Animated.View
      style={[
        styles.swipeIndicator,
        {
          backgroundColor: themeColors.textMuted,
          transform: [{ scaleX: indicatorScale }],
        },
      ]}
    />
  );

  const renderSwipeUpIndicator = () => (
    <Animated.View
      style={[
        styles.swipeUpIndicator,
        {
          opacity: swipeIndicatorOpacity,
          backgroundColor: designTokens.brand.primary + '20',
          borderColor: designTokens.brand.primary + '40',
        }
      ]}
    >
      <Icon
        name="menu"
        size="sm"
        color={designTokens.brand.primary}
        theme={theme}
      />
      <Text style={[
        styles.swipeUpText,
        typography.textStyles.caption,
        { color: designTokens.brand.primary }
      ]}>
        Swipe up for menu
      </Text>
    </Animated.View>
  );

  return (
    <>
      {/* Swipe Up Indicator - shows during swipe gesture */}
      {renderSwipeUpIndicator()}

      {/* Swipe Indicator - only show when tab bar is hidden */}
      {isHidden && (
        <TouchableOpacity 
          style={styles.swipeArea}
          onPress={handleIndicatorPress}
          activeOpacity={0.8}
        >
          <Animated.View>
            {renderSwipeIndicator()}
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Tab Bar */}
      <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
        <Animated.View
          style={[
            styles.tabBar,
            getGlassmorphicStyle('overlay', theme),
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.tabBarContent}>
            {state.routes.map((route, index) => renderTabItem(route, index))}
          </View>
          
          {/* Visual separator/handle for dragging */}
          <View style={[
            styles.dragHandle,
            { backgroundColor: themeColors.textMuted + '40' }
          ]} />
        </Animated.View>
      </PanGestureHandler>
    </>
  );
};

const styles = StyleSheet.create({
  // Swipe Up Indicator
  swipeUpIndicator: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -60 }],
    width: 120,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    gap: spacing[1],
  },
  swipeUpText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Tab Bar
  tabBar: {
    position: 'absolute',
    bottom: spacing[4],
    left: spacing[4],
    right: spacing[4],
    borderRadius: 20,
    paddingTop: spacing[1],
    paddingBottom: Platform.OS === 'ios' ? spacing[6] : spacing[3],
    paddingHorizontal: spacing[2],
  },
  tabBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing[1],
    marginBottom: spacing[1],
  },

  // Tab Items
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: 12,
    minHeight: 56,
    width: '100%',
  },
  tabIconContainer: {
    marginBottom: spacing[1],
  },
  tabLabel: {
    fontSize: 10,
    textAlign: 'center',
  },

  // Swipe Indicator
  swipeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
});

export default EnhancedSwipeableTabBar;