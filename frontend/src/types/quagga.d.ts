declare module 'quagga' {
  interface QuaggaConfig {
    inputStream: {
      name: string;
      type: string;
      target: HTMLElement;
      constraints?: {
        width: number;
        height: number;
        facingMode: string;
      };
    };
    decoder: {
      readers: string[];
    };
    locator?: {
      patchSize: string;
      halfSample: boolean;
    };
    numOfWorkers?: number;
    frequency?: number;
    debug?: any;
  }

  interface QuaggaResult {
    codeResult: {
      code: string;
      format: string;
    };
  }

  const Quagga: {
    init(config: QuaggaConfig, callback: (err: any) => void): void;
    start(): void;
    stop(): void;
    onDetected(callback: (result: QuaggaResult) => void): void;
    offDetected(): void;
  };

  export default Quagga;
}
