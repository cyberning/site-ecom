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

  // ──────────────────────────────────────────────────────────────────────────────
  // 5. Catégories & Produits de test
  // ──────────────────────────────────────────────────────────────────────────────

  // 5.1 Catégories
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

  // 5.2 Produits (2 par catégorie, 8 au total)
  type ProductSeed = {
    name: string;
    slug: string;
    description: string;
    shortDesc: string;
    basePrice: number;
    isActive: boolean;
    isFeatured: boolean;
    seoTitle: string;
    seoDescription: string;
    sortOrder: number;
    categorySlug: string;
    variants: { name: string; price: number; sku: string }[];
    images: { url: string; alt: string; isPrimary: boolean }[];
    reviews: { authorName: string; rating: number; comment: string }[];
  };

  const products: ProductSeed[] = [
    // ── Électronique ─────────────────────────────────────────────────────────
    {
      name: "Écouteurs Bluetooth Pro",
      slug: "ecouteurs-bluetooth-pro",
      description:
        "<p>Écouteurs Bluetooth 5.3 avec réduction de bruit active. Autonomie de 30h avec le boîtier. Résistance à l'eau IPX5.</p>",
      shortDesc: "Écouteurs sans fil avec réduction de bruit active",
      basePrice: 2490,
      isActive: true,
      isFeatured: true,
      seoTitle: "Écouteurs Bluetooth Pro | E-Com DZ",
      seoDescription:
        "Écouteurs Bluetooth 5.3 avec réduction de bruit active – livraison rapide en Algérie",
      sortOrder: 1,
      categorySlug: "electronique",
      variants: [{ name: "Noir", price: 2490, sku: "ECO-BT-PRO-NOIR" }],
      images: [
        {
          url: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800",
          alt: "Écouteurs Bluetooth Pro – vue principale",
          isPrimary: true,
        },
      ],
      reviews: [
        { authorName: "Mohamed B.", rating: 5, comment: "Excellent produit, livraison rapide !" },
        {
          authorName: "Amina K.",
          rating: 4,
          comment: "Bon rapport qualité-prix, le bruit est bien réduit",
        },
        { authorName: "Youcef S.", rating: 5, comment: "Je recommande vivement" },
      ],
    },
    {
      name: "Montre Connectée Sport",
      slug: "montre-connectee-sport",
      description:
        "<p>Montre connectée sport avec écran AMOLED 1.4 pouces. GPS intégré, capteur cardiaque, suivi du sommeil. Étanche 5ATM.</p>",
      shortDesc: "Montre connectée avec GPS et capteur cardiaque",
      basePrice: 4990,
      isActive: true,
      isFeatured: true,
      seoTitle: "Montre Connectée Sport | E-Com DZ",
      seoDescription: "Montre connectée sport GPS capteur cardiaque – livraison rapide en Algérie",
      sortOrder: 2,
      categorySlug: "electronique",
      variants: [
        { name: "Noir", price: 4990, sku: "MCS-NOIR" },
        { name: "Bleu", price: 5490, sku: "MCS-BLEU" },
      ],
      images: [
        {
          url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
          alt: "Montre Connectée Sport – vue principale",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=800",
          alt: "Montre Connectée Sport – écran AMOLED",
          isPrimary: false,
        },
      ],
      reviews: [
        {
          authorName: "Mohamed B.",
          rating: 5,
          comment: "GPS très précis, je l'utilise tous les jours pour le running",
        },
        { authorName: "Amina K.", rating: 4, comment: "Bonne autonomie, 5 jours en usage normal" },
        {
          authorName: "Youcef S.",
          rating: 5,
          comment: "Design élégant et fonctionnalités complètes",
        },
      ],
    },

    // ── Mode ─────────────────────────────────────────────────────────────────
    {
      name: "Sneakers Urban Elite",
      slug: "sneakers-urban-elite",
      description:
        "<p>Sneakers en cuir synthétique avec semelle en mousse à mémoire de forme. Design moderne et confortable au quotidien.</p>",
      shortDesc: "Baskets tendance pour homme et femme",
      basePrice: 6990,
      isActive: true,
      isFeatured: true,
      seoTitle: "Sneakers Urban Elite | E-Com DZ",
      seoDescription:
        "Sneakers tendance cuir synthétique semelle mémoire de forme – livraison Algérie",
      sortOrder: 1,
      categorySlug: "mode",
      variants: [
        { name: "Blanc/Noir", price: 6990, sku: "SNE-BN" },
        { name: "Gris", price: 6990, sku: "SNE-GRIS" },
        { name: "Beige", price: 7490, sku: "SNE-BEIGE" },
      ],
      images: [
        {
          url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
          alt: "Sneakers Urban Elite – vue principale",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800",
          alt: "Sneakers Urban Elite – vue de côté",
          isPrimary: false,
        },
      ],
      reviews: [
        {
          authorName: "Mohamed B.",
          rating: 5,
          comment: "Très confortables, je les porte tous les jours !",
        },
        {
          authorName: "Amina K.",
          rating: 5,
          comment: "Design magnifique, parfaites pour le quotidien",
        },
        { authorName: "Youcef S.", rating: 4, comment: "Bonne qualité, taille normale" },
      ],
    },
    {
      name: "Sac à Dos Premium",
      slug: "sac-a-dos-premium",
      description:
        "<p>Sac à dos en toile 600D imperméable. Multiple poches, port USB externe, compatible laptop 15.6 pouces.</p>",
      shortDesc: "Sac à dos en toile imperméable",
      basePrice: 3990,
      isActive: true,
      isFeatured: false,
      seoTitle: "Sac à Dos Premium | E-Com DZ",
      seoDescription: "Sac à dos imperméable toile 600D port USB laptop 15.6 pouces",
      sortOrder: 2,
      categorySlug: "mode",
      variants: [{ name: "Noir", price: 3990, sku: "SAC-NOIR" }],
      images: [
        {
          url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
          alt: "Sac à Dos Premium – vue principale",
          isPrimary: true,
        },
      ],
      reviews: [],
    },

    // ── Maison & Cuisine ─────────────────────────────────────────────────────
    {
      name: "Robot Pâtissier 5L",
      slug: "robot-patissier-5l",
      description:
        "<p>Robot pâtissier multifonction 1200W avec bol inox 5L. 6 vitesses + pulse. Hachoir, fouet, crochet pétrisseur inclus.</p>",
      shortDesc: "Robot multifonction 1200W",
      basePrice: 12990,
      isActive: true,
      isFeatured: true,
      seoTitle: "Robot Pâtissier 5L | E-Com DZ",
      seoDescription: "Robot pâtissier multifonction 1200W bol inox 5L – livraison Algérie",
      sortOrder: 1,
      categorySlug: "maison-cuisine",
      variants: [
        { name: "Blanc", price: 12990, sku: "RBT-BLANC" },
        { name: "Noir", price: 13490, sku: "RBT-NOIR" },
      ],
      images: [
        {
          url: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800",
          alt: "Robot Pâtissier 5L – vue principale",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800",
          alt: "Robot Pâtissier 5L – en action",
          isPrimary: false,
        },
      ],
      reviews: [
        {
          authorName: "Mohamed B.",
          rating: 5,
          comment: "Puissant et silencieux, parfait pour les pâtisseries",
        },
        {
          authorName: "Amina K.",
          rating: 4,
          comment: "Le bol inox est très pratique, facile à nettoyer",
        },
        { authorName: "Youcef S.", rating: 5, comment: "Un indispensable dans la cuisine !" },
      ],
    },
    {
      name: "Ensemble Cuisine Inox",
      slug: "ensemble-cuisine-inox",
      description:
        "<p>Ensemble cuisine 5 pièces en inox 18/10. Fond diffusant, poignées ergonomiques. Compatible toutes cuissons sauf induction.</p>",
      shortDesc: "Lot de 5 poêles et casseroles en inox",
      basePrice: 8990,
      isActive: true,
      isFeatured: false,
      seoTitle: "Ensemble Cuisine Inox | E-Com DZ",
      seoDescription: "Ensemble cuisine 5 pièces inox 18/10 – livraison rapide Algérie",
      sortOrder: 2,
      categorySlug: "maison-cuisine",
      variants: [{ name: "Standard", price: 8990, sku: "ENS-CUIS-STD" }],
      images: [
        {
          url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
          alt: "Ensemble Cuisine Inox – vue principale",
          isPrimary: true,
        },
      ],
      reviews: [],
    },

    // ── Sport & Loisirs ──────────────────────────────────────────────────────
    {
      name: "VTT Alumax 26",
      slug: "vtt-alumax-26",
      description:
        "<p>VTT cadres aluminium, fourche suspendue, 21 vitesses Shimano, freins à disque. Idéal pour le vélo urbain et sentier.</p>",
      shortDesc: "VTT aluminium 26 pouces 21 vitesses",
      basePrice: 29990,
      isActive: true,
      isFeatured: true,
      seoTitle: "VTT Alumax 26 | E-Com DZ",
      seoDescription:
        "VTT aluminium 26 pouces 21 vitesses Shimano freins à disque – livraison Algérie",
      sortOrder: 1,
      categorySlug: "sport-loisirs",
      variants: [
        { name: "Rouge", price: 29990, sku: "VTT-ROUGE" },
        { name: "Bleu", price: 30990, sku: "VTT-BLEU" },
      ],
      images: [
        {
          url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800",
          alt: "VTT Alumax 26 – vue principale",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800",
          alt: "VTT Alumax 26 – détail du cadre",
          isPrimary: false,
        },
      ],
      reviews: [
        {
          authorName: "Mohamed B.",
          rating: 5,
          comment: "Cadre solide, très bon rapport qualité-prix pour un VTT",
        },
        {
          authorName: "Amina K.",
          rating: 4,
          comment: "Bon vélo, la fourche suspendue fonctionne bien sur les sentiers",
        },
        {
          authorName: "Youcef S.",
          rating: 5,
          comment: "Livraison soignée, monté en 30 minutes, je recommande !",
        },
      ],
    },
    {
      name: "Tapis de Sport Anti-dérapant",
      slug: "tapis-sport-anti-derapant",
      description:
        "<p>Tapis de sport en TPE écologique, 6mm d'épaisseur, texture anti-dérapante. Idéal pour yoga, pilates, stretching.</p>",
      shortDesc: "Tapis de yoga et fitness 183x61cm",
      basePrice: 1990,
      isActive: true,
      isFeatured: false,
      seoTitle: "Tapis de Sport Anti-dérapant | E-Com DZ",
      seoDescription: "Tapis de sport TPE écologique 6mm yoga pilates fitness – livraison Algérie",
      sortOrder: 2,
      categorySlug: "sport-loisirs",
      variants: [{ name: "Vert", price: 1990, sku: "TAP-VERT" }],
      images: [
        {
          url: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800",
          alt: "Tapis de Sport Anti-dérapant – vue principale",
          isPrimary: true,
        },
      ],
      reviews: [],
    },
  ];

  // 5.3 Upsert de chaque produit + variants + images + reviews
  for (const p of products) {
    const categoryId = createdCategories[p.categorySlug];

    // Upsert du produit
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        shortDesc: p.shortDesc,
        basePrice: p.basePrice,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        categoryId,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        sortOrder: p.sortOrder,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDesc: p.shortDesc,
        basePrice: p.basePrice,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        categoryId,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        sortOrder: p.sortOrder,
      },
    });

    // Upsert variants (par sku unique)
    let variantSort = 0;
    for (const v of p.variants) {
      await prisma.variant.upsert({
        where: { sku: v.sku },
        update: { name: v.name, price: v.price, sortOrder: variantSort },
        create: {
          productId: product.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          sortOrder: variantSort,
        },
      });
      variantSort++;
    }

    // Upsert images – on identifie via productId + url (composite unique absent → on supprime/recrée)
    // Pour rester idempotent on supprime les anciennes images du produit puis on recrée
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

    // Reviews – supprimées puis recréées pour garder le seed propre
    if (p.reviews.length > 0) {
      await prisma.review.deleteMany({ where: { productId: product.id } });
      for (const r of p.reviews) {
        await prisma.review.create({
          data: {
            productId: product.id,
            authorName: r.authorName,
            rating: r.rating,
            comment: r.comment,
            isApproved: true,
          },
        });
      }
    }
  }
  console.log(`✅ ${products.length} produits de test créés (avec variants, images et reviews)`);

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
