import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  Platform,
  StatusBar
} from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { api } from '../api/client';
import { removeToken, removeUser, getUser } from '../utils/storage';
import { useFonts } from 'expo-font';
import { 
  Rajdhani_400Regular, 
  Rajdhani_600SemiBold, 
  Rajdhani_700Bold 
} from '@expo-google-fonts/rajdhani';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';

const DashboardScreen = ({ navigation }) => {
  const [sosStatus, setSosStatus] = useState('idle');
  const [logs, setLogs] = useState([]);
  const [user, setCurrentUser] = useState(null);
  const [contactsCount, setContactsCount] = useState(0);
  const [alertsSentCount, setAlertsSentCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  // Shake countdown state and reference trackers
  const [shakeCountdown, setShakeCountdown] = useState(null);
  const countdownIntervalRef = useRef(null);
  const sosStatusRef = useRef(sosStatus);
  const shakeCountdownRef = useRef(shakeCountdown);

  useEffect(() => {
    sosStatusRef.current = sosStatus;
  }, [sosStatus]);

  useEffect(() => {
    shakeCountdownRef.current = shakeCountdown;
  }, [shakeCountdown]);

  // Load High-Tech Google Fonts
  const [fontsLoaded] = useFonts({
    Rajdhani_400Regular,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  // Animated Concentric Pulse Rings
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  // Breathing Status Light
  const activePulse = useRef(new Animated.Value(1)).current;

  // Loading Skeletons Breathing Opacity
  const skeletonOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    loadUser();
    loadStats();
    addLog('System initialized.', 'info');

    // Start Breathing status light animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(activePulse, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(activePulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Start skeleton breathing animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonOpacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ).start();

    // Start concentric ring stagger loops
    const anim1 = Animated.loop(
      Animated.timing(ring1, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    const anim2 = Animated.sequence([
      Animated.delay(1000),
      Animated.loop(
        Animated.timing(ring2, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      )
    ]);

    const anim3 = Animated.sequence([
      Animated.delay(2000),
      Animated.loop(
        Animated.timing(ring3, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      )
    ]);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  // Accelerometer subscription and shake detector logic
  useEffect(() => {
    let subscription = null;

    const subscribeAccelerometer = async () => {
      Accelerometer.setUpdateInterval(250); // Fetch reading every 250ms
      subscription = Accelerometer.addListener(accelerometerData => {
        const { x, y, z } = accelerometerData;
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        
        // Shake threshold set to 1.8G
        if (acceleration > 1.8) {
          if (sosStatusRef.current === 'idle' && shakeCountdownRef.current === null) {
            startShakeCountdown();
          }
        }
      });
    };

    subscribeAccelerometer();

    return () => {
      subscription && subscription.remove();
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const startShakeCountdown = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    addLog('Shake detected! Triggering auto-SOS...', 'info');
    
    setShakeCountdown(3);
    let current = 3;
    
    countdownIntervalRef.current = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setShakeCountdown(null);
        triggerSosFromShake();
      } else {
        setShakeCountdown(current);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 1000);
  };

  const cancelShakeCountdown = () => {
    triggerHaptic();
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setShakeCountdown(null);
    addLog('Shake countdown aborted by user.', 'info');
  };

  const triggerSosFromShake = async () => {
    if (sosStatusRef.current === 'idle') {
      try {
        await api.triggerSOS();
        setSosStatus('active');
        addLog('SOS TRIGGERED BY SHAKE! Dispatching alerts.', 'error');
        loadStats();
      } catch (err) {
        addLog('Failed to trigger SOS from shake: ' + err.message, 'error');
        Alert.alert('Error', err.message);
      }
    }
  };

  const loadUser = async () => {
    const u = await getUser();
    setCurrentUser(u);
    if (u) {
      addLog(`User ${u.phone} identified.`, 'info');
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      // 1. Fetch contacts
      const contactsData = await api.getContacts();
      const cCount = Array.isArray(contactsData) 
        ? contactsData.length 
        : (contactsData?.contacts?.length || 0);
      setContactsCount(cCount);

      // 2. Fetch SOS history
      const sosData = await api.getSOSHistory();
      const historyList = Array.isArray(sosData)
        ? sosData
        : (sosData?.history || []);
      setAlertsSentCount(historyList.length);

      // Check if an SOS is currently active from history
      const isActive = historyList.some(item => item.status === 'active');
      if (isActive) {
        setSosStatus('active');
      } else {
        setSosStatus('idle');
      }
    } catch (err) {
      console.error("Failed to load statistics:", err);
    } finally {
      // Gentle artificial delay to show premium visual skeleton transitions
      setTimeout(() => {
        setStatsLoading(false);
      }, 450);
    }
  };

  const addLog = (message, type = 'info') => {
    const newLog = {
      id: Date.now().toString() + Math.random().toString(),
      time: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleSos = async () => {
    // SOS emergency warning vibration triggers
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    if (sosStatus === 'idle') {
      try {
        await api.triggerSOS();
        setSosStatus('active');
        addLog('SOS TRIGGERED! Alerts dispatched.', 'error');
        loadStats();
      } catch (err) {
        addLog('Failed to trigger SOS: ' + err.message, 'error');
        Alert.alert('Error', err.message);
      }
    } else {
      try {
        await api.cancelSOS();
        setSosStatus('idle');
        addLog('SOS Cancelled. System returning to idle.', 'info');
        loadStats();
      } catch (err) {
        addLog('Failed to cancel SOS: ' + err.message, 'error');
        Alert.alert('Error', err.message);
      }
    }
  };

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleLogout = async () => {
    triggerHaptic();
    await removeToken();
    await removeUser();
    navigation.replace('Auth');
  };

  const handleClearLogs = () => {
    triggerHaptic();
    setLogs([]);
  };

  // Helper styles for typography
  const getFontFamily = (weight = 'bold') => {
    if (!fontsLoaded) return 'System';
    if (weight === 'bold') return 'Rajdhani_700Bold';
    if (weight === 'medium') return 'Rajdhani_600SemiBold';
    return 'Rajdhani_400Regular';
  };

  // Helper styles for Concentric Rings
  const getRingStyle = (ringValue) => {
    return {
      transform: [
        {
          scale: ringValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 1.4],
          })
        }
      ],
      opacity: ringValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.6, 0],
      })
    };
  };

  return (
    <ScreenWrapper style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#04050a" />

      {/* Subtle Grid Background */}
      <View style={styles.gridContainer} pointerEvents="none">
        <View style={styles.gridHorizontal}>
          {[...Array(12)].map((_, i) => (
            <View key={i} style={styles.gridLineH} />
          ))}
        </View>
        <View style={styles.gridVertical}>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={styles.gridLineV} />
          ))}
        </View>
      </View>

      {/* Modern Cyber Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerLabel, { fontFamily: getFontFamily('medium') }]}>SAFETY STATUS</Text>
          <Text style={[styles.headerTitle, { fontFamily: getFontFamily('bold') }]}>SAFEGUARD</Text>
          <View style={styles.statusDotRow}>
            <Animated.View style={[styles.statusDotActive, { opacity: activePulse }]} />
            <Text style={[styles.statusText, { fontFamily: getFontFamily('medium') }]}>System Active</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.pillButton} onPress={() => { triggerHaptic(); navigation.navigate('Map'); }}>
            <Text style={[styles.pillButtonText, { fontFamily: getFontFamily('bold') }]}>MAP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pillButton} onPress={() => { triggerHaptic(); navigation.navigate('Contacts'); }}>
            <Text style={[styles.pillButtonText, { fontFamily: getFontFamily('bold') }]}>CONTACTS</Text>
          </TouchableOpacity>
          {user?.phone === '9667938325' && (
            <TouchableOpacity style={[styles.pillButton, styles.adminButton]} onPress={() => { triggerHaptic(); navigation.navigate('Admin'); }}>
              <Text style={[styles.pillButtonText, styles.adminButtonText, { fontFamily: getFontFamily('bold') }]}>ADMIN</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.pillButton, styles.exitButton]} onPress={handleLogout}>
            <Text style={[styles.pillButtonText, styles.exitButtonText, { fontFamily: getFontFamily('bold') }]}>EXIT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Trigger Section */}
      <View style={styles.triggerContainer}>
        <Text style={[styles.emergencyLabel, { fontFamily: getFontFamily('bold') }]}>EMERGENCY TRIGGER</Text>
        
        <View style={styles.sosButtonContainer}>
          {/* Concentric Staggered Rings */}
          {sosStatus !== 'active' && (
            <>
              <Animated.View style={[styles.pulseRing, getRingStyle(ring1)]} />
              <Animated.View style={[styles.pulseRing, getRingStyle(ring2)]} />
              <Animated.View style={[styles.pulseRing, getRingStyle(ring3)]} />
            </>
          )}

          {/* Large SOS Circle Button */}
          <TouchableOpacity 
            style={[
              styles.sosCircle,
              sosStatus === 'active' ? styles.sosCircleActive : styles.sosCircleIdle
            ]}
            onPress={handleSos}
            activeOpacity={0.9}
          >
            {sosStatus === 'active' ? (
              <View style={styles.sosInnerContent}>
                <Text style={styles.cancelIcon}>✕</Text>
                <Text style={[styles.sosTextActive, { fontFamily: getFontFamily('bold') }]}>SOS</Text>
                <Text style={[styles.sosSubtitle, { fontFamily: getFontFamily('medium') }]}>CANCEL SOS</Text>
              </View>
            ) : (
              <View style={styles.sosInnerContent}>
                <Text style={[styles.sosText, { fontFamily: getFontFamily('bold') }]}>SOS</Text>
                <Text style={[styles.sosSubtitle, { fontFamily: getFontFamily('medium') }]}>TAP TO ACTIVATE</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Premium Stats Row with Loading Skeletons */}
      {statsLoading ? (
        <View style={styles.statsRow}>
          {[...Array(3)].map((_, i) => (
            <Animated.View 
              key={i} 
              style={[
                styles.statsCard, 
                { opacity: skeletonOpacity, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.12)' }
              ]}
            >
              <View style={{ width: 32, height: 24, backgroundColor: 'rgba(255, 255, 255, 0.12)', borderRadius: 4 }} />
              <View style={{ width: 56, height: 8, backgroundColor: 'rgba(255, 255, 255, 0.06)', marginTop: 8, borderRadius: 2 }} />
            </Animated.View>
          ))}
        </View>
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <Text style={[styles.statsValue, { color: '#22c55e', fontFamily: getFontFamily('bold') }]}>
              {contactsCount}
            </Text>
            <Text style={[styles.statsLabel, { fontFamily: getFontFamily('medium') }]}>CONTACTS</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={[styles.statsValue, { color: '#ffffff', fontFamily: getFontFamily('bold') }]}>
              {alertsSentCount}
            </Text>
            <Text style={[styles.statsLabel, { fontFamily: getFontFamily('medium') }]}>ALERTS SENT</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={[styles.statsValue, { color: '#22c55e', fontFamily: getFontFamily('bold') }]}>ON</Text>
            <Text style={[styles.statsLabel, { fontFamily: getFontFamily('medium') }]}>LOCATION</Text>
          </View>
        </View>
      )}

      {/* Activity Log Section with Skeletons */}
      <View style={styles.logSection}>
        <View style={styles.logHeader}>
          <Text style={[styles.logSectionTitle, { fontFamily: getFontFamily('medium') }]}>ACTIVITY LOG</Text>
          <TouchableOpacity onPress={handleClearLogs}>
            <Text style={[styles.clearButtonText, { fontFamily: getFontFamily('medium') }]}>CLEAR</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.logScroll} showsVerticalScrollIndicator={false}>
          {statsLoading ? (
            [...Array(3)].map((_, i) => (
              <Animated.View 
                key={i} 
                style={[
                  styles.logItem, 
                  styles.logItemNormal, 
                  { opacity: skeletonOpacity, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.06)' }
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={[styles.logItemDot, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]} />
                  <View style={{ width: '65%', height: 12, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 4 }} />
                </View>
                <View style={{ width: 44, height: 10, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 3 }} />
              </Animated.View>
            ))
          ) : logs.length === 0 ? (
            <Text style={[styles.emptyLogText, { fontFamily: getFontFamily('medium') }]}>No activities logged</Text>
          ) : (
            logs.map(item => (
              <AnimatedLogItem key={item.id} item={item} fontsLoaded={fontsLoaded} getFontFamily={getFontFamily} />
            ))
          )}
        </ScrollView>
      </View>

      {/* Shake Countdown Overlay */}
      {shakeCountdown !== null && (
        <View style={styles.shakeOverlay}>
          <View style={styles.shakeCard}>
            <Text style={styles.shakeShield}>📳</Text>
            <Text style={[styles.shakeTitle, { fontFamily: getFontFamily('bold') }]}>SHAKE DETECTED</Text>
            <Text style={[styles.shakeSubtitle, { fontFamily: getFontFamily('medium') }]}>
              Triggering SOS alert in
            </Text>
            <Text style={[styles.shakeTimer, { fontFamily: getFontFamily('bold') }]}>
              {shakeCountdown}
            </Text>
            <TouchableOpacity 
              style={styles.shakeCancelButton} 
              onPress={cancelShakeCountdown}
              activeOpacity={0.8}
            >
              <Text style={[styles.shakeCancelButtonText, { fontFamily: getFontFamily('bold') }]}>
                ABORT DISPATCH (✕)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
};

// Reusable animated log entry for sliding entrance effect
const AnimatedLogItem = ({ item, fontsLoaded, getFontFamily }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-25, 0],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const isSos = item.type === 'error' || item.message.toLowerCase().includes('sos');

  return (
    <Animated.View style={[
      styles.logItem,
      isSos ? styles.logItemSos : styles.logItemNormal,
      { transform: [{ translateY }], opacity }
    ]}>
      <View style={styles.logItemLeft}>
        <View style={[styles.logItemDot, isSos ? styles.logItemDotSos : styles.logItemDotNormal]} />
        <Text style={[
          styles.logItemMessage, 
          { fontFamily: getFontFamily('medium') },
          isSos && styles.logItemMessageSos
        ]}>
          {item.message}
        </Text>
      </View>
      <Text style={[styles.logItemTime, { fontFamily: getFontFamily('regular') }]}>{item.time}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#04050a',
    padding: 16,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  gridHorizontal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  gridLineH: {
    height: 0.5,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  gridVertical: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridLineV: {
    width: 0.5,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Platform.OS === 'ios' ? 10 : 25,
    marginBottom: 20,
    width: '100%',
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  headerLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 26,
    color: '#ff2d55',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginVertical: 2,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 6,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#22c55e',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: '55%',
    gap: 6,
  },
  pillButton: {
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  pillButtonText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  exitButton: {
    borderColor: 'rgba(255, 45, 85, 0.4)',
    backgroundColor: 'rgba(255, 45, 85, 0.08)',
  },
  exitButtonText: {
    color: '#ff2d55',
  },
  adminButton: {
    borderColor: 'rgba(76, 201, 240, 0.4)',
    backgroundColor: 'rgba(76, 201, 240, 0.08)',
  },
  adminButtonText: {
    color: '#4cc9f0',
  },
  triggerContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  emergencyLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 2,
    marginBottom: 20,
  },
  sosButtonContainer: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 45, 85, 0.4)',
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  sosCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  sosCircleIdle: {
    backgroundColor: '#c0001a',
    borderWidth: 4,
    borderColor: '#ff2d55',
    shadowColor: '#ff2d55',
  },
  sosCircleActive: {
    backgroundColor: '#ff9500',
    borderWidth: 4,
    borderColor: '#ffd60a',
    shadowColor: '#ff9500',
  },
  sosInnerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  sosText: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  sosTextActive: {
    color: '#04050a',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  cancelIcon: {
    color: '#04050a',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: -4,
  },
  sosSubtitle: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    width: '100%',
    gap: 8,
  },
  statsCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statsLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.35)',
    marginTop: 6,
    letterSpacing: 1,
  },
  logSection: {
    flex: 1,
    marginTop: 15,
    maxHeight: 280,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logSectionTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 1.5,
  },
  clearButtonText: {
    fontSize: 11,
    color: 'rgba(255, 45, 85, 0.5)',
    letterSpacing: 1,
  },
  logScroll: {
    flex: 1,
  },
  emptyLogText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 13,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 0.5,
  },
  logItemNormal: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  logItemSos: {
    backgroundColor: 'rgba(220, 30, 60, 0.05)',
    borderColor: 'rgba(255, 45, 85, 0.4)',
  },
  logItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  logItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  logItemDotNormal: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  logItemDotSos: {
    backgroundColor: '#ff2d55',
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  logItemMessage: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  logItemMessageSos: {
    color: '#ff2d55',
  },
  logItemTime: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 11,
  },
  shakeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 5, 10, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  shakeCard: {
    width: '85%',
    backgroundColor: '#0d0d14',
    borderWidth: 1.5,
    borderColor: '#ff2d55',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  shakeShield: {
    fontSize: 48,
    marginBottom: 16,
  },
  shakeTitle: {
    color: '#ff2d55',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  shakeSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  shakeTimer: {
    color: '#ffffff',
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 24,
    textShadowColor: '#ff2d55',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  shakeCancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  shakeCancelButtonText: {
    color: '#ffffff',
    fontSize: 13,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
