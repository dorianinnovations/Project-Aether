/**
 * Example usage of DismissibleBanner component
 * Shows various ways to use the reusable dismissible banner
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import DismissibleBanner from '../atoms/DismissibleBanner';
import { useDismissibleBanner } from '../../hooks/useDismissibleBanner';
import Button from '../atoms/Button';
import { spacing } from '../../tokens/spacing';

const DismissibleBannerExample: React.FC = () => {
  // Example 1: Manual control
  const manualBanner = useDismissibleBanner({
    initialVisible: false,
  });

  // Example 2: Auto-show and auto-hide
  const autoBanner = useDismissibleBanner({
    autoShow: true,
    autoShowDelay: 2000,
    autoHide: true,
    autoHideDelay: 5000,
  });

  // Example 3: Persistent notification
  const notificationBanner = useDismissibleBanner({
    initialVisible: true,
  });

  // Example 4: Quick tip that auto-dismisses
  const tipBanner = useDismissibleBanner({
    autoShow: true,
    autoShowDelay: 1000,
    autoHide: true,
    autoHideDelay: 3000,
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>DismissibleBanner Examples</Text>
      
      {/* Example 1: Manual Control */}
      <View style={styles.section}>
        <Text style={styles.subHeading}>1. Manual Control</Text>
        <Button onPress={manualBanner.toggle}>
          {manualBanner.visible ? "Hide Banner" : "Show Banner"}
        </Button>
        <DismissibleBanner
          visible={manualBanner.visible}
          onDismiss={manualBanner.hide}
          title="Manual Banner"
          content="This banner is controlled manually using the hook"
          variant="default"
          style="glassmorphic"
        />
      </View>

      {/* Example 2: Auto Show/Hide */}
      <View style={styles.section}>
        <Text style={styles.subHeading}>2. Auto Show/Hide (5s delay)</Text>
        <Button onPress={autoBanner.reset}>
          Reset Auto Banner
        </Button>
        <DismissibleBanner
          visible={autoBanner.visible}
          onDismiss={autoBanner.hide}
          title="Auto Banner"
          content="This banner appears automatically and disappears after 5 seconds"
          variant="info"
          style="neumorphic"
          autoDismiss={true}
          autoDismissDelay={5000}
        />
      </View>

      {/* Example 3: Different Variants */}
      <View style={styles.section}>
        <Text style={styles.subHeading}>3. Different Variants</Text>
        
        <DismissibleBanner
          visible={notificationBanner.visible}
          onDismiss={notificationBanner.hide}
          title="Success!"
          content="Your action was completed successfully"
          variant="success"
          style="minimal"
        />
        
        <DismissibleBanner
          visible={true}
          title="Warning"
          content="Please check your internet connection"
          variant="warning"
          style="glassmorphic"
          showCloseButton={false}
        />
        
        <DismissibleBanner
          visible={true}
          title="Error"
          content="Something went wrong. Please try again."
          variant="error"
          style="neumorphic"
        />
      </View>

      {/* Example 4: Quick Tip */}
      <View style={styles.section}>
        <Text style={styles.subHeading}>4. Quick Tip (Auto-dismiss)</Text>
        <Button onPress={tipBanner.reset}>
          Reset Tip
        </Button>
        <DismissibleBanner
          visible={tipBanner.visible}
          onDismiss={tipBanner.hide}
          content="Tip: You can swipe between tabs to navigate quickly!"
          variant="info"
          style="glassmorphic"
          showCloseButton={false}
          autoDismiss={true}
          autoDismissDelay={3000}
        />
      </View>

      {/* Example 5: Custom Content */}
      <View style={styles.section}>
        <Text style={styles.subHeading}>5. Custom Content</Text>
        <DismissibleBanner
          visible={true}
          content={
            <View style={styles.customContent}>
              <Text style={styles.customTitle}>Welcome to Aether!</Text>
              <Text style={styles.customText}>
                Experience the future of AI-powered conversations
              </Text>
              <Button onPress={() => console.log('Get started pressed')}>
                Get Started
              </Button>
            </View>
          }
          variant="default"
          style="glassmorphic"
        />
      </View>

      {/* Example 6: Position Variants */}
      <View style={styles.section}>
        <Text style={styles.subHeading}>6. Different Positions</Text>
        <Text style={styles.note}>
          Note: Top and bottom positioned banners are absolute positioned
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing[4],
    backgroundColor: '#f5f5f5',
  },
  
  heading: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: spacing[6],
    textAlign: 'center',
  },
  
  section: {
    marginBottom: spacing[6],
    gap: spacing[3],
  },
  
  subHeading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  
  note: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  
  customContent: {
    gap: spacing[2],
    alignItems: 'center',
  },
  
  customTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  customText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default DismissibleBannerExample;