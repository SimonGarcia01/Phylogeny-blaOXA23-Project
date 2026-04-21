import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('visualizations')
export class Visualization {
    @PrimaryGeneratedColumn()
    id!: number;
}
