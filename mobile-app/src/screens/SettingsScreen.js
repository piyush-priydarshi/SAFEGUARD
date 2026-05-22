import React from 'react';
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
import * as Haptics from 'expo-haptics';

const SettingsScreen = ({ navigation }) => {
  const [sosMessage, setSosMessage] = React.useState("I need help! This is an emergency. Please contact me immediately.");
  const [fakeCallName, setFakeCallName] = React.useState("Mom");
  const [shakeSensitivity, setShakeSensitivity] = React.useState(2.0); // Default Medium
  const [safetyTimerReminder, setSafetyTimerReminder] = React.useState(true);

  const updateSetting = (key, value) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // safe fallback if haptics is not available
    }

    if (key === 'sosMessage') {
      setSosMessage(value);
    } else if (key === 'fakeCallName') {
      setFakeCallName(value);
    } else if (key === 'shakeSensitivity') {
      setShakeSensitivity(value);
    } else if (key === 'safetyTimerReminder') {
      setSafetyTimerReminder(value);
    }
  };

  const handleBack = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // safe fallback
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#04050a" />
      
      {/* Sleek Symmetrical Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
        >
          <Text style={styles.backText}>◀ BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SYSTEM CONFIG</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SOS Emergency Message Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EMERGENCY MESSAGE</Text>
          <Text style={styles.sectionSubtitle}>
            Custom message broadcasted to emergency contacts when SOS triggers.
          </Text>
          <TextInput
            style={styles.multilineInput}
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
          <Text style={styles.sectionTitle}>FAKE CALL NAME</Text>
          <Text style={styles.sectionSubtitle}>
            Caller ID name shown during fake incoming call simulation.
          </Text>
          <TextInput
            style={styles.textInput}
            value={fakeCallName}
            onChangeText={(val) => updateSetting('fakeCallName', val)}
            placeholder="e.g. Mom, Officer, Boss..."
            placeholderTextColor="rgba(255, 255, 255, 0.2)"
            maxLength={15}
          />
        </View>

        {/* Shake Sensitivity Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SHAKE SENSITIVITY</Text>
          <Text style={styles.sectionSubtitle}>
            Tweak accelerometer threshold. Higher values require harder shaking.
          </Text>
          <View style={styles.sensitivityRow}>
            {/* High Sensitivity */}
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
                shakeSensitivity === 1.5 && styles.sensButtonTextActive
              ]}>HIGH (1.5)</Text>
            </TouchableOpacity>

            {/* Medium Sensitivity */}
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
                shakeSensitivity === 2.0 && styles.sensButtonTextActive
              ]}>MED (2.0)</Text>
            </TouchableOpacity>

            {/* Low Sensitivity */}
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
                shakeSensitivity === 2.5 && styles.sensButtonTextActive
              ]}>LOW (2.5)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety Timer Vibration Toggle */}
        <View style={[styles.section, styles.toggleSection]}>
          <View style={styles.toggleTextContainer}>
            <Text style={styles.sectionTitle}>SAFETY TIMER REMINDER</Text>
            <Text style={[styles.sectionSubtitle, styles.toggleSubtitle]}>
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
