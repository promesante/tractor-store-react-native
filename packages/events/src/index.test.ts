import { afterEach, describe, expect, it, vi } from "vitest";
import { publish, subscribe } from "./index";

describe("event bus", () => {
  const unsubscribers: Array<() => void> = [];
  afterEach(() => unsubscribers.splice(0).forEach((stop) => stop()));

  it("delivers the payload to every listener of the event", () => {
    const first = vi.fn();
    const second = vi.fn();
    unsubscribers.push(subscribe("explore:store-selected", first));
    unsubscribers.push(subscribe("explore:store-selected", second));

    publish("explore:store-selected", { storeId: "store-a" });

    expect(first).toHaveBeenCalledWith({ storeId: "store-a" });
    expect(second).toHaveBeenCalledWith({ storeId: "store-a" });
  });

  it("does not deliver other events", () => {
    const listener = vi.fn();
    unsubscribers.push(subscribe("checkout:cart-updated", listener));

    publish("explore:store-selected", { storeId: "store-a" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("stops delivering after unsubscribe", () => {
    const listener = vi.fn();
    const stop = subscribe("checkout:cart-updated", listener);

    stop();
    publish("checkout:cart-updated");

    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps delivering when a listener throws", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const after = vi.fn();
    unsubscribers.push(
      subscribe("checkout:cart-updated", () => {
        throw new Error("boom");
      }),
    );
    unsubscribers.push(subscribe("checkout:cart-updated", after));

    publish("checkout:cart-updated");

    expect(after).toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
