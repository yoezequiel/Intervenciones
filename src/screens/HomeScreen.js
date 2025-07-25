import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  FAB, 
  Searchbar, 
  Chip,
  Text,
  Button
} from 'react-native-paper';
import { useDatabase } from '../context/DatabaseContext';
import { InterventionType } from '../types';

const HomeScreen = ({ navigation }) => {
  const { interventions } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(null);

  const filteredInterventions = interventions.filter(intervention => {
    const matchesSearch = intervention.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         intervention.fieldNotes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || intervention.type === selectedType;
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderIntervention = ({ item }) => (
    <Card style={styles.card} onPress={() => item.id && navigation.navigate('InterventionDetail', { id: item.id })}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title style={styles.cardTitle}>{item.type}</Title>
          <Chip mode="outlined" compact>{formatDate(item.createdAt)}</Chip>
        </View>
        <Paragraph style={styles.address}>{item.address}</Paragraph>
        <View style={styles.timeInfo}>
          <Text variant="bodySmall">Llamado: {item.callTime}</Text>
          <Text variant="bodySmall">Salida: {item.departureTime}</Text>
        </View>
        {item.fieldNotes && (
          <Paragraph numberOfLines={2} style={styles.notes}>
            {item.fieldNotes}
          </Paragraph>
        )}
      </Card.Content>
    </Card>
  );

  const typeFilters = Object.values(InterventionType);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar intervenciones..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={typeFilters}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              mode={selectedType === item ? 'flat' : 'outlined'}
              selected={selectedType === item}
              onPress={() => setSelectedType(selectedType === item ? null : item)}
              style={styles.filterChip}
            >
              {item}
            </Chip>
          )}
        />
      </View>

      {filteredInterventions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No hay intervenciones registradas
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Presiona el botón + para crear tu primera intervención
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredInterventions}
          renderItem={renderIntervention}
          keyExtractor={(item) => item.id?.toString() || ''}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('InterventionForm')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    flex: 1,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notes: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#666',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#888',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#d32f2f',
  },
});

export default HomeScreen;