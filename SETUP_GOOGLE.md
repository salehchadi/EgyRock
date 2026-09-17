# EgyRock — Google Sheets Setup Guide

This guide gets your database running in **~5 minutes**. The only manual steps are clicking through Google's UI once to create a service account. After that, one command does everything.

---

## Step 1 — Enable Google APIs (2 minutes)

1. Go to: **https://console.cloud.google.com/**
2. Click **"Select a project"** → **"New Project"** → Name it `egyrock` → **Create**
3. In the left sidebar go to **"APIs & Services"** → **"Enable APIs and Services"**
4. Search for and **enable** these two APIs:
   - ✅ **Google Sheets API**
   - ✅ **Google Drive API**

---

## Step 2 — Create a Service Account & Download Key (2 minutes)

1. In the left sidebar go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"Service account"**
3. Name: `egyrock-service-account` → Click **"Done"** (skip optional steps)
4. Click on the service account you just created (it appears in the list)
5. Go to the **"Keys"** tab → **"Add Key"** → **"Create new key"**
6. Choose **JSON** → **Create**
7. A `.json` file downloads automatically — **save it somewhere you know** (e.g. `~/Downloads/egyrock-key.json`)

---

## Step 3 — Run the Setup Script (30 seconds)

Open a terminal in your project folder and run:

```bash
npm run setup:google ~/Downloads/egyrock-key.json
```

> Replace `~/Downloads/egyrock-key.json` with the actual path to your downloaded file.

**That's it.** The script automatically:

- Creates a new Google Sheet named "EgyRock Database"
- Sets up all 7 tabs with proper headers (Products, Categories, Orders, Users, etc.)
- Seeds sample data (4 products, categories, admin user, homepage images)
- Writes your `.env.local` file with all the correct values

---

## Step 4 — Add Env Vars to Vercel (for production)

After running the script, your `.env.local` will contain all values. Copy them to your Vercel dashboard:

**Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these (copy values from your `.env.local`):

| Variable                                  | Value                         |
| ----------------------------------------- | ----------------------------- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`            | from `.env.local`             |
| `GOOGLE_PRIVATE_KEY`                      | from `.env.local`             |
| `GOOGLE_SHEET_ID`                         | from `.env.local`             |
| `NEXTAUTH_SECRET`                         | from `.env.local`             |
| `NEXTAUTH_URL`                            | `https://egy-rock.vercel.app` |
| `NEXT_PUBLIC_INSTAPAY_HANDLE`             | `egyrock@instapay`            |
| `NEXT_PUBLIC_DEFAULT_LOW_STOCK_THRESHOLD` | `5`                           |

Then trigger a new deployment on Vercel.

---

## Default Admin Credentials

After seeding:

- **Email**: `admin@egyrock.com`
- **Password**: `admin123`
