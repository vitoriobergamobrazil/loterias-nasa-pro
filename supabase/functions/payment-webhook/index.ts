import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-webhook-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

async function hmacSha256(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function signaturesMatch(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const webhookSecret = Deno.env.get('PAYMENT_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!webhookSecret || !supabaseUrl || !serviceRoleKey) return json({ error: 'server_not_configured' }, 503);

  const rawBody = await request.text();
  const receivedSignature = request.headers.get('x-webhook-signature') || '';
  const expectedSignature = await hmacSha256(webhookSecret, rawBody);
  if (!signaturesMatch(receivedSignature, expectedSignature)) {
    return json({ error: 'invalid_signature' }, 401);
  }

  let payload: { userId?: string; provider?: string; subscriptionId?: string; planCode?: string; status?: string; validUntil?: string };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  if (!payload.userId || !payload.provider || !payload.subscriptionId || !payload.planCode) {
    return json({ error: 'incomplete_payment_event' }, 400);
  }

  const statusMap: Record<string, string> = {
    approved: 'active',
    active: 'active',
    pending: 'past_due',
    canceled: 'canceled',
    refunded: 'canceled'
  };
  const status = statusMap[payload.status || ''] || 'past_due';
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await adminClient.from('subscriptions').upsert({
    user_id: payload.userId,
    provider: payload.provider,
    provider_subscription_id: payload.subscriptionId,
    plan_code: payload.planCode,
    status,
    valid_until: payload.validUntil || null,
    updated_at: new Date().toISOString()
  }, { onConflict: 'provider_subscription_id' });

  if (error) return json({ error: 'subscription_not_updated' }, 400);
  return json({ ok: true });
});
