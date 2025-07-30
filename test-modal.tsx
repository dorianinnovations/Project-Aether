import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';

interface TestModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TestModal = ({ visible, onClose }: TestModalProps) => {
  if (!visible) return null;
  
  return (
    <Modal visible={visible} transparent>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
          <Text>Test Modal Works!</Text>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 10, padding: 10, backgroundColor: 'blue' }}>
            <Text style={{ color: 'white' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};