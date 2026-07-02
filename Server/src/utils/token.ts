import jwt from 'jsonwebtoken';
import { env } from '../configs/env.js';
import { AccountPayload } from '../types/data.js';
import crypto from 'crypto';

//định nghĩa dữ liệu trả về
interface RefreshTokenResult {
    plainToken: string;
    hashedToken: string;
}

//thời gian hết hạn access token
const expiresIn = '30m';

//sinh mã assettoken dạng JsonWebToken payload định danh tài khoản dùng JWT thuật toán HMAC SHA256
//->header.payload.signature đều được mã háo base64, header 36ki tự gốc 27byte, payload tùy 90-130, signature 43(gốc 32)
export const generateAccessToken = (payload: AccountPayload) => {
    return jwt.sign(
        payload,
        env.JWT_SECRET,//key dùng ký token
        {
            algorithm: 'HS256',
            expiresIn: expiresIn,
        }
    );
}

//Sinh refreshtoken và hashrefreshtoken 
export const generateRefreshToken = (): RefreshTokenResult => {

    //tạo refreshtoken tạo ra 40 bytes dữ liệu ngẫu nhiên và chuyển sang hex 80 kí tự (1byte=2kí tựhex)
    const plainToken = crypto.randomBytes(40).toString('hex');

    //băm refreshtoken để lưu csdl bằng tt sha256 ->64 kí tự hex 
    const hashedToken = crypto
        .createHash('sha256')
        .update(plainToken)
        .digest('hex');

    return {
        plainToken,
        hashedToken,
    };
}