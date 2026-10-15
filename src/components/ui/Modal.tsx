import React from 'react';
import { Modal as RNModal, View, Pressable, StyleSheet } from 'react-native';
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
      <View
        style={[
          styles.backdrop,
          {
            justifyContent: position === 'center' ? 'center' : 'flex-end',
            alignItems: position === 'center' ? 'center' : undefined,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.modalBackground,
              borderColor: theme.border,
              paddingBottom: position === 'bottom' ? 40 : 24,
              marginBottom: position === 'bottom' ? 0 : undefined,
            },
          ]}
        >
          {children}
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 28,
    padding: 24,
    alignSelf: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
  },
});
