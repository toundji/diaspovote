import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from 'src/mail/mail.module';
import { UserController } from './controllers/user.controller';
import { User } from './entities/user.entity';
import { UserDevice } from './entities/user-device.entity';
import { UserSession } from './entities/user-session.entity';
import { UserService } from './services/user.service';
import { OtpService } from './services/otp.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserDevice, UserSession]),
    MailModule,
  ],
  controllers: [UserController],
  providers: [UserService, OtpService, SessionService, PasswordService],
  exports: [
    TypeOrmModule,
    UserService,
    OtpService,
    SessionService,
    PasswordService,
  ],
})
export class UsersModule {}
