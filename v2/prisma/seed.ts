import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seed v2...\n");

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

  // Purge des wilayas obsolètes : le JSON ne contient que les 58 wilayas
  // réelles (codes 01→58). Un seed précédent a pu insérer des codes 59-69
  // qui ne sont plus valides. On supprime d'abord les communes associées
  // (la relation Commune → Wilaya n'a PAS onDelete: Cascade dans le schéma),
  // puis les wilayas dont le code n'est pas dans la liste valide.
  const validCodes = wilayas.map((w: { code: string }) => parseInt(w.code, 10));
  const staleWilayas = await prisma.wilaya.findMany({
    where: { code: { notIn: validCodes } },
    select: { code: true },
  });
  if (staleWilayas.length > 0) {
    const staleCodes = staleWilayas.map((w) => w.code);
    await prisma.commune.deleteMany({ where: { wilayaCode: { in: staleCodes } } });
    const deleted = await prisma.wilaya.deleteMany({ where: { code: { in: staleCodes } } });
    console.log(`🧹 Purge de ${deleted.count} wilaya(s) obsolète(s) (codes ${staleCodes.join(", ")})`);
  }

  for (const wilaya of wilayas) {
    // v2 : Wilaya.code et Commune.wilayaCode sont des Int — le JSON stocke
    // les codes en string ("01", "01001"), on convertit donc en entier.
    const wilayaCode = parseInt(wilaya.code, 10);

    await prisma.wilaya.upsert({
      where: { code: wilayaCode },
      update: { name: wilaya.name, nameAr: wilaya.nameAr },
      create: { code: wilayaCode, name: wilaya.name, nameAr: wilaya.nameAr },
    });
    wilayaCount++;

    if (wilaya.communes) {
      for (const commune of wilaya.communes) {
        await prisma.commune.upsert({
          where: { code: commune.code },
          update: { name: commune.name, nameAr: commune.nameAr, wilayaCode },
          create: {
            code: commune.code,
            name: commune.name,
            nameAr: commune.nameAr,
            wilayaCode,
          },
        });
        communeCount++;
      }
    }
  }
  console.log(`✅ ${wilayaCount} Wilayas et ${communeCount} Communes créées`);

  // 3. Settings par défaut
  // NB: les clés doivent être en camelCase pour correspondre à ce que
  // l'app attend (SettingsForm, ThemeCustomizer, THEME_CSS_MAP du layout).
  const defaultSettings = [
    { key: "storeName", value: "E-Commerce DZ", category: "general" },
    { key: "store_logo", value: "/logo.png", category: "general" },
    { key: "currency", value: "DZD", category: "general" },
    { key: "active_locale", value: "fr", category: "general" },
    { key: "free_shipping_threshold", value: "5000", category: "delivery" },
    { key: "accent", value: "#6366f1", category: "theme" },
    { key: "accentHover", value: "#4f46e5", category: "theme" },
    { key: "bgPrimary", value: "#f5f5f7", category: "theme" },
    { key: "bgSecondary", value: "#ffffff", category: "theme" },
    { key: "textPrimary", value: "#1a1a2e", category: "theme" },
    { key: "textSecondary", value: "#4a4a6a", category: "theme" },
    { key: "border", value: "#e5e5ea", category: "theme" },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value, category: setting.category },
    });
  }
  console.log(`✅ ${defaultSettings.length} settings par défaut créés`);

  // 4. Delivery Matrix initiale
  const allWilayas = await prisma.wilaya.findMany();
  // Purge des entrées DeliveryMatrix pour des wilayas qui n'existent plus
  // (le modèle DeliveryMatrix n'a pas de FK vers Wilaya, donc pas de cascade).
  const validWilayaCodes = allWilayas.map((w) => w.code);
  const staleMatrix = await prisma.deliveryMatrix.deleteMany({
    where: { wilayaCode: { notIn: validWilayaCodes } },
  });
  if (staleMatrix.count > 0) {
    console.log(`🧹 Purge de ${staleMatrix.count} entrée(s) DeliveryMatrix obsolète(s)`);
  }
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
      },
    });
  }
  console.log(`✅ Delivery Matrix initialisée pour ${allWilayas.length} Wilayas`);

  // 5. Catégories
  const categories = [
    { name: "Électronique", slug: "electronique", sortOrder: 1 },
    { name: "Mode", slug: "mode", sortOrder: 2 },
    { name: "Maison & Cuisine", slug: "maison-cuisine", sortOrder: 3 },
    { name: "Sport & Loisirs", slug: "sport-loisirs", sortOrder: 4 },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: { ...cat, isActive: true },
    });
    createdCategories[cat.slug] = created.id;
  }
  console.log(`✅ ${categories.length} catégories créées`);

  // 6. Produits de test (2 par catégorie, 8 au total)
  type ProductSeed = {
    name: string;
    slug: string;
    description: string;
    basePrice: number;
    isActive: boolean;
    isFeatured: boolean;
    seoTitle: string;
    seoDescription: string;
    categorySlug: string;
    variants: { name: string; price: number; sku: string; stock: number }[];
    images: { url: string; alt: string; isPrimary: boolean }[];
  };

  const products: ProductSeed[] = [
    {
      name: "Écouteurs Bluetooth Pro",
      slug: "ecouteurs-bluetooth-pro",
      description: "<p>Écouteurs Bluetooth 5.3 avec réduction de bruit active. Autonomie de 30h avec le boîtier. Résistance à l'eau IPX5.</p>",
      basePrice: 2490,
      isActive: true,
      isFeatured: true,
      seoTitle: "Écouteurs Bluetooth Pro | E-Commerce DZ",
      seoDescription: "Écouteurs Bluetooth 5.3 avec réduction de bruit active – livraison rapide en Algérie",
      categorySlug: "electronique",
      variants: [{ name: "Noir", price: 2490, sku: "ECO-BT-PRO-NOIR", stock: 50 }],
      images: [{ url: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800", alt: "Écouteurs Bluetooth Pro", isPrimary: true }],
    },
    {
      name: "Montre Connectée Sport",
      slug: "montre-connectee-sport",
      description: "<p>Montre connectée sport avec écran AMOLED 1.4 pouces. GPS intégré, capteur cardiaque, suivi du sommeil. Étanche 5ATM.</p>",
      basePrice: 4990,
      isActive: true,
      isFeatured: true,
      seoTitle: "Montre Connectée Sport | E-Commerce DZ",
      seoDescription: "Montre connectée sport GPS capteur cardiaque – livraison rapide en Algérie",
      categorySlug: "electronique",
      variants: [
        { name: "Noir", price: 4990, sku: "MCS-NOIR", stock: 30 },
        { name: "Bleu", price: 5490, sku: "MCS-BLEU", stock: 20 },
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800", alt: "Montre Connectée Sport", isPrimary: true },
        { url: "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=800", alt: "Montre Connectée Sport – écran", isPrimary: false },
      ],
    },
    {
      name: "Sneakers Urban Elite",
      slug: "sneakers-urban-elite",
      description: "<p>Sneakers en cuir synthétique avec semelle en mousse à mémoire de forme. Design moderne et confortable au quotidien.</p>",
      basePrice: 6990,
      isActive: true,
      isFeatured: true,
      seoTitle: "Sneakers Urban Elite | E-Commerce DZ",
      seoDescription: "Sneakers tendance cuir synthétique – livraison Algérie",
      categorySlug: "mode",
      variants: [
        { name: "Blanc/Noir", price: 6990, sku: "SNE-BN", stock: 40 },
        { name: "Gris", price: 6990, sku: "SNE-GRIS", stock: 25 },
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", alt: "Sneakers Urban Elite", isPrimary: true },
      ],
    },
    {
      name: "Sac à Dos Premium",
      slug: "sac-a-dos-premium",
      description: "<p>Sac à dos en toile 600D imperméable. Multiple poches, port USB externe, compatible laptop 15.6 pouces.</p>",
      basePrice: 3990,
      isActive: true,
      isFeatured: false,
      seoTitle: "Sac à Dos Premium | E-Commerce DZ",
      seoDescription: "Sac à dos imperméable toile 600D – livraison Algérie",
      categorySlug: "mode",
      variants: [{ name: "Noir", price: 3990, sku: "SAC-NOIR", stock: 60 }],
      images: [{ url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800", alt: "Sac à Dos Premium", isPrimary: true }],
    },
    {
      name: "Robot Pâtissier 5L",
      slug: "robot-patissier-5l",
      description: "<p>Robot pâtissier multifonction 1200W avec bol inox 5L. 6 vitesses + pulse. Hachoir, fouet, crochet pétrisseur inclus.</p>",
      basePrice: 12990,
      isActive: true,
      isFeatured: true,
      seoTitle: "Robot Pâtissier 5L | E-Commerce DZ",
      seoDescription: "Robot pâtissier multifonction 1200W – livraison Algérie",
      categorySlug: "maison-cuisine",
      variants: [
        { name: "Blanc", price: 12990, sku: "RBT-BLANC", stock: 15 },
        { name: "Noir", price: 13490, sku: "RBT-NOIR", stock: 10 },
      ],
      images: [{ url: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800", alt: "Robot Pâtissier 5L", isPrimary: true }],
    },
    {
      name: "Ensemble Cuisine Inox",
      slug: "ensemble-cuisine-inox",
      description: "<p>Ensemble cuisine 5 pièces en inox 18/10. Fond diffusant, poignées ergonomiques. Compatible toutes cuissons sauf induction.</p>",
      basePrice: 8990,
      isActive: true,
      isFeatured: false,
      seoTitle: "Ensemble Cuisine Inox | E-Commerce DZ",
      seoDescription: "Ensemble cuisine 5 pièces inox – livraison Algérie",
      categorySlug: "maison-cuisine",
      variants: [{ name: "Standard", price: 8990, sku: "ENS-CUIS-STD", stock: 20 }],
      images: [{ url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800", alt: "Ensemble Cuisine Inox", isPrimary: true }],
    },
    {
      name: "VTT Alumax 26",
      slug: "vtt-alumax-26",
      description: "<p>VTT cadres aluminium, fourche suspendue, 21 vitesses Shimano, freins à disque. Idéal pour le vélo urbain et sentier.</p>",
      basePrice: 29990,
      isActive: true,
      isFeatured: true,
      seoTitle: "VTT Alumax 26 | E-Commerce DZ",
      seoDescription: "VTT aluminium 26 pouces 21 vitesses – livraison Algérie",
      categorySlug: "sport-loisirs",
      variants: [
        { name: "Rouge", price: 29990, sku: "VTT-ROUGE", stock: 5 },
        { name: "Bleu", price: 30990, sku: "VTT-BLEU", stock: 8 },
      ],
      images: [{ url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800", alt: "VTT Alumax 26", isPrimary: true }],
    },
    {
      name: "Tapis de Sport Anti-dérapant",
      slug: "tapis-sport-anti-derapant",
      description: "<p>Tapis de sport en TPE écologique, 6mm d'épaisseur, texture anti-dérapante. Idéal pour yoga, pilates, stretching.</p>",
      basePrice: 1990,
      isActive: true,
      isFeatured: false,
      seoTitle: "Tapis de Sport | E-Commerce DZ",
      seoDescription: "Tapis de sport TPE écologique 6mm – livraison Algérie",
      categorySlug: "sport-loisirs",
      variants: [{ name: "Vert", price: 1990, sku: "TAP-VERT", stock: 100 }],
      images: [{ url: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800", alt: "Tapis de Sport", isPrimary: true }],
    },
  ];

  for (const p of products) {
    const categoryId = createdCategories[p.categorySlug];

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        categoryId,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        basePrice: p.basePrice,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        categoryId,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
      },
    });

    // Upsert variants (by sku)
    for (const v of p.variants) {
      await prisma.variant.upsert({
        where: { sku: v.sku },
        update: { name: v.name, price: v.price, stock: v.stock },
        create: {
          productId: product.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          stock: v.stock,
        },
      });
    }

    // Images: delete old + recreate (idempotent)
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    let imgSort = 0;
    for (const img of p.images) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: img.url,
          alt: img.alt,
          isPrimary: img.isPrimary,
          sortOrder: imgSort,
        },
      });
      imgSort++;
    }
  }
  console.log(`✅ ${products.length} produits de test créés (avec variants et images)`);

  console.log("\n🎉 Seed v2 terminé avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
