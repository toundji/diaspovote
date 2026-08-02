// ============================================================
// candidacy-payment.service.ts
// Preuve de paiement des frais de candidature — upsert 1-1 avec
// Candidacy (tant que non approuvée), revue indépendante de celle de
// la candidature (voir CandidacyService.approve/reject).
// ============================================================
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidacyPayment } from '../entities/candidacy-payment.entity';
import { Candidacy } from '../entities/candidacy.entity';
import { Position } from '../entities/position.entity';

import { ApiError, ApiErrorNotFoundById } from 'src/utils/api-error';
import { ApiFsUtils } from 'src/utils/api-fs';
import { DocDto } from 'src/shared/media.dto';
import { JwtUserInfo } from 'src/auth/dto/auth.type.dto';
import { UserRole } from 'src/shared/common.enum';

@Injectable()
export class CandidacyPaymentService {
    constructor(
        @InjectRepository(CandidacyPayment) private readonly paymentRepo: Repository<CandidacyPayment>,
        @InjectRepository(Candidacy) private readonly candidacyRepo: Repository<Candidacy>,
        @InjectRepository(Position) private readonly positionRepo: Repository<Position>,
    ) { }

    // ── Lecture (propriétaire ou commission/admin) ────────────

    async getForViewer(candidacyId: string, viewer: JwtUserInfo): Promise<CandidacyPayment | null> {
        const candidacy = await this.candidacyRepo.findOne({ where: { id: candidacyId } });
        if (!candidacy) throw new ApiErrorNotFoundById('candidacies', candidacyId);

        const isOwner = candidacy.userId === viewer.id;
        const isReviewer = viewer.roles?.some(
            (r) => (r as UserRole) === UserRole.admin || (r as UserRole) === UserRole.commission,
        );
        if (!isOwner && !isReviewer) {
            throw new ApiError('Vous n\'êtes pas autorisé à consulter ce paiement.', { code: HttpStatus.FORBIDDEN });
        }

        return this.paymentRepo.findOne({ where: { candidacyId } });
    }

    // ── Soumission / resoumission (candidat propriétaire) ─────

    async submit(candidacyId: string, userId: string, body: DocDto): Promise<CandidacyPayment> {
        const candidacy = await this.candidacyRepo.findOne({ where: { id: candidacyId } });
        if (!candidacy) throw new ApiErrorNotFoundById('candidacies', candidacyId);
        if (candidacy.userId !== userId) {
            throw new ApiError('Cette candidature ne vous appartient pas.', { code: HttpStatus.FORBIDDEN });
        }

        const position = await this.positionRepo.findOne({ where: { id: candidacy.positionId } });
        if (!position) throw new ApiErrorNotFoundById('positions', candidacy.positionId);
        if (!position.feeAmount) {
            throw new ApiError('Ce poste est gratuit, aucune preuve de paiement n\'est requise.');
        }

        const doc = body.doc;
        if (!doc) throw new ApiError('Le fichier justificatif (pdf ou image du reçu) est requis.');

        const existing = await this.paymentRepo.findOne({ where: { candidacyId } });
        if (existing?.approvedAt) {
            throw new ApiError('Le paiement de cette candidature a déjà été validé.');
        }

        const dir = ApiFsUtils.createDir('payment-proofs');
        const key = `${Date.now()}${Math.ceil(Math.random() * 100)}`;
        let path = `${dir}/proof_${key}.${doc['fileType']['ext']}`;
        ApiFsUtils.saveFile(doc.path, path);
        path = `${process.env.API_ADDRESS}/${path}`;
        const proofUrl = ApiFsUtils.pathToUrl(path);

        if (existing) {
            existing.proofUrl = proofUrl;
            existing.rejectedAt = undefined;
            existing.reviewedById = undefined;
            return this.paymentRepo.save(existing);
        }

        const payment = this.paymentRepo.create({
            candidacyId,
            amount: position.feeAmount,
            currency: position.feeCurrency!,
            proofUrl,
        });
        return this.paymentRepo.save(payment);
    }

    // ── Revue (commission / admin, back-office) ───────────────

    async approve(candidacyId: string, reviewerId: string): Promise<CandidacyPayment> {
        const payment = await this.getOrThrow(candidacyId);
        this.assertPending(payment);

        payment.approvedAt = new Date();
        payment.reviewedById = reviewerId;
        return this.paymentRepo.save(payment);
    }

    async reject(candidacyId: string, reviewerId: string): Promise<CandidacyPayment> {
        const payment = await this.getOrThrow(candidacyId);
        this.assertPending(payment);

        payment.rejectedAt = new Date();
        payment.reviewedById = reviewerId;
        return this.paymentRepo.save(payment);
    }

    // ── Helpers ───────────────────────────────────────────────

    private async getOrThrow(candidacyId: string): Promise<CandidacyPayment> {
        const payment = await this.paymentRepo.findOne({ where: { candidacyId } });
        if (!payment) throw new ApiErrorNotFoundById('candidacy_payments', candidacyId);
        return payment;
    }

    private assertPending(payment: CandidacyPayment): void {
        if (payment.approvedAt || payment.rejectedAt) {
            throw new ApiError('Ce paiement a déjà été traité.');
        }
    }
}
