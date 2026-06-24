import { Request, Response } from "express";
import { LocationService } from "../services/location.service";

export class LocationController {
    private service = new LocationService();

    create = async (req: Request, res: Response) => {
        try {
            const location = await this.service.saveLocation(req.body);

            return res.json({
                success: true,
                data: location,
            });
        } catch {
            return res.status(500).json({
                message: "save location failed",
            });
        }
    };

    history = async (req: Request, res: Response) => {
        try {
            const { subject_id } = req.params;
            const { from, to, page, limit } = req.query;
            console.log(subject_id, from, to, page, limit)

            // Ép kiểu ngay tại đây để Service yên tâm xử lý logic
            const result = await this.service.getHistory({
                subject_id,
                from: from ? new Date(from as string) : undefined,
                to: to ? new Date(to as string) : undefined,
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 25
            });

            return res.json({ success: true, ...result });
        } catch (error) {
            console.error("History Error:", error);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    };
}