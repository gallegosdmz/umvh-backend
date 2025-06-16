import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { PeriodsModule } from 'src/periods/periods.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService],
  imports: [
    TypeOrmModule.forFeature([Group]),
    UsersModule,
    PeriodsModule,
  ],
  exports: [GroupsService],
})
export class GroupsModule {}
