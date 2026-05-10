import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Provider as PaperProvider, Icon, IconButton, useTheme } from "react-native-paper";
import { StatusBar, LogBox } from "react-native";
import { DatabaseProvider, useDatabase } from "./src/context/DatabaseContext";
import { firefighterTheme, darkFirefighterTheme } from "./src/theme";
import ErrorBoundary from "./src/components/ErrorBoundary";
import HomeScreen from "./src/screens/HomeScreen";
import InterventionFormScreen from "./src/screens/InterventionFormScreen";
import InterventionDetailScreen from "./src/screens/InterventionDetailScreen";
import ReportScreen from "./src/screens/ReportScreen";
import CommunicationListScreen from "./src/screens/CommunicationListScreen";
import CommunicationFormScreen from "./src/screens/CommunicationFormScreen";
import CommunicationDetailScreen from "./src/screens/CommunicationDetailScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

LogBox.ignoreLogs(["Setting a timer", "AsyncStorage has been extracted"]);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    const theme = useTheme();
    const isDark = theme.dark;
    const headerBg = isDark ? "#1a1a1a" : "#d32f2f";

    return (
        <Tab.Navigator
            screenOptions={({ navigation }) => ({
                tabBarIcon: ({ color, size }) => {
                    const icon =
                        navigation.getState().routes[navigation.getState().index]?.name ===
                        "Intervenciones"
                            ? "fire-truck"
                            : "phone-log";
                    return null; // handled per-screen below
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.outline,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.outlineVariant,
                    borderTopWidth: 1,
                    elevation: 8,
                },
                headerStyle: { backgroundColor: headerBg },
                headerTintColor: "#ffffff",
                headerTitleStyle: { fontWeight: "bold" },
                headerRight: () => (
                    <IconButton
                        icon="cog"
                        iconColor="#ffffff"
                        size={24}
                        onPress={() => navigation.navigate("Settings")}
                        style={{ marginRight: 4 }}
                    />
                ),
            })}
        >
            <Tab.Screen
                name="Intervenciones"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon source="fire-truck" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Comunicaciones"
                component={CommunicationListScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon source="phone-log" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

function AppContent() {
    const theme = useTheme();
    const isDark = theme.dark;
    const headerBg = isDark ? "#1a1a1a" : "#d32f2f";
    const [isReady, setIsReady] = React.useState(false);

    const HEADER_OPTS = {
        headerStyle: { backgroundColor: headerBg },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "bold" },
    };

    React.useEffect(() => {
        const init = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 800));
            } finally {
                setIsReady(true);
            }
        };
        init();
    }, []);

    if (!isReady) return null;

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Main">
                <Stack.Screen
                    name="Main"
                    component={MainTabs}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="InterventionForm"
                    component={InterventionFormScreen}
                    options={{ title: "Nueva Intervención", ...HEADER_OPTS }}
                />
                <Stack.Screen
                    name="InterventionDetail"
                    component={InterventionDetailScreen}
                    options={{ title: "Detalle de Intervención", ...HEADER_OPTS }}
                />
                <Stack.Screen
                    name="Report"
                    component={ReportScreen}
                    options={{ title: "Informe Generado", ...HEADER_OPTS }}
                />
                <Stack.Screen
                    name="CommunicationForm"
                    component={CommunicationFormScreen}
                    options={{ title: "Nueva Comunicación", ...HEADER_OPTS }}
                />
                <Stack.Screen
                    name="CommunicationDetail"
                    component={CommunicationDetailScreen}
                    options={{ title: "Detalle de Comunicación", ...HEADER_OPTS }}
                />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ title: "Configuración", ...HEADER_OPTS }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

function ThemedApp() {
    const { getSetting, isDbReady } = useDatabase();
    const isDark = isDbReady && getSetting("dark_mode") === "true";
    const theme = isDark ? darkFirefighterTheme : firefighterTheme;

    return (
        <PaperProvider theme={theme}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={isDark ? "#1a1a1a" : "#b71c1c"}
            />
            <AppContent />
        </PaperProvider>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <DatabaseProvider>
                <ThemedApp />
            </DatabaseProvider>
        </ErrorBoundary>
    );
}
