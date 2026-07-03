import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from "../dtos/auth.dto";
import * as accountRepository from '../repositories/account.repository';
import * as refreshTokenRepository from '../repositories/refreshtoken.repository';
import * as passwordResetTokenRepository from '../repositories/passwordResetToken.repository';
import * as activationService from './activation.service';
import { generateAccessToken, generateRefreshToken } from "../utils/token";
import { compareData, hashData } from '../utils/hash';
import { AccountPayload } from "../types/data";
import { HttpException } from "../exceptions/http-exception";
import { sendPasswordResetEmail } from './email.service';
import { AccountStatus, Prisma } from '../../generated/prisma/client';
import * as subjectRepository from '../repositories/subject.repository';
import { logger } from '../utils/log-helper'
import crypto from 'crypto';

//Xử lý đăng nhập
export const login = async (data: LoginDto) => {

    const account = await accountRepository.findByUsername(data.username);

    if (!account) {
        throw new HttpException(401, "Invalid username or password");
    }

    if (account.status === 'PENDING_ACTIVATION') {//kiểm tra trạng thái kích hoạt
        throw new HttpException(403, "Account is not activated. Please check your email.");
    }

    if (account.status !== "ACTIVE") {//trạng thái hoàn thành việc theo dõi
        throw new HttpException(403, `Account is ${account.status.toLowerCase()}`);
    }

    if (!account.password) {
        throw new HttpException(401, "Account has no password set. Please activate first.");
    }

    //Kiểm tra mật khẩu có hợp lệ không
    const isMatch = await compareData(data.password, account.password);
    if (!isMatch) {
        throw new HttpException(401, "Invalid username or password");
    }

    if (account.type === "SUBJECT") {//Xử lý nếu là đối tượng
        try {

            const subject = await subjectRepository.getSubjectByAccountId(account.id);//Lấy bản ghi subject

            //Nếu không tìm thấy subject tạo lỗi 
            if (!subject) {
                throw new Error(`Subject không tồn tại cho account_id: ${account.id}`);
            }

            //Xử lý fcm_token
            if(data.fcm_token) await subjectRepository.update(subject.id, {fcm_token: data.fcm_token});
            else await subjectRepository.update(subject.id, {fcm_token: null});

        } catch (error) {
            logger.error("Lỗi cập nhật FCM token cho Subject:", error);

        }
    }

    //xóa bỏ refreshtoken liên kết đến tài khaonr trên thiết bị này
    await refreshTokenRepository.deleteByAccountIdAndDeviceId(account.id, data.device_id);

    //Tạo payload để sinh acesstoken
    const payload: AccountPayload = {
        id: account.id,
        type: account.type,
        device_id: data.device_id
    };
    const accessToken = generateAccessToken(payload);

    //Tạo refreshtoken , và hash để lưu csdl
    const { plainToken: refreshToken, hashedToken } = generateRefreshToken();

    //lưu refreshtoken với thời gian tồn tại 60 ngày
    const tokenData: Prisma.RefreshTokenCreateInput = {
        token_hash: hashedToken,
        device_id: data.device_id,
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        account: {
            connect: { id: account.id }
        }
    };
    await refreshTokenRepository.create(tokenData);

    return {
        accessToken,
        refreshToken
    };
};

//TODOđăng ký cho cán bộ (bỏ)
export const register = async (data: RegisterDto) => {
    //kiểm tra trùng username
    const existingUsername = await accountRepository.findByUsername(data.username);
    if (existingUsername) {
        throw new HttpException(409, "Username already exists");
    }

    if (!data.email) {
        throw new HttpException(400, "Email is required");
    }

    //kiểm tra trùng lặp email
    const existingEmail = await accountRepository.findByEmail(data.email);
    if (existingEmail) {
        throw new HttpException(409, "Email already exists");
    }

    //mã hóa mật khẩu
    const hashedPassword = await hashData(data.password);

    //tạo 2 bản ghi account và user lồng nhau để đồng bộ
    const newAccount = await accountRepository.create({
        username: data.username,
        password: hashedPassword,
        email: data.email,
        type: "USER",
        user: { 
            create: {
                full_name: data.full_name,
            },
        },
    });

    try {
        //gửi email kích hoạt
        await activationService.createAndSendActivationToken(newAccount);
    } catch (error) {
        logger.error(`Failed to send activation email for ${newAccount.username}:`, error);
    }

    return { message: "Registration successful. Please check your email to activate your account." };
};


//xử lý kích hoạt tài khoản
export const activateAccount = async (data: { token: string }) => {
    const { token } = data;
    const activatedAccount = await activationService.activateAccount(token);

    return {
        message: "Account activated successfully.",
        username: activatedAccount.username
    };
};

//Cấp phát token mới
export const refreshToken = async (data: RefreshTokenDto) => {
    const { refreshToken: oldRefreshToken } = data;

    //băm token người dùng gửi lên để kiểm tra
    const hashedOldToken = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');

    //Tìm kiếm token trong csdl
    const tokenFromDb = await refreshTokenRepository.findByToken(hashedOldToken);
    //kiểm tra token có tồn tại , có còn hạn không
    if (!tokenFromDb || tokenFromDb.expires_at < new Date()) {
        throw new HttpException(401, "Invalid or expired refresh token");
    }

    //xóa refreshtoken cũ
    await refreshTokenRepository.deleteByToken(hashedOldToken);

    //kiểm tra tài khoản liên kết token có tồn tại không
    const account = await accountRepository.findById(tokenFromDb.account_id);
    if (!account) {
        throw new HttpException(401, "Invalid refresh token: Associated account not found.");
    }

    //tạo cặp token mới
    const newPayload: AccountPayload = {
        id: account.id,
        type: account.type,
        device_id: tokenFromDb.device_id
    };
    const newAccessToken = generateAccessToken(newPayload);
    const { plainToken: newRefreshToken, hashedToken: newHashedRefreshToken } = generateRefreshToken();

    //lưu trữ refreshtoken mới
    const newExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days from now
    const newTokenData: Prisma.RefreshTokenCreateInput = {
        token_hash: newHashedRefreshToken,
        device_id: tokenFromDb.device_id,
        expires_at: newExpiresAt,
        account: {
            connect: { id: account.id }
        }
    };
    await refreshTokenRepository.create(newTokenData);

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    };
};

//đăng xuất
export const logout = async (refreshToken: string, accountId: string, role: string) => {
    //băm mã token được gửi từ client
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await refreshTokenRepository.deleteByToken(hashedToken);
    //xóa fcm_token để không gửi cảnh báo về đây nữa nếu là subject
    if(role === "SUBJECT"){
        const subject = await subjectRepository.getSubjectByAccountId(accountId);
        if(!subject) throw new Error(`Subject không tồn tại cho account_id: ${accountId}`);

        await subjectRepository.update(subject.id, {fcm_token: null})//xóa fcm_token ko gửi nhầm thông báo
    }

};

//xử lý quên mật khẩu
export const forgotPassword = async (data: ForgotPasswordDto) => {
    //tìm kiếm tài khoản liên kết đến email này
    const account = await accountRepository.findByEmail(data.email);
    if (!account) {
        logger.error(`Password reset requested for non-existent email: ${data.email}`);
        throw new HttpException(403, `Password reset requested for non-existent email: ${data.email}`);
    }

    if (account.status !== "ACTIVE") {//trạng thái hoàn thành việc theo dõi
        throw new HttpException(403, `Account is ${account.status.toLowerCase()}`);
    }


    const token = crypto.randomBytes(32).toString('hex');//sinh token quên mật khẩu
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);//tồn tại 1 giừo
    try {
        await passwordResetTokenRepository.create(account.id, token, expiresAt);
        await sendPasswordResetEmail(account.email!, token);
    } catch (error) {
        logger.error("Lỗi",error);
        throw new HttpException(500, `Lỗi`);
    }
    
};

//dổi mật khẩu
export const resetPassword = async (data: ResetPasswordDto) => {
    const { token, newPassword } = data;

    //tìm token đổi mật khẩu
    const passwordResetToken = await passwordResetTokenRepository.findByToken(token);

    if (!passwordResetToken || passwordResetToken.expires_at < new Date()) {
        if (passwordResetToken) await passwordResetTokenRepository.deleteByToken(token);
        throw new HttpException(400, "Invalid or expired token");
    }

    const hashedPassword = await hashData(newPassword);
    await accountRepository.updatePassword(passwordResetToken.account_id, hashedPassword);
    await passwordResetTokenRepository.deleteByToken(token);
};

//lấy thông tin tài khoản
export const getMe = async (accountId: string) => {

    //truy vấn dữ liệu tài khoản
    const account = await accountRepository.findByIdWithUserProfile(accountId);
    if (!account) {
        throw new HttpException(404, "Account not found");
    }

    //xử lý nếu là subject
    if (account.type === 'SUBJECT') {
        if (!account.subject) {
            logger.error(`Data inconsistency: Account ${accountId} is SUBJECT but has no subject record.`);
            throw new HttpException(404, "Associated subject data not found for this account.");
        }
        return account.subject;
    } else if (account.type === 'USER') {
        if (!account.user) {
            console.error(`Data inconsistency: Account ${accountId} is USER but has no user record.`);
            // Sửa lỗi: Thay vì 500, trả về 404 để client có thể xử lý (vd: logout)
            throw new HttpException(404, "Associated user data not found for this account.");
        }
        return account.user;
    }

    throw new HttpException(500, `Unknown or unhandled account type for account ${accountId}`);
};

//xử lý gửi lại email active
export const resendEmailActive = async(email: string) => {
    //Kiểm tra tài khoản với email
    const account = await accountRepository.findByEmail(email);
    if(!account){
        throw new HttpException(404, "Account not found");
    }

    //kiểm tra tài khoản có thuộc trạng thái cần kích hoạt không
    if(account.status !== AccountStatus.PENDING_ACTIVATION){
        throw new HttpException(403, `Account is ${account.status.toLowerCase()}`);
    }

    try {
        //gửi email kích hoạt
        await activationService.createAndSendActivationToken(account);
    } catch (error) {
        logger.error(`Failed to send activation email for ${account.username}:`, error);
    }

    return { message: "Send email activation succeful" };
}