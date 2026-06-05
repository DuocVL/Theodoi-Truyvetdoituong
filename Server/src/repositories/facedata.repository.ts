import { prisma } from '../configs/prisma';
import type { FaceData } from '../../generated/prisma/client';

/**
 * Custom input type cho tạo FaceData
 * Vì Prisma không generate được do embedding là Unsupported field
 */
export type CreateFaceDataInput = {
  subject_id: string;
  embedding: number[];
  image_url: string;
  status: string;
};

/**
 * Type cho raw query result
 * embedding được return từ database dưới dạng string
 */
type RawFaceDataResult = Omit<FaceData, 'embedding'> & { embedding: string };

/**
 * Tạo bản ghi face data mới
 * Sử dụng raw SQL vì Prisma không hỗ trợ vector type
 */
export const createFaceData = async (data: CreateFaceDataInput): Promise<FaceData> => {
  const { subject_id, embedding, image_url, status } = data;
  const embeddingString = `[${embedding.join(',')}]`;

  const result = await prisma.$queryRaw<RawFaceDataResult[]>`
    INSERT INTO "face_data" ("subject_id", "embedding", "image_url", "status")
    VALUES (${subject_id}, ${embeddingString}::vector, ${image_url}, ${status})
    RETURNING id, subject_id, embedding::text, image_url, status, created_at, update_at;
  `;
  
  const rawData = result[0];
  return {
    ...rawData,
    embedding: JSON.parse(rawData.embedding),
  } as FaceData;
};

/**
 * Lấy face data theo ID
 */
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

/**
 * Lấy tất cả face data của một subject
 * Sắp xếp theo ngày tạo giảm dần (newest first)
 */
export const getFaceDataBySubjectId = async (subject_id: string): Promise<FaceData[]> => {
  const results = await prisma.$queryRaw<RawFaceDataResult[]>`
    SELECT id, subject_id, embedding::text, image_url, status, created_at, update_at
    FROM "face_data" WHERE subject_id = ${subject_id}
    ORDER BY created_at DESC;
  `;
  
  return results.map(rawData => ({
    ...rawData,
    embedding: JSON.parse(rawData.embedding),
  } as FaceData));
};

/**
 * Lấy tất cả face data (admin use)
 */
export const getAllFaceData = async (): Promise<FaceData[]> => {
  const results = await prisma.$queryRaw<RawFaceDataResult[]>`
    SELECT id, subject_id, embedding::text, image_url, status, created_at, update_at
    FROM "face_data"
    ORDER BY created_at DESC;
  `;
  
  return results.map(rawData => ({
    ...rawData,
    embedding: JSON.parse(rawData.embedding),
  } as FaceData));
};

/**
 * Xóa face data theo ID
 * Trả về data bị xóa
 */
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

/**
 * Lấy active face data gần nhất của subject
 * Dùng cho worker verification
 */
export const getLatestActiveFaceData = async (subject_id: string): Promise<FaceData | null> => {
  const result = await prisma.$queryRaw<RawFaceDataResult[]>`
    SELECT id, subject_id, embedding::text, image_url, status, created_at, update_at
    FROM "face_data" 
    WHERE subject_id = ${subject_id} AND status = 'ACTIVE'
    ORDER BY created_at DESC
    LIMIT 1;
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