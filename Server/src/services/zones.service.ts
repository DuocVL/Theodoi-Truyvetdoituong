
import { PrismaClient, Prisma, Zone } from '../../generated/prisma';
import { HttpException } from '../exceptions/HttpException';
import { createZoneSchema, updateZoneSchema } from '../dtos/zones.dto';

// Infer types from Zod schemas
type CreateZoneDto = Zod.infer<typeof createZoneSchema>;
type UpdateZoneDto = Zod.infer<typeof updateZoneSchema>;

class ZoneService {
  private prisma = new PrismaClient();

  // --- CREATE ---
  public async createZone(data: CreateZoneDto, createdByUserId: string): Promise<Zone> {
    const { zone_name, description, is_active, geom } = data;

    // Use Prisma's raw query capabilities for PostGIS functions
    // 1. Convert GeoJSON to a string
    const geoJsonString = JSON.stringify(geom);
    // 2. Use ST_GeomFromGeoJSON to insert the geometry data
    const rawQuery = Prisma.sql`ST_GeomFromGeoJSON(${geoJsonString})`;

    const newZone = await this.prisma.zone.create({
      data: {
        zone_name,
        description,
        is_active,
        created_by: createdByUserId,
        geom: rawQuery, // Assign the raw SQL query here
      },
    });

    return newZone;
  }

  // --- READ ---
  public async findAllZones(userId: string): Promise<any[]> {
    // We use $queryRaw to select and convert the geometry back to GeoJSON format
    const zones = await this.prisma.$queryRaw`
        SELECT 
            id, 
            zone_name, 
            description, 
            is_active, 
            created_by, 
            created_at, 
            update_at, 
            ST_AsGeoJSON(geom) as geom
        FROM zones
        WHERE created_by = ${userId}::uuid
    `;
    return zones as any[];
  }

  public async findZoneById(zoneId: string): Promise<any> {
    const zone = await this.prisma.$queryRaw`
        SELECT 
            id, 
            zone_name, 
            description, 
            is_active, 
            created_by, 
            created_at, 
            update_at, 
            ST_AsGeoJSON(geom) as geom
        FROM zones
        WHERE id = ${zoneId}::uuid
    `;

    const result = (zone as any[])[0];
    if (!result) {
      throw new HttpException(404, "Zone not found");
    }

    // The geom field is a string, parse it back to a JSON object
    if (result.geom) {
        result.geom = JSON.parse(result.geom);
    }

    return result;
  }

  // --- UPDATE ---
  public async updateZone(zoneId: string, data: UpdateZoneDto): Promise<any> {
    // Check if zone exists
    const existingZone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
    if (!existingZone) {
      throw new HttpException(404, "Zone not found");
    }

    const updateData: any = { ...data };
    
    // If the geometry is being updated, we need to use the raw query method again
    if (data.geom) {
      const geoJsonString = JSON.stringify(data.geom);
      updateData.geom = Prisma.sql`ST_GeomFromGeoJSON(${geoJsonString})`;
    }

    const updatedZone = await this.prisma.zone.update({
      where: { id: zoneId },
      data: updateData,
    });
    
    // We need to re-fetch to get the geom as GeoJSON
    return this.findZoneById(zoneId);
  }

  // --- DELETE ---
  public async deleteZone(zoneId: string): Promise<Zone> {
    const existingZone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
    if (!existingZone) {
      throw new HttpException(404, "Zone not found");
    }

    const deletedZone = await this.prisma.zone.delete({
      where: { id: zoneId },
    });

    return deletedZone;
  }
}

export default ZoneService;
