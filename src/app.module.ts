import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ModuleAccessModule } from './module-access/module-access.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [AuthModule, ModuleAccessModule, RolesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
