import "./global.css";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GluestackUIProvider } from "@tractor/ui";

// Spike: one remote screen, loaded at runtime from Explore's bundle.
const ExploreScreen = React.lazy(() => import("explore/SpikeScreen"));

class RemoteBoundary extends React.Component<
  React.PropsWithChildren,
  { error?: Error }
> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-error-600">
            Could not load Explore: {this.state.error.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function Explore() {
  return (
    <RemoteBoundary>
      <React.Suspense
        fallback={<ActivityIndicator className="flex-1" size="large" />}
      >
        <ExploreScreen />
      </React.Suspense>
    </RemoteBoundary>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GluestackUIProvider mode="light">
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Explore"
            component={Explore}
            options={{ title: "Tractor Store" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GluestackUIProvider>
  );
}
