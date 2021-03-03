require("gulp");
const rename = require("gulp-rename");
const gulpif = require("gulp-if");
const pleeease = require("gulp-pleeease");
const sass = require("gulp-dart-sass");
const processhtml = require("gulp-processhtml");
const { parallel, src, dest, watch } = require("gulp");
// Para optimizar imágenes
const del = require("del");
const globby = require("globby");
const gulpImagemin = require("gulp-imagemin");
const gulpNewer = require("gulp-newer");


/* PROCESAR HTML, JS Y CSS */
var optionsGenerar = {
    minimize: true,
    rename: true
};
/**
 * Compila el código scss y minifica el css.
 * Luego mueve el resultado a la carpeta de producción.
 */
function generarCss() {
    return src("./src/scss/main.scss")
        .pipe(sass())
        .pipe(gulpif(optionsGenerar.minimize, pleeease()))
        .pipe(gulpif(optionsGenerar.rename, rename(
            {
                suffix: ".min",
                extname: ".css"
            }
        )))
        .pipe(dest("./proyecto/css/"));
}

/**
 * Copia las librerías de bootstrap a la carpeta de producción.
 */
function moverLibrerias() {
    return src("./node_modules/bootstrap/js/*/*").pipe(dest("./proyecto/js"));
}

var optionsProcesar = {
    overwrite: true
};
/**
 * Procesa el html y lo mueve a la carpeta de producción.
 */
function procesarHtml() {
    return src("./src/index.html")
        .pipe(processhtml())
        .pipe(dest("./proyecto", optionsProcesar));
}


/* PROCESAR IMÁGENES */
/**
 * Optimiza las imágenes y las mueve a la carpeta de producción
 */
function optimizarImagenes() {
    return src("./src/images/*")
        .pipe(gulpImagemin())
        .pipe(gulpNewer("./proyecto/images/"))
        .pipe(
            gulpImagemin(
                [
                    gulpImagemin.mozjpeg({ quality: 75, progressive: true }),
                    gulpImagemin.optipng({ optimizationLevel: 5 })
                ],
                { verbose: true })
        )
        .pipe(dest("./proyecto/images"));
}

/**
 * Borra las imágenes de la carpeta de producción que no estén en la carpeta de src
 */
function limpiarImagenesProduccion() {
    // Array con las rutas de las imágenes de src y proyecto. Devuelve una matriz.
    return Promise.all([
        globby("./src/images/*"),
        globby("./proyecto/images/*")
    ])
        .then((paths) => {
            const srcFilepaths = paths[0];
            const proyectoFilepaths = paths[1];

            // Array de archivos a eliminar
            let proyectoFilesToDelete = [];

            // Comprobar la diferencia de las ritas
            proyectoFilepaths.map((proyectoFilepath) => {
                // proyectoFilepathFiltered: Cambia proyecto por src en la ruta para compararla
                const proyectoFilepathFiltered = proyectoFilepath
                    .replace(/\/proyecto/, "/src");

                // Comprueba si proyectoFilepathFiltered está en el array de archivos src.
                // Si no lo está lo añade al array de archivos que eliminar
                if (srcFilepaths.indexOf(proyectoFilepathFiltered) === -1) {
                    proyectoFilesToDelete.push(proyectoFilepath);
                }
            });

            // Devuelve el array de archivos que eliminar
            return proyectoFilesToDelete;
        })
        .then((proyectoFilesToDelete) => {
            // Elimina los archivos
            del.sync(proyectoFilesToDelete);
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * Watch 
 */
function watching() {
    watch(["src/scss/**", "src/index.html"], parallel(generarCss, moverLibrerias, procesarHtml));
    watch(["src/images/**"], parallel(optimizarImagenes, limpiarImagenesProduccion));
}

exports.watching = watching;
exports.default = parallel(generarCss, moverLibrerias, procesarHtml, optimizarImagenes, limpiarImagenesProduccion);