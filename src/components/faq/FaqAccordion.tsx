"use client"

import { useState } from 'react'
import styles from './faq.module.css'

type Item = {
  question: string
  answer: string
}

export default function FaqAccordion({ items }: { items: Item[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggle(i: number) {
    setOpenIndex((current) => (current === i ? null : i))
  }

  return (
    <div className={styles.accordion}>
      {items.map((it, i) => (
        <div className={styles.accordionItem} key={i}>
          <button
            className={styles.accordionButton}
            onClick={() => toggle(i)}
            aria-expanded={openIndex === i}
          >
            <span className={styles.question}>{it.question}</span>
            <span className={`${styles.chev} ${openIndex === i ? styles.open : ''}`} />
          </button>

          <div
            className={`${styles.accordionPanel} ${openIndex === i ? styles.openPanel : ''}`}
            aria-hidden={openIndex !== i}
          >
            <p className={styles.answerText}>{it.answer}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
