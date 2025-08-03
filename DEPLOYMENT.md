# Deploying Earnings App to Cloudflare Pages

## Prerequisites

1. **Cloudflare Account** - Sign up at [cloudflare.com](https://cloudflare.com)
2. **GitHub Repository** - Push your code to GitHub
3. **Node.js 18+** - For local development and build

## Deployment Steps

### 1. Connect to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** in the sidebar
3. Click **Create a project**
4. Choose **Connect to Git**
5. Select your GitHub repository

### 2. Configure Build Settings

Set the following build configuration:

- **Framework preset**: Next.js
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/` (leave empty if your Next.js app is in the root)

### 3. Environment Variables

Add the following environment variable in Cloudflare Pages settings:

- **Variable name**: `FINNHUB_API_KEY`
- **Value**: `d1qeun9r01qrh89pu1tgd1qeun9r01qrh89pu1u0`

### 4. Deploy

1. Click **Save and Deploy**
2. Cloudflare will automatically build and deploy your application
3. Your app will be available at `https://your-project-name.pages.dev`

## Important Notes

- Your app uses **Next.js API Routes** which are supported by Cloudflare Pages
- The `tech_tickers.json` file is included in your repository and will be available at runtime
- Make sure your GitHub repository is public or you have the appropriate Cloudflare plan for private repos

## Troubleshooting

### Build Issues
- Ensure all dependencies are in `package.json`
- Check that Node.js version is compatible (18+ recommended)

### API Issues
- Verify the `FINNHUB_API_KEY` environment variable is set correctly
- Check Cloudflare Pages logs for any API errors

### File Access Issues
- The `tech_tickers.json` file should be in the root directory
- Ensure the file path in `/api/tickers/route.ts` is correct

## Custom Domain (Optional)

1. In your Cloudflare Pages project settings
2. Go to **Custom domains**
3. Add your domain and follow the DNS configuration instructions 