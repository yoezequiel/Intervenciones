export default {
    "expo": {
        "name": "Intervenciones Bomberos",
        "slug": "IntervencionBomberos",
        "version": "1.0.0",
        "orientation": "portrait",
        "icon": "./assets/icon.png",
        "userInterfaceStyle": "light",
        "newArchEnabled": true,
        "splash": {
            "image": "./assets/icon.png",
            "resizeMode": "contain",
            "backgroundColor": "#d32f2f"
        },
        "ios": {
            "supportsTablet": true,
            "infoPlist": {
                "NSCameraUsageDescription": "Esta aplicación necesita acceso a la cámara para tomar fotos durante las intervenciones.",
                "NSPhotoLibraryUsageDescription": "Esta aplicación necesita acceso a la galería para adjuntar fotos a las intervenciones."
            }
        },
        "android": {
            "adaptiveIcon": {
                "foregroundImage": "./assets/icon.png",
                "backgroundColor": "#d32f2f"
            },
            "edgeToEdgeEnabled": true,
            "permissions": ["READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"],
            "package": "com.yoezequiel.intervencionbomberos",
            "versionCode": 1
        },
        "web": {
            "favicon": "./assets/icon.png"
        },
        "plugins": [],
        "extra": {
            "eas": {
                "projectId": "fcfd8db0-aca3-451b-b9a9-b658ebde6126"
            },
            "API_KEY": process.env.API_KEY
        }
    }
};