Both datasets are from the Elexon BMRS API. No API key required. Data is scoped to fuelType=WIND and January 2024 only.

Notebooks
Two Jupyter notebooks are included in the notebooks/ directory:
forecast_error_analysis.ipynb
Analyses error characteristics of the WINDFOR forecast model: mean, median, p99 error, error variation by forecast horizon, and error by time of day.
wind_reliability.ipynb
Analyses historical actual wind generation to recommend how many MW of wind power can be reliably expected to meet electricity demand, with supporting statistical evidence.

AI Tools
Claude (Anthropic) was used to assist with building this application, specifically for scaffolding the Next.js project structure, debugging the Elexon API parameter issues, writing the seed script, and implementing the Recharts chart component. All core logic (horizon filter algorithm, SQL query design, data analysis approach in notebooks) was designed and reasoned through independently.

Notes

All timestamps are handled in UTC throughout the app. The X axis, inputs, and tooltip all display UTC times explicitly.
Forecast data from WINDFOR is hourly resolution, while actuals are every 30 minutes. Every :30 slot will have no forecast match. This is expected and reflected in the "Missing forecast" stat.
The date inputs are locked to January 2024 since that is the only month seeded in the database.
