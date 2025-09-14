-- Fix backend API endpoints to match frontend expectations

-- Update user initialization endpoint
-- The backend should handle POST /api/user instead of /api/user/init
-- This SQL script documents the required backend changes:

/*
Backend changes needed in server.js:

1. Change endpoint from /api/user/init to /api/user
2. Update request body parsing to match frontend:
   - tg_id instead of telegramId
   - first_name instead of firstName
   - last_name instead of lastName

3. Add proper response format:
   - Return { success: true, data: { user, balance } }
   - Include user balance in response

Example backend fix:
app.post('/api/user', async (req, res) => {
  try {
    const { tg_id, username, first_name, last_name, init_data } = req.body;
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('tg_id', tg_id)
      .single();
    
    if (existingUser) {
      return res.json({ 
        success: true, 
        data: { 
          user: existingUser, 
          balance: existingUser.balance || 0.05 
        } 
      });
    }
    
    // Create new user with starting balance
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        tg_id,
        username,
        first_name,
        last_name,
        balance: 0.05, // Starting balance
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      data: { 
        user: newUser, 
        balance: newUser.balance 
      } 
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create user' 
    });
  }
});
*/

-- This is a documentation file for backend changes
SELECT 'Backend API endpoints need to be updated to match frontend expectations' as message;
