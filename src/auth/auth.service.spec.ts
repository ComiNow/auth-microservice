import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockEmployee = {
  findUnique: jest.fn(),
  create: jest.fn(),
};

const mockPosition = {
  findUnique: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    (service as any).employee = mockEmployee;
    (service as any).position = mockPosition;
    jest.clearAllMocks();
  });

  it('should call $connect and log on onModuleInit', () => {
    const connectSpy = jest.spyOn(service, '$connect').mockImplementation(jest.fn());
    const logSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn());
    service.onModuleInit();
    expect(connectSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should sign JWT', async () => {
    mockJwtService.sign.mockReturnValue('token');
    const result = await service.signJWT({ id: '1' } as any);
    expect(result).toBe('token');
    expect(mockJwtService.sign).toHaveBeenCalledWith({ id: '1' });
  });

  describe('registerUser', () => {
    it('should throw if user already exists', async () => {
      mockEmployee.findUnique.mockResolvedValueOnce({ id: '1' });
      await expect(service.registerUser({ identificationNumber: '123', fullName: 'Test', password: 'pass', positionId: '1' } as any)).rejects.toThrow(RpcException);
    });
    it('should throw if position does not exist', async () => {
      mockEmployee.findUnique.mockResolvedValueOnce(null);
      mockPosition.findUnique.mockResolvedValueOnce(null);
      await expect(service.registerUser({ identificationNumber: '123', fullName: 'Test', password: 'pass', positionId: '1' } as any)).rejects.toThrow(RpcException);
    });
    it('should create user and return user and token', async () => {
      mockEmployee.findUnique.mockResolvedValueOnce(null);
      mockPosition.findUnique.mockResolvedValueOnce({ id: '1', moduleAccess: ['mod1'] });
      const createdUser = {
        id: '1',
        positionId: '1',
        position: { moduleAccess: ['mod1'] },
      };
      mockEmployee.create.mockResolvedValueOnce(createdUser);
      mockJwtService.sign.mockReturnValue('token');
      jest.spyOn(bcrypt, 'hashSync').mockReturnValue('hashed');
      const result = await service.registerUser({ identificationNumber: '123', fullName: 'Test', password: 'pass', positionId: '1' } as any);
      expect(result.user).toEqual({ id: '1', positionId: '1', moduleAccess: ['mod1'] });
      expect(result.token).toBe('token');
    });
  });

  describe('loginUSer', () => {
    it('should throw if user not found', async () => {
      mockEmployee.findUnique.mockResolvedValueOnce(null);
      await expect(service.loginUSer({ identificationNumber: '123', password: 'pass' } as any)).rejects.toThrow(RpcException);
    });
    it('should throw if password is invalid', async () => {
      mockEmployee.findUnique.mockResolvedValueOnce({ password: 'hashed', position: { moduleAccess: [] } });
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);
      await expect(service.loginUSer({ identificationNumber: '123', password: 'pass' } as any)).rejects.toThrow(RpcException);
    });
    it('should return user and token if credentials are valid', async () => {
      const user = { id: '1', positionId: '1', password: 'hashed', position: { moduleAccess: ['mod1'] } };
      mockEmployee.findUnique.mockResolvedValueOnce(user);
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);
      mockJwtService.sign.mockReturnValue('token');
      const result = await service.loginUSer({ identificationNumber: '123', password: 'pass' } as any);
      expect(result.user).toEqual({ id: '1', positionId: '1', moduleAccess: ['mod1'] });
      expect(result.token).toBe('token');
    });
  });

  describe('verifyToken', () => {
    it('should return user and token if token is valid', async () => {
      mockJwtService.verify.mockReturnValue({ id: '1', positionId: '1', moduleAccess: ['mod1'] });
      mockJwtService.sign.mockReturnValue('token');
      const result = await service.verifyToken('sometoken');
      expect(result.user).toEqual({ id: '1', positionId: '1', moduleAccess: ['mod1'] });
      expect(result.token).toBe('token');
    });
    it('should throw if token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('Invalid'); });
      await expect(service.verifyToken('badtoken')).rejects.toThrow(RpcException);
    });
  });
});
