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
- **Build command**: `npx @cloudflare/next-on-pages@1`
- **Build output directory**: `.vercel/output/static`
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

## 🔑 1. Local Development (.env.local)

Create a `.env.local` file in your project root (same level as `package.json`):

```bash
# Create the file
touch .env.local
```

Then add your **new** API key to `.env.local`:
```
FINNHUB_API_KEY=your_new_api_key_from_finnhub
```

## 🌐 2. Cloudflare Pages (Production)

1. **Go to** your Cloudflare Pages dashboard
2. **Click** on your project
3. **Go to** Settings → Environment variables
4. **Add/Update** the variable:
   - **Variable name**: `FINNHUB_API_KEY`
   - **Value**: `your_new_api_key_from_finnhub`
   - **Apply to**: Both Production and Preview environments
5. **Save** the changes

##  3. Important Steps

### First: Get a New API Key
1. **Go to Finnhub** and revoke the old exposed key
2. **Generate a new API key**
3. **Use the new key** in both places above

### Then: Test
1. **Local**: Run `npm run dev` and test your app
2. **Production**: Cloudflare will auto-deploy with the new environment variable

##  Example .env.local File

Your `.env.local` should look like this:
```
FINNHUB_API_KEY=cn1234567890abcdef1234567890abcdef
```

**Remember**: The `.env.local` file is automatically ignored by Git (thanks to your `.gitignore`), so it will never be committed to your repository.

Would you like me to help you create the `.env.local` file? 