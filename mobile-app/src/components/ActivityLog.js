import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { globalStyles } from '../theme/styles';
import { colors } from '../theme/colors';

export const ActivityLog = ({ logs }) => {
  const renderItem = ({ item }) => (
    <View style={styles.logItem}>
      <Text style={styles.timeText}>{item.time}</Text>
      <Text style={[styles.messageText, item.type === 'error' && styles.errorText]}>
        {item.message}
      </Text>
    </View>
  );

  return (
    <View style={[globalStyles.card, styles.container]}>
      <Text style={globalStyles.subtitleText}>ACTIVITY LOG</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 300,
  },
  listContainer: {
    paddingVertical: 8,
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 201, 240, 0.2)',
    paddingBottom: 4,
  },
  timeText: {
    color: colors.textDim,
    marginRight: 12,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  messageText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 12,
  },
  errorText: {
    color: colors.danger,
  }
});
