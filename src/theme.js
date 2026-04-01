import { MD3LightTheme } from "react-native-paper";

/**
 * Tema bomberil personalizado (Modern Card-Based MD3)
 * Basado en los colores característicos de bomberos:
 * - Rojo (#d32f2f): Color primario de emergencias
 * - Rojo oscuro (#b71c1c): Color de acentuación
 * - Amarillo (#FFC107): Color de seguridad y advertencia
 * - Negro (#212121): Color de equipamiento
 */
export const firefighterTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        // Colores primarios bomberiles
        primary: "#d32f2f",
        onPrimary: "#FFFFFF",
        primaryContainer: "#ffcdd2",
        onPrimaryContainer: "#b71c1c",

        // Colores secundarios (Amarillo/Dorado de advertencia)
        secondary: "#ffb300",
        onSecondary: "#422c00",
        secondaryContainer: "#ffecb3",
        onSecondaryContainer: "#ff8f00",

        // Colores terciarios (Gris oscuro/Negro)
        tertiary: "#424242",
        onTertiary: "#FFFFFF",
        tertiaryContainer: "#eeeeee",
        onTertiaryContainer: "#212121",

        error: "#b71c1c",
        onError: "#FFFFFF",
        errorContainer: "#f9dedc",
        onErrorContainer: "#410e0b",

        // Fondos y superficies
        background: "#f8f9fa", // Fondo sutilmente gris para resaltar las tarjetas
        onBackground: "#1a1c1e",
        surface: "#FFFFFF",
        onSurface: "#1a1c1e",
        surfaceVariant: "#f0f2f5",
        onSurfaceVariant: "#44474f",
        
        // Bordes e iconos
        outline: "#74777f",
        outlineVariant: "#c4c6d0",

        // Elevaciones MD3 (tonos aplicados sobre surface)
        elevation: {
            level0: "transparent",
            level1: "#f5f5f5", // Sombra muy ligera
            level2: "#eeeeee",
            level3: "#e0e0e0",
            level4: "#bdbdbd",
            level5: "#9e9e9e",
        },
    },
    roundness: 2, // Ligeramente más redondeado (default es 1)
};

/**
 * Colores comunes para uso directo en estilos
 */
export const colors = {
    // Colores bomberiles
    firefighterRed: "#d32f2f",
    firefighterRedDark: "#b71c1c",
    firefighterYellow: "#ffb300",
    firefighterBlack: "#212121",
    firefighterBlue: "#1976d2",
    firefighterGreen: "#2e7d32",
    firefighterOrange: "#ed6c02",

    // Fondos
    white: "#FFFFFF",
    background: "#f8f9fa",
    cardBackground: "#FFFFFF",

    // Grises
    gray50: "#FAFAFA",
    gray100: "#F5F5F5",
    gray200: "#EEEEEE",
    gray300: "#E0E0E0",
    gray400: "#BDBDBD",
    gray500: "#9E9E9E",
    gray600: "#757575",
    gray700: "#616161",
    gray800: "#424242",
    gray900: "#212121",

    // Colores de texto
    textPrimary: "#1a1c1e",
    textSecondary: "#44474f",
    textDisabled: "#888888",
};
