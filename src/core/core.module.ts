import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BaseValidator } from "./validators/base.validator";

@Module({
    imports: [TypeOrmModule],
    providers: [BaseValidator],
    exports: [BaseValidator],
})
export class CoreModule {}