import { router, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSessao } from '../../context/SessaoContext';

export default function Perfil() {
  const { usuario, perfil, perfilCarregando } = useSessao();
  return <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <View style={styles.header}><Text style={styles.heading}>Minha conta</Text><Text style={styles.name}>{usuario?.user_name}</Text><Text style={styles.email}>{usuario?.email}</Text></View>
    {perfilCarregando ? <ActivityIndicator color="#1CA8DB" /> : perfil ? <View style={styles.card}>
      <Item label="Telefone" value={perfil.phone || 'Não informado'} /><Item label="CPF" value={perfil.cpf ? `•••.•••.•••-${perfil.cpf.slice(-2)}` : 'Não informado'} /><Item label="Nascimento" value={perfil.birth_date || 'Não informado'} /><Item label="Endereço" value={perfil.address || 'Não informado'} /><Item label="Status do perfil" value={perfil.is_active ? 'Ativo' : 'Inativo'} />
      {!perfil.is_active && <Text style={styles.profileHint}>Adicione telefone, CPF e data de nascimento para liberar agendamentos. Você pode fazer isso quando quiser.</Text>}
    </View> : <View style={styles.incomplete}><Text style={styles.incompleteTitle}>Seus dados</Text><Text style={styles.detail}>Nome: {usuario?.user_name}</Text><Text style={styles.detail}>E-mail: {usuario?.email}</Text><Text style={styles.detail}>Você pode adicionar telefone, CPF e data de nascimento quando quiser.</Text></View>}
    <Pressable style={styles.primary} onPress={() => router.push('/perfil-paciente' as Href)}><Text style={styles.primaryText}>{perfil?.is_active ? 'Editar meus dados' : 'Completar meu perfil'}</Text></Pressable>
    <Pressable style={styles.secondary} onPress={() => router.navigate('/agendamentos')}><Text style={styles.secondaryText}>Minhas consultas</Text></Pressable>
  </ScrollView>;
}

function Item({ label, value }: { label: string; value: string }) { return <View style={styles.item}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>; }

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#2FBEE8' }, content: { flexGrow: 1, padding: 22, paddingTop: 32, paddingBottom: 120 }, header: { marginBottom: 24 }, heading: { fontSize: 26, fontWeight: '700', color: '#fff' }, name: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 20 }, email: { color: '#EAF8FD', marginTop: 4 }, card: { backgroundColor: '#fff', paddingHorizontal: 18, borderRadius: 14 }, item: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#D4E0E8' }, label: { color: '#8292A5', fontSize: 12 }, value: { color: '#17212B', fontSize: 16, marginTop: 4 }, detail: { color: '#fff', lineHeight: 22, marginTop: 8 }, profileHint: { color: '#536579', lineHeight: 20, paddingVertical: 12 }, incomplete: { backgroundColor: 'rgba(255,255,255,0.14)', padding: 16, borderRadius: 14 }, incompleteTitle: { fontSize: 18, fontWeight: '700', color: '#fff' }, primary: { padding: 15, backgroundColor: '#FABC07', alignItems: 'center', borderRadius: 12, marginTop: 20 }, primaryText: { fontWeight: '700', color: '#17212B' }, secondary: { padding: 15, backgroundColor: '#fff', alignItems: 'center', borderRadius: 12, marginTop: 12 }, secondaryText: { fontWeight: '700', color: '#0866A3' } });
