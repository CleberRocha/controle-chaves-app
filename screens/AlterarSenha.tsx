import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Lock, Eye, EyeOff, Save } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { alterarSenha } from '../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AlterarSenha = () => {
  const navigation = useNavigation();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [secureNova, setSecureNova] = useState(true);
  const [secureConfirmar, setSecureConfirmar] = useState(true);

  const handleSalvar = async () => {
    if (!novaSenha || !confirmarSenha) {
      Alert.alert('Atenção', 'Todos os campos são obrigatórios.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Erro', 'A nova senha e a confirmação não correspondem.');
      return;
    }
    if (novaSenha.length < 6) {
        Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.');
        return;
    }

    setIsLoading(true);
    try {
      const response = await alterarSenha({ nova_senha: novaSenha });
      
      // Se a resposta não for 'ok', tenta extrair uma mensagem de erro do backend
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Não foi possível alterar a senha. Tente novamente.');
      }

      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('operador');

      Alert.alert(
        'Sucesso',
        'A sua senha foi alterada! Por favor, faça o login novamente com a sua nova senha.',
        [{ text: 'OK', onPress: () => navigation.replace('Login') }]
      );

    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Criar Nova Senha</Text>
            <Text style={styles.headerSubtitle}>Por segurança, você precisa definir uma nova senha para o seu primeiro acesso.</Text>
            
            <View style={styles.inputContainer}>
                <Lock size={20} color="#6b7280" />
                <TextInput 
                    value={novaSenha} 
                    onChangeText={setNovaSenha} 
                    style={styles.input} 
                    placeholder="Nova Senha"
                    secureTextEntry={secureNova}
                />
                <TouchableOpacity onPress={() => setSecureNova(!secureNova)}>
                    {secureNova ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
                <Lock size={20} color="#6b7280" />
                <TextInput 
                    value={confirmarSenha} 
                    onChangeText={setConfirmarSenha} 
                    style={styles.input} 
                    placeholder="Confirmar Nova Senha"
                    secureTextEntry={secureConfirmar}
                />
                 <TouchableOpacity onPress={() => setSecureConfirmar(!secureConfirmar)}>
                    {secureConfirmar ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                </TouchableOpacity>
            </View>
        </View>
        <View style={styles.footer}>
            <TouchableOpacity onPress={handleSalvar} style={styles.saveButton} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <><Save size={20} color="#fff" /><Text style={styles.saveButtonText}>Definir Nova Senha</Text></>}
            </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
    container: { flex: 1, padding: 24, justifyContent: 'center' },
    headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' },
    headerSubtitle: { fontSize: 16, color: '#6b7280', marginBottom: 32, textAlign: 'center' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, marginBottom: 16 },
    input: { flex: 1, height: 50, fontSize: 16, color: '#1f2937', marginLeft: 12 },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#f3f4f6' },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#2563eb' },
    saveButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
});

