// Typed event bus shared by all teams. Every remote runs in the host's single JS
// runtime, and the host shares this package as a Module Federation singleton, so
// all teams publish and subscribe on the same bus. Plain TypeScript, no framework.

/** Event names and payloads. A team owns the events prefixed with its name. */
export interface TractorEvents {
  /** The cart changed. Listeners reread the cart from Checkout. */
  "checkout:cart-updated": undefined;
  /** The user picked a store in Explore's store picker. */
  "explore:store-selected": { storeId: string };
}

export type EventName = keyof TractorEvents;

type Listener<K extends EventName> = (payload: TractorEvents[K]) => void;
type PayloadArgs<K extends EventName> = TractorEvents[K] extends undefined
  ? []
  : [payload: TractorEvents[K]];

const listeners = new Map<EventName, Set<Listener<never>>>();

/** Calls every listener of `type`. A failing listener doesn't stop the others. */
export function publish<K extends EventName>(
  type: K,
  ...[payload]: PayloadArgs<K>
): void {
  for (const listener of [...(listeners.get(type) ?? [])]) {
    try {
      (listener as Listener<K>)(payload as TractorEvents[K]);
    } catch (error) {
      console.error(`Listener for "${type}" failed`, error);
    }
  }
}

/** Listens to `type` and returns a function that stops listening. */
export function subscribe<K extends EventName>(
  type: K,
  listener: Listener<K>,
): () => void {
  let set = listeners.get(type);
  if (!set) {
    set = new Set();
    listeners.set(type, set);
  }
  set.add(listener as Listener<never>);
  return () => {
    set.delete(listener as Listener<never>);
  };
}
