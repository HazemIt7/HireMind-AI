import { Injectable, ConflictException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService implements OnModuleInit {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultUsers();
  }

  async seedDefaultUsers() {
    const defaultUsers = [
      { email: 'admin@hiremind.ai', password: 'admin123', role: 'admin', firstName: 'Super', lastName: 'Admin' },
      { email: 'recruiter@hiremind.ai', password: 'recruiter123', role: 'recruiter', firstName: 'Hazem', lastName: 'Ayachi' },
      { email: 'slim.hadj@hiremind.ai', password: 'candidate123', role: 'candidate', firstName: 'Slim', lastName: 'Hadj' },
      { email: 'candidate@hiremind.ai', password: 'candidate123', role: 'candidate', firstName: 'Hazem', lastName: 'Ayachi' },
    ];

    for (const u of defaultUsers) {
      const existing = await this.findOneByEmail(u.email);
      if (!existing) {
        const created = this.userRepository.create(u);
        await this.userRepository.save(created);
        this.logger.log(`Seeded user account: ${u.email} (${u.role})`);
      }
    }
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findOneById(id: string): Promise<User | null> {
    if (!id || typeof id !== 'string') return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return null;
    try {
      return await this.userRepository.findOne({ where: { id } });
    } catch {
      return null;
    }
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
