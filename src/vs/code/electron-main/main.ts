import { TPromise } from 'vs/base/common/winjs.base';
import { ParsedArgs } from 'vs/platform/environment/common/environment';

function createServices(args: ParsedArgs): IInstantiationService {
  const services = new ServiceCollection();
  return new InstantiationService(services, true);
}

function start(): void {
  let args: ParsedArgs;
  
  return new TPromise(() => {}).done(null);
}

start()

// /Users/loujiayu/github/vscode/src/vs/platform/environment/common/environment.ts