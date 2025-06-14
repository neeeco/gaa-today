# GAA Today

A modern full-stack application using Railway, Vercel, and Supabase.

## Project Structure

- `/frontend` - Next.js frontend application (deployed on Vercel)
- `/backend` - Node.js/Express backend application (deployed on Railway)
- `/database` - Supabase database configuration and migrations

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account
- Railway account
- Vercel account

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=your_railway_backend_url
```

4. Run the development server:
```bash
npm run dev
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your environment variables:
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

4. Run the development server:
```bash
npm run dev
```

## Deployment

### Frontend (Vercel)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

### Backend (Railway)
1. Push your code to GitHub
2. Create a new project in Railway
3. Connect your repository
4. Configure environment variables
5. Deploy!

### Database (Supabase)
1. Create a new project in Supabase
2. Run migrations from the `/database` directory
3. Configure security rules and policies

## Environment Variables

Make sure to set up the following environment variables:

### Frontend (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

### Backend (.env)
- `PORT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

## License

MIT 