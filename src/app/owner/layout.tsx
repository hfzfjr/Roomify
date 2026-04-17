export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <h1>Owner Layout</h1>
      {children}
    </div>
  )
}