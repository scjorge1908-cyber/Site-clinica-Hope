export enum Screen {
  Home = 'Home',
  SEO = 'SEO',
  CorpoClinico = 'CorpoClinico',
  Agendamento = 'Agendamento',
  Admin = 'Admin',
  Abordagens = 'Abordagens',
  Login = 'Login'
}

export type TransitionType = 'push' | 'push_back' | 'none';

export enum AgeGroup {
  Children = 'Criança',
  Teens = 'Adolescente',
  Adults = 'Adulto',
  Seniors = 'Idoso'
}

export enum Shift {
  Morning = 'Manhã',
  Afternoon = 'Tarde',
  Night = 'Noite'
}

export interface Specialist {
  id: string;
  name: string;
  crp: string;
  spec: string;
  tags: string[];
  desc: string;
  img: string;
  color?: string;
  ageGroups: AgeGroup[];
  shifts: Shift[];
  availableTimes?: { [day: string]: string[] };
  attendedAges?: number[];
  googleSheetsId?: string;
  googleSheetsTab?: string;
  googleAppsScriptUrl?: string;
  schedule?: {
    [day: string]: {
      periods: {
        [period in Shift]?: string[];
      };
    };
  };
}

export interface Approach {
  id: string;
  title: string;
  desc: string;
  details: string;
}

export interface InsurancePlan {
  id: string;
  name: string;
  logo: string;
}

export interface HomeSettings {
  clinicName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroText: string;
  logoUrl?: string;
  heroImageUrl?: string;
  insurancePlans?: InsurancePlan[];
  seoTitle?: string;
  seoText?: string;
  address?: string;
  footerRights?: string;
}
