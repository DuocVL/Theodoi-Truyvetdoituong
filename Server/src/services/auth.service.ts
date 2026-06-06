import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from "../dtos/auth.dto";
import * as accountRepository from '../repositories/account.repository';
import * as refreshTokenRepository from '../repositories/refreshtoken.repository';
import * as passwordResetTokenRepository from '../repositories/passwordResetToken.repository';
import * as activationService from './activation.service';
import { generateAccessToken, generateRefreshToken } from "../utils/token";
import { compareData, hashData } from '../utils/hash';
import { AccountPayload  } from "../types/data";
import { HttpException } from "../exceptions/http-exception";
import { sendPasswordResetEmail } from '../utils/email';
import { env } from '../configs/env';
import { Prisma } from '../../generated/prisma/client';
import crypto from 'crypto';
import jwt  from "jsonwebtoken";

export const login = async (data: LoginDto) => {
    const account = await accountRepository.findByUsername(data.username);

    if (!account) {
        throw new HttpException(401, "Invalid username or password");
    }

    if (account.status === 'PENDING_ACTIVATION') {
        throw new HttpException(403, "Account is not activated. Please check your email.");
    }

    if (account.status !== "ACTIVE") {
        throw new HttpException(403, `Account is ${account.status.toLowerCase()}`);
    }

    if (!account.password) {
        throw new HttpException(401, "Account has no password set. Please activate first.");
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
    const { plainToken: refreshToken, hashedToken } = generateRefreshToken();

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

export const register = async (data: RegisterDto) => {
    const existingUsername = await accountRepository.findByUsername(data.username);
    if (existingUsername) {
        throw new HttpException(409, "Username already exists");
    }

    if (!data.email) {
        throw new HttpException(400, "Email is required");
    }

    const existingEmail = await accountRepository.findByEmail(data.email);
    if (existingEmail) {
        throw new HttpException(409, "Email already exists");
    }

    const hashedPassword = await hashData(data.password);

    const newAccount = await accountRepository.create({
        username: data.username,
        password: hashedPassword,
        email: data.email,
        type: "USER"
    });

    try {
        await activationService.createAndSendActivationToken(newAccount);
    } catch (error) {
        console.error(`Failed to send activation email for ${newAccount.username}:`, error);
        // We still return success to the user, but log the failure.
        // The user can request a new activation link later.
    }

    return { message: "Registration successful. Please check your email to activate your account." };
};

// data được định nghĩa lại inline nếu DTO bị thiếu
export const activateAccount = async (data: { token: string }) => {
    const { token } = data;
    const activatedAccount = await activationService.activateAccount(token);

    return {
        message: "Account activated successfully.",
        username: activatedAccount.username
    };
};


export const refreshToken = async (data: RefreshTokenDto) => {
    const { refreshToken: oldRefreshToken } = data;
    console.log(oldRefreshToken);
    
    // 1. Verify and decode the old refresh token
    let decoded: AccountPayload;
    try {
        decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET) as AccountPayload;
    } catch {
        throw new HttpException(401, "Invalid refresh token");
    }

    const hashedOldToken = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');

    // 2. Find the token in the database
    const tokenFromDb = await refreshTokenRepository.findByToken(hashedOldToken);

    if (!tokenFromDb) {
        // SECURITY: If the token is not in the DB, it might have been stolen and used.
        // Invalidate all tokens for this user as a precaution.
        // await refreshTokenRepository.deleteAllByAccountId(decoded.id);
        throw new HttpException(401, "Invalid refresh token");
    }

    // 3. (Important) Delete the used refresh token
    await refreshTokenRepository.deleteByToken(hashedOldToken);

    // 4. Generate a new access token AND a new refresh token (Token Rotation)
    const newPayload: AccountPayload = { id: decoded.id, type: decoded.type, device_id: decoded.device_id };
    const newAccessToken = generateAccessToken(newPayload);
    const { plainToken: newRefreshToken, hashedToken: newHashedRefreshToken } = generateRefreshToken();

    // 5. Save the new refresh token to the database
    const newTokenData: Prisma.RefreshTokenCreateInput = {
        token_hash: newHashedRefreshToken,
        device_id: decoded.device_id,
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        account: {
            connect: { id: decoded.id }
        }
    };

    await refreshTokenRepository.create(newTokenData);

    // 6. Return both new tokens to the client
    return { 
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    };
};

export const logout = async (refreshToken: string) => {
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await refreshTokenRepository.deleteByToken(hashedToken);
};

export const forgotPassword = async (data: ForgotPasswordDto) => {
    const account = await accountRepository.findByEmail(data.email);
    if (!account) {
        console.warn(`Password reset requested for non-existent email: ${data.email}`);
        return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await passwordResetTokenRepository.create(account.id, token, expiresAt);
    await sendPasswordResetEmail(account.email!, token);
};

export const resetPassword = async (data: ResetPasswordDto) => {
    const { token, newPassword } = data;

    const passwordResetToken = await passwordResetTokenRepository.findByToken(token);

    if (!passwordResetToken || passwordResetToken.expires_at < new Date()) {
        if(passwordResetToken) await passwordResetTokenRepository.deleteByToken(token);
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

    if (account.type === 'SUBJECT') {
        if (!account.subject) {
            console.error(`Data inconsistency: Account ${accountId} is SUBJECT but has no subject record.`);
            throw new HttpException(500, "Internal Server Error: Data inconsistency");
        }
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
    } else if (account.type === 'USER') {
        if (!account.user) {
            console.error(`Data inconsistency: Account ${accountId} is USER but has no user record.`);
            throw new HttpException(500, "Internal Server Error: Data inconsistency");
        }
        return account.user;
    }
    
    throw new HttpException(500, `Unknown or unhandled account type for account ${accountId}`);
};
