# Automated Marketing Setup — Complete Guide

Everything here is **100% free**. No credit card required anywhere.

The system: GitHub Actions runs daily at 7pm PKT, picks a post from 21 pre-written viral posts, and publishes to all configured platforms automatically.

---

## Step 1: Create Accounts (15 minutes total)

### 1a. Bluesky (EASIEST — Start Here)
1. Go to https://bsky.app and sign up (free, no phone needed)
2. Use handle like `royalthrone.bsky.social`
3. Fill out profile: name "Royal Throne", bio "The funniest poop tracker. Track sessions, earn XP, find poop buddies. Free & open source.", link to website
4. After signup: Settings > App Passwords > Add App Password
5. Name it "marketing-bot", copy the generated password

**Secrets to add:**
- `BLUESKY_HANDLE` = `royalthrone.bsky.social`
- `BLUESKY_PASSWORD` = (the app password you copied)

### 1b. Mastodon (EASY — Big Tech Community)
1. Go to https://mastodon.social and sign up (free)
2. Use display name "Royal Throne", username `royalthrone`
3. Fill bio, add website link, add profile pic
4. Go to: Preferences > Development > New Application
5. Name: "Marketing Bot"
6. Scopes: check `write:statuses` only
7. Click Submit, then click the app name to see your access token

**Secrets to add:**
- `MASTODON_INSTANCE` = `https://mastodon.social`
- `MASTODON_ACCESS_TOKEN` = (the token shown on app page)

### 1c. Twitter/X (Most Reach — Slightly Harder)
1. Go to https://developer.twitter.com
2. Sign up for free tier (you need a Twitter account first — create one if you don't have)
3. Create a Project > Create an App inside it
4. In app settings, set up "User authentication" with Read+Write permissions
5. Go to "Keys and tokens" tab
6. Under "Consumer Keys": copy API Key and API Secret
7. Under "Authentication Tokens": Generate Access Token and Secret

**Secrets to add:**
- `TWITTER_API_KEY` = (API Key / Consumer Key)
- `TWITTER_API_SECRET` = (API Secret / Consumer Secret)
- `TWITTER_ACCESS_TOKEN` = (Access Token)
- `TWITTER_ACCESS_SECRET` = (Access Token Secret)

---

## Step 2: Add Secrets to GitHub (2 minutes)

1. Go to: https://github.com/muhammadhamx/Your-Throne/settings/secrets/actions
2. Click **"New repository secret"** for each key
3. Paste the name and value exactly

The system auto-detects which platforms have secrets. Missing = skipped silently.

---

## Step 3: Test It (1 minute)

1. Go to: https://github.com/muhammadhamx/Your-Throne/actions
2. Click "Daily Social Media Marketing"
3. Click "Run workflow" > "Run workflow"
4. Check your social media accounts — posts should appear

---

## Step 4: Free Manual Marketing Blitz (Do This Once)

These one-time posts can go viral. Do them on day 1:

### Reddit (Biggest Free Reach)
Post to these subreddits (READ THEIR RULES FIRST):
- r/androidapps — "I built a poop tracker that matches you with someone pooping at the same time"
- r/opensource — "I built an open source poop tracker with React Native + Supabase"
- r/reactnative — "My first React Native app: a gamified poop tracker with ML predictions"
- r/SideProject — "I'm too broke for the Play Store so I'm giving my app away as an APK"
- r/IndieHackers — same angle as SideProject
- r/InternetIsBeautiful — link to the website
- r/funny — "I built an app that predicts when you'll poop and I'm too broke to put it on the Play Store"

**Tips:** Be genuine, tell your story (broke dev from Pakistan), don't be spammy. Reddit loves underdog stories.

### Hacker News
Post: "Show HN: Royal Throne – Open source poop tracker with ML predictions and real-time buddy matching"
URL: https://muhammadhamx.github.io/Your-Throne/

### Product Hunt
1. Go to https://producthunt.com and sign up (free)
2. Submit Royal Throne as a new product
3. Use your best screenshot + the website link
4. Best day to launch: Tuesday or Wednesday

### Dev.to / Hashnode (Developer Blogs)
Write a post: "I Built a Poop Tracker App With Zero Budget — Here's What Happened"
- Tell your story
- Share the tech stack
- Link to GitHub and website
- These platforms have huge reach for dev content

### Discord Servers
Join servers for: React Native, Expo, Indie Hackers, App Development
Share your project in #showcase or #projects channels

### Facebook Groups
Post in: React Native Community, Indie App Developers, Open Source Projects, Pakistani Developers

### WhatsApp
Share the website link with friends. Ask them to share it. Word of mouth is free and powerful.

---

## How the Daily Posts Work

- `marketing/posts.json` has 21 posts covering different angles
- GitHub Actions picks one per day based on day-of-year (no repeats for 21 days)
- Posts go to all configured platforms simultaneously
- Add more posts to the JSON file anytime — system auto-adapts
- Runs at 7pm PKT (2pm UTC) — peak engagement time

---

## Cost Breakdown

| Item | Cost |
|------|------|
| GitHub Actions | Free (public repo) |
| Bluesky | Free |
| Mastodon | Free |
| Twitter/X API | Free (1,500 tweets/month) |
| Reddit | Free |
| Product Hunt | Free |
| Dev.to / Hashnode | Free |
| Website hosting | Free (GitHub Pages) |
| **Total** | **$0** |
