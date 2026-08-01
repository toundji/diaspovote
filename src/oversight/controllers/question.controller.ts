// ============================================================
// question.controller.ts
// Routes /candidacies/:candidacyId/questions/*.
// Poser une question : authentifié. Lecture : publique (questions
// non masquées), le candidat/admin/commission voient aussi les
// masquées. Répondre : candidat propriétaire. Masquer : modération.
// ============================================================
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { QuestionService } from '../services/question.service';
import { CandidacyService } from 'src/election/services/candidacy.service';
import { GetUser, Public, Roles, RequireClientType } from 'src/core/decorators/api.decorator';
import { ApiClientType, UserRole } from 'src/shared/common.enum';
import { JwtUserInfo } from 'src/auth/dto/auth.type.dto';

import { AnswerQuestionDto, CreateQuestionDto } from '../dto/question.dto';
import type { ListQuestionsQuery } from '../dto/question.dto';

@ApiTags('Questions')
@Controller('candidacies/:candidacyId/questions')
export class QuestionController {
    constructor(
        private readonly questionService: QuestionService,
        private readonly candidacyService: CandidacyService,
    ) { }

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Poser une question à un candidat' })
    create(@GetUser() user: JwtUserInfo, @Param('candidacyId') candidacyId: string, @Body() body: CreateQuestionDto) {
        return this.questionService.create(candidacyId, user.id, body);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Lister les questions (non masquées, sauf candidat/admin/commission)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async list(@GetUser() user: JwtUserInfo | undefined, @Param('candidacyId') candidacyId: string, @Query() query: ListQuestionsQuery) {
        query.includeHidden = await this.canSeeHidden(candidacyId, user);
        return this.questionService.list(candidacyId, query);
    }

    @Post(':id/answer')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Répondre à une question (candidat propriétaire)' })
    answer(
        @GetUser() user: JwtUserInfo,
        @Param('candidacyId') candidacyId: string,
        @Param('id') id: string,
        @Body() body: AnswerQuestionDto,
    ) {
        return this.questionService.answer(candidacyId, id, user.id, body);
    }

    @Post(':id/hide')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Commission] Masquer une question' })
    hide(@GetUser() user: JwtUserInfo, @Param('candidacyId') candidacyId: string, @Param('id') id: string) {
        return this.questionService.hide(candidacyId, id, user.id);
    }

    // ── Helpers ───────────────────────────────────────────────

    private async canSeeHidden(candidacyId: string, user: JwtUserInfo | undefined): Promise<boolean> {
        if (!user) return false;
        if (user.roles?.some(r => r === UserRole.admin || r === UserRole.commission)) return true;

        // Candidat propriétaire : autorisé à voir ses propres questions masquées.
        const candidacy = await this.candidacyService.getById(candidacyId);
        return candidacy.userId === user.id;
    }
}
