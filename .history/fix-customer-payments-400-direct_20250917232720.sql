authUtils.ts:78 ✅ Session is valid
deviceApi.ts:273 [updateDeviceInDb] Called with: {deviceId: '6622211e-62d3-498b-bc90-5510bd3ca474', updates: {…}}
deviceApi.ts:298 [updateDeviceInDb] ✅ Valid status value: process-payments
deviceApi.ts:319 [updateDeviceInDb] Filtered updates: {brand: 'Samsung', model: 'Samsung Galaxy Note 10', status: 'process-payments', serialNumber: 'SADSADSADSADASD', issueDescription: 'sadas dasdasdas. asd as d as. sa ', …}
deviceApi.ts:387 [updateDeviceInDb] Sending update to DB: {brand: 'Samsung', model: 'Samsung Galaxy Note 10', status: 'process-payments', assigned_to: 'd1a28512-8b3a-425b-98a6-d47842b14313', serial_number: 'SADSADSADSADASD', …}
deviceApi.ts:388 [updateDeviceInDb] Device ID: 6622211e-62d3-498b-bc90-5510bd3ca474
deviceApi.ts:389 [updateDeviceInDb] Update fields count: 8
deviceApi.ts:392 [updateDeviceInDb] Checking if device exists...
deviceApi.ts:410 [updateDeviceInDb] ✅ Device exists: {id: '6622211e-62d3-498b-bc90-5510bd3ca474', brand: 'Samsung', model: 'Samsung Galaxy Note 10', status: 'repair-complete', customer_id: '1d1b5911-68a4-4567-978b-751c55238e67'}
deviceApi.ts:419 [updateDeviceInDb] Fields being updated:
deviceApi.ts:423   brand: "Samsung" → "Samsung"
deviceApi.ts:423   model: "Samsung Galaxy Note 10" → "Samsung Galaxy Note 10"
deviceApi.ts:423   status: "repair-complete" → "process-payments"
deviceApi.ts:423   assigned_to: "d1a28512-8b3a-425b-98a6-d47842b14313" → "d1a28512-8b3a-425b-98a6-d47842b14313"
deviceApi.ts:423   serial_number: "SADSADSADSADASD" → "SADSADSADSADASD"
deviceApi.ts:423   issue_description: "sadas dasdasdas. asd as d as. sa " → "sadas dasdasdas. asd as d as. sa "
deviceApi.ts:423   customer_id: "1d1b5911-68a4-4567-978b-751c55238e67" → "1d1b5911-68a4-4567-978b-751c55238e67"
deviceApi.ts:423   expected_return_date: "2025-09-17T00:00:00+00:00" → "2025-09-17T00:00:00+00:00"
deviceApi.ts:426 [updateDeviceInDb] Executing database update...
deviceApi.ts:448 [updateDeviceInDb] ✅ Database update successful!
deviceApi.ts:449 [updateDeviceInDb] Updated device data: {id: '6622211e-62d3-498b-bc90-5510bd3ca474', brand: 'Samsung', model: 'Samsung Galaxy Note 10', status: 'process-payments', updated_at: '2025-09-17T20:17:43.6064+00:00'}
@supabase_supabase-js.js?v=c01035e3:4230  PATCH https://jxhzveborezjhsmzsgbc.supabase.co/rest/v1/customer_payments?id=eq.58592684-4a48-4047-b1e7-46fd0373bcf8 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=c01035e3:4230
(anonymous) @ @supabase_supabase-js.js?v=c01035e3:4251
fulfilled @ @supabase_supabase-js.js?v=c01035e3:4203
Promise.then
step @ @supabase_supabase-js.js?v=c01035e3:4216
(anonymous) @ @supabase_supabase-js.js?v=c01035e3:4218
__awaiter6 @ @supabase_supabase-js.js?v=c01035e3:4200
(anonymous) @ @supabase_supabase-js.js?v=c01035e3:4241
then @ @supabase_supabase-js.js?v=c01035e3:90
