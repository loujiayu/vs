import { Promise, TPromise } from 'vs/base/common/winjs.base';
import { nfcall } from 'vs/base/common/async';
import { dirname, join } from 'path';

import * as fs from 'fs';

export function mkdirp(path: string, mode?: number): TPromise<boolean> {
	const mkdir = () => nfcall(fs.mkdir, path, mode)
		.then(null, (err: NodeJS.ErrnoException) => {
			if (err.code === 'EEXIST') {
				return nfcall(fs.stat, path)
					.then((stat: fs.Stats) => stat.isDirectory
						? null
						: Promise.wrapError(new Error(`'${path}' exists and is not a directory.`)));
			}

			return TPromise.wrapError<boolean>(err);
		});

	// is root?
	if (path === dirname(path)) {
		return TPromise.as(true);
	}

	return mkdir().then(null, (err: NodeJS.ErrnoException) => {
		if (err.code === 'ENOENT') {
			return mkdirp(dirname(path), mode).then(mkdir);
		}

		return TPromise.wrapError<boolean>(err);
	});
}