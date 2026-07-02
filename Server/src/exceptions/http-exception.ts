//Lớp xử lý lỗi tùy chỉnh
export class HttpException extends Error {
  public status: number;//mã reponse
  public message: string;//thông điệp mô tả lỗi

  //Hàm khởi tạo thiết lập 1 HttpException với status và message
  constructor(status: number, message: string) {
    super(message);//gọi hàm khởi tạo lớp cha Error
    this.status = status;
    this.message = message;
  }
}
