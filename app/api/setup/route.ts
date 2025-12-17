import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('orus_users')
        .insert([{
          id: authData.user.id,
          email: authData.user.email!,
          full_name: fullName,
          role: 'ADMIN',
        }]);

      if (profileError) {
        return NextResponse.json(
          { error: 'Failed to create user profile: ' + profileError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Admin account created successfully!',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      });
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
