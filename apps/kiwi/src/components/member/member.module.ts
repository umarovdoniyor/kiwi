import { Module } from '@nestjs/common';
import { MemberResolver } from './member.resolver';
import { MemberService } from './member.service';
import { MemberSchema } from '../../schemas/Member.model';
import { OrderSchema } from '../../schemas/Order.model';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Member', schema: MemberSchema },
      { name: 'Order', schema: OrderSchema },
    ]),
    AuthModule,
  ],
  providers: [MemberResolver, MemberService],
})
export class MemberModule {}
