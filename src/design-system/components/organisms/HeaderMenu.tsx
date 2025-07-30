/**
 * Aether Header Menu Component
 * Sophisticated menu with intricate animations from numina-mobile
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  Easing,
  Modal 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { designTokens, getThemeColors, getIconColor } from '../../tokens/colors';
import { getHeaderMenuShadow } from '../../tokens/shadows';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { useTheme } from '../../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface MenuAction {
  icon: React.ReactNode;
  label: string;
  key: string;
  requiresAuth?: boolean;
  isAuthAction?: boolean;
}

const getAllMenuActions = (theme: 'light' | 'dark'): MenuAction[] => [
  { 
    icon: <Feather name="user" size={16} color={getIconColor('profile', theme)} />, 
    label: 'Profile', 
    key: 'profile', 
    requiresAuth: false 
  },
  { 
    icon: <MaterialCommunityIcons name="chat-outline" size={16} color={getIconColor('chat', theme)} />, 
    label: 'Chat', 
    key: 'chat', 
    requiresAuth: false 
  },
  { 
    icon: <Feather name="bar-chart-2" size={16} color={getIconColor('insights', theme)} />, 
    label: 'Insights', 
    key: 'insights', 
    requiresAuth: false 
  },
  { 
    icon: <Feather name="users" size={16} color={getIconColor('connections', theme)} />, 
    label: 'Connections', 
    key: 'connections', 
    requiresAuth: false 
  },
  { 
    icon: <Feather name="settings" size={16} color={getIconColor('settings', theme)} />, 
    label: 'Settings', 
    key: 'settings', 
    requiresAuth: false 
  },
  { 
    icon: <Feather name={theme === 'light' ? "moon" : "sun"} size={16} color={getIconColor('menu', theme)} />, 
    label: theme === 'light' ? 'Dark Mode' : 'Light Mode', 
    key: 'theme_toggle', 
    requiresAuth: false 
  },
  { 
    icon: <Feather name="log-out" size={16} color={getIconColor('signout', theme)} />, 
    label: 'Sign Out', 
    key: 'sign_out', 
    requiresAuth: true,
    isAuthAction: true
  },
];

const getMenuActions = (theme: 'light' | 'dark', showAuthOptions: boolean = true): MenuAction[] => {
  const allActions = getAllMenuActions(theme);
  
  if (showAuthOptions) {
    // Show all actions including auth actions when showAuthOptions is true
    return allActions;
  } else {
    // Hide auth-required actions when showAuthOptions is false
    return allActions.filter(action => !action.requiresAuth && !action.isAuthAction);
  }
};

interface HeaderMenuProps {
  visible: boolean;
  onClose: () => void;
  onAction: (key: string) => void;
  menuButtonPosition?: { x: number; y: number; width: number; height: number };
  showAuthOptions?: boolean;
}

export const HeaderMenu: React.FC<HeaderMenuProps> = ({ 
  visible, 
  onClose, 
  onAction, 
  menuButtonPosition,
  showAuthOptions = true,
}) => {
  const { theme, colors, toggleTheme } = useTheme();
  const menuActions = getMenuActions(theme, showAuthOptions);
  
  // State to prevent multiple rapid presses
  const [isAnimating, setIsAnimating] = useState(false);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  
  // Main menu animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-8)).current;
  
  // Item stagger animations
  const itemAnims = useRef(menuActions.map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(10),
    scale: new Animated.Value(0.9),
  }))).current;
  
  // Button press animations
  const buttonAnims = useRef(menuActions.map(() => ({
    scale: new Animated.Value(1),
    opacity: new Animated.Value(1),
  }))).current;

  // Cleanup function to reset all animations
  const resetAnimations = useCallback(() => {
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);
    translateYAnim.setValue(-8);
    
    itemAnims.forEach(anim => {
      anim.opacity.setValue(0);
      anim.translateY.setValue(10);
      anim.scale.setValue(0.9);
    });
    
    buttonAnims.forEach(anim => {
      anim.scale.setValue(1);
      anim.opacity.setValue(1);
    });
    
    setIsAnimating(false);
    setPressedIndex(null);
  }, [scaleAnim, opacityAnim, translateYAnim, itemAnims, buttonAnims]);

  // Show animation
  const showMenu = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    resetAnimations();
    
    // Fast container animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Gentle ladder falling haptic sequence
      menuActions.forEach((_, index) => {
        setTimeout(() => {
          if (index < 3) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else if (index < 6) {
            Haptics.selectionAsync();
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }, index * 25);
      });
      
      // Faster staggered item animations
      const itemAnimations = itemAnims.map((anim, index) => 
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 100,
            delay: index * 15,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 100,
            delay: index * 15,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.scale, {
            toValue: 1,
            duration: 100,
            delay: index * 15,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      
      Animated.stagger(15, itemAnimations).start(() => {
        setIsAnimating(false);
      });
    });
  }, [isAnimating, resetAnimations, scaleAnim, opacityAnim, translateYAnim, itemAnims]);

  // Hide animation
  const hideMenu = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Ultra-fast exit animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 80,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -8,
        duration: 120,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
        useNativeDriver: true,
      }),
      // Hide all items smoothly
      ...itemAnims.map(anim => 
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        })
      ),
    ]).start(() => {
      resetAnimations();
    });
  }, [isAnimating, scaleAnim, opacityAnim, translateYAnim, itemAnims, resetAnimations]);

  // Effect to handle visibility changes
  useEffect(() => {
    if (visible) {
      showMenu();
    } else {
      hideMenu();
    }
  }, [visible, showMenu, hideMenu]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetAnimations();
    };
  }, [resetAnimations]);

  // Button press handler
  const handleMenuButtonPress = useCallback((actionKey: string, index: number) => {
    if (isAnimating || pressedIndex !== null) return;
    
    setPressedIndex(index);
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const scaleAnim = buttonAnims[index].scale;
    const opacityAnim = buttonAnims[index].opacity;
    
    // Fast press animation
    Animated.sequence([
      // Press down
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.96,
          duration: 60,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 60,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      // Release
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setPressedIndex(null);
      
      // Handle theme toggle separately
      if (actionKey === 'theme_toggle') {
        toggleTheme();
      } else {
        onAction(actionKey);
      }
    });
  }, [isAnimating, pressedIndex, buttonAnims, onAction, toggleTheme]);

  if (!visible) return null;

  // Calculate position based on menu button
  const menuWidth = 280;
  const rightMargin = 1;
  const topMargin = 80;
  
  const menuRight = rightMargin + 20;
  const menuTop = topMargin + 50;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Background overlay that handles dismissal */}
        <TouchableOpacity 
          style={styles.backgroundOverlay}
          activeOpacity={1} 
          onPress={onClose}
          disabled={isAnimating}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                opacity: opacityAnim,
                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)',
              }
            ]}
          />
        </TouchableOpacity>
        
        {/* Menu container positioned above overlay */}
        <Animated.View
          style={[
            styles.menuContainer,
            {
              backgroundColor: theme === 'light' ? designTokens.brand.surface : designTokens.brand.surfaceDark,
              borderWidth: 1,
              borderColor: theme === 'light' ? designTokens.borders.light.default : designTokens.borders.dark.default,
              ...getHeaderMenuShadow(theme),
              position: 'absolute',
              top: menuTop,
              right: menuRight,
              width: menuWidth,
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: translateYAnim }
              ],
            }
          ]}
        >
        {/* Arrow pointing to menu button */}
        <View style={[
          styles.arrow,
          {
            borderBottomColor: theme === 'light' ? '#ffffff' : designTokens.brand.surfaceDark,
          }
        ]} />
        
        <View style={styles.menuContent}>
          {menuActions.map((action, index) => (
            <Animated.View
              key={action.key}
              style={[
                styles.menuButton,
                {
                  backgroundColor: pressedIndex === index 
                    ? (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0, 0, 0, 0.08)')
                    : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.03)'),
                  borderColor: theme === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0, 0, 0, 0.08)',
                  opacity: itemAnims[index].opacity,
                  transform: [
                    { translateY: itemAnims[index].translateY },
                    { scale: Animated.multiply(itemAnims[index].scale, buttonAnims[index].scale) },
                  ],
                }
              ]}
            >
              <TouchableOpacity
                style={styles.buttonTouchable}
                onPress={() => handleMenuButtonPress(action.key, index)}
                activeOpacity={0.8}
                disabled={isAnimating || pressedIndex !== null}
              >
                <View style={styles.iconContainer}>
                  {action.icon}
                </View>
                <Text style={[
                  styles.menuButtonText,
                  typography.textStyles.bodyMedium,
                  { color: colors.text }
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContainer: {
    borderRadius: 16,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    overflow: 'visible',
  },
  arrow: {
    position: 'absolute',
    top: -8,
    right: 31,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  menuContent: {
    paddingTop: spacing[2],
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    marginHorizontal: spacing[1],
    marginVertical: 2,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
  },
  buttonTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing[3],
  },
  menuButtonText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
});

export default HeaderMenu;