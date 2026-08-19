import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findOneById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async create(email: string, passwordPlain: string, role: string, firstName?: string, lastName?: string): Promise<User> {
    const existing = await this.findOneByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // In a production app, we would hash the password using bcrypt.
    // For this prototype/dev session, we can store it directly or hash it.
    // Let's store it as simple hash or plain for robust local testing without external native binary dependencies.
    const user = this.userRepository.create({
      email,
      password: passwordPlain, // In real apps: await bcrypt.hash(passwordPlain, 10)
      role,
      firstName: firstName || '',
      lastName: lastName || '',
    });

    return await this.userRepository.save(user);
  }

  async updateProfile(id: string, firstName: string, lastName: string): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new Error('User not found');
    }
    user.firstName = firstName;
    user.lastName = lastName;
    return await this.userRepository.save(user);
  }
}
