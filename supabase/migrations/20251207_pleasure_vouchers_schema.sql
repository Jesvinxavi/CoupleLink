-- Create coupon_templates table
CREATE TABLE IF NOT EXISTS public.coupon_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('romantic', 'spicy', 'service', 'fun')),
    intensity INTEGER DEFAULT 1, -- 1-3 scale for "power/effort"
    icon TEXT, -- Optional material icon name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for templates
ALTER TABLE public.coupon_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can view templates
CREATE POLICY "Everyone can view templates"
    ON public.coupon_templates FOR SELECT
    USING (true);

-- Update coupons table
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.coupon_templates(id),
ADD COLUMN IF NOT EXISTS gifted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS gift_message TEXT,
ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add points and vouchers to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS competition_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unclaimed_vouchers INTEGER DEFAULT 0;

-- Function to handle points update and voucher awarding
CREATE OR REPLACE FUNCTION handle_competition_points_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if points crossed a multiple of 10
    -- Logic: If new.points >= old.points + (10 - (old.points % 10)) ??
    -- Simpler: Just check if floor(new/10) > floor(old/10)
    
    IF FLOOR(NEW.competition_points / 10) > FLOOR(OLD.competition_points / 10) THEN
         NEW.unclaimed_vouchers := NEW.unclaimed_vouchers + (FLOOR(NEW.competition_points / 10) - FLOOR(OLD.competition_points / 10));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for points update
DROP TRIGGER IF EXISTS on_competition_points_change ON public.profiles;
CREATE TRIGGER on_competition_points_change
    BEFORE UPDATE OF competition_points ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_competition_points_update();

-- Seed Templates (25 coupons)
INSERT INTO public.coupon_templates (title, description, category, intensity, icon) VALUES
('Massage Night', 'Good for one 30-minute massage of your choice.', 'service', 2, 'spa'),
('Breakfast in Bed', 'Complete with coffee, juice, and your favorites.', 'service', 2, 'bakery_dining'),
('Movie Choice', 'You get 100% control over the movie selection tonight.', 'fun', 1, 'movie'),
('Dinner Duty Off', 'I handle all cooking (and cleaning!) tonight.', 'service', 3, 'cooking'),
('Yes Day', 'I have to say YES to your requests for 1 hour (within reason!).', 'fun', 3, 'check_circle'),
('Sexual Fantasy', 'We try one fantasy of your choosing.', 'spicy', 3, 'local_fire_department'),
('No Chores Day', 'Skip your chores today, I''ve got them.', 'service', 3, 'cleaning_services'),
('Back Scratch', '15 minutes of dedicated back scratching.', 'service', 1, 'healing'),
('Oral Fixation', 'Focus is entirely on you tonight.', 'spicy', 3, 'water_drop'),
('Tech Free Night', 'We both put phones away for the whole evening.', 'romantic', 2, 'phonelink_off'),
('Date Night Planner', 'I plan and execute a surprise date night.', 'romantic', 3, 'event'),
('Bubble Bath', 'I run you a hot bath with all the fixings.', 'service', 2, 'bathtub'),
('Quickie', 'Anytime, anywhere (safe/legal).', 'spicy', 2, 'timer'),
('Video Game Partner', 'I play your favorite game with you for an hour.', 'fun', 2, 'sports_esports'),
('Dessert Run', 'I go get your favorite treat right now.', 'service', 2, 'icecream'),
('Compliment Shower', '5 minutes of me telling you everything I love about you.', 'romantic', 1, 'favorite'),
('Strip Tease', 'A private show just for you.', 'spicy', 2, 'visibility'),
('Blindfolded Surprise', 'Put on a blindfold and trust me.', 'spicy', 2, 'visibility_off'),
('Roleplay Pass', 'we enact a scenario of your choice.', 'spicy', 3, 'masks'),
('End Argument Card', 'Play this to immediately stop a petty argument (hug it out).', 'fun', 3, 'handshake'),
('Music Control', 'You pick the playlist for the road trip/evening.', 'fun', 1, 'music_note'),
('Foot Rub', '20 minute foot massage.', 'service', 2, 'foot_bones'),
('Sleep In', 'I manage the morning routine, you sleep in.', 'service', 3, 'bed'),
('Naughty Pic', 'I send you a risky photo on demand.', 'spicy', 2, 'camera_alt'),
('Unknown Adventure', 'We get in the car/walk and go somewhere random.', 'fun', 2, 'explore');

-- Function to add competition points (for use by other parts of the app)
CREATE OR REPLACE FUNCTION add_competition_points(
    p_user_id UUID,
    p_points INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET competition_points = competition_points + p_points
    WHERE id = p_user_id;
END;
$$;
