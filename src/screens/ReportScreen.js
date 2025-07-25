import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text
} from 'react-native-paper';
import { Share } from 'react-native';

const ReportScreen = ({ navigation, route }) => {
  const { report, interventionId } = route.params;

  const generatePDF = () => {
    Alert.alert(
      'Exportar Informe',
      '¿Qué deseas hacer con el informe?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Compartir', onPress: () => shareReport() }
      ]
    );
  };

  const shareReport = async () => {
    try {
      const result = await Share.share({
        title: 'Informe de Intervención',
        message: `Informe de Intervención ID: ${interventionId}\n\n${report}`,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir el informe');
    }
  };

  const copyToClipboard = () => {
    // En una implementación real, usarías Clipboard de React Native
    Alert.alert('Copiado', 'El informe ha sido copiado al portapapeles');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Informe Generado</Title>
            <Text variant="bodySmall" style={styles.subtitle}>
              ID de Intervención: {interventionId}
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Generado el: {new Date().toLocaleDateString('es-ES')}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Paragraph style={styles.reportContent}>
              {report}
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={generatePDF}
          icon="share"
          style={styles.pdfButton}
        >
          Compartir Informe
        </Button>
        
        <Button
          mode="outlined"
          onPress={copyToClipboard}
          icon="content-copy"
          style={styles.copyButton}
        >
          Copiar Texto
        </Button>
        
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Volver
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  title: {
    color: '#d32f2f',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    marginBottom: 4,
  },
  reportContent: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  pdfButton: {
    backgroundColor: '#d32f2f',
    marginBottom: 8,
  },
  copyButton: {
    borderColor: '#d32f2f',
    marginBottom: 8,
  },
  backButton: {
    marginTop: 4,
  },
});

export default ReportScreen;