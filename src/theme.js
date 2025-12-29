import { MD3LightTheme } from "react-native-paper";

/**
 * Tema bomberil personalizado
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
        primaryContainer: "#ffcdd2",
        secondary: "#FFC107",
        secondaryContainer: "#FFF8E1",
        tertiary: "#212121",
        error: "#b71c1c",

        // Fondos y superficies (siempre light)
        background: "#FFFFFF",
        surface: "#FFFFFF",
        surfaceVariant: "#f5f5f5",

        // Colores de texto sobre cada fondo
        onPrimary: "#FFFFFF",
        onSecondary: "#000000",
        onBackground: "#212121",
        onSurface: "#212121",

        // Otros
        outline: "#757575",

        // Elevaciones (todas blancas para modo light)
        elevation: {
            level0: "#FFFFFF",
            level1: "#FFFFFF",
            level2: "#FFFFFF",
            level3: "#FFFFFF",
            level4: "#FFFFFF",
            level5: "#FFFFFF",
        },
    },
};

/**
 * Colores comunes para uso directo en estilos
 */
export const colors = {
    // Colores bomberiles
    firefighterRed: "#d32f2f",
    firefighterRedDark: "#b71c1c",
    firefighterYellow: "#FFC107",
    firefighterBlack: "#212121",

    // Fondos
    white: "#FFFFFF",
    background: "#FFFFFF",
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
    textPrimary: "#212121",
    textSecondary: "#666666",
    textDisabled: "#888888",
};
