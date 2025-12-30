declare global {
  interface VSCodeApi {
    postMessage: (message: unknown) => void;
    getState: () => unknown;
    setState: (state: unknown) => void;
  }

  function acquireVsCodeApi(): VSCodeApi;

  interface Window {
    __PC_LOCALE__?: string;
  }
}

export {};
