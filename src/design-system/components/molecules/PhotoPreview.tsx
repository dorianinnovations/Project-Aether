import React, { useRef, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../contexts/ThemeContext';
import { MessageAttachment } from '../../../types';

const { width } = Dimensions.get('window');

interface PhotoPreviewProps {
  attachment: MessageAttachment;
  isUser: boolean;
  onPress?: () => void;
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  attachment,
  isUser,
  onPress,
}) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const isProcessing = attachment.uploadStatus === 'pending';
  const hasError = attachment.uploadStatus === 'error';
  const isCompleted = attachment.uploadStatus === 'uploaded';

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  const getImageDimensions = () => {
    const maxWidth = width * 0.6; // Max 60% of screen width
    const maxHeight = 200;
    
    if (attachment.width && attachment.height) {
      const aspectRatio = attachment.width / attachment.height;
      
      if (aspectRatio > 1) {
        // Landscape
        const calcWidth = Math.min(maxWidth, attachment.width);
        const calcHeight = calcWidth / aspectRatio;
        return {
          width: calcWidth,
          height: Math.min(maxHeight, calcHeight),
        };
      } else {
        // Portrait or square
        const calcHeight = Math.min(maxHeight, attachment.height);
        const calcWidth = calcHeight * aspectRatio;
        return {
          width: Math.min(maxWidth, calcWidth),
          height: calcHeight,
        };
      }
    }
    
    // Default dimensions
    return { width: maxWidth, height: 150 };
  };

  const { width: imageWidth, height: imageHeight } = getImageDimensions();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        isUser ? styles.userContainer : styles.aiContainer,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        disabled={isProcessing}
      >
        {isUser ? (
          // User photo with gradient like user messages
          <LinearGradient
            colors={theme === 'dark' 
              ? ['#2d2d2d', '#262626', '#232323'] 
              : ['#e3f2fd', '#bbdefb', '#90caf9']
            }
            style={[
              styles.photoContainer,
              styles.userPhotoContainer,
              {
                width: imageWidth,
                height: imageHeight,
                borderWidth: 1,
                borderColor: theme === 'dark' ? '#404040' : 'rgba(0, 0, 0, 0.1)',
                shadowColor: theme === 'dark' ? '#000000' : '#000000',
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
                shadowRadius: 4,
                elevation: 2,
              }
            ]}
          >
            <Image
              source={{ uri: attachment.uri }}
              style={[
                styles.photo,
                {
                  width: imageWidth - 4, // Account for gradient padding
                  height: imageHeight - 4,
                },
              ]}
              resizeMode="cover"
            />
          </LinearGradient>
        ) : (
          // AI photo - simpler style
          <View
            style={[
              styles.photoContainer,
              styles.aiPhotoContainer,
              {
                width: imageWidth,
                height: imageHeight,
                backgroundColor: 'transparent',
              }
            ]}
          >
            <Image
              source={{ uri: attachment.uri }}
              style={[
                styles.photo,
                styles.aiPhoto,
                {
                  width: imageWidth,
                  height: imageHeight,
                },
              ]}
              resizeMode="cover"
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  photoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  userPhotoContainer: {
    borderRadius: 8,
    padding: 2, // Small padding for gradient effect
  },
  aiPhotoContainer: {
    borderRadius: 12,
  },
  photo: {
    borderRadius: 6, // Slightly smaller radius for inner image
  },
  aiPhoto: {
    borderRadius: 12,
  },
});