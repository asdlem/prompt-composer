export const vscodeApi = acquireVsCodeApi();

export const getWebviewState = <T>() => vscodeApi.getState() as T | undefined;

export const setWebviewState = (state: unknown) => {
  vscodeApi.setState(state);
};

export const postWebviewMessage = (message: unknown) => {
  vscodeApi.postMessage(message);
};
