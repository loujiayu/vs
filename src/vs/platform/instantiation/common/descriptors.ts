'use strict';

import { illegalArgument } from 'vs/base/common/errors';
import * as instantiation from './instantiation';

export class AbstractDescriptor<T> {

	constructor(private _staticArguments: any[]) {
		// empty
	}

	public appendStaticArguments(more: any[]): void {
		this._staticArguments.push.apply(this._staticArguments, more);
	}

	public staticArguments(): any[];
	public staticArguments(nth: number): any;
	public staticArguments(nth?: number): any[] {
		if (isNaN(nth)) {
			return this._staticArguments.slice(0);
		} else {
			return this._staticArguments[nth];
		}
	}

	_validate(type: T): void {
		if (!type) {
			throw illegalArgument('can not be falsy');
		}
	}
}


export class SyncDescriptor<T> extends AbstractDescriptor<T> {

	constructor(private _ctor: any, ...staticArguments: any[]) {
		super(staticArguments);
	}

	public get ctor(): any {
		return this._ctor;
	}

	protected bind(...moreStaticArguments): SyncDescriptor<T> {
		let allArgs = [];
		allArgs = allArgs.concat(this.staticArguments());
		allArgs = allArgs.concat(moreStaticArguments);
		return new SyncDescriptor<T>(this._ctor, ...allArgs);
	}
}