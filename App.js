import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar, LogBox } from "react-native";
import { DatabaseProvider } from "./src/context/DatabaseContext";
import ErrorBoundary from "./src/components/ErrorBoundary";
import HomeScreen from "./src/screens/HomeScreen";
import InterventionFormScreen from "./src/screens/InterventionFormScreen";
import InterventionDetailScreen from "./src/screens/InterventionDetailScreen";
import ReportScreen from "./src/screens/ReportScreen";

// Ignorar logs específicos si es necesario
LogBox.ignoreLogs(["Setting a timer", "AsyncStorage has been extracted"]);

const Stack = createStackNavigator();

// Componente de carga inicial
function LoadingScreen() {
    return null; // O un componente de carga personalizado
}

function AppContent() {
    const [isReady, setIsReady] = React.useState(false);
    const [initialRoute, setInitialRoute] = React.useState("Loading");

    React.useEffect(() => {
        // Aquí podrías agregar lógica de inicialización
        const initializeApp = async () => {
            try {
                // Inicialización de la aplicación
                // Por ejemplo: cargar datos iniciales, verificar autenticación, etc.

                // Simulamos un tiempo de carga
                await new Promise((resolve) => setTimeout(resolve, 1000));

                setInitialRoute("Home");
            } catch (error) {
                console.error("Error during app initialization:", error);
                // Podrías navegar a una pantalla de error aquí si lo deseas
            } finally {
                setIsReady(true);
            }
        };

        initializeApp();
    }, []);

    if (!isReady) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName={initialRoute}>
                <Stack.Screen
                    name="Loading"
                    component={LoadingScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ title: "Intervenciones" }}
                />
                <Stack.Screen
                    name="InterventionForm"
                    component={InterventionFormScreen}
                    options={{ title: "Nueva Intervención" }}
                />
                <Stack.Screen
                    name="InterventionDetail"
                    component={InterventionDetailScreen}
                    options={{ title: "Detalle de Intervención" }}
                />
                <Stack.Screen
                    name="Report"
                    component={ReportScreen}
                    options={{ title: "Informe Generado" }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <PaperProvider>
                <DatabaseProvider>
                    <StatusBar
                        barStyle="dark-content"
                        backgroundColor="#ffffff"
                    />
                    <AppContent />
                </DatabaseProvider>
            </PaperProvider>
        </ErrorBoundary>
    );
}
