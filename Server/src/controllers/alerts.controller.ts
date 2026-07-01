import { Request, Response, NextFunction } from 'express';
import * as alertService from '../services/alerts.service';
import { getUserByAccountId } from '../repositories/user.repository'
import { findById, getSubjectByAccountId } from '../repositories/subject.repository'

//Lấy danh sách cảnh báo có phân trang
export const getAlertsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //Lấy các tham số phân trang nếu có
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 15;

        // Trích xuất các tham số lọc từ query string kiểu , thời gian đầu , thời gian kết thúc
        const filters = {
            type: req.query.type as string,
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        };

        //Kiểm tra role do middleware tạo có tồn tại không
        const role = req.role
        if (!role) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        //Lấy userId, subjectId
        const accountId = req.account?.id as string
        let userId
        let subjectId

        if (role === "USER" || role === "ADMIN") {//Lấy userId bằng thông tin accountId
            const user = await getUserByAccountId(accountId);
            userId = user?.id;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized: Account ID not found' });
                return;
            }
        } else {
            const subject = await getSubjectByAccountId(accountId);//Lấy subjectId từ thông tin accountId
            subjectId = subject?.id;
            if (!subjectId) {
                res.status(401).json({ message: 'Unauthorized: Account ID not found' });
                return;
            }
        }

        // Lấy các alert cùng với các tham số 
        const result = await alertService.findAllAlerts(role, page, limit,filters, userId, subjectId);

        res.status(200).json({
            data: result.alerts,
            pagination: { current: page, total: result.total, limit,totalPages: Math.ceil(result.total / limit) }
        });
    } catch (error) { next(error); }
};

//Lấy chi tiết thông tin 1 Alert
export const getAlertDetailController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;//Lấy id Alert
    const alert = await alertService.getAlertDetail(id as string);//Lấy alert

    //Kiểm tra quyền đọc với alert
    const role = req.role
    console.log(role)
    if (!role) {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }
    
    if(role === "SUBJECT"){//Nếu là subject kiểm tra có cùng subjectId giữa alert và account yêu cấu không
        const subject = await getSubjectByAccountId(req.account?.id as string)
        if(!subject || alert.subject_id !== subject?.id){
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
    }else if( role === "USER"){//nếu là user kiểm tra user có quản lý subject liên quan alert đó không
        const subject = await findById(alert.subject_id)
        const user = await getUserByAccountId(req.account?.id as string)
        if(!user || !subject || user.id !== subject.created_by){
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
    }

    return res.status(200).json({ success: true, data: alert });
  } catch (error: any) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

//Tạo Alert mới
export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const alert = await alertService.createAlert(req.body);
        res.status(201).json(alert);
    } catch (error) { next(error); }
};