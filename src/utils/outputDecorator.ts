// ANSI color codes
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

export type OutputMode = 'normal' | 'error';

export function outputDecorator(output: string, mode: OutputMode = 'normal'): string {
  if (mode === 'error') {
    return `${RED}${output}${RESET}`;
  }
  return output;
}
