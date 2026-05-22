import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Switch, 
  ScrollView, 
  StatusBar,
  SafeAreaView
} from 'react-native';
import { useFonts } from 'expo-font';
import { 
  Rajdhani_400Regular, 
  Rajdhani_600SemiBold, 
  Rajdhani_700Bold 
} from '@expo-google-fonts/rajdhani';
import { getSettings, saveSettings } from '../utils/storage';
import * as Haptics from 'expo-haptics';

const SettingsScreen = ({ navigation }) => {
  const [sosMessage, setSosMessage] = useState("I need help! This is an emergency. Please contact me immediately.");
  const [fakeCallName, setFakeCallName] = useState("Mom");
  const [shakeSensitivity, setShakeSensitivity] = useState(2.0); // Default Medium
  const [safetyTimerReminder, setSafetyTimerReminder] = useState(true);

  // Fonts loading
  const [fontsLoaded] = useFonts({
    Rajdhani_400Regular,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await getSettings();
        if (saved) {
          if (saved.sosMessage !== undefined) setSosMessage(saved.sosMessage);
          if (saved.fakeCallName !== undefined) setFakeCallName(saved.fakeCallName);
          if (saved.shakeSensitivity !== undefined) setShakeSensitivity(saved.shakeSensitivity);
          if (saved.safetyTimerReminder !== undefined) setSafetyTimerReminder(saved.safetyTimerReminder);
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    };
    loadSettings();
  }, []);

  // Save settings on changes
  const updateSetting = async (key, value) => {
    // Vibrate briefly on change
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let nextSosMessage = sosMessage;
    let nextFakeCallName = fakeCallName;
    let nextShakeSensitivity = shakeSensitivity;
    let nextSafetyTimerReminder = safetyTimerReminder;

    if (key === 'sosMessage') {
      setSosMessage(value);
      nextSosMessage = value;
    } else if (key === 'fakeCallName') {
      setFakeCallName(value);
      nextFakeCallName = value;
    } else if (key === 'shakeSensitivity') {
      setShakeSensitivity(value);
      nextShakeSensitivity = value;
    } else if (key === 'safetyTimerReminder') {
      setSafetyTimerReminder(value);
      nextSafetyTimerReminder = value;
    }

    try {
      await saveSettings({
        sosMessage: nextSosMessage,
        fakeCallName: nextFakeCallName,
        shakeSensitivity: nextShakeSensitivity,
        safetyTimerReminder: nextSafetyTimerReminder
      });
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  const getFontFamily = (weight = 'bold') => {
    if (!fontsLoaded) return 'System';
    if (weight === 'bold') return 'Rajdhani_700Bold';
    if (weight === 'medium') return 'Rajdhani_600SemiBold';
    return 'Rajdhani_400Regular';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#04050a" />
      
      {/* Sleek Cyber Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.goBack(); }}
        >
          <Text style={[styles.backText, { fontFamily: getFontFamily('bold') }]}>◀ BACK</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: getFontFamily('bold') }]}>SYSTEM CONFIG</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SOS Emergency Message Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('bold') }]}>EMERGENCY MESSAGE</Text>
          <Text style={[styles.sectionSubtitle, { fontFamily: getFontFamily('medium') }]}>
            Custom message broadcasted to emergency contacts when SOS triggers.
          </Text>
          <TextInput
            style={[styles.multilineInput, { fontFamily: getFontFamily('medium') }]}
            multiline
            numberOfLines={4}
            value={sosMessage}
            onChangeText={(val) => updateSetting('sosMessage', val)}
            placeholder="Type your emergency message..."
            placeholderTextColor="rgba(255, 255, 255, 0.2)"
          />
        </View>

        {/* Fake Call Caller Name Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('bold') }]}>FAKE CALL NAME</Text>
          <Text style={[styles.sectionSubtitle, { fontFamily: getFontFamily('medium') }]}>
            Caller ID name shown during fake incoming call simulation.
          </Text>
          <TextInput
            style={[styles.textInput, { fontFamily: getFontFamily('medium') }]}
            value={fakeCallName}
            onChangeText={(val) => updateSetting('fakeCallName', val)}
            placeholder="e.g. Mom, Officer, Boss..."
            placeholderTextColor="rgba(255, 255, 255, 0.2)"
            maxLength={15}
          />
        </View>

        {/* Shake Sensitivity Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('bold') }]}>SHAKE SENSITIVITY</Text>
          <Text style={[styles.sectionSubtitle, { fontFamily: getFontFamily('medium') }]}>
            Tweak accelerometer threshold. Higher values require harder shaking.
          </Text>
          <View style={styles.sensitivityRow}>
            {/* High Sensitivity (Threshold: 1.5) */}
            <TouchableOpacity 
              style={[
                styles.sensButton, 
                shakeSensitivity === 1.5 && styles.sensButtonActive
              ]}
              onPress={() => updateSetting('shakeSensitivity', 1.5)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.sensButtonText, 
                { fontFamily: getFontFamily('bold') },
                shakeSensitivity === 1.5 && styles.sensButtonTextActive
              ]}>HIGH (1.5)</Text>
            </TouchableOpacity>

            {/* Medium Sensitivity (Threshold: 2.0) */}
            <TouchableOpacity 
              style={[
                styles.sensButton, 
                shakeSensitivity === 2.0 && styles.sensButtonActive
              ]}
              onPress={() => updateSetting('shakeSensitivity', 2.0)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.sensButtonText, 
                { fontFamily: getFontFamily('bold') },
                shakeSensitivity === 2.0 && styles.sensButtonTextActive
              ]}>MED (2.0)</Text>
            </TouchableOpacity>

            {/* Low Sensitivity (Threshold: 2.5) */}
            <TouchableOpacity 
              style={[
                styles.sensButton, 
                shakeSensitivity === 2.5 && styles.sensButtonActive
              ]}
              onPress={() => updateSetting('shakeSensitivity', 2.5)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.sensButtonText, 
                { fontFamily: getFontFamily('bold') },
                shakeSensitivity === 2.5 && styles.sensButtonTextActive
              ]}>LOW (2.5)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety Timer Vibration Toggle */}
        <View style={[styles.section, styles.toggleSection]}>
          <View style={styles.toggleTextContainer}>
            <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('bold') }]}>SAFETY TIMER REMINDER</Text>
            <Text style={[styles.sectionSubtitle, styles.toggleSubtitle, { fontFamily: getFontFamily('medium') }]}>
              Vibrate and tick physically during the 5s auto-SOS countdown overlay.
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#1f2029', true: 'rgba(255, 45, 85, 0.4)' }}
            thumbColor={safetyTimerReminder ? '#ff2d55' : '#8e8e93'}
            ios_backgroundColor="#1f2029"
            onValueChange={(val) => updateSetting('safetyTimerReminder', val)}
            value={safetyTimerReminder}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04050a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: 80,
    alignItems: 'center',
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  backText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    color: '#ffffff',
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 80,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#ff2d55',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 16,
    marginBottom: 12,
  },
  multilineInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#ffffff',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#ffffff',
  },
  sensitivityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  sensButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sensButtonActive: {
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
    borderColor: '#ff2d55',
  },
  sensButtonText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
  },
  sensButtonTextActive: {
    color: '#ff2d55',
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 16,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleSubtitle: {
    marginBottom: 0,
  },
});

export default SettingsScreen;
