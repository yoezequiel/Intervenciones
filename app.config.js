export default {
    expo: {
        name: "Intervenciones Bomberos",
        slug: "IntervencionBomberos",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/icon.png",
            resizeMode: "contain",
            backgroundColor: "#d32f2f",
        },
        assetBundlePatterns: ["**/*"],
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.yoezequiel.intervencionbomberos",
            buildNumber: "1.0.0",
            infoPlist: {
                NSCameraUsageDescription:
                    "Esta aplicación necesita acceso a la cámara para tomar fotos durante las intervenciones.",
                NSPhotoLibraryUsageDescription:
                    "Esta aplicación necesita acceso a la galería para adjuntar fotos a las intervenciones.",
                NSMicrophoneUsageDescription:
                    "Esta aplicación necesita acceso al micrófono para grabar notas de audio.",
                NSPhotoLibraryAddUsageDescription:
                    "Esta aplicación necesita permiso para guardar fotos en la galería.",
            },
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/icon.png",
                backgroundColor: "#d32f2f",
            },
            package: "com.yoezequiel.intervencionbomberos",
            versionCode: 1,
            permissions: [
                "READ_EXTERNAL_STORAGE",
                "WRITE_EXTERNAL_STORAGE",
                "CAMERA",
                "RECORD_AUDIO",
            ],
            blockedPermissions: ["android.permission.RECORD_AUDIO"],
        },
        web: {
            favicon: "./assets/icon.png",
        },
        plugins: [
            [
                "expo-sqlite",
                {
                    androidDatabaseProvider: "system",
                },
            ],
        ],
        extra: {
            eas: {
                projectId: "fcfd8db0-aca3-451b-b9a9-b658ebde6126",
            },
            API_KEY: process.env.API_KEY,
        },
        runtimeVersion: {
            policy: "sdkVersion",
        },
        updates: {
            url: "https://u.expo.dev/fcfd8db0-aca3-451b-b9a9-b658ebde6126",
        },
    },
};
