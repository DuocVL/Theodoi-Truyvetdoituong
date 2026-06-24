import { LocationRepository } from "../repositories/location.repository";

export class LocationService {
    private repository = new LocationRepository();

    saveLocation(data: any) {
        return this.repository.create(data);
    }

    async getHistory(params: any) {
        const { subject_id, page = 1, limit = 100 } = params;

        // Xử lý giới hạn và phân trang
        const take = Math.min(Number(limit), 500);
        const skip = (Number(page) - 1) * take;

        // Thiết lập thời gian mặc định (hôm nay) nếu không có
        const from = params.from ? new Date(params.from) : new Date(new Date().setHours(0, 0, 0, 0));
        const to = params.to ? new Date(params.to) : new Date(new Date().setHours(23, 59, 59, 999));

        return this.repository.getHistory({ subject_id, from, to, skip, take });
    }
}