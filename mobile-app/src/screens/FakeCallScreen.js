import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  StatusBar,
  Vibration
} from 'react-native';
import { getSettings } from '../utils/storage';
import { Audio } from 'expo-av';

const RING_URLS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg',
  'https://www.w3schools.com/html/horse.mp3',
];

const FakeCallScreen = ({ navigation }) => {
  const [isInCall, setIsInCall] = React.useState(false);
  const [timer, setTimer] = React.useState(0);
  const [fakeCallName, setFakeCallName] = React.useState("Mom");

  const soundRef = React.useRef(null);
  const isRingingActive = React.useRef(true);

  React.useEffect(() => {
    isRingingActive.current = true;
    playRinging();
    return () => {
      isRingingActive.current = false;
      Vibration.cancel();
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const playRinging = async () => {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
    } catch (e) {
      // Fail silently
    }

    let loadedSuccessfully = false;

    for (const url of RING_URLS) {
      if (!isRingingActive.current) {
        break;
      }
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: isRingingActive.current, isLooping: true, volume: 1.0 }
        );
        if (isRingingActive.current) {
          soundRef.current = sound;
          loadedSuccessfully = true;
          break;
        } else {
          await sound.unloadAsync().catch(() => {});
          break;
        }
      } catch (e) {
        // Silently catch and try next URL
      }
    }

    if (!loadedSuccessfully && isRingingActive.current) {
      Vibration.vibrate([0, 1000, 500, 1000, 500, 1000, 500, 1000], true);
    }
  };

  const stopRinging = async () => {
    isRingingActive.current = false;
    Vibration.cancel();
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (e) {
      // Fail silently
    }
  };

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await getSettings();
        if (saved && saved.fakeCallName) {
          setFakeCallName(saved.fakeCallName);
        }
      } catch (e) {
        console.error("Failed to load fake call name settings:", e);
      }
    };
    loadSettings();
  }, []);

  // Animation values
  const pulseAnim = React.useRef(new Animated.Value(0)).current;
  const shakeAnim = React.useRef(new Animated.Value(0)).current;
  const textPulse = React.useRef(new Animated.Value(0.4)).current;

  // Ringing animations
  React.useEffect(() => {
    let shakeLoop = null;
    let pulseLoop = null;
    let textLoop = null;

    if (!isInCall) {
      pulseLoop = Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      pulseLoop.start();

      const shakeSequence = Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        Animated.delay(1000),
      ]);
      shakeLoop = Animated.loop(shakeSequence);
      shakeLoop.start();

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
  React.useEffect(() => {
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

  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60).toString().padStart(2, '0');
    const seconds = (secs % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleDecline = async () => {
    await stopRinging();
    navigation.goBack();
  };

  const handleAccept = async () => {
    await stopRinging();
    setIsInCall(true);
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <View style={styles.topSection}>
        <View style={styles.avatarWrapper}>
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
          
          <Animated.View style={[styles.avatar, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.avatarText}>
              {fakeCallName.toUpperCase().slice(0, 3)}
            </Text>
          </Animated.View>
        </View>

        <Text style={styles.callerName}>{fakeCallName}</Text>
        
        {isInCall ? (
          <Text style={styles.callDuration}>
            {formatTime(timer)}
          </Text>
        ) : (
          <Animated.Text style={[styles.incomingSubtitle, { opacity: textPulse }]}>
            Incoming Call...
          </Animated.Text>
        )}
      </View>

      <View style={styles.bottomSection}>
        {isInCall ? (
          <View style={styles.inCallControls}>
            <TouchableOpacity 
              style={[styles.circleButton, styles.declineButton]} 
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.buttonLabel}>End Call</Text>
          </View>
        ) : (
          <View style={styles.incomingControls}>
            <View style={styles.controlColumn}>
              <TouchableOpacity 
                style={[styles.circleButton, styles.declineButton]} 
                onPress={handleDecline}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonIcon}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.buttonLabel}>Decline</Text>
            </View>

            <View style={styles.controlColumn}>
              <TouchableOpacity 
                style={[styles.circleButton, styles.acceptButton]} 
                onPress={handleAccept}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonIcon}>📞</Text>
              </TouchableOpacity>
              <Text style={styles.buttonLabel}>Accept</Text>
            </View>
          </View>
        )}
      </View>
    </View>
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
    elevation: 6,
  },
  declineButton: {
    backgroundColor: '#dc2626',
  },
  acceptButton: {
    backgroundColor: '#22c55e',
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
