import { Module } from '@nestjs/common';
import { MailsService } from './mails.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [MailsService],
  exports: [MailsService],
  imports: [
    ConfigModule,
  ]
})
export class MailsModule {}
