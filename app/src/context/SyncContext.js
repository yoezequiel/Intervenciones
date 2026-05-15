import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import * as Network from "expo-network";
import { pushBatch, pull } from "../services/firesyncApi";
import { useDatabase } from "./DatabaseContext";
import { useAuth } from "./AuthContext";

const SyncContext = createContext(undefined);

export const useSync = () => {
    const ctx = useContext(SyncContext);
    if (!ctx) throw new Error("useSync must be used within SyncProvider");
    return ctx;
};

export const SyncProvider = ({ children }) => {
    const { db, isDbReady, getSetting, setSetting, refreshInterventions, refreshCommunications } = useDatabase();
    const { user } = useAuth();

    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncAt, setLastSyncAt] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncError, setSyncError] = useState(null);
    const syncingRef = useRef(false);

    const isFireSyncEnabled = isDbReady && getSetting("firesync_enabled") === "true";

    // Actualizar contador de cola
    const refreshPendingCount = useCallback(async () => {
        if (!db || !isDbReady) return;
        try {
            const result = await db.getFirstAsync("SELECT COUNT(*) as count FROM sync_queue");
            setPendingCount(result?.count ?? 0);
        } catch { /* ignore */ }
    }, [db, isDbReady]);

    // Procesar cola pendiente
    const processQueue = useCallback(async () => {
        if (!db || !isDbReady || !user || syncingRef.current) return;
        if (getSetting("firesync_enabled") !== "true") return;
        syncingRef.current = true;
        setIsSyncing(true);
        setSyncError(null);

        try {
            const rows = await db.getAllAsync(
                "SELECT * FROM sync_queue ORDER BY id ASC LIMIT 100"
            );
            if (rows.length === 0) {
                syncingRef.current = false;
                setIsSyncing(false);
                return;
            }

            const interventionItems = [];
            const communicationItems = [];

            for (const row of rows) {
                const item = {
                    localId: row.entity_id,
                    operation: row.operation,
                    payload: row.payload ? JSON.parse(row.payload) : null,
                    updatedAt: row.created_at,
                };
                if (row.entity_type === "intervention") interventionItems.push(item);
                else communicationItems.push(item);
            }

            await pushBatch(interventionItems, communicationItems);

            const ids = rows.map((r) => r.id);
            const placeholders = ids.map(() => "?").join(",");
            await db.runAsync(`DELETE FROM sync_queue WHERE id IN (${placeholders})`, ...ids);

            const now = new Date().toISOString();
            await setSetting("firesync_last_push", now);
            setLastSyncAt(now);
            setPendingCount(0);
        } catch (err) {
            console.error("[FireSync] Push error:", err);
            setSyncError(err.message);
            // Incrementar retry_count para no bloquear la cola indefinidamente
            await db.runAsync(
                "UPDATE sync_queue SET retry_count = retry_count + 1 WHERE retry_count < 5"
            );
            await db.runAsync("DELETE FROM sync_queue WHERE retry_count >= 5");
        } finally {
            syncingRef.current = false;
            setIsSyncing(false);
        }
    }, [db, isDbReady, user, getSetting, setSetting]);

    // Descargar cambios desde la nube
    const pullFromCloud = useCallback(async () => {
        if (!db || !isDbReady || !user) return;
        if (getSetting("firesync_enabled") !== "true") return;
        try {
            const since = getSetting("firesync_last_pull") || undefined;
            const result = await pull(since);

            for (const item of result.interventions) {
                if (item.deleted) {
                    await db.runAsync("DELETE FROM interventions WHERE id = ?", item.localId);
                } else {
                    const existing = await db.getFirstAsync(
                        "SELECT id, updatedAt FROM interventions WHERE id = ?",
                        item.localId
                    );
                    if (!existing || item.updatedAt > existing.updatedAt) {
                        const p = item.payload;
                        const fields = Object.keys(p).filter((k) => k !== "id");
                        if (existing) {
                            const setClause = fields.map((f) => `${f} = ?`).join(", ");
                            const vals = fields.map((f) => {
                                const v = p[f];
                                if (Array.isArray(v)) return JSON.stringify(v);
                                return v ?? null;
                            });
                            await db.runAsync(
                                `UPDATE interventions SET ${setClause}, cloud_synced_at = ? WHERE id = ?`,
                                ...vals, item.updatedAt, item.localId
                            );
                        } else {
                            // insert: construir columnas dinámicamente
                            const cols = [...fields, "cloud_synced_at"];
                            const vals2 = fields.map((f) => {
                                const v = p[f];
                                if (Array.isArray(v)) return JSON.stringify(v);
                                return v ?? null;
                            });
                            vals2.push(item.updatedAt);
                            const placeholders = cols.map(() => "?").join(", ");
                            await db.runAsync(
                                `INSERT OR IGNORE INTO interventions (${cols.join(", ")}) VALUES (${placeholders})`,
                                ...vals2
                            );
                        }
                    }
                }
            }

            for (const item of result.communications) {
                if (item.deleted) {
                    await db.runAsync("DELETE FROM communications WHERE id = ?", item.localId);
                } else {
                    const existing = await db.getFirstAsync(
                        "SELECT id, updatedAt FROM communications WHERE id = ?",
                        item.localId
                    );
                    if (!existing || item.updatedAt > existing.updatedAt) {
                        const p = item.payload;
                        if (existing) {
                            const fields = Object.keys(p).filter((k) => k !== "id");
                            const setClause = fields.map((f) => `${f} = ?`).join(", ");
                            const vals = fields.map((f) => p[f] ?? null);
                            await db.runAsync(
                                `UPDATE communications SET ${setClause}, cloud_synced_at = ? WHERE id = ?`,
                                ...vals, item.updatedAt, item.localId
                            );
                        } else {
                            const fields = Object.keys(p).filter((k) => k !== "id");
                            const cols = [...fields, "cloud_synced_at"];
                            const vals2 = [...fields.map((f) => p[f] ?? null), item.updatedAt];
                            const placeholders = cols.map(() => "?").join(", ");
                            await db.runAsync(
                                `INSERT OR IGNORE INTO communications (${cols.join(", ")}) VALUES (${placeholders})`,
                                ...vals2
                            );
                        }
                    }
                }
            }

            await setSetting("firesync_last_pull", result.pulledAt);
            await refreshInterventions();
            await refreshCommunications();
        } catch (err) {
            console.error("[FireSync] Pull error:", err);
        }
    }, [db, isDbReady, user, getSetting, setSetting, refreshInterventions, refreshCommunications]);

    // Sync completo: pull primero, luego push cola
    const syncNow = useCallback(async () => {
        const net = await Network.getNetworkStateAsync();
        if (!net.isConnected || !net.isInternetReachable) return;
        if (!user || !isFireSyncEnabled) return;

        await pullFromCloud();
        await processQueue();
    }, [isFireSyncEnabled, user, pullFromCloud, processQueue]);

    // Detectar conectividad y disparar sync
    useEffect(() => {
        if (!isFireSyncEnabled || !user || !isDbReady) return;

        const checkAndSync = async () => {
            const net = await Network.getNetworkStateAsync();
            if (net.isConnected && net.isInternetReachable) {
                syncNow();
            }
        };

        checkAndSync();
        // Revisar cada 2 minutos mientras la app está activa
        const interval = setInterval(checkAndSync, 120_000);
        return () => clearInterval(interval);
    }, [isFireSyncEnabled, user, isDbReady]);

    // Leer estado persistido al inicializar
    useEffect(() => {
        if (!isDbReady) return;
        const last = getSetting("firesync_last_push");
        if (last) setLastSyncAt(last);
        refreshPendingCount();
    }, [isDbReady]);

    return (
        <SyncContext.Provider value={{
            isSyncing,
            lastSyncAt,
            pendingCount,
            syncError,
            syncNow,
            refreshPendingCount,
        }}>
            {children}
        </SyncContext.Provider>
    );
};
