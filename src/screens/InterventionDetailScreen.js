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
} from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";
import { API_KEY } from "../../env";

const InterventionDetailScreen = ({ navigation, route }) => {
    const { getIntervention, deleteIntervention, updateIntervention } =
        useDatabase();
    const [generating, setGenerating] = useState(false);

    const intervention = getIntervention(route.params.id);

    if (!intervention) {
        return (
            <View style={styles.container}>
                <Text>Intervención no encontrada</Text>
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
            ]
        );
    };

    const generateReport = async () => {
        setGenerating(true);
        try {
            // Preparar datos para Gemini Flash 2.0
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
                                  }`
                          )
                          .join(", ")
                    : "Sin servicios registrados";

            const witnessesText =
                intervention.witnesses && intervention.witnesses.length > 0
                    ? intervention.witnesses
                          .map((w) => {
                              if (typeof w === "string") return w; // Compatibilidad con datos antiguos
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

            const prompt = `Redacta una nota de intervención de bomberos en el estilo y formato que usan los bomberos en Argentina. La nota debe ser un párrafo continuo SIN saltos de línea, escrito en minúsculas (excepto nombres propios y DNI), estilo narrativo directo.

CARACTERÍSTICAS DEL ESTILO:
- Comenzar con "al arribar al lugar" o similar
- Incluir TODOS los datos de personas con formato: "nombre completo dni número" o "nombre completo DNI: número"
- Mencionar números de móviles policiales o ambulancias si aplica (ej: "móvil 3942", "ambulancia 156")
- Describir acciones técnicas específicas (desplegar líneas, tramos, uso de herramientas)
- Usar lenguaje técnico pero con fluidez natural
- Finalizar con "se retorna a base" o "retorna base"
- Si hay novedades mencionarlas al final con "Novedad:" o "sin novedades"
- Escribir de forma continua, sin viñetas ni listas

DATOS DE LA INTERVENCIÓN:
Tipo: ${intervention.type}
Ubicación: ${intervention.address || "no especificada"}
Descripción: ${intervention.fieldNotes || "sin detalles adicionales"}

Servicios presentes: ${servicesText}

Testigos: ${witnessesText}

Víctimas: ${victimsText}

IMPORTANTE: 
- Integra TODOS los nombres y DNI en el texto de forma natural
- NO uses formato de lista ni viñetas
- NO uses mayúsculas excesivas
- Usa el estilo narrativo informal pero técnico de los bomberos argentinos
- Sé específico con las acciones realizadas según el tipo de intervención

Redacta la nota:`;
            let aiGeneratedReport = "";

            try {
                console.log("Generando informe con Gemini Flash 2.0...");
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
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
                                temperature: 0.7,
                                topK: 40,
                                topP: 0.95,
                                maxOutputTokens: 1024,
                            },
                        }),
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Error de API: ${response.status} - ${response.statusText}`
                    );
                }

                const data = await response.json();

                if (
                    data.candidates &&
                    data.candidates[0] &&
                    data.candidates[0].content
                ) {
                    aiGeneratedReport =
                        data.candidates[0].content.parts[0].text;
                    console.log("Informe generado exitosamente con IA");
                } else {
                    throw new Error("Respuesta inválida de la API");
                }
            } catch (apiError) {
                console.log(
                    "Error con API de Gemini, usando generación local:",
                    apiError.message
                );

                // Fallback: generar un informe narrativo local si la API falla
                const timeInfo = intervention.callTime
                    ? `el ${formatDate(intervention.createdAt)} a las ${
                          intervention.callTime
                      }`
                    : `el ${formatDate(intervention.createdAt)}`;
                const locationInfo = intervention.address
                    ? `en ${intervention.address}`
                    : "en la ubicación reportada";

                aiGeneratedReport += `Se recibió llamado de emergencia ${timeInfo} por ${intervention.type.toLowerCase()} ${locationInfo}. `;

                if (intervention.departureTime) {
                    aiGeneratedReport += `La salida se efectuó a las ${intervention.departureTime}. `;
                }

                if (intervention.fieldNotes) {
                    aiGeneratedReport += `${intervention.fieldNotes} `;
                } else {
                    aiGeneratedReport += `La intervención se desarrolló siguiendo los protocolos establecidos para este tipo de emergencia. `;
                }

                if (
                    intervention.otherServices &&
                    intervention.otherServices.length > 0
                ) {
                    const servicesList = intervention.otherServices.map(
                        (service) => {
                            let serviceDesc = service.type;
                            if (service.ids) serviceDesc += ` (${service.ids})`;
                            if (service.personnel)
                                serviceDesc += ` con personal ${service.personnel}`;
                            return serviceDesc;
                        }
                    );

                    if (servicesList.length === 1) {
                        aiGeneratedReport += `En la intervención participó ${servicesList[0]}. `;
                    } else {
                        aiGeneratedReport += `En la intervención participaron ${servicesList
                            .slice(0, -1)
                            .join(", ")} y ${
                            servicesList[servicesList.length - 1]
                        }. `;
                    }
                }

                if (intervention.witnesses.length > 0) {
                    if (intervention.witnesses.length === 1) {
                        aiGeneratedReport += `Se registró como testigo a ${intervention.witnesses[0]}. `;
                    } else {
                        aiGeneratedReport += `Se registraron como testigos a ${intervention.witnesses
                            .slice(0, -1)
                            .join(", ")} y ${
                            intervention.witnesses[
                                intervention.witnesses.length - 1
                            ]
                        }. `;
                    }
                }

                if (intervention.victims.length > 0) {
                    const victimsList = intervention.victims.map((v) =>
                        v.description ? `${v.name} (${v.description})` : v.name
                    );
                    if (victimsList.length === 1) {
                        aiGeneratedReport += `Se atendió a ${victimsList[0]}. `;
                    } else {
                        aiGeneratedReport += `Se atendió a ${victimsList
                            .slice(0, -1)
                            .join(", ")} y ${
                            victimsList[victimsList.length - 1]
                        }. `;
                    }
                } else {
                    aiGeneratedReport += `No se registraron víctimas en el incidente. `;
                }

                if (intervention.returnTime) {
                    aiGeneratedReport += `El regreso al cuartel se efectuó a las ${intervention.returnTime}.`;
                } else {
                    aiGeneratedReport += `La intervención se completó satisfactoriamente.`;
                }
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
            Alert.alert(
                "Error",
                "No se pudo generar el informe con IA. Verifica tu conexión a internet."
            );
        } finally {
            setGenerating(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.header}>
                        <Title style={styles.title}>{intervention.type}</Title>
                        <IconButton icon="delete" onPress={handleDelete} />
                    </View>
                    <Chip mode="outlined" style={styles.dateChip}>
                        {formatDate(intervention.createdAt)}
                    </Chip>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Title>Cronología</Title>
                    <View style={styles.timelineItem}>
                        <Text variant="labelMedium">Llamado:</Text>
                        <Text variant="bodyMedium">
                            {intervention.callTime}
                        </Text>
                    </View>
                    <View style={styles.timelineItem}>
                        <Text variant="labelMedium">Salida:</Text>
                        <Text variant="bodyMedium">
                            {intervention.departureTime}
                        </Text>
                    </View>
                    <View style={styles.timelineItem}>
                        <Text variant="labelMedium">Regreso:</Text>
                        <Text variant="bodyMedium">
                            {intervention.returnTime}
                        </Text>
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Title>Ubicación</Title>
                    <Paragraph>{intervention.address}</Paragraph>
                </Card.Content>
            </Card>

            {intervention.otherServices &&
                intervention.otherServices.length > 0 && (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Title>Servicios Intervinientes</Title>
                            {intervention.otherServices.map(
                                (service, index) => (
                                    <View
                                        key={index}
                                        style={styles.serviceItem}>
                                        <Text
                                            variant="bodyMedium"
                                            style={styles.serviceType}>
                                            {service.type}
                                        </Text>
                                        {service.ids && (
                                            <Text variant="bodySmall">
                                                IDs: {service.ids}
                                            </Text>
                                        )}
                                        {service.personnel && (
                                            <Text variant="bodySmall">
                                                Personal: {service.personnel}
                                            </Text>
                                        )}
                                        {index <
                                            intervention.otherServices.length -
                                                1 && (
                                            <Divider
                                                style={styles.serviceDivider}
                                            />
                                        )}
                                    </View>
                                )
                            )}
                        </Card.Content>
                    </Card>
                )}

            <Card style={styles.card}>
                <Card.Content>
                    <Title>Personas Involucradas</Title>

                    {intervention.witnesses &&
                        intervention.witnesses.length > 0 && (
                            <>
                                <Text
                                    variant="titleSmall"
                                    style={styles.sectionTitle}>
                                    Testigos
                                </Text>
                                {intervention.witnesses.map(
                                    (witness, index) => {
                                        // Compatibilidad con formato antiguo (string)
                                        if (typeof witness === "string") {
                                            return (
                                                <Chip
                                                    key={index}
                                                    style={styles.chip}>
                                                    {witness}
                                                </Chip>
                                            );
                                        }
                                        // Nuevo formato (objeto)
                                        return (
                                            <View
                                                key={index}
                                                style={styles.personCard}>
                                                <Text
                                                    variant="bodyLarge"
                                                    style={styles.personName}>
                                                    {witness.name ||
                                                        "Sin nombre"}
                                                </Text>
                                                {witness.age && (
                                                    <Text variant="bodySmall">
                                                        Edad: {witness.age}
                                                    </Text>
                                                )}
                                                {witness.dni && (
                                                    <Text variant="bodySmall">
                                                        DNI: {witness.dni}
                                                    </Text>
                                                )}
                                                {witness.gender && (
                                                    <Text variant="bodySmall">
                                                        Género: {witness.gender}
                                                    </Text>
                                                )}
                                                {witness.description && (
                                                    <Text
                                                        variant="bodySmall"
                                                        style={
                                                            styles.personDescription
                                                        }>
                                                        {witness.description}
                                                    </Text>
                                                )}
                                            </View>
                                        );
                                    }
                                )}
                            </>
                        )}

                    {intervention.victims &&
                        intervention.victims.length > 0 && (
                            <>
                                <Text
                                    variant="titleSmall"
                                    style={styles.sectionTitle}>
                                    Víctimas
                                </Text>
                                {intervention.victims.map((victim, index) => (
                                    <View key={index} style={styles.personCard}>
                                        <Text
                                            variant="bodyLarge"
                                            style={styles.personName}>
                                            {victim.name || "Sin nombre"}
                                        </Text>
                                        {victim.age && (
                                            <Text variant="bodySmall">
                                                Edad: {victim.age}
                                            </Text>
                                        )}
                                        {victim.dni && (
                                            <Text variant="bodySmall">
                                                DNI: {victim.dni}
                                            </Text>
                                        )}
                                        {victim.gender && (
                                            <Text variant="bodySmall">
                                                Género: {victim.gender}
                                            </Text>
                                        )}
                                        {victim.description && (
                                            <Text
                                                variant="bodySmall"
                                                style={
                                                    styles.personDescription
                                                }>
                                                {victim.description}
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </>
                        )}
                </Card.Content>
            </Card>

            {intervention.fieldNotes && (
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Notas de Campo</Title>
                        <Paragraph>{intervention.fieldNotes}</Paragraph>
                    </Card.Content>
                </Card>
            )}

            <View style={styles.buttonContainer}>
                <Button
                    mode="contained"
                    onPress={generateReport}
                    loading={generating}
                    disabled={generating}
                    icon="file-document"
                    style={styles.reportButton}>
                    {intervention.report
                        ? "Regenerar Informe"
                        : "Generar Informe con IA"}
                </Button>

                {intervention.report && intervention.id && (
                    <Button
                        mode="outlined"
                        onPress={() =>
                            navigation.navigate("Report", {
                                interventionId: intervention.id,
                                report: intervention.report,
                            })
                        }
                        icon="eye"
                        style={styles.viewReportButton}>
                        Ver Informe Existente
                    </Button>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    card: {
        margin: 16,
        marginBottom: 8,
        backgroundColor: "#FFFFFF",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        flex: 1,
    },
    dateChip: {
        alignSelf: "flex-start",
        marginTop: 8,
    },
    timelineItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
    },

    sectionTitle: {
        marginTop: 12,
        marginBottom: 4,
        color: "#d32f2f",
    },
    divider: {
        marginVertical: 12,
    },
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 4,
    },
    chip: {
        margin: 2,
    },
    personCard: {
        backgroundColor: "#f0f0f0",
        padding: 12,
        marginTop: 8,
        borderRadius: 8,
    },
    personName: {
        fontWeight: "bold",
        marginBottom: 4,
    },
    personDescription: {
        color: "#666",
        marginTop: 4,
        fontStyle: "italic",
    },
    victimItem: {
        backgroundColor: "#f0f0f0",
        padding: 8,
        marginTop: 4,
        borderRadius: 4,
    },
    victimDescription: {
        color: "#666",
        marginTop: 2,
    },
    buttonContainer: {
        padding: 16,
    },
    reportButton: {
        backgroundColor: "#d32f2f",
        marginBottom: 8,
    },
    viewReportButton: {
        borderColor: "#d32f2f",
    },
    serviceItem: {
        backgroundColor: "#f9f9f9",
        padding: 8,
        marginTop: 4,
        borderRadius: 4,
    },
    serviceType: {
        fontWeight: "bold",
        color: "#d32f2f",
    },
    serviceDivider: {
        marginVertical: 8,
    },
});

export default InterventionDetailScreen;
