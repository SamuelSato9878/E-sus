import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MedicoAvatar from '../components/MedicoAvatar';
import ScreenHeader from '../components/ScreenHeader';
import { useCriarAgendamento } from '../hooks/useCriarAgendamento';
import { useMedico } from '../hooks/useMedico';
import { formatarCpf } from '../utils/cpf';
import { formatarDataExtenso } from '../utils/datas';

export default function ConfirmarConsulta() {
  const params = useLocalSearchParams<{ medicoId: string; data: string; hora: string }>();
  const medicoId = Number(params.medicoId);
  const insets = useSafeAreaInsets();

  const { medico } = useMedico(medicoId);
  const { enviar, enviando, erro } = useCriarAgendamento();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [motivo, setMotivo] = useState('');

  async function handleEnviar() {
    const ok = await enviar({ medicoId, data: params.data, hora: params.hora, nome, cpf, motivo });
    // A integração com o WhatsApp da UBS fica a cargo do backend;
    // aqui o agendamento é apenas registrado como "pendente".
    if (ok) router.replace('/agendamento-enviado');
  }

  return (
    <View style={styles.container}>
      <ScreenHeader titulo="Confirme sua consulta" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <MedicoAvatar fotoUrl={medico?.fotoUrl ?? null} size={110} />
            <View style={styles.cardInfo}>
              <Text style={styles.medicoNome}>{medico?.nome ?? ' '}</Text>
              <Text style={styles.data}>{formatarDataExtenso(params.data)}</Text>
              <Text style={styles.hora}>{params.hora}h</Text>
            </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>nome:</Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="[ nome completo ]"
              placeholderTextColor="#A0A0A0"
              autoCapitalize="words"
              style={styles.input}
            />

            <Text style={styles.label}>CPF:</Text>
            <TextInput
              value={cpf}
              onChangeText={(t) => setCpf(formatarCpf(t))}
              placeholder="[ 000.000.000-00 ]"
              placeholderTextColor="#A0A0A0"
              keyboardType="number-pad"
              maxLength={14}
              style={styles.input}
            />

            <TextInput
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Sintomas / motivo (opcional)"
              placeholderTextColor="#A0A0A0"
              multiline
              textAlignVertical="top"
              style={styles.motivo}
            />
          </View>

          <View style={styles.alerta}>
            <Ionicons name="warning-outline" size={28} color="#3A3A3A" />
            <Text style={styles.alertaTexto}>
              Este agendamento será validado pelo WhatsApp da UBS para confirmação final.
            </Text>
          </View>

          {erro && <Text style={styles.erro}>{erro}</Text>}

          <Pressable
            onPress={handleEnviar}
            disabled={enviando}
            style={({ pressed }) => [styles.botao, (pressed || enviando) && styles.botaoPressed]}
          >
            {enviando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
                <Text style={styles.botaoTexto}>ENVIAR PARA WHATSAPP</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  conteudo: { paddingHorizontal: 20, paddingTop: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#D2D2D2',
    borderRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardInfo: { flex: 1, alignItems: 'center' },
  medicoNome: { fontSize: 17, fontWeight: '700', color: '#111111', marginBottom: 12 },
  data: { fontSize: 15, color: '#333333', textAlign: 'center' },
  hora: { fontSize: 15, fontWeight: '700', color: '#111111', marginTop: 18 },
  form: { paddingHorizontal: 20, marginTop: 50 },
  label: { fontSize: 16, color: '#222222', marginTop: 16 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#6B7C93',
    fontSize: 14,
    color: '#222222',
    paddingVertical: 4,
    paddingHorizontal: 30,
  },
  motivo: {
    alignSelf: 'center',
    width: '75%',
    height: 100,
    borderWidth: 1,
    borderColor: '#555555',
    marginTop: 14,
    padding: 6,
    fontSize: 13,
    color: '#222222',
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFE484',
    borderTopRightRadius: 50,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginTop: 8,
  },
  alertaTexto: { flex: 1, fontSize: 13, color: '#222222' },
  erro: { color: '#B3261E', fontSize: 13, textAlign: 'center', marginTop: 16 },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#7ED957',
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginTop: 28,
  },
  botaoPressed: { opacity: 0.8 },
  botaoTexto: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
});
