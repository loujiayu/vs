/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as platform from 'vs/base/common/platform';
import { assign } from 'vs/base/common/objects';
import { TPromise } from 'vs/base/common/winjs.base';
import { mkdirp } from 'vs/base/node/pfs';
import { ServicesAccessor, IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection';
import { InstantiationService } from 'vs/platform/instantiation/common/instantiationService';
import { IEnvironmentService, ParsedArgs } from 'vs/platform/environment/common/environment';
import { parseMainProcessArgv } from 'vs/platform/environment/node/argv';

function getShellEnvironment(): TPromise<platform.IProcessEnvironment> {
  return TPromise.as({});
}

function createPaths(environmentService: IEnvironmentService): TPromise<any> {
	const paths = [
		environmentService.appSettingsHome,
		environmentService.userProductHome,
		environmentService.extensionsPath,
		environmentService.nodeCachedDataDir
	];
	return TPromise.join(paths.map(p => mkdirp(p))) as TPromise<any>;
}

// function setupIPC(accessor: ServicesAccessor): TPromise<Server> {
// 	const logService = accessor.get(ILogService);
// 	const environmentService = accessor.get(IEnvironmentService);

// 	function allowSetForegroundWindow(service: LaunchChannelClient): TPromise<void> {
// 		let promise = TPromise.as(null);
// 		if (platform.isWindows) {
// 			promise = service.getMainProcessId()
// 				.then(processId => {
// 					logService.log('Sending some foreground love to the running instance:', processId);

// 					try {
// 						const { allowSetForegroundWindow } = <any>require.__$__nodeRequire('windows-foreground-love');
// 						allowSetForegroundWindow(processId);
// 					} catch (e) {
// 						// noop
// 					}
// 				});
// 		}

// 		return promise;
// 	}

// 	function setup(retry: boolean): TPromise<Server> {
// 		return serve(environmentService.mainIPCHandle).then(server => {
// 			if (platform.isMacintosh) {
// 				app.dock.show(); // dock might be hidden at this case due to a retry
// 			}

// 			return server;
// 		}, err => {
// 			if (err.code !== 'EADDRINUSE') {
// 				return TPromise.wrapError(err);
// 			}

// 			// Since we are the second instance, we do not want to show the dock
// 			if (platform.isMacintosh) {
// 				app.dock.hide();
// 			}

// 			// there's a running instance, let's connect to it
// 			return connect(environmentService.mainIPCHandle, 'main').then(
// 				client => {

// 					// Tests from CLI require to be the only instance currently (TODO@Ben support multiple instances and output)
// 					if (environmentService.extensionTestsPath && !environmentService.debugExtensionHost.break) {
// 						const msg = 'Running extension tests from the command line is currently only supported if no other instance of Code is running.';
// 						console.error(msg);
// 						client.dispose();
// 						return TPromise.wrapError(msg);
// 					}

// 					logService.log('Sending env to running instance...');

// 					const channel = client.getChannel<ILaunchChannel>('launch');
// 					const service = new LaunchChannelClient(channel);

// 					return allowSetForegroundWindow(service)
// 						.then(() => service.start(environmentService.args, process.env))
// 						.then(() => client.dispose())
// 						.then(() => TPromise.wrapError('Sent env to running instance. Terminating...'));
// 				},
// 				err => {
// 					if (!retry || platform.isWindows || err.code !== 'ECONNREFUSED') {
// 						return TPromise.wrapError(err);
// 					}

// 					// it happens on Linux and OS X that the pipe is left behind
// 					// let's delete it, since we can't connect to it
// 					// and the retry the whole thing
// 					try {
// 						fs.unlinkSync(environmentService.mainIPCHandle);
// 					} catch (e) {
// 						logService.log('Fatal error deleting obsolete instance handle', e);
// 						return TPromise.wrapError(e);
// 					}

// 					return setup(false);
// 				}
// 			);
// 		});
// 	}

// 	return setup(true);
// }

function createServices(args: ParsedArgs): IInstantiationService {
  const services = new ServiceCollection();
  return new InstantiationService(services, true);
}

function start(): void {
  let args: ParsedArgs;

  try {
		args = parseMainProcessArgv(process.argv);
	} catch (err) {
		console.error(err.message);
		process.exit(1);
		return;
	}

  const instantiationService = createServices(args);

  return new TPromise(() => {}).done(null);
  // return getShellEnvironment().then(shellEnv => {
  //   assign(process.env, shellEnv);
  //   return instantiationService.invokeFunction(a => createPaths(a.get(IEnvironmentService)))
  //     .then(() => instantiationService.invokeFunction(setupIPC))
  //     .then(mainIpcServer => instantiationService.invokeFunction(main, mainIpcServer, env));
  // }).done(null, err => instantiationService.invokeFunction(quit, err));
}

start()
