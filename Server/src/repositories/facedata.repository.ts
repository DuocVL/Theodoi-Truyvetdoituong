import { prisma } from '../configs/prisma';
import type { FaceData } from '../../generated/prisma/client';


// Define a custom input type as Prisma.FaceDataCreateInput is not available
export type CreateFaceDataInput = {
  subject_id: string;
  embedding: number[];
  image_url: string;
  status: string;
};

// Define a type for the shape of the raw query result, where 'embedding' is a string
type RawFaceDataResult = Omit<FaceData, 'embedding'> & { embedding: string };

// This function now uses a raw SQL query to handle the 'vector' type
export const createFaceData = async (data: CreateFaceDataInput): Promise<FaceData> => {
  const { subject_id, embedding, image_url, status } = data;
  const embeddingString = `[${embedding.join(',')}]`;

  const result = await prisma.$queryRaw<RawFaceDataResult[]>`
    INSERT INTO "face_data" ("subject_id", "embedding", "image_url", "status")
    VALUES (${subject_id}, ${embeddingString}::vector, ${image_url}, ${status})
    RETURNING id, subject_id, embedding::text, image_url, status, created_at, update_at;
  `;
  
  const rawData = result[0];
  // Parse the embedding string and cast the final object to the FaceData type
  return {
    ...rawData,
    embedding: JSON.parse(rawData.embedding),
  } as FaceData;
};

// The following functions are also updated to use raw queries and explicit casting.

export const getFaceDataById = async (id: string): Promise<FaceData | null> => {
  const result = await prisma.$queryRaw<RawFaceDataResult[]>`
    SELECT id, subject_id, embedding::text, image_url, status, created_at, update_at
    FROM "face_data" WHERE id = ${id}::uuid;
  `;
  if (result.length === 0) {
    return null;
  }
  const rawData = result[0];
  return {
    ...rawData,
    embedding: JSON.parse(rawData.embedding),
  } as FaceData;
};

export const getFaceDataBySubjectId = async (subject_id: string): Promise<FaceData[]> => {
  const results = await prisma.$queryRaw<RawFaceDataResult[]>`
    SELECT id, subject_id, embedding::text, image_url, status, created_at, update_at
    FROM "face_data" WHERE subject_id = ${subject_id};
  `;
  return results.map(rawData => ({
    ...rawData,
    embedding: JSON.parse(rawData.embedding),
  } as FaceData));
};

export const getAllFaceData = async (): Promise<FaceData[]> => {
  const results = await prisma.$queryRaw<RawFaceDataResult[]>`
    SELECT id, subject_id, embedding::text, image_url, status, created_at, update_at
    FROM "face_data";
  `;
  return results.map(rawData => ({
    ...rawData,
    embedding: JSON.parse(rawData.embedding),
  } as FaceData));
};

export const deleteFaceData = async (id: string): Promise<FaceData> => {
  const result = await prisma.$queryRaw<RawFaceDataResult[]>`
    DELETE FROM "face_data" WHERE id = ${id}::uuid
    RETURNING id, subject_id, embedding::text, image_url, status, created_at, update_at;
  `;
  const rawData = result[0];
  return {
    ...rawData,
    embedding: JSON.parse(rawData.embedding),
  } as FaceData;
};
