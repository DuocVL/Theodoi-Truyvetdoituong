import { prisma } from '../configs/prisma';
import type { Checkin } from '../../generated/prisma/client';

// Define a custom input type since Prisma.CheckinCreateInput is not generated
export type CreateCheckinInput = {
  subject_id: string;
  lat: number;
  lon: number;
  image_url?: string;
  face_verified?: boolean;
  confidence: number;
  status?: string;
};

export const createCheckin = async (
  data: CreateCheckinInput
): Promise<Checkin> => {
  const { subject_id, lat, lon, image_url, face_verified, confidence, status } = data;

  // Use a raw query to insert data, including the PostGIS geography type
  // ST_MakePoint creates a point, and ::geography casts it to the geography type.
  const result = await prisma.$queryRaw<Checkin[]>`
    INSERT INTO "checkins" (
      "subject_id",
      "location",
      "image_url",
      "face_verified",
      "confidence",
      "status"
    ) VALUES (
      ${subject_id},
      ST_MakePoint(${lon}, ${lat})::geography,
      ${image_url},
      ${face_verified},
      ${confidence},
      ${status}
    )
    RETURNING id, subject_id, ST_AsGeoJSON(location) as location, image_url, face_verified, confidence, status, checkin_time
  `;

  return result[0];
};

export const getCheckinById = async (id: bigint): Promise<Checkin | null> => {
    // Note: The 'id' in schema is BigInt, so the parameter type should be bigint.
    // Raw query is safer here to correctly handle the geography type on return.
    const result = await prisma.$queryRaw<Checkin[]>`
        SELECT id, subject_id, ST_AsGeoJSON(location) as location, image_url, face_verified, confidence, status, checkin_time
        FROM "checkins"
        WHERE "id" = ${id}
    `;
    return result[0] || null;
};

export const findLastCheckin = async (subjectId: string): Promise<Checkin | null> => {
    // Raw query is also recommended here.
    const result = await prisma.$queryRaw<Checkin[]>`
        SELECT id, subject_id, ST_AsGeoJSON(location) as location, image_url, face_verified, confidence, status, checkin_time
        FROM "checkins"
        WHERE "subject_id" = ${subjectId}
        ORDER BY "checkin_time" DESC
        LIMIT 1
    `;
    return result[0] || null;
};
