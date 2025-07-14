import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { CoreModule } from './core/core.module';
import { GroupsModule } from './groups/groups.module';
import { PeriodsModule } from './periods/periods.module';
import { CoursesModule } from './courses/courses.module';
import { MailsModule } from './mails/mails.module';
import { StudentsModule } from './students/students.module';
import { PartialEvaluationsModule } from './partial-evaluations/partial-evaluations.module';
import { PartialGradesModule } from './partial-grades/partial-grades.module';
import { FinalGradesModule } from './final-grades/final-grades.module';

@Module({
  imports: [
    ConfigModule.forRoot(),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT!,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true,
    }),

    UsersModule,
    CoreModule,
    GroupsModule,
    PeriodsModule,
    CoursesModule,
    MailsModule,
    StudentsModule,
    PartialEvaluationsModule,
    PartialGradesModule,
    FinalGradesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
