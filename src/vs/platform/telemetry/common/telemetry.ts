/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable } from 'vs/base/common/lifecycle';
import paths = require('vs/base/common/paths');
import URI from 'vs/base/common/uri';
import { ConfigurationSource, IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';

export const ITelemetryService = createDecorator<ITelemetryService>('telemetryService');

export interface ITelemetryInfo {
	sessionId: string;
	machineId: string;
	instanceId: string;
}

export interface ITelemetryExperiments {
	showNewUserWatermark: boolean;
	openUntitledFile: boolean;
	openGettingStarted?: boolean;
}

export interface ITelemetryService {

	_serviceBrand: any;

	/**
	 * Sends a telemetry event that has been privacy approved.
	 * Do not call this unless you have been given approval.
	 */
	publicLog(eventName: string, data?: any): TPromise<void>;

	getTelemetryInfo(): TPromise<ITelemetryInfo>;

	isOptedIn: boolean;

	getExperiments(): ITelemetryExperiments;
}
