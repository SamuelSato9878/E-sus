import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AuthInput from '../components/AuthInput';
import ErrorText from '../components/ErrorText';
import PrimaryButton from '../components/PrimaryButton';
import SocialButton from '../components/SocialButton';
import { createUser } from '../db/Database';

const SENHA_MIN = 8;

export default function Cadastro() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function validar(): string | null {
    if (!email.trim()) return 'Informe um email.';
    if (senha.length < SENHA_MIN) return `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`;
    if (senha !== confirmarSenha) return 'As senhas não coincidem.';
    if (!aceitouTermos) return 'Você precisa aceitar os Termos e a Política de Privacidade.';
    return null;
  }

  async function handleCadastro() {
    const erroValidacao = validar();
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setErro(null);
    setLoading(true);

    // Quando o backend chegar, troque isto pela chamada real de cadastro.
    const resultado = await createUser(email, senha);

    setLoading(false);

    if (!resultado.success) {
      setErro(resultado.error);
      return;
    }

    router.replace('/login');
  }

  return (
    <LinearGradient
      colors={['#5FD3F0', '#1CA8DB']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>bem vindo!</Text>

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
            <AuthInput
              label="Confirmar senha"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
            />

            <Pressable
              style={styles.checkboxRow}
              onPress={() => setAceitouTermos((v) => !v)}
            >
              <View style={[styles.checkbox, aceitouTermos && styles.checkboxChecked]}>
                {aceitouTermos && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxText}>
                Aceito os <Text style={styles.bold}>Termos</Text> e a{' '}
                <Text style={styles.bold}>Política de Privacidade</Text>.
              </Text>
            </Pressable>

            <View style={styles.spacer} />

            <ErrorText>{erro}</ErrorText>

            <PrimaryButton label="Cadastre-se" onPress={handleCadastro} loading={loading} />
          </View>

          <Text style={styles.entrarCom}>Entrar com</Text>

          <View style={styles.socialRow}>
            <SocialButton provider="facebook" />
            <SocialButton provider="google" />
          </View>

          <Text style={styles.footerText}>
            eu tenho uma conta{' '}
            <Link href="/login" style={styles.footerLink}>
              ENTRAR
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 70,
    paddingBottom: 32,
    alignItems: 'center',
  },
  logo: { width: 92, height: 92, marginBottom: 18 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#3A4A5C',
    marginBottom: 34,
  },
  form: { width: '100%' },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#3A4A5C',
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1CA8DB',
    borderColor: '#1CA8DB',
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: '#3A4A5C',
    lineHeight: 16,
  },
  bold: { fontWeight: '700' },
  spacer: { height: 14 },
  entrarCom: {
    marginTop: 30,
    marginBottom: 14,
    fontSize: 13,
    color: '#3A4A5C',
  },
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