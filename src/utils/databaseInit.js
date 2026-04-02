import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system/legacy";

export const initDatabase = async () => {
    try {
        // Abrir o crear la base de datos
        console.log("Abriendo base de datos...");
        const db = await SQLite.openDatabaseAsync("interventions.db");

        // Habilitar el modo de depuración en desarrollo
        if (__DEV__) {
            await db.execAsync("PRAGMA foreign_keys = ON;");
            console.log("SQLite database opened successfully");
        }

        // Crear tablas necesarias
        console.log("Creando tablas...");
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS interventions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        callTime TEXT,
        departureTime TEXT,
        returnTime TEXT,
        address TEXT,
        type TEXT,
        otherServices TEXT,
        witnesses TEXT,
        victims TEXT,
        fieldNotes TEXT,
        audioNotes TEXT,
        sketches TEXT,
        report TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

        console.log("Base de datos inicializada correctamente");
        return db;
    } catch (error) {
        console.error("Error al inicializar la base de datos:", error);
        throw error;
    }
};

// Función para verificar el estado de la base de datos
export const checkDatabase = async () => {
    try {
        const db = await SQLite.openDatabaseAsync("interventions.db");
        const tables = await db.getAllAsync(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%'"
        );
        console.log("Tablas en la base de datos:", tables);
        return tables.length > 0;
    } catch (error) {
        console.error("Error al verificar la base de datos:", error);
        return false;
    }
};

// Función para hacer backup de la base de datos (útil para depuración)
export const backupDatabase = async () => {
    if (!__DEV__) return;

    try {
        const sourcePath = `${FileSystem.documentDirectory}SQLite/interventions.db`;
        const backupPath = `${
            FileSystem.documentDirectory
        }SQLite/interventions_${new Date()
            .toISOString()
            .replace(/[:.]/g, "-")}.db`;

        await FileSystem.copyAsync({
            from: sourcePath,
            to: backupPath,
        });

        console.log(`Backup creado en: ${backupPath}`);
        return backupPath;
    } catch (error) {
        console.error("Error al hacer backup de la base de datos:", error);
        return null;
    }
};
