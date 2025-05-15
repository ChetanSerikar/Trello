'use client';
import { useAccordion } from './AccordionProvider';

export function AccordionItem({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  const { openIndex, toggle } = useAccordion();

  const isOpen = openIndex === index;

  return (
    <div>
      <button
        onClick={() => toggle(index)}
        className="w-full text-left px-4 py-2 bg-gray-100"
      >
        {title}
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}
