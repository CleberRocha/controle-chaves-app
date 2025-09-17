import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { User, Lock, Eye, EyeOff } from 'lucide-react-native';
import { API_URL } from '../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Recebe a nova propriedade onLoginSuccess
export const Login = ({ navigation, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleLogin = async () => {
    if (!username || !senha) {
      Alert.alert('Erro', 'Por favor, preencha o nome de usuário e a senha.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/operadores/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, senha: senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Usuário ou senha inválidos.');
      }

      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('operador', JSON.stringify(data.operador));

      if (data.senha_temporaria) {
        // Se a senha for temporária, navega normalmente para a alteração
        navigation.replace('Alterar Senha');
      } else {
        // Se o login for bem-sucedido, chama a função do App.tsx para atualizar o estado
        onLoginSuccess(data.token);
      }

    } catch (error) {
      Alert.alert('Falha no Login', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Imagem alterada para usar o logo local do projeto */}
      <Image source={require('../assets/icon.png')} style={styles.logo} />
      <Text style={styles.title}>Bem-vindo</Text>
      <Text style={styles.subtitle}>Faça login para continuar</Text>
      
      <View style={styles.inputContainer}>
        <User size={20} color="#6b7280" />
        <TextInput
          style={styles.input}
          placeholder="Nome de Usuário"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholderTextColor="#888"
        />
      </View>
      <View style={styles.inputContainer}>
        <Lock size={20} color="#6b7280" />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry={!isPasswordVisible}
          autoCapitalize="none"
          placeholderTextColor="#888"
        />
        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
          {isPasswordVisible ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f3f4f6' },
    logo: { width: 150, height: 150, alignSelf: 'center', marginBottom: 24, resizeMode: 'contain' },
    title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#1f2937' },
    subtitle: { fontSize: 18, textAlign: 'center', color: '#6b7280', marginBottom: 32 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginBottom: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    input: { flex: 1, height: 50, fontSize: 16, color: '#1f2937', marginLeft: 8 },
    button: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

