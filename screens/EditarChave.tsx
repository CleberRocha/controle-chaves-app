import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView, FlatList, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { Key, MapPin, Save, ChevronDown, X, Users, UserPlus, Calendar, Clock, Trash2 } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { getChaveDetails, updateChave, getLocais, getPerfis, getPessoas } from '../services/apiService';

const PessoaPermissaoItem = ({ pessoa, onRemove, onShowPicker }) => {
    
    // Formata a data para exibição no formato DD/MM/AAAA
    const displayDate = pessoa.validade 
        ? new Date(pessoa.validade + 'T00:00:00').toLocaleDateString('pt-BR') 
        : 'Validade (DD/MM/AAAA)';

    return (
        <View style={styles.permissaoCard}>
            <Text style={styles.permissaoCardTitle}>{pessoa.nome_completo}</Text>
            
            <TouchableOpacity style={styles.permissaoRow} onPress={() => onShowPicker(pessoa.id, 'validade', 'date')}>
                <Calendar size={18} color="#6b7280" style={styles.permissaoIcon} />
                <View style={styles.permissaoInputTouchable}>
                    <Text style={pessoa.validade ? styles.permissaoInputText : styles.permissaoPlaceholder}>
                        {displayDate}
                    </Text>
                </View>
            </TouchableOpacity>

            <View style={styles.permissaoRow}>
                <Clock size={18} color="#6b7280" style={styles.permissaoIcon} />
                <TouchableOpacity style={[styles.permissaoInputTouchable, {flex: 1}]} onPress={() => onShowPicker(pessoa.id, 'hora_inicio', 'time')}>
                    <Text style={pessoa.hora_inicio ? styles.permissaoInputText : styles.permissaoPlaceholder}>
                        {pessoa.hora_inicio || 'Início (HH:MM)'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.permissaoInputTouchable, {flex: 1, marginLeft: 8}]} onPress={() => onShowPicker(pessoa.id, 'hora_fim', 'time')}>
                    <Text style={pessoa.hora_fim ? styles.permissaoInputText : styles.permissaoPlaceholder}>
                        {pessoa.hora_fim || 'Fim (HH:MM)'}
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => onRemove(pessoa.id)} style={styles.removeButton}>
                <Trash2 size={18} color="#ef4444" />
                <Text style={styles.removeButtonText}>Remover</Text>
            </TouchableOpacity>
        </View>
    );
};

export const EditarChave = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { chaveId } = route.params;

    const [codigo, setCodigo] = useState('');
    const [local, setLocal] = useState(null);
    const [perfisPermitidos, setPerfisPermitidos] = useState([]);
    const [pessoasPermitidas, setPessoasPermitidas] = useState([]);

    const [locais, setLocais] = useState([]);
    const [perfis, setPerfis] = useState([]);
    const [pessoas, setPessoas] = useState([]);
    const [modal, setModal] = useState({ visible: false, type: '' });
    const [isLoading, setIsLoading] = useState(true);

    // Estados do seletor de data/hora
    const [isPickerVisible, setPickerVisibility] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ mode: 'date', pessoaId: null, field: '' });

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [detailsRes, locaisRes, perfisRes, pessoasRes] = await Promise.all([
                getChaveDetails(chaveId), getLocais(), getPerfis(), getPessoas()
            ]);

            if (!detailsRes.ok) throw new Error("Falha ao carregar dados da chave.");

            const chaveDetails = await detailsRes.json();
            const locaisData = await locaisRes.json();
            const perfisData = await perfisRes.json();
            const pessoasData = await pessoasRes.json();
            
            setLocais(locaisData);
            setPerfis(perfisData);
            setPessoas(pessoasData);

            setCodigo(chaveDetails.codigo_chave);
            setLocal(locaisData.find(l => l.id === chaveDetails.local_id));
            setPerfisPermitidos(chaveDetails.perfisPermitidos || []);

            const pessoasComNomes = chaveDetails.pessoasPermitidas.map(pPerm => {
                const pessoaInfo = pessoasData.find(p => p.id === pPerm.id);
                return { ...pPerm, nome_completo: pessoaInfo?.nome_completo || 'Pessoa não encontrada' };
            });
            setPessoasPermitidas(pessoasComNomes);

        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar os dados da chave.');
        } finally {
            setIsLoading(false);
        }
    }, [chaveId]);
    
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => { fetchAllData(); });
        return unsubscribe;
    }, [navigation, fetchAllData]);

    // Funções para o seletor de data/hora
    const showPicker = (pessoaId, field, mode) => {
        setPickerConfig({ pessoaId, field, mode });
        setPickerVisibility(true);
    };
    const hidePicker = () => setPickerVisibility(false);

    const handleConfirmPicker = (date) => {
        const { pessoaId, field, mode } = pickerConfig;
        let formattedValue;
        if (mode === 'date') {
            formattedValue = date.toISOString().split('T')[0];
        } else {
            formattedValue = date.toTimeString().split(' ')[0].substring(0, 5);
        }
        handleUpdatePessoaPermissao(pessoaId, field, formattedValue);
        hidePicker();
    };

    const handleTogglePerfil = (perfilId) => setPerfisPermitidos(prev => prev.includes(perfilId) ? prev.filter(id => id !== perfilId) : [...prev, perfilId]);
    const handleAddPessoa = (pessoa) => {
        if (!pessoasPermitidas.some(p => p.id === pessoa.id)) {
            setPessoasPermitidas(prev => [...prev, { ...pessoa, validade: '', hora_inicio: '', hora_fim: '' }]);
        }
        setModal({ visible: false, type: '' });
    };
    const handleUpdatePessoaPermissao = (pessoaId, field, value) => setPessoasPermitidas(prev => prev.map(p => p.id === pessoaId ? { ...p, [field]: value } : p));
    const handleRemovePessoa = (pessoaId) => setPessoasPermitidas(prev => prev.filter(p => p.id !== pessoaId));
    
    const handleSalvar = async () => {
        if (!codigo.trim() || !local) {
          Alert.alert('Atenção', 'Código da chave e local são obrigatórios.'); return;
        }
        setIsLoading(true);
        try {
          const payload = {
            codigo_chave: codigo.trim(),
            local_id: local.id,
            perfisPermitidos,
            pessoasPermitidas: pessoasPermitidas.map(({ id, validade, hora_inicio, hora_fim }) => ({
                id, validade: validade || null, hora_inicio: hora_inicio || null, hora_fim: hora_fim || null
            }))
          };
          const response = await updateChave(chaveId, payload);
          if (!response.ok) throw new Error('Falha ao atualizar chave.');
          Alert.alert('Sucesso', 'Chave atualizada!');
          navigation.goBack();
        } catch (error) {
          Alert.alert('Erro', 'Ocorreu um erro ao salvar as alterações.');
        } finally {
          setIsLoading(false);
        }
    };
    
    const renderModal = () => {
        if (!modal.visible) return null;
        let data, renderItem, title;
        switch(modal.type) {
            case 'local': title = 'Selecione o Local'; data = locais; renderItem = ({ item }) => (<TouchableOpacity style={styles.modalItem} onPress={() => { setLocal(item); setModal({visible: false, type: ''}); }}><Text style={styles.modalItemText}>{item.nome}</Text></TouchableOpacity>); break;
            case 'perfis': title = 'Selecione os Perfis'; data = perfis; renderItem = ({ item }) => (<TouchableOpacity style={styles.modalItem} onPress={() => handleTogglePerfil(item.id)}><Text style={styles.modalItemText}>{item.nome}</Text><Switch value={perfisPermitidos.includes(item.id)} onValueChange={() => handleTogglePerfil(item.id)} /></TouchableOpacity>); break;
            case 'pessoas': title = 'Adicionar Exceção'; data = pessoas; renderItem = ({ item }) => (<TouchableOpacity style={styles.modalItem} onPress={() => handleAddPessoa(item)}><Text style={styles.modalItemText}>{item.nome_completo}</Text></TouchableOpacity>); break;
            default: return null;
        }
        return (<View style={styles.modalOverlay}><View style={styles.modalContent}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{title}</Text><TouchableOpacity onPress={() => setModal({visible: false, type: ''})}><X size={24} color="#6b7280" /></TouchableOpacity></View><FlatList data={data} keyExtractor={(item) => item.id.toString()} renderItem={renderItem} /></View></View>);
    };

    if (isLoading) return <SafeAreaView style={styles.safeArea}><ActivityIndicator size="large" color="#2563eb" style={{flex: 1}} /></SafeAreaView>;

    return (
        <SafeAreaView style={styles.safeArea}>
          <ScrollView>
            <View style={styles.mainContainer}>
              <Text style={styles.headerTitle}>Editar Chave</Text>
              <View style={styles.inputContainer}><Key size={20} color="#6b7280" /><TextInput value={codigo} onChangeText={setCodigo} style={styles.input} placeholder="Código da Chave *" /></View>
              <TouchableOpacity onPress={() => setModal({visible: true, type: 'local'})} style={styles.inputContainer}><MapPin size={20} color="#6b7280" /><Text style={local ? styles.input : styles.placeholderText}>{local?.nome || "Selecione um local *"}</Text><ChevronDown size={20} color="#6b7280" /></TouchableOpacity>
              <Text style={styles.sectionTitle}>Permissões por Perfil</Text>
              <TouchableOpacity onPress={() => setModal({visible: true, type: 'perfis'})} style={styles.inputContainer}><Users size={20} color="#6b7280" /><Text style={styles.input}>{perfisPermitidos.length} perfis selecionados</Text><ChevronDown size={20} color="#6b7280" /></TouchableOpacity>
              <Text style={styles.sectionTitle}>Exceções por Pessoa</Text>
              {pessoasPermitidas.map(p => <PessoaPermissaoItem key={p.id} pessoa={p} onRemove={handleRemovePessoa} onShowPicker={showPicker}/>)}
              <TouchableOpacity onPress={() => setModal({visible: true, type: 'pessoas'})} style={styles.addButton}><UserPlus size={20} color="#2563eb" /><Text style={styles.addButtonText}>Adicionar Pessoa</Text></TouchableOpacity>
            </View>
          </ScrollView>
          <View style={styles.footerButtons}><TouchableOpacity onPress={handleSalvar} style={styles.saveButton} disabled={isLoading}>{isLoading ? <ActivityIndicator color="#fff" /> : <><Save size={20} color="#fff" /><Text style={styles.saveButtonText}>Salvar Alterações</Text></>}</TouchableOpacity></View>
          <DateTimePickerModal isVisible={isPickerVisible} mode={pickerConfig.mode} onConfirm={handleConfirmPicker} onCancel={hidePicker} locale="pt_BR"/>
          {renderModal()}
        </SafeAreaView>
      );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
    mainContainer: { padding: 24, paddingBottom: 24 },
    headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16 },
    input: { flex: 1, fontSize: 16, color: '#1f2937', marginLeft: 12 },
    placeholderText: { flex: 1, fontSize: 16, color: '#9ca3af', marginLeft: 12 },
    footerButtons: { padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#2563eb' },
    saveButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#ffffff', borderRadius: 16, width: '100%', maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
    modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    modalItemText: { fontSize: 18, color: '#1f2937' },
    addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2563eb', marginTop: 8 },
    addButtonText: { color: '#2563eb', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
    permissaoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    permissaoCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
    permissaoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    permissaoIcon: { marginRight: 8 },
    permissaoInputTouchable: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, flex: 1, justifyContent: 'center' },
    permissaoInputText: { fontSize: 14, color: '#1f2937' },
    permissaoPlaceholder: { fontSize: 14, color: '#9ca3af' },
    removeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
    removeButtonText: { color: '#ef4444', marginLeft: 4, fontWeight: '600' }
});
