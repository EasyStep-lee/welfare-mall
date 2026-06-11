import { Test } from '@nestjs/testing';
import { MerchantDraftContextRepository } from '../../src/merchant/merchant-draft-context.repository';
import { MerchantModule } from '../../src/merchant/merchant.module';
import { PrismaService } from '../../src/prisma/prisma.service';

function createPrismaMock() {
  return {
    merchant: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'merchant-001',
        code: 'M-001',
        name: '浦东履约商户',
        address: '上海市浦东新区世纪大道 88 号',
        franchise: {
          id: 'franchise-001',
          code: 'F-001',
          name: '浦东福利加盟商'
        }
      })
    },
    productCategory: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'category-grain',
        code: 'grain',
        name: '粮油副食'
      })
    },
    productBrand: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'brand-wuchang',
        code: 'wuchang',
        name: '五常香米'
      })
    }
  };
}

describe('MerchantDraftContextRepository', () => {
  it('returns merchant franchise ownership and default product master data for drafts', async () => {
    const prisma = createPrismaMock();
    const repository = new MerchantDraftContextRepository(prisma as never);

    const result = await repository.getDraftContext(' merchant-001 ');

    expect(prisma.merchant.findUnique).toHaveBeenCalledWith({
      where: { id: 'merchant-001' },
      select: {
        id: true,
        code: true,
        name: true,
        address: true,
        franchise: { select: { id: true, code: true, name: true } }
      }
    });
    expect(prisma.productCategory.findFirst).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: { id: true, code: true, name: true }
    });
    expect(prisma.productBrand.findFirst).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: [{ id: 'asc' }],
      select: { id: true, code: true, name: true }
    });
    expect(result).toEqual({
      merchant: {
        id: 'merchant-001',
        code: 'M-001',
        name: '浦东履约商户',
        address: '上海市浦东新区世纪大道 88 号'
      },
      franchise: {
        id: 'franchise-001',
        code: 'F-001',
        name: '浦东福利加盟商'
      },
      defaultCategory: {
        id: 'category-grain',
        code: 'grain',
        name: '粮油副食'
      },
      defaultBrand: {
        id: 'brand-wuchang',
        code: 'wuchang',
        name: '五常香米'
      }
    });
  });

  it('returns null when the merchant does not exist', async () => {
    const prisma = createPrismaMock();
    prisma.merchant.findUnique.mockResolvedValue(null);
    const repository = new MerchantDraftContextRepository(prisma as never);

    await expect(repository.getDraftContext('merchant-missing')).resolves.toBeNull();
  });

  it('registers the repository in merchant module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MerchantModule]
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaMock())
      .compile();

    expect(moduleRef.get(MerchantDraftContextRepository)).toBeInstanceOf(MerchantDraftContextRepository);

    await moduleRef.close();
  });
});
