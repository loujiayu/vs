import { IDisposable, toDisposable } from 'vs/base/common/lifecycle';
import { Promise, TPromise } from 'vs/base/common/winjs.base';
import Event, { Emitter, once, filterEvent } from 'vs/base/common/event';

enum MessageType {
	RequestCommon,
	RequestCancel,
	ResponseInitialize,
	ResponseSuccess,
	ResponseProgress,
	ResponseError,
	ResponseErrorObj
}

function isResponse(messageType: MessageType): boolean {
	return messageType >= MessageType.ResponseInitialize;
}

interface IRawMessage {
	id: number;
	type: MessageType;
}

interface IRawRequest extends IRawMessage {
	channelName?: string;
	name?: string;
	arg?: any;
}

interface IRequest {
	raw: IRawRequest;
	emitter?: Emitter<any>;
	flush?: () => void;
}

enum State {
	Uninitialized,
	Idle
}

interface IRawResponse extends IRawMessage {
	data: any;
}

interface IHandler {
	(response: IRawResponse): void;
}

export interface IMessagePassingProtocol {
	send(request: any): void;
	onMessage: Event<any>;
}

export interface IChannel {
	call(command: string, arg?: any): TPromise<any>;
}

export interface IChannelServer {
	registerChannel(channelName: string, channel: IChannel): void;
}

export interface IClientRouter {
	route(command: string, arg: any): string;
}

export interface IChannelClient {
	getChannel<T extends IChannel>(channelName: string): T;
}

export interface IRoutingChannelClient {
	getChannel<T extends IChannel>(channelName: string, router: IClientRouter): T;
}

export class ChannelClient implements IChannelClient, IDisposable {
	private state: State;
	private activeRequests: Promise[];
	private bufferedRequests: IRequest[];
	private handlers: { [id: number]: IHandler; };
	private lastRequestId: number;
	private protocolListener: IDisposable;

	constructor(private protocol: IMessagePassingProtocol) {
		this.state = State.Uninitialized;
		this.activeRequests = [];
		this.bufferedRequests = [];
		this.handlers = Object.create(null);
		this.lastRequestId = 0;
		this.protocolListener = this.protocol.onMessage(r => this.onMessage(r));
	}

	getChannel<T extends IChannel>(channelName: string): T {
		const call = (command, arg) => this.request(channelName, command, arg);
		return { call } as T;
	}
	private request(channelName: string, name: string, arg: any): Promise {
		const request = {
			raw: {
				id: this.lastRequestId++,
				type: MessageType.RequestCommon,
				channelName,
				name,
				arg
			}
		};

		const activeRequest = this.state === State.Uninitialized
			? this.bufferRequest(request)
			: this.doRequest(request);

		this.activeRequests.push(activeRequest);

		activeRequest
			.then(null, _ => null)
			.done(() => this.activeRequests = this.activeRequests.filter(i => i !== activeRequest));

		return activeRequest;
	}

	private doRequest(request: IRequest): Promise {
		const id = request.raw.id;

		return new Promise((c, e, p) => {
			this.handlers[id] = response => {
				switch (response.type) {
					case MessageType.ResponseSuccess:
						delete this.handlers[id];
						c(response.data);
						break;

					case MessageType.ResponseError:
						delete this.handlers[id];
						const error = new Error(response.data.message);
						(<any>error).stack = response.data.stack;
						error.name = response.data.name;
						e(error);
						break;

					case MessageType.ResponseErrorObj:
						delete this.handlers[id];
						e(response.data);
						break;

					case MessageType.ResponseProgress:
						p(response.data);
						break;
				}
			};

			this.send(request.raw);
		},
			() => this.send({ id, type: MessageType.RequestCancel }));
	}

	private bufferRequest(request: IRequest): Promise {
		let flushedRequest: Promise = null;

		return new Promise((c, e, p) => {
			this.bufferedRequests.push(request);

			request.flush = () => {
				request.flush = null;
				flushedRequest = this.doRequest(request).then(c, e, p);
			};
		}, () => {
			request.flush = null;

			if (this.state !== State.Uninitialized) {
				if (flushedRequest) {
					flushedRequest.cancel();
					flushedRequest = null;
				}

				return;
			}

			const idx = this.bufferedRequests.indexOf(request);

			if (idx === -1) {
				return;
			}

			this.bufferedRequests.splice(idx, 1);
		});
	}

	private onMessage(response: IRawResponse): void {
		if (!isResponse(response.type)) {
			return;
		}

		if (this.state === State.Uninitialized && response.type === MessageType.ResponseInitialize) {
			this.state = State.Idle;
			this.bufferedRequests.forEach(r => r.flush && r.flush());
			this.bufferedRequests = null;
			return;
		}

		const handler = this.handlers[response.id];
		if (handler) {
			handler(response);
		}
	}

	private send(raw: IRawRequest) {
		try {
			this.protocol.send(raw);
		} catch (err) {
			// noop
		}
	}

	dispose(): void {
		this.protocolListener.dispose();
		this.protocolListener = null;

		this.activeRequests.forEach(r => r.cancel());
		this.activeRequests = [];
	}
}

export interface ClientConnectionEvent {
	protocol: IMessagePassingProtocol;
	onDidClientDisconnect: Event<void>;
}

export class IPCClient implements IChannelClient, IChannelServer, IDisposable {

	private channelClient: ChannelClient;
	private channelServer: ChannelServer;

	constructor(protocol: IMessagePassingProtocol, id: string) {
		protocol.send(id);
		this.channelClient = new ChannelClient(protocol);
		this.channelServer = new ChannelServer(protocol);
	}

	getChannel<T extends IChannel>(channelName: string): T {
		return this.channelClient.getChannel(channelName) as T;
	}

	registerChannel(channelName: string, channel: IChannel): void {
		this.channelServer.registerChannel(channelName, channel);
	}

	dispose(): void {
		this.channelClient.dispose();
		this.channelClient = null;
		this.channelServer.dispose();
		this.channelServer = null;
	}
}

export class ChannelServer implements IChannelServer, IDisposable {

	private channels: { [name: string]: IChannel } = Object.create(null);
	private activeRequests: { [id: number]: IDisposable; } = Object.create(null);
	private protocolListener: IDisposable;

	constructor(private protocol: IMessagePassingProtocol) {
		this.protocolListener = this.protocol.onMessage(r => this.onMessage(r));
		this.protocol.send(<IRawResponse>{ type: MessageType.ResponseInitialize });
	}

	registerChannel(channelName: string, channel: IChannel): void {
		this.channels[channelName] = channel;
	}

	private onMessage(request: IRawRequest): void {
		switch (request.type) {
			case MessageType.RequestCommon:
				this.onCommonRequest(request);
				break;

			case MessageType.RequestCancel:
				this.onCancelRequest(request);
				break;
		}
	}

	private onCommonRequest(request: IRawRequest): void {
		const channel = this.channels[request.channelName];
		let promise: Promise;

		try {
			promise = channel.call(request.name, request.arg);
		} catch (err) {
			promise = Promise.wrapError(err);
		}

		const id = request.id;

		const requestPromise = promise.then(data => {
			this.protocol.send(<IRawResponse>{ id, data, type: MessageType.ResponseSuccess });
			delete this.activeRequests[request.id];
		}, data => {
			if (data instanceof Error) {
				this.protocol.send(<IRawResponse>{
					id, data: {
						message: data.message,
						name: data.name,
						stack: data.stack ? data.stack.split('\n') : void 0
					}, type: MessageType.ResponseError
				});
			} else {
				this.protocol.send(<IRawResponse>{ id, data, type: MessageType.ResponseErrorObj });
			}

			delete this.activeRequests[request.id];
		}, data => {
			this.protocol.send(<IRawResponse>{ id, data, type: MessageType.ResponseProgress });
		});

		this.activeRequests[request.id] = toDisposable(() => requestPromise.cancel());
	}

	private onCancelRequest(request: IRawRequest): void {
		const disposable = this.activeRequests[request.id];

		if (disposable) {
			disposable.dispose();
			delete this.activeRequests[request.id];
		}
	}

	public dispose(): void {
		this.protocolListener.dispose();
		this.protocolListener = null;

		Object.keys(this.activeRequests).forEach(id => {
			this.activeRequests[<any>id].dispose();
		});

		this.activeRequests = null;
	}
}

export class IPCServer implements IChannelServer, IRoutingChannelClient, IDisposable {
	private channels: { [name: string]: IChannel } = Object.create(null);
	private channelClients: { [id: string]: ChannelClient; } = Object.create(null);
	private onClientAdded = new Emitter<string>();

	constructor(onDidClientConnect: Event<ClientConnectionEvent>) {
		onDidClientConnect(({ protocol, onDidClientDisconnect }) => {
			const onFirstMessage = once(protocol.onMessage);

			onFirstMessage(id => {
				const channelServer = new ChannelServer(protocol);
				const channelClient = new ChannelClient(protocol);

				Object.keys(this.channels)
					.forEach(name => channelServer.registerChannel(name, this.channels[name]));

				this.channelClients[id] = channelClient;
				this.onClientAdded.fire(id);

				onDidClientDisconnect(() => {
					channelServer.dispose();
					channelClient.dispose();
					delete this.channelClients[id];
				});
			});
		});
	}
	
	getChannel<T extends IChannel>(channelName: string, router: IClientRouter): T {
		const call = (command: string, arg: any) => {
			const id = router.route(command, arg);

			if (!id) {
				return TPromise.wrapError('Client id should be provided');
			}

			return this.getClient(id).then(client => client.getChannel(channelName).call(command, arg));
		};

		return { call } as T;
	}

	registerChannel(channelName: string, channel: IChannel): void {
		this.channels[channelName] = channel;
	}

	private getClient(clientId: string): TPromise<IChannelClient> {
		const client = this.channelClients[clientId];

		if (client) {
			return TPromise.as(client);
		}

		return new TPromise<IChannelClient>(c => {
			const onClient = once(filterEvent(this.onClientAdded.event, id => id === clientId));
			onClient(() => c(this.channelClients[clientId]));
		});
	}

	dispose(): void {
		this.channels = null;
		this.channelClients = null;
		this.onClientAdded.dispose();
	}
}
