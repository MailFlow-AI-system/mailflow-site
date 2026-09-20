import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'

type FaqItem = {
  question: string
  answer?: string
}

const faqItems: FaqItem[] = [
  {
    question: 'Do I need to switch my current email provider?',
    answer:
      'No. You connect your existing Gmail, Outlook, or SMTP accounts and manage everything inside MailFlow AI.',
  },
  {
    question: 'Does AI cost extra?',
    answer:
      'The AI assistant is included in the Pro and Enterprise plans. On Starter, you get a generous monthly usage allowance.',
  },
  {
    question: 'Can I import my contact lists?',
    answer:
      'Yes. Import via CSV, API, or direct integrations. MailFlow AI automatically detects fields and duplicates.',
  },
  {
    question: 'Is there a long-term contract?',
    answer: 'No. You can cancel or change plans at any time, with no cancellation fees.',
  },
] as const

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

export { faqItems }
