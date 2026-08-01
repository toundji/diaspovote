// ============================================================
// campaign-post.dto.ts
// DTOs des routes /candidacies/:id/posts/*.
// ============================================================
import { IsString, IsOptional, IsNotEmpty, IsUrl } from 'class-validator';
import { CampaignPost } from '../entities/campaign-post.entity';

export class CreateCampaignPostDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsNotEmpty()
    content!: string;

    @IsUrl({}, { message: "L'URL du média est invalide." })
    @IsOptional()
    mediaUrl?: string;
}

export class UpdateCampaignPostDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsUrl({}, { message: "L'URL du média est invalide." })
    @IsOptional()
    mediaUrl?: string;
}

export interface ListCampaignPostsQuery {
    page?: number;
    limit?: number;
    /** Par défaut, seuls les posts publiés sont visibles hors du propriétaire. */
    includeUnpublished?: boolean;
}

export interface PaginatedCampaignPosts {
    data: CampaignPost[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
