/**
 * Numina - Settings Modal
 * Beautiful glassmorphic settings panel with brick-style buttons
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
  Dimensions,
  Alert,
  Share,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';

// Design System
import { designTokens, getThemeColors, getBorderStyle, getIconColor } from '../../design-system/tokens/colors';
import { colorPatterns } from '../../design-system/tokens/color-patterns';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { getGlassmorphicStyle, getBrickButtonStyle } from '../../design-system/tokens/glassmorphism';
import Icon from '../../design-system/components/atoms/Icon';

// Contexts
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../hooks/useSettings';

// Services
import { AuthAPI, TokenManager, UserAPI, ConversationAPI } from '../../services/api';
import SettingsStorage from '../../services/settingsStorage';

// Components
import { SignOutModal } from '../../design-system/components/organisms/SignOutModal';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSignOut?: () => void;
  navigation?: any;
}


const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onSignOut,
  navigation,
}) => {
  const { theme, colors, toggleTheme } = useTheme();
  const { settings: globalSettings, updateSetting } = useSettings();
  // Local state for settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  // New settings
  const [reduceMotion, setReduceMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [keepScreenOn, setKeepScreenOn] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [autoLock, setAutoLock] = useState(true);
  const [backgroundType, setBackgroundType] = useState<'blue' | 'white'>('blue');
  const [dynamicOptions, setDynamicOptions] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubDrawer, setActiveSubDrawer] = useState<string | null>(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  // Animation refs
  const subDrawerAnim = useRef(new Animated.Value(0)).current;
  const mainContentAnim = useRef(new Animated.Value(0)).current;
  
  // Staggered animation refs for settings modal
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const accountSectionOpacity = useRef(new Animated.Value(0)).current;
  const categoriesSectionOpacity = useRef(new Animated.Value(0)).current;
  const quickActionsOpacity = useRef(new Animated.Value(0)).current;
  
  // Sub-drawer animation refs
  const subDrawerHeaderOpacity = useRef(new Animated.Value(0)).current;
  const subDrawerItemsOpacity = useRef(new Animated.Value(0)).current;
  
  // Timeout refs for cleanup
  const animationTimeouts = useRef<NodeJS.Timeout[]>([]).current;

  // Rainbow pastel icon colors in proper descending order starting from red
  const getSettingsIconColor = (index: number): string => {
    const colors = [
      '#FF6B6B', // Red (pastel)
      '#FF8E6B', // Red-Orange (pastel)
      '#FFB366', // Orange (pastel)
      '#FFD93D', // Yellow (pastel)
      '#6BCF7F', // Green (pastel)
      '#4ECDC4', // Teal (pastel)
      '#45B7D1', // Sky Blue (pastel)
      '#667EEA', // Blue (pastel)
      '#764BA2', // Indigo (pastel)
      '#A8E6CF', // Mint Green (pastel)
      '#FFB3BA', // Pink (pastel)
      '#FFDFBA', // Peach (pastel)
      '#FFFFBA', // Light Yellow (pastel)
      '#BAFFC9', // Light Green (pastel)
      '#BAE1FF', // Light Blue (pastel)
      '#C7CEEA', // Lavender (pastel)
      '#F8B2E3', // Hot Pink (pastel)
      '#FFC0CB', // Classic Pink (pastel)
      '#E6E6FA', // Lavender Gray (pastel)
      '#F0E68C', // Khaki (pastel)
      '#DDA0DD', // Plum (pastel)
      '#98FB98', // Pale Green (pastel)
      '#F0F8FF', // Alice Blue (pastel)
      '#FFEFD5', // Papaya Whip (pastel)
    ];
    return colors[index % colors.length];
  };

  // Sub-drawer sections
  const subDrawerSections = {
    appearance: {
      title: 'Appearance',
      icon: 'sliders',
      description: 'Theme and dynamic options',
      items: [
        { key: 'theme', label: 'Dark Mode', value: theme === 'dark', type: 'switch' },
        { key: 'dynamicOptions', label: 'Dynamic Options', value: dynamicOptions, type: 'switch' },
        { key: 'backgroundType', label: 'Background Style', value: backgroundType, type: 'selector' },
      ]
    },
    accessibility: {
      title: 'Accessibility',
      icon: 'eye',
      description: 'Visual and interaction aids',
      items: [
        { key: 'highContrast', label: 'High Contrast', value: highContrast, type: 'switch' },
        { key: 'largeText', label: 'Large Text', value: largeText, type: 'switch' },
        { key: 'reduceMotion', label: 'Reduce Motion', value: reduceMotion, type: 'switch' },
      ]
    },
    notifications: {
      title: 'Notifications',
      icon: 'bell',
      description: 'Push alerts, sounds, haptics',
      items: [
        { key: 'notifications', label: 'Push Notifications', value: notificationsEnabled, type: 'switch' },
        { key: 'sound', label: 'Sound Effects', value: soundEnabled, type: 'switch' },
        { key: 'haptics', label: 'Haptic Feedback', value: hapticsEnabled, type: 'switch' },
      ]
    },
    display: {
      title: 'Display',
      icon: 'monitor',
      description: 'Screen and visual settings',
      items: [
        { key: 'keepScreenOn', label: 'Keep Screen On', value: keepScreenOn, type: 'switch' },
        { key: 'showTimestamps', label: 'Show Timestamps', value: showTimestamps, type: 'switch' },
      ]
    },
    privacy: {
      title: 'Privacy & Data',
      icon: 'shield',
      description: 'Analytics, backups, data control',
      items: [
        { key: 'analytics', label: 'Analytics', value: analyticsEnabled, type: 'switch' },
        { key: 'autoSave', label: 'Auto-Save Chats', value: autoSaveEnabled, type: 'switch' },
        { key: 'autoLock', label: 'Auto-Lock', value: autoLock, type: 'switch' },
        { key: 'exportData', label: 'Export Data', type: 'action' },
        { key: 'clearData', label: 'Clear All Data', type: 'action', destructive: true },
      ]
    },
  };
  
  
  const glassmorphicOverlay = getGlassmorphicStyle('overlay', theme);
  const brickStyle = getBrickButtonStyle(theme);
  const borderStyle = getBorderStyle(theme, 'default');

  // Load settings and auth state on mount
  useEffect(() => {
    loadSettings();
    checkAuthState();
  }, []);

  // Sync local background type with global settings
  useEffect(() => {
    setBackgroundType(globalSettings.backgroundType);
  }, [globalSettings.backgroundType]);

  // Cleanup animation timeouts on unmount
  useEffect(() => {
    return () => {
      animationTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Animate modal content in when visible
  useEffect(() => {
    if (visible) {
      // Haptic feedback when modal opens
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      animateModalSequence();
    } else {
      // Reset all animations when modal is hidden
      headerOpacity.setValue(0);
      accountSectionOpacity.setValue(0);
      categoriesSectionOpacity.setValue(0);
      quickActionsOpacity.setValue(0);
    }
  }, [visible]);

  // Animate sub-drawer content when opened
  useEffect(() => {
    if (activeSubDrawer) {
      animateSubDrawerSequence();
    } else {
      // Reset sub-drawer animations
      subDrawerHeaderOpacity.setValue(0);
      subDrawerItemsOpacity.setValue(0);
    }
  }, [activeSubDrawer]);

  // Staggered animation sequence for main modal
  const animateModalSequence = () => {
    // Header first (100ms delay)
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 100);

    // Account section (200ms delay)
    setTimeout(() => {
      Animated.timing(accountSectionOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    }, 200);

    // Categories section (300ms delay)
    setTimeout(() => {
      Animated.timing(categoriesSectionOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 300);

    // Quick actions (450ms delay)
    setTimeout(() => {
      Animated.timing(quickActionsOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    }, 450);
  };

  // Staggered animation sequence for sub-drawer
  const animateSubDrawerSequence = () => {
    // Header first (50ms delay)
    setTimeout(() => {
      Animated.timing(subDrawerHeaderOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, 50);

    // Items second (150ms delay)
    setTimeout(() => {
      Animated.timing(subDrawerItemsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 150);
  };

  const loadSettings = async () => {
    try {
      const settings = await SettingsStorage.getAllSettings();
      setNotificationsEnabled(settings.notificationsEnabled);
      setAnimationsEnabled(settings.animationsEnabled);
      setAnalyticsEnabled(settings.analyticsEnabled);
      setAutoSaveEnabled(settings.autoSaveEnabled);
      setSoundEnabled(settings.soundEnabled);
      setHapticsEnabled(settings.hapticsEnabled);
      // New settings
      setReduceMotion(settings.reduceMotion);
      setHighContrast(settings.highContrast);
      setLargeText(settings.largeText);
      setKeepScreenOn(settings.keepScreenOn);
      setShowTimestamps(settings.showTimestamps);
      setAutoLock(settings.autoLock);
      setBackgroundType(settings.backgroundType || globalSettings.backgroundType);
      setDynamicOptions(settings.dynamicOptions);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const checkAuthState = async () => {
    try {
      const token = await TokenManager.getToken();
      const user = await TokenManager.getUserData();
      setIsSignedIn(!!token);
      setUserData(user);
    } catch (error) {
      console.error('Error checking auth state:', error);
      setIsSignedIn(false);
      setUserData(null);
    }
  };

  const handleThemeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleTheme();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveSubDrawer(null);
    onClose();
  };

  // Sub-drawer animations
  const openSubDrawer = (section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveSubDrawer(section);
    Animated.parallel([
      Animated.timing(mainContentAnim, {
        toValue: -screenWidth * 0.2,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(subDrawerAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSubDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(mainContentAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(subDrawerAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveSubDrawer(null);
    });
  };

  const handleAdvancedSetting = async (setting: string, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      switch (setting) {
        case 'notifications':
          setNotificationsEnabled(value);
          await SettingsStorage.setSetting('notificationsEnabled', value);
          break;
        case 'animations':
          setAnimationsEnabled(value);
          await SettingsStorage.setSetting('animationsEnabled', value);
          break;
        case 'analytics':
          setAnalyticsEnabled(value);
          await SettingsStorage.setSetting('analyticsEnabled', value);
          break;
        case 'autoSave':
          setAutoSaveEnabled(value);
          await SettingsStorage.setSetting('autoSaveEnabled', value);
          break;
        case 'sound':
          setSoundEnabled(value);
          await SettingsStorage.setSetting('soundEnabled', value);
          break;
        case 'haptics':
          setHapticsEnabled(value);
          await SettingsStorage.setSetting('hapticsEnabled', value);
          break;
        // New settings
        case 'reduceMotion':
          setReduceMotion(value);
          await SettingsStorage.setSetting('reduceMotion', value);
          break;
        case 'highContrast':
          setHighContrast(value);
          await SettingsStorage.setSetting('highContrast', value);
          break;
        case 'largeText':
          setLargeText(value);
          await SettingsStorage.setSetting('largeText', value);
          break;
        case 'keepScreenOn':
          setKeepScreenOn(value);
          await SettingsStorage.setSetting('keepScreenOn', value);
          break;
        case 'showTimestamps':
          setShowTimestamps(value);
          await SettingsStorage.setSetting('showTimestamps', value);
          break;
        case 'autoLock':
          setAutoLock(value);
          await SettingsStorage.setSetting('autoLock', value);
          break;
        case 'dynamicOptions':
          setDynamicOptions(value);
          await updateSetting('dynamicOptions', value);
          break;
      }
    } catch (error) {
      console.error(`Failed to save ${setting} setting:`, error);
    }
  };

  const handleBackgroundTypeSetting = async (backgroundType: 'blue' | 'white') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      setBackgroundType(backgroundType);
      await updateSetting('backgroundType', backgroundType);
    } catch (error) {
      console.error('Failed to save backgroundType setting:', error);
    }
  };

  // Handle sub-drawer item interactions
  const handleSubDrawerItem = async (section: string, item: any) => {
    switch (item.type) {
      case 'switch':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (item.key === 'theme') {
          handleThemeToggle();
        } else {
          await handleAdvancedSetting(item.key, !item.value);
        }
        break;
      case 'selector':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await handleAdvancedSetting(item.key, item.value);
        break;
      case 'action':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (item.key === 'exportData') {
          handleDataExport();
        } else if (item.key === 'clearData') {
          handleClearData();
        }
        break;
    }
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowSignOutModal(true);
  };

  const handleSignOutConfirm = async () => {
    try {
      setIsLoading(true);
      await AuthAPI.logout();
      setIsSignedIn(false);
      setUserData(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to Hero landing screen
      if (navigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      } else {
        onSignOut?.();
      }
      onClose();
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
      setShowSignOutModal(false);
    }
  };

  const handleDataExport = async () => {
    try {
      setIsLoading(true);
      const settingsData = await SettingsStorage.exportSettings();
      
      await Share.share({
        message: settingsData,
        title: 'Numina Settings Export',
      });
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your conversations and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Data', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              
              // Delete conversations
              await ConversationAPI.deleteAllConversations();
              
              // Clear local settings
              await SettingsStorage.resetSettings();
              await loadSettings();
              
              Alert.alert(
                'Data Cleared',
                'All conversations and preferences have been permanently deleted.',
                [{ text: 'OK', style: 'default' }]
              );
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
            } catch (error: any) {
              console.error('Failed to clear data:', error);
              
              Alert.alert(
                'Error', 
                error.message || 'Failed to clear data. Please try again.',
                [{ text: 'OK', style: 'default' }]
              );
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Render main settings item (matching HeaderMenu style)
  const renderSettingsItem = (section: string, index: number) => {
    const sectionData = subDrawerSections[section as keyof typeof subDrawerSections];
    const itemColor = getSettingsIconColor(index);
    return (
      <TouchableOpacity
        key={section}
        style={[
          styles.settingsItem, 
          { 
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderColor: theme === 'dark' 
              ? 'rgba(255,255,255,0.1)' 
              : 'rgba(0, 0, 0, 0.08)',
          }
        ]}
        onPress={() => openSubDrawer(section)}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Feather name={sectionData.icon as any} size={16} color={itemColor} />
        </View>
        <Text style={[
          styles.settingsTitle, 
          { color: colors.text }
        ]}>
          {sectionData.title}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render sub-drawer
  const renderSubDrawer = () => {
    if (!activeSubDrawer) return null;
    
    const sectionData = subDrawerSections[activeSubDrawer as keyof typeof subDrawerSections];
    const translateX = subDrawerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [screenWidth, 0],
    });

    return (
      <Animated.View 
        style={[
          styles.subDrawer, 
          { 
            backgroundColor: theme === 'dark' ? '#1a1a1a' : colors.surface,
            borderColor: colors.borders.default,
            transform: [{ translateX }] 
          }
        ]}
      >
        <Animated.View style={[
          styles.subDrawerHeader, 
          { 
            borderBottomColor: colors.borders.default,
            opacity: subDrawerHeaderOpacity 
          }
        ]}>
          <TouchableOpacity onPress={closeSubDrawer} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.subDrawerTitle, { color: colors.text }]}>
            {sectionData.title}
          </Text>
        </Animated.View>
        
        <Animated.ScrollView 
          style={[styles.subDrawerContent, { opacity: subDrawerItemsOpacity }]}
          contentContainerStyle={{ paddingBottom: spacing[6] }}
          showsVerticalScrollIndicator={false}
        >
          {sectionData.items.map((item, index) => {
            const itemColor = getSettingsIconColor(index + 12); // Offset to get different colors
            return (
              <TouchableOpacity 
                key={item.key} 
                style={[
                  styles.subDrawerItem, 
                  { 
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: theme === 'dark' 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(0, 0, 0, 0.08)',
                  }
                ]}
                activeOpacity={0.8}
                onPress={item.type === 'switch' ? () => handleSubDrawerItem(activeSubDrawer, item) : item.type === 'selector' ? undefined : undefined}
              >
                <View style={styles.iconContainer}>
                  {item.type === 'switch' && <Feather name="toggle-left" size={16} color={itemColor} />}
                  {item.type === 'action' && <Feather name={(item as any).destructive ? "trash-2" : "download"} size={16} color={itemColor} />}
                  {item.type === 'selector' && <Feather name="layers" size={16} color={itemColor} />}
                </View>
                
                <View style={styles.subDrawerItemContent}>
                  <Text style={[styles.subDrawerItemLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  {item.type === 'switch' && (
                    <Switch
                      value={item.value as boolean}
                      onValueChange={(value) => handleAdvancedSetting(item.key, value)}
                      trackColor={{ false: colors.surfaces.sunken, true: itemColor }}
                      thumbColor={colors.surface}
                    />
                  )}
                  {item.type === 'action' && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        (item as any).destructive 
                          ? { backgroundColor: 'rgba(255, 71, 87, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 71, 87, 0.3)' }
                          : { backgroundColor: `${itemColor}15`, borderWidth: 1, borderColor: `${itemColor}30` }
                      ]}
                      onPress={() => handleSubDrawerItem(activeSubDrawer, item)}
                    >
                      <Text style={[
                        styles.actionButtonText,
                        { color: (item as any).destructive ? '#ff4757' : itemColor }
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {item.type === 'selector' && item.key === 'backgroundType' && (
                    <View style={styles.backgroundSelector}>
                      <TouchableOpacity
                        style={[
                          styles.backgroundOption,
                          {
                            backgroundColor: backgroundType === 'blue' 
                              ? `${itemColor}20` 
                              : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            borderColor: backgroundType === 'blue' 
                              ? itemColor 
                              : theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            borderWidth: backgroundType === 'blue' ? 2 : 1,
                          }
                        ]}
                        onPress={() => handleBackgroundTypeSetting('blue')}
                      >
                        <View style={[styles.gradientPreview, { backgroundColor: '#f2f8ff' }]} />
                        <Text style={[styles.backgroundOptionText, { 
                          color: backgroundType === 'blue' ? itemColor : colors.text,
                          fontWeight: backgroundType === 'blue' ? '600' : '400',
                          marginLeft: spacing[2]
                        }]}>Blue</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.backgroundOption,
                          {
                            backgroundColor: backgroundType === 'white' 
                              ? `${itemColor}20` 
                              : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            borderColor: backgroundType === 'white' 
                              ? itemColor 
                              : theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            borderWidth: backgroundType === 'white' ? 2 : 1,
                          }
                        ]}
                        onPress={() => handleBackgroundTypeSetting('white')}
                      >
                        <View style={[styles.whitePreview, { backgroundColor: '#ffffff' }]} />
                        <Text style={[styles.backgroundOptionText, { 
                          color: backgroundType === 'white' ? itemColor : colors.text,
                          fontWeight: backgroundType === 'white' ? '600' : '400',
                          marginLeft: spacing[2]
                        }]}>White</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.ScrollView>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity 
          style={styles.backdropTouchable}
          onPress={handleClose}
          activeOpacity={1}
        />
        
        <Animated.View style={[
          styles.modalContainer, 
          { 
            backgroundColor: theme === 'dark' ? '#1a1a1a' : colors.surface,
            transform: [{ translateX: mainContentAnim }]
          }
        ]}>
          {/* Header */}
          <Animated.View style={[
            styles.modalHeader, 
            { 
              borderBottomColor: colors.borders.default,
              opacity: headerOpacity 
            }
          ]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Settings
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Feather name="x" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>

          {/* Settings Content */}
          <ScrollView 
            style={styles.settingsContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Account Section - Show first if signed in */}
            {isSignedIn && (
              <Animated.View style={[styles.accountSection, { opacity: accountSectionOpacity }]}>
                <TouchableOpacity style={[
                  styles.accountItem, 
                  { 
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: theme === 'dark' 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(0, 0, 0, 0.08)',
                  }
                ]}>
                  <View style={styles.iconContainer}>
                    <Feather name="user" size={16} color={getSettingsIconColor(0)} />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={[styles.accountEmail, { color: colors.text }]}>
                      {userData?.email || 'Account'}
                    </Text>
                    <Text style={[styles.accountStatus, { color: colors.textMuted }]}>
                      Signed in
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                    <Feather name="log-out" size={16} color="#ff4757" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Main Settings Categories */}
            <Animated.View style={[styles.categoriesSection, { opacity: categoriesSectionOpacity }]}>
              {Object.keys(subDrawerSections).map((section, index) => 
                renderSettingsItem(section, index)
              )}
            </Animated.View>

            {/* Quick Actions */}
            <Animated.View style={[styles.quickActionsSection, { opacity: quickActionsOpacity }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
              
              <TouchableOpacity 
                style={[styles.quickAction, { 
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.03)',
                  borderColor: theme === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0, 0, 0, 0.08)',
                }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <Feather name="help-circle" size={16} color={getSettingsIconColor(10)} />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>Help & Support</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickAction, { 
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.03)',
                  borderColor: theme === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0, 0, 0, 0.08)',
                }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAboutModal(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <Feather name="info" size={16} color={getSettingsIconColor(11)} />
                </View>
                <View style={styles.aboutQuickAction}>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>About Numina</Text>
                  <Text style={[styles.versionText, { color: colors.textMuted }]}>
                    v{Constants.expoConfig?.version || '1.0.0'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
          
          {/* Overlay when submenu is active */}
          {activeSubDrawer && (
            <Animated.View
              style={[
                styles.mainContentOverlay,
                {
                  opacity: subDrawerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.8],
                  }),
                }
              ]}
            >
              <TouchableOpacity
                style={StyleSheet.absoluteFillObject}
                activeOpacity={1}
                onPress={closeSubDrawer}
              />
            </Animated.View>
          )}
        </Animated.View>

        {/* Sub-drawer */}
        {renderSubDrawer()}
      </View>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.aboutModalBackdrop}>
          <TouchableOpacity 
            style={styles.aboutModalBackdropTouchable}
            onPress={() => setShowAboutModal(false)}
            activeOpacity={1}
          />
          
          <View style={[
            styles.aboutModalContainer,
            { 
              backgroundColor: theme === 'dark' ? '#1a1a1a' : colors.surface,
              borderColor: colors.borders.default,
            }
          ]}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.aboutCloseButton}
              onPress={() => setShowAboutModal(false)}
            >
              <Feather name="x" size={14} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.aboutContent}>
              <Text style={[styles.aboutTitle, { color: colors.text }]}>
                About Numina
              </Text>
              <Text style={[styles.aboutVersion, { color: colors.textMuted }]}>
                Version {Constants.expoConfig?.version || '1.0.0'}
              </Text>
              <Text style={[styles.aboutPlatform, { color: colors.textMuted }]}>
                {Constants.platform?.ios ? 'iOS' : 'Android'} Platform
              </Text>
              <Text style={[styles.aboutCredits, { color: colors.textMuted }]}>
                By Dorian Innovations
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sign Out Modal */}
      <SignOutModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOutConfirm}
        theme={theme}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  modalContainer: {
    width: screenWidth,
    height: screenHeight,
    padding: spacing[4],
    paddingTop: 60, // Account for status bar/notch
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing[4],
    marginBottom: spacing[4],
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: typography.fonts.headingSemiBold,
    fontWeight: '600',
    fontSize: 22,
  },
  closeButton: {
    padding: spacing[2],
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  settingsContent: {
    flex: 1,
  },
  
  mainContentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  
  // Account Section
  accountSection: {
    marginBottom: spacing[4],
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    marginHorizontal: spacing[1],
    marginVertical: 2,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  accountInfo: {
    flex: 1,
  },
  accountEmail: {
    fontFamily: typography.fonts.body,
    fontSize: typography.scale.base,
    fontWeight: '600',
  },
  accountStatus: {
    fontFamily: typography.fonts.body,
    fontSize: typography.scale.sm,
    marginTop: 2,
  },
  signOutButton: {
    padding: spacing[2],
    borderRadius: 8,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },
  
  // Categories Section
  categoriesSection: {
    marginBottom: spacing[4],
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    marginHorizontal: spacing[1],
    marginVertical: 2,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing[3],
  },
  settingsTitle: {
    fontFamily: typography.fonts.body,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  settingsSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.scale.sm,
    marginTop: 2,
  },
  
  // Sub-drawer
  subDrawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: screenWidth * 0.78,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  subDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    paddingTop: 62.5, // Fine-tuned alignment with main modal
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing[2],
    marginRight: spacing[3],
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  subDrawerTitle: {
    fontFamily: typography.fonts.headingSemiBold,
    fontSize: typography.scale.xl,
    fontWeight: '600',
  },
  subDrawerContent: {
    flex: 1,
    padding: spacing[4],
  },
  subDrawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    borderRadius: 12,
    marginHorizontal: spacing[1],
    marginVertical: 2,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
  },
  subDrawerItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    minHeight: 80,
  },
  subDrawerItemLabel: {
    fontFamily: typography.fonts.body,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
    flex: 1,
  },
  
  // Action Button
  actionButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: typography.fonts.body,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  
  // Quick Actions
  quickActionsSection: {
    marginTop: spacing[2],
  },
  sectionTitle: {
    fontFamily: typography.fonts.headingSemiBold,
    fontSize: typography.scale.lg,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    marginHorizontal: spacing[1],
    marginVertical: 2,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontFamily: typography.fonts.body,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  aboutQuickAction: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionText: {
    fontFamily: typography.fonts.body,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  // About Modal
  aboutModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutModalBackdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  aboutModalContainer: {
    width: 240,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing[4],
    paddingTop: spacing[3],
    position: 'relative',
  },
  aboutCloseButton: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  aboutContent: {
    alignItems: 'flex-start',
  },
  aboutTitle: {
    fontFamily: typography.fonts.headingSemiBold,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  aboutVersion: {
    fontFamily: typography.fonts.body,
    fontSize: 13,
    marginBottom: 4,
  },
  aboutPlatform: {
    fontFamily: typography.fonts.body,
    fontSize: 13,
    marginBottom: spacing[3],
  },
  aboutCredits: {
    fontFamily: typography.fonts.body,
    fontSize: 12,
    fontStyle: 'italic',
  },
  
  // Background Selector
  backgroundSelector: {
    flexDirection: 'row',
  },
  backgroundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    borderWidth: 1,
    marginRight: spacing[2],
  },
  backgroundOptionText: {
    fontFamily: typography.fonts.body,
    fontSize: 13,
    letterSpacing: -0.1,
  },
  gradientPreview: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f2f8ff',
  },
  whitePreview: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});

export default SettingsModal;
