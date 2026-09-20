import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import MarketplaceItem from '@/models/MarketplaceItem';

export async function POST(req) {
  try {
    await connectDB();
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const item = await MarketplaceItem.findById(itemId);
    if (!item || item.status !== 'Available') {
      return NextResponse.json({ error: 'Item is not available' }, { status: 400 });
    }

    if (item.seller.toString() === user._id.toString()) {
      return NextResponse.json({ error: 'You cannot buy your own item' }, { status: 400 });
    }

    // Platform takes 10% commission
    const platformCommission = item.price * 0.10;
    const sellerRevenue = item.price - platformCommission;

    const tx_ref = `mkt_${item._id}_${Date.now()}`;
    
    // Flutterwave payload
    const payload = {
      tx_ref,
      amount: item.price,
      currency: "USD",
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/marketplace/${item._id}/success`,
      meta: {
        type: 'marketplace_purchase',
        itemId: item._id.toString(),
        buyerId: user._id.toString(),
        sellerId: item.seller.toString(),
        platformCommission,
        sellerRevenue
      },
      customer: {
        email: user.email,
        name: user.username,
      },
      customizations: {
        title: `TemprFit Marketplace: ${item.title}`,
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/images/brand/my-logo.png`
      }
    };

    const fwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const fwData = await fwResponse.json();

    if (fwData.status === 'success') {
      // Mark item as Pending while checkout happens
      item.status = 'Pending';
      item.buyer = user._id;
      await item.save();

      return NextResponse.json({ link: fwData.data.link });
    } else {
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
    }

  } catch (error) {
    console.error('Marketplace checkout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
