# Construction Agreement Analyzer

AI-powered construction agreement analyzer for exteriors companies. Built with Next.js, React, Shadcn UI, and Claude AI.

## Features

- **AI-Powered Analysis**: Uses Claude AI to extract and structure information from construction agreements
- **Clean Interface**: Built with Shadcn UI components for a modern, professional look
- **Instant Results**: Get formatted job summaries in seconds
- **Copy to Clipboard**: Easily copy the generated summary for use in other documents

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```

4. Add your Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

### Manual Deploy

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your repository in [Vercel](https://vercel.com/new)
3. Add your environment variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key
4. Click "Deploy"

## Usage

1. Paste your construction agreement text into the left panel
2. Click "Analyze Agreement"
3. View the structured job summary in the right panel
4. Click "Copy to Clipboard" to copy the formatted summary

## Output Format

The analyzer extracts and formats the following information:
- Client and job details
- Work to complete (roof, gutters, etc.)
- Upgrades included
- Excluded items
- Job notes
- Warranty information
- Contract total

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI
- **AI**: Anthropic Claude (Sonnet 3.5)
- **Deployment**: Vercel

## License

MIT
