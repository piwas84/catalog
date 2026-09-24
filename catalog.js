(function () {
    'use strict';

    // ====================== КОНФІГУРАЦІЯ ======================
    var CORS_PROXY = 'https://corsproxy.io/?';

    var SOURCES_LIST = {
        'tmdb': 'TMDB (Основне)',
        'cub': 'CUB',
        'eneida': 'Енеїда',
        'vokino': 'VoKino',
        'rezka': 'HDRezka',
        'uaflix': 'UAFlix',
        'uakino': 'UAkino',
        'sork': 'Sor\'k',
        'tvflix': 'TVFlix',
        'zima': 'Zima',
        'kinozal': 'Kinozal',
        'kinopoisk': 'Kinopoisk'
    };

    // ====================== КОРС-ПРОКСІ ======================
    function safeAjax(params) {
        var url = params.url;
        var isExternal = !url.includes('lampaua.mooo.com');
        var useProxy = params.useCorsProxy || isExternal;

        if (useProxy) {
            url = CORS_PROXY + encodeURIComponent(url);
        }

        $.ajax({
            url: url,
            type: params.type || 'GET',
            dataType: 'json',
            timeout: params.timeout || 20000,
            headers: params.headers || {},
            success: function (res) {
                params.success(res);
            },
            error: function (jqXHR) {
                var status = jqXHR.status || 0;
                var statusText = jqXHR.statusText || 'Unknown';
                console.warn('CORS / Ajax error: ' + status + ' (' + statusText + ') — ' + url);

                if (params.retryCount && params.retryCount < 3) {
                    params.retryCount++;
                    setTimeout(function () { safeAjax(params); }, 800);
                    return;
                }

                if (status !== 200 && status !== 0) {
                    params.error(jqXHR);
                    return;
                }
                params.success(res);
            }
        });
    }

    // ====================== АДАПТЕРИ ДЖЕРЕЛ ======================
    var ApiProviders = {
        tmdb: {
            getCatalog: function (cat, page, resolve, reject) {
                var key = Lampa.TMDB.key ? Lampa.TMDB.key() : '';
                var url = 'https://api.themoviedb.org/3/movie/' + (cat || 'popular') + '?api_key=' + key + '&language=uk-UA&page=' + page;
                safeAjax({ url: url, useCorsProxy: true, success: function (res) {
                    var items = (res.results || []).map(function (i) {
                        return { id: i.id, title: i.title || i.name, poster: i.poster_path ? 'https://image.tmdb.org/t/p/w500' + i.poster_path : '', year: (i.release_date || i.first_air_date || '').substring(0, 4), type: i.media_type || 'movie', source: 'tmdb' };
                    });
                    resolve({ items: items, has_more: page < res.total_pages });
                }, error: reject });
            }
        },
        cub: { getCatalog: ApiProviders.tmdb.getCatalog },
        eneida: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: 'http://lampaua.mooo.com/eneida/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id || i.news_id, title: i.title, poster: i.poster || i.img, year: i.year || '', type: i.type || 'movie', url: i.url || i.link, source: 'eneida' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        vokino: { getCatalog: function (cat, page, resolve, reject) {
            var token = Lampa.Storage.get('vokino_token', '');
            safeAjax({ url: 'http://lampaua.mooo.com/vokino/list?type=' + (cat || 'movie') + '&page=' + page + '&token=' + token,
                success: function (res) {
                    var raw = res.channels || res.items || res.data || [];
                    var items = raw.map(function (i) { return { id: i.id || i.vokino_id, title: i.title || i.name, poster: i.poster || i.cover, year: i.year || '', type: i.type === 'serial' ? 'tv' : 'movie', url: i.url, source: 'vokino' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        rezka: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: 'http://lampaua.mooo.com/rezka/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id, title: i.title, poster: i.poster, year: i.year || '', type: i.type || 'movie', url: i.url, source: 'rezka' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        uaflix: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: 'http://lampaua.mooo.com/uaflix/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id, title: i.title, poster: i.poster, year: i.year || '', type: i.type === 'serial' ? 'tv' : 'movie', url: i.url, source: 'uaflix' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        uakino: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: 'http://lampaua.mooo.com/uakino/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id, title: i.title, poster: i.poster, year: i.year || '', type: i.type === 'serial' ? 'tv' : 'movie', url: i.url, source: 'uakino' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        sork: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: 'http://lampaua.mooo.com/sork/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id, title: i.title, poster: i.poster, year: i.year || '', type: i.type || 'movie', url: i.url, source: 'sork' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        tvflix: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: 'http://lampaua.mooo.com/tvflix/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id, title: i.title, poster: i.poster, year: i.year || '', type: i.type === 'serial' ? 'tv' : 'movie', url: i.url, source: 'tvflix' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        zima: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: 'http://lampaua.mooo.com/zima/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id, title: i.title, poster: i.poster, year: i.year || '', type: i.type === 'serial' ? 'tv' : 'movie', url: i.url, source: 'zima' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        kinozal: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: 'http://lampaua.mooo.com/kinozal/catalog?cat=' + (cat || 'movie') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id, title: i.title, poster: i.poster, year: i.year || '', type: i.type || (cat === 'tv' ? 'tv' : 'movie'), url: i.url, source: 'kinozal' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        kinopoisk: { getCatalog: function (cat, page, resolve, reject) {
            var url = 'https://api.kinopoisk.dev/v1.3/movie?limit=20&sort=popularity&language=uk-UA&page=' + page;
            if (cat === 'tv_series') url = 'https://api.kinopoisk.dev/v1.3/series?limit=20&sort=popularity&language=uk-UA&page=' + page;
            safeAjax({
                url: url,
                useCorsProxy:
