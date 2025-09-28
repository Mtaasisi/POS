-- Corrected script to update customers with names and locations from CSV data
-- This handles phone number format conversion (+255 vs local format)

-- Create temporary table with CSV data
CREATE TEMP TABLE temp_customer_data AS
WITH cleaned_data AS (
    SELECT DISTINCT
        -- Convert names to proper case (Title Case)
        INITCAP(TRIM(NAME)) as name,
        -- Ensure phone numbers start with 255
        CASE 
            WHEN TRIM(CONTACT) LIKE '255%' THEN TRIM(CONTACT)
            WHEN TRIM(CONTACT) LIKE '+255%' THEN SUBSTRING(TRIM(CONTACT), 2)
            WHEN LENGTH(TRIM(CONTACT)) = 9 THEN '255' || TRIM(CONTACT)
            ELSE '255' || TRIM(CONTACT)
        END as phone,
        -- Convert locations to proper case
        INITCAP(TRIM(LOCATION)) as location
    FROM (
        VALUES 
        ('ABDALLAH', '688230688', 'MTO WA MBU'),
        ('JOHN', '769347422', 'SHINYANGA'),
        ('EVANCE', '785535337', 'ARUSHA'),
        ('SALUMU', '760539329', 'TUNDURU'),
        ('ERICK', '624776659', 'NG''OMBE'),
        ('ZEBRON', '769670001', 'DODOMA'),
        ('ABISHANGI', '763944640', 'LUSHOTO'),
        ('NICKSON', '764751170', 'DODOMA'),
        ('ABYUDI', '753287802', 'KATORO'),
        ('LENY', '697444765', 'NGARA'),
        ('EMMANUEL', '743565252', 'ARUSHA'),
        ('ISAC', '757457873', 'MAFINGA'),
        ('ERICK', '714989845', 'KOROGWE'),
        ('ADOLF', '719830922', 'DODOMA'),
        ('ZAID', '659275372', 'MBEYA'),
        ('ALFA', '659626099', 'SINGIDA'),
        ('BRITISH', '714640509', 'MOSHI'),
        ('CHARLES', '620778903', 'TANGA'),
        ('IMELDA', '748389926', 'BUKOBA'),
        ('VICTOR', '739408217', 'MBEYA'),
        ('RASHID', '713736436', 'DODOMA'),
        ('CHRISTOPHER', '676282935', 'DODOMA'),
        ('ENGELBERT', '788534589', 'NAMTUMBO'),
        ('SUNDAY', '717415976', 'SHINYANGA'),
        ('NGONACHI', '621018229', 'ARUSHA'),
        ('DIDI BORA', '653389985', 'MWANZA'),
        ('MASHAURI', '744189519', 'KAHAMA'),
        ('VICTORIA', '658189897', 'KYELA'),
        ('WILHED', '752910019', 'MBEYA'),
        ('MFANGANO', '657119999', 'ARUSHA'),
        ('ALLY', '788840048', 'ARUSHA'),
        ('MOHAMED', '717710295', 'MOSHI'),
        ('ROMANUS', '757457873', 'MAFINGA'),
        ('SEBASTIAN', '713279601', 'MTWARA'),
        ('MOHAMED', '719710295', 'MOSHI'),
        ('JONATHAN', '685251201', 'ARUSHA'),
        ('YUSUPH', '685719209', 'DODOMA'),
        ('MASHAURI', '657055505', 'KAHAMA'),
        ('RIOTECH', '620804419', 'MWANZA'),
        ('TEDDY', '658960293', 'DODOMA'),
        ('FAHEEM', '781747780', 'MWANZA'),
        ('KELVIN', '620255967', 'MBEYA'),
        ('AMIRI', '752323123', 'ARUSHA'),
        ('GEORGE', '710987109', 'TABORA'),
        ('YUSUPH', '766735540', 'ARUSHA'),
        ('FRANK', '763403949', 'KAHAMA'),
        ('DAUSON', '769911751', 'KIGOMA'),
        ('SAMWEL', '756568653', 'MPANDA'),
        ('HUSSEIN', '685468465', 'ARUSHA'),
        ('ALLEN', '693748430', 'MOROGORO'),
        ('MALKO', '788780984', 'ARUSHA'),
        ('SOSPETER', '621125578', 'KILOSA'),
        ('ANDREW', '753967055', 'MWANZA'),
        ('BENT', '756516426', 'MAFINGA'),
        ('ISMAIL', '713730790', 'KAHAMA'),
        ('JONAS', '766816168', 'TABORA'),
        ('GIVEN', '696528326', 'LINDI'),
        ('KISSAH', '678740784', 'MKATA'),
        ('WANDA', '746176413', 'KILIMANJARO'),
        ('JOSEPHINE', '753737211', 'BUKOBA'),
        ('BENJAMIN', '785180450', 'ARUSHA'),
        ('EDDY', '756087781', 'MWANZA'),
        ('EDWARD', '753454133', 'MWANZA'),
        ('BARIKI', '765759306', 'IRINGA'),
        ('SHABANI', '716927953', 'KAHAMA'),
        ('NAH', '629120897', 'DODOMA'),
        ('ELIPHIUS', '767995965', 'MOSHI'),
        ('MARIAM', '679926979', 'DODOMA'),
        ('KEVIN', '766914260', 'MBEYA'),
        ('NYIRCA', '657392339', 'SONGEA'),
        ('LITI', '656604564', 'DODOMA'),
        ('DESPERY', '757470016', 'ARUSHA'),
        ('EMMANUEL', '750439045', 'ARUSHA'),
        ('FRANK', '679850958', 'ARUSHA'),
        ('DANIEL', '752897974', 'MUSOMA'),
        ('SHURAHIMU', '788257820', 'ARUSHA'),
        ('MARCO', '676980188', 'MPANDA'),
        ('FABIAN', '772919064', 'IRINGA'),
        ('MOHAMED', '627089529', 'MOROGORO'),
        ('CORNEL', '764933289', 'GEITA'),
        ('MUSTAFA', '787500268', 'MBEYA'),
        ('ELIAS', '677005698', 'DODOMA'),
        ('JASMINE', '718088882', 'MWANZA'),
        ('DIAM', '625656861', 'DODOMA'),
        ('MAHMOUD', '659141590', 'ARUSHA'),
        ('ABAS', '763551126', 'SINGIDA'),
        ('BEN', '754696474', 'ARUSHA'),
        ('FLAVIANA', '622924259', 'MAFINGA'),
        ('ERICK', '653525451', 'MAHENGE'),
        ('ASIA', '763229259', 'GEITA'),
        ('ABUU', '719213000', 'IGAWA'),
        ('JAPHET', '758230935', 'DODOMA'),
        ('FRANCIS', '758300170', 'DODOMA'),
        ('ABRAHAM', '716353353', 'MASASI'),
        ('OBED', '716429949', 'TARIME'),
        ('EDSON', '744843378', 'ARUSHA'),
        ('BILALI', '784006811', 'ARUSHA'),
        ('BARAKA', '620121629', 'MAKAMBAKO'),
        ('ERICK', '784915523', 'CHUNYA'),
        ('ANNA', '7153553436', 'MWANZA'),
        ('IBRAHIM', '766862825', 'MWANZA'),
        ('AKBAR', '783150130', 'MULEBA'),
        ('NSAJIGWA', '627653251', 'MISUNGWI'),
        ('GODFREY', '717412866', 'KATAVI'),
        ('AGREY', '676889159', 'KABUKU'),
        ('HUSSEIN', '628025001', 'KILWA MASOKO'),
        ('ATHUMAN', '654530309', 'ARUSHA'),
        ('HIDRA', '759536264', 'DODOMA'),
        ('RENNY', '673902524', 'DODOMA'),
        ('FRANK', '659128489', 'DODOMA'),
        ('SALEH', '687733630', 'TUNDURU'),
        ('LIGHT', '769525520', 'ARUSHA'),
        ('EMMANUEL', '753207909', 'ARUSHA'),
        ('PETER', '629292491', 'MOROGORO'),
        ('SAID', '696292748', 'TUNDURU'),
        ('FRANK', '757949783', 'MWANZA'),
        ('HARUNA', '746200715', 'TARIME'),
        ('ASIA', '763229259', 'KATORO'),
        ('BARNABA', '745212690', 'BARIADI'),
        ('DAVID', '672786786', 'MWANZA'),
        ('RIOTECH', '744634082', 'MWANZA'),
        ('YAZID', '679941479', 'ARUSHA'),
        ('ANNY', '678123452', 'ARUSHA'),
        ('EDMUND', '763838231', 'DODOMA'),
        ('EMMANUEL', '693324565', 'ARUSHA'),
        ('VENUS', '682187150', 'KASUMULO'),
        ('EMMANUEL', '755029239', 'MWANZA'),
        ('LILIAN', '652110162', 'MOROGORO'),
        ('ERICK', '758145523', 'MBEYA'),
        ('NKAMI', '679070727', 'SHINYANGA'),
        ('DEVIS', '742818493', 'ARUSHA'),
        ('REGAN', '688210460', 'ARUSHA'),
        ('AUGUSTINO', '762597731', 'KOROGWE'),
        ('GEOFREY', '713369270', 'MOROGORO'),
        ('HILLARY', '719591061', 'DODOMA'),
        ('FREDRICK', '620118447', 'BABATI'),
        ('IBRAHIM', '752482024', 'DODOMA'),
        ('PROSPER', '621260345', 'MAKAMBAKO'),
        ('ANOD', '752818239', 'DODOMA'),
        ('YUSUPH', '615839760', 'GEITA'),
        ('DIBOY', '756603054', 'NJOMBE'),
        ('HERY', '743290440', 'MAFINGA'),
        ('KARIM', '629752875', 'DODOMA'),
        ('MBOY', '769219458', 'CHUNYA'),
        ('BONIFACE', '782895119', 'ARUSHA'),
        ('INOCENT', '716475281', 'MWANZA'),
        ('MARIAM', '757085900', 'MOSHI'),
        ('GOODLUCK', '763304342', 'ARUSHA'),
        ('VALENTINO', '746713904', 'NAMTUMBO'),
        ('LAMECK', '659911000', 'MWANZA'),
        ('HILLARY', '719581061', 'DODOMA'),
        ('COLNEL', '764933289', 'GEITA'),
        ('VICENT', '656099434', 'DODOMA'),
        ('ABDALLAH', '673062329', 'ARUSHA'),
        ('BRYTON', '712222224', 'MBEYA'),
        ('BONIFACE', '752758021', 'UYOLE'),
        ('BEATUS', '762109049', 'SKONGE'),
        ('RAPHAEL', '763548854', 'ARUSHA'),
        ('DAVID', '743582242', 'DODOMA'),
        ('RAMADHAN', '717306086', 'MOROGORO'),
        ('KARIM', '653270683', 'DODOMA'),
        ('SAMWEL', '746605561', 'MBEYA'),
        ('CAMILA', '716366738', 'TANGA'),
        ('PRICE', '673793774', 'IFAKARA'),
        ('ILAZO', '752981197', 'DODOMA'),
        ('EDEN', '712378420', 'ARUSHA'),
        ('JOHN', '756989563', 'TUNDUMA'),
        ('DILLON', '717378420', 'ARUSHA'),
        ('VICK', '755029239', 'MWANZA'),
        ('VICTORIA', '755029239', 'MWANZA'),
        ('USED', '6862414415', 'ARUSHA'),
        ('TUMPALE', '657359009', 'MWANZA'),
        ('SHAX', '623574091', 'INYONGA'),
        ('JAMES', '766970228', 'KAHAMA'),
        ('GABRIEL', '694038828', 'IRINGA'),
        ('MGONJA', '621087947', 'ARUSHA'),
        ('ELIA', '718296860', 'ARUSHA'),
        ('JOHN', '682777433', 'MBEYA'),
        ('KHADIJA', '700163638', 'KENYA'),
        ('EMMANUEL', '654237923', 'ARUSHA'),
        ('IBRAHIM', '716353353', 'LINDI'),
        ('WILLIAM', '768316830', 'MOSHI'),
        ('JAMES', '629270470', 'KAHAMA'),
        ('GODWIN', '755815041', 'NYAKANAZI'),
        ('MATHEW', '654109800', 'RUANGWA'),
        ('GEORGE', '767795968', 'ROMBO'),
        ('COMANDO', '627766004', 'TANGA'),
        ('GODFREY', '695027965', 'ARUSHA'),
        ('GODFREY', '786641244', 'ARUSHA'),
        ('MANASE', '620581001', 'MOROGORO'),
        ('FREDRICK', '676535134', 'MPANDA'),
        ('DANILO', '769998472', 'ARUSHA'),
        ('YUSUPH', '675100753', 'SUMBAWANGA'),
        ('LETICIA', '743612338', 'ARUSHA'),
        ('DANIEL', '7675654416', 'DODOMA'),
        ('ADYUDI', '753287802', 'KATORO'),
        ('KAROLINE', '752134707', 'MOSHI'),
        ('FRANK', '757055985', 'SAME'),
        ('JESCA', '626217709', 'TARIME'),
        ('LUKIKO', '714576718', 'DODOMA'),
        ('EZEKEL', '714327364', 'DODOMA'),
        ('GILBERT', '717217520', 'ARUSHA'),
        ('FADHILI', '716508450', 'DODOMA'),
        ('RIOTECH', '620804419', 'MWANZA'),
        ('SUZANA', '766258362', 'SHINYANGA'),
        ('SADAKALAWE', '768596006', 'ARUSHA'),
        ('MLEMETA', '756500622', 'DODOMA'),
        ('FADHILI', '716508450', 'DODOMA'),
        ('REBECCA', '628553056', 'SHINYANGA'),
        ('FORTUNATUS', '782571468', 'MBEYA'),
        ('EMMANUEL', '755029239', 'MWANZA'),
        ('WILFRED', '687050006', 'ARUSHA'),
        ('MARIAM', '762929143', 'MWANZA'),
        ('GEORGE', '710633221', 'ARUSHA'),
        ('ANASTAZIA', '620445695', 'MALINYI')
    ) AS csv_data(NAME, CONTACT, LOCATION)
    WHERE TRIM(CONTACT) != '' AND TRIM(CONTACT) IS NOT NULL
)
SELECT 
    name,
    phone,
    location,
    -- For duplicate phones, merge by taking the most complete data
    ROW_NUMBER() OVER (
        PARTITION BY phone 
        ORDER BY 
            CASE WHEN name != '' AND name IS NOT NULL THEN 1 ELSE 2 END,
            CASE WHEN location != '' AND location IS NOT NULL THEN 1 ELSE 2 END,
            name
    ) as rn
FROM cleaned_data;

-- Show summary of what we're about to update
SELECT 
    'Summary of update operation:' as info,
    COUNT(*) as total_csv_records,
    COUNT(DISTINCT phone) as unique_csv_phones
FROM temp_customer_data;

-- Show customers that will be updated (matching by phone number)
SELECT 
    'Customers that will be updated:' as info,
    c.id,
    c.name as current_name,
    c.phone as current_phone,
    c.city as current_city,
    t.name as new_name,
    t.phone as new_phone,
    t.location as new_location
FROM customers c
INNER JOIN temp_customer_data t ON c.phone = t.phone
WHERE t.rn = 1  -- Only take the first record for each phone number
ORDER BY c.name;

-- Update existing customers with new names and locations
-- Now both database and CSV phones are in 255 format
UPDATE customers 
SET 
    name = COALESCE(t.name, customers.name),
    city = COALESCE(t.location, customers.city),
    phone = COALESCE(t.phone, customers.phone), -- Update phone to ensure 255 format
    updated_at = NOW()
FROM temp_customer_data t
WHERE customers.phone = t.phone
    AND t.rn = 1  -- Only update with the first record for each phone number
    AND (
        customers.name != t.name OR 
        customers.city != t.location OR
        customers.city IS NULL OR
        customers.name = '__' OR
        customers.name IS NULL
    );

-- Show the results of the update
SELECT 
    'Update completed. Results:' as info,
    COUNT(*) as customers_updated
FROM customers c
INNER JOIN temp_customer_data t ON c.phone = t.phone
WHERE t.rn = 1;

-- Show some examples of updated customers
SELECT 
    'Sample of updated customers:' as info,
    c.id,
    c.name,
    c.phone,
    c.city,
    c.updated_at
FROM customers c
INNER JOIN temp_customer_data t ON c.phone = t.phone
WHERE t.rn = 1
ORDER BY c.updated_at DESC
LIMIT 10;

-- Clean up
DROP TABLE temp_customer_data;
