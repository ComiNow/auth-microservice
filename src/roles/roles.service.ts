import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  onModuleInit() {
    this.$connect();
    this.logger.log('Connected to the database - RolesService');
  }

  /**
   * Crear roles por defecto al registrar un negocio
   */
  async createDefaultRoles(businessId: string): Promise<void> {
    try {
      // Obtener todos los módulos disponibles
      const allModules = await this.module.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      const allPermissions = allModules.map((m) => m.id);

      // Roles por defecto
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
          permissions: allPermissions.filter((id, index) => index < 5),
          businessId,
        },
        {
          name: 'Cajero',
          description: 'Acceso al punto de venta y gestión de órdenes',
          isDefault: true,
          isSystem: false,
          permissions: allPermissions.filter((id, index) =>
            [0, 3].includes(index),
          ),
          businessId,
        },
        {
          name: 'Cocinero',
          description: 'Acceso a la cocina para ver y gestionar pedidos',
          isDefault: true,
          isSystem: false,
          permissions: allPermissions.filter((id, index) => index === 3),
          businessId,
        },
        {
          name: 'Mesero',
          description: 'Acceso para tomar pedidos y gestionar mesas',
          isDefault: true,
          isSystem: false,
          permissions: allPermissions.filter((id, index) =>
            [3, 4].includes(index),
          ),
          businessId,
        },
      ];

      await this.role.createMany({
        data: defaultRoles,
      });

      this.logger.log(`Default roles created for business ${businessId}`);
    } catch (error) {
      this.logger.error(`Error creating default roles: ${error.message}`);
      throw new RpcException({
        status: 500,
        message: 'Error creating default roles',
      });
    }
  }

  /**
   * Crear un nuevo rol personalizado
   */
  async create(createRoleDto: CreateRoleDto, businessId: string) {
    try {
      // Verificar que no exista un rol con el mismo nombre en el negocio
      const existingRole = await this.role.findFirst({
        where: {
          name: createRoleDto.name,
          businessId,
        },
      });

      if (existingRole) {
        throw new RpcException({
          status: 409,
          message: `Ya existe un rol con el nombre "${createRoleDto.name}" en este negocio`,
        });
      }

      // Validar que los permisos existan
      const validModules = await this.module.findMany({
        where: {
          id: { in: createRoleDto.permissions },
          isActive: true,
        },
      });

      if (validModules.length !== createRoleDto.permissions.length) {
        throw new RpcException({
          status: 400,
          message: 'Algunos permisos no son válidos',
        });
      }

      const newRole = await this.role.create({
        data: {
          name: createRoleDto.name,
          description: createRoleDto.description,
          permissions: createRoleDto.permissions,
          businessId,
          isDefault: false,
          isSystem: false,
        },
      });

      return newRole;
    } catch (error) {
      if (error instanceof RpcException) throw error;

      this.logger.error(`Error creating role: ${error.message}`);
      throw new RpcException({
        status: 500,
        message: 'Error al crear el rol',
      });
    }
  }

  /**
   * Obtener todos los roles de un negocio
   */
  async findAllByBusinessId(businessId: string) {
    try {
      const roles = await this.role.findMany({
        where: { businessId },
        orderBy: [
          { isDefault: 'desc' }, // Primero los roles por defecto
          { createdAt: 'asc' },
        ],
      });

      // Contar empleados por rol
      const rolesWithEmployeeCount = await Promise.all(
        roles.map(async (role) => {
          const employeeCount = await this.employee.count({
            where: {
              businessId,
              roleId: role.id,
            },
          });

          return {
            ...role,
            employeeCount,
          };
        }),
      );

      return rolesWithEmployeeCount;
    } catch (error) {
      this.logger.error(`Error fetching roles: ${error.message}`);
      throw new RpcException({
        status: 500,
        message: 'Error al obtener roles',
      });
    }
  }

  /**
   * Obtener un rol por ID
   */
  async findOne(roleId: string, businessId: string) {
    try {
      const role = await this.role.findFirst({
        where: {
          id: roleId,
          businessId,
        },
      });

      if (!role) {
        throw new RpcException({
          status: 404,
          message: 'Rol no encontrado',
        });
      }

      const modules = await this.module.findMany({
        where: {
          id: { in: role.permissions },
        },
      });

      // Contar empleados con este rol
      const employeeCount = await this.employee.count({
        where: {
          businessId,
          roleId: role.id,
        },
      });

      return {
        ...role,
        modules,
        employeeCount,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      this.logger.error(`Error fetching role: ${error.message}`);
      throw new RpcException({
        status: 500,
        message: 'Error al obtener rol',
      });
    }
  }

  /**
   * Actualizar un rol
   */
  async update(
    roleId: string,
    updateRoleDto: UpdateRoleDto,
    businessId: string,
  ) {
    try {
      const existingRole = await this.role.findFirst({
        where: {
          id: roleId,
          businessId,
        },
      });

      if (!existingRole) {
        throw new RpcException({
          status: 404,
          message: 'Rol no encontrado',
        });
      }

      if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
        const roleWithSameName = await this.role.findFirst({
          where: {
            name: updateRoleDto.name,
            businessId,
            id: { not: roleId },
          },
        });

        if (roleWithSameName) {
          throw new RpcException({
            status: 409,
            message: `Ya existe un rol con el nombre "${updateRoleDto.name}" en este negocio`,
          });
        }
      }

      if (updateRoleDto.permissions) {
        const validModules = await this.module.findMany({
          where: {
            id: { in: updateRoleDto.permissions },
            isActive: true,
          },
        });

        if (validModules.length !== updateRoleDto.permissions.length) {
          throw new RpcException({
            status: 400,
            message: 'Algunos permisos no son válidos',
          });
        }
      }

      const updatedRole = await this.role.update({
        where: { id: roleId },
        data: {
          ...(updateRoleDto.name && { name: updateRoleDto.name }),
          ...(updateRoleDto.description !== undefined && {
            description: updateRoleDto.description,
          }),
          ...(updateRoleDto.permissions && {
            permissions: updateRoleDto.permissions,
          }),
        },
      });

      return updatedRole;
    } catch (error) {
      if (error instanceof RpcException) throw error;

      this.logger.error(`Error updating role: ${error.message}`);
      throw new RpcException({
        status: 500,
        message: 'Error al actualizar rol',
      });
    }
  }

  /**
   * Eliminar un rol
   */
  async remove(roleId: string, businessId: string) {
    try {
      const existingRole = await this.role.findFirst({
        where: {
          id: roleId,
          businessId,
        },
      });

      if (!existingRole) {
        throw new RpcException({
          status: 404,
          message: 'Rol no encontrado',
        });
      }

      if (existingRole.isSystem) {
        throw new RpcException({
          status: 403,
          message: 'No se puede eliminar un rol del sistema',
        });
      }

      const employeesWithRole = await this.employee.count({
        where: {
          businessId,
          roleId: roleId,
        },
      });

      if (employeesWithRole > 0) {
        throw new RpcException({
          status: 400,
          message: `No se puede eliminar el rol porque tiene ${employeesWithRole} empleado(s) asignado(s)`,
        });
      }

      await this.role.delete({
        where: { id: roleId },
      });

      return {
        message: 'Rol eliminado correctamente',
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      this.logger.error(`Error deleting role: ${error.message}`);
      throw new RpcException({
        status: 500,
        message: 'Error al eliminar rol',
      });
    }
  }

  /**
   * Asignar roles a un empleado
   */
  async assignRoleToEmployee(
    employeeId: string,
    roleId: string,
    businessId: string,
  ) {
    try {
      const employee = await this.employee.findFirst({
        where: {
          id: employeeId,
          businessId,
        },
      });

      if (!employee) {
        throw new RpcException({
          status: 404,
          message: 'Empleado no encontrado',
        });
      }

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

      const updatedEmployee = await this.employee.update({
        where: { id: employeeId },
        data: {
          roleId,
        },
      });

      return {
        ...updatedEmployee,
        role: validRole,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      this.logger.error(`Error assigning role: ${error.message}`);
      throw new RpcException({
        status: 500,
        message: 'Error al asignar rol',
      });
    }
  }
}
