import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';

const DatabaseContext = createContext(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider = ({ children }) => {
  const [interventions, setInterventions] = useState([]);
  const [db, setDb] = useState(null);

  useEffect(() => {
    initDatabase();
  }, []);

  const initDatabase = async () => {
    try {
      const database = await SQLite.openDatabaseAsync('interventions.db');
      setDb(database);

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

      await refreshInterventions();
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  };

  const refreshInterventions = async () => {
    if (!db) return;

    try {
      const result = await db.getAllAsync('SELECT * FROM interventions ORDER BY createdAt DESC');
      const parsedInterventions = result.map((row) => ({
        ...row,
        otherServices: row.otherServices && row.otherServices !== 'null' ? JSON.parse(row.otherServices) : [],
        witnesses: row.witnesses && row.witnesses !== 'null' ? JSON.parse(row.witnesses) : [],
        victims: row.victims && row.victims !== 'null' ? JSON.parse(row.victims) : [],
        audioNotes: row.audioNotes && row.audioNotes !== 'null' ? JSON.parse(row.audioNotes) : [],
        sketches: row.sketches && row.sketches !== 'null' ? JSON.parse(row.sketches) : [],
      }));
      setInterventions(parsedInterventions);
    } catch (error) {
      console.error('Error fetching interventions:', error);
    }
  };

  const addIntervention = async (intervention) => {
    if (!db) return;

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
      await refreshInterventions();
    } catch (error) {
      console.error('Error adding intervention:', error);
    }
  };

  const updateIntervention = async (id, updates) => {
    if (!db) return;

    const now = new Date().toISOString();
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = updates[field];
      if (field === 'otherServices' || field === 'witnesses' || field === 'victims' ||
          field === 'audioNotes' || field === 'sketches') {
        return JSON.stringify(value);
      }
      return value?.toString() || null;
    });

    try {
      const params = [...values, now, id];
      await db.runAsync(
        `UPDATE interventions SET ${setClause}, updatedAt = ? WHERE id = ?`,
        ...params.map(p => p?.toString() || null)
      );
      await refreshInterventions();
    } catch (error) {
      console.error('Error updating intervention:', error);
    }
  };

  const deleteIntervention = async (id) => {
    if (!db) return;

    try {
      await db.runAsync('DELETE FROM interventions WHERE id = ?', id);
      await refreshInterventions();
    } catch (error) {
      console.error('Error deleting intervention:', error);
    }
  };

  const getIntervention = (id) => {
    return interventions.find(intervention => intervention.id === id);
  };

  return (
    <DatabaseContext.Provider value={{
      interventions,
      addIntervention,
      updateIntervention,
      deleteIntervention,
      getIntervention,
      refreshInterventions
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};