import Navbar from '@/components/layout/Navbar'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="customer-layout">
      <Navbar />
      <main className="customer-main" style={{ marginTop: '120px' }}>
        {children}
      </main>
    </div>
  )
}
