import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { MapPin, Edit, Plus, Trash2 } from 'lucide-react-native';
import { getLocais, deleteLocal } from '../services/apiService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ListaLocais = () => {
  const navigation = useNavigation();
  const [locais, setLocais] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userGroup, setUserGroup] = useState(null);

  // CORREÇÃO APLICADA AQUI
  // A lógica assíncrona agora está dentro de uma função interna,
  // e o useCallback retorna uma função síncrona, como esperado pelo useFocusEffect.
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const operadorString = await AsyncStorage.getItem('operador');
          if (operadorString) {
            const operador = JSON.parse(operadorString);
            setUserGroup(operador.grupo);
          }
          const response = await getLocais();
          if (!response.ok) throw new Error('Falha ao buscar locais.');
          const data = await response.json();
          setLocais(data);
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível carregar os locais.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }, [])
  );

  const handleDelete = (localId) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este local?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await deleteLocal(localId);
              if (response.status === 403) {
                  Alert.alert('Acesso Negado', 'Você não tem permissão para excluir locais.');
                  return;
              }
              if (!response.ok) throw new Error('Falha ao excluir local.');
              // Re-executa a busca para atualizar a lista
              const newData = await (await getLocais()).json();
              setLocais(newData);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o local.');
            }
          },
        },
      ]
    );
  };

  const handleEditPress = (local) => {
      if (userGroup === 'admin' || userGroup === 'fiscal') {
          navigation.navigate('Editar Local', { local });
      } else {
          Alert.alert('Acesso Negado', 'Você não tem permissão para editar locais.');
      }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <MapPin size={24} color="#1f2937" style={{ marginRight: 16 }} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.nome}</Text>
        <Text style={styles.cardSubtitle}>{item.tipo_acesso}</Text>
      </View>
      {(userGroup === 'admin' || userGroup === 'fiscal') && (
        <>
            <TouchableOpacity onPress={() => handleEditPress(item)} style={styles.actionButton}>
                <Edit size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Text style={styles.headerTitle}>Locais</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={locais}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum local cadastrado.</Text>}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
        {(userGroup === 'admin' || userGroup === 'fiscal') && (
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Novo Local')}>
                <Plus size={24} color="#fff" />
            </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
    mainContainer: { flex: 1, padding: 24 },
    headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 24 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    cardSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 2, textTransform: 'capitalize' },
    actionButton: { padding: 8, marginLeft: 8 },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', elevation: 8 },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#6b7280' },
});

