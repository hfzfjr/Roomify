# TODO: Tambah Ikon Tombol Navigasi seperti di dashboard-owner.html

## Langkah Approved Plan:

- [ ] 1. Install lucide-react jika perlu (opsional, gunakan SVG pure)
- [x] 2. Update Navbar.tsx: Tambah SVG icons ke sb-item untuk Dashboard, Help, tambah Reviews & Laporan
- [x] 3. OwnerDashboard.tsx: Ganti emoji dengan SVG dari HTML (Dashboard grid, Reviews chat, Laporan chart, Help circle)
- [x] 4. AdminDashboard.tsx: Serupa ganti emoji
- [ ] 5. Test navigasi dan tampilan di browser
- [ ] 6. Complete task

**SVG Icons dari gambar:**

1. Dashboard: `<rect x="3" y="3" width="7" height="7" rx="1"/> x4`
2. Reviews: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`
3. Laporan: `<path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/>`
4. Help: `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>`
