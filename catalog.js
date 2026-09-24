(function () {
    'use strict';

    // ====================== КОНФІГУРАЦІЯ ======================
    var HOST_SERVER = 'http://lampaua.mooo.com';
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
        if (params.useCorsProxy && !url.startsWith(HOST_SERVER)) {
            url = CORS_PROXY + encodeURIComponent(url);
        }

        $.ajax({
            url: url,
            type: params.type || 'GET',
            dataType: 'json',
            timeout: params.timeout || 10000,
            headers: params.headers || {},
            success: function (res) {
                params.success(res);
            },
            error: function (jqXHR) {
                var status = jqXHR.status || 0;
                var statusText = jqXHR.statusText || 'Unknown';
                if (status !== 200 && status !== 0) {
                    console.warn('CORS error: ' + status + ' (' + statusText + ')');
                    params.error(jqXHR);
                    return;
                }
                params.success(res);
            }
        });
    }

    // ====================== АДАПТЕРИ ДЖЕРЕЛ ======================
    var ApiProviders = {
        tmdb: { /* ... той самий код ... */ },
        cub: { getCatalog: ApiProviders.tmdb.getCatalog },
        eneida: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: HOST_SERVER + '/eneida/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id || i.news_id, title: i.title, poster: i.poster || i.img, year: i.year || '', type: i.type || 'movie', url: i.url || i.link, source: 'eneida' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        vokino: { getCatalog: function (cat, page, resolve, reject) {
            var token = Lampa.Storage.get('vokino_token', '');
            safeAjax({ url: HOST_SERVER + '/vokino/list?type=' + (cat || 'movie') + '&page=' + page + '&token=' + token,
                success: function (res) {
                    var raw = res.channels || res.items || res.data || [];
                    var items = raw.map(function (i) { return { id: i.id || i.vokino_id, title: i.title || i.name, poster: i.poster || i.cover, year: i.year || '', type: i.type === 'serial' ? 'tv' : 'movie', url: i.url, source: 'vokino' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        rezka: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: HOST_SERVER + '/rezka/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id, title: i.title, poster: i.poster, year: i.year || '', type: i.type || 'movie', url: i.url, source: 'rezka' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        uaflix: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: HOST_SERVER + '/uaflix/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id, title: i.title, poster: i.poster, year: i.year || '', type: i.type === 'serial' ? 'tv' : 'movie', url: i.url, source: 'uaflix' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        uakino: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: HOST_SERVER + '/uakino/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id, title: i.title, poster: i.poster, year: i.year || '', type: i.type === 'serial' ? 'tv' : 'movie', url: i.url, source: 'uakino' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        sork: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: HOST_SERVER + '/sork/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id, title: i.title, poster: i.poster, year: i.year || '', type: i.type || 'movie', url: i.url, source: 'sork' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        tvflix: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: HOST_SERVER + '/tvflix/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id, title: i.title, poster: i.poster, year: i.year || '', type: i.type === 'serial' ? 'tv' : 'movie', url: i.url, source: 'tvflix' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        zima: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: HOST_SERVER + '/zima/catalog?cat=' + (cat || 'main') + '&page=' + page,
                success: function (res) {
                    var raw = Array.isArray(res) ? res : (res.items || []);
                    var items = raw.map(function (i) { return { id: i.id, title: i.title, poster: i.poster, year: i.year || '', type: i.type === 'serial' ? 'tv' : 'movie', url: i.url, source: 'zima' }; });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }},
        kinozal: { getCatalog: function (cat, page, resolve, reject) {
            safeAjax({ url: HOST_SERVER + '/kinozal/catalog?cat=' + (cat || 'movie') + '&page=' + page,
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
                success: function (res) {
                    var raw = res.docs || [];
                    var items = raw.map(function (i) {
                        return {
                            id: i.id,
                            title: i.name || i.title,
                            poster: i.poster ? 'https://avatars.kinopoisk.net/' + i.poster : '',
                            year: i.year || '',
                            type: i.series ? 'tv' : 'movie',
                            url: 'https://www.kinopoisk.ru/' + (i.series ? 'series/' : 'film/') + i.id + '/',
                            source: 'kinopoisk'
                        };
                    });
                    resolve({ items: items, has_more: items.length > 0 });
                }, error: reject });
        }}
    };

    // ====================== КОМПОНЕНТ КАТАЛОГУ ======================
    function PrimaryCatalog(object) {
        var comp = this;
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var html = $('<div></div>');
        var lines = [];

        this.create = function () {
            this.activity.loader(true);
            var categories = [
                { id: 'popular', title: 'Популярні фільми' },
                { id: 'now_playing', title: 'Новинки кіно' },
                { id: 'tv_series', title: 'Серіали' }
            ];
            comp.buildLines(categories);
            this.activity.loader(false);
            return this.render();
        };

        this.buildLines = function (cats) {
            cats.forEach(function (cat) {
                var line = new Lampa.Line({ title: cat.title, card_small: false });
                line.create();
                var loader = $('<div class="broadcast__scan"><div></div></div>');
                line.render().find('.items').append(loader);
                lines.push(line);
                scroll.append(line.render());
                comp.loadLinePage(cat, line, 1, loader);
            });
            html.append(scroll.render());
        };

        this.loadLinePage = function (cat, line, page, loaderOrMoreBtn) {
            var activeSource = Lampa.Storage.get('active_primary_source', 'tmdb');
            var provider = ApiProviders[activeSource] || ApiProviders.tmdb;

            provider.getCatalog(cat.id, page, function (data) {
                if (loaderOrMoreBtn) loaderOrMoreBtn.remove();
                if (!data.items || !data.items.length) {
                    if (page === 1) line.render().addClass('hide');
                    return;
                }

                data.items.forEach(function (element) {
                    var card = new Lampa.Card(element, { card_small: false });
                    card.build();
                    card.render().on('hover:enter', function () {
                        Lampa.Activity.push({
                            url: element.url,
                            component: 'full',
                            id: element.id,
                            method: element.type || 'movie',
                            card: element,
                            source: element.source || activeSource
                        });
                    });
                    line.append(card.render());
                });

                if (data.has_more) comp.appendMoreButton(cat, line, page + 1);
                Lampa.Controller.enable('content');
            }, function () {
                if (loaderOrMoreBtn) loaderOrMoreBtn.remove();
                if (page === 1) line.render().addClass('hide');
            });
        };

        this.appendMoreButton = function (cat, line, nextPage) {
            var moreBtn = $('<div class="card selector card--more">' +
                '<div class="card__view" style="display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.08); border-radius: 0.5em; aspect-ratio: 2/3;">' +
                    '<div style="text-align: center; padding: 0.5em;">' +
                        '<svg height="30" viewBox="0 0 24 24" width="30" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>' +
                        '<div style="font-size: 0.8em; margin-top: 0.4em; font-weight: bold;">Більше</div>' +
                    '</div>' +
                '</div>' +
            '</div>');
            moreBtn.on('hover:enter', function () {
                moreBtn.find('.card__view').html('<div class="broadcast__scan"><div></div></div>');
                comp.loadLinePage(cat, line, nextPage, moreBtn);
            });
            line.append(moreBtn);
        };

        this.render = function () { return html; };
        this.destroy = function () {
            lines.forEach(function (l) { if (l.destroy) l.destroy(); });
            scroll.destroy();
            html.remove();
        };
    }

    // ====================== ОНЛАЙН ПЛЕЄР ======================
    function startOnlinePlayback(cardData) {
        var source = Lampa.Storage.get('active_primary_source', 'tmdb');
        Lampa.Noty.show('Пошук потоків [' + source.toUpperCase() + ']...');

        safeAjax({
            url: HOST_SERVER + '/' + source + '/stream?id=' + cardData.id + '&url=' + encodeURIComponent(cardData.url || ''),
            useCorsProxy: true,
            success: function (res) {
                var translations = res.translations || res || [];
                if (!translations.length) return Lampa.Noty.show('Відеопотоків не знайдено');

                var selectItems = translations.map(function (t) {
                    return { title: t.name || 'Стандартний переклад', translation: t };
                });

                Lampa.Select.show({
                    title: 'Оберіть озвучку',
                    items: selectItems,
                    onSelect: function (item) {
                        var t = item.translation;
                        if (t.seasons) {
                            showSeasons(cardData, t.seasons);
                        } else {
                            Lampa.Player.play({
                                title: cardData.title,
                                subtitle: t.name,
                                url: t.stream_url || t.file,
                                headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': HOST_SERVER }
                            });
                        }
                    }
                });
            },
            error: function () {
                Lampa.Noty.show('Помилка отримання даних від сервера');
            }
        });
    }

    function showSeasons(cardData, seasons) {
        var items = seasons.map(function (s) { return { title: 'Сезон ' + s.number, season: s }; });
        Lampa.Select.show({
            title: 'Оберіть сезон',
            items: items,
            onSelect: function (item) {
                var epItems = item.season.episodes.map(function (e) {
                    return { title: 'Серія ' + e.number, ep: e };
                });
                Lampa.Select.show({
                    title: 'Оберіть серію',
                    items: epItems,
                    onSelect: function (epItem) {
                        Lampa.Player.play({
                            title: cardData.title,
                            subtitle: 'Сезон ' + item.season.number + ' / Серія ' + epItem.ep.number,
                            url: epItem.ep.stream_url || epItem.ep.file
                        });
                    }
                });
            }
        });
    }

    // ====================== РЕЄСТРАЦІЯ ======================
    function initPlugin() {
        Lampa.Component.add('primary_catalog', PrimaryCatalog);

        Lampa.Params.select('active_primary_source', SOURCES_LIST, 'tmdb');

        Lampa.Template.add('settings_primary_source_item', 
            '<div class="settings-param selector" data-type="select" data-name="active_primary_source">' +
                '<div class="settings-param__name">Основне джерело</div>' +
                '<div class="settings-param__value"></div>' +
                '<div class="settings-param__descr">Оберіть єдине джерело для пошуку та каталогу</div>' +
            '</div>'
        );

        Lampa.Listener.follow('settings', function (e) {
            if (e.name === 'parent' && e.body) {
                var other_block = e.body.find('[data-component="more"], [data-component="other"]');
                if (other_block.length) {
                    other_block.after(Lampa.Template.get('settings_primary_source_item'));
                } else if (e.target && (e.target.component === 'more' || e.target.component === 'other')) {
                    e.body.append(Lampa.Template.get('settings_primary_source_item'));
                }
            }
        });

        Lampa.Listener.follow('change', function (e) {
            if (e.name === 'active_primary_source') {
