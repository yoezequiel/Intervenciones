import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
    Card,
    Title,
    Text,
    Button,
    Avatar,
    Chip,
    Divider,
    List,
    IconButton,
    Surface,
    useTheme,
} from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";
import { CommunicationStatus } from "../types";

const STATUS_COLORS = {
    recibido: "#FF8F00",
    reportado: "#1565C0",
    desplazamiento: "#2E7D32",
};

const STATUS_LABELS = {
    recibido: "Recibido",
    reportado: "Reportado",
    desplazamiento: "Desplazado",
};

const STATUS_ICONS = {
    recibido: "phone-incoming",
    reportado: "clipboard-check",
    desplazamiento: "truck-fast",
};

const CommunicationDetailScreen = ({ navigation, route }) => {
    const { getCommunication, updateCommunication, deleteCommunication, getIntervention } =
        useDatabase();
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const [loading, setLoading] = useState(false);

    const communication = getCommunication(route.params.id);

    if (!communication) {
        return (
            <View style={[styles.container, styles.center]}>
                <Avatar.Icon
                    size={64}
                    icon="alert-circle-outline"
                    style={{ backgroundColor: "transparent" }}
                    color={theme.colors.outline}
                />
                <Text variant="titleMedium" style={{ color: theme.colors.outline, marginTop: 16 }}>
                    Comunicación no encontrada
                </Text>
            </View>
        );
    }

    const statusColor = STATUS_COLORS[communication.status] || theme.colors.outline;
    const linkedIntervention = communication.interventionId
        ? getIntervention(communication.interventionId)
        : null;

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    const handleMarkReported = async () => {
        setLoading(true);
        try {
            await updateCommunication(communication.id, { status: CommunicationStatus.REPORTED });
        } catch (e) {
            Alert.alert("Error", "No se pudo actualizar el estado");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateIntervention = () => {
        navigation.navigate("InterventionForm", {
            communicationId: communication.id,
            prefill: {
                callTime: communication.time,
                address: communication.address,
                type: communication.incidentType,
            },
        });
    };

    const handleDelete = () => {
        Alert.alert(
            "Confirmar eliminación",
            "¿Estás seguro de que quieres eliminar esta comunicación?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        await deleteCommunication(communication.id);
                        navigation.goBack();
                    },
                },
            ]
        );
    };

    const isDispatched = communication.status === CommunicationStatus.DISPATCHED;

    return (
        <View style={styles.mainContainer}>
            <ScrollView
                style={[styles.container, { backgroundColor: theme.colors.background }]}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <Card
                    style={[styles.card, { borderTopWidth: 6, borderTopColor: statusColor }]}
                    mode="elevated"
                    elevation={1}
                >
                    <Card.Content>
                        <View style={styles.headerRow}>
                            <View style={styles.headerLeft}>
                                <Avatar.Icon
                                    size={48}
                                    icon={STATUS_ICONS[communication.status] || "phone"}
                                    style={{ backgroundColor: statusColor + "22" }}
                                    color={statusColor}
                                />
                                <View style={styles.headerText}>
                                    <Title style={styles.title}>
                                        {communication.callerName || "Llamante desconocido"}
                                    </Title>
                                    {communication.callerPhone ? (
                                        <Text
                                            variant="bodyMedium"
                                            style={{ color: theme.colors.onSurfaceVariant }}
                                        >
                                            {communication.callerPhone}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
                            <View style={{ flexDirection: "row" }}>
                                <IconButton
                                    icon="pencil"
                                    onPress={() =>
                                        navigation.navigate("CommunicationForm", {
                                            communicationId: communication.id,
                                        })
                                    }
                                />
                                <IconButton
                                    icon="delete"
                                    iconColor={theme.colors.error}
                                    onPress={handleDelete}
                                    style={{ margin: 0 }}
                                />
                            </View>
                        </View>

                        <Chip
                            mode="flat"
                            icon={STATUS_ICONS[communication.status]}
                            style={[styles.statusChip, { backgroundColor: statusColor + "22" }]}
                            textStyle={[styles.statusChipText, { color: statusColor }]}
                        >
                            {STATUS_LABELS[communication.status] || communication.status}
                        </Chip>
                    </Card.Content>
                </Card>

                {/* Details */}
                <Card style={styles.card} mode="elevated" elevation={1}>
                    <Card.Content style={styles.noPad}>
                        <Title style={[styles.sectionTitle, { marginHorizontal: 16, marginTop: 16 }]}>
                            Detalles
                        </Title>
                        <List.Item
                            title="Hora del llamado"
                            description={communication.time || "--:--"}
                            left={props => (
                                <List.Icon {...props} icon="clock-outline" color={theme.colors.primary} />
                            )}
                        />
                        <Divider />
                        <List.Item
                            title="Fecha de registro"
                            description={formatDate(communication.createdAt)}
                            left={props => (
                                <List.Icon {...props} icon="calendar" color={theme.colors.primary} />
                            )}
                        />
                        {communication.address ? (
                            <>
                                <Divider />
                                <List.Item
                                    title="Dirección"
                                    description={communication.address}
                                    left={props => (
                                        <List.Icon {...props} icon="map-marker" color={theme.colors.primary} />
                                    )}
                                />
                            </>
                        ) : null}
                        {communication.incidentType ? (
                            <>
                                <Divider />
                                <List.Item
                                    title="Tipo de incidente"
                                    description={communication.incidentType}
                                    left={props => (
                                        <List.Icon {...props} icon="tag" color={theme.colors.secondary} />
                                    )}
                                />
                            </>
                        ) : null}
                    </Card.Content>
                </Card>

                {/* Notes */}
                {communication.notes ? (
                    <Card style={styles.card} mode="elevated" elevation={1}>
                        <Card.Content>
                            <Title style={styles.sectionTitle}>Observaciones</Title>
                            <Surface style={styles.notesSurface} elevation={0}>
                                <Text variant="bodyLarge" style={styles.notesText}>
                                    {communication.notes}
                                </Text>
                            </Surface>
                        </Card.Content>
                    </Card>
                ) : null}

                {/* Linked intervention */}
                {linkedIntervention ? (
                    <Card style={styles.card} mode="elevated" elevation={1}>
                        <Card.Content style={styles.noPad}>
                            <Title
                                style={[styles.sectionTitle, { marginHorizontal: 16, marginTop: 16 }]}
                            >
                                Intervención Vinculada
                            </Title>
                            <List.Item
                                title={linkedIntervention.type}
                                description={`${linkedIntervention.address || "Sin dirección"}  •  ${formatDate(linkedIntervention.createdAt)}`}
                                left={props => (
                                    <List.Icon {...props} icon="fire-truck" color={theme.colors.primary} />
                                )}
                                right={props => (
                                    <IconButton
                                        {...props}
                                        icon="chevron-right"
                                        onPress={() =>
                                            navigation.navigate("InterventionDetail", {
                                                id: linkedIntervention.id,
                                            })
                                        }
                                    />
                                )}
                                onPress={() =>
                                    navigation.navigate("InterventionDetail", {
                                        id: linkedIntervention.id,
                                    })
                                }
                            />
                        </Card.Content>
                    </Card>
                ) : null}
            </ScrollView>

            {/* Action footer */}
            <Surface style={styles.footer} elevation={4}>
                {communication.status === CommunicationStatus.RECEIVED && (
                    <Button
                        mode="contained-tonal"
                        onPress={handleMarkReported}
                        loading={loading}
                        disabled={loading}
                        icon="clipboard-check"
                        style={styles.footerBtn}
                    >
                        Marcar como Reportado
                    </Button>
                )}
                {!isDispatched && (
                    <Button
                        mode="contained"
                        onPress={handleCreateIntervention}
                        icon="truck-fast"
                        style={[
                            styles.footerBtn,
                            {
                                marginTop: communication.status === CommunicationStatus.RECEIVED ? 10 : 0,
                                backgroundColor: "#2E7D32",
                            },
                        ]}
                    >
                        Crear Intervención
                    </Button>
                )}
                {linkedIntervention ? (
                    <Button
                        mode="outlined"
                        onPress={() =>
                            navigation.navigate("InterventionDetail", { id: linkedIntervention.id })
                        }
                        icon="fire-truck"
                        style={[styles.footerBtn, { marginTop: 10 }]}
                    >
                        Ver Intervención Vinculada
                    </Button>
                ) : null}
            </Surface>
        </View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    mainContainer: { flex: 1 },
    container: { flex: 1 },
    center: { justifyContent: "center", alignItems: "center" },
    scrollContent: { padding: 16, paddingBottom: 24 },
    card: { marginBottom: 16, borderRadius: 12, overflow: "hidden" },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
    headerText: { marginLeft: 12, flex: 1 },
    title: { fontSize: 20, fontWeight: "bold" },
    statusChip: { alignSelf: "flex-start", marginTop: 12, borderRadius: 12 },
    statusChipText: { fontSize: 12, fontWeight: "bold" },
    sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8, color: theme.colors.onSurface },
    noPad: { paddingHorizontal: 0, paddingBottom: 8 },
    notesSurface: {
        padding: 16,
        borderRadius: 8,
        backgroundColor: theme.dark ? "#2d2000" : "#fff8e1",
        borderLeftWidth: 4,
        borderLeftColor: "#ffb300",
    },
    notesText: { color: theme.colors.onSurface, lineHeight: 22 },
    footer: {
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    footerBtn: { borderRadius: 8, paddingVertical: 4 },
});

export default CommunicationDetailScreen;
