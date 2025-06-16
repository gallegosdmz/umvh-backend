import { BadRequestException, InternalServerErrorException } from "@nestjs/common";

export const handleDBErrors = ( error: any, service: string ): never => {
    if ( error.code === '23505' ) throw new BadRequestException( error.detail );

    console.log(`ERROR - FUNCTION: ${ service }: ${ error }`);

    throw new InternalServerErrorException('Please check server logs');
}