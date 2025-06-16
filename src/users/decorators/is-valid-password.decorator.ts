import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export function IsPassword( validationOptions?: ValidationOptions ) {
    return function ( object: Object, propertyName: string ) {
        registerDecorator({
            name: 'isPassword',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate( value: any, args: ValidationArguments ) {
                    const passRegex = /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
                    return typeof value === 'string' && passRegex.test( value );
                },
                defaultMessage( args: ValidationArguments ) {
                    return 'The password must have a Uppercase, lowercase letter and a number';
                }
            }
        });
    }
}