import { createContext, useContext } from "react";

export type PreviewState = {
  previews: Record<string, string>;
  previewErrors: Record<string, string>;
  requestPreview: (path: string) => void;
};

const PreviewContext = createContext<PreviewState | null>(null);

export const PreviewProvider = PreviewContext.Provider;

export const usePreview = () => {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error("PreviewProvider is missing");
  }
  return context;
};
