import { BodyMap } from './body-map';
import type { BodyMapMuscleStatus } from './body-map/muscleMap';

interface AnatomicalBodyDiagramProps {
  onMuscleSelect: (muscle: string) => void;
  selectedMuscles: string[];
  colorMode?: 'selection' | 'status';
  muscleStatuses?: Record<string, BodyMapMuscleStatus>;
  gender?: string;
}

export function AnatomicalBodyDiagram(props: AnatomicalBodyDiagramProps) {
  return <BodyMap {...props} />;
}
