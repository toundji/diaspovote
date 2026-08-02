// ============================================================
// campaign-post.controller.ts
// Route GET /campaign-posts — fil d'actualités global (toutes
// candidatures approuvées confondues, filtrable par élection).
// Les routes /candidacies/:id/posts/* (CRUD propriétaire) restent
// dans candidacy.controller.ts ; celle-ci ne fait que lister.
// ============================================================
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { CampaignPostService } from '../services/campaign-post.service';
import { Public } from 'src/core/decorators/api.decorator';
import type { ListAllCampaignPostsQuery } from '../dto/campaign-post.dto';

@ApiTags('Campaign Posts')
@Controller('campaign-posts')
export class CampaignPostController {
    constructor(private readonly postService: CampaignPostService) { }

    @Get()
    @Public()
    @ApiOperation({ summary: "Fil d'actualités de campagne (publications publiées, candidatures approuvées)" })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'electionId', required: false, type: String })
    listAll(@Query() query: ListAllCampaignPostsQuery) {
        return this.postService.listAll(query);
    }
}
