import { ModuleAccessService } from './module-access.service';
import { Logger } from '@nestjs/common';

const mockModule = {
  findMany: jest.fn(),
};

describe('ModuleAccessService', () => {
  let service: ModuleAccessService;

  beforeEach(() => {
    service = new ModuleAccessService();
    jest.spyOn(service, '$connect').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'log').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'error').mockImplementation(jest.fn());
    (service as any).module = mockModule;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call $connect and log on onModuleInit', () => {
    service.onModuleInit();
    expect(service.$connect).toHaveBeenCalled();
    expect(Logger.prototype.log).toHaveBeenCalledWith('Connected to the database');
  });

  it('should return all module access', async () => {
    const mockData = [{ id: '1', name: 'Test' }];
    mockModule.findMany.mockResolvedValueOnce(mockData);
    const result = await service.getAllModuleAccess();
    expect(result).toEqual(mockData);
  });

  it('should log and throw error if findMany fails', async () => {
    const error = new Error('fail');
    mockModule.findMany.mockRejectedValueOnce(error);
    await expect(service.getAllModuleAccess()).rejects.toThrow('Error fetching module access');
    expect(Logger.prototype.error).toHaveBeenCalledWith('Error fetching module access', error);
  });
});
