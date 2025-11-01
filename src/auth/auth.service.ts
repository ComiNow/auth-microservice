import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { LoginUserDto, RegisterUserDto, RegisterBusinessDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { envs } from '../config/envs';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly jwtService: JwtService) {
    super();
  }

  onModuleInit() {
    this.$connect();
    this.logger.log('Connected to the database');
  }

  async signJWT(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  /**
   * Registro de un negocio con su administrador
   */
  async registerBusiness(registerBusinessDto: RegisterBusinessDto) {
    const {
      businessName,
      businessEmail,
      businessPhone,
      adminFullName,
      adminEmail,
      adminPhone,
      adminIdentificationNumber,
      adminIdentificationType,
      adminPassword,
      locationState,
      locationCity,
      locationPostalCode,
      locationAddress,
    } = registerBusinessDto;

    try {
      // Crear Business con relaciones anidadas
      const newBusiness = await this.business.create({
        data: {
          name: businessName,
          email: businessEmail,
          phoneNumber: businessPhone,
          userAdministrator: {
            create: {
              identificationNumber: adminIdentificationNumber,
              identificationType: adminIdentificationType,
              fullName: adminFullName,
              email: adminEmail,
              phoneNumber: adminPhone,
              password: bcrypt.hashSync(adminPassword, 10),
            },
          },
          location: {
            create: {
              state: locationState,
              city: locationCity,
              postalCode: locationPostalCode,
              address: locationAddress,
            },
          },
        },
        include: {
          userAdministrator: true,
          location: true,
        },
      });

      // Crear roles por defecto para el negocio
      await this.createDefaultRoles(newBusiness.id);

      // Obtener todos los módulos para el admin
      const allModules = await this.module.findMany({
        select: { id: true },
      });
      const moduleIds = allModules.map((m) => m.id).join(',');

      // Crear payload JWT
      const userData: JwtPayload = {
        id: newBusiness.userAdministrator.id,
        businessId: newBusiness.id,
        role: 'admin',
        moduleAccessId: moduleIds,
      };

      return {
        user: userData,
        token: await this.signJWT(userData),
      };
    } catch (error) {
      this.logger.error(`Error registering business: ${error.message}`);
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  /**
   * Crear roles por defecto
   */
  private async createDefaultRoles(businessId: string): Promise<void> {
    try {
      const allModules = await this.module.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      const allPermissions = allModules.map((m) => m.id);

      const defaultRoles = [
        {
          name: 'Administrador',
          description: 'Acceso completo a todos los módulos del sistema',
          isDefault: true,
          isSystem: true,
          permissions: allPermissions,
          businessId,
        },
        {
          name: 'Gerente',
          description:
            'Acceso a gestión de productos, categorías, órdenes y reportes',
          isDefault: true,
          isSystem: false,
          permissions: allPermissions.slice(0, 5),
          businessId,
        },
        {
          name: 'Cajero',
          description: 'Acceso al punto de venta y gestión de órdenes',
          isDefault: true,
          isSystem: false,
          permissions: allPermissions.slice(0, 2),
          businessId,
        },
        {
          name: 'Cocinero',
          description: 'Acceso a la cocina para ver y gestionar pedidos',
          isDefault: true,
          isSystem: false,
          permissions: [allPermissions[1]], // Solo órdenes
          businessId,
        },
        {
          name: 'Mesero',
          description: 'Acceso para tomar pedidos y gestionar mesas',
          isDefault: true,
          isSystem: false,
          permissions: allPermissions.slice(0, 3),
          businessId,
        },
      ];

      await this.role.createMany({
        data: defaultRoles,
      });

      this.logger.log(`Default roles created for business ${businessId}`);
    } catch (error) {
      this.logger.error(`Error creating default roles: ${error.message}`);
    }
  }

  /**
   * Registro de un empleado
   */
  async registerEmployee(registerUserDto: RegisterUserDto) {
    const {
      identificationNumber,
      fullName,
      email,
      password,
      roleId,
      businessId,
    } = registerUserDto;

    try {
      // Validar que el rol exista y pertenezca al negocio
      const validRole = await this.role.findFirst({
        where: {
          id: roleId,
          businessId,
        },
      });

      if (!validRole) {
        throw new RpcException({
          status: 400,
          message: 'El rol no es válido o no pertenece a este negocio',
        });
      }

      // Crear el empleado con un solo rol
      const newEmployee = await this.employee.create({
        data: {
          identificationNumber,
          fullName,
          email,
          password: bcrypt.hashSync(password, 10),
          roleId,
          businessId,
        },
      });

      const userData: JwtPayload = {
        id: newEmployee.id,
        businessId: newEmployee.businessId,
        role: 'employee',
        roleId: validRole.id,
        roleName: validRole.name,
        moduleAccessId: validRole.permissions.join(','),
      };

      return {
        user: userData,
        token: await this.signJWT(userData),
      };
    } catch (error) {
      this.logger.error(`Error registering employee: ${error.message}`);
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      // Intentar login como administrador
      const admin = await this.userAdministrator.findUnique({
        where: { email },
        include: {
          business: true,
        },
      });

      if (admin) {
        const isPasswordValid = bcrypt.compareSync(password, admin.password);

        if (!isPasswordValid) {
          throw new RpcException({
            status: 400,
            message: 'Invalid credentials',
          });
        }

        if (!admin.business) {
          throw new RpcException({
            status: 400,
            message: 'Business not found for this administrator',
          });
        }

        const allModules = await this.module.findMany({
          select: { id: true },
        });
        const moduleIds = allModules.map((m) => m.id).join(',');

        const userData: JwtPayload = {
          id: admin.id,
          businessId: admin.business.id,
          role: 'admin',
          moduleAccessId: moduleIds,
        };

        return {
          user: userData,
          token: await this.signJWT(userData),
        };
      }

      // Intentar login como empleado
      const employee = await this.employee.findUnique({
        where: { email },
      });

      if (!employee) {
        throw new RpcException({
          status: 400,
          message: 'Invalid credentials',
        });
      }

      const isPasswordValid = bcrypt.compareSync(password, employee.password);

      if (!isPasswordValid) {
        throw new RpcException({
          status: 400,
          message: 'Invalid credentials',
        });
      }

      // Obtener el rol del empleado
      const employeeRole = await this.role.findUnique({
        where: {
          id: employee.roleId,
        },
      });

      if (!employeeRole) {
        throw new RpcException({
          status: 400,
          message: 'Role not found for this employee',
        });
      }

      const userData: JwtPayload = {
        id: employee.id,
        businessId: employee.businessId,
        role: 'employee',
        roleId: employeeRole.id,
        roleName: employeeRole.name,
        moduleAccessId: employeeRole.permissions.join(','),
      };

      return {
        user: userData,
        token: await this.signJWT(userData),
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      this.logger.error(`Error in login: ${error.message}`);
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async verifyToken(token: string) {
    try {
      const { sub, iat, exp, ...user } = this.jwtService.verify(token, {
        secret: envs.jwtSecret,
      });

      return {
        user,
        token: await this.signJWT(user),
      };
    } catch (error) {
      console.log(error);
      throw new RpcException({
        status: 401,
        message: 'Invalid token',
      });
    }
  }

  async getBusinessById(businessId: string) {
    try {
      const business = await this.business.findUnique({
        where: { id: businessId },
        include: {
          userAdministrator: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              identificationType: true,
              identificationNumber: true,
            },
          },
          location: true,
        },
      });

      if (!business) {
        throw new RpcException({
          status: 404,
          message: 'Business not found',
        });
      }

      return business;
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  /**
   * Obtener todos los empleados de un negocio
   */
  async getEmployeesByBusinessId(businessId: string) {
    try {
      const employees = await this.employee.findMany({
        where: { businessId },
      });

      // Obtener información de rol para cada empleado
      const employeesWithRole = await Promise.all(
        employees.map(async (employee) => {
          const role = await this.role.findUnique({
            where: {
              id: employee.roleId,
            },
            select: {
              id: true,
              name: true,
              description: true,
            },
          });

          return {
            ...employee,
            role,
          };
        }),
      );

      return employeesWithRole;
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }
}
