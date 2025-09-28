import { ADMIN_ADDRESS } from '@/lib/config'
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

    // Check if user is admin
    if (authResult.user_id.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
      return NextResponse.json(
        { error: 'Access denied - admin privileges required' },
        { status: 403 }
      )
    }

    console.log("🔍 Fetching failed prize distributions...");

    // Get games with failed prize distributions
    const { data: games, error } = await supabaseAdmin
      .from('games')
      .select('id, user_id, final_won_cents, prize_distribution_error, created_at')
      .eq('status', 'COMPLETED')
      .eq('prize_distributed', false)
      .not('prize_distribution_error', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ Error fetching failed distributions:", error);
      return NextResponse.json(
        { error: 'Failed to fetch failed distributions' },
        { status: 500 }
      );
    }

    console.log(`📊 Found ${games?.length || 0} failed prize distributions`);

    return NextResponse.json({
      success: true,
      games: games || [],
      count: games?.length || 0
    });

  } catch (error: any) {
    console.error('💥 Error in failed distributions API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}
