import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        UsersModule,
    ],
    controllers: [
        AuthController,
    ],
    providers: [
        AuthService,
        NotificationService,
    ],
})
export class AuthModule { }
