export interface ISentencesType {
  timeout: number,
  nextTime: number,
  items: string[],
}

export interface ISentences {
  salutations: ISentencesType,
}
