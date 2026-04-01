import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
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
import { API_KEY } from "../../env";
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

const InterventionDetailScreen = ({ navigation, route }) => {
    const { getIntervention, deleteIntervention, updateIntervention } =
        useDatabase();
    const [generating, setGenerating] = useState(false);
    const theme = useTheme();

    const intervention = getIntervention(route.params.id);

    if (!intervention) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Avatar.Icon size={64} icon="alert-circle-outline" style={{backgroundColor: 'transparent'}} color={theme.colors.outline} />
                <Text variant="titleMedium" style={{color: theme.colors.outline, marginTop: 16}}>Intervención no encontrada</Text>
            </View>
        );
    }

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

    const generateReport = async () => {
        setGenerating(true);

        console.log("API_KEY disponible:", API_KEY ? "SÍ" : "NO");

        if (!API_KEY || API_KEY === "undefined" || API_KEY === "") {
            console.error("API_KEY no está configurada correctamente");
            Alert.alert(
                "Error de configuración",
                "La clave de API no está configurada. La aplicación usará la generación local de informes.",
            );
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

                if (API_KEY && API_KEY !== "undefined" && API_KEY !== "") {
                    Alert.alert(
                        "Aviso",
                        "No se pudo conectar con la IA. Se generará un informe básico.",
                        [{ text: "Entendido" }],
                    );
                }

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
                            <IconButton icon="delete" iconColor={theme.colors.error} onPress={handleDelete} style={styles.deleteBtn} />
                        </View>
                        
                        <View style={styles.addressRow}>
                            <Avatar.Icon size={32} icon="map-marker" style={styles.transparentIcon} color={theme.colors.primary} />
                            <Text variant="bodyLarge" style={styles.addressText}>{intervention.address || "Ubicación no especificada"}</Text>
                        </View>
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
            </Surface>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 120, // Espacio para el footer
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
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
        backgroundColor: "#f5f5f5",
        padding: 8,
        borderRadius: 8,
    },
    transparentIcon: {
        backgroundColor: "transparent",
        marginRight: 8,
    },
    addressText: {
        flex: 1,
        color: "#424242",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16,
        color: "#1a1c1e",
    },
    
    // Timeline Styles
    timelineContainer: {
        paddingLeft: 8,
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        left: 22, // 8 (padding) + 14 (half icon size)
        top: 20,
        bottom: 20,
        width: 2,
        backgroundColor: '#e0e0e0',
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
        color: '#757575',
    },
    
    // Notes
    notesSurface: {
        padding: 16,
        borderRadius: 8,
        backgroundColor: "#fff8e1", // Subtle yellow/warm tint for notes
        borderLeftWidth: 4,
        borderLeftColor: "#ffb300",
    },
    notesText: {
        color: "#424242",
        lineHeight: 22,
    },

    // Lists
    noPaddingContent: {
        paddingHorizontal: 0,
        paddingBottom: 8,
    },
    subHeader: {
        color: "#757575",
        fontWeight: "bold",
    },
    listItem: {
        paddingLeft: 16,
        paddingRight: 16,
    },

    // Footer
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
});

export default InterventionDetailScreen;
