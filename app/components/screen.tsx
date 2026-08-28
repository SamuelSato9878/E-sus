import React from "react";

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ViewProps,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = ViewProps & {
  children: React.ReactNode;
  scroll?: boolean;
};

export function Screen({
  children,
  scroll = true,
  ...props
}: ScreenProps) {
  return (
    <SafeAreaView
    className="bg-white"
      {...props}
    >
      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios"
                ? "interactive"
                : "on-drag"
            }
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}