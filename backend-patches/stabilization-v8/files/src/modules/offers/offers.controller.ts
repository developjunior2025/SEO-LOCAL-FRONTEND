import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferClaimDto } from './dto/create-offer-claim.dto';

@Controller()
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get('offers/active')
  async active(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 6;
    return { items: await this.offersService.findActivePublic(parsedLimit) };
  }

  @Post('offers/:id/claim')
  claim(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateOfferClaimDto,
  ) {
    return this.offersService.claim(id, dto);
  }
}
