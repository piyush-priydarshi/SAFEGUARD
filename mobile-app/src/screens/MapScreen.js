import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  Dimensions, 
  Text, 
  TouchableOpacity, 
  Platform, 
  Animated,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const customMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

const MapScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Pulse loader animations
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const shieldScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(shieldScale, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          })
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(shieldScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      ])
    ).start();

    let sub = null;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      try {
        await api.updateLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy
        });
      } catch (e) {
        console.error("Failed to sync location to backend", e);
      }
      
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        async (newLocation) => {
          setLocation(newLocation.coords);
          try {
            await api.updateLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              accuracy: newLocation.coords.accuracy
            });
          } catch (e) {
            console.error(e);
          }
        }
      );
    })();

    return () => {
      if (sub) {
        sub.remove();
      }
    };
  }, []);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  if (errorMsg) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#04050a" />
        <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
        <TouchableOpacity style={styles.errorBackButton} onPress={() => { triggerHaptic(); navigation.goBack(); }}>
          <Text style={styles.errorBackText}>RETURN TO SAFETY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
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

        <Animated.View style={{ transform: [{ scale: shieldScale }], opacity: pulseAnim }}>
          <Text style={styles.pulseShield}>🛡️</Text>
        </Animated.View>
        <Animated.Text style={[styles.telemetryText, { opacity: pulseAnim }]}>
          ACQUIRING TELEMETRY SIGNAL...
        </Animated.Text>
        <Text style={styles.telemetrySubtitle}>Locking coordinates with orbital satellite array</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#04050a" />
      
      {/* Floating back button arrow overlay */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => {
          triggerHaptic();
          navigation.goBack();
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <MapView 
        style={styles.map}
        customMapStyle={customMapStyle}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        <Marker coordinate={location}>
          <View style={styles.neonMarker}>
            <View style={styles.neonPulseDot} />
          </View>
        </Marker>
        <Circle
          center={location}
          radius={50}
          strokeColor={colors.neonBlue}
          fillColor="rgba(76, 201, 240, 0.2)"
        />
      </MapView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#04050a',
  },
  map: {
    width: width,
    height: height,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 35,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(4, 5, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  backArrow: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#04050a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  pulseShield: {
    fontSize: 64,
    marginBottom: 24,
    color: '#ff2d55',
    textAlign: 'center',
  },
  telemetryText: {
    fontSize: 14,
    color: '#ff2d55',
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  telemetrySubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 1.5,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff2d55',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorBackButton: {
    borderWidth: 0.5,
    borderColor: '#ff2d55',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 45, 85, 0.08)',
  },
  errorBackText: {
    color: '#ff2d55',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  neonMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 255, 136, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  neonPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  }
});

export default MapScreen;
