import { verifyAuthHeader } from '@/lib/web3authServer'
import { supabaseAdmin } from '@/lib/supabaseAdminClient'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log("Debug API: Received request");

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    console.log("Debug API: Auth header present:", !!authHeader);

    const authResult = await verifyAuthHeader(authHeader);
    console.log("Debug API: Auth result:", authResult);

    if (!authResult.valid) {
      return NextResponse.json(
        { error: "Unauthorized", details: authResult.error },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    console.log("Debug API: Wallet address from client:", walletAddress);
    console.log("Debug API: JWT user_id:", authResult.user_id);
    console.log("Debug API: JWT wallet_address:", authResult.wallet_address);

    // Check what user IDs exist in the database
    const { data: allUserIds, error: userIdsError } = await supabaseAdmin
      .from("games")
      .select("user_id");
    
    // Get unique user IDs
    const uniqueUserIds = [...new Set(allUserIds?.map(g => g.user_id) || [])];

    console.log("Debug API: All user IDs in database:", allUserIds);

    // Look for games with various possible user ID formats
    const possibleUserIds = [
      authResult.user_id,
      authResult.wallet_address,
      walletAddress,
      authResult.user_id?.toLowerCase(),
      authResult.wallet_address?.toLowerCase(), 
      walletAddress?.toLowerCase()
    ].filter(Boolean);

    console.log("Debug API: Checking possible user IDs:", possibleUserIds);

    const gameQueries = await Promise.all(
      possibleUserIds.map(async (userId) => {
        const { data, error } = await supabaseAdmin
          .from("games")
          .select("id, user_id, created_at")
          .eq("user_id", userId)
          .limit(5);
        
        return {
          userId,
          games: data || [],
          error: error?.message
        };
      })
    );

    return NextResponse.json({
      success: true,
      debug: {
        authResult,
        clientWalletAddress: walletAddress,
        possibleUserIds,
        allUserIds,
        gameQueries
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}