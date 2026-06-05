
import { prisma } from '../configs/prisma';
import { HttpException } from '../exceptions/http-exception';
import { createZoneSchema, updateZoneSchema } from '../dtos/zones.dto';
import Zod from 'zod';
import * as zoneRepository from '../repositories/zone.repository';

// Infer types from Zod schemas
type CreateZoneDto = Zod.infer<typeof createZoneSchema>;
type UpdateZoneDto = Zod.infer<typeof updateZoneSchema>;

class ZoneService {

  // --- CREATE ---
  public async createZone(data: CreateZoneDto, createdByUserId: string): Promise<any> {
    try {
      const zoneData = {
        zone_name: data.zone_name,
        description: data.description,
        is_active: data.is_active,
        created_by: createdByUserId,
        geom: data.geom,
      };

      // Use repository layer for database operations
      const newZone = await zoneRepository.createZone(zoneData);
      
      // Convert geometry to GeoJSON format for response
      if (newZone.geom) {
        newZone.geom = await this.convertGeometryToGeoJSON(newZone.geom);
      }

      return newZone;
    } catch (error) {
      throw new HttpException(500, `Failed to create zone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // --- READ ---
  public async findAllZones(userId: string): Promise<any[]> {
    try {
      // Use raw query to fetch zones with GeoJSON geometry
      const zones = await prisma.$queryRaw`
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
        ORDER BY created_at DESC
      `;
      
      // Parse geom field from string to JSON
      return (zones as any[]).map(zone => ({
        ...zone,
        geom: zone.geom ? JSON.parse(zone.geom) : null,
      }));
    } catch (error) {
      throw new HttpException(500, `Failed to fetch zones: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async findZoneById(zoneId: string): Promise<any> {
    try {
      // Use raw query to fetch single zone with GeoJSON geometry
      const zones = await prisma.$queryRaw`
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

      const zone = (zones as any[])[0];
      if (!zone) {
        throw new HttpException(404, 'Zone not found');
      }

      // Parse geom field from string to JSON object
      if (zone.geom) {
        zone.geom = JSON.parse(zone.geom);
      }

      return zone;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Failed to fetch zone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // --- UPDATE ---
  public async updateZone(zoneId: string, data: UpdateZoneDto): Promise<any> {
    try {
      // Verify zone exists
      const existingZone = await this.findZoneById(zoneId);
      if (!existingZone) {
        throw new HttpException(404, 'Zone not found');
      }

      const updateData = {
        zone_name: data.zone_name,
        description: data.description,
        is_active: data.is_active,
        geom: data.geom,
      };

      // Use repository layer for database operations
      const updatedZone = await zoneRepository.updateZone(zoneId, updateData);

      // Convert geometry to GeoJSON format for response
      if (updatedZone.geom) {
        updatedZone.geom = await this.convertGeometryToGeoJSON(updatedZone.geom);
      }

      // Re-fetch with proper GeoJSON format
      return this.findZoneById(zoneId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Failed to update zone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // --- DELETE ---
  public async deleteZone(zoneId: string): Promise<any> {
    try {
      // Verify zone exists
      const existingZone = await this.findZoneById(zoneId);
      if (!existingZone) {
        throw new HttpException(404, 'Zone not found');
      }

      // Use repository layer for database operations
      const deletedZone = await zoneRepository.deleteZone(zoneId);

      return {
        id: deletedZone.id,
        message: 'Zone deleted successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Failed to delete zone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // --- HELPER ---
  /**
   * Helper method to convert geometry to GeoJSON format
   * If already a string, parse it; if object, return as-is
   */
  private async convertGeometryToGeoJSON(geom: any): Promise<any> {
    if (typeof geom === 'string') {
      try {
        return JSON.parse(geom);
      } catch {
        return geom;
      }
    }
    return geom;
  }
}

export default new ZoneService();
