import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PHONE_PROVIDERS = [
  {
    name: "Telenor Agrol",
    isOurOffer: false,
    plans: [
      { label: "6GB", dataGB: 6, price: 159 },
      { label: "12GB", dataGB: 12, price: 199 },
      { label: "25GB", dataGB: 25, price: 289 },
      { label: "50GB", dataGB: 50, price: 349 },
      { label: "60GB", dataGB: 60, price: 399 },
      { label: "100GB", dataGB: 100, price: 499 },
    ],
  },
  {
    name: "Telenor",
    isOurOffer: false,
    plans: [
      { label: "5GB", dataGB: 5, price: 429 },
      { label: "20GB", dataGB: 20, price: 529 },
      { label: "50GB", dataGB: 50, price: 579 },
      { label: "Fri bruk", dataGB: -1, price: 629 },
    ],
  },
  {
    name: "Telia",
    isOurOffer: false,
    plans: [
      { label: "6GB", dataGB: 6, price: 449 },
      { label: "15GB", dataGB: 15, price: 549 },
      { label: "50GB", dataGB: 50, price: 749 },
      { label: "Fri bruk", dataGB: -1, price: 749 },
    ],
  },
  {
    name: "Talkmore",
    isOurOffer: false,
    plans: [
      { label: "3GB", dataGB: 3, price: 249 },
      { label: "6GB", dataGB: 6, price: 309 },
      { label: "12GB", dataGB: 12, price: 359 },
      { label: "18GB", dataGB: 18, price: 409 },
      { label: "24GB", dataGB: 24, price: 459 },
      { label: "50GB", dataGB: 50, price: 499 },
      { label: "Fri bruk", dataGB: -1, price: 629 },
    ],
  },
  {
    name: "Unifon",
    isOurOffer: false,
    plans: [
      { label: "1GB", dataGB: 1, price: 199 },
      { label: "10GB", dataGB: 10, price: 349 },
      { label: "20GB", dataGB: 20, price: 399 },
      { label: "50GB", dataGB: 50, price: 449 },
      { label: "150GB", dataGB: 150, price: 499 },
      { label: "300GB", dataGB: 300, price: 629 },
      { label: "Fri bruk", dataGB: -1, price: 629 },
    ],
  },
  {
    name: "Phonero",
    isOurOffer: false,
    plans: [
      { label: "2GB", dataGB: 2, price: 249 },
      { label: "10GB", dataGB: 10, price: 319 },
      { label: "20GB", dataGB: 20, price: 399 },
      { label: "50GB", dataGB: 50, price: 499 },
      { label: "Fri bruk", dataGB: -1, price: 529 },
    ],
  },
  {
    name: "ICE",
    isOurOffer: false,
    plans: [
      { label: "1GB", dataGB: 1, price: 149 },
      { label: "3GB", dataGB: 3, price: 199 },
      { label: "10GB", dataGB: 10, price: 249 },
      { label: "20GB", dataGB: 20, price: 299 },
      { label: "30GB", dataGB: 30, price: 399 },
      { label: "50GB", dataGB: 50, price: 499 },
      { label: "Fri bruk", dataGB: -1, price: 549 },
    ],
  },
  {
    name: "SMB Mobil",
    isOurOffer: true,
    plans: [
      { label: "1GB", dataGB: 1, price: 159 },
      { label: "5GB", dataGB: 5, price: 239 },
      { label: "10GB", dataGB: 10, price: 299 },
      { label: "20GB", dataGB: 20, price: 359 },
      { label: "50GB", dataGB: 50, price: 399 },
      { label: "100GB", dataGB: 100, price: 479 },
      { label: "Fri bruk", dataGB: -1, price: 599 },
    ],
  },
  {
    name: "Pluss",
    isOurOffer: false,
    plans: [
      { label: "1GB", dataGB: 1, price: 99 },
      { label: "10GB", dataGB: 10, price: 198 },
      { label: "15GB", dataGB: 15, price: 248 },
      { label: "30GB", dataGB: 30, price: 298 },
      { label: "Fri bruk", dataGB: -1, price: 398 },
    ],
  },
  {
    name: "Happybytes",
    isOurOffer: false,
    plans: [
      { label: "10GB", dataGB: 10, price: 248 },
      { label: "30GB", dataGB: 30, price: 348 },
      { label: "Fri bruk", dataGB: -1, price: 448 },
    ],
  },
  {
    name: "Chili Mobil",
    isOurOffer: false,
    plans: [{ label: "Fri bruk", dataGB: -1, price: 318 }],
  },
];

// fixedAmount = fastbeløp kr/mnd, markup = påslag øre/kWh
// isOurOffer = true → Telemark Kraft (sammenligningsprovider)
const ELECTRICITY_PROVIDERS = [
  {
    name: "Å strøm",
    isOurOffer: false,
    plans: [{ name: "Bedrift", fixedAmount: 0, markup: 0 }],
  },
  {
    name: "Agva",
    isOurOffer: false,
    plans: [{ name: "Agva Spotpris Bedrift", fixedAmount: 39.2, markup: 7.92 }],
  },
  {
    name: "Dalane Energi",
    isOurOffer: false,
    plans: [{ name: "Bedrift S", fixedAmount: 0, markup: 4.8 }],
  },
  {
    name: "Eidefoss",
    isOurOffer: false,
    plans: [{ name: "Næring", fixedAmount: 15, markup: 2.99 }],
  },
  {
    name: "Eletra",
    isOurOffer: false,
    plans: [{ name: "Eletra Spot", fixedAmount: 38, markup: 1.98 }],
  },
  {
    name: "Elkraft",
    isOurOffer: false,
    plans: [{ name: "Spot", fixedAmount: 0, markup: 0 }],
  },
  {
    name: "Eneas",
    isOurOffer: false,
    plans: [{ name: "Eneas", fixedAmount: 0, markup: 0 }],
  },
  {
    name: "Finnås Kraftlag",
    isOurOffer: false,
    plans: [{ name: "Spot", fixedAmount: 25, markup: 4.9 }],
  },
  {
    name: "Fjordkraft",
    isOurOffer: false,
    plans: [
      { name: "Webspot", fixedAmount: 59, markup: 5.6 },
      { name: "Agrol", fixedAmount: 10, markup: 2.25 },
    ],
  },
  {
    name: "Fortum",
    isOurOffer: false,
    plans: [{ name: "Aktiv Bedrift", fixedAmount: 59, markup: 6.3 }],
  },
  {
    name: "Gudbrandsdal Energi",
    isOurOffer: false,
    plans: [{ name: "Spotpris Næring", fixedAmount: 39, markup: 5.9 }],
  },
  {
    name: "Haugaland Kraft",
    isOurOffer: false,
    plans: [{ name: "Næringskraft", fixedAmount: 31.2, markup: 2.9 }],
  },
  {
    name: "Helgeland Kraft",
    isOurOffer: false,
    plans: [{ name: "Fastprisordning", fixedAmount: 99, markup: 0 }],
  },
  {
    name: "Ishavskraft",
    isOurOffer: false,
    plans: [{ name: "BedriftSpot", fixedAmount: 49, markup: 6.0 }],
  },
  {
    name: "Istad Kraft",
    isOurOffer: false,
    plans: [{ name: "Istad Spot", fixedAmount: 49, markup: 7.99 }],
  },
  {
    name: "Jærkraft",
    isOurOffer: false,
    plans: [{ name: "Kun Strøm", fixedAmount: 39, markup: 0 }],
  },
  {
    name: "Kilden Kraft",
    isOurOffer: false,
    plans: [{ name: "Spot Garanti", fixedAmount: 28, markup: 3.92 }],
  },
  {
    name: "Klarkraft",
    isOurOffer: false,
    plans: [{ name: "Bedrift spotavtale", fixedAmount: 35, markup: 3.4 }],
  },
  {
    name: "Kraftriket",
    isOurOffer: false,
    plans: [{ name: "Fastpris for bedrifter", fixedAmount: 99, markup: 2.5 }],
  },
  {
    name: "Lyse",
    isOurOffer: false,
    plans: [{ name: "Lyse Spot", fixedAmount: 69, markup: 6.44 }],
  },
  {
    name: "MEF Strøm",
    isOurOffer: false,
    plans: [{ name: "MEF Strøm Spot", fixedAmount: 39, markup: 2.9 }],
  },
  {
    name: "Midt Energi",
    isOurOffer: false,
    plans: [{ name: "Spotkraft", fixedAmount: 39, markup: 8.5 }],
  },
  {
    name: "Neas Strøm",
    isOurOffer: false,
    plans: [{ name: "NEAS Næring Spot", fixedAmount: 49, markup: 5.9 }],
  },
  {
    name: "NESO",
    isOurOffer: false,
    plans: [{ name: "NESO Spot", fixedAmount: 39, markup: 2.9 }],
  },
  {
    name: "Noova Energy Systems",
    isOurOffer: false,
    plans: [{ name: "Spotprisavtale", fixedAmount: 0, markup: 3.94 }],
  },
  {
    name: "NTE",
    isOurOffer: false,
    plans: [
      { name: "Spotpris Bedrift", fixedAmount: 52, markup: 6.2 },
      { name: "Agrol", fixedAmount: 12.5, markup: 3.625 },
    ],
  },
  {
    name: "Polarkraft",
    isOurOffer: false,
    plans: [{ name: "Polar Bedrift", fixedAmount: 79, markup: 4.9 }],
  },
  {
    name: "Sodvin",
    isOurOffer: false,
    plans: [{ name: "Spotpris Bedrift", fixedAmount: 0, markup: 0 }],
  },
  {
    name: "Svorka Strøm",
    isOurOffer: false,
    plans: [{ name: "Bedrift", fixedAmount: 0, markup: 0 }],
  },
  {
    name: "Telemark Kraft",
    isOurOffer: true, // Sammenligningsprovider – vår tilbudsside
    plans: [{ name: "Spot Næring", fixedAmount: 39, markup: 2.5 }],
  },
  {
    name: "Tibber",
    isOurOffer: false,
    plans: [{ name: "Smart strømavtale", fixedAmount: 49, markup: 3.4 }],
  },
  {
    name: "Tinn Energi og Fiber",
    isOurOffer: false,
    plans: [{ name: "Tinnpris næring", fixedAmount: 29, markup: 1.52 }],
  },
  {
    name: "Trøndelag Kraft",
    isOurOffer: false,
    plans: [{ name: "Spotpris Web/bedrift", fixedAmount: 59, markup: 6.94 }],
  },
  {
    name: "Ustekveikja",
    isOurOffer: false,
    plans: [{ name: "Spot næring", fixedAmount: 49, markup: 2.74 }],
  },
  {
    name: "Vest-Telemark Kraftverk",
    isOurOffer: false,
    plans: [{ name: "VTK Spot Næring", fixedAmount: 31.2, markup: 3.0 }],
  },
  {
    name: "Vibb",
    isOurOffer: false,
    plans: [{ name: "Vibb Spot", fixedAmount: 49, markup: 0 }],
  },
  {
    name: "Voss Energi",
    isOurOffer: false,
    plans: [{ name: "Straum til Innkjøpspris", fixedAmount: 39, markup: 3.34 }],
  },
  {
    name: "Wattn",
    isOurOffer: false,
    plans: [{ name: "Spotpris bedrift", fixedAmount: 28, markup: 4.8 }],
  },
];

async function main() {
  console.log("🌱 Seeder database...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@prismatch.no" },
    update: {},
    create: {
      email: "admin@prismatch.no",
      name: "Admin Bruker",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✓ Admin:", admin.email);

  const sellerPassword = await bcrypt.hash("selger123", 12);
  const seller = await prisma.user.upsert({
    where: { email: "selger@prismatch.no" },
    update: {},
    create: {
      email: "selger@prismatch.no",
      name: "Ola Selger",
      password: sellerPassword,
      role: "SELLER",
    },
  });
  console.log("✓ Selger:", seller.email);

  const existingSavings = await prisma.savingsSettings.findFirst();
  if (!existingSavings) {
    await prisma.savingsSettings.create({
      data: { accountingPercentage: 20, insurancePercentage: 10 },
    });
    console.log("✓ Besparelsesinnstillinger (20% regnskap, 10% forsikring)");
  }

  console.log("\n📱 Seeder telefoni-leverandører...");
  for (let i = 0; i < PHONE_PROVIDERS.length; i++) {
    const p = PHONE_PROVIDERS[i];
    const existing = await prisma.phoneProvider.findFirst({ where: { name: p.name } });
    if (existing) {
      console.log(`  → ${p.name} finnes allerede, hopper over`);
      continue;
    }
    await prisma.phoneProvider.create({
      data: {
        name: p.name,
        isOurOffer: p.isOurOffer,
        sortOrder: i,
        plans: {
          create: p.plans.map((plan, j) => ({
            label: plan.label,
            dataGB: plan.dataGB,
            pricePerSub: plan.price,
            sortOrder: j,
          })),
        },
      },
    });
    console.log(`  ✓ ${p.name} (${p.plans.length} abonnementer)${p.isOurOffer ? " ← VÅR TILBUDSSIDE" : ""}`);
  }

  console.log("\n⚡ Seeder strømleverandører...");
  for (let i = 0; i < ELECTRICITY_PROVIDERS.length; i++) {
    const p = ELECTRICITY_PROVIDERS[i];
    const existing = await prisma.electricityProvider.findFirst({ where: { name: p.name } });
    if (existing) {
      console.log(`  → ${p.name} finnes allerede, hopper over`);
      continue;
    }
    await prisma.electricityProvider.create({
      data: {
        name: p.name,
        isOurOffer: p.isOurOffer,
        sortOrder: i,
        plans: {
          create: p.plans.map((plan, j) => ({
            name: plan.name,
            fixedAmount: plan.fixedAmount,
            markup: plan.markup,
            sortOrder: j,
          })),
        },
      },
    });
    console.log(`  ✓ ${p.name} (${p.plans.length} avtale${p.plans.length !== 1 ? "r" : ""})${p.isOurOffer ? " ← VÅR TILBUDSSIDE" : ""}`);
  }

  console.log("\n✅ Seeding fullført!");
  console.log("\nTestbrukere:");
  console.log("  Admin:  admin@prismatch.no  /  admin123");
  console.log("  Selger: selger@prismatch.no /  selger123");
}

main()
  .catch((e) => {
    console.error("❌ Feil under seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
