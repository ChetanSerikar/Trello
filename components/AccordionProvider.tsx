'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// 1. Define a proper type for the context value
type AccordionContextType = {
  openIndex: number | null;
  toggle: (index: number) => void;
};

// 2. Default to undefined so TypeScript enforces usage within a provider
const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

// 3. Hook to use the context safely
export function useAccordion() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("useAccordion must be used within <AccordionProvider>");
  return ctx;
}

// 4. Provider implementation
export function AccordionProvider({ children }: { children: ReactNode }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  const value: AccordionContextType = { openIndex, toggle };

  return (
    <AccordionContext.Provider value={value}>
      {children}
    </AccordionContext.Provider>
  );
}
