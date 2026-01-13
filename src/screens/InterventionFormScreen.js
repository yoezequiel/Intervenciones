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
const ServiceItem = memo(({ service, index, onRemove }) => (
    <View style={styles.serviceItem}>
        <View style={styles.serviceInfo}>
            <Text variant="bodyLarge">{service.type}</Text>
            <Text variant="bodySmall" style={styles.serviceDetails}>
                IDs: {service.ids || "N/A"} | Personal:{" "}
                {service.personnel || "N/A"}
            </Text>
        </View>
        <IconButton icon="delete" onPress={() => onRemove(index)} />
    </View>
));

// Componente memoizado para víctimas
const VictimItem = memo(({ victim, index, onRemove }) => (
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
        <IconButton icon="delete" onPress={() => onRemove(index)} />
    </View>
));

// Componente memoizado para testigos
const WitnessItem = memo(({ witness, index, onRemove }) => (
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
        <IconButton icon="delete" onPress={() => onRemove(index)} />
    </View>
));

const InterventionFormScreen = ({ navigation }) => {
    const { addIntervention } = useDatabase();

    // Estados del formulario
    const [callTime, setCallTime] = useState("");
    const [departureTime, setDepartureTime] = useState("");
    const [returnTime, setReturnTime] = useState("");
    const [address, setAddress] = useState("");
    const [type, setType] = useState(InterventionType.OTHER);

    // Otros servicios unificados
    const [otherServices, setOtherServices] = useState([]);
    const [newServiceType, setNewServiceType] = useState("Policía");
    const [newServiceIds, setNewServiceIds] = useState("");
    const [newServicePersonnel, setNewServicePersonnel] = useState("");
    const [serviceMenuVisible, setServiceMenuVisible] = useState(false);

    // Personas involucradas - Testigos
    const [witnesses, setWitnesses] = useState([]);
    const [newWitness, setNewWitness] = useState({
        name: "",
        age: "",
        dni: "",
        gender: "",
        description: "",
    });

    // Personas involucradas - Víctimas
    const [victims, setVictims] = useState([]);
    const [newVictim, setNewVictim] = useState({
        name: "",
        age: "",
        dni: "",
        gender: "",
        description: "",
    });

    // Notas
    const [fieldNotes, setFieldNotes] = useState("");

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
            setOtherServices((prev) => [...prev, newService]);
            setNewServiceIds("");
            setNewServicePersonnel("");
        }
    }, [newServiceType, newServiceIds, newServicePersonnel]);

    const removeService = useCallback((index) => {
        setOtherServices((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const addWitness = useCallback(() => {
        if (newWitness.name.trim() || newWitness.dni.trim()) {
            setWitnesses((prev) => [
                ...prev,
                {
                    name: newWitness.name.trim(),
                    age: newWitness.age.trim(),
                    dni: newWitness.dni.trim(),
                    gender: newWitness.gender,
                    description: newWitness.description.trim(),
                },
            ]);
            setNewWitness({
                name: "",
                age: "",
                dni: "",
                gender: "",
                description: "",
            });
        }
    }, [newWitness]);

    const removeWitness = useCallback((index) => {
        setWitnesses((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const addVictim = useCallback(() => {
        if (newVictim.name.trim() || newVictim.dni.trim()) {
            setVictims((prev) => [
                ...prev,
                {
                    name: newVictim.name.trim(),
                    age: newVictim.age.trim(),
                    dni: newVictim.dni.trim(),
                    gender: newVictim.gender,
                    description: newVictim.description.trim(),
                },
            ]);
            setNewVictim({
                name: "",
                age: "",
                dni: "",
                gender: "",
                description: "",
            });
        }
    }, [newVictim]);

    const removeVictim = useCallback((index) => {
        setVictims((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleSubmit = useCallback(async () => {
        setLoading(true);
        try {
            await addIntervention({
                callTime,
                departureTime,
                returnTime,
                address,
                type,
                otherServices,
                witnesses,
                victims,
                fieldNotes,
                audioNotes: [],
                sketches: [],
            });

            Alert.alert("Éxito", "Intervención guardada correctamente", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            Alert.alert("Error", "No se pudo guardar la intervención");
        } finally {
            setLoading(false);
        }
    }, [
        addIntervention,
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

                        <Button
                            mode="outlined"
                            onPress={addService}
                            icon="plus">
                            Agregar Servicio
                        </Button>
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

                    <Button mode="outlined" onPress={addWitness} icon="plus">
                        Agregar Testigo
                    </Button>

                    {witnesses.map((witness, index) => (
                        <WitnessItem
                            key={index}
                            witness={witness}
                            index={index}
                            onRemove={removeWitness}
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

                    <Button mode="outlined" onPress={addVictim} icon="plus">
                        Agregar Víctima
                    </Button>

                    {victims.map((victim, index) => (
                        <VictimItem
                            key={index}
                            victim={victim}
                            index={index}
                            onRemove={removeVictim}
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
                        Guardar Intervención
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
    buttonContainer: {
        padding: 16,
    },
    submitButton: {
        backgroundColor: "#d32f2f",
    },
});

export default InterventionFormScreen;
