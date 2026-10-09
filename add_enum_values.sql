-- Add new roles to the system_role enum
ALTER TYPE system_role ADD VALUE IF NOT EXISTS 'managing_director';
ALTER TYPE system_role ADD VALUE IF NOT EXISTS 'hr';
ALTER TYPE system_role ADD VALUE IF NOT EXISTS 'mentor';

-- Add new positions to the society_position enum
ALTER TYPE society_position ADD VALUE IF NOT EXISTS 'managing_director';
ALTER TYPE society_position ADD VALUE IF NOT EXISTS 'hr';
ALTER TYPE society_position ADD VALUE IF NOT EXISTS 'mentor';
