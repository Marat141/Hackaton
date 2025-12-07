export const SUBJECT_CONFIG = {
  // Klíč: identifikátor používaný v URL a kódu
  // Hodnota: { dir: název adresáře, filePrefix: předpona souboru }
  'english': {
    dir: 'anglicky-jazyk',
    filePrefix: 'english'
  },
  'cestina': {
    dir: 'cesky-jazyk', 
    filePrefix: 'cestina'
  },
  'dejepis': {
    dir: 'dejepis',
    filePrefix: 'dejepis'
  },
  'matematika': {
    dir: 'matematika',
    filePrefix: 'matematika'
  }
} as const;

export type SubjectId = keyof typeof SUBJECT_CONFIG;

export function getSubjectDir(subjectId: string): string {
  const config = SUBJECT_CONFIG[subjectId as SubjectId];
  return config?.dir || subjectId;
}

export function getSubjectFilePrefix(subjectId: string): string {
  const config = SUBJECT_CONFIG[subjectId as SubjectId];
  return config?.filePrefix || subjectId;
}

// Přidejte tuto funkci
export function isValidSubject(subjectId: string): subjectId is SubjectId {
  return subjectId in SUBJECT_CONFIG;
}

// Další pomocná funkce pro bezpečný přístup k konfiguraci
export function getSubjectConfig(subjectId: string) {
  return SUBJECT_CONFIG[subjectId as SubjectId];
}