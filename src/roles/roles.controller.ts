import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @MessagePattern('roles.create')
  create(@Payload() data: { businessId: string } & CreateRoleDto) {
    const { businessId, ...createRoleDto } = data;
    return this.rolesService.create(createRoleDto, businessId);
  }

  @MessagePattern('roles.findAll')
  findAll(@Payload() businessId: string) {
    return this.rolesService.findAllByBusinessId(businessId);
  }

  @MessagePattern('roles.findOne')
  findOne(@Payload() data: { roleId: string; businessId: string }) {
    return this.rolesService.findOne(data.roleId, data.businessId);
  }

  @MessagePattern('roles.update')
  update(
    @Payload()
    data: {
      roleId: string;
      updateRoleDto: UpdateRoleDto;
      businessId: string;
    },
  ) {
    return this.rolesService.update(
      data.roleId,
      data.updateRoleDto,
      data.businessId,
    );
  }

  @MessagePattern('roles.remove')
  remove(@Payload() data: { roleId: string; businessId: string }) {
    return this.rolesService.remove(data.roleId, data.businessId);
  }

  @MessagePattern('roles.assign')
  assignRole(
    @Payload()
    data: {
      employeeId: string;
      roleId: string;
      businessId: string;
    },
  ) {
    return this.rolesService.assignRoleToEmployee(
      data.employeeId,
      data.roleId,
      data.businessId,
    );
  }

  @MessagePattern('roles.createDefaults')
  createDefaultRoles(@Payload() data: { businessId: string }) {
    return this.rolesService.createDefaultRoles(data.businessId);
  }
}
