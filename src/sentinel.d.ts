export default sentinel;
declare namespace sentinel {
    function on(cssSelectors: string | string[], callback: (arg0: HTMLElement) => void): void;
    function off(cssSelectors: string | string[], callback?: (arg0: HTMLElement) => void): void;
    function reset(): void;
}
