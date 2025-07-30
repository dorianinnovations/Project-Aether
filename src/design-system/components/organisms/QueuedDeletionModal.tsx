/**
 * QueuedDeletionModal - Shows deletion progress with transparency
 * Provides users peace of mind when deletions are queued
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSpring,
  Easing,
} from 'react-native-reanimated';

// Design System
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { designTokens } from '../../tokens/colors';

// Services
import { ConversationAPI } from '../../../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface QueuedDeletionModalProps {
  visible: boolean;
  onClose: () => void;
  taskId?: string;
  taskType: 'single' | 'all' | 'userData';
  initialMessage?: string;
}

interface TaskStatus {
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
  progress: number;
  queuePosition?: number;
  estimatedDuration?: number;
  result?: {
    conversationsDeleted?: number;
    memoryEntriesDeleted?: number;
    settingsCleared?: boolean;
  };
}

const QueuedDeletionModal: React.FC<QueuedDeletionModalProps> = ({
  visible,
  onClose,
  taskId,
  taskType,
  initialMessage,
}) => {
  const { theme, colors } = useTheme();
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const modalScale = useSharedValue(0.3);
  const modalOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.7);

  const glassmorphicStyle = getGlassmorphicStyle('overlay', theme);

  // Start modal animation
  useEffect(() => {
    if (visible) {
      modalScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      modalOpacity.value = withTiming(1, { duration: 300 });
      
      // Start pulsing animation for processing
      pulseOpacity.value = withRepeat(
        withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else {
      modalScale.value = withTiming(0.3, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 200 });
      progressWidth.value = 0;
      checkScale.value = 0;
    }
  }, [visible]);

  // Poll task status
  useEffect(() => {
    if (visible && taskId && !isPolling) {
      setIsPolling(true);
      pollTaskStatus();
    }
  }, [visible, taskId]);

  // Update progress animation
  useEffect(() => {
    if (taskStatus) {
      progressWidth.value = withTiming(taskStatus.progress, {
        duration: 500,
        easing: Easing.out(Easing.quad),
      });

      if (taskStatus.status === 'completed') {
        checkScale.value = withSpring(1, { damping: 8, stiffness: 150 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [taskStatus]);

  const pollTaskStatus = async () => {
    if (!taskId) return;

    try {
      const response = await ConversationAPI.getDeletionTaskStatus(taskId);
      
      if (response.success) {
        setTaskStatus(response.task);
        setError(null);

        // Continue polling if not completed or failed
        if (response.task.status === 'queued' || response.task.status === 'processing') {
          setTimeout(() => {
            if (visible) pollTaskStatus();
          }, 2000); // Poll every 2 seconds
        } else {
          setIsPolling(false);
          
          // Auto-close after completion (with delay for user to see result)
          if (response.task.status === 'completed') {
            setTimeout(() => {
              onClose();
            }, 3000);
          }
        }
      }
    } catch (err: any) {
      console.error('Error polling task status:', err);
      setError(err.message || 'Failed to get task status');
      setIsPolling(false);
    }
  };

  const getStatusIcon = () => {
    if (!taskStatus) return 'clock-outline';
    
    switch (taskStatus.status) {
      case 'queued':
        return 'clock-outline';
      case 'processing':
        return 'cog-outline';
      case 'completed':
        return 'check-circle';
      case 'failed':
        return 'alert-circle';
      default:
        return 'clock-outline';
    }
  };

  const getStatusColor = () => {
    if (!taskStatus) return colors.textMuted;
    
    switch (taskStatus.status) {
      case 'queued':
        return designTokens.pastels.orange;
      case 'processing':
        return designTokens.pastels.cyan;
      case 'completed':
        return designTokens.success;
      case 'failed':
        return designTokens.error;
      default:
        return colors.textMuted;
    }
  };

  const getTaskTypeTitle = () => {
    switch (taskType) {
      case 'single':
        return 'Deleting Conversation';
      case 'all':
        return 'Clearing All Conversations';
      case 'userData':
        return 'Clearing User Data';
      default:
        return 'Processing Deletion';
    }
  };

  const formatEstimatedTime = (seconds?: number) => {
    if (!seconds) return '';
    
    if (seconds < 60) return `~${seconds}s`;
    if (seconds < 3600) return `~${Math.ceil(seconds / 60)}m`;
    return `~${Math.ceil(seconds / 3600)}h`;
  };

  // Animated styles
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.contentContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={48}
            color={designTokens.error}
          />
          <Text style={[styles.title, { color: colors.text }]}>
            Error Getting Status
          </Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: colors.surface }]}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!taskStatus) {
      return (
        <View style={styles.contentContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            {getTaskTypeTitle()}
          </Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>
            {initialMessage || 'Initializing deletion request...'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {/* Status Icon */}
        <View style={styles.iconContainer}>
          {taskStatus.status === 'processing' && (
            <Animated.View style={[styles.pulseRing, pulseAnimatedStyle]}>
              <View style={[styles.pulseRing, { backgroundColor: getStatusColor() }]} />
            </Animated.View>
          )}
          
          <MaterialCommunityIcons
            name={getStatusIcon()}
            size={48}
            color={getStatusColor()}
          />
          
          {taskStatus.status === 'completed' && (
            <Animated.View style={[styles.checkOverlay, checkAnimatedStyle]}>
              <FontAwesome5
                name="check"
                size={20}
                color={designTokens.text.primaryDark}
              />
            </Animated.View>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {getTaskTypeTitle()}
        </Text>

        {/* Status Message */}
        <Text style={[styles.message, { color: colors.textMuted }]}>
          {taskStatus.message}
        </Text>

        {/* Queue Position */}
        {taskStatus.status === 'queued' && taskStatus.queuePosition && (
          <View style={styles.queueInfo}>
            <MaterialCommunityIcons
              name="queue-first-in-first-out"
              size={16}
              color={colors.textMuted}
            />
            <Text style={[styles.queueText, { color: colors.textMuted }]}>
              Position {taskStatus.queuePosition} in queue
            </Text>
          </View>
        )}

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaces.sunken }]}>
            <Animated.View
              style={[
                styles.progressFill,
                progressAnimatedStyle,
                { backgroundColor: getStatusColor() }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>
            {Math.round(taskStatus.progress)}%
          </Text>
        </View>

        {/* Estimated Time */}
        {taskStatus.estimatedDuration && taskStatus.status !== 'completed' && (
          <Text style={[styles.estimatedTime, { color: colors.textMuted }]}>
            Estimated time: {formatEstimatedTime(taskStatus.estimatedDuration)}
          </Text>
        )}

        {/* Results */}
        {taskStatus.status === 'completed' && taskStatus.result && (
          <View style={styles.resultsContainer}>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>
              Completed ✅
            </Text>
            {taskStatus.result.conversationsDeleted !== undefined && (
              <Text style={[styles.resultItem, { color: colors.textMuted }]}>
                • {taskStatus.result.conversationsDeleted} conversations deleted
              </Text>
            )}
            {taskStatus.result.memoryEntriesDeleted !== undefined && (
              <Text style={[styles.resultItem, { color: colors.textMuted }]}>
                • {taskStatus.result.memoryEntriesDeleted} memory entries cleared
              </Text>
            )}
            {taskStatus.result.settingsCleared && (
              <Text style={[styles.resultItem, { color: colors.textMuted }]}>
                • Settings cleared
              </Text>
            )}
          </View>
        )}

        {/* Action Button */}
        {(taskStatus.status === 'completed' || taskStatus.status === 'failed') && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: colors.surface }]}>
              {taskStatus.status === 'completed' ? 'Done' : 'Close'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={taskStatus?.status === 'completed' ? onClose : undefined}
          activeOpacity={1}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            glassmorphicStyle,
            { borderColor: colors.borders.default },
            modalAnimatedStyle
          ]}
        >
          {renderContent()}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: screenWidth * 0.85,
    maxWidth: 350,
    borderRadius: 20,
    padding: spacing[6],
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  contentContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: spacing[4],
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -16,
    left: -16,
    opacity: 0.3,
  },
  checkOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: designTokens.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  message: {
    ...typography.textStyles.bodyMedium,
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: 22,
  },
  queueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    gap: spacing[1],
  },
  queueText: {
    ...typography.textStyles.caption,
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    marginBottom: spacing[3],
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginBottom: spacing[1],
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...typography.textStyles.caption,
    textAlign: 'center',
    fontWeight: '600',
  },
  estimatedTime: {
    ...typography.textStyles.caption,
    textAlign: 'center',
    marginBottom: spacing[3],
    fontStyle: 'italic',
  },
  resultsContainer: {
    width: '100%',
    marginBottom: spacing[4],
    padding: spacing[3],
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  resultsTitle: {
    ...typography.textStyles.labelMedium,
    fontWeight: '700',
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  resultItem: {
    ...typography.textStyles.bodySmall,
    marginBottom: spacing[1],
  },
  button: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 12,
    marginTop: spacing[2],
  },
  buttonText: {
    ...typography.textStyles.labelMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default QueuedDeletionModal;