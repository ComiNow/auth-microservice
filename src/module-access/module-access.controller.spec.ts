import { Test, TestingModule } from '@nestjs/testing';
import { ModuleAccessController } from './module-access.controller';
import { ModuleAccessService } from './module-access.service';

const mockModuleAccessService = {
  getAllModuleAccess: jest.fn(),
};

describe('ModuleAccessController', () => {
  let controller: ModuleAccessController;
  let service: ModuleAccessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModuleAccessController],
      providers: [
        { provide: ModuleAccessService, useValue: mockModuleAccessService },
      ],
    }).compile();

    controller = module.get<ModuleAccessController>(ModuleAccessController);
    service = module.get<ModuleAccessService>(ModuleAccessService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service and return all module access', async () => {
    const mockResult = [{ id: '1', name: 'Test' }];
    (service.getAllModuleAccess as jest.Mock).mockResolvedValueOnce(mockResult);
    const result = await controller.getAllModuleAccess();
    expect(service.getAllModuleAccess).toHaveBeenCalled();
    expect(result).toEqual(mockResult);
  });
});
