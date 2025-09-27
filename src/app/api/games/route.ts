import { supabaseAdmin } from '@/lib/supabaseAdminClient'
import { verifyAuthHeader } from '@/lib/web3authServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const authResult = await verifyAuthHeader(authHeader)

    if (!authResult.valid) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authResult.error },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Fetch user's games with pagination
    const { data: games, error: gamesError } = await supabaseAdmin
      .from('games')
      .select(`
        id,
        status,
        entry_fee_cents,
        player_case,
        banker_offer_cents,
        accepted_deal,
        final_won_cents,
        created_at
      `)
      .eq('user_id', authResult.user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (gamesError) {
      console.error('Failed to fetch games:', gamesError)
      return NextResponse.json(
        { error: 'Failed to fetch games' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('games')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authResult.user_id)

    if (countError) {
      console.error('Failed to count games:', countError)
      return NextResponse.json(
        { error: 'Failed to count games' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      games: games || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Games fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
