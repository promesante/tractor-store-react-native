// React Native and Node both provide console, but the ES2022 lib does not declare it,
// and the DOM lib would bring in browser types that React Native lacks.
declare const console: { error(...data: unknown[]): void };
