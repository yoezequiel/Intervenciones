import * as FileSystem from 'expo-file-system/legacy';

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;

/**
 * Ensures the photos directory exists.
 */
export const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!dirInfo.exists) {
    console.log("Photos directory doesn't exist, creating...");
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
};

/**
 * Saves an image from a temporary URI to permanent storage.
 * @param {string} tempUri - The temporary URI of the image.
 * @returns {Promise<string>} - The permanent URI of the saved image.
 */
export const saveImagePermanently = async (tempUri) => {
  try {
    await ensureDirExists();
    const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const permanentUri = `${PHOTOS_DIR}${filename}`;
    
    await FileSystem.copyAsync({
      from: tempUri,
      to: permanentUri,
    });
    
    return permanentUri;
  } catch (error) {
    console.error("Error saving image permanently:", error);
    throw error;
  }
};

/**
 * Deletes an image from storage.
 * @param {string} uri - The URI of the image to delete.
 */
export const deleteImage = async (uri) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri);
    }
  } catch (error) {
    console.error("Error deleting image:", error);
  }
};

/**
 * Gets a list of all saved photos (for debugging).
 */
export const listSavedPhotos = async () => {
  try {
    await ensureDirExists();
    return await FileSystem.readDirectoryAsync(PHOTOS_DIR);
  } catch (error) {
    console.error("Error listing photos:", error);
    return [];
  }
};
