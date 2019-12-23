import merge from 'lodash/merge';
import { IPerson } from '@/interfaces/person.interface';
import {
  AnchorPosition,
  IDrawBoxOptions,
} from '@/interfaces/draw-box.interface';
import {
  SENTENCES,
  UNKNOWN_SENTENCES,
} from '@/constants/sentences.consts';

export const PERSONS = {
  daniel: {
    name: 'Daniel Coelho',
    shortName: 'Daniel',
    color: 'rgba(255, 0, 0, 1)',
    sentences: merge({}, SENTENCES),
  },
  // gabriel: {
  //   name: 'Gabriel Coelho',
  //   shortName: 'Gabriel',
  //   color: 'rgba(0, 255, 0, 1)',
  //   sentences: merge({}, SENTENCES),
  // },
  // mafalda: {
  //   name: 'Mafalda Coelho',
  //   shortName: 'Mafalda',
  //   color: 'rgba(0, 0, 255, 1)',
  //   sentences: merge({}, SENTENCES),
  // },
  // paula: {
  //   name: 'Paula Coelho',
  //   shortName: 'Paula',
  //   color: 'rgba(0, 0, 255, 1)',
  //   sentences: merge({}, SENTENCES),
  // },
  jorge: {
    name: 'Jorge Murta',
    shortName: 'Jorge',
    color: 'rgba(0, 0, 255, 1)',
    sentences: merge({}, SENTENCES),
  },
};

export const UNKNOWN_PERSON: IPerson = {
  name: '',
  shortName: 'Unknown',
  color: 'rgba(0, 0, 0, 1)',
  sentences: merge({}, UNKNOWN_SENTENCES),
};

export const PERSON_DRAW_BOX_OPTIONS: IDrawBoxOptions = {
  boxColor: 'rgba(0, 0, 0, 1)',
  drawLabelOptions: {
    anchorPosition: AnchorPosition.TOP_LEFT,
    fontSize: 10,
    padding: 2,
  },
  label: '',
  lineWidth: 1,
};
