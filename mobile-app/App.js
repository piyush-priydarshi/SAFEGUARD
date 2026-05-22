import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { 
  createStackNavigator, 
  CardStyleInterpolators 
} from '@react-navigation/stack';
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MapScreen from './src/screens/MapScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import AdminScreen from './src/screens/AdminScreen';
import FakeCallScreen from './src/screens/FakeCallScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import VoiceDetectionScreen from './src/screens/VoiceDetectionScreen';
import { getToken } from './src/utils/storage';
import { 
  ActivityIndicator, 
  View, 
  Text, 
  StyleSheet, 
  Animated 
} from 'react-native';
import { colors } from './src/theme/colors';
import { useFonts } from 'expo-font';
import { 
  Rajdhani_400Regular, 
  Rajdhani_600SemiBold, 
  Rajdhani_700Bold 
} from '@expo-google-fonts/rajdhani';

const Stack = createStackNavigator();

// Custom Fade Transition over 350ms
const fadeTransitionSpec = {
  open: {
    animation: 'timing',
    config: {
      duration: 350,
    },
  },
  close: {
    animation: 'timing',
    config: {
      duration: 350,
    },
  },
};

const fadeInterpolator = ({ current }) => ({
  cardStyle: {
    opacity: current.progress,
  },
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Auth');

  // Load High-Tech Google Fonts for Splash Screen
  const [fontsLoaded] = useFonts({
    Rajdhani_400Regular,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  // Pulse animator for Safeguard Logo in Splash
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const initialize = async () => {
      // 1. Trigger Safeguard red pulse animation in parallel
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ])
      ).start();

      // 2. Perform token check and 2000ms delay in parallel
      const checkPromise = checkToken();
      const delayPromise = new Promise(resolve => setTimeout(resolve, 2000));
      
      await Promise.all([checkPromise, delayPromise]);
      setIsLoading(false);
    };

    initialize();
  }, []);

  const checkToken = async () => {
    try {
      const token = await getToken();
      if (token) {
        setInitialRoute('Dashboard');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getFontFamily = (weight = 'bold') => {
    if (!fontsLoaded) return 'System';
    if (weight === 'bold') return 'Rajdhani_700Bold';
    if (weight === 'medium') return 'Rajdhani_600SemiBold';
    return 'Rajdhani_400Regular';
  };

  if (isLoading) {
    return (
      <View style={styles.splashWrapper}>
        <Animated.View style={[styles.splashContent, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.splashIcon}>🛡️</Text>
          <Text style={[styles.splashTitle, { fontFamily: getFontFamily('bold') }]}>SAFEGUARD</Text>
          <Text style={[styles.splashTagline, { fontFamily: getFontFamily('medium') }]}>YOUR SAFETY. ALWAYS ON.</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS, // Default fallback
        }}
      >
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ 
            cardStyleInterpolator: fadeInterpolator,
            transitionSpec: fadeTransitionSpec
          }} 
        />
        <Stack.Screen 
          name="Map" 
          component={MapScreen} 
          options={{
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          }}
        />
        <Stack.Screen 
          name="Contacts" 
          component={ContactsScreen} 
          options={{
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          }}
        />
        <Stack.Screen 
          name="Admin" 
          component={AdminScreen} 
          options={{
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          }}
        />
        <Stack.Screen 
          name="FakeCall" 
          component={FakeCallScreen} 
          options={{
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          }}
        />
        <Stack.Screen 
          name="VoiceGuard" 
          component={VoiceDetectionScreen} 
          options={{
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashWrapper: {
    flex: 1,
    backgroundColor: '#04050a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
  },
  splashIcon: {
    fontSize: 72,
    color: '#ff2d55',
    marginBottom: 15,
    textAlign: 'center',
  },
  splashTitle: {
    fontSize: 42,
    color: '#ff2d55',
    fontWeight: 'bold',
    letterSpacing: 3,
    textAlign: 'center',
  },
  splashTagline: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 8,
    letterSpacing: 2,
    textAlign: 'center',
  },
});
