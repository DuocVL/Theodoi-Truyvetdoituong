import crypto from 'crypto';
import * as activationTokenRepository from '../repositories/activationToken.repository';
import * as accountRepository from '../repositories/account.repository';
import { sendActivationEmail } from '../services/email.service';
import { HttpException } from '../exceptions/http-exception';
import { Account } from '../../generated/prisma/client';
import {logger} from '../utils/log-helper'

//thời gian hết hạn của mã kích hoạt (mặc định 24h)
const ACTIVATION_TOKEN_EXPIRES_IN = 24 * 3600 * 1000; // 24 hours

//tạo token kích hoạt và gửi email 
export const createAndSendActivationToken = async (account: Account) => {
    if (!account.email) {
        //lỗi hệ thống khi chưa có email
        logger.error(`Account ${account.id} created without an email. Skipping activation.`);
        return;
    }

    const token = crypto.randomBytes(32).toString('hex');//tạo mã kích hoạt ngẫu nhiêu 64hex
    const expiresAt = new Date(Date.now() + ACTIVATION_TOKEN_EXPIRES_IN);//thời gian hết hạn

    await activationTokenRepository.create(account.id, token, expiresAt);//tạo token kích hoạt tài khoản
    await sendActivationEmail(account.email, token);
};

//TODOXử lý việc kích hoạt tài khoản user (có thể phải bỏ)
export const activateAccount = async (token: string) => {

    const activationToken = await activationTokenRepository.findByToken(token);
    if (!activationToken) {
        throw new HttpException(400, "Invalid or expired activation token");
    }

    //kiểm tra thời gian hết hạn
    if (activationToken.expires_at < new Date()) {
        //hết hạn xóa token cũ yêu cầu lấy token lại
        await activationTokenRepository.deleteById(activationToken.id);
        throw new HttpException(400, "Activation token has expired");
    }

    //kiểm tra trạng thái tài khoản và cập nhật nếu trạng thái chưa active
    const account = activationToken.account;
    if (account.status !== 'PENDING_ACTIVATION') {
        //tài khoản ko thuộc trạng thái cần active
        await activationTokenRepository.deleteById(activationToken.id);
        throw new HttpException(400, `Account is already ${account.status.toLowerCase()}.`);
    }
    const updatedAccount = await accountRepository.updateStatus(account.id, 'ACTIVE');

    //xóa token active
    await activationTokenRepository.deleteById(activationToken.id);

    return updatedAccount;
};
