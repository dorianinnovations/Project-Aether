import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Design System
import { PageBackground } from '../design-system/components/atoms/PageBackground';
import { Header } from '../design-system/components/organisms';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../design-system/tokens/typography';
import { spacing } from '../design-system/tokens/spacing';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handleNavigateBack = () => {
    navigation.goBack();
  };

  return (
    <PageBackground theme={theme}>
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

        <View style={styles.content}>
          <Text style={styles.title}>Profile Screen</Text>
        </View>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  },
  title: {
    ...typography.textStyles.headlineLarge,
    textAlign: 'center',
  },
});

export default ProfileScreen;