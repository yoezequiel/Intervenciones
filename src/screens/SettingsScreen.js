import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Alert, Linking } from "react-native";
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
} from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";

const SettingsScreen = () => {
    const { getSetting, setSetting } = useDatabase();
    const theme = useTheme();

    const [apiKey, setApiKey] = useState(getSetting("gemini_api_key") || "");
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isDark, setIsDark] = useState(getSetting("dark_mode") === "true");

    const hasApiKey = !!getSetting("gemini_api_key");

    const handleSaveApiKey = useCallback(async () => {
        setSaving(true);
        try {
            await setSetting("gemini_api_key", apiKey.trim());
            Alert.alert("Guardado", "La API key fue guardada correctamente.");
        } catch (e) {
            Alert.alert("Error", "No se pudo guardar la API key.");
        } finally {
            setSaving(false);
        }
    }, [apiKey, setSetting]);

    const handleClearApiKey = useCallback(() => {
        Alert.alert(
            "Eliminar API Key",
            "¿Estás seguro? La generación de informes con IA pasará a modo local.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        await setSetting("gemini_api_key", "");
                        setApiKey("");
                    },
                },
            ]
        );
    }, [setSetting]);

    const handleToggleDarkMode = useCallback(
        async (value) => {
            setIsDark(value);
            try {
                await setSetting("dark_mode", value ? "true" : "false");
            } catch (e) {
                Alert.alert("Error", "No se pudo guardar la preferencia.");
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
                                style={[styles.statusText, { color: "#2E7D32" }]}
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
