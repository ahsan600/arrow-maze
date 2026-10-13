import React from 'react';
import { Modal as RNModal, View, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface ModalProps {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  position?: 'center' | 'bottom';
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  position = 'center',
}) => {
  const { theme } = useTheme();
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: position === 'center' ? 'center' : 'flex-end', alignItems: position === 'center' ? 'center' : undefined, padding: 16 }}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        <View style={{ width: '100%', maxWidth: 384, backgroundColor: theme.modalBackground, borderRadius: 24, padding: 24, paddingBottom: position === 'bottom' ? 40 : 24, marginBottom: position === 'bottom' ? 0 : undefined, alignSelf: 'center', borderWidth: 1, borderColor: theme.border }}>
          {children}
        </View>
      </View>
    </RNModal>
  );
};
