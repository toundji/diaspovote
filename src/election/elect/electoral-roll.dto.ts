// ============================================================
// electoral-roll.dto.ts
// DTOs des routes /elections/:electionId/roll/*.
// ============================================================
import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class RegisterVoterDto {
    @IsUUID()
    userId!: string;
}

export class BulkRegisterDto {
    /** Liste des userId à inscrire (import depuis la liste d'amorçage). */
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('all', { each: true, message: 'Un ou plusieurs identifiants sont invalides.' })
    userIds!: string[];
}

export interface RollStats {
    /** Taille de la liste (dénominateur du taux). */
    rollSize: number;
    /** Nombre de votes exprimés pour cette élection. */
    voted: number;
    /** Taux de participation = voted / rollSize (0 si liste vide). */
    participationRate: number;
}

export interface BulkRegisterResult {
    added: number;
    skipped: number;   // déjà inscrits
}
