import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from 'src/mail/mail.module';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { UserDevice } from './entities/user-device.entity';
import { UserSession } from './entities/user-session.entity';
import { User } from './entities/user.entity';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { OtpService } from './services/otp.service';
import { PasswordService } from './services/password.service';
import { SessionService } from './services/session.service';
import { UserService } from './services/user.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserDevice, UserSession]),
        MailModule,
    ],
    controllers: [
        AuthController,
        UserController,
    ],
    providers: [
        AuthService,
        OtpService,
        PasswordService,
        SessionService,
        NotificationService,
        UserService,           // ← ajouté
    ],
    exports: [
        UserService,           // ← exporté pour usage dans d'autres modules
    ],
})
export class AuthModule { }
