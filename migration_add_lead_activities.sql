-- Migración: Agregar modelo LeadActivity para historial de acciones
-- Ejecutar este script directamente en tu base de datos de PostgreSQL

-- 1. Agregar columna updatedAt a la tabla Lead si no existe
ALTER TABLE "Lead" 
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Crear tabla LeadActivity
CREATE TABLE IF NOT EXISTS "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");
CREATE INDEX IF NOT EXISTS "LeadActivity_userId_idx" ON "LeadActivity"("userId");
CREATE INDEX IF NOT EXISTS "LeadActivity_createdAt_idx" ON "LeadActivity"("createdAt");

-- 4. Agregar foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'LeadActivity_leadId_fkey'
    ) THEN
        ALTER TABLE "LeadActivity" 
        ADD CONSTRAINT "LeadActivity_leadId_fkey" 
        FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'LeadActivity_userId_fkey'
    ) THEN
        ALTER TABLE "LeadActivity" 
        ADD CONSTRAINT "LeadActivity_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. Actualizar la columna updatedAt para que se actualice automáticamente
-- Nota: PostgreSQL no tiene ON UPDATE automático, pero Prisma lo maneja
-- Esta migración solo asegura que la columna existe

-- Verificar que todo se creó correctamente
SELECT 
    'Migration completed successfully!' as status,
    (SELECT COUNT(*) FROM "LeadActivity") as activities_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Lead' AND column_name = 'updatedAt') as has_updated_at;

