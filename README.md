# Banking App with Financial Insights

This is a Next.js project that demonstrates a banking app with powerful financial insights features using AI.

## Features

- Dashboard with account information and transaction history
- Financial insights with AI-powered analysis
- Pre-computation of insights for better performance
- Responsive design for all devices

## Deployment to Vercel

This app is designed to be easily deployed to Vercel. Follow these steps:

1. Fork or clone this repository to your GitHub account
2. Sign in to [Vercel](https://vercel.com)
3. Click "New Project" and import your repository
4. Add the following environment variable:
   - `OPENAI_API_KEY`: Your OpenAI API key for generating insights

5. Deploy the project

Once deployed, navigate to the app and use the "Pre-generate Insights" button on the dashboard to generate insights for all user types. This will create the necessary data and store it for all users of your app.

## Local Development

First, make sure to create a `.env.local` file with the following environment variable:

```
OPENAI_API_KEY=your_openai_api_key
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## File Storage in Vercel

This app uses a simple JSON file-based storage system for insights. In a Vercel serverless environment, file storage works as follows:

1. The `/data` directory is used to store pre-computed insights
2. Any writes to this directory during serverless function execution are temporary
3. Pre-generated insights will persist until the next deployment
4. You should run the pre-generation function after each deployment

For production use with a high number of users, consider migrating to a database solution like Vercel Postgres, MongoDB Atlas, or other cloud database services.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Shadcn UI

## Getting Started

First, install the dependencies:

```bash
npm install
```

## Development

This application uses the following structure:

- `src/app`: Next.js app directory with pages
- `src/components`: UI components (both custom and shadcn)
- `src/lib`: Utility functions and mock data

## Customization

You can customize the UI by:
- Modifying the `src/app/globals.css` file for global styles
- Editing the shadcn components in `src/components/ui`
- Updating the mock data in `src/lib/mock-data.ts`

## License

This project is MIT licensed.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
