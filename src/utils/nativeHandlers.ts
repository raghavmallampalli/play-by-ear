import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform } from 'react-native';
import { StorageService } from '../services/storage';

export const NativeHandlers = {
  async handleExportBackup() {
    const backupPath = await StorageService.exportProgressBackup();
    if (!backupPath) {
      Alert.alert('Error', 'Failed to compile settings backup.');
      return;
    }
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(backupPath, {
        mimeType: Platform.OS === 'android' ? 'text/plain' : 'application/json',
        dialogTitle: 'Export Play by Ear Progress Backup',
      });
    } else {
      // On Web, exportProgressBackup returns a JSON string. Download as a file.
      if (typeof backupPath === 'string' && backupPath.startsWith('{')) {
        try {
          if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
            const handle = await (window as any).showSaveFilePicker({
              suggestedName: 'play_by_ear_backup.txt',
              types: [{
                description: 'Text Files',
                accept: {
                  'text/plain': ['.txt'],
                },
              }],
            });
            const writable = await handle.createWritable();
            await writable.write(backupPath);
            await writable.close();
          } else {
            const blob = new Blob([backupPath], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'play_by_ear_backup.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        } catch (e: any) {
          // Ignore cancellation abort errors
          if (e.name === 'AbortError') return;

          // Fallback to clipboard if anything fails
          navigator.clipboard.writeText(backupPath).then(() => {
            alert('Fallback: Backup copied to clipboard!');
          }).catch(() => {
            alert('Failed to copy. Here is your backup:\n\n' + backupPath);
          });
        }
      } else {
        Alert.alert('Backup compiled!', 'Backup generated successfully.');
      }
    }
  },

  async handleImportBackup(onReloadData: () => void) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const fileUri = result.assets[0].uri;
      
      let jsonStr = '';
      if (fileUri.startsWith('data:') || fileUri.startsWith('blob:')) {
         // Web handling: DocumentPicker on web returns a File object in result.assets[0].file
         const file = result.assets[0].file;
         if (file) {
           jsonStr = await file.text();
         }
      } else {
         jsonStr = await FileSystem.readAsStringAsync(fileUri);
      }
      
      const success = await StorageService.importProgressBackup(jsonStr);

      if (success) {
        Alert.alert('Success', 'Progress and settings imported successfully!', [
          { text: 'Reload App', onPress: onReloadData }
        ]);
        if (typeof window !== 'undefined' && window.alert) {
          // Web fallback alert
          window.alert('Progress and settings imported successfully!');
          onReloadData();
        }
      } else {
        Alert.alert('Error', 'Invalid backup file structure.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to read the selected file.');
    }
  },

  async handleLoadCustomMidi(onMidiLoaded: (name: string, base64: string) => void) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/midi', 'audio/x-midi', '*/*'], // Allow */* for broad compatibility on android
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const fileUri = result.assets[0].uri;
      const name = result.assets[0].name;

      let base64Str = '';
      if (fileUri.startsWith('data:') || fileUri.startsWith('blob:')) {
         const file = result.assets[0].file;
         if (file) {
           const buffer = await file.arrayBuffer();
           base64Str = btoa(
             new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
           );
         }
      } else {
         base64Str = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
      }
      
      onMidiLoaded(name, base64Str);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to read the MIDI file.');
    }
  }
};
