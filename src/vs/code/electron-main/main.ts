import { TPromise } from 'vs/base/common/winjs.base';

function start(): void {
  return new TPromise(() => {}).done(null);
}

start()