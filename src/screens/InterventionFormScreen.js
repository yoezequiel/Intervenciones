import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Chip,
  IconButton,
  Text,
  Menu,
  Divider
} from 'react-native-paper';
import { useDatabase } from '../context/DatabaseContext';
import { InterventionType } from '../types';

const InterventionFormScreen = ({ navigation }) => {
  const { addIntervention } = useDatabase();

  // Estados del formulario
  const [callTime, setCallTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState(InterventionType.OTHER);

  // Otros servicios unificados
  const [otherServices, setOtherServices] = useState([]);
  const [newServiceType, setNewServiceType] = useState('Policía');
  const [newServiceIds, setNewServiceIds] = useState('');
  const [newServicePersonnel, setNewServicePersonnel] = useState('');
  const [serviceMenuVisible, setServiceMenuVisible] = useState(false);

  // Personas involucradas
  const [witnesses, setWitnesses] = useState([]);
  const [victims, setVictims] = useState([]);
  const [newWitness, setNewWitness] = useState('');
  const [newVictimName, setNewVictimName] = useState('');
  const [newVictimDescription, setNewVictimDescription] = useState('');

  // Notas
  const [fieldNotes, setFieldNotes] = useState('');

  const [loading, setLoading] = useState(false);

  const serviceTypes = ['Policía', 'Ambulancia', 'Grúa', 'Electricidad', 'Gas', 'Otro'];

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const addService = () => {
    if (newServiceType.trim()) {
      const newService = {
        type: newServiceType,
        ids: newServiceIds || '',
        personnel: newServicePersonnel || ''
      };
      setOtherServices([...otherServices, newService]);
      setNewServiceIds('');
      setNewServicePersonnel('');
    }
  };

  const removeService = (index) => {
    setOtherServices(otherServices.filter((_, i) => i !== index));
  };

  const addWitness = () => {
    if (newWitness.trim()) {
      setWitnesses([...witnesses, newWitness.trim()]);
      setNewWitness('');
    }
  };

  const removeWitness = (index) => {
    setWitnesses(witnesses.filter((_, i) => i !== index));
  };

  const addVictim = () => {
    if (newVictimName.trim()) {
      setVictims([...victims, {
        name: newVictimName.trim(),
        description: newVictimDescription.trim() || undefined
      }]);
      setNewVictimName('');
      setNewVictimDescription('');
    }
  };

  const removeVictim = (index) => {
    setVictims(victims.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await addIntervention({
        callTime,
        departureTime,
        returnTime,
        address,
        type,
        otherServices,
        witnesses,
        victims,
        fieldNotes,
        audioNotes: [],
        sketches: []
      });

      Alert.alert('Éxito', 'Intervención guardada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la intervención');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = Object.values(InterventionType).map(value => ({
    value,
    label: value
  }));

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Datos Cronológicos</Title>
          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <TextInput
                label="Hora del llamado"
                value={callTime}
                onChangeText={setCallTime}
                placeholder="HH:MM"
                mode="outlined"
              />
              <Button mode="text" onPress={() => setCallTime(getCurrentTime())}>
                Ahora
              </Button>
            </View>
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <TextInput
                label="Hora de salida"
                value={departureTime}
                onChangeText={setDepartureTime}
                placeholder="HH:MM"
                mode="outlined"
              />
              <Button mode="text" onPress={() => setDepartureTime(getCurrentTime())}>
                Ahora
              </Button>
            </View>
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <TextInput
                label="Hora de regreso"
                value={returnTime}
                onChangeText={setReturnTime}
                placeholder="HH:MM"
                mode="outlined"
              />
              <Button mode="text" onPress={() => setReturnTime(getCurrentTime())}>
                Ahora
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Ubicación</Title>
          <TextInput
            label="Dirección o punto de referencia"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            multiline
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Tipo de Intervención</Title>
          <View style={styles.typeContainer}>
            {typeOptions.map((option) => (
              <Chip
                key={option.value}
                mode={type === option.value ? 'flat' : 'outlined'}
                selected={type === option.value}
                onPress={() => setType(option.value)}
                style={styles.typeChip}
              >
                {option.label}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>



      <Card style={styles.card}>
        <Card.Content>
          <Title>Otros Servicios</Title>

          <View style={styles.serviceForm}>
            <Menu
              visible={serviceMenuVisible}
              onDismiss={() => setServiceMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setServiceMenuVisible(true)}
                  style={styles.serviceTypeButton}
                >
                  {newServiceType}
                </Button>
              }
            >
              {serviceTypes.map((serviceType) => (
                <Menu.Item
                  key={serviceType}
                  onPress={() => {
                    setNewServiceType(serviceType);
                    setServiceMenuVisible(false);
                  }}
                  title={serviceType}
                />
              ))}
            </Menu>


            <TextInput
              label="Identificador de móviles"
              value={newServiceIds}
              onChangeText={setNewServiceIds}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Personal a cargo"
              value={newServicePersonnel}
              onChangeText={setNewServicePersonnel}
              mode="outlined"
              style={styles.input}
            />

            <Button mode="outlined" onPress={addService} icon="plus">
              Agregar Servicio
            </Button>
          </View>

          {otherServices.length > 0 && (
            <View style={styles.servicesContainer}>
              <Divider style={styles.divider} />
              <Text variant="titleSmall" style={styles.servicesTitle}>
                Servicios Agregados:
              </Text>
              {otherServices.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <View style={styles.serviceInfo}>
                    <Text variant="bodyLarge">{service.type}</Text>
                    <Text variant="bodySmall" style={styles.serviceDetails}>
                      IDs: {service.ids || 'N/A'} | Personal: {service.personnel || 'N/A'}
                    </Text>
                  </View>
                  <IconButton icon="delete" onPress={() => removeService(index)} />
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Testigos</Title>
          <View style={styles.addItemRow}>
            <TextInput
              label="Nombre del testigo"
              value={newWitness}
              onChangeText={setNewWitness}
              mode="outlined"
              style={styles.addItemInput}
            />
            <IconButton icon="plus" onPress={addWitness} />
          </View>
          <View style={styles.chipContainer}>
            {witnesses.map((witness, index) => (
              <Chip
                key={index}
                onClose={() => removeWitness(index)}
                style={styles.chip}
              >
                {witness}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Víctimas</Title>
          <TextInput
            label="Nombre de la víctima"
            value={newVictimName}
            onChangeText={setNewVictimName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Descripción (edad, estado, lesiones, etc.)"
            value={newVictimDescription}
            onChangeText={setNewVictimDescription}
            mode="outlined"
            multiline
            style={styles.input}
          />
          <Button mode="outlined" onPress={addVictim} icon="plus">
            Agregar Víctima
          </Button>

          {victims.map((victim, index) => (
            <View key={index} style={styles.victimItem}>
              <View style={styles.victimInfo}>
                <Text variant="bodyLarge">{victim.name}</Text>
                {victim.description && (
                  <Text variant="bodySmall" style={styles.victimDescription}>
                    {victim.description}
                  </Text>
                )}
              </View>
              <IconButton icon="delete" onPress={() => removeVictim(index)} />
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Notas de Campo</Title>
          <TextInput
            label="Descripción de lo sucedido"
            value={fieldNotes}
            onChangeText={setFieldNotes}
            mode="outlined"
            multiline
            numberOfLines={6}
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          Guardar Intervención
        </Button>
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
  input: {
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  typeChip: {
    margin: 4,
  },
  serviceForm: {
    marginBottom: 16,
  },
  serviceTypeButton: {
    marginBottom: 12,
  },
  servicesContainer: {
    marginTop: 16,
  },
  servicesTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceDetails: {
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginBottom: 12,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addItemInput: {
    flex: 1,
    marginRight: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 4,
  },
  victimItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  victimInfo: {
    flex: 1,
  },
  victimDescription: {
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    padding: 16,
  },
  submitButton: {
    backgroundColor: '#d32f2f',
  },
});

export default InterventionFormScreen;