import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, password_hash')
      .eq('email', email)
      .single();

    if (error || !admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // TODO: Migrate to bcrypt verification when moving to production.
    // Currently supports plaintext password comparison only.
    // The seed data must use plaintext passwords (not crypt()) to match.
    if (admin.password_hash !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Never send password_hash to the client
    const { password_hash, ...safeAdmin } = admin;
    return NextResponse.json({ admin: safeAdmin });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
