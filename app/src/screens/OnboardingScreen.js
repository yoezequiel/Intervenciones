import React, { useState, useRef } from "react";
import {
    View,
    StyleSheet,
    Dimensions,
    FlatList,
    Animated,
    TouchableOpacity,
} from "react-native";
import { Text, Button, Icon, useTheme } from "react-native-paper";
import { useDatabase } from "../context/DatabaseContext";

const { width } = Dimensions.get("window");

const STEPS = [
    {
        key: "welcome",
        icon: "fire-truck",
        title: "Bienvenido a FireLog",
        description:
            "Tu diario de intervenciones. Registrá cada salida, gestioná comunicaciones y generá informes profesionales.",
    },
    {
        key: "interventions",
        icon: "clipboard-text",
        title: "Intervenciones",
        description:
            "Documentá cada intervención con tipo de incidente, dirección, tiempos, víctimas, testigos, fotos y notas de campo.",
    },
    {
        key: "communications",
        icon: "phone-log",
        title: "Comunicaciones",
        description:
            "Registrá las llamadas entrantes y vinculálas con una intervención cuando el equipo sale al terreno.",
    },
    {
        key: "reports",
        icon: "file-pdf-box",
        title: "Informes y PDF",
        description:
            "Generá informes profesionales en segundos. Con IA de Gemini si tenés API key, o con generación local.",
    },
    {
        key: "firesync",
        icon: "cloud-sync",
        title: "FireSync",
        description:
            "Respaldo seguro en la nube. Tus datos se cifran antes de guardarse y sólo vos podés acceder a ellos. Podés activarlo cuando quieras desde Configuración.",
        isFinalStep: true,
    },
];

const OnboardingScreen = ({ navigation }) => {
    const theme = useTheme();
    const { setSetting } = useDatabase();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const styles = createStyles(theme);

    const goToNext = () => {
        if (currentIndex < STEPS.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        }
    };

    const handleFinish = async () => {
        await setSetting("onboarding_complete", "true");
        navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    };

    const handleActivateFireSync = async () => {
        await setSetting("onboarding_complete", "true");
        navigation.navigate("FireSyncAuth", { fromOnboarding: true });
    };

    const renderStep = ({ item }) => (
        <View style={styles.step}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                <Icon source={item.icon} size={72} color={theme.colors.primary} />
            </View>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
                {item.title}
            </Text>
            <Text variant="bodyLarge" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                {item.description}
            </Text>
        </View>
    );

    const isLast = currentIndex === STEPS.length - 1;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Animated.FlatList
                ref={flatListRef}
                data={STEPS}
                renderItem={renderStep}
                keyExtractor={(item) => item.key}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
            />

            {/* Indicadores de progreso */}
            <View style={styles.pagination}>
                {STEPS.map((_, i) => {
                    const dotWidth = scrollX.interpolate({
                        inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                        outputRange: [8, 24, 8],
                        extrapolate: "clamp",
                    });
                    const dotColor = scrollX.interpolate({
                        inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                        outputRange: [
                            theme.colors.outlineVariant,
                            theme.colors.primary,
                            theme.colors.outlineVariant,
                        ],
                        extrapolate: "clamp",
                    });
                    return (
                        <Animated.View
                            key={i}
                            style={[styles.dot, { width: dotWidth, backgroundColor: dotColor }]}
                        />
                    );
                })}
            </View>

            {/* Botones */}
            <View style={styles.buttons}>
                {isLast ? (
                    <>
                        <Button
                            mode="contained"
                            onPress={handleActivateFireSync}
                            style={styles.primaryBtn}
                            icon="cloud-sync"
                        >
                            Activar FireSync
                        </Button>
                        <Button
                            mode="text"
                            onPress={handleFinish}
                            textColor={theme.colors.onSurfaceVariant}
                        >
                            Omitir por ahora
                        </Button>
                    </>
                ) : (
                    <View style={styles.nextRow}>
                        <TouchableOpacity onPress={handleFinish}>
                            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                                Omitir
                            </Text>
                        </TouchableOpacity>
                        <Button mode="contained" onPress={goToNext} icon="arrow-right" contentStyle={styles.nextBtnContent}>
                            Siguiente
                        </Button>
                    </View>
                )}
            </View>
        </View>
    );
};

const createStyles = (theme) =>
    StyleSheet.create({
        container: { flex: 1 },
        step: {
            width,
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
            paddingTop: 60,
        },
        iconContainer: {
            width: 140,
            height: 140,
            borderRadius: 70,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
        },
        title: {
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 16,
        },
        description: {
            textAlign: "center",
            lineHeight: 26,
        },
        pagination: {
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            paddingBottom: 24,
            gap: 6,
        },
        dot: {
            height: 8,
            borderRadius: 4,
        },
        buttons: {
            paddingHorizontal: 24,
            paddingBottom: 40,
            gap: 8,
        },
        primaryBtn: {
            borderRadius: 12,
        },
        nextRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        nextBtnContent: {
            flexDirection: "row-reverse",
        },
    });

export default OnboardingScreen;
