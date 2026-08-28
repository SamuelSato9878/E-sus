import { TextInput, TextInputProps} from "react-native"

export function Input({...rest}: TextInputProps) {
    return (
        <TextInput 
            {...rest} 
            className="
                text-2xl
                w-full
                h-16
                rounded-xl
                border
                border-slate-500
                bg-white
                px-6
                
                text-base
                text-slate-900" 
            placeholderTextColor="#94A3B8">

        </TextInput>
    )
}