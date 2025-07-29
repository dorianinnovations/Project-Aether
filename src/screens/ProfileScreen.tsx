/**
 * Aether - Profile Screen
 * Sophisticated profile management with numina-style design and Aether branding
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { PageBackground } from '../design-system/components/atoms/PageBackground';
import { Header } from '../design-system/components/organisms/Header';
import { designTokens, getThemeColors } from '../design-system/tokens/colors';
import { useTheme } from '../contexts/ThemeContext';

interface ProfileScreenProps {
  navigation: any;
  onNavigateBack: () => void;
}

interface UserProfile {
  profileImage?: string;
  displayName: string;
  bio: string;
  location: string;
  email?: string;
  joinDate?: string;
  status?: 'online' | 'away' | 'offline';
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  navigation,
  onNavigateBack,
}) => {
  const { theme, colors } = useTheme();
  const themeColors = getThemeColors(theme);
  
  const [editMode, setEditMode] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Staggered load-in animations
  const editButtonOpacity = useRef(new Animated.Value(0)).current;
  const profileContentOpacity = useRef(new Animated.Value(0)).current;
  
  // Animation values for success screen
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const containerScale = useRef(new Animated.Value(0.3)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const messageTranslateY = useRef(new Animated.Value(20)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const closeButtonOpacity = useRef(new Animated.Value(0)).current;
  const closeButtonTranslateY = useRef(new Animated.Value(30)).current;
  
  const [profile, setProfile] = useState<UserProfile>({
    profileImage: undefined,
    displayName: 'Aether User',
    bio: 'Exploring the world of adaptive AI conversations',
    location: 'Digital Realm',
    email: 'user@aether.ai',
    joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    status: 'online'
  });

  useEffect(() => {
    // Staggered load-in sequence
    const animateSequence = () => {
      // Edit button first (200ms delay)
      setTimeout(() => {
        Animated.timing(editButtonOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 200);

      // Profile content second (500ms delay)
      setTimeout(() => {
        Animated.timing(profileContentOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 500);
    };

    animateSequence();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('aetherUserProfile');
      if (stored) {
        const storedProfile = JSON.parse(stored);
        setProfile(prev => ({ ...prev, ...storedProfile }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const saveProfile = async () => {
    try {
      // Success haptic for saving profile
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      await AsyncStorage.setItem('aetherUserProfile', JSON.stringify(profile));
      setEditMode(false);
      setShowSuccessScreen(true);
      
      // Start the success animation sequence
      startSuccessAnimation();
      
      // Auto-hide success screen after 2 seconds
      setTimeout(() => {
        hideSuccessScreen();
      }, 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const startSuccessAnimation = () => {
    // Reset all animation values
    overlayOpacity.setValue(0);
    containerScale.setValue(0.3);
    containerOpacity.setValue(0);
    iconScale.setValue(0);
    iconRotation.setValue(0);
    titleOpacity.setValue(0);
    titleTranslateY.setValue(30);
    messageOpacity.setValue(0);
    messageTranslateY.setValue(20);
    pulseScale.setValue(1);
    closeButtonOpacity.setValue(0);
    closeButtonTranslateY.setValue(30);

    // Everything happens in parallel within 200ms
    Animated.parallel([
      // Overlay fade in
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Container appears with quick bounce
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(containerScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      // Icon quick scale and rotation
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(iconRotation, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Title appears quickly
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 200,
        delay: 50,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 200,
        delay: 50,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Message appears quickly
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 200,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(messageTranslateY, {
        toValue: 0,
        duration: 200,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Close button appears quickly
      Animated.timing(closeButtonOpacity, {
        toValue: 1,
        duration: 200,
        delay: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(closeButtonTranslateY, {
        toValue: 0,
        duration: 200,
        delay: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start gentle pulse after everything is visible
      startPulseAnimation();
    });
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const hideSuccessScreen = () => {
    // Elegant exit animation
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(containerScale, {
        toValue: 0.8,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessScreen(false);
      // Stop pulse animation
      pulseScale.stopAnimation();
    });
  };

  const pickImage = async () => {
    try {
      // Light haptic for image picker
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Show action sheet for camera or library
      Alert.alert(
        'Update Profile Picture',
        'Choose how you\'d like to update your profile picture',
        [
          {
            text: 'Camera',
            onPress: () => takePhoto(),
          },
          {
            text: 'Photo Library',
            onPress: () => selectFromLibrary(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error in pickImage:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfile(prev => ({
          ...prev,
          profileImage: result.assets[0].uri
        }));
        // Auto-save when photo is updated
        setTimeout(() => saveProfile(), 100);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const selectFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library permissions.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfile(prev => ({
          ...prev,
          profileImage: result.assets[0].uri
        }));
        // Auto-save when photo is updated
        setTimeout(() => saveProfile(), 100);
      }
    } catch (error) {
      console.error('Error selecting from library:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const StatusIndicator: React.FC<{ status: 'online' | 'away' | 'offline' }> = ({ status }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    
    useEffect(() => {
      if (status === 'online') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.3,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }, [status]);

    const getStatusColor = () => {
      switch (status) {
        case 'online': return designTokens.semantic.success;
        case 'away': return designTokens.semantic.warning;
        case 'offline': return designTokens.text.muted;
        default: return designTokens.text.muted;
      }
    };

    return (
      <View style={styles.statusContainer}>
        <Animated.View 
          style={[
            styles.statusDot,
            { 
              backgroundColor: getStatusColor(),
              transform: [{ scale: status === 'online' ? pulseAnim : 1 }]
            }
          ]} 
        />
        <Text style={[styles.statusText, { color: themeColors.textSecondary }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    );
  };

  const StatsCard: React.FC = () => {
    return (
      <View style={[styles.card, {
        backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.elevated : designTokens.surfaces.light.elevated,
        borderColor: theme === 'dark' ? designTokens.borders.dark.subtle : designTokens.borders.light.subtle,
      }]}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: themeColors.text }]}>
              {Math.floor(Math.random() * 50) + 15}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
              Conversations
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: themeColors.borders.subtle }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: themeColors.text }]}>
              {Math.floor(Math.random() * 100) + 25}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
              Insights
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: themeColors.borders.subtle }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: themeColors.text }]}>
              {Math.floor(Math.random() * 8) + 3}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
              Connections
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const ActivityCard: React.FC = () => {
    return (
      <View style={[styles.card, {
        backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.elevated : designTokens.surfaces.light.elevated,
        borderColor: theme === 'dark' ? designTokens.borders.dark.subtle : designTokens.borders.light.subtle,
      }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Recent Activity
        </Text>
        <View style={styles.activityItem}>
          <Feather name="message-circle" size={16} color={designTokens.pastels.cyan} />
          <Text style={[styles.activityText, { color: themeColors.textSecondary }]}>
            Deep conversation about creativity and AI
          </Text>
          <Text style={[styles.activityTime, { color: themeColors.textMuted }]}>
            2h ago
          </Text>
        </View>
        <View style={styles.activityItem}>
          <Feather name="zap" size={16} color={designTokens.pastels.yellow} />
          <Text style={[styles.activityText, { color: themeColors.textSecondary }]}>
            Discovered new behavioral patterns
          </Text>
          <Text style={[styles.activityTime, { color: themeColors.textMuted }]}>
            1d ago
          </Text>
        </View>
        <View style={styles.activityItem}>
          <Feather name="users" size={16} color={designTokens.pastels.purple} />
          <Text style={[styles.activityText, { color: themeColors.textSecondary }]}>
            Connected with a Growth Companion
          </Text>
          <Text style={[styles.activityTime, { color: themeColors.textMuted }]}>
            3d ago
          </Text>
        </View>
      </View>
    );
  };

  const InterestsCard: React.FC = () => {
    const interests = ['Behavioral Analysis', 'Creative Writing', 'Philosophy', 'Tech Innovation', 'Personal Growth'];
    
    return (
      <View style={[styles.card, {
        backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.elevated : designTokens.surfaces.light.elevated,
        borderColor: theme === 'dark' ? designTokens.borders.dark.subtle : designTokens.borders.light.subtle,
      }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Interests
        </Text>
        <View style={styles.interestsContainer}>
          {interests.map((interest, index) => (
            <View key={index} style={[styles.interestTag, { 
              backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.highlight : designTokens.surfaces.light.sunken,
              borderColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default
            }]}>
              <Text style={[styles.interestText, { color: themeColors.text }]}>
                {interest}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <PageBackground theme={theme}>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
        
        {/* Header */}
        <Header 
          title="Profile"
          showBackButton={true}
          showMenuButton={false}
          onBackPress={onNavigateBack}
          theme={theme}
        />
        
        {/* Edit Button */}
        <Animated.View style={[styles.headerButtonContainer, { opacity: editButtonOpacity }]}>
          <TouchableOpacity
            style={[
              styles.headerButton,
              {
                backgroundColor: theme === 'dark' 
                  ? designTokens.surfaces.dark.elevated
                  : designTokens.brand.primary,
                borderColor: theme === 'dark' 
                  ? designTokens.borders.dark.default
                  : designTokens.borders.light.accent,
              }
            ]}
            onPress={editMode ? saveProfile : () => {
              // Light haptic for entering edit mode
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEditMode(true);
            }}
          >
            <Feather 
              name={editMode ? 'check' : 'edit'} 
              size={18} 
              color={theme === 'dark' ? designTokens.pastels.cyan : designTokens.text.primary} 
            />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.contentContainer}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={themeColors.primary}
                colors={[themeColors.primary]}
              />
            }
          >
            <Animated.View style={{ opacity: profileContentOpacity }}>
              {/* Rectangular Header with Profile Picture */}
              <View style={[styles.rectangularHeader, { 
                backgroundColor: theme === 'dark' ? designTokens.pastels.purple : designTokens.pastels.cyan 
              }]}>
                {/* Header Background Pattern */}
                <View style={[styles.headerPattern, { 
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' 
                }]} />
                
                {/* Left-aligned Profile Picture */}
                <TouchableOpacity 
                  style={styles.headerProfileContainer}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  {profile.profileImage ? (
                    <Image source={{ uri: profile.profileImage }} style={styles.headerProfileImage} />
                  ) : (
                    <View style={[styles.headerProfileImage, styles.headerPlaceholderImage, { 
                      backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.highlight : 'rgba(255,255,255,0.2)' 
                    }]}>
                      <Feather 
                        name="user" 
                        size={32} 
                        color={theme === 'dark' ? themeColors.textMuted : 'rgba(255,255,255,0.8)'} 
                      />
                    </View>
                  )}
                  {/* Upload Overlay - Always visible for upload */}
                  <View style={styles.uploadOverlay}>
                    <Feather name="camera" size={14} color="white" />
                  </View>
                </TouchableOpacity>

                {/* Profile Info - Right side */}
                <View style={styles.headerProfileInfo}>
                  <Text style={[styles.headerDisplayName, { color: '#fff' }]}>
                    {profile.displayName}
                  </Text>
                  <Text style={[styles.headerUsername, { color: 'rgba(255,255,255,0.8)' }]}>
                    @{profile.displayName.toLowerCase().replace(/\s/g, '')}
                  </Text>
                  <StatusIndicator status={profile.status || 'online'} />
                </View>
              </View>

              {/* Profile Fields Container */}
              <View style={styles.profileFieldsContainer}>

                {/* Display Name */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>
                    Display Name
                  </Text>
                  {editMode ? (
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.highlight : designTokens.surfaces.light.elevated,
                        color: themeColors.text,
                        borderColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default
                      }]}
                      value={profile.displayName}
                      onChangeText={(text) => handleFieldChange('displayName', text)}
                      placeholder="Enter your name"
                      placeholderTextColor={themeColors.textMuted}
                    />
                  ) : (
                    <Text style={[styles.fieldValue, { color: themeColors.text }]}>
                      {profile.displayName}
                    </Text>
                  )}
                </View>

                {/* Bio */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>
                    Bio
                  </Text>
                  {editMode ? (
                    <TextInput
                      style={[styles.input, styles.textArea, { 
                        backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.highlight : designTokens.surfaces.light.elevated,
                        color: themeColors.text,
                        borderColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default
                      }]}
                      value={profile.bio}
                      onChangeText={(text) => handleFieldChange('bio', text)}
                      placeholder="Tell us about yourself"
                      placeholderTextColor={themeColors.textMuted}
                      multiline
                      numberOfLines={4}
                    />
                  ) : (
                    <Text style={[styles.fieldValue, { color: themeColors.text }]}>
                      {profile.bio || 'No bio yet'}
                    </Text>
                  )}
                </View>

                {/* Location */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>
                    Location
                  </Text>
                  {editMode ? (
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.highlight : designTokens.surfaces.light.elevated,
                        color: themeColors.text,
                        borderColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default
                      }]}
                      value={profile.location}
                      onChangeText={(text) => handleFieldChange('location', text)}
                      placeholder="Where are you from?"
                      placeholderTextColor={themeColors.textMuted}
                    />
                  ) : (
                    <Text style={[styles.fieldValue, { color: themeColors.text }]}>
                      {profile.location || 'No location set'}
                    </Text>
                  )}
                </View>

                {/* Join Date */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>
                    Member Since
                  </Text>
                  <Text style={[styles.fieldValue, { color: themeColors.textMuted }]}>
                    {profile.joinDate}
                  </Text>
                </View>
              </View>

              {/* Stats Card */}
              <StatsCard />

              {/* Recent Activity */}
              <ActivityCard />

              {/* Interests */}
              <InterestsCard />
            </Animated.View>
          </ScrollView>
        </View>
        
        {/* Success Screen Overlay */}
        {showSuccessScreen && (
          <Animated.View style={[
            styles.successOverlay,
            {
              opacity: overlayOpacity,
            }
          ]}>
            <Animated.View style={[
              styles.successContainer,
              {
                backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.elevated : designTokens.pastels.mint,
                borderColor: theme === 'dark' 
                  ? designTokens.borders.dark.default
                  : designTokens.borders.light.accent,
                opacity: containerOpacity,
                transform: [{ scale: containerScale }],
              }
            ]}>
              <Animated.View
                style={{
                  transform: [
                    { scale: Animated.multiply(iconScale, pulseScale) },
                    { 
                      rotate: iconRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }) 
                    }
                  ]
                }}
              >
                <Feather 
                  name="check-circle" 
                  size={24} 
                  color={theme === 'dark' ? designTokens.pastels.cyan : designTokens.text.primary} 
                />
              </Animated.View>
              
              <Animated.View
                style={{
                  opacity: titleOpacity,
                  transform: [{ translateY: titleTranslateY }],
                }}
              >
                <Text style={[
                  styles.successTitle,
                  { color: themeColors.text }
                ]}>
                  Profile Updated!
                </Text>
              </Animated.View>
              
              <Animated.View
                style={{
                  opacity: messageOpacity,
                  transform: [{ translateY: messageTranslateY }],
                }}
              >
                <Text style={[
                  styles.successMessage,
                  { color: themeColors.textSecondary }
                ]}>
                  Your changes have been saved successfully
                </Text>
              </Animated.View>
              
              {/* Close Button */}
              <Animated.View
                style={{
                  opacity: closeButtonOpacity,
                  transform: [{ translateY: closeButtonTranslateY }],
                  marginTop: 24,
                  width: '100%',
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    {
                      backgroundColor: theme === 'dark' ? designTokens.pastels.cyan : designTokens.text.primary,
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    hideSuccessScreen();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.closeButtonText,
                    { color: theme === 'dark' ? designTokens.text.primary : '#ffffff' }
                  ]}>
                    Continue
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        )}
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 80,
  },
  headerButtonContainer: {
    position: 'absolute',
    top: 140,
    right: 35,
    zIndex: 1000,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  
  // Rectangular Header Styles
  rectangularHeader: {
    position: 'relative',
    width: '100%',
    height: 160,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: '100%',
    transform: [{ skewX: '-15deg' }],
  },
  headerProfileContainer: {
    position: 'relative',
    zIndex: 2,
  },
  headerProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerPlaceholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  uploadOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerProfileInfo: {
    flex: 1,
    marginLeft: 20,
    zIndex: 2,
  },
  headerDisplayName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'CrimsonPro_700Bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerUsername: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    marginBottom: 8,
  },
  
  profileFieldsContainer: {
    paddingHorizontal: 20,
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Nunito_600SemiBold',
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    minHeight: 50,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  
  // Status styles
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // Card styles
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'CrimsonPro_700Bold',
    marginBottom: 16,
  },
  
  // Stats styles
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 20,
  },
  
  // Activity styles
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 114, 128, 0.1)',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  
  // Interests styles
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  
  // Success overlay styles
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  successContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'CrimsonPro_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  closeButton: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
});

export default ProfileScreen;