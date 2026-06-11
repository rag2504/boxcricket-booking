import mongoose from "mongoose";
import dotenv from "dotenv";
import Ground from "../models/Ground.js";
import Location from "../models/Location.js";
import User from "../models/User.js";
import { indianCities } from "../data/cities.js";
import {
  generateGroundsForCity,
  buildOwnerForCity,
  GROUNDS_PER_CITY,
} from "../data/mockGroundGenerator.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in environment");
  process.exit(1);
}

const connectDB = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB for seeding");
};

const seedLocations = async () => {
  const ops = indianCities.map((city) => ({
    updateOne: {
      filter: { id: city.id },
      update: {
        $set: {
          id: city.id,
          name: city.name,
          state: city.state,
          latitude: city.latitude,
          longitude: city.longitude,
          popular: city.popular,
        },
      },
      upsert: true,
    },
  }));

  const result = await Location.bulkWrite(ops);
  const upserted = result.upsertedCount || 0;
  const modified = result.modifiedCount || 0;
  console.log(`📍 Locations: ${upserted} created, ${modified} updated (${indianCities.length} total cities)`);
};

const getOrCreateOwner = async (city, index) => {
  const ownerData = buildOwnerForCity(city, index);
  let owner = await User.findOne({ email: ownerData.email });
  if (!owner) {
    owner = await User.create(ownerData);
  }
  return owner;
};

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log("🌱 Starting mock data seeding...");
    console.log(`   ${indianCities.length} cities × ${GROUNDS_PER_CITY} grounds = ${indianCities.length * GROUNDS_PER_CITY} grounds`);

    await seedLocations();

    await Ground.deleteMany({});
    console.log("🗑️  Cleared existing grounds");

    const allGrounds = [];
    for (let i = 0; i < indianCities.length; i++) {
      const city = indianCities[i];
      const owner = await getOrCreateOwner(city, i);
      const grounds = generateGroundsForCity(city, GROUNDS_PER_CITY, owner);
      allGrounds.push(...grounds);
    }

    const BATCH = 100;
    let inserted = 0;
    for (let i = 0; i < allGrounds.length; i += BATCH) {
      const batch = allGrounds.slice(i, i + BATCH);
      await Ground.insertMany(batch);
      inserted += batch.length;
      console.log(`   ✅ Inserted ${inserted}/${allGrounds.length} grounds...`);
    }

    const byCity = await Ground.aggregate([
      { $group: { _id: "$location.cityId", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    console.log("\n🎉 Seeding completed!");
    console.log(`📊 Total grounds: ${inserted}`);
    console.log(`📍 Total locations: ${indianCities.length}`);
    console.log(`👥 Ground owners: ${indianCities.length} (one per city)`);
    console.log("\nSample counts by city:");
    byCity.slice(0, 8).forEach((c) => console.log(`   ${c._id}: ${c.count} grounds`));
    console.log(`   ... and ${byCity.length - 8} more cities`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
