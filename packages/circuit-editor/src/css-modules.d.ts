// The bundler turns CSS modules into an object of class names. Tsc needs telling.
declare module '*.module.css' {
    const classes: Record<string, string>;
    export default classes;
}
