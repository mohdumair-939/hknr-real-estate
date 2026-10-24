/**
 * Development seed: SYNTHETIC data only, every row flagged is_sample = true and every image
 * stamped "SAMPLE IMAGE". Refuses to run when APP_ENV=production.
 *
 *   npm run db:seed            # add sample content (idempotent: skips if samples exist)
 *   npm run db:seed -- --reset # delete existing sample rows first
 */
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import sharp from "sharp";
import { connect } from "../src/lib/db/connect";
import { localities, media, projects, properties, services } from "../src/lib/db/schema";
import { slugify } from "../src/lib/format";
import { processImage } from "../src/lib/images";
import { storage } from "../src/lib/storage";

if (process.env.APP_ENV === "production") {
  console.error("Refusing to seed: APP_ENV=production. Sample data must never reach the live site.");
  process.exit(1);
}

const { db, sql } = connect(process.env.DATABASE_URL!, { max: 1 });

const PALETTES = [
  ["#d9cfbf", "#8c7a5e"],
  ["#cfd4cc", "#6d7a6a"],
  ["#d6cdc6", "#7d6a5f"],
  ["#c9ccd1", "#5f6773"],
];

/** Draws a neutral building-silhouette placeholder clearly labelled as a sample. */
async function sampleImage(label: string, variant: number): Promise<Buffer> {
  const [bg, fg] = PALETTES[variant % PALETTES.length];
  const w = 1800;
  const h = 1350;
  const towers = Array.from({ length: 5 }, (_, i) => {
    const bw = 180 + ((i * 37 + variant * 23) % 120);
    const bh = 380 + ((i * 91 + variant * 53) % 420);
    const x = 140 + i * 320;
    return `<rect x="${x}" y="${h - 220 - bh}" width="${bw}" height="${bh}" fill="${fg}" opacity="${0.55 + (i % 3) * 0.12}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="${bg}"/>
    ${towers}
    <rect y="${h - 220}" width="${w}" height="220" fill="${fg}" opacity="0.9"/>
    <rect x="60" y="60" width="560" height="120" fill="#242522"/>
    <text x="90" y="138" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#F5F1E9" letter-spacing="6">SAMPLE IMAGE</text>
    <text x="90" y="${h - 90}" font-family="Arial, sans-serif" font-size="44" fill="#F5F1E9">${label.replace(/&/g, "&amp;").replace(/</g, "&lt;")} — development data, not a real property</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
}

async function addImages(owner: { propertyId?: string; projectId?: string }, label: string, count: number, seedIdx: number) {
  for (let i = 0; i < count; i++) {
    const id = randomUUID();
    const folder = owner.propertyId ? `properties/${owner.propertyId}` : `projects/${owner.projectId}`;
    const storageKey = `${folder}/${id}`;
    const processed = await processImage(await sampleImage(label, seedIdx + i));
    for (const v of processed.variants) await storage().put(`${storageKey}/${v.width}.webp`, v.body, "image/webp");
    await db.insert(media).values({
      id,
      propertyId: owner.propertyId ?? null,
      projectId: owner.projectId ?? null,
      storageKey,
      width: processed.width,
      height: processed.height,
      variants: processed.variants.map((v) => v.width),
      blurDataUrl: processed.blurDataUrl,
      altText: `Sample placeholder image ${i + 1} for ${label}`,
      sortOrder: i,
      byteSize: processed.byteSize,
    });
  }
}

async function main() {
  const reset = process.argv.includes("--reset");
  const existing = await db.select({ id: properties.id }).from(properties).where(eq(properties.isSample, true));
  if (existing.length && !reset) {
    console.log(`Sample data already present (${existing.length} properties). Use --reset to recreate.`);
    return;
  }
  if (reset) {
    const keys = await db
      .select({ key: media.storageKey })
      .from(media)
      .innerJoin(properties, eq(properties.id, media.propertyId))
      .where(eq(properties.isSample, true));
    await storage().deletePrefixes(keys.map((k) => k.key));
    await db.delete(properties).where(eq(properties.isSample, true));
    await db.delete(projects).where(eq(projects.isSample, true));
    await db.delete(services).where(eq(services.isSample, true));
    console.log("Removed previous sample rows.");
  }

  // Moula Ali is confirmed; the others are labelled samples until the business confirms its service area.
  const locNames = ["Moula Ali", "ECIL (sample)", "Sainikpuri (sample)", "Malkajgiri (sample)"];
  await db
    .insert(localities)
    .values(locNames.map((name, i) => ({ name, slug: slugify(name), sortOrder: i })))
    .onConflictDoNothing();
  const locs = await db.select().from(localities).where(inArray(localities.name, locNames));
  const loc = (name: string) => locs.find((l) => l.name === name)!.id;

  type P = typeof properties.$inferInsert;
  const sample: Omit<P, "slug" | "localityId">[] = [
    { title: "3 BHK independent house on 200 sq yd, east facing", type: "independent_house", priceInr: 1_35_00_000, plotArea: "200", plotAreaUnit: "sq_yd", builtUpAreaSqft: "2400", bedrooms: 3, bathrooms: 3, facing: "east", constructionStatus: "ready_to_move", totalFloors: 2, isFeatured: true, features: ["Covered car parking", "Overhead water tank", "Borewell"] },
    { title: "Residential plot, 167 sq yd, north facing", type: "plot", priceInr: 75_00_000, plotArea: "167", plotAreaUnit: "sq_yd", facing: "north", approvals: "Sample text — approval details to be entered by admin", isFeatured: true },
    { title: "2 BHK apartment, 1,150 sq ft, 3rd floor", type: "apartment", priceInr: 62_00_000, builtUpAreaSqft: "1150", carpetAreaSqft: "880", bedrooms: 2, bathrooms: 2, floorNumber: 3, totalFloors: 5, facing: "west", constructionStatus: "ready_to_move", features: ["Lift", "Power backup for common areas"] },
    { title: "Corner plot, 300 sq yd, two road frontage", type: "plot", priceInr: null, priceOnRequest: true, plotArea: "300", plotAreaUnit: "sq_yd", facing: "north_east" },
    { title: "4 BHK duplex house, 240 sq yd", type: "independent_house", priceInr: 1_95_00_000, plotArea: "240", plotAreaUnit: "sq_yd", builtUpAreaSqft: "3200", bedrooms: 4, bathrooms: 4, facing: "south", constructionStatus: "under_construction", totalFloors: 2 },
    { title: "3 BHK apartment, 1,560 sq ft, gated community", type: "apartment", priceInr: 88_50_000, builtUpAreaSqft: "1560", carpetAreaSqft: "1210", bedrooms: 3, bathrooms: 3, floorNumber: 2, totalFloors: 6, facing: "east", constructionStatus: "ready_to_move", availability: "under_offer" },
    { title: "2 BHK independent house on 120 sq yd", type: "independent_house", priceInr: 72_00_000, plotArea: "120", plotAreaUnit: "sq_yd", builtUpAreaSqft: "1300", bedrooms: 2, bathrooms: 2, facing: "west", constructionStatus: "ready_to_move", availability: "sold" },
    { title: "Residential plot, 150 sq yd, gated layout", type: "plot", priceInr: 58_00_000, plotArea: "150", plotAreaUnit: "sq_yd", facing: "east" },
  ];
  const localityCycle = ["Moula Ali", "ECIL (sample)", "Moula Ali", "Sainikpuri (sample)", "Malkajgiri (sample)", "Moula Ali", "ECIL (sample)", "Sainikpuri (sample)"];

  for (const [i, p] of sample.entries()) {
    const [row] = await db
      .insert(properties)
      .values({
        ...p,
        slug: `${slugify(p.title)}-sample-${i + 1}`,
        localityId: loc(localityCycle[i]),
        description:
          "SAMPLE LISTING for development and design review. This text, the price, the measurements and the photos are synthetic and do not describe a real property. Replace with genuine listings through the admin dashboard.",
        status: "published",
        isSample: true,
        publishedAt: new Date(Date.now() - i * 86_400_000),
      })
      .returning({ id: properties.id, reference: properties.reference });
    await addImages({ propertyId: row.id }, row.reference, i === 0 ? 5 : 3, i);
    console.log(`  property ${row.reference}`);
  }

  const projectRows = [
    { title: "Sample project — G+1 residence", type: "residential_house" as const, stage: "completed" as const, completionYear: 2025, summary: "Synthetic project record used to review the portfolio layout." },
    { title: "Sample project — G+2 home under construction", type: "residential_house" as const, stage: "ongoing" as const, summary: "Synthetic project record. Replace with HKNR's real work." },
  ];
  for (const [i, p] of projectRows.entries()) {
    const [row] = await db
      .insert(projects)
      .values({
        ...p,
        slug: `${slugify(p.title)}-${i + 1}`,
        localityId: loc("Moula Ali"),
        description: "SAMPLE PROJECT for development only. Not a real HKNR project.",
        specifications: [
          { label: "Plot", value: "Sample value" },
          { label: "Floors", value: "Sample value" },
        ],
        status: "published",
        isFeatured: true,
        isSample: true,
        publishedAt: new Date(),
      })
      .returning({ id: projects.id, reference: projects.reference });
    await addImages({ projectId: row.id }, row.reference, 3, i + 4);
    console.log(`  project ${row.reference}`);
  }

  await db.insert(services).values(
    [
      { title: "Sample service A", summary: "Placeholder service description for layout review." },
      { title: "Sample service B", summary: "Placeholder service description for layout review." },
      { title: "Sample service C", summary: "Placeholder service description for layout review." },
    ].map((s, i) => ({ ...s, slug: `sample-service-${i + 1}`, body: "", sortOrder: i, status: "published" as const, isSample: true })),
  );

  console.log("Sample data created. Every record is flagged is_sample and hidden when APP_ENV=production.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
