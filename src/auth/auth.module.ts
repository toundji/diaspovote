import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, NotificationService],
})
export class AuthModule {}
