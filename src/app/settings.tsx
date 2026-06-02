import MidiPlayerDOM from '@/components/MidiPlayerDOM';
import { IconArrowLeft } from '@/components/icons/NativeIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/hooks/useAppData';
import { NativeHandlers } from '@/utils/nativeHandlers';
import { ActivityIndicator } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();

  const {
    appData,
    loading,
    reloadData,
    handleSaveSettings,
    handleSaveProgress,
    handleSaveNotes,
    handleSaveRecentTracks,
    handleSaveActiveTrack,
  } = useAppData();

  if (loading || !appData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#A8C7FA" />
      </View>
    );
  }

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
            <IconArrowLeft size={18} color="#C2C7CF" />
          </Pressable>
          <Text style={styles.screenTitle}>Settings & Preferences</Text>
        </View>

        {/* DOM settings Component */}
        <View style={styles.playerWrapper}>
          <MidiPlayerDOM 
            mode="settings" 
            settingsProp={appData.settings}
            progressProp={appData.progress}
            notesProp={appData.notes}
            recentTracksProp={appData.recentMidis}
            activeTrackProp={appData.activeTrack}
            onSaveSettings={handleSaveSettings}
            onSaveProgress={handleSaveProgress}
            onSaveUserNotes={handleSaveNotes}
            onSaveRecentTracks={handleSaveRecentTracks}
            onSaveActiveTrack={handleSaveActiveTrack}
            onExportProgress={NativeHandlers.handleExportBackup}
            onImportProgress={() => NativeHandlers.handleImportBackup(reloadData)}
            onLoadCustomMidi={NativeHandlers.handleLoadCustomMidi}
          />
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
