import React, { useState, useCallback, useMemo } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
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

const CommunicationFormScreen = ({ navigation, route }) => {
    const { addCommunication, updateCommunication, getCommunication } = useDatabase();
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

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

    const typeOptions = Object.values(InterventionType);

    const handleSubmit = useCallback(async () => {
        if (!callerName.trim() && !callerPhone.trim() && !address.trim()) {
            Alert.alert(
                "Datos requeridos",
                "Completá al menos el nombre del llamante, teléfono o dirección."
            );
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
            if (isEditing) {
                await updateCommunication(communicationId, data);
                Alert.alert("Éxito", "Comunicación actualizada", [
                    { text: "OK", onPress: () => navigation.goBack() },
                ]);
            } else {
                await addCommunication(data);
                Alert.alert("Éxito", "Comunicación registrada", [
                    { text: "OK", onPress: () => navigation.goBack() },
                ]);
            }
        } catch (error) {
            Alert.alert(
                "Error",
                `No se pudo ${isEditing ? "actualizar" : "registrar"} la comunicación`
            );
        } finally {
            setLoading(false);
        }
    }, [
        callerName, callerPhone, time, address, incidentType, notes,
        isEditing, communicationId, addCommunication, updateCommunication, navigation,
    ]);

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
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
                    <View style={styles.timeRow}>
                        <TextInput
                            label="Hora del llamado"
                            value={time}
                            onChangeText={setTime}
                            placeholder="HH:MM"
                            mode="outlined"
                            style={[styles.input, { flex: 1 }]}
                            left={<TextInput.Icon icon="clock-outline" />}
                        />
                        <Button
                            mode="text"
                            onPress={() => setTime(getCurrentTime())}
                            style={styles.nowButton}
                        >
                            Ahora
                        </Button>
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
            </ScrollView>

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
        </KeyboardAvoidingView>
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
