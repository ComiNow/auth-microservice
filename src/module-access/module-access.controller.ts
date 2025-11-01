import { Controller } from '@nestjs/common';
import { ModuleAccessService } from './module-access.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller('module-access')
export class ModuleAccessController {
  constructor(private readonly moduleAccessService: ModuleAccessService) {}

  @MessagePattern('auth.get.modules')
  getAllModuleAccess() {
    return this.moduleAccessService.getAllModuleAccess();
  }

  @MessagePattern('auth.seed.modules')
  seedModules() {
    return this.moduleAccessService.seedModules();
  }
}
