export interface JwtPayload {
  sub: number;
  login: string;
}

export interface AuthenticatedUser {
  id: number;
  login: string;
  email: string;
  name: string;
  displayName: string;
  baseRole: string;
  roleCode: string;
  roleName: string;
  agencyPartnerId: number | null;
  permissions: string[];
}
