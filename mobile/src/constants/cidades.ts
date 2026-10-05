export type CityGroup = {
  title: string;
  items: string[];
};

export const CITY_GROUPS_FIXED: CityGroup[] = [
  {
    title: 'Ribeirão Preto e bairros',
    items: [
      'Ribeirão - Distrito Bonfim Paulista',
      'Ribeirão - Campos Elíseos - Central',
      'Ribeirão - Ipiranga',
      'Ribeirão - Vila Tibério',
      'Ribeirão - Vila Virgínia',
      'Ribeirão - Santa Cruz do José Jacques',
      'Ribeirão - Vila Carvalho',
      'Ribeirão - Vila Albertina - Rio Maroni',
      'Ribeirão - Vila Abranches',
      'Ribeirão - Avelino Alves Palma',
      'Ribeirão - Dom Mielle',
      'Ribeirão - Jardim Bela Vista',
      'Ribeirão - Alto do Sumarezinho',
      'Ribeirão - Parque Ribeirão Preto I',
      'Ribeirão - Geraldo Correia de Carvalho',
      'Ribeirão - Parque São Sebastião',
      'Ribeirão - Jardim Alexandre Balbo II',
      'Ribeirão - Jardim Aeroporto - Hípica',
      'Ribeirão - Ribeirão Verde',
      'Ribeirão - Parque Ribeirão Preto II',
      'Ribeirão - Parque Residencial Cândido Portinari',
      'Ribeirão - Parque Avelino',
      'Ribeirão - Jardim Nova Aliança',
      'Ribeirão - Residencial Greenville',
      'Ribeirão - Parque Flamboyans',
      'Ribeirão - Assentamento Indio Galdino',
      'Ribeirão - Jardim Paiva I',
      'Ribeirão - Assentamento Mário Lago',
      'Ribeirão - Jardim Iara - Jockey Club',
      'Ribeirão - Parque dos Servidores',
      'Ribeirão - Parque das Oliveiras',
      'Ribeirão - Reserva Macauba',
      'Ribeirão - Jardim Jamil Seme Cury',
      'Ribeirão - Assentamento Santos Dias',
      'Ribeirão - Recanto das Palmeiras',
      'Ribeirão - Jardim Cristo Redentor',
      'Ribeirão - Simioni',
      'Ribeirão - Jardim Heitor Rigon',
      'Ribeirão - Distrito Bonfim Paulista - Belvedere'
    ]
  },
  {
    title: '10 cidades mais próximas',
    items: [
      'Bonfim Paulista (Distrito)',
      'Dumont',
      'Cravinhos',
      'Jardinópolis',
      'Sertãozinho',
      'Serrana',
      'Brodowski',
      'Guatapará',
      'Cruz das Posses (Distrito)',
      'Pontal'
    ]
  },
  {
    title: 'Demais cidades',
    items: [
      'Altinópolis',
      'Aramina',
      'Araraquara',
      'Barrinha',
      'Batatais',
      'Bebedouro',
      'Belo Horizonte',
      'Buritizal',
      'Cajuru',
      'Campinas',
      'Cássia dos Coqueiros',
      'Colômbia',
      'Cristais Paulista',
      'Franca',
      'Guaíra',
      'Guará',
      'Guariba',
      'Guarulhos',
      'Igarapava',
      'Ipuã',
      'Itirapuã',
      'Jaboticabal',
      'Jeriquara',
      'Juruce (Distrito)',
      'Luís Antônio',
      'Miguelópolis',
      'Monte Alto',
      'Morro Agudo',
      'Nuporanga',
      'Orlândia',
      'Patrocínio Paulista',
      'Pedregulho',
      'Pitangueiras',
      'Pradópolis',
      'Restinga',
      'Ribeirão Corrente',
      'Rifaina',
      'Sales Oliveira',
      'Santa Cruz da Esperança',
      'Santa Rosa de Viterbo',
      'Santo Antônio da Alegria',
      'São João da Boa Vista',
      'São Joaquim da Barra',
      'São José da Bela Vista',
      'São José do Rio Pardo',
      'São Paulo',
      'São Sebastião do Paraíso',
      'São Simão',
      'Serra Azul',
      'Sorocaba',
      'Taiaçu',
      'Taiúva',
      'Viradouro'
    ]
  }
];

const normalize = (v: string) =>
  (v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function filterCityGroups(search: string): CityGroup[] {
  const q = normalize(search);
  if (!q) return CITY_GROUPS_FIXED;

  return CITY_GROUPS_FIXED.map((group) => ({
    title: group.title,
    items: group.items.filter((c) => normalize(c).includes(q))
  })).filter((g) => g.items.length > 0);
}
