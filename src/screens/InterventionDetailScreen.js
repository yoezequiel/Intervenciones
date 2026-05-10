import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, Alert, Image, Modal, TouchableWithoutFeedback, TouchableOpacity, Linking, Platform } from "react-native";
import {
    Card,
    Title,
    Paragraph,
    Button,
    Chip,
    Text,
    Divider,
    IconButton,
    Avatar,
    List,
    useTheme,
    Surface,
} from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";
import { InterventionType } from "../types";
import { generateInterventionPDF } from "../utils/pdfGenerator";

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

const InterventionDetailScreen = ({ navigation, route }) => {
    const { getIntervention, deleteIntervention, updateIntervention, getCommunication, getSetting } =
        useDatabase();
    const [generating, setGenerating] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const intervention = getIntervention(route.params.id);
    const linkedCommunication = intervention?.communicationId
        ? getCommunication(intervention.communicationId)
        : null;

    if (!intervention) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Avatar.Icon size={64} icon="alert-circle-outline" style={{backgroundColor: 'transparent'}} color={theme.colors.outline} />
                <Text variant="titleMedium" style={{color: theme.colors.outline, marginTop: 16}}>Intervención no encontrada</Text>
            </View>
        );
    }

    const handleGeneratePdf = async () => {
        setGeneratingPdf(true);
        try {
            await generateInterventionPDF(intervention, linkedCommunication);
        } catch (error) {
            Alert.alert("Error", "No se pudo generar el PDF");
        } finally {
            setGeneratingPdf(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleDelete = () => {
        Alert.alert(
            "Confirmar eliminación",
            "¿Estás seguro de que quieres eliminar esta intervención?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        await deleteIntervention(intervention.id);
                        navigation.goBack();
                    },
                },
            ],
        );
    };

    const openMap = () => {
        const { latitude, longitude, address } = intervention;
        const hasCoords = latitude != null && longitude != null;

        let url;
        if (hasCoords) {
            const label = encodeURIComponent("Intervención Bomberos");
            url = Platform.OS === "ios"
                ? `maps://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`
                : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
        } else if (address) {
            const encodedAddr = encodeURIComponent(address);
            url = Platform.OS === "ios"
                ? `maps://maps.apple.com/?q=${encodedAddr}`
                : `geo:0,0?q=${encodedAddr}`;
        } else {
            Alert.alert("Sin ubicación", "Esta intervención no tiene dirección ni coordenadas registradas.");
            return;
        }

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                const fallback = hasCoords
                    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
                Linking.openURL(fallback);
            }
        });
    };

    const generateReport = async () => {
        setGenerating(true);

        const API_KEY = getSetting("gemini_api_key", "");
        if (!API_KEY) {
            console.warn("API_KEY no configurada — se usará generación local");
        }

        try {
            const servicesText =
                intervention.otherServices &&
                intervention.otherServices.length > 0
                    ? intervention.otherServices
                          .map(
                              (service) =>
                                  `${service.type}${
                                      service.ids ? ` (${service.ids})` : ""
                                  }${
                                      service.personnel
                                          ? ` - Personal: ${service.personnel}`
                                          : ""
                                  }`,
                          )
                          .join(", ")
                    : "Sin servicios registrados";

            const witnessesText =
                intervention.witnesses && intervention.witnesses.length > 0
                    ? intervention.witnesses
                          .map((w) => {
                              if (typeof w === "string") return w; 
                              const parts = [];
                              if (w.name) parts.push(w.name);
                              if (w.age) parts.push(`${w.age} años`);
                              if (w.dni) parts.push(`DNI: ${w.dni}`);
                              if (w.gender) parts.push(w.gender);
                              if (w.description) parts.push(w.description);
                              return parts.join(", ");
                          })
                          .join("; ")
                    : "Sin testigos registrados";

            const victimsText =
                intervention.victims && intervention.victims.length > 0
                    ? intervention.victims
                          .map((v) => {
                              if (typeof v === "object" && v.name) {
                                  const parts = [v.name];
                                  if (v.age) parts.push(`${v.age} años`);
                                  if (v.dni) parts.push(`DNI: ${v.dni}`);
                                  if (v.gender) parts.push(v.gender);
                                  if (v.description) parts.push(v.description);
                                  return parts.join(", ");
                              }
                              return String(v);
                          })
                          .join("; ")
                    : "Sin víctimas registradas";

            const prompt = `Sos un bombero profesional redactando una nota de intervención oficial en Argentina. Redactá el informe siguiendo este formato estricto:

REGLAS CRÍTICAS:
1. USÁ ÚNICAMENTE los datos proporcionados abajo. 
2. SI FALTA INFORMACIÓN (nombres, DNI, móviles, acciones técnicas), NO LA INVENTES.
3. Si un dato no está presente, simplemente omitilo o redactá de forma genérica sin inventar detalles.
4. NUNCA menciones personas o móviles que no figuren en la sección "DATOS DE ESTA INTERVENCIÓN".

FORMATO DE REDACCIÓN:
- Comenzar con: "Al arribar al lugar se observa..." o "Al arribar a la escena..."
- Solo incluir nombres y DNI si están en los datos: "nombre apellido dni 12345678"
- Solo incluir móviles si están en los datos: "Móvil 3942 a cargo de ...", "Ambulancia 156 A cargo de ...", etc.
- Finalizar con "se retorna a base" o variante similar.
- Narrativa continua, sin viñetas ni listas.

ESTILO TÉCNICO:
- Lenguaje técnico bomberil: "desplegar líneas", "tendido de línea", "corte de suministro", "descarceración", "ventilación forzada".
- Mencionar herramientas específicas (solo si son coherentes con las notas): "motobomba", "autobomba", "escalera", "Holmatro", "canaleta".
- Narración en tercera persona o pasiva: "se procedió a", "se realizó", "se verificó".

DATOS DE ESTA INTERVENCIÓN (USAR SOLO ESTO):
Tipo: ${intervention.type}
Ubicación: ${intervention.address || "no especificada"}
Notas de campo: ${intervention.fieldNotes || "sin detalles adicionales"}
Servicios: ${servicesText}
Testigos: ${witnessesText}
Víctimas: ${victimsText}

INSTRUCCIONES FINALES:
1. Comenzá desde el arribo (NO mencionar fecha ni dirección en el cuerpo del texto).
2. Describí lo observado al arribar basándote estrictamente en las notas de campo.
3. Detallá las acciones técnicas realizadas basándote solo en lo registrado.
4. Mencioná servicios actuantes y móviles SOLO si están listados arriba.
5. Integrá los nombres y DNI proporcionados de forma natural.
6. Finalizá con retorno a base.`;
            
            let aiGeneratedReport = "";

            try {
                const MODEL_NAME = "gemini-3-flash-preview";
                
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    parts: [{ text: prompt }],
                                },
                            ],
                            generationConfig: {
                                temperature: 0.2,
                                topK: 40,
                                topP: 0.95,
                                maxOutputTokens: 2048,
                            },
                        }),
                    },
                );

                if (!response.ok) {
                    throw new Error(`Error de API: ${response.status} - ${response.statusText}`);
                }

                const data = await response.json();

                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    aiGeneratedReport = data.candidates[0].content.parts[0].text;
                } else {
                    throw new Error("Respuesta inválida de la API");
                }
            } catch (apiError) {
                console.error("Error con API de Gemini, usando generación local:", apiError.message);

                const timeInfo = intervention.callTime
                    ? `el ${formatDate(intervention.createdAt)} a las ${intervention.callTime}`
                    : `el ${formatDate(intervention.createdAt)}`;
                const locationInfo = intervention.address
                    ? `en ${intervention.address}`
                    : "en la ubicación reportada";

                aiGeneratedReport += `Se recibió llamado de emergencia ${timeInfo} por ${intervention.type.toLowerCase()} ${locationInfo}. `;

                if (intervention.departureTime) aiGeneratedReport += `La salida se efectuó a las ${intervention.departureTime}. `;
                if (intervention.fieldNotes) aiGeneratedReport += `${intervention.fieldNotes} `;
                else aiGeneratedReport += `La intervención se desarrolló siguiendo los protocolos establecidos para este tipo de emergencia. `;

                if (intervention.otherServices && intervention.otherServices.length > 0) {
                    const servicesList = intervention.otherServices.map((service) => {
                        let serviceDesc = service.type;
                        if (service.ids) serviceDesc += ` (${service.ids})`;
                        if (service.personnel) serviceDesc += ` con personal ${service.personnel}`;
                        return serviceDesc;
                    });
                    if (servicesList.length === 1) aiGeneratedReport += `En la intervención participó ${servicesList[0]}. `;
                    else aiGeneratedReport += `En la intervención participaron ${servicesList.slice(0, -1).join(", ")} y ${servicesList[servicesList.length - 1]}. `;
                }

                if (intervention.witnesses.length > 0) {
                    if (intervention.witnesses.length === 1) aiGeneratedReport += `Se registró como testigo a ${intervention.witnesses[0]}. `;
                    else aiGeneratedReport += `Se registraron como testigos a ${intervention.witnesses.slice(0, -1).join(", ")} y ${intervention.witnesses[intervention.witnesses.length - 1]}. `;
                }

                if (intervention.victims.length > 0) {
                    const victimsList = intervention.victims.map((v) => v.description ? `${v.name} (${v.description})` : v.name);
                    if (victimsList.length === 1) aiGeneratedReport += `Se atendió a ${victimsList[0]}. `;
                    else aiGeneratedReport += `Se atendió a ${victimsList.slice(0, -1).join(", ")} y ${victimsList[victimsList.length - 1]}. `;
                } else {
                    aiGeneratedReport += `No se registraron víctimas en el incidente. `;
                }

                if (intervention.returnTime) aiGeneratedReport += `El regreso al cuartel se efectuó a las ${intervention.returnTime}.`;
                else aiGeneratedReport += `La intervención se completó satisfactoriamente.`;
            }

            await updateIntervention(intervention.id, {
                report: aiGeneratedReport,
            });

            if (intervention.id) {
                navigation.navigate("Report", {
                    interventionId: intervention.id,
                    report: aiGeneratedReport,
                });
            }
        } catch (error) {
            Alert.alert("Error", "No se pudo generar el informe. Verifica tu conexión a internet.");
        } finally {
            setGenerating(false);
        }
    };

    const iconColor = getTypeColor(intervention.type, theme);
    const iconName = getTypeIcon(intervention.type);

    return (
        <View style={styles.mainContainer}>
            <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.scrollContent}>
                
                {/* Header Card */}
                <Card style={[styles.card, { borderTopWidth: 6, borderTopColor: iconColor }]} mode="elevated" elevation={1}>
                    <Card.Content>
                        <View style={styles.header}>
                            <View style={styles.headerTitleRow}>
                                <Avatar.Icon size={48} icon={iconName} style={{backgroundColor: theme.colors.surfaceVariant}} color={iconColor} />
                                <View style={styles.headerText}>
                                    <Title style={styles.title}>{intervention.type}</Title>
                                    <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
                                        {formatDate(intervention.createdAt)}
                                    </Text>
                                </View>
                            </View>
                            <View style={{flexDirection: 'row'}}>
                                <IconButton 
                                    icon="file-pdf-box" 
                                    iconColor={theme.colors.primary} 
                                    onPress={handleGeneratePdf} 
                                    disabled={generatingPdf}
                                />
                                <IconButton icon="delete" iconColor={theme.colors.error} onPress={handleDelete} style={styles.deleteBtn} />
                            </View>
                        </View>
                        
                        <TouchableOpacity onPress={openMap} activeOpacity={0.7}>
                            <View style={styles.addressRow}>
                                <Avatar.Icon size={32} icon="map-marker" style={styles.transparentIcon} color={theme.colors.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text variant="bodyLarge" style={styles.addressText}>
                                        {intervention.address || "Ubicación no especificada"}
                                    </Text>
                                    {intervention.latitude != null && (
                                        <Text variant="labelSmall" style={{ color: theme.colors.primary, marginTop: 2 }}>
                                            GPS precisión alta · {Number(intervention.latitude).toFixed(5)}, {Number(intervention.longitude).toFixed(5)}
                                        </Text>
                                    )}
                                </View>
                                <IconButton
                                    icon={intervention.latitude != null ? "map" : "map-search-outline"}
                                    iconColor={intervention.latitude != null ? theme.colors.primary : theme.colors.outline}
                                    size={22}
                                    onPress={openMap}
                                    style={{ margin: 0 }}
                                />
                            </View>
                        </TouchableOpacity>
                    </Card.Content>
                </Card>

                {/* Timeline Card */}
                <Card style={styles.card} mode="elevated" elevation={1}>
                    <Card.Content>
                        <Title style={styles.sectionTitle}>Cronología</Title>
                        <View style={styles.timelineContainer}>
                            <View style={styles.timelineLine} />
                            
                            <View style={styles.timelineItem}>
                                <Avatar.Icon size={28} icon="phone-incoming" style={[styles.timelineIcon, {backgroundColor: theme.colors.errorContainer}]} color={theme.colors.error} />
                                <View style={styles.timelineContent}>
                                    <Text variant="labelLarge" style={styles.timelineLabel}>Llamado</Text>
                                    <Text variant="bodyLarge">{intervention.callTime || "--:--"}</Text>
                                </View>
                            </View>

                            <View style={styles.timelineItem}>
                                <Avatar.Icon size={28} icon="truck-fast" style={[styles.timelineIcon, {backgroundColor: theme.colors.primaryContainer}]} color={theme.colors.primary} />
                                <View style={styles.timelineContent}>
                                    <Text variant="labelLarge" style={styles.timelineLabel}>Salida</Text>
                                    <Text variant="bodyLarge">{intervention.departureTime || "--:--"}</Text>
                                </View>
                            </View>

                            <View style={styles.timelineItem}>
                                <Avatar.Icon size={28} icon="home-import-outline" style={[styles.timelineIcon, {backgroundColor: theme.colors.secondaryContainer}]} color={theme.colors.secondary} />
                                <View style={styles.timelineContent}>
                                    <Text variant="labelLarge" style={styles.timelineLabel}>Regreso</Text>
                                    <Text variant="bodyLarge">{intervention.returnTime || "--:--"}</Text>
                                </View>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Multimedia Evidence */}
                {intervention.photos && intervention.photos.length > 0 && (
                    <Card style={styles.card} mode="elevated" elevation={1}>
                        <Card.Content>
                            <Title style={styles.sectionTitle}>Evidencia Multimedia</Title>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
                                {intervention.photos.map((uri, index) => (
                                    <TouchableOpacity key={index} onPress={() => setSelectedImage(uri)}>
                                        <Surface style={styles.photoWrapper} elevation={2}>
                                            <Image source={{ uri }} style={styles.photo} />
                                        </Surface>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </Card.Content>
                    </Card>
                )}

                {/* Field Notes */}
                {intervention.fieldNotes && (
                    <Card style={styles.card} mode="elevated" elevation={1}>
                        <Card.Content>
                            <Title style={styles.sectionTitle}>Notas de Campo</Title>
                            <Surface style={styles.notesSurface} elevation={0}>
                                <Text variant="bodyLarge" style={styles.notesText}>{intervention.fieldNotes}</Text>
                            </Surface>
                        </Card.Content>
                    </Card>
                )}

                {/* Services */}
                {intervention.otherServices && intervention.otherServices.length > 0 && (
                    <Card style={styles.card} mode="elevated" elevation={1}>
                        <Card.Content style={styles.noPaddingContent}>
                            <Title style={[styles.sectionTitle, {marginHorizontal: 16, marginTop: 16}]}>Servicios Intervinientes</Title>
                            {intervention.otherServices.map((service, index) => (
                                <List.Item
                                    key={index}
                                    title={service.type}
                                    description={`IDs: ${service.ids || 'N/A'} • Personal: ${service.personnel || 'N/A'}`}
                                    left={props => <List.Icon {...props} icon="account-hard-hat" color={theme.colors.primary} />}
                                    style={styles.listItem}
                                />
                            ))}
                        </Card.Content>
                    </Card>
                )}

                {/* People involved */}
                {((intervention.witnesses && intervention.witnesses.length > 0) || 
                  (intervention.victims && intervention.victims.length > 0)) && (
                    <Card style={styles.card} mode="elevated" elevation={1}>
                        <Card.Content style={styles.noPaddingContent}>
                            <Title style={[styles.sectionTitle, {marginHorizontal: 16, marginTop: 16}]}>Personas Involucradas</Title>

                            {intervention.victims && intervention.victims.length > 0 && (
                                <>
                                    <List.Subheader style={styles.subHeader}>Víctimas</List.Subheader>
                                    {intervention.victims.map((victim, index) => (
                                        <List.Item
                                            key={`v-${index}`}
                                            title={victim.name || "Sin nombre"}
                                            description={[
                                                victim.age ? `${victim.age} años` : null,
                                                victim.dni ? `DNI: ${victim.dni}` : null,
                                                victim.description
                                            ].filter(Boolean).join(" • ")}
                                            left={props => <List.Icon {...props} icon="account-injury" color={theme.colors.error} />}
                                            style={styles.listItem}
                                        />
                                    ))}
                                </>
                            )}

                            {intervention.witnesses && intervention.witnesses.length > 0 && (
                                <>
                                    <List.Subheader style={styles.subHeader}>Testigos</List.Subheader>
                                    {intervention.witnesses.map((witness, index) => {
                                        const isString = typeof witness === "string";
                                        const name = isString ? witness : (witness.name || "Sin nombre");
                                        const desc = isString ? null : [
                                            witness.age ? `${witness.age} años` : null,
                                            witness.dni ? `DNI: ${witness.dni}` : null,
                                            witness.description
                                        ].filter(Boolean).join(" • ");

                                        return (
                                            <List.Item
                                                key={`w-${index}`}
                                                title={name}
                                                description={desc}
                                                left={props => <List.Icon {...props} icon="account-eye" color={theme.colors.primary} />}
                                                style={styles.listItem}
                                            />
                                        );
                                    })}
                                </>
                            )}
                        </Card.Content>
                    </Card>
                )}
                {/* Linked communication */}
                {linkedCommunication && (
                    <Card style={styles.card} mode="elevated" elevation={1}>
                        <Card.Content style={styles.noPaddingContent}>
                            <Title style={[styles.sectionTitle, {marginHorizontal: 16, marginTop: 16}]}>
                                Comunicación Vinculada
                            </Title>
                            <List.Item
                                title={linkedCommunication.callerName || "Llamante desconocido"}
                                description={`${linkedCommunication.time || "--:--"}  •  ${linkedCommunication.address || "Sin dirección"}`}
                                left={props => (
                                    <List.Icon {...props} icon="phone-incoming" color={theme.colors.primary} />
                                )}
                                right={props => (
                                    <IconButton
                                        {...props}
                                        icon="chevron-right"
                                        onPress={() =>
                                            navigation.navigate("CommunicationDetail", {
                                                id: linkedCommunication.id,
                                            })
                                        }
                                    />
                                )}
                                onPress={() =>
                                    navigation.navigate("CommunicationDetail", {
                                        id: linkedCommunication.id,
                                    })
                                }
                                style={styles.listItem}
                            />
                        </Card.Content>
                    </Card>
                )}
            </ScrollView>

            {/* Sticky Action Footer */}
            <Surface style={styles.stickyFooter} elevation={4}>
                <View style={styles.buttonRow}>
                    <Button
                        mode="outlined"
                        onPress={() => navigation.navigate("InterventionForm", { interventionId: intervention.id })}
                        icon="pencil"
                        style={styles.flexButton}
                    >
                        Editar
                    </Button>
                    <Button
                        mode="contained"
                        onPress={generateReport}
                        loading={generating}
                        disabled={generating}
                        icon="file-document-auto"
                        style={[styles.flexButton, {backgroundColor: theme.colors.primary}]}
                    >
                        {intervention.report ? "Regenerar" : "Generar IA"}
                    </Button>
                </View>
                {intervention.report && intervention.id && (
                    <Button
                        mode="contained-tonal"
                        onPress={() => navigation.navigate("Report", { interventionId: intervention.id, report: intervention.report })}
                        icon="file-eye"
                        style={styles.viewReportButton}
                    >
                        Ver Informe Generado
                    </Button>
                )}
                <Button
                    mode="outlined"
                    onPress={handleGeneratePdf}
                    loading={generatingPdf}
                    disabled={generatingPdf}
                    icon="file-pdf-box"
                    style={styles.viewReportButton}
                    textColor={theme.colors.primary}
                >
                    Exportar PDF Profesional
                </Button>
            </Surface>

            {/* Image Viewer Modal */}
            <Modal
                visible={!!selectedImage}
                transparent={true}
                onRequestClose={() => setSelectedImage(null)}
                animationType="fade"
            >
                <TouchableWithoutFeedback onPress={() => setSelectedImage(null)}>
                    <View style={styles.modalContainer}>
                        <IconButton
                            icon="close"
                            iconColor="white"
                            size={30}
                            style={styles.closeButton}
                            onPress={() => setSelectedImage(null)}
                        />
                        {selectedImage && (
                            <Image
                                source={{ uri: selectedImage }}
                                style={styles.fullImage}
                                resizeMode="contain"
                            />
                        )}
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 24,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    headerText: {
        marginLeft: 12,
        flex: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        lineHeight: 26,
    },
    deleteBtn: {
        margin: 0,
    },
    addressRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        backgroundColor: theme.colors.surfaceVariant,
        padding: 8,
        borderRadius: 8,
    },
    transparentIcon: {
        backgroundColor: "transparent",
        marginRight: 8,
    },
    addressText: {
        flex: 1,
        color: theme.colors.onSurface,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16,
        color: theme.colors.onSurface,
    },
    timelineContainer: {
        paddingLeft: 8,
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        left: 22,
        top: 20,
        bottom: 20,
        width: 2,
        backgroundColor: theme.colors.outlineVariant,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'center',
    },
    timelineIcon: {
        zIndex: 1,
    },
    timelineContent: {
        marginLeft: 16,
        flex: 1,
    },
    timelineLabel: {
        color: theme.colors.onSurfaceVariant,
    },
    notesSurface: {
        padding: 16,
        borderRadius: 8,
        backgroundColor: theme.dark ? "#2d2000" : "#fff8e1",
        borderLeftWidth: 4,
        borderLeftColor: "#ffb300",
    },
    notesText: {
        color: theme.colors.onSurface,
        lineHeight: 22,
    },
    noPaddingContent: {
        paddingHorizontal: 0,
        paddingBottom: 8,
    },
    subHeader: {
        color: theme.colors.onSurfaceVariant,
        fontWeight: "bold",
    },
    listItem: {
        paddingLeft: 16,
        paddingRight: 16,
    },
    stickyFooter: {
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    flexButton: {
        flex: 1,
        borderRadius: 8,
    },
    viewReportButton: {
        marginTop: 12,
        borderRadius: 8,
    },
    photoList: {
        flexDirection: 'row',
        paddingVertical: 4,
    },
    photoWrapper: {
        marginRight: 12,
        borderRadius: 8,
        overflow: 'hidden',
    },
    photo: {
        width: 120,
        height: 120,
        resizeMode: 'cover',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
    },
});

export default InterventionDetailScreen;
