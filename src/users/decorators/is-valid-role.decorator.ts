import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export function IsRole( validationOptions?: ValidationOptions ) {
    return function ( object: Object, propertyName: string ) {
        registerDecorator({
            name: 'isROLE',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate( value: any, args: ValidationArguments ) {
                    const roles = ['administrador', 'maestro', 'director'];
                    return typeof value === 'string' && roles.includes( value );
                },
                defaultMessage( args: ValidationArguments ) {
                    return `${ args.property } must be one of the following roles: ADMINSTRADOR, CEO, ASISTENTE`;
                }
            }
        });
    }
}