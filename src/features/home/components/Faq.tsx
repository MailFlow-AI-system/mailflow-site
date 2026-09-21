import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@mailflow/ui/components'

import { faqItems } from '../constants/faqItems'

export default function Faq() {
  return (
    <section className="bg-muted/30 px-4 py-24 md:px-6" id="faq">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-muted-foreground">
            Still have questions? Our team is ready to help.
          </p>
        </div>

        <Accordion className="mt-14 gap-3" defaultValue={undefined}>
          {faqItems.map((item, index) => (
            <AccordionItem
              className="cursor-pointer rounded-xl border border-border/60 bg-card/60 px-5 py-4 transition-colors data-[open]:bg-card"
              key={item.question}
              value={`faq-${index}`}
            >
              <AccordionTrigger
                aria-controls={`faq-panel-${index}`}
                className="w-full py-0 text-sm font-semibold text-foreground"
              >
                {item.question}
              </AccordionTrigger>
              <AccordionContent
                className="text-sm leading-relaxed"
                id={`faq-panel-${index}`}
                keepMounted
              >
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
