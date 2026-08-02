// ============================================================
// seed-universities.ts
// Seed des universités de Moscou (choix à l'inscription). Logique
// isolée de l'entrypoint CLI (src/seeder.ts), même principe que
// seed-admin.ts.
//
// Idempotent par nom : contrairement à l'admin (--refresh possible,
// un seul enregistrement jetable), une université peut déjà être
// référencée par des comptes utilisateurs (User.universityId) — pas
// de suppression/recréation ici, seulement l'ajout des entrées
// manquantes. Réexécuter le seed après une mise à jour de la liste
// ci-dessous ajoute les nouvelles universités sans toucher aux
// existantes.
//
// Liste compilée à partir de sources publiques (établissements
// d'enseignement supérieur notoires de Moscou) — à compléter/corriger
// via l'API admin (`POST /universities`) si une université manque ou
// si une dénomination officielle diffère.
// ============================================================
import { DataSource } from 'typeorm';
import { University } from '../../election/entities/university.entity';

const MOSCOW_CITY = 'Moscou';

// Dénominations en français (usage académique/diplomatique courant) pour rester
// cohérent avec le reste de l'application (portail en français, city: 'Moscou').
// Sigle d'origine conservé entre parenthèses quand il est l'identifiant usuel.
const MOSCOW_UNIVERSITIES: string[] = [
    "Université d'État de Moscou Lomonossov (MSU)",
    "Université technique d'État Bauman de Moscou",
    "Institut d'État des relations internationales de Moscou (MGIMO)",
    "Université des hautes études économiques – École supérieure d'économie (HSE)",
    "Université de l'amitié des peuples de Russie (RUDN)",
    "Université d'État linguistique de Moscou",
    'Institut de physique et de technologie de Moscou (MIPT)',
    'Université nationale de recherche nucléaire (MEPhI)',
    'Université nationale de recherche technologique MISiS',
    "Université technologique d'État de Moscou « STANKIN »",
    "Institut de l'aviation de Moscou (MAI)",
    "Institut de l'énergie de Moscou (MPEI)",
    "Université d'État de génie civil de Moscou (MGSU)",
    "Université pédagogique d'État de Moscou (MPGU)",
    "Université russe d'économie Plekhanov",
    'Université financière auprès du gouvernement de la Fédération de Russie',
    "Université d'État russe des sciences humaines (RGGU)",
    "Académie russe de l'économie nationale et de l'administration publique auprès du président de la Fédération de Russie (RANEPA)",
    'Université russe des transports (MIIT)',
    'Université polytechnique de Moscou',
    'Université municipale de Moscou (MGPU)',
    "Académie d'État de médecine vétérinaire et de biotechnologie de Moscou Skriabine (MVA)",
    "Première université d'État de médecine Sietchenov de Moscou",
    'Université nationale russe de recherche médicale Pirogov',
    "Université d'État de médecine et de médecine dentaire Evdokimov de Moscou",
    "Université agraire d'État russe – Académie agricole Timiriazev de Moscou",
    "Université d'État russe du pétrole et du gaz Goubkine",
    "Université d'État Kossyguine de Russie",
    "Université technique des télécommunications et de l'informatique de Moscou (MTUCI)",
    "Université d'État des arts graphiques Ivan Fiodorov de Moscou",
    "Institut d'État de la culture de Moscou",
    'Académie russe de musique Gnessine',
    "Conservatoire d'État Tchaïkovski de Moscou",
    'Institut russe des arts du théâtre (GITIS)',
    'Institut national de la cinématographie Guerassimov (VGIK)',
    'Institut national des beaux-arts Sourikov de Moscou',
    "Université d'État Stroganov des arts et de l'industrie de Moscou",
    'École supérieure de théâtre Boris Chtchoukine (institut Vakhtangov)',
    'École supérieure de théâtre Chtchepkine (théâtre Maly)',
    "École-studio du Théâtre d'art de Moscou (MKhAT)",
    "Académie d'État de chorégraphie de Moscou",
    "Académie russe de peinture, de sculpture et d'architecture (académie Glazounov)",
    "Université sociale d'État russe",
    "Université régionale d'État de Moscou",
    "Université d'État de psychologie et d'éducation de Moscou (MSUPE)",
    'Institut national de recherche en technologie électronique de Moscou (MIET)',
    'Université Synergie',
    'Université internationale de Moscou',
    'Université Witte de Moscou',
    'Nouvelle université russe (RosNOU)',
    'Université moderne des sciences humaines',
    "Université d'État du droit Koutafine de Moscou (MSAL)",
    "Université d'État de gestion (GUU)",
    "Université d'État Cholokhov des sciences humaines de Moscou",
    "Université d'État russe de la justice",
    "Université d'État russe de l'éducation physique, du sport, de la jeunesse et du tourisme (GTSOLIFK)",
    'Université Mendeleïev de technologie chimique de Russie',
    "Institut d'État et du droit de l'Académie des sciences de Russie",
    'Institut de littérature mondiale Gorki',
    "Institut d'État de musique Schnittke de Moscou",
    "Université technique d'État de l'aviation civile de Moscou",
    "Université d'État de production alimentaire de Moscou",
    "Université d'État russe de prospection géologique Sergo Ordjonikidze (MGRI)",
    "Université d'État de technologie et de gestion Razoumovski de Moscou (première université cosaque)",
    'Université technologique russe MIREA',
    "Université académique d'État des sciences humaines (GAUGN)",
    'Académie diplomatique du ministère des Affaires étrangères de la Fédération de Russie',
    'Académie russe du commerce extérieur',
    'Académie du travail et des relations sociales',
    'Université de finance et de droit de Moscou (MFUA)',
    "Institut Griboïedov de droit international et d'économie",
    "Académie spécialisée d'État russe des arts",
    "Université d'État d'aménagement du territoire (GUZ)",
    'Nouvelle école économique (NES)',
    'École moscovite des sciences sociales et économiques (Shaninka)',
];

export async function seedUniversities(dataSource: DataSource): Promise<void> {
    const universityRepo = dataSource.getRepository(University);

    let created = 0;
    for (const name of MOSCOW_UNIVERSITIES) {
        const existing = await universityRepo.findOne({ where: { name } });
        if (existing) continue;

        const university = universityRepo.create({ name, city: MOSCOW_CITY });
        await universityRepo.save(university);
        created++;
    }

    console.log(
        created > 0
            ? `${created} université(s) de Moscou créée(s) (${MOSCOW_UNIVERSITIES.length - created} déjà présente(s)).`
            : `Universités de Moscou déjà toutes présentes (${MOSCOW_UNIVERSITIES.length}) — seed ignoré.`,
    );
}
