import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
//import { Image } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'green', headerShown:false}}>
      <Tabs.Screen 
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,

          /* exempo de uso para minha imagens próprias
          tabBarIcon: ({focused}) => (
            <Image
              source={require("../../assets/images/icon.png")}
              className={`w-16 h-16 ${focused ? 'opacity-100' : 'opacity-50'}`}
            ></Image>
          ),*/
        }}
      />

      <Tabs.Screen
      name='appointments'
      options={{
        title: 'Agendamento',
        tabBarIcon: ({ color }) => <FontAwesome size={28} name="calendar" color={color} />,
      }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mensagens',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="heart" color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
