import React, { useState, useCallback, useMemo, memo } from 'react';
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

// Componente memoizado para los botones de tiempo
const TimeButton = memo(({ label, value, onChangeText, getCurrentTime }) => (
  <View style={styles.timeRow}>
    <View style={styles.timeInput}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder="HH:MM"
        mode="outlined"
      />
      <Button mode="text" onPress={() => onChangeText(getCurrentTime())}>
        Ahora
      </Button>
    </View>
  </View>
));

// Componente memoizado para los chips de tipo
const TypeChip = memo(({ option, isSelected, onPress }) => (
  <Chip
    key={option.value}
    mode={isSelected ? 'flat' : 'outlined'}
    selected={isSelected}
    onPress={onPress}
    style={styles.typeChip}
  >
    {option.label}
  </Chip>
));

// Componente memoizado para servicios
const ServiceItem = memo(({ service, index, onRemove }) => (
  <View style={styles.serviceItem}>
    <View style={styles.serviceInfo}>
      <Text variant="bodyLarge">{service.type}</Text>
      <Text variant="bodySmall" style={styles.serviceDetails}>
        IDs: {service.ids || 'N/A'} | Personal: {service.personnel || 'N/A'}
      </Text>
    </View>
    <IconButton icon="delete" onPress={() => onRemove(index)} />
  </View>
));

// Componente memoizado para víctimas
const VictimItem = memo(({ victim, index, onRemove }) => (
  <View style={styles.victimItem}>
    <View style={styles.victimInfo}>
      <Text variant="bodyLarge">{victim.name}</Text>
      {victim.description && (
        <Text variant="bodySmall" style={styles.victimDescription}>
          {victim.description}
        </Text>
      )}
    </View>
    <IconButton icon="delete" onPress={() => onRemove(index)} />
  </View>
));

// Componente memoizado para testigos
const WitnessChip = memo(({ witness, index, onRemove }) => (
  <Chip
    key={index}
    onClose={() => onRemove(index)}
    style={styles.chip}
  >
    {witness}
  </Chip>
));

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

  // Memoizar constantes para evitar recreación en cada render
  const serviceTypes = useMemo(() => ['Policía', 'Ambulancia', 'Grúa', 'Electricidad', 'Gas', 'Otro'], []);

  const typeOptions = useMemo(() =>
    Object.values(InterventionType).map(value => ({
      value,
      label: value
    })), []
  );

  // Memoizar funciones para evitar re-renders
  const getCurrentTime = useCallback(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  }, []);

  const addService = useCallback(() => {
    if (newServiceType.trim()) {
      const newService = {
        type: newServiceType,
        ids: newServiceIds || '',
        personnel: newServicePersonnel || ''
      };
      setOtherServices(prev => [...prev, newService]);
      setNewServiceIds('');
      setNewServicePersonnel('');
    }
  }, [newServiceType, newServiceIds, newServicePersonnel]);

  const removeService = useCallback((index) => {
    setOtherServices(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addWitness = useCallback(() => {
    if (newWitness.trim()) {
      setWitnesses(prev => [...prev, newWitness.trim()]);
      setNewWitness('');
    }
  }, [newWitness]);

  const removeWitness = useCallback((index) => {
    setWitnesses(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addVictim = useCallback(() => {
    if (newVictimName.trim()) {
      setVictims(prev => [...prev, {
        name: newVictimName.trim(),
        description: newVictimDescription.trim() || undefined
      }]);
      setNewVictimName('');
      setNewVictimDescription('');
    }
  }, [newVictimName, newVictimDescription]);

  const removeVictim = useCallback((index) => {
    setVictims(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
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
  }, [addIntervention, callTime, departureTime, returnTime, address, type, otherServices, witnesses, victims, fieldNotes, navigation]);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Datos Cronológicos</Title>
          <TimeButton
            label="Hora del llamado"
            value={callTime}
            onChangeText={setCallTime}
            getCurrentTime={getCurrentTime}
          />
          <TimeButton
            label="Hora de salida"
            value={departureTime}
            onChangeText={setDepartureTime}
            getCurrentTime={getCurrentTime}
          />
          <TimeButton
            label="Hora de regreso"
            value={returnTime}
            onChangeText={setReturnTime}
            getCurrentTime={getCurrentTime}
          />
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
              <TypeChip
                key={option.value}
                option={option}
                isSelected={type === option.value}
                onPress={() => setType(option.value)}
              />
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
                <ServiceItem
                  key={index}
                  service={service}
                  index={index}
                  onRemove={removeService}
                />
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
              <WitnessChip
                key={index}
                witness={witness}
                index={index}
                onRemove={removeWitness}
              />
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
            <VictimItem
              key={index}
              victim={victim}
              index={index}
              onRemove={removeVictim}
            />
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