import { LocationRepository } from "../repositories/location.repository";

export class LocationService {
    private repository = new LocationRepository();

    saveLocation(data: any) {
        return this.repository.create(data);
    }

    async getHistory(params: any) {
        const { subject_id, page, limit, from, to} = params;

        // Xử lý giới hạn và phân trang
        const take = Math.min(Number(limit), 500);
        const skip = (Number(page) - 1) * take;

        console.log(subject_id, from, to, page, limit);

        return this.repository.getHistory({ subject_id, from, to, skip, take });
    }
}