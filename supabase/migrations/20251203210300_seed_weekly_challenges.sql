-- Seed Weekly Challenges
-- Frequency: weekly
-- Mix: ~20% Online Game, ~33% Competitive, ~47% Normal

DELETE FROM activities WHERE type = 'challenge' AND content->>'frequency' = 'weekly';

INSERT INTO public.activities (category, type, content) VALUES
-- ONLINE GAME (approx 10)
('fun', 'challenge', '{"frequency": "weekly", "title": "Online Game Night", "description": "Play a new online multiplayer game! Check the Date Night Hub for the link. Who will win?", "durationMinutes": 30, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Online Game Night", "description": "Play a new online multiplayer game! Check the Date Night Hub for the link. Who will win?", "durationMinutes": 30, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Online Game Night", "description": "Play a new online multiplayer game! Check the Date Night Hub for the link. Who will win?", "durationMinutes": 30, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Online Game Night", "description": "Play a new online multiplayer game! Check the Date Night Hub for the link. Who will win?", "durationMinutes": 30, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Online Game Night", "description": "Play a new online multiplayer game! Check the Date Night Hub for the link. Who will win?", "durationMinutes": 30, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Online Game Night", "description": "Play a new online multiplayer game! Check the Date Night Hub for the link. Who will win?", "durationMinutes": 30, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Online Game Night", "description": "Play a new online multiplayer game! Check the Date Night Hub for the link. Who will win?", "durationMinutes": 30, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Online Game Night", "description": "Play a new online multiplayer game! Check the Date Night Hub for the link. Who will win?", "durationMinutes": 30, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Online Game Night", "description": "Play a new online multiplayer game! Check the Date Night Hub for the link. Who will win?", "durationMinutes": 30, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Online Game Night", "description": "Play a new online multiplayer game! Check the Date Night Hub for the link. Who will win?", "durationMinutes": 30, "isCompetition": true}'),

-- COMPETITIVE (approx 17)
('active', 'challenge', '{"frequency": "weekly", "title": "Plank Challenge", "description": "See who can hold a plank longer! Record your times.", "durationMinutes": 5, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Wiki Race", "description": "Start at the same Wikipedia page. First to reach a target page (e.g., ''Kevin Bacon'') using only links wins.", "durationMinutes": 20, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Scavenger Hunt", "description": "Find these 5 items first: A spoon, a red sock, a coin, a blue book, and a piece of fruit.", "durationMinutes": 20, "isCompetition": true}'),
('active', 'challenge', '{"frequency": "weekly", "title": "Step Count Battle", "description": "Who can get more steps this week?", "durationMinutes": 0, "isCompetition": true}'),
('creative', 'challenge', '{"frequency": "weekly", "title": "Photo Contest", "description": "Take the best photo of a sunset this week.", "durationMinutes": 10, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Joke Off", "description": "Prepare 3 jokes. Who gets the most laughs?", "durationMinutes": 15, "isCompetition": true}'),
('active', 'challenge', '{"frequency": "weekly", "title": "Push-up Challenge", "description": "Who can improve their push-up max more this week?", "durationMinutes": 10, "isCompetition": true}'),
('creative', 'challenge', '{"frequency": "weekly", "title": "Cocktail/Mocktail Off", "description": "Create a signature drink for each other. Best taste/presentation wins.", "durationMinutes": 30, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Lip Sync Battle", "description": "Record a lip sync video. Best performance wins.", "durationMinutes": 15, "isCompetition": true}'),
('active', 'challenge', '{"frequency": "weekly", "title": "Wall Sit Challenge", "description": "Who can hold a wall sit longer?", "durationMinutes": 5, "isCompetition": true}'),
('active', 'challenge', '{"frequency": "weekly", "title": "House of Cards", "description": "Who can build the tallest house of cards in 10 minutes?", "durationMinutes": 10, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Trivia Night", "description": "Play a trivia game together. Highest score wins.", "durationMinutes": 30, "isCompetition": true}'),
('active', 'challenge', '{"frequency": "weekly", "title": "Dance Off", "description": "Learn a TikTok dance. Best moves wins.", "durationMinutes": 30, "isCompetition": true}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Card Game Night", "description": "Play a card game. Best of 3 wins.", "durationMinutes": 30, "isCompetition": true}'),
('active', 'challenge', '{"frequency": "weekly", "title": "Yoga Challenge", "description": "Try a difficult yoga pose. Who holds it better?", "durationMinutes": 15, "isCompetition": true}'),

-- NORMAL (approx 25)
('romantic', 'challenge', '{"frequency": "weekly", "title": "Virtual Movie Night", "description": "Watch a movie together while on a video call.", "durationMinutes": 120, "isCompetition": false}'),
('active', 'challenge', '{"frequency": "weekly", "title": "Recipe Swap", "description": "Cook each other''s favorite childhood meal and rate it.", "durationMinutes": 60, "isCompetition": false}'),
('deep', 'challenge', '{"frequency": "weekly", "title": "Deep Conversation", "description": "Discuss a specific deep topic (e.g., \"What does success mean to you?\").", "durationMinutes": 45, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "weekly", "title": "Virtual Museum Tour", "description": "Explore a virtual museum together.", "durationMinutes": 45, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "weekly", "title": "Playlist Swap", "description": "Create a 10-song playlist for each other.", "durationMinutes": 30, "isCompetition": false}'),
('romantic', 'challenge', '{"frequency": "weekly", "title": "Love Letter", "description": "Write and send a digital love letter.", "durationMinutes": 30, "isCompetition": false}'),
('deep', 'challenge', '{"frequency": "weekly", "title": "Future Planning", "description": "Plan your next visit in detail.", "durationMinutes": 45, "isCompetition": false}'),
('active', 'challenge', '{"frequency": "weekly", "title": "Fitness Challenge", "description": "Do a workout video together.", "durationMinutes": 45, "isCompetition": false}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "PowerPoint Night", "description": "Make a presentation on: ''Why I would survive a zombie apocalypse''.", "durationMinutes": 60, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "weekly", "title": "Vision Board", "description": "Create a shared digital vision board.", "durationMinutes": 45, "isCompetition": false}'),
('active', 'challenge', '{"frequency": "weekly", "title": "Walk and Talk", "description": "Go for a walk while on the phone with each other.", "durationMinutes": 45, "isCompetition": false}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Karaoke Night", "description": "Sing your favorite songs to each other.", "durationMinutes": 45, "isCompetition": false}'),
('romantic', 'challenge', '{"frequency": "weekly", "title": "Date Night In", "description": "Order the same takeout and have a dinner date.", "durationMinutes": 60, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "weekly", "title": "Storytelling", "description": "Take turns telling a story.", "durationMinutes": 30, "isCompetition": false}'),
('deep', 'challenge', '{"frequency": "weekly", "title": "Gratitude List", "description": "Share 5 things you are grateful for this week.", "durationMinutes": 20, "isCompetition": false}'),
('active', 'challenge', '{"frequency": "weekly", "title": "Meditation", "description": "Do a guided meditation together.", "durationMinutes": 20, "isCompetition": false}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Personality Test", "description": "Take a personality test and compare results.", "durationMinutes": 30, "isCompetition": false}'),
('romantic', 'challenge', '{"frequency": "weekly", "title": "Memory Lane", "description": "Look through old photos together.", "durationMinutes": 45, "isCompetition": false}'),
('deep', 'challenge', '{"frequency": "weekly", "title": "Dream Sharing", "description": "Share your biggest dreams and fears.", "durationMinutes": 45, "isCompetition": false}'),
('active', 'challenge', '{"frequency": "weekly", "title": "Dance Party", "description": "Put on music and dance like no one is watching.", "durationMinutes": 20, "isCompetition": false}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Riddle Me This", "description": "Solve riddles together.", "durationMinutes": 30, "isCompetition": false}'),
('romantic', 'challenge', '{"frequency": "weekly", "title": "Compliment Circle", "description": "Spend 10 minutes just complimenting each other.", "durationMinutes": 10, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "weekly", "title": "Poetry Slam", "description": "Write a funny poem about your partner.", "durationMinutes": 20, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "weekly", "title": "Pinterest Board", "description": "Create a shared Pinterest board for your dream home/vacation.", "durationMinutes": 30, "isCompetition": false}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Virtual Escape Room", "description": "Try a virtual escape room together.", "durationMinutes": 60, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "weekly", "title": "Drawing Contest", "description": "Draw each other in 5 minutes. Best likeness wins!", "durationMinutes": 10, "isCompetition": false}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Virtual Concert", "description": "Watch a concert or show together online.", "durationMinutes": 120, "isCompetition": false}'),
-- Legacy Weekly Adventures (Cleaned & LDR Friendly)



('fun', 'challenge', '{"frequency": "weekly", "title": "Online Board Game", "description": "Play an online board game or card game.", "durationMinutes": 60, "isCompetition": false}'),

('romantic', 'challenge', '{"frequency": "weekly", "title": "Vacation Plan", "description": "Plan a future vacation.", "durationMinutes": 60, "isCompetition": false}'),
('active', 'challenge', '{"frequency": "weekly", "title": "Virtual Bike Ride", "description": "Go for a bike ride and share stats/pics.", "durationMinutes": 60, "isCompetition": false}'),
('deep', 'challenge', '{"frequency": "weekly", "title": "Podcast Club", "description": "Each watch/listen to a podcast episode and explain it to the other.", "durationMinutes": 60, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "weekly", "title": "Co-write Story", "description": "Write a story together.", "durationMinutes": 60, "isCompetition": false}'),
('romantic', 'challenge', '{"frequency": "weekly", "title": "Self-Care Together", "description": "Do a self-care routine together on video.", "durationMinutes": 60, "isCompetition": false}'),
('fun', 'challenge', '{"frequency": "weekly", "title": "Virtual Fort Building", "description": "Build blanket forts and show them off.", "durationMinutes": 60, "isCompetition": false}'),




('deep', 'challenge', '{"frequency": "weekly", "title": "Letter to Future", "description": "Write a letter to your future selves.", "durationMinutes": 60, "isCompetition": false}'),
('romantic', 'challenge', '{"frequency": "weekly", "title": "Sunset Share", "description": "Watch the sunset (share pics if timezones differ).", "durationMinutes": 60, "isCompetition": false}'),

('fun', 'challenge', '{"frequency": "weekly", "title": "Market Tour", "description": "Visit a local market and video call.", "durationMinutes": 60, "isCompetition": false}'),
('creative', 'challenge', '{"frequency": "weekly", "title": "Craft Night", "description": "Paint or craft together.", "durationMinutes": 60, "isCompetition": false}'),

('creative', 'challenge', '{"frequency": "weekly", "title": "Portrait Drawing", "description": "Draw portraits of each other.", "durationMinutes": 60, "isCompetition": false}'),
('deep', 'challenge', '{"frequency": "weekly", "title": "Highs and Lows", "description": "Share your highs and lows of the week.", "durationMinutes": 60, "isCompetition": false}'),
('deep', 'challenge', '{"frequency": "weekly", "title": "Mindfulness Session", "description": "Practice mindfulness together for 15 minutes.", "durationMinutes": 15, "isCompetition": false}'),

-- SPICY (16)
('spicy', 'challenge', '{"title": "Cam Night Date", "description": "Plan a video call date where you both wear something special (or nothing at all, if you''re bold).", "frequency": "weekly", "durationMinutes": 45, "isCompetition": false, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Erotic Story Time", "description": "Write a short paragraph of an erotic story featuring both of you. Take turns adding a sentence.", "frequency": "weekly", "durationMinutes": 20, "isCompetition": false, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Truth or Dare: Spicy", "description": "Play a round of Truth or Dare over video call, focusing on intimacy and fun.", "frequency": "weekly", "durationMinutes": 30, "isCompetition": true, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Toy Shopping", "description": "Browse online together for a toy or lingerie you''d like to use when you reunite.", "frequency": "weekly", "durationMinutes": 20, "isCompetition": false, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Sensual Playlist Exchange", "description": "Create a 5-song playlist for ''getting in the mood'' and explain why you chose each track.", "frequency": "weekly", "durationMinutes": 15, "isCompetition": false, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Roleplay Night", "description": "Plan a date night where you both adopt personas/names (e.g., strangers meeting at a bar).", "frequency": "weekly", "durationMinutes": 60, "isCompetition": false, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Blind Taste Test", "description": "Describe 3 foods sensually to your partner and have them guess what they are.", "frequency": "weekly", "durationMinutes": 15, "isCompetition": true, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Strip Tease Reveal", "description": "Slowly reveal one item of clothing you are wearing (or not wearing) over video.", "frequency": "weekly", "durationMinutes": 10, "isCompetition": false, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Sensual Education", "description": "Watch a short educational video about massage or intimacy techniques together.", "frequency": "weekly", "durationMinutes": 20, "isCompetition": false, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Fantasy Exchange", "description": "Each write down one fantasy you haven''t shared yet. Read them out loud.", "frequency": "weekly", "durationMinutes": 20, "isCompetition": false, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Position Roulette", "description": "Find a new position online that looks fun and describe how you''d try it.", "frequency": "weekly", "durationMinutes": 10, "isCompetition": false, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Scent Marking", "description": "Pick a scent (perfume/cologne) to wear for every video call this week.", "frequency": "weekly", "durationMinutes": 5, "isCompetition": false, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Steamy Voice Series", "description": "Exchange 3 voice notes throughout the week describing what you want to do to each other.", "frequency": "weekly", "durationMinutes": 10, "isCompetition": false, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Naughty Drawing", "description": "Draw something spicy (abstract or literal) and send a photo.", "frequency": "weekly", "durationMinutes": 15, "isCompetition": true, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Whisper Challenge", "description": "Whisper naughty phrases on video call. Partner has to guess by reading lips.", "frequency": "weekly", "durationMinutes": 15, "isCompetition": true, "isSpicy": true}'),
('spicy', 'challenge', '{"title": "Command Week", "description": "Take turns giving one spicy command each day for the next 7 days.", "frequency": "weekly", "durationMinutes": 10, "isCompetition": false, "isSpicy": true}');
