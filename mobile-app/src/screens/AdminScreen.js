import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Animated, 
  Platform,
  StatusBar
} from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getToken } from '../utils/storage';
import { useFonts } from 'expo-font';
import { 
  Rajdhani_400Regular, 
  Rajdhani_600SemiBold, 
  Rajdhani_700Bold 
} from '@expo-google-fonts/rajdhani';
import * as Haptics from 'expo-haptics';

const AdminScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load High-Tech Google Fonts
  const [fontsLoaded] = useFonts({
    Rajdhani_400Regular,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  const skeletonOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    fetchUsers();

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
  }, []);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('http://10.0.2.2:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 450);
    }
  };

  const getFontFamily = (weight = 'bold') => {
    if (!fontsLoaded) return 'System';
    if (weight === 'bold') return 'Rajdhani_700Bold';
    if (weight === 'medium') return 'Rajdhani_600SemiBold';
    return 'Rajdhani_400Regular';
  };

  const renderItem = ({ item }) => {
    const initials = item.name ? item.name.charAt(0).toUpperCase() : '?';
    return (
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={[styles.avatarText, { fontFamily: getFontFamily('bold') }]}>{initials}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { fontFamily: getFontFamily('bold') }]}>{item.name}</Text>
          <Text style={[styles.userPhone, { fontFamily: getFontFamily('medium') }]}>{item.phone}</Text>
          <Text style={[styles.userCreated, { fontFamily: getFontFamily('regular') }]}>
            REGISTERED: {item.created_at || 'N/A'}
          </Text>
        </View>
      </View>
    );
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

      {/* Cyber Back-Arrow Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => { triggerHaptic(); navigation.goBack(); }} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { fontFamily: getFontFamily('bold') }]}>SYSTEM ADMIN</Text>
          <Text style={[styles.headerSubtitle, { fontFamily: getFontFamily('medium') }]}>Registered user directory</Text>
        </View>
      </View>

      {/* Main List / Skeletons */}
      <View style={styles.listContainer}>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Animated.View 
              key={i} 
              style={[
                styles.userCard, 
                { opacity: skeletonOpacity, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.06)', marginBottom: 10 }
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ width: 120, height: 14, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 3 }} />
                <View style={{ width: 90, height: 10, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 2 }} />
                <View style={{ width: 140, height: 8, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 2, marginTop: 4 }} />
              </View>
            </Animated.View>
          ))
        ) : (
          <FlatList
            data={users}
            keyExtractor={item => (item.id || item._id || Math.random().toString())}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listScroll}
          />
        )}
      </View>
    </ScreenWrapper>
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
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 10 : 25,
    marginBottom: 20,
    width: '100%',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backArrow: {
    color: '#ffffff',
    fontSize: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    color: '#4cc9f0',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
    width: '100%',
  },
  listScroll: {
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    width: '100%',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4cc9f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#4cc9f0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  avatarText: {
    color: '#04050a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  userPhone: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    marginTop: 2,
  },
  userCreated: {
    color: '#4cc9f0',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 4,
  },
});

export default AdminScreen;
