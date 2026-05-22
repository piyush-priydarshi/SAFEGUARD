import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export const CyberInput = ({ value, onChangeText, placeholder, secureTextEntry, keyboardType, style, label }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCapitalize="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  label: {
    color: colors.neonBlue,
    marginBottom: 4,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: colors.textDim,
    color: colors.neonBlue,
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 16,
  },
  inputFocused: {
    borderBottomColor: colors.neonPink,
    shadowColor: colors.neonPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 2,
  }
});
