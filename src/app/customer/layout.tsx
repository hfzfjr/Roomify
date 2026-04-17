export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <h1>Customer Layout</h1>
      {children}
    </div>
  )
}