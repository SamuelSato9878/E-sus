import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useSessao } from '../context/SessaoContext';
import { mensagemDeErro } from '../services/api';
import { atualizarPerfil, criarPerfil } from '../services/pacienteApi';
import { cpfValido, formatarCpf, somenteDigitos } from '../utils/cpf';

export default function PerfilPaciente() {
  const { perfil, usuario, atualizarPerfilSessao } = useSessao();
  const [phone, setPhone] = useState(perfil?.phone ?? '');
  const [cpf, setCpf] = useState(perfil?.cpf ? formatarCpf(perfil.cpf) : '');
  const [birthDate, setBirthDate] = useState(perfil?.birth_date ?? '');
  const [address, setAddress] = useState(perfil?.address ?? '');
  const [sex, setSex] = useState(perfil?.sex ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function salvar() {
    if (!phone.trim()) return setError('Informe seu telefone.');
    if (!cpfValido(cpf)) return setError('Confira o CPF informado.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(Date.parse(`${birthDate}T12:00:00`))) {
      return setError('Informe a data de nascimento no formato AAAA-MM-DD.');
    }
    setLoading(true);
    setError('');
    try {
      const payload = { phone: phone.trim(), cpf: somenteDigitos(cpf), birth_date: birthDate, address: address.trim() || undefined, sex: sex.trim() || undefined };
      const saved = perfil ? await atualizarPerfil(payload) : await criarPerfil(payload);
      atualizarPerfilSessao(saved);
      if (!saved.is_active) {
        Alert.alert('Perfil inativo', 'Seu perfil está inativo. Entre em contato com a unidade de saúde para liberar novos agendamentos.');
        return;
      }
      router.replace('/(tabs)');
    } catch (cause) {
      setError(mensagemDeErro(cause, 'Não foi possível salvar seu perfil. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScreenHeader titulo={perfil ? 'Dados do paciente' : 'Complete seu perfil'} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.text}>Nome: {usuario?.user_name}</Text>
            <Text style={styles.text}>E-mail: {usuario?.email}</Text>
            <Campo label="Telefone" value={phone} onChangeText={setPhone} placeholder="(11) 99999-0000" keyboardType="phone-pad" />
            <Campo label="CPF" value={cpf} onChangeText={(v) => setCpf(formatarCpf(v))} placeholder="000.000.000-00" keyboardType="number-pad" maxLength={14} />
            <Campo label="Nascimento (AAAA-MM-DD)" value={birthDate} onChangeText={setBirthDate} placeholder="1990-05-20" />
            <Campo label="Endereço (opcional)" value={address} onChangeText={setAddress} />
            <Campo label="Sexo (opcional)" value={sex} onChangeText={setSex} />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <PrimaryButton label={perfil ? 'Salvar alterações' : 'Salvar perfil'} onPress={salvar} loading={loading} />
            {loading && <ActivityIndicator color="#1CA8DB" />}
          </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Campo(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'phone-pad' | 'number-pad'; maxLength?: number }) {
  const { label, ...inputProps } = props;
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...inputProps} style={styles.input} autoCapitalize="none" /></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#fff' }, flex: { flex: 1 }, content: { padding: 24, gap: 16 }, field: { gap: 6 }, label: { fontSize: 14, color: '#3A4A5C', fontWeight: '600' }, input: { borderBottomWidth: 1, borderColor: '#8292A5', paddingVertical: 10, fontSize: 16, color: '#17212B' }, text: { color: '#3A4A5C', lineHeight: 22 }, title: { fontSize: 20, fontWeight: '700', color: '#17212B', marginBottom: 12 }, inativo: { padding: 24 }, logout: { marginTop: 22 }, error: { color: '#B3261E' } });
