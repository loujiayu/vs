import * as errors from 'vs/base/common/errors';
import { Promise, TPromise } from 'vs/base/common/winjs.base';

export function nfcall(fn: Function, ...args: any[]): Promise;
export function nfcall<T>(fn: Function, ...args: any[]): TPromise<T>;
export function nfcall(fn: Function, ...args: any[]): any {
	return new Promise((c, e) => fn(...args, (err, result) => err ? e(err) : c(result)));
}

/**
 * Returns a new promise that joins the provided promise. Upon completion of
 * the provided promise the provided function will always be called. This
 * method is comparable to a try-finally code block.
 * @param promise a promise
 * @param f a function that will be call in the success and error case.
 */
export function always<T>(promise: TPromise<T>, f: Function): TPromise<T> {
	return new TPromise<T>((c, e, p) => {
		promise.done((result) => {
			try {
				f(result);
			} catch (e1) {
				errors.onUnexpectedError(e1);
			}
			c(result);
		}, (err) => {
			try {
				f(err);
			} catch (e1) {
				errors.onUnexpectedError(e1);
			}
			e(err);
		}, (progress) => {
			p(progress);
		});
	}, () => {
		promise.cancel();
	});
}

export interface ITask<T> {
	(): T;
}

/**
 * A helper to prevent accumulation of sequential async tasks.
 *
 * Imagine a mail man with the sole task of delivering letters. As soon as
 * a letter submitted for delivery, he drives to the destination, delivers it
 * and returns to his base. Imagine that during the trip, N more letters were submitted.
 * When the mail man returns, he picks those N letters and delivers them all in a
 * single trip. Even though N+1 submissions occurred, only 2 deliveries were made.
 *
 * The throttler implements this via the queue() method, by providing it a task
 * factory. Following the example:
 *
 * 		var throttler = new Throttler();
 * 		var letters = [];
 *
 * 		function deliver() {
 * 			const lettersToDeliver = letters;
 * 			letters = [];
 * 			return makeTheTrip(lettersToDeliver);
 * 		}
 *
 * 		function onLetterReceived(l) {
 * 			letters.push(l);
 * 			throttler.queue(deliver);
 * 		}
 */
export class Throttler {

	private activePromise: Promise;
	private queuedPromise: Promise;
	private queuedPromiseFactory: ITask<Promise>;

	constructor() {
		this.activePromise = null;
		this.queuedPromise = null;
		this.queuedPromiseFactory = null;
	}

	queue<T>(promiseFactory: ITask<TPromise<T>>): TPromise<T> {
		if (this.activePromise) {
			this.queuedPromiseFactory = promiseFactory;

			if (!this.queuedPromise) {
				const onComplete = () => {
					this.queuedPromise = null;

					const result = this.queue(this.queuedPromiseFactory);
					this.queuedPromiseFactory = null;

					return result;
				};

				this.queuedPromise = new Promise((c, e, p) => {
					this.activePromise.then(onComplete, onComplete, p).done(c);
				}, () => {
					this.activePromise.cancel();
				});
			}

			return new Promise((c, e, p) => {
				this.queuedPromise.then(c, e, p);
			}, () => {
				// no-op
			});
		}

		this.activePromise = promiseFactory();

		return new Promise((c, e, p) => {
			this.activePromise.done((result: any) => {
				this.activePromise = null;
				c(result);
			}, (err: any) => {
				this.activePromise = null;
				e(err);
			}, p);
		}, () => {
			this.activePromise.cancel();
		});
	}
}
