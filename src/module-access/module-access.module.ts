import { Module } from '@nestjs/common';
import { ModuleAccessService } from './module-access.service';
import { ModuleAccessController } from './module-access.controller';

@Module({
  controllers: [ModuleAccessController],
  providers: [ModuleAccessService],
})
export class ModuleAccessModule {}
