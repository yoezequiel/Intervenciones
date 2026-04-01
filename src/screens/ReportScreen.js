import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Card, Title, Paragraph, Button, Text, Surface, useTheme } from "react-native-paper";
import { Share } from "react-native";

const ReportScreen = ({ navigation, route }) => {
    const { report, interventionId } = route.params;
    const theme = useTheme();

    const generatePDF = () => {
        Alert.alert("Exportar Informe", "¿Qué deseas hacer con el informe?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Compartir Texto", onPress: () => shareReport() },
        ]);
    };

    const shareReport = async () => {
        try {
            await Share.share({
                title: "Informe de Intervención",
                message: `--- INFORME DE INTERVENCIÓN ---\nID: ${interventionId}\n\n${report}`,
            });
        } catch (error) {
            Alert.alert("Error", "No se pudo compartir el informe");
        }
    };

    const copyToClipboard = () => {
        // En una implementación real, usarías Clipboard de React Native
        Alert.alert("Copiado", "El informe ha sido copiado al portapapeles");
    };

    return (
        <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Surface style={styles.documentSurface} elevation={2}>
                    <View style={styles.documentHeader}>
                        <Title style={styles.documentTitle}>INFORME DE INTERVENCIÓN</Title>
                        <Text variant="labelMedium" style={styles.documentMeta}>
                            ID DE REGISTRO: {interventionId || "N/A"}
                        </Text>
                        <Text variant="labelMedium" style={styles.documentMeta}>
                            FECHA DE EMISIÓN: {new Date().toLocaleDateString("es-ES")}
                        </Text>
                        <View style={styles.headerDivider} />
                    </View>

                    <Paragraph style={styles.reportContent}>
                        {report}
                    </Paragraph>

                    <View style={styles.documentFooter}>
                        <View style={styles.footerDivider} />
                        <Text variant="labelSmall" style={styles.footerText}>
                            DOCUMENTO GENERADO POR SISTEMA DE GESTIÓN DE INTERVENCIONES
                        </Text>
                    </View>
                </Surface>
            </ScrollView>

            <Surface style={styles.buttonContainer} elevation={4}>
                <View style={styles.buttonRow}>
                    <Button
                        mode="outlined"
                        onPress={copyToClipboard}
                        icon="content-copy"
                        style={styles.actionButton}>
                        Copiar
                    </Button>
                    <Button
                        mode="contained"
                        onPress={generatePDF}
                        icon="share-variant"
                        style={[styles.actionButton, {backgroundColor: theme.colors.primary}]}>
                        Compartir
                    </Button>
                </View>
                <Button
                    mode="text"
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}>
                    Volver al Detalle
                </Button>
            </Surface>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 16,
    },
    documentSurface: {
        backgroundColor: "#FFFFFF",
        padding: 24,
        borderRadius: 4, // Bordes menos redondeados para simular papel
        minHeight: 400,
    },
    documentHeader: {
        alignItems: "center",
        marginBottom: 24,
    },
    documentTitle: {
        fontSize: 18,
        fontWeight: "bold",
        letterSpacing: 1,
        color: "#1a1c1e",
        marginBottom: 8,
        textAlign: "center",
    },
    documentMeta: {
        color: "#757575",
        letterSpacing: 0.5,
    },
    headerDivider: {
        height: 2,
        backgroundColor: "#1a1c1e",
        width: "100%",
        marginTop: 16,
    },
    reportContent: {
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: 14,
        lineHeight: 24,
        color: "#212121",
        textAlign: "justify",
    },
    documentFooter: {
        marginTop: 40,
        alignItems: "center",
    },
    footerDivider: {
        height: 1,
        backgroundColor: "#e0e0e0",
        width: "60%",
        marginBottom: 8,
    },
    footerText: {
        color: "#9e9e9e",
        textAlign: "center",
        fontSize: 10,
    },
    buttonContainer: {
        padding: 16,
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 8,
    },
    actionButton: {
        flex: 1,
        borderRadius: 8,
    },
    backButton: {
        marginTop: 4,
    },
});

export default ReportScreen;
