import React, { useState, useMemo, useEffect, useRef } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import {
    Card,
    Title,
    Paragraph,
    FAB,
    Searchbar,
    Chip,
    Text,
    Avatar,
    IconButton,
    useTheme,
} from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";
import { InterventionType } from "../types";
import { generateInterventionPDF } from "../utils/pdfGenerator";
import { useModal } from "../context/ModalContext";

const getTypeIcon = (type) => {
    switch (type) {
        case InterventionType.STRUCTURAL_FIRE:
        case InterventionType.FOREST_FIRE:
        case "Incendio":
            return "fire";
        case InterventionType.RESCUE:
        case "Rescate":
            return "lifebuoy";
        case InterventionType.TRAFFIC_ACCIDENT:
        case "Accidente":
            return "car-emergency";
        case InterventionType.OTHER:
        case "Materiales Peligrosos":
            return "biohazard";
        default:
            return "alert-circle-outline";
    }
};

const getTypeColor = (type, theme) => {
    switch (type) {
        case InterventionType.STRUCTURAL_FIRE:
        case InterventionType.FOREST_FIRE:
        case "Incendio":
            return theme.colors.error;
        case InterventionType.RESCUE:
        case "Rescate":
            return theme.colors.primary;
        case InterventionType.TRAFFIC_ACCIDENT:
        case "Accidente":
            return theme.colors.secondary;
        default:
            return theme.colors.outline;
    }
};

const HomeScreen = ({ navigation }) => {
    const { interventions, getCommunication, getSetting, setSetting, isDbReady } = useDatabase();
    const showModal = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState(null);
    const [generatingPdfId, setGeneratingPdfId] = useState(null);
    const [sortDesc, setSortDesc] = useState(true);
    const [visibleCount, setVisibleCount] = useState(15);
    const draftCheckedRef = useRef(false);

    useEffect(() => { setVisibleCount(15); }, [searchQuery, selectedType, sortDesc]);

    useEffect(() => {
        if (!isDbReady || draftCheckedRef.current) return;
        draftCheckedRef.current = true;

        const draftJson = getSetting("intervention_draft", "");
        if (!draftJson) return;

        let draft;
        try { draft = JSON.parse(draftJson); } catch {
            setSetting("intervention_draft", "").catch(() => {});
            return;
        }
        if (!draft?.savedAt) return;

        const d = new Date(draft.savedAt);
        const when = d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }) +
            " a las " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

        showModal({
            type: "confirm",
            title: "Borrador encontrado",
            message: `Tenés una intervención incompleta guardada el ${when}. ¿Querés retomar desde donde la dejaste?`,
            confirmLabel: "Retomar",
            cancelLabel: "Descartar",
            dismissable: false,
            onConfirm: () => navigation.navigate("InterventionForm", { draft }),
            onCancel: () => setSetting("intervention_draft", "").catch(() => {}),
        });
    }, [isDbReady]);
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const handleGeneratePdf = async (intervention) => {
        setGeneratingPdfId(intervention.id);
        const linkedCommunication = intervention.communicationId
            ? getCommunication(intervention.communicationId)
            : null;
        try {
            await generateInterventionPDF(intervention, linkedCommunication);
        } catch {
            showModal({ type: "error", title: "Error", message: "No se pudo generar el PDF." });
        } finally {
            setGeneratingPdfId(null);
        }
    };

    const filteredInterventions = interventions.filter((intervention) => {
        const matchesSearch =
            (intervention.address || "")
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            (intervention.fieldNotes || "")
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
        const matchesType = !selectedType || intervention.type === selectedType;
        return matchesSearch && matchesType;
    });

    const sortedInterventions = sortDesc
        ? filteredInterventions
        : [...filteredInterventions].reverse();

    const paginatedInterventions = sortedInterventions.slice(0, visibleCount);
    const hasMore = visibleCount < sortedInterventions.length;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderIntervention = ({ item }) => {
        const iconName = getTypeIcon(item.type);
        const iconColor = getTypeColor(item.type, theme);
        const isGeneratingThis = generatingPdfId === item.id;

        return (
            <Card
                style={[styles.card, { borderLeftColor: iconColor, borderLeftWidth: 4 }]}
                mode="elevated"
                elevation={1}
                onPress={() =>
                    item.id &&
                    navigation.navigate("InterventionDetail", { id: item.id })
                }>
                <Card.Content style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.titleRow}>
                            <Avatar.Icon size={36} icon={iconName} style={{backgroundColor: iconColor}} color="white" />
                            <Title style={styles.cardTitle}>{item.type}</Title>
                        </View>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            {isGeneratingThis ? (
                                <ActivityIndicator size="small" color={theme.colors.primary} style={{marginRight: 8}} />
                            ) : (
                                <IconButton 
                                    icon="file-pdf-box" 
                                    size={24} 
                                    iconColor={theme.colors.primary} 
                                    onPress={() => handleGeneratePdf(item)}
                                    style={{margin: 0, padding: 0}}
                                />
                            )}
                            <Chip mode="flat" compact style={styles.dateChip} textStyle={styles.dateChipText}>
                                {formatDate(item.createdAt)}
                            </Chip>
                        </View>
                    </View>
                    
                    <View style={styles.cardBody}>
                        <View style={styles.infoRow}>
                            <Avatar.Icon size={24} icon="map-marker" style={styles.smallIcon} color={theme.colors.outline} />
                            <Paragraph style={styles.address} numberOfLines={1}>{item.address || "Sin dirección"}</Paragraph>
                        </View>

                        {item.fieldNotes && (
                            <Paragraph numberOfLines={2} style={styles.notes}>
                                "{item.fieldNotes}"
                            </Paragraph>
                        )}
                    </View>
                </Card.Content>
            </Card>
        );
    };

    const typeFilters = Object.values(InterventionType);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.headerContainer}>
                <Searchbar
                    placeholder="Buscar intervenciones..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                    elevation={0}
                    iconColor={theme.colors.primary}
                />

                <View style={styles.filterContainer}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={typeFilters}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <Chip
                                mode={selectedType === item ? "flat" : "outlined"}
                                selected={selectedType === item}
                                showSelectedOverlay={true}
                                onPress={() =>
                                    setSelectedType(
                                        selectedType === item ? null : item
                                    )
                                }
                                style={styles.filterChip}>
                                {item}
                            </Chip>
                        )}
                    />
                </View>
                <View style={styles.countRow}>
                    <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {sortedInterventions.length} intervención{sortedInterventions.length !== 1 ? "es" : ""}
                    </Text>
                    <IconButton
                        icon={sortDesc ? "sort-calendar-descending" : "sort-calendar-ascending"}
                        size={20}
                        iconColor={theme.colors.primary}
                        onPress={() => setSortDesc(v => !v)}
                        style={{ margin: 0 }}
                    />
                </View>
            </View>

            {filteredInterventions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Avatar.Icon size={80} icon="folder-open-outline" style={styles.emptyIcon} color={theme.colors.outlineVariant} />
                    <Text variant="headlineSmall" style={styles.emptyTitle}>
                        No hay intervenciones
                    </Text>
                    <Text variant="bodyMedium" style={styles.emptySubtitle}>
                        {searchQuery || selectedType ? "Intenta con otra búsqueda o filtro." : "Presioná el botón + para crear tu primera intervención."}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={paginatedInterventions}
                    renderItem={renderIntervention}
                    keyExtractor={(item) => item.id?.toString() || ""}
                    contentContainerStyle={styles.listContainer}
                    onEndReached={() => {
                        if (hasMore) setVisibleCount(v => Math.min(v + 15, sortedInterventions.length));
                    }}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={hasMore
                        ? <ActivityIndicator size="small" color={theme.colors.primary} style={{ paddingVertical: 16 }} />
                        : null
                    }
                />
            )}

            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color={theme.colors.onPrimary}
                onPress={() => navigation.navigate("InterventionForm")}
                mode="elevated"
            />
        </View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outlineVariant,
        elevation: 2,
    },
    searchbar: {
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: 12,
    },
    filterContainer: {
        paddingHorizontal: 16,
    },
    countRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 4,
    },
    filterChip: {
        marginRight: 8,
        borderRadius: 20,
    },
    listContainer: {
        padding: 16,
        paddingTop: 16,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 16,
        borderRadius: 12,
    },
    cardContent: {
        padding: 12,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 8,
        flex: 1,
    },
    dateChip: {
        backgroundColor: theme.colors.surfaceVariant,
    },
    dateChipText: {
        fontSize: 10,
    },
    cardBody: {
        paddingLeft: 44,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    smallIcon: {
        backgroundColor: "transparent",
        margin: 0,
    },
    address: {
        fontSize: 14,
        color: theme.colors.onSurface,
        flex: 1,
    },
    timeInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        gap: 16,
    },
    timeItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    notes: {
        fontSize: 13,
        color: theme.colors.onSurfaceVariant,
        fontStyle: "italic",
        backgroundColor: theme.colors.surfaceVariant,
        padding: 8,
        borderRadius: 6,
        marginTop: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    emptyIcon: {
        backgroundColor: "transparent",
        marginBottom: 16,
    },
    emptyTitle: {
        textAlign: "center",
        marginBottom: 8,
        color: theme.colors.onSurface,
        fontWeight: "bold",
    },
    emptySubtitle: {
        textAlign: "center",
        color: theme.colors.onSurfaceVariant,
    },
    fab: {
        position: "absolute",
        margin: 16,
        right: 0,
        bottom: 16,
        borderRadius: 16,
    },
});

export default HomeScreen;
