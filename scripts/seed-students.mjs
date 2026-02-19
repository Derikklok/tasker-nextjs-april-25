/**
 * Seed script — populates the /students endpoint on mockapi.io
 *
 * Batches:
 *   BSE (Bachelor of Software Engineering)  → D/BSE/23/0001 … D/BSE/23/0017
 *   BCS (Bachelor of Computer Science)       → D/BCS/23/0001 … D/BCS/23/0025
 *   BCE (Bachelor of Computer Engineering)   → D/BCE/23/0001 … D/BCE/23/0025
 *
 * Run:  npm run seed:students
 *
 * ── mockapi.io setup ────────────────────────────────────────────────────────
 *  1. Open your mockapi project at https://mockapi.io
 *  2. Add a new resource named  students
 *  3. Remove any default fields (avatar, createdAt, name …)
 *  4. Add exactly these two fields:
 *       registration   →  String
 *       batch          →  String
 *  5. Save, then re-run: npm run seed:students
 * ────────────────────────────────────────────────────────────────────────────
 */

const STUDENTS_API = "https://69968b2a7d17864365748134.mockapi.io/api/v1/students";

function pad(n, width = 4) {
  return String(n).padStart(width, "0");
}

function generateStudents() {
  const students = [];

  // BSE — 17 students
  for (let i = 1; i <= 17; i++) {
    students.push({ registration: `D/BSE/23/${pad(i)}`, batch: "BSE" });
  }

  // BCS — 25 students
  for (let i = 1; i <= 25; i++) {
    students.push({ registration: `D/BCS/23/${pad(i)}`, batch: "BCS" });
  }

  // BCE — 25 students
  for (let i = 1; i <= 25; i++) {
    students.push({ registration: `D/BCE/23/${pad(i)}`, batch: "BCE" });
  }

  // Cadets
  students.push({ registration: "D/BSE/23/6597", batch: "BSE" }); // BSE cadet
  students.push({ registration: "D/BCS/23/6730", batch: "BCS" }); // BCS cadet 1
  students.push({ registration: "D/BCS/23/6731", batch: "BCS" }); // BCS cadet 2

  return students;
}

async function checkEndpoint() {
  const res = await fetch(STUDENTS_API);
  if (res.status === 404) {
    console.error(
      "\n❌  Endpoint not found (404).\n" +
      "    Please create the 'students' resource in mockapi.io first.\n" +
      "    Required fields:\n" +
      "      registration  →  String\n" +
      "      batch         →  String\n"
    );
    process.exit(1);
  }
  if (!res.ok) {
    console.error(`\n❌  GET ${STUDENTS_API} returned HTTP ${res.status}. Check your mockapi URL.\n`);
    process.exit(1);
  }

  // Validate schema by checking the first record's fields
  const data = await res.json();
  if (data.length > 0) {
    const sample = data[0];
    if (!("registration" in sample) || !("batch" in sample)) {
      console.error(
        "\n❌  Schema mismatch. Expected fields: registration, batch\n" +
        "    Found fields: " + Object.keys(sample).join(", ") + "\n" +
        "    Please update the resource schema in mockapi.io.\n"
      );
      process.exit(1);
    }
  }

  return data;
}

async function clearExisting(existing) {
  if (existing.length === 0) return;
  console.log(`Deleting ${existing.length} existing record(s)…`);
  const BATCH_SIZE = 3;
  for (let i = 0; i < existing.length; i += BATCH_SIZE) {
    const batch = existing.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((s) =>
        fetch(`${STUDENTS_API}/${s.id}`, { method: "DELETE" }).catch((e) =>
          console.warn(`Failed to delete ${s.id}:`, e)
        )
      )
    );
    if (i + BATCH_SIZE < existing.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  // Extra gap before seeding
  await new Promise((r) => setTimeout(r, 2000));
}

async function seed() {
  console.log("Checking endpoint…");
  const existing = await checkEndpoint();
  await clearExisting(existing);

  const students = generateStudents();
  console.log(`Seeding ${students.length} students (BSE×17 + BCS×25 + BCE×25 + 3 cadets)…`);

  let success = 0;
  let failed = 0;

  // mockapi has rate limits — seed in small batches to avoid 429s
  const BATCH_SIZE = 3;
  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (student) => {
        try {
          const res = await fetch(STUDENTS_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(student),
          });
          if (!res.ok) {
            const body = await res.text();
            throw new Error(`HTTP ${res.status} — ${body}`);
          }
          success++;
          process.stdout.write(`  ✔ ${student.registration}\n`);
        } catch (e) {
          failed++;
          process.stdout.write(`  ✘ ${student.registration} — ${e.message}\n`);
        }
      })
    );
    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < students.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`\nDone! ${success} seeded, ${failed} failed.`);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
