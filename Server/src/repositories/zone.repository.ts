
import { prisma } from '../configs/prisma';

// Note: Zone model contains Unsupported("geography") field.
// Prisma does NOT generate CRUD methods for models with Unsupported fields.
// Solution: Use raw queries ($queryRaw, $executeRaw) for all operations.

interface ZoneData {
  zone_name: string;
  description?: string;
  is_active?: boolean;
  created_by: string;
  geom?: any;
}

interface ZoneUpdateData {
  zone_name?: string;
  description?: string;
  is_active?: boolean;
  geom?: any;
}

interface ZoneRow {
  id: string;
  zone_name: string;
  description: string | null;
  created_by: string;
  is_active: boolean;
  created_at: Date;
  update_at: Date;
  geom: any;
}

/**
 * Create a new zone with PostGIS geometry support
 * Service layer should pass GeoJSON, this converts it to PostGIS format
 */
export const createZone = async (data: ZoneData): Promise<ZoneRow> => {
  const { zone_name, description, is_active, created_by, geom } = data;
  
  // Convert GeoJSON to PostGIS format using ST_GeomFromGeoJSON
  const geoJsonString = geom ? JSON.stringify(geom) : null;
  
  const query = geoJsonString
    ? `
      INSERT INTO zones (id, zone_name, description, is_active, created_by, geom, created_at, update_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, ST_GeomFromGeoJSON($5), NOW(), NOW())
      RETURNING id, zone_name, description, created_by, is_active, created_at, update_at, geom
    `
    : `
      INSERT INTO zones (id, zone_name, description, is_active, created_by, created_at, update_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
      RETURNING id, zone_name, description, created_by, is_active, created_at, update_at, geom
    `;

  const params = geoJsonString 
    ? [zone_name, description || null, is_active !== false, created_by, geoJsonString]
    : [zone_name, description || null, is_active !== false, created_by];

  const result = await prisma.$queryRawUnsafe<ZoneRow[]>(query, ...params);
  return result[0];
};

/**
 * Get zone by ID
 */
export const getZoneById = async (id: string): Promise<ZoneRow | null> => {
  const result = await prisma.$queryRaw<ZoneRow[]>`
    SELECT id, zone_name, description, created_by, is_active, created_at, update_at, geom
    FROM zones
    WHERE id = ${id}
  `;
  
  return result.length > 0 ? result[0] : null;
};

/**
 * Get all zones
 */
export const getAllZones = async (): Promise<ZoneRow[]> => {
  const result = await prisma.$queryRaw<ZoneRow[]>`
    SELECT id, zone_name, description, created_by, is_active, created_at, update_at, geom
    FROM zones
    ORDER BY created_at DESC
  `;
  
  return result;
};

/**
 * Update zone
 */
export const updateZone = async (id: string, data: ZoneUpdateData): Promise<ZoneRow> => {
  const { zone_name, description, is_active, geom } = data;
  
  // Build dynamic update query
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (zone_name !== undefined) {
    updates.push(`zone_name = $${paramIndex}`);
    params.push(zone_name);
    paramIndex++;
  }

  if (description !== undefined) {
    updates.push(`description = $${paramIndex}`);
    params.push(description);
    paramIndex++;
  }

  if (is_active !== undefined) {
    updates.push(`is_active = $${paramIndex}`);
    params.push(is_active);
    paramIndex++;
  }

  if (geom !== undefined) {
    updates.push(`geom = ST_GeomFromGeoJSON($${paramIndex})`);
    params.push(JSON.stringify(geom));
    paramIndex++;
  }

  updates.push(`update_at = NOW()`);

  const updateClause = updates.join(', ');
  params.push(id);

  const query = `
    UPDATE zones
    SET ${updateClause}
    WHERE id = $${paramIndex}
    RETURNING id, zone_name, description, created_by, is_active, created_at, update_at, geom
  `;

  const result = await prisma.$queryRawUnsafe<ZoneRow[]>(query, ...params);
  return result[0];
};

/**
 * Delete zone
 */
export const deleteZone = async (id: string): Promise<ZoneRow> => {
  const result = await prisma.$queryRaw<ZoneRow[]>`
    DELETE FROM zones
    WHERE id = ${id}
    RETURNING id, zone_name, description, created_by, is_active, created_at, update_at, geom
  `;

  return result[0];
};
