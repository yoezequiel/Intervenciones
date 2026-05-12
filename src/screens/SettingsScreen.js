import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Linking, ActivityIndicator } from "react-native";
import {
    Card,
    Title,
    Text,
    TextInput,
    Button,
    Switch,
    List,
    Divider,
    useTheme,
    Banner,
    RadioButton,
} from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";
import { useModal } from "../context/ModalContext";
import { testGeminiModel } from "../utils/geminiTestModel";

const GEMINI_MODELS = [
    { id: "gemini-3-flash-preview",         label: "Gemini 3 Flash Preview",         desc: "Predeterminado — rápido y eficiente" },
    { id: "gemini-3.1-pro-preview",         label: "Gemini 3.1 Pro Preview",         desc: "SOTA: razonamiento profundo, multimodal y código" },
    { id: "gemini-3.1-flash-lite",          label: "Gemini 3.1 Flash Lite",          desc: "Más eficiente: ideal para tareas de alto volumen" },
    { id: "gemini-2.5-pro-preview-05-06",   label: "Gemini 2.5 Pro Preview",         desc: "Muy capaz, más lento" },
    { id: "gemini-2.5-flash-preview-05-20", label: "Gemini 2.5 Flash Preview",       desc: "Rápido y muy capaz" },
    { id: "gemini-2.0-flash",               label: "Gemini 2.0 Flash",               desc: "Estable, muy rápido" },
    { id: "gemini-1.5-flash",               label: "Gemini 1.5 Flash",               desc: "Versión anterior estable" },
    { id: "gemini-1.5-pro",                 label: "Gemini 1.5 Pro",                 desc: "Versión anterior, alta capacidad" },
];

const SettingsScreen = () => {
    const { getSetting, setSetting } = useDatabase();
    const theme = useTheme();
    const showModal = useModal();

    const [apiKey, setApiKey] = useState(getSetting("gemini_api_key") || "");
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isDark, setIsDark] = useState(getSetting("dark_mode") === "true");
    const [selectedModel, setSelectedModel] = useState(
        getSetting("gemini_model") || "gemini-3-flash-preview"
    );
    const [testingModel, setTestingModel] = useState(null);
    const [testingLabel, setTestingLabel] = useState("");

    const hasApiKey = !!getSetting("gemini_api_key");
    const successColor = theme.dark ? "#a5d6a7" : "#2e7d32";

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
            type: "confirm",
            title: "Eliminar API Key",
            message: "¿Estás seguro? La generación de informes con IA pasará a modo local.",
            confirmLabel: "Eliminar",
            confirmDestructive: true,
            onConfirm: async () => {
                await setSetting("gemini_api_key", "");
                setApiKey("");
            },
        });
    }, [setSetting]);

    const handleModelChange = useCallback(async (model) => {
        if (testingModel) return;

        const currentKey = getSetting("gemini_api_key");
        if (!currentKey) {
            setSelectedModel(model);
            await setSetting("gemini_model", model).catch(() => {});
            return;
        }

        setTestingModel(model);
        setTestingLabel("");
        try {
            const result = await testGeminiModel(model, currentKey, (label) => setTestingLabel(label));
            setSelectedModel(model);
            await setSetting("gemini_model", model);
            await setSetting(
                "gemini_thinking_config",
                result.thinkingConfig ? JSON.stringify(result.thinkingConfig) : ""
            );
            showModal({
                type: "success",
                title: "Modelo verificado",
                message: `${GEMINI_MODELS.find(m => m.id === model)?.label} quedó seleccionado con ${result.label}.`,
            });
        } catch (err) {
            showModal({
                type: "error",
                title: "Modelo no disponible",
                message: err.message,
            });
        } finally {
            setTestingModel(null);
            setTestingLabel("");
        }
    }, [testingModel, getSetting, setSetting]);

    const handleToggleDarkMode = useCallback(
        async (value) => {
            setIsDark(value);
            try {
                await setSetting("dark_mode", value ? "true" : "false");
            } catch {
                showModal({ type: "error", title: "Error", message: "No se pudo guardar la preferencia." });
                setIsDark(!value);
            }
        },
        [setSetting]
    );

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.content}
        >
            {/* ── API Key ─────────────────────────────────────────────────── */}
            <Card style={styles.card} mode="elevated" elevation={1}>
                <Card.Content>
                    <Title style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                        API de Google Gemini
                    </Title>
                    <Text
                        variant="bodyMedium"
                        style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
                    >
                        Necesitás una API key propia para generar informes con IA. Se guarda
                        únicamente en este dispositivo y nunca se comparte.
                    </Text>

                    <View style={styles.statusRow}>
                        {hasApiKey ? (
                            <Text
                                variant="labelMedium"
                                style={[styles.statusText, { color: successColor }]}
                            >
                                ✓  API key configurada
                            </Text>
                        ) : (
                            <Text
                                variant="labelMedium"
                                style={[styles.statusText, { color: theme.colors.error }]}
                            >
                                ✗  Sin API key — se usará generación local
                            </Text>
                        )}
                    </View>

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
                        left={<TextInput.Icon icon="key" />}
                        right={
                            <TextInput.Icon
                                icon={showKey ? "eye-off" : "eye"}
                                onPress={() => setShowKey(v => !v)}
                            />
                        }
                    />

                    <View style={styles.buttonRow}>
                        <Button
                            mode="contained"
                            onPress={handleSaveApiKey}
                            loading={saving}
                            disabled={saving || !apiKey.trim()}
                            icon="content-save"
                            style={styles.flexBtn}
                        >
                            Guardar
                        </Button>
                        {hasApiKey && (
                            <Button
                                mode="outlined"
                                onPress={handleClearApiKey}
                                icon="delete"
                                textColor={theme.colors.error}
                                style={styles.flexBtn}
                            >
                                Eliminar
                            </Button>
                        )}
                    </View>

                    <Divider style={styles.divider} />

                    <Button
                        mode="text"
                        icon="open-in-new"
                        onPress={() =>
                            Linking.openURL("https://aistudio.google.com/app/apikey")
                        }
                        style={styles.linkBtn}
                    >
                        Obtener API key gratuita en Google AI Studio
                    </Button>
                </Card.Content>
            </Card>

            {/* ── Modelo de Gemini ────────────────────────────────────────── */}
            <Card style={styles.card} mode="elevated" elevation={1}>
                <Card.Content>
                    <Title style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                        Modelo de Gemini
                    </Title>
                    <Text
                        variant="bodyMedium"
                        style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
                    >
                        Elegí el modelo para la generación de informes.{" "}
                        {hasApiKey
                            ? "Al seleccionar uno se envía un mensaje de prueba para verificar que funcione."
                            : "Configurá una API key primero para que el modelo se verifique al seleccionarlo."}
                    </Text>
                    <RadioButton.Group onValueChange={handleModelChange} value={selectedModel}>
                        {GEMINI_MODELS.map(model => {
                            const isTesting = testingModel === model.id;
                            const isDisabled = !!testingModel;
                            return (
                                <List.Item
                                    key={model.id}
                                    title={model.label}
                                    description={model.desc + (model.id === "gemini-3-flash-preview" ? " (predeterminado)" : "")}
                                    left={() =>
                                        isTesting ? (
                                            <ActivityIndicator
                                                size="small"
                                                color={theme.colors.primary}
                                                style={{ marginLeft: 8, marginRight: 4 }}
                                            />
                                        ) : (
                                            <RadioButton
                                                value={model.id}
                                                color={theme.colors.primary}
                                                uncheckedColor={theme.colors.outline}
                                                disabled={isDisabled}
                                            />
                                        )
                                    }
                                    right={() =>
                                        isTesting ? (
                                            <Text
                                                variant="labelSmall"
                                                style={{ color: theme.colors.primary, alignSelf: "center", marginRight: 8, maxWidth: 140, textAlign: "right" }}
                                            >
                                                {testingLabel ? `Probando ${testingLabel}…` : "Verificando…"}
                                            </Text>
                                        ) : null
                                    }
                                    onPress={() => !isDisabled && handleModelChange(model.id)}
                                    style={{ paddingHorizontal: 0, paddingVertical: 4, opacity: isDisabled && !isTesting ? 0.5 : 1 }}
                                />
                            );
                        })}
                    </RadioButton.Group>
                </Card.Content>
            </Card>

            {/* ── Apariencia ──────────────────────────────────────────────── */}
            <Card style={styles.card} mode="elevated" elevation={1}>
                <Card.Content style={styles.noPad}>
                    <Title
                        style={[
                            styles.sectionTitle,
                            { marginHorizontal: 16, marginTop: 16, color: theme.colors.onSurface },
                        ]}
                    >
                        Apariencia
                    </Title>
                    <List.Item
                        title="Modo oscuro"
                        description="Activa el tema oscuro en toda la aplicación"
                        left={props => (
                            <List.Icon
                                {...props}
                                icon={isDark ? "weather-night" : "weather-sunny"}
                                color={theme.colors.primary}
                            />
                        )}
                        right={() => (
                            <Switch
                                value={isDark}
                                onValueChange={handleToggleDarkMode}
                                color={theme.colors.primary}
                            />
                        )}
                    />
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 40 },
    card: { marginBottom: 16, borderRadius: 12 },
    sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
    description: { marginBottom: 12, lineHeight: 20 },
    statusRow: { marginBottom: 12 },
    statusText: { fontWeight: "bold" },
    input: { marginBottom: 12 },
    buttonRow: { flexDirection: "row", gap: 10 },
    flexBtn: { flex: 1, borderRadius: 8 },
    divider: { marginVertical: 12 },
    linkBtn: { alignSelf: "flex-start" },
    noPad: { paddingHorizontal: 0, paddingBottom: 8 },
});

export default SettingsScreen;
