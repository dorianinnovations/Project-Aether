/**
 * Aether Design System - Attachment Preview Component
 * Modern image and document preview with enhanced visual design
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing, borderRadius } from '../../tokens/spacing';
import { getNeumorphicStyle } from '../../tokens/shadows';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { MessageAttachment } from '../../../types';

const { width } = Dimensions.get('window');

interface AttachmentPreviewProps {
  attachments: MessageAttachment[];
  onRemoveAttachment: (attachmentId: string) => void;
  theme?: 'light' | 'dark';
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileIcon = (mimeType?: string): string => {
  if (!mimeType) return 'file';
  
  if (mimeType.includes('pdf')) return 'file-pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word';
  if (mimeType.includes('text')) return 'file-alt';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-excel';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'file-powerpoint';
  
  return 'file';
};

const ImagePreview: React.FC<{
  attachment: MessageAttachment;
  onRemove: () => void;
  theme: 'light' | 'dark';
}> = ({ attachment, onRemove, theme }) => {
  const themeColors = getThemeColors(theme);
  
  return (
    <View style={[
      styles.imagePreviewContainer,
      getGlassmorphicStyle('card', theme),
      {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.borders.subtle,
      }
    ]}>
      {/* Image Thumbnail */}
      <View style={styles.imageThumbnailContainer}>
        <Image
          source={{ uri: attachment.uri }}
          style={styles.imageThumbnail}
          resizeMode="cover"
        />
        
        {/* Status Overlay */}
        {attachment.uploadStatus === 'pending' && (
          <View style={styles.statusOverlay}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: designTokens.semantic.warning }
            ]} />
          </View>
        )}
        
        {attachment.uploadStatus === 'error' && (
          <View style={styles.statusOverlay}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: designTokens.semantic.error }
            ]} />
          </View>
        )}
      </View>
      
      {/* Image Info */}
      <View style={styles.imageInfo}>
        <Text
          style={[
            styles.imageName,
            typography.textStyles.bodySmall,
            { color: themeColors.text }
          ]}
          numberOfLines={1}
        >
          {attachment.name}
        </Text>
        <Text
          style={[
            styles.imageSize,
            typography.textStyles.caption,
            { color: themeColors.textMuted }
          ]}
        >
          {formatFileSize(attachment.size)}
        </Text>
      </View>
      
      {/* Remove Button */}
      <TouchableOpacity
        style={[
          styles.removeButton,
          getNeumorphicStyle('subtle', theme),
          { backgroundColor: themeColors.surface }
        ]}
        onPress={onRemove}
        activeOpacity={0.7}
      >
        <FontAwesome5
          name="times"
          size={12}
          color={themeColors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
};

const DocumentPreview: React.FC<{
  attachment: MessageAttachment;
  onRemove: () => void;
  theme: 'light' | 'dark';
}> = ({ attachment, onRemove, theme }) => {
  const themeColors = getThemeColors(theme);
  const fileIcon = getFileIcon(attachment.mimeType);
  
  return (
    <View style={[
      styles.documentPreviewContainer,
      getGlassmorphicStyle('card', theme),
      {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.borders.subtle,
      }
    ]}>
      {/* Document Icon */}
      <View style={[
        styles.documentIcon,
        {
          backgroundColor: attachment.mimeType?.includes('pdf') 
            ? 'rgba(239, 68, 68, 0.1)'
            : 'rgba(59, 130, 246, 0.1)'
        }
      ]}>
        <FontAwesome5
          name={fileIcon}
          size={20}
          color={attachment.mimeType?.includes('pdf') 
            ? designTokens.semantic.error
            : designTokens.semantic.info
          }
        />
        
        {/* Status Indicator */}
        {attachment.uploadStatus !== 'uploaded' && (
          <View style={[
            styles.documentStatusBadge,
            {
              backgroundColor: attachment.uploadStatus === 'error' 
                ? designTokens.semantic.error
                : designTokens.semantic.warning
            }
          ]} />
        )}
      </View>
      
      {/* Document Info */}
      <View style={styles.documentInfo}>
        <Text
          style={[
            styles.documentName,
            typography.textStyles.bodySmall,
            { color: themeColors.text }
          ]}
          numberOfLines={2}
        >
          {attachment.name}
        </Text>
        <Text
          style={[
            styles.documentSize,
            typography.textStyles.caption,
            { color: themeColors.textMuted }
          ]}
        >
          {formatFileSize(attachment.size)}
        </Text>
      </View>
      
      {/* Remove Button */}
      <TouchableOpacity
        style={[
          styles.removeButton,
          getNeumorphicStyle('subtle', theme),
          { backgroundColor: themeColors.surface }
        ]}
        onPress={onRemove}
        activeOpacity={0.7}
      >
        <FontAwesome5
          name="times"
          size={12}
          color={themeColors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
};

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachments,
  onRemoveAttachment,
  theme = 'light',
}) => {
  if (attachments.length === 0) return null;

  const images = attachments.filter(att => att.type === 'image');
  const documents = attachments.filter(att => att.type === 'document');

  return (
    <View style={styles.container}>
      {/* Image Previews */}
      {images.length > 0 && (
        <View style={styles.imagesContainer}>
          {images.map((attachment) => (
            <ImagePreview
              key={attachment.id}
              attachment={attachment}
              onRemove={() => onRemoveAttachment(attachment.id)}
              theme={theme}
            />
          ))}
        </View>
      )}
      
      {/* Document Previews */}
      {documents.length > 0 && (
        <View style={styles.documentsContainer}>
          {documents.map((attachment) => (
            <DocumentPreview
              key={attachment.id}
              attachment={attachment}
              onRemove={() => onRemoveAttachment(attachment.id)}
              theme={theme}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[2],
    gap: spacing[2],
  },
  
  // Image Preview Styles
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginHorizontal: spacing[2],
  },
  imagePreviewContainer: {
    width: (width - spacing[4] * 3) / 2, // Two columns with spacing
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumbnailContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: borderRadius.lg - 1,
    borderTopRightRadius: borderRadius.lg - 1,
  },
  statusOverlay: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  imageInfo: {
    padding: spacing[2],
    paddingRight: spacing[8], // Space for remove button
  },
  imageName: {
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  imageSize: {
    fontSize: 11,
  },
  
  // Document Preview Styles
  documentsContainer: {
    gap: spacing[2],
    marginHorizontal: spacing[2],
  },
  documentPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    position: 'relative',
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  documentStatusBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  documentInfo: {
    flex: 1,
    marginLeft: spacing[3],
    paddingRight: spacing[8], // Space for remove button
  },
  documentName: {
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  documentSize: {
    fontSize: 11,
  },
  
  // Shared Styles
  removeButton: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default AttachmentPreview;