import React, { createContext, useContext, useState } from "react";

const Layout = createContext();

export function LayoutProvider({ children }) {
  const [value, setValue] = useState({});

  return <Layout.Provider value={{ value, setValue }}>{children}</Layout.Provider>;
}

export function useContextLayout() {
  return useContext(Layout);
}
