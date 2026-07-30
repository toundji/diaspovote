// ============================================================
// users.module.ts
// Agrégat utilisateur : identité, sécurité (password/PIN/OTP),
// équipements & sessions multi-appareils.
// N'importe rien depuis auth/ (règle de dépendance à sens unique).
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from 'src/mail/mail.module';

import { User } from './entities/user.entity';
import { UserDevice } from './entities/user-device.entity';
import { UserSession } from './entities/user-session.entity';

import { UserController } from './controllers/user.controller';

import { UserService } from './services/user.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { OtpService } from './services/otp.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserDevice, UserSession]),
        MailModule,
    ],
    controllers: [
        UserController,
    ],
    providers: [
        UserService,
        SessionService,
        PasswordService,
        OtpService,
    ],
    exports: [
        // Ré-exporté pour que AuthModule puisse injecter Repository<User>
        // sans redéclarer TypeOrmModule.forFeature([User]).
        TypeOrmModule,
        UserService,
        SessionService,
        PasswordService,
        OtpService,
    ],
})
export class UsersModule { }
