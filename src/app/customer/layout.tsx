import '@/styles/layout.css'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="customer-layout">
      <main className="customer-main">
        {children}
      </main>
    </div>
  )
}
