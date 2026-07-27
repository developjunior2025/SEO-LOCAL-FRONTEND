import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import {
  SeoUserAccount,
  SeoUserRoleAssignment,
  SeoRolePermissionRel,
  SeoAuthRefreshToken,
  SeoAuthRevokedToken,
} from '../../database/entities';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../common/interfaces/auth-user.interface';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SeoUserAccount)
    private readonly userAccountRepo: Repository<SeoUserAccount>,
    @InjectRepository(SeoUserRoleAssignment)
    private readonly userRoleAssignmentRepo: Repository<SeoUserRoleAssignment>,
    @InjectRepository(SeoRolePermissionRel)
    private readonly rolePermissionRepo: Repository<SeoRolePermissionRel>,
    @InjectRepository(SeoAuthRefreshToken)
    private readonly refreshTokenRepo: Repository<SeoAuthRefreshToken>,
    @InjectRepository(SeoAuthRevokedToken)
    private readonly revokedTokenRepo: Repository<SeoAuthRevokedToken>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async buildAuthenticatedUser(
    userAccountId: number,
  ): Promise<AuthenticatedUser> {
    const user = await this.userAccountRepo.findOne({
      where: { id: userAccountId, active: true },
    });
    if (!user) throw new UnauthorizedException('User not found or inactive');

    const assignment = await this.userRoleAssignmentRepo.findOne({
      where: { userAccountId: user.id },
      relations: { role: true },
    });
    if (!assignment)
      throw new UnauthorizedException('User has no role assigned');

    const permissionRows = await this.rolePermissionRepo.find({
      where: { roleCode: assignment.roleCode },
    });

    return {
      id: user.id,
      login: user.login,
      email: user.email,
      name: user.displayName,
      displayName: user.displayName,
      baseRole: assignment.role.baseRoleCode ?? assignment.roleCode,
      roleCode: assignment.roleCode,
      roleName: assignment.role.name,
      agencyPartnerId: assignment.agencyProfileId,
      permissions: permissionRows.map((row) => row.permissionCode),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userAccountRepo
      .createQueryBuilder('user')
      .where(
        '(user.login = :login OR user.email = :login) AND user.active = true',
        { login: dto.login },
      )
      .getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userAccountRepo.update(user.id, { lastLoginAt: new Date() });

    const authenticatedUser = await this.buildAuthenticatedUser(user.id);
    const accessToken = await this.signAccessToken(user.id, user.login);
    const refreshToken = await this.issueRefreshToken(user.id);

    return { token: accessToken, refreshToken, user: authenticatedUser };
  }

  private async signAccessToken(
    userAccountId: number,
    login: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userAccountId, login },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>(
          'jwt.accessExpiresIn',
        ) as unknown as number,
      },
    );
  }

  private async issueRefreshToken(userAccountId: number): Promise<string> {
    const raw = randomBytes(32).toString('hex');
    const expiresInDays = this.parseDaysFromExpiry(
      this.config.get<string>('jwt.refreshExpiresIn') ?? '30d',
    );
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userAccountId,
        tokenHash: hashToken(raw),
        expiresAt,
      }),
    );

    return raw;
  }

  private parseDaysFromExpiry(expiry: string): number {
    const match = /^(\d+)d$/.exec(expiry);
    return match ? parseInt(match[1], 10) : 30;
  }

  async logout(user: AuthenticatedUser, accessToken: string, dto?: LogoutDto) {
    const accessTokenHash = hashToken(accessToken);
    const existingRevoked = await this.revokedTokenRepo.findOne({
      where: { tokenHash: accessTokenHash, tokenType: 'access' },
    });

    if (!existingRevoked) {
      const accessPayload = this.jwtService.decode<{ exp?: number }>(
        accessToken,
      );
      const accessExpiresAt = accessPayload?.exp
        ? new Date(accessPayload.exp * 1000)
        : new Date(Date.now() + 60 * 60 * 1000);

      await this.revokedTokenRepo.save(
        this.revokedTokenRepo.create({
          tokenHash: accessTokenHash,
          tokenType: 'access',
          expiresAt: accessExpiresAt,
          userAccountId: user.id,
        }),
      );
    }

    if (dto?.refreshToken) {
      await this.revokeRefreshToken(user.id, dto.refreshToken);
    }

    return { ok: true };
  }

  async verifyAccessToken(accessToken: string): Promise<JwtPayload> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(accessToken, {
      secret: this.config.get<string>('jwt.accessSecret'),
      ignoreExpiration: false,
    });
    if (await this.isAccessTokenRevoked(accessToken)) {
      throw new UnauthorizedException('Token has been revoked');
    }
    return payload;
  }

  async revokeRefreshToken(
    userAccountId: number,
    refreshToken: string,
  ): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const existing = await this.refreshTokenRepo.findOne({
      where: { tokenHash, userAccountId },
    });
    if (existing && !existing.revokedAt) {
      existing.revokedAt = new Date();
      await this.refreshTokenRepo.save(existing);
    }
  }

  async revokeRefreshTokenByToken(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const existing = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
    });
    if (existing && !existing.revokedAt) {
      existing.revokedAt = new Date();
      await this.refreshTokenRepo.save(existing);
    }
  }

  async isAccessTokenRevoked(accessToken: string): Promise<boolean> {
    const tokenHash = hashToken(accessToken);
    const revoked = await this.revokedTokenRepo.findOne({
      where: { tokenHash, tokenType: 'access' },
    });
    return !!revoked;
  }
}
