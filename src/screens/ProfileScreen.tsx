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
import { Header } from '../design-system/components/organisms';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../design-system/tokens/typography';
import { spacing } from '../design-system/tokens/spacing';

// Services
import { UserAPI, TokenManager } from '../services/api';

interface UserProfile {
  profilePicture?: string;
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

  useEffect(() => {
    loadProfile();
  }, []);

  const handleNavigateBack = () => {
    navigation.goBack();
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
            onBackPress={handleNavigateBack}
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
            onBackPress={handleNavigateBack}
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
          onBackPress={handleNavigateBack}
          theme={theme}
        />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <TouchableOpacity 
              style={styles.profileImageContainer} 
              onPress={pickImage}
              disabled={uploading}
            >
              {profile.profilePicture ? (
                <Image source={{ uri: profile.profilePicture }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.placeholderImage, { backgroundColor: colors.surface }]}>
                  <Feather name="user" size={48} color={colors.textSecondary} />
                </View>
              )}
              {uploading ? (
                <View style={[styles.editImageOverlay, { backgroundColor: colors.primary }]}>
                  <ActivityIndicator size={16} color="white" />
                </View>
              ) : (
                <View style={[styles.editImageOverlay, { backgroundColor: colors.primary }]}>
                  <Feather name="camera" size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>
            
            {/* Delete Profile Picture Button */}
            {profile.profilePicture && !uploading && (
              <TouchableOpacity 
                style={[styles.deleteImageButton, { backgroundColor: '#ff4757' }]}
                onPress={deleteProfilePicture}
              >
                <Feather name="trash-2" size={16} color="white" />
                <Text style={styles.deleteImageText}>Remove Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Fields */}
          <View style={styles.fieldsContainer}>
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</Text>
              {editMode ? (
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.borders.default
                  }]}
                  value={profile.name || ''}
                  onChangeText={(text) => handleFieldChange('name', text)}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textSecondary}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {profile.name || 'No name set'}
                </Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
              <Text style={[styles.fieldValue, { color: colors.text, opacity: 0.7 }]}>
                {profile.email}
              </Text>
              <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>
                Email cannot be changed from this screen
              </Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>User ID</Text>
              <Text style={[styles.fieldValue, { color: colors.textSecondary, fontSize: 12, fontFamily: 'monospace' }]}>
                {profile.id}
              </Text>
            </View>
          </View>

          {/* Edit/Save Button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={editMode ? saveProfile : () => setEditMode(true)}
          >
            <Feather 
              name={editMode ? 'save' : 'edit'} 
              size={18} 
              color="white" 
            />
            <Text style={styles.actionButtonText}>
              {editMode ? 'Save Changes' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing[5],
    marginTop: spacing[6],
    paddingVertical: spacing[4],
    borderRadius: 12,
    gap: spacing[2],
  },
  actionButtonText: {
    color: 'white',
    ...typography.textStyles.bodyLarge,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    gap: spacing[1],
  },
  deleteImageText: {
    color: 'white',
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