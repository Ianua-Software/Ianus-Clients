import * as React from 'react';

export type LicenseContextType = {
    license?: string;
    setLicense: (license?: string) => void;
};

export const LicenseContext = React.createContext<LicenseContextType | null>(null);

export const LicenseProvider: React.FC<React.ReactNode> = ({ children }) => {
  const [ license, setLicense ] = React.useState<string | undefined>("");

  return <LicenseContext.Provider value={{ license, setLicense }}>{children}</LicenseContext.Provider>;
};