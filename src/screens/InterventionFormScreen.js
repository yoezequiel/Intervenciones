import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import {
    View,
    StyleSheet,
    Pressable,
    AppState,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
    TextInput,
    Button,
    Chip,
    IconButton,
    Text,
    Menu,
    Divider,
    SegmentedButtons,
    useTheme,
    Surface,
} from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";
import { InterventionType } from "../types";
import MultimediaSection from "../components/MultimediaSection";
import { useModal } from "../context/ModalContext";
import * as Location from "expo-location";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
    { label: "Incidente" },
    { label: "Lugar" },
    { label: "Personas" },
    { label: "Notas" },
];

const ENVIRONMENT_PRESETS = [
    "Cocina", "Living", "Comedor", "Dormitorio", "Baño",
    "Garage", "Depósito", "Pasillo", "Escalera", "Sótano",
    "Terraza", "Oficina", "Local",
];

const SERVICE_TYPES = [
    "Policía", "Ambulancia", "Grúa", "Electricidad",
    "Gas", "Bomberos de otro cuartel", "Otro",
];

const GENDER_OPTIONS = [
    { value: "Masculino", label: "Masculino" },
    { value: "Femenino", label: "Femenino" },
    { value: "Otro", label: "Otro" },
];

const SURFACE_UNITS = [
    { value: "ha", label: "ha" },
    { value: "m²", label: "m²" },
];

const TYPE_OPTIONS = Object.values(InterventionType).map(value => ({ value, label: value }));

const TYPE_CONFIG = {
    [InterventionType.STRUCTURAL_FIRE]:  { icon: "fire",             color: "#d32f2f" },
    [InterventionType.FOREST_FIRE]:      { icon: "pine-tree-fire",   color: "#2e7d32" },
    [InterventionType.TRAFFIC_ACCIDENT]: { icon: "car-emergency",    color: "#e65100" },
    [InterventionType.RESCUE]:           { icon: "lifebuoy",         color: "#1565c0" },
    [InterventionType.FALSE_ALARM]:      { icon: "alarm-off",        color: "#757575" },
    [InterventionType.SPECIAL_SERVICE]:  { icon: "star-circle",      color: "#6a1b9a" },
    [InterventionType.OTHER]:            { icon: "dots-horizontal",  color: "#455a64" },
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

const itemStyles = StyleSheet.create({
    personItem: { flexDirection: "row", alignItems: "center", padding: 12, marginBottom: 12, borderRadius: 12 },
    personIcon: { marginRight: 8 },
    personInfo: { flex: 1 },
    itemActions: { flexDirection: "row", alignItems: "center" },
});

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

const ServiceItem = memo(({ service, index, onRemove, onEdit }) => {
    const theme = useTheme();
    return (
        <Surface style={[itemStyles.personItem, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={itemStyles.personIcon}>
                <IconButton icon="account-hard-hat" size={24} iconColor={theme.colors.primary} />
            </View>
            <View style={itemStyles.personInfo}>
                <Text variant="titleMedium">{service.type}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    IDs: {service.ids || "N/A"} • Personal: {service.personnel || "N/A"}
                </Text>
            </View>
            <View style={itemStyles.itemActions}>
                <IconButton icon="pencil" size={20} onPress={() => onEdit(index)} />
                <IconButton icon="delete" size={20} iconColor={theme.colors.error} onPress={() => onRemove(index)} />
            </View>
        </Surface>
    );
});

const VictimItem = memo(({ victim, index, onRemove, onEdit, showPlate }) => {
    const theme = useTheme();
    return (
        <Surface style={[itemStyles.personItem, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={itemStyles.personIcon}>
                <IconButton icon="account-injury" size={24} iconColor={theme.colors.error} />
            </View>
            <View style={itemStyles.personInfo}>
                <Text variant="titleMedium">{victim.name || "Sin nombre"}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    {[victim.age ? `${victim.age} años` : null, victim.gender].filter(Boolean).join(" • ")}
                </Text>
                {victim.dni && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        DNI: {victim.dni}
                    </Text>
                )}
                {showPlate && victim.plate ? (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Patente: {victim.plate}
                    </Text>
                ) : null}
                {victim.description ? (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic", marginTop: 4 }}>
                        "{victim.description}"
                    </Text>
                ) : null}
            </View>
            <View style={itemStyles.itemActions}>
                <IconButton icon="pencil" size={20} onPress={() => onEdit(index)} />
                <IconButton icon="delete" size={20} iconColor={theme.colors.error} onPress={() => onRemove(index)} />
            </View>
        </Surface>
    );
});

const WitnessItem = memo(({ witness, index, onRemove, onEdit }) => {
    const theme = useTheme();
    return (
        <Surface style={[itemStyles.personItem, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={itemStyles.personIcon}>
                <IconButton icon="account-eye" size={24} iconColor={theme.colors.outline} />
            </View>
            <View style={itemStyles.personInfo}>
                <Text variant="titleMedium">{witness.name || "Sin nombre"}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    {[witness.age ? `${witness.age} años` : null, witness.gender].filter(Boolean).join(" • ")}
                </Text>
                {witness.dni && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        DNI: {witness.dni}
                    </Text>
                )}
                {witness.description ? (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic", marginTop: 4 }}>
                        "{witness.description}"
                    </Text>
                ) : null}
            </View>
            <View style={itemStyles.itemActions}>
                <IconButton icon="pencil" size={20} onPress={() => onEdit(index)} />
                <IconButton icon="delete" size={20} iconColor={theme.colors.error} onPress={() => onRemove(index)} />
            </View>
        </Surface>
    );
});

// ─── Main screen ───────────────────────────────────────────────────────────────

const InterventionFormScreen = ({ navigation, route }) => {
    const { addIntervention, updateIntervention, getIntervention, updateCommunication, setSetting } = useDatabase();
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const showModal = useModal();

    const interventionId = route.params?.interventionId;
    const communicationId = route.params?.communicationId;
    const prefill = route.params?.prefill;
    const isEditing = !!interventionId;
    const existing = isEditing ? getIntervention(interventionId) : null;
    const draft = !isEditing && !communicationId ? (route.params?.draft ?? null) : null;

    React.useLayoutEffect(() => {
        if (communicationId) {
            navigation.setOptions({ title: "Nueva Intervención" });
        } else if (isEditing) {
            navigation.setOptions({ title: "Editar Intervención" });
        }
    }, [navigation, communicationId, isEditing]);

    // ── Wizard ──
    const [currentStep, setCurrentStep] = useState(draft?.currentStep ?? 0);
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollToPosition(0, 0, false);
        saveDraftRef.current?.();
    }, [currentStep]);

    // ── Step 0: Tipo + campos condicionales ──
    const [type, setType] = useState(existing?.type || draft?.type || prefill?.type || InterventionType.OTHER);

    const parseSurface = (s) => {
        const parts = (s || "").split(" ");
        return { value: parts[0] || "", unit: parts[1] === "m²" ? "m²" : "ha" };
    };
    const parsedSurface = parseSurface(existing?.affectedSurface);
    const [affectedSurface, setAffectedSurface] = useState(draft?.affectedSurface ?? parsedSurface.value);
    const [surfaceUnit, setSurfaceUnit] = useState(draft?.surfaceUnit ?? parsedSurface.unit);
    const [affectedEnvironments, setAffectedEnvironments] = useState(draft?.affectedEnvironments ?? existing?.affectedEnvironments ?? []);
    const [newEnvironment, setNewEnvironment] = useState("");

    // ── Step 1: Lugar + horarios ──
    const [address, setAddress] = useState(existing?.address || draft?.address || prefill?.address || "");
    const [latitude, setLatitude] = useState(existing?.latitude ?? draft?.latitude ?? null);
    const [longitude, setLongitude] = useState(existing?.longitude ?? draft?.longitude ?? null);
    const [callTime, setCallTime] = useState(existing?.callTime || draft?.callTime || prefill?.callTime || "");
    const [departureTime, setDepartureTime] = useState(existing?.departureTime || draft?.departureTime || "");
    const [returnTime, setReturnTime] = useState(existing?.returnTime || draft?.returnTime || "");
    const [locationLoading, setLocationLoading] = useState(false);

    // ── Step 2: Personas ──
    const [otherServices, setOtherServices] = useState(existing?.otherServices ?? draft?.otherServices ?? []);
    const [newServiceType, setNewServiceType] = useState("Policía");
    const [newServiceIds, setNewServiceIds] = useState("");
    const [newServicePersonnel, setNewServicePersonnel] = useState("");
    const [serviceMenuVisible, setServiceMenuVisible] = useState(false);
    const [editingServiceIndex, setEditingServiceIndex] = useState(null);

    const [witnesses, setWitnesses] = useState(existing?.witnesses ?? draft?.witnesses ?? []);
    const [newWitness, setNewWitness] = useState({ name: "", age: "", dni: "", gender: "", description: "" });
    const [editingWitnessIndex, setEditingWitnessIndex] = useState(null);

    const [victims, setVictims] = useState(existing?.victims ?? draft?.victims ?? []);
    const [newVictim, setNewVictim] = useState({ name: "", age: "", dni: "", gender: "", description: "", plate: "" });
    const [editingVictimIndex, setEditingVictimIndex] = useState(null);

    // ── Step 3: Notas + media ──
    const [fieldNotes, setFieldNotes] = useState(existing?.fieldNotes ?? draft?.fieldNotes ?? "");
    const [photos, setPhotos] = useState(existing?.photos ?? draft?.photos ?? []);

    const [loading, setLoading] = useState(false);

    // ── Dirty check ──
    const isDirtyRef = useRef(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        isDirtyRef.current = true;
    }, [type, affectedSurface, affectedEnvironments, address, callTime, departureTime, returnTime, fieldNotes, otherServices, witnesses, victims, photos]);

    useEffect(() => {
        const unsubscribe = navigation.addListener("beforeRemove", (e) => {
            if (!isDirtyRef.current) return;
            e.preventDefault();
            saveDraftRef.current?.();
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

    // ── Draft auto-save ──
    const saveDraftRef = useRef(null);
    saveDraftRef.current = () => {
        if (!isDirtyRef.current || isEditing) return;
        setSetting("intervention_draft", JSON.stringify({
            type, affectedSurface, surfaceUnit, affectedEnvironments,
            address, latitude, longitude,
            callTime, departureTime, returnTime,
            otherServices, witnesses, victims,
            fieldNotes, photos, currentStep,
            savedAt: new Date().toISOString(),
        })).catch(() => {});
    };

    useEffect(() => {
        if (isEditing) return;
        const sub = AppState.addEventListener("change", (state) => {
            if (state === "background" || state === "inactive") {
                saveDraftRef.current?.();
            }
        });
        return () => sub.remove();
    }, [isEditing]);

    const getCurrentTime = useCallback(() => new Date().toTimeString().slice(0, 5), []);

    // ── Location ──
    const handleGetCurrentLocation = useCallback(async () => {
        setLocationLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                showModal({ type: "warning", title: "Permiso denegado", message: "Se necesita permiso de ubicación para obtener la dirección actual." });
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            setLatitude(loc.coords.latitude);
            setLongitude(loc.coords.longitude);
            if (geo.length > 0) {
                const { street, streetNumber, city, region } = geo[0];
                const parts = [street, streetNumber, city, region].filter(Boolean);
                setAddress(parts.join(", ") || `${loc.coords.latitude}, ${loc.coords.longitude}`);
            } else {
                setAddress(`${loc.coords.latitude}, ${loc.coords.longitude}`);
            }
        } catch {
            showModal({ type: "error", title: "Error", message: "No se pudo obtener la ubicación actual." });
        } finally {
            setLocationLoading(false);
        }
    }, []);

    // ── Environments ──
    const toggleEnvironment = useCallback((env) => {
        setAffectedEnvironments(prev =>
            prev.includes(env) ? prev.filter(e => e !== env) : [...prev, env]
        );
    }, []);

    const addCustomEnvironment = useCallback(() => {
        const trimmed = newEnvironment.trim();
        if (trimmed && !affectedEnvironments.includes(trimmed)) {
            setAffectedEnvironments(prev => [...prev, trimmed]);
        }
        setNewEnvironment("");
    }, [newEnvironment, affectedEnvironments]);

    // ── Services ──
    const addService = useCallback(() => {
        if (!newServiceType.trim()) return;
        const s = { type: newServiceType, ids: newServiceIds, personnel: newServicePersonnel };
        if (editingServiceIndex !== null) {
            setOtherServices(prev => prev.map((x, i) => i === editingServiceIndex ? s : x));
            setEditingServiceIndex(null);
        } else {
            setOtherServices(prev => [...prev, s]);
        }
        setNewServiceIds("");
        setNewServicePersonnel("");
    }, [newServiceType, newServiceIds, newServicePersonnel, editingServiceIndex]);

    const editService = useCallback((index) => {
        const s = otherServices[index];
        setNewServiceType(s.type);
        setNewServiceIds(s.ids);
        setNewServicePersonnel(s.personnel);
        setEditingServiceIndex(index);
    }, [otherServices]);

    const cancelEditService = useCallback(() => {
        setNewServiceType("Policía");
        setNewServiceIds("");
        setNewServicePersonnel("");
        setEditingServiceIndex(null);
    }, []);

    const removeService = useCallback((index) => {
        setOtherServices(prev => prev.filter((_, i) => i !== index));
        if (editingServiceIndex === index) cancelEditService();
    }, [editingServiceIndex, cancelEditService]);

    // ── Witnesses ──
    const addWitness = useCallback(() => {
        if (!newWitness.name.trim() && !newWitness.dni.trim()) return;
        const w = {
            name: newWitness.name.trim(),
            age: newWitness.age.trim(),
            dni: newWitness.dni.trim(),
            gender: newWitness.gender,
            description: newWitness.description.trim(),
        };
        if (editingWitnessIndex !== null) {
            setWitnesses(prev => prev.map((x, i) => i === editingWitnessIndex ? w : x));
            setEditingWitnessIndex(null);
        } else {
            setWitnesses(prev => [...prev, w]);
        }
        setNewWitness({ name: "", age: "", dni: "", gender: "", description: "" });
    }, [newWitness, editingWitnessIndex]);

    const editWitness = useCallback((index) => {
        const w = witnesses[index];
        setNewWitness({ name: w.name || "", age: w.age || "", dni: w.dni || "", gender: w.gender || "", description: w.description || "" });
        setEditingWitnessIndex(index);
    }, [witnesses]);

    const cancelEditWitness = useCallback(() => {
        setNewWitness({ name: "", age: "", dni: "", gender: "", description: "" });
        setEditingWitnessIndex(null);
    }, []);

    const removeWitness = useCallback((index) => {
        setWitnesses(prev => prev.filter((_, i) => i !== index));
        if (editingWitnessIndex === index) cancelEditWitness();
    }, [editingWitnessIndex, cancelEditWitness]);

    // ── Victims ──
    const addVictim = useCallback(() => {
        if (!newVictim.name.trim() && !newVictim.dni.trim()) return;
        const v = {
            name: newVictim.name.trim(),
            age: newVictim.age.trim(),
            dni: newVictim.dni.trim(),
            gender: newVictim.gender,
            description: newVictim.description.trim(),
            plate: newVictim.plate.trim(),
        };
        if (editingVictimIndex !== null) {
            setVictims(prev => prev.map((x, i) => i === editingVictimIndex ? v : x));
            setEditingVictimIndex(null);
        } else {
            setVictims(prev => [...prev, v]);
        }
        setNewVictim({ name: "", age: "", dni: "", gender: "", description: "", plate: "" });
    }, [newVictim, editingVictimIndex]);

    const editVictim = useCallback((index) => {
        const v = victims[index];
        setNewVictim({ name: v.name || "", age: v.age || "", dni: v.dni || "", gender: v.gender || "", description: v.description || "", plate: v.plate || "" });
        setEditingVictimIndex(index);
    }, [victims]);

    const cancelEditVictim = useCallback(() => {
        setNewVictim({ name: "", age: "", dni: "", gender: "", description: "", plate: "" });
        setEditingVictimIndex(null);
    }, []);

    const removeVictim = useCallback((index) => {
        setVictims(prev => prev.filter((_, i) => i !== index));
        if (editingVictimIndex === index) cancelEditVictim();
    }, [editingVictimIndex, cancelEditVictim]);

    // ── Submit ──
    const handleSubmit = useCallback(async () => {
        setLoading(true);
        try {
            const affectedSurfaceStr = affectedSurface.trim()
                ? `${affectedSurface.trim()} ${surfaceUnit}`
                : "";

            const interventionData = {
                callTime, departureTime, returnTime, address, type,
                affectedSurface: affectedSurfaceStr,
                affectedEnvironments,
                otherServices, witnesses, victims, fieldNotes,
                audioNotes: existing?.audioNotes || [],
                sketches: existing?.sketches || [],
                photos,
                communicationId: communicationId || existing?.communicationId || null,
                latitude: latitude ?? null,
                longitude: longitude ?? null,
            };

            isDirtyRef.current = false;

            if (isEditing) {
                await updateIntervention(interventionId, interventionData);
                showModal({
                    type: "success",
                    title: "Actualizado",
                    message: "Intervención actualizada correctamente.",
                    onConfirm: () => navigation.goBack(),
                });
            } else {
                const newId = await addIntervention(interventionData);
                await setSetting("intervention_draft", "").catch(() => {});
                if (communicationId) {
                    await updateCommunication(communicationId, { status: "desplazamiento", interventionId: newId });
                    showModal({
                        type: "success",
                        title: "Creado",
                        message: "Intervención creada y comunicación vinculada.",
                        onConfirm: () => navigation.replace("InterventionDetail", { id: newId }),
                    });
                } else {
                    showModal({
                        type: "success",
                        title: "Guardado",
                        message: "Intervención guardada correctamente.",
                        onConfirm: () => navigation.goBack(),
                    });
                }
            }
        } catch {
            showModal({
                type: "error",
                title: "Error",
                message: `No se pudo ${isEditing ? "actualizar" : "guardar"} la intervención.`,
            });
        } finally {
            setLoading(false);
        }
    }, [
        addIntervention, updateIntervention, updateCommunication,
        isEditing, interventionId, communicationId, existing,
        type, affectedSurface, surfaceUnit, affectedEnvironments,
        callTime, departureTime, returnTime, address, latitude, longitude,
        otherServices, witnesses, victims, fieldNotes, photos, navigation,
    ]);

    // ── Step renderers ──────────────────────────────────────────────────────────

    const renderStep0 = () => (
        <View style={styles.stepContent}>
            <Text variant="titleMedium" style={styles.sectionLabel}>¿Qué tipo de incidente es?</Text>
            <View style={styles.typeGrid}>
                {TYPE_OPTIONS.map(opt => {
                    const cfg = TYPE_CONFIG[opt.value] || { icon: "dots-horizontal", color: theme.colors.outline };
                    const isSelected = type === opt.value;
                    return (
                        <Pressable
                            key={opt.value}
                            onPress={() => setType(opt.value)}
                            android_ripple={{ color: cfg.color + "33", borderless: false }}
                            style={[styles.typeCard, {
                                borderColor: isSelected ? cfg.color : theme.colors.outlineVariant,
                                backgroundColor: isSelected ? cfg.color + "18" : theme.colors.surface,
                            }]}
                        >
                            <IconButton
                                icon={cfg.icon}
                                iconColor={isSelected ? cfg.color : theme.colors.onSurfaceVariant}
                                size={30}
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

            {type === InterventionType.FOREST_FIRE && (
                <View style={[styles.conditionalCard, { borderColor: TYPE_CONFIG[InterventionType.FOREST_FIRE].color }]}>
                    <Text variant="titleSmall" style={[styles.conditionalTitle, { color: TYPE_CONFIG[InterventionType.FOREST_FIRE].color }]}>
                        Superficie afectada
                    </Text>
                    <TextInput
                        label="Cantidad"
                        value={affectedSurface}
                        onChangeText={setAffectedSurface}
                        keyboardType="decimal-pad"
                        mode="outlined"
                        style={styles.input}
                        left={<TextInput.Icon icon="pine-tree-fire" />}
                    />
                    <SegmentedButtons
                        value={surfaceUnit}
                        onValueChange={setSurfaceUnit}
                        buttons={SURFACE_UNITS}
                    />
                </View>
            )}

            {type === InterventionType.STRUCTURAL_FIRE && (
                <View style={[styles.conditionalCard, { borderColor: TYPE_CONFIG[InterventionType.STRUCTURAL_FIRE].color }]}>
                    <Text variant="titleSmall" style={[styles.conditionalTitle, { color: TYPE_CONFIG[InterventionType.STRUCTURAL_FIRE].color }]}>
                        Ambientes afectados
                    </Text>
                    <View style={styles.chipGrid}>
                        {ENVIRONMENT_PRESETS.map(env => (
                            <Chip
                                key={env}
                                mode={affectedEnvironments.includes(env) ? "flat" : "outlined"}
                                selected={affectedEnvironments.includes(env)}
                                showSelectedOverlay
                                onPress={() => toggleEnvironment(env)}
                                style={styles.envChip}
                                compact
                            >
                                {env}
                            </Chip>
                        ))}
                    </View>
                    <View style={[styles.row, { marginTop: 8 }]}>
                        <TextInput
                            label="Otro ambiente…"
                            value={newEnvironment}
                            onChangeText={setNewEnvironment}
                            mode="outlined"
                            style={[styles.input, { flex: 1, marginRight: 4, marginBottom: 0 }]}
                            onSubmitEditing={addCustomEnvironment}
                            returnKeyType="done"
                        />
                        <IconButton
                            icon="plus-circle"
                            onPress={addCustomEnvironment}
                            iconColor={theme.colors.error}
                            size={28}
                        />
                    </View>
                    {affectedEnvironments.filter(e => !ENVIRONMENT_PRESETS.includes(e)).length > 0 && (
                        <View style={[styles.chipGrid, { marginTop: 4 }]}>
                            {affectedEnvironments
                                .filter(e => !ENVIRONMENT_PRESETS.includes(e))
                                .map(env => (
                                    <Chip
                                        key={env}
                                        mode="flat"
                                        selected
                                        onClose={() => toggleEnvironment(env)}
                                        style={styles.envChip}
                                        compact
                                    >
                                        {env}
                                    </Chip>
                                ))}
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <Text variant="titleMedium" style={styles.sectionLabel}>Dirección</Text>
            <TextInput
                label="Dirección o punto de referencia"
                value={address}
                onChangeText={(text) => { setAddress(text); setLatitude(null); setLongitude(null); }}
                mode="outlined"
                multiline
                style={styles.input}
                left={
                    <TextInput.Icon
                        icon={locationLoading ? "loading" : "map-marker"}
                        onPress={handleGetCurrentLocation}
                        disabled={locationLoading}
                        color={locationLoading ? theme.colors.primary : theme.colors.error}
                    />
                }
                right={latitude != null ? (
                    <TextInput.Icon icon="crosshairs-gps" color={theme.colors.primary} disabled />
                ) : null}
            />
            {latitude != null && (
                <Text variant="labelSmall" style={{ color: theme.colors.primary, marginTop: -8, marginBottom: 12 }}>
                    GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </Text>
            )}

            <Text variant="titleMedium" style={[styles.sectionLabel, { marginTop: 8 }]}>Horarios</Text>
            <TimeButton label="Hora del llamado" value={callTime} onChangeText={setCallTime} getCurrentTime={getCurrentTime} icon="phone-incoming" />
            <TimeButton label="Hora de salida" value={departureTime} onChangeText={setDepartureTime} getCurrentTime={getCurrentTime} icon="truck-fast" />
            <TimeButton label="Hora de regreso" value={returnTime} onChangeText={setReturnTime} getCurrentTime={getCurrentTime} icon="home-import-outline" />
        </View>
    );

    const renderStep2 = () => {
        const isAccident = type === InterventionType.TRAFFIC_ACCIDENT;
        return (
            <View style={styles.stepContent}>

                {/* ── Víctimas ── */}
                <Text variant="titleMedium" style={styles.sectionLabel}>Víctimas</Text>
                <View style={styles.personForm}>
                    <TextInput
                        label="Nombre"
                        value={newVictim.name}
                        onChangeText={t => setNewVictim(p => ({ ...p, name: t }))}
                        mode="outlined"
                        style={styles.input}
                        left={<TextInput.Icon icon="account" />}
                    />
                    <View style={styles.row}>
                        <TextInput
                            label="Edad"
                            value={newVictim.age}
                            onChangeText={t => setNewVictim(p => ({ ...p, age: t }))}
                            mode="outlined"
                            keyboardType="numeric"
                            style={[styles.input, { flex: 1, marginRight: 8 }]}
                        />
                        <TextInput
                            label="DNI"
                            value={newVictim.dni}
                            onChangeText={t => setNewVictim(p => ({ ...p, dni: t }))}
                            mode="outlined"
                            keyboardType="numeric"
                            style={[styles.input, { flex: 2 }]}
                            left={<TextInput.Icon icon="card-account-details" />}
                        />
                    </View>
                    <SegmentedButtons
                        value={newVictim.gender}
                        onValueChange={v => setNewVictim(p => ({ ...p, gender: v }))}
                        buttons={GENDER_OPTIONS}
                        style={styles.input}
                    />
                    {isAccident && (
                        <TextInput
                            label="Patente del vehículo"
                            value={newVictim.plate}
                            onChangeText={t => setNewVictim(p => ({ ...p, plate: t.toUpperCase() }))}
                            mode="outlined"
                            style={styles.input}
                            autoCapitalize="characters"
                            left={<TextInput.Icon icon="car" />}
                        />
                    )}
                    <TextInput
                        label="Lesiones / descripción"
                        value={newVictim.description}
                        onChangeText={t => setNewVictim(p => ({ ...p, description: t }))}
                        mode="outlined"
                        multiline
                        numberOfLines={2}
                        style={styles.input}
                        left={<TextInput.Icon icon="hospital-box" />}
                    />
                    <View style={styles.buttonRow}>
                        <Button
                            mode={editingVictimIndex !== null ? "contained" : "contained-tonal"}
                            onPress={addVictim}
                            icon={editingVictimIndex !== null ? "check" : "plus"}
                            style={styles.actionButton}
                        >
                            {editingVictimIndex !== null ? "Actualizar" : "Agregar víctima"}
                        </Button>
                        {editingVictimIndex !== null && (
                            <Button mode="outlined" onPress={cancelEditVictim} icon="close" style={styles.actionButton}>
                                Cancelar
                            </Button>
                        )}
                    </View>
                </View>
                {victims.length > 0 && (
                    <View>
                        <Divider style={styles.divider} />
                        <Text variant="titleSmall" style={styles.listTitle}>
                            Registradas ({victims.length})
                        </Text>
                        {victims.map((v, i) => (
                            <VictimItem key={i} victim={v} index={i} onRemove={removeVictim} onEdit={editVictim} showPlate={isAccident} />
                        ))}
                    </View>
                )}

                <Divider style={[styles.divider, { marginTop: 8 }]} />

                {/* ── Testigos ── */}
                <Text variant="titleMedium" style={[styles.sectionLabel, { marginTop: 8 }]}>Testigos</Text>
                <View style={styles.personForm}>
                    <TextInput
                        label="Nombre"
                        value={newWitness.name}
                        onChangeText={t => setNewWitness(p => ({ ...p, name: t }))}
                        mode="outlined"
                        style={styles.input}
                        left={<TextInput.Icon icon="account" />}
                    />
                    <View style={styles.row}>
                        <TextInput
                            label="Edad"
                            value={newWitness.age}
                            onChangeText={t => setNewWitness(p => ({ ...p, age: t }))}
                            mode="outlined"
                            keyboardType="numeric"
                            style={[styles.input, { flex: 1, marginRight: 8 }]}
                        />
                        <TextInput
                            label="DNI"
                            value={newWitness.dni}
                            onChangeText={t => setNewWitness(p => ({ ...p, dni: t }))}
                            mode="outlined"
                            keyboardType="numeric"
                            style={[styles.input, { flex: 2 }]}
                            left={<TextInput.Icon icon="card-account-details" />}
                        />
                    </View>
                    <SegmentedButtons
                        value={newWitness.gender}
                        onValueChange={v => setNewWitness(p => ({ ...p, gender: v }))}
                        buttons={GENDER_OPTIONS}
                        style={styles.input}
                    />
                    <TextInput
                        label="Descripción (opcional)"
                        value={newWitness.description}
                        onChangeText={t => setNewWitness(p => ({ ...p, description: t }))}
                        mode="outlined"
                        multiline
                        numberOfLines={2}
                        style={styles.input}
                    />
                    <View style={styles.buttonRow}>
                        <Button
                            mode={editingWitnessIndex !== null ? "contained" : "contained-tonal"}
                            onPress={addWitness}
                            icon={editingWitnessIndex !== null ? "check" : "plus"}
                            style={styles.actionButton}
                        >
                            {editingWitnessIndex !== null ? "Actualizar" : "Agregar testigo"}
                        </Button>
                        {editingWitnessIndex !== null && (
                            <Button mode="outlined" onPress={cancelEditWitness} icon="close" style={styles.actionButton}>
                                Cancelar
                            </Button>
                        )}
                    </View>
                </View>
                {witnesses.length > 0 && (
                    <View>
                        <Divider style={styles.divider} />
                        <Text variant="titleSmall" style={styles.listTitle}>
                            Registrados ({witnesses.length})
                        </Text>
                        {witnesses.map((w, i) => (
                            <WitnessItem key={i} witness={w} index={i} onRemove={removeWitness} onEdit={editWitness} />
                        ))}
                    </View>
                )}

                <Divider style={[styles.divider, { marginTop: 8 }]} />

                {/* ── Otros servicios ── */}
                <Text variant="titleMedium" style={[styles.sectionLabel, { marginTop: 8 }]}>Otros servicios</Text>
                <Menu
                    visible={serviceMenuVisible}
                    onDismiss={() => setServiceMenuVisible(false)}
                    anchor={
                        <Button
                            mode="outlined"
                            onPress={() => setServiceMenuVisible(true)}
                            icon="chevron-down"
                            contentStyle={{ flexDirection: "row-reverse" }}
                            style={styles.serviceTypeButton}
                        >
                            {newServiceType}
                        </Button>
                    }
                >
                    {SERVICE_TYPES.map(st => (
                        <Menu.Item
                            key={st}
                            onPress={() => { setNewServiceType(st); setServiceMenuVisible(false); }}
                            title={st}
                        />
                    ))}
                </Menu>
                <TextInput
                    label="ID de móviles"
                    value={newServiceIds}
                    onChangeText={setNewServiceIds}
                    mode="outlined"
                    style={styles.input}
                    left={<TextInput.Icon icon="identifier" />}
                />
                <TextInput
                    label="Personal a cargo"
                    value={newServicePersonnel}
                    onChangeText={setNewServicePersonnel}
                    mode="outlined"
                    style={styles.input}
                    left={<TextInput.Icon icon="account-tie" />}
                />
                <View style={styles.buttonRow}>
                    <Button
                        mode={editingServiceIndex !== null ? "contained" : "contained-tonal"}
                        onPress={addService}
                        icon={editingServiceIndex !== null ? "check" : "plus"}
                        style={styles.actionButton}
                    >
                        {editingServiceIndex !== null ? "Actualizar" : "Agregar servicio"}
                    </Button>
                    {editingServiceIndex !== null && (
                        <Button mode="outlined" onPress={cancelEditService} icon="close" style={styles.actionButton}>
                            Cancelar
                        </Button>
                    )}
                </View>
                {otherServices.length > 0 && (
                    <View>
                        <Divider style={styles.divider} />
                        <Text variant="titleSmall" style={styles.listTitle}>
                            Registrados ({otherServices.length})
                        </Text>
                        {otherServices.map((s, i) => (
                            <ServiceItem key={i} service={s} index={i} onRemove={removeService} onEdit={editService} />
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const renderStep3 = () => (
        <View style={styles.stepContent}>
            <Text variant="titleMedium" style={styles.sectionLabel}>Notas de campo</Text>
            <TextInput
                label="Redacción del hecho"
                placeholder="Redactar detalles relevantes del incidente..."
                value={fieldNotes}
                onChangeText={setFieldNotes}
                mode="outlined"
                multiline
                numberOfLines={8}
                style={styles.input}
            />
            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={[styles.sectionLabel, { marginTop: 4 }]}>Evidencia fotográfica</Text>
            <MultimediaSection photos={photos} onPhotosChange={setPhotos} />
        </View>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0: return renderStep0();
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            default: return null;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StepProgress currentStep={currentStep} onStepPress={setCurrentStep} theme={theme} />

            <KeyboardAwareScrollView
                ref={scrollRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid
                enableAutomaticScroll
                extraScrollHeight={24}
                extraHeight={80}
                showsVerticalScrollIndicator
            >
                {renderCurrentStep()}
            </KeyboardAwareScrollView>

            <Surface style={styles.footer} elevation={4}>
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
    row: { flexDirection: "row", alignItems: "center" },
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
    chipGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
    envChip: { margin: 3, borderRadius: 16 },
    conditionalCard: {
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        backgroundColor: theme.colors.surface,
    },
    conditionalTitle: { fontWeight: "600", marginBottom: 12 },
    personForm: { marginBottom: 8 },
    serviceTypeButton: { marginBottom: 12, alignSelf: "flex-start" },
    buttonRow: { flexDirection: "row", gap: 8, marginTop: 8 },
    actionButton: { flex: 1, borderRadius: 8 },
    divider: { marginVertical: 12 },
    listTitle: { marginBottom: 12, color: theme.colors.onSurfaceVariant },
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

export default InterventionFormScreen;
