import React, { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
    Card,
    Title,
    Paragraph,
    FAB,
    Searchbar,
    Chip,
    Text,
    Avatar,
    useTheme,
} from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";
import { InterventionType } from "../types";

const getTypeIcon = (type) => {
    switch (type) {
        case InterventionType.FIRE:
        case "Incendio":
            return "fire";
        case InterventionType.RESCUE:
        case "Rescate":
            return "lifebuoy";
        case InterventionType.ACCIDENT:
        case "Accidente":
            return "car-emergency";
        case InterventionType.HAZMAT:
        case "Materiales Peligrosos":
            return "biohazard";
        default:
            return "alert-circle-outline";
    }
};

const getTypeColor = (type, theme) => {
    switch (type) {
        case InterventionType.FIRE:
        case "Incendio":
            return theme.colors.error;
        case InterventionType.RESCUE:
        case "Rescate":
            return theme.colors.primary;
        case InterventionType.ACCIDENT:
        case "Accidente":
            return theme.colors.secondary;
        default:
            return theme.colors.outline;
    }
};

const HomeScreen = ({ navigation }) => {
    const { interventions } = useDatabase();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState(null);
    const theme = useTheme();

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
                        <Chip mode="flat" compact style={styles.dateChip} textStyle={styles.dateChipText}>
                            {formatDate(item.createdAt)}
                        </Chip>
                    </View>
                    
                    <View style={styles.cardBody}>
                        <View style={styles.infoRow}>
                            <Avatar.Icon size={24} icon="map-marker" style={styles.smallIcon} color={theme.colors.outline} />
                            <Paragraph style={styles.address} numberOfLines={1}>{item.address || "Sin dirección"}</Paragraph>
                        </View>

                        <View style={styles.timeInfo}>
                            <View style={styles.timeItem}>
                                <Avatar.Icon size={20} icon="phone-incoming" style={styles.smallIcon} color={theme.colors.primary} />
                                <Text variant="bodySmall">{item.callTime || "--:--"}</Text>
                            </View>
                            <View style={styles.timeItem}>
                                <Avatar.Icon size={20} icon="truck-fast" style={styles.smallIcon} color={theme.colors.secondary} />
                                <Text variant="bodySmall">{item.departureTime || "--:--"}</Text>
                            </View>
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
            </View>

            {filteredInterventions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Avatar.Icon size={80} icon="folder-open-outline" style={styles.emptyIcon} color={theme.colors.outlineVariant} />
                    <Text variant="headlineSmall" style={styles.emptyTitle}>
                        No hay intervenciones
                    </Text>
                    <Text variant="bodyMedium" style={styles.emptySubtitle}>
                        {searchQuery || selectedType ? "Intenta con otra búsqueda o filtro." : "Presiona el botón + para crear tu primera intervención."}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredInterventions}
                    renderItem={renderIntervention}
                    keyExtractor={(item) => item.id?.toString() || ""}
                    contentContainerStyle={styles.listContainer}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        elevation: 2,
    },
    searchbar: {
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
    },
    filterContainer: {
        paddingHorizontal: 16,
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
        backgroundColor: "#FFFFFF",
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
        backgroundColor: "#f0f0f0",
    },
    dateChipText: {
        fontSize: 10,
    },
    cardBody: {
        paddingLeft: 44, // Align with title text
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
        color: "#424242",
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
        color: "#666",
        fontStyle: "italic",
        backgroundColor: "#f9f9f9",
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
        color: "#424242",
        fontWeight: "bold",
    },
    emptySubtitle: {
        textAlign: "center",
        color: "#757575",
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
