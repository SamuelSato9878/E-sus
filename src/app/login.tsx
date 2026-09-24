import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AuthInput from '../components/AuthInput';
import ErrorText from '../components/ErrorText';
import PrimaryButton from '../components/PrimaryButton';
import SocialButton from '../components/SocialButton';
import { validateLogin } from '../db/Database';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !senha) {
      setErro('Preencha email e senha.');
      return;
    }

    setErro(null);
    setLoading(true);

    // Quando o backend chegar, troque isto pela chamada real de login.
    const resultado = await validateLogin(email, senha);

    setLoading(false);

    if (!resultado.success) {
      setErro(resultado.error);
      return;
    }

    router.replace('/Sucesso');
  }

  return (
    <LinearGradient
      colors={['#5FD3F0', '#1CA8DB']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.container}
    >
      <Image
        source={require('../../assets/images/raio.png')}
        style={styles.raio}
        resizeMode="cover"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Entrar</Text>

          <View style={styles.form}>
            <AuthInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <AuthInput
              label="Senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />

            {/* A tela "esqueci-senha" ainda não existe; o cast evita o erro de typed routes. */}
            <Link href={'/esqueci-senha' as Href} style={styles.forgotLink}>
              Esqueci a senha
            </Link>

            <View style={styles.spacer} />

            <ErrorText>{erro}</ErrorText>

            <PrimaryButton label="Entrar" onPress={handleLogin} loading={loading} />
          </View>

          <View style={styles.socialSpacer} />

          <View style={styles.socialRow}>
            <SocialButton provider="facebook" />
            <SocialButton provider="google" />
          </View>

          <Text style={styles.footerText}>
            você não tem uma conta?{' '}
            <Link href="/cadastro" style={styles.footerLink}>
              CRIAR
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  raio: {
    position: 'absolute',
    top: 60,
    left: 0,
    width: '100%',
    height: 130,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 210,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#3A4A5C',
    marginBottom: 34,
  },
  form: { width: '100%' },
  forgotLink: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#3A4A5C',
    textDecorationLine: 'underline',
    marginTop: -12,
    marginBottom: 4,
  },
  spacer: { height: 14 },
  socialSpacer: { height: 40 },
  socialRow: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
  },
  footerText: {
    marginTop: 24,
    fontSize: 13,
    color: '#3A4A5C',
  },
  footerLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
    color: '#3A4A5C',
  },
});