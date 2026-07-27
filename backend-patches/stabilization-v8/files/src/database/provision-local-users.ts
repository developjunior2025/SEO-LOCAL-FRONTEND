import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source';
import {
  SeoClientAudit,
  SeoClientCitationDraft,
  SeoClientProfile,
  SeoDashboardRole,
  SeoPermissionRule,
  SeoProfileType,
  SeoRolePermissionRel,
  SeoUserAccount,
  SeoUserProfile,
  SeoUserRoleAssignment,
} from './entities';
import { buildDefaultCitationDraft } from '../modules/client/default-citation.payload';
import { buildEmptyAuditPayload } from '../modules/client/empty-audit.payload';

const ALL_PERMISSIONS = [
  'users.read',
  'users.manage',
  'agencies.read',
  'agencies.update',
  'agencies.own.update',
  'agency_profile.modules',
  'agency_services.read',
  'agency_services.manage',
  'services.read',
  'services.manage',
  'leads.read',
  'leads.manage',
  'reviews.read',
  'reviews.moderate',
  'plans.read',
  'plans.manage',
  'categories.read',
  'categories.manage',
  'reports.read',
  'audit.read',
];

function passwordFromEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.length < 14)
    throw new Error(`${name} must contain at least 14 characters`);
  return value;
}

async function ensureRole(
  roleCode: string,
  name: string,
  baseRoleCode: string,
  permissions: string[],
) {
  const roleRepo = AppDataSource.getRepository(SeoDashboardRole);
  const permissionRepo = AppDataSource.getRepository(SeoPermissionRule);
  const relRepo = AppDataSource.getRepository(SeoRolePermissionRel);
  await roleRepo.upsert(
    {
      roleCode,
      name,
      description: null,
      baseRoleCode,
      isSystem: true,
      active: true,
      sequence: roleCode === 'superadmin' ? 1 : 8,
    },
    ['roleCode'],
  );
  for (const permissionCode of permissions) {
    const moduleCode = permissionCode.split('.')[0];
    await permissionRepo.upsert(
      {
        permissionCode,
        moduleCode,
        name: permissionCode,
        description: `Permiso ${permissionCode}`,
      },
      ['permissionCode'],
    );
    await relRepo.upsert({ roleCode, permissionCode }, [
      'roleCode',
      'permissionCode',
    ]);
  }
}

async function ensureUser(
  login: string,
  displayName: string,
  roleCode: string,
  password: string,
): Promise<SeoUserAccount> {
  const userRepo = AppDataSource.getRepository(SeoUserAccount);
  const assignmentRepo = AppDataSource.getRepository(SeoUserRoleAssignment);
  let user = await userRepo.findOne({ where: { login } });
  const passwordHash = await bcrypt.hash(password, 12);
  if (!user) {
    user = await userRepo.save(
      userRepo.create({
        login,
        email: login,
        displayName,
        passwordHash,
        active: true,
        lastLoginAt: null,
      }),
    );
  } else {
    user.login = login;
    user.email = login;
    user.displayName = displayName;
    user.passwordHash = passwordHash;
    user.active = true;
    user = await userRepo.save(user);
  }
  await assignmentRepo.delete({ userAccountId: user.id });
  await assignmentRepo.save(
    assignmentRepo.create({
      userAccountId: user.id,
      roleCode,
      agencyProfileId: null,
    }),
  );
  return user;
}

async function ensureClientProfile(user: SeoUserAccount, companyName: string) {
  const profileTypeRepo = AppDataSource.getRepository(SeoProfileType);
  const profileRepo = AppDataSource.getRepository(SeoUserProfile);
  const clientRepo = AppDataSource.getRepository(SeoClientProfile);
  const auditRepo = AppDataSource.getRepository(SeoClientAudit);
  const draftRepo = AppDataSource.getRepository(SeoClientCitationDraft);
  await profileTypeRepo.upsert(
    {
      code: 'client',
      name: 'Cliente',
      description: 'Perfil de cliente de servicios SEO local',
    },
    ['code'],
  );
  let profile = await profileRepo.findOne({
    where: { userAccountId: user.id },
  });
  if (!profile)
    profile = await profileRepo.save(
      profileRepo.create({
        userAccountId: user.id,
        profileTypeCode: 'client',
        phone: null,
        active: true,
      }),
    );
  let client = await clientRepo.findOne({
    where: { userProfileId: profile.id },
  });
  if (!client)
    client = await clientRepo.save(
      clientRepo.create({
        userProfileId: profile.id,
        companyName,
        city: null,
        countryCode: null,
      }),
    );
  const audit = await auditRepo.findOne({
    where: { clientProfileId: client.id },
  });
  if (!audit)
    await auditRepo.save(
      auditRepo.create({
        clientProfileId: client.id,
        payload: buildEmptyAuditPayload(companyName),
        active: true,
      }),
    );
  const draft = await draftRepo.findOne({
    where: { clientProfileId: client.id },
  });
  if (!draft)
    await draftRepo.save(
      draftRepo.create({
        clientProfileId: client.id,
        payload: buildDefaultCitationDraft(),
        active: true,
      }),
    );
}

async function run() {
  const superadminPassword = passwordFromEnv('PROVISION_SUPERADMIN_PASSWORD');
  const clientPassword = passwordFromEnv('PROVISION_CLIENT_PASSWORD');
  await AppDataSource.initialize();
  try {
    await ensureRole(
      'superadmin',
      'Superadministrador',
      'admin',
      ALL_PERMISSIONS,
    );
    await ensureRole('client', 'Cliente', 'client', []);
    await ensureUser(
      'superadmin@seolocal.local',
      'Superadministrador SEOLOCAL',
      'superadmin',
      superadminPassword,
    );
    const client = await ensureUser(
      'cliente@seolocal.local',
      'Cliente SEOLOCAL',
      'client',
      clientPassword,
    );
    await ensureClientProfile(client, 'Cliente SEOLOCAL');
    console.log(
      'Provision completed: superadmin and client accounts are active.',
    );
  } finally {
    await AppDataSource.destroy();
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Provision failed: ${message}`);
  process.exit(1);
});
