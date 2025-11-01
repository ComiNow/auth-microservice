import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { ModuleAccessModule } from './module-access/module-access.module';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    const appModule = module.get(AppModule);
    expect(appModule).toBeInstanceOf(AppModule);
  });

  it('should import AuthModule and ModuleAccessModule', () => {
    const imports = Reflect.getMetadata('imports', AppModule);
    expect(imports).toContain(AuthModule);
    expect(imports).toContain(ModuleAccessModule);
  });
});
