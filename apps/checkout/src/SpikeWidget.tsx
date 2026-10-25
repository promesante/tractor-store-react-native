import "./global.css";
import React from "react";
import { Text, View } from "react-native";
import { subscribe } from "@tractor/events";

export default function SpikeWidget() {
  const [storeId, setStoreId] = React.useState<string>();

  React.useEffect(
    () =>
      subscribe("explore:store-selected", (event) => setStoreId(event.storeId)),
    [],
  );

  return (
    <View className="gap-1 border-4 border-yellow-400 p-3">
      <Text className="font-bold text-yellow-700">Checkout widget</Text>
      <Text testID="selected-store">Store: {storeId ?? "none selected"}</Text>
    </View>
  );
}
