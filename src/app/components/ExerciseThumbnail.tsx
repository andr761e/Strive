import { type Exercise } from '../data/mockData';
import { ExerciseEquipmentIcon } from './ExerciseEquipmentIcon';

interface ExerciseThumbnailProps {
  exercise: Exercise;
  size?: 'sm' | 'md';
  active?: boolean;
}

export function ExerciseThumbnail({ exercise, size = 'md', active = false }: ExerciseThumbnailProps) {
  return <ExerciseEquipmentIcon exercise={exercise} size={size} active={active} />;
}
