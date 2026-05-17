# 📈 Invest Smarter (Smart Investor)

An advanced, AI-powered quantitative stock and ETF screener, portfolio manager, and market intelligence platform built for modern investors.

![Invest Smarter](/public/window.svg) <!-- Replace with actual screenshot later -->

## ✨ Key Features

- **🤖 AI-Powered Analysis**: Integrated with Google Gemini to provide instant, real-time quantitative insights, pros/cons, investor suitability, and verdicts for any stock or ETF.
- **📊 Advanced Screeners**: Highly interactive ETF and S&P 500 screeners. Filter by custom metrics like "Hunter Score", Quality Score, Momentum (RSI), FCF Yield, and Expense Ratios.
- **🏷️ Smart Intel Tags**: Instantly identify market positioning with automated strategy tags like *Value Trap*, *Opportunity Window*, *Cash Cow*, and *Balanced Compounder*.
- **💼 Portfolio Management**: Build, track, and optimize asset allocations. Includes pre-built strategy templates and deep analytics.
- **📰 Market News & RSS Feeds**: Keep a pulse on the macro environment with integrated sentiment gauges and sparkline charts.
- **🔐 Secure Admin & User Management**: Full authentication flow, settings configuration (store API keys securely in-database), and user management.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Database / ORM**: [Prisma](https://www.prisma.io/) + PostgreSQL
- **AI Integration**: [Google Generative AI SDK](https://sdk.vercel.ai/docs/introduction) (`@ai-sdk/google`)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js 18+ and a PostgreSQL database running.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/enenkei/smart-investor-frontend.git
   cd invest-smarter
   ```

2. Install dependencies:
   ```bash
   npm install
   # or yarn / pnpm / bun install
   ```

3. Set up Environment Variables:
   Create a `.env` file in the root directory based on your environment:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/invest_smarter"
   # Add any NextAuth secrets or other required variables
   ```

4. Initialize the Database:
   ```bash
   npx prisma generate
   npx prisma db push
   # or npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧠 AI Configuration

The application requires an AI model to run quantitative analysis on the screeners. 
Instead of `.env` files, API keys and model selections (e.g., `gemini-3.1-flash-lite`) are securely stored in the PostgreSQL database via the **Admin Settings Dashboard**. Ensure you configure your Google Generative AI API key in the UI before triggering an analysis.

## 🤝 Contributing

Feedback, bug reports, and pull requests are welcome!

## 📄 License

This project is licensed under the MIT License.
