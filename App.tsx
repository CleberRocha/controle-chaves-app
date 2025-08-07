// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home } from './screens/Home';
import { NovaChave } from './screens/NovaChave';
import { NovaPessoa } from './screens/NovaPessoa';
import { NovoEmprestimo } from './screens/NovoEmprestimo';
import { DevolverChave } from './screens/DevolverChave';
import { Relatorio } from './screens/Relatorio';
import { Historico } from './screens/Historico';
import { ListaPessoas } from './screens/ListaPessoas';
import { EditarPessoa } from './screens/EditarPessoa';
import { ListaChaves } from './screens/ListaChaves';
import { EditarChave } from './screens/EditarChave';
// --- IMPORTE A NOVA TELA DE CONFIGURAÇÕES ABAIXO ---
import { Configuracoes } from './screens/Configuracoes';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1f2937' }, headerTintColor: '#fff' }}>
        <Stack.Screen name="Início" component={Home} />
        <Stack.Screen name="Chaves" component={ListaChaves} />
        <Stack.Screen name="Editar Chave" component={EditarChave} />
        <Stack.Screen name="Nova Chave" component={NovaChave} />
        <Stack.Screen name="Pessoas" component={ListaPessoas} />
        <Stack.Screen name="Nova Pessoa" component={NovaPessoa} />
        <Stack.Screen name="Editar Pessoa" component={EditarPessoa} />
        <Stack.Screen name="Novo Empréstimo" component={NovoEmprestimo} />
        <Stack.Screen name="Devolver Chave" component={DevolverChave} />
        <Stack.Screen name="Relatórios" component={Relatorio} />
        <Stack.Screen name="Histórico" component={Historico} />
        <Stack.Screen name="Configurações" component={Configuracoes} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}