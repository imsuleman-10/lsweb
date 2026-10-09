-- Create Push Subscriptions Table
CREATE TABLE public.push_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions 
    FOR ALL USING (auth.uid() = user_id);

-- Core Body/System can read subscriptions to send notifications
CREATE POLICY "Core Body can read all subscriptions" ON public.push_subscriptions 
    FOR SELECT USING (is_core_body(auth.uid()));
