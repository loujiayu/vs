import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import CallbackList from 'vs/base/common/callbackList';

interface Event<T> {
	(listener: (e: T) => any, thisArgs?: any, disposables?: IDisposable[]): IDisposable;
}

namespace Event {
	const _disposable = { dispose() { } };
	export const None: Event<any> = function () { return _disposable; };
}

export default Event;

export interface EmitterOptions {
	onFirstListenerAdd?: Function;
	onFirstListenerDidAdd?: Function;
	onLastListenerRemove?: Function;
}

/**
 * The Emitter can be used to expose an Event to the public
 * to fire it from the insides.
 * Sample:
	class Document {

		private _onDidChange = new Emitter<(value:string)=>any>();

		public onDidChange = this._onDidChange.event;

		// getter-style
		// get onDidChange(): Event<(value:string)=>any> {
		// 	return this._onDidChange.event;
		// }

		private _doIt() {
			//...
			this._onDidChange.fire(value);
		}
	}
 */
export class Emitter<T> {

	private static _noop = function () { };

	private _event: Event<T>;
	private _callbacks: CallbackList;
	private _disposed: boolean;

	constructor(private _options?: EmitterOptions) {

	}

	/**
	 * For the public to allow to subscribe
	 * to events from this Emitter
	 */
	get event(): Event<T> {
		if (!this._event) {
			this._event = (listener: (e: T) => any, thisArgs?: any, disposables?: IDisposable[]) => {
				if (!this._callbacks) {
					this._callbacks = new CallbackList();
				}

				const firstListener = this._callbacks.isEmpty();

				if (firstListener && this._options && this._options.onFirstListenerAdd) {
					this._options.onFirstListenerAdd(this);
				}

				this._callbacks.add(listener, thisArgs);

				if (firstListener && this._options && this._options.onFirstListenerDidAdd) {
					this._options.onFirstListenerDidAdd(this);
				}

				let result: IDisposable;
				result = {
					dispose: () => {
						result.dispose = Emitter._noop;
						if (!this._disposed) {
							this._callbacks.remove(listener, thisArgs);
							if (this._options && this._options.onLastListenerRemove && this._callbacks.isEmpty()) {
								this._options.onLastListenerRemove(this);
							}
						}
					}
				};
				if (Array.isArray(disposables)) {
					disposables.push(result);
				}

				return result;
			};
		}
		return this._event;
	}

	/**
	 * To be kept private to fire an event to
	 * subscribers
	 */
	fire(event?: T): any {
		if (this._callbacks) {
			this._callbacks.invoke.call(this._callbacks, event);
		}
	}

	dispose() {
		if (this._callbacks) {
			this._callbacks.dispose();
			this._callbacks = undefined;
			this._disposed = true;
		}
	}
}

export function once<T>(event: Event<T>): Event<T> {
	return (listener, thisArgs = null, disposables?) => {
		const result = event(e => {
			result.dispose();
			return listener.call(thisArgs, e);
		}, null, disposables);

		return result;
	};
}

export function filterEvent<T>(event: Event<T>, filter: (e: T) => boolean): Event<T> {
	return (listener, thisArgs = null, disposables?) => event(e => filter(e) && listener.call(thisArgs, e), null, disposables);
}

export function mapEvent<I, O>(event: Event<I>, map: (i: I) => O): Event<O> {
	return (listener, thisArgs = null, disposables?) => event(i => listener.call(thisArgs, map(i)), null, disposables);
}