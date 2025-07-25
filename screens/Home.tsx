// screens/Home.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet, SafeAreaView } from 'react-native';
import { KeyRound, UserPlus, ArrowRightLeft, LogIn, FileText, History } from 'lucide-react-native';

// Componente de cartão para o menu, agora com StyleSheet
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
  const iconColor = "#1d4ed8"; // Um tom de azul mais vibrante
  const iconSize = 32;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Sistema controle de chaves</Text>
          <Text style={styles.headerSubtitle}>O que gostaria de fazer?</Text>
        </View>

        {/* Grid de cartões para as ações */}
        <View style={styles.gridContainer}>
          <MenuCard 
            label="Emprestar" 
            icon={<ArrowRightLeft size={iconSize} color={iconColor} />} 
            onPress={() => navigation.navigate('Novo Empréstimo')} 
          />
          <MenuCard 
            label="Devolver" 
            icon={<LogIn size={iconSize} color="#16a34a" />} // Verde para devolução
            onPress={() => navigation.navigate('Devolver Chave')} 
          />
          <MenuCard 
            label="Nova Chave" 
            icon={<KeyRound size={iconSize} color={iconColor} />} 
            onPress={() => navigation.navigate('Chaves')} 
          />
          <MenuCard 
            label="Nova Pessoa" 
            icon={<UserPlus size={iconSize} color={iconColor} />} 
            onPress={() => navigation.navigate('Pessoas')} 
          />
           <MenuCard 
            label="Relatórios" 
            icon={<FileText size={iconSize} color="#4b4f58" />} // Cinza para relatórios
            onPress={() => navigation.navigate('Relatórios')} 
          />
          <MenuCard 
            label="Histórico" 
            icon={<History size={iconSize} color="#6d28d9" />} // Roxo para histórico
            onPress={() => navigation.navigate('Histórico')} 
          />
           {/* Adicione um card vazio para alinhar o último item à esquerda, se necessário */}
           
        </View>
        {/* A </View> extra que causava o erro foi removida daqui */}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollViewContent: {
    padding: 20,
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#6b7280',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  menuCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    margin: 8,
    flex: 1,
    minWidth: '40%',
    ...cardShadow,
  },
  menuCardLabel: {
    color: '#1f2937',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 16,
  },
  emptyCard: {
    flex: 1,
    margin: 8,
    minWidth: '40%',
    aspectRatio: 1,
  }
});