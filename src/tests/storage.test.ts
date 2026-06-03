import { StorageService } from '../services/storage';

const mockFiles: { [path: string]: string } = {};

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'mock-doc-dir/',
  cacheDirectory: 'mock-cache-dir/',
  getInfoAsync: jest.fn(async (uri: string) => {
    return { exists: uri in mockFiles };
  }),
  readAsStringAsync: jest.fn(async (uri: string) => {
    if (uri in mockFiles) {
      return mockFiles[uri];
    }
    throw new Error('File not found: ' + uri);
  }),
  writeAsStringAsync: jest.fn(async (uri: string, content: string) => {
    mockFiles[uri] = content;
  }),
}));

describe('StorageService', () => {
  beforeEach(() => {
    // Clear mock files
    for (const key in mockFiles) {
      delete mockFiles[key];
    }
  });

  test('exports and imports backup with user notes successfully', async () => {
    const testNotes = {
      1: 'Note for level 1',
      2: 'Note for level 2',
    };

    // Save notes
    await StorageService.saveUserNotes(testNotes);

    // Load data and verify notes are present
    const loadedDataBefore = await StorageService.loadAllData();
    expect(loadedDataBefore.notes).toEqual(testNotes);

    // Export backup
    const backupResult = await StorageService.exportProgressBackup();
    expect(backupResult).toBeDefined();

    // Read the backup content from the path or the string directly
    let jsonStr = '';
    if (backupResult && backupResult.startsWith('mock-cache-dir/')) {
      // It wrote to cache file
      jsonStr = mockFiles[backupResult];
    } else {
      jsonStr = backupResult || '';
    }

    // Verify backup contains notes
    const parsedBackup = JSON.parse(jsonStr);
    expect(parsedBackup.notes).toEqual(testNotes);

    // Now modify the files to simulate empty/new state
    for (const key in mockFiles) {
      delete mockFiles[key];
    }

    // Import progress from backup
    const importSuccess = await StorageService.importProgressBackup(jsonStr);
    expect(importSuccess).toBe(true);

    // Verify notes are restored
    const loadedDataAfter = await StorageService.loadAllData();
    expect(loadedDataAfter.notes).toEqual(testNotes);
  });
});
