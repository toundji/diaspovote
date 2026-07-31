// ============================================================
// UNIFIED AUTH — mail.service.ts
// Ajoute les jobs email dans la queue BullMQ.
// N'envoie PAS directement — délègue au worker.
//
// Avantage : la réponse au client est immédiate.
// L'email est envoyé en arrière-plan par mail.processor.ts
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { User } from '../users/entities/user.entity';
import {
    MAIL_QUEUE, MailJobType,
    ConfirmEmailJob, ResetPasswordJob,
    ResetPinJob, ResetLinkJob,
} from './mail.types';

@Injectable()
export class MailService {

    constructor(
        @InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue,
    ) { }

    // ── Confirmation email ────────────────────────────────────

    async sendUserConfirmation(user: User, otp: string): Promise<void> {
        const job: ConfirmEmailJob = {
            type: MailJobType.CONFIRM_EMAIL,
            to: user.email!,
            firstName: user.firstName ?? 'Utilisateur',
            otp,
            expiry: 10,
        };
        await this.mailQueue.add(MailJobType.CONFIRM_EMAIL, job, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 50,
        });
    }

    // ── Reset password (OTP) ──────────────────────────────────

    async sendResetPasswordCode(user: User, otp: string): Promise<void> {
        const job: ResetPasswordJob = {
            type: MailJobType.RESET_PASSWORD,
            to: user.email!,
            firstName: user.firstName ?? 'Utilisateur',
            otp,
            expiry: 10,
        };
        await this.mailQueue.add(MailJobType.RESET_PASSWORD, job, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 50,
        });
    }

    // ── Reset password (lien — web uniquement) ────────────────

    async sendResetPasswordLink(user: User, resetUrl: string): Promise<void> {
        const job: ResetLinkJob = {
            type: MailJobType.RESET_LINK,
            to: user.email!,
            firstName: user.firstName ?? 'Utilisateur',
            resetUrl,
            expiry: 2, // heures
        };
        await this.mailQueue.add(MailJobType.RESET_LINK, job, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 50,
        });
    }

    // ── Reset PIN (mobile) ────────────────────────────────────

    async sendResetPinCode(user: User, otp: string): Promise<void> {
        const job: ResetPinJob = {
            type: MailJobType.RESET_PIN,
            to: user.email!,
            firstName: user.firstName ?? 'Utilisateur',
            otp,
            expiry: 10,
        };
        await this.mailQueue.add(MailJobType.RESET_PIN, job, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 50,
        });
    }
}
