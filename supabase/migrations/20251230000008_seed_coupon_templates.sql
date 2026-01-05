-- 20251230_08_seed_coupon_templates.sql
-- Seed Templates (25 coupons)
DELETE FROM public.coupons;
DELETE FROM public.coupon_templates;

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
