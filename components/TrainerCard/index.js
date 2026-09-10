'use client';

import { Star, MapPin, Calendar, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import styles from './TrainerCard.module.css';

export default function TrainerCard({ trainer }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <img src={trainer.image} alt={trainer.name} className={styles.avatar} />
        <div className={styles.headerInfo}>
          <div className={styles.nameRow}>
            <h3 className={styles.name}>{trainer.name}</h3>
            {trainer.verified && <CheckCircle size={16} className={styles.verified} />}
          </div>
          <p className={styles.specialty}>{trainer.specialty}</p>
          <div className={styles.rating}>
            <Star size={14} className={styles.star} fill="#f59e0b" />
            <span className={styles.ratingValue}>{trainer.rating}</span>
            <span className={styles.reviews}>({trainer.reviews} reviews)</span>
          </div>
        </div>
      </div>

      <p className={styles.bio}>{trainer.bio}</p>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <MapPin size={14} />
          <span>{trainer.location}</span>
        </div>
        <div className={styles.metaItem}>
          <Calendar size={14} />
          <span>{trainer.sessions} sessions</span>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.price}>
          <span className={styles.priceValue}>${trainer.price}</span>
          <span className={styles.pricePeriod}>/session</span>
        </div>
        <Link href={`/trainers/${trainer.id}`} className={styles.bookBtn}>
          Book Now
        </Link>
      </div>
    </div>
  );
}
