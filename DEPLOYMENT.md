# EgyRock Deployment Guide

## GitHub Repository

✅ **Repository**: https://github.com/salehchadi/EgyRock.git
✅ **Status**: Successfully pushed to GitHub
✅ **Branch**: master

## Deployment Steps

### Option 1: Deploy via Vercel Web Interface (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Log in with your GitHub account

2. **Import Repository**
   - Click "Add New" → "Project"
   - Select the `salehchadi/EgyRock` repository from your GitHub
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Environment Variables**
   Add the following environment variables in Vercel:

   ```
   # Google Sheets Data Access Layer
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n
   GOOGLE_SHEET_ID=your_google_spreadsheet_id_here

   # NextAuth.js Configuration
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32

   # File Uploads (Receipts)
   BLOB_READ_WRITE_TOKEN=your_blob_storage_read_write_token

   # Store Settings & Defaults (Public)
   NEXT_PUBLIC_INSTAPAY_HANDLE=egyrock@instapay
   NEXT_PUBLIC_DEFAULT_LOW_STOCK_THRESHOLD=5
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your site will be live at `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (already installed)

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

   Follow the prompts to authenticate with your Vercel account

3. **Deploy**
   ```bash
   vercel
   ```
   Follow the interactive prompts to configure your deployment

## Important Notes

### Google Sheets Setup

Before deployment, you need to set up Google Sheets:

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create a new project
   - Enable Google Sheets API

2. **Create Service Account**
   - Go to IAM & Admin → Service Accounts
   - Create a service account
   - Download the JSON key file
   - Extract `client_email` and `private_key` for environment variables

3. **Create Google Sheet**
   - Create a new Google Sheet
   - Share it with your service account email (Editor access)
   - Copy the spreadsheet ID from the URL

4. **Initialize Database**
   ```bash
   npm run db:init
   npm run db:seed
   ```

### NEXTAUTH_SECRET Generation

Generate a secure secret for NextAuth:

```bash
openssl rand -base64 32
```

### File Storage for Receipts

For production, you'll need to set up file storage:

- **Option 1**: Vercel Blob Storage (recommended)
- **Option 2**: Cloudinary
- **Option 3]: AWS S3

## Post-Deployment Checklist

- [ ] Test all three locales (en, ar, fr)
- [ ] Verify RTL layout works correctly for Arabic
- [ ] Test user registration and login
- [ ] Test product browsing and cart functionality
- [ ] Verify stock status badges display correctly
- [ ] Test admin panel access (with admin role)
- [ ] Confirm Google Sheets connection works
- [ ] Test homepage hero carousel
- [ ] Verify category filtering
- [ ] Test responsive design on mobile

## Troubleshooting

### Build Errors

- Check that all dependencies are installed: `npm install`
- Verify TypeScript compilation: `npm run build`
- Check for linting errors: `npm run lint`

### Environment Variables

- Ensure all required environment variables are set in Vercel
- Verify Google Sheets credentials are correct
- Check that NEXTAUTH_SECRET is set

### Google Sheets Connection

- Verify service account has Editor access to the sheet
- Check that sheet ID is correct
- Ensure Google Sheets API is enabled in Google Cloud Console

## Current Status

- ✅ GitHub repository created and pushed
- ✅ Build passes locally
- ✅ TypeScript compilation successful
- ✅ ESLint checks passing
- ⏳ Awaiting Vercel deployment
