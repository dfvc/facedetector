import { ISentences } from '@/interfaces/sentence.interface';

export interface IPerson {
  name: string;
  shortName: string;
  color: string;
  sentences: ISentences;
}
