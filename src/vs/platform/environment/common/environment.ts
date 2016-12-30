export interface ParsedArgs {
	[arg: string]: any;
	_: string[];
	help?: boolean;
	version?: boolean;
	wait?: boolean;
	diff?: boolean;
	goto?: boolean;
	'new-window'?: boolean;
	'reuse-window'?: boolean;
	locale?: string;
	'user-data-dir'?: string;
	performance?: boolean;
	verbose?: boolean;
	logExtensionHostCommunication?: boolean;
	'disable-extensions'?: boolean;
	'extensions-dir'?: string;
	extensionDevelopmentPath?: string;
	extensionTestsPath?: string;
	debugBrkPluginHost?: string;
	debugPluginHost?: string;
	'list-extensions'?: boolean;
	'show-versions'?: boolean;
	'install-extension'?: string | string[];
	'uninstall-extension'?: string | string[];
	'open-url'?: string | string[];
}
