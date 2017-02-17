export enum ReadyState {

	/**
	 * This window has not loaded any HTML yet
	 */
	NONE,

	/**
	 * This window is loading HTML
	 */
	LOADING,

	/**
	 * This window is navigating to another HTML
	 */
	NAVIGATING,

	/**
	 * This window is done loading HTML
	 */
	READY
}

export interface IVSCodeWindow {
	id: number;
	readyState: ReadyState;
	win: Electron.BrowserWindow;

	send(channel: string, ...args: any[]): void;
}