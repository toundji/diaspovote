// ============================================================
// vote.controller.ts
// Routes /votes/* — aucune logique métier, délègue à VoteService.
// Voter : authentifié. Vérifier un reçu : public (le reçu est lui-même
// le secret, pas besoin de compte). Résultats : public une fois publiés,
// admin/commission avant (aperçu).
// ============================================================
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { VoteService } from '../services/vote.service';
import { GetUser, Public } from 'src/core/decorators/api.decorator';
import { UserRole } from 'src/shared/common.enum';
import { JwtUserInfo } from 'src/auth/dto/auth.type.dto';
import { CastVoteDto } from '../dto/vote.dto';

@ApiTags('Votes')
@Controller('votes')
export class VoteController {
    constructor(private readonly voteService: VoteService) { }

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Voter pour une candidature dans une élection active' })
    cast(@GetUser() user: JwtUserInfo, @Body() body: CastVoteDto) {
        return this.voteService.cast(user.id, body);
    }

    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Vérifier si j\'ai déjà voté pour une élection' })
    @ApiQuery({ name: 'electionId', required: true, type: String })
    hasVoted(@GetUser() user: JwtUserInfo, @Query('electionId') electionId: string) {
        return this.voteService.hasVoted(user.id, electionId);
    }

    @Get('receipt/:receiptCode')
    @Public()
    @ApiOperation({ summary: 'Vérifier un reçu de vote (preuve remise à l\'électeur)' })
    verifyReceipt(@Param('receiptCode') receiptCode: string) {
        return this.voteService.verifyReceipt(receiptCode);
    }

    @Get('results/:electionId')
    @Public()
    @ApiOperation({ summary: 'Résultats d\'une élection (public une fois publiés, admin/commission en aperçu)' })
    getResults(@GetUser() user: JwtUserInfo | undefined, @Param('electionId') electionId: string) {
        const canPreview = !!user?.roles?.some(
            r => r === UserRole.admin || r === UserRole.commission,
        );
        return this.voteService.getResults(electionId, canPreview);
    }
}
