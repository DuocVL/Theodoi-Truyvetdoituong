import { prisma } from "../configs/prisma";
//npx tsx src\seed-location.ts
async function seedLocationHistory() {
  const subject = await prisma.subject.findFirst();
  if (!subject) throw new Error("Không có subject để tạo location");

  let locations = [];
  let lat = 21.0285;
  let lng = 105.8542;

  for (let i = 0; i < 200; i++) {
    const date = new Date();
    // Trừ lùi ngày dựa trên i
    date.setDate(date.getDate() - Math.floor(i / 20));
    date.setHours(6 + (i % 16), Math.floor(Math.random() * 60), 0);

    // Di chuyển ngẫu nhiên nhẹ
    lat += (Math.random() - 0.5) * 0.002;
    lng += (Math.random() - 0.5) * 0.002;

    locations.push({
      subject_id: subject.id,
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
      accuracy: Math.floor(Math.random() * 20) + 5,
      speed: parseFloat((Math.random() * 10).toFixed(2)),
      altitude: Math.floor(Math.random() * 30),
      recorded_at: date,
    });
  }

  // Sử dụng prisma.$transaction để đảm bảo tính toàn vẹn
  await prisma.$transaction(async (tx) => {
    await tx.locationHistory.createMany({ data: locations });
  });

  console.log(`Successfully seeded ${locations.length} records for subject: ${subject.id}`);
}

seedLocationHistory()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());