import React, { useState, useCallback } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Linking,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import {
    Text,
    TextInput,
    Button,
    useTheme,
    SegmentedButtons,
    Checkbox,
    Divider,
    Icon,
} from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { register, login } from "../services/firesyncApi";
import { useDatabase } from "../context/DatabaseContext";

const PRIVACY_POLICY_URL = "https://tu-dominio.vercel.app/privacy"; // reemplazar con URL real

const FireSyncAuthScreen = ({ navigation, route }) => {
    const theme = useTheme();
    const { signIn } = useAuth();
    const { setSetting } = useDatabase();
    const showModal = useModal();

    const fromOnboarding = route?.params?.fromOnboarding ?? false;

    const [mode, setMode] = useState("register");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = useCallback(async () => {
        if (!email.trim() || !password) return;

        if (mode === "register") {
            if (password !== confirmPassword) {
                showModal({ type: "error", title: "Error", message: "Las contraseñas no coinciden." });
                return;
            }
            if (password.length < 8) {
                showModal({ type: "error", title: "Error", message: "La contraseña debe tener al menos 8 caracteres." });
                return;
            }
            if (!consent) {
                showModal({ type: "error", title: "Consentimiento requerido", message: "Debés aceptar la política de privacidad para crear una cuenta." });
                return;
            }
        }

        setLoading(true);
        try {
            const fn = mode === "register" ? register : login;
            const data = await fn(email.trim().toLowerCase(), password);
            signIn({ userId: data.userId, email: data.email });
            await setSetting("firesync_enabled", "true");
            showModal({
                type: "success",
                title: "FireSync activado",
                message: "Tus datos se sincronizarán automáticamente cuando haya conexión.",
            });
            if (fromOnboarding) {
                navigation.replace("Main");
            } else {
                navigation.goBack();
            }
        } catch (err) {
            showModal({
                type: "error",
                title: mode === "register" ? "Error al crear cuenta" : "Error al iniciar sesión",
                message: err.message,
            });
        } finally {
            setLoading(false);
        }
    }, [mode, email, password, confirmPassword, consent]);

    const styles = createStyles(theme);
    const canSubmit =
        email.trim().length > 0 &&
        password.length >= (mode === "register" ? 8 : 1) &&
        (mode === "login" || (confirmPassword === password && consent));

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Icon source="cloud-sync" size={48} color={theme.colors.primary} />
                    </View>
                    <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
                        FireSync
                    </Text>
                    <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Respaldo seguro en la nube. Tus datos se cifran en nuestros servidores antes de guardarse.
                    </Text>
                </View>

                {/* Tabs */}
                <SegmentedButtons
                    value={mode}
                    onValueChange={setMode}
                    buttons={[
                        { value: "register", label: "Crear cuenta" },
                        { value: "login", label: "Iniciar sesión" },
                    ]}
                    style={styles.tabs}
                />

                {/* Formulario */}
                <View style={styles.form}>
                    <TextInput
                        label="Correo electrónico"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        left={<TextInput.Icon icon="email" />}
                    />
                    <TextInput
                        label="Contraseña"
                        value={password}
                        onChangeText={setPassword}
                        mode="outlined"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        left={<TextInput.Icon icon="lock" />}
                        right={
                            <TextInput.Icon
                                icon={showPassword ? "eye-off" : "eye"}
                                onPress={() => setShowPassword((v) => !v)}
                            />
                        }
                    />
                    {mode === "register" && (
                        <TextInput
                            label="Confirmar contraseña"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            mode="outlined"
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            left={<TextInput.Icon icon="lock-check" />}
                        />
                    )}

                    {mode === "register" && (
                        <>
                            <Divider style={styles.divider} />
                            <View style={styles.consentRow}>
                                <Checkbox
                                    status={consent ? "checked" : "unchecked"}
                                    onPress={() => setConsent((v) => !v)}
                                    color={theme.colors.primary}
                                />
                                <Text
                                    variant="bodySmall"
                                    style={[styles.consentText, { color: theme.colors.onSurfaceVariant }]}
                                >
                                    Acepto que mis datos se almacenen cifrados en la nube de FireSync para hacer copias de seguridad.{" "}
                                    <Text
                                        variant="bodySmall"
                                        style={{ color: theme.colors.primary, textDecorationLine: "underline" }}
                                        onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
                                    >
                                        Política de privacidad
                                    </Text>
                                </Text>
                            </View>

                            <View style={[styles.rgpdNote, { backgroundColor: theme.colors.surfaceVariant }]}>
                                <Icon source="shield-check" size={16} color={theme.colors.primary} />
                                <Text variant="bodySmall" style={[styles.rgpdText, { color: theme.colors.onSurfaceVariant }]}>
                                    Tus datos están cifrados con AES-256. Podés exportarlos o eliminarlos en cualquier momento desde Configuración.
                                </Text>
                            </View>
                        </>
                    )}

                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading || !canSubmit}
                        style={styles.submitBtn}
                        contentStyle={styles.submitBtnContent}
                        icon="cloud-sync"
                    >
                        {mode === "register" ? "Crear cuenta y activar" : "Iniciar sesión"}
                    </Button>

                    {fromOnboarding && (
                        <Button
                            mode="text"
                            onPress={() => navigation.replace("Main")}
                            textColor={theme.colors.onSurfaceVariant}
                        >
                            Omitir por ahora
                        </Button>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const createStyles = (theme) =>
    StyleSheet.create({
        container: { padding: 24, paddingBottom: 48 },
        header: { alignItems: "center", marginBottom: 28, marginTop: 8 },
        iconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 16 },
        title: { fontWeight: "bold", marginBottom: 8 },
        subtitle: { textAlign: "center", lineHeight: 22 },
        tabs: { marginBottom: 20 },
        form: { gap: 12 },
        divider: { marginVertical: 4 },
        consentRow: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
        consentText: { flex: 1, lineHeight: 20, paddingTop: 6 },
        rgpdNote: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 8, alignItems: "flex-start" },
        rgpdText: { flex: 1, lineHeight: 18 },
        submitBtn: { marginTop: 8, borderRadius: 10 },
        submitBtnContent: { paddingVertical: 4 },
    });

export default FireSyncAuthScreen;
