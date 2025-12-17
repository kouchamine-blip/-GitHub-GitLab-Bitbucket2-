import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedAdmin() {
  console.log('🌱 Starting admin account seed...');

  const email = 'admin@orus.com';
  const password = 'OrusAdmin123';
  const name = 'ORUS Administrator';

  try {
    const { data: existingUser, error: checkError } = await supabase
      .from('orus_users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      console.log('✓ Admin account already exists:', email);
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      console.log('🔗 Login at: http://localhost:3000/login');
      return;
    }

    console.log('Creating admin account...');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: 'ADMIN'
        }
      }
    });

    if (authError && authError.message !== 'User already registered') {
      throw authError;
    }

    let userId = authData?.user?.id;

    if (!userId) {
      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;
      userId = session?.user?.id;
    }

    if (userId) {
      const { error: userError } = await supabase
        .from('orus_users')
        .insert({
          id: userId,
          email,
          full_name: name,
          role: 'ADMIN',
          wallet_balance: 0
        });

      if (userError && !userError.message.includes('duplicate')) {
        throw userError;
      }

      await supabase.auth.signOut();
    }

    console.log('✓ Admin account created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🔗 Login at: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    throw error;
  }
}

seedAdmin()
  .then(() => {
    console.log('✅ Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  });
