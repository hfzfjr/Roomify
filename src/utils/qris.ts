type TlvField = {
  tag: string
  value: string
}

function encodeTlv(tag: string, value: string) {
  const length = value.length

  if (length > 99) {
    throw new Error(`Panjang value untuk tag ${tag} melebihi batas TLV.`)
  }

  return `${tag}${String(length).padStart(2, '0')}${value}`
}

function parseTlv(payload: string) {
  const fields: TlvField[] = []
  let cursor = 0

  while (cursor < payload.length) {
    if (cursor + 4 > payload.length) {
      throw new Error('Format payload QRIS tidak valid (header TLV rusak).')
    }

    const tag = payload.slice(cursor, cursor + 2)
    const lengthRaw = payload.slice(cursor + 2, cursor + 4)
    const length = Number.parseInt(lengthRaw, 10)

    if (!Number.isFinite(length) || length < 0) {
      throw new Error(`Format panjang TLV tidak valid pada tag ${tag}.`)
    }

    const valueStart = cursor + 4
    const valueEnd = valueStart + length

    if (valueEnd > payload.length) {
      throw new Error(`Format payload QRIS tidak valid pada tag ${tag}.`)
    }

    fields.push({
      tag,
      value: payload.slice(valueStart, valueEnd)
    })

    cursor = valueEnd
  }

  return fields
}

function findFieldIndex(fields: TlvField[], tag: string) {
  return fields.findIndex(field => field.tag === tag)
}

function crc16ccitt(input: string) {
  let crc = 0xffff

  for (let index = 0; index < input.length; index += 1) {
    crc ^= input.charCodeAt(index) << 8

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) : (crc << 1)
      crc &= 0xffff
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function sanitizePayload(payload: string) {
  // Keep spaces inside merchant/city fields because TLV length depends on them.
  // Only remove line breaks/tab that may come from copy-paste.
  return payload.replace(/[\r\n\t]/g, '').trim()
}

function setOrInsertField(
  fields: TlvField[],
  tag: string,
  value: string,
  options?: { afterTag?: string; beforeTag?: string }
) {
  const existingIndex = findFieldIndex(fields, tag)

  if (existingIndex >= 0) {
    fields[existingIndex] = { tag, value }
    return
  }

  if (options?.beforeTag) {
    const beforeIndex = findFieldIndex(fields, options.beforeTag)
    if (beforeIndex >= 0) {
      fields.splice(beforeIndex, 0, { tag, value })
      return
    }
  }

  if (options?.afterTag) {
    const afterIndex = findFieldIndex(fields, options.afterTag)
    if (afterIndex >= 0) {
      fields.splice(afterIndex + 1, 0, { tag, value })
      return
    }
  }

  fields.push({ tag, value })
}

function formatAmount(amount: number, currencyCode?: string) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Nominal QRIS harus lebih besar dari 0.')
  }

  // QRIS untuk IDR (360) lebih aman dikirim sebagai nominal bulat tanpa desimal.
  if (currencyCode === '360') {
    return String(Math.round(amount))
  }

  const roundedAmount = Math.round(amount * 100) / 100
  const normalizedAmount = Number.isInteger(roundedAmount)
    ? String(roundedAmount)
    : roundedAmount.toFixed(2).replace(/\.?0+$/, '')

  return normalizedAmount
}

export function buildDynamicQrisPayload(basePayload: string, amount: number) {
  const sanitizedPayload = sanitizePayload(basePayload)

  if (!sanitizedPayload) {
    throw new Error('Payload QRIS merchant belum dikonfigurasi.')
  }

  const parsed = parseTlv(sanitizedPayload)
  const fieldsWithoutCrc = parsed.filter(field => field.tag !== '63')
  const currencyCode = fieldsWithoutCrc.find(field => field.tag === '53')?.value
  const amountValue = formatAmount(amount, currencyCode)

  setOrInsertField(fieldsWithoutCrc, '01', '12')
  setOrInsertField(fieldsWithoutCrc, '54', amountValue, { beforeTag: '58', afterTag: '53' })

  const payloadWithoutCrc = fieldsWithoutCrc
    .map(field => encodeTlv(field.tag, field.value))
    .join('')
  const payloadWithCrcPrefix = `${payloadWithoutCrc}6304`
  const crc = crc16ccitt(payloadWithCrcPrefix)

  return `${payloadWithCrcPrefix}${crc}`
}
