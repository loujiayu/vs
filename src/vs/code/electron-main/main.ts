/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { ServicesAccessor, IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection';
import { InstantiationService } from 'vs/platform/instantiation/common/instantiationService';
import { ParsedArgs } from 'vs/platform/environment/common/environment';
import { parseMainProcessArgv } from 'vs/platform/environment/node/argv';

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
}

start()
