import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from "../dtos/auth.dto";
import * as accountRepository from '../repositories/account.repository';
import * as refreshTokenRepository from '../repositories/refreshtoken.repository';
import * as passwordResetTokenRepository from '../repositories/passwordResetToken.repository';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/token";
import { compareData, hashData } from '../utils/hash';
import { AccountPayload, CreateRefreshTokenInput } from "../types/data";
import { HttpException } from "../middlewares/error.middleware";
import { sendPasswordResetEmail } from '../utils/email';
import crypto from 'crypto';

export const login = async (data: LoginDto) => {
    const account = await accountRepository.findByUsername(data.username);

    if (!account) {
        throw new HttpException(401, "Invalid username or password");
    }

    if (account.status !== "ACTIVE") {
        throw new HttpException(403, "Account is not active");
    }

    const isMatch = await compareData(data.password, account.password);

    if (!isMatch) {
        throw new HttpException(401, "Invalid username or password");
    }

    const payload: AccountPayload = {
        id: account.id,
        type: account.type,
        device_id: data.device_id
    };

    const accessToken = generateAccessToken(payload);
    const { token: refreshToken, hashedToken } = generateRefreshToken();

    const tokenData: CreateRefreshTokenInput = {
        token_hash: hashedToken,
        device_id: data.device_id,
        account_id: account.id
    };
    
    await refreshTokenRepository.create(tokenData);

    return {
        accessToken,
        refreshToken
    };
};

export const register = async (data: RegisterDto) => {
    const existingAccount = await accountRepository.findByUsername(data.username);
    if (existingAccount) {
        throw new HttpException(409, "Username already exists");
    }

    const hashedPassword = await hashData(data.password);

    const newAccount = await accountRepository.create({
        ...data,
        password: hashedPassword,
        type: "USER" // Only allow USER registration
    });

    return newAccount;
};

export const refreshToken = async (data: RefreshTokenDto) => {
    const { refreshToken: oldRefreshToken } = data;
    const { hashedToken, payload } = verifyRefreshToken(oldRefreshToken);

    const tokenFromDb = await refreshTokenRepository.findByToken(hashedToken);

    if (!tokenFromDb) {
        throw new HttpException(401, "Invalid refresh token");
    }

    if (tokenFromDb.device_id !== payload.device_id) {
        throw new HttpException(403, "Refresh token not valid for this device");
    }

    const newPayload: AccountPayload = {
        id: payload.id,
        type: payload.type,
        device_id: payload.device_id
    };

    const accessToken = generateAccessToken(newPayload);

    return { accessToken };
};

export const logout = async (refreshToken: string) => {
    const { hashedToken } = verifyRefreshToken(refreshToken);
    await refreshTokenRepository.deleteByToken(hashedToken);
};

export const forgotPassword = async (data: ForgotPasswordDto) => {
    const account = await accountRepository.findByEmail(data.email);
    if (!account) {
        // Don't reveal that the user doesn't exist
        return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await passwordResetTokenRepository.create(account.id, token, expiresAt);

    await sendPasswordResetEmail(account.email, token);
};

export const resetPassword = async (data: ResetPasswordDto) => {
    const { token, newPassword } = data;

    const passwordResetToken = await passwordResetTokenRepository.findByToken(token);

    if (!passwordResetToken) {
        throw new HttpException(400, "Invalid or expired token");
    }

    if (passwordResetToken.expires_at < new Date()) {
        await passwordResetTokenRepository.deleteByToken(token);
        throw new HttpException(400, "Invalid or expired token");
    }

    const hashedPassword = await hashData(newPassword);

    await accountRepository.updatePassword(passwordResetToken.account_id, hashedPassword);

    await passwordResetTokenRepository.deleteByToken(token);
};

export const getMe = async (accountId: string) => {
    const account = await accountRepository.findByIdWithRelations(accountId);
    if (!account) {
        throw new HttpException(404, "Account not found");
    }

    if (account.type === 'SUBJECT' && account.subject) {
        // format response to match SubjectData in client
        return {
            id: account.subject.id,
            full_name: account.subject.full_name,
            dob: account.subject.dob,
            gender: account.subject.gender,
            id_number: account.subject.id_number,
            address: account.subject.address,
            phone: account.subject.phone,
            monitoring_start: account.subject.monitoring_start,
            monitoring_end: account.subject.monitoring_end,
            account: {
                username: account.username,
                email: account.email,
                status: account.status
            },
            check_ins: account.subject.checkin
        };
    } else if (account.type === 'USER' && account.user) {
        return account.user;
    }

    return account;
};
