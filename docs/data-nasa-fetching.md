# NASA Data Fetching

## Overview

The `fetch_exoplanets.py` script downloads confirmed exoplanet data from NASA's Exoplanet Archive API. This script is part of the data pipeline that refreshes the application's planet database.

**Location**: `data/fetch_exoplanets.py`

**Purpose**: Download the latest 6,000+ confirmed exoplanet records from NASA

## NASA Exoplanet Archive

### API Endpoint

```
https://exoplanetarchive.ipac.caltech.edu/TAP/sync
```

### What It Provides

- **6,000+ confirmed exoplanets** from multiple detection methods
- **683 data columns** per planet (including physics, orbital, discovery metadata)
- **Regularly updated** as new exoplanets are discovered and confirmed
- **Quality assured** by NASA - all data is peer-reviewed

### Data Requirements

**Connection**:
- HTTPS only
- Public API (no authentication required)
- Rate limiting: Reasonable requests (~10-100 per minute)

**Data Format**:
- TAP (Table Access Protocol) query interface
- Returns CSV format by default
- Supports other formats (JSON, VOTable, etc.)

## The Fetching Process

### Script Flow

```
1. Initialize connection to NASA API
2. Build TAP query for exoplanet table
3. Request all confirmed exoplanets with all columns
4. Download CSV response
5. Save to data/exoplanets_raw.csv
6. Log download summary (count, size, timestamp)
```

### Query Parameters

**TAP Query**:
```sql
SELECT * FROM ps_default_cumulative
WHERE koi_disposition = 'CONFIRMED'
  AND koi_score >= 0.9
ORDER BY pl_name
```

**What This Selects**:
- `ps_default_cumulative` - Current exoplanet table
- `koi_disposition = 'CONFIRMED'` - Confirmed planets only (not candidates)
- `koi_score >= 0.9` - Reliability score filter
- `ORDER BY pl_name` - Alphabetical order for consistency

### Downloaded Columns

The API returns **683 columns** per planet:

| Category | Examples | Count |
|----------|----------|-------|
| Planet Properties | radius, mass, density, surface_gravity | ~100 |
| Orbital Properties | orbital_period, semi_major_axis, eccentricity | ~80 |
| Host Star | star_radius, star_temperature, star_distance | ~120 |
| Discovery Info | discovery_year, discovery_method, publication | ~60 |
| Disposition & Flags | koi_score, controversiality_flag | ~40 |
| Astrophysics | insolation_flux, equilibrium_temperature | ~50 |
| Other | Notes, alternative names, references | ~433 |

### File Output

**Filename**: `data/exoplanets_raw.csv`

**Size**: ~5-6 MB (compressed from NASA)

**Format**:
- CSV with headers
- Comma-separated values
- Quoted values for strings containing commas
- Empty cells for missing data

**Example Rows**:
```csv
pl_name,pl_type,pl_radius,pl_mass,pl_orbper,pl_eqt,st_rad,st_teff,...
Kepler-452 b,Earth-Size,1.04,5.0,384.8,265,1.11,5757,...
51 Pegasi b,Gas Giant,1.95,0.467,4.23,1449,1.237,5794,...
```

## Script Details

### Language & Dependencies

**Language**: Python 3

**Required Libraries**:
```
requests      - HTTP client for API calls
pandas        - CSV parsing and manipulation
logging       - Console output and logging
```

### Running the Script

```bash
cd data
python fetch_exoplanets.py
```

### Output Example

```
Starting NASA Exoplanet Archive download...
Connecting to https://exoplanetarchive.ipac.caltech.edu/TAP/sync
Query: SELECT * FROM ps_default_cumulative WHERE koi_disposition = 'CONFIRMED'...

Downloaded 6,847 exoplanets
File size: 5.2 MB
Columns: 683
Timestamp: 2024-01-15 14:32:51 UTC

Success! Data saved to exoplanets_raw.csv
```

## Data Quality & Caveats

### What's Included

- ✅ Confirmed exoplanets (peer-reviewed discoveries)
- ✅ NASA official designations
- ✅ Latest orbital parameters
- ✅ Discovery metadata (year, method, publication)
- ✅ Physical properties (radius, mass, temperature)

### What's NOT Included

- ❌ Candidate planets (not yet confirmed)
- ❌ Controversial planets (reliability score < 0.9)
- ❌ Historical data (most recent measurements only)
- ❌ Binary/multiple star systems (simplified view)

### Data Completeness

Many columns have **missing values**:

```
Planet properties: ~95% complete
Orbital properties: ~85% complete
Host star properties: ~80% complete
Discovery info: ~70% complete
Exotic properties: ~20-30% complete
```

This is normal - not all planets have all measurements.

## Rate Limiting & API Courtesy

### Guidelines

- **Rate**: Keep requests to <10 per second
- **Concurrent**: Don't run multiple fetch scripts simultaneously
- **Caching**: Cache results for 24+ hours between fetches
- **User-Agent**: Include descriptive header identifying your application

### Handling Rate Limits

If rate-limited (HTTP 429):
- Wait 60 seconds
- Retry request
- Implement exponential backoff for multiple retries

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Connection timeout | Network issue or API down | Wait and retry |
| Invalid TAP query | Malformed SQL | Check query syntax |
| HTTP 429 | Rate limit exceeded | Wait 60+ seconds, retry |
| Incomplete download | Connection lost mid-transfer | Retry entire download |
| Disk full | No space for CSV file | Free up disk space |

### Robustness

Good practice:
- Retry on transient failures (timeouts, connection errors)
- Validate download (check row count is reasonable)
- Keep previous backup before overwriting
- Log all errors with timestamps

## Scheduling Regular Updates

### Automated Fetching (Optional)

The data refreshes automatically when the app starts. For regular updates:

**With cron (Linux/Mac)**:
```bash
# Run fetch every week at 2 AM Sunday
0 2 * * 0 cd /path/to/exoplanets && python fetch_exoplanets.py
```

**With Windows Task Scheduler**:
```
Task: Fetch NASA Exoplanets
Trigger: Weekly, Sunday 2:00 AM
Action: python.exe C:\path\to\fetch_exoplanets.py
```

## Post-Processing

After fetching, the data goes to the next stage:

```
exoplanets_raw.csv (683 columns)
  ↓
process_exoplanets.py
  ↓
exoplanets.csv (72 derived columns)
  ↓
public/data/exoplanets.csv (deployed with app)
```

See [Data Processing Pipeline](data-processing-pipeline.md) for details.

## API Documentation

### Full NASA Documentation

- [Exoplanet Archive Home](https://exoplanetarchive.ipac.caltech.edu/)
- [TAP Service Documentation](https://exoplanetarchive.ipac.caltech.edu/docs/TAP_services.html)
- [Data Field Descriptions](https://exoplanetarchive.ipac.caltech.edu/docs/fields.html)
- [Query Examples](https://exoplanetarchive.ipac.caltech.edu/cgi-bin/DisplayAPI)

### Alternative Tables

NASA provides multiple tables:
- `ps_default_cumulative` - Latest confirmed exoplanets (recommended)
- `ps_raw` - Raw submitted data (less refined)
- `koi_disposition` - Kepler planet candidates

## See Also

- [Data Processing Pipeline](data-processing-pipeline.md) - Next step in pipeline
- [CSV Structure & Fields](data-csv-structure.md) - Final output columns
- [System Architecture Overview](architecture-system-overview.md) - Data integration
