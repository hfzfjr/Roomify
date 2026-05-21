"use client"

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import FaqAccordion from './FaqAccordion'
import styles from './faq.module.css'

type Category = {
  id: string
  title: string
  description?: string
  items: { question: string; answer: string }[]
}

export default function FaqPage({ categories }: { categories: Category[] }) {
  const [selected, setSelected] = useState(0)

  return (
    <div className={styles.pageWrap}>
      <Navbar />

      <main className={styles.container}>
        <aside className={styles.leftCard}>
          <h3 className={styles.leftTitle}>Pertanyaan</h3>
          <ul className={styles.catList}>
            {categories.map((c, i) => (
              <li key={c.id}>
                <button
                  className={`${styles.catButton} ${i === selected ? styles.active : ''}`}
                  onClick={() => setSelected(i)}
                >
                  {c.title}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className={styles.rightContent}>
          <div className={styles.headerCard}>
            <h2>{categories[selected].title}</h2>
            {categories[selected].description && <p className={styles.caption}>{categories[selected].description}</p>}
          </div>

          <div className={styles.accordionWrap}>
            <FaqAccordion items={categories[selected].items} />
          </div>
        </section>
      </main>
    </div>
  )
}
