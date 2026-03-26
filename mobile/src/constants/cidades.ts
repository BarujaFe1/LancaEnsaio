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
      'Ribeirão - Jardim Salgado Filho II',
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
      'Jardinopolis',
      'Sertaozinho',
      'Serrana',
      'Brodowski',
      'Guatapara',
      'Cruz das Posses (Distrito)',
      'Pontal'
    ]
  },
  {
    title: 'Demais cidades',
    items: [
      'Altinopolis',
      'Aramina',
      'Araraquara',
      'Barrinha',
      'Batatais',
      'Bebedouro',
      'Belo Horizonte',
      'Buritizal',
      'Cajuru',
      'Campinas',
      'Cassia dos Coqueiros',
      'Colombia',
      'Cristais Paulista',
      'Franca',
      'Guaira',
      'Guara',
      'Guariba',
      'Guarulhos',
      'Igarapava',
      'Ipua',
      'Itirapua',
      'Jaboticabal',
      'Jeriquara',
      'Juruce (Distrito)',
      'Luis Antonio',
      'Miguelopolis',
      'Monte Alto',
      'Morro Agudo',
      'Nuporanga',
      'Orlandia',
      'Patrocinio Paulista',
      'Pedregulho',
      'Pitangueiras',
      'Pradopolis',
      'Restinga',
      'Ribeirao Corrente',
      'Rifaina',
      'Sales Oliveira',
      'Santa Cruz da Esperanca',
      'Santa Rosa de Viterbo',
      'Santo Antonio da Alegria',
      'Sao Joao da Boa Vista',
      'Sao Joaquim da Barra',
      'Sao Jose da Bela Vista',
      'Sao Jose do Rio Pardo',
      'Sao Paulo',
      'Sao Sebastiao do Paraiso',
      'Sao Simao',
      'Serra Azul',
      'Sorocaba',
      'Taiacu',
      'Taiuva',
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
