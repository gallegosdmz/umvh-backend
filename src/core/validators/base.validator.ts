import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, EntityTarget, Not } from "typeorm";

@Injectable()
export class BaseValidator {
    constructor(
        protected dataSource: DataSource,
    ) {}

    async verifyEntityExist(entity: EntityTarget<any>, id: number) {
        if (!entity) throw new BadRequestException('Entity is required');
        if (!id) throw new BadRequestException('Id is required');

        const entityDB = await this.dataSource.manager.findOne(entity, {
            where: { id, isDeleted: false },
        });
        if (!entityDB) throw new NotFoundException(`${entity} with id: ${id} not found`);

        return entityDB;
    }

    async verifyFieldNotRepeated(
        entity: EntityTarget<any>,
        field: string,
        value: any,
        id?: number
    ) {
        if (!entity) throw new BadRequestException('La entidad es requerida');
        if (!field) throw new BadRequestException('El campo es requerido');
        if (value === undefined || value === null) throw new BadRequestException('El valor es requerido');

        // [field]: value busca registros donde el campo especificado coincida con el valor
        const where: any = { [field]: value, isDeleted: false };
        // Si se proporciona un id, agrega una condición para excluir ese registro específico
        if (id) where.id = Not(id);

        const entityDB = await this.dataSource.manager.findOne(entity, { where });
        if (entityDB) throw new BadRequestException(`${ field } ${ value } is already in use`);
    }
}