// screens/Configuracoes.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, Download, AlertTriangle } from 'lucide-react-native';

export const Configuracoes = ({ navigation }) => {

  // Função para exportar os dados (Backup) com fotos
  const handleExportData = async () => {
    try {
      const chaves = await AsyncStorage.getItem('chaves') || '[]';
      const emprestimos = await AsyncStorage.getItem('emprestimos') || '[]';
      const pessoasRaw = await AsyncStorage.getItem('pessoas') || '[]';
      const pessoas = JSON.parse(pessoasRaw);

      // Converte as imagens para o formato Base64 para incluí-las no backup
      const pessoasComFotosBase64 = await Promise.all(
        pessoas.map(async (pessoa) => {
          if (pessoa.foto && pessoa.foto.startsWith('file://')) {
            try {
              const fotoBase64 = await FileSystem.readAsStringAsync(pessoa.foto, {
                encoding: FileSystem.EncodingType.Base64,
              });
              // Adiciona um novo campo com a foto em Base64
              return { ...pessoa, fotoBase64 };
            } catch (e) {
              console.log(`Não foi possível ler a foto de ${pessoa.nome}:`, e);
              return pessoa; // Retorna a pessoa sem a foto se houver erro
            }
          }
          return pessoa;
        })
      );

      const backupData = {
        chaves,
        pessoas: JSON.stringify(pessoasComFotosBase64), // Salva o array com as fotos
        emprestimos,
        dataBackup: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const fileName = `backup_chaves_${new Date().getTime()}.json`;
      const fileUri = FileSystem.cacheDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Erro', 'O compartilhamento não está disponível neste dispositivo.');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Salvar backup de dados',
      });

    } catch (error) {
      console.error("Erro ao exportar:", error);
      Alert.alert('Erro', 'Não foi possível exportar os dados.');
    }
  };

  // Função para importar os dados (Restaurar) com fotos
  const handleImportData = async () => {
    Alert.alert(
      'Atenção!',
      'A importação de um backup irá apagar TODOS os dados atuais. Esta ação não pode ser desfeita. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar e Apagar Dados', style: 'destructive', onPress: async () => {
          try {
            const result = await DocumentPicker.getDocumentAsync({
              type: 'application/json',
              copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
              const fileUri = result.assets[0].uri;
              const fileContent = await FileSystem.readAsStringAsync(fileUri);
              const backupData = JSON.parse(fileContent);

              if (backupData.chaves && backupData.pessoas && backupData.emprestimos) {
                const pessoasImportadas = JSON.parse(backupData.pessoas);

                // Restaura as fotos a partir do Base64
                const pessoasRestauradas = await Promise.all(
                  pessoasImportadas.map(async (pessoa) => {
                    if (pessoa.fotoBase64) {
                      const fileName = `restored_photo_${pessoa.id}_${Date.now()}.jpg`;
                      const newFileUri = FileSystem.documentDirectory + fileName;
                      try {
                        await FileSystem.writeAsStringAsync(newFileUri, pessoa.fotoBase64, {
                          encoding: FileSystem.EncodingType.Base64,
                        });
                        // Atualiza o objeto da pessoa com o novo caminho da foto
                        const { fotoBase64, ...pessoaSemBase64 } = pessoa;
                        return { ...pessoaSemBase64, foto: newFileUri };
                      } catch (e) {
                        console.log(`Não foi possível restaurar a foto de ${pessoa.nome}:`, e);
                        const { fotoBase64, ...pessoaSemBase64 } = pessoa;
                        return { ...pessoaSemBase64, foto: null }; // Foto nula se falhar
                      }
                    }
                    return pessoa;
                  })
                );
                
                await AsyncStorage.setItem('chaves', backupData.chaves);
                await AsyncStorage.setItem('pessoas', JSON.stringify(pessoasRestauradas));
                await AsyncStorage.setItem('emprestimos', backupData.emprestimos);

                Alert.alert('Sucesso!', 'Dados restaurados com sucesso. É recomendado reiniciar o aplicativo para que todas as telas sejam atualizadas.');
                navigation.navigate('Início');
              } else {
                Alert.alert('Erro', 'O arquivo selecionado não parece ser um backup válido.');
              }
            }
          } catch (error) {
            console.error("Erro ao importar:", error);
            Alert.alert('Erro', 'Não foi possível importar os dados. Verifique se o arquivo não está corrompido.');
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
          Exporte seus dados para criar um arquivo de segurança. Você pode salvar este arquivo na nuvem ou em outro dispositivo.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleExportData}>
          <Upload size={24} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Exportar Dados (Backup)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.importButton]} onPress={handleImportData}>
          <Download size={24} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Importar Dados (Restaurar)</Text>
        </TouchableOpacity>

        <View style={styles.warningBox}>
            <AlertTriangle size={24} color="#d97706" />
            <Text style={styles.warningText}>
                A importação de dados é uma ação irreversível e substituirá todas as informações salvas no aplicativo.
            </Text>
        </View>
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
    backgroundColor: '#16a34a',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  icon: {
    marginRight: 12,
  },
  warningBox: {
    marginTop: 32,
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    borderLeftColor: '#f59e0b',
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    color: '#92400e',
    fontSize: 14,
    lineHeight: 20,
  }
});
