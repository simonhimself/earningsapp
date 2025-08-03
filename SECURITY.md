# Security Checklist

## ✅ Environment Variables
- [ ] Never commit API keys to Git
- [ ] Use `.env.local` for local development
- [ ] Set environment variables in production (Cloudflare Pages)
- [ ] No hardcoded API keys in code

## ✅ Before Committing
- [ ] Check `git diff` for API keys
- [ ] Ensure `.env.local` is in `.gitignore`
- [ ] Verify no secrets in commit message

## ✅ API Key Management
- [ ] Use different API keys for dev/prod
- [ ] Rotate API keys regularly
- [ ] Monitor API usage for abuse

## ✅ If API Key is Exposed
1. **IMMEDIATELY** revoke the key
2. Generate a new key
3. Update all environment variables
4. Consider cleaning Git history (if critical)

## ✅ Current Setup
- ✅ `.gitignore` excludes `.env*` files
- ✅ API routes use `process.env.FINNHUB_API_KEY`
- ✅ No hardcoded fallbacks
- ✅ Error handling for missing API key 