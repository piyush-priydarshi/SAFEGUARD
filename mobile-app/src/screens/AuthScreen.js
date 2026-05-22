import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { api } from '../api/client';
import { setToken, setUser } from '../utils/storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  });

  // Input Field Refs for Keyboard Navigation Flow
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Entrance Animators
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  // Submit button scale animator
  const submitScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Logo & Title slide down and fade in
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();

    // 2. Form content fades in 300ms later
    Animated.sequence([
      Animated.delay(300),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg(null); // Clear error on edit
  };

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSubmit = async () => {
    triggerHaptic();
    setErrorMsg(null);

    // Validation Check
    if (!formData.phone || !formData.password || (!isLogin && !formData.name)) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const data = await api.login({ 
          phone: formData.phone, 
          password: formData.password 
        });
        await setToken(data.token);
        await setUser(data.user);
        navigation.replace('Dashboard');
      } else {
        const data = await api.register(formData);
        await setToken(data.token);
        await setUser(data.user);
        navigation.replace('Dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Submit button scale interactions
  const onPressInSubmit = () => {
    Animated.timing(submitScale, {
      toValue: 0.96,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutSubmit = () => {
    Animated.timing(submitScale, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  // Helper styles for typography
  const getFontFamily = (weight = 'bold') => {
    return undefined;
  };

  // Animated interpolations for entrance
  const logoTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 0]
  });

  return (
    <ScreenWrapper style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#04050a" />

      {/* Subtle Atmospheric Red Radial Glow at bottom center */}
      <View style={styles.radialGlowContainer} pointerEvents="none">
        <View style={styles.glowOuter} />
        <View style={styles.glowInner} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Section: Shield Emblem, Safeguard Title & Tagline */}
          <Animated.View style={[styles.headerContainer, { opacity: headerAnim, transform: [{ translateY: logoTranslateY }] }]}>
            <Text style={styles.shieldIcon}>🛡️</Text>
            <Text style={[styles.appTitle, { fontFamily: getFontFamily('bold') }]}>SAFEGUARD</Text>
            <Text style={[styles.tagline, { fontFamily: getFontFamily('medium') }]}>Your safety. Always on.</Text>
          </Animated.View>

          {/* Form wrapper with delayed fade in */}
          <Animated.View style={[styles.formContainer, { opacity: formAnim }]}>
            {/* Pill Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tabButton, isLogin ? styles.tabButtonActive : styles.tabButtonInactive]}
                onPress={() => {
                  triggerHaptic();
                  setIsLogin(true);
                  setErrorMsg(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tabText, 
                  isLogin ? styles.tabTextActive : styles.tabTextInactive, 
                  { fontFamily: getFontFamily('bold') }
                ]}>
                  LOGIN
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tabButton, !isLogin ? styles.tabButtonActive : styles.tabButtonInactive]}
                onPress={() => {
                  triggerHaptic();
                  setIsLogin(false);
                  setErrorMsg(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tabText, 
                  !isLogin ? styles.tabTextActive : styles.tabTextInactive, 
                  { fontFamily: getFontFamily('bold') }
                ]}>
                  REGISTER
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message Card Panel */}
            {errorMsg && (
              <View style={styles.errorCard}>
                <Text style={[styles.errorText, { fontFamily: getFontFamily('medium') }]}>
                  ⚠️ {errorMsg}
                </Text>
              </View>
            )}

            {/* Form Fields Container */}
            <View style={styles.fieldsWrapper}>
              {!isLogin && (
                <AuthInput
                  ref={nameRef}
                  label="NAME"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChangeText={(val) => handleChange('name', val)}
                  getFontFamily={getFontFamily}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  blurOnSubmit={false}
                />
              )}

              <AuthInput
                ref={phoneRef}
                label="PHONE NUMBER"
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(val) => handleChange('phone', val)}
                getFontFamily={getFontFamily}
                returnKeyType="next"
                onSubmitEditing={() => {
                  if (isLogin) {
                    passwordRef.current?.focus();
                  } else {
                    emailRef.current?.focus();
                  }
                }}
                blurOnSubmit={false}
              />

              {!isLogin && (
                <AuthInput
                  ref={emailRef}
                  label="EMAIL ADDRESS (OPTIONAL)"
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={(val) => handleChange('email', val)}
                  getFontFamily={getFontFamily}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
              )}

              <AuthInput
                ref={passwordRef}
                label="PASSWORD"
                placeholder="Enter password"
                secureTextEntry
                value={formData.password}
                onChangeText={(val) => handleChange('password', val)}
                getFontFamily={getFontFamily}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                blurOnSubmit={true}
              />
            </View>

            {/* Submit Action Block */}
            <Animated.View style={[styles.submitWrapper, { transform: [{ scale: submitScale }] }]}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                onPressIn={onPressInSubmit}
                onPressOut={onPressOutSubmit}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.submitButtonText, { fontFamily: getFontFamily('bold') }]}>
                    {isLogin ? 'ENTER SAFE ZONE' : 'CREATE ACCOUNT'}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

// Explicit creation of animatable text input component
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// Reusable focusable Custom Input Component
const AuthInput = forwardRef(({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType, getFontFamily, returnKeyType, onSubmitEditing, blurOnSubmit }, ref) => {
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false, // Border color animations do not support native driver
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  // Interpolated border color
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 45, 85, 0.6)'],
  });

  return (
    <View style={styles.inputBlock}>
      <Text style={[styles.inputLabel, { fontFamily: getFontFamily('medium') }]}>
        {label}
      </Text>
      <AnimatedTextInput
        ref={ref}
        style={[
          styles.textInput,
          { 
            borderColor,
            fontFamily: getFontFamily('medium')
          }
        ]}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.3)"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={blurOnSubmit}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#04050a',
  },
  radialGlowContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  glowOuter: {
    position: 'absolute',
    bottom: -200,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(220, 30, 60, 0.05)',
  },
  glowInner: {
    position: 'absolute',
    bottom: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(220, 30, 60, 0.12)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 35,
  },
  shieldIcon: {
    fontSize: 56,
    color: '#ff2d55',
    marginBottom: 10,
    textAlign: 'center',
  },
  appTitle: {
    fontSize: 34,
    color: '#ff2d55',
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 6,
    letterSpacing: 1,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 25,
    padding: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ff2d55',
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  tabButtonInactive: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabTextInactive: {
    color: 'rgba(255, 255, 255, 0.35)',
  },
  errorCard: {
    backgroundColor: 'rgba(220, 30, 60, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(220, 30, 60, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    width: '100%',
  },
  errorText: {
    color: '#ff2d55',
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  fieldsWrapper: {
    width: '100%',
    gap: 16,
  },
  inputBlock: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 0.5,
    borderRadius: 12,
    color: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    width: '100%',
  },
  submitWrapper: {
    marginTop: 26,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#ff2d55',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default AuthScreen;
