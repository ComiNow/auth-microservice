import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ModuleAccessService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(ModuleAccessService.name);

  onModuleInit() {
    this.$connect();
    this.logger.log('Connected to the database');
  }

  async getAllModuleAccess() {
    try {
      const modules = await this.module.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });
      return modules;
    } catch (error) {
      this.logger.error('Error fetching module access', error);
      throw new Error('Error fetching module access');
    }
  }

  /**
   * Inicializar módulos del sistema (ejecutar una vez)
   */
  async seedModules() {
    try {
      const existingModules = await this.module.count();

      if (existingModules > 0) {
        return {
          message: 'Modules already initialized',
          count: existingModules,
        };
      }

      const defaultModules = [
        {
          name: 'POS',
          displayName: 'Punto de Venta',
          description: 'Módulo de punto de venta para cajeros',
          icon: 'shopping-cart',
          order: 1,
          isActive: true,
        },
        {
          name: 'ORDERS',
          displayName: 'Órdenes',
          description: 'Gestión de órdenes y pedidos',
          icon: 'receipt',
          order: 2,
          isActive: true,
        },
        {
          name: 'KITCHEN',
          displayName: 'Cocina',
          description: 'Vista de cocina para preparar pedidos',
          icon: 'restaurant',
          order: 3,
          isActive: true,
        },
        {
          name: 'PRODUCTS',
          displayName: 'Productos',
          description: 'Administración de productos',
          icon: 'inventory',
          order: 4,
          isActive: true,
        },
        {
          name: 'CATEGORIES',
          displayName: 'Categorías',
          description: 'Administración de categorías',
          icon: 'category',
          order: 5,
          isActive: true,
        },
        {
          name: 'EMPLOYEES',
          displayName: 'Empleados',
          description: 'Gestión de empleados',
          icon: 'people',
          order: 6,
          isActive: true,
        },
        {
          name: 'ROLES',
          displayName: 'Roles y Permisos',
          description: 'Gestión de roles y permisos',
          icon: 'shield',
          order: 7,
          isActive: true,
        },
        {
          name: 'CUSTOMIZATION',
          displayName: 'Personalización',
          description: 'Personalización de la interfaz',
          icon: 'palette',
          order: 8,
          isActive: true,
        },
        {
          name: 'REPORTS',
          displayName: 'Reportes',
          description: 'Reportes',
          icon: 'analytics',
          order: 9,
          isActive: true,
        },
      ];

      await this.module.createMany({
        data: defaultModules,
      });

      const count = await this.module.count();

      return {
        message: 'Modules initialized successfully',
        count,
      };
    } catch (error) {
      this.logger.error('Error seeding modules', error);
      throw new Error('Error seeding modules');
    }
  }
}
