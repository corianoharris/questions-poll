# Community Poll App

A simple, real-time polling application built with Next.js and Supabase.

## Features

- 📊 **Create Polls**: Add questions for the community to vote on
- 🗳️ **Vote Once**: Each user can vote only once per question
- 📱 **Real-time Updates**: See votes update live across all users
- 👨‍💼 **Admin Panel**: Manage questions and provide answers
- 🔒 **Authentication**: Secure admin login
- 💾 **Offline Support**: Works offline with localStorage fallback
- 📄 **Pagination**: Browse through questions with pagination
- 🎨 **Purple Theme**: Beautiful purple color scheme

## Database Schema

The app uses two main tables in Supabase:

### `polls` table
- `id` (UUID) - Primary key
- `question` (TEXT) - The poll question
- `votes` (INTEGER) - Number of votes received
- `timestamp` (BIGINT) - Creation timestamp
- `answer` (TEXT) - Optional admin answer
- `created_at` (TIMESTAMP) - Auto-generated creation time
- `updated_at` (TIMESTAMP) - Auto-updated modification time

### `votes` table
- `id` (UUID) - Primary key
- `poll_id` (UUID) - Foreign key to polls table
- `user_id` (TEXT) - Anonymous user identifier
- `created_at` (TIMESTAMP) - Vote timestamp

## Setup Instructions

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Run the SQL from `schema.sql` in the SQL editor

2. **Configure Environment Variables**
   - Add your Supabase URL and anon key to the environment

3. **Admin Credentials**
   - Username: `sandy.lewis`
   - Password: `Admin123!`

## Usage

### For Users
1. Visit the main page
2. Add questions using the form
3. Vote on existing questions (once per question)
4. View real-time vote updates

### For Admins
1. Click "Admin" button
2. Login with admin credentials
3. View all questions sorted by votes
4. Add answers to questions
5. Remove inappropriate questions

## Technical Details

- **Frontend**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Real-time**: Supabase real-time subscriptions
- **State Management**: React Context
- **Authentication**: Simple credential-based auth
- **Offline Support**: localStorage fallback

## User Personas

### Community Member (Primary User)
- **Goal**: Ask questions and participate in community discussions
- **Behavior**: Visits occasionally to see what others are asking and vote on interesting questions
- **Needs**: Simple interface, ability to see popular questions, one-vote-per-question fairness

### Community Moderator/Admin
- **Goal**: Maintain quality discussions and provide helpful answers
- **Behavior**: Regularly monitors questions, provides answers, removes inappropriate content
- **Needs**: Admin access, ability to answer questions, moderation tools

## Use Cases

1. **Community Q&A**: Members ask questions, community votes on most important ones, admins provide answers
2. **Feature Requests**: Users suggest features, votes help prioritize development
3. **Event Planning**: Ask about preferences for community events
4. **Feedback Collection**: Gather opinions on various topics
5. **FAQ Building**: Popular questions become FAQ items with admin answers

## Development

The app is built with modern React patterns:
- Server and Client Components
- React Context for state management
- Real-time subscriptions
- Optimistic updates
- Error boundaries and fallbacks
- Responsive design
- Accessibility features

## Security

- Row Level Security (RLS) enabled on Supabase
- Public read/write access (appropriate for community polls)
- Admin authentication for management features
- Input validation and sanitization
- CSRF protection through SameSite cookies
