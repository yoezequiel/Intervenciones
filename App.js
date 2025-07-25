import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'react-native';
import { DatabaseProvider } from './src/context/DatabaseContext';
import HomeScreen from './src/screens/HomeScreen';
import InterventionFormScreen from './src/screens/InterventionFormScreen';
import InterventionDetailScreen from './src/screens/InterventionDetailScreen';
import ReportScreen from './src/screens/ReportScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <DatabaseProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Intervenciones' }}
            />
            <Stack.Screen
              name="InterventionForm"
              component={InterventionFormScreen}
              options={{ title: 'Nueva Intervención' }}
            />
            <Stack.Screen
              name="InterventionDetail"
              component={InterventionDetailScreen}
              options={{ title: 'Detalle de Intervención' }}
            />
            <Stack.Screen
              name="Report"
              component={ReportScreen}
              options={{ title: 'Informe Generado' }}
            />
          </Stack.Navigator>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        </NavigationContainer>
      </DatabaseProvider>
    </PaperProvider>
  );
}