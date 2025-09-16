import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { KeyRound, UserPlus, ArrowRightLeft, LogIn, FileText, History, LogOut, AlertTriangle, MapPin, Users } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// 1. IMPORTA O SERVIÇO DE API
import * as apiService from '../services/apiService';

const MenuCard = ({ label, icon, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={styles.menuCard}
  >
    {icon}
    <Text style={styles.menuCardLabel}>{label}</Text>
  </TouchableOpacity>
);

export const Home = ({ navigation }) => {
  const iconColor = "#1d4ed8";
  const iconSize = 32;
  const [userGroup, setUserGroup] = useState(null);

  useEffect(() => {
    // Busca o grupo do usuário para decidir quais menus mostrar
    const fetchUserGroup = async () => {
        try {
            const operadorString = await AsyncStorage.getItem('operador');
            if (operadorString) {
                const operador = JSON.parse(operadorString);
                setUserGroup(operador.grupo);
            }
        } catch (error) {
            console.error("Erro ao buscar dados do operador:", error);
        }
    };
    
    const unsubscribe = navigation.addListener('focus', fetchUserGroup);
    return unsubscribe;
  }, [navigation]);

  // 2. A FUNÇÃO DE LOGOUT É SIMPLIFICADA
  const handleLogout = () => {
    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive",
          onPress: () => apiService.logout() // Chama a função centralizada
        }
      ]
    );
  };

  // Calcula dinamicamente o número de cards visíveis para ajustar o alinhamento
  const privilegedCardsCount = (userGroup === 'admin' || userGroup === 'fiscal') ? 2 : 0;
  const totalCards = 7 + privilegedCardsCount;
  const isOddCount = totalCards % 2 !== 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Sistema de Chaves</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>O que gostaria de fazer?</Text>

        <View style={styles.gridContainer}>
          <MenuCard label="Emprestar" icon={<ArrowRightLeft size={iconSize} color={iconColor} />} onPress={() => navigation.navigate('Novo Empréstimo')} />
          <MenuCard label="Devolver" icon={<LogIn size={iconSize} color="#16a34a" />} onPress={() => navigation.navigate('Devolver Chave')} />
          <MenuCard label="Chaves" icon={<KeyRound size={iconSize} color={iconColor} />} onPress={() => navigation.navigate('Chaves')} />
          <MenuCard label="Pessoas" icon={<UserPlus size={iconSize} color={iconColor} />} onPress={() => navigation.navigate('Pessoas')} />
          
          {(userGroup === 'admin' || userGroup === 'fiscal') && (
            <>
              <MenuCard 
                label="Locais" 
                icon={<MapPin size={iconSize} color="#84cc16" />}
                onPress={() => navigation.navigate('Locais')} 
              />
              <MenuCard 
                label="Perfis" 
                icon={<Users size={iconSize} color="#a855f7" />}
                onPress={() => navigation.navigate('Perfis')} 
              />
            </>
          )}
          
          <MenuCard label="Ocorrências" icon={<AlertTriangle size={iconSize} color="#f59e0b" />} onPress={() => navigation.navigate('Ocorrências')} />
          <MenuCard label="Relatórios" icon={<FileText size={iconSize} color="#4b4f58" />} onPress={() => navigation.navigate('Relatórios')} />
          <MenuCard label="Histórico" icon={<History size={iconSize} color="#6d28d9" />} onPress={() => navigation.navigate('Histórico')} />
          
          {isOddCount && <View style={styles.menuCardPlaceholder} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  scrollViewContent: { padding: 20 },
  headerContainer: { marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937' },
  logoutButton: { padding: 8 },
  headerSubtitle: { fontSize: 18, color: '#6b7280', marginBottom: 24 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  menuCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', aspectRatio: 1, margin: 8, flex: 1, minWidth: '40%', ...cardShadow },
  menuCardPlaceholder: { flex: 1, margin: 8, minWidth: '40%', aspectRatio: 1 },
  menuCardLabel: { color: '#1f2937', textAlign: 'center', fontWeight: 'bold', marginTop: 8, fontSize: 16 },
});

