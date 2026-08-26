export type ToothNotationSystem = 'FDI' | 'Universal' | 'Palmer';

export interface ToothNotationItem {
  fdi: string;
  universal: string;
  palmer: string;
  arch: 'upper' | 'lower';
  quadrant: 'upper-right' | 'upper-left' | 'lower-right' | 'lower-left';
  dentition: 'permanent' | 'deciduous';
  name: string;
}

export const TOOTH_NOTATION_MAP: Record<string, ToothNotationItem> = {
  // Upper Right Permanent (18 -> 11)
  '18': { fdi: '18', universal: '1', palmer: '8┘', arch: 'upper', quadrant: 'upper-right', dentition: 'permanent', name: 'Upper Right 3rd Molar' },
  '17': { fdi: '17', universal: '2', palmer: '7┘', arch: 'upper', quadrant: 'upper-right', dentition: 'permanent', name: 'Upper Right 2nd Molar' },
  '16': { fdi: '16', universal: '3', palmer: '6┘', arch: 'upper', quadrant: 'upper-right', dentition: 'permanent', name: 'Upper Right 1st Molar' },
  '15': { fdi: '15', universal: '4', palmer: '5┘', arch: 'upper', quadrant: 'upper-right', dentition: 'permanent', name: 'Upper Right 2nd Premolar' },
  '14': { fdi: '14', universal: '5', palmer: '4┘', arch: 'upper', quadrant: 'upper-right', dentition: 'permanent', name: 'Upper Right 1st Premolar' },
  '13': { fdi: '13', universal: '6', palmer: '3┘', arch: 'upper', quadrant: 'upper-right', dentition: 'permanent', name: 'Upper Right Canine' },
  '12': { fdi: '12', universal: '7', palmer: '2┘', arch: 'upper', quadrant: 'upper-right', dentition: 'permanent', name: 'Upper Right Lateral Incisor' },
  '11': { fdi: '11', universal: '8', palmer: '1┘', arch: 'upper', quadrant: 'upper-right', dentition: 'permanent', name: 'Upper Right Central Incisor' },

  // Upper Left Permanent (21 -> 28)
  '21': { fdi: '21', universal: '9', palmer: '1└', arch: 'upper', quadrant: 'upper-left', dentition: 'permanent', name: 'Upper Left Central Incisor' },
  '22': { fdi: '22', universal: '10', palmer: '2└', arch: 'upper', quadrant: 'upper-left', dentition: 'permanent', name: 'Upper Left Lateral Incisor' },
  '23': { fdi: '23', universal: '11', palmer: '3└', arch: 'upper', quadrant: 'upper-left', dentition: 'permanent', name: 'Upper Left Canine' },
  '24': { fdi: '24', universal: '12', palmer: '4└', arch: 'upper', quadrant: 'upper-left', dentition: 'permanent', name: 'Upper Left 1st Premolar' },
  '25': { fdi: '25', universal: '13', palmer: '5└', arch: 'upper', quadrant: 'upper-left', dentition: 'permanent', name: 'Upper Left 2nd Premolar' },
  '26': { fdi: '26', universal: '14', palmer: '6└', arch: 'upper', quadrant: 'upper-left', dentition: 'permanent', name: 'Upper Left 1st Molar' },
  '27': { fdi: '27', universal: '15', palmer: '7└', arch: 'upper', quadrant: 'upper-left', dentition: 'permanent', name: 'Upper Left 2nd Molar' },
  '28': { fdi: '28', universal: '16', palmer: '8└', arch: 'upper', quadrant: 'upper-left', dentition: 'permanent', name: 'Upper Left 3rd Molar' },

  // Lower Left Permanent (31 -> 38)
  '31': { fdi: '31', universal: '24', palmer: '1┌', arch: 'lower', quadrant: 'lower-left', dentition: 'permanent', name: 'Lower Left Central Incisor' },
  '32': { fdi: '32', universal: '23', palmer: '2┌', arch: 'lower', quadrant: 'lower-left', dentition: 'permanent', name: 'Lower Left Lateral Incisor' },
  '33': { fdi: '33', universal: '22', palmer: '3┌', arch: 'lower', quadrant: 'lower-left', dentition: 'permanent', name: 'Lower Left Canine' },
  '34': { fdi: '34', universal: '21', palmer: '4┌', arch: 'lower', quadrant: 'lower-left', dentition: 'permanent', name: 'Lower Left 1st Premolar' },
  '35': { fdi: '35', universal: '20', palmer: '5┌', arch: 'lower', quadrant: 'lower-left', dentition: 'permanent', name: 'Lower Left 2nd Premolar' },
  '36': { fdi: '36', universal: '19', palmer: '6┌', arch: 'lower', quadrant: 'lower-left', dentition: 'permanent', name: 'Lower Left 1st Molar' },
  '37': { fdi: '37', universal: '18', palmer: '7┌', arch: 'lower', quadrant: 'lower-left', dentition: 'permanent', name: 'Lower Left 2nd Molar' },
  '38': { fdi: '38', universal: '17', palmer: '8┌', arch: 'lower', quadrant: 'lower-left', dentition: 'permanent', name: 'Lower Left 3rd Molar' },

  // Lower Right Permanent (48 -> 41)
  '48': { fdi: '48', universal: '32', palmer: '8┐', arch: 'lower', quadrant: 'lower-right', dentition: 'permanent', name: 'Lower Right 3rd Molar' },
  '47': { fdi: '47', universal: '31', palmer: '7┐', arch: 'lower', quadrant: 'lower-right', dentition: 'permanent', name: 'Lower Right 2nd Molar' },
  '46': { fdi: '46', universal: '30', palmer: '6┐', arch: 'lower', quadrant: 'lower-right', dentition: 'permanent', name: 'Lower Right 1st Molar' },
  '45': { fdi: '45', universal: '29', palmer: '5┐', arch: 'lower', quadrant: 'lower-right', dentition: 'permanent', name: 'Lower Right 2nd Premolar' },
  '44': { fdi: '44', universal: '28', palmer: '4┐', arch: 'lower', quadrant: 'lower-right', dentition: 'permanent', name: 'Lower Right 1st Premolar' },
  '43': { fdi: '43', universal: '27', palmer: '3┐', arch: 'lower', quadrant: 'lower-right', dentition: 'permanent', name: 'Lower Right Canine' },
  '42': { fdi: '42', universal: '26', palmer: '2┐', arch: 'lower', quadrant: 'lower-right', dentition: 'permanent', name: 'Lower Right Lateral Incisor' },
  '41': { fdi: '41', universal: '25', palmer: '1┐', arch: 'lower', quadrant: 'lower-right', dentition: 'permanent', name: 'Lower Right Central Incisor' },

  // Upper Right Primary / Deciduous (55 -> 51)
  '55': { fdi: '55', universal: 'A', palmer: 'E┘', arch: 'upper', quadrant: 'upper-right', dentition: 'deciduous', name: 'Primary Upper Right 2nd Molar' },
  '54': { fdi: '54', universal: 'B', palmer: 'D┘', arch: 'upper', quadrant: 'upper-right', dentition: 'deciduous', name: 'Primary Upper Right 1st Molar' },
  '53': { fdi: '53', universal: 'C', palmer: 'C┘', arch: 'upper', quadrant: 'upper-right', dentition: 'deciduous', name: 'Primary Upper Right Canine' },
  '52': { fdi: '52', universal: 'D', palmer: 'B┘', arch: 'upper', quadrant: 'upper-right', dentition: 'deciduous', name: 'Primary Upper Right Lateral Incisor' },
  '51': { fdi: '51', universal: 'E', palmer: 'A┘', arch: 'upper', quadrant: 'upper-right', dentition: 'deciduous', name: 'Primary Upper Right Central Incisor' },

  // Upper Left Primary / Deciduous (61 -> 65)
  '61': { fdi: '61', universal: 'F', palmer: 'A└', arch: 'upper', quadrant: 'upper-left', dentition: 'deciduous', name: 'Primary Upper Left Central Incisor' },
  '62': { fdi: '62', universal: 'G', palmer: 'B└', arch: 'upper', quadrant: 'upper-left', dentition: 'deciduous', name: 'Primary Upper Left Lateral Incisor' },
  '63': { fdi: '63', universal: 'H', palmer: 'C└', arch: 'upper', quadrant: 'upper-left', dentition: 'deciduous', name: 'Primary Upper Left Canine' },
  '64': { fdi: '64', universal: 'I', palmer: 'D└', arch: 'upper', quadrant: 'upper-left', dentition: 'deciduous', name: 'Primary Upper Left 1st Molar' },
  '65': { fdi: '65', universal: 'J', palmer: 'E└', arch: 'upper', quadrant: 'upper-left', dentition: 'deciduous', name: 'Primary Upper Left 2nd Molar' },

  // Lower Left Primary / Deciduous (71 -> 75)
  '71': { fdi: '71', universal: 'O', palmer: 'A┌', arch: 'lower', quadrant: 'lower-left', dentition: 'deciduous', name: 'Primary Lower Left Central Incisor' },
  '72': { fdi: '72', universal: 'N', palmer: 'B┌', arch: 'lower', quadrant: 'lower-left', dentition: 'deciduous', name: 'Primary Lower Left Lateral Incisor' },
  '73': { fdi: '73', universal: 'M', palmer: 'C┌', arch: 'lower', quadrant: 'lower-left', dentition: 'deciduous', name: 'Primary Lower Left Canine' },
  '74': { fdi: '74', universal: 'L', palmer: 'D┌', arch: 'lower', quadrant: 'lower-left', dentition: 'deciduous', name: 'Primary Lower Left 1st Molar' },
  '75': { fdi: '75', universal: 'K', palmer: 'E┌', arch: 'lower', quadrant: 'lower-left', dentition: 'deciduous', name: 'Primary Lower Left 2nd Molar' },

  // Lower Right Primary / Deciduous (85 -> 81)
  '85': { fdi: '85', universal: 'T', palmer: 'E┐', arch: 'lower', quadrant: 'lower-right', dentition: 'deciduous', name: 'Primary Lower Right 2nd Molar' },
  '84': { fdi: '84', universal: 'S', palmer: 'D┐', arch: 'lower', quadrant: 'lower-right', dentition: 'deciduous', name: 'Primary Lower Right 1st Molar' },
  '83': { fdi: '83', universal: 'R', palmer: 'C┐', arch: 'lower', quadrant: 'lower-right', dentition: 'deciduous', name: 'Primary Lower Right Canine' },
  '82': { fdi: '82', universal: 'Q', palmer: 'B┐', arch: 'lower', quadrant: 'lower-right', dentition: 'deciduous', name: 'Primary Lower Right Lateral Incisor' },
  '81': { fdi: '81', universal: 'P', palmer: 'A┐', arch: 'lower', quadrant: 'lower-right', dentition: 'deciduous', name: 'Primary Lower Right Central Incisor' }
};

export function getToothNotationLabel(fdiNumber: string, notation: ToothNotationSystem = 'FDI'): string {
  const item = TOOTH_NOTATION_MAP[fdiNumber];
  if (!item) return fdiNumber;
  switch (notation) {
    case 'Universal':
      return item.universal;
    case 'Palmer':
      return item.palmer;
    case 'FDI':
    default:
      return item.fdi;
  }
}

export function getToothTitleWithNotation(fdiNumber: string, notation: ToothNotationSystem = 'FDI'): string {
  const item = TOOTH_NOTATION_MAP[fdiNumber];
  if (!item) return `Tooth ${fdiNumber}`;
  const label = getToothNotationLabel(fdiNumber, notation);
  if (notation === 'FDI') {
    return `Tooth ${label} • ${item.name}`;
  }
  return `Tooth ${label} (FDI ${item.fdi}) • ${item.name}`;
}
