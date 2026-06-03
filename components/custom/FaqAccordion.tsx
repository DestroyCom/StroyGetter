"use client";

import { track } from "@/lib/analytics";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  q: string;
  a: string;
}

interface Props {
  faqs: FaqItem[];
  page: string;
}

export function FaqAccordion({ faqs, page }: Props) {
  return (
    <Accordion
      type="single"
      collapsible
      className="flex flex-col gap-2"
      onValueChange={(value) => {
        if (!value) return;
        const index = parseInt(value.replace("faq-", ""), 10);
        const question = faqs[index]?.q;
        if (question) track("faq_opened", { page, question });
      }}
    >
      {faqs.map((item, i) => (
        <AccordionItem
          key={item.q}
          value={`faq-${i}`}
          className="rounded-xl border border-white/10 bg-white/2 px-5 data-[state=open]:border-white/20 data-[state=open]:bg-white/4"
        >
          <AccordionTrigger className="py-4 text-left text-[15px] font-semibold hover:no-underline">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-sm leading-[1.65] text-white/75">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
