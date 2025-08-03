import React from 'react';
import { View, Text } from 'react-native';
import { PageBackground } from '../../design-system/components/atoms/PageBackground';

export default function ConnectionsScreen() {
  return (
    <PageBackground>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Connections - Coming Soon</Text>
      </View>
    </PageBackground>
  );
}