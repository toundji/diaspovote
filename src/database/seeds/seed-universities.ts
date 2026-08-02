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

const MOSCOW_UNIVERSITIES: string[] = [
    'Lomonosov Moscow State University',
    'Bauman Moscow State Technical University',
    'Moscow State Institute of International Relations (MGIMO University)',
    'HSE University – National Research University Higher School of Economics',
    "RUDN University – Peoples' Friendship University of Russia",
    'Moscow State Linguistic University',
    'Moscow Institute of Physics and Technology (MIPT)',
    'National Research Nuclear University MEPhI',
    'National University of Science and Technology MISIS',
    'Moscow State Technological University "STANKIN"',
    'Moscow Aviation Institute (MAI)',
    'National Research University "Moscow Power Engineering Institute" (MPEI)',
    'Moscow State University of Civil Engineering (MGSU)',
    'Moscow Pedagogical State University (MPGU)',
    'Plekhanov Russian University of Economics',
    'Financial University under the Government of the Russian Federation',
    'Russian State University for the Humanities (RGGU)',
    'Russian Presidential Academy of National Economy and Public Administration (RANEPA)',
    'Russian University of Transport (MIIT)',
    'Moscow Polytechnic University',
    'Moscow City University (MGPU)',
    'Moscow State Academy of Veterinary Medicine and Biotechnology – MVA named after K. I. Skryabin',
    'Sechenov First Moscow State Medical University',
    'Pirogov Russian National Research Medical University',
    'Moscow State University of Medicine and Dentistry named after A. I. Evdokimov',
    'Russian State Agrarian University – Moscow Timiryazev Agricultural Academy',
    'Gubkin Russian State University of Oil and Gas',
    'Kosygin State University of Russia',
    'Moscow Technical University of Communications and Informatics (MTUCI)',
    'Moscow State University of Printing Arts named after Ivan Fedorov',
    'Moscow State Institute of Culture',
    'Gnessin Russian Academy of Music',
    'Moscow State Tchaikovsky Conservatory',
    'Russian Institute of Theatre Arts (GITIS)',
    'Gerasimov Institute of Cinematography (VGIK)',
    'Surikov Moscow State Academic Art Institute',
    'Stroganov Moscow State University of Arts and Industry',
    'Boris Shchukin Higher Theatre School (Vakhtangov Theatre Institute)',
    'Shchepkin Higher Theatre School (Maly Theatre)',
    'Moscow Art Theatre School (MKhAT School-Studio)',
    'Moscow State Academy of Choreography',
    'Russian Academy of Painting, Sculpture and Architecture (Glazunov Academy)',
    'Russian State Social University',
    'Moscow State Regional University',
    'Moscow State University of Psychology and Education (MSUPE)',
    'National Research University of Electronic Technology (MIET)',
    'Synergy University',
    'Moscow International University',
    'Moscow Witte University',
    'Russian New University (RosNOU)',
    'Modern University for the Humanities',
    'Kutafin Moscow State Law University (MSAL)',
    'State University of Management (GUU)',
    'Sholokhov Moscow State University for the Humanities',
    'Russian State University of Justice',
    'Russian State University of Physical Education, Sport, Youth and Tourism (GTSOLIFK)',
    'Mendeleev University of Chemical Technology of Russia',
    'Institute of State and Law of the Russian Academy of Sciences',
    'Gorky Institute of World Literature',
    'Moscow State Institute of Music named after A. G. Schnittke',
    'Moscow State Technical University of Civil Aviation',
    'Moscow State University of Food Production',
    'Russian State Geological Prospecting University named after Sergo Ordzhonikidze (MGRI)',
    'Moscow State University of Technology and Management named after K. G. Razumovsky (First Cossack University)',
    'MIREA – Russian Technological University',
    'State Academic University for the Humanities (GAUGN)',
    'Diplomatic Academy of the Ministry of Foreign Affairs of the Russian Federation',
    'Russian Foreign Trade Academy',
    'Academy of Labour and Social Relations',
    'Moscow University of Finance and Law (MFUA)',
    'Griboyedov Institute of International Law and Economics',
    'Russian State Specialized Academy of Arts',
    'State University of Land Use Planning (GUZ)',
    'New Economic School (NES)',
    'Moscow School of Social and Economic Sciences (Shaninka)',
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
