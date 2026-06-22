// src/services/zones.service.ts
import { HttpException } from '../exceptions/http-exception';
import { createZoneSchema, updateZoneSchema } from '../dtos/zones.dto';
import { prisma } from '../configs/prisma';
import Zod from 'zod';
import * as zoneRepository from '../repositories/zone.repository';

type CreateZoneDto = Zod.infer<typeof createZoneSchema>;
type UpdateZoneDto = Zod.infer<typeof updateZoneSchema>;

class ZoneService {

  // --- HÀM TRUNG GIAN BẢO MẬT: KIỂM TRA QUYỀN HẠN VỚI SUBJECT ---
  private async validateSubjectAccess(subjectId: string, userId: string, role: string) {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new HttpException(404, 'Subject not found');
    }

    // Nếu không phải ADMIN và không phải Cán bộ trực tiếp tạo ra Đối tượng -> Chặn quyền truy cập
    if (role !== 'ADMIN' && subject.created_by !== userId) {
      throw new HttpException(403, 'Permission denied: You do not have permission to manage this subject');
    }
    
    return subject;
  }

  // --- CREATE ---
  public async createZone(data: CreateZoneDto, createdByUserId: string, role: string): Promise<any> {
    try {
      // Xác thực xem Cán bộ có quyền gán vùng cho Đối tượng này không
      await this.validateSubjectAccess(data.subject_id, createdByUserId, role);

      return await zoneRepository.createZone({
        ...data,
        created_by: createdByUserId,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Failed to create zone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // --- READ ---
  public async findZonesBySubject(subjectId: string, userId: string, role: string): Promise<any[]> {
    try {
      await this.validateSubjectAccess(subjectId, userId, role);
      return await zoneRepository.getZonesBySubjectId(subjectId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Failed to fetch zones: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async findZoneById(zoneId: string, userId: string, role: string): Promise<any> {
    try {
      const zone = await zoneRepository.getZoneById(zoneId);
      if (!zone) {
        throw new HttpException(404, 'Zone not found');
      }

      // Xác thực dựa trên subject_id nằm bên trong bản ghi Vùng tìm được
      await this.validateSubjectAccess(zone.subject_id, userId, role);
      return zone;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Failed to fetch zone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // --- UPDATE ---
  public async updateZone(zoneId: string, data: UpdateZoneDto, userId: string, role: string): Promise<any> {
    try {
      // findZoneById đã tích hợp sẵn validate quyền sở hữu dữ liệu
      await this.findZoneById(zoneId, userId, role);

      return await zoneRepository.updateZone(zoneId, data);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Failed to update zone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // --- DELETE ---
  public async deleteZone(zoneId: string, userId: string, role: string): Promise<any> {
    try {
      await this.findZoneById(zoneId, userId, role);

      await zoneRepository.deleteZone(zoneId);
      return {
        id: zoneId,
        message: 'Zone deleted successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Failed to delete zone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default new ZoneService();