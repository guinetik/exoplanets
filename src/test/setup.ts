import '@testing-library/jest-dom';

// Mock shaderService
jest.mock('../services/shaderService', () => ({
  shaderService: {
    loadShaders: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockReturnValue(''),
    isLoaded: jest.fn().mockReturnValue(true),
    getAvailableShaders: jest.fn().mockReturnValue([]),
  },
}));

// Mock loadBinaryData from solarSystem
jest.mock('../utils/solarSystem', () => {
  const actual = jest.requireActual('../utils/solarSystem');
  return {
    ...actual,
    loadBinaryData: jest.fn().mockResolvedValue(new Map()),
    getBinaryData: jest.fn().mockReturnValue(undefined),
  };
});

// Mock firebase service (uses import.meta which Jest doesn't support)
jest.mock('../services/firebase', () => ({
  getFirebaseStorage: jest.fn().mockReturnValue(null),
  isFirebaseConfigured: jest.fn().mockReturnValue(false),
  uploadFileToFirebase: jest.fn(),
  downloadFileFromFirebase: jest.fn(),
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));
