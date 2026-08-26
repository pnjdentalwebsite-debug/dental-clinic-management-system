import type { DentalSurfaceId } from './dentalChartTypes';

export const odontogramSurfacePaths: Array<{
  surface: DentalSurfaceId;
  path: string;
}> = [
  {
    surface: 'buccal',
    path: 'M 18.89 18.89 A 44 44 0 0 1 81.11 18.89 L 59.9 40.1 A 14 14 0 0 0 40.1 40.1 Z'
  },
  {
    surface: 'mesial',
    path: 'M 18.89 81.11 A 44 44 0 0 1 18.89 18.89 L 40.1 40.1 A 14 14 0 0 0 40.1 59.9 Z'
  },
  {
    surface: 'distal',
    path: 'M 81.11 18.89 A 44 44 0 0 1 81.11 81.11 L 59.9 59.9 A 14 14 0 0 0 59.9 40.1 Z'
  },
  {
    surface: 'lingual',
    path: 'M 81.11 81.11 A 44 44 0 0 1 18.89 81.11 L 40.1 59.9 A 14 14 0 0 0 59.9 59.9 Z'
  },
  {
    surface: 'occlusal',
    path: 'M 50 36 A 14 14 0 1 1 50 64 A 14 14 0 1 1 50 36 Z'
  }
];
