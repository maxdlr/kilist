import React, { createContext, ReactNode } from "react";

const PreviewContext = createContext(false);

export const PreviewProvider = ({ children }: { children: ReactNode }) => (
  <PreviewContext.Provider value={true}>{children}</PreviewContext.Provider>
);

export const useIsPreview = () => React.useContext(PreviewContext);
