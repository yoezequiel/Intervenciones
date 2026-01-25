import Constants from "expo-constants";

// Accede a las variables de entorno definidas en eas.json
export const API_KEY = Constants.expoConfig?.extra?.API_KEY;

// Log para verificar que la API_KEY se cargó correctamente
console.log("=== ENV.JS ===");
console.log("API_KEY disponible:", API_KEY ? "SÍ" : "NO");
console.log("API_KEY es undefined:", API_KEY === undefined);
console.log("API_KEY es string 'undefined':", API_KEY === "undefined");
console.log("Constants.expoConfig.extra:", Constants.expoConfig?.extra);
console.log("=============");
