// ============================================================
// contestation.dto.ts
// DTOs des routes /achievements/:achievementId/contestations/*.
// ============================================================
import { IsString, IsNotEmpty } from 'class-validator';
import { Contestation } from '../entities/contestation.entity';

export class CreateContestationDto {
    @IsString()
    @IsNotEmpty()
    reason!: string;
}

export interface ListContestationsQuery {
    page?: number;
    limit?: number;
    resolved?: boolean;
}

export interface PaginatedContestations {
    data: Contestation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
