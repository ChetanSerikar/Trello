// app/accordion/page.tsx (server component)

import Accordion from "@/components/Accordion";
import { AccordionItem } from "@/components/AccordionItem";


export default function AccordionPage() {
  return (
    <Accordion>
      <AccordionItem index={0} title="What is Next.js?">
        Next.js is a React framework with hybrid rendering.
      </AccordionItem>
      <AccordionItem index={1} title="What is Server Component?">
        Server Components allow rendering on the server without sending JS to the client.
      </AccordionItem>
    </Accordion>
  );
}
