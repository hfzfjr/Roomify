import Navbar from '@/components/layout/Navbar'
import '@/styles/layout.css'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="customer-layout">
      <Navbar />
      <main className="customer-main" style={{ marginTop: '80px' }}>
        {children}
      </main>
    </div>
  )
}
