import React, { createContext, useContext, useEffect, useState } from "react";
import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system";

const DatabaseContext = createContext(undefined);

export const useDatabase = () => {
    const context = useContext(DatabaseContext);
    if (!context) {
        throw new Error("useDatabase must be used within a DatabaseProvider");
    }
    return context;
};

export const DatabaseProvider = ({ children }) => {
    const [interventions, setInterventions] = useState([]);
    const [db, setDb] = useState(null);
    const [isDbReady, setIsDbReady] = useState(false);
    const [error, setError] = useState(null);

    const initDatabase = async (retryCount = 0) => {
        try {
            // Pequeña pausa si es un reintento para dejar que el runtime respire
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const database = await SQLite.openDatabaseAsync("interventions.db");

            if (__DEV__) {
                await database.execAsync("PRAGMA foreign_keys = ON;");
                console.log("SQLite database opened successfully");
            }

            await database.execAsync(`
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

            setDb(database);
            await loadInterventions(database);
            setIsDbReady(true);
        } catch (err) {
            console.error(`Error initializing database (attempt ${retryCount + 1}):`, err);
            
            // Si el error es "runtime not ready" o similar, reintentar un par de veces
            if (retryCount < 2) {
                console.log("Retrying database initialization...");
                return await initDatabase(retryCount + 1);
            }

            setError(err);
            setIsDbReady(false);
        }
    };

    useEffect(() => {
        initDatabase();

        return () => {
            if (db) {
                // Usar una función anónima para evitar errores si el objeto no tiene closeAsync en ese momento
                try {
                    db.closeSync();
                } catch (e) {
                    // Ignorar errores al cerrar
                }
            }
        };
    }, []);

    const loadInterventions = async (database) => {
        if (!database) return;

        try {
            const result = await database.getAllAsync(
                "SELECT * FROM interventions ORDER BY createdAt DESC"
            );
            const parsedInterventions = result.map((row) => ({
                ...row,
                otherServices: safeJsonParse(row.otherServices, []),
                witnesses: safeJsonParse(row.witnesses, []),
                victims: safeJsonParse(row.victims, []),
                audioNotes: safeJsonParse(row.audioNotes, []),
                sketches: safeJsonParse(row.sketches, []),
            }));
            setInterventions(parsedInterventions);
        } catch (err) {
            console.error("Error loading interventions:", err);
            setInterventions([]);
            throw err;
        }
    };

    const safeJsonParse = (str, defaultValue = []) => {
        try {
            if (!str || str === "null" || str === "undefined")
                return defaultValue;
            return JSON.parse(str);
        } catch (e) {
            console.warn("Error parsing JSON:", e);
            return defaultValue;
        }
    };

    const refreshInterventions = async () => {
        if (!db) return;

        try {
            const result = await db.getAllAsync(
                "SELECT * FROM interventions ORDER BY createdAt DESC"
            );
            const parsedInterventions = result.map((row) => ({
                ...row,
                otherServices: safeJsonParse(row.otherServices, []),
                witnesses: safeJsonParse(row.witnesses, []),
                victims: safeJsonParse(row.victims, []),
                audioNotes: safeJsonParse(row.audioNotes, []),
                sketches: safeJsonParse(row.sketches, []),
            }));
            setInterventions(parsedInterventions);
        } catch (error) {
            console.error("Error fetching interventions:", error);
        }
    };

    const addIntervention = async (intervention) => {
        if (!db || !isDbReady) throw new Error("Database not ready");

        const now = new Date().toISOString();
        try {
            await db.runAsync(
                `INSERT INTO interventions (
          callTime, departureTime, returnTime, address, type,
          otherServices, witnesses, victims, fieldNotes,
          audioNotes, sketches, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                intervention.callTime || null,
                intervention.departureTime || null,
                intervention.returnTime || null,
                intervention.address || null,
                intervention.type || null,
                JSON.stringify(intervention.otherServices || []),
                JSON.stringify(intervention.witnesses || []),
                JSON.stringify(intervention.victims || []),
                intervention.fieldNotes || null,
                JSON.stringify(intervention.audioNotes || []),
                JSON.stringify(intervention.sketches || []),
                now,
                now
            );
            await loadInterventions(db);
        } catch (err) {
            console.error("Error adding intervention:", err);
            throw err;
        }
    };

    const updateIntervention = async (id, updates) => {
        if (!db || !isDbReady) throw new Error("Database not ready");

        const now = new Date().toISOString();
        const fields = Object.keys(updates).filter((key) => key !== "id");
        const setClause = fields.map((field) => `${field} = ?`).join(", ");
        const values = fields.map((field) => {
            const value = updates[field];
            if (
                field === "otherServices" ||
                field === "witnesses" ||
                field === "victims" ||
                field === "audioNotes" ||
                field === "sketches"
            ) {
                return JSON.stringify(value || []);
            }
            return value || null;
        });

        try {
            const params = [...values, now, id];
            await db.runAsync(
                `UPDATE interventions SET ${setClause}, updatedAt = ? WHERE id = ?`,
                ...params
            );
            await loadInterventions(db);
        } catch (err) {
            console.error("Error updating intervention:", err);
            throw err;
        }
    };

    const deleteIntervention = async (id) => {
        if (!db || !isDbReady) throw new Error("Database not ready");

        try {
            await db.runAsync("DELETE FROM interventions WHERE id = ?", id);
            await loadInterventions(db);
        } catch (err) {
            console.error("Error deleting intervention:", err);
            throw err;
        }
    };

    const getIntervention = (id) => {
        if (!id) return null;
        return interventions.find(
            (intervention) => String(intervention.id) === String(id)
        );
    };

    return (
        <DatabaseContext.Provider
            value={{
                interventions,
                isDbReady,
                error,
                refreshInterventions,
                addIntervention,
                updateIntervention,
                deleteIntervention,
                getIntervention,
            }}>
            {children}
        </DatabaseContext.Provider>
    );
};
