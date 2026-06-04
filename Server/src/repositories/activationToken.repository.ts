import { prisma } from '../configs/prisma';
import { ActivationToken } from '../../generated/prisma/client';

/**
 * Creates a new activation token in the database.
 * @param accountId - The ID of the account to associate the token with.
 * @param token - The unique activation token.
 * @param expiresAt - The expiration date of the token.
 * @returns The newly created activation token.
 */
export const create = async (accountId: string, token: string, expiresAt: Date): Promise<ActivationToken> => {
    return await prisma.activationToken.create({
        data: {
            account_id: accountId,
            token: token,
            expires_at: expiresAt,
        },
    });
};

/**
 * Finds an activation token by the token string, including the associated account.
 * @param token - The token string to find.
 * @returns The activation token with its account, or null if not found.
 */
export const findByToken = async (token: string): Promise<(ActivationToken & { account: import('../../generated/prisma/client').Account }) | null> => {
    return await prisma.activationToken.findUnique({
        where: { token },
        include: { account: true },
    });
};

/**
 * Deletes an activation token by its ID.
 * @param id - The ID of the token to delete.
 * @returns The deleted activation token.
 */
export const deleteById = async (id: string): Promise<ActivationToken> => {
    return await prisma.activationToken.delete({ where: { id } });
};
