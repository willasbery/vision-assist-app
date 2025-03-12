import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/src/hooks/useAccessibility';
import { getColors } from '@/src/theme/colors';

const DirectionalArrow = ({ direction }) => {
  const { highContrast } = useAccessibility();
  const colors = getColors(highContrast);

  const getArrowConfig = () => {
    switch (direction) {
      case 'continue_forward':
        return {
          name: 'arrow-up',
          style: styles.forward,
        };
      case 'move_left':
        return {
          name: 'arrow-back',
          style: styles.left,
        };
      case 'move_right':
        return {
          name: 'arrow-forward',
          style: styles.right,
        };
      default:
        return null;
    }
  };

  const arrowConfig = getArrowConfig();
  if (!arrowConfig) return null;

  return (
    <View style={[styles.container, arrowConfig.style]}>
      <Ionicons
        name={arrowConfig.name}
        size={120}
        color={highContrast ? colors.text.light : '#ffffff'}
        style={styles.arrow}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2,
  },
  arrow: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  forward: {
    top: '40%',
    alignSelf: 'center',
  },
  left: {
    left: 20,
    top: '50%',
    transform: [{ translateY: -75 }],
  },
  right: {
    right: 20,
    top: '50%',
    transform: [{ translateY: -75 }],
  },
});

export default DirectionalArrow;
