import crypto from 'crypto';
import * as activationTokenRepository from '../repositories/activationToken.repository';
import * as accountRepository from '../repositories/account.repository';
import { sendActivationEmail } from '../utils/email';
import { HttpException } from '../middlewares/error.middleware';
import { Account } from '../../generated/prisma/client';

const ACTIVATION_TOKEN_EXPIRES_IN = 24 * 3600 * 1000; // 24 hours

/**
 * Creates an activation token for a new account and sends the activation email.
 * This function should be called within a transaction after the account is created.
 * @param account - The newly created account object.
 */
export const createAndSendActivationToken = async (account: Account) => {
    if (!account.email) {
        // Or handle this case as per business requirements
        console.warn(`Account ${account.id} created without an email. Skipping activation.`);
        return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ACTIVATION_TOKEN_EXPIRES_IN);

    await activationTokenRepository.create(account.id, token, expiresAt);
    await sendActivationEmail(account.email, token);
};

/**
 * Activates an account using the provided token.
 * @param token - The activation token from the user.
 * @returns The activated account.
 */
export const activateAccount = async (token: string) => {
    const activationToken = await activationTokenRepository.findByToken(token);

    if (!activationToken) {
        throw new HttpException(400, "Invalid or expired activation token");
    }

    if (activationToken.expires_at < new Date()) {
        // Optionally, add logic to resend a new token
        await activationTokenRepository.deleteById(activationToken.id);
        throw new HttpException(400, "Activation token has expired");
    }

    const account = activationToken.account;

    if (account.status !== 'PENDING_ACTIVATION') {
        // This could mean the account is already active or suspended.
        // In any case, the token has served its purpose.
        await activationTokenRepository.deleteById(activationToken.id);
        throw new HttpException(400, `Account is already ${account.status.toLowerCase()}.`);
    }

    // Update account status to ACTIVE
    const updatedAccount = await accountRepository.updateStatus(account.id, 'ACTIVE');

    // Clean up the used token
    await activationTokenRepository.deleteById(activationToken.id);

    return updatedAccount;
};
