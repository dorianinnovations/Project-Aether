/**
 * Numina Header Component
 * Sophisticated header with animations adapted from numina-mobile
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { designTokens, getThemeColors, getStandardBorder } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { getNeumorphicStyle } from '../../tokens/shadows';
import { AnimatedHamburger } from '../atoms/AnimatedHamburger';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showConversationsButton?: boolean;
  showQuickAnalyticsButton?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onConversationsPress?: () => void;
  onQuickAnalyticsPress?: () => void;
  onTitlePress?: () => void;
  theme?: 'light' | 'dark';
  isVisible?: boolean;
  isActive?: boolean;
  isMenuOpen?: boolean;
  style?: any;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Numina',
  subtitle,
  showBackButton = false,
  showMenuButton = true,
  showConversationsButton = false,
  showQuickAnalyticsButton = false,
  onBackPress,
  onMenuPress,
  onConversationsPress,
  onQuickAnalyticsPress,
  onTitlePress,
  theme = 'light',
  isVisible = true,
  isActive = false,
  isMenuOpen = false,
  style,
}) => {
  const themeColors = getThemeColors(theme as 'light' | 'dark');
  const [backPressed, setBackPressed] = useState(false);
  const [menuPressed, setMenuPressed] = useState(false);
  const [conversationsPressed, setConversationsPressed] = useState(false);
  const [analyticsPressed, setAnalyticsPressed] = useState(false);

  // Animations
  const visibilityAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const menuButtonScale = useRef(new Animated.Value(1)).current;
  const conversationsButtonScale = useRef(new Animated.Value(1)).current;
  const analyticsButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(visibilityAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  const createButtonPressHandler = (
    scaleAnim: Animated.Value,
    setPressed: (pressed: boolean) => void,
    onPress?: () => void
  ) => () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    setPressed(true);
    setTimeout(() => {
      setPressed(false);
      onPress?.();
    }, 150);
  };

  const handleBackPress = createButtonPressHandler(backButtonScale, setBackPressed, onBackPress);
  
  // Subtle anticipatory hamburger press handler
  const handleMenuPress = () => {
    // Quick, subtle haptic for immediate responsiveness
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.sequence([
      Animated.timing(menuButtonScale, {
        toValue: 0.95,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.spring(menuButtonScale, {
        toValue: 1,
        friction: 6,
        tension: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setMenuPressed(true);
    setTimeout(() => {
      setMenuPressed(false);
      onMenuPress?.();
    }, 80);
  };
  
  const handleConversationsPress = createButtonPressHandler(conversationsButtonScale, setConversationsPressed, onConversationsPress);
  const handleAnalyticsPress = createButtonPressHandler(analyticsButtonScale, setAnalyticsPressed, onQuickAnalyticsPress);

  const renderButton = (
    iconName: string,
    iconLibrary: 'Feather' | 'MaterialCommunityIcons',
    color: string,
    scale: Animated.Value,
    onPress: () => void,
    isPressed: boolean
  ) => {
    const IconComponent = iconLibrary === 'Feather' ? Feather : MaterialCommunityIcons;
    
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={[
            styles.iconButton,
            {
              backgroundColor: isPressed ? 'rgba(255,255,255,0.1)' : 'transparent',
            }
          ]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <IconComponent
            name={iconName as any}
            size={20}
            color={color}
            style={{ opacity: isPressed ? 0.7 : 1 }}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.header,
        {
          backgroundColor: theme === 'light' ? designTokens.brand.surface : designTokens.brand.surfaceDark,
          ...getStandardBorder(theme),
          opacity: visibilityAnim,
          transform: [{
            translateY: visibilityAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            }),
          }],
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          <TouchableOpacity
            style={styles.titleContainer}
            onPress={onTitlePress}
            activeOpacity={onTitlePress ? 0.7 : 1}
            disabled={!onTitlePress}
          >
            <View style={styles.titleRow}>
              <View style={styles.titleWithCloudContainer}>
                {/* Cloud icon positioned behind and offset to the left */}
                <Image
                  source={require('../../../../assets/icon.png')}
                  style={[
                    styles.backgroundCloudIcon,
                    {
                      shadowColor: theme === 'dark' ? '#000000' : '#666666',
                      shadowOffset: { width: 0, height: theme === 'dark' ? 8 : 4 },
                      shadowOpacity: theme === 'dark' ? 0.25 : 0.4,
                      shadowRadius: theme === 'dark' ? 12 : 8,
                      elevation: theme === 'dark' ? 16 : 12,
                    }
                  ]}
                  resizeMode="contain"
                />
              </View>
              {isActive && (
                <LottieView
                  source={require('../../../../assets/GreenActiveIndicatorLottie.json')}
                  autoPlay
                  loop
                  style={styles.activeIndicator}
                />
              )}
            </View>
            {subtitle && (
              <Text style={[
                styles.subtitle,
                typography.textStyles.caption,
                { color: themeColors.textSecondary }
              ]}>
                {subtitle}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {showBackButton && renderButton(
            'arrow-left',
            'Feather',
            theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
            backButtonScale,
            handleBackPress,
            backPressed
          )}

          {showConversationsButton && renderButton(
            'message-square',
            'Feather',
            theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
            conversationsButtonScale,
            handleConversationsPress,
            conversationsPressed
          )}

          {showQuickAnalyticsButton && renderButton(
            'lightning-bolt',
            'MaterialCommunityIcons',
            theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
            analyticsButtonScale,
            handleAnalyticsPress,
            analyticsPressed
          )}

          {showMenuButton && (
            <Animated.View style={{ transform: [{ scale: menuButtonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: menuPressed ? 'rgba(255,255,255,0.1)' : 'transparent',
                  }
                ]}
                onPress={handleMenuPress}
                activeOpacity={0.8}
              >
                <AnimatedHamburger
                  isOpen={isMenuOpen}
                  color={theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary}
                  size={20}
                />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    left: spacing[6],
    right: spacing[6],
    zIndex: 100,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
    overflow: 'visible',
  },
  titleContainer: {
    alignItems: 'flex-start',
    overflow: 'visible',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    overflow: 'visible',
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  titleWithCloudContainer: {
    position: 'relative',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: 200,
    height: 30,
    paddingLeft: 15,
    paddingRight: 30,
    overflow: 'visible',
  },
  backgroundCloudIcon: {
    position: 'absolute',
    left: 0,
    top: -8,
    width: 65,
    height: 50,
    opacity: 1,
    zIndex: 0,
  },
  titleWithCloudBehind: {
    position: 'relative',
    fontWeight: '700',
    letterSpacing: -0.5,
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    zIndex: 2,
    textAlign: 'left',
    marginTop: 0,
    paddingLeft: 8,
  },
  activeIndicator: {
    width: 22,
    height: 22,
  },
  subtitle: {
    marginTop: 2,
    opacity: 0.7,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Header;