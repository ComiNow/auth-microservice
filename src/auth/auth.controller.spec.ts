import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterUserDto } from './dto';

const mockAuthService = {
  registerUser: jest.fn(),
  loginUSer: jest.fn(),
  verifyToken: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.registerUser and return result', async () => {
    const dto: RegisterUserDto = { identificationNumber: '123', fullName: 'Test', password: 'pass', positionId: '1' };
    const mockResult = { user: { id: '1' }, token: 'token' };
    (service.registerUser as jest.Mock).mockResolvedValueOnce(mockResult);
    const result = await controller.registerUser(dto);
    expect(service.registerUser).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockResult);
  });

  it('should call service.loginUSer and return result', async () => {
    const dto: LoginUserDto = { identificationNumber: '123', password: 'pass' };
    const mockResult = { user: { id: '1' }, token: 'token' };
    (service.loginUSer as jest.Mock).mockResolvedValueOnce(mockResult);
    const result = await controller.loginUser(dto);
    expect(service.loginUSer).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockResult);
  });

  it('should call service.verifyToken and return result', async () => {
    const token = 'sometoken';
    const mockResult = { user: { id: '1' }, token: 'token' };
    (service.verifyToken as jest.Mock).mockResolvedValueOnce(mockResult);
    const result = await controller.verifyToken(token);
    expect(service.verifyToken).toHaveBeenCalledWith(token);
    expect(result).toEqual(mockResult);
  });
});
