import { isAxiosError } from 'axios';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { mensagemDeErro } from '../services/api';
import { redefinirSenha, solicitarRecuperacaoSenha } from '../services/auth';

export default function EsqueciSenha() {
  const params = useLocalSearchParams<{ access_token?: string; refresh_token?: string; email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accessToken, setAccessToken] = useState(params.access_token ?? '');
  const [refreshToken, setRefreshToken] = useState(params.refresh_token ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const updateFromUrl = (url: string | null | undefined) => {
      if (!url) return;
      const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
      const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';
      const token = new URLSearchParams(`${query}&${hash}`).get('access_token');
      const refresh = new URLSearchParams(`${query}&${hash}`).get('refresh_token');
      if (token) setAccessToken(token);
      if (refresh) setRefreshToken(refresh);
    };
    void Linking.getInitialURL().then(updateFromUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => updateFromUrl(url));
    return () => subscription.remove();
  }, [accessToken]);

  async function submit() {
    setBusy(true); setError(''); setMessage('');
    try {
      if (accessToken) {
        if (password.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
        if (password !== confirm) throw new Error('As senhas não coincidem.');
        if (!refreshToken) throw new Error('O link de redefinição expirou. Solicite outro e-mail.');
        await redefinirSenha(accessToken, refreshToken, password);
        setMessage('Senha atualizada. Volte ao login para entrar.');
      } else {
        if (!email.trim()) throw new Error('Informe seu e-mail.');
        await solicitarRecuperacaoSenha(email);
        setMessage('Se o e-mail estiver cadastrado, você receberá as instruções para criar uma nova senha.');
      }
    } catch (cause) {
      setError(isAxiosError(cause)
        ? mensagemDeErro(cause, 'Não foi possível concluir o pedido. Tente novamente.')
        : cause instanceof Error ? cause.message : 'Não foi possível concluir o pedido. Tente novamente.');
    } finally { setBusy(false); }
  }

  return <View style={styles.container}><ScreenHeader titulo="Recuperar senha" />
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        {!accessToken ? <>
          <Text style={styles.description}>Informe o e-mail da sua conta. Enviaremos instruções para redefinir a senha.</Text>
          <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="E-mail" />
        </> : <>
          <Text style={styles.description}>Escolha uma nova senha para sua conta.</Text>
          <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} placeholder="Nova senha" />
          <TextInput style={styles.input} secureTextEntry value={confirm} onChangeText={setConfirm} placeholder="Confirme a senha" />
        </>}
        {!!message && <Text style={styles.message}>{message}</Text>}{!!error && <Text style={styles.error}>{error}</Text>}
        {busy && <ActivityIndicator color="#1CA8DB" />}
        <PrimaryButton label={accessToken ? 'Salvar nova senha' : 'Enviar instruções'} onPress={submit} loading={busy} />
        <Link href="/login" style={styles.link}>Voltar ao login</Link>
      </View>
    </KeyboardAvoidingView>
  </View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#fff' }, flex: { flex: 1 }, content: { padding: 24, gap: 18 }, description: { color: '#536579', lineHeight: 22 }, input: { borderBottomWidth: 1, borderColor: '#8292A5', paddingVertical: 12, fontSize: 16, color: '#17212B' }, message: { color: '#087B55' }, error: { color: '#B3261E' }, link: { color: '#0866A3', textAlign: 'center', textDecorationLine: 'underline' } });
