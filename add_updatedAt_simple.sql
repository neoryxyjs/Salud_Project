-- Script simplificado para agregar updatedAt desde pgAdmin
-- Copia y pega esto en el Query Tool de pgAdmin

-- Paso 1: Agregar la columna updatedAt
ALTER TABLE "Lead" 
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Paso 2: Actualizar las filas existentes (usar createdAt como valor inicial)
UPDATE "Lead" 
SET "updatedAt" = "createdAt" 
WHERE "updatedAt" IS NULL OR "updatedAt" < "createdAt";

-- Paso 3: Verificar que se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Lead' AND column_name = 'updatedAt';

-- Paso 4: Ver algunas filas para confirmar
SELECT id, name, "createdAt", "updatedAt" 
FROM "Lead" 
LIMIT 5;


