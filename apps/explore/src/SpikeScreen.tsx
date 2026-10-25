import "./global.css";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { publish } from "@tractor/events";
import { Button, ButtonText } from "@tractor/ui";

// Spike: a widget owned by another team, loaded at runtime from Checkout's bundle.
const CheckoutWidget = React.lazy(() => import("checkout/SpikeWidget"));

const stores = ["Aurora Flagship Store", "Big Micro Machines", "Central Mall"];

export default function SpikeScreen() {
  const [next, setNext] = React.useState(0);

  const selectStore = () => {
    publish("explore:store-selected", { storeId: stores[next] });
    setNext((next + 1) % stores.length);
  };

  return (
    <View className="flex-1 gap-4 border-4 border-red-600 p-4">
      <Text className="text-lg font-bold text-red-700">Explore remote</Text>
      <Button action="primary" onPress={selectStore}>
        <ButtonText>Select {stores[next]}</ButtonText>
      </Button>
      <React.Suspense fallback={<ActivityIndicator />}>
        <CheckoutWidget />
      </React.Suspense>
    </View>
  );
}
