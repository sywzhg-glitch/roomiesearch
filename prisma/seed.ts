import { PrismaClient, GroupRole, ListingStatus, MarketplaceType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create users
  const passwordHash = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice Chen",
      passwordHash,
      phone: "415-555-0101",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      name: "Bob Kim",
      passwordHash,
      phone: "415-555-0102",
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@example.com" },
    update: {},
    create: {
      email: "carol@example.com",
      name: "Carol Davis",
      passwordHash,
      phone: "415-555-0103",
    },
  });

  const dave = await prisma.user.upsert({
    where: { email: "dave@example.com" },
    update: {},
    create: {
      email: "dave@example.com",
      name: "Dave Martinez",
      passwordHash,
    },
  });

  console.log("✅ Created users");

  // Create a group
  const group1 = await prisma.group.upsert({
    where: { inviteCode: "sf-roomies-2024" },
    update: {},
    create: {
      name: "SF Roomies 2024",
      inviteCode: "sf-roomies-2024",
      location: "San Francisco, CA",
      budgetMin: 2500,
      budgetMax: 4500,
      moveInDate: new Date("2024-09-01"),
      bedsMin: 3,
      bedsMax: 4,
      baths: 2,
      notes: "Looking for a place in the Mission or Castro district. Dog-friendly preferred.",
    },
  });

  const group2 = await prisma.group.upsert({
    where: { inviteCode: "brooklyn-squad" },
    update: {},
    create: {
      name: "Brooklyn Squad",
      inviteCode: "brooklyn-squad",
      location: "Brooklyn, NY",
      budgetMin: 3000,
      budgetMax: 5000,
      moveInDate: new Date("2024-10-01"),
      bedsMin: 2,
      bedsMax: 3,
      baths: 1,
      notes: "Near subway preferred. Williamsburg or Park Slope.",
    },
  });

  console.log("✅ Created groups");

  // Add members
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: alice.id, groupId: group1.id } },
    update: {},
    create: { userId: alice.id, groupId: group1.id, role: GroupRole.OWNER },
  });
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: bob.id, groupId: group1.id } },
    update: {},
    create: { userId: bob.id, groupId: group1.id, role: GroupRole.MEMBER },
  });
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: carol.id, groupId: group1.id } },
    update: {},
    create: { userId: carol.id, groupId: group1.id, role: GroupRole.MEMBER },
  });
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: dave.id, groupId: group2.id } },
    update: {},
    create: { userId: dave.id, groupId: group2.id, role: GroupRole.OWNER },
  });

  console.log("✅ Added group members");

  // Create listings
  const listing1 = await prisma.listing.create({
    data: {
      url: "https://www.zillow.com/homes/123-mission-st",
      price: 3800,
      address: "123 Mission St",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      beds: 3,
      baths: 2,
      sqft: 1200,
      description: "Beautiful 3BR/2BA in the heart of the Mission District. Hardwood floors, updated kitchen, in-unit laundry. Dog friendly! Walk to BART and restaurants.",
      images: [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
      ],
      landlordName: "Pacific Properties",
      landlordEmail: "rent@pacificproperties.com",
      landlordPhone: "415-555-0200",
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      url: "https://www.apartments.com/456-castro-st",
      price: 4200,
      address: "456 Castro St",
      city: "San Francisco",
      state: "CA",
      zip: "94114",
      beds: 4,
      baths: 2,
      sqft: 1600,
      description: "Spacious Victorian 4BR/2BA in Castro. Original details, modern upgrades. Large backyard, parking included. Close to shops and Muni.",
      images: [
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800",
      ],
      landlordName: "Bay Area Rentals LLC",
      landlordEmail: "info@bayarearentals.com",
      landlordPhone: "415-555-0201",
      aiSuggested: true,
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      url: "https://craigslist.org/sf/789-valencia",
      price: 3200,
      address: "789 Valencia St",
      city: "San Francisco",
      state: "CA",
      zip: "94110",
      beds: 3,
      baths: 1,
      sqft: 1050,
      description: "Cozy 3BR/1BA flat on Valencia Street corridor. Steps from restaurants, bars, and Valencia bike path. Good natural light, updated bathroom.",
      images: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      ],
      landlordName: "Carlos Mendoza",
      landlordEmail: "carlos.landlord@gmail.com",
      landlordPhone: "415-555-0202",
    },
  });

  console.log("✅ Created listings");

  // Link listings to group
  const gl1 = await prisma.groupListing.create({
    data: {
      groupId: group1.id,
      listingId: listing1.id,
      status: ListingStatus.CONSIDERING,
      addedById: alice.id,
    },
  });
  const gl2 = await prisma.groupListing.create({
    data: {
      groupId: group1.id,
      listingId: listing2.id,
      status: ListingStatus.APPLYING,
      addedById: bob.id,
    },
  });
  const gl3 = await prisma.groupListing.create({
    data: {
      groupId: group1.id,
      listingId: listing3.id,
      status: ListingStatus.CONSIDERING,
      addedById: carol.id,
    },
  });

  console.log("✅ Linked listings to group");

  // Add ratings
  await prisma.listingRating.createMany({
    data: [
      { groupListingId: gl1.id, userId: alice.id, rating: 4, interested: true, applying: false },
      { groupListingId: gl1.id, userId: bob.id, rating: 5, interested: true, applying: true },
      { groupListingId: gl1.id, userId: carol.id, rating: 3, interested: false, applying: false },
      { groupListingId: gl2.id, userId: alice.id, rating: 5, interested: true, applying: true },
      { groupListingId: gl2.id, userId: bob.id, rating: 4, interested: true, applying: true },
      { groupListingId: gl2.id, userId: carol.id, rating: 5, interested: true, applying: true },
      { groupListingId: gl3.id, userId: alice.id, rating: 2, interested: false, applying: false },
      { groupListingId: gl3.id, userId: bob.id, rating: 3, interested: false, applying: false },
    ],
  });

  console.log("✅ Added ratings");

  // Add comments
  const comment1 = await prisma.listingComment.create({
    data: {
      groupListingId: gl1.id,
      userId: alice.id,
      content: "Love the location! The in-unit laundry is a huge plus. Beds look a bit small though.",
    },
  });
  await prisma.listingComment.create({
    data: {
      groupListingId: gl1.id,
      userId: bob.id,
      content: "I toured it yesterday — photos are accurate. Kitchen is super modern. +1 for this one!",
      parentId: comment1.id,
    },
  });
  await prisma.listingComment.create({
    data: {
      groupListingId: gl2.id,
      userId: carol.id,
      content: "Parking included is a game changer. We should apply ASAP, Castro places go fast.",
    },
  });

  console.log("✅ Added comments");

  // Add application data
  await prisma.applicationData.upsert({
    where: { userId: alice.id },
    update: {},
    create: {
      userId: alice.id,
      firstName: "Alice",
      lastName: "Chen",
      email: "alice@example.com",
      phone: "415-555-0101",
      currentAddress: "100 Main St, San Francisco, CA 94102",
      income: 120000,
      employer: "TechCorp Inc",
      jobTitle: "Software Engineer",
      employmentYears: 3,
      creditScore: 760,
      hasGuarantor: false,
    },
  });
  await prisma.applicationData.upsert({
    where: { userId: bob.id },
    update: {},
    create: {
      userId: bob.id,
      firstName: "Bob",
      lastName: "Kim",
      email: "bob@example.com",
      phone: "415-555-0102",
      currentAddress: "200 Oak Ave, San Francisco, CA 94103",
      income: 95000,
      employer: "Design Studio",
      jobTitle: "UX Designer",
      employmentYears: 2,
      creditScore: 720,
      hasGuarantor: false,
    },
  });

  console.log("✅ Added application data");

  // Create marketplace profiles
  await prisma.marketplaceProfile.upsert({
    where: { groupId: group1.id },
    update: {},
    create: {
      groupId: group1.id,
      type: MarketplaceType.OPEN_ROOM,
      title: "SF Roomies looking for 1 more",
      description: "Fun group of 3 young professionals looking for a 4th roommate. We're social but respectful of quiet hours.",
      location: "San Francisco, CA",
      budgetMin: 1200,
      budgetMax: 1500,
      moveInDate: new Date("2024-09-01"),
      openRooms: 1,
      isActive: true,
    },
  });

  await prisma.marketplaceProfile.upsert({
    where: { userId: dave.id },
    update: {},
    create: {
      userId: dave.id,
      type: MarketplaceType.LOOKING_FOR_GROUP,
      title: "Software dev seeking roommates in Brooklyn",
      description: "Remote worker, clean and tidy. Love cooking and hiking on weekends. Looking for a chill house.",
      location: "Brooklyn, NY",
      budgetMin: 1500,
      budgetMax: 2000,
      moveInDate: new Date("2024-10-01"),
      isActive: true,
    },
  });

  console.log("✅ Created marketplace profiles");

  console.log("\n🎉 Seed complete!");
  console.log("\nTest accounts:");
  console.log("  alice@example.com / password123");
  console.log("  bob@example.com / password123");
  console.log("  carol@example.com / password123");
  console.log("  dave@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
