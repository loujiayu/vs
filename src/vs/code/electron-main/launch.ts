/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { IChannel } from 'vs/base/parts/ipc/common/ipc';
import { ILogService } from 'vs/code/electron-main/log';
import { IProcessEnvironment } from 'vs/base/common/platform';
import { ParsedArgs } from 'vs/platform/environment/common/environment';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { once } from 'vs/base/common/event';

export const ID = 'launchService';
export const ILaunchService = createDecorator<ILaunchService>(ID);

export interface IStartArguments {
	args: ParsedArgs;
	userEnv: IProcessEnvironment;
}

export interface ILaunchService {
	_serviceBrand: any;
	start(args: ParsedArgs, userEnv: IProcessEnvironment): TPromise<void>;
	getMainProcessId(): TPromise<number>;
}

export interface ILaunchChannel extends IChannel {
	call(command: 'start', arg: IStartArguments): TPromise<void>;
	call(command: 'get-main-process-id', arg: null): TPromise<any>;
	call(command: string, arg: any): TPromise<any>;
}

export class LaunchChannel implements ILaunchChannel {

	constructor(private service: ILaunchService) { }

	call(command: string, arg: any): TPromise<any> {
		switch (command) {
			case 'start':
				const { args, userEnv } = arg as IStartArguments;
				return this.service.start(args, userEnv);

			case 'get-main-process-id':
				return this.service.getMainProcessId();
		}
	}
}

export class LaunchChannelClient implements ILaunchService {

	_serviceBrand: any;

	constructor(private channel: ILaunchChannel) { }

	start(args: ParsedArgs, userEnv: IProcessEnvironment): TPromise<void> {
		return this.channel.call('start', { args, userEnv });
	}

	getMainProcessId(): TPromise<number> {
		return this.channel.call('get-main-process-id', null);
	}
}
