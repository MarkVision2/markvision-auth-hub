declare namespace Deno {
  export interface Env {
    get(name: string): string | undefined;
  }
  export const env: Env;
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare interface Request {
  json(): Promise<any>;
}

declare interface Response {
  new (body?: any, init?: any): Response;
}
