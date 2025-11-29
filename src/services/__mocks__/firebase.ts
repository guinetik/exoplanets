/**
 * Mock implementation of Firebase for Jest tests
 */

export const getFirebaseStorage = () => null;
export const isFirebaseConfigured = () => false;
export const uploadFileToFirebase = jest.fn();
export const downloadFileFromFirebase = jest.fn();

export default {
  getFirebaseStorage,
  isFirebaseConfigured,
  uploadFileToFirebase,
  downloadFileFromFirebase,
};
