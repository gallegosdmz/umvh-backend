import { BadRequestException, Injectable } from "@nestjs/common";
import { BaseValidator } from "src/core/validators/base.validator";
import { User } from "../entities/user.entity";

@Injectable()
export class UserValidator extends BaseValidator {
    async verifyUserOwnerToPassword(userToEdit: User, userEditor: User) {
        if (!userToEdit) throw new BadRequestException('User to Edit is required');
        if (!userEditor) throw new BadRequestException('User Editor is required');

        if (userEditor.role === 'administrador') return true;

        if (userToEdit.id !== userEditor.id) return false;
    }

    async verifyUserEmail(email: string) {
        const user = await this.dataSource.manager.findOne(User, {
            where: {
                email: email,
                isDeleted: false
            },
        });

        if (user) throw new BadRequestException('Email already exists');
    }
}