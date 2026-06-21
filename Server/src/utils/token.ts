import jwt from 'jsonwebtoken';
import { env } from '../configs/env.js';
import { AccountPayload } from '../types/data.js';
import crypto from 'crypto';

interface RefreshTokenResult {
    plainToken: string;
    hashedToken: string;
}

const expiresIn = '30m';

export const generateAccessToken = (payload: AccountPayload) => {
    return jwt.sign(
        payload,
        env.JWT_SECRET,
        {
            algorithm: 'HS256',
            expiresIn: expiresIn,
        }
    );
}

export const generateRefreshToken = (): RefreshTokenResult => {
    const plainToken = crypto.randomBytes(40).toString('hex');

    const hashedToken = crypto
        .createHash('sha256')
        .update(plainToken)
        .digest('hex');

    return {
        plainToken,
        hashedToken,
    };
}





