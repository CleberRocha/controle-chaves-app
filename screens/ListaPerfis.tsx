import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Users, Edit, Plus, Trash2, Clock, Calendar } from 'lucide-react-native';
import { getPerfis, deletePerfil } from '../services/apiService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mapeia os dias da semana para abreviações
const diasMap = {
  domingo: 'Dom', segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb'
};
const diasOrdem = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export const ListaPerfis = () => {
  const navigation = useNavigation();
  const [perfis, setPerfis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userGroup, setUserGroup] = useState(null);

  // CORREÇÃO APLICADA: A função async está agora dentro do useCallback.
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const operadorString = await AsyncStorage.getItem('operador');
          if (operadorString) {
            setUserGroup(JSON.parse(operadorString).grupo);
          }
          const response = await getPerfis();
          if (!response.ok) throw new Error('Falha ao buscar perfis.');
          setPerfis(await response.json());
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível carregar os perfis.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }, [])
  );

  const handleDelete = (perfilId) => {
    Alert.alert("Confirmar Exclusão", "Deseja realmente excluir este perfil?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
          try {
            const response = await deletePerfil(perfilId);
            if (response.status === 403) {
              Alert.alert('Acesso Negado', 'Você não tem permissão para excluir perfis.');
              return;
            }
            if (!response.ok) throw new Error('Falha ao excluir o perfil.');
            // Recarrega a lista após a exclusão
            const newPerfis = await (await getPerfis()).json();
            setPerfis(newPerfis);
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível excluir o perfil.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const horario = (item.hora_inicio && item.hora_fim) ? `${item.hora_inicio} - ${item.hora_fim}` : 'Acesso 24h';
    const diasPermitidos = item.dias_semana && item.dias_semana.length > 0
      ? diasOrdem.filter(dia => item.dias_semana.includes(dia)).map(dia => diasMap[dia]).join(', ')
      : 'Todos os dias';

    return (
      <View style={styles.card}>
        <Users size={24} color="#1f2937" style={{ marginRight: 16 }} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.nome}</Text>
          <View style={styles.infoRow}><Clock size={14} color="#6b7280" /><Text style={styles.cardSubtitle}>{horario}</Text></View>
          <View style={styles.infoRow}><Calendar size={14} color="#6b7280" /><Text style={styles.cardSubtitle}>{diasPermitidos}</Text></View>
        </View>
        {(userGroup === 'admin' || userGroup === 'fiscal') && (
          <>
            <TouchableOpacity onPress={() => navigation.navigate('Editar Perfil', { perfil: item })} style={styles.actionButton}>
              <Edit size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Text style={styles.headerTitle}>Perfis de Acesso</Text>
        {isLoading ? <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} /> : (
          <FlatList
            data={perfis}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum perfil cadastrado.</Text>}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
        {(userGroup === 'admin' || userGroup === 'fiscal') && (
          <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Novo Perfil')}>
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
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardSubtitle: { fontSize: 14, color: '#6b7280', marginLeft: 6 },
  actionButton: { padding: 8, marginLeft: 8 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#6b7280' },
});

