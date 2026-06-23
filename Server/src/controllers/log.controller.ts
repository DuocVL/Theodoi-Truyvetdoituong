import { Request, Response, NextFunction } from 'express';
import * as logService from '../services/log.service';

// controllers/log.controller.ts
export async function getAllLogs(req: Request, res: Response, next: NextFunction) {
    try {
        // Validation cơ bản
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20)); // Giới hạn limit tối đa 100
        
        const filters = {
            category: req.query.category as string,
            userId: req.query.userId as string,
            subjectId: req.query.subjectId as string,
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };

        const data = await logService.getLogs(page, limit, filters);
        res.json(data);
    } catch (error) {
        next(error);
    }
}

export async function getLogById(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const log = await logService.getLogDetail(id as string);
        if (!log) return res.status(404).json({ message: "Log not found" });
        res.json(log);
    } catch (error) { next(error); }
}