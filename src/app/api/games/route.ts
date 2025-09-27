import { supabaseAdmin } from '@/lib/supabaseAdminClient'
import { verifyAuthHeader } from '@/lib/web3authServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log("Games API: Received request");

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    console.log("Games API: Auth header present:", !!authHeader);

    const authResult = await verifyAuthHeader(authHeader);
    console.log("Games API: Auth result:", authResult);

    if (!authResult.valid) {
      console.log("Games API: Auth failed:", authResult.error);
      return NextResponse.json(
        { error: "Unauthorized", details: authResult.error },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const userAddress = searchParams.get("userAddress");
    const offset = (page - 1) * limit;

    // Use wallet address if provided, otherwise use JWT user_id
    // Ensure both are lowercase for consistency
    const normalizedUserAddress = userAddress?.toLowerCase();
    const normalizedJwtUserId = authResult.user_id?.toLowerCase();
    const queryUserId = normalizedUserAddress || normalizedJwtUserId;

    console.log(
      "Games API: Query params - page:",
      page,
      "limit:",
      limit,
      "userAddress:",
      userAddress,
      "normalizedUserAddress:",
      normalizedUserAddress,
      "jwt_user_id:",
      authResult.user_id,
      "normalizedJwtUserId:",
      normalizedJwtUserId,
      "queryUserId:",
      queryUserId
    );

    if (!queryUserId) {
      console.error("Games API: No user ID available for query");
      return NextResponse.json(
        { error: "User identification failed" },
        { status: 400 }
      );
    }

    // Fetch user's games with pagination
    const { data: games, error: gamesError } = await supabaseAdmin
      .from("games")
      .select(
        `
        id,
        status,
        entry_fee_cents,
        player_case,
        banker_offer_cents,
        accepted_deal,
        final_won_cents,
        created_at
      `
      )
      .eq("user_id", queryUserId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    console.log(
      "Games API: Query result - games found:",
      games?.length || 0,
      "error:",
      gamesError
    );

    if (gamesError) {
      console.error('Failed to fetch games:', gamesError)
      return NextResponse.json(
        { error: 'Failed to fetch games' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from("games")
      .select("*", { count: "exact", head: true })
      .eq("user_id", queryUserId);

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
