export enum AnchorPosition {
  TOP_LEFT = 'TOP_LEFT',
  TOP_RIGHT = 'TOP_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT'
}

export interface IDrawTextFieldOptions {
  anchorPosition?: AnchorPosition;
  backgroundColor?: string;
  fontColor?: string;
  fontSize?: number;
  fontStyle?: string;
  padding?: number;
}

export interface IDrawBoxOptions {
  boxColor?: string;
  lineWidth?: number;
  drawLabelOptions?: IDrawTextFieldOptions;
  label?: string;
}
