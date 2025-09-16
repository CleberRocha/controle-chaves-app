import React, { useState, useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import * as apiService from './services/apiService';

// Importa suas telas
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { AlterarSenha } from './screens/AlterarSenha';
import { NovaPessoa } from './screens/NovaPessoa';
import { ListaPessoas } from './screens/ListaPessoas';
import { EditarPessoa } from './screens/EditarPessoa';
import { NovaChave } from './screens/NovaChave';
import { ListaChaves } from './screens/ListaChaves';
import { EditarChave } from './screens/EditarChave';
import { NovoEmprestimo } from './screens/NovoEmprestimo';
import { DevolverChave } from './screens/DevolverChave';
import { Relatorio } from './screens/Relatorio';
import { Historico } from './screens/Historico';
import { ListaOcorrencias } from './screens/ListaOcorrencias';
import { NovaOcorrencia } from './screens/NovaOcorrencia';
import { DetalheOcorrencia } from './screens/DetalheOcorrencia';
import { ListaLocais } from './screens/ListaLocais';
import { NovoLocal } from './screens/NovoLocal';
import { EditarLocal } from './screens/EditarLocal';
import { ListaPerfis } from './screens/ListaPerfis';
import { NovoPerfil } from './screens/NovoPerfil';
import { EditarPerfil } from './screens/EditarPerfil';


const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    apiService.setTopLevelNavigator(navigationRef);
    apiService.setOnUnauthorizedCallback(() => {
        setUserToken(null);
    });

    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        setUserToken(token);
      } catch (e) {
        console.error('Failed to load auth token', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, headerTitleAlign: 'center', headerStyle: { backgroundColor: '#f3f4f6'} }}
      >
        {userToken ? (
            <>
                <Stack.Screen name="Home" component={Home} />
                <Stack.Screen name="Pessoas" component={ListaPessoas} />
                <Stack.Screen name="Nova Pessoa" component={NovaPessoa} />
                <Stack.Screen name="Editar Pessoa" component={EditarPessoa} />
                <Stack.Screen name="Chaves" component={ListaChaves} />
                <Stack.Screen name="Nova Chave" component={NovaChave} />
                <Stack.Screen name="Editar Chave" component={EditarChave} />
                <Stack.Screen name="Novo Empréstimo" component={NovoEmprestimo} />
                <Stack.Screen name="Devolver Chave" component={DevolverChave} />
                <Stack.Screen name="Ocorrências" component={ListaOcorrencias}/>
                <Stack.Screen name="Nova Ocorrência" component={NovaOcorrencia} />
                <Stack.Screen name="Detalhe da Ocorrência" component={DetalheOcorrencia} />
                <Stack.Screen name="Locais" component={ListaLocais} />
                <Stack.Screen name="Novo Local" component={NovoLocal} />
                <Stack.Screen name="Editar Local" component={EditarLocal} />
                <Stack.Screen name="Perfis" component={ListaPerfis} />
                <Stack.Screen name="Novo Perfil" component={NovoPerfil} />
                <Stack.Screen name="Editar Perfil" component={EditarPerfil} />
                <Stack.Screen name="Relatórios" component={Relatorio} />
                <Stack.Screen name="Histórico" component={Historico} />
            </>
        ) : (
            <>
                {/* CORREÇÃO: Passa a função de login como parâmetro */}
                <Stack.Screen name="Login">
                    {(props) => <Login {...props} onLoginSuccess={(token) => setUserToken(token)} />}
                </Stack.Screen>
                <Stack.Screen name="Alterar Senha" component={AlterarSenha} />
            </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

