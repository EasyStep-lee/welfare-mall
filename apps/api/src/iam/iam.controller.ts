import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PermissionCatalog } from './permissions';

@ApiTags('iam')
@Controller('iam')
export class IamController {
  @Get('permissions/catalog')
  @ApiOkResponse({
    description: 'Permission catalog',
    schema: {
      example: [
        {
          code: 'product:read',
          name: '商品查看',
          risk: 'low'
        }
      ]
    }
  })
  getPermissionCatalog() {
    return PermissionCatalog;
  }
}

