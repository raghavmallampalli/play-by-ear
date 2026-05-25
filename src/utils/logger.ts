import { logger, consoleTransport, fileAsyncTransport } from 'react-native-logs';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const config = {
  // Directs output simultaneously to console and local disk file on Android/iOS
  transport: (props: any) => {
    consoleTransport(props);
    
    if (Platform.OS !== 'web' && FileSystem.documentDirectory) {
      fileAsyncTransport(props);
    }
  },
  transportOptions: {
    FS: FileSystem,
    fileName: 'play_by_ear_logs.txt',
    filePath: FileSystem.documentDirectory,
  },
};

export const log = logger.createLogger(config);
