import MidiPlayerDOM from '@/components/MidiPlayerDOM';
import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header navigation bar */}
        <View style={styles.headerBar}>
          <Pressable 
            style={styles.backBtn} 
            onPress={() => {
              router.back();
            }}
          >
            <MaterialDesignIcons name="arrow-left" size={18} color="#C2C7CF" />
          </Pressable>
          <Text style={styles.screenTitle}>Settings & Preferences</Text>
        </View>

        {/* DOM settings Component */}
        <View style={styles.playerWrapper}>
          <MidiPlayerDOM mode="settings" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111318',
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
