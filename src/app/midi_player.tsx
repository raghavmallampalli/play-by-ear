import MidiPlayerDOM from '@/components/MidiPlayerDOM';
import { IconArrowLeft, IconCog, IconFolder, IconPiano } from '@/components/icons/NativeIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/hooks/useAppData';
import { NativeHandlers } from '@/utils/nativeHandlers';

export default function MidiPlayerScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [activeTab, setActiveTab] = React.useState<'practice' | 'theory' | 'settings' | 'loader'>(
    'loader',
  );

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

  const isLandscape = width > height && width >= 600;

  if (loading || !appData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#A8C7FA" />
      </View>
    );
  }

  const getHeaderTitle = () => {
    if (activeTab === 'loader') return 'MIDI Player: Loader';
    if (activeTab === 'practice') return 'MIDI Player: Player';
    return 'MIDI Player: Settings';
  };

  const renderTabIcon = (name: string, color: string) => {
    if (name === 'piano') return <IconPiano size={16} color={color} />;
    if (name === 'folder') return <IconFolder size={16} color={color} />;
    return <IconCog size={16} color={color} />;
  };

  const renderHeaderTab = (
    tab: 'practice' | 'settings' | 'loader',
    iconName: any,
    label: string,
  ) => {
    const isActive = activeTab === tab;
    const iconColor = isActive ? '#E2E2E6' : '#8A92A6';
    return (
      <Pressable
        onPress={() => setActiveTab(tab)}
        style={[styles.segTab, isActive && styles.segTabActive]}
      >
        {renderTabIcon(iconName, iconColor)}
        <Text style={[styles.segTabText, isActive && styles.segTabTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header navigation bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <IconArrowLeft size={18} color="#C2C7CF" />
            </Pressable>
            <Text style={styles.screenTitle}>{isLandscape ? 'MIDI Player' : getHeaderTitle()}</Text>
          </View>

          {isLandscape && (
            <View style={styles.segmentedControl}>
              {renderHeaderTab('loader', 'folder', 'Loader')}
              {renderHeaderTab('practice', 'piano', 'Player')}
              {renderHeaderTab('settings', 'cog', 'Settings')}
            </View>
          )}
        </View>

        {/* DOM MIDI Player Component */}
        <View style={styles.playerWrapper}>
          <MidiPlayerDOM
            mode="midi_player"
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
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
    backgroundColor: '#111318', // Material 3 Dark Background
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: '#111318',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#1E222B',
    borderRadius: 14,
    padding: 4,
    gap: 6,
    alignItems: 'center',
  },
  segTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    gap: 8,
  },
  segTabActive: {
    backgroundColor: '#2D3342',
  },
  segTabText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8A92A6',
  },
  segTabTextActive: {
    color: '#E2E2E6',
  },
  playerWrapper: {
    flex: 1,
    alignSelf: 'stretch',
  },
});
