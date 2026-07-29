// ============================================================
// UNIFIED AUTH — mail.types.ts
// Interfaces des jobs email pour BullMQ.
// ============================================================

export enum MailJobType {
    CONFIRM_EMAIL = 'confirm-email',
    RESET_PASSWORD = 'reset-password',
    RESET_PIN = 'reset-pin',
    RESET_LINK = 'reset-link',
}

export interface MailJobBase {
    type: MailJobType;
    to: string;
    firstName: string;
    /**
     * Présent uniquement si le job est une relance manuelle.
     * Contient l'id de l'entrée mail_failed_jobs d'origine.
     * Utilisé par onJobFailed pour mettre à jour l'entrée existante
     * au lieu d'en créer une nouvelle.
     */
    _retriedFromId?: string;
}

export interface ConfirmEmailJob extends MailJobBase {
    type: MailJobType.CONFIRM_EMAIL;
    otp: string;
    expiry: number; // minutes
}

export interface ResetPasswordJob extends MailJobBase {
    type: MailJobType.RESET_PASSWORD;
    otp: string;
    expiry: number;
}

export interface ResetPinJob extends MailJobBase {
    type: MailJobType.RESET_PIN;
    otp: string;
    expiry: number;
}

export interface ResetLinkJob extends MailJobBase {
    type: MailJobType.RESET_LINK;
    resetUrl: string;
    expiry: number; // heures
}

export type MailJob =
    | ConfirmEmailJob
    | ResetPasswordJob
    | ResetPinJob
    | ResetLinkJob;

export const MAIL_QUEUE = 'mail-queue';