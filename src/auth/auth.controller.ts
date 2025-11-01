import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginUserDto, RegisterUserDto, RegisterBusinessDto } from './dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register.business')
  registerBusiness(@Payload() registerBusinessDto: RegisterBusinessDto) {
    return this.authService.registerBusiness(registerBusinessDto);
  }

  @MessagePattern('auth.register.employee')
  registerEmployee(@Payload() registerUserDto: RegisterUserDto) {
    return this.authService.registerEmployee(registerUserDto);
  }

  @MessagePattern('auth.login.user')
  loginUser(@Payload() loginUserDto: LoginUserDto) {
    return this.authService.loginUser(loginUserDto);
  }

  @MessagePattern('auth.verify.user')
  verifyToken(@Payload() token: string) {
    return this.authService.verifyToken(token);
  }

  @MessagePattern('auth.get.business')
  getBusinessById(@Payload() businessId: string) {
    return this.authService.getBusinessById(businessId);
  }

  @MessagePattern('auth.get.employees.by.business')
  getEmployeesByBusinessId(@Payload() businessId: string) {
    return this.authService.getEmployeesByBusinessId(businessId);
  }
}
