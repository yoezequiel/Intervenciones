import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Text,
  Divider,
  IconButton
} from 'react-native-paper';
import { useDatabase } from '../context/DatabaseContext';

const InterventionDetailScreen = ({ navigation, route }) => {
  const { getIntervention, deleteIntervention, updateIntervention } = useDatabase();
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
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar esta intervención?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteIntervention(intervention.id);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      // Simular llamada a API de IA (Gemini Flash 2.0)
      const reportData = {
        intervention: intervention,
        prompt: `Genera un informe técnico profesional de bomberos basado en los siguientes datos de intervención:
        
        Tipo: ${intervention.type}
        Fecha: ${formatDate(intervention.createdAt)}
        Ubicación: ${intervention.address}
        Horarios: Llamado ${intervention.callTime}, Salida ${intervention.departureTime}, Regreso ${intervention.returnTime}
        
        Servicios intervinientes:
        ${intervention.otherServices && intervention.otherServices.length > 0 ? 
          intervention.otherServices.map(service => `- ${service.type}${service.ids ? ` (${service.ids})` : ''}${service.personnel ? ` - Personal: ${service.personnel}` : ''}`).join('\n        ') : 'Sin servicios registrados'}
        
        Personas involucradas:
        ${intervention.witnesses.length > 0 ? `- Testigos: ${intervention.witnesses.join(', ')}` : ''}
        ${intervention.victims.length > 0 ? `- Víctimas: ${intervention.victims.map(v => `${v.name}${v.description ? ` (${v.description})` : ''}`).join(', ')}` : ''}
        
        Notas de campo: ${intervention.fieldNotes}
        
        Genera un informe estructurado con:
        1. Cronología
        2. Descripción del evento
        3. Medios intervinientes
        4. Apreciación general
        5. Observaciones finales`
      };

      // Por ahora, generar un informe simulado
      const simulatedReport = `INFORME DE INTERVENCIÓN

DATOS GENERALES:
- Tipo de intervención: ${intervention.type}
- Fecha y hora: ${formatDate(intervention.createdAt)}
- Ubicación: ${intervention.address}

CRONOLOGÍA:
- ${intervention.callTime}: Recepción del llamado de emergencia
- ${intervention.departureTime}: Salida del cuartel hacia el lugar del siniestro
- ${intervention.returnTime}: Regreso al cuartel

DESCRIPCIÓN DEL EVENTO:
${intervention.fieldNotes || 'Sin descripción detallada disponible.'}

SERVICIOS INTERVINIENTES:
${intervention.otherServices && intervention.otherServices.length > 0 ? 
  intervention.otherServices.map(service => 
    `- ${service.type}${service.ids ? ` (${service.ids})` : ''}${service.personnel ? ` - Personal: ${service.personnel}` : ''}`
  ).join('\n') : '- Sin servicios registrados'}

PERSONAS INVOLUCRADAS:
${intervention.witnesses.length > 0 ? `- Testigos: ${intervention.witnesses.join(', ')}` : '- Sin testigos registrados'}
${intervention.victims.length > 0 ? `- Víctimas: ${intervention.victims.map(v => `${v.name}${v.description ? ` (${v.description})` : ''}`).join(', ')}` : '- Sin víctimas registradas'}

APRECIACIÓN GENERAL:
La intervención se desarrolló de acuerdo a los protocolos establecidos. Los medios desplegados fueron adecuados para la naturaleza del siniestro.

OBSERVACIONES FINALES:
Se recomienda el seguimiento correspondiente según el tipo de intervención realizada.

---
Informe generado automáticamente el ${new Date().toLocaleDateString('es-ES')}`;

      await updateIntervention(intervention.id, { report: simulatedReport });
      
      if (intervention.id) {
        navigation.navigate('Report', { 
          interventionId: intervention.id,
          report: simulatedReport 
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el informe. Verifica tu conexión a internet.');
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
            <Text variant="bodyMedium">{intervention.callTime}</Text>
          </View>
          <View style={styles.timelineItem}>
            <Text variant="labelMedium">Salida:</Text>
            <Text variant="bodyMedium">{intervention.departureTime}</Text>
          </View>
          <View style={styles.timelineItem}>
            <Text variant="labelMedium">Regreso:</Text>
            <Text variant="bodyMedium">{intervention.returnTime}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Ubicación</Title>
          <Paragraph>{intervention.address}</Paragraph>

        </Card.Content>
      </Card>

      {intervention.otherServices && intervention.otherServices.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Servicios Intervinientes</Title>
            {intervention.otherServices.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <Text variant="bodyMedium" style={styles.serviceType}>{service.type}</Text>
                {service.ids && <Text variant="bodySmall">IDs: {service.ids}</Text>}
                {service.personnel && <Text variant="bodySmall">Personal: {service.personnel}</Text>}
                {index < intervention.otherServices.length - 1 && <Divider style={styles.serviceDivider} />}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Title>Personas Involucradas</Title>
          
          {intervention.witnesses.length > 0 && (
            <>
              <Text variant="titleSmall" style={styles.sectionTitle}>Testigos</Text>
              <View style={styles.chipContainer}>
                {intervention.witnesses.map((witness, index) => (
                  <Chip key={index} style={styles.chip}>{witness}</Chip>
                ))}
              </View>
            </>
          )}
          
          {intervention.victims.length > 0 && (
            <>
              <Text variant="titleSmall" style={styles.sectionTitle}>Víctimas</Text>
              {intervention.victims.map((victim, index) => (
                <View key={index} style={styles.victimItem}>
                  <Text variant="bodyMedium">{victim.name}</Text>
                  {victim.description && (
                    <Text variant="bodySmall" style={styles.victimDescription}>
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
          style={styles.reportButton}
        >
          {intervention.report ? 'Regenerar Informe' : 'Generar Informe con IA'}
        </Button>
        
        {intervention.report && intervention.id && (
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Report', { 
              interventionId: intervention.id,
              report: intervention.report 
            })}
            icon="eye"
            style={styles.viewReportButton}
          >
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
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
  dateChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },

  sectionTitle: {
    marginTop: 12,
    marginBottom: 4,
    color: '#d32f2f',
  },
  divider: {
    marginVertical: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    margin: 2,
  },
  victimItem: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    marginTop: 4,
    borderRadius: 4,
  },
  victimDescription: {
    color: '#666',
    marginTop: 2,
  },
  buttonContainer: {
    padding: 16,
  },
  reportButton: {
    backgroundColor: '#d32f2f',
    marginBottom: 8,
  },
  viewReportButton: {
    borderColor: '#d32f2f',
  },
  serviceItem: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    marginTop: 4,
    borderRadius: 4,
  },
  serviceType: {
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  serviceDivider: {
    marginVertical: 8,
  },
});

export default InterventionDetailScreen;