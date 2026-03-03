export const INSTRUMENTS = [
  { label: 'Violino', family: 'Cordas' },
  { label: 'Viola', family: 'Cordas' },
  { label: 'Violoncelo', family: 'Cordas' },

  { label: 'Barítono (Pisto)', family: 'Metais' },
  { label: 'Cornet', family: 'Metais' },
  { label: 'Eufônio', family: 'Metais' },
  { label: 'Flugelhorn', family: 'Metais' },
  { label: 'Trombone', family: 'Metais' },
  { label: 'Trombonito', family: 'Metais' },
  { label: 'Trompa', family: 'Metais' },
  { label: 'Trompete', family: 'Metais' },
  { label: 'Tuba', family: 'Metais' },

  { label: 'Clarinete', family: 'Madeiras' },
  { label: 'Clarinete Alto', family: 'Madeiras' },
  { label: 'Clarinete Baixo (Clarone)', family: 'Madeiras' },
  { label: 'Flauta', family: 'Madeiras' },
  { label: 'Corne Inglês', family: 'Madeiras' },
  { label: 'Fagote', family: 'Madeiras' },
  { label: 'Oboé', family: 'Madeiras' },
  { label: "Oboé D'Amore", family: 'Madeiras' },
  { label: 'Saxofone Soprano (Reto)', family: 'Madeiras' },
  { label: 'Saxofone Alto', family: 'Madeiras' },
  { label: 'Saxofone Tenor', family: 'Madeiras' },
  { label: 'Saxofone Barítono', family: 'Madeiras' }
];

export const GRADUATIONS = [
  'Aluno',
  'Toca nos Ensaios',
  'Toca nas RJM',
  'Toca nos Cultos Oficiais',
  'Oficializado'
];

export const CONGREGATIONS = [
  'Jardim São Gabriel - Vargem Grande do Sul',
  'Jardim Santa Marta - Vargem Grande do Sul',
  'Jardim Santa Terezinha - Vargem Grande do Sul',
  'Córrego Raso - Vargem Grande do Sul',
  'Outra'
];

export const TEACHER_ROLES = [
  'Instrutor',
  'Encarregado Local',
  'Encarregado Regional'
];

export const VOICES = ['Soprano', 'Contralto', 'Tenor', 'Baixo'];

export const CONTENT_GROUPS = [
  { label: 'Nenhum', value: '' },
  { label: 'Hino', value: 'hino' },
  { label: 'Coro', value: 'coro' }
];

export function getFamilyByInstrument(instrument) {
  const found = INSTRUMENTS.find((item) => item.label === instrument);
  return found?.family || '';
}

export function buildContentNumberOptions(group) {
  if (group === 'hino') {
    return Array.from({ length: 480 }, (_, i) => i + 1);
  }
  if (group === 'coro') {
    return Array.from({ length: 6 }, (_, i) => i + 1);
  }
  return [];
}
