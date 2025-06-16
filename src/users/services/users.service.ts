import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { AuthService } from './auth.service';
import { PaginationDto } from 'src/core/dtos/pagination.dto';
import { handleDBErrors } from 'src/utils/errors';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const data = await this.authService.create(createUserDto);
    return data;
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const users = await this.userRepository.find({
      where: { isDeleted: false },
      take: limit,
      skip: offset,
      relations: { 
        coursesGroups: { 
          course: true, 
          group: { 
            period: true 
          }, 
          user: true 
        }
      },
      relationLoadStrategy: 'query'
    });

    // Filtrar las relaciones para mostrar solo las no eliminadas
    const filteredUsers = users.map(user => ({
      ...user,
      coursesGroups: user.coursesGroups?.filter(cg => !cg.isDeleted && !cg.course.isDeleted && !cg.group.isDeleted && !cg.group.period.isDeleted)
    }));

    return filteredUsers.map(({ password, ...user }) => user);
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!user) throw new NotFoundException(`User with id: ${ id } is not found`);

    const { password, ...data } = user;
    
    return data;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });
    if (!user) throw new NotFoundException(`User with id: ${ id } not found`);

    try {
      await this.userRepository.save(user);
      return user;

    } catch (error) {
      handleDBErrors(error, 'update - users');
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      await this.userRepository.update(id, { isDeleted: true });

    } catch (error) {
      handleDBErrors(error, 'remove - users');
    }
  }
}
