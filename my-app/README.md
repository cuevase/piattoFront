# Piatto Dashboard

A comprehensive dashboard application for managing restaurant operations, including menu generation, client management, shipments, and data analytics. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Authentication**: Supabase-based authentication with email/password and Google OAuth
- **Menu Generation**: AI-powered menu creation with weekly planning
- **Client Management**: Manage client information and preferences
- **Shipment Tracking**: Track and manage food shipments
- **Data Analytics**: Comprehensive data dashboard with filtering capabilities
- **Responsive Design**: Modern UI built with Tailwind CSS

## Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account
- OpenAI API key (for menu generation)

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd piattoFront/my-app
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Environment Variables

Create a `.env.local` file in the `my-app` directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role (for server-side operations)
service_role=your_supabase_service_role_key

# OpenAI API Key (for menu generation)
OPENAI_API_KEY=your_openai_api_key

# Backend API URL
NEXT_PUBLIC_BACKEND_URL=your_backend_api_url
```

#### How to get these values:

1. **Supabase Setup**:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - In your project dashboard, go to Settings > API
   - Copy the "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the "anon public" key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy the "service_role" key for `service_role`

2. **OpenAI API Key**:
   - Go to [platform.openai.com](https://platform.openai.com)
   - Create an account and get your API key
   - Add it to `OPENAI_API_KEY`

3. **Backend URL**:
   - Set your backend API URL (e.g., ngrok tunnel for development)

### 4. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 5. Database Setup

Make sure your Supabase database has the following tables:
- `shipments`
- `clientes` 
- `ingredientes`
- `menus`
- `recetas`
- And other related tables for the application to work properly

## Project Structure

```
my-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── login/              # Authentication
│   │   └── lib/                # Supabase clients
│   ├── components/             # Reusable UI components
│   ├── lib/                    # API utilities
│   └── types/                  # TypeScript definitions
├── public/                     # Static assets
└── middleware.ts               # Authentication middleware
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Authentication

The application uses Supabase authentication with:
- Email/password login and registration
- Google OAuth integration
- Protected routes with middleware
- Server-side and client-side authentication

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Supabase Documentation](https://supabase.com/docs) - learn about Supabase features.
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about Tailwind CSS.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
