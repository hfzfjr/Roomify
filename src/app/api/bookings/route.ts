import { NextResponse } from 'next/server'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureCustomerRecord } from '@/lib/customer'
import { getPaymentDeadline, isPendingPaymentExpired } from '@/utils/booking'
import { formatDateForDatabase } from '@/utils/formatDate'

type BookingRoomRecord = {
  room_id: string
  name: string
  location: string
  capacity: number
  image_url?: string | null
  images?: string[]
  region?: Array<{
    name: string
    province?: Array<{
      name: string
    }> | null
  }> | null
}

function getNextBookingId(existingIds: Array<{ booking_id: string }>) {
  const nextIteration = existingIds
    .map(item => Number(item.booking_id?.split('-')[1] ?? 0))
    .reduce((highest, value) => Math.max(highest, value), 0) + 1

  return `b-${String(nextIteration).padStart(2, '0')}`
}

function getNextFacilityRequestId(existingIds: Array<{ request_id: string }>) {
  const nextIteration = existingIds
    .map(item => Number(item.request_id?.split('-')[1] ?? 0))
    .reduce((highest, value) => Math.max(highest, value), 0) + 1

  return `fr-${String(nextIteration).padStart(2, '0')}`
}

function getNextPaymentId(existingIds: Array<{ payment_id: string }>) {
  const nextIteration = existingIds
    .map(item => Number(item.payment_id?.split('-')[1] ?? 0))
    .reduce((highest, value) => Math.max(highest, value), 0) + 1

  return `p-${String(nextIteration).padStart(2, '0')}`
}

function getNextInvoiceId(existingIds: Array<{ invoice_id: string }>) {
  const nextIteration = existingIds
    .map(item => Number(item.invoice_id?.split('-')[1] ?? 0))
    .reduce((highest, value) => Math.max(highest, value), 0) + 1

  return `inv-${String(nextIteration).padStart(2, '0')}`
}

function formatInvoiceCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID').format(amount)
}

function formatInvoiceDateTime(dateValue: string) {
  const parsedDate = new Date(dateValue)
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue
  }

  const datePart = parsedDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  const timePart = parsedDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return `${datePart} ${timePart}`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function resolvePdfBrowserExecutablePath() {
  const candidates = [
    process.env.PDF_BROWSER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ].filter(Boolean) as string[]

  const match = candidates.find(candidate => existsSync(candidate))
  return match ?? null
}

let receiptLogoDataUriCache: string | null | undefined

async function getReceiptLogoDataUri() {
  if (receiptLogoDataUriCache !== undefined) {
    return receiptLogoDataUriCache
  }

  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'roomify-biru.png')
    const logoBuffer = await readFile(logoPath)
    receiptLogoDataUriCache = `data:image/png;base64,${logoBuffer.toString('base64')}`
    return receiptLogoDataUriCache
  } catch {
    receiptLogoDataUriCache = null
    return null
  }
}

function toPdfSafeText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function formatInvoiceDateOnly(dateValue: string) {
  const parsedDate = new Date(dateValue)
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue
  }

  return parsedDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function formatInvoiceTimeOnly(dateValue: string) {
  const parsedDate = new Date(dateValue)
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue
  }

  return parsedDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getInvoicePaymentMethodLabel(method: string) {
  const normalizedMethod = method.toLowerCase()
  const labels: Record<string, string> = {
    qris: 'QRIS',
    bca_va: 'Transfer Virtual Account BCA',
    bni_va: 'Transfer Virtual Account BNI',
    gopay: 'GoPay'
  }

  return labels[normalizedMethod] || method
}

type ReceiptPdfData = {
  invoiceId: string
  bookingId: string
  customerName: string
  customerEmail: string
  roomName: string
  roomLocation: string
  paymentMethod: string
  paidAt: string
  checkIn: string
  checkOut: string
  durationHours: number
  subtotal: number
  serviceFee: number
  taxAmount: number
  totalAmount: number
}

function buildReceiptPdfHtml(data: ReceiptPdfData, logoDataUri: string | null) {
  const printedAt = formatInvoiceDateTime(data.paidAt)
  const paidDate = formatInvoiceDateOnly(data.paidAt)
  const checkInDate = formatInvoiceDateOnly(data.checkIn)
  const checkInTime = formatInvoiceTimeOnly(data.checkIn)
  const checkOutTime = formatInvoiceTimeOnly(data.checkOut)
  const durationHours = `${Math.round(data.durationHours)} jam`

  const rows = {
    invoiceId: escapeHtml(data.invoiceId || '-'),
    bookingId: escapeHtml(data.bookingId || '-'),
    customerName: escapeHtml(data.customerName || '-'),
    customerEmail: escapeHtml(data.customerEmail || '-'),
    roomName: escapeHtml(data.roomName || '-'),
    roomLocation: escapeHtml(data.roomLocation || '-'),
    paymentMethod: escapeHtml(getInvoicePaymentMethodLabel(data.paymentMethod || '-')),
    paidDate: escapeHtml(paidDate),
    checkInDate: escapeHtml(checkInDate),
    timeRange: escapeHtml(`${checkInTime} - ${checkOutTime}`),
    durationHours: escapeHtml(durationHours),
    subtotal: escapeHtml(`Rp ${formatInvoiceCurrency(data.subtotal)}`),
    serviceFee: escapeHtml(`Rp ${formatInvoiceCurrency(data.serviceFee)}`),
    taxAmount: escapeHtml(`Rp ${formatInvoiceCurrency(data.taxAmount)}`),
    totalAmount: escapeHtml(`Rp ${formatInvoiceCurrency(data.totalAmount)}`),
    printedAt: escapeHtml(printedAt)
  }

  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" alt="Roomify" class="receipt-logo" />`
    : `<div class="receipt-logo-fallback">ROOMIFY</div>`

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Struk Pembayaran ${rows.invoiceId}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
    }
    body {
      margin: 0;
      padding: 24px;
      font-family: "Plus Jakarta Sans", Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
    }
    .receipt-paper {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      width: 100%;
      max-width: 760px;
      margin: 0 auto;
    }
    .receipt-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .receipt-logo {
      width: 140px;
      height: auto;
      display: block;
    }
    .receipt-logo-fallback {
      font-size: 24px;
      font-weight: 800;
      color: #0bbbe7;
      letter-spacing: 0.06em;
    }
    .receipt-status-badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #dcfce7;
      color: #16a34a;
      border: 1px solid #86efac;
    }
    .receipt-invoice-number {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .receipt-invoice-number span {
      font-size: 13px;
      color: #64748b;
    }
    .receipt-invoice-number strong {
      font-size: 14px;
      color: #0f172a;
      font-family: monospace;
    }
    .receipt-divider {
      height: 1px;
      background: repeating-linear-gradient(
        to right,
        #e2e8f0 0,
        #e2e8f0 6px,
        transparent 6px,
        transparent 10px
      );
      margin: 16px 0;
    }
    .receipt-section {
      margin-bottom: 16px;
    }
    .receipt-section h4 {
      font-size: 13px;
      font-weight: 600;
      color: #0bbbe7;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 12px 0;
    }
    .receipt-info-grid,
    .receipt-pricing {
      display: grid;
      gap: 10px;
    }
    .receipt-info-item,
    .receipt-pricing-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .receipt-pricing-row { align-items: center; }
    .receipt-info-item span,
    .receipt-pricing-row span:first-child {
      font-size: 13px;
      color: #64748b;
      flex-shrink: 0;
    }
    .receipt-info-item strong,
    .receipt-pricing-row span:last-child {
      font-size: 13px;
      color: #0f172a;
      font-weight: 500;
      text-align: right;
      word-break: break-word;
    }
    .receipt-pricing-row span:last-child { font-size: 14px; }
    .receipt-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #effbff;
      border-radius: 10px;
      margin-top: 16px;
    }
    .receipt-total span {
      font-size: 14px;
      color: #0f172a;
      font-weight: 600;
    }
    .receipt-total strong {
      font-size: 18px;
      color: #0bbbe7;
      font-weight: 700;
    }
    .receipt-footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px dashed #e2e8f0;
    }
    .receipt-footer p {
      font-size: 12px;
      color: #94a3b8;
      margin: 4px 0;
    }
    .receipt-footer .receipt-date {
      font-size: 11px;
      color: #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="receipt-paper">
    <div class="receipt-header">
      ${logoHtml}
      <div class="receipt-status-badge">LUNAS</div>
    </div>

    <div class="receipt-invoice-number">
      <span>No. Invoice</span>
      <strong>${rows.invoiceId}</strong>
    </div>

    <div class="receipt-divider"></div>

    <div class="receipt-section">
      <h4>Informasi Pelanggan</h4>
      <div class="receipt-info-grid">
        <div class="receipt-info-item"><span>Nama</span><strong>${rows.customerName}</strong></div>
        <div class="receipt-info-item"><span>Email</span><strong>${rows.customerEmail}</strong></div>
      </div>
    </div>

    <div class="receipt-section">
      <h4>Detail Booking</h4>
      <div class="receipt-info-grid">
        <div class="receipt-info-item"><span>No. Booking</span><strong>${rows.bookingId}</strong></div>
        <div class="receipt-info-item"><span>Ruangan</span><strong>${rows.roomName}</strong></div>
        <div class="receipt-info-item"><span>Lokasi</span><strong>${rows.roomLocation}</strong></div>
        <div class="receipt-info-item"><span>Tanggal</span><strong>${rows.checkInDate}</strong></div>
        <div class="receipt-info-item"><span>Waktu</span><strong>${rows.timeRange}</strong></div>
        <div class="receipt-info-item"><span>Durasi</span><strong>${rows.durationHours}</strong></div>
      </div>
    </div>

    <div class="receipt-divider"></div>

    <div class="receipt-section">
      <h4>Informasi Pembayaran</h4>
      <div class="receipt-info-grid">
        <div class="receipt-info-item"><span>Metode Pembayaran</span><strong>${rows.paymentMethod}</strong></div>
        <div class="receipt-info-item"><span>Tanggal Pembayaran</span><strong>${rows.paidDate}</strong></div>
      </div>
    </div>

    <div class="receipt-divider"></div>

    <div class="receipt-section">
      <h4>Rincian Pembayaran</h4>
      <div class="receipt-pricing">
        <div class="receipt-pricing-row"><span>Subtotal</span><span>${rows.subtotal}</span></div>
        <div class="receipt-pricing-row"><span>Biaya Layanan</span><span>${rows.serviceFee}</span></div>
        <div class="receipt-pricing-row"><span>PPN (11%)</span><span>${rows.taxAmount}</span></div>
      </div>
    </div>

    <div class="receipt-total">
      <span>Total Pembayaran</span>
      <strong>${rows.totalAmount}</strong>
    </div>

    <div class="receipt-footer">
      <p>Terima kasih telah menggunakan layanan Roomify</p>
      <p class="receipt-date">Dicetak pada: ${rows.printedAt}</p>
    </div>
  </div>
</body>
</html>`
}

async function buildReceiptPdfBufferFromHtml(data: ReceiptPdfData) {
  const executablePath = resolvePdfBrowserExecutablePath()
  if (!executablePath) {
    throw new Error('Browser executable untuk render PDF tidak ditemukan.')
  }

  const logoDataUri = await getReceiptLogoDataUri()
  const html = buildReceiptPdfHtml(data, logoDataUri)

  // Dynamic import to avoid module loading issues in Vercel
  const { chromium } = await import('playwright-core')
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    return Buffer.from(await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    }))
  } finally {
    await browser.close()
  }
}

function estimateTextWidth(text: string, fontSize: number) {
  return toPdfSafeText(text).length * fontSize * 0.48
}

function buildReceiptPdfBuffer(data: ReceiptPdfData) {
  const pageWidth = 595
  const pageHeight = 842
  const cardX = 40
  const cardY = 48
  const cardWidth = pageWidth - (cardX * 2)
  const cardHeight = pageHeight - 96
  const left = cardX + 20
  const right = cardX + cardWidth - 20
  let y = pageHeight - 86
  const commands: string[] = []

  const pushText = (
    text: string,
    x: number,
    yPos: number,
    options?: { size?: number; bold?: boolean; color?: [number, number, number] }
  ) => {
    const safeText = escapePdfText(toPdfSafeText(text || '-'))
    const size = options?.size ?? 11
    const font = options?.bold ? 'F2' : 'F1'
    const [r, g, b] = options?.color ?? [0.06, 0.09, 0.16]

    commands.push(`BT /${font} ${size} Tf ${r} ${g} ${b} rg 1 0 0 1 ${x} ${yPos} Tm (${safeText}) Tj ET`)
  }

  const pushRightText = (
    text: string,
    xRight: number,
    yPos: number,
    options?: { size?: number; bold?: boolean; color?: [number, number, number] }
  ) => {
    const size = options?.size ?? 11
    const width = estimateTextWidth(text || '-', size)
    const x = Math.max(left + 140, xRight - width)
    pushText(text, x, yPos, options)
  }

  const drawSectionTitle = (title: string) => {
    pushText(title.toUpperCase(), left, y, { size: 11, bold: true, color: [0.04, 0.73, 0.91] })
    y -= 18
  }

  const drawInfoRow = (label: string, value: string) => {
    pushText(label, left, y, { size: 10, color: [0.39, 0.45, 0.56] })
    pushRightText(value || '-', right, y, { size: 10, bold: true, color: [0.06, 0.09, 0.16] })
    y -= 16
  }

  commands.push('0.98 0.99 1 rg')
  commands.push(`${cardX} ${cardY} ${cardWidth} ${cardHeight} re f`)
  commands.push('0.88 0.92 0.96 RG 1 w')
  commands.push(`${cardX} ${cardY} ${cardWidth} ${cardHeight} re S`)

  pushText('ROOMIFY', left, y, { size: 18, bold: true, color: [0.0, 0.77, 0.94] })
  pushText('Struk Pembayaran', left, y - 16, { size: 11, bold: true, color: [0.06, 0.09, 0.16] })

  const badgeWidth = 78
  const badgeHeight = 20
  const badgeX = right - badgeWidth
  const badgeY = y - 8
  commands.push('0.86 0.98 0.9 rg')
  commands.push(`${badgeX} ${badgeY} ${badgeWidth} ${badgeHeight} re f`)
  commands.push('0.53 0.94 0.67 RG 1 w')
  commands.push(`${badgeX} ${badgeY} ${badgeWidth} ${badgeHeight} re S`)
  pushText('LUNAS', badgeX + 22, badgeY + 6, { size: 10, bold: true, color: [0.09, 0.64, 0.29] })

  y -= 44

  const invoiceRowY = y - 6
  commands.push('0.97 0.98 0.99 rg')
  commands.push(`${left - 2} ${invoiceRowY - 8} ${cardWidth - 36} 28 re f`)
  pushText('No. Invoice', left + 8, invoiceRowY, { size: 10, color: [0.39, 0.45, 0.56] })
  pushRightText(data.invoiceId || '-', right - 8, invoiceRowY, { size: 11, bold: true })
  y -= 30

  commands.push('[3 3] 0 d 0.88 0.91 0.94 RG')
  commands.push(`${left} ${y} m ${right} ${y} l S`)
  commands.push('[] 0 d')
  y -= 20

  drawSectionTitle('Informasi Pelanggan')
  drawInfoRow('Nama', data.customerName)
  drawInfoRow('Email', data.customerEmail)

  y -= 6
  drawSectionTitle('Detail Booking')
  drawInfoRow('No. Booking', data.bookingId)
  drawInfoRow('Ruangan', data.roomName)
  drawInfoRow('Lokasi', data.roomLocation)
  drawInfoRow('Tanggal', formatInvoiceDateOnly(data.checkIn))
  drawInfoRow('Waktu', `${formatInvoiceTimeOnly(data.checkIn)} - ${formatInvoiceTimeOnly(data.checkOut)}`)
  drawInfoRow('Durasi', `${Math.round(data.durationHours)} jam`)

  y -= 6
  drawSectionTitle('Informasi Pembayaran')
  drawInfoRow('Metode Pembayaran', getInvoicePaymentMethodLabel(data.paymentMethod))
  drawInfoRow('Tanggal Pembayaran', formatInvoiceDateOnly(data.paidAt))

  y -= 6
  drawSectionTitle('Rincian Pembayaran')
  drawInfoRow('Subtotal', `Rp ${formatInvoiceCurrency(data.subtotal)}`)
  drawInfoRow('Biaya Layanan', `Rp ${formatInvoiceCurrency(data.serviceFee)}`)
  drawInfoRow('PPN (11%)', `Rp ${formatInvoiceCurrency(data.taxAmount)}`)

  y -= 8
  commands.push('0.92 0.98 1 rg')
  commands.push(`${left - 2} ${y - 10} ${cardWidth - 36} 34 re f`)
  pushText('Total Pembayaran', left + 8, y + 2, { size: 11, bold: true })
  pushRightText(`Rp ${formatInvoiceCurrency(data.totalAmount)}`, right - 8, y + 1, {
    size: 14,
    bold: true,
    color: [0.04, 0.67, 0.8]
  })
  y -= 30

  commands.push('[3 3] 0 d 0.88 0.91 0.94 RG')
  commands.push(`${left} ${y} m ${right} ${y} l S`)
  commands.push('[] 0 d')
  y -= 16

  pushText('Terima kasih telah menggunakan layanan Roomify', left + 95, y, { size: 10, color: [0.58, 0.64, 0.72] })
  pushText(`Dicetak pada: ${formatInvoiceDateTime(data.paidAt)}`, left + 130, y - 14, {
    size: 9,
    color: [0.72, 0.77, 0.83]
  })

  const content = `${commands.join('\n')}\n`
  const contentLength = Buffer.byteLength(content, 'utf8')

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj',
    `6 0 obj\n<< /Length ${contentLength} >>\nstream\n${content}endstream\nendobj`
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]

  objects.forEach(object => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += `${object}\n`
  })

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let i = 1; i <= objects.length; i += 1) {
    const offset = String(offsets[i]).padStart(10, '0')
    pdf += `${offset} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf, 'utf8')
}

async function uploadInvoicePdfToStorage(params: {
  supabase: Awaited<ReturnType<typeof createClient>>
  receiptData: ReceiptPdfData
}) {
  const {
    supabase,
    receiptData
  } = params

  const pdfBuffer = await buildReceiptPdfBufferFromHtml(receiptData)
    .catch(() => buildReceiptPdfBuffer(receiptData))
  const {
    invoiceId,
    bookingId
  } = receiptData
  const filePath = `${bookingId}/${invoiceId}.pdf`
  const adminSupabase = createAdminClient()
  const storageClient = adminSupabase ?? supabase
  const bucketName = 'invoices'

  if (adminSupabase) {
    const { data: existingBucket, error: getBucketError } = await adminSupabase.storage.getBucket(bucketName)

    if (getBucketError || !existingBucket) {
      const { error: createBucketError } = await adminSupabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ['application/pdf']
      })

      if (createBucketError && !createBucketError.message.toLowerCase().includes('already exists')) {
        throw new Error(`Gagal menyiapkan bucket invoices: ${createBucketError.message}`)
      }
    }
  }

  const { error: uploadError } = await storageClient.storage
    .from(bucketName)
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    })

  if (uploadError) {
    throw new Error(
      `Upload PDF ke bucket invoices gagal: ${uploadError.message}. ` +
      'Pastikan bucket invoices ada dan policy insert/select mengizinkan akses server.'
    )
  }

  const { data: publicUrlData } = storageClient.storage
    .from(bucketName)
    .getPublicUrl(filePath)

  return publicUrlData.publicUrl
}

function isHalfHourSlot(date: Date) {
  const minutes = date.getMinutes()
  return minutes === 0 || minutes === 30
}

function normalizeBookingRoom(room: BookingRoomRecord | BookingRoomRecord[] | null, roomImages?: string[]) {
  if (!room) {
    return null
  }

  const normalizedRoom = Array.isArray(room) ? room[0] : room

  if (!normalizedRoom) {
    return null
  }

  const regionData = normalizedRoom.region?.[0]
  const provinceData = regionData?.province?.[0]

  const images = roomImages ?? normalizedRoom.images ?? []

  return {
    room_id: normalizedRoom.room_id,
    name: normalizedRoom.name,
    location: normalizedRoom.location,
    capacity: normalizedRoom.capacity,
    image_url: images[0] ?? null,
    images: images,
    region_name: regionData?.name ?? null,
    province_name: provinceData?.name ?? null
  }
}

async function expirePendingBookings(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: pendingBookings, error: pendingBookingsError } = await supabase
    .from('booking')
    .select('booking_id, booking_date, status')
    .eq('status', 'pending')

  if (pendingBookingsError) {
    throw pendingBookingsError
  }

  const expiredBookingIds = (pendingBookings ?? [])
    .filter(booking => isPendingPaymentExpired(booking.status, booking.booking_date))
    .map(booking => booking.booking_id)

  if (expiredBookingIds.length === 0) {
    return
  }

  const { error: deleteFacilityRequestError } = await supabase
    .from('facility_request')
    .delete()
    .in('booking_id', expiredBookingIds)

  if (deleteFacilityRequestError) {
    throw deleteFacilityRequestError
  }

  const { error: updateBookingError } = await supabase
    .from('booking')
    .update({ status: 'cancelled' })
    .in('booking_id', expiredBookingIds)

  if (updateBookingError) {
    throw updateBookingError
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ success: false, message: 'user_id wajib diisi.' }, { status: 400 })
    }

    const supabase = await createClient()
    const customerRecord = await ensureCustomerRecord(user_id)
    await expirePendingBookings(supabase)

    const { data, error } = await supabase
      .from('booking')
      .select(`
        booking_id,
        booking_date,
        check_in,
        check_out,
        total_cost,
        status,
        notes,
        room (
          room_id,
          name,
          location,
          capacity,
          region (
            name,
            province (
              name
            )
          )
        )
      `)
      .eq('customer_id', customerRecord.customer_id)
      .order('booking_date', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    // Get all room IDs to fetch images
    const roomIds = (data ?? []).map(b => {
      const roomData = b.room as unknown as BookingRoomRecord | BookingRoomRecord[] | null
      const room = Array.isArray(roomData) ? roomData[0] : roomData
      return room?.room_id
    }).filter((id): id is string => Boolean(id))

    // Fetch images from room_image table
    const imagesByRoom: { [key: string]: string[] } = {}
    if (roomIds.length > 0) {
      const { data: roomImages, error: imagesError } = await supabase
        .from('room_image')
        .select('room_id, image_url, sort_order')
        .in('room_id', roomIds)
        .order('sort_order', { ascending: true })

      if (imagesError) {
        console.warn('Error fetching room images:', imagesError.message)
      } else if (roomImages) {
        roomImages.forEach(img => {
          if (!imagesByRoom[img.room_id]) {
            imagesByRoom[img.room_id] = []
          }
          imagesByRoom[img.room_id].push(img.image_url)
        })
      }
    }

    const normalizedData = (data ?? []).map(booking => {
      const room = booking.room as unknown as BookingRoomRecord | BookingRoomRecord[] | null
      const roomId = (Array.isArray(room) ? room[0]?.room_id : room?.room_id) ?? ''
      const roomImages = roomId ? imagesByRoom[roomId] || [] : []

      return {
        ...booking,
        payment_due_at: booking.booking_date ? getPaymentDeadline(booking.booking_date).toISOString() : null,
        room: normalizeBookingRoom(room, roomImages)
      }
    })

    return NextResponse.json({ success: true, data: normalizedData })
  } catch (error) {
    console.error('Booking GET error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      user_id,
      room_id,
      date,
      start_time,
      end_time,
      notes,
      additional_message
    } = body as {
      user_id?: string
      room_id?: string
      date?: string
      start_time?: string
      end_time?: string
      notes?: string
      additional_message?: string
    }

    if (!user_id || !room_id || !date || !start_time || !end_time) {
      return NextResponse.json(
        { success: false, message: 'user_id, room_id, date, start_time, dan end_time wajib diisi.' },
        { status: 400 }
      )
    }

    const checkInDate = new Date(`${date}T${start_time}:00`)
    const checkOutDate = new Date(`${date}T${end_time}:00`)

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Format tanggal atau waktu tidak valid.' },
        { status: 400 }
      )
    }

    if (!isHalfHourSlot(checkInDate) || !isHalfHourSlot(checkOutDate)) {
      return NextResponse.json(
        { success: false, message: 'Menit booking hanya boleh 00 atau 30.' },
        { status: 400 }
      )
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { success: false, message: 'Jam selesai harus lebih besar dari jam mulai.' },
        { status: 400 }
      )
    }

    if (checkInDate < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Waktu booking tidak boleh di masa lalu.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const customerRecord = await ensureCustomerRecord(user_id)

    await expirePendingBookings(supabase)

    const { data: room, error: roomError } = await supabase
      .from('room')
      .select('room_id, name, price_per_hour, is_available, is_deleted')
      .eq('room_id', room_id)
      .maybeSingle()

    if (roomError) {
      return NextResponse.json({ success: false, message: roomError.message }, { status: 500 })
    }

    if (!room) {
      return NextResponse.json(
        { success: false, message: 'Ruangan tidak ditemukan.' },
        { status: 404 }
      )
    }

    if (room.is_deleted) {
      return NextResponse.json(
        { success: false, message: 'Ruangan tidak tersedia.' },
        { status: 404 }
      )
    }

    if (!room.is_available) {
      return NextResponse.json(
        { success: false, message: 'Ruangan sedang tidak tersedia untuk dibooking.' },
        { status: 409 }
      )
    }

    const checkInValue = formatDateForDatabase(checkInDate)
    const checkOutValue = formatDateForDatabase(checkOutDate)

    const { data: conflictingBookings, error: conflictError } = await supabase
      .from('booking')
      .select('booking_id')
      .eq('room_id', room_id)
      .lt('check_in', checkOutValue)
      .gt('check_out', checkInValue)
      .neq('status', 'cancelled')

    if (conflictError) {
      return NextResponse.json({ success: false, message: conflictError.message }, { status: 500 })
    }

    if ((conflictingBookings ?? []).length > 0) {
      return NextResponse.json(
        { success: false, message: 'Jadwal yang dipilih sudah terisi. Silakan pilih jam lain.' },
        { status: 409 }
      )
    }

    const { data: bookingIds, error: bookingIdError } = await supabase
      .from('booking')
      .select('booking_id')

    if (bookingIdError) {
      return NextResponse.json({ success: false, message: bookingIdError.message }, { status: 500 })
    }

    const durationHours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
    const totalCost = durationHours * Number(room.price_per_hour)
    const trimmedMessage = additional_message?.trim() || notes?.trim() || null

    const { data: insertedBooking, error: insertError } = await supabase
      .from('booking')
      .insert({
        booking_id: getNextBookingId(bookingIds ?? []),
        customer_id: customerRecord.customer_id,
        room_id,
        booking_date: formatDateForDatabase(),
        check_in: checkInValue,
        check_out: checkOutValue,
        total_cost: totalCost,
        status: 'pending',
        notes: trimmedMessage
      })
      .select('booking_id, status')
      .maybeSingle()

    if (insertError) {
      return NextResponse.json({ success: false, message: insertError.message }, { status: 500 })
    }

    if (trimmedMessage && insertedBooking?.booking_id) {
      const { data: requestIds, error: requestIdsError } = await supabase
        .from('facility_request')
        .select('request_id')

      if (requestIdsError) {
        await supabase.from('booking').delete().eq('booking_id', insertedBooking.booking_id)
        return NextResponse.json({ success: false, message: requestIdsError.message }, { status: 500 })
      }

      const { error: facilityRequestError } = await supabase
        .from('facility_request')
        .insert({
          request_id: getNextFacilityRequestId(requestIds ?? []),
          booking_id: insertedBooking.booking_id,
          customer_id: customerRecord.customer_id,
          details: trimmedMessage,
          priority: 'normal',
          status: 'pending',
          created_at: formatDateForDatabase()
        })

      if (facilityRequestError) {
        await supabase.from('booking').delete().eq('booking_id', insertedBooking.booking_id)
        return NextResponse.json({ success: false, message: facilityRequestError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        booking_id: insertedBooking?.booking_id ?? null,
        status: insertedBooking?.status ?? 'pending',
        total_cost: totalCost
      },
      message: `Booking untuk ${room.name} berhasil dibuat.`
    })
  } catch (error) {
    console.error('Booking POST error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const {
      booking_id,
      user_id,
      action,
      payment_method
    } = body as {
      booking_id?: string
      user_id?: string
      action?: 'confirm_payment' | 'cancel'
      payment_method?: string
    }

    if (!booking_id || !user_id || !action) {
      return NextResponse.json(
        { success: false, message: 'booking_id, user_id, dan action wajib diisi.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const customerRecord = await ensureCustomerRecord(user_id)
    await expirePendingBookings(supabase)

    const { data: booking, error: bookingError } = await supabase
      .from('booking')
      .select('booking_id, customer_id, status, booking_date')
      .eq('booking_id', booking_id)
      .maybeSingle()

    if (bookingError) {
      return NextResponse.json({ success: false, message: bookingError.message }, { status: 500 })
    }

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking tidak ditemukan.' }, { status: 404 })
    }

    if (booking.customer_id !== customerRecord.customer_id) {
      return NextResponse.json({ success: false, message: 'Booking ini bukan milik Anda.' }, { status: 403 })
    }

    if (action === 'confirm_payment') {
      if (booking.status !== 'pending') {
        return NextResponse.json({ success: false, message: 'Hanya booking pending yang bisa dibayar.' }, { status: 409 })
      }

      if (isPendingPaymentExpired(booking.status, booking.booking_date)) {
        return NextResponse.json({ success: false, message: 'Waktu pembayaran sudah habis.' }, { status: 409 })
      }

      // Get booking details with room info for payment/invoice
      const { data: bookingDetails, error: bookingDetailsError } = await supabase
        .from('booking')
        .select('booking_id, room_id, total_cost, customer_id, check_in, check_out')
        .eq('booking_id', booking_id)
        .maybeSingle()

      if (bookingDetailsError) {
        return NextResponse.json({ success: false, message: bookingDetailsError.message }, { status: 500 })
      }

      if (!bookingDetails) {
        return NextResponse.json({ success: false, message: 'Detail booking tidak ditemukan.' }, { status: 404 })
      }

      const subtotal = Number(bookingDetails.total_cost) || 0
      const serviceFee = 2500
      const taxAmount = Math.round((subtotal + serviceFee) * 0.11)
      const totalAmount = Math.round(subtotal + serviceFee + taxAmount)
      const checkInDate = new Date(bookingDetails.check_in)
      const checkOutDate = new Date(bookingDetails.check_out)
      const durationHours = checkOutDate > checkInDate
        ? (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
        : 0

      const { data: updatedBooking, error: updateError } = await supabase
        .from('booking')
        .update({ status: 'confirmed' })
        .eq('booking_id', booking_id)
        .eq('status', 'pending')
        .select('booking_id, status')
        .maybeSingle()

      if (updateError) {
        return NextResponse.json({ success: false, message: updateError.message }, { status: 500 })
      }

      // Get existing payment IDs for sequential generation
      const { data: paymentIds } = await supabase
        .from('payment')
        .select('payment_id')

      // Create or update payment record
      const paymentId = getNextPaymentId(paymentIds ?? [])
      const now = formatDateForDatabase()
      const actualPaymentMethod = (payment_method || 'manual_confirmation').toUpperCase()

      // Check if payment already exists for this booking
      const { data: existingPayment } = await supabase
        .from('payment')
        .select('payment_id')
        .eq('booking_id', booking_id)
        .maybeSingle()

      if (existingPayment) {
        // Update existing payment
        await supabase
          .from('payment')
          .update({
            payment_method: actualPaymentMethod,
            amount: totalAmount,
            status: 'success',
            paid_at: now
          })
          .eq('booking_id', booking_id)
      } else {
        // Insert new payment record
        await supabase
          .from('payment')
          .insert({
            payment_id: paymentId,
            booking_id: booking_id,
            payment_method: actualPaymentMethod,
            amount: totalAmount,
            status: 'success',
            paid_at: now
          })
      }

      // Get the payment record (either newly created or updated)
      const { data: paymentRecord } = await supabase
        .from('payment')
        .select('payment_id')
        .eq('booking_id', booking_id)
        .maybeSingle()

      // Create invoice if payment record exists
      if (paymentRecord) {
        let invoiceId = ''
        let invoicePdfWarning = ''

        // Check if invoice already exists
        const { data: existingInvoice } = await supabase
          .from('invoice')
          .select('invoice_id')
          .eq('booking_id', booking_id)
          .maybeSingle()

        if (!existingInvoice) {
          // Get existing invoice IDs for sequential generation
          const { data: invoiceIds } = await supabase
            .from('invoice')
            .select('invoice_id')

          const { data: insertedInvoice, error: insertInvoiceError } = await supabase
            .from('invoice')
            .insert({
              invoice_id: getNextInvoiceId(invoiceIds ?? []),
              payment_id: paymentRecord.payment_id,
              booking_id: booking_id,
              customer_id: bookingDetails.customer_id,
              room_id: bookingDetails.room_id,
              total_amount: totalAmount,
              printed_at: now
            })
            .select('invoice_id')
            .maybeSingle()

          if (insertInvoiceError || !insertedInvoice) {
            return NextResponse.json(
              { success: false, message: insertInvoiceError?.message || 'Gagal membuat invoice.' },
              { status: 500 }
            )
          }

          invoiceId = insertedInvoice.invoice_id
        } else {
          invoiceId = existingInvoice.invoice_id
          await supabase
            .from('invoice')
            .update({
              payment_id: paymentRecord.payment_id,
              total_amount: totalAmount,
              printed_at: now
            })
            .eq('invoice_id', invoiceId)
        }

        const [{ data: roomInfo }, { data: userInfo }] = await Promise.all([
          supabase
            .from('room')
            .select('name, location')
            .eq('room_id', bookingDetails.room_id)
            .maybeSingle(),
          supabase
            .from('users')
            .select('name, email')
            .eq('user_id', user_id)
            .maybeSingle()
        ])

        try {
          const pdfUrl = await uploadInvoicePdfToStorage({
            supabase,
            receiptData: {
              invoiceId,
              bookingId: booking_id,
              customerName: userInfo?.name ?? 'Customer',
              customerEmail: userInfo?.email ?? '-',
              roomName: roomInfo?.name ?? '-',
              roomLocation: roomInfo?.location ?? '-',
              paymentMethod: actualPaymentMethod,
              paidAt: now,
              checkIn: bookingDetails.check_in,
              checkOut: bookingDetails.check_out,
              durationHours,
              subtotal,
              serviceFee,
              taxAmount,
              totalAmount
            }
          })

          await supabase
            .from('invoice')
            .update({ pdf_url: pdfUrl })
            .eq('invoice_id', invoiceId)
        } catch (pdfError) {
          console.error('Invoice PDF upload error:', pdfError)
          invoicePdfWarning = pdfError instanceof Error
            ? ` Struk PDF belum berhasil diupload: ${pdfError.message}`
            : ' Struk PDF belum berhasil diupload.'
        }

        return NextResponse.json({
          success: true,
          data: updatedBooking,
          message: `Pembayaran berhasil dikonfirmasi. Booking Anda sudah lunas.${invoicePdfWarning}`
        })
      }

      return NextResponse.json(
        { success: false, message: 'Pembayaran berhasil, tetapi data invoice belum tersedia.' },
        { status: 500 }
      )
    }

    if (booking.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Hanya booking pending yang bisa dibatalkan.' }, { status: 409 })
    }

    const { error: deleteFacilityRequestError } = await supabase
      .from('facility_request')
      .delete()
      .eq('booking_id', booking_id)

    if (deleteFacilityRequestError) {
      return NextResponse.json({ success: false, message: deleteFacilityRequestError.message }, { status: 500 })
    }

    const { data: updatedBooking, error: cancelError } = await supabase
      .from('booking')
      .update({ status: 'cancelled' })
      .eq('booking_id', booking_id)
      .eq('status', 'pending')
      .select('booking_id, status')
      .maybeSingle()

    if (cancelError) {
      return NextResponse.json({ success: false, message: cancelError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedBooking,
      message: 'Booking berhasil dibatalkan.'
    })
  } catch (error) {
    console.error('Booking PATCH error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}
