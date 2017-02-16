import { TPromise } from 'vs/base/common/winjs.base';

export interface ICredentials {
	username: string;
	password: string;
}

export interface IAskpassService {
	askpass(id: string, host: string, command: string): TPromise<ICredentials>;
}