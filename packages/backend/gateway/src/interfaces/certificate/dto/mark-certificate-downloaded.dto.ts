import { ApiProperty } from '@nestjs/swagger'

export class MarkCertificateDownloadedDto {
  @ApiProperty({ example: '5d987c3bfb881ec86b476bca' })
  model_id: string
}
