# UK Wind Power Forecast Monitor

This app shows how accurate UK wind power forecasts are compared to what actually happened. Pick a time range and a forecast horizon, and it plots the real generation vs what the model predicted.

🔗 **Live app:** https://reint-wind-app.onrender.com

---

## How to run it

**What you need before starting:**

- Node.js 18+
- A free [Neon](https://neon.tech) account for the database

**Step 1 — Clone the repo**

```bash
git clone https://github.com/ahs1995/reint-wind-app.git
cd reint-wind-app
```

**Step 2 — Install packages**

```bash
npm install
```

**Step 3 — Add your database URL**

Create a file called `.env.local` in the root folder and paste this in:

```bash
DATABASE_URL="your-neon-connection-string-here"
```

You get this string from the Neon dashboard after creating a project.

**Step 4 — Create the tables**

```bash
npx tsx scripts/setup-db.ts
```

**Step 5 — Fill the database with data**

```bash
npx tsx scripts/seed.ts
```

This pulls January 2024 wind data from the Elexon API and saves it to your database. Takes about 5-10 minutes.

**Step 6 — Start the app**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## What's in the project

```
reint-wind-app/
│
├── 📁 app/
│   ├── page.tsx                        # the main dashboard page
│   └── api/chart-data/route.ts         # backend endpoint, runs the horizon filter query
│
├── 📁 components/
│   ├── WindChart.tsx                   # the dual line chart (actual vs forecast)
│   └── TimeRangeInputs.tsx             # start time and end time inputs
│
├── 📁 lib/
│   ├── db.ts                           # connects to Neon postgres
│   └── forecast.ts                     # the core SQL query that filters forecasts by horizon
│
├── 📁 scripts/
│   ├── setup-db.ts                     # creates the tables and indexes
│   ├── seed.ts                         # fetches data from Elexon and loads it into the DB
│   └── check-shape.ts                  # helper used to inspect the Elexon API response format
│
├── 📁 notebooks/
│   ├── forecast_error_analysis.ipynb   # notebook 1: how accurate are the forecasts?
│   └── wind_reliability.ipynb          # notebook 2: how much wind can we reliably count on?
│
├── .env.local                          # your secret DB connection string (not committed)
└── README.md
```

---

## Analysis notebooks

Two Jupyter notebooks are in the `notebooks/` folder.

📓 **forecast_error_analysis.ipynb**
Looks at how wrong the forecast model is. Covers mean, median and p99 error, how accuracy changes with forecast horizon, and which hours of the day have the worst errors.

📓 **wind_reliability.ipynb**
Looks at actual wind generation to answer: how many MW can a grid operator reliably count on from wind? Makes a recommendation backed by percentile analysis and daily minimum data.

**To run the notebooks:**

```bash
pip install jupyter pandas numpy matplotlib seaborn sqlalchemy==1.4.46 psycopg2-binary python-dotenv
cd notebooks
jupyter notebook
```

---

## Data

Both datasets come from the [Elexon BMRS API](https://bmrs.elexon.co.uk). No API key needed.

| Dataset   | What it contains                                  |
| --------- | ------------------------------------------------- |
| `FUELHH`  | Actual wind generation every 30 minutes           |
| `WINDFOR` | Wind generation forecasts with publish timestamps |

Data is scoped to January 2024 only.

---

## A few things worth knowing

> ⏰ All times are in UTC everywhere in the app, including the inputs, chart axis, and tooltip.

> 📊 Forecasts are hourly but actuals are every 30 minutes, so every `:30` slot will show no forecast. This is expected and shows up in the "Missing forecast" count.

> 📅 The date inputs are locked to January 2024 since that is the only data in the database.

---

## AI tools used

Claude (Anthropic) was used to help build this app, specifically for setting up the Next.js project, figuring out the correct Elexon API parameters, writing the seed script, and building the chart component. The core logic including the horizon filter algorithm, the SQL query design, and all the analysis and reasoning in the notebooks was done independently.
