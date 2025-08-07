// screens/Configuracoes.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, Download } from 'lucide-react-native';

export const Configuracoes = ({ navigation }) => {

  // Função para exportar os dados
  const handleExportData = async () => {
    try {
      // 1. Coleta todos os dados do AsyncStorage
      const chaves = await AsyncStorage.getItem('chaves') || '[]';
      const pessoas = await AsyncStorage.getItem('pessoas') || '[]';
      const emprestimos = await AsyncStorage.getItem('emprestimos') || '[]';

      // 2. Agrupa em um único objeto
      const backupData = {
        chaves,
        pessoas,
        emprestimos,
        dataBackup: new Date().toISOString(),
      };

      // 3. Converte para uma string JSON
      const jsonString = JSON.stringify(backupData, null, 2);
      const fileName = `backup_chaves_${new Date().getTime()}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // 4. Salva o arquivo no dispositivo
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // 5. Abre a caixa de compartilhamento
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Compartilhar backup',
      });

    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível exportar os dados.');
    }
  };

  // Função para importar os dados
  const handleImportData = async () => {
    Alert.alert(
      'Atenção!',
      'A importação de um backup irá apagar TODOS os dados atuais. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', style: 'destructive', onPress: async () => {
          try {
            // 1. Abre o seletor de arquivos
            const result = await DocumentPicker.getDocumentAsync({
              type: 'application/json',
            });

            if (result.type === 'success') {
              // 2. Lê o conteúdo do arquivo
              const fileContent = await FileSystem.readAsStringAsync(result.uri);
              const backupData = JSON.parse(fileContent);

              // 3. Valida o arquivo
              if (backupData.chaves && backupData.pessoas && backupData.emprestimos) {
                // 4. Salva os dados restaurados
                await AsyncStorage.setItem('chaves', backupData.chaves);
                await AsyncStorage.setItem('pessoas', backupData.pessoas);
                await AsyncStorage.setItem('emprestimos', backupData.emprestimos);

                Alert.alert('Sucesso!', 'Dados restaurados com sucesso. É recomendado reiniciar o aplicativo.');
                navigation.navigate('Início');
              } else {
                Alert.alert('Erro', 'Arquivo de backup inválido.');
              }
            }
          } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível importar os dados.');
          }
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Backup e Restauração</Text>
        <Text style={styles.description}>
          Exporte seus dados para criar um backup de segurança ou importe um arquivo para restaurar suas informações.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleExportData}>
          <Upload size={24} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Exportar Dados (Backup)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.importButton]} onPress={handleImportData}>
          <Download size={24} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Importar Dados (Restaurar)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
    padding: 24,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 3,
  },
  importButton: {
    backgroundColor: '#16a34a', // Cor verde para importação
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  icon: {
    marginRight: 12,
  },
});