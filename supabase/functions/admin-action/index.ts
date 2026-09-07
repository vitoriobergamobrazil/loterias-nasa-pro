import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'missing_authentication' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: 'server_not_configured' }, 503);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } }
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json({ error: 'invalid_session' }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: owner, error: ownerError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('id', authData.user.id)
    .eq('role', 'owner')
    .maybeSingle();
  if (ownerError || !owner) return json({ error: 'owner_role_required' }, 403);

  let payload: { action?: string; targetUserId?: string; planCode?: string; days?: number };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  if (payload.action === 'list_users') {
    const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) return json({ error: 'users_not_loaded' }, 400);

    const userIds = usersData.users.map((user) => user.id);
    const [{ data: profiles }, { data: subscriptions }] = await Promise.all([
      adminClient.from('profiles').select('id, display_name, role, created_at').in('id', userIds),
      adminClient.from('subscriptions').select('user_id, plan_code, status, valid_until, updated_at').in('user_id', userIds).order('updated_at', { ascending: false })
    ]);

    const latestSubscription = new Map<string, Record<string, unknown>>();
    for (const subscription of subscriptions || []) {
      if (!latestSubscription.has(subscription.user_id)) latestSubscription.set(subscription.user_id, subscription);
    }

    return json({
      users: usersData.users.map((user) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        profile: (profiles || []).find((profile) => profile.id === user.id) || null,
        subscription: latestSubscription.get(user.id) || null
      }))
    });
  }

  const targetUserId = payload.targetUserId;
  if (!targetUserId || !/^[0-9a-f-]{36}$/i.test(targetUserId)) return json({ error: 'invalid_target_user' }, 400);

  let result: unknown;
  if (payload.action === 'grant_subscription' || payload.action === 'grant_lifetime') {
    const days = Math.min(Math.max(Number(payload.days) || 30, 1), 3650);
    const isLifetime = payload.action === 'grant_lifetime';
    const planCode = isLifetime ? 'NASA_VIP_LIFETIME_TESTER' : (payload.planCode === 'annual' ? 'NASA_VIP_ANNUAL' : 'NASA_VIP_MONTHLY');
    const validUntil = isLifetime ? null : new Date(Date.now() + days * 86400000).toISOString();
    const { data, error } = await adminClient.from('subscriptions').insert({
      user_id: targetUserId,
      provider: 'manual_owner',
      plan_code: planCode,
      status: 'active',
      valid_until: validUntil
    }).select('id, user_id, plan_code, status, valid_until').single();
    if (error) return json({ error: 'subscription_not_created' }, 400);
    result = data;
  } else if (payload.action === 'block_user' || payload.action === 'delete_user') {
    return json({ error: 'user_status_policy_not_configured' }, 409);
  } else {
    return json({ error: 'unsupported_action' }, 400);
  }

  await adminClient.from('audit_logs').insert({
    actor_id: authData.user.id,
    target_user_id: targetUserId,
    action: payload.action,
    metadata: { planCode: payload.planCode, days: payload.days }
  });

  return json({ ok: true, result });
});
