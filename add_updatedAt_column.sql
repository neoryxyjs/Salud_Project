-- Script para agregar manualmente la columna updatedAt a la tabla Lead
-- Ejecutar este script directamente en tu base de datos de Railway

-- Verificar si la columna ya existe antes de agregarla
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Lead' AND column_name = 'updatedAt'
    ) THEN
        -- Agregar la columna con valor por defecto
        ALTER TABLE "Lead" 
        ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        
        -- Actualizar las filas existentes para que tengan la misma fecha que createdAt
        UPDATE "Lead" 
        SET "updatedAt" = "createdAt" 
        WHERE "updatedAt" IS NULL;
        
        RAISE NOTICE 'Columna updatedAt agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna updatedAt ya existe';
    END IF;
END $$;

-- Verificar que se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Lead' AND column_name = 'updatedAt';

