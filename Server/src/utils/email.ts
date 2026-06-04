import nodemailer from 'nodemailer';
import { env } from '../configs/env';

const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: Number(env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    },
});

export const sendPasswordResetEmail = async (to: string, token: string) => {
    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
        from: '"Theodoitruyvetdoituong" <noreply@theodoitruyvetdoituong.com>',
        to: to,
        subject: 'Password Reset Request',
        html: `Click <a href="${resetLink}">here</a> to reset your password.`,
    });
};

export const sendActivationEmail = async (to: string, token: string) => {
    const activationLink = `${env.FRONTEND_URL}/activate-account?token=${token}`;
    await transporter.sendMail({
        from: '"Theodoitruyvetdoituong" <noreply@theodoitruyvetdoituong.com>',
        to: to,
        subject: 'Account Activation',
        html: `Welcome! Click <a href="${activationLink}">here</a> to activate your account.`,
    });
};