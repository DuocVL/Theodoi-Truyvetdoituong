import { Request, Response, NextFunction } from 'express';
import * as logService from '../services/log.service';
import { HttpException } from '../exceptions/http-exception';
import { getUserByAccountId } from '../repositories/user.repository';

// xử lý với log phục vụ duy nhất admin

//lấy danh sách log
export async function getAllLogs(req: Request, res: Response, next: NextFunction) {
    try {

        //xác thực
        const accountId = req.account?.id;
        const role = req.role;
        if(!accountId || !role) throw new HttpException(401, 'Unauthorized');

        const admin = getUserByAccountId(accountId);
        if(role !== "ADMIN" && !admin) throw new HttpException(401, 'Forbidden');

        //xử lý dữ liệu
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20)); // Giới hạn limit tối đa 100
        
        //bộ lọc
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

//lấy log theo id
export async function getLogById(req: Request, res: Response, next: NextFunction) {
    try {
        //xác thực
        const accountId = req.account?.id;
        const role = req.role;
        if(!accountId || !role) throw new HttpException(401, 'Unauthorized');

        const admin = getUserByAccountId(accountId);
        if(role !== "ADMIN" && !admin) throw new HttpException(401, 'Forbidden');

        const { id } = req.params;
        const log = await logService.getLogDetail(id as string);
        if (!log) return res.status(404).json({ message: "Log not found" });
        res.json(log);
    } catch (error) { next(error); }
}