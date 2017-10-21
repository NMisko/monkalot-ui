requirejs.config({
    baseUrl: 'scripts/lib',
    paths: {
        app: '../app'
    }
});

requirejs(['app/monkalot', 'app/monkalot_web']);
