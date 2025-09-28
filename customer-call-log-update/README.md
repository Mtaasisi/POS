# Customer Call Log Update

This folder contains all files needed to update customers with call analytics data from the call log.

## Files Overview

### Main Files
- `add-call-analytics-columns.sql` - Add call analytics columns to database
- `run-complete-update.sql` - Check results after running chunks
- `update-all-customers-complete.sql` - Complete update (too large for SQL Editor)
- `update-all-customers-from-call-log.js` - JavaScript generator

### Chunk Files (12 files)
- `update-customers-chunk-1.sql` (999 customers)
- `update-customers-chunk-2.sql` (999 customers)
- `update-customers-chunk-3.sql` (999 customers)
- `update-customers-chunk-4.sql` (1,000 customers)
- `update-customers-chunk-5.sql` (1,000 customers)
- `update-customers-chunk-6.sql` (1,000 customers)
- `update-customers-chunk-7.sql` (1,000 customers)
- `update-customers-chunk-8.sql` (999 customers)
- `update-customers-chunk-9.sql` (1,000 customers)
- `update-customers-chunk-10.sql` (1,000 customers)
- `update-customers-chunk-11.sql` (1,000 customers)
- `update-customers-chunk-12.sql` (161 customers)

### Documentation
- `CALL_ANALYTICS_UI_UPDATE.md` - UI updates for call analytics
- `CHUNKED_UPDATE_INSTRUCTIONS.md` - Instructions for running chunks
- `call-log-update-instructions.md` - General update instructions

## How to Use

1. **First, run:** `add-call-analytics-columns.sql` (if not already done)
2. **Then run chunks in order:** `update-customers-chunk-1.sql` through `update-customers-chunk-12.sql`
3. **Finally, check results:** `run-complete-update.sql`

## What You'll Get

- **11,156 customers** updated with call analytics
- **Loyalty levels** (VIP, Gold, Silver, Bronze, Basic, New)
- **Call insights** in your customer details UI
- **Complete call history** and patterns

## Notes

- All chunk files have been syntax-checked and are ready to run
- Use Supabase SQL Editor to run the SQL files
- The JavaScript file is for reference/generation purposes
