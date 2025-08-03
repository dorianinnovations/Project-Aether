import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Design System
import { PageBackground } from '../design-system/components/atoms/PageBackground';
import { Header, HeaderMenu, SignOutModal } from '../design-system/components/organisms';
import { useTheme } from '../contexts/ThemeContext';
import { useHeaderMenu } from '../design-system/hooks';
import { typography } from '../design-system/tokens/typography';
import { spacing } from '../design-system/tokens/spacing';
import { getButtonColors } from '../design-system/tokens/colors';

// Services
import { UserAPI, TokenManager, AuthAPI } from '../services/api';

interface UserProfile {
  profilePicture?: string;
  bannerImage?: string;
  name?: string;
  email: string;
  id: string;
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, colors } = useTheme();
  
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Header menu hook
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'profile',
    onSignOut: () => setShowSignOutModal(true)
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const handleNavigateBack = () => {
    navigation.goBack();
  };

  const handleMenuPress = () => {
    toggleHeaderMenu();
  };

  const handleSignOut = async () => {
    try {
      setShowSignOutModal(false);
      await AuthAPI.logout();
      // Auth check in App.tsx will handle navigation automatically
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await UserAPI.getProfile();
      
      if (response.status === 'success') {
        const userData = response.data.user;
        setProfile({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          profilePicture: response.data.profilePicture,
          bannerImage: response.data.bannerImage,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      // For now, we'll just update the name through the auth system
      // A full profile update endpoint could be added later
      Alert.alert('Success', 'Profile changes saved locally!');
      setEditMode(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
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
      try {
        setUploading(true);
        const response = await UserAPI.uploadProfilePicture(result.assets[0].uri);
        
        if (response.status === 'success') {
          // Update local profile state with new picture
          setProfile(prev => prev ? {
            ...prev,
            profilePicture: response.data.profilePicture
          } : null);
          Alert.alert('Success', 'Profile picture updated successfully!');
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const pickBannerImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library permissions.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        setUploading(true);
        const response = await UserAPI.uploadBannerImage(result.assets[0].uri);
        
        if (response.status === 'success') {
          // Update local profile state with new banner
          setProfile(prev => prev ? {
            ...prev,
            bannerImage: response.data.bannerImage
          } : null);
          Alert.alert('Success', 'Banner image updated successfully!');
        }
      } catch (error) {
        console.error('Error uploading banner image:', error);
        Alert.alert('Error', 'Failed to upload banner image. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const deleteProfilePicture = async () => {
    Alert.alert(
      'Delete Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploading(true);
              await UserAPI.deleteProfilePicture();
              
              // Update local profile state
              setProfile(prev => prev ? {
                ...prev,
                profilePicture: undefined
              } : null);
              Alert.alert('Success', 'Profile picture deleted successfully!');
            } catch (error) {
              console.error('Error deleting profile picture:', error);
              Alert.alert('Error', 'Failed to delete profile picture. Please try again.');
            } finally {
              setUploading(false);
            }
          }
        }
      ]
    );
  };

  const deleteBannerImage = async () => {
    Alert.alert(
      'Delete Banner Image',
      'Are you sure you want to remove your banner image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploading(true);
              await UserAPI.deleteBannerImage();
              
              // Update local profile state
              setProfile(prev => prev ? {
                ...prev,
                bannerImage: undefined
              } : null);
              Alert.alert('Success', 'Banner image deleted successfully!');
            } catch (error) {
              console.error('Error deleting banner image:', error);
              Alert.alert('Error', 'Failed to delete banner image. Please try again.');
            } finally {
              setUploading(false);
            }
          }
        }
      ]
    );
  };

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    if (!profile) return;
    setProfile(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null);
  };

  if (loading) {
    return (
      <PageBackground theme={theme} variant="profile">
        <SafeAreaView style={styles.container}>
          <StatusBar 
            barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
            backgroundColor="transparent"
            translucent={true}
          />
          <Header 
            title="Profile"
            showBackButton={true}
            showMenuButton={true}
            onBackPress={handleNavigateBack}
            onMenuPress={handleMenuPress}
            isMenuOpen={showHeaderMenu}
            theme={theme}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
          </View>
        </SafeAreaView>
      </PageBackground>
    );
  }

  if (!profile) {
    return (
      <PageBackground theme={theme} variant="profile">
        <SafeAreaView style={styles.container}>
          <StatusBar 
            barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
            backgroundColor="transparent"
            translucent={true}
          />
          <Header 
            title="Profile"
            showBackButton={true}
            showMenuButton={true}
            onBackPress={handleNavigateBack}
            onMenuPress={handleMenuPress}
            isMenuOpen={showHeaderMenu}
            theme={theme}
          />
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text }]}>Failed to load profile</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={loadProfile}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </PageBackground>
    );
  }

  return (
    <PageBackground theme={theme} variant="profile">
      <SafeAreaView style={styles.container}>
          <StatusBar 
            barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
            backgroundColor="transparent"
            translucent={true}
          />
          
          <Header 
            title="Profile"
            showBackButton={true}
            showMenuButton={true}
            onBackPress={handleNavigateBack}
            onMenuPress={handleMenuPress}
            isMenuOpen={showHeaderMenu}
            theme={theme}
            rightIcon={
              <TouchableOpacity
                onPress={editMode ? saveProfile : () => setEditMode(true)}
                activeOpacity={0.7}
                style={styles.headerIcon}
              >
                <Feather 
                  name={editMode ? 'save' : 'edit'} 
                  size={18} 
                  color={colors.text}
                />
              </TouchableOpacity>
            }
          />

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Profile Banner */}
          <TouchableOpacity 
            style={[styles.profileBanner, { backgroundColor: colors.surface }]}
            onPress={editMode ? pickBannerImage : undefined}
            disabled={uploading || !editMode}
            activeOpacity={editMode ? 0.8 : 1}
          >
            {profile.bannerImage && (
              <Image source={{ uri: profile.bannerImage }} style={styles.bannerImage} />
            )}
            {editMode && (
              <View style={[styles.bannerOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                <Feather name="camera" size={24} color="white" />
                <Text style={styles.bannerOverlayText}>Change Banner</Text>
              </View>
            )}
            {/* Delete Banner Button - only show in edit mode and when banner exists */}
            {profile.bannerImage && !uploading && editMode && (
              <TouchableOpacity 
                style={[styles.deleteBannerButton, { backgroundColor: '#98FB98' }]}
                onPress={deleteBannerImage}
              >
                <Feather name="x" size={16} color="#2D5A3D" />
              </TouchableOpacity>
            )}
            {/* Online Status Indicator */}
            <View style={[styles.onlineIndicator, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
              <View style={[styles.onlineDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.onlineText, { color: '#4CAF50' }]}>online</Text>
            </View>
            
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              
              <TouchableOpacity 
                style={styles.profileImageContainer} 
                onPress={editMode ? pickImage : undefined}
                disabled={uploading || !editMode}
              >
                {profile.profilePicture ? (
                  <Image source={{ uri: profile.profilePicture }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.profileImage, styles.placeholderImage, { backgroundColor: colors.surface }]}>
                    <Feather name="user" size={48} color={colors.textSecondary} />
                  </View>
                )}
                {editMode && (uploading ? (
                  <View style={[styles.editImageOverlay, { backgroundColor: '#87CEEB' }]}>
                    <ActivityIndicator size={16} color="white" />
                  </View>
                ) : (
                  <View style={[styles.editImageOverlay, { backgroundColor: '#87CEEB' }]}>
                    <Feather name="camera" size={16} color="white" />
                  </View>
                ))}
                {/* Delete Profile Picture Button - only show in edit mode */}
                {profile.profilePicture && !uploading && editMode && (
                  <TouchableOpacity 
                    style={[styles.deleteImageButton, { backgroundColor: '#98FB98' }]}
                    onPress={deleteProfilePicture}
                  >
                    <Feather name="x" size={14} color="#2D5A3D" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Profile Fields */}
          <View style={styles.fieldsContainer}>
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Username</Text>
              {editMode ? (
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.borders.default
                  }]}
                  value={profile.name || ''}
                  onChangeText={(text) => handleFieldChange('name', text)}
                  placeholder="Enter your username"
                  placeholderTextColor={colors.textSecondary}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {profile.name || 'No username set'}
                </Text>
              )}
            </View>


          </View>

        </ScrollView>
        

        {/* Header Menu */}
        <HeaderMenu
          visible={showHeaderMenu}
          onClose={() => setShowHeaderMenu(false)}
          onAction={handleMenuAction}
          showAuthOptions={true}
        />

        {/* Sign Out Modal */}
        <SignOutModal
          visible={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          onConfirm={handleSignOut}
          theme={theme}
        />
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 120,
    paddingBottom: 40,
  },
  profileBanner: {
    width: '100%',
    marginBottom: spacing[4],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'relative',
    overflow: 'visible',
    zIndex: 1,
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
  },
  bannerOverlayText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'flex-start',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[5],
    paddingBottom: 60,
    minHeight: 160,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -48,
    right: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'lowercase',
  },
  profileImageContainer: {
    position: 'absolute',
    bottom: -60,
    left: spacing[5],
    zIndex: 100,
    elevation: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldsContainer: {
    paddingHorizontal: spacing[5],
    paddingTop: 80,
  },
  fieldContainer: {
    marginBottom: spacing[5],
  },
  fieldLabel: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  fieldValue: {
    ...typography.textStyles.bodyLarge,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    ...typography.textStyles.bodyLarge,
    minHeight: 50,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  // Header Icon
  headerIcon: {
    padding: spacing[2],
  },
  
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: spacing[3],
    ...typography.textStyles.bodyMedium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: 100,
  },
  errorText: {
    ...typography.textStyles.bodyLarge,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  retryButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
  },
  
  // Profile picture delete button
  deleteImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  
  // Banner delete button
  deleteBannerButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  deleteImageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Field hint text
  fieldHint: {
    fontSize: 12,
    marginTop: spacing[1],
    fontStyle: 'italic',
  },
});

export default ProfileScreen;