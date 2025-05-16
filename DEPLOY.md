# Deployment Guide for Vercel

This guide will walk you through deploying this banking application to Vercel and setting up the pre-generation of insights.

## Prerequisites

1. A Vercel account (free tier is sufficient)
2. An OpenAI API key
3. Git repository with your project (GitHub, GitLab, or Bitbucket)

## Step 1: Push your code to a Git repository

Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

## Step 2: Connect your repository to Vercel

1. Log in to your [Vercel dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Select the repository containing your banking app
4. Configure your project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: (leave as default) `npm run build`
   - Output Directory: (leave as default) `.next`

## Step 3: Configure environment variables

1. Expand the "Environment Variables" section
2. Add the following environment variable:
   - NAME: `OPENAI_API_KEY`
   - VALUE: Your OpenAI API key
3. Make sure this variable is available in Production, Preview, and Development environments by checking all three boxes

## Step 4: Deploy

1. Click "Deploy"
2. Wait for the deployment to complete
3. Vercel will provide you with a URL to your deployed app (e.g., `your-app-name.vercel.app`)

## Step 5: Pre-generate insights

After deployment:

1. Visit your deployed app
2. Look for the "Pre-generate Insights" button on the dashboard
3. Click the button to pre-generate insights for all user types
4. Wait for the process to complete (this may take 1-2 minutes)
5. Once finished, the insights will be stored and available to all users

## Important Notes About Vercel Deployments

### File Storage Persistence

- Vercel functions run in a serverless environment where file system writes are ephemeral
- When using the pre-generate button, insights are stored in the `/data` directory
- These insights will persist until your next deployment
- After each new deployment, you should run the pre-generation process again

### Environment Variables

- Make sure your OPENAI_API_KEY is properly set up
- You can update environment variables at any time in your Vercel project settings

### Monitoring

- You can monitor your application's logs in the Vercel dashboard
- This is useful for debugging issues with the pre-generation process

## Scaling to Production

For a production environment with many users:

1. Consider migrating from file-based storage to a database like Vercel Postgres, MongoDB Atlas, or other cloud database services
2. Implement user authentication and authorization
3. Set up proper rate limiting for the OpenAI API calls
4. Add more comprehensive error handling and retry logic 