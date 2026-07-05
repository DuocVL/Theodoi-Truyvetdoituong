import { Request, Response } from "express";
import { LocationService } from "../services/location.service";
import { HttpException } from "../exceptions/http-exception";
import { CreateLocationHistoryDto } from "../dtos/location.dto";

//Xử lý các yêu cầu lấy lịch sử vị trí 
export class LocationController {

    private service = new LocationService();

    //tạo bản ghi lịch xử mới
    public create = async (req: Request, res: Response) => {
        try {
            
            //xác thực
            const accountId = req.account?.id;
            const role = req.role;
            if(!accountId || !role) throw new HttpException(401, 'Unauthorized');

            //chỉ subject tạo bản ghi
            if(role !== "SUBJECT") return res.status(403).json("Forbidden");

            const data: CreateLocationHistoryDto = req.body;//dữ liệu vị trí

            //lưu lịch sử di chuyển
            const location = await this.service.saveLocation(data, accountId);

            return res.json({ success: true, data: location });
        } catch {
            return res.status(500).json({
                message: "save location failed",
            });
        }
    };

    //lấy lịch sử vị trí
    public history = async (req: Request, res: Response) => {
        try {
            //xác thực
            const accountId = req.account?.id;
            const role = req.role;
            if(!accountId || !role) throw new HttpException(401, 'Unauthorized');

            //lấy các thông tin bộ lọc
            const { subject_id } = req.params;
            const { from, to, page, limit } = req.query;

            // Ép kiểu ngay tại đây để Service yên tâm xử lý logic
            const result = await this.service.getHistory(
                subject_id as string, role, accountId,
                {
                    from: from ? new Date(from as string) : undefined,
                    to: to ? new Date(to as string) : undefined,
                    page: page ? Number(page) : 1,
                    limit: limit ? Number(limit) : 25
                }
            );

            return res.json({ success: true, ...result });
        } catch (error) {
            console.error("History Error:", error);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    };
}