// Server component
import { AccordionProvider } from './AccordionProvider';

export default function Accordion({ children }: { children: React.ReactNode }) {
  return (
    <AccordionProvider>
      <div className="border divide-y">{children}</div>
    </AccordionProvider>
  );
}
