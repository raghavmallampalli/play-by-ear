import MidiPlayerDOM from '@/components/MidiPlayerDOM';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrainerScreen() {
  const router = useRouter();
  const { level } = useLocalSearchParams();

  const levelNum = Number(level || 1);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

        {/* Header navigation bar */}
        <View style={styles.headerBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#C2C7CF" />
          </Pressable>
          <Text style={styles.screenTitle}>Level {levelNum}</Text>
        </View>

        {/* DOM Trainer Component */}
        <View style={styles.playerWrapper}>
          <MidiPlayerDOM mode="trainer" level={levelNum} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111318', // Material 3 Dark Background
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: '#111318',
  },
  backBtn: {
    padding: 8,
    borderRadius: 100,
    backgroundColor: '#1D2024',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E2E2E6',
    marginLeft: 16,
  },
  playerWrapper: {
    flex: 1,
    alignSelf: 'stretch',
  },
});
