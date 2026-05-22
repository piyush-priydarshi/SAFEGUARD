import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Modal, ActivityIndicator, StatusBar, Animated, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';

function ContactsScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(true);

  // Modal Inputs keyboard navigation refs
  const modalNameRef = useRef(null);
  const modalPhoneRef = useRef(null);
  const modalRelationRef = useRef(null);

  // Loading skeleton animated opacity loop
  const skeletonOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    fetchContacts();

    // Start skeleton breathing animation
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
    // No-op to remove expo-haptics dependency
  };

  const fetchContacts = async () => {
    setContactsLoading(true);
    try {
      const data = await api.getContacts();
      const list = Array.isArray(data) ? data : (data?.contacts || []);
      setContacts(list);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to retrieve trusted contacts.');
    } finally {
      // Gentle artificial delay to show premium visual skeleton transitions
      setTimeout(() => {
        setContactsLoading(false);
      }, 450);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Validation Error', 'Please fill in Name and Phone Number.');
      return;
    }
    setLoading(true);
    try {
      await api.addContact(newContact);
      setNewContact({ name: '', phone: '', relation: '' });
      setShowModal(false);
      fetchContacts();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const removeContact = async (id) => {
    try {
      await api.removeContact(id);
      fetchContacts();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // Helper styles for typography
  const getFontFamily = (weight = 'bold') => {
    return undefined;
  };

  return (
    <SafeAreaView style={styles.wrapper}>
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
          <Text style={{color:'#fff',fontSize:18}}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { fontFamily: getFontFamily('bold') }]}>TRUSTED CONTACTS</Text>
          <Text style={[styles.headerSubtitle, { fontFamily: getFontFamily('medium') }]}>People who will be alerted</Text>
        </View>
      </View>

      {/* Main Container list */}
      <View style={styles.listContainer}>
        {contactsLoading ? (
          [...Array(3)].map((_, i) => (
            <Animated.View 
              key={i} 
              style={[
                styles.contactCard, 
                { opacity: skeletonOpacity, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.06)', marginBottom: 10 }
              ]}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.avatar, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ width: 100, height: 14, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 3 }} />
                  <View style={{ width: 80, height: 10, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 2 }} />
                  <View style={{ width: 40, height: 8, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 2, marginTop: 4 }} />
                </View>
              </View>
              <View style={[styles.trashBtn, { backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.06)' }]} />
            </Animated.View>
          ))
        ) : contacts.length === 0 ? (
          <EmptyState onAddPress={() => { triggerHaptic(); setShowModal(true); }} getFontFamily={getFontFamily} />
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={item => (item.id || item._id || Math.random().toString())}
            renderItem={({ item, index }) => (
              <ContactCard 
                item={item} 
                index={index} 
                onDelete={removeContact} 
                getFontFamily={getFontFamily} 
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listScroll}
          />
        )}
      </View>

      {/* Floating red circular button */}
      {!contactsLoading && contacts.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingButton} 
          onPress={() => { triggerHaptic(); setShowModal(true); }}
          activeOpacity={0.8}
        >
          <Text style={{color:'#fff',fontSize:24}}>+</Text>
        </TouchableOpacity>
      )}

      {/* Slide-up Bottom Modal Sheet */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissSpacer} 
            activeOpacity={1} 
            onPress={() => { triggerHaptic(); setShowModal(false); }} 
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderIndicator} />
            <Text style={[styles.modalTitle, { fontFamily: getFontFamily('bold') }]}>ADD TRUSTED CONTACT</Text>
            
            <View style={styles.modalForm}>
              <AuthInput 
                ref={modalNameRef}
                label="CONTACT NAME" 
                placeholder="Enter full name"
                value={newContact.name}
                onChangeText={(val) => setNewContact(prev => ({...prev, name: val}))}
                getFontFamily={getFontFamily}
                returnKeyType="next"
                onSubmitEditing={() => modalPhoneRef.current?.focus()}
                blurOnSubmit={false}
              />
              <AuthInput 
                ref={modalPhoneRef}
                label="PHONE NUMBER" 
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={newContact.phone}
                onChangeText={(val) => setNewContact(prev => ({...prev, phone: val}))}
                getFontFamily={getFontFamily}
                returnKeyType="next"
                onSubmitEditing={() => modalRelationRef.current?.focus()}
                blurOnSubmit={false}
              />
              <AuthInput 
                ref={modalRelationRef}
                label="RELATIONSHIP (E.G. MOTHER, BROTHER, FRIEND)" 
                placeholder="Enter relation type"
                value={newContact.relation}
                onChangeText={(val) => setNewContact(prev => ({...prev, relation: val}))}
                getFontFamily={getFontFamily}
                returnKeyType="done"
                onSubmitEditing={() => { triggerHaptic(); handleAddContact(); }}
                blurOnSubmit={true}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  triggerHaptic();
                  setShowModal(false);
                  setNewContact({ name: '', phone: '', relation: '' });
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelButtonText, { fontFamily: getFontFamily('bold') }]}>CANCEL</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={() => { triggerHaptic(); handleAddContact(); }}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.saveButtonText, { fontFamily: getFontFamily('bold') }]}>SAVE CONTACT</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Reusable animated contact card item
const ContactCard = ({ item, index, onDelete, getFontFamily }) => {
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const slideIn = useRef(new Animated.Value(50)).current; // slide in from translateX = 50

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideIn, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const name = item.name || '';

  return (
    <Animated.View
      style={[
        styles.contactCard,
        {
          opacity: cardOpacity,
          transform: [{ translateX: slideIn }],
          marginBottom: 10,
        }
      ]}
    >
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={{color:'#fff',fontSize:16}}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.contactDetails}>
          <Text style={[styles.contactName, { fontFamily: getFontFamily('bold') }]}>{item.name}</Text>
          <Text style={[styles.contactPhone, { fontFamily: getFontFamily('medium') }]}>{item.phone}</Text>
          {item.relation ? (
            <Text style={[styles.contactRelation, { fontFamily: getFontFamily('regular') }]}>
              {item.relation.toUpperCase()}
            </Text>
          ) : null}
        </View>
      </View>

      <TouchableOpacity 
        style={styles.trashBtn} 
        onPress={() => {
          Alert.alert(
            'Remove Contact', 
            `Are you sure you want to remove ${item.name}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Remove', 
                style: 'destructive', 
                onPress: () => {
                  onDelete(item.id || item._id);
                } 
              }
            ]
          );
        }}
        activeOpacity={0.6}
      >
        <Text style={{color:'#ff2d55',fontSize:18}}>🗑</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Reusable Empty State view
const EmptyState = ({ onAddPress, getFontFamily }) => {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyShield}>🛡️</Text>
      <Text style={[styles.emptyTitle, { fontFamily: getFontFamily('bold') }]}>No trusted contacts yet</Text>
      <Text style={[styles.emptySubtitle, { fontFamily: getFontFamily('medium') }]}>Add people who will receive SOS alerts</Text>
      
      <TouchableOpacity style={styles.emptyAddButton} onPress={onAddPress} activeOpacity={0.8}>
        <Text style={[styles.emptyAddButtonText, { fontFamily: getFontFamily('bold') }]}>ADD CONTACT</Text>
      </TouchableOpacity>
    </View>
  );
};

// Explicit creation of animatable text input component
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// Reusable focused-animated Input element
const AuthInput = React.forwardRef(({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType, getFontFamily, returnKeyType, onSubmitEditing, blurOnSubmit }, ref) => {
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

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
    paddingHorizontal: 16,
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
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    color: '#ff2d55',
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
    paddingHorizontal: 16,
  },
  listScroll: {
    paddingBottom: 90,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ff2d55',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ff2d55',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  contactPhone: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    marginTop: 2,
  },
  contactRelation: {
    color: '#ff2d55',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  trashBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 45, 85, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 45, 85, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 40,
  },
  emptyShield: {
    fontSize: 64,
    textAlign: 'center',
    color: '#ff2d55',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 25,
    lineHeight: 18,
  },
  emptyAddButton: {
    backgroundColor: '#ff2d55',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyAddButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalDismissSpacer: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#0d0d14',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeaderIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    color: '#ff2d55',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalForm: {
    gap: 16,
  },
  inputBlock: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 0.5,
    borderRadius: 12,
    color: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    letterSpacing: 1,
  },
  saveButton: {
    backgroundColor: '#ff2d55',
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    letterSpacing: 1,
  },
});

export default ContactsScreen;
