-- Seed Date Ideas
-- Clears existing date ideas and inserts new ones.

-- Ensure category exists
ALTER TYPE activity_category ADD VALUE IF NOT EXISTS 'date_idea';

-- Ensure indices exist
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

DELETE FROM public.user_answers WHERE activity_id IN (SELECT id FROM public.activities WHERE category = 'date_idea');
DELETE FROM public.activities WHERE category = 'date_idea';

INSERT INTO public.activities (category, type, content) VALUES
('date_idea', 'challenge', '{"title": "Virtual Museum Tour", "description": "Visit the Louvre together online.", "url": "https://www.louvre.fr/en/online-tours"}'),
('date_idea', 'challenge', '{"title": "Cook Together", "description": "Make the same pasta dish while on video call.", "url": "https://www.youtube.com/watch?v=example"}'),
('date_idea', 'challenge', '{"title": "Movie Night", "description": "Watch a movie together using Teleparty.", "url": "https://www.teleparty.com/"}'),
('date_idea', 'challenge', '{"title": "Online Gaming", "description": "Play a co-op game like Among Us or Stardew Valley.", "url": "https://store.steampowered.com/"}'),
('date_idea', 'challenge', '{"title": "Virtual Escape Room", "description": "Solve puzzles together to escape.", "url": "https://theescapegame.com/remote-adventures/"}'),
('date_idea', 'challenge', '{"title": "Paint and Sip", "description": "Follow a Bob Ross tutorial with a glass of wine.", "url": "https://www.youtube.com/user/BobRossInc"}'),
('date_idea', 'challenge', '{"title": "Book Club", "description": "Read the same book and discuss a chapter.", "url": "https://www.goodreads.com/"}'),
('date_idea', 'challenge', '{"title": "Virtual Concert", "description": "Watch a live stream concert together.", "url": "https://www.youtube.com/live"}'),
('date_idea', 'challenge', '{"title": "Plan a Trip", "description": "Plan your next real-life vacation itinerary.", "url": "https://www.tripadvisor.com/"}'),
('date_idea', 'challenge', '{"title": "Stargazing", "description": "Use an app to look at the stars together.", "url": "https://stellarium-web.org/"}');
