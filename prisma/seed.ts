import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seed...\n");

  // 1. Admin par défaut
  const adminEmail = process.env.ADMIN_EMAIL || "admin@ecom-dz.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log(`✅ Admin créé : ${admin.email} (${admin.role})`);

  // 2. Wilayas & Communes
  const dataPath = join(__dirname, "data", "wilayas-communes.json");
  const rawData = readFileSync(dataPath, "utf-8");
  const wilayas = JSON.parse(rawData);

  let wilayaCount = 0;
  let communeCount = 0;

  for (const wilaya of wilayas) {
    await prisma.wilaya.upsert({
      where: { code: wilaya.code },
      update: {
        name: wilaya.name,
        nameAr: wilaya.nameAr,
        communeCount: wilaya.communes?.length || 0,
      },
      create: {
        code: wilaya.code,
        name: wilaya.name,
        nameAr: wilaya.nameAr,
        communeCount: wilaya.communes?.length || 0,
        isActive: true,
      },
    });
    wilayaCount++;

    if (wilaya.communes) {
      for (const commune of wilaya.communes) {
        await prisma.commune.upsert({
          where: { code: commune.code },
          update: { name: commune.name, nameAr: commune.nameAr },
          create: {
            code: commune.code,
            name: commune.name,
            nameAr: commune.nameAr,
            wilayaCode: wilaya.code,
            isActive: true,
          },
        });
        communeCount++;
      }
    }
  }
  console.log(`✅ ${wilayaCount} Wilayas et ${communeCount} Communes créées`);

  // 3. Settings par défaut
  const defaultSettings = [
    {
      key: "active_theme",
      value: "NEUMORPHISM",
      type: "string",
      category: "theme",
      description: "Thème actif du storefront",
    },
    {
      key: "active_locale",
      value: "fr",
      type: "string",
      category: "general",
      description: "Langue par défaut",
    },
    {
      key: "store_name",
      value: "E-Commerce DZ",
      type: "string",
      category: "general",
      description: "Nom du magasin",
    },
    {
      key: "store_logo",
      value: "/logo.png",
      type: "string",
      category: "general",
      description: "Logo du magasin",
    },
    { key: "currency", value: "DZD", type: "string", category: "general", description: "Devise" },
    {
      key: "free_shipping_threshold",
      value: "5000",
      type: "number",
      category: "delivery",
      description: "Seuil livraison gratuite (DA)",
    },
    {
      key: "active_logistics_provider",
      value: "ecotrack",
      type: "string",
      category: "delivery",
      description: "Provider logistique actif",
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: {
        key: setting.key,
        value: setting.value,
        type: setting.type,
        category: setting.category,
        description: setting.description,
      },
    });
  }
  console.log(`✅ ${defaultSettings.length} settings par défaut créés`);

  // 4. Delivery Matrix initiale
  const allWilayas = await prisma.wilaya.findMany();
  for (const w of allWilayas) {
    await prisma.deliveryMatrix.upsert({
      where: { wilayaCode: w.code },
      update: {},
      create: {
        wilayaCode: w.code,
        wilayaName: w.name,
        homeFee: 0,
        stopDeskFee: 0,
        estimatedDays: 2,
        isActive: true,
      },
    });
  }
  console.log(`✅ Delivery Matrix initialisée pour ${allWilayas.length} Wilayas`);

  console.log("\n🎉 Seed terminé avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
