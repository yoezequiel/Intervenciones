import React, { useState, useMemo, useEffect } from "react";
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
    reportado: "clipboard-check-outline",
    desplazamiento: "truck-fast",
};

const CommunicationListScreen = ({ navigation }) => {
    const { communications } = useDatabase();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [sortDesc, setSortDesc] = useState(true);
    const [visibleCount, setVisibleCount] = useState(15);

    useEffect(() => { setVisibleCount(15); }, [searchQuery, selectedStatus, sortDesc]);
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    const filtered = communications.filter(comm => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            (comm.callerName || "").toLowerCase().includes(q) ||
            (comm.callerPhone || "").toLowerCase().includes(q) ||
            (comm.address || "").toLowerCase().includes(q) ||
            (comm.notes || "").toLowerCase().includes(q);
        const matchesStatus = !selectedStatus || comm.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    const statusFilters = Object.values(CommunicationStatus);

    const sortedComms = sortDesc ? filtered : [...filtered].reverse();
    const paginatedComms = sortedComms.slice(0, visibleCount);
    const hasMore = visibleCount < sortedComms.length;

    const renderItem = ({ item }) => {
        const statusColor = STATUS_COLORS[item.status] || theme.colors.outline;
        const statusIcon = STATUS_ICONS[item.status] || "phone";
        return (
            <Card
                style={[styles.card, { borderLeftColor: statusColor, borderLeftWidth: 4 }]}
                mode="elevated"
                elevation={1}
                onPress={() => navigation.navigate("CommunicationDetail", { id: item.id })}
            >
                <Card.Content style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.titleRow}>
                            <Avatar.Icon
                                size={36}
                                icon={statusIcon}
                                style={{ backgroundColor: statusColor }}
                                color="white"
                            />
                            <View style={styles.titleInfo}>
                                <Title style={styles.cardTitle}>
                                    {item.callerName || "Llamante desconocido"}
                                </Title>
                                {item.callerPhone ? (
                                    <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                                        {item.callerPhone}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                        <Chip
                            mode="flat"
                            compact
                            style={[styles.statusChip, { backgroundColor: statusColor + "22" }]}
                            textStyle={[styles.statusChipText, { color: statusColor }]}
                        >
                            {STATUS_LABELS[item.status] || item.status}
                        </Chip>
                    </View>

                    <View style={styles.cardBody}>
                        <View style={styles.infoRow}>
                            <Avatar.Icon size={24} icon="map-marker" style={styles.smallIcon} color={theme.colors.outline} />
                            <Paragraph style={styles.address} numberOfLines={1}>
                                {item.address || "Sin dirección"}
                            </Paragraph>
                        </View>
                        <View style={styles.infoRow}>
                            <Avatar.Icon size={24} icon="clock-outline" style={styles.smallIcon} color={theme.colors.primary} />
                            <Text variant="bodySmall">
                                {item.time || "--:--"}  •  {formatDate(item.createdAt)}
                            </Text>
                        </View>
                        {item.incidentType ? (
                            <View style={styles.infoRow}>
                                <Avatar.Icon size={24} icon="tag-outline" style={styles.smallIcon} color={theme.colors.secondary} />
                                <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                                    {item.incidentType}
                                </Text>
                            </View>
                        ) : null}
                        {item.notes ? (
                            <Paragraph numberOfLines={1} style={styles.notes}>
                                "{item.notes}"
                            </Paragraph>
                        ) : null}
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.headerContainer}>
                <Searchbar
                    placeholder="Buscar comunicaciones..."
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
                        data={statusFilters}
                        keyExtractor={item => item}
                        renderItem={({ item }) => (
                            <Chip
                                mode={selectedStatus === item ? "flat" : "outlined"}
                                selected={selectedStatus === item}
                                showSelectedOverlay
                                onPress={() =>
                                    setSelectedStatus(selectedStatus === item ? null : item)
                                }
                                style={[styles.filterChip, { borderColor: STATUS_COLORS[item] }]}
                                selectedColor={STATUS_COLORS[item]}
                            >
                                {STATUS_LABELS[item]}
                            </Chip>
                        )}
                    />
                </View>
                <View style={styles.countRow}>
                    <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {sortedComms.length} comunicación{sortedComms.length !== 1 ? "es" : ""}
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

            {filtered.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Avatar.Icon
                        size={80}
                        icon="phone-off-outline"
                        style={styles.emptyIcon}
                        color={theme.colors.outlineVariant}
                    />
                    <Text variant="headlineSmall" style={styles.emptyTitle}>
                        No hay comunicaciones
                    </Text>
                    <Text variant="bodyMedium" style={styles.emptySubtitle}>
                        {searchQuery || selectedStatus
                            ? "Intenta con otra búsqueda o filtro."
                            : "Presiona el botón + para registrar una comunicación."}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={paginatedComms}
                    renderItem={renderItem}
                    keyExtractor={item => item.id?.toString() || ""}
                    contentContainerStyle={styles.listContainer}
                    onEndReached={() => {
                        if (hasMore) setVisibleCount(v => Math.min(v + 15, sortedComms.length));
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
                onPress={() => navigation.navigate("CommunicationForm")}
                mode="elevated"
            />
        </View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1 },
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
    filterContainer: { paddingHorizontal: 16 },
    countRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 4,
    },
    filterChip: { marginRight: 8, borderRadius: 20 },
    listContainer: { padding: 16, paddingBottom: 80 },
    card: { marginBottom: 16, borderRadius: 12 },
    cardContent: { padding: 12 },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    titleRow: { flexDirection: "row", alignItems: "center", flex: 1 },
    titleInfo: { marginLeft: 8, flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: "bold" },
    statusChip: { borderRadius: 12, marginLeft: 4 },
    statusChipText: { fontSize: 11, fontWeight: "bold" },
    cardBody: { paddingLeft: 44 },
    infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
    smallIcon: { backgroundColor: "transparent", margin: 0 },
    address: { fontSize: 14, color: theme.colors.onSurface, flex: 1 },
    notes: {
        fontSize: 13,
        color: theme.colors.onSurfaceVariant,
        fontStyle: "italic",
        backgroundColor: theme.colors.surfaceVariant,
        padding: 8,
        borderRadius: 6,
        marginTop: 4,
    },
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
    emptyIcon: { backgroundColor: "transparent", marginBottom: 16 },
    emptyTitle: { textAlign: "center", marginBottom: 8, color: theme.colors.onSurface, fontWeight: "bold" },
    emptySubtitle: { textAlign: "center", color: theme.colors.onSurfaceVariant },
    fab: { position: "absolute", margin: 16, right: 0, bottom: 16, borderRadius: 16 },
});

export default CommunicationListScreen;
