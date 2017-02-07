import { Promise, TPromise } from 'vs/base/common/winjs.base';

export function nfcall(fn: Function, ...args: any[]): Promise;
export function nfcall<T>(fn: Function, ...args: any[]): TPromise<T>;
export function nfcall(fn: Function, ...args: any[]): any {
	return new Promise((c, e) => fn(...args, (err, result) => err ? e(err) : c(result)));
}
