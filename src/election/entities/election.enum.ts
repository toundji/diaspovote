// ============================================================
// election.enum.ts
// Enums propres au domaine électoral.
// (Les enums d'infrastructure/auth restent dans common.enum.ts)
// ============================================================

/**
 * Cycle de vie d'une élection.
 * Vraie machine à états : chaque transition est contrôlée par le service.
 *   draft   → configuration en cours (modifiable)
 *   active  → scrutin ouvert (vote possible dans la fenêtre startsAt/endsAt)
 *   closed  → scrutin terminé (résultats calculables/publiables)
 */
export enum ElectionStatus {
    draft = 'draft',
    active = 'active',
    closed = 'closed',
}

/**
 * Niveau d'un périmètre géographique.
 *   federation → la fédération (racine, sans parent)
 *   state      → un état/oblast (ex: Moscou), rattaché à une fédération
 */
export enum JurisdictionType {
    federation = 'federation',
    state = 'state',
}

/**
 * Cible d'une condition d'éligibilité/participation.
 * Discriminant : une seule entité Condition gère les trois familles.
 */
export enum ConditionType {
    candidate = 'candidate',
    voter = 'voter',
    campaign = 'campaign',
}
