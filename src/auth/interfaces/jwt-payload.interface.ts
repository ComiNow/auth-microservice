export interface JwtPayload {
  id: string;
  businessId: string;
  role: 'admin' | 'employee';
  roleId?: string; // Un solo ID de rol (opcional para admin)
  roleName?: string; // Nombre del rol
  moduleAccessId: string; // IDs de módulos separados por coma
}
