declare module "load-script" {
  export default function loadScript(
    src: string,
    callback?: (error: Error | null, script?: HTMLScriptElement) => void
  ): void;
}
