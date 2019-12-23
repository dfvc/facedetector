export interface ILoadingMessage {
  message: string;
  loading: boolean;
}

export interface ILoadingMessages {
  models: ILoadingMessage;
  descriptors: ILoadingMessage;
  matcher: ILoadingMessage;
  video: ILoadingMessage;
  canvas: ILoadingMessage;
  pulse: ILoadingMessage;
  subtitle: ILoadingMessage;
  bulb: ILoadingMessage;
}
