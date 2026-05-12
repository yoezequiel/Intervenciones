import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
    View,
    StyleSheet,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
    TextInput,
    Button,
    Text,
    Chip,
    Surface,
    useTheme,
} from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";
import { InterventionType } from "../types";
import AccordionSection from "../components/AccordionSection";
import { useModal } from "../context/ModalContext";

const CommunicationFormScreen = ({ navigation, route }) => {
    const { addCommunication, updateCommunication, getCommunication } = useDatabase();
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const showModal = useModal();

    const communicationId = route.params?.communicationId;
    const isEditing = !!communicationId;
    const existing = isEditing ? getCommunication(communicationId) : null;

    const getCurrentTime = useCallback(() => {
        const now = new Date();
        return now.toTimeString().slice(0, 5);
    }, []);

    React.useLayoutEffect(() => {
        if (isEditing) {
            navigation.setOptions({ title: "Editar Comunicación" });
        }
    }, [navigation, isEditing]);

    const [callerName, setCallerName] = useState(existing?.callerName || "");
    const [callerPhone, setCallerPhone] = useState(existing?.callerPhone || "");
    const [time, setTime] = useState(existing?.time || getCurrentTime());
    const [address, setAddress] = useState(existing?.address || "");
    const [incidentType, setIncidentType] = useState(existing?.incidentType || "");
    const [notes, setNotes] = useState(existing?.notes || "");
    const [loading, setLoading] = useState(false);
    const [timeTouched, setTimeTouched] = useState(false);

    const isValidTime = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
    const timeHasError = timeTouched && !!time && !isValidTime(time);

    const isDirtyRef = useRef(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        isDirtyRef.current = true;
    }, [callerName, callerPhone, time, address, incidentType, notes]);

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

    const typeOptions = Object.values(InterventionType);

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
        callerName, callerPhone, time, address, incidentType, notes,
        isEditing, communicationId, addCommunication, updateCommunication, navigation,
    ]);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <KeyboardAwareScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid
                enableAutomaticScroll
                extraScrollHeight={24}
                extraHeight={80}
                showsVerticalScrollIndicator
            >
                <AccordionSection title="Datos del Llamante" defaultExpanded icon="phone-incoming">
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
                    <View style={{ marginBottom: timeHasError ? 2 : 0 }}>
                        <TextInput
                            label="Hora del llamado"
                            value={time}
                            onChangeText={(t) => { setTime(t); if (t.length >= 5) setTimeTouched(true); }}
                            onBlur={() => setTimeTouched(true)}
                            placeholder="HH:MM"
                            mode="outlined"
                            error={timeHasError}
                            style={styles.input}
                            left={<TextInput.Icon icon="clock-outline" />}
                            right={
                                <TextInput.Icon
                                    icon="clock-check-outline"
                                    onPress={() => { setTime(getCurrentTime()); setTimeTouched(false); }}
                                />
                            }
                        />
                        {timeHasError && (
                            <Text variant="labelSmall" style={{ color: theme.colors.error, marginLeft: 4, marginTop: 2, marginBottom: 8 }}>
                                Formato inválido — usá HH:MM (ej: 14:30)
                            </Text>
                        )}
                    </View>
                </AccordionSection>

                <AccordionSection title="Ubicación del Incidente" defaultExpanded icon="map-marker-outline">
                    <TextInput
                        label="Dirección o referencia"
                        value={address}
                        onChangeText={setAddress}
                        mode="outlined"
                        multiline
                        style={styles.input}
                        left={<TextInput.Icon icon="map-marker" />}
                    />
                </AccordionSection>

                <AccordionSection title="Tipo de Incidente" icon="tag-outline">
                    <View style={styles.typeContainer}>
                        <Chip
                            mode={incidentType === "" ? "flat" : "outlined"}
                            selected={incidentType === ""}
                            onPress={() => setIncidentType("")}
                            style={styles.typeChip}
                        >
                            Sin definir
                        </Chip>
                        {typeOptions.map(opt => (
                            <Chip
                                key={opt}
                                mode={incidentType === opt ? "flat" : "outlined"}
                                selected={incidentType === opt}
                                showSelectedOverlay
                                onPress={() => setIncidentType(incidentType === opt ? "" : opt)}
                                style={styles.typeChip}
                            >
                                {opt}
                            </Chip>
                        ))}
                    </View>
                </AccordionSection>

                <AccordionSection title="Observaciones" icon="notebook-edit-outline">
                    <TextInput
                        label="Notas adicionales"
                        value={notes}
                        onChangeText={setNotes}
                        mode="outlined"
                        multiline
                        numberOfLines={4}
                        style={styles.input}
                    />
                </AccordionSection>
            </KeyboardAwareScrollView>

            <Surface style={styles.stickyFooter} elevation={4}>
                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    icon="content-save"
                    style={styles.submitButton}
                >
                    {isEditing ? "Actualizar Comunicación" : "Registrar Comunicación"}
                </Button>
            </Surface>
        </View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollViewContent: { flexGrow: 1, paddingTop: 16, paddingBottom: 24 },
    input: { marginBottom: 12, backgroundColor: theme.colors.surface },
    timeRow: { flexDirection: "row", alignItems: "center" },
    nowButton: { marginLeft: 8 },
    typeContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
    typeChip: { margin: 4, borderRadius: 20 },
    stickyFooter: {
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    submitButton: { borderRadius: 8, paddingVertical: 4 },
});

export default CommunicationFormScreen;
