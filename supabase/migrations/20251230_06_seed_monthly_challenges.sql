-- Seed Monthly Challenges
-- Frequency: monthly
-- Mix: ~33% Competitive, ~67% Normal

DELETE FROM public.user_answers WHERE activity_id IN (SELECT id FROM public.activities WHERE type = 'challenge' AND content->>'frequency' = 'monthly');
DELETE FROM public.activities WHERE type = 'challenge' AND content->>'frequency' = 'monthly';

INSERT INTO public.activities (category, type, content) VALUES
-- COMPETITIVE (approx 8)
('romantic', 'challenge', '{"frequency": "monthly", "title": "Virtual Date Night", "description": "Plan a fancy virtual date night (dress up!). Best outfit wins!", "durationMinutes": 90, "isCompetition": true}'),
('creative', 'challenge', '{"frequency": "monthly", "title": "DIY Project", "description": "Do a craft or DIY project \"together\". Best creation wins.", "durationMinutes": 90, "isCompetition": true}'),
('active', 'challenge', '{"frequency": "monthly", "title": "Sudoku Race", "description": "Solve the same Hard Sudoku puzzle. Fastest time wins.", "durationMinutes": 30, "isCompetition": true}'),
('active', 'challenge', '{"frequency": "monthly", "title": "Step Challenge", "description": "Who can get the most steps in a single day this month?", "durationMinutes": 0, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "monthly", "title": "Prediction League", "description": "Predict outcomes of 5 events in that month (Use Polymarket for ideas). Most correct wins.", "durationMinutes": 30, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "monthly", "title": "Debate Night", "description": "Pick a silly topic (e.g., Is a hotdog a sandwich?). Best arguer wins.", "durationMinutes": 45, "isCompetition": true}'),
('deep', 'challenge', '{"frequency": "monthly", "title": "Goal Achievement", "description": "Set a goal. Who makes more progress by end of month?", "durationMinutes": 0, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "monthly", "title": "GeoGuesser Battle", "description": "Play 5 rounds of GeoGuesser (free version). Highest total score wins.", "durationMinutes": 45, "isCompetition": true}'),
('creative', 'challenge', '{"frequency": "monthly", "title": "Lego Build", "description": "Build something from Legos (or blocks). Best creation wins.", "durationMinutes": 30, "isCompetition": true}'),

-- NORMAL (approx 16)
('romantic', 'challenge', '{"frequency": "monthly", "title": "Care Package", "description": "Send a physical care package or a digital gift box.", "durationMinutes": 60, "isCompetition": false}'),
('deep', 'challenge', '{"frequency": "monthly", "title": "Goal Setting", "description": "Set shared goals for the next month.", "durationMinutes": 60, "isCompetition": false}'),
('active', 'challenge', '{"frequency": "monthly", "title": "Learn Something New", "description": "Take a mini online class together.", "durationMinutes": 60, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "monthly", "title": "Scrapbook", "description": "Create a digital scrapbook page of your month.", "durationMinutes": 60, "isCompetition": false}'),
('deep', 'challenge', '{"frequency": "monthly", "title": "Budget Review", "description": "Review finances or save for a trip together.", "durationMinutes": 60, "isCompetition": false}'),
('romantic', 'challenge', '{"frequency": "monthly", "title": "Surprise Gift", "description": "Order a small surprise delivery for your partner.", "durationMinutes": 45, "isCompetition": false}'),
('deep', 'challenge', '{"frequency": "monthly", "title": "Bucket List Update", "description": "Update your shared bucket list.", "durationMinutes": 60, "isCompetition": false}'),
('deep', 'challenge', '{"frequency": "monthly", "title": "Relationship Check-in", "description": "Have a structured relationship check-in talk.", "durationMinutes": 60, "isCompetition": false}'),
('romantic', 'challenge', '{"frequency": "monthly", "title": "Stargazing", "description": "Go stargazing at the same time (if timezones allow) or share sky views.", "durationMinutes": 45, "isCompetition": false}'),
('fun', 'challenge', '{"frequency": "monthly", "title": "Themed Dinner", "description": "Have a themed dinner night (e.g., Italian, Mexican).", "durationMinutes": 90, "isCompetition": false}'),
('active', 'challenge', '{"frequency": "monthly", "title": "Outdoor Adventure", "description": "Go for a hike or explore a new park.", "durationMinutes": 120, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "monthly", "title": "Art Night", "description": "Paint or draw together while sipping wine/tea.", "durationMinutes": 90, "isCompetition": false}'),
('deep', 'challenge', '{"frequency": "monthly", "title": "Letter Writing", "description": "Write a handwritten letter and mail it.", "durationMinutes": 30, "isCompetition": false}'),
('fun', 'challenge', '{"frequency": "monthly", "title": "Comedy Special", "description": "Watch a stand-up comedy special together.", "durationMinutes": 60, "isCompetition": false}'),
('romantic', 'challenge', '{"frequency": "monthly", "title": "Spa Night", "description": "Do face masks and relax together on video.", "durationMinutes": 45, "isCompetition": false}'),
('active', 'challenge', '{"frequency": "monthly", "title": "Dance Class", "description": "Take an online dance class together.", "durationMinutes": 60, "isCompetition": false}'),
-- Legacy Monthly Missions
('romantic', 'challenge', '{"frequency": "monthly", "title": "Plan a Getaway", "description": "Plan a weekend getaway together (even if for the future).", "durationMinutes": 120, "isCompetition": false}'),
('active', 'challenge', '{"frequency": "monthly", "title": "Yoga Session", "description": "Complete a full yoga session together (video call or async).", "durationMinutes": 45, "isCompetition": false}'),
('deep', 'challenge', '{"frequency": "monthly", "title": "Good Deed Month", "description": "Do a random act of kindness locally and share the story.", "durationMinutes": 120, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "monthly", "title": "Redecorate", "description": "Redecorate a space in your home and show it off.", "durationMinutes": 120, "isCompetition": false}'),
('romantic', 'challenge', '{"frequency": "monthly", "title": "Month-iversary", "description": "Celebrate your month-iversary with a special virtual date.", "durationMinutes": 120, "isCompetition": false}'),
('active', 'challenge', '{"frequency": "monthly", "title": "Day Trip", "description": "Go on a day trip separately and video call from the location.", "durationMinutes": 120, "isCompetition": false}'),
('deep', 'challenge', '{"frequency": "monthly", "title": "New Skill", "description": "Learn a new skill together this month.", "durationMinutes": 120, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "monthly", "title": "Monthly Album", "description": "Create a shared digital photo album of your month.", "durationMinutes": 120, "isCompetition": false}'),
('fun', 'challenge', '{"frequency": "monthly", "title": "Physical Puzzle", "description": "Each work on a physical puzzle and share progress.", "durationMinutes": 120, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "monthly", "title": "Vlog", "description": "Put together a fun video of your day to send to your partner.", "durationMinutes": 60, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "monthly", "title": "Video Montage", "description": "Make a short video montage of your month.", "durationMinutes": 60, "isCompetition": false}');
