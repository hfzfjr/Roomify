import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatDateForDatabase } from '@/utils/formatDate'

type OwnerRecord = {
  owner_id: string
  user_id: string
  account_number: string
  status: 'pending' | 'active' | 'rejected'
  business_name: string
  business_phone: string
  applied_at: string | null
  approved_at: string | null
}

type UserRecord = {
  user_id: string
  name: string
  email: string
  role: 'customer' | 'owner' | 'admin'
  phone_number: string | null
}

function getNextOwnerId(ownerIds: string[]) {
  const nextSequence = ownerIds
    .map((ownerId) => Number(ownerId.split('-')[1] ?? 0))
    .reduce((max, current) => Math.max(max, current), 0) + 1

  return `o-${String(nextSequence).padStart(2, '0')}`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const status = searchParams.get('status')
    const supabase = await createClient()

    if (userId) {
      const [{ data: user, error: userError }, { data: application, error: applicationError }] = await Promise.all([
        supabase
          .from('users')
          .select('user_id, name, email, role, phone_number')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('owner')
          .select('owner_id, user_id, account_number, status, business_name, business_phone, applied_at, approved_at')
          .eq('user_id', userId)
          .maybeSingle(),
      ])

      if (userError) {
        return NextResponse.json({ success: false, message: userError.message }, { status: 500 })
      }

      if (applicationError) {
        return NextResponse.json({ success: false, message: applicationError.message }, { status: 500 })
      }

      if (!user) {
        return NextResponse.json({ success: false, message: 'User tidak ditemukan.' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: {
          user,
          application: application ?? null,
        },
      })
    }

    let ownerQuery = supabase
      .from('owner')
      .select('owner_id, user_id, account_number, status, business_name, business_phone, applied_at, approved_at')
      .order('applied_at', { ascending: false })

    if (status) {
      ownerQuery = ownerQuery.eq('status', status)
    }

    const { data: applications, error: applicationsError } = await ownerQuery

    if (applicationsError) {
      return NextResponse.json({ success: false, message: applicationsError.message }, { status: 500 })
    }

    const userIds = Array.from(new Set((applications ?? []).map((application: OwnerRecord) => application.user_id)))

    let users: UserRecord[] = []
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('user_id, name, email, role, phone_number')
        .in('user_id', userIds)

      if (usersError) {
        return NextResponse.json({ success: false, message: usersError.message }, { status: 500 })
      }

      users = usersData ?? []
    }

    const userMap = new Map(users.map((user) => [user.user_id, user]))
    const mergedApplications = (applications ?? []).map((application: OwnerRecord) => ({
      ...application,
      user: userMap.get(application.user_id) ?? null,
    }))

    return NextResponse.json({ success: true, data: mergedApplications })
  } catch (error) {
    console.error('Owner application GET error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan saat mengambil data pengajuan owner.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      user_id?: string
      name?: string
      account_number?: string
      business_name?: string
      business_phone?: string
    }

    const userId = body.user_id?.trim()
    const name = body.name?.trim()
    const accountNumber = body.account_number?.trim()
    const businessName = body.business_name?.trim()
    const businessPhone = body.business_phone?.trim()

    if (!userId || !name || !accountNumber || !businessName || !businessPhone) {
      return NextResponse.json({ success: false, message: 'Semua field pengajuan wajib diisi.' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, role')
      .eq('user_id', userId)
      .maybeSingle()

    if (userError) {
      return NextResponse.json({ success: false, message: userError.message }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan.' }, { status: 404 })
    }

    const { data: existingApplication, error: existingApplicationError } = await supabase
      .from('owner')
      .select('owner_id, status')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingApplicationError) {
      return NextResponse.json({ success: false, message: existingApplicationError.message }, { status: 500 })
    }

    if (existingApplication?.status === 'active' && user.role === 'owner') {
      return NextResponse.json({ success: false, message: 'Akun ini sudah menjadi owner aktif.' }, { status: 409 })
    }

    const now = formatDateForDatabase()

    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        name,
        phone_number: businessPhone,
      })
      .eq('user_id', userId)

    if (updateUserError) {
      return NextResponse.json({ success: false, message: updateUserError.message }, { status: 500 })
    }

    if (existingApplication?.owner_id) {
      const { error: updateApplicationError } = await supabase
        .from('owner')
        .update({
          account_number: accountNumber,
          business_name: businessName,
          business_phone: businessPhone,
          status: 'pending',
          applied_at: now,
          approved_at: null,
        })
        .eq('owner_id', existingApplication.owner_id)

      if (updateApplicationError) {
        return NextResponse.json({ success: false, message: updateApplicationError.message }, { status: 500 })
      }
    } else {
      const { data: allOwners, error: allOwnersError } = await supabase
        .from('owner')
        .select('owner_id')

      if (allOwnersError) {
        return NextResponse.json({ success: false, message: allOwnersError.message }, { status: 500 })
      }

      const nextOwnerId = getNextOwnerId((allOwners ?? []).map((owner: { owner_id: string }) => owner.owner_id))

      const { error: insertApplicationError } = await supabase
        .from('owner')
        .insert({
          owner_id: nextOwnerId,
          user_id: userId,
          account_number: accountNumber,
          business_name: businessName,
          business_phone: businessPhone,
          status: 'pending',
          applied_at: now,
          approved_at: null,
        })

      if (insertApplicationError) {
        return NextResponse.json({ success: false, message: insertApplicationError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pengajuan owner berhasil dikirim dan sedang menunggu persetujuan admin.',
    })
  } catch (error) {
    console.error('Owner application POST error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan saat mengirim pengajuan owner.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as {
      owner_id?: string
      status?: 'approved' | 'rejected'
    }

    const ownerId = body.owner_id?.trim()
    const action = body.status

    if (!ownerId || !action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ success: false, message: 'owner_id dan status approval wajib diisi.' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: ownerRecord, error: ownerError } = await supabase
      .from('owner')
      .select('owner_id, user_id')
      .eq('owner_id', ownerId)
      .maybeSingle()

    if (ownerError) {
      return NextResponse.json({ success: false, message: ownerError.message }, { status: 500 })
    }

    if (!ownerRecord?.user_id) {
      return NextResponse.json({ success: false, message: 'Pengajuan owner tidak ditemukan.' }, { status: 404 })
    }

    const nextOwnerStatus = action === 'approved' ? 'active' : 'rejected'
    const nextUserRole = action === 'approved' ? 'owner' : 'customer'

    const { error: ownerUpdateError } = await supabase
      .from('owner')
      .update({
        status: nextOwnerStatus,
        approved_at: action === 'approved' ? formatDateForDatabase() : null,
      })
      .eq('owner_id', ownerId)

    if (ownerUpdateError) {
      return NextResponse.json({ success: false, message: ownerUpdateError.message }, { status: 500 })
    }

    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ role: nextUserRole })
      .eq('user_id', ownerRecord.user_id)

    if (userUpdateError) {
      return NextResponse.json({ success: false, message: userUpdateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: action === 'approved' ? 'Pengajuan owner disetujui.' : 'Pengajuan owner ditolak.',
    })
  } catch (error) {
    console.error('Owner application PATCH error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan saat memproses pengajuan owner.' }, { status: 500 })
  }
}
