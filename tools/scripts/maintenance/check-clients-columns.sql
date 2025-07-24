-- Check what columns exist in the clients table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'clients'
ORDER BY 
    ordinal_position;