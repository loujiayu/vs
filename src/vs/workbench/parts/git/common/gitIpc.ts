import { TPromise } from 'vs/base/common/winjs.base';
import { IChannel } from 'vs/base/parts/ipc/common/ipc';
import Event from 'vs/base/common/event';
import {
	IAskpassService, ICredentials,
} from './git';

export interface IAskpassChannel extends IChannel {
	call(command: 'askpass', args: [string, string, string]): TPromise<ICredentials>;
	call(command: string, args: any[]): TPromise<any>;
}

export class AskpassChannel implements IAskpassChannel {

	constructor(private service: IAskpassService) { }

	call(command: string, args: [string, string, string]): TPromise<any> {
		switch (command) {
			case 'askpass': return this.service.askpass(args[0], args[1], args[2]);
		}
	}
}