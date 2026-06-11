const GROUND_PREFIXES = [
  "Striker Box Cricket",
  "Powerplay Arena",
  "Champions Turf",
  "Sixer Sports Complex",
  "Yorker Cricket Hub",
  "Boundary Box Cricket",
  "Pitch Perfect Arena",
  "Wicket Warriors Ground",
  "Cover Drive Cricket Club",
  "Super Over Box Cricket",
];

const AREA_SUFFIXES = [
  "Sports Complex",
  "Industrial Area",
  "Near City Mall",
  "Metro Station Road",
  "IT Park Zone",
  "Residential Colony",
  "Highway Bypass",
  "University Road",
  "Stadium Road",
  "Market Area",
];

const PITCH_TYPES = ["Artificial Turf", "Synthetic", "Matting", "Concrete"];

const AMENITY_POOL = [
  "Floodlights",
  "Parking",
  "Washroom",
  "Changing Room",
  "Drinking Water",
  "First Aid",
  "Equipment Rental",
  "Cafeteria",
  "Scoreboard",
  "AC Changing Room",
  "Valet Parking",
  "Wi-Fi",
  "CCTV Security",
  "Coaching Available",
];

const CRICKET_IMAGES = [
  { id: "photo-1578662996442-48f60103fc96", alt: "Box cricket pitch aerial view" },
  { id: "photo-1540747913346-19e32dc3e97e", alt: "Cricket ground under floodlights" },
  { id: "photo-1597223557154-721c1cecc4b0", alt: "Indoor box cricket arena" },
  { id: "photo-1531415074968-036ba1b575da", alt: "Cricket batting practice nets" },
  { id: "photo-1624526268845-ed72d9f1e658", alt: "Cricket match on turf pitch" },
  { id: "photo-1635074445757-4a62d0c2ae69", alt: "Modern cricket stadium" },
  { id: "photo-1521417533809-9f363a0a3b9f", alt: "Cricket bat and ball on pitch" },
  { id: "photo-1593341648379-b00bd1e97662", alt: "Cricket field green turf" },
  { id: "photo-1518611012118-696072aa579a", alt: "Sports turf facility" },
  { id: "photo-1461896836934-ffe607ba8211", alt: "Outdoor sports ground" },
];

const TIME_SLOTS = [
  "06:00-08:00", "08:00-10:00", "10:00-12:00", "12:00-14:00",
  "14:00-16:00", "16:00-18:00", "18:00-20:00", "20:00-22:00",
];

const OWNER_NAMES = [
  "Rajesh Kumar", "Suresh Patel", "Amit Sharma", "Priya Gupta",
  "Vikram Singh", "Anita Reddy", "Rohit Mehta", "Kavita Joshi",
  "Arjun Nair", "Deepak Verma",
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

function pickMany(arr, seed, count) {
  const result = [];
  let i = 0;
  while (result.length < count && i < arr.length * 3) {
    const item = arr[(seed + i * 7) % arr.length];
    if (!result.includes(item)) result.push(item);
    i++;
  }
  return result;
}

function buildWeeklySchedule() {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const schedule = {};
  for (const day of days) {
    schedule[day] = { isOpen: true, slots: [...TIME_SLOTS] };
  }
  return schedule;
}

function buildImages(groundName, seed) {
  const count = 3 + (seed % 2);
  const images = [];
  for (let i = 0; i < count; i++) {
    const img = CRICKET_IMAGES[(seed + i * 3) % CRICKET_IMAGES.length];
    images.push({
      url: `https://images.unsplash.com/${img.id}?w=800&h=500&fit=crop`,
      alt: `${groundName} - ${img.alt}`,
      isPrimary: i === 0,
    });
  }
  return images;
}

function buildPrice(seed, isPopular) {
  const base = isPopular ? 900 + (seed % 8) * 100 : 600 + (seed % 10) * 80;
  const evening = base + 200 + (seed % 4) * 50;
  return {
    ranges: [
      { start: "06:00", end: "18:00", perHour: base },
      { start: "18:00", end: "22:00", perHour: evening },
    ],
    currency: "INR",
    discount: seed % 5 === 0 ? 10 : seed % 7 === 0 ? 15 : 0,
  };
}

function buildFeatures(seed) {
  const pitchType = pick(PITCH_TYPES, seed);
  const capacity = 12 + (seed % 13);
  const flags = (n) => (seed >> n) & 1;
  return {
    pitchType,
    capacity,
    lighting: true,
    parking: flags(1) === 1 || seed % 3 !== 0,
    changeRoom: flags(2) === 1 || seed % 2 === 0,
    washroom: true,
    cafeteria: flags(3) === 1 || seed % 4 === 0,
    equipment: flags(4) === 1 || seed % 3 === 0,
  };
}

/**
 * Generate mock grounds for a city.
 * @param {object} city - { id, name, state, latitude, longitude, popular }
 * @param {number} count - grounds per city (8-10)
 * @param {object} owner - mongoose user doc with _id, name, email, phone
 */
export function generateGroundsForCity(city, count, owner) {
  const grounds = [];

  for (let i = 0; i < count; i++) {
    const seed = hash(`${city.id}-${i}`);
    const prefix = GROUND_PREFIXES[i % GROUND_PREFIXES.length];
    const area = pick(AREA_SUFFIXES, seed);
    const sector = (seed % 40) + 1;
    const name = `${prefix} - ${city.name} ${area}`;
    const latOffset = ((seed % 100) - 50) / 1000;
    const lngOffset = (((seed >> 8) % 100) - 50) / 1000;
    const pincode = String(100000 + (seed % 900000)).padStart(6, "0");
    const dayRate = buildPrice(seed, city.popular);
    const features = buildFeatures(seed);
    const amenities = pickMany(AMENITY_POOL, seed, 5 + (seed % 4));
    const ratingAvg = 3.8 + (seed % 12) / 10;
    const ratingCount = 20 + (seed % 280);
    const totalBookings = 50 + (seed % 900);

    grounds.push({
      name,
      description: `Premium box cricket facility in ${city.name}, ${city.state}. Located in ${area} (Sector ${sector}), this ${features.pitchType.toLowerCase()} ground accommodates up to ${features.capacity} players. Ideal for corporate matches, weekend leagues, and practice sessions. Day slots from ₹${dayRate.ranges[0].perHour}/hr, evening from ₹${dayRate.ranges[1].perHour}/hr.`,
      location: {
        address: `Sector ${sector}, ${area}, ${city.name}, ${city.state}`,
        cityId: city.id,
        cityName: city.name,
        state: city.state,
        latitude: Number((city.latitude + latOffset).toFixed(4)),
        longitude: Number((city.longitude + lngOffset).toFixed(4)),
        pincode,
      },
      price: dayRate,
      images: buildImages(name, seed),
      amenities,
      features,
      availability: {
        timeSlots: [...TIME_SLOTS],
        blockedDates: [],
        weeklySchedule: buildWeeklySchedule(),
      },
      owner: {
        userId: owner._id,
        name: owner.name,
        contact: owner.phone,
        email: owner.email,
        verified: true,
      },
      rating: {
        average: Number(ratingAvg.toFixed(1)),
        count: ratingCount,
        reviews: [],
      },
      status: "active",
      totalBookings,
      isVerified: true,
      policies: {
        cancellation: "Free cancellation up to 4 hours before booking. 50% refund for cancellations 2–4 hours prior.",
        rules: [
          "No smoking or alcohol on premises",
          "Proper sports shoes required",
          `Maximum ${features.capacity} players per slot`,
          "Arrive 10 minutes before your slot",
        ],
        advanceBooking: 30,
      },
    });
  }

  return grounds;
}

export function buildOwnerForCity(city, index) {
  const name = pick(OWNER_NAMES, hash(city.id));
  return {
    name,
    email: `owner.${city.id}@boxcric-mock.com`,
    phone: `+91 98${String(10000000 + index).slice(-8)}`,
    password: "password123",
    role: "ground_owner",
    isVerified: true,
    location: {
      cityId: city.id,
      cityName: city.name,
      state: city.state,
      latitude: city.latitude,
      longitude: city.longitude,
    },
  };
}

export const GROUNDS_PER_CITY = 9;
