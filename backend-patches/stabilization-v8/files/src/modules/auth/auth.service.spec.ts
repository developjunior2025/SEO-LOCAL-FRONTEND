import { UnauthorizedException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import type {
  SeoAuthRefreshToken,
  SeoAuthRevokedToken,
  SeoRolePermissionRel,
  SeoUserAccount,
  SeoUserRoleAssignment,
} from '../../database/entities';

function repositoryMock<T>() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value) => value),
    update: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
}

describe('AuthService', () => {
  const userRepo = repositoryMock<SeoUserAccount>();
  const assignmentRepo = repositoryMock<SeoUserRoleAssignment>();
  const permissionRepo = repositoryMock<SeoRolePermissionRel>();
  const refreshRepo = repositoryMock<SeoAuthRefreshToken>();
  const revokedRepo = repositoryMock<SeoAuthRevokedToken>();
  const jwtService = {
    verifyAsync: jest.fn(),
    signAsync: jest.fn(),
    decode: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.accessSecret') return 'test-secret';
      if (key === 'jwt.accessExpiresIn') return '1h';
      if (key === 'jwt.refreshExpiresIn') return '30d';
      return undefined;
    }),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      userRepo,
      assignmentRepo,
      permissionRepo,
      refreshRepo,
      revokedRepo,
      jwtService as never,
      config as never,
    );
  });

  it('rejects a revoked access token', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 1, login: 'user' });
    revokedRepo.findOne.mockResolvedValue({ id: 1 } as SeoAuthRevokedToken);

    await expect(
      service.verifyAccessToken('revoked-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('revoked-token', {
      secret: 'test-secret',
      ignoreExpiration: false,
    });
  });

  it('returns normalized user fields for frontend contracts', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 10,
      login: 'superadmin@seolocal.local',
      email: 'superadmin@seolocal.local',
      displayName: 'Superadministrador SEOLOCAL',
      active: true,
    } as SeoUserAccount);
    assignmentRepo.findOne.mockResolvedValue({
      userAccountId: 10,
      roleCode: 'superadmin',
      agencyProfileId: null,
      role: {
        roleCode: 'superadmin',
        name: 'Superadministrador',
        baseRoleCode: 'admin',
      },
    } as SeoUserRoleAssignment);
    permissionRepo.find.mockResolvedValue([
      { permissionCode: 'users.read' } as SeoRolePermissionRel,
    ]);

    await expect(service.buildAuthenticatedUser(10)).resolves.toMatchObject({
      name: 'Superadministrador SEOLOCAL',
      displayName: 'Superadministrador SEOLOCAL',
      baseRole: 'admin',
      roleCode: 'superadmin',
      permissions: ['users.read'],
    });
  });
});
