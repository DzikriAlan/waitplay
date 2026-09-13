'use client'

import type { LocaleText } from '@/shared/states/localeStates'

interface Props {
  about: LocaleText['about']
}

// Teks pengantar dan FAQ dirender di server supaya mesin pencari dan asisten AI paham isi Waitplay.
export default function StoreAbout({ about }: Props) {
  return (
    <section className="flex flex-col gap-6 border-t border-[#1c1c20] pt-6 sm:grid sm:grid-cols-2 sm:gap-10 sm:pt-8">
      <div className="flex flex-col gap-3">
        <h2 className="text-[18px] font-black uppercase leading-none tracking-tight text-[#f2ede1] sm:text-[20px]">
          {about.title}
        </h2>
        {about.body.map((paragraph) => (
          <p key={paragraph} className="text-[13px] font-medium leading-relaxed text-[#9aa3b2] sm:text-[14px]">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-[18px] font-black uppercase leading-none tracking-tight text-[#f2ede1] sm:text-[20px]">
          {about.faqTitle}
        </h2>
        <div className="flex flex-col divide-y divide-[#1c1c20]">
          {about.faq.map((item) => (
            <details key={item.question} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-semibold text-[#f2ede1] sm:text-[14px] [&::-webkit-details-marker]:hidden">
                <h3>{item.question}</h3>
                <span aria-hidden="true" className="shrink-0 text-[#9aa3b2] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#9aa3b2]">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
