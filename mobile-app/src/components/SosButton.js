import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme/colors';

export const SosButton = ({ status, onPress, disabled }) => {
  const isIdle = status === 'idle';
  const isActive = status === 'active';

  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive]);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity 
        style={[
          styles.button, 
          isActive ? styles.buttonActive : styles.buttonIdle,
          disabled && styles.disabled
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.text}>
          {isActive ? 'CANCEL SOS' : 'TRIGGER SOS'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  button: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  buttonIdle: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(255, 0, 60, 0.1)',
    shadowColor: colors.danger,
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  buttonActive: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(255, 0, 60, 0.4)',
    shadowColor: colors.danger,
    shadowOpacity: 1,
    shadowRadius: 40,
  },
  text: {
    color: colors.danger,
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  disabled: {
    opacity: 0.5,
  }
});
