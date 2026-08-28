import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Messages(){
    
    return(

        <SafeAreaView className="flex-1 bg-blue-200">
            <View>
                <Text>Mensagens</Text>
            </View>
        </SafeAreaView>
    )
}