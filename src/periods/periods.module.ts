import { Module } from '@nestjs/common';
import { PeriodsService } from './periods.service';
import { PeriodsController } from './periods.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Period } from './entities/period.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [PeriodsController],
  providers: [PeriodsService],
  imports: [
    TypeOrmModule.forFeature([Period]),
    UsersModule,
  ],
  exports: [PeriodsService],
})
export class PeriodsModule {}
