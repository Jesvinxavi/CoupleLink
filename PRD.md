This is a comprehensive Product Requirements Document (PRD) and Implementation Plan for CoupleLink.
It synthesizes every feature, mechanic, and requirement from the four provided sources, resolving conflicts (e.g., removing the video player, enforcing sidebar navigation) and consolidating duplicates into a single "Source of Truth."

# Product Requirements Document (PRD): CoupleLink

## 1. Executive Summary

CoupleLink is a Progressive Web App (PWA) designed to be the digital sanctuary for long-distance couples. Unlike therapeutic apps, its core philosophy is "Connection Through Play."
The app provides a private, shared space for daily interaction, gamified consistency (streaks), and memory archiving. It solves the "interaction gap" in LDRs by turning communication into a high-dopamine, gamified ritual rather than a chore.

### Core Value Proposition

Gamified Consistency: Streaks and "Rain Check" tokens to motivate daily contact.
The "Lock & Key" Mechanic: Answers are hidden until both partners reply, ensuring unbiased vulnerability.
Asynchronous & Synchronous Play: Bridging time zones with quizzes (async) and real-time drawing (sync).

## 2. Technical Architecture

### 2.1 The Stack

Frontend: React (TypeScript), Tailwind CSS.
UI Component Library: ShadCN UI (for accessibility, sidebar, and aesthetics).
Backend-as-a-Service (BaaS): Supabase.
Auth: Google OAuth & Passwordless Email (Magic Link/OTP).
Database: PostgreSQL.
Realtime: Supabase Realtime (for "Draw & Guess" and instant updates).
Storage: Supabase Storage (for "Moments" and Journal media).
Deployment: Vercel or Netlify (SPA mode).
Platform: PWA (Progressive Web App) with manifest.json for "Add to Home Screen" functionality on iOS/Android.

## 3. Authentication & The "Pairing Protocol"

Objective: Seamless, secure onboarding that establishes a private 1:1 connection.

### 3.1 Sign Up

Login Page: Modern, minimalist aesthetic.
Methods:
Google: One-click sign-on.
Email: User enters email → System sends a 6-digit One-Time Password (OTP) → User verifies. (No passwords to remember).
Profile Creation:
Fields: First Name, Birth Date (for milestone tracking), Profile Picture upload.

### 3.2 The Host-Guest Pairing Model

To prevent "lurking" or authorized access, users are not active until paired.
Step 1: The Choice
After profile creation, the user faces two buttons: "Create a New Space" or "Join a Partner".
Step 2: The Host (User A)
Selects "Create Space."
System Action: Generates a unique, human-readable 6-character code (e.g., LOVE-8X29) stored in the couples table.
UI: Shows the code with a "Copy" button and a "Share" button (triggers native OS share sheet).
Status: User A enters a "Waiting Room" screen listening for the status change of the code.
Step 3: The Guest (User B)
Selects "Join a Partner."
UI: Input field for the 6-character code.
System Action: Verifies code. If valid, updates the couples table (sets user_two_id) and updates both users' profiles with the couple_id.
Step 4: The Handshake
Once linked, a confetti animation triggers on both devices (via Supabase Realtime) and redirects both users to the Dashboard.

## 4. UI/UX Strategy: Navigation

Constraint Checklist: Sidebar for Mobile/Web.

### 4.1 The Responsive Sidebar

Desktop: A fixed vertical sidebar on the left.
Includes: Logo, Navigation Links, User Avatar/Settings at the bottom.
Mobile: A standard "Hamburger" menu icon in the top-left.
Action: Opens a ShadCN Sheet (Drawer) sliding from the left.
Content: Identical links to desktop.

### 4.2 Navigation Items

Home (Dashboard)
Games (Interactive Hub)
Date Night (Activity Resource)
Memories (Journal, Photos, Shared Calendar)
Settings (Profile, Subscription, Unpair)

## 5. Feature Detail: The Dashboard (Home Hub)

The central "Command Center"1.

### 5.1 Layout (Grid System)

The dashboard is composed of "Tiles" or "Widgets."
1. The Partner Tile 2

Visual: Displays the partner's profile picture and name.
Metadata: Shows partner's Local Time (crucial for LDR), Local Weather (icon), and an "Online/Offline" indicator (green dot).
2. The Streak Stats 3

Current Streak: A large "Flame" icon with the number of consecutive days.
Longest Streak: Smaller text showing their all-time record.
Milestone Countdown: A widget showing "Days until..." the next event (Anniversary, Birthday, or Custom "Next Visit").
3. The Weekly Horizontal Calendar 4

Visual: A horizontal row of 7 circles representing the current week.
Logic:
Green: Challenge completed that day.
Red: Day missed.
Light Grey: Future dates.
Pulsing Outline: Today.
4. "Today's Challenge" (Hero Tile) 5

State A (Pending): Shows the question/task (e.g., "What is your favorite memory of us?"). Button: "Answer to Unlock."
State B (Waiting): "You've answered! Waiting for [Partner]..." (The partner's answer is visually blurred/locked).
State C (Complete): Both answers are visible.

## 6. Feature Detail: Games Hub

Structure: A Grid List with 2 cards per row6.

### 6.1 Synchronous (Real-Time)

Draw & Guess (Canvas Connection) 7

Tech: react-canvas-draw library + Supabase Realtime Broadcast.
Flow: User A selects a prompt (e.g., "Our First Date"). User A draws. User B sees the strokes appear instantly on their screen. User B types guesses.
Tools: Color picker, Undo, Brush size.
Collaborative Co-op 8

Implementation: An embedded iframe or external link to browser-friendly co-op games (e.g., Fireboy and Watergirl).
UI: Labeled "Play Together" with instructions: "Open this on your laptop while on a video call."

### 6.2 Asynchronous (Questions & Quizzes)

All text games use the "Lock & Key" simultaneous reveal mechanic.
Would You Rather: 9

Visual: Two large tappable cards.
Result: Shows what you picked, what they picked, and if you matched.
Never Have I Ever: 10

Visual: Statement card with "I Have" and "I Haven't" buttons.
Two Truths & A Lie: 11

Input: User A writes 3 statements and marks one as false.
Guess: User B selects the lie.
Who Is More Likely To: 12

Flow: A 5-question quiz.
Result: A comparison screen (e.g., "You both agreed that [Name] is more likely to survive a zombie apocalypse").

### 6.3 Content Categories

Fun: (e.g., Zombie weapons, Theme park attractions)13.

Deep: (e.g., "36 Questions that Lead to Love" module)14.

Spicy (17+): (e.g., "Loudest in bed") - Requires an age-gate toggle in settings15.

## 7. Feature Detail: Date Night Hub

Philosophy: Facilitator of "Social Objects." The app organizes the date, the users execute it externally16.

Structure: A browsable library of date "recipes."
Categories:
Virtual Escape Rooms: Links to vetted providers17.

Virtual Museum Tours: Links to Louvre/Smithsonian18.

Cooking Class: Links to recipes/videos to cook simultaneously19.

Themed Dinner: Prompts for cuisine types (e.g., "Mexican Night")20.

PowerPoint Night: Instructions for the trend21.

Stargazing: Prompts to use apps like SkyView Lite together22.

World Exploration: "Open Google Maps and show me your childhood home"23.

## 8. Feature Detail: The Memory Bank

### 8.1 Shared Journal 24

UI: A scrollable feed (like a private Twitter/X).
Data: Each entry shows Author Avatar, Date, and Text Content.
Notification: Posting triggers a "Gentle Notification" to the partner.
### 8.2 "Moments" (Photo/Video Albums) 25

View: Grid view of thumbnails.
Features: Upload from phone camera roll. Create Albums (e.g., "Trip to Paris 2024").
Storage: Files stored in Supabase Storage; references in memories table.
### 8.3 Shared Calendar (Utility) 26

Purpose: Relationship-specific logistics (not a Google Calendar replacement).
Events: "Next Visit," "Date Night," "Final Exams," "Work Trip."
Visual: Standard month view. Clicking a day shows the list of events.
### 8.4 Couple Challenges (Async) 27

Weekly Goals: "Send a care package." Checkbox clears when both mark done.
Monthly Goals: "Create a Spotify Playlist." Input field to paste the link.

## 9. Gamification & Retention Mechanics

### 9.1 The Streak Logic 28

Definition: A streak increments only when BOTH partners complete a "significant action" (Daily Challenge) within the same 24-hour window (UTC based).
Algorithm (Gaps & Islands):
On completion: Check last_activity_date.
If last_activity_date == Yesterday: Increment Streak.
If last_activity_date == Today: Do nothing.
If last_activity_date < Yesterday: Reset to 1.
### 9.2 The "Rain Check" Token (Forgiveness) 29

Problem: LDR implies busy schedules/time zone misses. Losing a long streak causes churn.

Solution: Couples earn Rain Check Tokens through consistent engagement with the app.

#### Token Earning System

Couples earn 1 Rain Check Token for every 10 "Major Actions" completed collectively.

**Major Action Values:**
- Daily Task/Challenge: 1 action
- Daily Question: 1 action
- Weekly Challenge: 3 actions
- Monthly Challenge: 5 actions
- Other significant interactions: Varies by activity type

**Important Notes:**
- There is NO maximum cap on Rain Check tokens
- Tokens accumulate indefinitely as couples engage with the app
- This creates a positive feedback loop: more engagement → more safety net → less anxiety about streaks

#### Token Usage Flow

When a couple misses a day, on next login they see: "Oh no! You missed yesterday. Use a Rain Check to save your 45-day streak?"

**Actions:**
- Use Token: Deduct 1 token, restore streak count, day is marked as "Saved"
- Don't Use: Streak resets to 1, tokens remain unchanged

**UI Display:** Rain Check token count appears in the dashboard header (right-aligned) showing current available tokens.

## 10. Database Schema (Supabase)

1. profiles
id (uuid, PK) -> links to auth.users
couple_id (uuid, FK) -> links to couples
first_name, avatar_url, birth_date, timezone
2. couples
id (uuid, PK)
invite_code (text, unique)
user_one_id, user_two_id (uuid)
anniversary_date (date)
current_streak (int), longest_streak (int)
rain_check_tokens (int, default: 0)
action_points (int, default: 0) // tracks accumulated major action points for token conversion
last_activity_date (timestamp)
3. activities (Static Content Library)
id (uuid)
category (enum: 'fun', 'deep', 'spicy', 'date_idea')
type (enum: 'quiz', 'draw', 'challenge')
content (jsonb) -> Stores questions, options, prompts.
4. user_answers (The Lock & Key Data)
id (uuid)
couple_id, user_id, activity_id
answer_text (text), drawing_data (jsonb)
created_at (timestamp)
5. calendar_events
id (uuid)
couple_id
event_date (date), title (text), category (text)
6. memories
id (uuid)
couple_id, uploader_id
media_url (text), caption (text), type (photo/journal)

## 11. Security Strategy

Row Level Security (RLS) is Mandatory. 30

Rule: A user can only Select/Insert/Update rows where couple_id matches their own couple_id found in profiles.
Implementation: Create a Postgres function get_user_couple_id() and apply it to every policy.
Note: This prevents "Data Leakage" where User A accidentally sees User C's journal.

## 12. Implementation Roadmap

Phase 1: Foundation

Setup: Init Supabase project & React Repo (ShadCN/Tailwind).
Auth: Implement Google & Email OTP Login.
Pairing: Build the "Generate Code" and "Join via Code" Edge Functions.
Nav: Build the Sidebar/Sheet layout.

Phase 2: Core Dashboard

Data Fetching: Build useCoupleData hook to get partner info and streaks.
Logic: Implement the Streak Calculation & Rain Check logic (Backend Edge Function).
UI: Build the Weekly Calendar (Green/Red dots) and Partner Widget.

Phase 3: The Daily Loop

Challenge Engine: Create the activities table seeder (36 Questions, etc.).
Lock & Key: Build logic to hide partner answer until user submits.
History: Allow users to view past days' challenges.

Phase 4: Expansion

Games: Implement react-canvas-draw with Supabase Realtime.
Date Night: Build the static content library cards.
Memories: Implement Image Upload to Supabase Storage.
PWA: Configure service workers for offline capabilities.

Phase 5: Polish

Animations: Add confetti for streak updates and pairing.
Notifications: Hook up browser notifications for new Journal entries.
Age Gate: Add settings toggle for "Spicy" content.

This is a comprehensive set of Feature Requirements Documents (FRDs) for CoupleLink. These documents are designed to be handed directly to developers, designers, and QA engineers for execution.

# Feature Requirements Document 1: User Authentication & Onboarding

## 1.1 Feature Summary

The entry point of the application must be seamless, secure, and inviting. This module handles user registration, login, and initial profile creation. To minimize friction, we will support both "One-Click" Google OAuth and "Passwordless" Email OTP (One-Time Password) login methods. This eliminates the need for users to remember complex passwords1.

## 1.2 User Stories

As a new user, I want to sign up using my Google account or email so that I can access the app quickly without remembering a password.
As a user, I want to set my profile photo and birthday during setup so that my partner can see my face and the app can track my special day.

## 1.3 Functional Requirements

Landing Page: The landing page must display the CoupleLink logo and two primary buttons: "Continue with Google" and "Continue with Email."
Google OAuth: Clicking "Continue with Google" must trigger the standard Google permission modal. Upon success, if the user does not exist, create a new account; if they do, log them in2.

Email OTP Flow:
If "Continue with Email" is selected, the user inputs their email address.
The system sends a 6-digit numeric code to that email.
The UI updates to show a "Verify Code" input field.
Entering the correct code logs the user in3.

Profile Setup Wizard: Immediately after signup (if first time), the user is directed to a profile setup screen requiring:
First Name: Text input.
Birthday: Date picker (standard native picker).
Profile Picture: Image upload button (opens native gallery/camera)4.

## 1.4 Technical Implementation Requirements

Supabase Auth: Enable Google Provider and Email (Magic Link/OTP) provider in the Supabase dashboard5.

Database Trigger: Use a PostgreSQL trigger on the auth.users table to automatically create a corresponding row in the public.profiles table upon new user registration6.

Storage: Create a bucket named avatars in Supabase Storage for profile pictures. Ensure RLS allows users to upload their own avatar7.

## 1.5 Acceptance Criteria

[ ] User can successfully sign up using a Gmail account.
[ ] User receives an email with a 6-digit code and can log in by entering it.
[ ] User cannot proceed past the profile setup screen without entering a First Name and Birthday.
[ ] Uploaded profile picture is visible in the profile setup preview.

# Feature Requirements Document 2: Couple Linking Flow

## 2.1 Feature Summary

This is the "Pairing Protocol" that connects two distinct user accounts into a single "Couple" entity. We utilize a "Host-Guest" model where one partner generates a unique code and the other inputs it. This ensures a private, encrypted 1:1 connection and prevents unauthorized access to shared data8.

## 2.2 User Stories

As a user starting the relationship space, I want to generate a unique code to send to my partner so they can join me.
As a user joining a space, I want to input a code my partner sent me so that our accounts become permanently linked.

## 2.3 Functional Requirements

Selection Screen: After profile setup, the user sees two large cards: "Create a Space" (Host) and "Join a Partner" (Guest)9.

Host Flow (Create Space):
System generates a random 6-character alphanumeric code (e.g., LOVE-8X).
Display the code prominently with a "Copy to Clipboard" icon.
Include a "Share" button that triggers the native mobile OS share sheet (WhatsApp, iMessage, etc.)10.

The screen must show a loading state: "Waiting for partner to join..." which listens for real-time updates11.

Guest Flow (Join Partner):
Display a text input field limited to 6 characters.
Include a "Connect" button.
Upon clicking Connect, validation occurs. If valid, the user is linked12.

Success State: When the link is established, both users' screens must trigger a "Confetti" animation and automatically redirect to the Main Dashboard13.

## 2.4 Technical Implementation Requirements

Edge Functions: Use a Supabase Edge Function for the linking logic to prevent race conditions.
Function Logic: Verify code exists in couples table. If yes, update user_two_id with the Guest's ID. Update status to 'active'. Update both users' profiles table with the couple_id14.

Realtime Subscription: The Host's client must subscribe to changes on the couples table. When user_two_id is no longer null, trigger the redirect15.

## 2.5 Acceptance Criteria

[ ] Host can generate a code and copy it to the clipboard.
[ ] Guest entering an invalid code receives an error message ("Invalid or expired code").
[ ] Guest entering a valid code triggers a success state on both devices simultaneously.
[ ] Both users are redirected to the Dashboard immediately after pairing.

# Feature Requirements Document 3: Main Dashboard

## 3.1 Feature Summary

The Dashboard is the central hub ("Command Center") of the app. It visualizes the couple's consistency via streaks and presents the daily "call to action." It uses a tile-based grid layout to provide at-a-glance information about the partner's status and the relationship's health16161616.

## 3.2 User Stories

As a user, I want to see my partner's local time and weather so I feel connected to their environment.
As a user, I want to see our current streak and a calendar of our weekly activity to feel motivated to engage today.
As a user, I want to easily access "Today's Challenge" so I can keep our streak alive.

## 3.3 Functional Requirements

Partner Tile:
Display Partner's Profile Picture and Name.
Real-time Clock: Show partner's current local time (calculated via their timezone stored in profiles).
Weather: Fetch simple current weather (Sunny/Rainy/Cloudy icon) based on partner's location/timezone17.

Streak & Stats Tile:
Flame Icon: Display current_streak integer from the database.
Weekly Calendar: A horizontal row of 7 dots representing the last 7 days.
Green Dot: Completed activity.
Red Dot: Missed activity.
Grey Dot: Future18.

Hero Challenge Tile:
Display the title of today's active challenge (e.g., "Daily Question").
Lock & Key Logic:
If User hasn't answered: Show "Tap to Answer."
If User answered but Partner hasn't: Show "Waiting for Partner..." (Blur the partner's side).
If Both answered: Show "View Results" (Unlock)19.

## 3.4 Technical Implementation Requirements

Streak Calculation: Implement the "Gaps and Islands" algorithm in a Postgres function or Edge Function. It checks last_activity_date. If it was yesterday, increment streak on completion. If older, reset to 120202020.

Rain Check Logic: Check rain_check_tokens count. If a day is missed, prompt the user on login to burn a token to restore the streak21.

## 3.5 Acceptance Criteria

[ ] Dashboard loads partner's correct local time relative to the user.
[ ] Completing a challenge updates the "Today" dot on the calendar from pulsing to Green.
[ ] User cannot see Partner's answer to the daily challenge until they submit their own.

# Feature Requirements Document 4: Games Hub

## 4.1 Feature Summary

A dedicated section for interactive play, divided into "Synchronous" (Real-time) and "Asynchronous" (Quiz) games. This hub uses a grid layout for easy browsing of game types. The goal is to provide low-friction fun to bridge the emotional distance22.

## 4.2 User Stories

As a user, I want to play a drawing game where I can see my partner draw in real-time.
As a user, I want to answer fun "Would You Rather" questions to spark conversation.
As a user, I want to filter games by "Spicy" or "Deep" depending on my mood.

## 4.3 Functional Requirements

Game Grid: Display cards for "Draw & Guess," "Would You Rather," "Never Have I Ever," "Two Truths & A Lie," and "Who is More Likely."
Draw & Guess (Canvas Connection):
Canvas area supporting touch/mouse input.
Tools: Brush size slider, Color Picker (Basic 5 colors), Undo button.
Real-time Sync: Strokes drawn by User A must appear on User B's screen within <500ms latency23232323.

Quiz Games (Text):
Would You Rather: Present two options. User taps one. Reveal stats only after selection.
Content Filters: Toggle buttons for "Fun," "Deep," and "Spicy" (17+). Enabling "Spicy" triggers an age confirmation alert24242424.

## 4.4 Technical Implementation Requirements

Realtime Broadcast: Use supabase.channel('game_room').on('broadcast', ...) to transmit drawing coordinates. Do not save every stroke to the database; use ephemeral messages for performance25.

Content Seeding: Populate the activities table with JSON data for at least 50 starter questions per category (Fun/Deep/Spicy)26.

## 4.5 Acceptance Criteria

[ ] Drawing on one device renders the line on the second device instantly.
[ ] "Spicy" content is hidden by default until the toggle is activated.
[ ] Text games enforce the "Lock & Key" mechanism (answers hidden until mutual completion).

# Feature Requirements Document 5: Date Night Hub

## 5.1 Feature Summary

This page acts as a "facilitator" for longer shared experiences. It does not host the content itself but curates and links to external "Social Objects" (movies, tours, recipes) that the couple can experience together while on a video call27.

## 5.2 User Stories

As a user, I want to browse ideas for a virtual date night when we have free time.
As a user, I want direct links to the activities so we don't waste time searching for links.

## 5.3 Functional Requirements

Card Library: A scrollable list of date ideas categorized by type (Virtual Tour, Movie Night, Gameplay, Dinner).
Action Cards:
Virtual Museum: Clicking "Visit Louvre" opens the specific external URL in a new browser tab28.

Cooking Class: Displays a recipe and a link to a YouTube tutorial to watch simultaneously29.

World Exploration: Deep link to Google Maps with a prompt ("Show me your elementary school")30.

## 5.4 Technical Implementation Requirements

Static Data: The content for these cards (Title, Description, External URL, Thumbnail) should be stored in the activities table under category date_idea31.

## 5.5 Acceptance Criteria

[ ] All external links open in a new tab/window.
[ ] Date ideas are clearly categorized.

# Feature Requirements Document 6: Memory Bank (Journal & Photos)

## 6.1 Feature Summary

This section serves as the "Archive" of the relationship. It contains a shared journal for text entries, a photo/video gallery ("Moments"), and a shared calendar for future planning. It builds long-term value by preserving the relationship's history32.

## 6.2 User Stories

As a user, I want to upload a photo from my day so my partner can see what I'm up to.
As a user, I want to write a journal entry about my feelings that only my partner can read.
As a user, I want to see a countdown to our next visit.

## 6.3 Functional Requirements

Shared Journal:
Feed: Reverse-chronological list of entries.
Entry Component: Displays Author Avatar, Date/Time, and Text Body.
Compose: Floating Action Button (+) opens a text input modal33.

Moments Gallery:
Grid View: 3-column grid of image thumbnails.
Upload: Integration with native file picker to select photos/videos.
Lightbox: Clicking a thumbnail opens the image full-screen34.

Shared Calendar:
Month view calendar.
Ability to add events with categories: "Visit," "Date Night," "Exam/Work"35353535.

## 6.4 Technical Implementation Requirements

Supabase Storage: Images must be uploaded to a private bucket.
Row Level Security (RLS):
Critical Security Requirement: The RLS policy for the memories table must use the get_user_couple_id() function. A user MUST NOT be able to fetch memories where couple_id does not match their own36.

Notifications: When a new row is inserted into memories (journal or photo), trigger a browser notification for the partner37.

## 6.5 Acceptance Criteria

[ ] Uploading an image adds it to the grid immediately.
[ ] User A cannot see User C's journal entries (verified via RLS testing).
[ ] Calendar events added by User A are visible to User B.
