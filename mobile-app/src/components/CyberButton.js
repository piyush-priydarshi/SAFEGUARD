import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const CyberButton = ({ title, onPress, disabled, color = 'blue', style }) => {
  const isPink = color === 'pink';
  const isDanger = color === 'danger';
  
  let borderColor = colors.neonBlue;
  let textColor = colors.neonBlue;
  let shadowColor = colors.neonBlue;

  if (isPink) {
    borderColor = colors.neonPink;
    textColor = colors.neonPink;
    shadowColor = colors.neonPink;
  } else if (isDanger) {
    borderColor = colors.danger;
    textColor = colors.danger;
    shadowColor = colors.danger;
  }

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { borderColor, shadowColor }, 
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 2,
  },
  text: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  disabled: {
    opacity: 0.5,
  }
});
