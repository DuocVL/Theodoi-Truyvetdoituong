import { prisma } from '../configs/prisma';
import { RefreshToken, Prisma } from '../../generated/prisma/client';

/**
 * Creates a new refresh token in the database.
 * @param data - The data for the new refresh token, including token hash, device ID, and account ID.
 * @returns The newly created refresh token.
 */
export const create = async (data: Prisma.RefreshTokenCreateInput): Promise<RefreshToken> => {
    return await prisma.refreshToken.create({ 
        data: data
    });
};

/**
 * Finds a refresh token by its hash.
 * @param token_hash - The hash of the token to find.
 * @returns The refresh token if found, otherwise null.
 */
export const findByToken = async (token_hash: string): Promise<RefreshToken | null> => {
    return await prisma.refreshToken.findUnique({ where: { token_hash } });
};

/**
 * Deletes a refresh token by its hash.
 * @param token_hash - The hash of the token to delete.
 * @returns The deleted refresh token.
 */
export const deleteByToken = async (token_hash: string): Promise<RefreshToken> => {
    return await prisma.refreshToken.delete({ where: { token_hash } });
};
