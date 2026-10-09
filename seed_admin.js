const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gzepikqhswwoxvqntqqj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZXBpa3Foc3d3b3h2cW50cXFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQxNDY0MCwiZXhwIjoyMTA1OTkwNjQwfQ.RVvf29sW2vbquJuOzNCfcPvtQxpUWIjdoLLusJ9fCy0',
  { auth: { persistSession: false } }
);

async function seed() {
  console.log('Creating user...');
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'sulemanzaheer09@gmail.com',
    password: 'Salman123@',
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes('User already registered')) {
        console.log('User already exists. We will try to update their profile.');
        // fetch user id
        const {data: usersData} = await supabase.auth.admin.listUsers();
        const user = usersData.users.find(u => u.email === 'sulemanzaheer09@gmail.com');
        if (user) {
            await updateProfile(user.id);
        }
    } else {
        console.error('Error creating user:', error.message);
    }
    return;
  }

  console.log('User created with ID:', data.user.id);
  console.log('Waiting 2 seconds for trigger to execute...');
  await new Promise(r => setTimeout(r, 2000));
  await updateProfile(data.user.id);
}

async function updateProfile(userId) {
    console.log('Updating profile for user:', userId);
    const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role: 'super_admin',
      position: 'treasurer',
      status: 'active',
      full_name: 'Super Admin'
    })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profile (Make sure you ran the SQL Schema!):', profileError.message);
  } else {
    console.log('Profile successfully updated to super_admin (Treasurer)!');
  }
}

seed();
