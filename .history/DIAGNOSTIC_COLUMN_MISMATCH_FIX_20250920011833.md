# Diagnostic Column Mismatch Fix

## Additional Issue Found

After fixing the foreign key constraint, we discovered another issue: **column name mismatch** between the API code and the actual database schema.

## The Problem

- **API Code**: Trying to insert into `notes` column
- **Database Schema**: Actual column is named `description`
- **Missing Field**: Database has `priority` column that wasn't being used

## Files Fixed

### 1. `src/lib/diagnosticsApi.ts`
- Changed `notes: data.notes` to `description: data.notes`
- Added `priority: data.priority || 'medium'` to handle the priority field

### 2. `src/types/diagnostics.ts`
- Updated `DiagnosticRequest` interface:
  - Changed `notes?: string` to `description?: string`
  - Added `priority?: 'low' | 'medium' | 'high'`
- Updated `CreateDiagnosticRequestData` interface:
  - Kept `notes?: string` for backward compatibility
  - Added `priority?: 'low' | 'medium' | 'high'`

## Database Schema vs API Mapping

| Database Column | API Field | Notes |
|----------------|-----------|-------|
| `description` | `data.notes` | Mapped for backward compatibility |
| `priority` | `data.priority` | New field, defaults to 'medium' |
| `title` | `data.title` | ✅ Matches |
| `created_by` | `user.id` | ✅ Matches |
| `assigned_to` | `data.assigned_to` | ✅ Matches |

## Result

This fix ensures that:
- ✅ API calls will work with the actual database schema
- ✅ No more column mismatch errors
- ✅ Priority field is properly handled
- ✅ Backward compatibility is maintained

## Testing

After this fix, the diagnostic requests should:
1. Create successfully without column errors
2. Load properly with all fields
3. Handle priority levels correctly
4. Maintain existing functionality

The combination of the foreign key fix and this column mapping fix should completely resolve the 400 Bad Request errors.









