import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SeoBaseEntity } from './base.entity';
import { SeoOffer } from './offer.entity';

@Entity('seo_offer_claim')
export class SeoOfferClaim extends SeoBaseEntity {
  @Index()
  @Column({ name: 'offer_id', type: 'int' })
  offerId: number;

  @ManyToOne(() => SeoOffer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offer_id' })
  offer: SeoOffer;

  @Index({ unique: true })
  @Column({ name: 'reference', type: 'varchar', length: 40 })
  reference: string;

  @Column({ name: 'name', type: 'varchar', length: 190 })
  name: string;

  @Column({ name: 'email', type: 'varchar', length: 190 })
  email: string;

  @Column({ name: 'phone', type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({
    name: 'company_name',
    type: 'varchar',
    length: 190,
    nullable: true,
  })
  companyName: string | null;

  @Column({ name: 'message', type: 'text', nullable: true })
  message: string | null;

  @Column({ name: 'active', type: 'boolean', default: true })
  active: boolean;
}
