import { Request, Response, NextFunction } from 'express';
import { ImageService } from '../services/image.service';
import { HttpException } from '../exceptions/http-exception';
import { findById, getSubjectByAccountId, update } from '../repositories/subject.repository';
import { getUserByAccountId, updateUser } from '../repositories/user.repository';
import path from 'path';
import { connect } from 'http2';

//xử lý yêu cầu liên quan đến ảnh
export class ImageController {
  private imageService = new ImageService();

  //xử lý tải lên ảnh
  public uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;//file do upload middleware gán vào req
      const uploadType = req.body.uploadType as any; // 'avatars', 'checkins',

      //không có file image được tải nên
      if (!file) {
        return next(new HttpException(400, 'No file uploaded.'));
      }
      //không có type đính kèm trả lỗi
      if (!uploadType) {
        return next(new HttpException(400, 'uploadType is required.'));
      }

      //Tạo bản ghi ảnh mới trong csdl
      const newImage = await this.imageService.uploadImage(file, uploadType);

      //cập nhật nếu là avatar
      if(uploadType === "avatars"){
        //kiểm tra thông tin xác thực
        const accountId = req.account?.id;
        const role = req.role;

        if(!accountId || !role) throw new HttpException(401, 'Unauthorized');

        if(role === "SUBJECT"){
          const subject = await getSubjectByAccountId(accountId);
          if(!subject) throw new HttpException(403, "Access denied. Subject profile missing.");

          //xóa bản ghi avartarid cũ
          if(subject.avatar_id) await this.imageService.deleteImage(subject.avatar_id);

          //Liên kết với ảnh mới
          await update(subject.id, {avatar: {connect: {id: newImage.id} }});

        }else{
          const user = await getUserByAccountId(accountId);
          if(!user) throw new HttpException(403, "Access denied. Subject profile missing.");

          //xóa bản ghi avartarid cũ
          if(user.avatar_id) await this.imageService.deleteImage(user.avatar_id);

          //Liên kết với ảnh mới
          await updateUser(user.id, {avatar: {connect: {id: newImage.id} }});
        }
      }

      res.status(201).json({
        message: 'Image uploaded successfully',
        data: newImage
      });

    } catch (error) {
      next(error);
    }
  }

  //Lấy ảnh theo id
  public getImageById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const imageId = req.params.id as string;
      console.log(imageId)

      //kiểm tra các thông số xác thực
      const accountId = req.account?.id
      const role = req.role
      if (!accountId || !role) throw new HttpException(401, 'Unauthorized');

      //lấy bản ghi ảnh trong csdl
      const image = await this.imageService.getImage(imageId);

      //kiểm tra qquyeenf truy cập với subject
      if (role === "SUBJECT") {
        const subject = await getSubjectByAccountId(accountId);
        if (!subject) throw new HttpException(403, "Access denied. Subject profile missing.");

        //kiểm tra là ảnh checkin nhưng ko phải do subject đó tạo ra -> từ chối
        if (image.checkinImage && image.checkinImage.subject_id !== subject.id) throw new HttpException(403, "Access denied. You do not own this check-in record.");
        //ảnh avatar nhưng không phải của người đó
        if (image.subjectAvatar && image.subjectAvatar.id !== subject.id) throw new HttpException(403, "Access denied. You cannot view another subject's avatar.");

      } else if (role === "USER") {
        //không tìm thấy user đó
        const user = await getUserByAccountId(accountId);
        if (!user) throw new HttpException(403, "Access denied. User profile missing.");

        //kiểm tra là ảnh checkin nhưng ko có thẩm quyền
        if (image.checkinImage) {
          const subject = await findById(image.checkinImage.subject_id);
          console.log(subject)
          if (!subject || subject.created_by !== user.id) throw new HttpException(403, "Access denied. You do not manage this subject.");

        }else{//là ảnh avatar chỉ có thể xem avatar người mình đang quản lý /chính mình
          //nếu là user avatar chỉ có thể xem của chính mình
          if(image.userAvatar && image.userAvatar.id !== user.id) throw new HttpException(403, "Access denied. You cannot view another user's avatar.");

          //nếu là avatar kiểm xem có quản lý không
          if(image.subjectAvatar){
            const subject = await findById(image.subjectAvatar.id);
            if (!subject || subject.created_by !== user.id) throw new HttpException(403, "Access denied. You do not manage this subject.");
          }
        }
      }

      //tạo đường dẫn tuyệt đối đến ảnh đó và trả về ảnh 
      const filePath = path.join(__dirname, '../../', image.url);
      res.sendFile(filePath);

    } catch (error) {
      next(error);
    }
  }

  //xóa ảnh
  public deleteImageById = async (req: Request, res: Response, next: NextFunction) => {
    try {

      const imageId = req.params.id as string;//lấy imageId từ params
      await this.imageService.deleteImage(imageId);

      res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
