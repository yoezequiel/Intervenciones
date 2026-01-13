import React, { useState, useCallback, useMemo, memo } from "react";
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
    Card,
    Title,
    Chip,
    IconButton,
    Text,
    Menu,
    Divider,
    SegmentedButtons,
} from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";
import { InterventionType } from "../types";
import AccordionSection from "../components/AccordionSection";

// Componente memoizado para los botones de tiempo
const TimeButton = memo(({ label, value, onChangeText, getCurrentTime }) => (
    <View style={styles.timeRow}>
        <View style={styles.timeInput}>
            <TextInput
                label={label}
                value={value}
                onChangeText={onChangeText}
                placeholder="HH:MM"
                mode="outlined"
            />
            <Button mode="text" onPress={() => onChangeText(getCurrentTime())}>
                Ahora
            </Button>
        </View>
    </View>
));

// Componente memoizado para los chips de tipo
const TypeChip = memo(({ option, isSelected, onPress }) => (
    <Chip
        key={option.value}
        mode={isSelected ? "flat" : "outlined"}
        selected={isSelected}
        onPress={onPress}
        style={styles.typeChip}>
        {option.label}
    </Chip>
));

// Componente memoizado para servicios
const ServiceItem = memo(({ service, index, onRemove, onEdit }) => (
    <View style={styles.serviceItem}>
        <View style={styles.serviceInfo}>
            <Text variant="bodyLarge">{service.type}</Text>
            <Text variant="bodySmall" style={styles.serviceDetails}>
                IDs: {service.ids || "N/A"} | Personal:{" "}
                {service.personnel || "N/A"}
            </Text>
        </View>
        <View style={styles.itemActions}>
            <IconButton icon="pencil" onPress={() => onEdit(index)} />
            <IconButton icon="delete" onPress={() => onRemove(index)} />
        </View>
    </View>
));

// Componente memoizado para víctimas
const VictimItem = memo(({ victim, index, onRemove, onEdit }) => (
    <View style={styles.personItem}>
        <View style={styles.personInfo}>
            <Text variant="bodyLarge">{victim.name || "Sin nombre"}</Text>
            {victim.age && <Text variant="bodySmall">Edad: {victim.age}</Text>}
            {victim.dni && <Text variant="bodySmall">DNI: {victim.dni}</Text>}
            {victim.gender && (
                <Text variant="bodySmall">Género: {victim.gender}</Text>
            )}
            {victim.description && (
                <Text variant="bodySmall" style={styles.description}>
                    {victim.description}
                </Text>
            )}
        </View>
        <View style={styles.itemActions}>
            <IconButton icon="pencil" onPress={() => onEdit(index)} />
            <IconButton icon="delete" onPress={() => onRemove(index)} />
        </View>
    </View>
));

// Componente memoizado para testigos
const WitnessItem = memo(({ witness, index, onRemove, onEdit }) => (
    <View style={styles.personItem}>
        <View style={styles.personInfo}>
            <Text variant="bodyLarge">{witness.name || "Sin nombre"}</Text>
            {witness.age && (
                <Text variant="bodySmall">Edad: {witness.age}</Text>
            )}
            {witness.dni && <Text variant="bodySmall">DNI: {witness.dni}</Text>}
            {witness.gender && (
                <Text variant="bodySmall">Género: {witness.gender}</Text>
            )}
            {witness.description && (
                <Text variant="bodySmall" style={styles.description}>
                    {witness.description}
                </Text>
            )}
        </View>
        <View style={styles.itemActions}>
            <IconButton icon="pencil" onPress={() => onEdit(index)} />
            <IconButton icon="delete" onPress={() => onRemove(index)} />
        </View>
    </View>
));

const InterventionFormScreen = ({ navigation, route }) => {
    const { addIntervention, updateIntervention, getIntervention } =
        useDatabase();

    // Detectar si estamos editando
    const interventionId = route.params?.interventionId;
    const isEditing = !!interventionId;
    const existingIntervention = isEditing
        ? getIntervention(interventionId)
        : null;

    // Estados del formulario
    const [callTime, setCallTime] = useState(
        existingIntervention?.callTime || ""
    );
    const [departureTime, setDepartureTime] = useState(
        existingIntervention?.departureTime || ""
    );
    const [returnTime, setReturnTime] = useState(
        existingIntervention?.returnTime || ""
    );
    const [address, setAddress] = useState(existingIntervention?.address || "");
    const [type, setType] = useState(
        existingIntervention?.type || InterventionType.OTHER
    );

    // Otros servicios unificados
    const [otherServices, setOtherServices] = useState(
        existingIntervention?.otherServices || []
    );
    const [newServiceType, setNewServiceType] = useState("Policía");
    const [newServiceIds, setNewServiceIds] = useState("");
    const [newServicePersonnel, setNewServicePersonnel] = useState("");
    const [serviceMenuVisible, setServiceMenuVisible] = useState(false);
    const [editingServiceIndex, setEditingServiceIndex] = useState(null);

    // Personas involucradas - Testigos
    const [witnesses, setWitnesses] = useState(
        existingIntervention?.witnesses || []
    );
    const [newWitness, setNewWitness] = useState({
        name: "",
        age: "",
        dni: "",
        gender: "",
        description: "",
    });
    const [editingWitnessIndex, setEditingWitnessIndex] = useState(null);

    // Personas involucradas - Víctimas
    const [victims, setVictims] = useState(existingIntervention?.victims || []);
    const [newVictim, setNewVictim] = useState({
        name: "",
        age: "",
        dni: "",
        gender: "",
        description: "",
    });
    const [editingVictimIndex, setEditingVictimIndex] = useState(null);

    // Notas
    const [fieldNotes, setFieldNotes] = useState(
        existingIntervention?.fieldNotes || ""
    );

    const [loading, setLoading] = useState(false);

    // Memoizar constantes para evitar recreación en cada render
    const serviceTypes = useMemo(
        () => [
            "Policía",
            "Ambulancia",
            "Grúa",
            "Electricidad",
            "Gas",
            "Bomberos de otro cuartel",
            "Otro",
        ],
        []
    );

    const genderOptions = useMemo(
        () => [
            { value: "Masculino", label: "Masculino" },
            { value: "Femenino", label: "Femenino" },
            { value: "Otro", label: "Otro" },
        ],
        []
    );

    const typeOptions = useMemo(
        () =>
            Object.values(InterventionType).map((value) => ({
                value,
                label: value,
            })),
        []
    );

    // Memoizar funciones para evitar re-renders
    const getCurrentTime = useCallback(() => {
        const now = new Date();
        return now.toTimeString().slice(0, 5);
    }, []);

    const addService = useCallback(() => {
        if (newServiceType.trim()) {
            const newService = {
                type: newServiceType,
                ids: newServiceIds || "",
                personnel: newServicePersonnel || "",
            };

            if (editingServiceIndex !== null) {
                // Editar servicio existente
                setOtherServices((prev) =>
                    prev.map((service, index) =>
                        index === editingServiceIndex ? newService : service
                    )
                );
                setEditingServiceIndex(null);
            } else {
                // Agregar nuevo servicio
                setOtherServices((prev) => [...prev, newService]);
            }

            setNewServiceIds("");
            setNewServicePersonnel("");
        }
    }, [
        newServiceType,
        newServiceIds,
        newServicePersonnel,
        editingServiceIndex,
    ]);

    const editService = useCallback(
        (index) => {
            const service = otherServices[index];
            setNewServiceType(service.type);
            setNewServiceIds(service.ids);
            setNewServicePersonnel(service.personnel);
            setEditingServiceIndex(index);
        },
        [otherServices]
    );

    const cancelEditService = useCallback(() => {
        setNewServiceType("Policía");
        setNewServiceIds("");
        setNewServicePersonnel("");
        setEditingServiceIndex(null);
    }, []);

    const removeService = useCallback(
        (index) => {
            setOtherServices((prev) => prev.filter((_, i) => i !== index));
            if (editingServiceIndex === index) {
                cancelEditService();
            }
        },
        [editingServiceIndex, cancelEditService]
    );

    const addWitness = useCallback(() => {
        if (newWitness.name.trim() || newWitness.dni.trim()) {
            const witnessData = {
                name: newWitness.name.trim(),
                age: newWitness.age.trim(),
                dni: newWitness.dni.trim(),
                gender: newWitness.gender,
                description: newWitness.description.trim(),
            };

            if (editingWitnessIndex !== null) {
                // Editar testigo existente
                setWitnesses((prev) =>
                    prev.map((witness, index) =>
                        index === editingWitnessIndex ? witnessData : witness
                    )
                );
                setEditingWitnessIndex(null);
            } else {
                // Agregar nuevo testigo
                setWitnesses((prev) => [...prev, witnessData]);
            }

            setNewWitness({
                name: "",
                age: "",
                dni: "",
                gender: "",
                description: "",
            });
        }
    }, [newWitness, editingWitnessIndex]);

    const editWitness = useCallback(
        (index) => {
            const witness = witnesses[index];
            setNewWitness({
                name: witness.name || "",
                age: witness.age || "",
                dni: witness.dni || "",
                gender: witness.gender || "",
                description: witness.description || "",
            });
            setEditingWitnessIndex(index);
        },
        [witnesses]
    );

    const cancelEditWitness = useCallback(() => {
        setNewWitness({
            name: "",
            age: "",
            dni: "",
            gender: "",
            description: "",
        });
        setEditingWitnessIndex(null);
    }, []);

    const removeWitness = useCallback(
        (index) => {
            setWitnesses((prev) => prev.filter((_, i) => i !== index));
            if (editingWitnessIndex === index) {
                cancelEditWitness();
            }
        },
        [editingWitnessIndex, cancelEditWitness]
    );

    const addVictim = useCallback(() => {
        if (newVictim.name.trim() || newVictim.dni.trim()) {
            const victimData = {
                name: newVictim.name.trim(),
                age: newVictim.age.trim(),
                dni: newVictim.dni.trim(),
                gender: newVictim.gender,
                description: newVictim.description.trim(),
            };

            if (editingVictimIndex !== null) {
                // Editar víctima existente
                setVictims((prev) =>
                    prev.map((victim, index) =>
                        index === editingVictimIndex ? victimData : victim
                    )
                );
                setEditingVictimIndex(null);
            } else {
                // Agregar nueva víctima
                setVictims((prev) => [...prev, victimData]);
            }

            setNewVictim({
                name: "",
                age: "",
                dni: "",
                gender: "",
                description: "",
            });
        }
    }, [newVictim, editingVictimIndex]);

    const editVictim = useCallback(
        (index) => {
            const victim = victims[index];
            setNewVictim({
                name: victim.name || "",
                age: victim.age || "",
                dni: victim.dni || "",
                gender: victim.gender || "",
                description: victim.description || "",
            });
            setEditingVictimIndex(index);
        },
        [victims]
    );

    const cancelEditVictim = useCallback(() => {
        setNewVictim({
            name: "",
            age: "",
            dni: "",
            gender: "",
            description: "",
        });
        setEditingVictimIndex(null);
    }, []);

    const removeVictim = useCallback(
        (index) => {
            setVictims((prev) => prev.filter((_, i) => i !== index));
            if (editingVictimIndex === index) {
                cancelEditVictim();
            }
        },
        [editingVictimIndex, cancelEditVictim]
    );

    const handleSubmit = useCallback(async () => {
        setLoading(true);
        try {
            const interventionData = {
                callTime,
                departureTime,
                returnTime,
                address,
                type,
                otherServices,
                witnesses,
                victims,
                fieldNotes,
                audioNotes: existingIntervention?.audioNotes || [],
                sketches: existingIntervention?.sketches || [],
            };

            if (isEditing) {
                // Actualizar intervención existente
                await updateIntervention(interventionId, interventionData);
                Alert.alert("Éxito", "Intervención actualizada correctamente", [
                    { text: "OK", onPress: () => navigation.goBack() },
                ]);
            } else {
                // Crear nueva intervención
                await addIntervention(interventionData);
                Alert.alert("Éxito", "Intervención guardada correctamente", [
                    { text: "OK", onPress: () => navigation.goBack() },
                ]);
            }
        } catch (error) {
            Alert.alert(
                "Error",
                `No se pudo ${
                    isEditing ? "actualizar" : "guardar"
                } la intervención`
            );
        } finally {
            setLoading(false);
        }
    }, [
        addIntervention,
        updateIntervention,
        isEditing,
        interventionId,
        existingIntervention,
        callTime,
        departureTime,
        returnTime,
        address,
        type,
        otherServices,
        witnesses,
        victims,
        fieldNotes,
        navigation,
    ]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}>
                <AccordionSection
                    title="Datos Cronológicos"
                    defaultExpanded={true}>
                    <TimeButton
                        label="Hora del llamado"
                        value={callTime}
                        onChangeText={setCallTime}
                        getCurrentTime={getCurrentTime}
                    />
                    <TimeButton
                        label="Hora de salida"
                        value={departureTime}
                        onChangeText={setDepartureTime}
                        getCurrentTime={getCurrentTime}
                    />
                    <TimeButton
                        label="Hora de regreso"
                        value={returnTime}
                        onChangeText={setReturnTime}
                        getCurrentTime={getCurrentTime}
                    />
                </AccordionSection>

                <AccordionSection title="Ubicación" defaultExpanded={true}>
                    <TextInput
                        label="Dirección o punto de referencia"
                        value={address}
                        onChangeText={setAddress}
                        mode="outlined"
                        multiline
                        style={styles.input}
                    />
                </AccordionSection>

                <AccordionSection
                    title="Tipo de Intervención"
                    defaultExpanded={true}>
                    <View style={styles.typeContainer}>
                        {typeOptions.map((option) => (
                            <TypeChip
                                key={option.value}
                                option={option}
                                isSelected={type === option.value}
                                onPress={() => setType(option.value)}
                            />
                        ))}
                    </View>
                </AccordionSection>

                <AccordionSection title="Otros Servicios">
                    <View style={styles.serviceForm}>
                        <Menu
                            visible={serviceMenuVisible}
                            onDismiss={() => setServiceMenuVisible(false)}
                            anchor={
                                <Button
                                    mode="outlined"
                                    onPress={() => setServiceMenuVisible(true)}
                                    style={styles.serviceTypeButton}>
                                    {newServiceType}
                                </Button>
                            }>
                            {serviceTypes.map((serviceType) => (
                                <Menu.Item
                                    key={serviceType}
                                    onPress={() => {
                                        setNewServiceType(serviceType);
                                        setServiceMenuVisible(false);
                                    }}
                                    title={serviceType}
                                />
                            ))}
                        </Menu>

                        <TextInput
                            label="Identificador de móviles"
                            value={newServiceIds}
                            onChangeText={setNewServiceIds}
                            mode="outlined"
                            style={styles.input}
                        />
                        <TextInput
                            label="Personal a cargo"
                            value={newServicePersonnel}
                            onChangeText={setNewServicePersonnel}
                            mode="outlined"
                            style={styles.input}
                        />

                        <View style={styles.buttonRow}>
                            <Button
                                mode="contained"
                                onPress={addService}
                                icon={
                                    editingServiceIndex !== null
                                        ? "check"
                                        : "plus"
                                }
                                style={[
                                    styles.actionButton,
                                    styles.primaryButton,
                                ]}>
                                {editingServiceIndex !== null
                                    ? "Actualizar"
                                    : "Agregar"}
                            </Button>
                            {editingServiceIndex !== null && (
                                <Button
                                    mode="outlined"
                                    onPress={cancelEditService}
                                    icon="close"
                                    style={styles.actionButton}>
                                    Cancelar
                                </Button>
                            )}
                        </View>
                    </View>

                    {otherServices.length > 0 && (
                        <View style={styles.servicesContainer}>
                            <Divider style={styles.divider} />
                            <Text
                                variant="titleSmall"
                                style={styles.servicesTitle}>
                                Servicios Agregados:
                            </Text>
                            {otherServices.map((service, index) => (
                                <ServiceItem
                                    key={index}
                                    service={service}
                                    index={index}
                                    onRemove={removeService}
                                    onEdit={editService}
                                />
                            ))}
                        </View>
                    )}
                </AccordionSection>

                <AccordionSection title="Testigos">
                    <TextInput
                        label="Nombre"
                        value={newWitness.name}
                        onChangeText={(text) =>
                            setNewWitness((prev) => ({ ...prev, name: text }))
                        }
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Edad (opcional)"
                        value={newWitness.age}
                        onChangeText={(text) =>
                            setNewWitness((prev) => ({ ...prev, age: text }))
                        }
                        mode="outlined"
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <TextInput
                        label="DNI (opcional)"
                        value={newWitness.dni}
                        onChangeText={(text) =>
                            setNewWitness((prev) => ({ ...prev, dni: text }))
                        }
                        mode="outlined"
                        keyboardType="numeric"
                        style={styles.input}
                    />

                    <Text variant="labelLarge" style={styles.label}>
                        Género (opcional)
                    </Text>
                    <SegmentedButtons
                        value={newWitness.gender}
                        onValueChange={(value) =>
                            setNewWitness((prev) => ({
                                ...prev,
                                gender: value,
                            }))
                        }
                        buttons={genderOptions}
                        style={styles.input}
                    />

                    <TextInput
                        label="Descripción (opcional)"
                        value={newWitness.description}
                        onChangeText={(text) =>
                            setNewWitness((prev) => ({
                                ...prev,
                                description: text,
                            }))
                        }
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                    />

                    <View style={styles.buttonRow}>
                        <Button
                            mode="contained"
                            onPress={addWitness}
                            icon={
                                editingWitnessIndex !== null ? "check" : "plus"
                            }
                            style={[styles.actionButton, styles.primaryButton]}>
                            {editingWitnessIndex !== null
                                ? "Actualizar"
                                : "Agregar"}
                        </Button>
                        {editingWitnessIndex !== null && (
                            <Button
                                mode="outlined"
                                onPress={cancelEditWitness}
                                icon="close"
                                style={styles.actionButton}>
                                Cancelar
                            </Button>
                        )}
                    </View>

                    {witnesses.map((witness, index) => (
                        <WitnessItem
                            key={index}
                            witness={witness}
                            index={index}
                            onRemove={removeWitness}
                            onEdit={editWitness}
                        />
                    ))}
                </AccordionSection>

                <AccordionSection title="Víctimas">
                    <TextInput
                        label="Nombre"
                        value={newVictim.name}
                        onChangeText={(text) =>
                            setNewVictim((prev) => ({ ...prev, name: text }))
                        }
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Edad (opcional)"
                        value={newVictim.age}
                        onChangeText={(text) =>
                            setNewVictim((prev) => ({ ...prev, age: text }))
                        }
                        mode="outlined"
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <TextInput
                        label="DNI (opcional)"
                        value={newVictim.dni}
                        onChangeText={(text) =>
                            setNewVictim((prev) => ({ ...prev, dni: text }))
                        }
                        mode="outlined"
                        keyboardType="numeric"
                        style={styles.input}
                    />

                    <Text variant="labelLarge" style={styles.label}>
                        Género (opcional)
                    </Text>
                    <SegmentedButtons
                        value={newVictim.gender}
                        onValueChange={(value) =>
                            setNewVictim((prev) => ({ ...prev, gender: value }))
                        }
                        buttons={genderOptions}
                        style={styles.input}
                    />

                    <TextInput
                        label="Descripción (lesiones, estado, etc.)"
                        value={newVictim.description}
                        onChangeText={(text) =>
                            setNewVictim((prev) => ({
                                ...prev,
                                description: text,
                            }))
                        }
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                    />

                    <View style={styles.buttonRow}>
                        <Button
                            mode="contained"
                            onPress={addVictim}
                            icon={
                                editingVictimIndex !== null ? "check" : "plus"
                            }
                            style={[styles.actionButton, styles.primaryButton]}>
                            {editingVictimIndex !== null
                                ? "Actualizar"
                                : "Agregar"}
                        </Button>
                        {editingVictimIndex !== null && (
                            <Button
                                mode="outlined"
                                onPress={cancelEditVictim}
                                icon="close"
                                style={styles.actionButton}>
                                Cancelar
                            </Button>
                        )}
                    </View>

                    {victims.map((victim, index) => (
                        <VictimItem
                            key={index}
                            victim={victim}
                            index={index}
                            onRemove={removeVictim}
                            onEdit={editVictim}
                        />
                    ))}
                </AccordionSection>

                <AccordionSection title="Notas de Campo">
                    <TextInput
                        label="Redacción del hecho"
                        placeholder="Redacción del hecho"
                        value={fieldNotes}
                        onChangeText={setFieldNotes}
                        mode="outlined"
                        multiline
                        numberOfLines={6}
                        style={styles.input}
                    />
                </AccordionSection>

                <View style={styles.buttonContainer}>
                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading}
                        style={styles.submitButton}>
                        {isEditing
                            ? "Actualizar Intervención"
                            : "Guardar Intervención"}
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    card: {
        margin: 16,
        marginBottom: 8,
        backgroundColor: "#FFFFFF",
    },
    input: {
        marginBottom: 12,
    },
    label: {
        marginBottom: 8,
        marginTop: 4,
    },
    timeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    timeInput: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    typeContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 8,
    },
    typeChip: {
        margin: 4,
    },
    serviceForm: {
        marginBottom: 16,
    },
    serviceTypeButton: {
        marginBottom: 12,
    },
    servicesContainer: {
        marginTop: 16,
    },
    servicesTitle: {
        marginBottom: 8,
        fontWeight: "bold",
    },
    serviceItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        padding: 12,
        marginTop: 8,
        borderRadius: 8,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceDetails: {
        color: "#666",
        marginTop: 4,
    },
    divider: {
        marginBottom: 12,
    },
    personItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#f0f0f0",
        padding: 12,
        marginTop: 12,
        borderRadius: 8,
    },
    personInfo: {
        flex: 1,
    },
    description: {
        color: "#666",
        marginTop: 4,
        fontStyle: "italic",
    },
    itemActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    buttonRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
    },
    actionButton: {
        flex: 1,
    },
    primaryButton: {
        backgroundColor: "#d32f2f",
    },
    buttonContainer: {
        padding: 16,
    },
    submitButton: {
        backgroundColor: "#d32f2f",
    },
});

export default InterventionFormScreen;
