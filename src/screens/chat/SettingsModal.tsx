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
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

// Design System
import { designTokens, getThemeColors, getBorderStyle, getIconColor } from '../../design-system/tokens/colors';
import { colorPatterns } from '../../design-system/tokens/color-patterns';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { getGlassmorphicStyle, getBrickButtonStyle } from '../../design-system/tokens/glassmorphism';
import Icon from '../../design-system/components/atoms/Icon';

// Contexts
import { useTheme } from '../../contexts/ThemeContext';

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
  // Local state for settings
  const [textSize, setTextSize] = useState(16);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubDrawer, setActiveSubDrawer] = useState<string | null>(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  
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

  // Rainbow pastel icon colors (same as HeaderMenu)
  const getSettingsIconColor = (index: number): string => {
    const colors = [
      '#FF6B9D', // Pink
      '#C44569', // Dark Pink  
      '#F8B500', // Orange
      '#F39801', // Dark Orange
      '#05C46B', // Green
      '#00A8CC', // Teal
      '#0066CC', // Blue
      '#574B90', // Purple
      '#8E44AD', // Dark Purple
      '#6C5CE7', // Light Purple
      '#FF5722', // Red Orange
      '#9C27B0', // Purple
      '#673AB7', // Deep Purple
      '#3F51B5', // Indigo
      '#2196F3', // Blue
      '#00BCD4', // Cyan
      '#009688', // Teal
      '#4CAF50', // Green
      '#8BC34A', // Light Green
      '#CDDC39', // Lime
      '#FFEB3B', // Yellow
      '#FFC107', // Amber
      '#FF9800', // Orange
      '#FF5722', // Deep Orange
    ];
    return colors[index % colors.length];
  };

  // Sub-drawer sections
  const subDrawerSections = {
    appearance: {
      title: 'Appearance',
      icon: 'palette',
      description: 'Theme, animations, text size',
      items: [
        { key: 'theme', label: 'Dark Mode', value: theme === 'dark', type: 'switch' },
        { key: 'animations', label: 'Animations', value: animationsEnabled, type: 'switch' },
        { key: 'textSize', label: 'Text Size', value: textSize, type: 'slider', min: 12, max: 24 },
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
    privacy: {
      title: 'Privacy & Data',
      icon: 'shield',
      description: 'Analytics, backups, data control',
      items: [
        { key: 'analytics', label: 'Analytics', value: analyticsEnabled, type: 'switch' },
        { key: 'autoSave', label: 'Auto-Save Chats', value: autoSaveEnabled, type: 'switch' },
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
      setTextSize(settings.textSize);
      setNotificationsEnabled(settings.notificationsEnabled);
      setAnimationsEnabled(settings.animationsEnabled);
      setAnalyticsEnabled(settings.analyticsEnabled);
      setAutoSaveEnabled(settings.autoSaveEnabled);
      setSoundEnabled(settings.soundEnabled);
      setHapticsEnabled(settings.hapticsEnabled);
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

  const handleTextSizeChange = async (value: number) => {
    setTextSize(value);
    // Add micro haptics for slider movement
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    try {
      await SettingsStorage.setSetting('textSize', value);
    } catch (error) {
      console.error('Failed to save text size:', error);
    }
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
      }
    } catch (error) {
      console.error(`Failed to save ${setting} setting:`, error);
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

  // Render main settings item
  const renderSettingsItem = (section: string, index: number) => {
    const sectionData = subDrawerSections[section as keyof typeof subDrawerSections];
    const itemColor = getSettingsIconColor(index);
    return (
      <TouchableOpacity
        key={section}
        style={[
          styles.settingsItem, 
          { 
            borderColor: `${itemColor}30`,
            backgroundColor: `${itemColor}08`
          }
        ]}
        onPress={() => openSubDrawer(section)}
        activeOpacity={0.7}
      >
        <View style={[styles.settingsIcon, { backgroundColor: `${itemColor}20` }]}>
          <Feather name={sectionData.icon as any} size={20} color={itemColor} />
        </View>
        <View style={styles.settingsContent}>
          <Text style={[styles.settingsTitle, { color: colors.text }]}>
            {sectionData.title}
          </Text>
          <Text style={[styles.settingsSubtitle, { color: colors.textMuted }]}>
            {sectionData.description}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={itemColor} />
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
              <View key={item.key} style={[
                styles.subDrawerItem, 
                { 
                  borderColor: `${itemColor}30`,
                  backgroundColor: `${itemColor}08`
                }
              ]}>
                <View style={styles.subDrawerItemContent}>
                  <Text style={[styles.subDrawerItemLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  {item.type === 'switch' && (
                    <Switch
                      value={item.value as boolean}
                      onValueChange={(value) => handleSubDrawerItem(activeSubDrawer, { ...item, value: !item.value })}
                      trackColor={{ false: colors.surfaces.sunken, true: itemColor }}
                      thumbColor={colors.surface}
                    />
                  )}
                  {item.type === 'slider' && (
                    <View style={styles.sliderContainer}>
                      <Slider
                        style={styles.slider}
                        minimumValue={(item as any).min}
                        maximumValue={(item as any).max}
                        value={item.value as number}
                        onValueChange={handleTextSizeChange}
                        minimumTrackTintColor={itemColor}
                        maximumTrackTintColor={colors.surfaces.sunken}
                        thumbTintColor={itemColor}
                      />
                      <Text style={[styles.sliderValue, { color: colors.textMuted }]}>
                        {Math.round(item.value as number)}px
                      </Text>
                    </View>
                  )}
                  {item.type === 'action' && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        (item as any).destructive 
                          ? { backgroundColor: '#ff4757' }
                          : { backgroundColor: `${itemColor}20` }
                      ]}
                      onPress={() => handleSubDrawerItem(activeSubDrawer, item)}
                    >
                      <Text style={[
                        styles.actionButtonText,
                        { color: (item as any).destructive ? 'white' : itemColor }
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
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
                <TouchableOpacity style={[styles.accountItem, { borderColor: colors.borders.default }]}>
                  <View style={[styles.accountIcon, { backgroundColor: `${getSettingsIconColor(0)}20` }]}>
                    <Feather name="user" size={20} color={getSettingsIconColor(0)} />
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
                  borderColor: `${getSettingsIconColor(10)}30`,
                  backgroundColor: `${getSettingsIconColor(10)}08`
                }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // TODO: Navigate to help & support screen
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${getSettingsIconColor(10)}20` }]}>
                  <Feather name="help-circle" size={18} color={getSettingsIconColor(10)} />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>Help & Support</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickAction, { 
                  borderColor: `${getSettingsIconColor(11)}30`,
                  backgroundColor: `${getSettingsIconColor(11)}08`
                }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // TODO: Navigate to about screen
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${getSettingsIconColor(11)}20` }]}>
                  <Feather name="info" size={18} color={getSettingsIconColor(11)} />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>About Numina</Text>
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
    fontFamily: typography.fonts.body,
    fontWeight: '700',
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
    padding: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    padding: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  settingsTitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.scale.base,
    fontWeight: '600',
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
    fontFamily: typography.fonts.body,
    fontSize: typography.scale.xl,
    fontWeight: '600',
  },
  subDrawerContent: {
    flex: 1,
    padding: spacing[4],
  },
  subDrawerItem: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    borderBottomWidth: 1,
    marginHorizontal: 0,
    borderRadius: 12,
    marginBottom: spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  subDrawerItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  subDrawerItemLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.scale.base,
    fontWeight: '500',
    flex: 1,
  },
  
  // Slider
  sliderContainer: {
    width: 120,
    alignItems: 'center',
  },
  slider: {
    width: 100,
    height: 20,
  },
  sliderValue: {
    fontFamily: typography.fonts.body,
    fontSize: typography.scale.sm,
    marginTop: spacing[1],
  },
  
  // Action Button
  actionButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.scale.base,
    fontWeight: '600',
  },
  
  // Quick Actions
  quickActionsSection: {
    marginTop: spacing[2],
  },
  sectionTitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.scale.lg,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing[2],
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
    fontSize: typography.scale.base,
    marginLeft: spacing[3],
  },
});

export default SettingsModal;
