/**
 * Numina - Settings Modal
 * Beautiful glassmorphic settings panel with brick-style buttons
 */

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';

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
import { AuthAPI, TokenManager, UserAPI } from '../../services/api';
import SettingsStorage from '../../services/settingsStorage';

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
  const [colorfulBubblesEnabled, setColorfulBubblesEnabled] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const glassmorphicOverlay = getGlassmorphicStyle('overlay', theme);
  const brickStyle = getBrickButtonStyle(theme);
  const borderStyle = getBorderStyle(theme, 'default');

  // Load settings and auth state on mount
  useEffect(() => {
    loadSettings();
    checkAuthState();
  }, []);

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
      setColorfulBubblesEnabled(settings.colorfulBubblesEnabled);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleTextSizeChange = async (value: number) => {
    setTextSize(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        case 'colorfulBubbles':
          setColorfulBubblesEnabled(value);
          await SettingsStorage.setSetting('colorfulBubblesEnabled', value);
          break;
      }
    } catch (error) {
      console.error(`Failed to save ${setting} setting:`, error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You\'ll lose access to your conversation history and personalized features.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
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
            }
          }
        }
      ]
    );
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
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            // TODO: Implement data clearing
          }
        }
      ]
    );
  };

  // Varied icon colors for better visibility
  const getIconColorForIndex = (index: number) => {
    const iconNames = ['profile', 'chat', 'insights', 'connections', 'settings', 'help', 'notifications', 'search', 'menu', 'back', 'close', 'home'];
    return getIconColor(iconNames[index % iconNames.length] as any, theme);
  };

  // More visible icon backgrounds
  const getIconBackground = (index: number) => {
    const pastels = [
      designTokens.pastels.pink,
      designTokens.pastels.cyan, 
      designTokens.pastels.mint,
      designTokens.pastels.orange,
      designTokens.pastels.purple,
      designTokens.pastels.coral,
    ];
    return theme === 'light' 
      ? `${pastels[index % pastels.length]}40` // 40% opacity for light mode
      : `${pastels[index % pastels.length]}60`; // 60% opacity for dark mode
  };

  const renderBrickButton = (
    title: string,
    subtitle: string,
    iconName: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    iconIndex: number = 0
  ) => (
    <TouchableOpacity
      style={[
        styles.brickButton, 
        brickStyle, 
        { borderColor: colors.borders.default }
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      activeOpacity={0.8}
    >
      <View style={[
        styles.brickIcon, 
        { backgroundColor: getIconBackground(iconIndex) }
      ]}>
        <Icon 
          name={iconName as any} 
          size="md" 
          color={colorPatterns.text.primary(theme)} // Using consolidated color pattern
        />
      </View>
      <View style={styles.brickContent}>
        <Text style={[styles.brickTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.brickSubtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      </View>
      {rightElement && (
        <View style={styles.brickRight}>
          {rightElement}
        </View>
      )}
    </TouchableOpacity>
  );

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
        
        <View style={[styles.modalContainer, glassmorphicOverlay, { borderColor: colors.borders.default }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.borders.default }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Settings
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Icon 
                name="x" 
                size="md" 
                color="muted" 
                theme={theme}
              />
            </TouchableOpacity>
          </View>

          {/* Settings Content */}
          <ScrollView 
            style={styles.settingsContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Account Section - Show first if signed in */}
            {isSignedIn && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Account
                </Text>
                
                {renderBrickButton(
                  userData?.email || 'Profile',
                  'Manage your account settings',
                  'user',
                  undefined,
                  <TouchableOpacity
                    style={styles.signOutIcon}
                    onPress={handleSignOut}
                    activeOpacity={0.7}
                  >
                    <Icon 
                      name="log-out" 
                      size="sm" 
                      color="menu"
                      theme={theme}
                    />
                  </TouchableOpacity>,
                  0
                )}
              </View>
            )}

            {/* Appearance Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Appearance
              </Text>
              
              {renderBrickButton(
                'Dark Mode',
                `Currently ${theme === 'dark' ? 'enabled' : 'disabled'}`,
                theme === 'dark' ? 'moon' : 'sun',
                undefined,
                <Switch
                  value={theme === 'dark'}
                  onValueChange={handleThemeToggle}
                  trackColor={{ 
                    false: colors.surfaces.sunken, 
                    true: colors.primary 
                  }}
                  thumbColor={theme === 'dark' ? designTokens.text.primaryDark : colors.surface}
                />
              )}
              
              {/* Colorful User Bubbles Toggle */}
              {renderBrickButton(
                'Colorful Chat Bubbles',
                'Enable fun cycling colors for your messages',
                'palette',
                undefined,
                <Switch
                  value={colorfulBubblesEnabled}
                  onValueChange={(value) => handleAdvancedSetting('colorfulBubbles', value)}
                  trackColor={{ 
                    false: colors.surfaces.sunken, 
                    true: colors.primary 
                  }}
                  thumbColor={colorfulBubblesEnabled ? designTokens.text.primaryDark : colors.surface}
                />,
                1
              )}
              
              {renderBrickButton(
                'Chat Animations',
                'Smooth typing and entrance effects',
                'zap',
                undefined,
                <Switch
                  value={animationsEnabled}
                  onValueChange={(value) => handleAdvancedSetting('animations', value)}
                  trackColor={{ 
                    false: colors.surfaces.sunken, 
                    true: colors.primary 
                  }}
                  thumbColor={animationsEnabled ? designTokens.text.primaryDark : colors.surface}
                />
              )}
            </View>


            {/* Functionality Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Functionality
              </Text>
              
              {renderBrickButton(
                'Notifications',
                'App alerts and message updates',
                'bell',
                undefined,
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(value) => handleAdvancedSetting('notifications', value)}
                  trackColor={{ 
                    false: colors.surfaces.sunken, 
                    true: colors.primary 
                  }}
                  thumbColor={notificationsEnabled ? designTokens.text.primaryDark : colors.surface}
                />,
                0
              )}

              {renderBrickButton(
                'Auto-Save Chats',
                'Automatically save conversation history',
                'save',
                undefined,
                <Switch
                  value={autoSaveEnabled}
                  onValueChange={(value) => handleAdvancedSetting('autoSave', value)}
                  trackColor={{ 
                    false: colors.surfaces.sunken, 
                    true: colors.primary 
                  }}
                  thumbColor={autoSaveEnabled ? designTokens.text.primaryDark : colors.surface}
                />,
                1
              )}

              {renderBrickButton(
                'Sound Effects',
                'Audio feedback for interactions',
                'volume-2',
                undefined,
                <Switch
                  value={soundEnabled}
                  onValueChange={(value) => handleAdvancedSetting('sound', value)}
                  trackColor={{ 
                    false: colors.surfaces.sunken, 
                    true: colors.primary 
                  }}
                  thumbColor={soundEnabled ? designTokens.text.primaryDark : colors.surface}
                />,
                2
              )}

              {renderBrickButton(
                'Haptic Feedback',
                'Touch vibration responses',
                'smartphone',
                undefined,
                <Switch
                  value={hapticsEnabled}
                  onValueChange={(value) => handleAdvancedSetting('haptics', value)}
                  trackColor={{ 
                    false: colors.surfaces.sunken, 
                    true: colors.primary 
                  }}
                  thumbColor={hapticsEnabled ? designTokens.text.primaryDark : colors.surface}
                />,
                3
              )}
              
              {renderBrickButton(
                'Analytics & Learning',
                'Help improve Numina with usage data',
                'activity',
                undefined,
                <Switch
                  value={analyticsEnabled}
                  onValueChange={(value) => handleAdvancedSetting('analytics', value)}
                  trackColor={{ 
                    false: colors.surfaces.sunken, 
                    true: colors.primary 
                  }}
                  thumbColor={analyticsEnabled ? designTokens.text.primaryDark : colors.surface}
                />,
                4
              )}
            </View>

            {/* Privacy & Data Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Privacy & Data
              </Text>
              
              {renderBrickButton(
                'Export Settings',
                'Download your app preferences',
                'download',
                handleDataExport,
                undefined,
                0
              )}
              
              {renderBrickButton(
                'Privacy Policy',
                'View our privacy practices',
                'shield',
                () => Linking.openURL('https://aether.com/privacy'),
                undefined,
                1
              )}
              
              {renderBrickButton(
                'Terms of Service',
                'Review terms and conditions',
                'file-text',
                () => Linking.openURL('https://aether.com/terms'),
                undefined,
                2
              )}
              
              {renderBrickButton(
                'Reset Settings',
                'Restore default preferences',
                'refresh-cw',
                () => Alert.alert(
                  'Reset Settings',
                  'This will restore all settings to their default values. Continue?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Reset', 
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await SettingsStorage.resetSettings();
                          await loadSettings();
                          Alert.alert('Success', 'Settings have been reset to defaults.');
                        } catch (error) {
                          Alert.alert('Error', 'Failed to reset settings.');
                        }
                      }
                    }
                  ]
                ),
                undefined,
                3
              )}
            </View>

            {/* Help & Support Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Help & Support
              </Text>
              
              {renderBrickButton(
                'Help Center',
                'Get answers to common questions',
                'help-circle',
                () => Linking.openURL('https://aether.com/help'),
                undefined,
                0
              )}
              
              {renderBrickButton(
                'Send Feedback',
                'Report issues or suggest features',
                'message-square',
                () => Linking.openURL('mailto:support@numina.com?subject=Numina Mobile Feedback'),
                undefined,
                1
              )}
              
              {renderBrickButton(
                'App Version',
                'v1.0.0 (Build 100)',
                'info',
                () => Alert.alert(
                  'App Information',
                  'Numina Mobile v1.0.0\nBuild 100\n\nDeveloped by the Numina Team\n© 2024 Numina Technologies'
                ),
                undefined,
                2
              )}
            </View>
          </ScrollView>
        </View>
      </View>

    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    width: screenWidth * 0.95,
    maxHeight: screenHeight * 0.92,
    minHeight: screenHeight * 0.75,
    borderRadius: 10, // Reduced roundness from 24
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...typography.textStyles.headlineLarge,
    fontWeight: '700',
    fontSize: 22,
  },
  closeButton: {
    padding: spacing[2],
    borderRadius: 10, // Reduced roundness from 12
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  settingsContent: {
    flex: 1,
  },
  
  section: {
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: spacing[1],
    marginLeft: spacing[1],
    opacity: 0.9,
  },
  
  // Brick Buttons
  brickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    borderRadius: 10, // Reduced roundness from 12
    marginBottom: spacing[1],
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  
  brickIcon: {
    width: 32,
    height: 32,
    borderRadius: 6, // Reduced roundness from 8
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[2],
    shadowColor: 'rgba(255, 179, 230, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  iconText: {
    fontSize: 16,
  },
  
  brickContent: {
    flex: 1,
    justifyContent: 'center',
  },
  brickTitle: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  brickSubtitle: {
    ...typography.textStyles.bodyMedium,
    fontSize: 14,
    opacity: 0.8,
  },
  
  brickRight: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing[3],
  },
  
  // Text Size Slider
  slider: {
    marginTop: spacing[2],
    height: 36,
    flex: 1,
  },
  
  // Sign Out Icon
  signOutIcon: {
    padding: spacing[1],
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
});

export default SettingsModal;