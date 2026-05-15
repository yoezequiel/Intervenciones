import React, { useState, useMemo, useEffect, useRef } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, TextInput } from "react-native";
import {
    Card, Title, Paragraph,
    FAB, Chip, Text, Avatar, IconButton, useTheme,
    TouchableRipple, Icon, Surface,
} from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";
import { InterventionType } from "../types";
import { generateInterventionPDF } from "../utils/pdfGenerator";
import { useModal } from "../context/ModalContext";

/* ─── Helpers originales ─────────────────────────────────────────────────── */

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

/* ─── Metadatos para filtros ─────────────────────────────────────────────── */

const TYPE_META = {
    [InterventionType.STRUCTURAL_FIRE]:  { icon: "fire",                          color: "#d32f2f", short: "Estructural" },
    [InterventionType.FOREST_FIRE]:      { icon: "tree-outline",                  color: "#e65100", short: "Forestal"    },
    [InterventionType.TRAFFIC_ACCIDENT]: { icon: "car-emergency",                 color: "#f57f17", short: "Accidente"   },
    [InterventionType.RESCUE]:           { icon: "lifebuoy",                      color: "#1565c0", short: "Rescate"     },
    [InterventionType.FALSE_ALARM]:      { icon: "alarm-off",                     color: "#616161", short: "Alarma"      },
    [InterventionType.SPECIAL_SERVICE]:  { icon: "star-circle-outline",           color: "#6a1b9a", short: "Especial"    },
    [InterventionType.OTHER]:            { icon: "dots-horizontal-circle-outline", color: "#37474f", short: "Otro"        },
};
const getMeta = (type) =>
    TYPE_META[type] ?? { icon: "alert-circle-outline", color: "#616161", short: type };

/* ─── FilterChip ─────────────────────────────────────────────────────────── */

function FilterChip({ type, selected, onPress }) {
    const theme = useTheme();
    const meta  = getMeta(type);
    return (
        <TouchableRipple
            onPress={onPress}
            borderless
            style={[
                filterChipStyles.chip,
                {
                    borderColor: selected ? meta.color : theme.colors.outlineVariant,
                    backgroundColor: selected ? meta.color + (theme.dark ? "40" : "18") : "transparent",
                },
            ]}
        >
            <View style={filterChipStyles.inner}>
                <Icon source={meta.icon} size={13} color={selected ? meta.color : theme.colors.onSurfaceVariant} />
                <Text
                    variant="labelMedium"
                    style={{ color: selected ? meta.color : theme.colors.onSurfaceVariant, fontWeight: selected ? "700" : "400" }}
                >
                    {meta.short}
                </Text>
            </View>
        </TouchableRipple>
    );
}
const filterChipStyles = StyleSheet.create({
    chip:  { borderWidth: 1.5, borderRadius: 20, marginRight: 7, overflow: "hidden" },
    inner: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6 },
});

/* ─── SortButton ─────────────────────────────────────────────────────────── */

function SortButton({ descending, onPress }) {
    const theme = useTheme();
    return (
        <TouchableRipple
            onPress={onPress}
            borderless
            style={[
                sortStyles.btn,
                { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant },
            ]}
        >
            <View style={sortStyles.inner}>
                <Icon
                    source={descending ? "sort-calendar-descending" : "sort-calendar-ascending"}
                    size={14}
                    color={theme.colors.primary}
                />
                <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: "600" }}>
                    {descending ? "Más recientes" : "Más antiguos"}
                </Text>
            </View>
        </TouchableRipple>
    );
}
const sortStyles = StyleSheet.create({
    btn:   { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
    inner: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5 },
});

/* ─── HomeScreen ─────────────────────────────────────────────────────────── */

const HomeScreen = ({ navigation }) => {
    const { interventions, getCommunication, getSetting, setSetting, isDbReady } = useDatabase();
    const showModal = useModal();
    const [searchQuery,     setSearchQuery]     = useState("");
    const [selectedType,    setSelectedType]    = useState(null);
    const [generatingPdfId, setGeneratingPdfId] = useState(null);
    const [sortDesc,        setSortDesc]        = useState(true);
    const [visibleCount,    setVisibleCount]    = useState(15);
    const [searchFocused,   setSearchFocused]   = useState(false);
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
            onCancel:  () => setSetting("intervention_draft", "").catch(() => {}),
        });
    }, [isDbReady]);

    const theme  = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const handleGeneratePdf = async (intervention) => {
        setGeneratingPdfId(intervention.id);
        const linkedCommunication = intervention.communicationId
            ? getCommunication(intervention.communicationId) : null;
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
            (intervention.address || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (intervention.fieldNotes || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !selectedType || intervention.type === selectedType;
        return matchesSearch && matchesType;
    });

    const sortedInterventions    = sortDesc ? filteredInterventions : [...filteredInterventions].reverse();
    const paginatedInterventions = sortedInterventions.slice(0, visibleCount);
    const hasMore                = visibleCount < sortedInterventions.length;
    const hasActiveFilter        = !!selectedType || !!searchQuery;

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString("es-ES", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });

    /* tarjetas — sin cambios respecto al original */
    const renderIntervention = ({ item }) => {
        const iconName = getTypeIcon(item.type);
        const iconColor = getTypeColor(item.type, theme);
        const isGeneratingThis = generatingPdfId === item.id;

        return (
            <Card
                style={[styles.card, { borderLeftColor: iconColor, borderLeftWidth: 4 }]}
                mode="elevated"
                elevation={1}
                onPress={() => item.id && navigation.navigate("InterventionDetail", { id: item.id })}
            >
                <Card.Content style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.titleRow}>
                            <Avatar.Icon size={36} icon={iconName} style={{ backgroundColor: iconColor }} color="white" />
                            <Title style={styles.cardTitle}>{item.type}</Title>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            {isGeneratingThis ? (
                                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />
                            ) : (
                                <IconButton
                                    icon="file-pdf-box"
                                    size={24}
                                    iconColor={theme.colors.primary}
                                    onPress={() => handleGeneratePdf(item)}
                                    style={{ margin: 0, padding: 0 }}
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
                            <Paragraph style={styles.address} numberOfLines={1}>
                                {item.address || "Sin dirección"}
                            </Paragraph>
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

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

            {/* ── Header mejorado ─────────────────────────────────────── */}
            <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={2}>

                {/* Barra de búsqueda */}
                <View style={[
                    styles.searchWrap,
                    {
                        borderColor: searchFocused ? theme.colors.primary : theme.colors.outlineVariant,
                        backgroundColor: theme.colors.surfaceVariant,
                    },
                ]}>
                    <Icon
                        source="magnify"
                        size={20}
                        color={searchFocused ? theme.colors.primary : theme.colors.outline}
                    />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        placeholder="Buscar por dirección o notas…"
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        selectionColor={theme.colors.primary}
                        returnKeyType="search"
                        style={[styles.searchInput, { color: theme.colors.onSurface }]}
                    />
                    {searchQuery ? (
                        <TouchableRipple
                            onPress={() => setSearchQuery("")}
                            borderless
                            style={styles.clearBtn}
                        >
                            <Icon source="close-circle" size={18} color={theme.colors.outline} />
                        </TouchableRipple>
                    ) : null}
                </View>

                {/* Filtros por tipo */}
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={Object.values(InterventionType)}
                    keyExtractor={t => t}
                    contentContainerStyle={styles.filterList}
                    renderItem={({ item }) => (
                        <FilterChip
                            type={item}
                            selected={selectedType === item}
                            onPress={() => setSelectedType(selectedType === item ? null : item)}
                        />
                    )}
                />

                {/* Conteo + orden */}
                <View style={styles.metaRow}>
                    <View style={styles.metaLeft}>
                        <Icon
                            source={hasActiveFilter ? "filter-check" : "format-list-bulleted"}
                            size={14}
                            color={hasActiveFilter ? theme.colors.primary : theme.colors.outline}
                        />
                        <Text
                            variant="labelMedium"
                            style={{
                                color: hasActiveFilter ? theme.colors.primary : theme.colors.onSurfaceVariant,
                                fontWeight: hasActiveFilter ? "700" : "400",
                            }}
                        >
                            {sortedInterventions.length} intervención{sortedInterventions.length !== 1 ? "es" : ""}
                            {selectedType ? ` · ${getMeta(selectedType).short}` : ""}
                        </Text>
                        {hasActiveFilter && (
                            <TouchableRipple
                                onPress={() => { setSearchQuery(""); setSelectedType(null); }}
                                borderless
                                style={styles.clearFilterBtn}
                            >
                                <Text variant="labelSmall" style={{ color: theme.colors.primary }}>Limpiar</Text>
                            </TouchableRipple>
                        )}
                    </View>
                    <SortButton descending={sortDesc} onPress={() => setSortDesc(v => !v)} />
                </View>
            </Surface>

            {/* ── Lista / Vacío ───────────────────────────────────────── */}
            {filteredInterventions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Avatar.Icon
                        size={80}
                        icon="folder-open-outline"
                        style={styles.emptyIcon}
                        color={theme.colors.outlineVariant}
                    />
                    <Text variant="headlineSmall" style={styles.emptyTitle}>
                        No hay intervenciones
                    </Text>
                    <Text variant="bodyMedium" style={styles.emptySubtitle}>
                        {searchQuery || selectedType
                            ? "Intenta con otra búsqueda o filtro."
                            : "Presioná el botón + para crear tu primera intervención."}
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

/* ─── Estilos ─────────────────────────────────────────────────────────────── */

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1 },

    /* header */
    header:         { paddingTop: 12, paddingBottom: 8 },
    searchWrap:     {
        flexDirection: "row", alignItems: "center",
        marginHorizontal: 14, borderRadius: 14,
        borderWidth: 1.5, height: 46,
        paddingHorizontal: 12, gap: 8,
        overflow: "hidden",
    },
    searchInput:    { flex: 1, fontSize: 14, paddingVertical: 0 },
    clearBtn:       {
        width: 28, height: 28, borderRadius: 14,
        alignItems: "center", justifyContent: "center",
    },
    filterList:     { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 2 },
    metaRow:        {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
    },
    metaLeft:       { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
    clearFilterBtn: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

    /* tarjetas — sin cambios */
    listContainer: { padding: 16, paddingTop: 16, paddingBottom: 80 },
    card:          { marginBottom: 16, borderRadius: 12 },
    cardContent:   { padding: 12 },
    cardHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    titleRow:      { flexDirection: "row", alignItems: "center", flex: 1 },
    cardTitle:     { fontSize: 16, fontWeight: "bold", marginLeft: 8, flex: 1 },
    dateChip:      { backgroundColor: theme.colors.surfaceVariant },
    dateChipText:  { fontSize: 10 },
    cardBody:      { paddingLeft: 44 },
    infoRow:       { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    smallIcon:     { backgroundColor: "transparent", margin: 0 },
    address:       { fontSize: 14, color: theme.colors.onSurface, flex: 1 },
    notes:         {
        fontSize: 13, color: theme.colors.onSurfaceVariant,
        fontStyle: "italic", backgroundColor: theme.colors.surfaceVariant,
        padding: 8, borderRadius: 6, marginTop: 4,
    },

    /* vacío */
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
    emptyIcon:      { backgroundColor: "transparent", marginBottom: 16 },
    emptyTitle:     { textAlign: "center", marginBottom: 8, color: theme.colors.onSurface, fontWeight: "bold" },
    emptySubtitle:  { textAlign: "center", color: theme.colors.onSurfaceVariant },

    fab: { position: "absolute", margin: 16, right: 0, bottom: 16, borderRadius: 16 },
});

export default HomeScreen;
