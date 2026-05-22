import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  StatusBar,
  Vibration,
  Linking,
  Alert,
  SafeAreaView
} from 'react-native';
import { useFonts } from 'expo-font';
import { 
  Rajdhani_400Regular, 
  Rajdhani_600SemiBold, 
  Rajdhani_700Bold 
} from '@expo-google-fonts/rajdhani';
import { Audio } from 'expo-av';
import { api } from '../api/client';

const VoiceDetectionScreen = ({ navigation }) => {
  const [isListening, setIsListening] = React.useState(false);
  const [sensitivity, setSensitivity] = React.useState('SHOUT'); // 'SHOUT' | 'CONVERSATION'
  const [hasPermission, setHasPermission] = React.useState(null);
  const [countdown, setCountdown] = React.useState(null);

  const recordingRef = React.useRef(null);
  const intervalRef = React.useRef(null);
  const countdownIntervalRef = React.useRef(null);
  const consecutiveLoudReadings = React.useRef(0);

  // High-Tech Fonts loader
  const [fontsLoaded] = useFonts({
    Rajdhani_400Regular,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  const getFontFamily = (weight = 'bold') => {
    if (!fontsLoaded) return 'System';
    if (weight === 'bold') return 'Rajdhani_700Bold';
    if (weight === 'medium') return 'Rajdhani_600SemiBold';
    return 'Rajdhani_400Regular';
  };

  // Mic animations
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const waveBars = [
    React.useRef(new Animated.Value(10)).current,
    React.useRef(new Animated.Value(10)).current,
    React.useRef(new Animated.Value(10)).current,
    React.useRef(new Animated.Value(10)).current,
    React.useRef(new Animated.Value(10)).current,
  ];

  // Request permissions on mount
  React.useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { status } = await Audio.getPermissionsAsync();
        if (status === 'granted') {
          setHasPermission(true);
        } else {
          const response = await Audio.requestPermissionsAsync();
          setHasPermission(response.status === 'granted');
        }
      } catch (e) {
        console.error("Permission check failed:", e);
        setHasPermission(false);
      }
    };
    checkPermissions();

    return () => {
      // Cleanup all resources on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
      Vibration.cancel();
    };
  }, []);

  // Control soundwave animations
  React.useEffect(() => {
    let anims = [];
    if (isListening) {
      // Pulse mic circle border
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      anims.push(pulseLoop);

      // Organically animate wave bars
      const waveLoops = waveBars.map((bar) => {
        const createWaveSequence = () => {
          return Animated.sequence([
            Animated.timing(bar, {
              toValue: Math.random() * 45 + 15,
              duration: 200 + Math.random() * 200,
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: Math.random() * 45 + 15,
              duration: 200 + Math.random() * 200,
              useNativeDriver: false,
            }),
          ]);
        };
        const waveLoop = Animated.loop(createWaveSequence());
        waveLoop.start();
        return waveLoop;
      });
      anims.push(...waveLoops);
    } else {
      pulseAnim.setValue(1);
      waveBars.forEach((bar) => {
        Animated.timing(bar, {
          toValue: 10,
          duration: 350,
          useNativeDriver: false,
        }).start();
      });
    }

    return () => {
      anims.forEach((anim) => anim.stop());
    };
  }, [isListening]);

  const startListening = async () => {
    try {
      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }

      // Create and prepare Recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.LOW_QUALITY,
        keepConnectionAlive: true,
        isMeteringEnabled: true,
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setIsListening(true);
      consecutiveLoudReadings.current = 0;

      // Poll audio status every 500ms
      intervalRef.current = setInterval(async () => {
        if (!recordingRef.current) return;
        try {
          const status = await recordingRef.current.getStatusAsync();
          const threshold = sensitivity === 'SHOUT' ? -18 : -25;
          const requiredCount = sensitivity === 'SHOUT' ? 2 : 3;

          if (status.isRecording && status.metering !== undefined && status.metering > threshold) {
            consecutiveLoudReadings.current += 1;
            if (consecutiveLoudReadings.current >= requiredCount) {
              // Clear active listener interval first
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              triggerDistressSignal();
            }
          } else {
            consecutiveLoudReadings.current = 0;
          }
        } catch (err) {
          console.error("Failed to read mic status:", err);
        }
      }, 500);

    } catch (err) {
      console.error("Failed to start recording:", err);
      Alert.alert("Access Error", "Could not start microphone voice guard. Please verify app permissions.");
    }
  };

  const stopListening = async () => {
    setIsListening(false);
    consecutiveLoudReadings.current = 0;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    } catch (e) {
      console.error("Error stopping mic recording:", e);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const triggerDistressSignal = () => {
    // Vibrate distress alert sequence
    Vibration.vibrate([0, 200, 100, 200, 100, 400]);
    
    setCountdown(5);
    let count = 5;

    countdownIntervalRef.current = setInterval(async () => {
      count -= 1;
      if (count <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setCountdown(null);

        // Auto trigger SOS alert
        try {
          await stopListening();
          await api.triggerSOS();
          navigation.navigate('Dashboard');
        } catch (err) {
          Alert.alert("Distress Action Failed", err.message || "Failed to trigger SOS.");
        }
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const cancelDistressCountdown = async () => {
    Vibration.vibrate(200); // 200ms short cancel haptic

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
    consecutiveLoudReadings.current = 0;

    // Resume listening seamlessly
    await startListening();
  };

  // Permission recovery view
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#04050a" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={[styles.backText, { fontFamily: getFontFamily('medium') }]}>◀ BACK</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontFamily: getFontFamily('bold') }]}>VOICE GUARD</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.permissionContent}>
          <Text style={styles.warningIcon}>🎙️</Text>
          <Text style={[styles.permissionTitle, { fontFamily: getFontFamily('bold') }]}>
            Microphone Access Required
          </Text>
          <Text style={[styles.permissionText, { fontFamily: getFontFamily('medium') }]}>
            SAFEGUARD needs microphone permissions to continuously analyze surrounding audio decibels. This allows us to auto-dispatch SOS triggers when high-intensity scream signals are detected.
          </Text>
          
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => Linking.openSettings()}
            activeOpacity={0.8}
          >
            <Text style={[styles.settingsButtonText, { fontFamily: getFontFamily('bold') }]}>
              OPEN SYSTEM SETTINGS
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#04050a" />

      {/* Modern Cyber Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { fontFamily: getFontFamily('medium') }]}>◀ BACK</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: getFontFamily('bold') }]}>VOICE GUARD</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.mainContent}>
        {/* Large mic status indicator */}
        <Animated.View 
          style={[
            styles.micCircle, 
            isListening ? styles.micCircleActive : styles.micCircleInactive,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <Text style={styles.micEmoji}>🎙️</Text>
        </Animated.View>

        {/* 5 sound wave visual bars */}
        <View style={styles.waveContainer}>
          {waveBars.map((bar, idx) => (
            <Animated.View 
              key={idx} 
              style={[
                styles.waveBar,
                { 
                  height: bar,
                  backgroundColor: isListening ? '#ff2d55' : 'rgba(255, 255, 255, 0.15)'
                }
              ]}
            />
          ))}
        </View>

        {/* Listen status notification text */}
        <Text style={[
          styles.listeningStatus, 
          isListening ? styles.listeningStatusActive : styles.listeningStatusInactive,
          { fontFamily: getFontFamily('bold') }
        ]}>
          {isListening ? "LISTENING FOR DISTRESS..." : "VOICE GUARD DEACTIVATED"}
        </Text>

        {/* Toggle listen activation */}
        <TouchableOpacity 
          style={[styles.toggleButton, isListening ? styles.toggleButtonActive : styles.toggleButtonInactive]} 
          onPress={toggleListening}
          activeOpacity={0.85}
        >
          <Text style={[styles.toggleButtonText, { fontFamily: getFontFamily('bold') }]}>
            {isListening ? "STOP LISTENING" : "START LISTENING"}
          </Text>
        </TouchableOpacity>

        {/* Sensitivity levels selection */}
        <View style={styles.sensitivityContainer}>
          <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('medium') }]}>
            SENSITIVITY MODE
          </Text>
          <View style={styles.sensitivityRow}>
            {/* SHOUT MODE */}
            <TouchableOpacity
              style={[
                styles.sensButton,
                sensitivity === 'SHOUT' ? styles.sensButtonActive : styles.sensButtonInactive
              ]}
              onPress={() => setSensitivity('SHOUT')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.sensButtonTitle,
                sensitivity === 'SHOUT' ? styles.sensButtonTitleActive : styles.sensButtonTitleInactive,
                { fontFamily: getFontFamily('bold') }
              ]}>
                SHOUT MODE
              </Text>
              <Text style={[
                styles.sensButtonSub,
                sensitivity === 'SHOUT' ? styles.sensButtonSubActive : styles.sensButtonSubInactive,
                { fontFamily: getFontFamily('regular') }
              ]}>
                Loud scream triggers SOS
              </Text>
            </TouchableOpacity>

            {/* CONVERSATION MODE */}
            <TouchableOpacity
              style={[
                styles.sensButton,
                sensitivity === 'CONVERSATION' ? styles.sensButtonActive : styles.sensButtonInactive
              ]}
              onPress={() => setSensitivity('CONVERSATION')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.sensButtonTitle,
                sensitivity === 'CONVERSATION' ? styles.sensButtonTitleActive : styles.sensButtonTitleInactive,
                { fontFamily: getFontFamily('bold') }
              ]}>
                CONVERSATION MODE
              </Text>
              <Text style={[
                styles.sensButtonSub,
                sensitivity === 'CONVERSATION' ? styles.sensButtonSubActive : styles.sensButtonSubInactive,
                { fontFamily: getFontFamily('regular') }
              ]}>
                Raised voice triggers SOS
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.sensitivityDesc, { fontFamily: getFontFamily('regular') }]}>
            {sensitivity === 'SHOUT' 
              ? "Quiet environment. Triggers at -18 dB (requires 2 consecutive readings)" 
              : "Loud environment. Triggers at -25 dB (requires 3 consecutive readings)"
            }
          </Text>
        </View>

        {/* Bottom instructions warn */}
        <Text style={[styles.bottomWarn, { fontFamily: getFontFamily('medium') }]}>
          Keep app open and volume up for best results
        </Text>
      </View>

      {/* Countdown overlay overlay */}
      {countdown !== null && (
        <View style={styles.countdownOverlay}>
          <View style={styles.countdownContent}>
            <Text style={[styles.distressLabel, { fontFamily: getFontFamily('bold') }]}>
              SCREAM DETECTED
            </Text>
            <Text style={[styles.countdownNumber, { fontFamily: getFontFamily('bold') }]}>
              SOS in {countdown}...
            </Text>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={cancelDistressCountdown}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelButtonText, { fontFamily: getFontFamily('bold') }]}>
                TAP TO CANCEL
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04050a',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: 80,
  },
  backText: {
    color: '#ff2d55',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 18,
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 80,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  micCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    borderWidth: 2,
    marginTop: 40,
  },
  micCircleInactive: {
    backgroundColor: '#1a1a2e',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  micCircleActive: {
    backgroundColor: '#3b0d16',
    borderColor: '#ff2d55',
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  micEmoji: {
    fontSize: 54,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 8,
    marginVertical: 24,
  },
  waveBar: {
    width: 5,
    borderRadius: 2.5,
  },
  listeningStatus: {
    fontSize: 15,
    letterSpacing: 1.5,
    marginBottom: 28,
  },
  listeningStatusActive: {
    color: '#22c55e',
  },
  listeningStatusInactive: {
    color: 'rgba(255, 255, 255, 0.35)',
  },
  toggleButton: {
    width: '85%',
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 36,
    elevation: 4,
  },
  toggleButtonInactive: {
    backgroundColor: '#22c55e',
  },
  toggleButtonActive: {
    backgroundColor: '#dc2626',
  },
  toggleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    letterSpacing: 1.5,
  },
  sensitivityContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  sensitivityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    width: '100%',
  },
  sensButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sensButtonActive: {
    backgroundColor: '#ff2d55',
    borderColor: '#ff2d55',
  },
  sensButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sensButtonTitle: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  sensButtonTitleActive: {
    color: '#ffffff',
  },
  sensButtonTitleInactive: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  sensButtonSub: {
    fontSize: 8.5,
    textAlign: 'center',
  },
  sensButtonSubActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sensButtonSubInactive: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  sensitivityDesc: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  bottomWarn: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  permissionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  warningIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  permissionTitle: {
    color: '#ffffff',
    fontSize: 22,
    letterSpacing: 1.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 32,
  },
  settingsButton: {
    backgroundColor: '#ff2d55',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    elevation: 4,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    letterSpacing: 1,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 5, 10, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  countdownContent: {
    width: '85%',
    alignItems: 'center',
  },
  distressLabel: {
    color: '#ff2d55',
    fontSize: 22,
    letterSpacing: 3,
    marginBottom: 12,
    textShadowColor: 'rgba(255, 45, 85, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  countdownNumber: {
    color: '#ffffff',
    fontSize: 38,
    letterSpacing: 1,
    marginBottom: 36,
  },
  cancelButton: {
    backgroundColor: '#ff2d55',
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 28,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 15,
    letterSpacing: 1.5,
  },
});

export default VoiceDetectionScreen;
