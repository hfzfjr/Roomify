import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const supabase = await createClient()

    // Return specific type if requested
    if (type === 'province') {
      const { data: provinces, error } = await supabase
        .from('province')
        .select('province_id, name')
        .order('name', { ascending: true })

      if (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: provinces?.map(p => ({
          province_id: p.province_id,
          name: p.name
        })) || []
      })
    }

    if (type === 'region') {
      const { data: regions, error } = await supabase
        .from('region')
        .select('region_id, name, province_id')
        .order('name', { ascending: true })

      if (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: regions?.map(r => ({
          region_id: r.region_id,
          name: r.name,
          province_id: r.province_id
        })) || []
      })
    }

    // Get all provinces and regions (original behavior)
    const { data: provinces, error: provinceError } = await supabase
      .from('province')
      .select('*')
      .order('name', { ascending: true })

    if (provinceError) {
      return NextResponse.json({ success: false, message: provinceError.message }, { status: 500 })
    }

    const { data: regions, error: regionError } = await supabase
      .from('region')
      .select('*')
      .order('name', { ascending: true })

    if (regionError) {
      return NextResponse.json({ success: false, message: regionError.message }, { status: 500 })
    }

    // Create a map of province id to province name
    const provinceMap: { [key: string]: string } = {}
    provinces?.forEach(p => {
      provinceMap[p.province_id] = p.name
    })

    const locations = [
      ...(provinces?.map(p => ({
        id: p.province_id,
        city: p.name,
        province: p.name,
        type: 'province'
      })) || []),
      ...(regions?.map(r => ({
        id: r.region_id,
        city: r.name,
        province: provinceMap[r.province_id] || r.province_name || '',
        type: 'region',
        regionType: r.type
      })) || [])
    ]

    return NextResponse.json({ success: true, data: locations })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}
