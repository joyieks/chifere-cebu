-- =====================================================
-- ChiFere Admin Setup SQL Script
-- =====================================================
-- This script sets up proper admin authentication
-- instead of hardcoded credentials in the frontend
-- =====================================================

-- 1. Create admin_users table for admin accounts
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create admin_sessions table for session management
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create admin_activities table for audit logging
CREATE TABLE IF NOT EXISTS admin_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    target_type VARCHAR(50), -- 'seller', 'buyer', 'product', etc.
    target_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activities_admin_id ON admin_activities(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activities_created_at ON admin_activities(created_at);

-- 5. Create function to hash passwords (using base64 for compatibility)
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Using base64 encoding for demo purposes to match client-side
    -- In production, use proper bcrypt or similar
    RETURN encode((password || 'chifere_salt_2024')::bytea, 'base64');
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN hash_password(password) = hash;
END;
$$ LANGUAGE plpgsql;

-- 6.1. Create function for admin login
CREATE OR REPLACE FUNCTION admin_login(admin_email TEXT, admin_password TEXT)
RETURNS TABLE(
    id UUID,
    email VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    role VARCHAR
) AS $$
DECLARE
    admin_record RECORD;
BEGIN
    -- Get admin user
    SELECT * INTO admin_record 
    FROM admin_users 
    WHERE email = admin_email AND is_active = true;
    
    -- Check if admin exists and password is correct
    IF admin_record IS NULL OR NOT verify_password(admin_password, admin_record.password_hash) THEN
        RAISE EXCEPTION 'Invalid credentials';
    END IF;
    
    -- Return admin info
    RETURN QUERY
    SELECT 
        admin_record.id,
        admin_record.email,
        admin_record.first_name,
        admin_record.last_name,
        admin_record.role;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to create admin session
CREATE OR REPLACE FUNCTION create_admin_session(admin_email TEXT, session_token TEXT)
RETURNS UUID AS $$
DECLARE
    admin_uuid UUID;
    session_uuid UUID;
BEGIN
    -- Get admin ID
    SELECT id INTO admin_uuid FROM admin_users WHERE email = admin_email AND is_active = true;
    
    IF admin_uuid IS NULL THEN
        RAISE EXCEPTION 'Admin not found or inactive';
    END IF;
    
    -- Create session
    INSERT INTO admin_sessions (admin_id, session_token, expires_at)
    VALUES (admin_uuid, session_token, NOW() + INTERVAL '24 hours')
    RETURNING id INTO session_uuid;
    
    -- Update last login
    UPDATE admin_users SET last_login = NOW() WHERE id = admin_uuid;
    
    RETURN session_uuid;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to validate admin session
CREATE OR REPLACE FUNCTION validate_admin_session(session_token TEXT)
RETURNS TABLE(
    admin_id UUID,
    email VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    role VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        au.first_name,
        au.last_name,
        au.role
    FROM admin_sessions s
    JOIN admin_users au ON s.admin_id = au.id
    WHERE s.session_token = session_token
    AND s.expires_at > NOW()
    AND au.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to log admin activities
CREATE OR REPLACE FUNCTION log_admin_activity(
    p_admin_id UUID,
    p_action VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_target_type VARCHAR DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO admin_activities (
        admin_id, action, description, target_type, target_id, 
        ip_address, user_agent
    ) VALUES (
        p_admin_id, p_action, p_description, p_target_type, p_target_id,
        p_ip_address, p_user_agent
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM admin_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 11. Temporarily disable RLS to insert admin users
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- 12. Insert default admin user
-- Password: admin123 (hashed)
INSERT INTO admin_users (email, password_hash, first_name, last_name, role)
VALUES (
    'admin@gmail.com',
    hash_password('admin123'),
    'System',
    'Administrator',
    'super_admin'
) ON CONFLICT (email) DO NOTHING;

-- 13. Insert additional admin users (optional)
INSERT INTO admin_users (email, password_hash, first_name, last_name, role)
VALUES 
    (
        'moderator@chifere.com',
        hash_password('moderator123'),
        'Content',
        'Moderator',
        'admin'
    ),
    (
        'support@chifere.com',
        hash_password('support123'),
        'Customer',
        'Support',
        'admin'
    )
ON CONFLICT (email) DO NOTHING;

-- 14. Re-enable Row Level Security (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activities ENABLE ROW LEVEL SECURITY;

-- 15. Create RLS policies for admin_users
CREATE POLICY "Admin users are viewable by authenticated admins" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_sessions s
            WHERE s.admin_id = admin_users.id 
            AND s.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
            AND s.expires_at > NOW()
        )
    );

CREATE POLICY "Admin users can update their own profile" ON admin_users
    FOR UPDATE USING (
        id = (current_setting('request.jwt.claims', true)::json->>'admin_id')::uuid
    );

-- 16. Create RLS policies for admin_sessions
CREATE POLICY "Admin sessions are viewable by session owner" ON admin_sessions
    FOR SELECT USING (
        admin_id = (current_setting('request.jwt.claims', true)::json->>'admin_id')::uuid
    );

CREATE POLICY "Admin sessions can be created by admins" ON admin_sessions
    FOR INSERT WITH CHECK (
        admin_id = (current_setting('request.jwt.claims', true)::json->>'admin_id')::uuid
    );

-- 17. Create RLS policies for admin_activities
CREATE POLICY "Admin activities are viewable by admins" ON admin_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_sessions s
            WHERE s.admin_id = admin_activities.admin_id 
            AND s.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
            AND s.expires_at > NOW()
        )
    );

CREATE POLICY "Admin activities can be inserted by admins" ON admin_activities
    FOR INSERT WITH CHECK (
        admin_id = (current_setting('request.jwt.claims', true)::json->>'admin_id')::uuid
    );

-- 18. Create a view for admin dashboard statistics
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM user_profiles WHERE user_type = 'buyer') as total_buyers,
    (SELECT COUNT(*) FROM user_profiles WHERE user_type = 'seller') as total_sellers,
    (SELECT COUNT(*) FROM user_profiles WHERE user_type = 'seller' AND is_verified = false) as pending_sellers,
    (SELECT COUNT(*) FROM user_profiles WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30_days,
    (SELECT COUNT(*) FROM admin_activities WHERE created_at >= NOW() - INTERVAL '24 hours') as admin_activities_24h;

-- 19. Create function to get pending sellers with ID verification info
CREATE OR REPLACE FUNCTION get_pending_sellers()
RETURNS TABLE(
    id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    store_name VARCHAR,
    business_description TEXT,
    business_address TEXT,
    id_type VARCHAR,
    id_front_url TEXT,
    id_back_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.first_name,
        up.last_name,
        up.email,
        up.phone,
        up.business_name as store_name,
        up.business_description,
        up.address as business_address,
        up.id_type,
        up.id_front_url,
        up.id_back_url,
        up.created_at as submitted_at
    FROM user_profiles up
    WHERE up.user_type = 'seller' 
    AND up.is_verified = false
    ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 20. Create function to approve seller
CREATE OR REPLACE FUNCTION approve_seller(
    p_seller_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update seller verification status
    UPDATE user_profiles 
    SET 
        is_verified = true,
        verified_at = NOW(),
        updated_at = NOW()
    WHERE id = p_seller_id AND user_type = 'seller';
    
    -- Log the activity
    PERFORM log_admin_activity(
        p_admin_id,
        'seller_approved',
        'Seller account approved',
        'seller',
        p_seller_id
    );
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 21. Create function to decline seller
CREATE OR REPLACE FUNCTION decline_seller(
    p_seller_id UUID,
    p_admin_id UUID,
    p_reason TEXT DEFAULT 'Application declined'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update seller status
    UPDATE user_profiles 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE id = p_seller_id AND user_type = 'seller';
    
    -- Log the activity
    PERFORM log_admin_activity(
        p_admin_id,
        'seller_declined',
        p_reason,
        'seller',
        p_seller_id
    );
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 22. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_sessions TO authenticated;
GRANT SELECT, INSERT ON admin_activities TO authenticated;
GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_sellers() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_seller(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_seller(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin_session(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_admin_session(TEXT) TO authenticated;

-- 23. Create a cleanup job (optional - run periodically)
-- This can be set up as a cron job or scheduled function
CREATE OR REPLACE FUNCTION cleanup_admin_data()
RETURNS TEXT AS $$
DECLARE
    sessions_cleaned INTEGER;
    activities_cleaned INTEGER;
BEGIN
    -- Clean expired sessions
    SELECT clean_expired_sessions() INTO sessions_cleaned;
    
    -- Clean old activities (older than 90 days)
    DELETE FROM admin_activities WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS activities_cleaned = ROW_COUNT;
    
    RETURN format('Cleaned %s expired sessions and %s old activities', sessions_cleaned, activities_cleaned);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Setup Complete!
-- =====================================================
-- Default admin credentials:
-- Email: admin@gmail.com
-- Password: admin123
-- 
-- Additional admin accounts:
-- Email: moderator@chifere.com, Password: moderator123
-- Email: support@chifere.com, Password: support123
-- =====================================================
