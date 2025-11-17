-- Script para agregar los nuevos campos a la tabla Lead
-- Ejecutar este script en el Query Tool de pgAdmin

-- 1. Agregar columna RUT
ALTER TABLE "Lead" 
ADD COLUMN IF NOT EXISTS "rut" TEXT;

-- 2. Agregar columna currentInsurer
ALTER TABLE "Lead" 
ADD COLUMN IF NOT EXISTS "currentInsurer" TEXT;

-- 3. Agregar columna reasons (array de texto)
ALTER TABLE "Lead" 
ADD COLUMN IF NOT EXISTS "reasons" TEXT[] DEFAULT '{}';

-- 4. Agregar columna comments
ALTER TABLE "Lead" 
ADD COLUMN IF NOT EXISTS "comments" TEXT;

-- 5. Verificar que se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Lead' 
AND column_name IN ('rut', 'currentInsurer', 'reasons', 'comments')
ORDER BY column_name;

