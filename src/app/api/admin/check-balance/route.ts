import { ADMIN_ADDRESS } from '@/lib/config';
import { getPYUSDBalance } from '@/lib/pyusd';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Checking admin wallet PYUSD balance...");

    const balance = await getPYUSDBalance(ADMIN_ADDRESS);

    console.log(`💰 Admin wallet (${ADMIN_ADDRESS}) PYUSD balance: ${balance}`);

    return NextResponse.json({
      success: true,
      admin_address: ADMIN_ADDRESS,
      pyusd_balance: balance,
      balance_formatted: `${parseFloat(balance).toFixed(2)} PYUSD`
    });
  } catch (error: any) {
    console.error("❌ Error checking admin balance:", error);
    return NextResponse.json(
      {
        error: "Failed to check admin balance",
        details: error.message
      },
      { status: 500 }
    );
  }
}
