export type BodyPartSlug =
  | 'abs'
  | 'adductors'
  | 'ankles'
  | 'biceps'
  | 'calves'
  | 'chest'
  | 'deltoids'
  | 'feet'
  | 'forearm'
  | 'gluteal'
  | 'hamstring'
  | 'hands'
  | 'hair'
  | 'head'
  | 'knees'
  | 'lower-back'
  | 'neck'
  | 'obliques'
  | 'quadriceps'
  | 'tibialis'
  | 'trapezius'
  | 'triceps'
  | 'upper-back';

export interface BodyPart {
  color?: string;
  slug?: BodyPartSlug;
  path?: {
    common?: string[];
    left?: string[];
    right?: string[];
  };
}

export { BodyMap } from './BodyMap';
export { getBodyGenderFromProfile } from './muscleMap';
