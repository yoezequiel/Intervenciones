import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Button, IconButton, Text, Surface, ActivityIndicator, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { saveImagePermanently, deleteImage } from '../utils/mediaUtils';

const MultimediaSection = ({ photos, onPhotosChange }) => {
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para tomar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      processAndAddImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para seleccionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      setLoading(true);
      try {
        const newPhotos = [...photos];
        for (const asset of result.assets) {
          const permanentUri = await saveImagePermanently(asset.uri);
          newPhotos.push(permanentUri);
        }
        onPhotosChange(newPhotos);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron guardar algunas imágenes.');
      } finally {
        setLoading(false);
      }
    }
  };

  const processAndAddImage = async (uri) => {
    setLoading(true);
    try {
      const permanentUri = await saveImagePermanently(uri);
      onPhotosChange([...photos, permanentUri]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la imagen.');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = async (index) => {
    const photoToDelete = photos[index];
    Alert.alert(
      'Eliminar foto',
      '¿Estás seguro de que quieres eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const newPhotos = photos.filter((_, i) => i !== index);
            onPhotosChange(newPhotos);
            // Delete file from disk
            await deleteImage(photoToDelete);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Button
          mode="contained-tonal"
          onPress={takePhoto}
          icon="camera"
          style={styles.actionButton}
        >
          Cámara
        </Button>
        <Button
          mode="contained-tonal"
          onPress={pickImage}
          icon="image-multiple"
          style={styles.actionButton}
        >
          Galería
        </Button>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} color={theme.colors.primary} />
          <Text variant="bodySmall" style={styles.loadingText}>Procesando imágenes...</Text>
        </View>
      )}

      {photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
          {photos.map((uri, index) => (
            <Surface key={index} style={styles.photoWrapper} elevation={2}>
              <Image source={{ uri }} style={styles.photo} />
              <IconButton
                icon="delete"
                size={20}
                iconColor="white"
                style={styles.deleteIcon}
                onPress={() => removePhoto(index)}
              />
            </Surface>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <IconButton icon="image-off-outline" size={48} disabled />
          <Text variant="bodyMedium" style={styles.emptyText}>No hay fotos capturadas</Text>
        </View>
      )}
      
      <Text variant="labelSmall" style={styles.hint}>
        Las fotos se guardan localmente como evidencia técnica.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  photoList: {
    flexDirection: 'row',
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: 150,
    height: 150,
    resizeMode: 'cover',
  },
  deleteIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    margin: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 12,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  emptyText: {
    color: '#757575',
  },
  hint: {
    marginTop: 12,
    color: '#9e9e9e',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default MultimediaSection;
