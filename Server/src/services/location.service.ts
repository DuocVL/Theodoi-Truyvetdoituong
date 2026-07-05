import { CreateLocationHistoryDto } from "../dtos/location.dto";
import { HttpException } from "../exceptions/http-exception";
import { LocationRepository } from "../repositories/location.repository";
import { findById, getSubjectByAccountId } from "../repositories/subject.repository";
import { getUserByAccountId } from "../repositories/user.repository";

//xử lý nghiệp vụ liên quan đến lịch sử di chuyển

export class LocationService {
    private repository = new LocationRepository();

    public async saveLocation(data: CreateLocationHistoryDto, accountId: string) {

        //tìm kiếm subject
        const subject = await getSubjectByAccountId(accountId);
        if(!subject) throw new HttpException(403, 'Forbidden: User is not a subject');

        const location = await this.repository.create(subject.id, data);

        return location;
    }

    public async getHistory(subjectId: string, role: string, accountId: string, filters: any) {

        const { page, limit, from, to} = filters;
        console.log(filters)
        const subjectTarget = await findById(subjectId);
        if(!subjectTarget) throw new HttpException(404, "Subject not found");

        //kiểm tra quyền hạn
        if(role === "SUBJECT"){
            const subject = await getSubjectByAccountId(accountId);
            if(!subject) throw new HttpException(404, "Account not found");

            if(subject.id !== subjectId) throw new HttpException(403,"Forbidden")//không phải lịch sử của mình
        }else if(role === "USER"){//user chỉ lấy được lịch sử của người mình quản lý
            const user = await getUserByAccountId(accountId);
            if(!user) throw new HttpException(404, "User not found");

            if(subjectTarget.created_by !== user.id) throw new HttpException(403,"Forbidden")
        }

        // Xử lý giới hạn và phân trang
        const take = Math.min(Number(limit), 500);
        const skip = (Number(page) - 1) * take;

        return this.repository.getHistory({ subject_id: subjectId, from, to, skip, take });
    }
}