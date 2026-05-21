-- AlterTable
ALTER TABLE "Profissional" ADD COLUMN     "diasAtivos" TEXT NOT NULL DEFAULT '1,2,3,4,5',
ADD COLUMN     "horaFim" TEXT NOT NULL DEFAULT '18:00',
ADD COLUMN     "horaInicio" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN     "intervaloFim" TEXT DEFAULT '13:00',
ADD COLUMN     "intervaloInicio" TEXT DEFAULT '12:00';
