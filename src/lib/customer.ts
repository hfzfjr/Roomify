import { createClient } from '@/lib/supabase/server'

type CustomerRecord = {
  customer_id: string
  user_id: string
}

type UserRecord = {
  user_id: string
  role: 'customer' | 'owner' | 'admin'
}

function getNextCustomerId(customerIds: string[]) {
  const nextSequence = customerIds
    .map(customerId => Number(customerId.split('-')[1] ?? 0))
    .reduce((max, current) => Math.max(max, current), 0) + 1

  return `c-${String(nextSequence).padStart(2, '0')}`
}

export async function ensureCustomerRecord(userId: string) {
  const supabase = await createClient()

  const { data: existingCustomer, error: customerLookupError } = await supabase
    .from('customer')
    .select('customer_id, user_id')
    .eq('user_id', userId)
    .maybeSingle<CustomerRecord>()

  if (customerLookupError) {
    throw new Error(customerLookupError.message)
  }

  if (existingCustomer?.customer_id) {
    return existingCustomer
  }

  const { data: user, error: userLookupError } = await supabase
    .from('users')
    .select('user_id, role')
    .eq('user_id', userId)
    .maybeSingle<UserRecord>()

  if (userLookupError) {
    throw new Error(userLookupError.message)
  }

  if (!user) {
    throw new Error('User tidak ditemukan.')
  }

  if (user.role === 'admin') {
    throw new Error('Akun admin tidak dapat memiliki profil customer.')
  }

  const { data: allCustomers, error: customerIdsError } = await supabase
    .from('customer')
    .select('customer_id')

  if (customerIdsError) {
    throw new Error(customerIdsError.message)
  }

  const nextCustomerId = getNextCustomerId(
    (allCustomers ?? []).map((customer: { customer_id: string }) => customer.customer_id)
  )

  const { data: insertedCustomer, error: insertCustomerError } = await supabase
    .from('customer')
    .insert({
      customer_id: nextCustomerId,
      user_id: userId
    })
    .select('customer_id, user_id')
    .maybeSingle<CustomerRecord>()

  if (insertCustomerError) {
    throw new Error(insertCustomerError.message)
  }

  if (!insertedCustomer?.customer_id) {
    throw new Error('Gagal membuat profil customer.')
  }

  return insertedCustomer
}
