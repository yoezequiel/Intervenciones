import React, { useState, useCallback } from "react";
import {
    View, StyleSheet, ScrollView, Linking, ActivityIndicator,
} from "react-native";
import {
    Text, TextInput, Button, Switch, Divider, useTheme,
    Chip, Surface, TouchableRipple, Avatar, Portal, Modal, Icon,
} from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";
import { useModal } from "../context/ModalContext";
import { useAuth } from "../context/AuthContext";
import { useSync } from "../context/SyncContext";
import { testGeminiModel } from "../utils/geminiTestModel";
import { exportData } from "../services/firesyncApi";

const GEMINI_MODELS = [
    { id: "gemini-3-flash-preview",         label: "Gemini 3 Flash Preview",   desc: "Predeterminado — rápido y eficiente",         badge: "recomendado" },
    { id: "gemini-3.1-pro-preview",         label: "Gemini 3.1 Pro Preview",   desc: "Razonamiento profundo, multimodal y código",  badge: null },
    { id: "gemini-3.1-flash-lite",          label: "Gemini 3.1 Flash Lite",    desc: "Ideal para tareas de alto volumen",           badge: null },
    { id: "gemini-2.5-pro-preview-05-06",   label: "Gemini 2.5 Pro Preview",   desc: "Muy capaz, más lento",                        badge: null },
    { id: "gemini-2.5-flash-preview-05-20", label: "Gemini 2.5 Flash Preview", desc: "Rápido y muy capaz",                          badge: null },
    { id: "gemini-2.0-flash",               label: "Gemini 2.0 Flash",         desc: "Estable y muy rápido",                        badge: null },
    { id: "gemini-1.5-flash",               label: "Gemini 1.5 Flash",         desc: "Versión anterior estable",                    badge: null },
    { id: "gemini-1.5-pro",                 label: "Gemini 1.5 Pro",           desc: "Versión anterior, alta capacidad",            badge: null },
];

/* ─── Sub-componentes ────────────────────────────────────────────────────── */

function SectionHeader({ icon, title, description, action }) {
    const theme = useTheme();
    return (
        <View style={sectionHeaderStyles.wrapper}>
            <View style={[sectionHeaderStyles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
                <Avatar.Icon
                    size={36}
                    icon={icon}
                    color={theme.colors.onPrimaryContainer}
                    style={{ backgroundColor: "transparent" }}
                />
            </View>
            <View style={sectionHeaderStyles.textWrap}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
                    {title}
                </Text>
                {description ? (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2, lineHeight: 16 }}>
                        {description}
                    </Text>
                ) : null}
            </View>
            {action ?? null}
        </View>
    );
}
const sectionHeaderStyles = StyleSheet.create({
    wrapper:  { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
    iconWrap: { borderRadius: 10, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    textWrap: { flex: 1 },
});

function SectionCard({ children, style }) {
    const theme = useTheme();
    return (
        <Surface
            style={[
                { backgroundColor: theme.colors.surface, borderRadius: 16, marginBottom: 14,
                  padding: 18, borderWidth: 1, borderColor: theme.colors.outlineVariant },
                style,
            ]}
            elevation={1}
        >
            {children}
        </Surface>
    );
}

function StatusBadge({ ok, label }) {
    const theme = useTheme();
    return (
        <View style={[
            statusStyles.badge,
            { backgroundColor: ok ? (theme.dark ? "#1b3320" : "#e8f5e9") : (theme.dark ? "#3a1a1a" : "#fdecea") },
        ]}>
            <Text variant="labelSmall" style={{ color: ok ? (theme.dark ? "#a5d6a7" : "#2e7d32") : theme.colors.error, fontWeight: "700" }}>
                {ok ? `✓  ${label}` : `✗  ${label}`}
            </Text>
        </View>
    );
}
const statusStyles = StyleSheet.create({
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
});

function ModelCard({ model, selected, testing, testingLabel, disabled, onPress }) {
    const theme = useTheme();
    const isSelected = selected === model.id;
    const isTesting  = testing === model.id;

    return (
        <TouchableRipple
            onPress={() => !disabled && onPress(model.id)}
            borderless
            style={[
                modelStyles.card,
                {
                    borderColor: isSelected ? theme.colors.primary : theme.colors.outlineVariant,
                    backgroundColor: isSelected
                        ? (theme.dark ? "#2a1515" : "#fff5f5")
                        : theme.colors.surface,
                    opacity: disabled && !isTesting ? 0.55 : 1,
                },
            ]}
        >
            <View style={modelStyles.inner}>
                <View style={modelStyles.left}>
                    {isTesting ? (
                        <ActivityIndicator size={20} color={theme.colors.primary} />
                    ) : (
                        <View style={[
                            modelStyles.radio,
                            {
                                borderColor: isSelected ? theme.colors.primary : theme.colors.outline,
                                backgroundColor: isSelected ? theme.colors.primary : "transparent",
                            },
                        ]}>
                            {isSelected && <View style={modelStyles.radioDot} />}
                        </View>
                    )}
                </View>
                <View style={modelStyles.body}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <Text
                            variant="bodyMedium"
                            style={{ fontWeight: isSelected ? "700" : "500", color: theme.colors.onSurface, flex: 1 }}
                            numberOfLines={1}
                        >
                            {model.label}
                        </Text>
                        {model.badge && (
                            <View style={[modelStyles.badgePill, { backgroundColor: theme.colors.secondaryContainer }]}>
                                <Text variant="labelSmall" style={{ color: theme.colors.onSecondaryContainer, fontWeight: "700" }}>
                                    {model.badge}
                                </Text>
                            </View>
                        )}
                    </View>
                    {isTesting && testingLabel ? (
                        <Text variant="labelSmall" style={{ color: theme.colors.primary, marginTop: 2 }}>
                            Probando {testingLabel}…
                        </Text>
                    ) : (
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                            {model.desc}
                        </Text>
                    )}
                </View>
            </View>
        </TouchableRipple>
    );
}
const modelStyles = StyleSheet.create({
    card:      { borderWidth: 1.5, borderRadius: 10, marginBottom: 6, overflow: "hidden" },
    inner:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
    left:      { width: 24, alignItems: "center", justifyContent: "center" },
    body:      { flex: 1 },
    radio:     { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    radioDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
    badgePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
});

/* ─── Pantalla principal ─────────────────────────────────────────────────── */

const SettingsScreen = ({ navigation }) => {
    const { getSetting, setSetting } = useDatabase();
    const { user, signOut, removeAccount } = useAuth();
    const { isSyncing, lastSyncAt, pendingCount, syncError, syncNow } = useSync();
    const theme    = useTheme();
    const showModal = useModal();

    const [fireSyncEnabled,  setFireSyncEnabled]  = useState(getSetting("firesync_enabled") === "true");
    const [exportingData,    setExportingData]    = useState(false);
    const [apiKey,           setApiKey]           = useState(getSetting("gemini_api_key") || "");
    const [showKey,          setShowKey]          = useState(false);
    const [saving,           setSaving]           = useState(false);
    const [isDark,           setIsDark]           = useState(getSetting("dark_mode") === "true");
    const [selectedModel,    setSelectedModel]    = useState(getSetting("gemini_model") || "gemini-3-flash-preview");
    const [testingModel,     setTestingModel]     = useState(null);
    const [testingLabel,     setTestingLabel]     = useState("");
    const [modelModalVisible,    setModelModalVisible]    = useState(false);
    const [fireSyncInfoVisible,  setFireSyncInfoVisible]  = useState(false);

    const hasApiKey     = !!getSetting("gemini_api_key");
    const currentModel  = GEMINI_MODELS.find(m => m.id === selectedModel) ?? GEMINI_MODELS[0];

    /* handlers */
    const handleToggleFireSync = useCallback(async (value) => {
        if (value && !user) { navigation.navigate("FireSyncAuth"); return; }
        setFireSyncEnabled(value);
        await setSetting("firesync_enabled", value ? "true" : "false");
        if (!value) showModal({ type: "success", title: "FireSync pausado", message: "La sincronización está pausada. Tus datos locales no se modifican." });
    }, [user, navigation, setSetting]);

    const handleSignOut = useCallback(() => {
        showModal({
            type: "confirm", title: "Cerrar sesión",
            message: "FireSync se pausará. Tus datos locales quedan intactos.",
            confirmLabel: "Cerrar sesión",
            onConfirm: async () => {
                await signOut();
                await setSetting("firesync_enabled", "false");
                setFireSyncEnabled(false);
            },
        });
    }, [signOut, setSetting]);

    const handleDeleteAccount = useCallback(() => {
        showModal({
            type: "confirm", title: "Eliminar cuenta y datos",
            message: "Se eliminarán permanentemente tu cuenta y TODOS tus datos de la nube. Los datos locales en este dispositivo no se modifican.\n\nEsta acción no se puede deshacer.",
            confirmLabel: "Eliminar todo", confirmDestructive: true,
            onConfirm: async () => {
                try {
                    await removeAccount();
                    await setSetting("firesync_enabled", "false");
                    setFireSyncEnabled(false);
                    showModal({ type: "success", title: "Cuenta eliminada", message: "Todos tus datos en la nube han sido eliminados (RGPD art. 17)." });
                } catch (err) {
                    showModal({ type: "error", title: "Error", message: err.message });
                }
            },
        });
    }, [removeAccount, setSetting]);

    const handleExportData = useCallback(async () => {
        setExportingData(true);
        try {
            const data = await exportData();
            const { Share } = await import("react-native");
            await Share.share({ message: JSON.stringify(data, null, 2), title: "Exportación FireSync" });
        } catch (err) {
            showModal({ type: "error", title: "Error al exportar", message: err.message });
        } finally {
            setExportingData(false);
        }
    }, []);

    const handleSaveApiKey = useCallback(async () => {
        setSaving(true);
        try {
            await setSetting("gemini_api_key", apiKey.trim());
            showModal({ type: "success", title: "Guardado", message: "La API key fue guardada correctamente." });
        } catch {
            showModal({ type: "error", title: "Error", message: "No se pudo guardar la API key." });
        } finally {
            setSaving(false);
        }
    }, [apiKey, setSetting]);

    const handleClearApiKey = useCallback(() => {
        showModal({
            type: "confirm", title: "Eliminar API Key",
            message: "¿Estás seguro? La generación de informes con IA pasará a modo local.",
            confirmLabel: "Eliminar", confirmDestructive: true,
            onConfirm: async () => { await setSetting("gemini_api_key", ""); setApiKey(""); },
        });
    }, [setSetting]);

    const handleModelChange = useCallback(async (model) => {
        if (testingModel) return;
        const currentKey = getSetting("gemini_api_key");
        if (!currentKey) {
            setSelectedModel(model);
            await setSetting("gemini_model", model).catch(() => {});
            setModelModalVisible(false);
            return;
        }
        setTestingModel(model);
        setTestingLabel("");
        try {
            const result = await testGeminiModel(model, currentKey, (label) => setTestingLabel(label));
            setSelectedModel(model);
            await setSetting("gemini_model", model);
            await setSetting("gemini_thinking_config", result.thinkingConfig ? JSON.stringify(result.thinkingConfig) : "");
            setModelModalVisible(false);
            showModal({
                type: "success", title: "Modelo verificado",
                message: `${GEMINI_MODELS.find(m => m.id === model)?.label} quedó seleccionado con ${result.label}.`,
            });
        } catch (err) {
            setModelModalVisible(false);
            showModal({ type: "error", title: "Modelo no disponible", message: err.message });
        } finally {
            setTestingModel(null); setTestingLabel("");
        }
    }, [testingModel, getSetting, setSetting]);

    const handleToggleDarkMode = useCallback(async (value) => {
        setIsDark(value);
        try {
            await setSetting("dark_mode", value ? "true" : "false");
        } catch {
            showModal({ type: "error", title: "Error", message: "No se pudo guardar la preferencia." });
            setIsDark(!value);
        }
    }, [setSetting]);

    const formatSyncDate = (iso) => {
        if (!iso) return "Nunca";
        return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    };

    const userInitial = user?.email?.[0]?.toUpperCase() || "?";

    return (
        <>
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Encabezado ───────────────────────────────────────────── */}
            <Surface
                style={[styles.heroBanner, { backgroundColor: theme.colors.primary }]}
                elevation={0}
            >
                <Avatar.Icon size={48} icon="fire-truck" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} color="#fff" />
                <View style={{ flex: 1 }}>
                    <Text variant="titleLarge" style={styles.heroTitle}>FireLog</Text>
                    <Text variant="bodySmall" style={styles.heroSub}>Configuración de la aplicación</Text>
                </View>
            </Surface>

            {/* ── API de Google Gemini ─────────────────────────────────── */}
            <SectionCard>
                <SectionHeader
                    icon="robot-outline"
                    title="IA de Google Gemini"
                    description="Necesitás una API key propia para generar informes con IA. Se guarda solo en este dispositivo."
                />

                <StatusBadge
                    ok={hasApiKey}
                    label={hasApiKey ? "API key configurada" : "Sin API key — modo local activo"}
                />

                <TextInput
                    label="API Key de Gemini"
                    value={apiKey}
                    onChangeText={setApiKey}
                    mode="outlined"
                    secureTextEntry={!showKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="AIzaSy..."
                    left={<TextInput.Icon icon="key-outline" />}
                    right={<TextInput.Icon icon={showKey ? "eye-off-outline" : "eye-outline"} onPress={() => setShowKey(v => !v)} />}
                />

                <View style={styles.buttonRow}>
                    <Button
                        mode="contained"
                        onPress={handleSaveApiKey}
                        loading={saving}
                        disabled={saving || !apiKey.trim()}
                        icon="content-save-outline"
                        style={styles.flexBtn}
                        contentStyle={{ paddingVertical: 2 }}
                    >
                        Guardar
                    </Button>
                    {hasApiKey && (
                        <Button
                            mode="outlined"
                            onPress={handleClearApiKey}
                            icon="delete-outline"
                            textColor={theme.colors.error}
                            style={[styles.flexBtn, { borderColor: theme.colors.error }]}
                            contentStyle={{ paddingVertical: 2 }}
                        >
                            Eliminar
                        </Button>
                    )}
                </View>

                <Divider style={styles.divider} />

                <Button
                    mode="text"
                    icon="open-in-new"
                    onPress={() => Linking.openURL("https://aistudio.google.com/app/apikey")}
                    style={{ alignSelf: "flex-start", marginLeft: -6 }}
                    labelStyle={{ fontSize: 13 }}
                >
                    Obtener API key gratuita en Google AI Studio
                </Button>
            </SectionCard>

            {/* ── Modelo de Gemini ─────────────────────────────────────── */}
            <SectionCard>
                <SectionHeader
                    icon="brain"
                    title="Modelo de IA"
                    description={
                        hasApiKey
                            ? "Al seleccionar un modelo se envía un mensaje de prueba para verificarlo."
                            : "Configurá una API key para verificar el modelo al seleccionarlo."
                    }
                />

                {/* Selector compacto */}
                <TouchableRipple
                    onPress={() => !testingModel && setModelModalVisible(true)}
                    borderless
                    style={[
                        styles.modelSelector,
                        {
                            borderColor: theme.colors.primary,
                            backgroundColor: theme.dark ? "#2a1515" : "#fff5f5",
                        },
                    ]}
                >
                    <View style={styles.modelSelectorInner}>
                        <View style={styles.modelSelectorLeft}>
                            {testingModel ? (
                                <ActivityIndicator size={20} color={theme.colors.primary} />
                            ) : (
                                <Icon source="check-circle" size={22} color={theme.colors.primary} />
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text
                                variant="bodyMedium"
                                style={{ fontWeight: "700", color: theme.colors.onSurface }}
                                numberOfLines={1}
                            >
                                {testingModel
                                    ? (GEMINI_MODELS.find(m => m.id === testingModel)?.label ?? "Verificando…")
                                    : currentModel.label}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 1 }}>
                                {testingModel
                                    ? (testingLabel ? `Probando ${testingLabel}…` : "Verificando…")
                                    : currentModel.desc}
                            </Text>
                        </View>
                        <Icon
                            source="chevron-down"
                            size={22}
                            color={testingModel ? theme.colors.outline : theme.colors.primary}
                        />
                    </View>
                </TouchableRipple>

                <Button
                    mode="text"
                    icon="swap-horizontal"
                    onPress={() => !testingModel && setModelModalVisible(true)}
                    disabled={!!testingModel}
                    style={{ alignSelf: "flex-start", marginLeft: -6, marginTop: 4 }}
                    labelStyle={{ fontSize: 13 }}
                    textColor={theme.colors.onSurfaceVariant}
                >
                    Cambiar modelo
                </Button>
            </SectionCard>

            {/* ── FireSync ─────────────────────────────────────────────── */}
            <SectionCard>
                <SectionHeader
                    icon="cloud-sync-outline"
                    title="FireSync"
                    description="Respaldo cifrado en la nube. Solo vos podés acceder a tus datos."
                    action={
                        <TouchableRipple
                            onPress={() => setFireSyncInfoVisible(true)}
                            borderless
                            style={styles.infoBtn}
                        >
                            <Icon source="information-outline" size={22} color={theme.colors.primary} />
                        </TouchableRipple>
                    }
                />

                <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                            {fireSyncEnabled ? "Sincronización activa" : "Sincronización desactivada"}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                            {fireSyncEnabled && user ? user.email : "Cifrado AES-256 · Cumple RGPD"}
                        </Text>
                    </View>
                    <Switch
                        value={fireSyncEnabled}
                        onValueChange={handleToggleFireSync}
                        color={theme.colors.primary}
                    />
                </View>

                {fireSyncEnabled && user && (
                    <>
                        <Divider style={styles.divider} />

                        <View style={[styles.profileRow, { backgroundColor: theme.colors.surfaceVariant, borderRadius: 10 }]}>
                            <Avatar.Text
                                size={40}
                                label={userInitial}
                                style={{ backgroundColor: theme.colors.primary }}
                                color="#fff"
                            />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text variant="bodyMedium" style={{ fontWeight: "600", color: theme.colors.onSurface }}>
                                    {user.email}
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    Cuenta FireSync activa
                                </Text>
                            </View>
                        </View>

                        <View style={styles.chipRow}>
                            {isSyncing ? (
                                <Chip icon="sync" compact style={{ backgroundColor: theme.colors.primaryContainer }}>
                                    Sincronizando…
                                </Chip>
                            ) : syncError ? (
                                <Chip icon="alert-circle-outline" compact style={{ backgroundColor: theme.colors.errorContainer }}>
                                    Error de sync
                                </Chip>
                            ) : (
                                <Chip icon="check-circle-outline" compact style={{ backgroundColor: theme.colors.secondaryContainer }}>
                                    Última: {formatSyncDate(lastSyncAt)}
                                </Chip>
                            )}
                            {pendingCount > 0 && (
                                <Chip icon="clock-outline" compact style={{ backgroundColor: theme.colors.surfaceVariant }}>
                                    {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
                                </Chip>
                            )}
                        </View>

                        {syncError && (
                            <Text variant="bodySmall" style={{ color: theme.colors.error, marginBottom: 8, marginTop: -4 }}>
                                {syncError}
                            </Text>
                        )}

                        <View style={styles.buttonRow}>
                            <Button
                                mode="outlined"
                                compact
                                onPress={syncNow}
                                loading={isSyncing}
                                disabled={isSyncing}
                                icon="sync"
                                style={styles.flexBtn}
                            >
                                Sincronizar
                            </Button>
                            <Button
                                mode="outlined"
                                compact
                                onPress={handleExportData}
                                loading={exportingData}
                                disabled={exportingData}
                                icon="export-variant"
                                style={styles.flexBtn}
                            >
                                Exportar
                            </Button>
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.buttonRow}>
                            <Button
                                mode="text"
                                compact
                                onPress={handleSignOut}
                                icon="logout"
                                style={styles.flexBtn}
                                textColor={theme.colors.onSurfaceVariant}
                            >
                                Cerrar sesión
                            </Button>
                            <Button
                                mode="text"
                                compact
                                onPress={handleDeleteAccount}
                                icon="delete-forever-outline"
                                textColor={theme.colors.error}
                                style={styles.flexBtn}
                            >
                                Eliminar cuenta
                            </Button>
                        </View>
                    </>
                )}

                {!fireSyncEnabled && (
                    <View style={[styles.securityRow, { backgroundColor: theme.colors.surfaceVariant, borderRadius: 8 }]}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}>
                            🔒  AES-256 · Acceso exclusivo · RGPD art. 17
                        </Text>
                    </View>
                )}
            </SectionCard>

            {/* ── Apariencia ───────────────────────────────────────────── */}
            <SectionCard>
                <SectionHeader
                    icon={isDark ? "weather-night" : "weather-sunny"}
                    title="Apariencia"
                    description="Cambiá el tema visual de la aplicación."
                />
                <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                            Modo oscuro
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                            {isDark ? "Tema oscuro activado" : "Tema claro activado"}
                        </Text>
                    </View>
                    <Switch
                        value={isDark}
                        onValueChange={handleToggleDarkMode}
                        color={theme.colors.primary}
                    />
                </View>
            </SectionCard>

            {/* ── Acerca de ────────────────────────────────────────────── */}
            <SectionCard style={{ marginBottom: 4 }}>
                <SectionHeader
                    icon="information-outline"
                    title="Acerca de FireLog"
                    description={null}
                />
                <View style={styles.aboutGrid}>
                    <AboutItem label="Versión" value="2.1.1" />
                    <AboutItem label="Base de datos" value="SQLite local" />
                    <AboutItem label="Framework" value="React Native + Expo" />
                    <AboutItem label="Plataforma" value="Android" />
                </View>
                <Divider style={styles.divider} />
                <Button
                    mode="text"
                    icon="bug-outline"
                    onPress={() => Linking.openURL("https://github.com/yoezequiel/Intervenciones/issues")}
                    style={{ alignSelf: "flex-start", marginLeft: -6 }}
                    labelStyle={{ fontSize: 13 }}
                    textColor={theme.colors.onSurfaceVariant}
                >
                    Reportar un problema
                </Button>
            </SectionCard>
        </ScrollView>

        {/* ── Modal informativo de FireSync ───────────────────────────── */}
        <Portal>
            <Modal
                visible={fireSyncInfoVisible}
                onDismiss={() => setFireSyncInfoVisible(false)}
                contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
            >
                {/* Header */}
                <View style={fireSyncInfoStyles.header}>
                    <View style={[fireSyncInfoStyles.heroIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Icon source="cloud-lock-outline" size={40} color={theme.colors.primary} />
                    </View>
                    <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: "800", textAlign: "center", marginTop: 12 }}>
                        ¿Qué es FireSync?
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 6, lineHeight: 20 }}>
                        Tu cuaderno de intervenciones, seguro en la nube.
                    </Text>
                </View>

                <Divider style={{ marginVertical: 16 }} />

                <View style={fireSyncInfoStyles.featureList}>
                    <FireSyncFeature
                        icon="shield-check-outline"
                        color="#2e7d32"
                        bg={theme.dark ? "#1b3320" : "#e8f5e9"}
                        title="Solo vos podés leer tus datos"
                        desc="Todo se cifra en tu dispositivo antes de subir a la nube. Ni siquiera nosotros podemos verlos."
                    />
                    <FireSyncFeature
                        icon="cellphone-arrow-down-variant"
                        color={theme.colors.primary}
                        bg={theme.dark ? "#2a1515" : "#fff5f5"}
                        title="Recuperá todo si cambiás de celular"
                        desc="Iniciá sesión en el nuevo dispositivo y todos tus registros aparecen automáticamente."
                    />
                    <FireSyncFeature
                        icon="sync-circle"
                        color={theme.dark ? "#ffd54f" : "#ff8f00"}
                        bg={theme.dark ? "#2a2000" : "#fff8e1"}
                        title="Siempre actualizado"
                        desc="Los cambios se sincronizan solos en segundo plano. No tenés que hacer nada."
                    />
                    <FireSyncFeature
                        icon="file-export-outline"
                        color={theme.colors.onSurfaceVariant}
                        bg={theme.colors.surfaceVariant}
                        title="Tus datos son tuyos"
                        desc='Podés exportar todo en cualquier momento o borrar tu cuenta con un toque (RGPD art. 17).'
                    />
                </View>

                <Divider style={{ marginTop: 16, marginBottom: 10 }} />

                <Button
                    mode="contained"
                    onPress={() => setFireSyncInfoVisible(false)}
                    style={{ borderRadius: 10 }}
                    contentStyle={{ paddingVertical: 4 }}
                >
                    Entendido
                </Button>
            </Modal>
        </Portal>

        {/* ── Modal de selección de modelo ────────────────────────────── */}
        <Portal>
            <Modal
                visible={modelModalVisible}
                onDismiss={() => !testingModel && setModelModalVisible(false)}
                contentContainerStyle={[
                    styles.modalContainer,
                    { backgroundColor: theme.colors.surface },
                ]}
            >
                {/* Header del modal */}
                <View style={styles.modalHeader}>
                    <View style={{ flex: 1 }}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
                            Seleccioná un modelo
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                            {hasApiKey
                                ? "Se verificará automáticamente al seleccionar."
                                : "Sin API key — el cambio se aplica sin verificar."}
                        </Text>
                    </View>
                    {!testingModel && (
                        <Icon source="robot-outline" size={28} color={theme.colors.primary} />
                    )}
                </View>

                <Divider style={{ marginBottom: 12 }} />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: 420 }}
                    contentContainerStyle={{ paddingBottom: 4 }}
                >
                    {GEMINI_MODELS.map(model => (
                        <ModelCard
                            key={model.id}
                            model={model}
                            selected={selectedModel}
                            testing={testingModel}
                            testingLabel={testingLabel}
                            disabled={!!testingModel}
                            onPress={handleModelChange}
                        />
                    ))}
                </ScrollView>

                <Divider style={{ marginTop: 10, marginBottom: 8 }} />

                <Button
                    mode="text"
                    onPress={() => !testingModel && setModelModalVisible(false)}
                    disabled={!!testingModel}
                    textColor={theme.colors.onSurfaceVariant}
                >
                    Cancelar
                </Button>
            </Modal>
        </Portal>
        </>
    );
};

function FireSyncFeature({ icon, color, bg, title, desc }) {
    const theme = useTheme();
    return (
        <View style={fireSyncInfoStyles.feature}>
            <View style={[fireSyncInfoStyles.featureIcon, { backgroundColor: bg }]}>
                <Icon source={icon} size={22} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" style={{ fontWeight: "700", color: theme.colors.onSurface }}>
                    {title}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2, lineHeight: 17 }}>
                    {desc}
                </Text>
            </View>
        </View>
    );
}
const fireSyncInfoStyles = StyleSheet.create({
    header:      { alignItems: "center", paddingTop: 4 },
    heroIcon:    { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    featureList: { gap: 14 },
    feature:     { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    featureIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
});

function AboutItem({ label, value }) {
    const theme = useTheme();
    return (
        <View style={aboutStyles.item}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{value}</Text>
        </View>
    );
}
const aboutStyles = StyleSheet.create({
    item: { paddingVertical: 7 },
});

const styles = StyleSheet.create({
    container:          { flex: 1 },
    content:            { padding: 16, paddingBottom: 48 },
    heroBanner:         { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, padding: 18, marginBottom: 14 },
    heroTitle:          { color: "#fff", fontWeight: "800", fontSize: 20 },
    heroSub:            { color: "rgba(255,255,255,0.75)", marginTop: 2 },
    input:              { marginTop: 12, marginBottom: 12 },
    buttonRow:          { flexDirection: "row", gap: 8, marginTop: 4 },
    flexBtn:            { flex: 1, borderRadius: 8 },
    divider:            { marginVertical: 14 },
    toggleRow:          { flexDirection: "row", alignItems: "center", gap: 12 },
    profileRow:         { flexDirection: "row", alignItems: "center", padding: 12, marginVertical: 8 },
    chipRow:            { flexDirection: "row", gap: 8, flexWrap: "wrap", marginVertical: 10 },
    securityRow:        { padding: 10, marginTop: 10, alignItems: "center" },
    aboutGrid:          { gap: 2 },
    modelSelector:      { borderWidth: 1.5, borderRadius: 12, overflow: "hidden" },
    modelSelectorInner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
    modelSelectorLeft:  { width: 26, alignItems: "center", justifyContent: "center" },
    modalContainer:     { marginHorizontal: 20, borderRadius: 20, padding: 20, elevation: 5 },
    modalHeader:        { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
    infoBtn:            { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});

export default SettingsScreen;
