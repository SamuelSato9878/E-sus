import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile(){
    
    return(
        <SafeAreaView className="flex-1 bg-green-400">
            <View>
                <Text>Perfil</Text>
            </View>
        </SafeAreaView>
    )
}