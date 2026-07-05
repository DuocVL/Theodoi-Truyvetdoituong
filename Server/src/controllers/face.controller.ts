import { NextFunction, Request, Response } from 'express';
import { FaceService } from '../services/face.service';
import { HttpException } from '../exceptions/http-exception';
import { RegisterFaceDto } from '../dtos/face.dto';


//xử lý các yêu cầu liên quan đến khuôn mặt

export class FaceController {
  private faceService = new FaceService()

  //xử lý subject đăng ký khuôn mặt
  public register = async ( req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      //xác thwucj thông tin
      const accountId = req.account?.id;
      const role = req.role;
      if(!accountId || !role) throw new HttpException(401, 'Unauthorized');
      if(role !== "SUBJECT") throw new HttpException(401, 'No subject');
      
      const registerData: RegisterFaceDto = req.body;//lấy dữ liệu đăng ký      

      //thực hiện đăng ký sẽ xóa bản ghi cũ nếu nó tồn tại
      const newFaceData = await this.faceService.registerFace(accountId, registerData.embedding);

      res.status(201).json({ 
        message: 'Face registered successfully.',
        data: newFaceData,
      });

    } catch (error) {
      next(error);
    }
  };

  //xử lý việc láy dữ liệu face data của subject yêu cầu
  public getMyFaceData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      const role = req.role;
      if(!accountId || !role) throw new HttpException(401, 'Unauthorized');
      if(role !== "SUBJECT") throw new HttpException(401, 'No subject');

      const faceData = await this.faceService.getFaceDataForSubject(accountId);

      res.status(200).json({ data: faceData });

    } catch (error) {
      next(error);
    }
  };
}
