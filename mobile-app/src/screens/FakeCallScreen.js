import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  StatusBar,
  SafeAreaView
} from 'react-native';
import { useFonts } from 'expo-font';
import { 
  Rajdhani_400Regular, 
  Rajdhani_600SemiBold, 
  Rajdhani_700Bold 
} from '@expo-google-fonts/rajdhani';
import { getSettings } from '../utils/storage';

const FakeCallScreen = ({ navigation }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [timer, setTimer] = useState(0);
  const [fakeCallName, setFakeCallName] = useState("Mom");

  useEffect(() => {
    const loadName = async () => {
      try {
        const saved = await getSettings();
        if (saved && saved.fakeCallName) {
          setFakeCallName(saved.fakeCallName);
        }
      } catch (e) {
        console.error("Failed to load fake call name settings:", e);
      }
    };
    loadName();
  }, []);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const textPulse = useRef(new Animated.Value(0.4)).current;

  // Fonts loading
  const [fontsLoaded] = useFonts({
    Rajdhani_400Regular,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  // Ringing animations
  useEffect(() => {
    let shakeLoop = null;
    let pulseLoop = null;
    let textLoop = null;

    if (!isInCall) {
      // 1. Loop pulse animation (scale/opacity)
      pulseLoop = Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      pulseLoop.start();

      // 2. Loop avatar gentle left-right shake ringing animation
      const shakeSequence = Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        Animated.delay(1000), // Delay 1 second between rings
      ]);
      shakeLoop = Animated.loop(shakeSequence);
      shakeLoop.start();

      // 3. Subtitle "Incoming Call..." pulse animation
      textLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(textPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(textPulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        ])
      );
      textLoop.start();
    } else {
      pulseAnim.setValue(0);
      shakeAnim.setValue(0);
      textPulse.setValue(1);
    }

    return () => {
      shakeLoop && shakeLoop.stop();
      pulseLoop && pulseLoop.stop();
      textLoop && textLoop.stop();
    };
  }, [isInCall]);

  // Call timer simulation
  useEffect(() => {
    let interval = null;
    if (isInCall) {
      setTimer(0);
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev >= 9) {
            clearInterval(interval);
            navigation.goBack();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInCall]);

  // Format call duration timer (e.g., 00:01)
  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60).toString().padStart(2, '0');
    const seconds = (secs % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const getFontFamily = (weight = 'bold') => {
    if (!fontsLoaded) return 'System';
    if (weight === 'bold') return 'Rajdhani_700Bold';
    if (weight === 'medium') return 'Rajdhani_600SemiBold';
    return 'Rajdhani_400Regular';
  };

  const handleDecline = () => {
    navigation.goBack();
  };

  const handleAccept = () => {
    setIsInCall(true);
  };

  // Interpolations for green pulse ring
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Top Header / Avatar Area */}
      <View style={styles.topSection}>
        <View style={styles.avatarWrapper}>
          {/* Pulsing Outer Ring (Ringing only) */}
          {!isInCall && (
            <Animated.View 
              style={[
                styles.pulseRing, 
                { 
                  transform: [{ scale: pulseScale }], 
                  opacity: pulseOpacity 
                }
              ]} 
            />
          )}
          
          {/* Main Shaking Avatar */}
          <Animated.View style={[styles.avatar, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={[styles.avatarText, { fontFamily: getFontFamily('bold') }]}>
              {fakeCallName.toUpperCase().slice(0, 3)}
            </Text>
          </Animated.View>
        </View>

        <Text style={[styles.callerName, { fontFamily: getFontFamily('bold') }]}>{fakeCallName}</Text>
        
        {isInCall ? (
          <Text style={[styles.callDuration, { fontFamily: getFontFamily('medium') }]}>
            {formatTime(timer)}
          </Text>
        ) : (
          <Animated.Text style={[styles.incomingSubtitle, { opacity: textPulse, fontFamily: getFontFamily('medium') }]}>
            Incoming Call...
          </Animated.Text>
        )}
      </View>

      {/* Bottom Controls Area */}
      <View style={styles.bottomSection}>
        {isInCall ? (
          /* "In Call" Hang-up Button */
          <View style={styles.inCallControls}>
            <TouchableOpacity 
              style={[styles.circleButton, styles.declineButton]} 
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.buttonLabel, { fontFamily: getFontFamily('medium') }]}>End Call</Text>
          </View>
        ) : (
          /* Incoming Call Acceptance Controls */
          <View style={styles.incomingControls}>
            <View style={styles.controlColumn}>
              <TouchableOpacity 
                style={[styles.circleButton, styles.declineButton]} 
                onPress={handleDecline}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonIcon}>✕</Text>
              </TouchableOpacity>
              <Text style={[styles.buttonLabel, { fontFamily: getFontFamily('medium') }]}>Decline</Text>
            </View>

            <View style={styles.controlColumn}>
              <TouchableOpacity 
                style={[styles.circleButton, styles.acceptButton]} 
                onPress={handleAccept}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonIcon}>📞</Text>
              </TouchableOpacity>
              <Text style={[styles.buttonLabel, { fontFamily: getFontFamily('medium') }]}>Accept</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1f2029',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    color: '#ffffff',
    letterSpacing: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#22c55e',
  },
  callerName: {
    fontSize: 40,
    color: '#ffffff',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  incomingSubtitle: {
    fontSize: 18,
    color: '#22c55e',
    letterSpacing: 1,
  },
  callDuration: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1.5,
  },
  bottomSection: {
    paddingBottom: 80,
    alignItems: 'center',
  },
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  controlColumn: {
    alignItems: 'center',
  },
  inCallControls: {
    alignItems: 'center',
  },
  circleButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  declineButton: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  acceptButton: {
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
  },
  buttonIcon: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  buttonLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

export default FakeCallScreen;
