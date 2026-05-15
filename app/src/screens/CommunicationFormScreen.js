import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import {
    View,
    StyleSheet,
    Pressable,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from "react-native";
import {
    TextInput,
    Button,
    IconButton,
    Text,
    Surface,
    Divider,
    useTheme,
} from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";
import { InterventionType, CommunicationStatus } from "../types";
import { useModal } from "../context/ModalContext";
import { useScrollToFocusedInput } from "../hooks/useScrollToFocusedInput";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
    { label: "Llamante" },
    { label: "Incidente" },
    { label: "Estado" },
];

const TYPE_OPTIONS = [
    { value: "", label: "Sin definir" },
    ...Object.values(InterventionType).map(v => ({ value: v, label: v })),
];

const TYPE_CONFIG = {
    "":                                  { icon: "help-circle-outline", color: "#757575" },
    [InterventionType.STRUCTURAL_FIRE]:  { icon: "fire",                color: "#d32f2f" },
    [InterventionType.FOREST_FIRE]:      { icon: "pine-tree-fire",      color: "#2e7d32" },
    [InterventionType.TRAFFIC_ACCIDENT]: { icon: "car-emergency",       color: "#e65100" },
    [InterventionType.RESCUE]:           { icon: "lifebuoy",            color: "#1565c0" },
    [InterventionType.FALSE_ALARM]:      { icon: "alarm-off",           color: "#757575" },
    [InterventionType.SPECIAL_SERVICE]:  { icon: "star-circle",         color: "#6a1b9a" },
    [InterventionType.OTHER]:            { icon: "dots-horizontal",     color: "#455a64" },
};

const STATUS_CONFIG = {
    [CommunicationStatus.RECEIVED]: {
        icon: "phone-incoming",
        color: "#FF8F00",
        label: "Recibido",
        description: "Pendiente de evaluación",
    },
    [CommunicationStatus.REPORTED]: {
        icon: "clipboard-check",
        color: "#1565C0",
        label: "Reportado",
        description: "Evaluado y reportado",
    },
    [CommunicationStatus.DISPATCHED]: {
        icon: "truck-fast",
        color: "#2E7D32",
        label: "Desplazado",
        description: "Unidades enviadas al lugar",
    },
    [CommunicationStatus.NO_DISPATCHED]: {
        icon: "truck-remove",
        color: "#b71c1c",
        label: "Sin desplazamiento",
        description: "No se enviaron unidades",
    },
};

const isValidTime = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

// ─── Sub-components ────────────────────────────────────────────────────────────

const StepProgress = memo(({ currentStep, onStepPress, theme }) => (
    <View style={{
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 8,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outlineVariant,
    }}>
        {STEPS.map((step, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
                <Pressable
                    key={i}
                    style={{ flex: 1, alignItems: "center" }}
                    onPress={() => onStepPress(i)}
                    android_ripple={{ color: theme.colors.primary + "22", borderless: true }}
                >
                    <View style={{
                        height: 4,
                        borderRadius: 2,
                        width: "100%",
                        backgroundColor: isDone || isActive
                            ? theme.colors.primary
                            : theme.colors.outlineVariant,
                        opacity: isDone ? 0.5 : 1,
                        marginBottom: 4,
                    }} />
                    <Text variant="labelSmall" style={{
                        color: isActive
                            ? theme.colors.primary
                            : isDone
                                ? theme.colors.outline
                                : theme.colors.onSurfaceVariant,
                        fontWeight: isActive ? "700" : "400",
                        fontSize: 10,
                        textAlign: "center",
                    }}>
                        {isDone ? "✓ " : `${i + 1}. `}{step.label}
                    </Text>
                </Pressable>
            );
        })}
    </View>
));

const TimeButton = memo(({ label, value, onChangeText, getCurrentTime, icon }) => {
    const theme = useTheme();
    const [touched, setTouched] = useState(false);
    const hasError = touched && !!value && !isValidTime(value);

    return (
        <View style={{ marginBottom: hasError ? 2 : 12 }}>
            <TextInput
                label={label}
                value={value}
                onChangeText={(t) => { onChangeText(t); if (t.length >= 5) setTouched(true); }}
                onBlur={() => setTouched(true)}
                placeholder="HH:MM"
                mode="outlined"
                error={hasError}
                left={<TextInput.Icon icon={icon} />}
                right={
                    <TextInput.Icon
                        icon="clock-check-outline"
                        onPress={() => { onChangeText(getCurrentTime()); setTouched(false); }}
                    />
                }
            />
            {hasError && (
                <Text variant="labelSmall" style={{ color: theme.colors.error, marginLeft: 4, marginTop: 2, marginBottom: 8 }}>
                    Formato inválido — usá HH:MM (ej: 14:30)
                </Text>
            )}
        </View>
    );
});

// ─── Main screen ───────────────────────────────────────────────────────────────

const CommunicationFormScreen = ({ navigation, route }) => {
    const { addCommunication, updateCommunication, getCommunication } = useDatabase();
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const showModal = useModal();

    const communicationId = route.params?.communicationId;
    const isEditing = !!communicationId;
    const existing = isEditing ? getCommunication(communicationId) : null;

    const getCurrentTime = useCallback(() => new Date().toTimeString().slice(0, 5), []);

    React.useLayoutEffect(() => {
        if (isEditing) navigation.setOptions({ title: "Editar Comunicación" });
    }, [navigation, isEditing]);

    // ── Wizard ──
    const [currentStep, setCurrentStep] = useState(0);
    const scrollRef = useRef(null);
    const [footerHeight, setFooterHeight] = useState(0);
    const scrollProps = useScrollToFocusedInput(scrollRef, footerHeight);

    useEffect(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [currentStep]);

    // ── Step 0: Llamante ──
    const [callerName, setCallerName] = useState(existing?.callerName || "");
    const [callerPhone, setCallerPhone] = useState(existing?.callerPhone || "");
    const [time, setTime] = useState(existing?.time || getCurrentTime());

    // ── Step 1: Incidente ──
    const [address, setAddress] = useState(existing?.address || "");
    const [incidentType, setIncidentType] = useState(existing?.incidentType || "");

    // ── Step 2: Estado + Notas ──
    const [status, setStatus] = useState(existing?.status || CommunicationStatus.RECEIVED);
    const [noDispatchReason, setNoDispatchReason] = useState(existing?.noDispatchReason || "");
    const [notes, setNotes] = useState(existing?.notes || "");

    const [loading, setLoading] = useState(false);

    // ── Dirty check ──
    const isDirtyRef = useRef(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        isDirtyRef.current = true;
    }, [callerName, callerPhone, time, address, incidentType, status, noDispatchReason, notes]);

    useEffect(() => {
        const unsubscribe = navigation.addListener("beforeRemove", (e) => {
            if (!isDirtyRef.current) return;
            e.preventDefault();
            showModal({
                type: "confirm",
                title: "Cambios sin guardar",
                message: "¿Salir sin guardar? Se perderán los cambios.",
                cancelLabel: "Seguir editando",
                confirmLabel: "Salir",
                confirmDestructive: true,
                dismissable: false,
                onConfirm: () => navigation.dispatch(e.data.action),
            });
        });
        return unsubscribe;
    }, [navigation]);

    // ── Submit ──
    const handleSubmit = useCallback(async () => {
        if (!callerName.trim() && !callerPhone.trim() && !address.trim()) {
            showModal({
                type: "warning",
                title: "Datos requeridos",
                message: "Completá al menos el nombre del llamante, teléfono o dirección.",
            });
            return;
        }
        setLoading(true);
        try {
            const data = {
                callerName: callerName.trim(),
                callerPhone: callerPhone.trim(),
                time,
                address: address.trim(),
                incidentType,
                status,
                noDispatchReason: status === CommunicationStatus.NO_DISPATCHED
                    ? noDispatchReason.trim()
                    : "",
                notes: notes.trim(),
            };
            isDirtyRef.current = false;
            if (isEditing) {
                await updateCommunication(communicationId, data);
                showModal({
                    type: "success",
                    title: "Actualizado",
                    message: "Comunicación actualizada correctamente.",
                    onConfirm: () => navigation.goBack(),
                });
            } else {
                await addCommunication(data);
                showModal({
                    type: "success",
                    title: "Registrado",
                    message: "Comunicación registrada correctamente.",
                    onConfirm: () => navigation.goBack(),
                });
            }
        } catch {
            showModal({
                type: "error",
                title: "Error",
                message: `No se pudo ${isEditing ? "actualizar" : "registrar"} la comunicación.`,
            });
        } finally {
            setLoading(false);
        }
    }, [
        callerName, callerPhone, time, address, incidentType,
        status, noDispatchReason, notes,
        isEditing, communicationId, addCommunication, updateCommunication, navigation,
    ]);

    // ── Step renderers ──────────────────────────────────────────────────────────

    const renderStep0 = () => (
        <View style={styles.stepContent}>
            <Text variant="titleMedium" style={styles.sectionLabel}>¿Quién llamó?</Text>
            <TextInput
                label="Nombre del llamante"
                value={callerName}
                onChangeText={setCallerName}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="account" />}
            />
            <TextInput
                label="Teléfono"
                value={callerPhone}
                onChangeText={setCallerPhone}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
                left={<TextInput.Icon icon="phone" />}
            />
            <Text variant="titleMedium" style={[styles.sectionLabel, { marginTop: 4 }]}>Hora del llamado</Text>
            <TimeButton
                label="Hora del llamado"
                value={time}
                onChangeText={setTime}
                getCurrentTime={getCurrentTime}
                icon="clock-outline"
            />
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <Text variant="titleMedium" style={styles.sectionLabel}>Dirección</Text>
            <TextInput
                label="Dirección o punto de referencia"
                value={address}
                onChangeText={setAddress}
                mode="outlined"
                multiline
                style={styles.input}
                left={<TextInput.Icon icon="map-marker" />}
            />
            <Text variant="titleMedium" style={[styles.sectionLabel, { marginTop: 4 }]}>Tipo de incidente</Text>
            <View style={styles.typeGrid}>
                {TYPE_OPTIONS.map(opt => {
                    const cfg = TYPE_CONFIG[opt.value] || { icon: "dots-horizontal", color: theme.colors.outline };
                    const isSelected = incidentType === opt.value;
                    return (
                        <Pressable
                            key={opt.value || "__none__"}
                            onPress={() => setIncidentType(opt.value)}
                            android_ripple={{ color: cfg.color + "33", borderless: false }}
                            style={[styles.typeCard, {
                                borderColor: isSelected ? cfg.color : theme.colors.outlineVariant,
                                backgroundColor: isSelected ? cfg.color + "18" : theme.colors.surface,
                            }]}
                        >
                            <IconButton
                                icon={cfg.icon}
                                iconColor={isSelected ? cfg.color : theme.colors.onSurfaceVariant}
                                size={28}
                                style={{ margin: 0 }}
                            />
                            <Text
                                variant="labelMedium"
                                numberOfLines={2}
                                style={{
                                    color: isSelected ? cfg.color : theme.colors.onSurface,
                                    textAlign: "center",
                                    fontWeight: isSelected ? "700" : "400",
                                    marginTop: 2,
                                    paddingHorizontal: 4,
                                    lineHeight: 16,
                                }}
                            >
                                {opt.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContent}>
            <Text variant="titleMedium" style={styles.sectionLabel}>Estado de la comunicación</Text>
            <View style={styles.statusList}>
                {Object.entries(STATUS_CONFIG).map(([value, cfg]) => {
                    const isSelected = status === value;
                    return (
                        <Pressable
                            key={value}
                            onPress={() => setStatus(value)}
                            android_ripple={{ color: cfg.color + "33", borderless: false }}
                            style={[styles.statusCard, {
                                borderColor: isSelected ? cfg.color : theme.colors.outlineVariant,
                                backgroundColor: isSelected ? cfg.color + "18" : theme.colors.surface,
                            }]}
                        >
                            <IconButton
                                icon={cfg.icon}
                                iconColor={isSelected ? cfg.color : theme.colors.onSurfaceVariant}
                                size={28}
                                style={{ margin: 0, marginRight: 4 }}
                            />
                            <View style={{ flex: 1 }}>
                                <Text
                                    variant="labelLarge"
                                    style={{
                                        color: isSelected ? cfg.color : theme.colors.onSurface,
                                        fontWeight: isSelected ? "700" : "600",
                                    }}
                                >
                                    {cfg.label}
                                </Text>
                                <Text
                                    variant="bodySmall"
                                    style={{
                                        color: isSelected ? cfg.color + "bb" : theme.colors.onSurfaceVariant,
                                        marginTop: 2,
                                    }}
                                >
                                    {cfg.description}
                                </Text>
                            </View>
                            {isSelected && (
                                <IconButton
                                    icon="check-circle"
                                    iconColor={cfg.color}
                                    size={20}
                                    style={{ margin: 0 }}
                                />
                            )}
                        </Pressable>
                    );
                })}
            </View>

            {status === CommunicationStatus.NO_DISPATCHED && (
                <View style={[styles.reasonCard, { borderColor: STATUS_CONFIG[CommunicationStatus.NO_DISPATCHED].color }]}>
                    <Text variant="titleSmall" style={[styles.reasonTitle, { color: STATUS_CONFIG[CommunicationStatus.NO_DISPATCHED].color }]}>
                        Motivo del no desplazamiento
                    </Text>
                    <TextInput
                        label="Aclarar motivo..."
                        value={noDispatchReason}
                        onChangeText={setNoDispatchReason}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={[styles.input, { marginBottom: 0 }]}
                        left={<TextInput.Icon icon="text-box-outline" />}
                    />
                </View>
            )}

            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={styles.sectionLabel}>Observaciones</Text>
            <TextInput
                label="Notas adicionales"
                value={notes}
                onChangeText={setNotes}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.input}
            />
        </View>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0: return renderStep0();
            case 1: return renderStep1();
            case 2: return renderStep2();
            default: return null;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StepProgress currentStep={currentStep} onStepPress={setCurrentStep} theme={theme} />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "padding"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
                style={{ flex: 1 }}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets
                    showsVerticalScrollIndicator
                    {...scrollProps}
                >
                    {renderCurrentStep()}
                </ScrollView>

                <Surface style={styles.footer} elevation={4} onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
                    <View style={styles.footerRow}>
                        <Button
                            mode="outlined"
                            onPress={() => setCurrentStep(s => s - 1)}
                            disabled={currentStep === 0}
                            icon="chevron-left"
                            style={[styles.navButton, { opacity: currentStep === 0 ? 0 : 1 }]}
                        >
                            Anterior
                        </Button>
                        {currentStep < STEPS.length - 1 ? (
                            <Button
                                mode="contained"
                                onPress={() => setCurrentStep(s => s + 1)}
                                icon="chevron-right"
                                contentStyle={{ flexDirection: "row-reverse" }}
                                style={styles.navButton}
                            >
                                Siguiente
                            </Button>
                        ) : (
                            <Button
                                mode="contained"
                                onPress={handleSubmit}
                                loading={loading}
                                disabled={loading}
                                icon="content-save"
                                style={styles.navButton}
                            >
                                {isEditing ? "Actualizar" : "Guardar"}
                            </Button>
                        )}
                    </View>
                </Surface>
            </KeyboardAvoidingView>
        </View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollViewContent: { flexGrow: 1, paddingBottom: 24 },
    stepContent: { padding: 16 },
    sectionLabel: { marginBottom: 12, fontWeight: "600" },
    input: { marginBottom: 12, backgroundColor: theme.colors.surface },
    typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
    typeCard: {
        width: "47%",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1.5,
        minHeight: 86,
    },
    statusList: { gap: 10, marginBottom: 8 },
    statusCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    reasonCard: {
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        marginBottom: 4,
        backgroundColor: theme.colors.surface,
    },
    reasonTitle: { fontWeight: "600", marginBottom: 12 },
    divider: { marginVertical: 16 },
    footer: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    footerRow: {
        flexDirection: "row",
        gap: 12,
        justifyContent: "space-between",
    },
    navButton: { flex: 1, borderRadius: 8 },
});

export default CommunicationFormScreen;
