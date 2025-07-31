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
  TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
  showSearchButton?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onConversationsPress?: () => void;
  onQuickAnalyticsPress?: () => void;
  onTitlePress?: () => void;
  onSearchPress?: () => void;
  theme?: 'light' | 'dark';
  isVisible?: boolean;
  isMenuOpen?: boolean;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  style?: any;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Numina',
  subtitle,
  showBackButton = false,
  showMenuButton = true,
  showConversationsButton = false,
  showQuickAnalyticsButton = false,
  showSearchButton = false,
  onBackPress,
  onMenuPress,
  onConversationsPress,
  onQuickAnalyticsPress,
  onTitlePress,
  onSearchPress,
  theme = 'light',
  isVisible = true,
  isMenuOpen = false,
  showSearch = false,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  style,
}) => {
  const themeColors = getThemeColors(theme as 'light' | 'dark');
  const [backPressed, setBackPressed] = useState(false);
  const [menuPressed, setMenuPressed] = useState(false);
  const [conversationsPressed, setConversationsPressed] = useState(false);
  const [analyticsPressed, setAnalyticsPressed] = useState(false);
  const [searchPressed, setSearchPressed] = useState(false);

  // Animations
  const visibilityAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const menuButtonScale = useRef(new Animated.Value(1)).current;
  const conversationsButtonScale = useRef(new Animated.Value(1)).current;
  const analyticsButtonScale = useRef(new Animated.Value(1)).current;
  const searchButtonScale = useRef(new Animated.Value(1)).current;
  const searchFadeAnim = useRef(new Animated.Value(0)).current;
  const titleFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(visibilityAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  // Animate search/title transition
  useEffect(() => {
    if (showSearch) {
      // Fade out title, then fade in search
      Animated.sequence([
        Animated.timing(titleFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(searchFadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out search, then fade in title
      Animated.sequence([
        Animated.timing(searchFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(titleFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSearch]);

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
  const handleSearchPress = createButtonPressHandler(searchButtonScale, setSearchPressed, onSearchPress);

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

  // Count total buttons (INCLUDING menu button since it affects layout)
  const nonMenuButtonCount = [showBackButton, showConversationsButton, showQuickAnalyticsButton, showSearchButton].filter(Boolean).length;
  const totalButtons = showMenuButton ? nonMenuButtonCount + 1 : nonMenuButtonCount;
  const shouldSplit = totalButtons >= 2;

  // Left buttons (when splitting or when back button is present)
  const leftButtonsRender = (shouldSplit || showBackButton) ? (
    <View style={styles.leftSection}>
      {showBackButton && renderButton(
        'arrow-left',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        backButtonScale,
        handleBackPress,
        backPressed
      )}
      {shouldSplit && showConversationsButton && renderButton(
        'message-square',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        conversationsButtonScale,
        handleConversationsPress,
        conversationsPressed
      )}
      {shouldSplit && showSearchButton && renderButton(
        'search',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        searchButtonScale,
        handleSearchPress,
        searchPressed
      )}
    </View>
  ) : (
    <View style={styles.leftSpacer} />
  );

  // Right buttons (always includes menu, plus others when not splitting)
  const rightButtonsRender = (
    <View style={styles.rightSection}>
      {!shouldSplit && !showBackButton && showConversationsButton && renderButton(
        'message-square',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        conversationsButtonScale,
        handleConversationsPress,
        conversationsPressed
      )}

      {!shouldSplit && showSearchButton && renderButton(
        'search',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        searchButtonScale,
        handleSearchPress,
        searchPressed
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
  );

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
        {leftButtonsRender}
        
        {/* Center Section - Logo or Search */}
        <View style={styles.centerSection}>
          {/* Search Container - Always rendered but animated */}
          <Animated.View style={[
            styles.searchContainer,
            {
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              opacity: searchFadeAnim,
              transform: [{
                scale: searchFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }],
              position: showSearch ? 'relative' : 'absolute',
              zIndex: showSearch ? 1 : 0,
            }
          ]}>
            <Feather 
              name="search" 
              size={16} 
              color={themeColors.textMuted} 
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder={searchPlaceholder}
              placeholderTextColor={themeColors.textMuted}
              autoFocus={showSearch}
              onBlur={() => {
                // Hide search when input loses focus
                onSearchPress?.();
              }}
            />
          </Animated.View>

          {/* Title Container - Always rendered but animated */}
          <Animated.View style={[
            styles.titleContainer,
            {
              opacity: titleFadeAnim,
              transform: [{
                scale: titleFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }],
              position: !showSearch ? 'relative' : 'absolute',
              zIndex: !showSearch ? 1 : 0,
            }
          ]}>
            <TouchableOpacity
              onPress={onTitlePress}
              activeOpacity={onTitlePress ? 0.7 : 1}
              disabled={!onTitlePress || showSearch}
            >
              <View style={styles.titleRow}>
                <Text style={[
                  styles.title,
                  typography.textStyles.headlineMedium,
                  { color: themeColors.text }
                ]}>
                  {title}
                </Text>
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
          </Animated.View>
        </View>

        {/* Right Section */}
        {rightButtonsRender}
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
  leftSpacer: {
    flex: 1,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing[2],
    overflow: 'visible',
  },
  titleContainer: {
    alignItems: 'center',
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
  subtitle: {
    marginTop: 2,
    opacity: 0.7,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing[2],
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    height: 36,
    minWidth: 260,
    maxWidth: 300,
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
});

export default Header;