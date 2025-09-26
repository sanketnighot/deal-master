# Deal Master - Deal or No Deal Game

A modern, fully functional web2 MVP of the classic "Deal or No Deal" game built with Next.js, TypeScript, Supabase, and Web3Auth authentication.

## 🎮 Features

- **Web3Auth Authentication**: Login with wallet or Google OAuth
- **Classic Gameplay**: 5 cases, banker offers, strategic decisions
- **Server-Side Logic**: Fair play with cryptographically secure randomness
- **Real-Time Updates**: Live game state management
- **Demo Mode**: Try the game without signing up
- **Responsive Design**: Works on desktop and mobile
- **TypeScript**: Full type safety throughout the application

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, or bun
- Supabase account
- Web3Auth account

### 1. Clone and Install

```bash
git clone <repository-url>
cd deal-master
npm install
```

### 2. Environment Setup

Copy the environment template:

```bash
cp env.example .env.local
```

Fill in your environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Web3Auth Configuration
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
WEB3AUTH_ISSUER=https://api-auth.web3auth.io

# Application Configuration
NODE_ENV=development
PORT=3000
```

### 3. Database Setup

#### Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Get your project URL and anon key from Settings > API
3. Get your service role key from Settings > API (keep this secret!)

#### Run Database Migrations

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `db/migrations.sql`
4. Run the migration

#### Seed Demo Data

```bash
npm run seed
```

This creates demo games and users for testing.

### 4. Web3Auth Setup

#### Create Web3Auth App

1. Go to [Web3Auth Dashboard](https://dashboard.web3auth.io)
2. Create a new project
3. Get your Client ID from the Project Settings
4. Note the JWKS Endpoint: `https://api-auth.web3auth.io/.well-known/jwks.json`
5. Configure Google OAuth (optional but recommended)

#### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Configure in Web3Auth dashboard

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🎯 How to Play

1. **Choose Your Case**: Select one of 5 cases to keep throughout the game
2. **Burn Cases**: Reveal and remove other cases to narrow down possibilities
3. **Banker's Offers**: The banker makes offers based on remaining cases
4. **Accept or Reject**: Decide whether to take the offer or continue playing
5. **Final Decision**: When only 2 cases remain, choose to keep your case or swap

## 🏗️ Project Structure

```
deal-master/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/game/          # Game API endpoints
│   │   ├── dashboard/         # User dashboard
│   │   ├── game/[id]/         # Game page
│   │   ├── demo/              # Demo mode
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── game/             # Game-specific components
│   │   ├── auth/             # Authentication components
│   │   └── layout/           # Layout components
│   ├── contexts/             # React contexts
│   ├── lib/                  # Utility libraries
│   └── types/                # TypeScript type definitions
├── db/
│   └── migrations.sql        # Database schema
├── scripts/
│   └── seed.ts              # Database seeding script
├── tests/
│   ├── unit/                # Unit tests
│   └── e2e/                 # End-to-end tests
└── public/                  # Static assets
```

## 🔧 API Endpoints

### Game Management

- `POST /api/game/create` - Create a new game
- `GET /api/game/[id]` - Get game state (authenticated)
- `GET /api/game/[id]/statePublic` - Get public game state

### Game Actions

- `POST /api/game/[id]/pick` - Pick a case
- `POST /api/game/[id]/burn` - Burn a case
- `POST /api/game/[id]/acceptDeal` - Accept banker's offer
- `POST /api/game/[id]/finalReveal` - Final reveal with optional swap

All endpoints require Web3Auth authentication except public endpoints.

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### End-to-End Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Security Features

- **Server-Side Validation**: All game logic runs on the server
- **JWT Verification**: Web3Auth tokens verified with JWKS
- **Input Sanitization**: All user inputs validated and sanitized
- **Rate Limiting**: API endpoints protected against abuse
- **CORS Configuration**: Proper cross-origin resource sharing

## 🎨 Customization

### Styling

The app uses Tailwind CSS for styling. Customize colors and themes in `tailwind.config.js`.

### Game Rules

Modify game logic in `src/lib/server.ts`:

- Card value generation
- Banker offer calculation
- Game state validation

### Authentication

Configure Web3Auth providers in `src/lib/web3auth.ts`.

## 📱 Mobile Support

The app is fully responsive and works on:

- iOS Safari
- Android Chrome
- Mobile browsers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Web3Auth not working:**
- Check your Client ID
- Verify domain is added to Web3Auth dashboard
- Check browser console for errors

**Database connection issues:**
- Verify Supabase URL and keys
- Check if migrations are applied
- Ensure service role key is correct

**Game not loading:**
- Check if demo data is seeded
- Verify API endpoints are working
- Check browser network tab

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page
- Create a new issue with detailed information
- Include error messages and steps to reproduce

## 🎉 Demo

Try the game without signing up at `/demo` or visit the live demo at [your-demo-url].

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) for the amazing framework
- [Supabase](https://supabase.com) for the database and real-time features
- [Web3Auth](https://web3auth.io) for authentication
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Lucide React](https://lucide.dev) for icons
