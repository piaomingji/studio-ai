import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Sanitize headers to prevent ByteString conversion crashes in any outgoing runtime fetch calls
    try {
      const keys = Array.from(req.headers.keys());
      for (const key of keys) {
        const val = req.headers.get(key) || '';
        let hasNonAscii = false;
        for (let i = 0; i < val.length; i++) {
          if (val.charCodeAt(i) > 255) {
            hasNonAscii = true;
            break;
          }
        }
        if (hasNonAscii) {
          req.headers.set(key, encodeURIComponent(val));
        }
      }
    } catch (e) {
      console.error('Error sanitizing headers:', e);
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "決済をご利用いただくにはログインが必要です。", requiresAuth: true },
        { status: 401 }
      );
    }

    const { planId } = await req.json();
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();

    console.log('Stripe Key:', stripeKey ? `${stripeKey.substring(0, 8)}...${stripeKey.substring(stripeKey.length - 4)}` : 'none');

    // Stripe Secret Key が設定されていない場合、シミュレーション決済（Mock）にリダイレクト
    if (!stripeKey || stripeKey === 'your_stripe_secret_key_here') {
      // There used to be a "mock mode" here that simply granted the plan when no Stripe key was
      // configured. It exists for local development, but it shipped: had the key ever gone missing
      // in production -- a typo, a rotated secret, a new environment -- anyone could have taken a
      // paid plan for nothing. Refusing is the safe failure.
      console.error('STRIPE_SECRET_KEY is not configured; checkout cannot run.');
      return NextResponse.json(
        { error: '決済機能が現在ご利用いただけません。時間をおいてお試しください。' },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeKey);

    let session;

    if (planId === 'pro') {
      // Pro Plan: Monthly Subscription
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        client_reference_id: user.id,
        customer_email: user.email,
        // Carried through to the webhook, which is the only place entitlements are granted.
        metadata: { userId: user.id, planId },
        line_items: [
          {
            price_data: {
              currency: 'jpy',
              product_data: {
                name: 'Studio AI Proプラン (月額サブスク)',
                description: 'AI証明写真・プロフィール写真の生成数無制限、優先高速処理',
              },
              unit_amount: 4980,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        subscription_data: { metadata: { userId: user.id, planId } },
        success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}&plan=pro`,
        cancel_url: `${origin}/#pricing`,
      });
    } else if (planId === 'business') {
      // Business Plan: Monthly Subscription (5 users, 500 generations/day)
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        client_reference_id: user.id,
        customer_email: user.email,
        // Carried through to the webhook, which is the only place entitlements are granted.
        metadata: { userId: user.id, planId },
        line_items: [
          {
            price_data: {
              currency: 'jpy',
              product_data: {
                name: 'Studio AI 法人プラン (月額サブスク)',
                description: '最大5名まで共有利用可能、1日の合計生成上限500回',
              },
              unit_amount: 19800,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        subscription_data: { metadata: { userId: user.id, planId } },
        success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}&plan=business`,
        cancel_url: `${origin}/#pricing`,
      });
    } else if (planId === 'quota') {
      // Quota Pack: One-time payment (20 generations)
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        client_reference_id: user.id,
        customer_email: user.email,
        // Carried through to the webhook, which is the only place entitlements are granted.
        metadata: { userId: user.id, planId },
        line_items: [
          {
            price_data: {
              currency: 'jpy',
              product_data: {
                name: 'Studio AI 20回生成追加パック',
                description: '単発で利用枠を20回分追加します',
              },
              unit_amount: 1480,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        // 一回払いは、指定しないとStripeが顧客を作りません。顧客が無いと「お支払い・解約」から
        // 領収書を見ることもできないので、パックの購入でも必ず作らせる。
        customer_creation: 'always',
        success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}&plan=quota`,
        cancel_url: `${origin}/#pricing`,
      });
    } else {
      return NextResponse.json({ error: 'Invalid planId' }, { status: 400 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('Stripe Checkout Session Error:', error);
    let errMsg = 'Unknown Server Error';
    if (error) {
      if (typeof error === 'string') {
        errMsg = error;
      } else if (error instanceof Error) {
        errMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errObj = error as { message?: string; raw?: { message?: string } };
        errMsg = errObj.message || errObj.raw?.message || JSON.stringify(error);
      }
    }
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
