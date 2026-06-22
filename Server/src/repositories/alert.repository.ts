import { prisma } from '../configs/prisma';
import type { AlertType } from '../../generated/prisma/client';

interface CreateAlertData {
  subject_id: string;
  zone_id?: string | null;
  checkin_id?: string | null;
  type: AlertType;
  message?: string;
}

export class AlertRepository {
  public async create(data: CreateAlertData) {
    return prisma.alert.create({ data });
  }

  // Tránh tạo trùng MISSED_CHECKIN nhiều lần cho cùng 1 lần trễ
  public async findRecentMissedAlert(subjectId: string, sinceDate: Date) {
    return prisma.alert.findFirst({
      where: { subject_id: subjectId, type: 'MISSED_CHECKIN', created_at: { gte: sinceDate } },
    });
  }
}