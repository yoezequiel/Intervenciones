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
    useTheme,
    Surface,
} from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";
import { InterventionType } from "../types";
import AccordionSection from "../components/AccordionSection";

// Componente memoizado para los botones de tiempo
const TimeButton = memo(({ label, value, onChangeText, getCurrentTime, icon }) => (
    <View style={styles.timeRow}>
        <View style={styles.timeInput}>
            <TextInput
                label={label}
                value={value}
                onChangeText={onChangeText}
                placeholder="HH:MM"
                mode="outlined"
                style={{flex: 1}}
                left={<TextInput.Icon icon={icon} />}
            />
            <Button mode="text" onPress={() => onChangeText(getCurrentTime())} style={styles.nowButton}>
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
        showSelectedOverlay={true}
        onPress={onPress}
        style={styles.typeChip}>
        {option.label}
    </Chip>
));

// Componente memoizado para servicios
const ServiceItem = memo(({ service, index, onRemove, onEdit }) => (
    <Surface style={styles.personItem} elevation={1}>
        <View style={styles.personIcon}>
            <IconButton icon="account-hard-hat" size={24} iconColor="#1976d2" />
        </View>
        <View style={styles.personInfo}>
            <Text variant="titleMedium">{service.type}</Text>
            <Text variant="bodySmall" style={styles.description}>
                IDs: {service.ids || "N/A"} • Personal: {service.personnel || "N/A"}
            </Text>
        </View>
        <View style={styles.itemActions}>
            <IconButton icon="pencil" size={20} onPress={() => onEdit(index)} />
            <IconButton icon="delete" size={20} iconColor="#b71c1c" onPress={() => onRemove(index)} />
        </View>
    </Surface>
));

// Componente memoizado para víctimas
const VictimItem = memo(({ victim, index, onRemove, onEdit }) => (
    <Surface style={styles.personItem} elevation={1}>
        <View style={styles.personIcon}>
            <IconButton icon="account-injury" size={24} iconColor="#d32f2f" />
        </View>
        <View style={styles.personInfo}>
            <Text variant="titleMedium">{victim.name || "Sin nombre"}</Text>
            <Text variant="bodySmall" style={styles.description}>
                {[victim.age ? `${victim.age} años` : null, victim.gender].filter(Boolean).join(" • ")}
            </Text>
            {victim.dni && <Text variant="bodySmall" style={styles.description}>DNI: {victim.dni}</Text>}
            {victim.description && (
                <Text variant="bodySmall" style={[styles.description, {fontStyle: 'italic', marginTop: 4}]}>
                    "{victim.description}"
                </Text>
            )}
        </View>
        <View style={styles.itemActions}>
            <IconButton icon="pencil" size={20} onPress={() => onEdit(index)} />
            <IconButton icon="delete" size={20} iconColor="#b71c1c" onPress={() => onRemove(index)} />
        </View>
    </Surface>
));

// Componente memoizado para testigos
const WitnessItem = memo(({ witness, index, onRemove, onEdit }) => (
    <Surface style={styles.personItem} elevation={1}>
        <View style={styles.personIcon}>
            <IconButton icon="account-eye" size={24} iconColor="#2e7d32" />
        </View>
        <View style={styles.personInfo}>
            <Text variant="titleMedium">{witness.name || "Sin nombre"}</Text>
            <Text variant="bodySmall" style={styles.description}>
                {[witness.age ? `${witness.age} años` : null, witness.gender].filter(Boolean).join(" • ")}
            </Text>
            {witness.dni && <Text variant="bodySmall" style={styles.description}>DNI: {witness.dni}</Text>}
            {witness.description && (
                <Text variant="bodySmall" style={[styles.description, {fontStyle: 'italic', marginTop: 4}]}>
                    "{witness.description}"
                </Text>
            )}
        </View>
        <View style={styles.itemActions}>
            <IconButton icon="pencil" size={20} onPress={() => onEdit(index)} />
            <IconButton icon="delete" size={20} iconColor="#b71c1c" onPress={() => onRemove(index)} />
        </View>
    </Surface>
));

const InterventionFormScreen = ({ navigation, route }) => {
    const { addIntervention, updateIntervention, getIntervention } = useDatabase();
    const theme = useTheme();

    const interventionId = route.params?.interventionId;
    const isEditing = !!interventionId;
    const existingIntervention = isEditing ? getIntervention(interventionId) : null;

    const [callTime, setCallTime] = useState(existingIntervention?.callTime || "");
    const [departureTime, setDepartureTime] = useState(existingIntervention?.departureTime || "");
    const [returnTime, setReturnTime] = useState(existingIntervention?.returnTime || "");
    const [address, setAddress] = useState(existingIntervention?.address || "");
    const [type, setType] = useState(existingIntervention?.type || InterventionType.OTHER);

    const [otherServices, setOtherServices] = useState(existingIntervention?.otherServices || []);
    const [newServiceType, setNewServiceType] = useState("Policía");
    const [newServiceIds, setNewServiceIds] = useState("");
    const [newServicePersonnel, setNewServicePersonnel] = useState("");
    const [serviceMenuVisible, setServiceMenuVisible] = useState(false);
    const [editingServiceIndex, setEditingServiceIndex] = useState(null);

    const [witnesses, setWitnesses] = useState(existingIntervention?.witnesses || []);
    const [newWitness, setNewWitness] = useState({ name: "", age: "", dni: "", gender: "", description: "" });
    const [editingWitnessIndex, setEditingWitnessIndex] = useState(null);

    const [victims, setVictims] = useState(existingIntervention?.victims || []);
    const [newVictim, setNewVictim] = useState({ name: "", age: "", dni: "", gender: "", description: "" });
    const [editingVictimIndex, setEditingVictimIndex] = useState(null);

    const [fieldNotes, setFieldNotes] = useState(existingIntervention?.fieldNotes || "");
    const [loading, setLoading] = useState(false);

    const serviceTypes = useMemo(() => ["Policía", "Ambulancia", "Grúa", "Electricidad", "Gas", "Bomberos de otro cuartel", "Otro"], []);
    const genderOptions = useMemo(() => [
        { value: "Masculino", label: "Masculino" },
        { value: "Femenino", label: "Femenino" },
        { value: "Otro", label: "Otro" },
    ], []);
    const typeOptions = useMemo(() => Object.values(InterventionType).map((value) => ({ value, label: value })), []);

    const getCurrentTime = useCallback(() => {
        const now = new Date();
        return now.toTimeString().slice(0, 5);
    }, []);

    const addService = useCallback(() => {
        if (newServiceType.trim()) {
            const newService = { type: newServiceType, ids: newServiceIds || "", personnel: newServicePersonnel || "" };
            if (editingServiceIndex !== null) {
                setOtherServices((prev) => prev.map((service, index) => index === editingServiceIndex ? newService : service));
                setEditingServiceIndex(null);
            } else {
                setOtherServices((prev) => [...prev, newService]);
            }
            setNewServiceIds("");
            setNewServicePersonnel("");
        }
    }, [newServiceType, newServiceIds, newServicePersonnel, editingServiceIndex]);

    const editService = useCallback((index) => {
        const service = otherServices[index];
        setNewServiceType(service.type);
        setNewServiceIds(service.ids);
        setNewServicePersonnel(service.personnel);
        setEditingServiceIndex(index);
    }, [otherServices]);

    const cancelEditService = useCallback(() => {
        setNewServiceType("Policía");
        setNewServiceIds("");
        setNewServicePersonnel("");
        setEditingServiceIndex(null);
    }, []);

    const removeService = useCallback((index) => {
        setOtherServices((prev) => prev.filter((_, i) => i !== index));
        if (editingServiceIndex === index) cancelEditService();
    }, [editingServiceIndex, cancelEditService]);

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
                setWitnesses((prev) => prev.map((witness, index) => index === editingWitnessIndex ? witnessData : witness));
                setEditingWitnessIndex(null);
            } else {
                setWitnesses((prev) => [...prev, witnessData]);
            }
            setNewWitness({ name: "", age: "", dni: "", gender: "", description: "" });
        }
    }, [newWitness, editingWitnessIndex]);

    const editWitness = useCallback((index) => {
        const witness = witnesses[index];
        setNewWitness({ name: witness.name || "", age: witness.age || "", dni: witness.dni || "", gender: witness.gender || "", description: witness.description || "" });
        setEditingWitnessIndex(index);
    }, [witnesses]);

    const cancelEditWitness = useCallback(() => {
        setNewWitness({ name: "", age: "", dni: "", gender: "", description: "" });
        setEditingWitnessIndex(null);
    }, []);

    const removeWitness = useCallback((index) => {
        setWitnesses((prev) => prev.filter((_, i) => i !== index));
        if (editingWitnessIndex === index) cancelEditWitness();
    }, [editingWitnessIndex, cancelEditWitness]);

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
                setVictims((prev) => prev.map((victim, index) => index === editingVictimIndex ? victimData : victim));
                setEditingVictimIndex(null);
            } else {
                setVictims((prev) => [...prev, victimData]);
            }
            setNewVictim({ name: "", age: "", dni: "", gender: "", description: "" });
        }
    }, [newVictim, editingVictimIndex]);

    const editVictim = useCallback((index) => {
        const victim = victims[index];
        setNewVictim({ name: victim.name || "", age: victim.age || "", dni: victim.dni || "", gender: victim.gender || "", description: victim.description || "" });
        setEditingVictimIndex(index);
    }, [victims]);

    const cancelEditVictim = useCallback(() => {
        setNewVictim({ name: "", age: "", dni: "", gender: "", description: "" });
        setEditingVictimIndex(null);
    }, []);

    const removeVictim = useCallback((index) => {
        setVictims((prev) => prev.filter((_, i) => i !== index));
        if (editingVictimIndex === index) cancelEditVictim();
    }, [editingVictimIndex, cancelEditVictim]);

    const handleSubmit = useCallback(async () => {
        setLoading(true);
        try {
            const interventionData = {
                callTime, departureTime, returnTime, address, type, otherServices, witnesses, victims, fieldNotes,
                audioNotes: existingIntervention?.audioNotes || [], sketches: existingIntervention?.sketches || [],
            };

            if (isEditing) {
                await updateIntervention(interventionId, interventionData);
                Alert.alert("Éxito", "Intervención actualizada correctamente", [{ text: "OK", onPress: () => navigation.goBack() }]);
            } else {
                await addIntervention(interventionData);
                Alert.alert("Éxito", "Intervención guardada correctamente", [{ text: "OK", onPress: () => navigation.goBack() }]);
            }
        } catch (error) {
            Alert.alert("Error", `No se pudo ${isEditing ? "actualizar" : "guardar"} la intervención`);
        } finally {
            setLoading(false);
        }
    }, [addIntervention, updateIntervention, isEditing, interventionId, existingIntervention, callTime, departureTime, returnTime, address, type, otherServices, witnesses, victims, fieldNotes, navigation]);

    return (
        <KeyboardAvoidingView
            style={[styles.container, {backgroundColor: theme.colors.background}]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}>

                <AccordionSection title="Tipo de Intervención" defaultExpanded={true} icon="tag">
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

                <AccordionSection title="Datos Cronológicos" defaultExpanded={true} icon="clock-outline">
                    <TimeButton label="Hora del llamado" value={callTime} onChangeText={setCallTime} getCurrentTime={getCurrentTime} icon="phone-incoming" />
                    <TimeButton label="Hora de salida" value={departureTime} onChangeText={setDepartureTime} getCurrentTime={getCurrentTime} icon="truck-fast" />
                    <TimeButton label="Hora de regreso" value={returnTime} onChangeText={setReturnTime} getCurrentTime={getCurrentTime} icon="home-import-outline" />
                </AccordionSection>

                <AccordionSection title="Ubicación" defaultExpanded={true} icon="map-marker-outline">
                    <TextInput
                        label="Dirección o punto de referencia"
                        value={address}
                        onChangeText={setAddress}
                        mode="outlined"
                        multiline
                        style={styles.input}
                        left={<TextInput.Icon icon="map-marker" />}
                    />
                </AccordionSection>

                <AccordionSection title="Otros Servicios" icon="car-emergency">
                    <View style={styles.serviceForm}>
                        <Menu
                            visible={serviceMenuVisible}
                            onDismiss={() => setServiceMenuVisible(false)}
                            anchor={
                                <Button
                                    mode="outlined"
                                    onPress={() => setServiceMenuVisible(true)}
                                    style={styles.serviceTypeButton}
                                    icon="chevron-down"
                                    contentStyle={{flexDirection: 'row-reverse'}}
                                >
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
                                style={styles.actionButton}>
                                {editingServiceIndex !== null ? "Actualizar" : "Agregar Servicio"}
                            </Button>
                            {editingServiceIndex !== null && (
                                <Button mode="outlined" onPress={cancelEditService} icon="close" style={styles.actionButton}>
                                    Cancelar
                                </Button>
                            )}
                        </View>
                    </View>

                    {otherServices.length > 0 && (
                        <View style={styles.servicesContainer}>
                            <Divider style={styles.divider} />
                            <Text variant="titleSmall" style={styles.servicesTitle}>Agregados ({otherServices.length}):</Text>
                            {otherServices.map((service, index) => (
                                <ServiceItem key={index} service={service} index={index} onRemove={removeService} onEdit={editService} />
                            ))}
                        </View>
                    )}
                </AccordionSection>

                <AccordionSection title="Testigos" icon="account-eye-outline">
                    <View style={styles.personForm}>
                        <TextInput label="Nombre" value={newWitness.name} onChangeText={(text) => setNewWitness((prev) => ({ ...prev, name: text }))} mode="outlined" style={styles.input} left={<TextInput.Icon icon="account" />} />
                        <View style={styles.rowInputs}>
                            <TextInput label="Edad" value={newWitness.age} onChangeText={(text) => setNewWitness((prev) => ({ ...prev, age: text }))} mode="outlined" keyboardType="numeric" style={[styles.input, {flex: 1, marginRight: 8}]} />
                            <TextInput label="DNI" value={newWitness.dni} onChangeText={(text) => setNewWitness((prev) => ({ ...prev, dni: text }))} mode="outlined" keyboardType="numeric" style={[styles.input, {flex: 2}]} left={<TextInput.Icon icon="card-account-details" />} />
                        </View>
                        <SegmentedButtons
                            value={newWitness.gender}
                            onValueChange={(value) => setNewWitness((prev) => ({ ...prev, gender: value }))}
                            buttons={genderOptions}
                            style={styles.input}
                        />
                        <TextInput label="Descripción (opcional)" value={newWitness.description} onChangeText={(text) => setNewWitness((prev) => ({ ...prev, description: text }))} mode="outlined" multiline numberOfLines={2} style={styles.input} />

                        <View style={styles.buttonRow}>
                            <Button mode={editingWitnessIndex !== null ? "contained" : "contained-tonal"} onPress={addWitness} icon={editingWitnessIndex !== null ? "check" : "plus"} style={styles.actionButton}>
                                {editingWitnessIndex !== null ? "Actualizar" : "Agregar Testigo"}
                            </Button>
                            {editingWitnessIndex !== null && (
                                <Button mode="outlined" onPress={cancelEditWitness} icon="close" style={styles.actionButton}>Cancelar</Button>
                            )}
                        </View>
                    </View>

                    {witnesses.length > 0 && (
                        <View style={styles.servicesContainer}>
                            <Divider style={styles.divider} />
                            <Text variant="titleSmall" style={styles.servicesTitle}>Agregados ({witnesses.length}):</Text>
                            {witnesses.map((witness, index) => (
                                <WitnessItem key={index} witness={witness} index={index} onRemove={removeWitness} onEdit={editWitness} />
                            ))}
                        </View>
                    )}
                </AccordionSection>

                <AccordionSection title="Víctimas" icon="account-injury-outline">
                    <View style={styles.personForm}>
                        <TextInput label="Nombre" value={newVictim.name} onChangeText={(text) => setNewVictim((prev) => ({ ...prev, name: text }))} mode="outlined" style={styles.input} left={<TextInput.Icon icon="account" />} />
                        <View style={styles.rowInputs}>
                            <TextInput label="Edad" value={newVictim.age} onChangeText={(text) => setNewVictim((prev) => ({ ...prev, age: text }))} mode="outlined" keyboardType="numeric" style={[styles.input, {flex: 1, marginRight: 8}]} />
                            <TextInput label="DNI" value={newVictim.dni} onChangeText={(text) => setNewVictim((prev) => ({ ...prev, dni: text }))} mode="outlined" keyboardType="numeric" style={[styles.input, {flex: 2}]} left={<TextInput.Icon icon="card-account-details" />} />
                        </View>
                        <SegmentedButtons
                            value={newVictim.gender}
                            onValueChange={(value) => setNewVictim((prev) => ({ ...prev, gender: value }))}
                            buttons={genderOptions}
                            style={styles.input}
                        />
                        <TextInput label="Descripción (lesiones, etc.)" value={newVictim.description} onChangeText={(text) => setNewVictim((prev) => ({ ...prev, description: text }))} mode="outlined" multiline numberOfLines={2} style={styles.input} left={<TextInput.Icon icon="hospital-box" />} />

                        <View style={styles.buttonRow}>
                            <Button mode={editingVictimIndex !== null ? "contained" : "contained-tonal"} onPress={addVictim} icon={editingVictimIndex !== null ? "check" : "plus"} style={styles.actionButton}>
                                {editingVictimIndex !== null ? "Actualizar" : "Agregar Víctima"}
                            </Button>
                            {editingVictimIndex !== null && (
                                <Button mode="outlined" onPress={cancelEditVictim} icon="close" style={styles.actionButton}>Cancelar</Button>
                            )}
                        </View>
                    </View>

                    {victims.length > 0 && (
                        <View style={styles.servicesContainer}>
                            <Divider style={styles.divider} />
                            <Text variant="titleSmall" style={styles.servicesTitle}>Agregados ({victims.length}):</Text>
                            {victims.map((victim, index) => (
                                <VictimItem key={index} victim={victim} index={index} onRemove={removeVictim} onEdit={editVictim} />
                            ))}
                        </View>
                    )}
                </AccordionSection>

                <AccordionSection title="Notas de Campo" icon="notebook-edit-outline">
                    <TextInput
                        label="Redacción del hecho"
                        placeholder="Redactar detalles relevantes..."
                        value={fieldNotes}
                        onChangeText={setFieldNotes}
                        mode="outlined"
                        multiline
                        numberOfLines={6}
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
                    style={styles.submitButton}>
                    {isEditing ? "Actualizar Intervención" : "Guardar Intervención"}
                </Button>
            </Surface>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingTop: 16,
        paddingBottom: 100, // Espacio para el sticky footer
    },
    input: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    rowInputs: {
        flexDirection: 'row',
        alignItems: 'center',
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
    nowButton: {
        marginLeft: 8,
    },
    typeContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 8,
    },
    typeChip: {
        margin: 4,
        borderRadius: 20,
    },
    serviceForm: {
        marginBottom: 8,
    },
    personForm: {
        marginBottom: 8,
    },
    serviceTypeButton: {
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    servicesContainer: {
        marginTop: 8,
    },
    servicesTitle: {
        marginBottom: 12,
        color: "#757575",
    },
    personItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 12,
        marginBottom: 12,
        borderRadius: 12,
    },
    personIcon: {
        marginRight: 8,
    },
    personInfo: {
        flex: 1,
    },
    description: {
        color: "#666",
        marginTop: 2,
    },
    itemActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    divider: {
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        borderRadius: 8,
    },
    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    submitButton: {
        borderRadius: 8,
        paddingVertical: 4,
    },
});

export default InterventionFormScreen;
