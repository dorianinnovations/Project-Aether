/**
 * Storage Cleanup Utility
 * Fixes cross-account data contamination by migrating to user-specific storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserStorageKeys } from '../constants';

export class StorageCleanup {
  /**
   * Clean up contaminated storage and migrate to user-specific keys
   */
  static async cleanupUserStorage(userId: string): Promise<void> {
    try {
      
      // Get all storage keys
      const allKeys = await AsyncStorage.getAllKeys();
      const userKeys = getUserStorageKeys(userId);
      
      // Remove any temp storage that might be contaminated
      const tempKeys = getUserStorageKeys();
      const keysToRemove = [
        tempKeys.USER_DATA,
        tempKeys.SETTINGS,
        tempKeys.CONVERSATIONS,
        tempKeys.CACHE,
        // Legacy keys that might cause contamination
        '@numina_user_data',
        '@aether/user_data',
        '@numina_settings',
        '@aether/settings',
      ];
      
      await Promise.all(
        keysToRemove.map(key => AsyncStorage.removeItem(key))
      );
      
    } catch (error) {
      console.error('❌ Storage cleanup error:', error);
    }
  }

  /**
   * Remove all user data for logout (user-specific only)
   */
  static async clearUserData(userId: string): Promise<void> {
    try {
      const userKeys = getUserStorageKeys(userId);
      
      await Promise.all([
        AsyncStorage.removeItem(userKeys.USER_DATA),
        AsyncStorage.removeItem(userKeys.SETTINGS),
        AsyncStorage.removeItem(userKeys.CONVERSATIONS),
        AsyncStorage.removeItem(userKeys.CACHE),
      ]);
      
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  /**
   * Emergency cleanup - removes all user-specific data across all users
   * Use only for debugging or when switching between dev/prod
   */
  static async emergencyCleanup(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Find all user-specific keys
      const userSpecificKeys = allKeys.filter(key => 
        key.includes('_user_data_') || 
        key.includes('_settings_') || 
        key.includes('_conversations_') ||
        key.includes('_cache_')
      );
      
      // Also include legacy contaminated keys
      const legacyKeys = [
        '@numina_user_data',
        '@aether/user_data', 
        '@numina_settings',
        '@aether/settings',
      ];
      
      const allKeysToRemove = [...userSpecificKeys, ...legacyKeys];
      
      await Promise.all(
        allKeysToRemove.map(key => AsyncStorage.removeItem(key))
      );
      
    } catch (error) {
      console.error('Emergency cleanup error:', error);
    }
  }

  /**
   * Verify storage isolation - check if any cross-contamination exists
   */
  static async verifyStorageIsolation(): Promise<boolean> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Check for non-user-specific data keys that could cause contamination
      const contaminatedKeys = allKeys.filter(key => 
        (key.includes('user_data') && !key.includes('_user_data_')) ||
        (key.includes('settings') && !key.includes('_settings_')) ||
        key === '@numina_user_data' ||
        key === '@aether/user_data'
      );
      
      if (contaminatedKeys.length > 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Storage verification error:', error);
      return false;
    }
  }
}

export default StorageCleanup;