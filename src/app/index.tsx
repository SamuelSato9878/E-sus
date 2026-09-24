import { router } from 'expo-router';
import SplashScreen from '../components/SplashScreen';

export default function Index() {
  return (
    <SplashScreen
      onReady={() => {
        // Troque pela sua próxima rota real (ex: login, onboarding, home)
        router.replace('/login');
      }}
    />
  );
}